# 组件系统详解

本文档深入分析 Cocos Creator 的组件系统，这是组件化架构的核心实现。

## 目录

- [Component 基类](#component-base-class)
- [生命周期](#lifecycle)
- [组件调度](#component-scheduling)
- [组件通信](#component-communication)
- [常见组件实现](#common-components)

---

## Component 基类

### 文件位置

- `cocos/scene-graph/component.ts`

### 类定义

```typescript
@ccclass('cc.Component')
export class Component extends CCObject implements ISchedulable {
    // 引用所属节点
    @property
    node: Node = null!;

    // 是否启用
    @property
    _enabled: boolean = true;

    // 是否在编辑器中运行
    _isOnLoadCalled: boolean = false;
}
```

### 核心属性

```typescript
// 是否启用
public get enabled (): boolean {
    return this._enabled;
}

public set enabled (value: boolean) {
    if (this._enabled === value) return;

    this._enabled = value;

    // 如果节点在层级中激活，触发回调
    if (this.node.activeInHierarchy) {
        if (value) {
            this._onEnabled();
        } else {
            this._onDisabled();
        }
    }
}

// 是否激活（节点激活 && 组件启用）
public get isActiveAndEnabled (): boolean {
    return this._enabled && this.node.activeInHierarchy;
}

// 获取组件名称
public get name (): string {
    return this.node ? this.node.name + '::' + this.constructor.name : this.constructor.name;
}
```

---

## 生命周期

### 生命周期流程图

```
┌─────────────────────────────────────────────────────────────┐
│                     组件生命周期                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  节点添加到场景                                              │
│       │                                                     │
│       ▼                                                     │
│  ┌─────────────┐                                            │
│  │   onLoad    │  ─── 初始化，获取其他组件引用              │
│  └──────┬──────┘                                            │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────┐                                            │
│  │  onEnable   │  ─── 组件启用时（可能多次调用）            │
│  └──────┬──────┘                                            │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────┐                                            │
│  │   start     │  ─── 第一次 update 之前（只调用一次）      │
│  └──────┬──────┘                                            │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────┐     ┌─────────────────┐                    │
│  │   update    │ ──► │  (每帧循环)      │                    │
│  └──────┬──────┘     └─────────────────┘                    │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────┐                                            │
│  │ lateUpdate  │  ─── 所有 update 完成后                    │
│  └──────┬──────┘                                            │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────┐                                            │
│  │  onDisable  │  ─── 组件禁用时                            │
│  └──────┬──────┘                                            │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────┐                                            │
│  │  onDestroy  │  ─── 组件销毁时                            │
│  └─────────────┘                                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 生命周期方法

```typescript
export class Component extends CCObject {
    // 初始化（只调用一次）
    protected onLoad (): void {}

    // 启用（可能多次调用）
    protected onEnable (): void {}

    // 开始（只调用一次，在第一次 update 之前）
    protected start (): void {}

    // 每帧更新
    protected update (dt: number): void {}

    // 延迟更新
    protected lateUpdate (dt: number): void {}

    // 禁用（可能多次调用）
    protected onDisable (): void {}

    // 销毁（只调用一次）
    protected onDestroy (): void {}
}
```

### 调用时机

| 方法 | 调用时机 | 调用次数 | 用途 |
|------|----------|----------|------|
| onLoad | 节点激活时 | 1 | 初始化、获取引用 |
| onEnable | 组件启用时 | N | 注册事件、开始动画 |
| start | onLoad 之后 | 1 | 需要等待其他组件初始化的逻辑 |
| update | 每帧 | N | 每帧逻辑 |
| lateUpdate | update 之后 | N | 依赖其他 update 的逻辑 |
| onDisable | 组件禁用时 | N | 取消事件注册 |
| onDestroy | 组件销毁时 | 1 | 清理资源 |

---

## 组件调度

### ComponentScheduler

```typescript
// cocos/scene-graph/component-scheduler.ts

export class ComponentScheduler {
    // 不同阶段的组件列表
    private _startList: Component[] = [];
    private _updateList: Component[] = [];
    private _lateUpdateList: Component[] = [];

    // 添加组件到调度列表
    public enableComp (comp: Component): void {
        // 添加到 start 列表
        if (comp.start) {
            this._startList.push(comp);
        }

        // 添加到 update 列表
        if (comp.update) {
            this._updateList.push(comp);
        }

        // 添加到 lateUpdate 列表
        if (comp.lateUpdate) {
            this._lateUpdateList.push(comp);
        }
    }

    // 从调度列表移除
    public disableComp (comp: Component): void {
        // 从各列表中移除
        this._removeFromList(this._startList, comp);
        this._removeFromList(this._updateList, comp);
        this._removeFromList(this._lateUpdateList, comp);
    }

    // 执行 start 阶段
    public startPhase (): void {
        const list = this._startList;
        for (let i = 0; i < list.length; ++i) {
            const comp = list[i];
            if (comp.enabled && comp.node.activeInHierarchy) {
                comp.start!();
            }
        }
        list.length = 0;  // 清空
    }

    // 执行 update 阶段
    public updatePhase (dt: number): void {
        const list = this._updateList;
        for (let i = 0; i < list.length; ++i) {
            const comp = list[i];
            if (comp.enabled && comp.node.activeInHierarchy) {
                comp.update!(dt);
            }
        }
    }

    // 执行 lateUpdate 阶段
    public lateUpdatePhase (dt: number): void {
        const list = this._lateUpdateList;
        for (let i = 0; i < list.length; ++i) {
            const comp = list[i];
            if (comp.enabled && comp.node.activeInHierarchy) {
                comp.lateUpdate!(dt);
            }
        }
    }
}
```

---

## 组件通信

### 获取其他组件

```typescript
export class Component extends CCObject {
    // 获取同节点上的组件
    public getComponent <T extends Component>(type: Constructor<T>): T | null {
        return this.node.getComponent(type);
    }

    // 获取同节点上的组件（包含子类）
    public getComponents <T extends Component>(type: Constructor<T>): T[] {
        return this.node.getComponents(type);
    }

    // 获取子节点上的组件
    public getComponentInChildren <T extends Component>(type: Constructor<T>): T | null {
        return this.node.getComponentInChildren(type);
    }

    // 获取所有子节点上的组件
    public getComponentsInChildren <T extends Component>(type: Constructor<T>): T[] {
        return this.node.getComponentsInChildren(type);
    }
}
```

### Node 中的组件管理

```typescript
// cocos/scene-graph/node.ts

export class Node extends CCObject {
    // 添加组件
    public addComponent <T extends Component>(type: Constructor<T>): T {
        // 1. 创建组件实例
        const component = new type();

        // 2. 设置节点引用
        component.node = this;

        // 3. 添加到列表
        this._components.push(component);

        // 4. 如果节点激活，触发 onLoad
        if (this.activeInHierarchy) {
            component._onLoad();
            if (component.enabled) {
                component._onEnabled();
            }
        }

        return component;
    }

    // 获取组件
    public getComponent <T extends Component>(type: Constructor<T>): T | null {
        for (const comp of this._components) {
            if (comp instanceof type) {
                return comp as T;
            }
        }
        return null;
    }

    // 移除组件
    public removeComponent (component: Component): void {
        const index = this._components.indexOf(component);
        if (index !== -1) {
            this._components.splice(index, 1);
            component.destroy();
        }
    }
}
```

---

## 常见组件实现

### Sprite 组件示例

```typescript
// cocos/2d/framework/sprite.ts

@ccclass('cc.Sprite')
export class Sprite extends Renderable2D {
    @property(SpriteFrame)
    _spriteFrame: SpriteFrame | null = null;

    @property
    _type: SpriteFrame.Type = Type.SIMPLE;

    @property
    _sizeMode: SizeMode = SizeMode.CUSTOM;

    // 精灵帧变化时更新渲染
    public set spriteFrame (value: SpriteFrame | null) {
        this._spriteFrame = value;
        this._applySpriteFrame();
    }

    protected onLoad (): void {
        this._applySpriteFrame();
    }

    private _applySpriteFrame (): void {
        if (!this._spriteFrame) return;

        // 更新顶点数据
        this._updateMaterial();
        this._renderDataDirty = true;
    }
}
```

### 自定义组件示例

```typescript
import { _decorator, Component, Node, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PlayerController')
export class PlayerController extends Component {
    @property
    speed = 5;

    @property(Node)
    target: Node | null = null;

    private _isMoving = false;

    protected onLoad (): void {
        // 初始化
        this._isMoving = false;
    }

    protected start (): void {
        // 可以安全地获取其他组件
        const animation = this.getComponent(Animation);
        if (animation) {
            animation.play('idle');
        }
    }

    protected update (dt: number): void {
        if (!this._isMoving) return;

        // 移动逻辑
        const pos = this.node.position;
        this.node.setPosition(
            pos.x + this.speed * dt,
            pos.y,
            pos.z
        );
    }

    protected onEnable (): void {
        // 注册事件
        input.on(Input.EventType.KEY_DOWN, this._onKeyDown, this);
    }

    protected onDisable (): void {
        // 取消事件
        input.off(Input.EventType.KEY_DOWN, this._onKeyDown, this);
    }

    protected onDestroy (): void {
        // 清理资源
    }

    private _onKeyDown (event: EventKeyboard): void {
        if (event.keyCode === KeyCode.SPACE) {
            this._isMoving = !this._isMoving;
        }
    }
}
```

---

## 最佳实践

### 1. 正确使用生命周期

```typescript
export class MyComponent extends Component {
    private _otherComp: OtherComponent | null = null;

    protected onLoad (): void {
        // ✅ 在 onLoad 获取引用
        this._otherComp = this.getComponent(OtherComponent);
    }

    protected start (): void {
        // ✅ 在 start 调用其他组件的方法
        // 因为此时所有组件的 onLoad 都已执行
        this._otherComp?.doSomething();
    }
}
```

### 2. 避免在 update 中频繁操作

```typescript
// ❌ 每帧获取组件
protected update (dt: number): void {
    const comp = this.getComponent(OtherComponent);
    comp.doSomething();
}

// ✅ 缓存引用
private _comp: OtherComponent | null = null;

protected onLoad (): void {
    this._comp = this.getComponent(OtherComponent);
}

protected update (dt: number): void {
    this._comp?.doSomething();
}
```

### 3. 正确清理资源

```typescript
protected onDestroy (): void {
    // 取消所有事件
    this.node.targetOff(this);

    // 释放资源
    if (this._texture) {
        this._texture.decRef();
    }
}
```

---

## 下一步

继续学习 [03-场景生命周期](./03-scene-lifecycle.md)。
