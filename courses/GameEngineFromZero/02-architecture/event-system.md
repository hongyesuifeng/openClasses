# 事件系统设计

## 概述

事件系统是游戏引擎中模块间通信的核心机制，实现松耦合的观察者模式。NovaEngine 采用**信号 (Signal)** 模式，提供类型安全、高性能的事件分发。

## 设计目标

1. **类型安全**: 完整的 TypeScript 类型推断
2. **高性能**: 最小化内存分配，支持批量处理
3. **易用性**: 简洁的 API，支持自动清理
4. **调试友好**: 事件追踪和性能统计

## 核心类型

### Signal - 信号/事件发射器

```typescript
// signal.ts
type Listener<T extends any[]> = (...args: T) => void;

export class Signal<T extends any[] = []> {
  private listeners: Listener<T>[] = [];
  private onceListeners: Listener<T>[] = [];
  private dispatching: boolean = false;
  private pendingRemoves: Set<Listener<T>> = new Set();

  /**
   * 添加监听器
   * @returns 返回取消订阅函数
   */
  on(listener: Listener<T>): () => void {
    this.listeners.push(listener);
    return () => this.off(listener);
  }

  /**
   * 添加一次性监听器
   */
  once(listener: Listener<T>): () => void {
    this.onceListeners.push(listener);
    return () => {
      const index = this.onceListeners.indexOf(listener);
      if (index !== -1) this.onceListeners.splice(index, 1);
    };
  }

  /**
   * 移除监听器
   */
  off(listener: Listener<T>): void {
    if (this.dispatching) {
      this.pendingRemoves.add(listener);
      return;
    }

    let index = this.listeners.indexOf(listener);
    if (index !== -1) this.listeners.splice(index, 1);

    index = this.onceListeners.indexOf(listener);
    if (index !== -1) this.onceListeners.splice(index, 1);
  }

  /**
   * 发射事件
   */
  emit(...args: T): void {
    this.dispatching = true;

    // 普通监听器
    for (const listener of this.listeners) {
      if (this.pendingRemoves.has(listener)) continue;
      listener(...args);
    }

    // 一次性监听器
    const onceListeners = this.onceListeners;
    this.onceListeners = [];
    for (const listener of onceListeners) {
      if (this.pendingRemoves.has(listener)) continue;
      listener(...args);
    }

    this.dispatching = false;
    this.pendingRemoves.clear();
  }

  /**
   * 移除所有监听器
   */
  clear(): void {
    this.listeners = [];
    this.onceListeners = [];
    this.pendingRemoves.clear();
  }

  /**
   * 监听器数量
   */
  get count(): number {
    return this.listeners.length + this.onceListeners.length;
  }
}
```

### Typed Event Emitter

```typescript
// event-emitter.ts
type EventMap = Record<string, any[]>;

export class EventEmitter<TEvents extends EventMap> {
  private signals: Map<keyof TEvents, Signal<any[]>> = new Map();

  private getSignal<K extends keyof TEvents>(event: K): Signal<TEvents[K]> {
    if (!this.signals.has(event)) {
      this.signals.set(event, new Signal());
    }
    return this.signals.get(event) as Signal<TEvents[K]>;
  }

  /**
   * 监听事件
   */
  on<K extends keyof TEvents>(
    event: K,
    listener: (...args: TEvents[K]) => void
  ): () => void {
    return this.getSignal(event).on(listener);
  }

  /**
   * 一次性监听
   */
  once<K extends keyof TEvents>(
    event: K,
    listener: (...args: TEvents[K]) => void
  ): () => void {
    return this.getSignal(event).once(listener);
  }

  /**
   * 移除监听
   */
  off<K extends keyof TEvents>(
    event: K,
    listener: (...args: TEvents[K]) => void
  ): void {
    const signal = this.signals.get(event);
    if (signal) signal.off(listener);
  }

  /**
   * 发射事件
   */
  emit<K extends keyof TEvents>(event: K, ...args: TEvents[K]): void {
    const signal = this.signals.get(event);
    if (signal) signal.emit(...args);
  }

  /**
   * 清除所有监听器
   */
  clear(event?: keyof TEvents): void {
    if (event) {
      this.signals.get(event)?.clear();
    } else {
      this.signals.forEach(s => s.clear());
    }
  }
}
```

## 引擎事件定义

### 核心事件

```typescript
// events.ts

// 引擎生命周期事件
export interface EngineEvents {
  'engine:init': [];
  'engine:start': [];
  'engine:pause': [];
  'engine:resume': [];
  'engine:stop': [];
  'engine:resize': [width: number, height: number];
}

// 场景事件
export interface SceneEvents {
  'scene:load': [sceneName: string];
  'scene:loaded': [sceneName: string];
  'scene:unload': [sceneName: string];
  'scene:change': [fromScene: string, toScene: string];
}

// 实体事件
export interface EntityEvents {
  'entity:create': [entity: Entity];
  'entity:destroy': [entity: Entity];
  'component:add': [entity: Entity, componentType: string];
  'component:remove': [entity: Entity, componentType: string];
}

// 输入事件
export interface InputEvents {
  'input:keydown': [key: string, event: KeyboardEvent];
  'input:keyup': [key: string, event: KeyboardEvent];
  'input:mousedown': [button: number, x: number, y: number];
  'input:mouseup': [button: number, x: number, y: number];
  'input:mousemove': [x: number, y: number, dx: number, dy: number];
  'input:wheel': [deltaX: number, deltaY: number];
  'input:touchstart': [touches: Touch[]];
  'input:touchmove': [touches: Touch[]];
  'input:touchend': [touches: Touch[]];
}

// 物理事件
export interface PhysicsEvents {
  'collision:enter': [entityA: Entity, entityB: Entity, contact: Contact];
  'collision:stay': [entityA: Entity, entityB: Entity];
  'collision:exit': [entityA: Entity, entityB: Entity];
  'trigger:enter': [entityA: Entity, entityB: Entity];
  'trigger:exit': [entityA: Entity, entityB: Entity];
}

// 资源事件
export interface ResourceEvents {
  'resource:load:start': [url: string];
  'resource:load:progress': [url: string, loaded: number, total: number];
  'resource:load:complete': [url: string, resource: any];
  'resource:load:error': [url: string, error: Error];
}

// 音频事件
export interface AudioEvents {
  'audio:play': [soundId: string];
  'audio:stop': [soundId: string];
  'audio:complete': [soundId: string];
}

// 动画事件
export interface AnimationEvents {
  'animation:start': [animationId: string];
  'animation:end': [animationId: string];
  'animation:loop': [animationId: string, loopCount: number];
  'animation:event': [animationId: string, eventName: string];
}

// 合并所有事件
export interface AllEvents
  extends EngineEvents,
          SceneEvents,
          EntityEvents,
          InputEvents,
          PhysicsEvents,
          ResourceEvents,
          AudioEvents,
          AnimationEvents {}
```

## 使用示例

### 基础用法

```typescript
import { Signal } from '@nova/core';

// 创建信号
const onScoreChange = new Signal<[number, number]>(); // 新分数, 增量

// 添加监听器
const unsubscribe = onScoreChange.on((newScore, delta) => {
  console.log(`分数: ${newScore} (+${delta})`);
});

// 发射事件
onScoreChange.emit(100, 10); // 输出: 分数: 100 (+10)

// 取消订阅
unsubscribe();
```

### 使用 EventEmitter

```typescript
import { EventEmitter } from '@nova/core';

interface GameEvents {
  score: [points: number];
  levelComplete: [level: number, time: number];
  gameOver: [finalScore: number];
}

class Game extends EventEmitter<GameEvents> {
  private score: number = 0;
  private level: number = 1;

  addScore(points: number): void {
    this.score += points;
    this.emit('score', points);
  }

  completeLevel(): void {
    this.emit('levelComplete', this.level, performance.now());
    this.level++;
  }

  end(): void {
    this.emit('gameOver', this.score);
  }
}

// 使用
const game = new Game();

game.on('score', (points) => {
  console.log(`获得 ${points} 分`);
});

game.on('levelComplete', (level, time) => {
  console.log(`关卡 ${level} 完成，用时 ${time}ms`);
});

game.on('gameOver', (finalScore) => {
  console.log(`游戏结束，最终得分: ${finalScore}`);
});
```

### 碰撞事件

```typescript
// 物理系统
class PhysicsSystem extends System {
  private collisionSignal = new Signal<[Entity, Entity, Contact]>();

  update(dt: number): void {
    for (const [a, b, contact] of this.detectCollisions()) {
      this.collisionSignal.emit(a, b, contact);
    }
  }

  onCollision(listener: (a: Entity, b: Entity, contact: Contact) => void): () => void {
    return this.collisionSignal.on(listener);
  }
}

// 游戏逻辑
physicsSystem.onCollision((entityA, entityB, contact) => {
  if (hasComponent(entityA, Player) && hasComponent(entityB, Enemy)) {
    // 玩家碰到敌人
    Health.current[entityA] -= 10;
  }
});
```

### ECS 集成

```typescript
// 组件定义
const EventListener = defineComponent({
  callbacks: Types.ui32, // 存储取消订阅函数的索引
});

// 事件监听系统
class EventListenerSystem extends System {
  private subscriptions: Map<number, () => void> = new Map();

  onEntityAdded(entity: Entity): void {
    const callbacks = EventListener.callbacks[entity];
    // ... 订阅事件
  }

  onEntityRemoved(entity: Entity): void {
    const unsub = this.subscriptions.get(entity);
    if (unsub) {
      unsub();
      this.subscriptions.delete(entity);
    }
  }
}
```

## 高级特性

### 事件优先级

```typescript
type PrioritizedListener<T extends any[]> = {
  listener: Listener<T>;
  priority: number;
};

export class PrioritySignal<T extends any[] = []> extends Signal<T> {
  private prioritizedListeners: PrioritizedListener<T>[] = [];

  on(listener: Listener<T>, priority: number = 0): () => void {
    this.prioritizedListeners.push({ listener, priority });
    this.prioritizedListeners.sort((a, b) => b.priority - a.priority);
    return () => this.off(listener);
  }

  emit(...args: T): void {
    for (const { listener } of this.prioritizedListeners) {
      listener(...args);
    }
  }
}
```

### 事件缓冲

```typescript
export class BufferedSignal<T extends any[]> extends Signal<T> {
  private buffer: { args: T }[] = [];
  private bufferSize: number;

  constructor(bufferSize: number = 10) {
    super();
    this.bufferSize = bufferSize;
  }

  emit(...args: T): void {
    // 缓冲事件
    this.buffer.push({ args: [...args] as T });
    if (this.buffer.length > this.bufferSize) {
      this.buffer.shift();
    }
    super.emit(...args);
  }

  /**
   * 获取最近的 N 个事件
   */
  getRecent(count: number = this.bufferSize): T[] {
    return this.buffer.slice(-count).map(b => b.args);
  }
}
```

### 异步事件

```typescript
export class AsyncSignal<T extends any[]> extends Signal<T> {
  async emitAsync(...args: T): Promise<void> {
    // 允许当前帧完成
    await Promise.resolve();
    super.emit(...args);
  }

  /**
   * 等待事件触发
   */
  wait(): Promise<T> {
    return new Promise((resolve) => {
      const unsub = this.once((...args) => {
        resolve(args);
      });
    });
  }
}

// 使用
const result = await collisionSignal.wait();
console.log('碰撞发生:', result);
```

## 调试支持

### 事件追踪

```typescript
// 开发模式启用
if (DEBUG) {
  const originalEmit = Signal.prototype.emit;
  Signal.prototype.emit = function(...args: any[]) {
    console.log(`[Signal] ${this.name || 'anonymous'}`, args);
    return originalEmit.apply(this, args);
  };
}
```

### 性能统计

```typescript
export class ProfiledSignal<T extends any[]> extends Signal<T> {
  private emitCount: number = 0;
  private totalDuration: number = 0;

  emit(...args: T): void {
    const start = performance.now();
    super.emit(...args);
    this.emitCount++;
    this.totalDuration += performance.now() - start;
  }

  get stats() {
    return {
      emitCount: this.emitCount,
      totalDuration: this.totalDuration,
      avgDuration: this.emitCount > 0 ? this.totalDuration / this.emitCount : 0,
    };
  }
}
```

## 最佳实践

### 1. 命名规范

```typescript
// 推荐: 使用冒号分隔的命名空间
'entity:create'
'entity:destroy'
'collision:enter'
'animation:end'

// 不推荐
'entityCreate'
'onEntityDestroy'
```

### 2. 自动清理

```typescript
class Player {
  private unsubscribes: (() => void)[] = [];

  constructor(eventBus: EventEmitter<GameEvents>) {
    // 自动收集取消订阅函数
    this.unsubscribes.push(
      eventBus.on('damage', this.onDamage.bind(this))
    );
    this.unsubscribes.push(
      eventBus.on('heal', this.onHeal.bind(this))
    );
  }

  destroy(): void {
    // 批量取消订阅
    this.unsubscribes.forEach(unsub => unsub());
    this.unsubscribes = [];
  }
}
```

### 3. 避免循环

```typescript
// 问题: 循环依赖
eventA.on(() => eventB.emit());
eventB.on(() => eventA.emit()); // 无限循环!

// 解决: 检查状态或使用标志
let isProcessing = false;

eventA.on(() => {
  if (isProcessing) return;
  isProcessing = true;
  eventB.emit();
  isProcessing = false;
});
```

### 4. 使用类型安全

```typescript
// 推荐: 定义事件类型接口
interface MyEvents {
  jump: [force: number];
  shoot: [x: number, y: number, damage: number];
}

const events = new EventEmitter<MyEvents>();

// 类型检查
events.emit('jump', 10); // OK
events.emit('jump', '10'); // Error!
events.emit('unknown', 1); // Error!
```

## 参考资源

- [RxJS](https://rxjs.dev/) - 响应式编程库
- [mitt](https://github.com/developit/mitt) - 极简事件发射器
- [GAMES104 - 事件系统](https://www.bilibili.com/video/BV1L44y1e7hD)
