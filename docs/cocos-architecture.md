# Cocos Creator 3.8.8 引擎架构总览

## 目录

- [1. 引擎概述](#1-引擎概述)
- [2. 顶层目录结构](#2-顶层目录结构)
- [3. 核心架构分层](#3-核心架构分层)
- [4. 核心模块详解](#4-核心模块详解)
- [5. 模块间依赖关系](#5-模块间依赖关系)
- [6. 数据流与生命周期](#6-数据流与生命周期)
- [7. 平台抽象层 PAL](#7-平台抽象层-pal)
- [8. 原生层 Native](#8-原生层-native)
- [9. 扩展与第三方集成](#9-扩展与第三方集成)

---

## 1. 引擎概述

Cocos Creator 3.8.8 是一个基于 TypeScript 的跨平台游戏引擎，采用组件化架构，支持 2D 和 3D 游戏开发。引擎采用分层设计，从底层图形抽象到高层游戏逻辑形成清晰的架构栈。

**核心设计理念**：
- **组件化（Component-Based）**：Node 作为容器，Component 提供功能
- **模块化（Modular）**：各功能模块独立，按需加载
- **跨平台（Cross-Platform）**：通过 PAL 层统一不同平台的差异
- **类型安全（Type-Safe）**：全 TypeScript 实现，完整类型定义

---

## 2. 顶层目录结构

```
cocos-engine/
├── cocos/            # 引擎核心 TypeScript 源代码
├── pal/              # 平台抽象层 (Platform Abstraction Layer)
├── exports/          # 模块导出配置（按功能分文件）
├── external/         # 外部依赖库（压缩、序列化等）
├── native/           # C++ 原生实现（iOS/Android/Desktop）
├── platforms/        # 平台特定工程文件
├── extensions/       # 编辑器扩展
├── @types/           # TypeScript 类型定义
├── vendor/           # 第三方库源码
├── scripts/          # 构建和工具脚本
├── tests/            # 测试代码
├── docs/             # 引擎文档
├── templates/        # 项目模板
└── cc.config.json    # 引擎模块配置
```

---

## 3. 核心架构分层

引擎从下到上分为 6 个核心层次：

```
┌─────────────────────────────────────────────────────┐
│                    游戏层 (Game)                      │
│   Game / Director / 场景管理 / 生命周期控制            │
├─────────────────────────────────────────────────────┤
│                 功能模块层 (Modules)                   │
│   Animation / Physics / Audio / Input / Tween / UI   │
├─────────────────────────────────────────────────────┤
│                场景框架层 (Scene Framework)            │
│   2D / 3D / Particle / Spine / DragonBones / Terrain  │
├─────────────────────────────────────────────────────┤
│                 场景图层 (Scene Graph)                 │
│   Node / Component / Scene / Prefab / Layers         │
├─────────────────────────────────────────────────────┤
│                  渲染层 (Rendering)                    │
│   Rendering Pipeline / Render Scene / GFX            │
├─────────────────────────────────────────────────────┤
│                 基础设施层 (Core)                      │
│   Math / Event / MemOp / Scheduler / Serialization   │
├─────────────────────────────────────────────────────┤
│              平台抽象层 (PAL / Native)                 │
│   Web / Native(C++) / Minigame / System Info         │
└─────────────────────────────────────────────────────┘
```

---

## 4. 核心模块详解

### 4.1 基础设施层 — `cocos/core`

所有其他模块的基础，提供数学运算、事件系统、内存管理等基础能力。

| 子模块 | 路径 | 功能 |
|--------|------|------|
| math | `core/math/` | 向量(Vec2/3/4)、矩阵(Mat3/4)、四元数(Quat)、颜色(Color) |
| data | `core/data/` | CCObject 基类、CCClass 装饰器、ValueType、序列化标记 |
| event | `core/event/` | EventTarget 事件系统、Eventify 装饰器、AsyncDelegate |
| memop | `core/memop/` | Pool 对象池、RecyclePool 回收池、CachedArray 缓存数组 |
| geometry | `core/geometry/` | 射线(Ray)、包围盒(AABB/OBB)、球体(Sphere)、平面(Plane) |
| curves | `core/curves/` | 动画曲线、贝塞尔曲线 |
| algorithm | `core/algorithm/` | 通用算法（排序、搜索等） |
| scheduler | `core/scheduler.ts` | 调度器，管理定时器和帧回调 |

### 4.2 场景图层 — `cocos/scene-graph`

组件化架构的核心实现，定义了节点、组件和场景的基本结构。

| 类 | 职责 |
|-----|------|
| **Node** | 场景树的基本单元，管理层级关系、空间变换（位置/旋转/缩放）、组件挂载 |
| **Component** | 所有组件的基类，定义生命周期（onLoad/start/update/onDestroy） |
| **Scene** | 场景根节点，管理场景全局资源、渲染场景绑定、自动资源释放 |
| **Layers** | 32 位图层掩码，控制节点的可见性和碰撞过滤 |

**Node 继承链**：`CCObject` → `Node` → `Scene`

**组件生命周期**：
```
onLoad → start → [onEnable] → update(每帧) → lateUpdate(每帧) → [onDisable] → onDestroy
```

### 4.3 渲染层 — `cocos/gfx` + `cocos/rendering` + `cocos/render-scene`

渲染系统是引擎最复杂的部分，分为三个子层：

#### 4.3.1 图形抽象层 — `cocos/gfx`

提供硬件无关的图形 API 抽象，支持多种后端：

| 后端 | 路径 | 说明 |
|------|------|------|
| WebGL | `gfx/webgl/` | WebGL 1.0 后端 |
| WebGL2 | `gfx/webgl2/` | WebGL 2.0 后端（默认） |
| WebGPU | `gfx/webgpu/` | WebGPU 后端（实验性） |

**核心抽象**：
- **Device** — GPU 设备，创建所有 GPU 资源的工厂
- **Buffer** — GPU 缓冲区（顶点/索引/Uniform）
- **Texture** — GPU 纹理
- **Shader** — GPU 着色器程序
- **PipelineState** — 渲染管线状态（混合/深度/模板等）
- **CommandBuffer** — GPU 命令录制
- **Framebuffer** — 帧缓冲（Render Target）
- **RenderPass** — 渲染通道
- **InputAssembler** — 顶点数据装配

#### 4.3.2 渲染管线 — `cocos/rendering`

定义渲染的流程和策略：

| 核心类 | 功能 |
|--------|------|
| Pipeline | 渲染管线主控制器，管理渲染流程 |
| RenderPass | 单个渲染通道（阴影/不透明/透明/后处理等） |
| RenderQueue | 渲染队列，按排序策略组织绘制命令 |
| PipelineStateManager | 缓存和管理管线状态，减少状态切换 |
| CustomPipeline | 自定义渲染管线接口 |

**默认渲染流程**：
```
Shadow Pass → GBuffer Pass → Lighting Pass → Opaque Pass → Transparent Pass → PostProcess Pass
```

#### 4.3.3 渲染场景 — `cocos/render-scene`

管理渲染场景中的可视实体：

| 类 | 功能 |
|----|------|
| RenderScene | 渲染场景，管理所有渲染实体 |
| Camera | 相机（透视/正交），视锥剔除 |
| Model | 可渲染模型（静态网格、蒙皮网格等） |
| Light | 光源（方向光、点光源、聚光灯、环境光） |
| DrawBatch2D | 2D 批次 |

### 4.4 场景框架层 — `cocos/2d` + `cocos/3d`

提供 2D 和 3D 游戏开发的高级组件。

#### 2D 框架 — `cocos/2d`

| 组件 | 功能 |
|------|------|
| Sprite | 2D 精灵渲染，支持九宫格、填充模式 |
| Label | 文本渲染（系统字体 / TTF / BMFont） |
| Mask | 遮罩（矩形/圆形/图像） |
| Graphics | 矢量图形绘制（线段/圆形/多边形等） |
| RichText | 富文本（支持内嵌图片和自定义标签） |
| UIOpacity | UI 透明度控制 |
| UITransform | UI 变换（锚点、尺寸） |
| Batcher2D | 2D 批量渲染器，合批优化绘制 |

#### 3D 框架 — `cocos/3d`

| 组件 | 功能 |
|------|------|
| MeshRenderer | 静态网格渲染器 |
| SkinnedMeshRenderer | 蒙皮网格渲染器（骨骼动画） |
| Camera | 3D 相机组件 |
| DirectionLight | 方向光 |
| PointLight | 点光源 |
| SpotLight | 聚光灯 |
| Ambient | 环境光 |
| Skybox | 天空盒 |

### 4.5 功能模块层

#### 4.5.1 动画系统 — `cocos/animation`

| 类 | 功能 |
|----|------|
| AnimationComponent | 动画控制器组件，管理多个 AnimationState |
| AnimationClip | 动画数据（关键帧轨道集合） |
| AnimationState | 单个动画的播放状态（时间、速度、权重） |
| CrossFade | 动画交叉渐变 |
| SkeletonAnimationComponent | 骨骼动画组件 |
| Marionette | 状态机驱动的动画系统（AnimationGraph） |

**支持的动画类型**：
- 属性动画：位置、旋转、缩放、颜色、自定义属性
- 骨骼动画：蒙皮网格 + 骨骼层级
- 状态机动画：基于状态图的动画过渡
- 外部骨骼动画：Spine、DragonBones

#### 4.5.2 物理系统 — `cocos/physics`

支持三种物理引擎后端，统一接口：

| 后端 | 特点 |
|------|------|
| Builtin | 轻量级内置物理，仅碰撞检测 |
| Cannon.js | 纯 JS 物理引擎，适合 Web |
| Bullet | C++ 物理引擎，高性能，原生平台 |
| PhysX | NVIDIA PhysX，最高性能 |

**核心组件**：

| 组件 | 功能 |
|------|------|
| RigidBody | 刚体（动态/静态/运动学） |
| BoxCollider / SphereCollider / CapsuleCollider / MeshCollider | 碰撞器 |
| CharacterController | 角色控制器（滑动、台阶检测） |
| Constraint | 约束（铰链、固定、点对点） |

#### 4.5.3 音频系统 — `cocos/audio`

| 类 | 功能 |
|----|------|
| AudioSource | 音频源组件（播放/暂停/音量/3D空间音频） |
| AudioClip | 音频数据容器 |

#### 4.5.4 输入系统 — `cocos/input`

| 输入类型 | 事件 |
|----------|------|
| 触摸/鼠标 | TOUCH_START / TOUCH_MOVE / TOUCH_END |
| 键盘 | KEY_DOWN / KEY_UP |
| 加速度计 | DEVICEMOTION |
| 游戏手柄 | InputSource |
| VR/AR 设备 | XR 事件 |

#### 4.5.5 资产管理 — `cocos/asset`

```
AssetManager（资产管理器）
├── Bundle（资源包）
│   ├── 远程包（服务器资源）
│   └── 本地包（内置资源）
├── Pipeline（加载流水线）
│   ├── Downloader（下载器）
│   ├── Parser（解析器）
│   └── 自定义处理器
├── Cache（缓存管理）
└── ReleaseManager（释放管理）
```

#### 4.5.6 UI 系统 — `cocos/ui`

| 组件 | 功能 |
|------|------|
| Widget | 对齐策略（左/右/上/下/居中） |
| Layout | 布局（水平/垂直/网格） |
| ScrollView | 滚动视图 |
| Button | 按钮（点击/缩放/颜色过渡） |
| EditBox | 文本输入框 |
| ProgressBar | 进度条 |
| Slider | 滑块 |
| Toggle / ToggleContainer | 开关 / 单选组 |
| PageView | 页面视图 |
| SafeArea | 安全区适配 |

#### 4.5.7 缓动系统 — `cocos/tween`

链式调用的补间动画 API：

```typescript
tween(node)
    .to(1.0, { position: new Vec3(10, 0, 0) })
    .by(0.5, { scale: new Vec3(2, 2, 2) })
    .call(() => { /* 回调 */ })
    .start();
```

#### 4.5.8 粒子系统 — `cocos/particle`

模块化设计，支持 GPU 和 CPU 两种模式：

| 模块 | 功能 |
|------|------|
| Emitter | 发射器（形状/频率/生命周期） |
| ColorOvertime | 颜色随时间变化 |
| SizeOvertime | 大小随时间变化 |
| VelocityOvertime | 速度随时间变化 |
| ForceOvertime | 力场 |
| TextureAnimation | 纹理动画（UV 翻页） |
| Noise | 噪声扰动 |
| Trail | 拖尾效果 |

#### 4.5.9 全局光照 — `cocos/gi`

| 子模块 | 功能 |
|--------|------|
| LightProbe | 光探针（自动放置、Delaunay 三角剖分、球谐函数） |
| LightProbeGroup | 光探针组 |

#### 4.5.10 XR 系统 — `cocos/xr`

扩展现实（VR/AR）支持，包括事件处理和设备管理。

### 4.6 游戏层 — `cocos/game`

| 类 | 功能 |
|----|------|
| Game | 游戏主控制器，管理引擎初始化、游戏循环、帧率 |
| Director | 导演类，管理场景切换、游戏循环调度、系统更新顺序 |

**引擎初始化流程**：
```
PreBaseInit → BaseInit → InfrastructureInit → SubsystemInit → ProjectDataInit → GameInited
```

**游戏主循环**：
```
while (running) {
    processInput()         // 处理输入
    Director.tick(dt)      // 导演 Tick
    ├── PhysicsSystem.update()     // 物理更新
    ├── AnimationSystem.update()   // 动画更新
    ├── Component.update()         // 组件逻辑更新
    ├── Component.lateUpdate()     // 延迟更新
    ├── Scheduler.update()         // 调度器更新
    └── Root.frameMove(dt)         // 渲染
        └── Pipeline.render()      // 渲染管线执行
}
```

---

## 5. 模块间依赖关系

```
                    ┌──────────┐
                    │   Game   │
                    │ Director │
                    └────┬─────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    ┌────┴────┐    ┌─────┴─────┐   ┌─────┴─────┐
    │  Scene  │    │ Animation │   │   Tween   │
    │  Graph  │    │  Physics  │   │  Particle │
    └────┬────┘    │   Audio   │   │    GI     │
         │         │   Input   │   └─────┬─────┘
    ┌────┴────┐    └─────┬─────┘         │
    │   2D    │          │               │
    │   3D    │          │               │
    └────┬────┘          │               │
         │               │               │
         └───────────────┼───────────────┘
                         │
                  ┌──────┴──────┐
                  │   Render    │
                  │   Scene     │
                  └──────┬──────┘
                         │
                  ┌──────┴──────┐
                  │  Rendering  │
                  │  Pipeline   │
                  └──────┬──────┘
                         │
                  ┌──────┴──────┐
                  │    GFX      │
                  └──────┬──────┘
                         │
                  ┌──────┴──────┐
                  │ Core / PAL  │
                  └─────────────┘
```

**关键依赖关系**：
- **Game** 依赖 Scene-Graph（场景管理）和所有功能模块
- **Scene-Graph** 依赖 Core（CCObject、事件、数学）
- **2D / 3D** 依赖 Scene-Graph（Node/Component）和 Render-Scene
- **Render-Scene** 依赖 GFX（图形设备）和 Rendering（管线）
- **所有模块** 依赖 Core（基础数据结构和工具）

---

## 6. 数据流与生命周期

### 6.1 引擎启动流程

```
1. Game.init(config)                — 初始化引擎配置
2.   ├── 创建 GFX Device            — 初始化图形设备
3.   ├── 创建 Root                  — 创建引擎根管理器
4.   ├── 创建 Pipeline              — 初始化渲染管线
5.   └── 初始化各子系统              — 物理、音频、输入等
6. Game.run()                       — 进入游戏循环
7.   └── Director.loadScene()       — 加载首场景
```

### 6.2 资源加载流程

```
AssetManager.load(url)
  ├── Bundle.find(url)              — 查找资源所在包
  ├── Pipeline.execute()
  │   ├── Downloader.download()     — 下载资源文件
  │   ├── Parser.parse()            — 解析资源数据
  │   └── Decoder.decode()          — 解码（如压缩资源）
  ├── Asset instantiated            — 创建资源实例
  └── Dependencies resolved         — 解析依赖资源
```

### 6.3 渲染流程

```
Root.frameMove(dt)
  ├── RenderScene.update(dt)         — 更新渲染场景
  │   ├── 更新场景变换矩阵
  │   ├── 视锥剔除
  │   └── 距离剔除
  ├── Pipeline.render(camera)
  │   ├── ShadowPass.render()        — 阴影贴图
  │   ├── GBufferPass.render()       — G-Buffer 生成
  │   ├── LightingPass.render()      — 光照计算
  │   ├── OpaquePass.render()        — 不透明物体
  │   ├── TransparentPass.render()   — 透明物体
  │   └── PostProcessPass.render()   — 后处理
  └── Device.present()               — 提交显示
```

---

## 7. 平台抽象层 PAL

PAL 位于 `/pal` 目录，是引擎跨平台的核心机制。

### 7.1 抽象领域

| 领域 | 说明 | 子目录 |
|------|------|--------|
| audio | 音频播放抽象 | `pal/audio/` |
| env | 运行环境抽象 | `pal/env/` |
| input | 输入设备抽象 | `pal/input/` |
| system-info | 系统信息抽象 | `pal/system-info/` |
| screen-adapter | 屏幕适配抽象 | `pal/screen-adapter/` |
| wasm | WebAssembly 支持 | `pal/wasm/` |

### 7.2 平台实现

每个 PAL 领域通常包含三种实现：

| 实现 | 路径 | 适用平台 |
|------|------|----------|
| Web | `pal/xxx/web/` | 浏览器 |
| Native | `pal/xxx/native/` | iOS / Android / Desktop |
| Minigame | `pal/xxx/minigame/` | 微信小游戏等 |

### 7.3 完整性检查

通过 `pal/integrity-check.ts` 中的 `checkPalIntegrity()` 函数，在启动时校验当前平台的 PAL 实现是否完整覆盖了所有必要接口。

---

## 8. 原生层 Native

位于 `/native` 目录，C++ 实现高性能底层功能。

### 8.1 目录结构

```
native/cocos/
├── base/          # 基础工具类
├── bindings/      # JSB（JavaScript Binding）
├── core/          # 核心功能
├── math/          # 数学库（C++ 版）
├── renderer/      # 原生渲染器
├── physics/       # 物理引擎绑定
├── audio/         # 原生音频
├── scene/         # 原生场景管理
├── platform/      # 平台特定代码
├── network/       # 网络模块
├── gi/            # 全局光照
├── xr/            # XR 支持
├── 2d/ / 3d/      # 2D/3D 原生模块
└── ui/            # 原生 UI
```

### 8.2 技术特性

- **C++17 标准**，使用现代 C++ 特性
- **JSB 绑定**：通过 `bindings/` 将 C++ 接口暴露给 TypeScript
- **CMake 构建**：跨平台原生构建系统
- **GPU 后端**：原生平台使用 Vulkan / Metal / DirectX

---

## 9. 扩展与第三方集成

### 9.1 外部依赖 — `external/`

| 库 | 功能 |
|-----|------|
| notepack | 高效二进制序列化（MessagePack 变体） |
| zlib / gzip | 数据压缩和解压 |
| base64 | Base64 编解码 |

### 9.2 第三方骨骼动画 — vendor/

| 库 | 路径 | 说明 |
|----|------|------|
| Spine | `cocos/spine/` | 2D 骨骼动画 |
| DragonBones | `cocos/dragon-bones/` | 2D 骨骼动画（龙骨） |

### 9.3 模块导出 — `exports/`

引擎通过 `exports/` 目录下的文件控制哪些模块被编译到最终产物中。每个文件对应一个功能模块：

```
exports/
├── base.ts              # 基础模块（必选）
├── 2d.ts / 3d.ts        # 2D / 3D 框架
├── gfx-webgl.ts         # WebGL 后端
├── gfx-webgl2.ts        # WebGL2 后端
├── gfx-webgpu.ts        # WebGPU 后端
├── physics-builtin.ts   # 内置物理
├── physics-cannon.ts    # Cannon.js 物理
├── physics-physx.ts     # PhysX 物理
├── animation.ts         # 动画系统
├── audio.ts             # 音频系统
├── ui.ts                # UI 系统
├── particle.ts          # 粒子系统
├── xr.ts                # XR 支持
└── ...                  # 其他模块
```

通过 `cc.config.json` 中的配置可以选择性地启用或禁用模块，实现按需裁剪引擎体积。

---

## 附录：模块速查表

| 模块 | 目录 | 核心类 | 一句话描述 |
|------|------|--------|-----------|
| Core | `cocos/core` | CCObject, Vec3, Mat4, EventTarget | 基础数据结构和工具 |
| Scene Graph | `cocos/scene-graph` | Node, Component, Scene | 组件化场景管理 |
| GFX | `cocos/gfx` | Device, Buffer, Texture, Shader | 图形 API 抽象层 |
| Rendering | `cocos/rendering` | Pipeline, RenderPass, RenderQueue | 渲染管线 |
| Render Scene | `cocos/render-scene` | Camera, Model, Light | 渲染场景实体 |
| 2D | `cocos/2d` | Sprite, Label, Batcher2D | 2D 渲染框架 |
| 3D | `cocos/3d` | MeshRenderer, Camera | 3D 渲染框架 |
| Animation | `cocos/animation` | Animation, AnimationClip, Marionette | 动画系统 |
| Physics | `cocos/physics` | RigidBody, Collider, PhysicsSystem | 3D 物理系统 |
| Physics 2D | `cocos/physics-2d` | RigidBody2D, Collider2D | 2D 物理系统 |
| Audio | `cocos/audio` | AudioSource, AudioClip | 音频系统 |
| Input | `cocos/input` | Input, EventKeyboard, EventTouch | 输入系统 |
| Asset | `cocos/asset` | AssetManager, Bundle | 资产管理 |
| UI | `cocos/ui` | Widget, Layout, ScrollView, Button | UI 组件系统 |
| Tween | `cocos/tween` | Tween | 补间动画 |
| Particle | `cocos/particle` | ParticleSystem | 粒子特效 |
| GI | `cocos/gi` | LightProbe | 全局光照 |
| Game | `cocos/game` | Game, Director | 游戏主控制 |
| Serialization | `cocos/serialization` | deserialize, serialize | 序列化系统 |
| PAL | `pal/` | 各平台实现 | 平台抽象层 |
| Native | `native/` | C++ 实现 | 原生高性能层 |
