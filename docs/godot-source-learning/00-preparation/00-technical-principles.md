# 技术原理：游戏引擎架构基础

> 在阅读 Godot 引擎源码之前，理解以下核心技术原理将帮助你更高效地理解引擎的设计动机和实现选择。Godot 是一个用 C++ 编写的全功能游戏引擎，其架构在很多方面与传统商业引擎（如 Unreal）有显著不同——尤其是它独特的 Server 模式和统一的跨平台设计。

---

## 目录

- [1. 游戏引擎的本质](#1-游戏引擎的本质)
- [2. 游戏循环（Game Loop）](#2-游戏循环game-loop)
- [3. Server 架构模式](#3-server-架构模式)
- [4. 跨平台引擎的挑战](#4-跨平台引擎的挑战)
- [5. C++ 与游戏引擎](#5-c-与游戏引擎)
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

用一个公式来表达：

```
游戏引擎 = 计算框架 + 渲染管线 + 交互系统
```

### 引擎的三大核心职责

| 职责 | 说明 | Godot 对应模块 | 源码位置 |
|------|------|----------------|----------|
| **计算** | 游戏逻辑、物理模拟、动画插值、脚本执行 | SceneTree, PhysicsServer3D, AnimationMixer, GDScript | `scene/`, `servers/`, `modules/gdscript/` |
| **渲染** | 将 3D/2D 场景数据绘制到屏幕 | RenderingServer, RenderingDevice | `servers/rendering/`, `drivers/` |
| **交互** | 接收用户输入，反馈结果 | Input, InputMap, DisplayServer | `core/input/`, `platform/` |

### 引擎与框架的关系

- **框架**（Framework）：调用你的代码（控制反转，IoC）
- **引擎**（Engine）：你调用它的代码（你控制流程）
- **Godot** 两者兼有：引擎提供底层 Server 能力，框架（场景树 + 节点生命周期）提供开发范式

> 源码中 `main/main.cpp` 是引擎入口（你启动它），`scene/main/scene_tree.cpp` 是框架核心（它驱动你的场景节点执行 `_process`、`_physics_process` 等生命周期回调）

---

## 2. 游戏循环（Game Loop）

### 为什么需要游戏循环

游戏与普通应用的根本区别：**游戏是实时持续的**。普通应用是事件驱动的（用户点击 -> 响应），游戏需要每秒 60 次或更多地更新和绘制画面。

游戏循环是引擎的心脏——所有的一切都发生在这个循环之内。

### 游戏循环的基本结构

```
while (gameIsRunning) {
    processInput();    // 1. 处理输入
    update(dt);        // 2. 更新游戏状态（逻辑、物理、动画）
    render();          // 3. 渲染画面
}
```

这个看似简单的三步循环，在真正的引擎中被分解为数十个精细的阶段。

### Godot 的游戏循环实现

Godot 的游戏循环是理解引擎运作的关键入口。整个流程从 `main/main.cpp` 开始：

```
程序入口 main()
    │
    ▼
Main::setup()              ← 初始化核心系统：OS、Memory、Input
    │                         注册核心类型（ClassDB）
    │                         加载驱动（RenderingDevice、AudioDriver）
    │
    ▼
Main::setup2()             ← 初始化高级系统
    │                         初始化 RenderingServer
    │                         初始化 PhysicsServer
    │                         初始化 AudioServer
    │                         加载初始场景（SceneTree）
    │
    ▼
Main::start()              ← 启动脚本引擎
    │                         加载 GDScript/Mono 模块
    │                         加载 Autoload 脚本
    │
    ▼
╔══════════════════════════════════════════════════════╗
║  while (true) {                                      ║
║      Main::iteration()    ← 每帧执行一次             ║
║          │                                           ║
║          ├── 处理平台事件（DisplayServer）            ║
║          ├── PhysicsServer3D::step()                 ║
║          │      └── 固定时间步物理模拟               ║
║          ├── SceneTree::physics_process()            ║
║          │      └── 调用节点 _physics_process()      ║
║          ├── SceneTree::process()                    ║
║          │      └── 调用节点 _process()              ║
║          ├── RenderingServer::draw()                 ║
║          │      └── 执行渲染管线                     ║
║          └── DisplayServer::swap_buffers()           ║
║  }                                                   ║
╚══════════════════════════════════════════════════════╝
```

### 源码对照：Main::iteration()

在 `main/main.cpp` 中，`Main::iteration()` 是每帧的核心函数。以下是简化后的关键逻辑：

```cpp
// main/main.cpp - Main::iteration() 简化版
bool Main::iteration() {
    // 1. 计算帧间隔时间
    uint64_t frame_ticks = OS::get_singleton()->get_ticks_usec();
    double step = (frame_ticks - last_ticks) / 1000000.0;
    last_ticks = frame_ticks;

    // 2. 处理平台事件（窗口事件、输入事件）
    DisplayServer::get_singleton()->process_events();

    // 3. 物理引擎步进（固定时间步）
    //    如果帧率下降，会执行多次物理步进追赶
    PhysicsServer3D::get_singleton()->step(fixed_fps);
    PhysicsServer2D::get_singleton()->step(fixed_fps);

    // 4. 场景树更新
    scene_tree->physics_process(physics_delta);  // 物理帧回调
    scene_tree->process(delta);                   // 逻辑帧回调

    // 5. 渲染
    RenderingServer::get_singleton()->draw();

    return true;  // 返回 false 则退出循环
}
```

### 固定时间步 vs 可变时间步

Godot 采用**混合时间步**策略，这是游戏引擎中最常见的做法：

| 策略 | 优点 | 缺点 | Godot 的使用方式 |
|------|------|------|-----------------|
| **固定时间步** (Fixed) | 物理模拟稳定、确定性可重现 | 帧率不匹配时可能卡顿或跳帧 | 物理引擎 (`_physics_process`)，默认 60 Hz |
| **可变时间步** (Variable) | 灵活、画面流畅 | 物理模拟不稳定 | 渲染和逻辑 (`_process`)，跟随实际帧率 |

```
时间轴示例（物理步=1/60s）：

实际帧：    |----0.20s----|----0.15s----|----0.18s----|
物理步：    |--1/60--|--1/60--|--1/60--|--1/60--|--1/60--|
_process：     ▲             ▲             ▲
_physics：  ▲     ▲     ▲      ▲     ▲     ▲

物理引擎以固定频率步进，渲染引擎以实际帧率绘制。
当一帧耗时过长（>1/30s），物理引擎会执行多次步进以追赶。
```

> 源码中 `_physics_process` 和 `_process` 的区别在 `scene/main/scene_tree.cpp` 的 `_process()` 方法中体现：`physics_process` 根据累计时间差判断是否需要执行，而 `process` 每帧都执行。

---

## 3. Server 架构模式

### 这是理解 Godot 架构的关键

**Server 模式是 Godot 架构中最独特、最重要的设计决策。** 如果你只记住本节的一个内容，就记住这一点：Godot 的所有底层系统都通过 Server 类暴露功能。

### 什么是 Server 模式

Server 模式的核心思想是：**将高层 API（场景节点）与低层实现（渲染、物理、音频等）完全分离**。每一类底层服务都有一个对应的 Server 类作为中介：

```
┌─────────────────────────────────────────────────────────────┐
│                      用户脚本层                              │
│              GDScript / C# / C++ 脚本                       │
├─────────────────────────────────────────────────────────────┤
│                      场景节点层                              │
│    Node3D, RigidBody3D, Sprite2D, AudioStreamPlayer, ...    │
│                  （面向用户的高级 API）                       │
├─────────────────────────────────────────────────────────────┤
│                    ★ Server 层 ★                            │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │RenderingServer│ │PhysicsServer3D│ │  AudioServer │        │
│  │  渲染服务     │ │  3D物理服务   │ │  音频服务    │        │
│  ├──────────────┤ ├──────────────┤ ├──────────────┤        │
│  │PhysicsServer2D│ │NavigationServer│ │DisplayServer│        │
│  │  2D物理服务   │ │  导航服务     │ │  显示服务    │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
│              （统一的低层 API，使用 RID 标识资源）             │
├─────────────────────────────────────────────────────────────┤
│                      驱动/后端层                             │
│  Vulkan / Metal / D3D12 / GLES3 / Dummy                    │
│  GodotPhysics / GodotPhysics2D / 第三方物理引擎              │
│  WASAPI / PulseAudio / CoreAudio / ALSA                    │
└─────────────────────────────────────────────────────────────┘
```

### 为什么采用 Server 模式

| 设计目标 | 不用 Server | 使用 Server |
|----------|-------------|-------------|
| **解耦** | 节点直接调用 GPU API，紧耦合 | 节点通过 Server 间接调用，松耦合 |
| **可测试性** | 需要 GPU 才能测试节点逻辑 | 可以用 Dummy Server 替换，无需 GPU |
| **安全性** | 脚本可直接操作 GPU 资源 | 脚本只能操作 Server 提供的接口 |
| **多场景** | 每个场景都要管理自己的 GPU 资源 | Server 统一管理所有 RID 资源 |
| **性能** | 大量小对象导致 CPU-GPU 通信频繁 | Server 可以批量处理，减少状态切换 |
| **Headless 模式** | 不可能 | 用 Dummy Server 即可运行游戏逻辑 |

### Server 模式在源码中的体现

以 RenderingServer 为例，展示三层架构的关系：

```
用户使用 Sprite2D（场景节点）
        │
        ▼
scene/2d/sprite_2d.cpp
    // Sprite2D 在内部调用 RenderingServer
    RenderingServer::get_singleton()->canvas_item_add_texture_rect(...)
        │
        ▼
servers/rendering/rendering_server.cpp
    // RenderingServer 将请求转发给 RenderingServerDefault（实现类）
    RENDERING_METHOD(canvas_item_add_texture_rect, ...)
        │
        ▼
servers/rendering/renderer_canvas_cull.cpp
    // 实际执行渲染命令，操作 GPU 资源
    // 使用 RID (Resource ID) 标识所有资源
        │
        ▼
drivers/vulkan/  或  drivers/gles3/
    // 最终调用平台相关的图形 API
```

### RID：Server 模式的核心标识

RID（Resource ID）是 Server 模式的灵魂。所有通过 Server 创建和管理的资源都使用 RID 作为标识符：

```cpp
// core/rid.h - RID 的定义
class RID {
    uint32_t id = 0xFFFFFFFF;  // 内部就是一个整数 ID
public:
    bool is_valid() const { return id != 0xFFFFFFFF; }
    bool is_null() const { return id == 0xFFFFFFFF; }
};

// 使用示例：通过 RenderingServer 创建纹理
RID texture_rid = RenderingServer::get_singleton()->texture_2d_create(image);

// 后续所有操作都通过 RID 引用这个纹理
RenderingServer::get_singleton()->texture_replace(texture_rid, new_image);

// 不再需要时释放
RenderingServer::get_singleton()->free(texture_rid);
```

> RID 本质上是一个**句柄（Handle）**，类似于文件描述符。场景节点（如 Sprite2D）内部持有 RID，通过 RID 与 Server 通信，而不是直接操作 GPU 资源。这种设计使得 Server 可以自由地管理底层资源的生命周期。

### Godot 的所有 Server 类

| Server 类 | 职责 | 源码位置 | 单例获取方式 |
|-----------|------|----------|-------------|
| `RenderingServer` | 2D/3D 渲染、材质、着色器、光照 | `servers/rendering/` | `RenderingServer::get_singleton()` |
| `PhysicsServer3D` | 3D 物理模拟、碰撞检测 | `servers/physics_3d/` | `PhysicsServer3D::get_singleton()` |
| `PhysicsServer2D` | 2D 物理模拟、碰撞检测 | `servers/physics_2d/` | `PhysicsServer2D::get_singleton()` |
| `AudioServer` | 音频混音、效果处理 | `servers/audio_server.cpp` | `AudioServer::get_singleton()` |
| `NavigationServer3D` | 3D 寻路、导航网格 | `servers/navigation_server_3d.cpp` | `NavigationServer3D::get_singleton()` |
| `NavigationServer2D` | 2D 寻路 | `servers/navigation_server_2d.cpp` | `NavigationServer2D::get_singleton()` |
| `DisplayServer` | 窗口管理、输入、剪贴板 | `servers/display_server.cpp` | `DisplayServer::get_singleton()` |
| `CameraServer` | 摄像头访问 | `servers/camera_server.cpp` | `CameraServer::get_singleton()` |
| `TextServerManager` | 文字排版与渲染 | `servers/text/` | 通过 `TSMan` 宏访问 |

### Server 模式的线程安全

Godot 的 Server 设计还考虑了**多线程渲染**的场景：

```
主线程                          渲染线程（可选）
  │                                │
  ├── RenderingServer::draw()      │
  │      │                         │
  │      ├── 将命令放入队列 ────────►│
  │      │                         ├── 从队列取出命令
  │      │                         ├── 执行 Vulkan/GLES 调用
  │      │                         │
  │      └── 返回（不等渲染完成）    │
  │                                │
  ├── 继续下一帧逻辑                ├── 继续处理剩余命令
```

> 源码中 `RENDERING_METHOD` 宏就是用来处理这种线程间通信的——在单线程模式下直接调用，在多线程模式下通过命令队列转发。

---

## 4. 跨平台引擎的挑战

### Godot 支持的平台

Godot 是目前跨平台支持最广泛的开源游戏引擎之一：

```
                       ┌─────────────────────────────────┐
                       │        Godot 统一 API 层         │
                       └───────────────┬─────────────────┘
                                       │
          ┌────────────┬───────────────┼───────────────┬────────────┐
          │            │               │               │            │
   ┌──────▼──────┐ ┌───▼────┐ ┌───────▼───────┐ ┌────▼────┐ ┌─────▼─────┐
   │   桌面平台   │ │移动平台 │ │  Web 平台     │ │主机平台  │ │ 嵌入式    │
   │             │ │        │ │               │ │         │ │           │
   │ Windows     │ │ Android│ │ HTML5/WASM    │ │ (需端口) │ │ Raspberry │
   │ Linux/BSD   │ │ iOS    │ │               │ │         │ │ Pi 等     │
   │ macOS       │ │        │ │               │ │         │ │           │
   └─────────────┘ └────────┘ └───────────────┘ └─────────┘ └───────────┘
```

### 跨平台需要解决的四个问题

#### 问题 1：图形 API 差异

不同平台使用完全不同的图形 API，Godot 通过 `RenderingDevice` 层进行抽象：

| API | 平台 | 代际 | Godot 支持情况 |
|-----|------|------|---------------|
| **Vulkan** | Windows/Linux/Android | 现代 API | 主要后端（4.x 默认） |
| **Metal** | macOS/iOS | 现代 API | 通过 MoltenVK 或原生 |
| **D3D12** | Windows | 现代 API | 实验性支持 |
| **OpenGL ES 3.0** | Android/iOS/Web | 传统 API | 兼容后端 |
| **OpenGL 3.3** | Windows/Linux | 传统 API | 兼容后端 |
| **WebGPU** | Web | 下一代 | 实验性支持 |

```
RenderingDevice 抽象层架构：

┌──────────────────────────────────────────┐
│        RenderingServer（高层渲染 API）     │
├──────────────────────────────────────────┤
│          RenderingDevice（GPU 抽象）      │
│   ┌──────────────────────────────────┐   │
│   │  统一接口：                      │   │
│   │  - texture_create()              │   │
│   │  - shader_create()               │   │
│   │  - uniform_set_create()          │   │
│   │  - draw_list_begin()             │   │
│   └──────────────────────────────────┘   │
├──────────┬───────────┬───────────────────┤
│  Vulkan  │   Metal   │  GLES3 / D3D12    │
│  Driver  │  Driver   │    Driver         │
└──────────┴───────────┴───────────────────┘
```

> 源码位置：`drivers/vulkan/` 实现 Vulkan 后端，`drivers/gles3/` 实现 OpenGL ES 3.0 后端。`servers/rendering/rendering_device.cpp` 是统一的抽象接口。

#### 问题 2：系统 API 差异

窗口管理、输入、文件系统等系统 API 在不同平台完全不同。Godot 使用 `DisplayServer` 和 `OS` 两个抽象层解决：

```
platform/
├── linuxbsd/          ← Linux/BSD 实现
│   ├── os_linuxbsd.cpp
│   └── display_server_x11.cpp  /  display_server_wayland.cpp
├── windows/           ← Windows 实现
│   ├── os_windows.cpp
│   └── display_server_windows.cpp
├── macos/             ← macOS 实现
│   ├── os_macos.cpp
│   └── display_server_macos.mm  (Objective-C++)
├── android/           ← Android 实现
│   ├── os_android.cpp
│   └── java/          ← JNI 桥接
├── ios/               ← iOS 实现
│   ├── os_ios.cpp
│   └── javascript/    ← JavaScript 桥接
└── web/               ← Web (Emscripten) 实现
    ├── os_web.cpp
    └── javascript/    ← JS 桥接
```

#### 问题 3：文件系统差异

不同平台的文件系统差异巨大（路径分隔符、权限、大小写敏感性）。Godot 通过统一的 `DirAccess` 和 `FileAccess` 抽象解决：

```cpp
// core/io/dir_access.h - 目录访问抽象
class DirAccess {
    virtual Error open(const String &p_path) = 0;
    virtual Error make_dir(const String &p_path) = 0;
    virtual bool file_exists(const String &p_path) = 0;
    // ... 统一接口
};

// 各平台实现：
// core/io/dir_access_unix.cpp  - Unix/Linux/macOS
// platform/windows/dir_access_windows.cpp - Windows
```

#### 问题 4：编译工具链差异

| 平台 | 编译器 | 构建系统 | 交叉编译支持 |
|------|--------|----------|-------------|
| Linux | GCC / Clang | SCons | 无需 |
| Windows | MSVC / MinGW | SCons | 无需 |
| macOS | Clang (Xcode) | SCons | 需 Xcode |
| Android | NDK (Clang) | SCons + Gradle | 从 Linux/macOS/Windows |
| iOS | Clang (Xcode) | SCons | 从 macOS |
| Web | Emscripten | SCons | 从任意平台 |

---

## 5. C++ 与游戏引擎

### 为什么 Godot 选择 C++

| 特性 | 对引擎的价值 | Godot 中的体现 |
|------|-------------|---------------|
| **零成本抽象** | 高性能的抽象层 | RenderingDevice 抽象多个图形 API 无运行时开销 |
| **RAII** | 自动资源管理 | `RID_Data` 的引用计数自动释放 GPU 资源 |
| **模板** | 通用容器和算法 | `LocalVector<T>`、`HashMap<K,V>` 自定义高效容器 |
| **继承与多态** | 灵活的对象模型 | `Object` -> `Node` -> `Node3D` 深层继承体系 |
| **手动内存管理** | 精确控制性能 | `memnew`/`memdelete` 宏封装分配器 |
| **编译到原生码** | 最大化性能 | 直接运行在 CPU 上，无 VM 开销 |

### Godot 的 C++ 编码风格与惯用法

#### memnew / memdelete — Godot 的内存管理

Godot 不使用标准 `new`/`delete`，而是使用自定义的内存管理宏：

```cpp
// core/typedefs.h 中定义
#define memnew(m_class)            new ("") m_class
#define memdelete(m_obj)           delete m_obj
#define memnew_arr(m_class, m_count) new ("") m_class[m_count]

// 使用示例
Node *child = memnew(Node);       // 创建对象
memdelete(child);                  // 销毁对象
```

> 这些宏不是简单的 `new`/`delete` 别名。它们集成了 Godot 的内存统计系统——在 Debug 模式下会追踪所有分配，用于检测内存泄漏。源码位于 `core/os/memory.cpp`。

#### GDCLASS / GDVIRTUAL — Godot 的类型系统宏

Godot 通过宏系统实现了一个强大的反射和绑定系统：

```cpp
// core/object/object.h 中的宏定义（简化）

// GDCLASS：声明一个可被脚本和编辑器识别的 C++ 类
class Sprite2D : public Node2D {
    GDCLASS(Sprite2D, Node2D);   // 注册类名和父类
                                  // 自动生成：类信息、属性绑定、虚函数表

    // GDVIRTUAL：声明一个可被 GDScript 重写的虚函数
    GDVIRTUAL1(_process, double);  // 参数为 double，无返回值

protected:
    // _bind_methods：注册属性和方法供脚本和编辑器使用
    static void _bind_methods() {
        ClassDB::bind_method(D_METHOD("set_texture", "texture"),
                             &Sprite2D::set_texture);
        ClassDB::add_property("Sprite2D",
            PropertyInfo(Variant::OBJECT, "texture"),
            "set_texture", "get_texture");
    }
};
```

这些宏在编译时生成大量胶水代码：

```
GDCLASS(MyClass, ParentClass) 展开后大致生成：

static void *_godot_class_init_func = nullptr;
virtual String get_class() const override { return "MyClass"; }
virtual void* get_class_ptr() const override { ... }
static void register_class() { ClassDB::register_class<MyClass>(); }
// ... 以及更多绑定代码
```

> 源码中这些宏的定义位于 `core/object/class_db.h` 和 `core/variant/variant.h`。理解这些宏是阅读 Godot 源码的基础。

#### 智能指针 — 谨慎使用

与直觉相反，Godot **不大量使用智能指针**。Godot 的对象生命周期管理主要依赖两种方式：

| 方式 | 使用场景 | 示例 |
|------|----------|------|
| **手动管理** (`memnew`/`memdelete`) | 引擎内部对象 | Server 内部的资源对象 |
| **引用计数** (`RefCounted`) | 需要共享所有权的对象 | `Resource`、`Image`、`Array` 等 |
| **树形结构** (父节点管理子节点) | 场景节点 | `Node::add_child()` / `Node::queue_free()` |

```cpp
// Ref<T> 是 Godot 的引用计数智能指针
// core/object/ref_ptr.h
Ref<Image> image = Image::create(256, 256, false, Image::FORMAT_RGBA8);
// 引用计数自动 +1
// 当所有 Ref<Image> 离开作用域时，自动销毁

// Ref<T> 可隐式转换为 bool
if (image.is_valid()) {
    image->set_pixel(0, 0, Color(1, 0, 0));
}
```

---

## 6. 数据驱动设计

### 什么是数据驱动

数据驱动的核心思想：**将游戏内容（数据）与游戏逻辑（代码）分离**。

```
传统方式（硬编码）：
    代码中写死 "角色的速度是 100"

数据驱动：
    .tres 文件中定义 speed = 100
    代码读取数据并使用
```

### Godot 中的数据驱动体现

| 系统 | 数据格式 | 代码类 | 说明 |
|------|----------|--------|------|
| 场景 | `.tscn` 文件 | `PackedScene` | 场景树 + 节点属性序列化 |
| 资源 | `.tres` 文件 | `Resource` | 材质、纹理参数、动画等 |
| 项目配置 | `project.godot` | `ProjectSettings` | 项目级设置 |
| 输入映射 | `project.godot` 中的 [input] | `InputMap` | 键盘/手柄映射 |
| 图层 | `.tscn` / `.tres` | `TileSet` / `TileMap` | 瓦片地图数据 |

### .tscn 文件格式解析

`.tscn` 是 Godot 场景文件的文本格式，非常适合理解数据驱动：

```
[gd_scene load_steps=3 format=3 uid="uid://bym23xqvgrgjn"]

[ext_resource type="Script" path="res://player.gd" id="1"]
[ext_resource type="Texture2D" path="res://icon.svg" id="2"]

[node name="Player" type="CharacterBody3D"]
transform = Transform3D(1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 5, 0)
script = ExtResource("1")

[node name="Mesh" type="MeshInstance3D" parent="."]
mesh = BoxMesh3D.new()    ; 内联资源

[node name="Camera3D" type="Camera3D" parent="."]
current = true
```

解析这个文件结构：

```
[gd_scene ...]          ← 场景元信息（格式版本、UID、加载步骤数）
[ext_resource ...]      ← 外部资源引用（脚本、图片等）
[sub_resource ...]      ← 内联子资源（材质、网格等）
[node ...]              ← 场景节点树（类型、属性、父子关系）
```

> 源码中 `.tscn` 文件的解析位于 `scene/resources/scene_format_text.cpp`。这种文本格式非常方便版本控制（git diff 友好），同时也支持二进制格式 `.scn` 用于生产环境。

### .tres 文件格式解析

`.tres` 是 Godot 资源文件的文本格式：

```
[gd_resource type="StandardMaterial3D" format=3 uid="uid://d123"]

[resource]
albedo_color = Color(0.8, 0.2, 0.1, 1)
metallic = 0.5
roughness = 0.3
texture_albedo = ExtResource("1")
```

### 序列化与反序列化流程

```
编辑器中操作场景
    │
    ▼ 序列化
保存为 .tscn 文件（文本格式，可读可 diff）
    │                          或 .scn 文件（二进制格式，体积小加载快）
    ▼ 反序列化
运行时加载并还原为场景对象树
    │
    ▼
PackedScene::instantiate() 创建节点实例
```

> Godot 的所有资源都继承自 `Resource` 类（`core/io/resource.h`），而 `Resource` 继承自 `RefCounted`，因此所有资源都是引用计数的——多个节点可以共享同一个材质、纹理等。

---

## 7. 引擎分层架构

### Godot 的分层结构

```
┌─────────────────────────────────────────────────────────────┐
│                     编辑器/工具层                             │
│        编辑器界面 · 场景编辑器 · 调试器 · 导出工具             │
│                     editor/                                  │
├─────────────────────────────────────────────────────────────┤
│                     脚本语言层                                │
│          GDScript · C#(Mono) · GDExtension(C/C++)            │
│              modules/gdscript/ · modules/mono/               │
├─────────────────────────────────────────────────────────────┤
│                     场景系统层                                │
│          SceneTree · Node · Node3D · Node2D · 组件           │
│          动画 · UI · 2D/3D 节点 · 物理节点                    │
│                       scene/                                 │
├─────────────────────────────────────────────────────────────┤
│                    ★ Server 层 ★                             │
│  RenderingServer · PhysicsServer3D · AudioServer             │
│  NavigationServer3D · DisplayServer · TextServer             │
│                       servers/                               │
├─────────────────────────────────────────────────────────────┤
│                     核心基础层                                │
│  Object 系统 · Variant · 数学库 · IO · 字符串 · 模板容器      │
│  ClassDB(反射) · MessageQueue · Rid · 信号                   │
│                        core/                                 │
├─────────────────────────────────────────────────────────────┤
│                    驱动/平台层                                │
│  Vulkan · Metal · GLES3 · D3D12  |  Linux · Windows · macOS  │
│  WASAPI · PulseAudio · CoreAudio |  Android · iOS · Web      │
│                drivers/    |    platform/                     │
├─────────────────────────────────────────────────────────────┤
│                     第三方库                                  │
│  assimp · bullet · zlib · mbedtls · miniupnpc · ...          │
│                 thirdparty/                                  │
└─────────────────────────────────────────────────────────────┘
```

### 各层的职责与依赖关系

```
    依赖方向：上层可以依赖下层，下层不能依赖上层
    ──────────────────────────────────────────────

    编辑器层 ─────► 脚本层 ─────► 场景层 ─────► Server层 ─────► 核心层
                                              │
                                              └──────► 驱动层
```

| 分层 | 职责 | 核心源码目录 | 关键类 |
|------|------|-------------|--------|
| **核心基础层** | 数学、字符串、IO、对象系统、类型系统 | `core/` | `Object`, `Variant`, `String`, `Vector3` |
| **Server 层** | 渲染、物理、音频、导航的统一抽象 | `servers/` | `RenderingServer`, `PhysicsServer3D` |
| **驱动/平台层** | 操作系统和硬件的具体实现 | `platform/`, `drivers/` | `OS`, `DisplayServer`, Vulkan 驱动 |
| **场景系统层** | 节点树、组件、场景管理、2D/3D 节点 | `scene/` | `Node`, `SceneTree`, `Node3D` |
| **脚本语言层** | GDScript、C#、GDExtension | `modules/` | `GDScript`, `CSharpLanguage` |
| **编辑器层** | 编辑器 UI、插件系统、导出 | `editor/` | `EditorNode`, `EditorPlugin` |

### 分层的好处

1. **关注点分离**：每层只关心自己的职责，修改渲染后端不影响场景逻辑
2. **可替换性**：可以替换物理引擎后端（GodotPhysics -> 第三方），对上层无影响
3. **可测试性**：核心层可以独立于渲染、平台进行单元测试
4. **Headless 运行**：使用 Dummy Server 替换 RenderingServer，即可在没有 GPU 的服务器上运行游戏逻辑（用于 CI/CD 测试）
5. **学习路径**：从底层到上层，逐步理解每一层的职责

### 与源码目录的精确映射

```
godot/
├── core/                    ← 核心基础层
│   ├── object/              ← Object 系统（反射、信号、属性）
│   ├── variant/             ← Variant 动态类型系统
│   ├── math/                ← 数学库（Vector2/3/4, Matrix, AABB）
│   ├── templates/           ← 模板容器（LocalVector, HashMap, List）
│   ├── io/                  ← IO 系统（文件、网络、资源加载）
│   ├── os/                  ← 操作系统抽象（内存、时间、线程）
│   ├── string/              ← 字符串处理（ustring, node_path）
│   ├── crypto/              ← 加密（SHA256, AES）
│   └── input/               ← 输入系统核心
│
├── servers/                 ← Server 层
│   ├── rendering/           ← RenderingServer（最大最复杂的 Server）
│   ├── physics_3d/          ← PhysicsServer3D
│   ├── physics_2d/          ← PhysicsServer2D
│   ├── audio/               ← AudioServer
│   ├── navigation/          ← NavigationServer
│   ├── text/                ← TextServer（文字排版）
│   ├── camera/              ← CameraServer
│   └── display_server.cpp   ← DisplayServer
│
├── scene/                   ← 场景系统层
│   ├── main/                ← SceneTree, Node 基类
│   ├── 2d/                  ← 2D 节点
│   ├── 3d/                  ← 3D 节点
│   ├── animation/           ← 动画系统
│   ├── audio/               ← 音频节点
│   ├── gui/                 ← UI 控件
│   ├── physics/             ← 物理节点
│   └── resources/           ← 场景资源（PackedScene 等）
│
├── modules/                 ← 脚本语言和功能模块
│   ├── gdscript/            ← GDScript 语言实现
│   ├── mono/                ← C# 语言支持
│   ├── jsonrpc/             ← Language Server Protocol
│   └── ...                  ← 其他可选模块
│
├── platform/                ← 平台层
│   ├── linuxbsd/            ← Linux/BSD
│   ├── windows/             ← Windows
│   ├── macos/               ← macOS
│   ├── android/             ← Android
│   ├── ios/                 ← iOS
│   └── web/                 ← Web (Emscripten)
│
├── drivers/                 ← 驱动层
│   ├── vulkan/              ← Vulkan 渲染后端
│   ├── gles3/               ← OpenGL ES 3.0 渲染后端
│   ├── metal/               ← Metal 渲染后端（如果存在）
│   ├── alsa/                ← ALSA 音频后端
│   ├── pulseaudio/          ← PulseAudio 音频后端
│   ├── coreaudio/           ← CoreAudio 音频后端
│   └── wasapi/              ← WASAPI 音频后端
│
├── editor/                  ← 编辑器层
│   ├── editor_node.cpp      ← 编辑器主节点
│   ├── editor_plugin.cpp    ← 插件系统
│   └── ...
│
├── main/                    ← 引擎入口
│   └── main.cpp             ← main() 函数、Main 类
│
└── thirdparty/              ← 第三方库
    ├── zlib/                ← 压缩
    ├── mbedtls/             ← TLS/SSL
    ├── assimp/              ← 模型导入
    └── ...
```

### 对比：Godot vs Cocos Creator 的架构差异

| 维度 | Godot | Cocos Creator |
|------|-------|---------------|
| **核心语言** | C++ | TypeScript + C++（JSB 桥接） |
| **架构模式** | Server 模式（集中式服务） | 模块化（扁平化模块） |
| **资源标识** | RID（整数 ID） | JS 对象引用 |
| **反射系统** | ClassDB（编译时宏生成） | 装饰器元数据 |
| **脚本语言** | GDScript（自研） | TypeScript（标准） |
| **构建系统** | SCons（Python） | npm + webpack |
| **渲染抽象** | RenderingDevice | GFX 层 |
| **场景格式** | .tscn（文本/二进制） | .scene（JSON） |

---

## 延伸阅读

- [Game Engine Architecture (Jason Gregory)](https://www.gameenginebook.com/) -- 游戏引擎架构经典教材
- [Game Programming Patterns (Robert Nystrom)](https://gameprogrammingpatterns.com/) -- 游戏编程设计模式（免费在线阅读）
- [Godot 官方文档 - 引擎架构](https://docs.godotengine.org/en/stable/contributing/development/core_and_modules.html)
- [Godot 源码贡献指南](https://docs.godotengine.org/en/stable/contributing/development/) -- 包含编码规范和架构说明

---

> 了解了这些基础原理后，接下来阅读 [01-环境配置](./01-environment-setup.md) 搭建源码阅读环境。
