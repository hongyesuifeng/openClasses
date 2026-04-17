# GFX 抽象层

GFX（Graphics）层是 Cocos Creator 渲染系统的最底层抽象，封装了不同图形 API（WebGL、WebGL2、WebGPU）的差异，为上层渲染管线提供统一接口。

## 目录

- [架构概述](#架构概述)
- [核心类继承体系](#核心类继承体系)
- [Device 图形设备](#device-图形设备)
- [Buffer 缓冲区](#buffer-缓冲区)
- [Texture 纹理](#texture-纹理)
- [Shader 着色器](#shader-着色器)
- [PipelineState 管线状态](#pipelinestate-管线状态)
- [CommandBuffer 命令缓冲](#commandbuffer-命令缓冲)
- [多后端实现](#多后端实现)
- [技术原理](#技术原理)

---

## 架构概述

```
┌─────────────────────────────────────────────────────────┐
│                   上层渲染系统                            │
│          RenderPipeline / RenderScene / Camera           │
└────────────────────────┬────────────────────────────────┘
                         │ 调用
                         ▼
┌─────────────────────────────────────────────────────────┐
│                    GFX 抽象层                            │
│                                                         │
│  Device (设备管理)     Queue (命令队列)                   │
│  Buffer (缓冲区)       Texture (纹理)                    │
│  Shader (着色器)       PipelineState (管线状态)          │
│  Framebuffer (帧缓冲)  RenderPass (渲染过程)             │
│  CommandBuffer (命令缓冲) InputAssembler (输入汇集)      │
│  DescriptorSet (描述符集) Sampler (采样器)               │
└────────────────────────┬────────────────────────────────┘
                         │ 实现
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
  ┌───────────┐   ┌───────────┐   ┌───────────┐
  │  WebGL    │   │  WebGL2   │   │  WebGPU   │
  │  Device   │   │  Device   │   │  Device   │
  └───────────┘   └───────────┘   └───────────┘
```

### 核心文件

| 文件 | 路径 | 说明 |
|------|------|------|
| 设备基类 | `cocos/gfx/base/device.ts` | GFX 设备抽象 |
| 缓冲区 | `cocos/gfx/base/buffer.ts` | 顶点/索引缓冲 |
| 纹理 | `cocos/gfx/base/texture.ts` | 纹理资源抽象 |
| 着色器 | `cocos/gfx/base/shader.ts` | 着色器程序 |
| 管线状态 | `cocos/gfx/base/pipeline-state.ts` | 渲染管线状态 |
| 帧缓冲 | `cocos/gfx/base/framebuffer.ts` | 帧缓冲对象 |
| 命令缓冲 | `cocos/gfx/base/command-buffer.ts` | GPU 命令录制 |
| 输入汇集 | `cocos/gfx/base/input-assembler.ts` | 顶点数据组装 |
| 渲染过程 | `cocos/gfx/base/render-pass.ts` | 渲染 Pass |
| 描述符集 | `cocos/gfx/base/descriptor-set.ts` | 资源绑定 |
| 类型定义 | `cocos/gfx/base/define.ts` | 枚举、接口、常量 |

---

## 核心类继承体系

```
GFXObject (基类, 所有 GFX 资源的标记基类)
├── Buffer              缓冲区
├── Texture             纹理
├── Shader              着色器
├── PipelineState       管线状态
├── Framebuffer         帧缓冲
├── CommandBuffer       命令缓冲
├── InputAssembler      输入汇集器
├── RenderPass          渲染过程
├── DescriptorSet       描述符集
├── DescriptorSetLayout 描述符集布局
├── PipelineLayout      管线布局
├── Queue               命令队列
└── Sampler             采样器

Device (独立, 不继承 GFXObject)
```

所有 GFX 资源都继承自 `GFXObject`，它持有一个 `ObjectType` 枚举值用于类型识别。

---

## Device 图形设备

`Device` 是 GFX 层的核心，负责创建和管理所有 GPU 资源。它是一个抽象类，由各后端（WebGL/WebGL2/WebGPU）具体实现。

### 源码解析

```typescript
// cocos/gfx/base/device.ts

export abstract class Device {
    // ─── 核心属性 ───
    get gfxAPI(): API              // 当前渲染 API（WEBGL, WEBGL2, WEBGPU）
    get queue(): Queue             // 默认命令队列
    get commandBuffer(): CommandBuffer  // 默认命令缓冲
    get renderer(): string         // 渲染器描述（如 "ANGLE"）
    get vendor(): string           // GPU 厂商（如 "NVIDIA"）
    get capabilities(): DeviceCaps // 设备能力
    get numDrawCalls(): number     // 当前绘制调用次数
    get numInstances(): number     // 当前实例数量
    get numTris(): number          // 当前三角形数量
    get memoryStatus(): MemoryStatus  // 内存使用状态

    // ─── 生命周期 ───
    abstract initialize(info: DeviceInfo): boolean | Promise<boolean>;
    abstract destroy(): void;
    abstract acquire(swapchains: Swapchain[]): void;  // 获取交换链
    abstract present(): void;                           // 上屏显示

    // ─── 资源创建方法 ───
    abstract createBuffer(info: BufferInfo): Buffer;
    abstract createTexture(info: TextureInfo): Texture;
    abstract createShader(info: ShaderInfo): Shader;
    abstract createPipelineState(info: PipelineStateInfo): PipelineState;
    abstract createFramebuffer(info: FramebufferInfo): Framebuffer;
    abstract createRenderPass(info: RenderPassInfo): RenderPass;
    abstract createInputAssembler(info: InputAssemblerInfo): InputAssembler;
    abstract createDescriptorSet(info: DescriptorSetInfo): DescriptorSet;
    abstract createCommandBuffer(info: CommandBufferInfo): CommandBuffer;
    abstract createSwapchain(info: SwapchainInfo): Swapchain;
    abstract createQueue(info: QueueInfo): Queue;
    abstract createPipelineLayout(info: PipelineLayoutInfo): PipelineLayout;
    abstract createDescriptorSetLayout(info: DescriptorSetLayoutInfo): DescriptorSetLayout;

    // ─── 数据拷贝 ───
    abstract copyBuffersToTexture(buffers, texture, regions): void;
    abstract copyTextureToBuffers(texture, buffers, regions): void;
}
```

### 设备初始化流程

```
1. DeviceManager.create(info)
       │
       ▼
2. new WebGLDevice() / WebGPUDevice()
       │
       ▼
3. device.initialize(info)
       │
       ├── 创建 WebGL/WebGPU 上下文
       ├── 检测设备特性 (features)
       ├── 初始化能力数据 (capabilities)
       ├── 创建默认 Queue 和 CommandBuffer
       └── 初始化绑定映射 (bindingMappingInfo)
       │
       ▼
4. 返回可用的 Device 实例
```

### 关键属性说明

| 属性 | 类型 | 说明 |
|------|------|------|
| `_gfxAPI` | `API` | 当前图形 API 枚举 |
| `_features` | `boolean[]` | 特性支持数组 |
| `_caps` | `DeviceCaps` | 设备能力（最大纹理尺寸、最大顶点属性等） |
| `_bindingMappingInfo` | `BindingMappingInfo` | Uniform/Texture 绑定槽位映射 |
| `_numDrawCalls` | `number` | 统计信息，绘制调用次数 |

---

## Buffer 缓冲区

Buffer 封装了 GPU 缓冲区，用于存储顶点数据、索引数据、Uniform 数据等。

### 源码解析

```typescript
// cocos/gfx/base/buffer.ts

export abstract class Buffer extends GFXObject {
    get usage(): BufferUsage      // 使用方式（VERTEX/INDEX/UNIFORM/TRANSFER 等）
    get memUsage(): MemoryUsage   // 内存类型（DEVICE/HOST）
    get size(): number            // 缓冲区大小（字节）
    get stride(): number          // 每个元素的步长
    get count(): number           // 元素数量

    abstract initialize(info: BufferInfo | BufferViewInfo): void;
    abstract destroy(): void;
    abstract resize(size: number): void;
    abstract update(buffer: BufferSource, size?: number): void;
}
```

### BufferUsage 用途

| 枚举值 | 说明 |
|--------|------|
| `VERTEX` | 顶点缓冲（VBO） |
| `INDEX` | 索引缓冲（IBO） |
| `UNIFORM` | Uniform 缓冲（UBO） |
| `STORAGE` | 存储/计算缓冲 |
| `INDIRECT` | 间接绘制参数缓冲 |
| `TRANSFER_SRC` | 传输源 |
| `TRANSFER_DST` | 传输目标 |

### MemoryUsage 内存类型

| 枚举值 | 说明 |
|--------|------|
| `DEVICE` | GPU 显存，CPU 不可直接访问 |
| `UPLOAD` | 上传堆，CPU→GPU 的暂存区 |
| `DOWNLOAD` | 下载堆，GPU→CPU 的暂存区 |

### BufferView 概念

Buffer 支持通过 `BufferViewInfo` 创建视图，即从已有 Buffer 中划分一段区域使用，类似 WebGL 中的 `bindBufferRange`。

```
┌─────────────── Buffer (1024 bytes) ───────────────┐
│                                                    │
│  ┌─ BufferView 0 (0~255) ──┐  ┌─ BufferView 1 ──┐│
│  │  Uniform 数据 (mat4)     │  │  顶点数据        ││
│  └──────────────────────────┘  └─────────────────┘│
└────────────────────────────────────────────────────┘
```

---

## Texture 纹理

Texture 封装了 GPU 纹理资源，支持 1D/2D/3D/Cube 等多种纹理类型。

### 源码解析

```typescript
// cocos/gfx/base/texture.ts

export abstract class Texture extends GFXObject {
    get type(): TextureType       // 纹理类型（TEX1D/TEX2D/TEX3D/CUBE）
    get usage(): TextureUsage     // 使用方式（COLOR/DEPTH/STENCIL/SAMPLE 等）
    get format(): Format          // 像素格式（RGBA8/RGBA32F/DEPTH24 等）
    get width(): number           // 宽度
    get height(): number          // 高度
    get depth(): number           // 深度（3D纹理）
    get layerCount(): number      // 数组层数
    get levelCount(): number      // Mip 层级数
    get samples(): SampleCount    // 采样数（MSAA）
    get size(): number            // 内存大小

    abstract initialize(info: TextureInfo | TextureViewInfo): void;
    abstract destroy(): void;
    abstract resize(width: number, height: number): void;
}
```

### TextureType 纹理类型

| 类型 | 说明 | 典型用途 |
|------|------|----------|
| `TEX1D` | 一维纹理 | 查找表 |
| `TEX2D` | 二维纹理 | 贴图、渲染目标 |
| `TEX3D` | 三维纹理 | 体积雾、3D 查找表 |
| `CUBE` | 立方体纹理 | 天空盒、环境贴图 |
| `TEX2D_ARRAY` | 2D 纹理数组 | 级联阴影贴图 |

### Format 常用格式

| 格式 | 说明 | 每像素字节 |
|------|------|-----------|
| `RGBA8` | 标准 RGBA | 4 |
| `RGBA32F` | 浮点 RGBA | 16 |
| `DEPTH24_STENCIL8` | 深度模板 | 4 |
| `DEPTH16` | 16位深度 | 2 |
| `BC1` ~ `BC7` | 压缩格式 | 0.5~1 |

---

## Shader 着色器

Shader 封装了 GPU 着色器程序，管理顶点属性、Uniform 块和采样器声明。

### 源码解析

```typescript
// cocos/gfx/base/shader.ts

export abstract class Shader extends GFXObject {
    get name(): string               // 着色器名称
    get stages(): ShaderStage[]      // 着色器阶段（VS/FS/CS）
    get attributes(): Attribute[]    // 顶点属性声明
    get blocks(): UniformBlock[]     // Uniform 块声明
    get samplers(): UniformSampler[] // 采样器声明

    abstract initialize(info: ShaderInfo): void;
    abstract destroy(): void;
}
```

### ShaderStage 着色器阶段

```typescript
interface ShaderStage {
    stage: ShaderStageFlagBit;  // VERTEX / FRAGMENT / COMPUTE
    source: string;             // GLSL/WGSL 源码
    entry: string;              // 入口函数名
}
```

### ShaderInfo 创建信息

```typescript
interface ShaderInfo {
    name: string;                 // 着色器名
    stages: ShaderStage[];        // 各阶段
    attributes: Attribute[];      // 顶点属性（a_position, a_normal 等）
    blocks: UniformBlock[];       // Uniform 块（cc_matViewProj 等）
    samplers: UniformSampler[];   // 纹理采样器（cc_texture 等）
}
```

---

## PipelineState 管线状态

PipelineState 封装了完整的 GPU 渲染管线状态，是 Vulkan 风格的设计，将所有渲染状态打包成一个不可变对象。

### 源码解析

```typescript
// cocos/gfx/base/pipeline-state.ts

export abstract class PipelineState extends GFXObject {
    get shader(): Shader              // 关联的着色器
    get pipelineLayout(): PipelineLayout  // 管线布局（描述符布局集合）
    get primitive(): PrimitiveMode    // 图元模式（TRIANGLE_LIST/LINE_LIST 等）
    get rasterizerState(): RasterizerState  // 光栅化状态
    get depthStencilState(): DepthStencilState  // 深度模板状态
    get blendState(): BlendState      // 混合状态
    get inputState(): InputState      // 顶点输入状态
    get dynamicStates(): DynamicStateFlags  // 动态可变状态

    abstract initialize(info: PipelineStateInfo): void;
    abstract destroy(): void;
}
```

### PipelineStateInfo 创建参数

```typescript
// cocos/gfx/base/pipeline-state.ts

export class PipelineStateInfo {
    constructor (
        public shader: Shader = null!,              // 着色器
        public pipelineLayout: PipelineLayout = null!, // 管线布局
        public renderPass: RenderPass = null!,      // 关联的渲染过程
        public inputState: InputState = new InputState(),  // 顶点输入
        public rasterizerState: RasterizerState = new RasterizerState(),  // 光栅化
        public depthStencilState: DepthStencilState = new DepthStencilState(),  // 深度模板
        public blendState: BlendState = new BlendState(),  // 混合
        public primitive: PrimitiveMode = PrimitiveMode.TRIANGLE_LIST,  // 图元
        public dynamicStates: DynamicStateFlags = DynamicStateFlagBit.NONE,  // 动态状态
        public bindPoint: PipelineBindPoint = PipelineBindPoint.GRAPHICS,  // 绑定点
    ) {}
}
```

### 渲染管线状态组成

```
PipelineState
├── Shader              ─── 着色器程序
├── PipelineLayout      ─── 描述符布局
├── RenderPass          ─── 渲染过程
├── InputState          ─── 顶点属性绑定
├── RasterizerState     ─── 光栅化（剔除模式、填充模式）
├── DepthStencilState   ─── 深度测试、模板测试
├── BlendState          ─── 颜色混合（源因子、目标因子）
├── PrimitiveMode       ─── 图元类型
└── DynamicStateFlags   ─── 可动态修改的状态
```

---

## CommandBuffer 命令缓冲

CommandBuffer 用于录制 GPU 渲染命令，采用命令模式（Command Pattern），先录制后执行。

### 核心 API

| 方法 | 说明 |
|------|------|
| `beginRenderPass(renderPass, framebuffer)` | 开始渲染过程 |
| `endRenderPass()` | 结束渲染过程 |
| `bindPipelineState(pso)` | 绑定管线状态 |
| `bindDescriptorSet(set, descriptorSet)` | 绑定描述符集 |
| `bindInputAssembler(ia)` | 绑定输入汇集器 |
| `draw(drawInfo)` | 执行绘制 |
| `setViewport(vp)` | 设置视口 |
| `setScissor(scissor)` | 设置裁剪区域 |
| `updateBuffer(buffer, data)` | 更新缓冲数据 |
| `copyTextureToBuffer(...)` | 拷贝纹理到缓冲 |

### 典型渲染命令流程

```
cmdBuff.begin()
  │
  ├── beginRenderPass(renderPass, framebuffer)
  │     │
  │     ├── bindPipelineState(pipelineState)
  │     ├── bindDescriptorSet(0, descriptorSet)
  │     ├── bindInputAssembler(inputAssembler)
  │     ├── setViewport(viewport)
  │     ├── draw(drawInfo)
  │     │
  │     └── endRenderPass()
  │
cmdBuff.end()
  │
  ▼
queue.submit(cmdBuff)
device.present()
```

---

## 多后端实现

GFX 层最大的设计目标是屏蔽不同图形 API 的差异。每个后端提供具体实现：

### 后端目录结构

```
cocos/gfx/
├── base/          # 抽象接口
├── webgl/         # WebGL 1.0 实现
│   ├── webgl-device.ts
│   ├── webgl-buffer.ts
│   ├── webgl-texture.ts
│   └── ...
├── webgl2/        # WebGL 2.0 实现
│   ├── webgl2-device.ts
│   ├── webgl2-buffer.ts
│   ├── webgl2-texture.ts
│   └── ...
├── webgpu/        # WebGPU 实现
│   ├── webgpu-device.ts
│   ├── webgpu-buffer.ts
│   └── ...
└── empty/         # 空实现（用于测试/服务端渲染）
```

### 继承关系

```
Device (抽象)
├── WebGLDevice    ──→  WebGL 1.0 上下文
├── WebGL2Device   ──→  WebGL 2.0 上下文
└── WebGPUDevice   ──→  WebGPU 适配器
```

### DeviceManager 设备创建

```typescript
// cocos/gfx/device-manager.ts
// 根据运行环境自动选择最佳后端

DeviceManager.create(info) {
    // 优先尝试 WebGPU → WebGL2 → WebGL
    // 返回最合适的 Device 实例
}
```

---

## 技术原理

### 1. 抽象工厂模式

GFX 层采用经典的抽象工厂模式，`Device` 就是工厂，每个 `create*` 方法生产对应的抽象产品：

```
Device (抽象工厂)
├── createBuffer()      → Buffer (抽象产品)
├── createTexture()     → Texture (抽象产品)
├── createShader()      → Shader (抽象产品)
└── createPipelineState() → PipelineState (抽象产品)

WebGL2Device (具体工厂)
├── createBuffer()      → WebGL2Buffer (具体产品)
├── createTexture()     → WebGL2Texture (具体产品)
└── ...
```

### 2. Vulkan 风格设计

GFX 的 API 设计大量参考了 Vulkan 的理念：
- **PipelineState**：将渲染状态打包为不可变对象，而非逐个设置状态
- **CommandBuffer**：命令录制与执行分离
- **DescriptorSet**：资源绑定通过描述符集批量完成
- **RenderPass / Framebuffer**：显式管理渲染过程和帧缓冲

### 3. 对象池与资源管理

- GFX 资源通过 `Device` 统一创建和销毁
- Sampler、Barrier 等轻量对象使用内部缓存池（`_samplers: Map<number, Sampler>`）
- Buffer 和 Texture 的创建/销毁需要成对调用

---

## 下一步

完成 GFX 抽象层的学习后，继续学习 [02-渲染管线](./02-render-pipeline.md)。
