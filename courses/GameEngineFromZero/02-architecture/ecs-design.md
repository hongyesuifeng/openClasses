# ECS 架构设计

## 概述

ECS (Entity-Component-System) 是一种数据导向的游戏架构模式，将游戏逻辑分解为:
- **Entity**: 纯标识符 (ID)
- **Component**: 纯数据容器
- **System**: 处理特定组件组合的逻辑

## 为什么选择 ECS

### 传统 OOP 的问题

```typescript
// 传统继承方式 - 容易产生"菱形继承"问题
class GameObject {
  position: Vec3;
}

class Character extends GameObject {
  health: number;
}

class FlyingCharacter extends Character { /* ... */ }
class SwimmingCharacter extends Character { /* ... */ }

// 问题: 会飞又会游泳的角色怎么办?
```

### ECS 的解决方案

```typescript
// 组合优于继承
const entity = world.createEntity();
world.addComponent(entity, Position, { x: 0, y: 0 });
world.addComponent(entity, Health, { value: 100 });
world.addComponent(entity, Flying, { speed: 10 });
world.addComponent(entity, Swimming, { speed: 5 });
```

## 架构选型: bitECS 风格 (SoA)

### AoS vs SoA

```
AoS (Array of Structures) - 传统方式:
┌─────────────────────────────────────────┐
│ Entity[0]: { pos, vel, health, ... }    │
│ Entity[1]: { pos, vel, health, ... }    │
│ Entity[2]: { pos, vel, health, ... }    │
└─────────────────────────────────────────┘

SoA (Structure of Arrays) - bitECS 风格:
┌─────────────────────────────────────────┐
│ Position: [x0, x1, x2, ...]            │
│           [y0, y1, y2, ...]            │
│ Velocity: [x0, x1, x2, ...]            │
│           [y0, y1, y2, ...]            │
│ Health:   [h0, h1, h2, ...]            │
└─────────────────────────────────────────┘
```

**SoA 优势**:
- 缓存友好 (CPU Cache Hit 更高)
- 便于 SIMD 优化
- 内存布局紧凑

## NovaEngine ECS 设计

### 实体 (Entity)

```typescript
// 实体就是一个数字 ID
type Entity = number;

// 实体管理
class EntityManager {
  private entities: Set<Entity> = new Set();
  private nextId: number = 0;
  private freeIds: Entity[] = [];

  create(): Entity {
    if (this.freeIds.length > 0) {
      return this.freeIds.pop()!;
    }
    const id = this.nextId++;
    this.entities.add(id);
    return id;
  }

  destroy(entity: Entity): void {
    this.entities.delete(entity);
    this.freeIds.push(entity);
  }
}
```

### 组件 (Component)

```typescript
// 组件定义
function defineComponent<T extends Record<string, DataType>>(
  schema: T
): ComponentType<T> {
  // 创建 SoA 存储
  const storage = {} as ComponentStorage<T>;

  for (const key in schema) {
    const type = schema[key];
    storage[key] = createTypedArray(type);
  }

  return {
    schema,
    storage,
    add: (entity: Entity, values?: Partial<T>) => { /* ... */ },
    remove: (entity: Entity) => { /* ... */ },
    has: (entity: Entity) => boolean,
    get: (entity: Entity) => T | undefined,
  };
}

// 使用示例
const Position = defineComponent({
  x: Types.f32,
  y: Types.f32
});

const Velocity = defineComponent({
  x: Types.f32,
  y: Types.f32
});
```

### 查询 (Query)

```typescript
// 查询定义
class Query {
  private entities: Set<Entity> = new Set();

  constructor(
    private world: World,
    private all: ComponentType<any>[] = [],   // 必须有
    private any: ComponentType<any>[] = [],   // 任一有
    private none: ComponentType<any>[] = []   // 不能有
  ) {
    this.rebuild();
  }

  private rebuild(): void {
    // 根据条件筛选实体
    for (const entity of this.world.entities) {
      if (this.match(entity)) {
        this.entities.add(entity);
      } else {
        this.entities.delete(entity);
      }
    }
  }

  private match(entity: Entity): boolean {
    // all: 所有组件都必须存在
    for (const comp of this.all) {
      if (!comp.has(entity)) return false;
    }
    // none: 所有组件都不能存在
    for (const comp of this.none) {
      if (comp.has(entity)) return false;
    }
    return true;
  }

  [Symbol.iterator](): Iterator<Entity> {
    return this.entities[Symbol.iterator]();
  }
}

// 使用示例
const moveableQuery = world.createQuery({
  all: [Position, Velocity]
});

for (const entity of moveableQuery) {
  Position.x[entity] += Velocity.x[entity] * dt;
  Position.y[entity] += Velocity.y[entity] * dt;
}
```

### 系统 (System)

```typescript
abstract class System {
  abstract update(dt: number): void;
  priority: number = 0;
  enabled: boolean = true;
}

class MovementSystem extends System {
  private query = this.world.createQuery({
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

### 世界 (World)

```typescript
class World {
  private entities: EntityManager;
  private components: Map<ComponentType<any>, ComponentStorage>;
  private systems: System[] = [];

  createEntity(): Entity {
    return this.entities.create();
  }

  destroyEntity(entity: Entity): void {
    // 移除所有组件
    for (const [type, storage] of this.components) {
      type.remove(entity);
    }
    this.entities.destroy(entity);
  }

  addComponent<T>(entity: Entity, type: ComponentType<T>, values?: Partial<T>): void {
    type.add(entity, values);
    // 触发查询更新
    this.updateQueries(entity);
  }

  addSystem(system: System): void {
    this.systems.push(system);
    this.systems.sort((a, b) => a.priority - b.priority);
  }

  update(dt: number): void {
    for (const system of this.systems) {
      if (system.enabled) {
        system.update(dt);
      }
    }
  }
}
```

## 性能优化

### 原型表 (Archetype)

将具有相同组件组合的实体分组:

```
Archetype A: [Position, Velocity]     -> 实体 1, 2, 5, 8
Archetype B: [Position, Sprite]       -> 实体 3, 4
Archetype C: [Position, Velocity, AI] -> 实体 6, 7
```

优势:
- 内存连续访问
- 快速迭代
- 简化查询

### 批量操作

```typescript
// 避免: 逐个更新
for (const e of entities) {
  Position.x[e] += Velocity.x[e] * dt;
  Position.y[e] += Velocity.y[e] * dt;
}

// 优化: 批量更新 (未来可 SIMD 化)
const px = Position.x;
const py = Position.y;
const vx = Velocity.x;
const vy = Velocity.y;

for (let i = 0; i < count; i++) {
  const e = entities[i];
  px[e] += vx[e] * dt;
  py[e] += vy[e] * dt;
}
```

## 与其他系统整合

### 渲染系统

```typescript
class RenderSystem extends System {
  private query = this.world.createQuery({
    all: [Position, Sprite]
  });

  update(dt: number): void {
    const batch = new SpriteBatch(this.renderer);
    batch.begin(this.camera);

    for (const entity of this.query) {
      batch.draw({
        texture: Sprite.texture[entity],
        x: Position.x[entity],
        y: Position.y[entity],
      });
    }

    batch.end();
  }
}
```

### 物理系统

```typescript
class PhysicsSystem extends System {
  private query = this.world.createQuery({
    all: [Position, Collider]
  });

  update(dt: number): void {
    // 收集碰撞体
    // 检测碰撞
    // 发送碰撞事件
  }
}
```

## 参考资源

- [bitECS](https://github.com/NateTheGreatt/bitECS) - 极简 TypeScript ECS
- [ECS FAQ](https://github.com/SanderMertens/ecs-faq)
- [Data-Oriented Design](https://www.dataorienteddesign.com/dodbook/)
