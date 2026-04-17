# 技术原理：游戏引擎架构基础

> 在阅读 Cocos Creator 引擎源码之前，理解以下核心技术原理将帮助你更高效地理解引擎的设计动机和实现选择。

---

## 目录

- [1. 游戏引擎的本质](#1-游戏引擎的本质)
- [2. 游戏循环（Game Loop）](#2-游戏循环game-loop)
- [3. 模块化架构设计](#3-模块化架构设计)
- [4. 跨平台引擎的挑战](#4-跨平台引擎的挑战)
- [5. TypeScript 与游戏引擎](#5-typescript-与游戏引擎)
- [6. 数据驱动设计](#6-数据驱动设计)
- [7. 引擎分层架构](#7-引擎分层架构)

---

## 1. 游戏引擎的本质

### 什么是游戏引擎

游戏引擎本质上是一个**实时交互式媒体框架**，它解决的核心问题是：

```
将游戏世界的抽象描述（场景、模型、动画、逻辑）
转换为屏幕上的像素和扬声器的声音
并响应玩家的输入
```

### 引擎的三大核心职责

| 职责 | 说明 | Cocos 对应模块 |
|------|------|----------------|
| **计算** | 游戏逻辑、物理模拟、动画插值 | Scheduler, Physics, Animation |
| **渲染** | 将 3D/2D 数据绘制到屏幕 | Rendering Pipeline, GFX |
| **交互** | 接收用户输入，反馈结果 | Input System, UI System |

### 引擎 ≠ 框架

- **框架**（Framework）：调用你的代码（控制反转）
- **引擎**（Engine）：你调用它的代码（你控制流程）
- **Cocos Creator** 两者兼有：引擎提供底层能力，框架（组件系统）提供开发范式

> 源码中 `director.ts` 和 `game.ts` 的关系体现了这一点：`game.ts` 是引擎入口（你启动它），`director.ts` 是框架核心（它驱动你的场景逻辑）

---

## 2. 游戏循环（Game Loop）

### 为什么需要游戏循环

游戏与普通应用的根本区别：**游戏是实时持续的**。普通应用是事件驱动的（用户点击 → 响应），游戏需要每秒 60 次或更多地更新和绘制画面。

### 游戏循环的基本结构

```
while (gameIsRunning) {
    processInput();    // 1. 处理输入
    update(dt);        // 2. 更新游戏状态（逻辑、物理、动画）
    render();          // 3. 渲染画面
}
```

### Cocos Creator 的游戏循环

在源码中，这个循环被分解为更精细的阶段：

```
requestAnimationFrame (浏览器/平台提供的 VSync 回调)
    │
    ▼
Game.tick()                          ← game.ts
    │
    ▼
Director.tick(dt)                    ← director.ts
    │
    ├── Scheduler.update(dt)         ← 调度所有定时器和帧回调
    │
    ├── ComponentScheduler.update()  ← 按优先级调度组件的 update()
    │
    ├── AnimationManager.update()    ← 更新所有动画
    │
    ├── PhysicsWorld.step(dt)        ← 物理模拟步进
    │
    ├── LateUpdate                   ← 后更新（相机跟随等）
    │
    └── Root.frameMove(dt)           ← 渲染
            │
            ├── 更新场景数据
            ├── 视锥剔除
            └── Pipeline.render()    ← 执行渲染管线
```

### 固定时间步 vs 可变时间步

| 策略 | 优点 | 缺点 | Cocos 的选择 |
|------|------|------|-------------|
| **固定时间步** | 物理模拟稳定、可重现 | 帧率与刷新率不匹配时卡顿 | 物理系统使用固定步长 |
| **可变时间步** | 灵活、画面流畅 | 物理模拟不稳定 | 渲染和逻辑使用可变步长 |
| **半固定步长** | 兼顾两者 | 实现复杂 | Cocos 采用的方案 |

> 在 `director.ts` 中你会看到 `dt`（delta time）的计算，这就是可变时间步的关键——每帧记录上一帧的时间戳，差值就是 `dt`

---

## 3. 模块化架构设计

### 为什么引擎需要模块化

游戏引擎是一个极其庞大的系统（Cocos Creator 3.8 的源码超过百万行）。模块化解决了：

1. **编译效率**：不需要编译整个引擎
2. **按需加载**：Web 平台可以只加载需要的模块
3. **团队协作**：不同团队负责不同模块
4. **可测试性**：每个模块可以独立测试

### Cocos 的模块划分

```
cocos/
├── core/              ← 核心基础（所有模块依赖）
│   ├── math/          ← 数学库
│   ├── event/         ← 事件系统
│   ├── memop/         ← 内存优化
│   └── scheduler.ts   ← 调度器
├── scene-graph/       ← 场景图（节点-组件）
├── rendering/         ← 渲染系统
├── gfx/               ← 图形 API 抽象
├── 2d/                ← 2D 渲染
├── 3d/                ← 3D 渲染
├── animation/         ← 动画系统
├── physics/           ← 物理系统
├── asset/             ← 资源管理
├── ui/                ← UI 组件
├── audio/             ← 音频
├── input/             ← 输入
├── particle/          ← 粒子系统
└── terrain/           ← 地形
```

### 依赖关系原则

模块间的依赖遵循**单向依赖**原则：

```
core ← scene-graph ← rendering ← advanced-topics
  ↑         ↑            ↑
  └─────────┴────────────┘
  （所有模块都依赖 core，但不被 core 依赖）
```

> 源码中这个依赖关系通过 TypeScript 的 `import` 语句体现。当你看到 `import { Vec3 } from 'cc'` 而不是相对路径时，说明引擎使用了统一的模块导出系统

---

## 4. 跨平台引擎的挑战

### Cocos Creator 支持的平台

```
                    ┌──────────────────────┐
                    │    Cocos Creator      │
                    │    统一 API 层         │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
     ┌────────▼──────┐ ┌──────▼──────┐ ┌───────▼──────┐
     │  Web 平台     │ │ 原生平台     │ │  小游戏平台   │
     │              │ │             │ │              │
     │  - WebGL     │ │ - OpenGL ES │ │ - 微信       │
     │  - WebGL2    │ │ - Metal     │ │ - 抖音       │
     │  - WebGPU    │ │ - Vulkan    │ │ - 华为快游戏  │
     │              │ │ - D3D11     │ │ - OPPO       │
     └──────────────┘ └─────────────┘ └──────────────┘
```

### 跨平台需要解决的三个问题

#### 问题 1：图形 API 差异

不同平台使用不同的图形 API：

| API | 平台 | 特点 |
|-----|------|------|
| **WebGL/WebGL2** | Web | 基于 OpenGL ES，JavaScript 绑定 |
| **WebGPU** | Web (新一代) | 基于 Vulkan/D3D12/Metal |
| **OpenGL ES** | Android/iOS (旧) | 广泛兼容 |
| **Metal** | iOS/macOS | Apple 原生，高性能 |
| **Vulkan** | Android (新)/Windows | 现代 API，显式控制 |
| **D3D11** | Windows | Microsoft 原生 |

> Cocos 的 **GFX 层**（`cocos/gfx/`）就是为了解决这个问题——它提供统一的抽象接口，每个平台实现自己的后端。你在源码中会看到 `gfx-webgl/`、`gfx-webgl2/`、`gfx-webgpu/` 等目录。

#### 问题 2：系统 API 差异

音频、输入、文件系统等系统 API 在不同平台完全不同。Cocos 使用 **PAL（Platform Abstraction Layer）** 解决：

```
pal/
├── audio/              ← 音频抽象
│   ├── web/            ← Web Audio API 实现
│   ├── minigame/       ← 小游戏实现
│   └── native/         ← 原生实现
├── input/              ← 输入抽象
├── screen-adapter/     ← 屏幕适配
└── system-info/        ← 系统信息
```

#### 问题 3：编程语言差异

Web 平台运行 JavaScript/TypeScript，原生平台可以运行 C++。Cocos 使用 **JSB（JavaScript Binding）** 桥接：

```
TypeScript (业务逻辑 + 引擎逻辑)
    ↕ JSB 桥接
C++ (高性能渲染 + 物理 + 平台接口)
```

---

## 5. TypeScript 与游戏引擎

### 为什么 Cocos Creator 选择 TypeScript

| 特性 | 对引擎的价值 |
|------|-------------|
| **静态类型** | 编译期发现错误，IDE 智能提示 |
| **泛型** | 数学库 `Vec2<T>`、对象池 `Pool<T>` |
| **装饰器** | `@ccclass`、`@property` 实现声明式组件 |
| **枚举** | 类型安全的状态机 |
| **命名空间/模块** | 大型代码组织 |
| **编译到 JS** | 天然支持 Web 平台 |

### 装饰器在 Cocos 中的作用

Cocos 大量使用 TypeScript 装饰器来实现声明式编程：

```typescript
@ccclass('MyComponent')       // 注册组件类名
@executeInEditMode(true)       // 编辑器模式下也执行
export class MyComponent extends Component {

    @property({ type: Node })  // 声明可序列化属性
    targetNode: Node = null;

    @property                  // 简写形式
    speed: number = 10;
}
```

这些装饰器在源码中对应 `cocos/core/data/decorators/` 目录下的实现。装饰器的本质是**编译时函数调用**，它们修改类的元数据（metadata），这些元数据在序列化和反序列化时被读取。

---

## 6. 数据驱动设计

### 什么是数据驱动

数据驱动的核心思想：**将游戏内容（数据）与游戏逻辑（代码）分离**。

```
传统方式（硬编码）：
    代码中写死 "角色的速度是 100"

数据驱动：
    JSON 文件中定义 { "speed": 100 }
    代码读取数据并使用
```

### Cocos Creator 中的数据驱动体现

| 系统 | 数据 | 代码 |
|------|------|------|
| 场景 | `.scene` 文件（JSON） | `Scene` 类 |
| 预制体 | `.prefab` 文件（JSON） | `Prefab` 类 |
| 材质 | `.mtl` 文件（JSON） | `Material` 类 |
| 动画剪辑 | `.anim` 文件（JSON） | `AnimationClip` 类 |
| 着色器 | `.effect` 文件（YAML-like） | `EffectAsset` 类 |

### 序列化与反序列化

数据驱动的关键技术是**序列化**（将内存对象转为可存储格式）和**反序列化**（将存储格式还原为内存对象）：

```
编辑器中操作场景
    │
    ▼ 序列化
保存为 .scene 文件（JSON 格式）
    │
    ▼ 反序列化
运行时加载并还原为场景对象树
```

> 这就是为什么 `01-core-foundation/05-serialization.md` 如此重要——序列化系统是整个数据驱动架构的基石

---

## 7. 引擎分层架构

### 经典的游戏引擎分层

```
┌─────────────────────────────────────────────────────────┐
│                    游戏逻辑层                             │
│            （开发者的脚本代码）                            │
├─────────────────────────────────────────────────────────┤
│                    功能模块层                             │
│      动画 · 物理 · 音频 · UI · 粒子 · 输入               │
├─────────────────────────────────────────────────────────┤
│                    场景管理层                             │
│         节点树 · 组件系统 · 生命周期管理                    │
├─────────────────────────────────────────────────────────┤
│                    渲染系统层                             │
│    渲染管线 · 着色器 · 材质 · 光照 · 后处理               │
├─────────────────────────────────────────────────────────┤
│                    平台抽象层                             │
│         GFX · PAL · JSB · 原生接口                       │
├─────────────────────────────────────────────────────────┤
│                    核心基础层                             │
│      数学库 · 事件系统 · 内存管理 · 调度器 · 序列化        │
└─────────────────────────────────────────────────────────┘
```

### 分层的好处

1. **关注点分离**：每层只关心自己的职责
2. **可替换性**：可以替换某一层而不影响其他层（如替换物理引擎后端）
3. **可测试性**：每层可以独立测试
4. **学习路径**：从底层到上层，逐步理解

### 与源码的对应

| 分层 | 源码目录 | 本文档章节 |
|------|---------|-----------|
| 核心基础层 | `cocos/core/` | 01-core-foundation |
| 场景管理层 | `cocos/scene-graph/` | 02-scene-graph |
| 渲染系统层 | `cocos/rendering/`, `cocos/gfx/` | 03-rendering |
| 功能模块层 | `cocos/animation/`, `cocos/physics/` 等 | 04-functional-modules |
| 平台抽象层 | `pal/`, `native/` | 07-platform-layer |

---

## 延伸阅读

- [Game Engine Architecture (Jason Gregory)](https://www.gameenginebook.com/) — 游戏引擎架构经典教材
- [Game Programming Patterns (Robert Nystrom)](https://gameprogrammingpatterns.com/) — 游戏编程设计模式（免费在线阅读）
- [Cocos Creator 官方架构文档](https://docs.cocos.com/creator/3.8/manual/zh/engine/architecture/)

---

> 了解了这些基础原理后，接下来阅读 [01-环境配置](./01-environment-setup.md) 搭建源码阅读环境。
