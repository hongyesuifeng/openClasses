# 技术原理：实时渲染基础

> 渲染系统是游戏引擎最复杂的部分。在阅读 Cocos Creator 的 GFX 抽象层、渲染管线、着色器和 2D/3D 渲染源码之前，先理解 GPU 渲染管线、图形 API、着色器编程等核心技术原理。

---

## 目录

- [1. GPU 渲染管线](#1-gpu-渲染管线)
- [2. 图形 API 与硬件抽象](#2-图形-api-与硬件抽象)
- [3. 前向渲染与延迟渲染](#3-前向渲染与延迟渲染)
- [4. 着色器编程原理](#4-着色器编程原理)
- [5. 材质与着色器的关系](#5-材质与着色器的关系)
- [6. 2D 渲染与批处理](#6-2d-渲染与批处理)
- [7. 纹理与采样](#7-纹理与采样)

---

## 1. GPU 渲染管线

### 什么是渲染管线

渲染管线（Rendering Pipeline）是 GPU 将 3D 场景数据转换为 2D 屏幕像素的一系列处理阶段：

```
3D 模型数据（顶点、纹理、材质）
    │
    ▼
┌─────────────────────────────────────────────────────┐
│                   GPU 渲染管线                        │
│                                                     │
│  ┌───────────┐   ┌───────────┐   ┌───────────┐    │
│  │ 顶点处理  │──►│ 光栅化    │──►│ 片元处理  │    │
│  │ (Vertex)  │   │(Rasterize)│   │ (Fragment)│    │
│  └───────────┘   └───────────┘   └───────────┘    │
│       │                               │            │
│       ▼                               ▼            │
│  顶点着色器                        片元着色器       │
│  坐标变换                          颜色计算         │
│  投影变换                          纹理采样         │
│                                                     │
│  ┌───────────┐   ┌───────────┐                     │
│  │ 逐像素操作│──►│ 帧缓冲    │                     │
│  │(Per-Frag) │   │(Framebuffer)│                    │
│  └───────────┘   └───────────┘                     │
│  深度测试                                          │
│  模板测试                                          │
│  混合(Alpha Blend)                                 │
└─────────────────────────────────────────────────────┘
    │
    ▼
屏幕上的像素
```

### 各阶段详解

#### 1. 顶点着色器（Vertex Shader）

**输入**：每个顶点的属性（位置、法线、UV、颜色）
**输出**：裁剪空间中的顶点位置

```
对每个顶点执行：

// 模型空间 → 世界空间 → 观察空间 → 裁剪空间
gl_Position = ProjectionMatrix × ViewMatrix × ModelMatrix × vertexPosition;
```

**关键变换**：

```
模型空间        世界空间         观察空间         裁剪空间
(Model Space)  (World Space)  (View Space)   (Clip Space)
     │              │              │              │
     │ × ModelMatrix│ × ViewMatrix │ × ProjMatrix │ ÷ w
     ▼              ▼              ▼              ▼
  物体本地坐标   场景中的位置   相机视角下的位置  归一化设备坐标
```

#### 2. 光栅化（Rasterization）

将三角形变换为像素（片元）：

```
三角形顶点 → 判断哪些像素在三角形内 → 生成片元（Fragment）

  顶点数据                    片元数据
  (3个顶点)     光栅化      (覆盖的所有像素)
     ▲   ▲    ────────►    ■ ■ ■
    ╱     ╲               ■ ■ ■ ■
   ╱       ╲              ■ ■ ■ ■ ■
  ▲─────────▲             ■ ■ ■ ■
```

**重心坐标插值**：顶点属性（UV、法线、颜色）在三角形内通过重心坐标线性插值传递给每个片元。

#### 3. 片元着色器（Fragment Shader / Pixel Shader）

**输入**：光栅化后的片元（包含插值后的顶点属性）
**输出**：片元的颜色值

```
对每个片元执行：

// 从纹理采样颜色
vec4 texColor = texture(mainTexture, uv);

// 计算光照
vec3 lighting = computePhongLighting(normal, lightDir, viewDir);

// 最终颜色
fragColor = texColor * lighting;
```

#### 4. 逐像素操作（Output Merger）

```
深度测试（Depth Test）：
  比较片元深度与深度缓冲中的值
  近处物体遮挡远处物体 → 正确的前后关系

模板测试（Stencil Test）：
  用模板缓冲做遮罩
  实现镜面、传送门等效果

混合（Blending）：
  Alpha 混合：将片元颜色与帧缓冲中的颜色混合
  transparent = src × srcAlpha + dst × (1 - srcAlpha)
  这是半透明效果的基础
```

---

## 2. 图形 API 与硬件抽象

### 主流图形 API

```
                    抽象程度
    高 ◄────────────────────────────────► 低
    │                                      │
WebGL   WebGL2   WebGPU   Metal   Vulkan   DirectX12
 (简单)                              (显式控制，高性能)
```

| API | 平台 | 代数 | 特点 |
|-----|------|------|------|
| **WebGL** | Web | OpenGL ES 2.0 | 最广泛兼容，功能有限 |
| **WebGL2** | Web | OpenGL ES 3.0 | 支持更多纹理格式和 MRT |
| **WebGPU** | Web | Vulkan/Metal/D3D12 | 下一代，计算着色器 |
| **Metal** | Apple | — | Apple 原生，低开销 |
| **Vulkan** | Android/Win | — | 显式控制，多线程友好 |
| **OpenGL ES** | Android/iOS | — | 老牌，兼容性好 |
| **DirectX 11** | Windows | — | Windows 原生 |

### 为什么需要 GFX 抽象层

Cocos Creator 要在所有这些平台上运行，但每种 API 的接口完全不同：

```
问题：
  WebGL:  gl.bindTexture(gl.TEXTURE_2D, tex)
  Vulkan: vkCmdBindDescriptorSets(cmdBuf, ...)
  Metal:  [encoder setFragmentTexture:tex atIndex:0]

解决：GFX 抽象层提供统一接口
  gfxDevice.copyTexture(src, dst)  → 引擎只需调用这个
  各平台实现自己的后端               → 自动适配
```

### GFX 抽象层设计

```
Cocos GFX 层的核心抽象：

Device              ← GPU 设备的抽象
  ├── Buffer        ← 顶点缓冲、索引缓冲、Uniform 缓冲
  ├── Texture       ← 纹理资源
  ├── Sampler       ← 采样器（过滤模式、寻址模式）
  ├── Shader        ← 着色器程序
  ├── PipelineState ← 渲染状态（混合、深度、模板等）
  ├── CommandBuffer ← GPU 命令缓冲
  ├── Framebuffer   ← 渲染目标
  ├── RenderPass    ← 渲染过程描述
  └── InputAssembler← 顶点数据组装

使用方式：
  1. 创建资源（Buffer, Texture, Shader...）
  2. 设置渲染状态（PipelineState）
  3. 记录命令（CommandBuffer）
  4. 提交执行（Device.flush()）
```

> 源码 `cocos/gfx/base/` 定义了所有抽象接口，`cocos/gfx/webgl/`、`cocos/gfx/webgl2/`、`cocos/gfx/webgpu/` 分别实现各平台后端

---

## 3. 前向渲染与延迟渲染

### 前向渲染（Forward Rendering）

```
对每个物体：
    计算所有光照 → 输出最终颜色

                    ┌──────────┐
    Object1 ───────►│          │
    Object2 ───────►│  光照计算  │──► 屏幕
    Object3 ───────►│          │
    ...            └──────────┘

特点：
  ✅ 实现简单，对透明物体友好
  ✅ 支持硬件抗锯齿（MSAA）
  ❌ 光照数量多时性能差（O(物体数 × 光源数)）
  ❌ 被遮挡物体仍然执行光照计算
```

### 延迟渲染（Deferred Rendering）

```
第一步：几何通道（Geometry Pass）
  对每个物体只写入几何信息到 G-Buffer

  ┌─────────────────────────────┐
  │         G-Buffer            │
  │  RT0: Albedo (颜色)         │
  │  RT1: Normal (法线)         │
  │  RT2: Position/Roughness    │
  │  RT3: Metallic/AO           │
  │  Depth: 深度                │
  └─────────────────────────────┘

第二步：光照通道（Lighting Pass）
  逐像素读取 G-Buffer，计算所有光照

  ┌──────────┐    ┌──────────┐
  │ G-Buffer │───►│ 光照计算  │──► 屏幕
  └──────────┘    └──────────┘

特点：
  ✅ 光照计算与物体数量无关（O(像素数 × 光源数)）
  ✅ 被遮挡物体不计算光照
  ❌ 需要大量显存（G-Buffer）
  ❌ 不支持硬件 MSAA
  ❌ 透明物体仍需前向渲染
```

### Cocos Creator 的选择

Cocos Creator 3.8 **同时支持**两种渲染方式：

- **默认使用前向渲染**：适合大多数游戏场景，尤其是移动平台
- **支持延迟渲染**：通过自定义管线可选启用，适合多光源场景

> 源码 `cocos/rendering/` 目录下 `forward/` 和 `deferred/` 子目录分别实现了两种渲染管线

---

## 4. 着色器编程原理

### 着色器语言

| API | 着色器语言 |
|-----|-----------|
| WebGL/WebGL2 | GLSL (OpenGL Shading Language) |
| WebGPU | WGSL (WebGPU Shading Language) |
| Metal | MSL (Metal Shading Language) |
| DirectX | HLSL (High-Level Shading Language) |
| Vulkan | SPIR-V (中间字节码) |

### Cocos 的着色器方案

Cocos Creator 使用自己的 `.effect` 文件格式，**一次编写，自动编译为各平台的着色器语言**：

```
.effect 文件（Cocos 自定义格式）
    │
    ├── CCEffect §header    ← 着色器元信息（技术、Pass、状态）
    ├── CCProgram vs        ← 顶点着色器代码
    └── CCProgram fs        ← 片元着色器代码

编译时自动转换：
    GLSL (WebGL/WebGL2)
    MSL   (Metal)
    HLSL  (DirectX)
    SPIR-V (Vulkan)
```

### Uniform 传递机制

着色器需要从 CPU 接收数据（矩阵、纹理、参数），通过 Uniform 传递：

```
CPU 端：
  material.setProperty('mainColor', color)     ← 设置参数
  pipeline.setValue('cc_matViewProj', matVP)    ← 引擎内置矩阵

GPU 端（着色器中）：
  uniform vec4 mainColor;                       ← 接收参数
  uniform mat4 cc_matViewProj;                  ← 接收矩阵

传递方式：
  WebGL:  glUniform4f(location, r, g, b, a)
  WebGPU: 写入 Uniform Buffer → 绑定到 Bind Group
```

---

## 5. 材质与着色器的关系

### Effect → Material → Renderer 三层关系

```
EffectAsset (.effect 文件)
  │   定义着色器代码和渲染技术
  │   一个 Effect 可以包含多个 Technique
  │   每个 Technique 包含多个 Pass
  │
  ▼ 实例化
Material (.mtl 文件)
  │   Effect 的一个实例
  │   填充具体的参数值（颜色、纹理、数值）
  │   可以在编辑器中调整
  │
  ▼ 绑定
Renderer (MeshRenderer / Sprite)
      将 Material 关联到具体的可渲染对象
      引擎渲染时使用 Material 中的参数调用 Effect 的着色器
```

### 状态排序与渲染批次

```
渲染时，引擎按照以下顺序排序以减少状态切换：

1. Shader（着色器程序）  ← 切换代价最高
2. Material（材质参数）  ← 切换代价高
3. Texture（纹理）       ← 切换代价中等
4. Mesh（网格数据）      ← 切换代价较低

相同 Shader + Material + Texture 的物体可以合并为一个 Draw Call
这就是 2D 批处理和 3D 实例化渲染的基础
```

---

## 6. 2D 渲染与批处理

### 2D 渲染的特殊性

```
2D 渲染 vs 3D 渲染：

2D 特点：
  - 没有透视投影（正交相机）
  - 大量小图（Sprite），每个很小但数量多
  - 没有复杂光照（通常只有透明度混合）
  - 性能瓶颈在 Draw Call 数量

3D 特点：
  - 透视投影
  - 较少的大模型
  - 复杂光照计算
  - 性能瓶颈在像素填充率
```

### Draw Call 为什么慢

```
一个 Draw Call 的流程：

CPU 端                           GPU 端
┌──────────────────────┐        ┌──────────────────┐
│ 设置着色器            │ ────► │                   │
│ 设置纹理              │ ────► │  等待...           │
│ 设置 Uniform          │ ────► │                   │
│ 提交绘制命令          │ ────► │  执行渲染          │
│ 等待 GPU 完成...      │        │                   │
└──────────────────────┘        └──────────────────┘

问题：CPU→GPU 通信开销大
  - 每次调用都有驱动层验证
  - CPU 和 GPU 之间有同步等待
  - 1000 个 Sprite = 1000 次 Draw Call = 卡顿
```

### 动态合批（Dynamic Batching）

```
将多个 Sprite 合并为一个 Draw Call：

Sprite1 (顶点 4 个)
Sprite2 (顶点 4 个)     合并     一个大的顶点缓冲
Sprite3 (顶点 4 个)   ──────►   (顶点 12 个)
Sprite4 (顶点 4 个)             一次 Draw Call

条件：
  1. 使用相同的材质（同一纹理图集）
  2. 顶点数不超过限制
  3. 不穿插不同材质的精灵

Cocos 的 Batcher2D 就是做这件事：
  收集所有 2D 渲染组件 → 排序 → 合并 → 提交
```

> 源码 `cocos/2d/renderer/batcher-2d.ts` 是 2D 渲染的核心。它维护一个渲染队列，将相同材质的 Sprite 合并为一个 Draw Call

---

## 7. 纹理与采样

### 纹理的工作原理

```
纹理 = 一张二维图片，存储在 GPU 显存中

UV 坐标：
  (0,0) ─────── (1,0)
    │               │
    │    纹理图片    │
    │               │
  (0,1) ─────── (1,1)

顶点着色器传递 UV → 片元着色器采样 → 获取颜色
```

### Mipmap

```
原始纹理 1024×1024
├── Level 0: 1024×1024  ← 近距离使用（清晰）
├── Level 1:  512×512   ← 中距离
├── Level 2:  256×256   ← 远距离
├── Level 3:  128×128
├── ...
└── Level 10: 1×1       ← 最远距离（模糊但够用）

好处：
  1. 远处物体不需要采样高分辨率纹理（省带宽）
  2. 避免远处纹理的摩尔纹闪烁（aliasing）
```

### 纹理过滤

```
当片元的 UV 坐标不精确落在纹素中心时，需要插值：

最近邻过滤 (Nearest)：
  取最近的纹素 → 像素风（Minecraft 风格）

双线性过滤 (Bilinear)：
  周围 4 个纹素加权平均 → 平滑

三线性过滤 (Trilinear)：
  两个 mipmap 层级分别双线性插值，再在层级间线性插值 → 最平滑
```

### 纹理寻址模式

```
UV 坐标超出 [0,1] 范围时的处理方式：

Repeat:  重复平铺      ░░░░|░░░░|░░░░
Clamp:   边缘像素延伸   ░░░░|████|████
Mirror:  镜像翻转      ░░░░|░░░░|░░░░
```

---

## 延伸阅读

- [LearnOpenGL](https://learnopengl.com/) — OpenGL/WebGL 渲染教程（强烈推荐）
- [WebGL Fundamentals](https://webglfundamentals.org/) — WebGL 基础教程
- [Real-Time Rendering 4th Edition](https://www.realtimerendering.com/) — 实时渲染圣经
- [The Book of Shaders](https://thebookofshaders.com/) — 着色器入门（互动式）

---

> 理解了这些原理后，继续阅读 [01-GFX 抽象层](./01-gfx-abstraction.md) 查看对应的源码实现。
