# 渲染管线

渲染管线是 Cocos Creator 渲染系统的核心调度层，控制从场景数据收集到最终像素输出的整个流程。它采用 Pipeline-Flow-Stage 三级架构，灵活可扩展。

## 目录

- [架构概述](#架构概述)
- [RenderPipeline 渲染管线](#renderpipeline-渲染管线)
- [RenderFlow 渲染流程](#renderflow-渲染流程)
- [RenderStage 渲染阶段](#renderstage-渲染阶段)
- [RenderQueue 渲染队列](#renderqueue-渲染队列)
- [RenderScene 渲染场景](#renderscene-渲染场景)
- [Camera 相机系统](#camera-相机系统)
- [Model 模型系统](#model-模型系统)
- [光照系统](#光照系统)
- [渲染全流程](#渲染全流程)
- [技术原理](#技术原理)

---

## 架构概述

```
┌─────────────────────────────────────────────────────────┐
│                  RenderPipeline                          │
│  (BuiltinPipeline / CustomPipeline)                     │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  RenderFlow  │  │  RenderFlow  │  │  RenderFlow  │  │
│  │  (ShadowFlow)│  │  (MainFlow)  │  │  (UIFlow)    │  │
│  │              │  │              │  │              │  │
│  │ ┌──────────┐ │  │ ┌──────────┐ │  │ ┌──────────┐ │  │
│  │ │ Stage   │ │  │ │ Stage   │ │  │ │ Stage   │ │  │
│  │ │(Shadow) │ │  │ │(Forward) │ │  │ │(2D)     │ │  │
│  │ └──────────┘ │  │ └──────────┘ │  │ └──────────┘ │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 核心文件

| 文件 | 路径 | 说明 |
|------|------|------|
| 渲染管线 | `cocos/rendering/render-pipeline.ts` | 管线主控制器 |
| 渲染流程 | `cocos/rendering/render-flow.ts` | Flow 抽象 |
| 渲染阶段 | `cocos/rendering/render-stage.ts` | Stage 抽象 |
| 渲染队列 | `cocos/rendering/render-queue.ts` | 排序与批处理 |
| 管线场景数据 | `cocos/rendering/pipeline-scene-data.ts` | 场景数据 UBO |
| 管线 UBO | `cocos/rendering/pipeline-ubo.ts` | Uniform 缓冲管理 |
| 渲染场景 | `cocos/render-scene/core/render-scene.ts` | 场景渲染数据 |
| 相机 | `cocos/render-scene/scene/camera.ts` | 相机抽象 |
| 模型 | `cocos/render-scene/scene/model.ts` | 可渲染模型 |
| 光源 | `cocos/render-scene/scene/light.ts` | 光源基类 |

---

## RenderPipeline 渲染管线

`RenderPipeline` 是整个渲染流程的总控制器，继承自 `Asset`（可序列化），管理多个 `RenderFlow`。

### 核心结构

```typescript
// cocos/rendering/render-pipeline.ts

class RenderPipeline extends Asset {
    // ─── 核心属性 ───
    _flows: RenderFlow[];          // 渲染流程数组
    _tag: number;                  // 管线标签
    _renderData: PipelineRenderData; // 渲染数据（输出帧缓冲等）

    // ─── 核心方法 ───
    render(cameras: Camera[]): Promise<void>;  // 树顶渲染入口
    activate(root: Root): boolean;              // 激活管线
    destroy(): void;                            // 销毁管线
}
```

### 管线初始化流程

```
Root.init()
    │
    ▼
RenderPipeline.activate(root)
    │
    ├── 初始化 GFX 资源
    │   ├── 创建四边形顶点/索引缓冲（_quadVB, _quadIB）
    │   ├── 创建 CommandBuffer
    │   └── 初始化 DescriptorSet 布局
    │
    ├── 激活所有 RenderFlow
    │   └── flow.activate(pipeline)
    │       └── 激活所有 RenderStage
    │           └── stage.activate(flow)
    │
    └── 初始化 PipelineSceneData
        └── 创建 UBO 缓冲
```

### 内置管线类型

Cocos Creator 3.8 提供两种内置管线：

| 管线 | 说明 | 适用场景 |
|------|------|----------|
| **ForwardPipeline** | 前向渲染管线 | 默认管线，兼容性好 |
| **DeferredPipeline** | 延迟渲染管线 | 多光源场景，需要 WebGL2+ |

---

## RenderFlow 渲染流程

`RenderFlow` 是管线的子过程，按优先级排序执行。每个 Flow 包含多个 `RenderStage`。

```typescript
// cocos/rendering/render-flow.ts

export abstract class RenderFlow {
    get name(): string;          // 流程名称
    get priority(): number;      // 执行优先级
    get tag(): number;           // 标签
    get stages(): RenderStage[]; // 包含的渲染阶段

    abstract activate(pipeline: RenderPipeline): void;
    abstract render(camera: Camera): void;
    abstract destroy(): void;
}
```

### 内置 Flow

| Flow | 说明 | 职责 |
|------|------|------|
| ShadowFlow | 阴影流程 | 生成阴影贴图 |
| MainFlow | 主渲染流程 | 场景主要渲染 |
| UIFlow | UI 渲染流程 | 2D/UI 渲染 |
| PostProcessFlow | 后处理流程 | Bloom/FXAA 等 |

---

## RenderStage 渲染阶段

`RenderStage` 是渲染的最小执行单元，负责实际的 GPU 渲染命令录制。

```typescript
// cocos/rendering/render-stage.ts

export abstract class RenderStage {
    get name(): string;           // 阶段名称
    get priority(): number;       // 执行优先级
    get tag(): number;            // 标签

    abstract activate(flow: RenderFlow): void;
    abstract render(camera: Camera): void;   // 核心渲染逻辑
    abstract destroy(): void;
}
```

### 典型 Stage 执行流程

```
RenderStage.render(camera)
    │
    ├── 1. 场景剔除 (sceneCulling)
    │   ├── 视锥剔除 (Frustum Culling)
    │   ├── 距离剔除 (Distance Culling)
    │   └── 遮挡剔除 (Occlusion Culling)
    │
    ├── 2. 渲染队列填充
    │   ├── 遍历可见模型
    │   └── insertRenderPass() 插入队列
    │
    ├── 3. 渲染队列排序
    │   ├── 不透明物体：优先级 → 深度前→后 → Shader ID
    │   └── 透明物体：优先级 → 深度后→前 → Shader ID
    │
    ├── 4. 命令录制
    │   ├── beginRenderPass()
    │   ├── 遍历队列，执行 draw
    │   └── endRenderPass()
    │
    └── 5. 提交命令
```

---

## RenderQueue 渲染队列

`RenderQueue` 负责收集、排序和执行渲染命令。

### 源码解析

```typescript
// cocos/rendering/render-queue.ts

export class RenderQueue {
    public queue: CachedArray<IRenderPass>;  // 渲染过程队列

    constructor(desc: IRenderQueueDesc) {
        this._passDesc = desc;
        this._passPool = getPassPool();              // 对象池
        this.queue = new CachedArray(64, desc.sortFunc); // 带排序的缓存数组
    }

    clear(): void { /* 清空队列，重置对象池 */ }

    insertRenderPass(renderObj, subModelIdx, passIdx): boolean {
        // 1. 检查是否是透明/不透明（与队列类型匹配）
        // 2. 检查 pass.phase 是否匹配
        // 3. 计算 hash（优先级 + pass序号 + subModel序号）
        // 4. 从对象池取 IRenderPass 填充数据
        // 5. 插入缓存数组
    }

    sort(): void { this.queue.sort(); }

    recordCommandBuffer(device, renderPass, cmdBuff): void {
        // 遍历队列中所有 IRenderPass
        // 绑定 PipelineState、DescriptorSet、InputAssembler
        // 执行 draw
    }
}
```

### 排序策略

```typescript
// 不透明物体排序：减少状态切换
function opaqueCompareFn(a, b) {
    return (a.hash - b.hash) ||        // 优先级排序
           (a.depth - b.depth) ||       // 前到后（ Early-Z 优化）
           (a.shaderId - b.shaderId);   // Shader 相同的排在一起
}

// 透明物体排序：保证正确混合
function transparentCompareFn(a, b) {
    return (a.priority - b.priority) ||  // 优先级排序
           (a.hash - b.hash) ||
           (b.depth - a.depth) ||        // 后到前（画家算法）
           (a.shaderId - b.shaderId);
}
```

---

## RenderScene 渲染场景

`RenderScene` 管理场景中所有需要渲染的元素，是逻辑场景（Scene）和渲染管线之间的桥梁。

### 核心结构

```typescript
// cocos/render-scene/core/render-scene.ts

export class RenderScene {
    get root(): Root;                          // 根渲染管理器
    get cameras(): Camera[];                   // 相机列表
    get mainLight(): DirectionalLight | null;  // 主方向光
    get models(): Model[];                     // 模型列表

    // 光源管理
    _sphereLights: SphereLight[];            // 球面光源
    _spotLights: SpotLight[];                // 聚光灯
    _pointLights: PointLight[];              // 点光源
    _rangedDirLights: RangedDirectionalLight[]; // 范围平行光

    // 2D 渲染
    _batches: DrawBatch2D[];                 // 2D 绘制批次
}
```

### 场景数据收集

```
RenderScene
├── Cameras[]          ─── 相机视角定义
├── Models[]           ─── 3D 可渲染对象
│   └── SubModel[]     ─── 子模型（多材质）
│       ├── passes[]   ─── 渲染通道
│       └── shaders[]  ─── 编译后的着色器
├── Lights[]           ─── 光源数据
│   ├── DirectionalLight  (主光源)
│   ├── SphereLight       (球面光)
│   ├── SpotLight         (聚光灯)
│   └── PointLight        (点光源)
└── DrawBatch2D[]      ─── 2D 渲染批次
```

---

## Camera 相机系统

`Camera` 定义了场景的观察视角、投影方式和渲染参数。

### 核心枚举

```typescript
// cocos/render-scene/scene/camera.ts

enum CameraProjection {
    ORTHO,       // 正交投影
    PERSPECTIVE, // 透视投影
}

enum CameraFOVAxis {
    VERTICAL,    // 垂直锁定
    HORIZONTAL,  // 水平锁定
}

enum CameraAperture {
    F1_8, F2_0, F2_2, F2_5, F2_8,
    F3_2, F3_5, F4_0, F4_5, F5_0,
    F5_6, F6_3, F7_1, F8_0, // ... 模拟物理光圈
}

enum CameraShutter {
    D30, D60, D125, D250, D500, D1000, // 快门速度
}
```

### Camera 关键属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `projection` | `CameraProjection` | 投影类型 |
| `fov` | `number` | 视场角（弧度） |
| `orthoHeight` | `number` | 正交投影高度 |
| `nearClip` / `farClip` | `number` | 近/远裁剪面 |
| `priority` | `number` | 渲染优先级 |
| `clearFlags` | `ClearFlags` | 清除标志（颜色/深度/模板） |
| `visibility` | `number` | 可见性掩码 |
| `targetTexture` | `RenderTexture` | 渲染目标纹理 |

### 相机更新流程

```
Camera.update()
    │
    ├── 更新视图矩阵 (matView)
    │   └── 从 Node 世界矩阵的逆矩阵获取
    │
    ├── 更新投影矩阵 (matProj)
    │   ├── 透视投影: Mat4.perspective(fov, aspect, near, far)
    │   └── 正交投影: Mat4.ortho(...)
    │
    ├── 更新视锥体 (frustum)
    │   └── 从 VP 矩阵提取 6 个裁剪面
    │
    └── 更新屏幕缩放和分辨率
```

---

## Model 模型系统

`Model` 表示场景中的一个可渲染对象，包含几何数据和材质。

### 核心结构

```typescript
// cocos/render-scene/scene/model.ts

export class Model {
    // ─── 子模型 ───
    _subModels: SubModel[];         // 子模型数组（多材质支持）
    _modelBounds: geometry.AABB;    // 模型空间包围盒
    _worldBounds: geometry.AABB;    // 世界空间包围盒
    _priority: number;              // 渲染优先级
    _inited: boolean;               // 是否初始化

    // ModelType 枚举
    // DEFAULT      - 默认模型
    // SKINNING     - 骨骼动画模型
    // BATCH_2D     - 2D 批次模型
    // LINE         - 线条模型
    // PARTICLE     - 粒子模型
}
```

### SubModel 子模型

一个 Model 可能有多个 SubModel（如一个角色有身体、武器、头盔等不同材质部分）：

```
Model (角色)
├── SubModel[0] (身体)
│   ├── passes: Pass[]       ─── 渲染通道
│   ├── shaders: Shader[]    ─── 编译后着色器
│   ├── descriptorSet        ─── 描述符集
│   └── inputAssembler       ─── 顶点数据
├── SubModel[1] (武器)
│   └── ...
└── SubModel[2] (头盔)
    └── ...
```

---

## 光照系统

Cocos Creator 3.8 支持多种光源类型，每种光源都有独特的属性和渲染策略。

### 光源类型

```
Light (抽象基类)
├── DirectionalLight    ─── 方向光（太阳光）
├── SphereLight         ─── 球面光（灯泡）
├── SpotLight           ─── 聚光灯（手电筒）
├── PointLight          ─── 点光源
└── RangedDirectionalLight ─── 范围方向光
```

### 光源关键属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `color` | `Vec3` | 光源颜色 |
| `useColorTemperature` | `boolean` | 是否使用色温 |
| `colorTemp` | `number` | 色温值 |
| `finalColor` | `Vec3` | 最终颜色（经过色温调整） |
| `visibility` | `number` | 可见性掩码 |
| `baked` | `boolean` | 是否烘焙光源 |

### 各光源特有属性

| 光源 | 特有属性 |
|------|----------|
| DirectionalLight | `illuminance`（照度 lux）, `shadowEnabled` |
| SphereLight | `luminance`（亮度 cd/m²）, `range`, `size` |
| SpotLight | `luminance`, `range`, `spotAngle`, `spotInnerRatio` |
| PointLight | `luminance`, `range` |
| RangedDirectionalLight | `illuminance`, `range` |

### 光照剔除

```typescript
// cocos/rendering/scene-culling.ts
// 对点光源进行剔除，只保留影响相机视锥体的光源

function validPunctualLightsCulling(camera, scene) {
    // 1. 遍历所有点光源（Sphere/Spot/Point）
    // 2. 检查光源范围是否与视锥体相交
    // 3. 超出最大光源数量限制时，按距离排序裁剪
    // 4. 返回可见光源数组
}
```

---

## 渲染全流程

从一帧开始到最终上屏的完整流程：

```
Director.tick(dt)
    │
    ▼
Root.frameMove(dt)
    │
    ├── 更新场景数据
    │   ├── 更新所有 Node 的世界变换矩阵
    │   ├── 更新动画 (AnimationManager.update)
    │   ├── 更新物理 (PhysicsWorld.step)
    │   └── 更新相机 (Camera.update)
    │
    ▼
RenderPipeline.render(cameras)
    │
    ├── 遍历所有 Camera（按 priority 排序）
    │   │
    │   ▼
    │   遍历所有 RenderFlow（按 priority 排序）
    │   │
    │   ▼
    │   RenderFlow.render(camera)
    │   │
    │   ▼
    │   遍历所有 RenderStage（按 priority 排序）
    │   │
    │   ▼
    │   RenderStage.render(camera)
    │   │
    │   ├── 1. sceneCulling(camera, scene)
    │   │   └── 视锥剔除 + 距离剔除
    │   │
    │   ├── 2. 填充 RenderQueue
    │   │   └── 遍历可见模型，insertRenderPass
    │   │
    │   ├── 3. 排序队列
    │   │   ├── 不透明：hash → depth(前→后) → shaderId
    │   │   └── 透明：priority → hash → depth(后→前) → shaderId
    │   │
    │   ├── 4. 录制命令
    │   │   ├── cmdBuff.beginRenderPass(...)
    │   │   ├── 绑定 PSO、DescriptorSet、IA
    │   │   ├── cmdBuff.draw(...)
    │   │   └── cmdBuff.endRenderPass()
    │   │
    │   └── 5. 提交命令
    │
    ▼
Device.present()  ─── 上屏显示
```

---

## 技术原理

### 1. 三级管线架构（Pipeline-Flow-Stage）

```
Pipeline (管线)     ─── 顶层容器，管理全局资源
  └── Flow (流程)   ─── 子过程，如阴影、主渲染、后处理
       └── Stage (阶段) ─── 最小单元，执行具体渲染操作
```

这种三级架构的优势：
- **灵活性**：可以独立添加/移除 Flow 或 Stage
- **可扩展**：自定义管线只需添加新的 Flow/Stage
- **优先级排序**：每级都可以设置 priority 控制执行顺序

### 2. 场景剔除优化

渲染前对不可见对象进行剔除，大幅减少绘制量：
- **视锥剔除**：排除相机视锥外的对象
- **距离剔除**：排除距离过远的对象
- **遮挡剔除**：排除被其他对象遮挡的对象
- **光照剔除**：只保留影响当前视锥的光源

### 3. 排序优化策略

- **不透明物体从前到后**：利用 Early-Z 减少片元着色器执行
- **透明物体从后到前**：保证半透明混合正确
- **Shader ID 聚类**：减少 GPU 状态切换

---

## 下一步

完成渲染管线的学习后，继续学习 [03-着色器与材质](./03-shader-material.md)。
