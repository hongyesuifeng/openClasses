# 事件系统

本文档详细介绍 Cocos Creator 引擎的事件系统实现。

## 目录

- [系统架构](#system-architecture)
- [Eventify 混合器](#eventify-mixin)
- [EventTarget 类](#eventtarget-class)
- [CallbacksInvoker 实现](#callbacksinvoker)
- [事件分发流程](#event-dispatch-flow)
- [性能优化](#performance-optimization)

---

## 系统架构

### 核心文件

| 文件 | 说明 |
|------|------|
| `cocos/core/event/eventify.ts` | 事件混合器 |
| `cocos/core/event/event-target.ts` | 事件目标类 |
| `cocos/core/event/callbacks-invoker.ts` | 回调调用器 |
| `cocos/core/event/EventInfo.ts` | 事件信息 |

### 架构图

```
┌─────────────────────────────────────────────────────────┐
│                    Event System                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   IEventified (接口)                                    │
│        ↑                                                │
│        │ implements                                     │
│        │                                                │
│   Eventify (混合器函数)                                 │
│        │                                                │
│        ├── EventTarget = Eventify(Empty)               │
│        │                                                │
│        └── Node, Component, Director, ...              │
│                                                         │
│   CallbacksInvoker (核心实现)                           │
│        ├── CallbackList (回调列表)                      │
│        └── CallbackInfo (回调信息)                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Eventify 混合器

`Eventify` 是一个高阶函数，用于为类添加事件处理能力。

### 源码解析

```typescript
// cocos/core/event/eventify.ts

type Constructor<T = unknown> = new (...args: any[]) => T;

// Eventify 混合器
export function Eventify<T extends Constructor>(Base: T): T & Constructor<IEventified> {
    class Eventified extends (Base as Constructor<unknown>) implements IEventified {
        // 回调调用器（延迟初始化）
        private _callbacksInvoker: CallbacksInvoker | null = null;

        // 获取回调调用器
        private get _invoker (): CallbacksInvoker {
            if (!this._callbacksInvoker) {
                this._callbacksInvoker = new CallbacksInvoker();
            }
            return this._callbacksInvoker;
        }

        // 注册事件监听
        public on (type: string, callback: AnyFunction, target?: unknown, once?: boolean): AnyFunction {
            return this._invoker.on(type, callback, target, once);
        }

        // 注册一次性监听
        public once (type: string, callback: AnyFunction, target?: unknown): AnyFunction {
            return this._invoker.on(type, callback, target, true);
        }

        // 移除事件监听
        public off (type: string, callback?: AnyFunction, target?: unknown): void {
            this._callbacksInvoker?.off(type, callback, target);
        }

        // 派发事件
        public emit (type: string, ...args: any[]): void {
            this._callbacksInvoker?.emit(type, ...args);
        }

        // 移除所有监听
        public targetOff (target: unknown): void {
            this._callbacksInvoker?.removeAll(target);
        }
    }

    return Eventified as unknown as T & Constructor<IEventified>;
}
```

### 使用示例

```typescript
// 方式一：使用 EventTarget（Eventify(Empty)）
class MyClass extends EventTarget {
    // 自动拥有 on, off, emit 等方法
}

// 方式二：使用 Eventify 混合
class MyBaseClass {
    // ... 基类实现
}

const MyEventClass = Eventify(MyBaseClass);
```

---

## EventTarget 类

`EventTarget` 是最常用的事件类，实际上是 `Eventify(Empty)` 的别名。

### 源码定义

```typescript
// cocos/core/event/event-target.ts

class Empty {}  // 空类

export class EventTarget extends Eventify(Empty) {
    // 继承 Eventify 提供的所有事件方法
}
```

### 使用示例

```typescript
// 创建事件目标
const emitter = new EventTarget();

// 注册监听
emitter.on('my-event', (data) => {
    console.log('收到事件:', data);
});

// 派发事件
emitter.emit('my-event', { message: 'Hello' });

// 移除监听
emitter.off('my-event');
```

---

## CallbacksInvoker 实现

`CallbacksInvoker` 是事件系统的核心实现，管理所有事件回调。

### 源码解析

```typescript
// cocos/core/event/callbacks-invoker.ts

// 回调信息
class CallbackInfo {
    public callback: AnyFunction | null = null;
    public target: unknown = null;
    public once = false;
}

// 回调列表
class CallbackList {
    public callbackInfos: CallbackInfo[] = [];
    public isInvoking = false;
    public containCanceled = false;
}

// 回调调用器
export class CallbacksInvoker {
    // 事件映射表
    private _callbackTable: Record<string, CallbackList> = {};

    // 对象池
    private static _callbackInfoPool: Pool<CallbackInfo> = new Pool(64);

    // 注册事件
    public on (type: string, callback: AnyFunction, target?: unknown, once = false): AnyFunction {
        // 获取或创建回调列表
        let list = this._callbackTable[type];
        if (!list) {
            list = new CallbackList();
            this._callbackTable[type] = list;
        }

        // 从对象池获取 CallbackInfo
        const info = CallbacksInvoker._callbackInfoPool.alloc();
        info.callback = callback;
        info.target = target;
        info.once = once;

        list.callbackInfos.push(info);

        return callback;
    }

    // 移除事件
    public off (type: string, callback?: AnyFunction, target?: unknown): void {
        const list = this._callbackTable[type];
        if (!list) return;

        // 遍历查找并移除
        for (let i = 0; i < list.callbackInfos.length; ++i) {
            const info = list.callbackInfos[i];
            if (
                (callback === undefined || info.callback === callback) &&
                (target === undefined || info.target === target)
            ) {
                // 标记为已取消（而不是直接删除，避免遍历时修改数组）
                info.callback = null;
                info.target = null;
                list.containCanceled = true;
            }
        }
    }

    // 派发事件
    public emit (type: string, ...args: any[]): void {
        const list = this._callbackTable[type];
        if (!list) return;

        list.isInvoking = true;

        // 遍历调用回调
        for (let i = 0; i < list.callbackInfos.length; ++i) {
            const info = list.callbackInfos[i];
            if (info.callback) {
                // 调用回调
                info.callback.apply(info.target, args);

                // 如果是一次性监听，标记移除
                if (info.once) {
                    info.callback = null;
                    info.target = null;
                    list.containCanceled = true;
                }
            }
        }

        list.isInvoking = false;

        // 清理已取消的回调
        if (list.containCanceled) {
            this._purgeCanceledCallbacks(list);
        }
    }

    // 清理已取消的回调
    private _purgeCanceledCallbacks (list: CallbackList): void {
        for (let i = list.callbackInfos.length - 1; i >= 0; --i) {
            const info = list.callbackInfos[i];
            if (!info.callback) {
                // 回收对象池
                CallbacksInvoker._callbackInfoPool.free(info);
                list.callbackInfos.splice(i, 1);
            }
        }
        list.containCanceled = false;
    }
}
```

---

## 事件分发流程

### 流程图

```
emit('event-name', arg1, arg2)
         │
         ▼
┌────────────────────────────┐
│    查找 _callbackTable     │
│    获取 CallbackList       │
└────────────┬───────────────┘
             │
             ▼
┌────────────────────────────┐
│    设置 isInvoking = true  │
└────────────┬───────────────┘
             │
             ▼
┌────────────────────────────┐
│    遍历 callbackInfos      │◄─────────────┐
└────────────┬───────────────┘              │
             │                              │
             ▼                              │
┌────────────────────────────┐              │
│    callback.apply(target)  │              │
└────────────┬───────────────┘              │
             │                              │
             ▼                              │
        ┌────────┐                          │
        │ once?  │──Yes──► 标记移除          │
        └────┬───┘                          │
             │ No                           │
             │                              │
             └──────────────────────────────┘
             │ (继续下一个回调)
             │
             ▼
┌────────────────────────────┐
│   isInvoking = false       │
└────────────┬───────────────┘
             │
             ▼
┌────────────────────────────┐
│   containCanceled?         │
│   ──Yes──► _purgeCanceled  │
└────────────────────────────┘
```

### 关键点

1. **延迟删除**：遍历过程中不直接删除元素，而是标记为 null
2. **对象池**：CallbackInfo 使用对象池复用，减少 GC
3. **一次性监听**：自动在调用后标记移除

---

## 性能优化

### 1. 对象池复用

```typescript
// 使用对象池分配 CallbackInfo
const info = CallbacksInvoker._callbackInfoPool.alloc();

// 使用完后回收
CallbacksInvoker._callbackInfoPool.free(info);
```

### 2. 延迟初始化

```typescript
// _callbacksInvoker 延迟创建
private get _invoker (): CallbacksInvoker {
    if (!this._callbacksInvoker) {
        this._callbacksInvoker = new CallbacksInvoker();
    }
    return this._callbacksInvoker;
}
```

### 3. 批量清理

```typescript
// 只在 containCanceled 时才清理
if (list.containCanceled) {
    this._purgeCanceledCallbacks(list);
}
```

---

## 节点事件冒泡

节点的事件系统支持冒泡机制：

```typescript
// cocos/scene-graph/node-event-processor.ts

export class NodeEventProcessor {
    // 分发事件（支持冒泡）
    public dispatchEvent (event: Event): void {
        // 1. 捕获阶段（从根到目标）
        this._dispatchCapturePhase(event);

        // 2. 目标阶段
        this._dispatchTargetPhase(event);

        // 3. 冒泡阶段（从目标到根）
        if (event.bubbles) {
            this._dispatchBubblePhase(event);
        }
    }
}
```

### 冒泡示例

```
      Scene (根节点)
         │
    Canvas
         │
     Button ──► 点击事件发生在这里
         │
      Label

事件传播：
  1. 捕获：Scene → Canvas → Button
  2. 目标：Button
  3. 冒泡：Button → Canvas → Scene
```

---

## 下一步

继续学习 [03-内存管理](./03-memory-management.md)。
