# 渲染管线架构

渲染管线是 Godot 4.x 渲染系统的核心调度层，控制从场景数据收集、剔除、光照计算到最终像素输出的整个流程。Godot 采用 Server-Compositor-Renderer 三级架构，通过 RenderingServer API 暴露给上层，由 RendererCompositorRD 调度具体的渲染方法（Forward+/Mobile/Compatibility）。

## 目录

- [架构概述](#架构概述)
- [RenderingServer API 层](#renderingserver-api-层)
- [RendererCompositorRD 管线调度](#renderingcompositorrd-管线调度)
- [RenderBufferRD 渲染目标](#renderbufferrd-渲染目标)
- [RendererSceneRD 3D 场景渲染](#rendererscenerd-3d-场景渲染)
- [Forward+ 管线流程](#forward-管线流程)
- [RendererCanvasCpu 2D 渲染](#renderercanvascpu-2d-渲染)
- [渲染全流程](#渲染全流程)
- [技术原理](#技术原理)

---

## 架构概述

```
┌─────────────────────────────────────────────────────────┐
│                   渲染架构分层                            │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │         RenderingServer (公共 API 层)             │   │
│  │   camera_create() / instance_create() / ...      │   │
│  │   light_create() / material_set_shader() / ...   │   │
│  └──────────────────┬───────────────────────────────┘   │
│                     │                                   │
│                     ▼                                   │
│  ┌──────────────────────────────────────────────────┐   │
│  │       RendererCompositorRD (管线调度器)           │   │
│  │   选择渲染方法：Forward+ / Mobile / GL Compat    │   │
│  └──────────────────┬───────────────────────────────┘   │
│                     │                                   │
│          ┌──────────┴──────────┐                        │
│          ▼                     ▼                        │
│  ┌───────────────┐    ┌───────────────┐                │
│  │RendererSceneRD│    │RendererCanvas │                │
│  │   (3D 渲染)   │    │   Cpu (2D)    │                │
│  │               │    │               │                │
│  │ Scene culling │    │ Canvas items  │                │
│  │ Cluster build │    │ 2D batching   │                │
│  │ Shadow maps   │    │ 2D lighting   │                │
│  │ Opaque pass   │    │               │                │
│  │ Transparent   │    │               │                │
│  │ Post-process  │    │               │                │
│  └───────────────┘    └───────────────┘                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 核心文件

| 文件 | 路径 | 说明 |
|------|------|------|
| RenderingServer | `servers/rendering/rendering_server.h` | 渲染服务器 API |
| RenderingServerDefault | `servers/rendering/rendering_server_default.h` | 默认实现 |
| RendererCompositorRD | `servers/rendering/renderer_rd/renderer_compositor_rd.h` | 管线调度器 |
| RendererSceneRD | `servers/rendering/renderer_rd/renderer_scene_rd.h` | 3D 场景渲染 |
| RenderBufferRD | `servers/rendering/renderer_rd/render_buffers_rd.h` | 渲染目标管理 |
| RendererCanvasCpu | `servers/rendering/renderer_canvas_cpu.h` | 2D 渲染 |
| Scene Shader | `servers/rendering/renderer_rd/scene_shader_rd.h` | 场景着色器管理 |
| Cluster Builder | `servers/rendering/renderer_rd/effects/cluster_builder_rd.h` | Cluster 构建 |

---

## RenderingServer API 层

`RenderingServer` 是 Godot 渲染系统的公共 API，所有渲染操作通过它暴露。GDScript、C++、编辑器都通过 RenderingServer 进行底层渲染操作。

### 核心结构

```cpp
// servers/rendering/rendering_server.h

class RenderingServer : public Object {
    GDCLASS(RenderingServer, Object);

    // ─── 资源管理 ───
    RID camera_create();
    void camera_set_perspective(RID p_camera, float p_fovy_degrees,
                                float p_z_near, float p_z_far);
    void camera_set_transform(RID p_camera, const Transform3D &p_transform);

    RID instance_create();
    void instance_set_base(RID p_instance, RID p_base);  // 绑定 Mesh/ParticleSystem
    void instance_set_transform(RID p_instance, const Transform3D &p_transform);
    void instance_set_layer_mask(RID p_instance, uint32_t p_mask);
    void instance_set_visibility_parent(RID p_instance, RID p_parent);

    RID light_create();
    void light_set_color(RID p_light, const Color &p_color);
    void light_set_param(RID p_light, LightParam p_param, float p_value);

    RID material_create();
    void material_set_shader(RID p_material, RID p_shader);
    void material_set_param(RID p_material, const StringName &p_param, const Variant &p_value);

    RID shader_create();
    void shader_set_code(RID p_shader, const String &p_code);

    RID mesh_create();
    // ... 更多 API

    // ─── 全局设置 ───
    void set_default_clear_color(const Color &p_color);
    void environment_set_bg(RID p_env, EnvironmentBG p_bg);
    void environment_set_ambient_light(RID p_env, const Color &p_color, ...);

    // ─── 帧管理 ───
    void set_physics_interpolation_enabled(bool p_enabled);
    bool has_changed() const;
    void init();
    void finish();
};
```

### RenderingServer API 分类

| 分类 | API 前缀 | 说明 |
|------|---------|------|
| 相机 | `camera_*` | 透视/正交相机、变换、投影 |
| 实例 | `instance_*` | 可渲染对象实例、变换、可见性 |
| 光照 | `light_*`, `directional_light_*` | 光源创建、参数设置 |
| 材质 | `material_*` | 材质创建、着色器绑定、参数 |
| 着色器 | `shader_*` | 着色器创建、代码设置 |
| 网格 | `mesh_*` | 网格创建、表面添加 |
| 纹理 | `texture_*` | 纹理创建、2D/3D/Cube |
| 环境 | `environment_*` | 环境光、天空、雾、GI |
| 画布项 | `canvas_item_*` | 2D 绘制命令 |
| 画布 | `canvas_*` | 2D 画布管理 |
| 视口 | `viewport_*` | 渲染目标视口 |

### RenderingServerDefault（默认实现）

```cpp
// servers/rendering/rendering_server_default.h

class RenderingServerDefault : public RenderingServer {
    // ─── 核心组件 ───
    RendererCompositor *compositor = nullptr;    // 管线调度器
    RendererCanvasRender *canvas = nullptr;      // 2D 渲染器
    RendererStorage *storage = nullptr;          // 资源存储

    // ─── 渲染调度 ───
    void _render_frame(bool p_want_framebuffer) {
        // 1. 遍历所有 Viewport
        // 2. 每个活动的 Viewport 执行渲染
        // 3. 调用 compositor->render_scene() 或 canvas->render_canvas()
    }
};
```

---

## RendererCompositorRD 管线调度

`RendererCompositorRD` 是渲染管线的核心调度器，根据项目设置选择 3D 渲染方法。

### 源码解析

```cpp
// servers/rendering/renderer_rd/renderer_compositor_rd.h

class RendererCompositorRD : public RendererCompositor {
    // ─── 核心组件 ───
    static RendererCompositorRD *singleton;

    RendererStorageRD *storage = nullptr;        // 资源存储
    RendererCanvasRenderRD *canvas = nullptr;    // 2D 渲染（基于 RD）

    // 3D 渲染器（根据渲染方法选择）
    RendererSceneRender *scene = nullptr;

    // ─── 渲染方法 ───
    enum RendererType {
        RENDERER_FORWARD_PLUS,     // Forward+ (Clustered, 桌面端默认)
        RENDERER_MOBILE,           // Mobile (简化前向)
        RENDERER_COMPATIBILITY,    // GL 兼容模式
    };

    static RendererType get_renderer_type();

    // ─── 核心方法 ───
    void initialize() override;
    void finalize() override;
    RendererCanvasRender *get_canvas() override { return canvas; }
    RendererSceneRender *get_scene() override { return scene; }
};
```

### 渲染方法选择

```
项目设置: rendering/renderer/rendering_method

┌────────────────────────────────────────────────────────────┐
│  "forward_plus" (默认)                                     │
│                                                            │
│  创建 RendererSceneRenderForwardClustered                   │
│  ├── Clustered Forward Shading                             │
│  ├── 支持大量实时光源（256+）                                │
│  ├── 支持计算着色器（GPU 粒子、GI）                          │
│  ├── 支持 MSAA                                             │
│  ├── 需要 Vulkan / Metal / D3D12                           │
│  └── 适用：桌面端、高性能平台                                │
├────────────────────────────────────────────────────────────┤
│  "mobile"                                                  │
│                                                            │
│  创建 RendererSceneRenderForwardMobile                      │
│  ├── 简化的前向渲染                                         │
│  ├── 限制光源数量（通常最多 8 个）                            │
│  ├── 更少的渲染 Pass                                       │
│  ├── 优化带宽和功耗                                         │
│  └── 适用：移动端、低端设备                                  │
├────────────────────────────────────────────────────────────┤
│  "gl_compatibility"                                        │
│                                                            │
│  创建 RendererSceneRenderCompat                            │
│  ├── 基于 OpenGL 3.3 / OpenGL ES 3.0                       │
│  ├── 不使用 RenderingDevice（直接调 OpenGL API）             │
│  ├── 功能有限（无计算着色器、无 Cluster）                    │
│  └── 适用：老旧硬件、Web 导出                               │
└────────────────────────────────────────────────────────────┘
```

### 初始化流程

```
RendererCompositorRD::initialize()
    │
    ├── 创建 RendererStorageRD
    │   ├── 管理 Mesh、Material、Shader、Texture 等资源
    │   ├── 管理 RID Owner 系统
    │   └── 创建默认资源（白色纹理、默认材质等）
    │
    ├── 创建 RenderingDevice
    │   └── RD::get_singleton() 初始化 GPU
    │
    ├── 选择渲染方法
    │   ├── "forward_plus" → new RendererSceneRenderForwardClustered()
    │   ├── "mobile"       → new RendererSceneRenderForwardMobile()
    │   └── "gl_compat"   → new RendererSceneRenderCompat()
    │
    ├── 创建 2D 渲染器
    │   └── new RendererCanvasRenderRD()
    │
    └── 初始化内置着色器
        ├── 编译所有内置 GLSL → SPIR-V
        ├── 缓存 PipelineState
        └── 预创建常用 UniformSet
```

---

## RenderBufferRD 渲染目标

`RenderBufferRD` 管理每个 Viewport 的渲染目标纹理（颜色、深度、法线等），是渲染管线的"画布"。

### 源码解析

```cpp
// servers/rendering/renderer_rd/render_buffers_rd.h

class RenderBufferRD : public RenderBuffer {
    // ─── 渲染目标纹理 ───
    Vector<RID> color;                // 颜色缓冲（MSAA 时多个）
    RID depth;                        // 深度缓冲
    RID velocity;                     // 速度缓冲（运动模糊、TAA）

    // Forward+ 专用缓冲
    RID normal_roughness;             // 法线+粗糙度缓冲
    RID voxelgi;                      // VoxelGI 缓冲

    // 后处理缓冲
   RID backbuffer;                   // 后缓冲（后处理中间结果）
    RID backbuffer_depth;            // 后缓冲深度

    // ─── 管理方法 ───
    void configure(RID p_render_target, int p_width, int p_height, ...);
    void cleanup();
    RID get_color_layer(uint32_t p_layer);
    RID get_depth();
};
```

### RenderBufferRD 缓冲布局

```
Forward+ 模式下的 RenderBufferRD：

┌──────────────────────────────────────────────┐
│              RenderBufferRD                  │
│                                              │
│  Color (RGBA16F)         ← 颜色输出         │
│  Depth (D32F / D24S8)   ← 深度缓冲          │
│  Normal+Roughness (RGBA8) ← 法线+粗糙度      │
│  Velocity (RG16F)       ← 运动向量          │
│  VoxelGI (RGBA16F)      ← GI 数据           │
│                                              │
│  后处理：                                     │
│  Backbuffer 0 (RGBA16F)  ← 后处理中间结果    │
│  Backbuffer 1 (RGBA16F)  ← 双缓冲           │
│  Backbuffer Depth        ← 后处理用深度      │
│                                              │
│  MSAA 时：                                    │
│  Color MSAAx4            ← 多重采样颜色      │
│  Depth MSAAx4            ← 多重采样深度      │
│  → resolve 后写入非 MSAA 版本                │
└──────────────────────────────────────────────┘
```

---

## RendererSceneRD 3D 场景渲染

`RendererSceneRD` 是 3D 渲染的基类，定义了场景渲染的公共接口。`RendererSceneRenderForwardClustered` 和 `RendererSceneRenderForwardMobile` 继承自它。

### 核心接口

```cpp
// servers/rendering/renderer_rd/renderer_scene_rd.h

class RendererSceneRenderForwardClustered : public RendererSceneRenderRD {
    // ─── 核心数据 ───
    RenderBufferDataForwardClustered *render_buffers = nullptr;
    ClusterBuilderRD *cluster_builder = nullptr;

    // ─── 渲染方法 ───
    void render_scene(RenderBufferData *p_buffer, ...) override;
    void render_material(const Transform3D &p_cam_transform, ...) override;
    void render_sdfgi(RID p_render_buffers, ...) override;

    // ─── Pass 管理 ───
    void _render_shadow_pass(RID p_light, ...);
    void _render_depth_prepass(RID p_render_buffers, ...);
    void _render_opaque_pass(RID p_render_buffers, ...);
    void _render_transparent_pass(RID p_render_buffers, ...);
    void _render_post_processing(RID p_render_buffers, ...);
    void _render_debug(RID p_render_buffers, ...);

    // ─── Cluster ───
    void _build_cluster(RID p_render_buffers, ...);
};
```

---

## Forward+ 管线流程

Forward+ 是 Godot 4.x 桌面端的默认渲染管线，基于 Clustered Forward Shading。下面详解其完整的渲染流程。

### 完整流程图

```
render_scene()
    │
    ├── 1. 场景剔除 (Scene Culling)
    │   ├── 视锥剔除 (Frustum Culling)
    │   │   └── AABB 与 6 个裁剪面测试
    │   ├── 遮挡剔除 (Occlusion Culling)
    │   │   └── 基于上一帧深度缓冲的软件遮挡剔除
    │   ├── 距离剔除 (Distance Culling)
    │   │   └── 超出 max_distance 的实例被剔除
    │   └── 层级剔除 (Layer Mask)
    │       └── camera.cull_mask & instance.layer_mask
    │
    ├── 2. Cluster 构建
    │   ├── 将视锥体切分为 3D Cluster 网格
    │   ├── 分配光源到各 Cluster
    │   ├── 分配反射探针到各 Cluster
    │   ├── 分配 GI 探针到各 Cluster
    │   └── 输出到 GPU Storage Buffer
    │
    ├── 3. 阴影贴图渲染 (Shadow Map Pass)
    │   ├── 方向光阴影
    │   │   ├── 级联阴影 (CSM)
    │   │   │   └── 最多 4 级级联
    │   │   └── 阴影图集 (Shadow Atlas) 中的独立区域
    │   ├── 点光源阴影（6 面立方体阴影）
    │   ├── 聚光灯阴影（透视阴影）
    │   └── 深度写入到阴影纹理
    │
    ├── 4. 深度预pass (Depth Prepass)
    │   ├── 只写入深度（不写颜色）
    │   ├── 对不透明物体执行
    │   ├── 使用简化的顶点着色器
    │   └── 目的：减少后续 Pass 的片元着色器调用（Early-Z）
    │
    ├── 5. G-Buffer 预pass（可选）
    │   ├── 写入 Normal + Roughness 到法线缓冲
    │   ├── VoxelGI 可见性数据
    │   └── 为 GI 和 Screen Space Effects 提供数据
    │
    ├── 6. 不透明物体渲染 (Opaque Pass)
    │   ├── 遍历可见的不透明实例
    │   ├── 按深度前→后排序
    │   ├── 对每个实例：
    │   │   ├── 绑定材质 PipelineState
    │   │   ├── 绑定材质 UniformSet
    │   │   ├── 绑定场景 UniformSet（包含 Cluster 数据）
    │   │   ├── 绑定着色器 UniformSet
    │   │   └── 执行 draw_call
    │   └── 着色器中查询 Cluster 获取光源列表，计算 PBR 光照
    │
    ├── 7. 天空渲染 (Sky Pass)
    │   ├── 渲染天空盒
    │   ├── 物理天空（大气散射）
    │   └── 输出到颜色缓冲
    │
    ├── 8. 透明物体渲染 (Transparent Pass)
    │   ├── 遍历可见的透明实例
    │   ├── 按深度后→前排序（画家算法）
    │   ├── 对每个实例执行 draw_call
    │   └── 使用前向渲染 + Alpha 混合
    │
    ├── 9. GI 渲染
    │   ├── VoxelGI 渲染
    │   ├── LightmapGI 应用
    │   └── SDFGI 渲染
    │
    ├── 10. 后处理 (Post-Processing)
    │   ├── MSAA Resolve（如果启用）
    │   ├── 屏幕空间反射 (SSR)
    │   ├── 屏幕空间环境光遮蔽 (SSAO)
    │   ├── 泛光 (Bloom / Glow)
    │   ├── 色调映射 (Tone Mapping)
    │   ├── FXAA / MSAA 抗锯齿
    │   ├── 运动模糊 (Motion Blur)
    │   ├── 景深 (DOF)
    │   ├── 镜头畸变
    │   └── 色彩校正 (Color Correction)
    │
    └── 11. 输出到 Viewport 帧缓冲
```

### 场景剔除详解

```
视锥剔除 (Frustum Culling)：

                近平面
               ┌─────┐
              /       \
             /  可见区  \
            /     域    \
           /             \
          └───────────────┘
               远平面

  对每个 Instance：
    1. 获取 AABB (世界空间包围盒)
    2. 与视锥 6 个裁剪面做相交测试
    3. 在视锥外 → 剔除（不渲染）
    4. 在视锥内 → 加入可见列表

遮挡剔除 (Occlusion Culling)：
  Godot 4.x 使用基于屏幕空间深度缓冲的遮挡剔除：
    1. 上一帧渲染的深度缓冲降采样为低分辨率
    2. 用低分辨率深度缓冲做 Hi-Z 测试
    3. 被遮挡的实例被剔除
```

### Cluster 构建详解

```cpp
// servers/rendering/renderer_rd/effects/cluster_builder_rd.h

class ClusterBuilderRD {
    // ─── Cluster 参数 ───
    static const uint32_t MAX_ELEMENTS = 512;  // 最大光源/探针数量
    uint32_t cluster_size = 64;                // Cluster 网格分辨率
    uint32_t max_cluster_elements = 128;       // 每个 Cluster 最大元素数

    // ─── GPU 数据 ───
    RID cluster_buffer;    // Cluster 数据 Storage Buffer
    RID cluster_data;      // 元素计数 Uniform Buffer

    // ─── 核心方法 ───
    void setup(uint32_t p_width, uint32_t p_height, ...);
    void begin(const Transform3D &p_cam_transform, const CameraMatrix &p_cam_projection);
    void bake();           // 执行 Cluster 构建（CPU 端计算 + GPU 上传）

    // ─── 元素类型 ───
    enum ElementType {
        ELEMENT_TYPE_OMNI_LIGHT,       // 点光源
        ELEMENT_TYPE_SPOT_LIGHT,      // 聚光灯
        ELEMENT_TYPE_REFLECTION_PROBE, // 反射探针
        ELEMENT_TYPE_VOXELGI,         // VoxelGI
        ELEMENT_TYPE_DECAL,           // 贴花
    };
};
```

### 阴影贴图渲染

```
方向光阴影 (Directional Shadow / CSM):

  ┌───────────────────────────────────┐
  │        阴影图集 (Shadow Atlas)     │
  │  ┌─────────┬─────────┐           │
  │  │ Cascade 0│ Cascade1│           │
  │  │  (近处)  │ (中近)  │           │
  │  ├─────────┼─────────┤           │
  │  │ Cascade 2│ Cascade3│           │
  │  │  (中远)  │ (远处)  │           │
  │  └─────────┴─────────┘           │
  └───────────────────────────────────┘

  CSM (Cascaded Shadow Maps) 原理：
    1. 将相机视锥体按深度分成 4 个级联
    2. 每个级联使用独立的正交投影
    3. 近处级联精度高，远处级联精度低
    4. 渲染时根据片元深度选择对应级联

点光源阴影 (Omni Shadow):
  6 面立方体阴影 (Cube Shadow Map)
  使用双抛物面投影优化为 2 个 draw call

聚光灯阴影 (Spot Shadow):
  透视投影的单面阴影
  渲染到阴影图集的一个子区域
```

---

## RendererCanvasCpu 2D 渲染

`RendererCanvasCpu` 负责 2D 渲染，与 3D 渲染共享 RenderingDevice 但使用独立的渲染管线。

### 核心结构

```cpp
// servers/rendering/renderer_canvas_cpu.h

class RendererCanvasCpu : public RendererCanvasRender {
    // ─── 渲染状态 ───
    RendererStorage *storage = nullptr;

    // ─── 核心方法 ───
    void canvas_render_items(RID p_to_render_target, ...);
    void draw_window(RID p_render_target, ...);
};
```

> 2D 渲染的详细内容将在 [05-2D 渲染系统](./05-2d-rendering.md) 中深入讲解。

---

## 渲染全流程

从一帧开始到最终上屏的完整流程：

```
Main::iteration()
    │
    ▼
SceneTree::_process()
    │
    ├── 更新场景节点变换
    │   ├── Node::_process() / Node::_physics_process()
    │   ├── 更新世界变换矩阵 (Transform3D)
    │   └── 更新 RenderingServer 中的 instance 变换
    │
    ▼
RenderingServerDefault::_render_frame()
    │
    ├── 遍历所有 Viewport
    │   │
    │   ▼
    │   Viewport::_draw()
    │   │
    │   ├── 3D 渲染
    │   │   ├── RendererCompositorRD::render_scene()
    │   │   │   │
    │   │   │   ├── 1. 场景剔除
    │   │   │   │   └── 视锥 + 遮挡 + 距离 + 层级
    │   │   │   │
    │   │   │   ├── 2. Cluster 构建
    │   │   │   │   └── 光源/探针/贴花分配到 Cluster
    │   │   │   │
    │   │   │   ├── 3. 阴影贴图
    │   │   │   │   └── 方向光 CSM + 点光/聚光阴影
    │   │   │   │
    │   │   │   ├── 4. 深度预pass
    │   │   │   │   └── 不透明物体深度写入
    │   │   │   │
    │   │   │   ├── 5. 不透明物体渲染
    │   │   │   │   ├── 深度前→后排序
    │   │   │   │   ├── 绑定材质 PipelineState
    │   │   │   │   ├── 绑定场景/材质 UniformSet
    │   │   │   │   └── draw_call（着色器查询 Cluster 计算光照）
    │   │   │   │
    │   │   │   ├── 6. 天空渲染
    │   │   │   │
    │   │   │   ├── 7. 透明物体渲染
    │   │   │   │   ├── 深度后→前排序
    │   │   │   │   └── Alpha 混合
    │   │   │   │
    │   │   │   └── 8. 后处理
    │   │   │       ├── MSAA Resolve
    │   │   │       ├── SSAO / SSR
    │   │   │       ├── Bloom / Glow
    │   │   │       ├── Tone Mapping
    │   │   │       └── FXAA / Color Correction
    │   │   │
    │   │   └── 输出到 Viewport 纹理
    │   │
    │   ├── 2D 渲染
    │   │   ├── RendererCanvasCpu::canvas_render_items()
    │   │   ├── 收集 CanvasItem
    │   │   ├── 排序和批处理
    │   │   └── 渲染到 Viewport 纹理
    │   │
    │   └── GUI 渲染
    │       └── 渲染 Control 节点
    │
    ▼
RenderingDevice::submit()     ─── 提交所有 GPU 命令
RenderingDevice::present()    ─── 呈现到交换链
    │
    ▼
下一帧
```

---

## 技术原理

### 1. Server-Compositor-Renderer 三级架构

```
RenderingServer (API 层)
  └── 对外暴露统一 API，屏蔽内部实现
      └── RendererCompositorRD (调度层)
          └── 选择渲染方法，管理渲染器生命周期
              ├── RendererSceneRD (3D 渲染器)
              │   └── 负责完整的 3D 渲染流程
              └── RendererCanvasCpu (2D 渲染器)
                  └── 负责完整的 2D 渲染流程
```

这种架构的优势：
- **API 稳定**：用户始终通过 RenderingServer 调用，不受内部实现变化影响
- **渲染方法可切换**：Forward+ / Mobile / Compatibility 无需修改上层代码
- **职责清晰**：每层只关注自己的任务

### 2. Reversed-Z 深度缓冲

Godot 4.x 使用 Reversed-Z 技术：

```
传统深度缓冲：
  near → depth=0, far → depth=1
  浮点精度在 0 附近最高，远处精度不足（z-fighting）

Reversed-Z：
  near → depth=1, far → depth=0
  浮点精度在 1 附近最高，近处精度最高（正好是需要的）
  compare_op 从 LESS 变为 GREATER

  好 处：大幅减少远处的 z-fighting 问题
```

### 3. 帧间一致性

```
Godot 使用多帧渲染策略：

  帧N：渲染场景 → 提交 → 呈现
  帧N+1：渲染场景 → 提交 → 呈现
  帧N+2：渲染场景 → 提交 → 呈现

  Ring Buffer（3帧）确保 CPU 写入不与 GPU 读取冲突：
  - Uniform Buffer 更新使用 Ring Buffer
  - 命令缓冲使用 Ring Buffer
  - 确保无需 CPU-GPU 同步等待
```

---

## 下一步

完成渲染管线架构的学习后，继续学习 [03-着色器与材质](./03-shader-material.md)。
