# 第2周: 核心系统 + 事件机制

## 目标

- 实现事件系统
- 实现对象池
- 实现时间管理
- 构建核心工具库

## 任务清单

### 1. 事件系统 (@nova/core/event)

- [ ] EventEmitter 类
  - [ ] on/off/once/emit 方法
  - [ ] 支持泛型事件类型
  - [ ] 事件移除和清理

```typescript
interface EventMap {
  update: (dt: number) => void;
  render: () => void;
}

const emitter = new EventEmitter<EventMap>();
emitter.on('update', (dt) => console.log(dt));
emitter.emit('update', 0.016);
```

### 2. 对象池 (@nova/core/collections)

- [ ] ObjectPool<T> 实现
  - [ ] 预分配对象
  - [ ] acquire/release 方法
  - [ ] 自动扩容 (可选)

```typescript
class Bullet { /* ... */ }

const bulletPool = new ObjectPool(() => new Bullet(), 100);
const bullet = bulletPool.acquire();
// 使用完毕
bulletPool.release(bullet);
```

### 3. 时间管理 (@nova/core/time)

- [ ] Time 类
  - [ ] deltaTime
  - [ ] timeScale
  - [ ] elapsedSeconds

- [ ] Clock 类
  - [ ] 开始/暂停/重置
  - [ ] elapsed time

- [ ] 主循环集成
  - [ ] requestAnimationFrame 封装
  - [ ] 固定时间步长 (可选)

### 4. 其他工具 (@nova/core/utils)

- [ ] 随机数生成器
- [ ] GUID 生成
- [ ] 深拷贝/浅拷贝
- [ ] 类型判断工具

### 5. 数据结构

- [ ] SparseSet (ECS 基础)
- [ ] 简单的优先队列

## 学习资源

- Game Programming Patterns - Object Pool
- bitECS 源码中的数据结构

## 交付物

- `@nova/core` 包
- 完整的事件系统
- 对象池实现
- 时间管理工具

## 验证标准

```typescript
// 事件系统
const events = new EventEmitter<{ tick: (n: number) => void }>();
let called = false;
events.on('tick', (n) => { called = n > 0; });
events.emit('tick', 1);
console.log(called); // true

// 对象池
interface IPoolable { reset(): void; }
class Entity implements IPoolable {
  active = false;
  reset() { this.active = false; }
}
const pool = new ObjectPool(() => new Entity(), 10);
const e = pool.acquire();
pool.release(e);

// 时间
const time = new Time();
// 在游戏循环中
time.update(16); // 16ms
console.log(time.deltaTime); // 0.016
```
