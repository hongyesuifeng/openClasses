# 技术原理：游戏引擎核心基础

> 核心基础层是整个引擎的地基。在阅读 Cocos Creator 的数学库、事件系统、内存管理、调度器和序列化源码之前，先理解它们背后的计算机科学原理。

---

## 目录

- [1. 线性代数与游戏数学](#1-线性代数与游戏数学)
- [2. 事件驱动架构](#2-事件驱动架构)
- [3. 内存管理与对象池](#3-内存管理与对象池)
- [4. 调度器与时间管理](#4-调度器与时间管理)
- [5. 序列化原理](#5-序列化原理)

---

## 1. 线性代数与游戏数学

### 为什么游戏引擎需要大量数学

游戏世界本质上是一个**三维数学空间**。游戏中的每一个视觉元素都通过数学描述：

| 游戏概念 | 数学表示 | Cocos 类型 |
|---------|---------|-----------|
| 物体位置 | 三维向量 | `Vec3` |
| 物体旋转 | 四元数 | `Quat` |
| 物体缩放 | 三维向量 | `Vec3` |
| 空间变换 | 4x4 矩阵 | `Mat4` |
| 颜色 | 四维向量 (RGBA) | `Color` |
| 视野范围 | 锥体（Frustum） | `geometry.Frustum` |

### 向量（Vector）

#### 向量的几何意义

向量有两个核心含义：
- **位置**：空间中的一个点 `(x, y, z)`
- **方向**：从一个点指向另一个点的箭头

在游戏中最常见的运算：

```
// 点乘 (Dot Product) — 判断两个方向的接近程度
a · b = |a| × |b| × cos(θ)

用途：
  - 判断敌人在玩家前方还是后方（点乘 > 0 前方，< 0 后方）
  - 计算光照强度（法线与光线方向的点乘）
  - 计算投影距离

// 叉乘 (Cross Product) — 获得垂直于两个向量的第三个向量
a × b = 垂直于 a 和 b 的向量

用途：
  - 计算法线向量
  - 判断点在向量的左侧还是右侧
  - 计算力矩
```

> 源码中 `cocos/core/math/vec3.ts` 实现了 `dot()` 和 `cross()` 方法，核心就是这些公式

#### 向量归一化

```
normalize(v) = v / |v|

用途：将向量长度变为 1，只保留方向信息
场景：计算移动方向、光照方向
```

### 矩阵与空间变换（Matrix & Transform）

#### 为什么用矩阵

矩阵是描述空间变换的统一方式。**一个 4x4 矩阵可以同时表示平移、旋转和缩放**：

```
┌──────────────────────────────────────────┐
│  4x4 变换矩阵的结构（列主序）             │
│                                          │
│  │ Rx  Ry  Rz  Tx │   Rx,Ry,Rz = 旋转   │
│  │ Rx  Ry  Rz  Ty │   Sx,Sy,Sz = 缩放   │
│  │ Rx  Ry  Rz  Tz │   Tx,Ty,Tz = 平移   │
│  │  0   0   0   1 │   底行始终为 0,0,0,1 │
└──────────────────────────────────────────┘
```

#### 为什么是 4x4 而不是 3x3

三维向量只有三个分量，但要用矩阵表示**平移**，需要齐次坐标：

```
3x3 矩阵只能表示：旋转 + 缩放（线性变换）
4x4 矩阵可以表示：旋转 + 缩放 + 平移（仿射变换）

齐次坐标：将 (x, y, z) 扩展为 (x, y, z, 1)
矩阵乘法自然包含平移分量
```

#### 变换级联

场景图中的节点形成父子关系，子节点的世界变换 = 父节点变换 × 子节点本地变换：

```
世界空间 ← 父节点矩阵 × ... × 父父节点矩阵 × 本地矩阵
```

这就是为什么 `Node` 类中有 `getWorldMatrix()` 方法——它需要沿着父节点链一直向上乘：

```
Node.getWorldMatrix():
    if (dirty) {
        worldMatrix = parent.worldMatrix × localMatrix
    }
    return worldMatrix
```

> 源码中 `node.ts` 的 `_mulMat4` 和 `updateWorldTransform` 方法实现了这种级联计算。**脏标记（dirty flag）** 机制避免每帧重复计算。

### 四元数（Quaternion）

#### 为什么不用欧拉角

欧拉角 `(pitch, yaw, roll)` 直观但有致命缺陷：

| 问题 | 说明 |
|------|------|
| **万向节死锁** | 当 pitch = ±90° 时，yaw 和 roll 旋转会重合，丢失一个自由度 |
| **插值不平滑** | 角度从 350° 到 10° 会绕远路（340°）而不是走捷径（20°） |
| **旋转顺序依赖** | 先绕 X 轴再绕 Y 轴 ≠ 先绕 Y 轴再绕 X 轴 |

#### 四元数如何解决

四元数 `q = w + xi + yj + zk` 用四个数表示任意 3D 旋转：

```
优势：
  - 没有万向节死锁
  - 球面线性插值（Slerp）平滑自然
  - 旋转合成简单（四元数乘法）
  - 存储紧凑（4 个 float vs 矩阵的 16 个）

在 Cocos 中：
  q = new Quat(x, y, z, w)
  Node.rotation 属性就是 Quat 类型
```

> 源码 `cocos/core/math/quat.ts` 实现了四元数的所有运算。特别注意 `slerp()` 方法（球面线性插值），它是动画旋转平滑过渡的基础。

---

## 2. 事件驱动架构

### 观察者模式（Observer Pattern）

事件系统的本质是**观察者模式**，也称为发布-订阅模式：

```
┌─────────────┐     事件触发      ┌─────────────────────┐
│   Publisher  │ ───────────────► │   Subscriber A      │
│   (发布者)    │                 │   (观察者 A)         │
└─────────────┘                  ├─────────────────────┤
       │                         │   Subscriber B      │
       │  通知所有订阅者           │   (观察者 B)         │
       └────────────────────────►├─────────────────────┤
                                 │   Subscriber C      │
                                 │   (观察者 C)         │
                                 └─────────────────────┘
```

### 为什么游戏引擎使用事件系统

**解耦**——让模块之间不需要直接引用：

```
// 没有事件系统：直接引用，紧耦合
class Player {
    enemy: Enemy;
    takeDamage() {
        this.enemy.onPlayerDamaged();  // 直接调用
        this.ui.updateHealthBar();      // 直接调用
        this.audio.playHitSound();      // 直接调用
    }
}

// 使用事件系统：松耦合
class Player {
    takeDamage() {
        this.emit('player-damaged', damage);  // 只管发事件
    }
}
// 各模块自己监听
enemy.on('player-damaged', ...);
ui.on('player-damaged', ...);
audio.on('player-damaged', ...);
```

### Cocos 事件系统的三层设计

```
CallbacksInvoker           ← 最底层：维护事件名 → 回调函数列表的映射
    │
    ▼
Eventify (Mixin)           ← 中间层：混入模式，给任意类添加事件能力
    │
    ▼
EventTarget                ← 上层：标准化的事件接口
    │
    ├── Node                ← 节点可以使用事件
    ├── Component           ← 组件可以使用事件
    └── 所有需要事件的类...
```

> 源码中 `cocos/core/event/` 目录下的文件实现了这个三层设计。`CallbacksInvoker` 使用 `Map<string, CallbackList>` 存储事件映射，这就是事件分发的核心数据结构。

### 事件冒泡（Event Bubbling）

Cocos 的节点事件支持冒泡机制，类似 DOM 事件：

```
Scene
 └── NodeA
      └── NodeB
           └── NodeC  ← 事件从这里触发
                    │
                    ▼ 冒泡方向
              NodeB → NodeA → Scene
```

> 源码中 `node.ts` 的 `dispatchEvent()` 方法实现了冒泡逻辑。它沿着父节点链向上传播事件，直到某个节点调用 `event.stopPropagation()`。

---

## 3. 内存管理与对象池

### JavaScript 的垃圾回收问题

JavaScript 有自动垃圾回收（GC），但在游戏场景下有两个问题：

1. **GC 导致卡顿**：GC 会暂停主线程，导致帧率骤降（"卡一帧"）
2. **内存碎片**：频繁创建销毁对象导致内存碎片化

### 对象池（Object Pool）原理

对象池通过**复用对象**而非频繁创建销毁来解决问题：

```
// 没有对象池：每帧创建/销毁大量对象
for (let i = 0; i < 100; i++) {
    let bullet = new Bullet();    // 创建
    // ... 使用
    bullet = null;                 // 销毁 → 等待 GC
}
// GC 频繁触发 → 卡顿

// 使用对象池：复用已有对象
for (let i = 0; i < 100; i++) {
    let bullet = pool.alloc();    // 从池中取出（或创建新的）
    // ... 使用
    pool.free(bullet);            // 放回池中，不销毁
}
// 无 GC 压力 → 流畅
```

### Cocos 的三种池化实现

#### Pool — 通用对象池

```
Pool<T>
  ├── get(): T        ← 取出对象（池空则调用 ctor 创建）
  └── put(obj: T)     ← 放回对象

适用场景：子弹、粒子、临时对象等频繁创建销毁的对象
```

#### RecyclePool — 可回收池

```
RecyclePool<T>
  ├── add(): T        ← 创建/复用对象
  ├── removeAt(i)     ← 标记为回收（不是真删除）
  └── 数据紧密排列     ← 保证内存连续性

适用场景：渲染数据（如每帧的渲染列表），需要遍历效率
```

#### CachedArray — 缓存数组

```
CachedArray<T>
  ├── push(item)      ← 添加元素
  ├── pop()           ← 弹出最后一个
  └── length = 0      ← "清空"但保留底层数组

适用场景：临时集合，每帧用完清空但不想重新分配数组
```

> 源码 `cocos/core/memop/` 目录下实现了这三种池。特别注意 `RecyclePool` 的实现——它使用"交换到末尾再减少长度"的技巧来保证 O(1) 删除和数据连续性。

---

## 4. 调度器与时间管理

### 调度器的本质

调度器是游戏循环中**"何时执行什么"**的管理器：

```
每一帧：
    Scheduler.update(dt)
        │
        ├── 更新所有注册的 update 回调
        │
        ├── 检查并触发所有到期的定时器
        │
        └── 按优先级排序执行
```

### 定时器实现原理

调度器中的定时器不同于 `setTimeout`：

| 特性 | setTimeout | Scheduler Timer |
|------|-----------|----------------|
| 时间精度 | 毫秒级 | 帧级别 |
| 执行时机 | 不确定 | 在帧循环中 |
| 与游戏关联 | 无 | 可暂停/恢复/缩放 |
| 性能 | 系统调度 | 统一批处理 |

### 优先级调度

Cocos 的调度器支持优先级，确保关键逻辑先执行：

```
优先级数值越小越先执行：

Scheduler.update(dt)
    ├── 优先级 0: 系统级更新（物理、动画）
    ├── 优先级 1: 组件 update
    ├── ...
    └── 优先级 N: 低优先级任务
```

> 源码 `cocos/core/scheduler.ts` 使用 `Map<target, CallbackList>` 管理所有定时器。它不是用真实的系统定时器，而是在每帧的 `update(dt)` 中累加时间并检查是否到期。

---

## 5. 序列化原理

### 什么是序列化

**序列化**（Serialization）= 将内存中的对象转换为可存储/传输的格式
**反序列化**（Deserialization）= 将存储格式还原为内存对象

```
内存中的对象                    序列化后的 JSON
┌──────────────┐              ┌──────────────────────┐
│ Node {       │    序列化     │ {                    │
│   name: "A"  │ ──────────►  │   "name": "A",       │
│   pos: Vec3  │              │   "pos": [1,2,3],    │
│   children[] │              │   "children": [...]   │
│ }            │              │ }                    │
└──────────────┘              └──────────────────────┘
```

### 游戏引擎序列化的特殊挑战

| 挑战 | 说明 | Cocos 的解决方案 |
|------|------|-----------------|
| **循环引用** | 节点 A 引用节点 B，B 又引用 A | UUID 引用 + 引用表 |
| **多态** | 子类序列化后反序列化要还原为正确类型 | `__type__` 字段记录类型 |
| **资源引用** | 场景引用纹理等外部资源 | UUID 引用 + Bundle 定位 |
| **版本兼容** | 旧版本场景要能加载 | 版本号 + 迁移器 |
| **大量数据** | 大场景可能有几十 MB 的 JSON | 二进制格式 + 压缩 |

### Cocos 序列化的核心设计

```
1. 属性声明（装饰器阶段）
   @property → 记录属性的元信息（类型、默认值、是否序列化）

2. 序列化（运行时 → JSON）
   遍历对象的 @property 属性 → 读取值 → 写入 JSON
   遇到对象引用 → 记录 UUID 而非内联

3. 反序列化（JSON → 运行时）
   读取 JSON → 根据 __type__ 找到类 → 创建实例 → 设置属性
   遇到 UUID 引用 → 延迟解析（先加载所有对象，再解析引用）
```

### UUID 引用机制

```
// 序列化前（内存中的引用关系）
NodeA._children[0] ──引用──► NodeB（内存地址）

// 序列化后（JSON 中的引用关系）
{
    "__type__": "cc.Node",
    "_children": [{ "__id__": 42 }]   // 用索引引用
}
{
    "__type__": "cc.Node",            // 第 42 个对象
    "_prefab": { "__uuid__": "abc123" } // 跨文件用 UUID
}
```

> 源码 `cocos/core/data/` 目录实现了序列化系统。`decorators/` 下的装饰器在编译时注册元数据，`deserialize.ts` 负责反序列化。注意 `__id__` 和 `__uuid__` 的区别——前者是文件内索引引用，后者是跨文件 UUID 引用。

---

## 延伸阅读

- [3D Math Primer for Graphics and Game Development](https://gamemath.com/) — 游戏数学经典教材
- [Observer Pattern - Game Programming Patterns](https://gameprogrammingpatterns.com/observer.html)
- [Object Pool Pattern - Game Programming Patterns](https://gameprogrammingpatterns.com/object-pool.html)

---

> 理解了这些原理后，继续阅读 [01-数学与类型](./01-math-types.md) 查看对应的源码实现。
