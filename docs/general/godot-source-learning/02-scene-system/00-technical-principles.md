# 技术原理：场景树系统

> 场景树（Scene Tree）是 Godot 引擎组织游戏世界的核心数据结构。在阅读 Node、SceneTree、Viewport 等源码之前，先理解场景树的数据结构、节点生命周期、主循环架构、脏标记机制以及视口渲染目标的技术原理。

---

## 目录

- [1. 场景树数据结构](#1-场景树数据结构)
- [2. 节点生命周期](#2-节点生命周期)
- [3. 主循环架构](#3-主循环架构)
- [4. 脏标记与延迟更新](#4-脏标记与延迟更新)
- [5. 视口与渲染目标](#5-视口与渲染目标)

---

## 1. 场景树数据结构

### 有向无环树（DAG Tree）

Godot 使用一棵**有向无环树**来组织游戏世界中的所有对象。每个游戏对象都是一个 Node，节点之间通过父子关系构成树：

```
SceneTree
└── root (Window / Viewport)
    └── CurrentScene (Node)
        ├── Player (CharacterBody3D)
        │   ├── Mesh (MeshInstance3D)
        │   ├── Collider (CollisionShape3D)
        │   └── Camera (Camera3D)
        ├── World (Node3D)
        │   ├── Terrain (StaticBody3D)
        │   ├── Enemy1 (CharacterBody3D)
        │   └── Enemy2 (CharacterBody3D)
        └── UI (CanvasLayer)
            ├── HUD (Control)
            │   ├── HealthBar (ProgressBar)
            │   └── ScoreLabel (Label)
            └── PauseMenu (Control)
```

### 为什么用树结构

树结构天然适合表达游戏世界的**层级关系**和**空间包含关系**：

| 关系类型 | 示例 | 树的表达 |
|---------|------|---------|
| 空间包含 | 角色手持武器 | Player -> Weapon |
| 视觉组合 | 角色包含网格和碰撞体 | Player -> Mesh, Collider |
| 逻辑管理 | UI 面板包含按钮和标签 | Panel -> Button, Label |
| 状态传播 | 禁用父节点禁用所有子节点 | visible/process 的级联 |

**核心好处**：

1. 父节点的变换（Transform）自动影响所有子节点
2. 父节点的状态（可见性、处理模式）自动传播给子节点
3. 删除父节点时自动清理所有子节点
4. 遍历效率高，支持深度优先遍历

### 场景树 vs 其他组织方式

```
方案 1：扁平数组（早期简单引擎）
    objects = [obj1, obj2, obj3, ...]
    缺点：无法表达层级关系，变换无法自动传播

方案 2：树结构（Godot / Unity 的选择）
    scene_tree → root → children
    优点：自然表达层级，变换/状态自动传播，遍历高效

方案 3：图结构（通用场景图如 OpenSG）
    节点可以有多个父节点
    缺点：复杂度高，容易出现环，难以管理生命周期
```

### 深度优先遍历（DFS）

引擎在每帧中需要遍历场景树执行各种操作。Godot 大量使用深度优先遍历：

```
DFS 遍历过程：

    Root
    ├── A          ← 1. 访问 Root
    │   ├── C      ← 2. 访问 A
    │   └── D      ← 3. 访问 C（A 的第一个子节点）
    └── B          ← 4. 访问 D（A 的第二个子节点）
        ├── E      ← 5. 访问 B
        └── F      ← 6. 访问 E（B 的第一个子节点）
                   ← 7. 访问 F（B 的第二个子节点）

遍历顺序：Root, A, C, D, B, E, F
```

DFS 遍历在 Godot 源码中的应用：

```
用途                          源码位置
────────────────────────────────────────────────────
传播 NOTIFICATION_PROCESS      SceneTree::_process()
传播 NOTIFICATION_ENTER_TREE   Node::_propagate_enter_tree()
收集渲染数据                   Viewport::_draw_scene()
更新世界变换矩阵               Node3D 中的变换更新
遍历节点组                     SceneTree::call_group()
```

> 源码参考：`scene/main/node.cpp` 中的 `_propagate_enter_tree()` 和 `_propagate_exit_tree()` 方法使用 DFS 遍历通知所有子节点。

---

## 2. 节点生命周期

### 生命周期阶段

Godot 的 Node 生命周期由通知（Notification）系统驱动，而非像 Unity 那样的虚函数重写。每个生命周期阶段对应一个 `NOTIFICATION_*` 常量：

```
节点生命周期完整流程：

  构造 ──────── new Node() 或实例化 PackedScene
    │
    ▼
  add_child() ── 被添加到父节点
    │
    ▼
  ENTER_TREE ── NOTIFICATION_ENTER_TREE
    │            节点进入场景树（还未就绪）
    │            可以访问树中的其他节点
    │            子节点尚未全部进入树
    │
    ▼
  READY ──────── NOTIFICATION_READY
    │            所有子节点都已进入树
    │            只触发一次
    │            _ready() 回调在此执行
    │
    ▼
  ┌──────────────────────────────────┐
  │                                  │
  │  PROCESS (每帧) ─ NOTIFICATION_PROCESS
  │  │  _process(delta) 回调          │
  │  │                                │
  │  PHYSICS_PROCESS ─ NOTIFICATION_PHYSICS_PROCESS
  │  │  _physics_process(delta) 回调   │
  │  │  固定时间步长（默认 60Hz）      │
  │  │                                │
  │  └──────── 循环 ──────────────────│
  │                                  │
  └──────────────────────────────────┘
    │
    ▼
  EXIT_TREE ──── NOTIFICATION_EXIT_TREE
    │            节点即将离开场景树
    │            子节点按逆序退出
    │
    ▼
  析构 ──────── 引用计数归零时销毁
```

### 通知系统：_notification() 机制

Godot 使用统一的通知系统而非多个虚函数。节点通过重写 `_notification(int p_what)` 来处理各种事件：

```cpp
// scene/main/node.h 中的通知常量定义
class Node : public Object {
    // ...

    // 生命周期通知
    NOTIFICATION_ENTER_TREE = 10,
    NOTIFICATION_EXIT_TREE = 11,
    NOTIFICATION_READY = 13,
    NOTIFICATION_PAUSED = 14,
    NOTIFICATION_UNPAUSED = 15,

    // 处理通知
    NOTIFICATION_PROCESS = 17,
    NOTIFICATION_PHYSICS_PROCESS = 16,

    // 父节点相关
    NOTIFICATION_PARENTED = 18,    // 被添加为某节点的子节点
    NOTIFICATION_UNPARENTED = 19,  // 被从父节点移除

    // 场景实例化相关
    NOTIFICATION_INSTANCED = 20,
    NOTIFICATION_DEBLOCKED = 21,

    // 内部处理
    NOTIFICATION_INTERNAL_PROCESS = 25,
    NOTIFICATION_INTERNAL_PHYSICS_PROCESS = 26,

    // 重置物理插值
    NOTIFICATION_RESET_PHYSICS_INTERPOLATION = 36,
};
```

对应的 GDScript 接口：

```gdscript
# GDScript 中的通知处理
func _enter_tree():
    pass  # 节点进入场景树时调用

func _ready():
    pass  # 节点就绪时调用（只一次）

func _process(delta):
    pass  # 每帧调用

func _physics_process(delta):
    pass  # 每个物理帧调用

func _exit_tree():
    pass  # 节点离开场景树时调用

# 也可以直接处理通知
func _notification(what):
    match what:
        NOTIFICATION_ENTER_TREE:
            pass
        NOTIFICATION_PROCESS:
            pass
```

### ENTER_TREE 与 READY 的区别

```
场景加载过程（假设场景包含 Parent → ChildA, ChildB）：

1. 实例化场景，创建所有节点
2. add_child(Parent) 到场景树

   触发顺序（DFS 先序）：
   a. Parent: NOTIFICATION_ENTER_TREE
   b. ChildA: NOTIFICATION_ENTER_TREE
   c. ChildB: NOTIFICATION_ENTER_TREE

3. 所有节点都进入树后，触发 READY（DFS 后序）：

   触发顺序（自底向上）：
   a. ChildA: NOTIFICATION_READY
   b. ChildB: NOTIFICATION_READY
   c. Parent: NOTIFICATION_READY  ← 父节点最后收到 READY

关键区别：
  - ENTER_TREE：DFS 先序，父节点先于子节点
  - READY：DFS 后序，子节点先于父节点
  - 这保证了在父节点 _ready() 中可以安全访问所有子节点
```

> 源码参考：`scene/main/node.cpp` 中的 `add_child()` 方法最终调用 `_propagate_enter_tree()`，该方法内部递归地先通知自己，再通知子节点。而 READY 通知通过 `MessageQueue::push_call(this, SNAME("_ready"))` 延迟触发，确保所有节点都已完成 ENTER_TREE。

### 处理回调的调度

```
SceneTree 每帧的处理顺序：

  1. 处理输入事件（Input → Viewport → 节点）
  2. 物理步（固定时间步，可能多步或零步）
     ├── NOTIFICATION_PHYSICS_PROCESS
     └── _physics_process(delta)
  3. 普通处理步（每帧一次）
     ├── NOTIFICATION_PROCESS
     └── _process(delta)
  4. MessageQueue flush（执行延迟调用）
  5. 提交渲染命令到 RenderingServer

每帧只调用一次 _process()，但 _physics_process() 可能跳过或多次
```

---

## 3. 主循环架构

### MainLoop 与 SceneTree

```
架构层次：

  ┌───────────────────────────────┐
  │      OS / Platform Layer      │  平台层，提供主循环入口
  └──────────────┬────────────────┘
                 │
  ┌──────────────▼────────────────┐
  │        MainLoop (接口)         │  core/object/main_loop.h
  │                               │
  │  _initialize()                │  初始化
  │  _process(double delta)       │  每帧处理
  │  _physics_process(double dt)  │  物理处理
  │  _finalize()                  │  清理
  └──────────────┬────────────────┘
                 │ 继承
  ┌──────────────▼────────────────┐
  │        SceneTree              │  scene/main/scene_tree.h
  │                               │
  │  root (Window)                │  根节点（也是 Viewport）
  │  节点树管理                    │
  │  输入事件分发                  │
  │  节点组管理                    │
  │  场景切换                      │
  │  AutoLoad 管理                │
  └───────────────────────────────┘
```

### MainLoop 接口定义

```cpp
// core/object/main_loop.h（简化）
class MainLoop : public Object {
    GDCLASS(MainLoop, Object);

protected:
    static void _bind_methods();

public:
    virtual void _initialize() {}
    virtual bool _process(double p_time) { return false; }
    virtual void _physics_process(double p_time) {}
    virtual void _finalize() {}

    // 通知类型
    enum {
        NOTIFICATION_OS_MEMORY_WARNING = 200,
        NOTIFICATION_TRANSLATION_CHANGED = 201,
        NOTIFICATION_WM_ABOUT = 202,
        NOTIFICATION_CRASH = 203,
        NOTIFICATION_OS_IME_UPDATE = 204,
        NOTIFICATION_APPLICATION_RESUMED = 205,
        NOTIFICATION_APPLICATION_PAUSED = 206,
        NOTIFICATION_APPLICATION_FOCUS_IN = 207,
        NOTIFICATION_APPLICATION_FOCUS_OUT = 208,
    };
};
```

### 固定物理步 vs 可变帧步

Godot 采用**累加器模式**（Accumulator Pattern）来处理物理模拟的固定时间步：

```
时间模型：

  帧间隔（delta）是可变的：16.67ms, 20ms, 33ms, ...
  物理步长是固定的：1/60s ≈ 16.67ms（可配置）

  ┌──────────────────────────────────────────────────┐
  │                 每帧的时间处理                      │
  │                                                  │
  │  delta = 实际帧间隔（可变）                        │
  │  physics_step = 1.0 / 60.0（固定）               │
  │                                                  │
  │  accumulator += delta                            │
  │                                                  │
  │  while (accumulator >= physics_step):            │
  │      _physics_process(physics_step)  ← 固定步长   │
  │      accumulator -= physics_step                 │
  │                                                  │
  │  _process(delta)                     ← 实际帧间隔  │
  └──────────────────────────────────────────────────┘

时间线示例（假设帧间隔不均匀）：

  Frame 1: delta = 20ms
    accumulator = 20ms
    physics_process(16.67ms)  ← 一次物理步
    accumulator = 3.33ms
    process(20ms)

  Frame 2: delta = 10ms
    accumulator = 13.33ms
    (不够一个物理步，跳过)
    process(10ms)

  Frame 3: delta = 30ms
    accumulator = 43.33ms
    physics_process(16.67ms)  ← 第一次
    accumulator = 26.66ms
    physics_process(16.67ms)  ← 第二次
    accumulator = 9.99ms
    process(30ms)
```

### 帧循环详细分解

```
每帧完整流程（SceneTree::_process()）：

  ┌─────────────────────────────────────────────────────┐
  │                    一帧的执行                         │
  │                                                     │
  │  1. 接收输入事件                                     │
  │     ├── DisplayServer 读取输入                       │
  │     ├── Input 单例预处理                              │
  │     └── SceneTree 分发到 Viewport                    │
  │         └── Viewport._process_input_event()          │
  │                                                     │
  │  2. 物理步（累加器模式）                              │
  │     while (accumulator >= physics_step):             │
  │     ├── PhysicsServer3D.step()                       │
  │     ├── 遍历所有 Node（按 process_priority 排序）     │
  │     │   └── NOTIFICATION_PHYSICS_PROCESS             │
  │     └── accumulator -= physics_step                  │
  │                                                     │
  │  3. 普通处理步                                       │
  │     ├── 遍历所有 Node（按 process_priority 排序）     │
  │     │   └── NOTIFICATION_PROCESS                     │
  │     └── 内部处理通知                                  │
  │                                                     │
  │  4. MessageQueue flush                              │
  │     ├── 执行所有延迟调用                              │
  │     ├── 处理 add_child / remove_child 的延迟操作     │
  │     └── 触发待执行的 _ready() 回调                   │
  │                                                     │
  │  5. 渲染                                            │
  │     ├── Viewport 收集渲染数据                        │
  │     ├── 提交到 RenderingServer                      │
  │     └── RenderingServer.flush()                     │
  │                                                     │
  │  6. 帧结束                                          │
  │     ├── 更新 FPS 统计                                │
  │     └── DisplayServer.swap_buffers()                 │
  └─────────────────────────────────────────────────────┘
```

> 源码参考：`scene/main/scene_tree.cpp` 中的 `_process()` 方法包含了帧循环的完整逻辑。

---

## 4. 脏标记与延迟更新

### 为什么需要延迟机制

在遍历场景树的过程中直接修改树结构会导致严重问题：

```
问题场景：在 _process() 中删除节点

  正在遍历节点列表：[A, B, C, D, E]
  处理到 B 时，B 调用了 queue_free() 删除自己

  如果立即删除 B：
    - 列表变成 [A, C, D, E]，但迭代器可能失效
    - C 可能被跳过或重复处理
    - 内存可能被释放后访问（use-after-free）

  Godot 的解决方案：延迟到安全时机执行
    B.queue_free() → 标记 B 为待删除
    当前帧遍历结束后 → MessageQueue flush → 安全删除 B
```

### MessageQueue 延迟调用系统

```cpp
// core/object/message_queue.h（简化）
class MessageQueue {
    static MessageQueue *singleton;

    struct Message {
        ObjectID object_id;
        StringName method;
        Variant args[4];     // 最多 4 个参数
        int arg_count;
    };

    // 推送延迟调用
    void push_call(Object *p_object, const StringName &p_method,
                   const Variant **p_args, int p_argcount);
    void push_notification(Object *p_object, int p_notification);
    void push_set(Object *p_object, const StringName &p_prop,
                  const Variant &p_value);

    // 在安全时机刷新队列
    void flush();
    void call_function(const Message &p_msg);

    static MessageQueue *get_singleton() { return singleton; }
};
```

MessageQueue 的使用场景：

```
场景                              使用方式
─────────────────────────────────────────────────────────
_ready() 延迟触发                 push_call(node, "_ready")
add_child() 后的初始化             push_notification(child, NOTIFICATION_PARENTED)
queue_free() 延迟删除             push_call(this, "free")（在帧末尾执行）
call_deferred()                   push_call(...) （GDScript 暴露的接口）
set_deferred()                    push_set(...)  （属性延迟设置）
```

### 脏标记系统（Dirty Flags）

Godot 的变换更新使用脏标记来避免不必要的计算：

```
脏标记传播模型：

  父节点 Transform 变化
      │
      ▼
  标记自己为脏
      │
      ▼
  通知所有子节点世界变换已失效
      │
      ├── 子节点 A → 标记脏 → 通知 A 的子节点
      │   ├── 孙节点 AA → 标记脏
      │   └── 孙节点 AB → 标记脏
      └── 子节点 B → 标记脏
          └── 孙节点 BA → 标记脏

  请求 Transform 时才真正重算：
    if (dirty) {
        world_transform = parent.world_transform * local_transform
        dirty = false
    }
```

Node3D 中的脏标记实现：

```cpp
// scene/3d/node_3d.h（简化）
class Node3D : public Node {
    enum TransformDirty {
        DIRTY_NONE = 0,
        DIRTY_LOCAL = 1,     // 本地变换已修改
        DIRTY_GLOBAL = 2,    // 需要重新计算世界变换
    };

    mutable Transform3D transform;        // 本地变换
    mutable Transform3D global_transform; // 世界变换（mutable 允许 const 方法中修改）
    mutable TransformDirty dirty_bits;

    void set_position(const Vector3 &p_pos) {
        transform.origin = p_pos;
        _dirty_notify();  // 标记脏 + 通知子节点
    }

    void _dirty_notify() {
        dirty_bits = DIRTY_LOCAL | DIRTY_GLOBAL;
        // 通知子节点世界变换已失效
        for (int i = 0; i < get_child_count(); i++) {
            Node3D *child = Object::cast_to<Node3D>(get_child(i));
            if (child) {
                child->dirty_bits |= DIRTY_GLOBAL;
                child->_dirty_notify();  // 递归传播
            }
        }
    }
};
```

### 延迟更新的优势

```
1. 批量处理
   一帧内多次修改 Transform 只触发一次传播

2. 按需计算
   不可见的节点不需要计算世界变换

3. 避免遍历中修改
   add_child / remove_child 通过 MessageQueue 延迟执行

4. 顺序保证
   MessageQueue 按 FIFO 顺序处理，保证操作顺序正确

性能对比：
  无脏标记：1000 个节点 × 60 FPS × 完整矩阵计算 = 60000 次/秒
  有脏标记：只有变化的节点才计算，通常 < 10% 的节点每帧变化
```

> 源码参考：`core/object/message_queue.h` 和 `scene/3d/node_3d.h`

---

## 5. 视口与渲染目标

### Viewport 的角色

Viewport 在 Godot 中扮演多重角色：

```
Viewport 的五大职责：

  ┌─────────────────────────────────────────────────┐
  │                 Viewport                         │
  │                                                 │
  │  1. 渲染目标（Render Target）                     │
  │     ├── 定义可渲染区域                             │
  │     ├── 管理渲染纹理                               │
  │     └── 2D 和 3D 场景渲染                          │
  │                                                 │
  │  2. 输入路由（Input Routing）                     │
  │     ├── 接收输入事件                               │
  │     ├── 2D: 从后向前拾取（Pick）                   │
  │     └── 3D: 射线检测（Raycast）                    │
  │                                                 │
  │  3. 音频监听器（Audio Listener）                   │
  │     ├── 2D 和 3D 音频的监听位置                    │
  │     └── 关联 AudioListener2D/3D                  │
  │                                                 │
  │  4. 摄像机宿主（Camera Host）                     │
  │     ├── 管理当前活跃摄像机                         │
  │     └── 3D 场景必须通过 Camera3D 渲染             │
  │                                                 │
  │  5. 子树容器                                     │
  │     ├── Viewport 包含自己的节点子树                │
  │     └── 子树中的节点有独立的坐标空间               │
  └─────────────────────────────────────────────────┘
```

### Viewport 继承体系

```
Object
└── Node
    └── Viewport
        └── Window          ← 可见的窗口（有操作系统窗口）
            ├── 隐式根窗口   ← SceneTree.root
            ├── 弹出窗口     ← Window 嵌入式或独立窗口
            └── SubViewport  ← 离屏渲染（无操作系统窗口）
```

### 渲染目标与纹理

```
Viewport 作为渲染目标：

  ┌──────────────────────────────────────┐
  │            Viewport                  │
  │                                      │
  │  size = (1920, 1080)                 │
  │  render_target → RenderingServer RID │
  │                                      │
  │  ┌────────────────────────────┐      │
  │  │                            │      │
  │  │    渲染到纹理               │      │
  │  │    (RenderTarget Texture)  │      │
  │  │                            │      │
  │  │    可被 Sprite2D/TextureRect│      │
  │  │    引用显示                 │      │
  │  │                            │      │
  │  └────────────────────────────┘      │
  │                                      │
  └──────────────────────────────────────┘

用途：
  - 小地图渲染（Camera 指向不同方向）
  - 闭路电视监控画面
  - 镜子/水面反射
  - UI 纹理合成
  - 后处理效果链
```

### 输入事件路由

输入事件从操作系统到达节点的完整路径：

```
输入事件传播路径：

  操作系统（键盘/鼠标/触摸）
      │
      ▼
  DisplayServer.get_events()
      │
      ▼
  Input.parse_input_event()         ← Input 单例预处理
      │
      ▼
  SceneTree._input_event()          ← 场景树分发
      │
      ▼
  Viewport._process_input_event()   ← 视口处理
      │
      ├── _Unhandled input → 冒泡     ← 传播给场景树中的节点
      │   └── _unhandled_input()
      │
      ├── _gui_input → GUI 处理       ← Control 节点处理
      │   └── Control._gui_input()
      │
      └── Shortcut 匹配               ← 检查快捷键

冒泡方向（从后向前/从子到父）：
  Control Button → Panel → CanvasLayer → Viewport → SceneTree
```

### 摄像机关联

```
3D 渲染中的 Viewport-Camera 关系：

  Viewport
  ├── Camera3D (current = true)  ← 当前活跃摄像机
  │   └── 定义 view/projection 矩阵
  ├── Camera3D (current = false) ← 非活跃摄像机
  │   └── 通过 make_current() 切换
  └── MeshInstance3D
      └── 渲染时使用当前活跃 Camera 的矩阵

渲染流程：
  1. Viewport 收集所有 Camera 节点
  2. 选择 current=true 的 Camera
  3. 使用 Camera 的 view/projection 矩阵
  4. 通过 RenderingServer 渲染 3D 场景
  5. 输出到 Viewport 的 render target
```

### 多 Viewport 架构

```
Godot 的多视口架构：

  SceneTree
  └── root (Window)                   ← 主视口（全屏或窗口）
      ├── CurrentScene                ← 当前场景
      │   ├── Camera3D
      │   └── World
      │       └── SubViewport         ← 子视口（离屏渲染）
      │           ├── Camera3D        ← 独立摄像机
      │           └── MiniMapScene    ← 小地图场景
      ├── CanvasLayer                 ← 2D 层
      │   └── SubViewportContainer    ← 显示子视口内容
      │       └── SubViewport
      └── Popup (Window)              ← 弹出窗口（独立 Window）
          └── Control

特点：
  - 每个 Viewport 有独立的渲染管线
  - SubViewport 的内容可以作为纹理使用
  - Window 可以是嵌入式或操作系统原生窗口
```

> 源码参考：`scene/main/viewport.h` 和 `scene/main/window.h`

---

## 延伸阅读

- [Scene Tree - Godot 官方文档](https://docs.godotengine.org/en/stable/tutorials/scripting/scene_tree.html)
- [MainLoop 源码](https://github.com/godotengine/godot/blob/master/core/object/main_loop.h)
- [Node 源码](https://github.com/godotengine/godot/blob/master/scene/main/node.h)
- [SceneTree 源码](https://github.com/godotengine/godot/blob/master/scene/main/scene_tree.h)
- [Game Loop - Game Programming Patterns](https://gameprogrammingpatterns.com/game-loop.html)

---

> 理解了这些原理后，继续阅读 [01-节点系统](./01-node-system.md) 查看对应的源码实现。
