# 场景树与主循环

> SceneTree 是 Godot 游戏运行时的核心管理器，继承自 MainLoop 接口，负责管理节点树、调度帧循环、分发输入事件、管理场景切换。本文深入分析 SceneTree 的源码实现和主循环的完整架构。

---

## 目录

- [1. SceneTree 类概览](#1-scenetree-类概览)
- [2. 帧循环详解](#2-帧循环详解)
- [3. 物理步进与插值](#3-物理步进与插值)
- [4. MessageQueue 与延迟操作](#4-messagequeue-与延迟操作)
- [5. 场景加载与切换](#5-场景加载与切换)
- [6. AutoLoad 系统](#6-autoload-系统)
- [7. 源码结构总览](#7-源码结构总览)

---

## 1. SceneTree 类概览

### 类继承关系

```
Object
└── MainLoop                     ← 核心主循环接口
    └── SceneTree                ← 场景树实现
```

### SceneTree 核心成员

```cpp
// scene/main/scene_tree.h（简化）
class SceneTree : public MainLoop {
    GDCLASS(SceneTree, MainLoop);

    // ====== 根节点 ======
    Window *root = nullptr;           // 根窗口（也是 Viewport）

    // ====== 节点处理列表 ======
    // 按优先级排序的待处理节点列表
    SelfList<Node>::List process_nodes;
    SelfList<Node>::List physics_process_nodes;
    bool process_order_dirty = true;

    // ====== 场景管理 ======
    Node *current_scene = nullptr;    // 当前场景根节点
    Node *edited_scene_root = nullptr; // 编辑器中的场景根
    String current_scene_path;        // 当前场景文件路径

    // ====== 物理参数 ======
    double physics_step = 1.0 / 60.0;  // 固定物理步长
    double physics_time = 0.0;         // 物理累加器
    bool physics_interpolation_enabled = false;

    // ====== 暂停 ======
    bool paused = false;              // 全局暂停状态

    // ====== 组管理 ======
    HashMap<StringName, Group> group_map;

    // ====== 输入 ======
    Input *input = nullptr;           // Input 单例引用

    // ====== 多线程 ======
    bool process_in_threads = false;

    // ====== 场景切换队列 ======
    struct SceneChangeRequest {
        String path;
        bool queue_free_previous;
        bool use_sub_threads;
    };
    List<SceneChangeRequest> scene_change_queue;

    // ====== 帧统计 ======
    uint64_t frame_count = 0;         // 总帧数
    double frame_time = 0.0;          // 当前帧时间
    double physics_process_time = 0.0;
    double process_time = 0.0;
};
```

### SceneTree 的创建时机

```
引擎启动流程（main/main.cpp）：

  1. OS::initialize()              ← 平台初始化
  2. 注册核心单例（Input, RenderingServer 等）
  3. 创建 SceneTree                ← 在此处创建
  4. SceneTree._initialize()       ← 初始化根窗口
  5. 加载 AutoLoad 节点
  6. 加载初始场景
  7. 进入主循环（OS::run()）

  主循环：
    while (!quit):
        OS::get_events()           ← 获取平台事件
        SceneTree._process(time)   ← 执行一帧
        DisplayServer::swap()      ← 交换缓冲区
```

---

## 2. 帧循环详解

### _process() 总体结构

```cpp
// scene/main/scene_tree.cpp（简化）
bool SceneTree::_process(double p_time) {
    // 1. 处理平台事件（窗口事件、拖放等）
    _handle_platform_events();

    // 2. 处理输入事件
    _process_input_events();

    // 3. 物理步进（固定时间步）
    _process_physics(p_time);

    // 4. 普通处理步（每帧一次）
    _process_idle(p_time);

    // 5. 刷新 MessageQueue
    MessageQueue::get_singleton()->flush();

    // 6. 提交渲染
    RenderingServer::get_singleton()->sync();
    root->_draw_scene();

    // 7. 帧统计更新
    frame_count++;
    frame_time = p_time;

    return quit_on_go_back;
}
```

### 步骤 1：输入事件处理

```
输入事件处理流程：

  DisplayServer.get_events()
      │
      ▼
  Input.parse_event(event)
      │
      ├── 处理动作映射（InputMap）
      │   ├── ui_accept → 检查绑定的按键
      │   ├── ui_cancel → 检查绑定的按键
      │   └── 自定义动作...
      │
      ├── 通知所有注册了 _input 的节点
      │   └── node._input(event)
      │
      └── 传递给 SceneTree._input_event()
          │
          ▼
      Viewport._process_input_event()
          │
          ├── _gui_input → GUI 控件处理
          │   ├── 找到最前面的 Control
          │   ├── 调用 Control._gui_input()
          │   └── 冒泡传播给父 Control
          │
          ├── _unhandled_input → 未处理的输入
          │   ├── 调用节点._unhandled_input()
          │   └── 2D/3D 拾取
          │
          └── Shortcut 匹配
```

### 步骤 2：物理步进

```cpp
// scene/main/scene_tree.cpp（简化）
void SceneTree::_process_physics(double p_time) {
    // 使用累加器模式
    physics_time += p_time;

    // 物理步长限制：避免螺旋死亡（spiral of death）
    // 如果累积时间过长，最多执行 max_physics_steps 步
    int max_steps = 8;  // 防止一帧执行过多物理步
    int steps = 0;

    while (physics_time >= physics_step && steps < max_steps) {
        // 1. 让 PhysicsServer 执行物理模拟
        PhysicsServer3D::get_singleton()->step(physics_step);
        PhysicsServer2D::get_singleton()->step(physics_step);

        // 2. 同步物理状态到场景节点
        _flush_physics_transforms();

        // 3. 通知所有注册了物理处理的节点
        _ensure_process_order();  // 确保排序
        for (SelfList<Node> *E = physics_process_nodes.first(); E; E = E->next()) {
            Node *node = E->self();
            // 检查节点是否应该处理（暂停状态、处理模式等）
            if (_can_process(node)) {
                node->_notification(NOTIFICATION_PHYSICS_PROCESS);
            }
        }

        physics_time -= physics_step;
        steps++;
        physics_process_time = physics_step;
    }

    // 如果累加器还有余量，用于物理插值
    if (physics_interpolation_enabled) {
        physics_interpolation_fraction = physics_time / physics_step;
    }
}
```

### 物理步进的时序图

```
                    时间 →
    ──────────────────────────────────────────────
    Frame 1        Frame 2        Frame 3
    delta=25ms     delta=10ms     delta=20ms

    累加器：0ms    累加器：8ms    累加器：12ms
    +25ms          +10ms          +20ms
    =25ms          =18ms          =32ms

    物理步1        (不足一步)      物理步1
    -16.67ms                      -16.67ms
    =8.33ms                       =15.33ms

                                   物理步2
                                   -16.67ms
                                   =-1.34ms → clamp to 0

    ┌──────┐       ┌──────┐       ┌──────┐
    │ 1 物理│       │ 0 物理│       │ 2 物理│
    │ 1 渲染│       │ 1 渲染│       │ 1 渲染│
    └──────┘       └──────┘       └──────┘

    注意：Frame 3 执行了 2 次物理步但只有 1 次渲染步
    这保证了物理模拟的确定性，同时渲染与显示刷新率同步
```

### 步骤 3：普通处理步

```cpp
// scene/main/scene_tree.cpp（简化）
void SceneTree::_process_idle(double p_time) {
    // 1. 处理延迟调用队列（部分）
    MessageQueue::get_singleton()->flush();  // 前半部分

    // 2. 通知所有注册了处理的节点
    _ensure_process_order();
    for (SelfList<Node> *E = process_nodes.first(); E; E = E->next()) {
        Node *node = E->self();
        if (_can_process(node)) {
            node->_notification(NOTIFICATION_PROCESS);
        }
    }

    // 3. 处理内部处理通知
    for (SelfList<Node> *E = internal_process_nodes.first(); E; E = E->next()) {
        Node *node = E->self();
        if (_can_process(node)) {
            node->_notification(NOTIFICATION_INTERNAL_PROCESS);
        }
    }

    process_time = p_time;
}
```

### _can_process() 暂停检查

```cpp
// scene/main/scene_tree.cpp（简化）
bool SceneTree::_can_process(Node *p_node) const {
    if (paused) {
        // 检查节点的处理模式
        switch (p_node->get_process_mode()) {
            case Node::PROCESS_MODE_DISABLED:
                return false;
            case Node::PROCESS_MODE_ALWAYS:
                return true;
            case Node::PROCESS_MODE_WHEN_PAUSED:
                return true;
            case Node::PROCESS_MODE_PAUSABLE:
                return false;
            case Node::PROCESS_MODE_INHERIT:
                // 递归检查父节点
                Node *parent = p_node->get_parent();
                if (parent) {
                    return _can_process(parent);
                }
                return false;  // 默认 PAUSABLE
        }
    }
    // 未暂停时，DISABLED 仍然不处理
    return p_node->get_process_mode() != Node::PROCESS_MODE_DISABLED;
}
```

### 完整帧循环可视化

```
一帧的完整时间线（假设 60 FPS，一帧约 16.67ms）：

  0ms                  5ms                  10ms                 16.67ms
  │                    │                    │                    │
  │  1.输入处理        │  2.物理步          │  3.处理步          │ 4.渲染
  │  ┌──────────┐     │  ┌──────────┐     │  ┌──────────┐     │ ┌──────┐
  │  │ 读取事件 │     │  │ 累加器判 │     │  │ 遍历节点 │     │ │ 渲染 │
  │  │ 动作映射 │     │  │ 断       │     │  │ _process │     │ │ 3D   │
  │  │ 分发输入 │     │  │ Physics  │     │  │ 优先级排 │     │ │ 2D   │
  │  │ _input() │     │  │ Server   │     │  │ 序执行   │     │ │ 交换 │
  │  └──────────┘     │  │ _physics │     │  └──────────┘     │ │ 缓冲 │
  │                    │  │ _process │     │                    │ └──────┘
  │                    │  └──────────┘     │                    │
  │                    │                    │                    │
  │                    │  MessageQueue      │  MessageQueue     │
  │                    │  flush(部分)       │  flush(剩余)      │
```

---

## 3. 物理步进与插值

### 固定时间步的意义

```
为什么物理需要固定时间步？

  物理引擎（如 Godot 使用的 Bullet/PhysX/GodotPhysics）需要确定性：
    - 碰撞检测的精度依赖时间步大小
    - 不同的时间步会导致不同的物理行为
    - 网络同步需要确定性的物理模拟

  如果用可变时间步：
    Frame 1: dt=0.01s, 物体移动 1cm
    Frame 2: dt=0.05s, 物体移动 5cm
    → 高速运动时可能穿过薄墙壁（隧道效应）

  使用固定时间步：
    始终 dt=1/60s，物理行为一致
    帧率低时一帧执行多步物理，帧率高时跳过物理步
```

### 物理插值（Physics Interpolation）

```
问题：物理以 60Hz 运行，但渲染可能是 144Hz
  物理帧：  |-----|-----|-----|-----|
  渲染帧：  |--|--|--|--|--|--|--|--|

  渲染帧 1 和 2 之间，物体位置没有变化（因为物理还没更新）
  → 视觉上看起来一卡一卡的（judder）

解决方案：线性插值

  物理位置 P0 (t=0)     物理位置 P1 (t=16.67ms)
       │                       │
       │   插值                 │
       │  P_render = lerp(P0, P1, fraction)
       │       │
       │  fraction = accumulator / physics_step
       │       │
  渲染时刻 0ms → fraction=0.0 → 显示 P0
  渲染时刻 5ms → fraction=0.3 → 显示 P0*0.7 + P1*0.3
  渲染时刻 10ms → fraction=0.6 → 显示 P0*0.4 + P1*0.6

  源码位置：
    scene/main/scene_tree.h: physics_interpolation_fraction
    scene/3d/physics_body_3d.cpp: _physics_interpolation_*
```

### 螺旋死亡（Spiral of Death）防护

```cpp
// scene/main/scene_tree.cpp
// 如果帧时间过长，累加器会累积大量时间
// 如果不做限制，下一帧要执行大量物理步，导致更慢，再导致更多物理步...

// Godot 的防护措施：
static const int MAX_PHYSICS_STEPS = 8;  // 每帧最多 8 步物理

// 超过限制时，丢弃多余的时间
if (steps >= MAX_PHYSICS_STEPS) {
    physics_time = 0;  // 丢弃剩余时间
    // 物理会有轻微不连续，但避免了死循环
}
```

---

## 4. MessageQueue 与延迟操作

### MessageQueue 的角色

```
MessageQueue 在帧循环中的位置：

  物理步处理          普通处理步          渲染
  │                  │                  │
  │  MessageQueue    │  MessageQueue    │
  │  flush()         │  flush()         │
  │  ←── here ──→    │  ←── here ──→    │

  MessageQueue 在物理步后和处理步后各刷新一次
  保证所有延迟操作在安全的时机执行
```

### MessageQueue 源码分析

```cpp
// core/object/message_queue.h（简化）
class MessageQueue {
    static MessageQueue *singleton;

    // 使用环形缓冲区存储消息
    LocalVector<Message> buffer;

    struct Message {
        // 消息类型
        enum Type {
            TYPE_CALL,           // 延迟方法调用
            TYPE_NOTIFICATION,   // 延迟通知
            TYPE_SET,            // 延迟属性设置
            TYPE_END             // 帧结束标记
        };

        Type type;
        ObjectID object_id;
        StringName name;        // 方法名/属性名/通知类型
        Variant args[VARIANT_ARG_MAX];  // 最多可变参数
        int arg_count;
    };

public:
    // 推送延迟调用
    Error push_call(Object *p_object, const StringName &p_method, ...);
    Error push_notification(Object *p_object, int p_notification);
    Error push_set(Object *p_object, const StringName &p_prop, const Variant &p_value);

    // 刷新队列
    void flush();

    static MessageQueue *get_singleton() { return singleton; }
};
```

### flush() 的实现

```cpp
// core/object/message_queue.cpp（简化）
void MessageQueue::flush() {
    // 防止重入（flush 过程中可能产生新的消息）
    if (flushing) return;
    flushing = true;

    int read_pos = 0;
    while (read_pos < (int)buffer.size()) {
        const Message &msg = buffer[read_pos];
        read_pos++;

        Object *obj = ObjectDB::get_instance(msg.object_id);
        if (!obj) continue;  // 对象已被删除

        switch (msg.type) {
            case Message::TYPE_CALL:
                obj->call(msg.name, msg.args, msg.arg_count);
                break;

            case Message::TYPE_NOTIFICATION:
                obj->notification(msg.name.operator int());
                break;

            case Message::TYPE_SET:
                obj->set(msg.name, msg.args[0]);
                break;
        }
    }

    // 清空缓冲区
    buffer.clear();
    flushing = false;
}
```

### 使用场景详解

```
场景 1：_ready() 的延迟触发
  ┌──────────────────────────────────────────────┐
  │ add_child(node)                               │
  │   └── node._propagate_enter_tree()            │
  │         ├── ENTER_TREE 通知                    │
  │         └── MessageQueue.push_call("_ready")  │ ← 延迟调用
  │                                               │
  │ ... 当前帧继续处理其他节点 ...                 │
  │                                               │
  │ MessageQueue.flush()                          │
  │   └── node._ready()                           │ ← 在安全时机触发
  └──────────────────────────────────────────────┘

场景 2：queue_free() 延迟删除
  ┌──────────────────────────────────────────────┐
  │ _process(delta):                              │
  │   if health <= 0:                             │
  │     queue_free()                              │
  │     └── MessageQueue.push_call(this, "free") │ ← 标记但不删除
  │                                               │
  │   # 继续处理当前帧逻辑（安全）                │
  │   ...                                         │
  │                                               │
  │ MessageQueue.flush()                          │
  │   └── this->free()                            │ ← 帧末尾安全删除
  └──────────────────────────────────────────────┘

场景 3：call_deferred() 用户调用
  ┌──────────────────────────────────────────────┐
  │ # GDScript                                    │
  │ call_deferred("set_position", Vector2(100,0)) │
  │                                               │
  │ # 等价于                                       │
  │ MessageQueue.push_set(this, "position", ...)  │
  │                                               │
  │ # 在帧末尾安全设置属性                         │
  └──────────────────────────────────────────────┘
```

---

## 5. 场景加载与切换

### 场景切换 API

```cpp
// scene/main/scene_tree.h
class SceneTree : public MainLoop {
    // 切换场景的方法
    Error change_scene_to_file(const String &p_path);
    Error change_scene_to_packed(const Ref<PackedScene> &p_packed_scene);
    Node *get_current_scene() const;
    void unload_current_scene();
    void reload_current_scene();
};
```

### change_scene_to_file() 实现

```cpp
// scene/main/scene_tree.cpp（简化）
Error SceneTree::change_scene_to_file(const String &p_path) {
    // 1. 加载新场景
    Ref<PackedScene> new_scene = ResourceLoader::load(p_path);
    ERR_FAIL_COND_V(new_scene.is_null(), ERR_CANT_OPEN);

    // 2. 将场景切换请求加入队列
    //    不立即执行，在帧末尾安全时机处理
    SceneChangeRequest request;
    request.path = p_path;
    request.queue_free_previous = true;
    scene_change_queue.push_back(request);

    return OK;
}

// 在帧末尾处理场景切换队列
void SceneTree::_flush_scene_change_queue() {
    while (!scene_change_queue.empty()) {
        SceneChangeRequest &request = scene_change_queue.front();

        // 卸载当前场景
        if (current_scene) {
            if (request.queue_free_previous) {
                memdelete(current_scene);
            }
            current_scene = nullptr;
        }

        // 加载新场景
        Ref<PackedScene> scene = ResourceLoader::load(request.path);
        if (scene.is_valid()) {
            current_scene = scene->instantiate();
            root->add_child(current_scene);
            current_scene_path = request.path;
        }

        scene_change_queue.pop_front();
    }
}
```

### 场景切换时序图

```
change_scene_to_file("res://level_2.tscn") 调用后：

  ┌──────────────────────────────────────────────────────┐
  │                    当前帧                              │
  │                                                      │
  │  1. 请求加入队列                                      │
  │     scene_change_queue.push("level_2.tscn")          │
  │                                                      │
  │  2. 当前帧继续处理                                    │
  │     _process(delta) 正常执行                          │
  │     current_scene 仍然可用                            │
  │                                                      │
  │  3. MessageQueue.flush()                             │
  │     ...延迟调用...                                    │
  │                                                      │
  │  4. _flush_scene_change_queue()                      │
  │     ├── 删除旧 current_scene                         │
  │     │   ├── EXIT_TREE 通知（递归子节点）               │
  │     │   └── memdelete(current_scene)                 │
  │     ├── 加载 level_2.tscn                            │
  │     │   └── ResourceLoader::load()                   │
  │     ├── 实例化新场景                                  │
  │     │   └── PackedScene::instantiate()               │
  │     └── root->add_child(new_scene)                   │
  │         ├── ENTER_TREE 通知（递归子节点）              │
  │         └── READY 通知（延迟触发）                     │
  └──────────────────────────────────────────────────────┘
```

---

## 6. AutoLoad 系统

### AutoLoad 的设计目的

```
AutoLoad（自动加载）提供全局可访问的单例节点：

  问题：
    - 需要全局状态管理（如 GameManager、AudioManager）
    - 跨场景共享数据
    - 全局信号/事件总线

  解决方案：
    - 在引擎启动时自动加载指定场景/脚本为根节点的子节点
    - 通过节点名称全局访问

  SceneTree 根节点结构：
    root (Window)
    ├── AutoLoad_GameManager    ← 全局游戏管理器
    ├── AutoLoad_AudioManager   ← 全局音频管理器
    ├── AutoLoad_EventBus       ← 全局事件总线
    └── CurrentScene            ← 当前场景

  GDScript 中访问：
    GameManager.player_health = 100
    AudioManager.play_sound("jump")
```

### AutoLoad 加载流程

```cpp
// main/main.cpp（简化）
void MainLoop::setup_auto_loads() {
    // 1. 读取 project.godot 中的 [autoload] 配置
    // [autoload]
    // GameManager="*res://game_manager.tscn"
    // AudioManager="res://audio_manager.gd"

    // 2. 按配置顺序加载每个 AutoLoad
    for (const AutoLoadInfo &info : auto_loads) {
        // 加载场景或脚本
        Ref<PackedScene> scene = ResourceLoader::load(info.path);

        // 实例化
        Node *instance = scene->instantiate();
        instance->set_name(info.name);

        // 添加为根节点的子节点
        scene_tree->get_root()->add_child(instance);

        // 如果标记为单例（路径前缀 *），注册到 ScriptServer
        if (info.is_singleton) {
            ScriptServer::register_singleton(info.name, instance);
        }
    }
}
```

### AutoLoad 配置格式

```
project.godot 中的配置：

[autoload]

; 带 * 前缀 = 注册为全局单例（可在任何脚本中直接用名称访问）
GameManager="*res://singletons/game_manager.tscn"

; 不带 * 前缀 = 只作为根节点子节点，不注册单例
DebugOverlay="res://debug_overlay.tscn"

; 也可以直接加载脚本（会自动包装为 Node）
EventBus="*res://event_bus.gd"
```

---

## 7. 源码结构总览

### SceneTree 关键方法

```cpp
// scene/main/scene_tree.h 方法分类

class SceneTree : public MainLoop {
    // ====== 主循环接口 ======
    virtual void _initialize() override;
    virtual bool _process(double p_time) override;
    virtual void _finalize() override;

    // ====== 节点处理 ======
    void _process_physics(double p_time);
    void _process_idle(double p_time);
    void _ensure_process_order();
    bool _can_process(Node *p_node) const;

    // ====== 场景管理 ======
    Error change_scene_to_file(const String &p_path);
    Error change_scene_to_packed(const Ref<PackedScene> &p_packed_scene);
    Node *get_current_scene() const;
    void unload_current_scene();

    // ====== 组管理 ======
    void add_to_group(const StringName &p_group, Node *p_node);
    void remove_from_group(const StringName &p_group, Node *p_node);
    TypedArray<Node> get_nodes_in_group(const StringName &p_group);
    void call_group(const StringName &p_group, const StringName &p_method, ...);
    void notify_group(const StringName &p_group, int p_notification);

    // ====== 输入 ======
    void _process_input_events();
    void _input_event(const Ref<InputEvent> &p_event);

    // ====== 暂停 ======
    void set_pause(bool p_pause);
    bool is_paused() const;

    // ====== 物理参数 ======
    void set_physics_step(double p_step);
    double get_physics_step() const;
};
```

### 关键源文件

| 文件 | 路径 | 行数(约) | 说明 |
|------|------|---------|------|
| SceneTree 声明 | `scene/main/scene_tree.h` | 600 | SceneTree 类声明 |
| SceneTree 实现 | `scene/main/scene_tree.cpp` | 3000 | SceneTree 核心实现 |
| MainLoop 接口 | `core/object/main_loop.h` | 150 | 主循环抽象接口 |
| MainLoop 实现 | `main/main_loop.cpp` | 100 | 默认 MainLoop 工厂 |
| 引擎入口 | `main/main.cpp` | 3000 | 引擎启动和主循环 |
| MessageQueue | `core/object/message_queue.h` | 200 | 延迟调用队列 |

### 帧循环性能考量

```
性能热点和优化：

  1. 处理列表排序
     - 只在 process_order_dirty 时排序
     - 使用 SelfList 实现高效插入/删除
     - 避免 std::sort 的内存分配

  2. 物理步限制
     - 最多 8 步物理/帧
     - 防止螺旋死亡
     - 丢弃多余时间保证帧率

  3. 节点处理跳过
     - _can_process() 快速判断
     - 暂停时大量节点被跳过
     - DISABLED 节点完全不在处理列表中

  4. MessageQueue 批量处理
     - 所有延迟操作集中执行
     - 减少 CPU 缓存失效
     - 批量内存操作
```

---

## 帧循环架构总结图

```
                    SceneTree._process(time)
                             │
                 ┌───────────┼───────────┐
                 │           │           │
            ┌────▼────┐ ┌───▼────┐ ┌───▼─────┐
            │ 输入处理 │ │ 物理步 │ │ 处理步   │
            └────┬────┘ └───┬────┘ └───┬─────┘
                 │          │          │
            ┌────▼──────────▼──────────▼────┐
            │       MessageQueue.flush()     │
            └──────────────┬────────────────┘
                           │
                    ┌──────▼──────┐
                    │ 渲染提交     │
                    │ RS.sync()   │
                    │ Viewport    │
                    │ ._draw()    │
                    └─────────────┘
```

---

> 下一节：[03-视口系统](./03-viewport.md) - 深入分析 Viewport 的渲染目标、输入路由和摄像机关联机制。
