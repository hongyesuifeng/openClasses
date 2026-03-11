# 游戏 #2: Asteroids (小行星)

## 概述

**难度**: :star::star:

**周次**: 第 7 周

**技术点**: 2D 物理系统、屏幕环绕、旋转控制、粒子效果、音效

## 游戏规则

1. 玩家控制一艘飞船
2. 小行星在屏幕上漂浮
3. 飞船可以旋转和推进
4. 发射子弹摧毁小行星
5. 被小行星撞到则失去一条命
6. 清除所有小行星进入下一关

## 项目结构

```
games/02-asteroids/
├── src/
│   ├── main.ts
│   ├── Game.ts
│   ├── config.ts
│   │
│   ├── components/
│   │   ├── Position.ts
│   │   ├── Velocity.ts
│   │   ├── Rotation.ts
│   │   ├── Ship.ts           # 飞船数据
│   │   ├── Asteroid.ts       # 小行星数据
│   │   ├── Bullet.ts         # 子弹数据
│   │   ├── Collider.ts       # 碰撞体 (圆形)
│   │   ├── Health.ts         # 生命值
│   │   ├── ScreenWrap.ts     # 屏幕环绕标记
│   │   ├── Particle.ts       # 粒子数据
│   │   └── Lifetime.ts       # 生命周期
│   │
│   ├── systems/
│   │   ├── InputSystem.ts
│   │   ├── ShipControlSystem.ts  # 飞船控制
│   │   ├── MovementSystem.ts
│   │   ├── ScreenWrapSystem.ts   # 屏幕环绕
│   │   ├── CollisionSystem.ts
│   │   ├── BulletSystem.ts       # 子弹管理
│   │   ├── ParticleSystem.ts     # 粒子系统
│   │   ├── LifetimeSystem.ts     # 生命周期管理
│   │   ├── SpawnSystem.ts        # 生成系统
│   │   └── RenderSystem.ts
│   │
│   └── utils/
│       └── geometry.ts       # 几何计算
│
├── assets/
│   ├── ship.png
│   ├── asteroid.png
│   ├── shoot.mp3
│   ├── explosion.mp3
│   └── thrust.mp3
│
└── index.html
```

## 核心组件

```typescript
// 飞船组件
export const Ship = defineComponent({
  acceleration: Types.f32,
  rotationSpeed: Types.f32,
  friction: Types.f32,
  invincible: Types.ui8
});

// 小行星组件
export const Asteroid = defineComponent({
  size: Types.ui8,        // 0=小, 1=中, 2=大
  points: Types.ui32      // 击毁得分
});

// 子弹组件
export const Bullet = defineComponent({
  damage: Types.f32,
  owner: Types.ui32       // 发射者 ID
});

// 屏幕环绕标记
export const ScreenWrap = defineComponent({});

// 生命周期
export const Lifetime = defineComponent({
  remaining: Types.f32
});

// 粒子
export const Particle = defineComponent({
  color: Types.f32,       // RGBA packed
  size: Types.f32
});
```

## 核心系统

### ShipControlSystem

```typescript
export class ShipControlSystem extends System {
  private query = this.createQuery({
    all: [Ship, Position, Velocity, Rotation]
  });

  update(dt: number): void {
    const keyboard = this.world.keyboard;

    for (const entity of this.query) {
      // 旋转
      if (keyboard.isKeyDown('ArrowLeft')) {
        Rotation.angle[entity] -= Ship.rotationSpeed[entity] * dt;
      }
      if (keyboard.isKeyDown('ArrowRight')) {
        Rotation.angle[entity] += Ship.rotationSpeed[entity] * dt;
      }

      // 推进 (根据朝向添加速度)
      if (keyboard.isKeyDown('ArrowUp')) {
        const angle = Rotation.angle[entity];
        const acc = Ship.acceleration[entity];
        Velocity.x[entity] += Math.cos(angle) * acc * dt;
        Velocity.y[entity] += Math.sin(angle) * acc * dt;

        // 播放推进音效
        this.world.audio.play('thrust');
      }

      // 摩擦力减速
      Velocity.x[entity] *= (1 - Ship.friction[entity] * dt);
      Velocity.y[entity] *= (1 - Ship.friction[entity] * dt);

      // 发射子弹
      if (keyboard.isKeyPressed('Space')) {
        this.spawnBullet(entity);
      }
    }
  }

  private spawnBullet(ship: Entity): void {
    const bullet = this.world.createEntity();
    const angle = Rotation.angle[ship];

    this.world.addComponent(bullet, Position, {
      x: Position.x[ship],
      y: Position.y[ship]
    });
    this.world.addComponent(bullet, Velocity, {
      x: Math.cos(angle) * BULLET_SPEED,
      y: Math.sin(angle) * BULLET_SPEED
    });
    this.world.addComponent(bullet, Bullet, { damage: 1, owner: ship });
    this.world.addComponent(bullet, Collider, { radius: 3 });
    this.world.addComponent(bullet, Lifetime, { remaining: 2.0 });

    this.world.audio.play('shoot');
  }
}
```

### ScreenWrapSystem

```typescript
export class ScreenWrapSystem extends System {
  private query = this.createQuery({
    all: [Position, ScreenWrap]
  });

  update(dt: number): void {
    for (const entity of this.query) {
      // X 轴环绕
      if (Position.x[entity] < 0) {
        Position.x[entity] = SCREEN_WIDTH;
      } else if (Position.x[entity] > SCREEN_WIDTH) {
        Position.x[entity] = 0;
      }

      // Y 轴环绕
      if (Position.y[entity] < 0) {
        Position.y[entity] = SCREEN_HEIGHT;
      } else if (Position.y[entity] > SCREEN_HEIGHT) {
        Position.y[entity] = 0;
      }
    }
  }
}
```

### CollisionSystem

```typescript
export class CollisionSystem extends System {
  private bullets = this.createQuery({ all: [Bullet, Position, Collider] });
  private asteroids = this.createQuery({ all: [Asteroid, Position, Collider] });
  private ships = this.createQuery({ all: [Ship, Position, Collider, Health] });

  update(dt: number): void {
    // 子弹 vs 小行星
    for (const bullet of this.bullets) {
      for (const asteroid of this.asteroids) {
        if (this.circleCollision(bullet, asteroid)) {
          this.destroyAsteroid(asteroid);
          this.world.destroyEntity(bullet);
          break;
        }
      }
    }

    // 飞船 vs 小行星
    for (const ship of this.ships) {
      if (Ship.invincible[ship]) continue;

      for (const asteroid of this.asteroids) {
        if (this.circleCollision(ship, asteroid)) {
          this.damageShip(ship);
          break;
        }
      }
    }
  }

  private destroyAsteroid(asteroid: Entity): void {
    const size = Asteroid.size[asteroid];

    // 大小行星分裂成小行星
    if (size > 0) {
      for (let i = 0; i < 2; i++) {
        this.spawnSmallerAsteroid(
          Position.x[asteroid],
          Position.y[asteroid],
          size - 1
        );
      }
    }

    // 生成爆炸粒子
    this.spawnExplosion(Position.x[asteroid], Position.y[asteroid]);

    // 加分
    this.world.score += Asteroid.points[asteroid];

    // 播放音效
    this.world.audio.play('explosion');

    // 销毁原小行星
    this.world.destroyEntity(asteroid);
  }

  private circleCollision(a: Entity, b: Entity): boolean {
    const dx = Position.x[a] - Position.x[b];
    const dy = Position.y[a] - Position.y[b];
    const dist = dx * dx + dy * dy;
    const radiusSum = Collider.radius[a] + Collider.radius[b];
    return dist < radiusSum * radiusSum;
  }
}
```

### ParticleSystem

```typescript
export class ParticleSystem extends System {
  private query = this.createQuery({
    all: [Particle, Position, Velocity, Lifetime]
  });

  update(dt: number): void {
    for (const entity of this.query) {
      Lifetime.remaining[entity] -= dt;

      if (Lifetime.remaining[entity] <= 0) {
        this.world.destroyEntity(entity);
        continue;
      }

      // 粒子随时间缩小
      const life = Lifetime.remaining[entity] / Lifetime.initial[entity];
      Particle.size[entity] *= life;

      // 应用速度
      Position.x[entity] += Velocity.x[entity] * dt;
      Position.y[entity] += Velocity.y[entity] * dt;
    }
  }
}

// 生成爆炸粒子
function spawnExplosion(x: number, y: number): void {
  for (let i = 0; i < 10; i++) {
    const particle = world.createEntity();
    const angle = Math.random() * Math.PI * 2;
    const speed = 50 + Math.random() * 100;

    world.addComponent(particle, Position, { x, y });
    world.addComponent(particle, Velocity, {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed
    });
    world.addComponent(particle, Particle, {
      color: 0xffaa00ff,
      size: 3 + Math.random() * 3
    });
    world.addComponent(particle, Lifetime, { remaining: 0.5 + Math.random() * 0.5 });
  }
}
```

## 控制方案

| 按键 | 动作 |
|------|------|
| ← | 左旋转 |
| → | 右旋转 |
| ↑ | 推进 |
| Space | 发射子弹 |

## 游戏流程

```
┌─────────────────────────────────────────┐
│              Game Flow                   │
└─────────────────────────────────────────┘
                  │
                  ▼
           ┌──────────┐
           │  Start   │
           └────┬─────┘
                │
                ▼
           ┌──────────┐
           │  Play    │◄─────────────┐
           └────┬─────┘              │
                │                    │
     ┌──────────┴──────────┐         │
     │                     │         │
     ▼                     ▼         │
┌─────────┐         ┌──────────┐    │
│Hit by   │         │Clear all │    │
│Asteroid │         │Asteroids │    │
└────┬────┘         └────┬─────┘    │
     │                   │          │
     ▼                   ▼          │
┌─────────┐         ┌──────────┐    │
│Lose Life│         │Next Level│────┘
└────┬────┘         └──────────┘
     │
     ▼ (No lives left)
┌──────────┐
│Game Over │
└──────────┘
```

## 扩展功能

1. **护盾**: 临时无敌
2. **不同武器**: 散射、追踪导弹
3. **UFO 敌人**: 随机出现并射击玩家
4. **高分榜**: 本地存储最高分
