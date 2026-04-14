# 技术原理：场景图系统

> 场景图（Scene Graph）是游戏引擎组织游戏世界的核心数据结构。在阅读 Cocos Creator 的节点和组件源码之前，先理解场景图、组件模式和空间变换的技术原理。

---

## 目录

- [1. 场景图数据结构](#1-场景图数据结构)
- [2. 组件模式（Entity-Component 模式）](#2-组件模式entity-component-模式)
- [3. 空间变换与矩阵级联](#3-空间变换与矩阵级联)
- [4. 生命周期管理](#4-生命周期管理)
- [5. 脏标记机制](#5-脏标记机制)

---

## 1. 场景图数据结构

### 什么是场景图

场景图是一棵**有向无环树**（DAG），用于组织游戏世界中的所有对象：

```
Scene (根节点)
├── Camera               ← 相机
├── Directional Light    ← 灯光
├── Player (Node)
│   ├── Body (MeshRenderer)
│   ├── Head (Node)
│   │   └── Hat (Sprite)
│   └── Weapon (Node)
└── Terrain (Node)
    ├── Tree1 (Node)
    └── Tree2 (Node)
```

### 为什么用树结构

树结构天然适合表达游戏世界的**层级关系**：

| 关系类型 | 示例 | 树的表达 |
|---------|------|---------|
| 空间包含 | 角色手持武器 | Player → Weapon |
| 视觉组合 | 汽车有轮子 | Car → Wheel1, Wheel2... |
| 逻辑管理 | UI 面板包含按钮 | Panel → Button1, Button2... |

**核心好处**：父节点的变换（移动、旋转、缩放）自动影响所有子节点。

### 场景图 vs 其他组织方式

```
方案 1：扁平数组（早期引擎）
    objects = [obj1, obj2, obj3, ...]
    缺点：无法表达层级关系

方案 2：树结构（Cocos / Unity 的选择）
    scene → parent → children
    优点：自然表达层级，变换自动传播

方案 3：图结构（通用场景图）
    节点可以有多个父节点
    缺点：复杂度高，容易出现环
```

### 场景图的遍历

引擎每帧需要遍历场景图执行各种操作：

```
深度优先遍历（DFS）：
    visit(node):
        process(node)        // 处理当前节点
        for child in node.children:
            visit(child)     // 递归处理子节点

用途：
  - 更新世界变换矩阵
  - 视锥剔除判断
  - 收集渲染数据
```

> 源码中 `node.ts` 的 `_updateWorldMatrix()` 就使用深度优先遍历来级联更新变换

---

## 2. 组件模式（Entity-Component 模式）

### 从继承到组合

#### 传统继承方案的问题

```
游戏对象继承体系：
GameObject
├── Character
│   ├── Player       (有渲染 + 动画 + 输入 + 物理)
│   └── NPC          (有渲染 + 动画 + AI)
├── Prop
│   ├── Crate        (有渲染 + 物理)
│   └── Decoration   (只有渲染)
└── Trigger          (只有物理 + 脚本)

问题：
  1. 类爆炸：每种功能组合都需要一个子类
  2. 菱形继承：多个基类有共同父类
  3. 修改困难：给 NPC 加物理要改类继承结构
```

#### 组件模式解决方案

```
组件模式：
Node (容器，只管理层级和变换)
├── Sprite 组件       (渲染)
├── Animation 组件    (动画)
├── RigidBody 组件    (物理)
├── AudioSource 组件  (音频)
└── Script 组件       (自定义逻辑)

核心思想：
  - Node 只是一个"容器"
  - 功能通过挂载不同的 Component 实现
  - 组件之间松耦合，通过 Node 通信
```

### Entity-Component-System (ECS) 光谱

```
纯 OOP 继承                   纯 ECS
    │                           │
    │  Cocos Creator            │
    ├──────────●────────────────┤
    │  (Entity-Component 模式)   │
    │                           │

Cocos Creator 处于中间位置：
  - Entity = Node（有状态，有层级）
  - Component = 组件（有状态，有逻辑）
  - System = 部分采用（如渲染系统是独立的，但组件自己也管理逻辑）
```

### Cocos 组件系统的设计要点

```
1. 组件挂载到节点上
   Node._components: Component[]

2. 组件可以访问节点
   Component.node → 所属的 Node

3. 组件之间通过节点通信
   this.node.getComponent(RigidBody).applyForce(...)

4. 组件有生命周期
   onLoad → start → update → lateUpdate → onDestroy
```

> 源码中 `component.ts` 的 `@ccclass` 装饰器将组件注册到引擎的类系统。`Node.addComponent()` 方法实例化组件并建立双向引用（node._components ↔ component.node）

---

## 3. 空间变换与矩阵级联

### 本地空间 vs 世界空间

```
本地空间（Local Space）：
  节点相对于父节点的位置、旋转、缩放
  position, rotation, scale

世界空间（World Space）：
  节点在整个场景中的绝对位置、旋转、缩放
  worldPosition, worldRotation, worldScale
```

### 变换矩阵级联

从本地空间到世界空间的变换通过矩阵乘法级联：

```
节点 A (position: [2, 0, 0])
  └── 节点 B (position: [1, 0, 0])
        └── 节点 C (position: [3, 0, 0])

节点 A 的世界矩阵：Translate(2, 0, 0)
节点 B 的世界矩阵：Translate(2, 0, 0) × Translate(1, 0, 0) = Translate(3, 0, 0)
节点 C 的世界矩阵：Translate(3, 0, 0) × Translate(3, 0, 0) = Translate(6, 0, 0)

所以节点 C 在世界空间中的位置是 (6, 0, 0)
```

### TRS 分解

变换矩阵可以分解为 Translation × Rotation × Scale：

```
M = T × R × S

其中：
  T = 平移矩阵
  R = 旋转矩阵（从四元数转换）
  S = 缩放矩阵

分解的好处：
  - 编辑器中可以独立编辑 position/rotation/scale
  - 动画可以单独对某个通道插值
  - 避免浮点误差累积（直接操作 TRS 而非矩阵）
```

> 源码 `node.ts` 中的 `_updateWorldMatrix()` 方法实现了 TRS → 矩阵 → 级联乘法的完整流程

### 全局到本地的逆变换

```
世界 → 本地 = 逆矩阵

用途：
  - 鼠标点击世界坐标 → 转换为节点的本地坐标
  - 父节点移动时保持子节点在世界空间不动
  - 碰撞检测中的坐标系转换

源码：Node.inverseTransformPoint()
```

---

## 4. 生命周期管理

### 为什么需要生命周期

组件不是简单的数据容器，它们有**时间维度的行为**：

```
组件生命周期：

  构造函数 ──── 实例化（new），此时还不能访问其他组件
      │
      ▼
  onLoad ────── 节点激活时首次调用（可访问其他组件）
      │
      ▼
  start ─────── 第一次 update 之前调用（只调用一次）
      │
      ▼
  update ────── 每帧调用（游戏逻辑）
      │
      ▼
  lateUpdate ── 所有 update 之后调用（适合相机跟随等）
      │
      ▼
  onDestroy ─── 销毁时调用（清理资源）
```

### 为什么 onLoad 和 start 分开

```
场景加载过程：

1. 反序列化所有节点和组件 → 调用构造函数
2. 建立节点层级和组件引用
3. 调用所有组件的 onLoad()
4. 在第一帧 update 之前调用所有组件的 start()

分开的原因：
  - onLoad 时所有组件都已创建但 start 可能还没执行
  - start 保证所有 onLoad 都已完成
  - 这样在 start 中可以安全地访问其他组件的初始化状态
```

### 组件调度器

```
ComponentScheduler 管理组件的生命周期调用：

每帧执行：
    1. 调用所有新激活组件的 start()    ← 只调用一次
    2. 调用所有注册组件的 update(dt)   ← 每帧
    3. 调用所有注册组件的 lateUpdate() ← 每帧

优化：不是遍历所有组件，而是维护需要 update 的组件列表
      不需要 update 的组件不会进入列表
```

> 源码 `component-scheduler.ts` 使用数组和索引来高效管理生命周期调用，避免每帧遍历全部组件

---

## 5. 脏标记机制

### 问题：每帧更新所有变换矩阵太慢

```
一个场景可能有数千个节点，每帧都计算所有节点的世界矩阵：
  1000 个节点 × 60 FPS = 60000 次矩阵运算/秒

但实际上大部分节点每帧没有变化
→ 大量无意义的计算
```

### 脏标记方案

```
核心思想：只在需要时才重新计算

1. 每个节点有一个 dirty flag
2. 修改 position/rotation/scale 时设置 dirty = true
3. 请求 worldMatrix 时检查 dirty：
     if (dirty) → 重新计算
     else → 返回缓存值

脏标记传播：
  父节点 dirty → 所有子节点也标记 dirty
  因为父节点变了，子节点的世界矩阵必然要重新计算
```

### 脏标记的实现

```
Node {
    _localDirty: boolean     // 本地变换是否变化
    _worldDirty: boolean     // 世界变换是否需要重算

    set position(v) {
        this._localMatDirty = true   // 标记本地脏
        this._worldMatDirty = true   // 标记世界脏
        this._children.forEach(c => c._notifyWorldDirty())  // 传播给子节点
    }

    get worldMatrix() {
        if (this._worldMatDirty) {
            this._updateWorldMatrix()  // 只有脏时才计算
            this._worldMatDirty = false
        }
        return this._worldMatrix
    }
}
```

> 源码 `node.ts` 中 `TransformBit` 枚举定义了更细粒度的脏标记：`POSITION`, `ROTATION`, `SCALE`, `RS`（旋转+缩放）, `TRS`（全部），避免不必要的完整矩阵重算

---

## 延伸阅读

- [Component Pattern - Game Programming Patterns](https://gameprogrammingpatterns.com/component.html)
- [Scene Graph - Wikipedia](https://en.wikipedia.org/wiki/Scene_graph)
- [ECS Back and Forth - Skypjack](https://skypjack.github.io/2019-02-14-ecs-baf-part-1/) — ECS 设计深度讨论

---

> 理解了这些原理后，继续阅读 [01-节点系统](./01-node-system.md) 查看对应的源码实现。
