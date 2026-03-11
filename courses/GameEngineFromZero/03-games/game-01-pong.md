# 游戏 #1: Pong (乒乓球)

## 概述

**难度**: :star:

**周次**: 第 5 周

**技术点**: ECS、Transform、Sprite、AABB 碰撞、键盘输入

## 游戏规则

1. 两个玩家各控制一个挡板
2. 球在场地中弹跳
3. 漏接球则对方得分
4. 先达到指定分数者获胜

## 项目结构

```
games/01-pong/
├── src/
│   ├── main.ts                 # 入口点
│   ├── Game.ts                 # 游戏主类
│   ├── config.ts               # 游戏配置
│   │
│   ├── components/             # ECS 组件
│   │   ├── index.ts
│   │   ├── Position.ts         # 位置
│   │   ├── Velocity.ts         # 速度
│   │   ├── Paddle.ts           # 挡板数据
│   │   ├── Ball.ts             # 球数据
│   │   ├── Collider.ts         # 碰撞体
│   │   ├── Score.ts            # 分数
│   │   └── PlayerInput.ts      # 玩家输入
│   │
│   ├── systems/                # ECS 系统
│   │   ├── index.ts
│   │   ├── InputSystem.ts      # 处理输入
│   │   ├── MovementSystem.ts   # 移动逻辑
│   │   ├── CollisionSystem.ts  # 碰撞检测
│   │   ├── ScoreSystem.ts      # 计分逻辑
│   │   └── RenderSystem.ts     # 渲染
│   │
│   └── utils/
│       ├── constants.ts        # 常量定义
│       └── helpers.ts          # 工具函数
│
├── assets/
│   ├── paddle.png              # 挡板精灵 (可选，用纯色代替)
│   └── ball.png                # 球精灵 (可选)
│
├── index.html
├── style.css
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 组件定义

```typescript
// components/Position.ts
export const Position = defineComponent({
  x: Types.f32,
  y: Types.f32
});

// components/Velocity.ts
export const Velocity = defineComponent({
  x: Types.f32,
  y: Types.f32
});

// components/Paddle.ts
export const Paddle = defineComponent({
  player: Types.ui8,      // 1 or 2
  speed: Types.f32,
  height: Types.f32,
  width: Types.f32
});

// components/Ball.ts
export const Ball = defineComponent({
  speed: Types.f32,
  radius: Types.f32
});

// components/PlayerInput.ts
export const PlayerInput = defineComponent({
  up: Types.ui8,    // 按键代码
  down: Types.ui8
});

// components/Score.ts
export const Score = defineComponent({
  player1: Types.ui32,
  player2: Types.ui32
});
```

## 系统实现

### InputSystem

```typescript
export class InputSystem extends System {
  private query = this.createQuery({
    all: [Paddle, PlayerInput, Velocity]
  });

  update(dt: number): void {
    const keyboard = this.world.keyboard;

    for (const entity of this.query) {
      let vy = 0;

      if (keyboard.isKeyDown(PlayerInput.up[entity])) {
        vy = -Paddle.speed[entity];
      } else if (keyboard.isKeyDown(PlayerInput.down[entity])) {
        vy = Paddle.speed[entity];
      }

      Velocity.y[entity] = vy;
    }
  }
}
```

### MovementSystem

```typescript
export class MovementSystem extends System {
  private query = this.createQuery({
    all: [Position, Velocity]
  });

  update(dt: number): void {
    for (const entity of this.query) {
      Position.x[entity] += Velocity.x[entity] * dt;
      Position.y[entity] += Velocity.y[entity] * dt;
    }
  }
}
```

### CollisionSystem

```typescript
export class CollisionSystem extends System {
  private balls = this.createQuery({ all: [Ball, Position, Velocity] });
  private paddles = this.createQuery({ all: [Paddle, Position] });

  update(dt: number): void {
    for (const ball of this.balls) {
      // 上下边界反弹
      if (Position.y[ball] <= 0 || Position.y[ball] >= SCREEN_HEIGHT) {
        Velocity.y[ball] *= -1;
      }

      // 挡板碰撞
      for (const paddle of this.paddles) {
        if (this.checkCollision(ball, paddle)) {
          Velocity.x[ball] *= -1;
          // 根据击球位置调整角度
          const hitPos = (Position.y[ball] - Position.y[paddle]) /
                         Paddle.height[paddle];
          Velocity.y[ball] = hitPos * Ball.speed[ball] * 0.5;
        }
      }
    }
  }

  private checkCollision(ball: Entity, paddle: Entity): boolean {
    // AABB vs Circle 碰撞检测
    // ...
  }
}
```

### ScoreSystem

```typescript
export class ScoreSystem extends System {
  private balls = this.createQuery({ all: [Ball, Position] });
  private scoreEntity: Entity;

  update(dt: number): void {
    for (const ball of this.balls) {
      // 球出左边界 -> 玩家2得分
      if (Position.x[ball] < 0) {
        Score.player2[this.scoreEntity]++;
        this.resetBall(ball);
      }
      // 球出右边界 -> 玩家1得分
      else if (Position.x[ball] > SCREEN_WIDTH) {
        Score.player1[this.scoreEntity]++;
        this.resetBall(ball);
      }
    }

    // 检查胜利条件
    if (Score.player1[this.scoreEntity] >= WIN_SCORE ||
        Score.player2[this.scoreEntity] >= WIN_SCORE) {
      this.world.emit('gameOver');
    }
  }

  private resetBall(ball: Entity): void {
    Position.x[ball] = SCREEN_WIDTH / 2;
    Position.y[ball] = SCREEN_HEIGHT / 2;
    Velocity.x[ball] = BALL_SPEED * (Math.random() > 0.5 ? 1 : -1);
    Velocity.y[ball] = 0;
  }
}
```

### RenderSystem

```typescript
export class RenderSystem extends System {
  private query = this.createQuery({
    all: [Position],
    any: [Paddle, Ball]
  });

  private batch: SpriteBatch;

  update(dt: number): void {
    this.batch.begin(this.camera);

    for (const entity of this.query) {
      if (Paddle.has(entity)) {
        this.batch.drawRect(
          Position.x[entity] - Paddle.width[entity] / 2,
          Position.y[entity] - Paddle.height[entity] / 2,
          Paddle.width[entity],
          Paddle.height[entity],
          Paddle.player[entity] === 1 ? 0xff0000ff : 0x00ff00ff
        );
      } else if (Ball.has(entity)) {
        this.batch.drawCircle(
          Position.x[entity],
          Position.y[entity],
          Ball.radius[entity],
          0xffffffff
        );
      }
    }

    this.batch.end();

    // 渲染分数 UI
    this.renderScore();
  }
}
```

## 游戏初始化

```typescript
// Game.ts
export class PongGame {
  private world: World;
  private renderer: Renderer;

  async init(): Promise<void> {
    // 初始化渲染器
    this.renderer = new WebGL2Renderer({
      canvas: document.getElementById('game') as HTMLCanvasElement
    });

    // 创建世界
    this.world = new World();

    // 注册组件
    this.world.registerComponent(Position);
    this.world.registerComponent(Velocity);
    this.world.registerComponent(Paddle);
    this.world.registerComponent(Ball);
    this.world.registerComponent(PlayerInput);
    this.world.registerComponent(Score);

    // 添加系统
    this.world.addSystem(new InputSystem(), 0);
    this.world.addSystem(new MovementSystem(), 1);
    this.world.addSystem(new CollisionSystem(), 2);
    this.world.addSystem(new ScoreSystem(), 3);
    this.world.addSystem(new RenderSystem(), 4);

    // 创建实体
    this.createPaddles();
    this.createBall();
    this.createScore();
  }

  private createPaddles(): void {
    // 玩家1 (左侧)
    const p1 = this.world.createEntity();
    this.world.addComponent(p1, Position, { x: 50, y: SCREEN_HEIGHT / 2 });
    this.world.addComponent(p1, Velocity, { x: 0, y: 0 });
    this.world.addComponent(p1, Paddle, {
      player: 1,
      speed: 300,
      width: 20,
      height: 100
    });
    this.world.addComponent(p1, PlayerInput, {
      up: 'KeyW',
      down: 'KeyS'
    });

    // 玩家2 (右侧)
    const p2 = this.world.createEntity();
    this.world.addComponent(p2, Position, {
      x: SCREEN_WIDTH - 50,
      y: SCREEN_HEIGHT / 2
    });
    this.world.addComponent(p2, Velocity, { x: 0, y: 0 });
    this.world.addComponent(p2, Paddle, {
      player: 2,
      speed: 300,
      width: 20,
      height: 100
    });
    this.world.addComponent(p2, PlayerInput, {
      up: 'ArrowUp',
      down: 'ArrowDown'
    });
  }

  private createBall(): void {
    const ball = this.world.createEntity();
    this.world.addComponent(ball, Position, {
      x: SCREEN_WIDTH / 2,
      y: SCREEN_HEIGHT / 2
    });
    this.world.addComponent(ball, Velocity, { x: BALL_SPEED, y: 0 });
    this.world.addComponent(ball, Ball, { speed: BALL_SPEED, radius: 10 });
  }

  private createScore(): void {
    const score = this.world.createEntity();
    this.world.addComponent(score, Score, { player1: 0, player2: 0 });
  }

  start(): void {
    this.gameLoop();
  }

  private gameLoop = (time: number): void => {
    const dt = this.time.update(time);
    this.world.update(dt);
    requestAnimationFrame(this.gameLoop);
  };
}
```

## 控制方案

| 玩家 | 上移 | 下移 |
|------|------|------|
| 玩家1 (左) | W | S |
| 玩家2 (右) | ↑ | ↓ |

## 扩展功能 (可选)

1. **AI 对手**: 单人模式，简单 AI 控制另一方
2. **难度选择**: 调整球速、挡板大小
3. **粒子效果**: 击球时产生粒子
4. **音效**: 击球、得分音效
5. **屏幕震动**: 进球时屏幕震动

## 验收标准

- [ ] 两个挡板可以独立控制
- [ ] 球在场地中正确弹跳
- [ ] 碰撞检测准确
- [ ] 分数正确统计
- [ ] 游戏可以正常开始和结束
