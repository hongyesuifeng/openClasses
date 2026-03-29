# Godot 引擎架构总览

## 目录

- [1. 引擎概述](#1-引擎概述)
- [2. 顶层目录结构](#2-顶层目录结构)
- [3. 核心架构分层](#3-核心架构分层)
- [4. 核心模块详解](#4-核心模块详解)
  - [4.1 对象系统](#41-对象系统-coreobject)
  - [4.2 Variant 类型系统](#42-variant-类型系统-corevariant)
  - [4.3 容器模板](#43-容器模板-coretemplates)
  - [4.4 数学库](#44-数学库-coremath)
  - [4.5 字符串系统](#45-字符串系统-corestring)
  - [4.6 I/O 系统](#46-io-系统-coreio)
  - [4.7 操作系统抽象](#47-操作系统抽象-coreos)
- [5. 服务器架构](#5-服务器架构)
  - [5.1 渲染管线](#51-渲染管线-serversrendering)
  - [5.2 物理服务器](#52-物理服务器)
  - [5.3 音频服务器](#53-音频服务器-serversaudio)
  - [5.4 其他服务器](#54-其他服务器)
- [6. 场景系统](#6-场景系统)
- [7. 模块系统](#7-模块系统)
- [8. 扩展系统](#8-扩展系统-coreextension)
- [9. 引擎启动流程](#9-引擎启动流程)
- [10. 构建系统](#10-构建系统)
- [11. 关键设计模式总结](#11-关键设计模式总结)

---

## 1. 引擎概述

Godot 是一款 MIT 开源许可的跨平台 2D/3D 游戏引擎，以 C++ 编写核心，支持通过 GDScript、C#、GDExtension 等多种方式进行脚本开发。引擎在架构上坚持几项核心设计原则：

- **服务器-场景分离**：渲染、物理、音频等后端逻辑封装在独立的 Server 单例中，场景层的 Node 只持有不透明的 RID 句柄与之交互，前后端彻底解耦
- **RID 资源管理**：所有 GPU 端和服务器端的资源通过 64 位 Resource ID（定义于 `core/templates/rid.h`）访问，场景节点不直接持有后端资源指针
- **ClassDB 反射系统**：引擎启动时所有类自注册到 ClassDB，提供运行时类型信息，驱动脚本绑定、编辑器属性检查器和序列化
- **Variant 类型系统**：用统一的 Variant 容器封装引擎内所有数据类型（30 余种），是脚本与 C++ 交互的核心桥梁
- **模块化构建**：`modules/` 目录下包含 55+ 个可选功能模块，通过 SCons 构建系统按需选择编译

---

## 2. 顶层目录结构

```
godot/
├── core/        # 核心基础层：Object, Variant, ClassDB, 容器模板, 数学, 字符串, I/O, OS 抽象
├── servers/     # 后端服务器：渲染, 物理, 音频, 导航, 显示, 文本, XR
├── scene/       # 场景系统：Node, SceneTree, 2D/3D 节点, GUI 控件, 资源, 动画
├── modules/     # 55+ 可选模块 (GDScript, glTF, Jolt 物理, Mono/C#, 等)
├── drivers/     # 平台相关驱动 (Vulkan, GLES3, Metal, D3D12, ALSA, PulseAudio, 等)
├── platform/    # 平台移植层 (Windows, Linux, macOS, Android, iOS, Web)
├── editor/      # 编辑器实现
├── main/        # 引擎入口 (main.cpp)
├── doc/         # 类参考文档 (XML 格式)
├── tests/       # 单元测试
└── thirdparty/  # 第三方库 (freetype, zlib, etc.)
```

---

## 3. 核心架构分层

引擎从底层到高层分为 6 个明确的层次：

```
┌──────────────────────────────────────────────────────┐
│              编辑器层 (Editor)                          │
│   EditorNode / Inspector / FileSystem / Export        │
├──────────────────────────────────────────────────────┤
│              场景层 (Scene)                             │
│   SceneTree / Node / Viewport / Window                │
│   2D Nodes / 3D Nodes / GUI Controls                  │
│   Animation / Resources / PackedScene                  │
├──────────────────────────────────────────────────────┤
│              服务器层 (Servers)                         │
│   RenderingServer / PhysicsServer / AudioServer       │
│   DisplayServer / NavigationServer / TextServer       │
│   XRServer / CameraServer                              │
├──────────────────────────────────────────────────────┤
│              驱动层 (Drivers)                           │
│   Vulkan / GLES3 / Metal / D3D12                      │
│   ALSA / PulseAudio / WASAPI / CoreAudio              │
├──────────────────────────────────────────────────────┤
│              核心层 (Core)                              │
│   Object / ClassDB / Variant / RefCounted             │
│   Templates / Math / String / I/O / OS                │
│   Crypto / Debugger / Input / Extension               │
├──────────────────────────────────────────────────────┤
│              平台层 (Platform)                          │
│   Windows / Linux / macOS / Android / iOS / Web       │
└──────────────────────────────────────────────────────┘
```

**各层职责**：

| 层 | 职责 |
|---|---|
| **平台层** | 封装操作系统差异：窗口创建、文件系统、线程、内存分配 |
| **核心层** | 提供引擎基础设施：对象模型、类型系统、容器、数学库 |
| **驱动层** | 对接具体硬件 API：GPU 渲染后端、音频输出设备 |
| **服务器层** | 实现引擎核心功能：渲染管线、物理模拟、音频混合、导航寻路 |
| **场景层** | 组织游戏对象：节点树、组件、资源管理、动画系统 |
| **编辑器层** | 开发工具：场景编辑器、脚本编辑器、调试器、导出系统 |

---

## 4. 核心模块详解

### 4.1 对象系统 (`core/object/`)

对象系统是 Godot 的基石，所有引擎类都继承自 `Object`。

#### 类继承层次

```
Object (core/object/object.h)
├── RefCounted (core/object/ref_counted.h)       ← 引用计数基类
│   ├── Resource (core/io/resource.h)             ← 所有可序列化资源
│   ├── Script (core/object/script_language.h)    ← 脚本对象
│   └── ...
├── Node (scene/main/node.h)                      ← 场景节点基类
│   ├── CanvasItem (scene/2d/canvas_item.h)       ← 2D 可见基类
│   │   ├── Node2D                                ← 2D 变换节点
│   │   └── Control (scene/gui/control.h)        ← GUI 控件基类
│   ├── Node3D (scene/3d/node_3d.h)              ← 3D 变换节点
│   └── ...
├── MainLoop (core/os/main_loop.h)
│   └── SceneTree (scene/main/scene_tree.h)      ← 场景树主循环
└── RenderingServer, PhysicsServer, ...           ← 所有服务器单例
```

#### GDCLASS 宏系统

`GDCLASS(m_class, m_inherits)` 定义在 `object.h` 第 247 行，是 Godot 对象模型的核心宏。它完成了以下工作：

1. **GDSOFTCLASS**（第 160 行）提供 `cast_to<>` 类型转换、`_notification`/`_set`/`_get` 虚函数分派
2. 创建静态 `GDType` 对象，保存类名和父类指针
3. 生成 `get_class_static()` 方法返回类名字符串
4. 声明 `ClassDB` 为友元类，允许注册方法和属性

```cpp
// 使用示例
class MyNode : public Node {
    GDCLASS(MyNode, Node);  // 自动注册到类型系统
};
```

#### ClassDB 注册系统

`ClassDB`（`core/object/class_db.h`）是引擎的运行时类型信息中心：

- **类注册**：`GDREGISTER_CLASS(ClassName)` 在 `register_types` 函数中调用
- **方法绑定**：将 C++ 成员函数包装为 `MethodBind` 对象，支持运行时按名字调用
- **属性注册**：通过 `ADD_PROPERTY`、`ADD_GROUP` 等宏声明导出属性
- **反射查询**：`get_property_list()`、`get_method_list()` 提供运行时自省

#### 信号系统

信号是 Godot 的事件通信机制，实现观察者模式：

- `connect(signal, callable)` — 将信号连接到回调
- `emit_signal(signal, args...)` — 发射信号并传递参数
- `disconnect(signal, callable)` — 断开连接
- 支持 deferred（延迟调用）、one_shot（一次性）等连接标志

#### 属性系统

属性通过宏注册到 ClassDB，在编辑器中自动显示为可编辑字段：

```cpp
ADD_PROPERTY(PropertyInfo(Variant::FLOAT, "speed"), "set_speed", "get_speed");
ADD_GROUP("Movement", "movement_");      // 在检查器中分组
ADD_SUBGROUP("Advanced", "advanced_");   // 子分组
```

#### 其他关键组件

| 组件 | 文件 | 功能 |
|---|---|---|
| RefCounted | `ref_counted.h` | 原子引用计数基类，配合 `Ref<T>` 智能指针 |
| MethodBind | `method_bind.h` | 类型擦除的方法封装器，支持运行时分发 |
| MessageQueue | `message_queue.h` | 延迟/线程安全调用队列，在帧循环中刷新 |
| WorkerThreadPool | `worker_thread_pool.h` | 任务并行系统，TaskID/GroupID |
| ScriptLanguage | `script_language.h` | 多脚本语言支持接口（最多 16 种语言） |

---

### 4.2 Variant 类型系统 (`core/variant/`)

Variant 是 Godot 的动态类型容器，能够持有引擎内所有数据类型。定义在 `core/variant/variant.h`。

#### 支持的类型

| 分类 | 类型 |
|---|---|
| **原子类型** | `NIL`, `BOOL`, `INT`(int64_t), `FLOAT`(double), `STRING` |
| **数学类型** | `VECTOR2`, `VECTOR2I`, `RECT2`, `RECT2I`, `VECTOR3`, `VECTOR3I`, `TRANSFORM2D`, `VECTOR4`, `VECTOR4I`, `PLANE`, `QUATERNION`, `AABB`, `BASIS`, `TRANSFORM3D`, `PROJECTION` |
| **杂项类型** | `COLOR`, `STRING_NAME`, `NODE_PATH`, `RID`, `OBJECT`, `CALLABLE`, `SIGNAL` |
| **容器类型** | `DICTIONARY`, `ARRAY` |
| **打包数组** | `PACKED_BYTE_ARRAY`, `PACKED_INT32_ARRAY`, `PACKED_INT64_ARRAY`, `PACKED_FLOAT32_ARRAY`, `PACKED_FLOAT64_ARRAY`, `PACKED_STRING_ARRAY`, `PACKED_VECTOR2_ARRAY`, `PACKED_VECTOR3_ARRAY`, `PACKED_COLOR_ARRAY`, `PACKED_VECTOR4_ARRAY` |

#### 内部实现

Variant 使用联合体存储数据，大小为 24 字节（`real_t = float`）或 40 字节（`real_t = double`）。较大的类型（如 `Transform3D`）通过动态分配存储。

#### Callable

`Callable`（`callable.h`）是可调用对象的统一封装，有两种实现：
- **Object + StringName**：绑定到某个对象的方法调用
- **CallableCustom**：自定义可调用对象（如 lambda、绑定参数）

#### Dictionary 和 Array

- `Dictionary`：动态键值存储，内部使用 `HashMap` 实现
- `Array`：动态数组，内部使用 `Vector` 实现
- 类型化变体：`TypedArray<T>` 和 `TypedDictionary<K,V>` 提供编译时类型约束

---

### 4.3 容器模板 (`core/templates/`)

Godot 实现了一套自有的容器模板库，避免对 STL 的依赖。

| 容器 | 头文件 | 特性 | 适用场景 |
|---|---|---|---|
| `Vector<T>` | `vector.h` | COW（写入时复制），通过 `CowData<T>` 实现 | 通用动态数组 |
| `LocalVector<T>` | `local_vector.h` | 非 COW 直接存储，开销更低 | 内部临时数组 |
| `HashMap<K,V>` | `hash_map.h` | 开放寻址 + Robin Hood 哈希 | 键值查找 |
| `HashSet<T>` | `hash_set.h` | 同 HashMap 哈希策略 | 集合操作 |
| `List<T>` | `list.h` | 双向链表 | 频繁插入/删除 |
| `RBMap<K,V>` | `rb_map.h` | 红黑树有序映射 | 需要有序遍历 |
| `RID_Owner<T>` | `rid_owner.h` | 通过 RID 句柄管理资源 | 服务器资源管理 |
| `PagedAllocator<T>` | `paged_allocator.h` | 固定大小对象池 | 高频分配/释放 |
| `SafeRefCount` | `safe_refcount.h` | 原子引用计数 | 线程安全计数 |
| `SelfList<T>` | `self_list.h` | 侵入式链表节点 | 节点已属于其他结构时 |
| `RingBuffer<T>` | `ring_buffer.h` | 循环缓冲区 | 音频数据流 |

**COW 机制**：`Vector<T>` 通过 `CowData<T>` 实现写入时复制。多个 Vector 共享同一份数据时（如函数参数传值），只有在首次修改时才会触发深拷贝，避免了不必要的内存分配。

---

### 4.4 数学库 (`core/math/`)

| 类型 | 说明 |
|---|---|
| `Vector2` / `Vector2i` | 2D 向量，浮点/整型 |
| `Vector3` / `Vector3i` | 3D 向量 |
| `Vector4` / `Vector4i` | 4D 向量 |
| `Rect2` / `Rect2i` | 2D 矩形 |
| `Transform2D` | 2D 仿射变换（3x2 矩阵） |
| `Transform3D` | 3D 仿射变换（Basis + 原点） |
| `Basis` | 3x3 旋转矩阵 |
| `Quaternion` | 四元数旋转 |
| `AABB` | 轴对齐包围盒 |
| `Plane` | 平面方程 |
| `Projection` | 4x4 投影矩阵 |
| `Color` | RGBA 颜色 |

**算法模块**：

| 模块 | 说明 |
|---|---|
| `AStar` / `AStarGrid2D` | A* 寻路算法 |
| `Geometry2D` / `Geometry3D` | 凸包、多边形操作、射线求交 |
| `BVH` | 包围体层次结构，空间加速 |
| `DynamicBVH` | 支持动态更新的 BVH |
| `RandomPCG` | PCG 随机数生成器 |

---

### 4.5 字符串系统 (`core/string/`)

| 类型 | 头文件 | 特性 |
|---|---|---|
| `String` | `ustring.h` | 内部 UTF-32 存储，支持 UTF-8/16 转换，完整 Unicode 操作 |
| `StringName` | `string_name.h` | 全局驻留字符串，通过哈希表快速比较，用于属性名/信号名等高频场景 |
| `NodePath` | `node_path.h` | 场景树路径表示（如 `Path/To/Node:property`） |

`StringName` 的驻留机制：所有相同内容的字符串在全局只存一份，比较操作退化为指针比较（O(1)），这在引擎的属性查找、信号分发等热路径上性能优势显著。

---

### 4.6 I/O 系统 (`core/io/`)

#### 资源管理

```
Resource (resource.h)              ← 所有可序列化资源基类，继承 RefCounted
  ├── ResourceLoader (resource_loader.h)  ← 加载管理器，支持多线程、缓存、格式识别
  ├── ResourceSaver (resource_saver.h)    ← 保存管理器，格式协商
  └── ResourceFormatLoader/Saver          ← 可插拔的格式加载/保存器
```

关键特性：
- `Resource` 通过 `Ref<T>` 智能指针管理生命周期（引用计数）
- `ResourceLoader` 支持后台线程加载，缓存已加载资源
- 资源依赖自动追踪和加载

#### 文件访问

`FileAccess`（`file_access.h`）是文件 I/O 的抽象基类，具体实现形成优先链：

```
FileAccess (抽象)
  → FileAccessPack     ← 从 PAK 包读取
  → FileAccessZip      ← 从 ZIP 读取
  → FileAccessCompressed ← 压缩文件
  → FileAccessEncrypted ← 加密文件
  → FileAccessDisk     ← 磁盘文件
```

#### 网络

```
HTTPClient
  ├── TCP / UDP Server
  │   ├── StreamPeer (TCP)
  │   └── PacketPeer (UDP)
  └── TLS 传输安全层
```

---

### 4.7 操作系统抽象 (`core/os/`)

| 组件 | 头文件 | 职责 |
|---|---|---|
| `OS` | `os.h` | 平台功能全局单例：命令行、环境变量、显示器信息、电源状态 |
| `Thread` | `thread.h` | 跨平台线程封装 |
| `Mutex` / `Semaphore` / `ConditionVariable` | 同步原语 | 线程同步 |
| `Memory` | `memory.h` | 自定义分配器：`memnew`/`memdelete`/`memalloc`/`memfree`，带内存追踪 |
| `Time` | `time.h` | 日期时间工具、时区处理 |

`OS` 单例是平台抽象的核心入口，各平台在 `platform/` 目录下提供具体实现。内存分配宏 `memnew`/`memdelete` 封装了 `new`/`delete` 操作，在调试模式下追踪内存分配和泄漏。

---

## 5. 服务器架构

### 服务器模式概述

Godot 的服务器架构遵循**客户端-服务器模式**：

- 每个服务器是一个继承自 `Object` 的全局单例
- 服务器通过 **RID**（64 位不透明句柄）管理内部资源
- 场景层的 Node 不直接持有后端资源指针，只保存 RID
- 服务器之间相互独立，通过 RID 间接引用
- 线程安全：服务器可配置为在独立线程运行

```
场景层 (Node)                    服务器层 (Server)
┌──────────┐    RID 句柄    ┌──────────────────┐
│ Sprite2D │ ────────────── │ RenderingServer  │
│          │ ←──────────── │   Canvas Item    │
└──────────┘    绘制结果    └──────────────────┘
```

---

### 5.1 渲染管线 (`servers/rendering/`)

渲染系统是引擎中最复杂的子系统，采用 4 层架构：

```
RenderingServer (rendering_server.h)         ← 公共 API 层
    │
    ├── RenderingDevice (rendering_device.h)  ← GPU 抽象层
    │   ├── RenderingDeviceDriver             ← 每个后端实现
    │   └── RenderingContextDriver            ← 窗口/表面管理
    │
    ├── RendererCompositor                    ← 渲染方法选择
    │   └── RendererCompositorRD (renderer_rd/)
    │       ├── RenderForwardClustered        ← 聚类光照剔除（桌面端）
    │       └── RenderForwardMobile           ← 移动端优化
    │
    └── Storage 层 (storage/)                 ← GPU 资源存储
        ├── TextureStorage                    ← 纹理上传/缓存
        ├── MeshStorage                       ← 顶点/索引缓冲
        ├── MaterialStorage                   ← 着色器管线/Uniform
        ├── LightStorage                      ← 灯光数据/阴影
        ├── ParticlesStorage                  ← GPU 粒子模拟
        └── EnvironmentStorage                ← 后处理/天空/雾
```

#### 渲染后端

| 后端 | 路径 | 平台 |
|---|---|---|
| Vulkan | `drivers/vulkan/` | Windows, Linux, Android |
| Metal | `drivers/metal/` | macOS, iOS |
| D3D12 | `drivers/d3d12/` | Windows |
| GLES3 | `drivers/gles3/` | 跨平台兼容/移动/Web |

#### 渲染流程（3D）

1. **场景剔除** — 视锥体剔除、遮挡剔除，确定可见物体
2. **阴影映射** — 计算光源影响范围，生成阴影贴图
3. **聚类光照** — Forward Clustered 模式下，将空间划分为簇，每簇记录影响光源
4. **主绘制通道** — 执行材质绘制，计算着色
5. **后处理** — 色调映射、SSAO、SSR、泛光、景深等屏幕空间效果

#### 着色器系统

- `ShaderLanguage`（`shader_language.h`）：解析 Godot 着色器语言
- `ShaderCompiler`（`shader_compiler.h`）：编译为渲染后端着色器
- `ShaderPreprocessor`（`shader_preprocessor.h`）：处理 `#include`、`#define`、条件编译

---

### 5.2 物理服务器

#### 接口层

- `PhysicsServer3D`（`servers/physics_3d/physics_server_3d.h`）：3D 物理抽象接口
- `PhysicsServer2D`（`servers/physics_2d/physics_server_2d.h`）：2D 物理抽象接口

接口通过 RID 管理形状、物体、空间和关节，场景层通过接口查询碰撞和物理状态。

#### 内置实现

| 组件 | 3D | 2D |
|---|---|---|
| 物理世界 | `GodotSpace3D` | `GodotSpace2D` |
| 宽相位 | `GodotBroadPhase3DBVH` | `GodotBroadPhase2DBVH` |
| 窄相位 | `GodotCollisionSolver3D` | `GodotCollisionSolver2D` |
| 刚体 | `GodotBody3D` | `GodotBody2D` |
| 步进 | `GodotStep3D` | `GodotStep2D` |
| 碰撞检测 | SAT + GJK/EPA | SAT + GJK/EPA |

路径：`modules/godot_physics_3d/` 和 `modules/godot_physics_2d/`

#### 物理步骤

```
GodotStep3D::step()
  ├── 1. 积分：更新速度和位置
  ├── 2. 宽相位：BVH 检测潜在碰撞对
  ├── 3. 窄相位：GJK/EPA 精确碰撞检测
  ├── 4. 解决：碰撞响应和约束求解
  └── 5. 回调：通知场景层碰撞事件
```

#### Jolt 集成

`modules/jolt_physics/` 提供 Jolt Physics 作为可选替代后端，实现相同的 `PhysicsServer3D` 接口，性能通常优于内置引擎。

---

### 5.3 音频服务器 (`servers/audio/`)

```
AudioServer (audio_server.h)           ← 中央音频管理器
  ├── Audio Bus Tree                    ← 主总线 → 子总线 → 效果
  │   ├── 音量控制、发送路由
  │   └── AudioEffect 处理链（混响、均衡、压缩等）
  ├── AudioDriver (audio_driver.h)      ← 平台驱动抽象
  │   ├── ALSA (drivers/alsa/)          ← Linux
  │   ├── PulseAudio (drivers/pulseaudio/) ← Linux
  │   ├── WASAPI (drivers/wasapi/)      ← Windows
  │   ├── CoreAudio (drivers/coreaudio/) ← macOS/iOS
  │   └── XAudio2 (drivers/xaudio2/)    ← Windows
  ├── AudioStream (audio_stream.h)      ← 音频源基类
  └── AudioEffect (audio_effect.h)      ← 音频效果基类
```

---

### 5.4 其他服务器

| 服务器 | 头文件 | 职责 |
|---|---|---|
| `DisplayServer` | `servers/display/display_server.h` | 窗口管理、输入路由、剪贴板、光标、IME |
| `NavigationServer2D/3D` | `servers/navigation_*/` | 寻路、导航网格生成（Recast/Detour）、RVO2 避障 |
| `TextServer` | `servers/text/text_server.h` | 字体渲染、文本整形、BIDI 支持（ICU/HarfBuzz） |
| `XRServer` | `servers/xr/xr_server.h` | VR/AR 追踪和接口管理（OpenXR） |
| `CameraServer` | `servers/camera/camera_server.h` | 摄像头设备接入 |

---

## 6. 场景系统

### 6.1 场景树和节点

`SceneTree`（`scene/main/scene_tree.h`）是游戏的主循环，管理整棵节点树。

#### 核心节点层次

```
Node (scene/main/node.h)
├── CanvasItem (scene/2d/canvas_item.h)     ← 2D 可见基类
│   ├── Node2D                              ← 2D 空间变换
│   │   ├── Sprite2D, AnimatedSprite2D      ← 精灵渲染
│   │   ├── CollisionShape2D, Area2D        ← 物理碰撞
│   │   ├── Camera2D                        ← 2D 摄像机
│   │   ├── TileMap, TileMapLayer           ← 瓦片地图
│   │   └── Light2D                         ← 2D 光照
│   └── Control (scene/gui/control.h)       ← GUI 控件基类
│       ├── Button, Label, LineEdit         ← 基础控件
│       ├── Container (HBox/VBox/Grid/...)  ← 布局容器
│       └── Tree, ItemList, TabContainer    ← 数据控件
├── Node3D (scene/3d/node_3d.h)            ← 3D 空间变换
│   ├── MeshInstance3D                      ← 网格渲染
│   ├── Camera3D                            ← 3D 摄像机
│   ├── Light3D (Directional/Omni/Spot)    ← 3D 灯光
│   ├── CollisionShape3D, RigidBody3D      ← 物理碰撞
│   ├── Skeleton3D                          ← 骨骼动画
│   └── GPUParticles3D                      ← 粒子系统
├── Timer                                   ← 计时器
├── Viewport (scene/main/viewport.h)       ← 渲染目标/输入路由
└── Window (scene/main/window.h)           ← 顶级窗口
```

#### 帧循环

```
SceneTree 帧循环
  ├── _physics_process (固定时间步长)
  │   └── 物理模拟 → 碰撞检测 → 物理回调
  ├── _process (可变时间步长)
  │   └── 游戏逻辑 → 场景更新
  └── MessageQueue flush
      └── 执行延迟调用
```

---

### 6.2 Viewport 系统

`Viewport` 是连接场景树和渲染服务器的桥梁：

- 作为**渲染目标**，将场景树中的 2D/3D 内容渲染到纹理或屏幕
- 作为**输入路由器**，分发鼠标/键盘/触摸事件到正确的节点
- 作为**音频监听器**，定义 3D 音频的听点位置
- 子 Viewport 支持渲染到纹理、分屏、小地图等场景

---

### 6.3 资源系统

```
Resource (core/io/resource.h)              ← 继承 RefCounted，所有可序列化资源
  ├── Ref<T> 智能指针管理生命周期
  ├── ResourceLoader (resource_loader.h)    ← 按路径加载，支持多线程
  ├── ResourceSaver (resource_saver.h)      ← 保存到文件
  └── PackedScene (scene/resources/)        ← 场景序列化/反序列化
```

主要资源类型：

| 类别 | 类型 |
|---|---|
| 纹理 | `Texture2D`, `ImageTexture`, `CompressedTexture2D`, `AtlasTexture` |
| 网格 | `Mesh`, `ArrayMesh`, `ImmediateMesh`, `MultiMesh` |
| 材质 | `Material`, `ShaderMaterial`, `CanvasItemMaterial` |
| 着色器 | `Shader`, `VisualShader` |
| 动画 | `Animation`, `AnimationLibrary` |
| 环境 | `Environment`, `Sky`, `CameraAttributes` |
| 字体 | `Font`, `FontFile`, `SystemFont` |

---

### 6.4 动画系统

- **AnimationPlayer**：关键帧动画播放器，支持值轨道、变换轨道、方法轨道、音频轨道、贝塞尔轨道
- **AnimationTree** + **AnimationNode** 子类：高级动画混合
  - `AnimationNodeBlendTree`：混合节点图
  - `AnimationNodeBlendSpace1D/2D`：基于参数的混合空间
  - `AnimationNodeStateMachine`：带过渡的状态机
  - `AnimationNodeOneShot`：一次性叠加动画
- **Tween**：编程式插值动画，支持缓动函数、并行/串行序列

---

## 7. 模块系统

### 注册机制

每个模块位于 `modules/<name>/`，必须包含：

| 文件 | 作用 |
|---|---|
| `config.py` | 模块描述，是否启用 |
| `register_types.h/.cpp` | `initialize_<name>_module()` 和 `uninitialize_<name>_module()` |
| `SCsub` | SCons 构建配置 |

注册函数在引擎启动时被 `register_module_types()` 调用，按初始化级别分阶段执行。

### 关键模块

| 模块 | 路径 | 功能 |
|---|---|---|
| GDScript | `modules/gdscript/` | 引擎主要脚本语言 |
| glTF | `modules/gltf/` | glTF 2.0 场景导入/导出 |
| Jolt Physics | `modules/jolt_physics/` | 高性能物理引擎替代方案 |
| Mono/C# | `modules/mono/` | C# 脚本语言支持 |
| Navigation | `modules/navigation_2d/`, `navigation_3d/` | 导航网格生成和寻路 |
| OpenXR | `modules/openxr/` | XR 标准接口 |
| Multiplayer | `modules/multiplayer/` | 网络多人游戏框架 |
| Interactive Music | `modules/interactive_music/` | 自适应音乐系统 |
| WebSocket | `modules/websocket/` | WebSocket 网络传输 |
| WebRTC | `modules/webrtc/` | WebRTC 点对点通信 |
| Regex | `modules/regex/` | 正则表达式 |
| SVG | `modules/svg/` | SVG 图片渲染 |
| FBX | `modules/fbx/` | FBX 模型导入 |
| MeshOptimizer | `modules/meshoptimizer/` | 网格优化（索引缓存、顶点缓存） |
| TextServer Advanced | `modules/text_server_adv/` | ICU/HarfBuzz 高级文本排版 |

---

## 8. 扩展系统 (`core/extension/`)

GDExtension 是 Godot 的稳定 C ABI，允许用 C/C++/Rust/D 等语言编写引擎扩展：

| 组件 | 头文件 | 职责 |
|---|---|---|
| `GDExtensionManager` | `gdextension_manager.h` | 加载/管理扩展动态库 |
| `ObjectGDExtension` | `object.h` | 将扩展类挂接到 Object 类型系统 |
| `gdextension_interface` | `gdextension_interface.h` | 定义完整的 C API 接口 |

扩展库通过 `gdextension_interface.json` 声明 API 绑定，在引擎启动时动态加载。扩展类可以：
- 继承引擎类（包括 `Node`、`Resource` 等）
- 注册方法和属性到 ClassDB
- 发射和接收信号
- 在编辑器中显示自定义控件

---

## 9. 引擎启动流程

引擎从 `main/main.cpp` 的 `main()` 函数开始，按以下顺序初始化：

```
main.cpp::main()
  │
  ├─ 1. 解析命令行参数
  ├─ 2. OS::initialize()               ← 平台初始化、内存设置
  ├─ 3. register_core_types()          ← 注册 Object, Variant, ClassDB 等核心类型
  ├─ 4. register_driver_types()        ← 注册音频/显示驱动
  ├─ 5. register_module_types()        ← 注册 modules/ 下所有启用模块
  ├─ 6. register_server_types()        ← 注册 RenderingServer, PhysicsServer 等
  ├─ 7. register_scene_types()         ← 注册 Node, Control, MeshInstance 等场景类型
  ├─ 8. DisplayServer::create()        ← 创建窗口和图形上下文
  ├─ 9. initialize_physics()           ← PhysicsServer2D/3D 初始化
  ├─ 10. AudioServer::init()           ← 音频子系统初始化
  ├─ 11. RenderingServer::init()       ← 渲染器初始化
  ├─ 12. SceneTree 创建                ← MainLoop 子类实例化
  ├─ 13. [Editor 初始化]              ← 如果编译了 TOOLS_ENABLED
  ├─ 14. 主循环: OS::run()             ← _process + _physics_process 循环
  └─ 15. 按反向顺序清理               ← 15→1 逆序卸载
```

注册顺序很重要：核心类型必须先于模块，模块先于服务器，服务器先于场景类型。这保证了类型依赖的正确性。

---

## 10. 构建系统

Godot 使用 **SCons** 作为构建系统：

| 文件 | 作用 |
|---|---|
| `SConstruct` | 构建入口点：平台检测、模块扫描 |
| `SCsub` | 每个目录下的编译配置，通过 `env.add_source_files()` 添加源文件 |
| `modules_enabled.gen.h` | 生成的头文件，列出所有启用的模块 |
| `methods.py` | 构建工具函数 |
| `platform_methods.py` | 平台检测函数 |

**构建目标**：

| 目标 | 说明 |
|---|---|
| `editor` | 带编辑器的开发版本 |
| `template_debug` | 导出模板（调试） |
| `template_release` | 导出模板（发布） |

**常用编译命令**：
```bash
scons platform=windows           # 编译编辑器
scons platform=linuxbsd -j$(nproc)  # 多核编译
scons target=template_release    # 编译发布模板
```

---

## 11. 关键设计模式总结

| 模式 | 使用位置 | 描述 |
|---|---|---|
| **服务器模式** | 所有 `servers/` | 后端逻辑封装为 Object 子类单例，通过 RID 句柄管理资源，前后端解耦 |
| **ClassDB 注册** | 所有 Object 子类 | 启动时类型自注册，提供运行时反射（方法、属性、信号） |
| **RID 句柄** | RenderingServer, PhysicsServer | 64 位不透明句柄替代裸指针，服务器内部通过 `RID_Owner<T>` 映射到实际资源 |
| **Ref\<T\> 智能指针** | 所有 Resource 子类 | 基于 `RefCounted` 的自动引用计数，零开销的生命周期管理 |
| **Variant 封装** | 所有脚本边界 | 统一的动态类型容器，通过巨型运算符分发表实现跨类型运算 |
| **消息队列** | `MessageQueue` | 延迟调用和线程安全的消息分发，在帧循环中集中处理 |
| **COW 容器** | `Vector<T>` | 写入时复制，多份数组共享底层数据直到首次修改 |
| **模块注册** | `modules/` | 可选功能通过标准化的 `register_types` 接口挂接，支持选择性编译 |
| **GDExtension** | `core/extension/` | 稳定 C ABI 允许第三方语言绑定，无需修改引擎源码即可扩展 |
