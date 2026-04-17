# 技术原理：实时渲染基础

> 渲染系统是游戏引擎最复杂的部分。在阅读 Godot 4.x 的 RenderingDevice、渲染管线、着色器和 2D/3D 渲染源码之前，先理解 GPU 渲染管线、现代图形 API、Clustered Shading、GDShader 等核心技术原理。

---

## 目录

- [1. GPU 渲染管线](#1-gpu-渲染管线)
- [2. 现代图形 API 与 GPU 抽象](#2-现代图形-api-与-gpu-抽象)
- [3. 前向渲染与延迟渲染](#3-前向渲染与延迟渲染)
- [4. Clustered Shading 原理](#4-clustered-shading-原理)
- [5. 着色器编程与 GDShader](#5-着色器编程与-gdshader)
- [6. 纹理与采样](#6-纹理与采样)

---

## 1. GPU 渲染管线

### 什么是渲染管线

渲染管线（Rendering Pipeline）是 GPU 将 3D 场景数据转换为 2D 屏幕像素的一系列处理阶段。理解管线是理解一切渲染技术的基础。

```
3D 模型数据（顶点、纹理、材质）
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│                     GPU 渲染管线                         │
│                                                         │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐  │
│  │  输入装配   │──►│  顶点处理   │──►│  曲面细分   │  │
│  │(IA)         │   │(Vertex)     │   │(Tessellation)│  │
│  └─────────────┘   └─────────────┘   └─────────────┘  │
│                                            │            │
│                                            ▼            │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐  │
│  │  输出合并   │◄──│  片元处理   │◄──│  光栅化     │  │
│  │(Output      │   │(Fragment)   │   │(Rasterizer) │  │
│  │ Merger)     │   │             │   │             │  │
│  └─────────────┘   └─────────────┘   └─────────────┘  │
│                                                         │
│  深度测试 │ 模板测试 │ 混合(Blend)                       │
└─────────────────────────────────────────────────────────┘
    │
    ▼
屏幕上的像素（Framebuffer）
```

### 各阶段详解

#### 1.1 输入装配（Input Assembly）

GPU 从顶点缓冲（Vertex Buffer）和索引缓冲（Index Buffer）中读取原始几何数据，组装成图元（三角形、线段、点等）：

```
顶点缓冲 (VBO)           索引缓冲 (IBO)
┌──────────────┐         ┌───────────┐
│ v0: pos,uv   │         │ 0, 1, 2   │
│ v1: pos,uv   │  ◄────  │ 0, 2, 3   │
│ v2: pos,uv   │         │ 4, 5, 6   │
│ v3: pos,uv   │         └───────────┘
│ ...          │
└──────────────┘

索引 0,1,2 → 组装三角形 (v0, v1, v2)
索引 0,2,3 → 组装三角形 (v0, v2, v3)
```

#### 1.2 顶点着色器（Vertex Shader）

**输入**：每个顶点的属性（位置、法线、UV、颜色）
**输出**：裁剪空间中的顶点位置（gl_Position）

顶点着色器最核心的工作是坐标变换——将顶点从模型空间变换到裁剪空间：

```
对每个顶点执行：

// 模型空间 → 世界空间 → 观察空间 → 裁剪空间
gl_Position = ProjectionMatrix × ViewMatrix × ModelMatrix × vertexPosition;
```

**四步坐标变换**：

```
模型空间        世界空间         观察空间         裁剪空间          NDC
(Model Space)  (World Space)  (View Space)   (Clip Space)    (NDC)
     │              │              │              │              │
     │ × Model      │ × View      │ × Projection │ ÷ w          │
     │ Matrix       │ Matrix      │ Matrix       │ (透视除法)    │
     ▼              ▼              ▼              ▼              ▼
  物体本地坐标   场景中的位置   相机视角下位置   齐次裁剪坐标   [-1,1] 范围
```

各空间的作用：
- **模型空间**：建模时的局部坐标，原点在物体中心
- **世界空间**：场景中的绝对位置，由 Model Matrix（Transform3D）变换得到
- **观察空间**：以相机为原点的坐标，由 View Matrix（Camera3D 的逆矩阵）变换得到
- **裁剪空间**：投影后的齐次坐标，w 分量用于透视除法
- **NDC（Normalized Device Coordinates）**：归一化设备坐标，范围 [-1, 1]

#### 1.3 光栅化（Rasterization）

将三角形变换为片元（Fragment），每个片元对应屏幕上的一个像素位置：

```
三角形顶点 → 判断哪些像素在三角形内 → 生成片元

  顶点数据                    片元数据
  (3个顶点)     光栅化      (覆盖的所有像素)
     ▲   ▲    ────────►    ■ ■ ■
    ╱     ╲               ■ ■ ■ ■
   ╱       ╲              ■ ■ ■ ■ ■
  ▲─────────▲             ■ ■ ■ ■
```

**重心坐标插值**（Barycentric Interpolation）：顶点属性（UV、法线、颜色、深度）在三角形内通过重心坐标线性插值传递给每个片元。这是保证纹理、光照正确映射的基础。

#### 1.4 片元着色器（Fragment Shader / Pixel Shader）

**输入**：光栅化后的片元（包含插值后的顶点属性）
**输出**：片元的颜色值

```
对每个片元执行：

// 从纹理采样颜色
vec4 texColor = texture(albedoTex, uv);

// 计算光照 (PBR)
vec3 lighting = computePBR(normal, lightDir, viewDir, metallic, roughness);

// 最终颜色
fragColor = texColor * lighting;
```

#### 1.5 输出合并（Output Merger）

片元着色器输出颜色后，还需要经过一系列逐像素测试和混合操作：

```
深度测试（Depth Test）：
  比较片元深度与深度缓冲中的值
  近处物体遮挡远处物体 → 正确的前后关系
  Godot 使用反向 Z（Reversed-Z）获得更好的深度精度

模板测试（Stencil Test）：
  用模板缓冲做遮罩
  实现镜面、传送门、遮罩裁剪等效果

混合（Blending）：
  Alpha 混合：将片元颜色与帧缓冲中的颜色混合
  result = src × srcAlpha + dst × (1 - srcAlpha)
  这是半透明效果的基础
```

---

## 2. 现代图形 API 与 GPU 抽象

### Legacy vs 现代 Graphics API

```
                    控制粒度
    高（自动管理） ◄────────────────────────► 低（显式控制）
    │                                            │
OpenGL       OpenGL ES      Metal      Vulkan       D3D12
(Driver      (Mobile        (Apple     (Khronos      (Microsoft
 manages      Legacy)        Native)   Explicit)     Explicit)
 everything)
```

| 特性 | Legacy (OpenGL) | 现代 (Vulkan/Metal/D3D12) |
|------|-----------------|--------------------------|
| 命令提交 | 全局状态机，隐式提交 | 命令缓冲（Command Buffer），显式录制 |
| 资源绑定 | glBind* 系列函数 | 描述符集（Descriptor Set） |
| 管线状态 | 分散设置（glEnable/glBlend） | 打包为 PipelineState 对象 |
| 内存管理 | 驱动自动管理 | 应用显式管理内存 |
| 多线程 | 不支持录制 | 支持多线程命令录制 |
| 错误检查 | 运行时 glError | 验证层（Validation Layer） |
| 着色器 | GLSL 运行时编译 | SPIR-V 字节码预编译 |

### 为什么 Godot 需要抽象层

Godot 4.x 需要在多个平台运行，每个平台使用不同的图形 API：

```
问题：
  Vulkan:  vkCmdBindDescriptorSets(cmdBuf, ...)
  Metal:   [encoder setFragmentTexture:tex atIndex:0]
  D3D12:   cmdList->SetGraphicsRootDescriptorTable(slot, handle)
  OpenGL:  glBindTexture(GL_TEXTURE_2D, tex)

解决：RenderingDevice 提供统一接口
  RD::get_singleton()->texture_bind(tex, binding)  → 引擎只需调用这个
  各平台实现自己的后端                   → 自动适配
```

### Godot 的 RenderingDevice 抽象

Godot 4.x 的 RenderingDevice (RD) 采用 Vulkan 风格设计，核心抽象：

```
RenderingDevice (GPU 设备抽象)
  ├── Buffer              ← 顶点缓冲、索引缓冲、Uniform 缓冲、Storage 缓冲
  ├── Texture             ← 纹理资源、渲染目标
  ├── Shader              ← SPIR-V 字节码
  ├── PipelineState       ← 渲染管线状态（不可变对象）
  ├── Framebuffer         ← 渲染目标集合
  ├── RenderPass          ← 渲染过程描述
  ├── CommandBuffer       ← GPU 命令录制
  ├── UniformSet          ← 资源绑定集（Descriptor Set）
  └── PipelineCache       ← 管线状态缓存
```

使用方式（Vulkan 风格）：
1. 创建着色器（SPIR-V 编译）
2. 创建管线状态（PipelineState = Shader + Blend + Depth + ...）
3. 创建 UniformSet（绑定 Buffer/Texture 到着色器槽位）
4. 录制命令（CommandBuffer）
5. 提交执行（Submit + Present）

> 源码 `servers/rendering/rendering_device.h` 和 `rendering_device.cpp` 定义了完整的 GPU 抽象接口。后端实现在 `drivers/vulkan/`、`drivers/metal/`、`drivers/d3d12/` 目录。

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
  + 实现简单，对透明物体友好
  + 支持硬件抗锯齿（MSAA）
  + 显存占用少
  - 光照数量多时性能差（O(物体数 x 光源数)）
  - 被遮挡物体仍然执行光照计算
```

### 延迟渲染（Deferred Rendering）

```
第一步：几何通道（Geometry Pass）
  对每个物体只写入几何信息到 G-Buffer

  ┌─────────────────────────────┐
  │         G-Buffer            │
  │  RT0: Albedo + Metallic     │
  │  RT1: Normal + Roughness    │
  │  RT2: Emission + AO         │
  │  Depth: 深度                │
  └─────────────────────────────┘

第二步：光照通道（Lighting Pass）
  逐像素读取 G-Buffer，计算所有光照

  ┌──────────┐    ┌──────────┐
  │ G-Buffer │───►│ 光照计算  │──► 屏幕
  └──────────┘    └──────────┘

特点：
  + 光照计算与物体数量无关（O(像素数 x 光源数)）
  + 被遮挡物体不计算光照
  - 需要大量显存（G-Buffer）
  - 不支持硬件 MSAA
  - 透明物体仍需前向渲染
  - 实现复杂度高
```

### 前向渲染 vs 延迟渲染对比

| 特性 | Forward | Deferred |
|------|---------|----------|
| 光照复杂度 | O(物体 x 光源) | O(像素 x 光源) |
| 透明物体 | 原生支持 | 需额外前向 pass |
| MSAA | 支持 | 不支持 |
| 显存占用 | 少 | 多（G-Buffer） |
| 带宽消耗 | 低 | 高（多次读写 G-Buffer） |
| 实现复杂度 | 低 | 高 |

### Godot 4.x 的选择：Forward+ (Clustered Forward)

Godot 4.x 没有在传统前向和延迟之间二选一，而是选择了 **Clustered Forward（前向聚类）** 方案，也称 **Forward+**。这种方案在保持前向渲染优势的同时，通过 Clustered Shading 技术解决了多光源的性能问题。

```
Godot 4.x 提供三种渲染方法：

┌──────────────────────────────────────────────────────────┐
│  rendering_method = "forward_plus"  （默认，桌面端）       │
│  Clustered Forward Shading                              │
│  支持：大量实时光源、MSAA、透明物体                        │
│  需要：Vulkan / Metal / D3D12                            │
├──────────────────────────────────────────────────────────┤
│  rendering_method = "mobile"  （移动端）                  │
│  简化的前向渲染，限制光源数量                               │
│  优化移动 GPU 的带宽和功耗                                 │
├──────────────────────────────────────────────────────────┤
│  rendering_method = "gl_compatibility"  （兼容模式）       │
│  基于 OpenGL 3.3 / OpenGL ES 3.0                         │
│  兼容老旧硬件，功能有限                                    │
└──────────────────────────────────────────────────────────┘
```

> 源码 `servers/rendering/renderer_rd/renderer_compositor_rd.h` 中的 `RendererCompositorRD` 负责根据项目设置选择渲染方法。

---

## 4. Clustered Shading 原理

### 什么是 Clustered Shading

Clustered Shading（聚类着色）是一种将屏幕空间划分为 3D 网格（Cluster），预先计算每个 Cluster 受哪些光源影响，从而在前向渲染中高效处理大量光源的技术。

它是 Tile-Based Shading 的进化版本。Tile-Based Shading 只在 2D 屏幕空间划分网格，不同深度的光源会混淆在一起；Clustered Shading 增加了深度维度，在 3D 空间划分，精度更高。

### 为什么 Godot 选择 Clustered Shading

```
传统前向渲染的问题：
  场景中有 100 个光源
  每个物体需要遍历所有 100 个光源 → 性能灾难

Clustered Shading 的解决方案：
  将视锥体切分为 3D 网格
  预计算每个网格单元只受 3-5 个光源影响
  每个像素只需计算 3-5 个光源 → 高效！
```

### Clustered Shading 工作原理

```
第一步：构建 Cluster 结构

将视锥体在屏幕空间 XY 方向均匀切分，在 Z 方向按对数间距切分：

         近平面                              远平面
         ┌───────┬───────┬───────┐
       / │ C(0,0)│ C(1,0)│ C(2,0)│
      /  │       │       │       │
     /   ├───────┼───────┼───────┤
    /    │ C(0,1)│ C(1,1)│ C(2,1)│  ← XY 方向均匀划分
   /     │       │       │       │
  /      ├───────┼───────┼───────┤
 /       │ C(0,2)│ C(1,2)│ C(2,2)│
/        │       │       │       │
         └───────┴───────┴───────┘

         │                               │
         │◄── Z 方向按对数间距划分 ───►│
         │  (近处密集，远处稀疏)         │

假设 24x24 XY 切分 + 32 Z 切分 = 18,432 个 Cluster
```

```
第二步：分配光源到 Cluster

  Light A (点光源)            Light B (聚光灯)
     ●                          ▼
     ┌───────┬───────┐          ┌───────┬───────┐
     │       │  A    │          │       │       │
     │   A   │  A    │          │       │  B    │
     │   A   │  A B  │          │       │  B    │
     │       │  B    │          │       │       │
     └───────┴───────┘          └───────┴───────┘

  每个 Cluster 记录影响它的光源索引列表
```

```
第三步：渲染时查询

  对每个片元：
    1. 计算片元所在的 Cluster 索引 (cluster_id)
    2. 从 Cluster 数据中获取影响该 Cluster 的光源列表
    3. 只对列表中的光源执行光照计算
    4. 通常每个片元只需计算 4-8 个光源（而非全部 100 个）
```

### Cluster 数据结构

```
在 Godot 源码中，Cluster 数据存储在 GPU 纹理/缓冲中：

ClusterBuilderRD (servers/rendering/renderer_rd/effects/cluster_builder_rd.h)

  - cluster_size: 24x24 XY 切分（可配置）
  - cluster_depth: 32 Z 切分
  - cluster_data: GPU Storage Buffer
    存储：每个 Cluster 的光源索引列表
  - light_data: GPU Uniform Buffer
    存储：所有光源的位置、颜色、范围、衰减参数
  - element_data: GPU Storage Buffer
    存储：反射探针、GI 探针等
```

### Clustered Shading 的优势

| 特性 | 传统前向 | Clustered 前向 | 延迟渲染 |
|------|---------|---------------|---------|
| 光源数量 | 限制严格（~4-8） | 支持大量（~256+） | 支持大量 |
| MSAA | 支持 | 支持 | 不支持 |
| 透明物体 | 支持 | 支持 | 需额外 pass |
| 显存带宽 | 低 | 中 | 高 |
| 预处理开销 | 无 | Cluster 构建 | G-Buffer 写入 |

---

## 5. 着色器编程与 GDShader

### 着色器语言生态

| API | 着色器语言 | 格式 |
|-----|-----------|------|
| Vulkan | GLSL → SPIR-V | 字节码 |
| Metal | MSL | 源码 |
| D3D12 | HLSL → DXIL | 字节码 |
| OpenGL | GLSL | 源码 |
| OpenGL ES | GLSL ES | 源码 |

### Godot 的 GDShader 方案

Godot 使用自己的 `.gdshader` 文件格式，**一次编写，自动编译为各平台的着色器**：

```
.gdshader 文件（Godot 自定义格式）
    │
    ├── shader_type  ← 着色器类型（spatial, canvas_item, particles, sky, fog）
    ├── render_mode  ← 渲染模式（blend, cull_mode, depth_draw 等）
    ├── uniform      ← 可在材质面板调整的参数
    ├── varyings     ← 顶点与片元之间的传递变量
    ├── vertex()     ← 顶点着色器函数
    ├── fragment()   ← 片元着色器函数
    └── light()      ← 自定义光照函数

编译时自动转换：
    SPIR-V  (Vulkan)
    GLSL    (OpenGL / OpenGL ES)
    MSL     (Metal)
    HLSL    (D3D12)
```

### GDShader 示例

```glsl
// 一个简单的 spatial 着色器示例
shader_type spatial;

// uniform 变量：可在材质面板调整
uniform vec4 albedo_color : source_color = vec4(1.0, 1.0, 1.0, 1.0);
uniform float metallic : hint_range(0.0, 1.0) = 0.0;
uniform float roughness : hint_range(0.0, 1.0) = 0.5;
uniform sampler2D albedo_texture : source_color, filter_linear_mipmap;

// 顶点着色器函数
void vertex() {
    // 修改顶点位置
    VERTEX.y += sin(TIME + VERTEX.x) * 0.5;
}

// 片元着色器函数
void fragment() {
    // 从纹理采样
    vec4 tex_color = texture(albedo_texture, UV);

    // 设置 PBR 参数
    ALBEDO = albedo_color.rgb * tex_color.rgb;
    METALLIC = metallic;
    ROUGHNESS = roughness;
    ALPHA = albedo_color.a * tex_color.a;
}

// 自定义光照函数（可选）
void light() {
    // 自定义光照计算
    DIFFUSE_LIGHT += clamp(dot(NORMAL, LIGHT), 0.0, 1.0) * LIGHT_COLOR;
}
```

### GDShader 编译流程

```
用户编写 .gdshader
    │
    ▼ 解析
ShaderLanguage::parse()
    │ 解析 shader_type, render_mode, uniforms,
    │ vertex(), fragment(), light() 函数
    │ 生成 AST（抽象语法树）
    │
    ▼ 编译
ShaderCompilerRD::compile()
    │ 将 GDShader AST 转换为目标着色器语言
    │ ├── 替换内置变量 (VERTEX → gl_Position, ALBEDO → out_color 等)
    │ ├── 插入引擎内置 Uniform (ProjectionMatrix, ViewMatrix 等)
    │ ├── 处理 render_mode (生成对应的 GLSL 代码)
    │ └── 添加 UBO 声明和绑定
    │
    ▼ 生成
SPIR-V 字节码 / GLSL 源码
    │
    ▼ 运行时
RenderingDevice::shader_create_from_spirv()
    │ 创建 RID (Resource ID) 引用
    │ 在 GPU 端创建着色器程序
```

### shader_type 分类

| shader_type | 用途 | 对应渲染器 |
|-------------|------|-----------|
| `spatial` | 3D 物体渲染 | RendererSceneRD |
| `canvas_item` | 2D/UI 渲染 | RendererCanvasCpu |
| `particles` | GPU 粒子 | ParticleProcessMaterial |
| `sky` | 天空渲染 | SkyRD |
| `fog` | 体积雾 | FogRD |

### Uniform 传递机制

```
CPU 端：
  material.set_shader_parameter("albedo_color", Color(1, 0, 0))
  ← 设置参数到 Material

GPU 端（着色器中）：
  uniform vec4 albedo_color;  ← 接收参数

传递方式（Vulkan 风格）：
  1. 引擎将参数写入 Uniform Buffer
  2. Uniform Buffer 绑定到 Descriptor Set
  3. Descriptor Set 绑定到 Pipeline
  4. 着色器通过绑定槽位读取数据
```

---

## 6. 纹理与采样

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

### 纹理格式

| 格式 | 每像素字节 | 说明 |
|------|-----------|------|
| RGBA8 | 4 | 标准 RGBA，最常用 |
| RGB10_A2 | 4 | 高精度颜色 + 2位 Alpha |
| RGBA16F | 8 | 半精度浮点 HDR |
| RGBA32F | 16 | 全精度浮点 HDR |
| DEPTH24_STENCIL8 | 4 | 深度模板 |
| BC1 (DXT1) | 0.5 | 压缩格式（无 Alpha） |
| BC3 (DXT5) | 1 | 压缩格式（有 Alpha） |
| BC7 | 1 | 高质量压缩 |
| ASTC_4x4 | 1 | 移动端压缩 |
| ETC2_RGB8 | 0.67 | 移动端压缩（OpenGL ES） |

### Mipmap

```
原始纹理 1024x1024
├── Level 0: 1024x1024  ← 近距离使用（清晰）
├── Level 1:  512x512   ← 中距离
├── Level 2:  256x256   ← 远距离
├── Level 3:  128x128
├── ...
└── Level 10: 1x1       ← 最远距离（模糊但够用）

好处：
  1. 远处物体不需要采样高分辨率纹理（省带宽）
  2. 避免远处纹理的摩尔纹闪烁（aliasing）
  3. GPU 自动选择合适的 mipmap 层级

Godot 资源导入时自动生成 mipmap：
  import presets → "Generate Mipmaps" = true
```

### 纹理过滤（Texture Filtering）

```
当片元的 UV 坐标不精确落在纹素中心时，需要插值：

最近邻过滤 (Nearest)：
  取最近的纹素 → 像素风（Minecraft 风格）
  texture(albedo_tex, uv, 0.0);  // with filter_nearest

双线性过滤 (Bilinear)：
  周围 4 个纹素加权平均 → 平滑
  texture(albedo_tex, uv);       // with filter_linear

三线性过滤 (Trilinear)：
  两个 mipmap 层级分别双线性插值，再在层级间线性插值
  → 最平滑，无 mipmap 接缝

各向异性过滤 (Anisotropic)：
  考虑视角倾斜方向的多次采样 → 斜面纹理更清晰
  Godot 默认支持 16x 各向异性过滤
```

### 纹理寻址模式

```
UV 坐标超出 [0,1] 范围时的处理方式：

Repeat:    重复平铺      ░░░░|░░░░|░░░░
           UV 坐标取模   0.0→1.0→0.0→1.0

Clamp:     边缘像素延伸   ░░░░|████|████
           UV 坐标限制    超出范围取边缘值

Mirror:    镜像翻转      ░░░░|░░░░|░░░░
           奇数次翻转     0→1→0→1（交替方向）

MirrorOnce: 镜像一次     ░░░░|████|████
           仅镜像一次后 clamp

GDShader 中的写法：
  uniform sampler2D tex : repeat_enable, filter_linear_mipmap;
  uniform sampler2D tex : repeat_disable, filter_nearest;
```

### 纹理压缩与 GPU 显存

```
纹理压缩的重要性：

未压缩 1024x1024 RGBA8 纹理:
  1024 x 1024 x 4 bytes = 4 MB

压缩后 (BC7):
  1024 x 1024 x 1 byte = 1 MB

一个场景可能有 100+ 张纹理:
  未压缩: 400 MB+
  压缩后: 100 MB

Godot 导入时自动选择最佳压缩格式:
  - 桌面端: BC (BPTC)
  - 移动端: ASTC / ETC2
  - 使用 TextureImporter 的 import_formats 配置
```

---

## 延伸阅读

- [LearnOpenGL](https://learnopengl.com/) — OpenGL 渲染教程（强烈推荐）
- [Vulkan Tutorial](https://vulkan-tutorial.com/) — Vulkan 官方教程，理解现代图形 API
- [Real-Time Rendering 4th Edition](https://www.realtimerendering.com/) — 实时渲染圣经
- [The Book of Shaders](https://thebookofshaders.com/) — 着色器入门（互动式）
- [Clustered Deferred and Forward Shading](https://www.cse.chalmers.se/~uffe/clustered_shading_preprint.pdf) — Clustered Shading 论文
- [Godot 渲染架构文档](https://docs.godotengine.org/en/stable/contributing/development/core_and_modules/rendering.html) — Godot 官方渲染架构说明

---

> 理解了这些原理后，继续阅读 [01-RenderingDevice GPU 抽象层](./01-rendering-device.md) 查看对应的源码实现。
