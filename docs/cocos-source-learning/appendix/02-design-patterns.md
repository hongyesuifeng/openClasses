# 设计模式总结

本文档总结 Cocos Creator 引擎中使用的设计模式。

## 目录

- [组件模式](#component-pattern)
- [观察者模式](#observer-pattern)
- [对象池模式](#object-pool-pattern)
- [策略模式](#strategy-pattern)
- [工厂模式](#factory-pattern)
- [单例模式](#singleton-pattern)
- [装饰器模式](#decorator-pattern)

---

## 组件模式

### 概述

组件模式是 Cocos Creator 的核心架构模式。节点（Node）作为容器，组件（Component）提供功能。

### 源码实现

```typescript
// cocos/scene-graph/node.ts

export class Node extends CCObject {
    // 组件列表
    private _components: Component[] = [];

    // 添加组件
    public addComponent<T extends Component>(type: Constructor<T>): T {
        const component = new type();
        component.node = this;
        this._components.push(component);
        return component;
    }

    // 获取组件
    public getComponent<T extends Component>(type: Constructor<T>): T | null {
        for (const comp of this._components) {
            if (comp instanceof type) return comp;
        }
        return null;
    }
}

// cocos/scene-graph/component.ts

export class Component extends CCObject {
    // 引用所属节点
    public node: Node;

    // 生命周期方法
    protected onLoad(): void {}
    protected start(): void {}
    protected update(dt: number): void {}
    protected onDestroy(): void {}
}
```

### 优点

- 功能可组合，灵活扩展
- 降低类之间的耦合
- 代码复用性高

---

## 观察者模式

### 概述

事件系统基于观察者模式，实现对象间的松耦合通信。

### 源码实现

```typescript
// cocos/core/event/eventify.ts

export function Eventify<T extends Constructor>(Base: T) {
    return class Eventified extends Base {
        private _callbacksInvoker: CallbacksInvoker;

        public on(type: string, callback: Function, target?: any): Function {
            return this._callbacksInvoker.on(type, callback, target);
        }

        public off(type: string, callback?: Function, target?: any): void {
            this._callbacksInvoker.off(type, callback, target);
        }

        public emit(type: string, ...args: any[]): void {
            this._callbacksInvoker.emit(type, ...args);
        }
    };
}

// 使用示例
class MyNode extends Eventify(BaseNode) {}

const node = new MyNode();
node.on('click', () => console.log('clicked'));
node.emit('click');
```

### 优点

- 解耦事件发送者和接收者
- 支持一对多的通信
- 动态注册和取消监听

---

## 对象池模式

### 概述

对象池通过复用对象来优化内存分配和垃圾回收。

### 源码实现

```typescript
// cocos/core/memop/pool.ts

export class Pool<T> {
    private _freelist: T[] = [];
    private _factory: () => T;

    constructor(factory: () => T, size: number) {
        this._factory = factory;
        // 预分配对象
        for (let i = 0; i < size; ++i) {
            this._freelist.push(factory());
        }
    }

    public alloc(): T {
        if (this._freelist.length > 0) {
            return this._freelist.pop()!;
        }
        return this._factory();
    }

    public free(obj: T): void {
        this._freelist.push(obj);
    }
}

// 使用示例
const vec3Pool = new Pool<Vec3>(() => new Vec3(), 100);
const v = vec3Pool.alloc();
// 使用 v...
vec3Pool.free(v);
```

### 优点

- 减少 GC 压力
- 提高性能
- 控制内存使用

---

## 策略模式

### 概述

策略模式用于实现多种可互换的算法或行为，如不同的物理引擎后端。

### 源码实现

```typescript
// cocos/physics/spec/i-physics-world.ts

export interface IPhysicsWorld {
    step(deltaTime: number): void;
    raycast(worldRay: Ray): PhysicsRayResult[];
    // ...
}

// cocos/physics/cannon/cannon-world.ts

export class CannonWorld implements IPhysicsWorld {
    public step(deltaTime: number): void {
        // Cannon.js 实现
    }
}

// cocos/physics/bullet/bullet-world.ts

export class BulletWorld implements IPhysicsWorld {
    public step(deltaTime: number): void {
        // Bullet 实现
    }
}

// cocos/physics/framework/physics-system.ts

export class PhysicsSystem extends System {
    private _world: IPhysicsWorld;

    constructor() {
        // 根据配置选择策略
        if (config.engine === 'cannon') {
            this._world = new CannonWorld();
        } else {
            this._world = new BulletWorld();
        }
    }
}
```

### 优点

- 算法可独立变化
- 易于扩展新策略
- 运行时切换策略

---

## 工厂模式

### 概述

工厂模式用于创建对象，封装实例化逻辑。

### 源码实现

```typescript
// cocos/asset/asset-manager/factory.ts

export class Factory {
    private static _creators: Map<string, (data: any) => Asset> = new Map();

    // 注册创建器
    public static register(type: string, creator: (data: any) => Asset): void {
        Factory._creators.set(type, creator);
    }

    // 创建资源
    public static create(type: string, data: any): Asset | null {
        const creator = Factory._creators.get(type);
        if (creator) {
            return creator(data);
        }
        return null;
    }
}

// 使用示例
Factory.register('Texture', (data) => new Texture(data));
const texture = Factory.create('Texture', textureData);
```

### 优点

- 封装创建逻辑
- 易于扩展新类型
- 集中管理对象创建

---

## 单例模式

### 概述

单例模式确保一个类只有一个实例，如 Director、AssetManager。

### 源码实现

```typescript
// cocos/game/director.ts

export class Director {
    private static _instance: Director;

    public static get instance(): Director {
        if (!Director._instance) {
            Director._instance = new Director();
        }
        return Director._instance;
    }

    private constructor() {
        // 私有构造函数
    }
}

// 使用示例
director.loadScene('main');
```

### 优点

- 全局访问点
- 延迟初始化
- 控制实例数量

---

## 装饰器模式

### 概述

装饰器用于动态添加功能，TypeScript 原生支持装饰器语法。

### 源码实现

```typescript
// cocos/core/data/decorators/ccclass.ts

export function ccclass(name?: string): ClassDecorator {
    return function (target: Function) {
        // 注册类到引擎
        js.setClassId(name || target.name, target);
    };
}

// cocos/core/data/decorators/property.ts

export function property(options?: PropertyOptions): PropertyDecorator {
    return function (target: any, key: string) {
        // 注册属性元数据
        const ctor = target.constructor;
        if (!ctor.__props__) {
            ctor.__props__ = [];
        }
        ctor.__props__.push(key);
    };
}

// 使用示例
@ccclass('Player')
export class Player extends Component {
    @property
    public speed = 10;

    @property(Node)
    public target: Node | null = null;
}
```

### 优点

- 声明式语法
- 元数据管理
- 代码简洁

---

## 模式总结

| 模式 | 应用场景 | 核心文件 |
|------|----------|----------|
| 组件模式 | Node-Component 架构 | `node.ts`, `component.ts` |
| 观察者模式 | 事件系统 | `eventify.ts` |
| 对象池模式 | 内存管理 | `pool.ts` |
| 策略模式 | 多后端适配 | `physics/spec/` |
| 工厂模式 | 资源创建 | `factory.ts` |
| 单例模式 | 全局管理器 | `director.ts`, `game.ts` |
| 装饰器模式 | 元数据注册 | `decorators/` |

---

## 学习建议

1. **组件模式**是核心，务必深入理解
2. **观察者模式**用于解耦，在事件系统中大量使用
3. **对象池模式**对性能优化至关重要
4. 理解这些模式后，阅读源码会更轻松
