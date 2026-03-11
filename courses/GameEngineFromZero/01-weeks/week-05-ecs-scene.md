# 第5周: 场景管理 + ECS 框架

## 目标

- 实现 ECS 核心架构
- 实现场景图 (Scene Graph)
- Transform 组件
- :video_game: **游戏 #1: Pong**

## 任务清单

### 1. ECS 框架 (@nova/ecs)

#### Entity (实体)
- [ ] 实体为纯 ID (number)
- [ ] 实体创建与销毁
- [ ] 实体版本控制 (防止悬垂引用)

#### Component (组件)
- [ ] 组件定义接口
- [ ] 组件存储 (SoA 模式)
- [ ] 组件添加/移除/查询

```typescript
// 组件定义 (纯数据)
const Position = defineComponent({
  x: Types.f32,
  y: Types.f32
});

const Velocity = defineComponent({
  x: Types.f32,
  y: Types.f32
});
```

#### System (系统)
- [ ] 系统基类
- [ ] 查询 (Query) 机制
- [ ] 系统优先级
- [ ] 系统启用/禁用

```typescript
// 系统示例
class MovementSystem extends System {
  // 查询: 有 Position 和 Velocity 的实体
  private query = this.createQuery(Position, Velocity);

  update(dt: number) {
    for (const entity of this.query) {
      Position.x[entity] += Velocity.x[entity] * dt;
      Position.y[entity] += Velocity.y[entity] * dt;
    }
  }
}
```

#### World (世界)
- [ ] 实体管理
- [ ] 系统管理
- [ ] 主循环调用

```typescript
const world = new World();

// 注册组件
world.registerComponent(Position);
world.registerComponent(Velocity);

// 添加系统
world.addSystem(new MovementSystem());

// 创建实体
const entity = world.createEntity();
world.addComponent(entity, Position, { x: 0, y: 0 });
world.addComponent(entity, Velocity, { x: 10, y: 5 });

// 主循环
function gameLoop(dt: number) {
  world.update(dt);
}
```

### 2. 场景图 (@nova/scene)

- [ ] SceneNode 类
  - [ ] 子节点管理
  - [ ] 本地变换
  - [ ] 世界变换计算

- [ ] SceneGraph 类
  - [ ] 根节点
  - [ ] 遍历算法
  - [ ] 脏标记优化

```typescript
const root = new SceneNode('root');
const player = new SceneNode('player');
const weapon = new SceneNode('weapon');

root.addChild(player);
player.addChild(weapon);

// 变换会自动传播到子节点
player.position.x = 100;
```

### 3. Transform 组件

- [ ] position (Vec3)
- [ ] rotation (Quaternion / 欧拉角)
- [ ] scale (Vec3)
- [ ] localMatrix / worldMatrix
- [ ] 矩阵更新优化 (脏标记)

### 4. 游戏项目: Pong

```
games/01-pong/
├── src/
│   ├── main.ts              # 入口
│   ├── components/          # 组件定义
│   │   ├── Position.ts
│   │   ├── Velocity.ts
│   │   ├── Paddle.ts
│   │   ├── Ball.ts
│   │   └── Score.ts
│   ├── systems/             # 系统实现
│   │   ├── MovementSystem.ts
│   │   ├── InputSystem.ts
│   │   ├── CollisionSystem.ts
│   │   └── RenderSystem.ts
│   └── Game.ts
├── index.html
└── package.json
```

**游戏功能**:
- [ ] 两个玩家控制的挡板
- [ ] 一个弹跳的球
- [ ] AABB 碰撞检测
- [ ] 得分系统
- [ ] 简单 UI 显示分数

## 学习资源

- bitECS 文档和源码
- GAMES104 ECS 章节
- Data-Oriented Design 原则

## 交付物

- `@nova/ecs` 包
- `@nova/scene` 包
- **可玩的 Pong 游戏!**

## 验证标准

1. ECS 框架能正确创建/销毁实体
2. 系统能查询并处理组件
3. 场景图变换正确传播
4. Pong 游戏可以双人/单人游玩

```bash
cd games/01-pong
pnpm dev
# 浏览器打开，可以玩 Pong
```
