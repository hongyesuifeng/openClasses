# 调度器系统

本文档详细介绍 Cocos Creator 引擎的调度器系统，它是游戏循环的核心。

## 目录

- [调度器概述](#scheduler-overview)
- [Scheduler 源码解析](#scheduler-source-analysis)
- [System 基类](#system-base-class)
- [帧循环流程](#frame-loop-flow)
- [使用示例](#usage-examples)

---

## 调度器概述

### 核心文件

| 文件 | 说明 |
|------|------|
| `cocos/core/scheduler.ts` | 调度器核心实现 (~46KB) |
| `cocos/core/system.ts` | 系统基类 |

### 功能职责

调度器负责：
- 管理定时器（schedule/scheduleOnce）
- 管理帧回调（update）
- 管理系统优先级
- 处理暂停/恢复

---

## Scheduler 源码解析

### 核心数据结构

```typescript
// cocos/core/scheduler.ts

// 调度条目
interface ListEntry {
    callback: (dt: number) => void;
    target: ISchedulable;
    priority: number;
    paused: boolean;
    markedForDeletion: boolean;
}

// 定时器条目
interface HashTimerEntry {
    timers: TimerEntry[];
    target: ISchedulable;
    currentTimer: TimerEntry | null;
    currentTimerSalvaged: boolean;
    paused: boolean;
}

// 定时器
interface TimerEntry {
    interval: number;        // 间隔时间
    delay: number;           // 延迟时间
    elapsed: number;         // 已过时间
    callback: (dt: number) => void;
    target: ISchedulable;
    repeatCount: number;     // 重复次数
    timesExecuted: number;   // 已执行次数
    paused: boolean;
}
```

### Scheduler 类

```typescript
// cocos/core/scheduler.ts

export class Scheduler {
    // 更新回调列表（按优先级排序）
    private _list: ListEntry[] = [];

    // 定时器映射
    private _hashForTimers: Map<ISchedulable, HashTimerEntry> = new Map();

    // 当前时间
    private _timeScale = 1.0;

    // 注册帧回调
    public enableForTarget (target: ISchedulable): void {
        // 检查是否已注册
        for (const entry of this._list) {
            if (entry.target === target) {
                return;
            }
        }

        // 创建新条目
        const entry: ListEntry = {
            callback: target.update!.bind(target),
            target,
            priority: target.priority,
            paused: false,
            markedForDeletion: false,
        };

        // 按优先级插入
        this._list.push(entry);
        this._list.sort((a, b) => a.priority - b.priority);
    }

    // 禁用帧回调
    public disableForTarget (target: ISchedulable): void {
        for (const entry of this._list) {
            if (entry.target === target) {
                entry.markedForDeletion = true;
                break;
            }
        }
    }

    // 注册定时器
    public schedule (
        callback: (dt: number) => void,
        target: ISchedulable,
        interval: number,
        repeat: number = 0,
        delay: number = 0,
        paused: boolean = false,
    ): void {
        // 获取或创建定时器条目
        let entry = this._hashForTimers.get(target);
        if (!entry) {
            entry = {
                timers: [],
                target,
                currentTimer: null,
                currentTimerSalvaged: false,
                paused,
            };
            this._hashForTimers.set(target, entry);
        }

        // 创建定时器
        const timer: TimerEntry = {
            interval,
            delay,
            elapsed: -delay,  // 负数表示延迟中
            callback,
            target,
            repeatCount: repeat,
            timesExecuted: 0,
            paused,
        };

        entry.timers.push(timer);
    }

    // 取消定时器
    public unschedule (callback: (dt: number) => void, target: ISchedulable): void {
        const entry = this._hashForTimers.get(target);
        if (!entry) return;

        // 查找并移除
        for (let i = 0; i < entry.timers.length; ++i) {
            if (entry.timers[i].callback === callback) {
                entry.timers.splice(i, 1);
                break;
            }
        }
    }

    // 主更新函数
    public update (dt: number): void {
        // 应用时间缩放
        dt *= this._timeScale;

        // 1. 更新帧回调
        this._updateList(dt);

        // 2. 更新定时器
        this._updateTimers(dt);

        // 3. 清理标记删除的条目
        this._cleanup();
    }

    // 更新帧回调列表
    private _updateList (dt: number): void {
        for (const entry of this._list) {
            if (entry.paused || entry.markedForDeletion) {
                continue;
            }
            entry.callback(dt);
        }
    }

    // 更新定时器
    private _updateTimers (dt: number): void {
        for (const [, entry] of this._hashForTimers) {
            if (entry.paused) continue;

            for (const timer of entry.timers) {
                if (timer.paused) continue;

                timer.elapsed += dt;

                // 检查是否到达触发时间
                if (timer.elapsed >= timer.interval) {
                    timer.elapsed = 0;
                    timer.timesExecuted++;

                    // 执行回调
                    timer.callback(dt);

                    // 检查重复次数
                    if (timer.repeatCount > 0 && timer.timesExecuted >= timer.repeatCount) {
                        timer.markedForDeletion = true;
                    }
                }
            }
        }
    }

    // 清理
    private _cleanup (): void {
        // 清理帧回调列表
        this._list = this._list.filter(entry => !entry.markedForDeletion);

        // 清理定时器
        for (const [, entry] of this._hashForTimers) {
            entry.timers = entry.timers.filter(timer => !timer.markedForDeletion);
        }
    }
}
```

---

## System 基类

所有引擎系统（动画、物理等）都继承自 `System` 基类。

### 源码解析

```typescript
// cocos/core/system.ts

// 系统优先级枚举
export const enum SystemPriority {
    LOW = 0,
    MEDIUM = 100,
    HIGH = 200,
    SCHEDULER = 300,
}

// 系统接口
export interface ISystem extends ISchedulable {
    priority: number;
    init?(): void;
    update?(dt: number): void;
    postUpdate?(dt: number): void;
}

// 系统基类
export abstract class System implements ISystem {
    public abstract get priority (): number;

    // 初始化
    public init? (): void;

    // 每帧更新
    public update? (dt: number): void;

    // 延迟更新
    public postUpdate? (dt: number): void;
}
```

### 系统示例

```typescript
// cocos/physics/framework/physics-system.ts

export class PhysicsSystem extends System {
    public get priority (): number {
        return SystemPriority.HIGH;
    }

    public update (dt: number): void {
        // 物理模拟更新
        this._updatePhysicsWorld(dt);
    }
}

// cocos/animation/animation-manager.ts

export class AnimationManager extends System {
    public get priority (): number {
        return SystemPriority.MEDIUM;
    }

    public update (dt: number): void {
        // 动画更新
        this._updateAnimations(dt);
    }
}
```

---

## 帧循环流程

### Director 中的调度

```typescript
// cocos/game/director.ts

export class Director {
    // 主循环
    public tick (dt: number): void {
        // 1. 物理系统更新
        PhysicsSystem.instance.update(dt);

        // 2. 动画系统更新
        AnimationManager.instance.update(dt);

        // 3. 用户脚本更新（通过调度器）
        Scheduler.instance.update(dt);

        // 4. 延迟更新
        this._lateUpdate(dt);

        // 5. 渲染
        Root.instance.frameMove(dt);
    }
}
```

### 帧循环流程图

```
┌─────────────────────────────────────────────────────────┐
│                    Main Loop                             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  requestAnimationFrame                                   │
│         │                                               │
│         ▼                                               │
│  ┌─────────────────┐                                    │
│  │   Game.tick()   │                                    │
│  └────────┬────────┘                                    │
│           │                                             │
│           ▼                                             │
│  ┌─────────────────────────────────────────────────┐   │
│  │              Director.tick(dt)                   │   │
│  ├─────────────────────────────────────────────────┤   │
│  │                                                 │   │
│  │  1. PhysicsSystem.update(dt)                    │   │
│  │           │                                     │   │
│  │           ▼                                     │   │
│  │  2. AnimationManager.update(dt)                 │   │
│  │           │                                     │   │
│  │           ▼                                     │   │
│  │  3. Scheduler.update(dt)                        │   │
│  │     ├── 用户 update() 回调                       │   │
│  │     └── 定时器回调                               │   │
│  │           │                                     │   │
│  │           ▼                                     │   │
│  │  4. 组件 lateUpdate()                           │   │
│  │           │                                     │   │
│  │           ▼                                     │   │
│  │  5. Root.frameMove(dt) ─── 渲染                 │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 使用示例

### 1. 组件中使用 update

```typescript
export class MyComponent extends Component {
    // 自动注册到调度器
    public update (dt: number): void {
        // 每帧调用
        console.log('delta time:', dt);
    }

    public lateUpdate (dt: number): void {
        // 延迟更新
    }
}
```

### 2. 使用定时器

```typescript
export class MyComponent extends Component {
    private _timer = 0;

    protected onLoad (): void {
        // 每秒调用一次
        this.schedule(this._onTimer, 1);

        // 2秒后调用一次
        this.scheduleOnce(this._onDelay, 2);
    }

    private _onTimer (): void {
        console.log('每秒触发');
    }

    private _onDelay (): void {
        console.log('2秒后触发');
    }

    protected onDestroy (): void {
        // 取消所有定时器
        this.unscheduleAllCallbacks();
    }
}
```

### 3. 使用调度器优先级

```typescript
// 创建高优先级系统
class MyHighPrioritySystem extends System {
    public get priority (): number {
        return SystemPriority.HIGH;
    }

    public update (dt: number): void {
        // 在普通组件之前执行
    }
}
```

---

## 下一步

继续学习 [05-序列化](./05-serialization.md)。
