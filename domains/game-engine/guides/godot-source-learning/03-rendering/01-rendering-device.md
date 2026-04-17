# RenderingDevice GPU 抽象层

RenderingDevice（RD）是 Godot 4.x 渲染系统的最底层抽象，以 Vulkan 风格封装了不同图形 API（Vulkan、Metal、D3D12、OpenGL）的差异，为上层渲染管线提供统一的 GPU 操作接口。它是整个 Godot 渲染架构的基石。

## 目录

- [架构概述](#架构概述)
- [RenderingDevice 核心类](#renderingdevice-核心类)
- [设备创建与初始化](#设备创建与初始化)
- [Buffer 缓冲区](#buffer-缓冲区)
- [Texture 纹理](#texture-纹理)
- [Shader 着色器](#shader-着色器)
- [PipelineState 管线状态](#pipelinestate-管线状态)
- [Framebuffer 与 RenderPass](#framebuffer-与-renderpass)
- [UniformSet 描述符集](#uniformset-描述符集)
- [CommandBuffer 命令缓冲](#commandbuffer-命令缓冲)
- [Ring Buffer 与 Uniform 更新](#ring-buffer-与-uniform-更新)
- [多后端实现](#多后端实现)
- [技术原理](#技术原理)

---

## 架构概述

```
┌─────────────────────────────────────────────────────────┐
│                   上层渲染系统                            │
│    RendererSceneRD / RendererCanvasCpu / Effects         │
└───────────────────────┬─────────────────────────────────┘
                        │ 调用
                        ▼
┌─────────────────────────────────────────────────────────┐
│                 RenderingDevice (GPU 抽象)               │
│                                                         │
│  RID 管理系统          Device 属性查询                    │
│  Resource 创建/销毁    Capabilities 检测                  │
│                                                         │
│  Buffer  Texture  Shader  PipelineState                 │
│  Framebuffer  RenderPass  UniformSet                    │
│  CommandBuffer  Sampler  VertexFormat                   │
└───────────────────────┬─────────────────────────────────┘
                        │ 实现
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
 ┌───────────┐   ┌───────────┐   ┌───────────┐
 │  Vulkan   │   │  Metal    │   │  D3D12    │
 │  Context  │   │  Device   │   │  Device   │
 └───────────┘   └───────────┘   └───────────┘
```

### 核心文件

| 文件 | 路径 | 说明 |
|------|------|------|
| RenderingDevice 头文件 | `servers/rendering/rendering_device.h` | GPU 抽象接口定义 |
| RenderingDevice 实现 | `servers/rendering/rendering_device.cpp` | 主要实现逻辑 |
| RID 管理 | `core/rid.h` | 资源 ID 系统 |
| Vulkan 后端 | `drivers/vulkan/` | Vulkan 实现 |
| Metal 后端 | `drivers/metal/` | Metal 实现 |
| D3D12 后端 | `drivers/d3d12/` | Direct3D 12 实现 |
| OpenGL 后端 | `drivers/opengl/` | OpenGL 3.3 / ES 3.0 实现 |

---

## RenderingDevice 核心类

RenderingDevice 是一个单例类（`RenderingDevice::get_singleton()`），所有 GPU 资源通过 RID（Resource ID）引用。

### 源码解析

```cpp
// servers/rendering/rendering_device.h

class RenderingDevice : public Object {
    GDCLASS(RenderingDevice, Object);

    // ─── 单例 ───
    static RenderingDevice *get_singleton();

    // ─── 核心属性 ───
    struct Capabilities {
        uint32_t max_texture_size;           // 最大纹理尺寸（通常 8192 或 16384）
        uint32_t max_texture_layers;         // 最大纹理数组层数
        uint32_t max_uniform_buffer_size;    // 最大 Uniform 缓冲大小
        uint32_t max_storage_buffer_size;    // 最大 Storage 缓冲大小
        uint32_t max_push_constant_size;     // 最大 Push Constant 大小
        uint32_t max_uniform_sets;           // 最大描述符集数量
        bool supports_compute;               // 是否支持计算着色器
        bool supports_wireframe;             // 是否支持线框模式
        // ...
    };

    // ─── 核心资源创建方法 ───
    RID texture_create(const TextureFormat &p_format, const TextureView &p_view, ...);
    RID texture_create_shared(const TextureView &p_view, RID p_with_texture);
    RID texture_create_from_extension(...);

    RID shader_create_from_spirv(const Vector<ShaderStageSPIRVData> &p_spirv,
                                  const String &p_shader_name = "");

    RID uniform_set_create(const Vector<Uniform> &p_uniforms, RID p_shader, uint32_t p_set);

    RID pipeline_create(PipelineType p_type,
                        RID p_shader,
                        const Vector<PipelineSpecializationConstant> &p_specialization_constants);
    RID render_pipeline_create(RID p_shader,
                               FramebufferFormatID p_framebuffer_format,
                               VertexFormatID p_vertex_format,
                               RenderPrimitive p_render_primitive,
                               const PipelineRasterizationState &p_rasterization_state,
                               const PipelineMultisampleState &p_multisample_state,
                               const PipelineDepthStencilState &p_depth_stencil_state,
                               const PipelineColorBlendState &p_blend_state,
                               int p_dynamic_state_flags = 0);
    RID framebuffer_create(const Vector<RID> &p_texture_attachments, ...);

    // ─── 命令缓冲 ───
    RID draw_list_begin(RID p_framebuffer, ...);
    void draw_list_bind_render_pipeline(RID p_draw_list, RID p_pipeline);
    void draw_list_bind_uniform_set(RID p_draw_list, RID p_uniform_set, uint32_t p_index);
    void draw_list_draw(RID p_draw_list, uint32_t p_instances = 1);
    void draw_list_end();

    // ─── 计算列表 ───
    RID compute_list_begin();
    void compute_list_bind_compute_pipeline(RID p_compute_list, RID p_pipeline);
    void compute_list_bind_uniform_set(RID p_compute_list, RID p_uniform_set, uint32_t p_index);
    void compute_list_dispatch(RID p_compute_list, ...);
    void compute_list_end();

    // ─── 资源管理 ───
    void free(RID p_rid);            // 释放资源
    bool has_feature(Features p_feature);  // 特性查询
    String get_device_name() const;
    String get_device_vendor_name() const;

    // ─── 提交与同步 ───
    void submit();
    void sync();
    void prepare_screen_for_drawing();
};
```

### RID（Resource ID）系统

Godot 使用 RID 作为 GPU 资源的弱引用句柄：

```cpp
// core/rid.h

// RID 是一个轻量级资源标识符
// 内部存储一个 32 位 ID，用于在 RenderingDevice 中查找对应资源
class RID {
    uint32_t _id = 0;
public:
    bool is_valid() const { return _id != 0; }
    bool is_null() const { return _id == 0; }
    uint32_t get_id() const { return _id; }
};

// 使用示例
RID texture = RD::get_singleton()->texture_create(format, view);
// ... 使用 texture ...
RD::get_singleton()->free(texture);  // 释放
```

RID 的内部管理：

```
RenderingDevice 内部使用 RID_Owner<T> 管理 GPU 资源：

┌────────────────────────────────────┐
│       RID_Owner<Texture>           │
│                                    │
│  RID(1) → TextureData (VkImage)   │
│  RID(2) → TextureData (VkImage)   │
│  RID(3) → TextureData (VkImage)   │
│  ...                               │
│                                    │
│  get_or_null(RID) → TextureData*  │
│  make_rid(TextureData) → RID      │
│  free(RID) → 释放 VkImage         │
└────────────────────────────────────┘
```

---

## 设备创建与初始化

### 初始化流程

```
Main::setup()
    │
    ▼
DisplayServer::create()
    │
    ├── 创建窗口系统（SDL/GDK/native）
    │
    ▼
RenderingServer::create()
    │
    ├── RenderingDevice::create()
    │   │
    │   ├── 选择图形 API
    │   │   ├── Vulkan（桌面端默认）
    │   │   ├── Metal（macOS/iOS）
    │   │   ├── D3D12（Windows 备选）
    │   │   └── OpenGL（兼容模式）
    │   │
    │   ├── 创建 Vulkan Instance
    │   │   ├── 启用验证层（调试模式）
    │   │   ├── 启用扩展（VK_KHR_swapchain 等）
    │   │   └── 设置应用信息
    │   │
    │   ├── 选择物理设备（GPU）
    │   │   ├── 枚举可用 GPU
    │   │   ├── 评估设备特性
    │   │   └── 选择最佳设备（独立 GPU 优先）
    │   │
    │   ├── 创建逻辑设备（VkDevice）
    │   │   ├── 请求队列（Graphics + Compute + Transfer）
    │   │   ├── 启用设备特性
    │   │   └── 创建命令池
    │   │
    │   ├── 创建交换链（Swapchain）
    │   │   ├── 查询表面格式
    │   │   ├── 设置呈现模式（Mailbox / FIFO）
    │   │   └── 创建交换链图像
    │   │
    │   └── 初始化 Capabilities
    │       ├── 查询最大纹理尺寸
    │       ├── 查询最大 Uniform Buffer 大小
    │       ├── 检测计算着色器支持
    │       └── 检测压缩格式支持
    │
    └── 返回可用的 RenderingDevice 实例
```

### Capabilities 查询

```cpp
// 运行时查询设备能力
RenderingDevice *rd = RenderingDevice::get_singleton();
const RenderingDevice::Capabilities &caps = rd->get_device_capabilities();

print_line("Max texture size: ", caps.max_texture_size);
print_line("Supports compute: ", caps.supports_compute);
print_line("Device: ", rd->get_device_name());          // e.g. "NVIDIA GeForce RTX 3080"
print_line("Vendor: ", rd->get_device_vendor_name());   // e.g. "NVIDIA"
```

---

## Buffer 缓冲区

Buffer 封装了 GPU 缓冲区，用于存储顶点数据、索引数据、Uniform 数据、Storage 数据等。

### 创建接口

```cpp
// servers/rendering/rendering_device.h

// Buffer 用途位掩码
enum BufferUsageBits {
    BUFFER_USAGE_TRANSFER_SRC_BIT = 1,
    BUFFER_USAGE_TRANSFER_DST_BIT = 2,
    BUFFER_USAGE_UNIFORM_TEXEL_BIT = 4,
    BUFFER_USAGE_STORAGE_TEXEL_BIT = 8,
    BUFFER_USAGE_UNIFORM_BIT = 16,         // Uniform Buffer (UBO)
    BUFFER_USAGE_STORAGE_BIT = 32,          // Storage Buffer (SSBO)
    BUFFER_USAGE_INDEX_BIT = 64,            // 索引缓冲
    BUFFER_USAGE_VERTEX_BIT = 128,          // 顶点缓冲
    BUFFER_USAGE_INDIRECT_BIT = 256,        // 间接绘制参数
    BUFFER_USAGE_TRANSFORM_FEEDBACK_COUNTER_BUFFER_BIT = 512,
    BUFFER_USAGE_SPARE_BITS = (1 << 20),
};

// Buffer 创建
RID buffer_create(uint64_t p_size_bytes, BitField<BufferUsageBits> p_usage,
                  const Vector<uint8_t> &p_data = Vector<uint8_t>());

// Buffer 更新
void buffer_update(RID p_buffer, uint32_t p_offset, uint32_t p_size,
                   const void *p_data);
void buffer_clear(RID p_buffer, uint32_t p_offset, uint32_t p_size);

// Buffer 拷贝
void buffer_copy(RID p_src_buffer, RID p_dst_buffer,
                 uint32_t p_src_offset, uint32_t p_dst_offset, uint32_t p_size);
```

### Buffer 类型与用途

| Buffer 类型 | 用途标志 | 说明 |
|-------------|---------|------|
| Vertex Buffer | `BUFFER_USAGE_VERTEX_BIT` | 存储顶点属性（位置、法线、UV） |
| Index Buffer | `BUFFER_USAGE_INDEX_BIT` | 存储索引数据（uint16/uint32） |
| Uniform Buffer | `BUFFER_USAGE_UNIFORM_BIT` | 存储着色器 Uniform 数据 |
| Storage Buffer | `BUFFER_USAGE_STORAGE_BIT` | GPU 可读写的缓冲（SSBO） |
| Indirect Buffer | `BUFFER_USAGE_INDIRECT_BIT` | 间接绘制参数 |
| Transfer Buffer | `TRANSFER_SRC / DST` | CPU-GPU 数据传输暂存 |

### Buffer 使用示例

```cpp
RenderingDevice *rd = RenderingDevice::get_singleton();

// 创建顶点缓冲
struct Vertex {
    float position[3];
    float uv[2];
    float normal[3];
};
Vector<uint8_t> vertex_data;
// ... 填充顶点数据 ...

RID vertex_buffer = rd->buffer_create(
    vertex_data.size(),
    RenderingDevice::BUFFER_USAGE_VERTEX_BIT,
    vertex_data
);

// 创建索引缓冲
Vector<uint8_t> index_data;
// ... 填充索引数据 ...

RID index_buffer = rd->buffer_create(
    index_data.size(),
    RenderingDevice::BUFFER_USAGE_INDEX_BIT,
    index_data
);

// 使用完成后释放
rd->free(vertex_buffer);
rd->free(index_buffer);
```

---

## Texture 纹理

Texture 封装了 GPU 纹理资源，支持 1D/2D/3D/Cube 等多种纹理类型，可同时作为着色器采样源和渲染目标。

### 创建接口

```cpp
// 纹理类型
enum TextureType {
    TEXTURE_TYPE_2D,
    TEXTURE_TYPE_2D_ARRAY,
    TEXTURE_TYPE_3D,
    TEXTURE_TYPE_CUBE,
    TEXTURE_TYPE_CUBE_ARRAY,
};

// 纹理格式（部分）
enum DataFormat {
    DATA_FORMAT_R8G8B8A8_UNORM,           // RGBA 8bit 无归一化
    DATA_FORMAT_R8G8B8A8_SRGB,            // RGBA sRGB
    DATA_FORMAT_R16G16B16A16_SFLOAT,      // RGBA 16bit 浮点
    DATA_FORMAT_R32G32B32A32_SFLOAT,      // RGBA 32bit 浮点
    DATA_FORMAT_D24_UNORM_S8_UINT,        // 深度24 + 模板8
    DATA_FORMAT_D32_SFLOAT,               // 深度32bit 浮点
    DATA_FORMAT_BC1_RGB_UNORM_BLOCK,      // BC1/DXT1 压缩
    DATA_FORMAT_BC3_UNORM_BLOCK,          // BC3/DXT5 压缩
    DATA_FORMAT_BC7_UNORM_BLOCK,          // BC7 高质量压缩
    // ... 100+ 种格式
};

// 纹理使用标志
enum TextureUsageBits {
    TEXTURE_USAGE_SAMPLING_BIT = 1,              // 可被着色器采样
    TEXTURE_USAGE_COLOR_ATTACHMENT_BIT = 2,      // 可作为颜色渲染目标
    TEXTURE_USAGE_DEPTH_STENCIL_ATTACHMENT_BIT = 4, // 可作为深度/模板目标
    TEXTURE_USAGE_STORAGE_BIT = 16,              // 可作为 Storage Image
    TEXTURE_USAGE_CAN_UPDATE_BIT = 256,          // CPU 可更新
    TEXTURE_USAGE_CAN_COPY_FROM_BIT = 512,       // 可从拷贝
    TEXTURE_USAGE_INPUT_ATTACHMENT_BIT = 2048,   // 可作为子通道输入
};

// 纹理创建
RID texture_create(const TextureFormat &p_format,
                   const TextureView &p_view,
                   const Vector<Vector<uint8_t>> &p_data = {});
```

### TextureFormat 结构体

```cpp
struct TextureFormat {
    TextureType texture_type = TEXTURE_TYPE_2D;
    DataFormat format = DATA_FORMAT_R8G8B8A8_UNORM;
    uint32_t width = 1;
    uint32_t height = 1;
    uint32_t depth = 1;
    uint32_t array_layers = 1;
    uint32_t mipmaps = 1;
    TextureSamples samples = TEXTURE_SAMPLES_1;
    BitField<TextureUsageBits> usage_flags = TEXTURE_USAGE_SAMPLING_BIT;
    bool shareable = false;
};
```

### 纹理类型与用途

| 类型 | 说明 | 典型用途 |
|------|------|----------|
| `TEXTURE_TYPE_2D` | 2D 纹理 | 贴图、渲染目标 |
| `TEXTURE_TYPE_2D_ARRAY` | 2D 纹理数组 | 级联阴影贴图、纹理图集 |
| `TEXTURE_TYPE_3D` | 3D 纹理 | VoxelGI、体积雾、3D 查找表 |
| `TEXTURE_TYPE_CUBE` | 立方体纹理 | 天空盒、环境贴图 |
| `TEXTURE_TYPE_CUBE_ARRAY` | 立方体纹理数组 | 多个环境贴图 |

### 创建渲染目标纹理

```cpp
RenderingDevice *rd = RenderingDevice::get_singleton();

// 创建一个 1920x1080 的 HDR 颜色渲染目标
RenderingDevice::TextureFormat color_format;
color_format.texture_type = RenderingDevice::TEXTURE_TYPE_2D;
color_format.format = RenderingDevice::DATA_FORMAT_R16G16B16A16_SFLOAT;
color_format.width = 1920;
color_format.height = 1080;
color_format.usage_flags =
    RenderingDevice::TEXTURE_USAGE_SAMPLING_BIT |
    RenderingDevice::TEXTURE_USAGE_COLOR_ATTACHMENT_BIT;

RID color_texture = rd->texture_create(color_format, RenderingDevice::TextureView());

// 创建深度纹理
RenderingDevice::TextureFormat depth_format;
depth_format.texture_type = RenderingDevice::TEXTURE_TYPE_2D;
depth_format.format = RenderingDevice::DATA_FORMAT_D24_UNORM_S8_UINT;
depth_format.width = 1920;
depth_format.height = 1080;
depth_format.usage_flags =
    RenderingDevice::TEXTURE_USAGE_DEPTH_STENCIL_ATTACHMENT_BIT |
    RenderingDevice::TEXTURE_USAGE_SAMPLING_BIT;

RID depth_texture = rd->texture_create(depth_format, RenderingDevice::TextureView());
```

---

## Shader 着色器

Shader 在 RenderingDevice 层以 SPIR-V 字节码的形式存在，是编译后的 GPU 着色器程序。

### 创建接口

```cpp
// 着色器阶段
enum ShaderStage {
    SHADER_STAGE_VERTEX,
    SHADER_STAGE_FRAGMENT,
    SHADER_STAGE_TESSELATION_CONTROL,
    SHADER_STAGE_TESSELATION_EVALUATION,
    SHADER_STAGE_COMPUTE,
};

// SPIR-V 阶段数据
struct ShaderStageSPIRVData {
    ShaderStage shader_stage;
    Vector<uint8_t> spirv;     // SPIR-V 字节码
};

// 从 SPIR-V 创建着色器
RID shader_create_from_spirv(const Vector<ShaderStageSPIRVData> &p_spirv,
                              const String &p_shader_name = "");

// 查询着色器信息
struct ShaderUniform {
    int binding = 0;            // 绑定槽位
    int set = 0;                // 描述符集编号
    UniformType type;           // 类型（Uniform Buffer、Sampler 等）
    // ...
};
Vector<ShaderUniform> shader_get_uniform_list(RID p_shader, bool p_get_stage = false);
```

### Shader 创建流程

```
.gdshader 文件
    │
    ▼ ShaderLanguage::parse()
AST (抽象语法树)
    │
    ▼ ShaderCompilerRD::compile()
GLSL 源码（包含引擎内置变量和 UBO 声明）
    │
    ▼ glslang/SPIRV-Cross 编译
SPIR-V 字节码
    │
    ▼ RenderingDevice::shader_create_from_spirv()
RID (着色器资源引用)
    │
    ├── 反射着色器，提取 Uniform 信息
    ├── 创建 Vulkan Pipeline Layout
    ├── 创建 VkShaderModule
    └── 存储到 RID_Owner<ShaderData>
```

---

## PipelineState 管线状态

PipelineState 是 Vulkan 风格的设计，将所有渲染状态打包成一个不可变对象。与 OpenGL 的分散式状态设置不同，Vulkan 要求提前定义所有渲染状态。

### 创建接口

```cpp
// 渲染图元类型
enum RenderPrimitive {
    RENDER_PRIMITIVE_POINTS,
    RENDER_PRIMITIVE_LINES,
    RENDER_PRIMITIVE_LINESTRIPS,
    RENDER_PRIMITIVE_TRIANGLES,
    RENDER_PRIMITIVE_TRIANGLE_STRIPS,
    RENDER_PRIMITIVE_TRIANGLE_STRIPS_WITH_AE, // Adjacency + Restart
    RENDER_PRIMITIVE_PATCHES,                  // 曲面细分
};

// 创建渲染管线
RID render_pipeline_create(
    RID p_shader,                                    // 着色器
    FramebufferFormatID p_framebuffer_format,        // 帧缓冲格式
    VertexFormatID p_vertex_format,                  // 顶点格式 ID
    RenderPrimitive p_render_primitive,              // 图元类型
    const PipelineRasterizationState &p_rasterization_state, // 光栅化状态
    const PipelineMultisampleState &p_multisample_state,     // 多重采样
    const PipelineDepthStencilState &p_depth_stencil_state,  // 深度模板
    const PipelineColorBlendState &p_blend_state,            // 颜色混合
    int p_dynamic_state_flags = 0                             // 动态状态标志
);

// 创建计算管线
RID compute_pipeline_create(RID p_shader);
```

### 渲染管线状态组成

```
PipelineState (不可变对象)
├── Shader              ─── 着色器程序（SPIR-V）
├── FramebufferFormat   ─── 渲染目标格式（颜色/深度格式）
├── VertexFormat        ─── 顶点属性布局
├── RenderPrimitive     ─── 图元类型（TRIANGLES / LINES / ...）
├── RasterizationState  ─── 光栅化状态
│   ├── cull_mode       ─── 背面剔除（None / Front / Back）
│   ├── polygon_mode    ─── 填充模式（Fill / Line / Point）
│   ├── depth_bias      ─── 深度偏移
│   └── wireframe       ─── 线框模式
├── MultisampleState    ─── 多重采样
│   ├── sample_count    ─── 采样数（1 / 2 / 4 / 8）
│   └── sample_mask     ─── 采样遮罩
├── DepthStencilState   ─── 深度模板状态
│   ├── depth_test      ─── 深度测试开关
│   ├── depth_write     ─── 深度写入开关
│   ├── depth_op        ─── 比较操作（Less / Equal / ...）
│   ├── stencil_test    ─── 模板测试配置
│   └── depth_range     ─── 深度范围（Godot 使用反向 Z）
├── ColorBlendState     ─── 颜色混合状态
│   └── attachments[]   ─── 每个渲染目标的混合配置
│       ├── blend_enable ─── 是否启用混合
│       ├── src_color   ─── 源颜色因子
│       ├── dst_color   ─── 目标颜色因子
│       ├── color_op    ─── 颜色操作（Add）
│       ├── src_alpha   ─── 源 Alpha 因子
│       └── dst_alpha   ─── 目标 Alpha 因子
└── DynamicStateFlags   ─── 可动态修改的状态
    ├── VIEWPORT        ─── 动态视口
    ├── SCISSOR         ─── 动态裁剪
    └── BLEND_CONSTANTS ─── 动态混合常量
```

### PipelineState 创建示例

```cpp
RenderingDevice *rd = RenderingDevice::get_singleton();

// 光栅化状态
RenderingDevice::PipelineRasterizationState rasterization;
rasterization.cull_mode = RenderingDevice::POLYGON_CULL_MODE_BACK;
rasterization.front_face = RenderingDevice::POLYGON_FRONT_FACE_CLOCKWISE;

// 深度模板状态
RenderingDevice::PipelineDepthStencilState depth_stencil;
depth_stencil.depth_test_enable = true;
depth_stencil.depth_write_enable = true;
depth_stencil.depth_compare_op = RenderingDevice::COMPARE_OP_LESS; // 反向 Z 使用 GREATER

// 颜色混合状态
RenderingDevice::PipelineColorBlendState blend;
RenderingDevice::PipelineColorBlendAttachment attachment;
attachment.blend_enable = false; // 不透明物体不需要混合
blend.attachments.push_back(attachment);

// 创建渲染管线
RID pipeline = rd->render_pipeline_create(
    shader_rid,
    framebuffer_format,
    vertex_format,
    RenderingDevice::RENDER_PRIMITIVE_TRIANGLES,
    rasterization,
    multisample,
    depth_stencil,
    blend
);
```

---

## Framebuffer 与 RenderPass

### Framebuffer

Framebuffer 是一组纹理附件的集合，定义了渲染操作的目标。

```cpp
// 创建 Framebuffer
RID framebuffer_create(const Vector<RID> &p_texture_attachments,
                       uint32_t p_view_count = 1);

// 获取 Framebuffer 格式 ID（用于创建 PipelineState）
FramebufferFormatID framebuffer_get_format(RID p_framebuffer);

// 示例：创建一个带颜色和深度的 Framebuffer
RID fb = rd->framebuffer_create(
    { color_texture, depth_texture }  // 附件：颜色 + 深度
);
RenderingDevice::FramebufferFormatID fb_format = rd->framebuffer_get_format(fb);
```

### RenderPass（隐式 RenderPass）

Godot 的 RenderingDevice 将 RenderPass 概念内嵌到 draw_list 中，不需要像原生 Vulkan 那样显式创建 RenderPass 对象：

```
Vulkan 原生流程：
  VkRenderPass → VkFramebuffer → vkCmdBeginRenderPass → 绘制 → vkCmdEndRenderPass

Godot RD 流程：
  Framebuffer → draw_list_begin(清除颜色/深度) → 绑定管线和资源 → 绘制 → draw_list_end
  （内部自动管理 RenderPass）
```

### Framebuffer 附件结构

```
┌────────────────────────────────────────────────┐
│               Framebuffer                      │
│                                                │
│  Attachment 0: Color Texture (RGBA16F)         │ ← 颜色输出
│  Attachment 1: Normal Texture (RGBA16F)        │ ← 法线输出（可选）
│  Attachment 2: Depth Texture (D24S8/D32F)      │ ← 深度/模板
│                                                │
│  所有附件必须大小相同                            │
│  附件格式在 PipelineState 创建时必须匹配         │
└────────────────────────────────────────────────┘
```

---

## UniformSet 描述符集

UniformSet 是 Vulkan 风格的资源绑定机制，将 Buffer、Texture、Sampler 等资源绑定到着色器的指定槽位。

### Uniform 类型

```cpp
enum UniformType {
    UNIFORM_TYPE_SAMPLER,                // 采样器
    UNIFORM_TYPE_SAMPLER_WITH_TEXTURE,   // 采样器+纹理组合
    UNIFORM_TYPE_TEXTURE,                // 纹理
    UNIFORM_TYPE_IMAGE,                  // Storage Image（可写纹理）
    UNIFORM_TYPE_TEXTURE_BUFFER,         // 纹理缓冲
    UNIFORM_TYPE_SAMPLER_WITH_TEXTURE_BUFFER, // 采样器+纹理缓冲
    UNIFORM_TYPE_IMAGE_BUFFER,           // Storage Image Buffer
    UNIFORM_TYPE_UNIFORM_BUFFER,         // Uniform Buffer (UBO)
    UNIFORM_TYPE_STORAGE_BUFFER,         // Storage Buffer (SSBO)
    UNIFORM_TYPE_INPUT_ATTACHMENT,       // 子通道输入附件
};
```

### Uniform 结构体

```cpp
struct Uniform {
    UniformType uniform_type = UNIFORM_TYPE_SAMPLER_WITH_TEXTURE;
    int binding = 0;           // 着色器中的 binding 编号
    Vector<RID> ids;           // 绑定的资源 RID 列表
};
```

### UniformSet 创建

```cpp
RenderingDevice *rd = RenderingDevice::get_singleton();

// 创建 UniformSet
Vector<RenderingDevice::Uniform> uniforms;

// Binding 0: Uniform Buffer（投影矩阵等）
RenderingDevice::Uniform ubo_uniform;
ubo_uniform.uniform_type = RenderingDevice::UNIFORM_TYPE_UNIFORM_BUFFER;
ubo_uniform.binding = 0;
ubo_uniform.ids.push_back(scene_ubo);  // 场景 Uniform Buffer RID
uniforms.push_back(ubo_uniform);

// Binding 1: Albedo 纹理 + 采样器
RenderingDevice::Uniform tex_uniform;
tex_uniform.uniform_type = RenderingDevice::UNIFORM_TYPE_SAMPLER_WITH_TEXTURE;
tex_uniform.binding = 1;
tex_uniform.ids.push_back(sampler_rid);  // 采样器 RID
tex_uniform.ids.push_back(albedo_texture); // 纹理 RID
uniforms.push_back(tex_uniform);

// 创建描述符集（关联到着色器 set 编号）
RID uniform_set = rd->uniform_set_create(uniforms, shader_rid, 0);  // set 0
```

### UniformSet 与着色器的映射

```
GLSL / SPIR-V 中的声明：

layout(set = 0, binding = 0) uniform SceneData { ... };
layout(set = 0, binding = 1) uniform sampler2D albedo_tex;
layout(set = 1, binding = 0) uniform MaterialData { ... };
layout(set = 2, binding = 0) uniform sampler2D shadow_tex;

对应的 UniformSet 创建：
  set 0 → UniformSet { binding 0: UBO, binding 1: Sampler+Texture }
  set 1 → UniformSet { binding 0: UBO }
  set 2 → UniformSet { binding 0: Sampler+Texture }

每个 UniformSet 在绑定管线后可以独立更新
```

---

## CommandBuffer 命令缓冲

Godot 的 RenderingDevice 将命令缓冲封装为 draw_list（渲染命令）和 compute_list（计算命令）。

### 渲染命令流程

```cpp
// 开始绘制列表（等效于 Vulkan 的 BeginRenderPass + 分配 CommandBuffer）
RID draw_list = rd->draw_list_begin(
    framebuffer_rid,
    RenderingDevice::DRAW_CLEAR_ALL,  // 清除所有附件
    clear_colors,                      // 清除颜色值
    1.0,                               // 清除深度值（反向 Z 通常为 0.0）
    0                                  // 清除模板值
);

// 绑定渲染管线
rd->draw_list_bind_render_pipeline(draw_list, pipeline_rid);

// 绑定 UniformSet
rd->draw_list_bind_uniform_set(draw_list, scene_uniforms, 0);
rd->draw_list_bind_uniform_set(draw_list, material_uniforms, 1);

// 绑定顶点和索引缓冲
rd->draw_list_bind_vertex_array(draw_list, vertex_array_rid);
rd->draw_list_bind_index_array(draw_list, index_array_rid);

// 设置 Push Constants（小量快速数据传递）
rd->draw_list_set_push_constant(draw_list, &push_constant, sizeof(PushConstant));

// 绘制
rd->draw_list_draw(draw_list, 1);  // 1 个实例

// 结束绘制列表
rd->draw_list_end();
```

### 计算命令流程

```cpp
// 开始计算列表
RID compute_list = rd->compute_list_begin();

// 绑定计算管线
rd->compute_list_bind_compute_pipeline(compute_list, compute_pipeline_rid);

// 绑定 UniformSet
rd->compute_list_bind_uniform_set(compute_list, data_uniforms, 0);

// 设置 Push Constants
rd->compute_list_set_push_constant(compute_list, &push_constant, sizeof(PushConstant));

// 分发计算（workgroup_x, workgroup_y, workgroup_z）
rd->compute_list_dispatch(compute_list, groups_x, groups_y, groups_z);

// 添加内存屏障（确保计算完成后后续操作能读取结果）
rd->compute_list_add_barrier(compute_list);

// 结束计算列表
rd->compute_list_end();
```

### 完整命令流程示意

```
帧开始：
    │
    ├── draw_list_begin(shadow_fb, DRAW_CLEAR_ALL)
    │   ├── bind_render_pipeline(shadow_pipeline)
    │   ├── bind_uniform_set(shadow_uniforms, 0)
    │   ├── draw_list_draw()  ← 渲染阴影
    │   └── draw_list_end()
    │
    ├── compute_list_begin()
    │   ├── bind_compute_pipeline(cluster_pipeline)
    │   ├── compute_list_dispatch()  ← 构建 Cluster
    │   └── compute_list_end()
    │
    ├── draw_list_begin(main_fb, DRAW_CLEAR_ALL)
    │   ├── bind_render_pipeline(depth_prepass_pipeline)
    │   ├── bind_uniform_set(...)
    │   ├── draw_list_draw()  ← 深度预 pass
    │   │
    │   ├── bind_render_pipeline(opaque_pipeline)
    │   ├── bind_uniform_set(...)
    │   ├── draw_list_draw()  ← 不透明物体
    │   │
    │   ├── bind_render_pipeline(transparent_pipeline)
    │   ├── bind_uniform_set(...)
    │   ├── draw_list_draw()  ← 透明物体
    │   │
    │   └── draw_list_end()
    │
    ├── draw_list_begin(post_fb, DRAW_DEFAULT)
    │   ├── bind_render_pipeline(post_pipeline)
    │   └── draw_list_draw()  ← 后处理
    │   └── draw_list_end()
    │
    ▼
rd->submit()  ← 提交所有命令
```

---

## Ring Buffer 与 Uniform 更新

### 问题：Uniform 数据的动态更新

每帧需要向 GPU 传递大量动态数据（变换矩阵、光照参数等）。如果每次更新都等 GPU 完成上一帧的操作，会造成严重的 CPU-GPU 同步等待。

### 解决方案：Ring Buffer

```
Ring Buffer（环形缓冲）策略：
  维护多个缓冲区版本，CPU 写入下一个版本时 GPU 读取上一个版本

  Frame 0: CPU 写入 Buffer[0], GPU 读取 Buffer[N-1]
  Frame 1: CPU 写入 Buffer[1], GPU 读取 Buffer[0]
  Frame 2: CPU 写入 Buffer[2], GPU 读取 Buffer[1]
  ...
  Frame N: CPU 写入 Buffer[0], GPU 读取 Buffer[N-1]（循环回来）

  默认使用 3 帧的 Ring Buffer：

  ┌──────────┐ ┌──────────┐ ┌──────────┐
  │ Buffer[0]│ │ Buffer[1]│ │ Buffer[2]│
  │ Frame 0  │ │ Frame 1  │ │ Frame 2  │
  │ CPU写/GPU读│ │  空闲    │ │  空闲    │
  └──────────┘ └──────────┘ └──────────┘

  下一个帧：
  ┌──────────┐ ┌──────────┐ ┌──────────┐
  │ Buffer[0]│ │ Buffer[1]│ │ Buffer[2]│
  │  空闲    │ │ CPU写/GPU读│ │  空闲    │
  └──────────┘ └──────────┘ └──────────┘
```

### Godot 中的 Ring Buffer 实现

```cpp
// servers/rendering/rendering_device.cpp

// Uniform 缓冲的动态分配
// 每帧开始时，RD 维护一个线性分配器
// 从 Ring Buffer 中分配空间，写入 Uniform 数据

// 内部实现：
// - 每帧分配一个新的 Buffer 区间
// - 使用 buffer_update() 写入数据
// - 帧结束后标记该区间为可回收
// - 当 Ring Buffer 转回来时，之前的区间已被 GPU 释放

// 使用方式（上层代码不需要直接管理 Ring Buffer）：
rd->buffer_update(uniform_buffer, 0, sizeof(SceneData), &scene_data);
// RD 内部确保写入的是当前帧的安全区域
```

---

## 多后端实现

### 后端架构

```
RenderingDevice (抽象接口)
    │
    ├── RenderingDeviceDriverVulkan  (drivers/vulkan/)
    │   ├── VkInstance, VkDevice
    │   ├── VkBuffer, VkImage
    │   ├── VkPipeline, VkRenderPass
    │   └── VkCommandBuffer
    │
    ├── RenderingDeviceDriverMetal  (drivers/metal/)
    │   ├── MTLDevice, MTLCommandQueue
    │   ├── MTLBuffer, MTLTexture
    │   ├── MTLRenderPipelineState
    │   └── MTLCommandBuffer
    │
    ├── RenderingDeviceDriverD3D12  (drivers/d3d12/)
    │   ├── ID3D12Device
    │   ├── ID3D12Resource
    │   ├── ID3D12PipelineState
    │   └── ID3D12GraphicsCommandList
    │
    └── RenderingContextDriverOpenGL (drivers/opengl/)
        ├── GL Buffer, Texture
        └── GL Program (无 PipelineState 概念)
```

### 后端选择逻辑

```
DisplayServer::create()
    │
    ├── 项目设置 rendering/rendering_device/driver
    │
    ├── "vulkan" (默认桌面端)
    │   └── 创建 Vulkan Context + RenderingDevice
    │
    ├── "metal" (macOS/iOS)
    │   └── 创建 Metal Context + RenderingDevice
    │
    ├── "d3d12" (Windows 备选)
    │   └── 创建 D3D12 Context + RenderingDevice
    │
    └── "opengl3" (兼容模式)
        └── 创建 OpenGL Context + 兼容渲染器
```

### 各后端的差异处理

```
关键差异与处理方式：

1. 着色器编译：
   Vulkan:  SPIR-V → VkShaderModule
   Metal:   SPIR-V → MSL (通过 SPIRV-Cross) → MTLLibrary
   D3D12:   SPIR-V → HLSL/DXIL (通过 SPIRV-Cross)
   OpenGL:  GLSL 源码 → glCompileShader

2. 内存管理：
   Vulkan:  显式分配 VkDeviceMemory，手动管理内存类型
   Metal:   MTLBuffer 自动管理（更简单）
   D3D12:   ID3D12Heap + Placed Resources
   OpenGL:  glBufferData（驱动自动管理）

3. 同步机制：
   Vulkan:  VkSemaphore + VkFence（显式同步）
   Metal:   MTLFence（简单同步）
   D3D12:   ID3D12Fence（显式同步）
   OpenGL:  glFenceSync

4. Pipeline Cache：
   所有后端都支持管线缓存，加速后续帧的管线创建
```

---

## 技术原理

### 1. Vulkan 风格设计哲学

RenderingDevice 的设计深度遵循 Vulkan 理念：

- **显式资源管理**：所有 GPU 资源通过 RID 引用，需要手动创建和销毁
- **不可变管线状态**：PipelineState 在创建时就确定了所有渲染状态，运行时无法修改
- **命令录制与执行分离**：draw_list/compute_list 录制命令，submit() 提交执行
- **描述符集绑定**：通过 UniformSet 批量绑定资源，减少状态切换开销
- **Push Constants**：小量高频数据（如变换矩阵）通过 Push Constant 快速传递，无需 Uniform Buffer

### 2. 资源生命周期管理

```
RID 的生命周期：

创建：RID rid = rd->texture_create(...)
使用：rd->draw_list_bind_uniform_set(..., rid, ...)
释放：rd->free(rid)

注意事项：
  - 在渲染命令中使用 RID 前，确保资源已创建
  - 不要在 GPU 还在使用资源时释放它（Ring Buffer 解决了这个问题）
  - RenderingDevice 的 free() 会延迟到 GPU 不再使用时才真正销毁
```

### 3. 内存对齐

```cpp
// GPU 缓冲区需要遵循对齐规则
// Uniform Buffer 的最小对齐通常是 256 字节

struct SceneData {
    float projection_matrix[16];    // 64 bytes
    float view_matrix[16];          // 64 bytes
    float view_projection_matrix[16]; // 64 bytes
    float camera_position[4];       // 16 bytes
    // ...
    // 总大小必须是 minUniformBufferOffsetAlignment 的倍数
};

// Godot 使用 std140 布局（Vulkan 默认）
// vec3 占 16 字节（而非 12 字节）
// mat4 占 64 字节
// 数组元素占 16 字节
```

---

## 下一步

完成 RenderingDevice GPU 抽象层的学习后，继续学习 [02-渲染管线架构](./02-render-pipeline.md)。
