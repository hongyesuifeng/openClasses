# 游戏 #3: Platformer (平台跳跃游戏)

## 概述

**难度**: :star::star::star:

**周次**: 第 9 周

**技术点**: 精确碰撞检测、角色控制器、帧动画、粒子系统

## 游戏规则

1. 玩家控制角色在平台间跳跃
2. 收集金币增加分数
3. 避免掉入陷阱
4. 到达终点完成关卡

## 项目结构

```
games/03-platformer/
├── src/
│   ├── main.ts
│   ├── Game.ts
│   ├── config.ts
│   │
│   ├── components/
│   │   ├── Position.ts
│   │   ├── Velocity.ts
│   │   ├── Player.ts
│   │   ├── Platform.ts
│   │   ├── Collider.ts
│   │   ├── Gravity.ts
│   │   ├── Grounded.ts           # 是否着地
│   │   ├── AnimatedSprite.ts     # 帧动画
│   │   ├── Jump.ts               # 跳跃状态
│   │   ├── Coin.ts               # 金币
│   │   └── Trap.ts               # 陷阱
│   │
│   ├── systems/
│   │   ├── PlayerInputSystem.ts  # 玩家输入
│   │   ├── GravitySystem.ts      # 重力
│   │   ├── MovementSystem.ts     # 移动
│   │   ├── PlatformCollisionSystem.ts  # 平台碰撞
│   │   ├── JumpSystem.ts         # 跳跃逻辑
│   │   ├── AnimationSystem.ts    # 动画控制
│   │   ├── CoinSystem.ts         # 金币收集
│   │   ├── ParticleSystem.ts     # 粒子效果
│   │   └── RenderSystem.ts
│   │
│   └── levels/
│       ├── LevelLoader.ts
│       └── level1.json
│
├── assets/
│   ├── player/
│   │   ├── idle/
│   │   ├── walk/
│   │   ├── jump/
│   │   └── fall/
│   ├── tiles/
│   ├── coins/
│   └── audio/
│
└── index.html
```

## 核心组件

```typescript
// 玩家组件
export const Player = defineComponent({
  speed: Types.f32,
  jumpForce: Types.f32,
  facingRight: Types.ui8
});

// 平台组件
export const Platform = defineComponent({
  type: Types.ui8,  // 0=solid, 1=one-way
  width: Types.f32,
  height: Types.f32
});

// 跳跃状态
export const Jump = defineComponent({
  canJump: Types.ui8,
  jumpHeld: Types.ui8,      // 跳跃键是否按住
  jumpTime: Types.f32,       // 已跳跃时间
  maxJumpTime: Types.f32     // 最大跳跃时间 (可变跳跃高度)
});

// 着地状态
export const Grounded = defineComponent({
  value: Types.ui8,
  groundY: Types.f32
});

// 重力
export const Gravity = defineComponent({
  scale: Types.f32,
  maxFallSpeed: Types.f32
});
```

## 核心系统

### PlatformCollisionSystem (平台碰撞)

```typescript
export class PlatformCollisionSystem extends System {
  private players = this.createQuery({
    all: [Player, Position, Velocity, Collider, Grounded]
  });
  private platforms = this.createQuery({
    all: [Platform, Position, Collider]
  });

  update(dt: number): void {
    for (const player of this.players) {
      // 重置着地状态
      Grounded.value[player] = 0;

      for (const platform of this.platforms) {
        this.checkPlatformCollision(player, platform);
      }
    }
  }

  private checkPlatformCollision(player: Entity, platform: Entity): void {
    const playerAABB = this.getAABB(player);
    const platformAABB = this.getAABB(platform);

    // AABB 重叠检测
    if (!this.aabbOverlap(playerAABB, platformAABB)) return;

    // 单向平台: 只有从上方落下才碰撞
    if (Platform.type[platform] === 1) {
      // 玩家必须在平台上方
      if (Velocity.y[player] < 0) return;
      if (playerAABB.maxY - Velocity.y[player] > platformAABB.minY) return;
    }

    // 计算穿透深度
    const overlapX = Math.min(
      playerAABB.maxX - platformAABB.minX,
      platformAABB.maxX - playerAABB.minX
    );
    const overlapY = Math.min(
      playerAABB.maxY - platformAABB.minY,
      platformAABB.maxY - playerAABB.minY
    );

    // 选择穿透最小的轴进行分离
    if (overlapY < overlapX) {
      // 垂直分离
      if (playerAABB.minY < platformAABB.minY) {
        // 玩家在平台下方
        Position.y[player] = platformAABB.minY - Collider.height[player] / 2;
        Velocity.y[player] = 0;
      } else {
        // 玩家在平台上方 (着地)
        Position.y[player] = platformAABB.maxY + Collider.height[player] / 2;
        Velocity.y[player] = 0;
        Grounded.value[player] = 1;
        Grounded.groundY[player] = platformAABB.maxY;
      }
    } else {
      // 水平分离
      if (playerAABB.minX < platformAABB.minX) {
        Position.x[player] = platformAABB.minX - Collider.width[player] / 2;
      } else {
        Position.x[player] = platformAABB.maxX + Collider.width[player] / 2;
      }
      Velocity.x[player] = 0;
    }
  }
}
```

### JumpSystem (跳跃系统)

```typescript
export class JumpSystem extends System {
  private query = this.createQuery({
    all: [Player, Jump, Velocity, Grounded]
  });

  update(dt: number): void {
    const keyboard = this.world.keyboard;

    for (const entity of this.query) {
      const isGrounded = Grounded.value[entity];
      const jumpPressed = keyboard.isKeyPressed('Space');
      const jumpHeld = keyboard.isKeyDown('Space');

      // 开始跳跃
      if (jumpPressed && isGrounded && Jump.canJump[entity]) {
        Velocity.y[entity] = -Player.jumpForce[entity];
        Jump.canJump[entity] = 0;
        Jump.jumpTime[entity] = 0;
        Jump.jumpHeld[entity] = 1;

        // 播放跳跃粒子
        this.spawnJumpParticles(entity);
        this.world.audio.play('jump');
      }

      // 可变跳跃高度: 按住跳得更高
      if (Jump.jumpHeld[entity] && jumpHeld) {
        Jump.jumpTime[entity] += dt;
        if (Jump.jumpTime[entity] < Jump.maxJumpTime[entity]) {
          // 持续提供向上的力
          Velocity.y[entity] -= Player.jumpForce[entity] * 0.5 * dt;
        }
      }

      // 释放跳跃键或达到最大时间
      if (!jumpHeld || Jump.jumpTime[entity] >= Jump.maxJumpTime[entity]) {
        Jump.jumpHeld[entity] = 0;
      }

      // 着地后重置跳跃能力
      if (isGrounded) {
        Jump.canJump[entity] = 1;
      }
    }
  }
}
```

### AnimationSystem (动画系统)

```typescript
export class AnimationSystem extends System {
  private query = this.createQuery({
    all: [AnimatedSprite, Player, Velocity, Grounded]
  });

  update(dt: number): void {
    for (const entity of this.query) {
      const isGrounded = Grounded.value[entity];
      const vx = Velocity.x[entity];
      const vy = Velocity.y[entity];
      const animator = AnimatedSprite.animator[entity];

      // 根据状态选择动画
      if (!isGrounded) {
        if (vy < 0) {
          animator.play('jump');
        } else {
          animator.play('fall');
        }
      } else if (Math.abs(vx) > 10) {
        animator.play('walk');
      } else {
        animator.play('idle');
      }

      // 更新朝向
      if (vx > 0) {
        Player.facingRight[entity] = 1;
        AnimatedSprite.scaleX[entity] = 1;
      } else if (vx < 0) {
        Player.facingRight[entity] = 0;
        AnimatedSprite.scaleX[entity] = -1;
      }

      // 更新动画帧
      animator.update(dt);
    }
  }
}
```

## 关卡数据格式

```json
{
  "name": "Level 1",
  "width": 1920,
  "height": 1080,
  "player": {
    "x": 100,
    "y": 500
  },
  "platforms": [
    { "x": 0, "y": 600, "width": 400, "height": 40, "type": "solid" },
    { "x": 500, "y": 500, "width": 200, "height": 20, "type": "one-way" }
  ],
  "coins": [
    { "x": 200, "y": 550 },
    { "x": 600, "y": 450 }
  ],
  "traps": [
    { "x": 300, "y": 620, "width": 50, "height": 20 }
  ],
  "goal": {
    "x": 1800,
    "y": 400
  }
}
```

## 控制方案

| 按键 | 动作 |
|------|------|
| A / ← | 左移 |
| D / → | 右移 |
| Space | 跳跃 (按住跳更高) |

## 扩展功能

1. **双跳**: 空中可以再跳一次
2. **冲刺**: 快速位移
3. **墙壁跳跃**: 贴墙时可以跳跃
4. **敌人**: 巡逻的敌人
5. **检查点**: 死亡后重生点
