# 游戏 #4: Tower Defense (塔防游戏)

## 概述

**难度**: :star::star::star:

**周次**: 第 11 周

**技术点**: UI 系统、状态机、A* 寻路、对象池优化、波次系统

## 游戏规则

1. 敌人沿固定路径进入
2. 玩家建造防御塔攻击敌人
3. 击杀敌人获得金币
4. 敌人到达终点则失去生命
5. 生存足够波次则胜利

## 项目结构

```
games/04-tower-defense/
├── src/
│   ├── main.ts
│   ├── Game.ts
│   ├── config.ts
│   │
│   ├── components/
│   │   ├── Position.ts
│   │   ├── Velocity.ts
│   │   ├── Health.ts
│   │   ├── Enemy.ts
│   │   ├── Tower.ts
│   │   ├── Projectile.ts
│   │   ├── PathFollower.ts
│   │   ├── Targetable.ts
│   │   ├── Range.ts
│   │   ├── Damage.ts
│   │   └── GoldValue.ts
│   │
│   ├── systems/
│   │   ├── PathFollowSystem.ts    # 沿路径移动
│   │   ├── TowerTargetingSystem.ts # 寻找目标
│   │   ├── ShootingSystem.ts      # 发射子弹
│   │   ├── ProjectileSystem.ts    # 子弹移动
│   │   ├── HealthSystem.ts        # 伤害/死亡
│   │   ├── WaveSystem.ts          # 波次生成
│   │   ├── GoldSystem.ts          # 金币管理
│   │   ├── GameStateSystem.ts     # 游戏状态
│   │   └── RenderSystem.ts
│   │
│   ├── ai/
│   │   └── Pathfinder.ts          # A* 寻路 (可选)
│   │
│   ├── data/
│   │   ├── towers.ts              # 塔配置
│   │   ├── enemies.ts             # 敌人配置
│   │   └── waves.ts               # 波次配置
│   │
│   └── ui/
│       ├── GameUI.ts              # 游戏主 UI
│       ├── TowerMenu.ts           # 建造菜单
│       ├── TowerInfo.ts           # 塔信息面板
│       ├── HealthBar.ts           # 血条
│       └── WaveIndicator.ts       # 波次提示
│
├── assets/
│   ├── maps/
│   │   └── level1.json
│   ├── towers/
│   │   ├── arrow_tower.png
│   │   ├── cannon_tower.png
│   │   └── ice_tower.png
│   ├── enemies/
│   │   ├── basic.png
│   │   ├── fast.png
│   │   └── tank.png
│   ├── projectiles/
│   └── ui/
│
└── index.html
```

## 核心组件

```typescript
// 敌人组件
export const Enemy = defineComponent({
  type: Types.ui8,        // 敌人类型
  speed: Types.f32,
  pathIndex: Types.ui32,  // 当前路径点索引
  pathProgress: Types.f32 // 当前路径段进度
});

// 防御塔组件
export const Tower = defineComponent({
  type: Types.ui8,
  damage: Types.f32,
  fireRate: Types.f32,    // 每秒攻击次数
  range: Types.f32,
  lastFireTime: Types.f32,
  target: Types.ui32      // 当前目标实体 ID
});

// 子弹组件
export const Projectile = defineComponent({
  damage: Types.f32,
  speed: Types.f32,
  target: Types.ui32,     // 目标实体 ID
  tower: Types.ui32       // 发射者实体 ID
});

// 可被攻击标记
export const Targetable = defineComponent({});

// 金币价值
export const GoldValue = defineComponent({
  amount: Types.ui32
});
```

## 核心系统

### WaveSystem (波次系统)

```typescript
interface WaveConfig {
  enemies: {
    type: number;
    count: number;
    delay: number;  // 生成间隔 (ms)
  }[];
  delayBeforeWave: number;  // 波次开始前延迟
}

export class WaveSystem extends System {
  private waveConfigs: WaveConfig[] = [];
  private currentWave: number = 0;
  private waveInProgress: boolean = false;
  private spawnQueue: { type: number; time: number }[] = [];

  update(dt: number): void {
    if (!this.waveInProgress) {
      // 等待玩家准备
      if (this.playerReady) {
        this.startWave(this.currentWave);
      }
      return;
    }

    // 处理生成队列
    const now = performance.now();
    while (this.spawnQueue.length > 0 && this.spawnQueue[0].time <= now) {
      const spawn = this.spawnQueue.shift()!;
      this.spawnEnemy(spawn.type);
    }

    // 检查波次结束
    if (this.spawnQueue.length === 0 && this.noEnemiesLeft()) {
      this.waveInProgress = false;
      this.currentWave++;

      if (this.currentWave >= this.waveConfigs.length) {
        this.world.emit('victory');
      } else {
        this.world.emit('waveComplete', { wave: this.currentWave });
      }
    }
  }

  private startWave(waveIndex: number): void {
    this.waveInProgress = true;
    const config = this.waveConfigs[waveIndex];
    const now = performance.now();
    let spawnTime = now + config.delayBeforeWave;

    for (const group of config.enemies) {
      for (let i = 0; i < group.count; i++) {
        this.spawnQueue.push({
          type: group.type,
          time: spawnTime
        });
        spawnTime += group.delay;
      }
    }

    this.world.emit('waveStart', { wave: waveIndex + 1 });
  }

  private spawnEnemy(type: number): void {
    const enemy = this.world.createEntity();
    const config = ENEMY_CONFIGS[type];
    const path = this.map.path;

    this.world.addComponent(enemy, Position, { x: path[0].x, y: path[0].y });
    this.world.addComponent(enemy, Velocity, { x: 0, y: 0 });
    this.world.addComponent(enemy, Health, { current: config.health, max: config.health });
    this.world.addComponent(enemy, Enemy, {
      type,
      speed: config.speed,
      pathIndex: 0,
      pathProgress: 0
    });
    this.world.addComponent(enemy, Targetable, {});
    this.world.addComponent(enemy, GoldValue, { amount: config.gold });
  }
}
```

### TowerTargetingSystem (塔目标选择)

```typescript
export class TowerTargetingSystem extends System {
  private towers = this.createQuery({
    all: [Tower, Position, Range]
  });
  private enemies = this.createQuery({
    all: [Enemy, Position, Targetable, Health]
  });

  update(dt: number): void {
    for (const tower of this.towers) {
      // 检查当前目标是否有效
      const currentTarget = Tower.target[tower];
      if (currentTarget !== INVALID_ENTITY) {
        if (!this.isValidTarget(tower, currentTarget)) {
          Tower.target[tower] = INVALID_ENTITY;
        }
      }

      // 需要新目标
      if (Tower.target[tower] === INVALID_ENTITY) {
        Tower.target[tower] = this.findTarget(tower);
      }
    }
  }

  private isValidTarget(tower: Entity, target: Entity): boolean {
    // 目标是否存在
    if (!this.world.exists(target)) return false;
    // 目标是否死亡
    if (Health.current[target] <= 0) return false;
    // 目标是否在范围内
    if (!this.inRange(tower, target)) return false;
    return true;
  }

  private findTarget(tower: Entity): Entity {
    let closest: Entity = INVALID_ENTITY;
    let closestProgress = -1;

    for (const enemy of this.enemies) {
      if (!this.inRange(tower, enemy)) continue;

      // 选择最接近终点的敌人
      const progress = Enemy.pathIndex[enemy] + Enemy.pathProgress[enemy];
      if (progress > closestProgress) {
        closestProgress = progress;
        closest = enemy;
      }
    }

    return closest;
  }

  private inRange(tower: Entity, target: Entity): boolean {
    const dx = Position.x[tower] - Position.x[target];
    const dy = Position.y[tower] - Position.y[target];
    const dist = dx * dx + dy * dy;
    const range = Range.value[tower];
    return dist <= range * range;
  }
}
```

### ShootingSystem (射击系统)

```typescript
export class ShootingSystem extends System {
  private towers = this.createQuery({
    all: [Tower, Position]
  });

  update(dt: number): void {
    const time = performance.now() / 1000;

    for (const tower of this.towers) {
      const target = Tower.target[tower];
      if (target === INVALID_ENTITY) continue;

      // 检查开火间隔
      if (time - Tower.lastFireTime[tower] < 1 / Tower.fireRate[tower]) {
        continue;
      }

      // 发射子弹
      this.fireProjectile(tower, target);
      Tower.lastFireTime[tower] = time;
    }
  }

  private fireProjectile(tower: Entity, target: Entity): void {
    const projectile = this.world.createEntity();

    this.world.addComponent(projectile, Position, {
      x: Position.x[tower],
      y: Position.y[tower]
    });

    // 计算方向
    const dx = Position.x[target] - Position.x[tower];
    const dy = Position.y[target] - Position.y[tower];
    const dist = Math.sqrt(dx * dx + dy * dy);
    const speed = 300;

    this.world.addComponent(projectile, Velocity, {
      x: (dx / dist) * speed,
      y: (dy / dist) * speed
    });

    this.world.addComponent(projectile, Projectile, {
      damage: Tower.damage[tower],
      speed,
      target,
      tower
    });

    this.world.audio.play('shoot');
  }
}
```

### PathFollowSystem (路径跟随)

```typescript
export class PathFollowSystem extends System {
  private path: Vec2[] = [];  // 路径点列表

  private enemies = this.createQuery({
    all: [Enemy, Position, Velocity]
  });

  update(dt: number): void {
    for (const enemy of this.enemies) {
      const currentIndex = Enemy.pathIndex[enemy];
      if (currentIndex >= this.path.length - 1) {
        // 到达终点
        this.world.emit('enemyReachedEnd', { enemy });
        this.world.destroyEntity(enemy);
        continue;
      }

      const current = this.path[currentIndex];
      const next = this.path[currentIndex + 1];

      // 计算方向
      const dx = next.x - Position.x[enemy];
      const dy = next.y - Position.y[enemy];
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 5) {
        // 到达当前路径点，切换到下一个
        Enemy.pathIndex[enemy]++;
      } else {
        // 朝向下一个路径点移动
        const speed = Enemy.speed[enemy];
        Velocity.x[enemy] = (dx / dist) * speed;
        Velocity.y[enemy] = (dy / dist) * speed;
      }
    }
  }
}
```

## 塔类型

| 名称 | 伤害 | 射程 | 攻速 | 特性 |
|------|------|------|------|------|
| 箭塔 | 10 | 150 | 2/s | 基础塔 |
| 炮塔 | 50 | 120 | 0.5/s | 范围伤害 |
| 冰塔 | 5 | 100 | 1/s | 减速效果 |

## UI 设计

```
┌─────────────────────────────────────────────────────┐
│ Gold: 100 │ Wave: 3/10 │ Lives: 20 │ [Pause]        │
├─────────────────────────────────────────────────────┤
│                                                     │
│                                                     │
│                   [游戏区域]                          │
│                                                     │
│                                                     │
├─────────────────────────────────────────────────────┤
│ [Arrow Tower] [Cannon Tower] [Ice Tower]            │
│     50g          100g          75g                  │
└─────────────────────────────────────────────────────┘
```

## 扩展功能

1. **塔升级**: 提升塔的属性
2. **技能**: 玩家主动技能
3. **Boss 波**: 特殊强敌
4. **成就系统**: 挑战目标
