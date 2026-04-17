# 内存管理

本文档详细介绍 Cocos Creator 引擎的内存管理机制，重点介绍对象池的使用。

## 目录

- [内存管理概述](#memory-overview)
- [Pool 对象池](#pool-object-pool)
- [RecyclePool 回收池](#recyclepool)
- [CachedArray 缓存数组](#cachedarray)
- [使用场景](#use-cases)
- [最佳实践](#best-practices)

---

## 内存管理概述

### 核心文件

| 文件 | 说明 |
|------|------|
| `cocos/core/memop/pool.ts` | 通用对象池 |
| `cocos/core/memop/recycle-pool.ts` | 可回收池 |
| `cocos/core/memop/cached-array.ts` | 缓存数组 |

### 为什么需要对象池？

在游戏循环中频繁创建和销毁对象会导致：
- ❌ 频繁 GC（垃圾回收），造成卡顿
- ❌ 内存碎片化
- ❌ CPU 时间浪费

使用对象池可以：
- ✅ 复用对象，减少 GC
- ✅ 预分配内存，提高性能
- ✅ 控制内存使用上限

---

## Pool 对象池

### 源码解析

```typescript
// cocos/core/memop/pool.ts

export class Pool<T> {
    // 可用对象列表
    private _freelist: T[] = [];

    // 对象工厂函数
    private _factory: () => T;

    // 初始大小
    private _initSize: number;

    constructor (factory: () => T, size: number) {
        this._factory = factory;
        this._initSize = size;

        // 预分配对象
        for (let i = 0; i < size; ++i) {
            this._freelist.push(this._factory());
        }
    }

    // 分配一个对象
    public alloc (): T {
        if (this._freelist.length > 0) {
            // 从池中取出
            return this._freelist.pop()!;
        }
        // 池为空，创建新对象
        return this._factory();
    }

    // 回收一个对象
    public free (obj: T): void {
        // 可以在这里重置对象状态
        this._freelist.push(obj);
    }

    // 批量回收
    public freeArray (objs: T[]): void {
        for (let i = 0; i < objs.length; ++i) {
            this._freelist.push(objs[i]);
        }
    }

    // 获取池大小
    public get size (): number {
        return this._freelist.length;
    }

    // 收缩池到指定大小
    public shrink (size: number): void {
        if (size < this._freelist.length) {
            this._freelist.length = size;
        }
    }

    // 清空池
    public clear (): void {
        this._freelist.length = 0;
    }

    // 重置池到初始大小
    public reset (): void {
        this._freelist.length = 0;
        for (let i = 0; i < this._initSize; ++i) {
            this._freelist.push(this._factory());
        }
    }
}
```

### 使用示例

```typescript
// 创建 Vec3 对象池
const vec3Pool = new Pool<Vec3>(() => new Vec3(), 100);

// 分配对象
const v = vec3Pool.alloc();

// 使用对象
Vec3.set(v, 1, 2, 3);

// 回收对象
vec3Pool.free(v);
```

---

## RecyclePool

`RecyclePool` 是一种特殊的对象池，支持批量分配和重置。

### 源码解析

```typescript
// cocos/core/memop/recycle-pool.ts

export class RecyclePool<T> {
    // 对象数组
    private _data: T[] = [];

    // 工厂函数
    private _factory: () => T;

    // 重置函数
    private _recycleCb: ((obj: T) => void) | null = null;

    constructor (factory: () => T, size: number, recycleCb?: (obj: T) => void) {
        this._factory = factory;
        this._recycleCb = recycleCb || null;

        // 预分配
        for (let i = 0; i < size; ++i) {
            this._data.push(this._factory());
        }
    }

    // 分配对象（返回引用）
    public alloc (): T {
        if (this._data.length === 0) {
            return this._factory();
        }
        return this._data.pop()!;
    }

    // 回收对象
    public free (obj: T): void {
        if (this._recycleCb) {
            this._recycleCb(obj);
        }
        this._data.push(obj);
    }

    // 回收所有对象
    public freeAll (): void {
        // 由外部代码处理，池只负责管理
    }

    // 收缩到指定大小
    public shrink (size: number): void {
        if (size < this._data.length) {
            this._data.length = size;
        }
    }
}
```

---

## CachedArray

`CachedArray` 是一个支持自动收缩的缓存数组。

### 源码解析

```typescript
// cocos/core/memop/cached-array.ts

export class CachedArray<T> {
    // 数据数组
    public array: T[] = [];

    // 实际元素数量
    public length = 0;

    // 最大缓存大小
    private _cacheSize: number;

    constructor (cacheSize: number) {
        this._cacheSize = cacheSize;
    }

    // 添加元素
    public push (item: T): void {
        this.array[this.length++] = item;
    }

    // 弹出元素
    public pop (): T | undefined {
        return this.array[--this.length];
    }

    // 获取元素
    public get (idx: number): T {
        return this.array[idx];
    }

    // 清空（不释放内存）
    public clear (): void {
        this.length = 0;
    }

    // 强制收缩
    public trim (): void {
        if (this.array.length > this._cacheSize) {
            this.array.length = this._cacheSize;
        }
    }

    // 重置
    public reset (): void {
        this.length = 0;
        if (this.array.length > this._cacheSize) {
            this.array.length = this._cacheSize;
        }
    }
}
```

### 使用示例

```typescript
// 创建缓存数组
const cachedArray = new CachedArray<number>(100);

// 添加元素
cachedArray.push(1);
cachedArray.push(2);
cachedArray.push(3);

// 遍历
for (let i = 0; i < cachedArray.length; ++i) {
    console.log(cachedArray.get(i));
}

// 清空（保留内存）
cachedArray.clear();
```

---

## 使用场景

### 1. 渲染系统

```typescript
// cocos/2d/renderer/batcher-2d.ts

// 使用对象池管理渲染数据
private _handlePool: Pool<UIRenderData> = new Pool(() => new UIRenderData(), 128);

// 分配渲染数据
const data = this._handlePool.alloc();

// 使用完后回收
this._handlePool.free(data);
```

### 2. 事件系统

```typescript
// cocos/core/event/callbacks-invoker.ts

// 回调信息对象池
private static _callbackInfoPool: Pool<CallbackInfo> = new Pool(64);
```

### 3. 碰撞检测

```typescript
// cocos/physics/physics-world.ts

// 碰撞结果缓存
private _contacts: CachedArray<Contact> = new CachedArray(64);
```

---

## 最佳实践

### 1. 何时使用对象池？

| 场景 | 是否推荐 | 说明 |
|------|----------|------|
| 每帧创建/销毁的对象 | ✅ 推荐 | 子弹、粒子等 |
| 频繁使用的临时对象 | ✅ 推荐 | Vec3、Mat4 等 |
| 长期存在的对象 | ❌ 不推荐 | UI 节点、场景对象 |
| 很少创建的对象 | ❌ 不推荐 | 配置对象 |

### 2. 对象池大小选择

```typescript
// 根据实际使用量估算
// 太小：频繁创建新对象
// 太大：浪费内存

// 例如：屏幕上最多同时 100 个子弹
const bulletPool = new Pool(() => new Bullet(), 100);
```

### 3. 对象重置

```typescript
// 回收时重置对象状态
class MyPool extends Pool<MyObject> {
    public free (obj: MyObject): void {
        // 重置状态
        obj.reset();
        super.free(obj);
    }
}
```

### 4. 避免内存泄漏

```typescript
// ❌ 错误：忘记回收
const v = pool.alloc();
// ... 使用后忘记 free

// ✅ 正确：使用完立即回收
const v = pool.alloc();
try {
    // 使用 v
} finally {
    pool.free(v);
}
```

---

## 下一步

继续学习 [04-调度器](./04-scheduler.md)。
