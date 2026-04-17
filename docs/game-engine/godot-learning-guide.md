# Godot 引擎源码学习指南

本指南提供系统化的 Godot 引擎源码学习路径，帮助读者从零开始逐步深入理解引擎架构和实现原理。

## 目录

- [学习准备](#学习准备)
- [第一阶段：基础入门](#第一阶段基础入门1-2周)
- [第二阶段：核心深入](#第二阶段核心深入2-3周)
- [第三阶段：场景系统](#第三阶段场景系统2-3周)
- [第四阶段：渲染系统](#第四阶段渲染系统3-4周)
- [第五阶段：物理与脚本](#第五阶段物理与脚本2-3周)
- [第六阶段：编辑器与扩展](#第六阶段编辑器与扩展2-3周)
- [第七阶段：平台与驱动](#第七阶段平台与驱动2周)
- [调试技巧与工具](#调试技巧与工具)
- [代码风格与贡献](#代码风格与贡献)
- [学习资源汇总](#学习资源汇总)

---

## 学习准备

### 环境配置

#### 获取源码

```bash
# 克隆仓库
git clone https://github.com/godotengine/godot.git
cd godot

# 切换到稳定版本（推荐）
git checkout 4.2-stable
```

#### 编译调试版本

```bash
# Linux/macOS
scons platform=linuxbsd dev_build=yes -j$(nproc)

# Windows (使用 Visual Studio)
scons platform=windows dev_build=yes -j%NUMBER_OF_PROCESSORS%
```

**关键编译参数**：

| 参数 | 说明 |
|------|------|
| `dev_build=yes` | 开发构建，启用断言和调试符号 |
| `optimize=debug` | 调试优化级别 |
| `symbols=yes` | 生成调试符号 |
| `verbose=yes` | 显示详细编译输出 |

### IDE 配置

#### VS Code 推荐配置

```json
// .vscode/c_cpp_properties.json
{
    "configurations": [{
        "name": "Linux",
        "includePath": [
            "${workspaceFolder}/**",
            "${workspaceFolder}/core",
            "${workspaceFolder}/scene",
            "${workspaceFolder}/servers"
        ],
        "defines": ["DEBUG_ENABLED", "TOOLS_ENABLED"],
        "compilerPath": "/usr/bin/g++",
        "cStandard": "c17",
        "cppStandard": "c++17"
    }]
}
```

#### 推荐扩展

- **C/C++** (Microsoft) - 代码补全和调试
- **C/C++ Intellisense** - 增强的代码导航
- **clangd** - 替代的 C++ 语言服务器
- **CodeLLDB** - LLDB 调试支持

### 代码导航技巧

1. **理解 GDCLASS 宏**：使用 `-E` 预处理选项查看宏展开
   ```bash
   g++ -E -I. core/object/object.h | less
   ```

2. **追踪继承关系**：使用 IDE 的"查看类型层次结构"功能

3. **查找引用**：搜索 `GDCLASS(ClassName` 找到所有子类

---

## 第一阶段：基础入门（1-2周）

### 目标

理解引擎整体架构和启动流程，建立对核心概念的基本认知。

### 学习内容

#### 1. 引擎入口点 - `main/main.cpp`

**阅读路径**：
```
main() → Main::setup() → Main::setup2() → Main::start()
```

**关键函数**：

| 函数 | 作用 |
|------|------|
| `Main::setup()` | 初始化 OS、内存、核心类型 |
| `Main::setup2()` | 创建显示服务器、初始化渲染 |
| `Main::start()` | 创建 MainLoop，启动游戏循环 |

**代码片段**（简化版）：
```cpp
// main/main.cpp
int main(int argc, char *argv[]) {
    // 1. 创建 OS 单例
    OS::create_instance();

    // 2. 解析命令行
    List<String> args;
    for (int i = 1; i < argc; i++) {
        args.push_back(argv[i]);
    }

    // 3. 初始化核心系统
    register_core_types();
    register_core_driver_types();
    register_core_extensions();

    // 4. 主循环
    while (Main::iteration()) {
        // 持续运行
    }

    // 5. 清理
    unregister_core_types();
}
```

#### 2. 对象模型 - `core/object/object.h`

**核心概念**：
- **Object**：所有引擎类的基类
- **ObjectID**：64 位唯一标识符
- **GDCLASS 宏**：自动类注册

**关键代码**：
```cpp
class Object {
    ObjectID _instance_id;           // 唯一 ID
    ScriptInstance *script_instance; // 脚本实例
    HashMap<StringName, SignalData> signal_map; // 信号

    // 类型转换
    template<typename T>
    static T *cast_to(Object *p_object);

    // 属性访问
    virtual bool _set(const StringName &p_name, const Variant &p_value);
    virtual Variant _get(const StringName &p_name) const;
};
```

#### 3. 动态类型 - `core/variant/variant.h`

**Variant 支持的类型**：
```cpp
enum Type {
    NIL, BOOL, INT, FLOAT, STRING,
    VECTOR2, VECTOR2I, RECT2, VECTOR3, ...
    ARRAY, DICTIONARY,
    // 共 30+ 种类型
};
```

**内部存储**：
```cpp
// 使用联合体存储，大小为 24-40 字节
union {
    bool _bool;
    int64_t _int;
    double _float;
    // ... 其他类型
} _data;
```

### 实践任务

1. **跟踪启动流程**
   - 在 `main()` 设置断点
   - 单步执行，观察各子系统的初始化顺序

2. **观察对象创建**
   - 在 `Object::Object()` 构造函数设置断点
   - 创建一个简单场景，统计对象创建次数

3. **理解 Variant**
   - 在 `Variant::Variant()` 设置断点
   - 观察不同类型数据的存储方式

### 阅读清单

| 文件 | 重点 |
|------|------|
| `main/main.cpp` | 启动流程 |
| `core/object/object.h` | 对象模型 |
| `core/object/class_db.h` | 类注册系统 |
| `core/variant/variant.h` | 动态类型 |

---

## 第二阶段：核心深入（2-3周）

### 目标

掌握核心数据结构和资源管理机制，理解内存管理和引用计数。

### 学习内容

#### 1. 容器模板库 - `core/templates/`

**关键容器**：

| 容器 | 特性 | 适用场景 |
|------|------|---------|
| `Vector<T>` | COW 写入时复制 | 通用动态数组 |
| `LocalVector<T>` | 无 COW，更轻量 | 内部临时数组 |
| `HashMap<K,V>` | Robin Hood 哈希 | 键值查找 |
| `List<T>` | 双向链表 | 频繁插入删除 |

**COW 机制示例**：
```cpp
// Vector 的写入时复制
Vector<int> a = {1, 2, 3};
Vector<int> b = a;  // 共享数据，不复制

b.write[0] = 100;   // 此时才触发深拷贝
// a 仍然是 {1, 2, 3}
// b 变为 {100, 2, 3}
```

#### 2. 引用计数 - `core/object/ref_counted.h`

**RefCounted 类**：
```cpp
class RefCounted : public Object {
    SafeRefCount refcount;      // 原子引用计数

public:
    bool reference();           // 增加引用
    bool unreference();         // 减少引用
    int get_reference_count();  // 获取计数
};
```

**Ref<T> 智能指针**：
```cpp
template<typename T>
class Ref {
    T *reference = nullptr;

    // 自动管理引用计数
    void ref(const Ref &p_from);
    void unref();

public:
    ~Ref() { unref(); }  // 析构时自动释放
};
```

#### 3. 资源加载 - `core/io/resource_loader.h`

**加载流程**：
```
ResourceLoader::load(path)
    ↓
识别格式（ResourceFormatLoader）
    ↓
后台线程加载（可选）
    ↓
反序列化
    ↓
缓存到 ResourceCache
    ↓
返回 Ref<Resource>
```

**缓存模式**：
```cpp
enum CacheMode {
    CACHE_MODE_IGNORE,        // 不缓存
    CACHE_MODE_REUSE,         // 重用缓存
    CACHE_MODE_REPLACE,       // 替换缓存
};
```

### 实践任务

1. **创建自定义 Resource**
   ```cpp
   class MyResource : public Resource {
       GDCLASS(MyResource, Resource);

       String data;

   protected:
       static void _bind_methods() {
           ClassDB::bind_method(D_METHOD("get_data"), &MyResource::get_data);
           ClassDB::bind_method(D_METHOD("set_data"), &MyResource::set_data);
           ADD_PROPERTY(PropertyInfo(Variant::STRING, "data"), "set_data", "get_data");
       }
   };
   ```

2. **分析 Vector 的 COW 行为**
   - 在 `CowData<T>::_copy_on_write()` 设置断点
   - 观察何时触发复制

3. **跟踪资源加载**
   - 在 `ResourceLoader::load()` 设置断点
   - 观察加载一个纹理的完整流程

### 阅读清单

| 文件 | 重点 |
|------|------|
| `core/templates/vector.h` | COW 数组 |
| `core/templates/hash_map.h` | 哈希表实现 |
| `core/object/ref_counted.h` | 引用计数 |
| `core/io/resource.h` | 资源基类 |
| `core/io/resource_loader.h` | 资源加载 |

---

## 第三阶段：场景系统（2-3周）

### 目标

理解节点树和场景管理，掌握场景生命周期和主循环机制。

### 学习内容

#### 1. 节点基类 - `scene/main/node.h`

**核心属性**：
```cpp
class Node : public Object {
    Node *parent = nullptr;           // 父节点
    List<Node *> children;            // 子节点列表
    StringName name;                  // 节点名
    bool inside_tree = false;         // 是否在场景树中

    ProcessMode process_mode;         // 处理模式
    bool physics_process;             // 物理处理开关
};
```

**生命周期方法**：
```cpp
virtual void _enter_tree();    // 进入场景树
virtual void _exit_tree();     // 离开场景树
virtual void _ready();         // 就绪（只调用一次）
virtual void _process(double delta);      // 帧更新
virtual void _physics_process(double delta); // 物理更新
```

#### 2. 场景树 - `scene/main/scene_tree.h`

**主循环架构**：
```cpp
class SceneTree : public MainLoop {
    Node *root;                       // 根节点
    double physics_time;              // 物理累积时间
    double physics_delta;             // 物理步长

    void _process(bool p_physics);    // 处理节点树
};
```

**帧循环流程**：
```
SceneTree::iteration()
    │
    ├── 1. 处理输入事件
    │
    ├── 2. 物理步进（固定时间步长）
    │   ├── 累积时间
    │   ├── 调用 _physics_process
    │   └── 物理模拟
    │
    ├── 3. 帧更新（可变时间步长）
    │   └── 调用 _process
    │
    ├── 4. MessageQueue flush
    │   └── 执行延迟调用
    │
    └── 5. 渲染
        └── RenderingServer::draw()
```

#### 3. 视口系统 - `scene/main/viewport.h`

**Viewport 的职责**：
- **渲染目标**：将场景渲染到纹理或屏幕
- **输入路由**：分发鼠标/键盘事件
- **音频监听**：3D 音频的听点位置

**关键代码**：
```cpp
class Viewport : public Node {
    RID viewport_rid;                 // 渲染服务器句柄
    RenderingDevice *rendering_device;

    void _viewport_post_render();     // 渲染后处理
};
```

### 实践任务

1. **实现自定义 2D 节点**
   ```cpp
   class MySprite2D : public Node2D {
       GDCLASS(MySprite2D, Node2D);

       Ref<Texture2D> texture;

       void _draw() override {
           if (texture.is_valid()) {
               draw_texture(texture, Point2());
           }
       }
   };
   ```

2. **分析 _process 和 _physics_process**
   - 在两个方法中打印时间戳
   - 观察物理步长是否固定

3. **跟踪场景加载**
   - 在 `PackedScene::instantiate()` 设置断点
   - 观察节点树的构建过程

### 阅读清单

| 文件 | 重点 |
|------|------|
| `scene/main/node.h` | 节点基类 |
| `scene/main/scene_tree.h` | 场景树和主循环 |
| `scene/main/viewport.h` | 视口系统 |
| `scene/resources/packed_scene.h` | 场景序列化 |
| `scene/2d/node_2d.h` | 2D 变换节点 |

---

## 第四阶段：渲染系统（3-4周）

### 目标

理解渲染管线架构，掌握材质和着色器系统。

### 学习内容

#### 1. 渲染服务器接口 - `servers/rendering/rendering_server.h`

**核心 API**：
```cpp
class RenderingServer : public Object {
    // 网格
    virtual RID mesh_create() = 0;
    virtual void mesh_add_surface(RID p_mesh, ...) = 0;

    // 材质
    virtual RID material_create() = 0;
    virtual void material_set_shader(RID p_material, RID p_shader) = 0;

    // 光照
    virtual RID directional_light_create() = 0;
    virtual RID omni_light_create() = 0;

    // 渲染
    virtual void draw(bool p_swap_buffers) = 0;
};
```

#### 2. 渲染管线架构

**分层结构**：
```
RenderingServer (API 层)
    │
    ├── RenderingDevice (GPU 抽象层)
    │   ├── Vulkan 驱动
    │   ├── Metal 驱动
    │   └── D3D12 驱动
    │
    └── RendererCompositorRD (渲染方法)
        ├── ForwardClustered (桌面)
        └── ForwardMobile (移动端)
```

**Forward Clustered 流程**：
```
1. 场景剔除 (视锥体 + 遮挡)
    ↓
2. 聚类光照 (Clustered Shading)
    ↓
3. 阴影映射
    ↓
4. 不透明物体渲染
    ↓
5. 透明物体渲染
    ↓
6. 后处理 (色调映射, SSAO, 泛光等)
```

#### 3. 着色器系统

**GDShader 示例**：
```glsl
shader_type spatial;

uniform sampler2D albedo_texture;
uniform vec4 color : source_color;

void fragment() {
    ALBEDO = texture(albedo_texture, UV).rgb * color.rgb;
}
```

**编译流程**：
```
ShaderLanguage::parse()     // 解析 GDShader
    ↓
ShaderCompiler::compile()   // 编译为 GLSL/SPIRV
    ↓
RenderingDevice::shader_create() // 创建 GPU 着色器
```

### 实践任务

1. **使用 RenderDoc 分析一帧**
   - 捕获单帧渲染
   - 分析每个渲染通道
   - 查看绑定的纹理和着色器

2. **理解材质系统**
   - 创建一个 ShaderMaterial
   - 跟踪 `material_set_shader()` 调用

3. **分析渲染顺序**
   - 在 `RenderingServer::draw()` 设置断点
   - 观察渲染命令的执行顺序

### 阅读清单

| 文件 | 重点 |
|------|------|
| `servers/rendering/rendering_server.h` | 渲染 API |
| `servers/rendering/rendering_device.h` | GPU 抽象 |
| `servers/rendering/renderer_rd/` | Vulkan 渲染器 |
| `servers/rendering/shader_language.h` | 着色器解析 |
| `scene/3d/mesh_instance_3d.h` | 网格渲染节点 |

---

## 第五阶段：物理与脚本（2-3周）

### 目标

理解物理模拟和脚本系统，掌握碰撞检测和 GDScript 执行机制。

### 学习内容

#### 1. 物理服务器 - `servers/physics_3d/physics_server_3d.h`

**核心概念**：
```cpp
class PhysicsServer3D : public Object {
    // 空间（物理世界）
    virtual RID space_create() = 0;

    // 物体
    virtual RID body_create() = 0;
    virtual void body_add_shape(RID p_body, RID p_shape) = 0;

    // 形状
    virtual RID shape_create(ShapeType p_type) = 0;
};
```

**物理步进**：
```
GodotStep3D::step(space, delta)
    │
    ├── 1. 积分速度和位置
    │
    ├── 2. 宽相位检测 (BVH)
    │   └── 快速筛选潜在碰撞对
    │
    ├── 3. 窄相位检测 (GJK/EPA)
    │   └── 精确碰撞检测和穿透信息
    │
    ├── 4. 约束求解
    │   └── 碰撞响应和关节
    │
    └── 5. 回调通知
        └── 通知场景层碰撞事件
```

#### 2. GDScript 系统

**执行流程**：
```
源代码 (.gd)
    ↓
GDScriptLexer (词法分析)
    ↓
GDScriptParser (语法分析)
    ↓
GDScriptCompiler (编译)
    ↓
字节码 (.gd 字节码)
    ↓
GDScriptVM (执行)
```

**字节码结构**：
```cpp
struct GDScriptByteCode {
    Vector<uint8_t> code;           // 字节码
    Vector<StringName> identifiers; // 标识符表
    Vector<Variant> constants;      // 常量表
    Vector<StringName> functions;   // 函数表
};
```

#### 3. 脚本语言接口 - `core/object/script_language.h`

```cpp
class ScriptLanguage : public Object {
    virtual String get_name() const = 0;

    // 脚本管理
    virtual Ref<Script> create_script() = 0;

    // 执行
    virtual void execute_script(Ref<Script> p_script) = 0;
};
```

### 实践任务

1. **理解碰撞检测**
   - 创建两个碰撞体
   - 在 `GodotCollisionSolver3D::solve_static()` 设置断点
   - 观察碰撞检测过程

2. **分析 GDScript 编译**
   - 在 `GDScriptCompiler::compile()` 设置断点
   - 观察从 AST 到字节码的转换

3. **跟踪脚本调用**
   - 在 `GDScriptInstance::call()` 设置断点
   - 观察脚本方法的执行

### 阅读清单

| 文件 | 重点 |
|------|------|
| `servers/physics_3d/physics_server_3d.h` | 物理 API |
| `modules/godot_physics_3d/godot_step_3d.h` | 物理步进 |
| `modules/gdscript/gdscript_parser.h` | 语法解析 |
| `modules/gdscript/gdscript_compiler.h` | 编译器 |
| `modules/gdscript/gdscript_vm.h` | 虚拟机 |

---

## 第六阶段：编辑器与扩展（2-3周）

### 目标

掌握编辑器扩展开发，理解 GDExtension 机制。

### 学习内容

#### 1. 编辑器架构 - `editor/editor_node.h`

**核心组件**：
```cpp
class EditorNode : public Node {
    EditorInspector *inspector;      // 属性检查器
    FileSystemDock *filesystem_dock; // 文件系统面板
    Node3DEditor *node_3d_editor;    // 3D 编辑器
    ScriptEditor *script_editor;     // 脚本编辑器
};
```

#### 2. 插件系统 - `editor/plugins/editor_plugin.h`

**创建插件**：
```cpp
class MyPlugin : public EditorPlugin {
    GDCLASS(MyPlugin, EditorPlugin);

    void _enter_tree() override {
        // 添加自定义节点
        add_custom_type("MyNode", "Node2D",
            Ref<Script>(), preload("icon.svg"));
    }

    void _exit_tree() override {
        remove_custom_type("MyNode");
    }
};
```

**插件功能**：
- 自定义节点类型
- 自定义属性编辑器
- 自定义停靠面板
- 自定义导入器/导出器

#### 3. GDExtension - `core/extension/`

**扩展结构**：
```
MyExtension/
├── src/
│   ├── my_extension.cpp
│   └── register_types.cpp
├── my_extension.gdextension
└── SCsub
```

**注册扩展**：
```cpp
// register_types.cpp
void initialize_my_extension(ModuleInitializationLevel p_level) {
    if (p_level == MODULE_INITIALIZATION_LEVEL_SCENE) {
        ClassDB::register_class<MyCustomNode>();
    }
}

void uninitialize_my_extension(ModuleInitializationLevel p_level) {
    // 清理
}
```

### 实践任务

1. **开发编辑器插件**
   - 创建一个添加自定义节点的插件
   - 实现自定义属性检查器

2. **创建 GDExtension**
   - 使用 C++ 创建自定义节点
   - 在 GDScript 中使用该节点

### 阅读清单

| 文件 | 重点 |
|------|------|
| `editor/editor_node.h` | 编辑器架构 |
| `editor/plugins/editor_plugin.h` | 插件基类 |
| `core/extension/gdextension.h` | 扩展系统 |
| `editor/editor_inspector.h` | 属性检查器 |

---

## 第七阶段：平台与驱动（2周）

### 目标

理解跨平台实现，掌握平台抽象层和驱动架构。

### 学习内容

#### 1. 平台抽象层 - `core/os/os.h`

**OS 单例**：
```cpp
class OS {
    static OS *singleton;

    // 系统信息
    virtual String get_name() const = 0;
    virtual String get_model_name() const;

    // 文件系统
    virtual String get_data_dir() const = 0;
    virtual String get_resource_dir() const;

    // 显示
    virtual int get_screen_count() const;
    virtual Size2 get_screen_size(int p_screen) const;
};
```

#### 2. 平台实现

每个平台在 `platform/` 目录下提供具体实现：

| 平台 | 目录 | 主要文件 |
|------|------|---------|
| Windows | `platform/windows/` | `os_windows.cpp` |
| Linux | `platform/linuxbsd/` | `os_linuxbsd.cpp` |
| macOS | `platform/macos/` | `os_macos.mm` |
| Android | `platform/android/` | `os_android.cpp` |
| iOS | `platform/ios/` | `os_ios.mm` |
| Web | `platform/web/` | `os_web.cpp` |

#### 3. 驱动层 - `drivers/`

**图形驱动**：

| 驱动 | 目录 | API |
|------|------|-----|
| Vulkan | `drivers/vulkan/` | Vulkan 1.0+ |
| Metal | `drivers/metal/` | Metal 2.0 |
| D3D12 | `drivers/d3d12/` | DirectX 12 |
| GLES3 | `drivers/gles3/` | OpenGL ES 3.0 |

**音频驱动**：

| 驱动 | 平台 |
|------|------|
| WASAPI | Windows |
| PulseAudio | Linux |
| CoreAudio | macOS/iOS |
| ALSA | Linux |

### 实践任务

1. **理解平台抽象**
   - 阅读 `OS::get_singleton()` 的调用
   - 跟踪一个平台特定功能的实现

2. **分析 Vulkan 驱动**
   - 阅读 `RenderingDeviceDriverVulkan` 类
   - 理解命令缓冲区的提交

### 阅读清单

| 文件 | 重点 |
|------|------|
| `core/os/os.h` | 操作系统抽象 |
| `platform/windows/os_windows.h` | Windows 实现 |
| `drivers/vulkan/` | Vulkan 驱动 |

---

## 调试技巧与工具

### GDB 调试配置

```bash
# 启动调试
gdb ./bin/godot.linuxbsd.editor.dev.x86_64

# 常用命令
(gdb) break main                    # 在 main 设置断点
(gdb) break Node::_ready            # 在方法设置断点
(gdb) run --path /path/to/project   # 运行

# 条件断点
(gdb) break node.cpp:500 if node_count > 100

# 打印 Variant
(gdb) p my_variant
(gdb) p my_variant._data._int
```

### LLDB 调试配置

```bash
lldb ./bin/godot.linuxbsd.editor.dev.x86_64

(lldb) breakpoint set -n main
(lldb) run --path /path/to/project
```

### 内存调试

```bash
# Valgrind 内存检查
valgrind --leak-check=full \
         --show-leak-kinds=all \
         --track-origins=yes \
         ./bin/godot.linuxbsd.editor.dev.x86_64

# AddressSanitizer
scons sanitize=address
ASAN_OPTIONS=detect_leaks=1 ./bin/godot.linuxbsd.editor.dev.x86_64
```

### 性能分析

```bash
# perf (Linux)
perf record -g ./bin/godot.linuxbsd.editor.dev.x86_64
perf report

# Tracy (需要编译支持)
scons tracy=yes
```

---

## 代码风格与贡献

### 代码风格

**命名约定**：
```cpp
// 类名：PascalCase
class MyNode : public Node {};

// 方法：snake_case
void my_method();

// 成员变量：下划线前缀
int _my_member;

// 常量：全大写
static const int MAX_COUNT = 100;

// 枚举：PascalCase，值：SNAKE_CASE
enum MyEnum {
    MY_VALUE_FIRST,
    MY_VALUE_SECOND
};
```

**格式化**：
- 缩进：Tab（1 个 Tab = 4 空格）
- 大括号：Allman 风格
- 行宽：无严格限制，但保持合理

### PR 提交流程

1. **Fork 仓库**
   ```bash
   git clone https://github.com/YOUR_USERNAME/godot.git
   ```

2. **创建分支**
   ```bash
   git checkout -b feature/my-feature
   ```

3. **提交更改**
   ```bash
   git add .
   git commit -m "Add my feature"
   ```

4. **推送并创建 PR**
   ```bash
   git push origin feature/my-feature
   ```

### 测试

```bash
# 运行单元测试
./bin/godot.linuxbsd.editor.dev.x86_64 --test

# 运行特定测试
./bin/godot.linuxbsd.editor.dev.x86_64 --test test_math
```

---

## 学习资源汇总

### 官方文档

| 资源 | 链接 |
|------|------|
| 官方文档 | https://docs.godotengine.org/ |
| API 参考 | https://docs.godotengine.org/en/stable/classes/ |
| 贡献指南 | https://docs.godotengine.org/en/stable/contributing/ |
| 源码浏览 | https://github.com/godotengine/godot |

### 社区资源

| 资源 | 链接 |
|------|------|
| 官方论坛 | https://godotforums.org/ |
| Reddit | https://reddit.com/r/godot |
| Discord | https://discord.gg/godotengine |
| Q&A | https://godotengine.org/qa/ |

### 推荐阅读

1. **引擎架构**
   - 《Game Engine Architecture》- Jason Gregory
   - Godot 官方架构文档

2. **渲染系统**
   - 《Real-Time Rendering》- Akenine-Möller
   - Vulkan Tutorial: https://vulkan-tutorial.com/

3. **物理系统**
   - 《Game Physics Engine Development》- Ian Millington
   - GJK/EPA 算法论文

4. **脚本系统**
   - 《Crafting Interpreters》- Robert Nystrom
   - 《Engineering a Compiler》- Cooper & Torczon

---

## 学习建议

1. **循序渐进**：不要跳过基础阶段，每个阶段都是后续学习的基础

2. **动手实践**：阅读源码的同时，尝试修改和扩展功能

3. **使用调试器**：断点和单步执行是理解代码流程的最好方式

4. **做笔记**：记录关键类和函数的位置，方便后续查阅

5. **参与社区**：在论坛和 Discord 中提问和讨论

6. **贡献代码**：从修复小 bug 开始，逐步参与引擎开发
