# 着色器与材质系统

着色器和材质系统是 Godot 渲染管线的核心纽带，将 GPU 渲染逻辑（Shader）与美术数据（Material）结合起来。Godot 4.x 使用自有的 GDShader 语言和 ShaderLanguage 解析器，通过 ShaderCompilerRD 编译为 GLSL/SPIR-V，再通过材质系统绑定到渲染实例。整个链路从 `.gdshader` 文件到 GPU PipelineState，涉及解析、编译、变体管理、Uniform 绑定等多个阶段。

## 目录

- [架构概述](#架构概述)
- [ShaderLanguage GDShader 解析器](#shaderlanguage-gdshader-解析器)
- [ShaderCompilerRD 编译器](#shadercompilerrd-编译器)
- [材质系统](#材质系统)
- [Uniform Sets 与 Descriptor 管理](#uniform-sets-与-descriptor-管理)
- [RenderingServer 材质 API](#renderingserver-材质-api)
- [着色器编译全流程](#着色器编译全流程)
- [技术原理](#技术原理)

---

## 架构概述

```
┌─────────────────────────────────────────────────────────┐
│                 着色器与材质体系                          │
│                                                         │
│  ┌─────────────┐   引用    ┌─────────────────────────┐ │
│  │  Material   │─────────→│  Shader (.gdshader)     │ │
│  │  (材质实例) │          │  shader_type spatial     │ │
│  │  参数值覆盖  │          │  uniform vec4 color      │ │
│  └──────┬──────┘          │  void vertex() { ... }   │ │
│         │                 │  void fragment() { ... }  │ │
│         │ compile                  │                   │
│         ▼                          │                   │
│  ┌─────────────┐   parse  ┌───────┴────────┐          │
│  │ GPU Shader  │◄────────│ShaderLanguage   │          │
│  │ (SPIR-V)    │          │ (解析器)        │          │
│  └─────────────┘          └───────┬────────┘          │
│                                   │ compile            │
│                           ┌───────┴────────┐          │
│                           │ShaderCompilerRD│          │
│                           │ (编译器)        │          │
│                           └────────────────┘          │
└─────────────────────────────────────────────────────────┘
```

### 核心文件

| 文件 | 路径 | 说明 |
|------|------|------|
| ShaderLanguage | `servers/rendering/shader_language.h` | GDShader 解析器 |
| ShaderLanguage AST | `servers/rendering/shader_language.h` | 抽象语法树定义 |
| ShaderCompilerRD | `servers/rendering/shader_compiler_rd.h` | GDShader → GLSL 编译器 |
| ShaderCompiler | `servers/rendering/shader_compiler.h` | 编译器基类 |
| MaterialStorage | `servers/rendering/renderer_rd/storage_rd/material_storage.h` | 材质存储管理 |
| ShaderStorage | `servers/rendering/renderer_rd/storage_rd/material_storage.h` | 着色器存储管理 |
| SceneShaderRD | `servers/rendering/renderer_rd/scene_shader_rd.h` | 场景着色器管理 |
| Built-in Shaders | `servers/rendering/renderer_rd/shaders/*.glsl` | 内置 GLSL 着色器 |

---

## ShaderLanguage GDShader 解析器

`ShaderLanguage` 是 GDShader 文本的解析器，将 `.gdshader` 文件解析为抽象语法树（AST）。

### GDShader 文件结构

```glsl
// 完整的 .gdshader 文件结构
shader_type spatial;                        // 着色器类型

render_mode blend_mix, depth_draw_opaque,   // 渲染模式
           cull_back, unshaded;

// ─── Uniform 声明 ───
uniform vec4 albedo_color : source_color = vec4(1.0, 0.0, 0.0, 1.0);
uniform float metallic : hint_range(0.0, 1.0) = 0.1;
uniform float roughness : hint_range(0.0, 1.0) = 0.5;
uniform sampler2D albedo_texture : source_color, filter_linear_mipmap,
                    repeat_enable;
uniform sampler2D normal_texture : hint_normal, filter_linear_mipmap;

// ─── Group Uniform（UBO 分组）───
group_uniforms PBR {
    uniform float metallic;
    uniform float roughness;
}

// ─── Varying（顶点→片元传递）───
varying vec3 local_position;

// ─── 顶点着色器 ───
void vertex() {
    local_position = VERTEX;
    VERTEX.y += sin(TIME + VERTEX.x * 2.0) * 0.3;
    NORMAL = normalize(NORMAL);
}

// ─── 片元着色器 ───
void fragment() {
    vec4 tex = texture(albedo_texture, UV);
    ALBEDO = albedo_color.rgb * tex.rgb;
    METALLIC = metallic;
    ROUGHNESS = roughness;

    if (normal_texture.is_valid()) {
        NORMAL_MAP = texture(normal_texture, UV).rgb;
        NORMAL_MAP_DEPTH = 1.0;
    }

    ALPHA = albedo_color.a * tex.a;
}

// ─── 自定义光照函数（可选）───
void light() {
    DIFFUSE_LIGHT += clamp(dot(NORMAL, LIGHT), 0.0, 1.0)
                     * ATTENUATION * LIGHT_COLOR;
}
```

### shader_type 与 render_mode

| shader_type | 说明 | 允许的函数 |
|-------------|------|-----------|
| `spatial` | 3D 物体渲染 | `vertex()`, `fragment()`, `light()` |
| `canvas_item` | 2D/UI 渲染 | `vertex()`, `fragment()`, `light()` |
| `particles` | GPU 粒子 | `start()`, `process()` |
| `sky` | 天空渲染 | `sky()`, `fog()` |
| `fog` | 体积雾 | `fog()` |

### 常用 render_mode（spatial 类型）

| render_mode | 说明 |
|-------------|------|
| `blend_mix` | Alpha 混合（默认） |
| `blend_add` | 加法混合 |
| `blend_sub` | 减法混合 |
| `blend_mul` | 乘法混合 |
| `blend_premul_alpha` | 预乘 Alpha |
| `depth_draw_opaque` | 仅不透明物体写深度（默认） |
| `depth_draw_always` | 总是写深度 |
| `depth_draw_never` | 不写深度 |
| `depth_test_disabled` | 禁用深度测试 |
| `cull_back` | 背面剔除（默认） |
| `cull_front` | 正面剔除 |
| `cull_disabled` | 不剔除 |
| `unshaded` | 不受光照影响 |
| `wireframe` | 线框渲染 |
| `vertex_lighting` | 逐顶点光照 |
| `diffuse_lambert` / `diffuse_burley` / `diffuse_toon` | 漫反射模型 |
| `specular_schlick_ggx` / `specular_toon` | 高光模型 |
| `shadows_disabled` | 不接收阴影 |
| `ambient_light_disabled` | 不受环境光影响 |

### 内置变量（spatial 类型）

| 变量 | 类型 | 着色器阶段 | 说明 |
|------|------|-----------|------|
| `VERTEX` | `inout vec3` | vertex | 顶点位置（模型空间输入，裁剪空间输出） |
| `NORMAL` | `inout vec3` | vertex/fragment | 法线 |
| `TANGENT` | `inout vec3` | vertex | 切线 |
| `BINORMAL` | `inout vec3` | vertex | 副法线 |
| `UV` | `inout vec2` | vertex/fragment | 纹理坐标 |
| `UV2` | `inout vec2` | vertex/fragment | 第二套纹理坐标 |
| `COLOR` | `inout vec4` | vertex/fragment | 顶点颜色 |
| `ALBEDO` | `out vec3` | fragment | 基础颜色 |
| `ALPHA` | `out float` | fragment | Alpha 透明度 |
| `METALLIC` | `out float` | fragment | 金属度 |
| `ROUGHNESS` | `out float` | fragment | 粗糙度 |
| `EMISSION` | `out vec3` | fragment | 自发光 |
| `NORMAL_MAP` | `out vec3` | fragment | 法线贴图值 |
| `SPECULAR` | `out float` | fragment | 镜面反射强度 |
| `AO` | `out float` | fragment | 环境光遮蔽 |
| `SSS_STRENGTH` | `out float` | fragment | 次表面散射强度 |
| `SCREEN_UV` | `in vec2` | fragment | 屏幕空间 UV |
| `TIME` | `in float` | vertex/fragment | 运行时间 |
| `VIEW` | `in vec3` | fragment | 视线方向 |
| `LIGHT` | `in vec3` | light | 光照方向 |
| `LIGHT_COLOR` | `in vec3` | light | 光源颜色 |
| `ATTENUATION` | `in float` | light | 光源衰减 |
| `DIFFUSE_LIGHT` | `inout vec3` | light | 漫反射光照结果 |
| `SPECULAR_LIGHT` | `inout vec3` | light | 镜面光照结果 |

### ShaderLanguage 解析过程

```cpp
// servers/rendering/shader_language.h

class ShaderLanguage {
    // ─── AST 节点类型 ───
    enum NodeType {
        NODE_TYPE_SHADER,           // 根节点：着色器程序
        NODE_TYPE_FUNCTION,         // 函数定义
        NODE_TYPE_BLOCK,            // 代码块
        NODE_TYPE_VARIABLE_DECLARATION, // 变量声明
        NODE_TYPE_UNIFORM,          // uniform 声明
        NODE_TYPE_VARYING,          // varying 声明
        NODE_TYPE_OPERATOR,         // 运算符
        NODE_TYPE_CONTROL_FLOW,     // 控制流 (if/for/while)
        NODE_TYPE_MEMBER,           // 成员访问
        NODE_TYPE_ARRAY,            // 数组
        NODE_TYPE_CONSTANT,         // 常量
        NODE_TYPE_STRUCT,           // 结构体定义
    };

    // ─── 核心解析方法 ───
    Error parse(const String &p_code, const ShaderWarning::Code p_warning = ShaderWarning::NO_WARNING);
    // 1. 词法分析（Tokenizer）
    //    将源码分解为 Token 流
    // 2. 语法分析（Parser）
    //    根据 Token 流构建 AST
    // 3. 语义分析
    //    类型检查、变量作用域验证

    // ─── 解析结果 ───
    struct ShaderNode {
        String type;                    // "spatial", "canvas_item", ...
        Vector<StringName> render_modes; // render_mode 列表
        Vector<MemberNode *> uniforms;  // uniform 列表
        Vector<MemberNode *> varyings;  // varying 列表
        Vector<MemberNode *> functions; // 函数列表
        Vector<MemberNode *> structs;   // 结构体列表
        Vector<MemberNode *> constants; // 常量列表
    };
};
```

### 解析流程

```
.gdshader 源码文本
    │
    ▼ 词法分析 (Tokenizer)
Token 流:
  [shader_type] [spatial] [;]
  [render_mode] [blend_mix] [,] [cull_back] [;]
  [uniform] [vec4] [albedo_color] [:] [source_color] [=] [vec4] [(] [1.0] [,] [0.0] ... [;]
  [void] [vertex] [(] [)] [{] ... [}]
  [void] [fragment] [(] [)] [{] ... [}]
    │
    ▼ 语法分析 (Parser)
AST (抽象语法树):
  ShaderNode
  ├── type: "spatial"
  ├── render_modes: ["blend_mix", "cull_back"]
  ├── uniforms:
  │   ├── UniformNode("albedo_color", TYPE_VEC4, hint=SOURCE_COLOR, default=(1,0,0,1))
  │   ├── UniformNode("metallic", TYPE_FLOAT, hint=RANGE(0,1), default=0.1)
  │   └── UniformNode("albedo_texture", TYPE_SAMPLER2D, ...)
  ├── functions:
  │   ├── FunctionNode("vertex", body=BlockNode(...))
  │   └── FunctionNode("fragment", body=BlockNode(...))
  └── varyings:
      └── VaryingNode("local_position", TYPE_VEC3)
    │
    ▼ 语义分析
类型检查：
  - vec3 + float → 错误（类型不匹配）
  - texture(sampler2D, vec2) → 正确
  - 未声明的变量 → 错误
  - uniform 重复声明 → 错误
```

---

## ShaderCompilerRD 编译器

`ShaderCompilerRD` 将 GDShader AST 转换为有效的 GLSL 源码，再通过 glslang 编译为 SPIR-V。

### 源码解析

```cpp
// servers/rendering/shader_compiler_rd.h

class ShaderCompilerRD : public ShaderCompiler {
    // ─── 编译核心 ───
    void compile(RS::ShaderMode p_mode, const ShaderLanguage::ShaderNode *p_shader,
                 const ShaderLanguage::ShaderNode *p_previous,
                 GeneratedCode &r_gen_code, const Actions &p_actions,
                 bool p_static_flags = false) override;

    // ─── 编译配置 ───
    struct Actions {
        // 入口函数重命名映射
        Map<StringName, StringName> renames;
        // render_mode → GLSL 代码映射
        Map<StringName, DefaultIdentifier> render_mode_defines;
        // 自定义代码生成回调
        HashMap<StringName, Pair<StringName, int>> base_varying_names;
        // 入口点名称
        StringName vertex_displacement;
        // ...
    };

    // ─── 生成代码结构 ───
    struct GeneratedCode {
        Vector<Uniform> uniforms;
        Vector<uint32_t> uniform_offsets;
        uint32_t uniform_total_size = 0;

        String uniforms;              // UBO 声明
        String vertex_globals;       // 顶点着色器全局变量
        String vertex_code;          // 顶点着色器代码
        String fragment_globals;     // 片元着色器全局变量
        String fragment_code;        // 片元着色器代码
        String light_code;           // 光照函数代码

        Vector<String> texture_names; // 纹理 uniform 名称列表
        Vector<TextureUniform> texture_uniforms;

        bool uses_alpha = false;
        bool uses_screen_uv = false;
        bool uses_time = false;
        // ...
    };
};
```

### GDShader → GLSL 转换规则

```
变量重命名映射（Actions.renames）：

GDShader                  →  GLSL
─────────────────────────────────────────────────
VERTEX                    →  out_vertices[i].vertex
NORMAL                    →  out_vertices[i].normal
UV                        →  out_vertices[i].uv
ALBEDO                    →  out_color.rgb
ALPHA                     →  out_color.a
METALLIC                  →  scene_data.metallic
ROUGHNESS                 →  scene_data.roughness
EMISSION                  →  out_emission
SCREEN_UV                 →  screen_uv
TIME                      →  scene_block.time
LIGHT                     →  light_uniforms[i].direction
LIGHT_COLOR               →  light_uniforms[i].color
DIFFUSE_LIGHT             →  diffuse_light
SPECULAR_LIGHT            →  specular_light

函数重命名：
vertex()                  →  main()（顶点着色器）
fragment()                →  main()（片元着色器）
light()                   →  light_compute()（光照函数）
```

### 编译流程

```
ShaderLanguage AST
    │
    ▼ ShaderCompilerRD::compile()
    │
    ├── 1. 处理 Uniform 声明
    │   ├── 生成 UBO 布局声明
    │   ├── 计算偏移量（std140 对齐）
    │   └── 生成纹理采样器声明
    │
    ├── 2. 处理 render_mode
    │   ├── blend_mix → 混合状态代码
    │   ├── cull_back → 光栅化状态代码
    │   └── unshaded → 跳过光照计算代码
    │
    ├── 3. 生成顶点着色器
    │   ├── 添加引擎内置 Uniform（ProjectionMatrix, ViewMatrix 等）
    │   ├── 重命名变量 (VERTEX → out_vertex, ...)
    │   ├── 转换 vertex() 函数为 main()
    │   └── 添加变换代码（模型→世界→裁剪空间）
    │
    ├── 4. 生成片元着色器
    │   ├── 添加 Cluster 查询代码
    │   ├── 重命名变量 (ALBEDO → out_color, ...)
    │   ├── 转换 fragment() 函数
    │   └── 添加 PBR 光照计算代码
    │
    ├── 5. 生成光照函数
    │   └── 转换 light() 函数为 light_compute()
    │
    └── 6. 输出 GeneratedCode
        ├── vertex_code (GLSL)
        ├── fragment_code (GLSL)
        ├── light_code (GLSL)
        ├── uniform 列表
        └── 纹理列表
```

### SPIR-V 编译

```
GeneratedCode (GLSL)
    │
    ▼ RenderingDevice::shader_compile_from_source()
    │
    ├── glslang 编译器
    │   ├── GLSL → SPIR-V (Vertex)
    │   ├── GLSL → SPIR-V (Fragment)
    │   └── 可选：GLSL → SPIR-V (Compute)
    │
    └── SPIR-V 字节码
        │
        ▼ RenderingDevice::shader_create_from_spirv()
        RID (着色器资源)
        ├── 反射（Reflection）提取 Uniform 信息
        ├── 创建 Vulkan Pipeline Layout
        └── 创建 VkShaderModule
```

---

## 材质系统

Godot 的材质系统管理着色器参数的实际值，是连接着色器代码和渲染实例的桥梁。

### 材质继承体系

```
Material (抽象基类, RID 管理)
├── StandardMaterial3D      ─── PBR 标准材质（最常用）
│   ├── Metalic/Spatial         ├── albedo_color / albedo_texture
│   ├── Roughness               ├── metallic / roughness
│   └── Emission                ├── emission
│                                └── normal_texture / ao_texture
├── ShaderMaterial           ─── 自定义着色器材质
│   └── 用户编写 .gdshader       ├── shader 属性
│                                └── 自定义 uniform 参数
├── CanvasItemMaterial       ─── 2D 材质
│   ├── blend_mode               ├── mix / add / sub / mul / premul
│   └── light_mode               └── light_only / light_mask
├── ParticleProcessMaterial  ─── GPU 粒子材质
├── FogMaterial              ─── 体积雾材质
├── PanoramaSkyMaterial      ─── 全景天空材质
├── PhysicalSkyMaterial      ─── 物理天空材质
└── ProceduralSkyMaterial    ─── 程序化天空材质
```

### StandardMaterial3D

`StandardMaterial3D` 是 Godot 的内置 PBR 材质，覆盖了绝大多数使用场景：

```cpp
// scene/resources/material.h

class StandardMaterial3D : public Material {
    GDCLASS(StandardMaterial3D, Material);

    // ─── 核心属性 ───
    // Albedo
    Color albedo_color = Color(1, 1, 1, 1);
    Ref<Texture2D> albedo_texture;

    // Metallic / Roughness
    float metallic = 0.0f;
    float roughness = 1.0f;
    Ref<Texture2D> metallic_texture;
    Ref<Texture2D> roughness_texture;

    // Emission
    Color emission = Color(0, 0, 0);
    float emission_energy = 1.0f;
    Ref<Texture2D> emission_texture;

    // Normal Map
    Ref<Texture2D> normal_texture;
    float normal_scale = 1.0f;

    // Ambient Occlusion
    Ref<Texture2D> ao_texture;
    float ao_light_affect = 0.0f;

    // Rim
    float rim = 0.0f;
    Color rim_color = Color(1, 1, 1, 1);
    Ref<Texture2D> rim_texture;

    // Clearcoat
    float clearcoat = 0.0f;
    float clearcoat_roughness = 0.0f;
    Ref<Texture2D> clearcoat_texture;

    // Subsurface Scattering
    float subsurf_scatter_strength = 0.0f;
    Ref<Texture2D> subsurf_scatter_texture;

    // Transmission
    Color transmission = Color(0, 0, 0);
    Ref<Texture2D> transmission_texture;

    // Shading Mode
    ShadingMode shading_mode = SHADING_MODE_PER_PIXEL;

    // Transparency
    Transparency transparency = TRANSPARENCY_DISABLED;

    // Blend Mode
    BlendMode blend_mode = BLEND_MODE_MIX;

    // Depth Draw Mode
    DepthDrawMode depth_draw_mode = DEPTH_DRAW_OPAQUE;

    // Cull Mode
    CullMode cull_mode = CULL_BACK;

    // Texture Channel 映射
    TextureChannel metallic_texture_channel;
    TextureChannel roughness_texture_channel;
    TextureChannel ao_texture_channel;
};
```

### BaseMaterial3D 属性映射到着色器

```
StandardMaterial3D 属性           GDShader Uniform
───────────────────────────────────────────────────
albedo_color                  →   uniform vec4 albedo_color
albedo_texture                →   uniform sampler2D texture_albedo
metallic                      →   uniform float metallic
roughness                     →   uniform float roughness
emission                      →   uniform vec4 emission
emission_energy               →   uniform float emission_energy
normal_texture                →   uniform sampler2D texture_normal
normal_scale                  →   uniform float normal_scale
ao_texture                    →   uniform sampler2D texture_ao
ao_light_affect               →   uniform float ao_light_affect

StandardMaterial3D 内部使用预编译的着色器变体：
  根据启用的特性组合（metallic、roughness、normal_map 等）
  自动选择对应的着色器变体（通过 Shader Compilation Template）
```

### ShaderMaterial

```cpp
// scene/resources/material.h

class ShaderMaterial : public Material {
    GDCLASS(ShaderMaterial, Material);

    // ─── 核心属性 ───
    Ref<Shader> shader;                    // 关联的 Shader 资源
    Dictionary shader_parameter_override;  // 参数覆盖

    // ─── 方法 ───
    void set_shader(const Ref<Shader> &p_shader);
    Ref<Shader> get_shader() const;

    void set_shader_parameter(const StringName &p_name, const Variant &p_value);
    Variant get_shader_parameter(const StringName &p_name) const;
};
```

---

## Uniform Sets 与 Descriptor 管理

### 材质 Uniform 的运行时管理

```cpp
// servers/rendering/renderer_rd/storage_rd/material_storage.h

class MaterialStorage {
    // ─── 材质数据 ───
    struct MaterialData {
        // 编译后的着色器代码
        ShaderCompilerRD::GeneratedCode shader_code;

        // Uniform Set（每个材质实例独立的资源绑定）
        RID uniform_set;    // 描述符集（包含所有 uniform 绑定）

        // Uniform 缓冲
        RID uniform_buffer; // UBO RID
        uint8_t *uniform_data = nullptr; // CPU 端数据副本

        // 纹纹理 RID 列表
        Vector<RID> texture_rids;

        // 管线缓存
        RID pipeline;
        uint32_t pipeline_key = 0;
    };

    // ─── 材质管理方法 ───
    void material_update_dependency(RID p_material, DependencyTracker *p_instance);
    void material_set_shader(RID p_material, RID p_shader);
    void material_set_param(RID p_material, const StringName &p_param, const Variant &p_value);
    Variant material_get_param(RID p_material, const StringName &p_param) const;

    // ─── Uniform 更新 ───
    void _material_update_shader_uniforms(MaterialData *p_material_data);
    // 将材质参数打包到 Uniform Buffer，创建/更新 UniformSet
};
```

### Uniform Buffer 布局

```
材质 Uniform Buffer（std140 布局）：

  Offset   Type       Name
  ──────   ────       ────
  0        vec4       albedo_color      (16 bytes)
  16       float      metallic          (4 bytes + 12 padding)
  32       float      roughness         (4 bytes + 12 padding)
  48       vec3       emission          (12 bytes + 4 padding)
  64       float      emission_energy   (4 bytes + 12 padding)
  80       float      normal_scale      (4 bytes + 12 padding)
  ...

  std140 对齐规则：
  - vec4 / mat4 占 16 字节
  - vec3 占 16 字节（填充到 16 字节边界）
  - float 占 4 字节（但数组元素占 16 字节）
  - 整体大小是 16 字节的倍数
```

### UniformSet 创建流程

```
1. 材质参数变化
   material.set_shader_parameter("albedo_color", Color(1, 0, 0))
    │
    ▼
2. MaterialStorage::material_set_param()
   ├── 更新 CPU 端 uniform_data 副本
   └── 标记 uniform_dirty = true
    │
    ▼
3. 渲染前 _material_update_shader_uniforms()
   ├── 将 uniform_data 写入 Uniform Buffer
   │   rd->buffer_update(ubo, 0, size, data)
   │
   ├── 收集纹理 RID
   │   ├── binding 0: UBO (albedo_color, metallic, ...)
   │   ├── binding 1: Sampler + albedo_texture
   │   ├── binding 2: Sampler + normal_texture
   │   └── binding N: ...
   │
   └── 创建 UniformSet
       rd->uniform_set_create(uniforms, shader_rid, set_index)
```

---

## RenderingServer 材质 API

### 着色器创建与使用

```cpp
// 通过 RenderingServer API 操作着色器和材质

// 1. 创建着色器
RID shader = RenderingServer::get_singleton()->shader_create();
RenderingServer::get_singleton()->shader_set_code(shader, R"(
    shader_type spatial;
    uniform vec4 color : source_color = vec4(1, 0, 0, 1);
    void fragment() {
        ALBEDO = color.rgb;
    }
)");

// 2. 创建材质
RID material = RenderingServer::get_singleton()->material_create();
RenderingServer::get_singleton()->material_set_shader(material, shader);

// 3. 设置材质参数
RenderingServer::get_singleton()->material_set_param(material, "color", Color(0, 1, 0));

// 4. 绑定材质到渲染实例
RenderingServer::get_singleton()->instance_geometry_set_material_override(instance, material);

// 5. 使用完成后释放
RenderingServer::get_singleton()->free(material);
RenderingServer::get_singleton()->free(shader);
```

### Shader 变体与 Pipeline 缓存

```
同一个 Shader 根据不同的渲染上下文产生多个变体：

Forward+ 模式下的变体：
├── Shadow Pass 变体
│   └── 只输出深度，简化片元着色器
├── Depth Prepass 变体
│   └── 只写深度缓冲
├── Opaque Pass 变体
│   └── 完整 PBR 光照计算 + Cluster 查询
├── Transparent Pass 变体
│   └── 完整 PBR + Alpha 混合
└── Wireframe 变体
    └── 线框模式渲染

每种变体需要不同的 PipelineState：
  PipelineState = Shader + FramebufferFormat + Blend + Depth + ...
  → 缓存到 MaterialStorage 的 pipeline_cache 中
```

---

## 着色器编译全流程

从用户编写 `.gdshader` 文件到 GPU 执行着色器程序的完整流程：

```
用户编写 .gdshader
    │
    ▼ 编辑器导入
ShaderImporter::import()
    │ 初步检查语法
    │ 存储为 Shader 资源
    │
    ▼ 首次使用时
Shader::get_shader_mode()
    │
    ▼ 解析
ShaderLanguage::parse(shader_code)
    │ 词法分析 → Token 流
    │ 语法分析 → AST
    │ 语义分析 → 类型检查
    │
    ▼ 编译
ShaderCompilerRD::compile()
    │ AST → GeneratedCode (GLSL)
    │ 变量重命名 (VERTEX → out_vertex)
    │ 添加引擎内置 Uniform 声明
    │ 添加坐标变换代码
    │ 添加 PBR 光照计算框架
    │
    ▼ SPIR-V 编译
RenderingDevice::shader_compile_from_source()
    │ GLSL → SPIR-V (通过 glslang)
    │ 生成各阶段字节码
    │
    ▼ 着色器创建
RenderingDevice::shader_create_from_spirv()
    │ 创建 RID
    │ 反射提取 Uniform 信息
    │ 创建 Pipeline Layout
    │ 创建 VkShaderModule
    │
    ▼ 材质绑定
MaterialStorage::material_set_shader()
    │ 关联 Shader RID 到 Material
    │ 创建 Uniform Buffer
    │ 创建默认 UniformSet
    │
    ▼ 渲染时
SceneShaderRD::material_get_pipeline()
    │ 根据 Pass 类型（Shadow/Opaque/Transparent）
    │ 查找或创建对应的 PipelineState
    │ 缓存 PipelineState 以供复用
    │
    ▼ 绘制
draw_list_bind_render_pipeline(pipeline)
draw_list_bind_uniform_set(material_uniforms, set_index)
draw_list_draw()
```

---

## 技术原理

### 1. GDShader 语言设计哲学

```
GDShader 的设计目标：

1. 简洁易学
   - 使用 void vertex() / void fragment() 而非 GLSL 的 void main()
   - 内置变量 (VERTEX, ALBEDO) 直接可用，无需声明

2. 跨平台
   - 编写一次，自动编译为 SPIR-V/GLSL/MSL/HLSL
   - 用户不需要了解各平台的差异

3. 与引擎深度集成
   - TIME、VIEW、SCREEN_UV 等内置变量由引擎自动提供
   - render_mode 自动设置混合/深度/剔除状态
   - hint_range、hint_normal 等提示影响编辑器 UI

4. 类型安全
   - ShaderLanguage 在解析阶段就做类型检查
   - 减少运行时错误
```

### 2. 着色器变体管理

```
着色器变体的挑战：

一个 StandardMaterial3D 可能的宏组合：
  - USE_ALBEDO_TEXTURE: on/off
  - USE_NORMAL_TEXTURE: on/off
  - USE_METALLIC_TEXTURE: on/off
  - USE_ROUGHNESS_TEXTURE: on/off
  - USE_EMISSION: on/off
  - USE_AO_TEXTURE: on/off
  - USE_TRANSMISSION: on/off
  - USE_SSS: on/off
  - USE_CLEARCOAT: on/off
  - ...

10 个布尔宏 → 2^10 = 1024 种变体
每种变体 × 4 种 Pass (Shadow/Depth/Opaque/Transparent) = 4096 个 PipelineState

Godot 的优化策略：
  1. 按需编译：只在首次使用时编译对应变体
  2. Pipeline 缓存：编译后缓存 PipelineState
  3. 宏合并：相同宏组合共享着色器
  4. 简化着色器：Shadow Pass 不使用材质纹理
```

### 3. Uniform 更新策略

```
三种 Uniform 更新频率：

1. 每帧更新（Scene UBO）
   - 投影矩阵、视图矩阵、时间
   - 使用 Ring Buffer 避免同步
   - 所有实例共享

2. 每材质更新（Material UBO）
   - albedo_color, metallic, roughness
   - 仅在参数变化时更新
   - 相同材质的实例共享

3. 每实例更新（Instance UBO / Push Constant）
   - 模型矩阵、实例自定义数据
   - 每个实例独立
   - 小数据用 Push Constant（<128 bytes）
   - 大数据用 Storage Buffer
```

---

## 下一步

完成着色器与材质的学习后，继续学习 [04-3D 渲染详解](./04-3d-rendering.md)。
