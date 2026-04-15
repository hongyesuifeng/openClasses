# 节点系统详解

> Node 是 Godot 引擎中最核心的类。几乎所有场景对象都直接或间接继承自 Node。本文深入分析 Node 类的源码实现，包括类继承体系、核心属性、树管理、通知机制、处理模式和分组系统。

---

## 目录

- [1. Node 类继承体系](#1-node-类继承体系)
- [2. 核心属性与数据成员](#2-核心属性与数据成员)
- [3. 树管理操作](#3-树管理操作)
- [4. _notification() 通知系统](#4-_notification-通知系统)
- [5. 处理模式（Process Mode）](#5-处理模式process-mode)
- [6. 场景树成员关系](#6-场景树成员关系)
- [7. 分组系统](#7-分组系统)
- [8. 源码结构总览](#8-源码结构总览)

---

## 1. Node 类继承体系

### 完整继承树

```
Object                                    ← 核心基类（引用计数、信号、属性系统）
└── Node                                  ← 场景节点基类（本节重点）
    ├── Node3D                            ← 3D 空间节点
    │   ├── VisualInstance3D              ← 可渲染 3D 节点
    │   │   ├── GeometryInstance3D
    │   │   │   ├── MeshInstance3D        ← 3D 网格渲染
    │   │   │   ├── MultiMeshInstance3D   ← 批量网格渲染
    │   │   │   ├── GPUParticles3D        ← GPU 粒子
    │   │   │   ├── CPUParticles3D        ← CPU 粒子
    │   │   │   ├── CSGShape3D            ← CSG 建模
    │   │   │   ├── FogVolume             ← 体积雾
    │   │   │   └── Decal                 ← 贴花
    │   │   ├── Light3D                   ← 灯光基类
    │   │   │   ├── DirectionalLight3D    ← 方向光
    │   │   │   ├── OmniLight3D           ← 点光源
    │   │   │   └── SpotLight3D           ← 聚光灯
    │   │   ├── ReflectionProbe           ← 反射探针
    │   │   └── VoxelGI                   ← 体素全局光照
    │   ├── Camera3D                      ← 3D 摄像机
    │   ├── CollisionObject3D             ← 碰撞对象基类
    │   │   ├── PhysicsBody3D             ← 物理刚体基类
    │   │   │   ├── StaticBody3D          ← 静态体
    │   │   │   ├── RigidBody3D           ← 刚体
    │   │   │   └── CharacterBody3D       ← 角色体
    │   │   └── Area3D                    ← 区域检测
    │   ├── Joint3D                       ← 关节
    │   ├── Path3D                        ← 路径
    │   ├── Skeleton3D                    ← 骨骼
    │   ├── AudioListener3D               ← 3D 音频监听器
    │   └── AnimationPlayer / Tree        ← 动画
    │
    ├── CanvasItem                        ← 2D 可绘制节点基类
    │   ├── Node2D                        ← 2D 空间节点
    │   │   ├── Sprite2D                  ← 2D 精灵
    │   │   ├── AnimatedSprite2D          ← 2D 动画精灵
    │   │   ├── TileMap                   ← 地图块
    │   │   ├── Polygon2D                 ← 2D 多边形
    │   │   ├── ParallaxLayer             ← 视差层
    │   │   ├── PathFollow2D              ← 2D 路径跟随
    │   │   └── AudioListener2D           ← 2D 音频监听
    │   ├── PhysicsBody2D                 ← 2D 物理体
    │   │   ├── StaticBody2D
    │   │   ├── RigidBody2D
    │   │   └── CharacterBody2D
    │   ├── CollisionObject2D             ← 2D 碰撞对象
    │   └── ...
    │
    ├── Control                           ← UI 控件基类
    │   ├── Button                        ← 按钮
    │   ├── Label                         ← 文本标签
    │   ├── Panel                          ← 面板
    │   ├──LineEdit                       ← 输入框
    │   ├──TextEdit                       ← 多行文本
    │   ├── Slider / ProgressBar          ← 滑块/进度条
    │   ├── Tree                          ← 树控件
    │   ├── ItemList                       ← 列表
    │   └── Container                      ← 容器布局
    │       ├── VBoxContainer             ← 垂直布局
    │       ├── HBoxContainer             ← 水平布局
    │       ├── GridContainer             ← 网格布局
    │       └── MarginContainer           ← 边距布局
    │
    ├── Viewport                          ← 视口
    │   └── Window                        ← 窗口
    │
    ├── AnimationPlayer                   ← 动画播放器
    ├── AnimationTree                     ← 动画树
    ├── CanvasLayer                       ← 2D 画布层
    ├── ResourcePreloader                 ← 资源预加载器
    ├── Timer                             ← 计时器
    ├── MultiplayerSpawner                ← 多人游戏生成器
    └── ... (更多节点类型)
```

### 继承层次的设计思路

```
层次设计原则：

Object                → 引擎最底层，提供属性系统、信号、序列化
  └── Node            → 场景系统，提供树管理、生命周期、处理回调
      ├── Node3D      → 3D 空间，提供 Transform3D、可见性
      ├── CanvasItem  → 2D 可绘制，提供 Canvas 变换、绘制 API
      │   └── Node2D  → 2D 空间，提供 Transform2D
      ├── Control     → UI 系统，提供布局、输入处理、主题
      └── Viewport    → 渲染目标，提供独立渲染管线
```

> 注意：CanvasItem 同时继承 Node 和包含 2D 渲染能力，而 Node2D 继承 CanvasItem 并添加 Transform2D。Control 也继承 CanvasItem，因此 UI 控件天然具有 2D 渲染能力。

---

## 2. 核心属性与数据成员

### Node 类核心成员变量

```cpp
// scene/main/node.h（简化，展示核心数据成员）
class Node : public Object {
    GDCLASS(Node, Object);

    // ====== 树结构 ======
    Node *parent = nullptr;              // 父节点指针
    List<Node *> children;               // 子节点列表（双向链表）
    HashMap<StringName, Node *> children_map;  // 名称 → 子节点映射（加速查找）
    StringName name;                     // 节点名称（在父节点下唯一）

    // ====== 场景树关系 ======
    SceneTree *tree = nullptr;           // 所属场景树（进入树后非空）

    // ====== 处理控制 ======
    ProcessMode process_mode = PROCESS_MODE_INHERIT;
    int process_priority = 0;
    bool process_thread_group_order = false;

    // ====== 处理状态 ======
    struct ProcessInfo {
        bool physics_process = false;    // 是否启动物理处理
        bool process = false;            // 是否启用普通处理
        bool physics_process_internal = false;
        bool process_internal = false;
    };
    ProcessInfo process_info;

    // ====== 状态标记 ======
    bool inside_tree = false;            // 是否在场景树中
    bool ready_first = true;             // 是否首次 ready
    bool block_locked = false;           // 是否被阻塞（用于信号阻塞）
    bool is_deleting = false;            // 是否正在删除

    // ====== 组成员关系 ======
    HashSet<StringName> group_set;       // 节点所属的组

    // ====== 信号/组/其他 ======
    HashMap<StringName, Signal> signals;
    Node *owner = nullptr;               // 场景所有者（用于序列化）

    // ====== 多线程处理 ======
    ProcessThreadGroup process_thread_group = PROCESS_THREAD_GROUP_INHERIT;
};
```

### 属性说明表

| 属性 | 类型 | 说明 | 默认值 |
|------|------|------|--------|
| `name` | StringName | 节点名称，在同级兄弟中唯一 | 自动生成 |
| `process_mode` | ProcessMode | 处理模式 | INHERIT |
| `process_priority` | int | 处理优先级（小的先执行） | 0 |
| `process_thread_group` | ProcessThreadGroup | 多线程处理组 | INHERIT |
| `owner` | Node* | 场景所有者 | nullptr |

---

## 3. 树管理操作

### add_child() 源码分析

`add_child()` 是将一个节点添加为另一个节点子节点的核心方法：

```cpp
// scene/main/node.cpp（简化 + 注释）
void Node::add_child(Node *p_child, bool p_force_readable_name, InternalMode p_internal) {
    ERR_FAIL_COND_MSG(!p_child, "Cannot add nullptr as a child.");
    ERR_FAIL_COND_MSG(p_child == this, "Cannot add a node to itself as a child.");

    // 检查是否已经是子节点
    ERR_FAIL_COND_MSG(p_child->parent, "Cannot add child: already has a parent.");

    // 检查名称唯一性，冲突时自动重命名
    if (p_force_readable_name) {
        p_child->set_name(p_child->get_class());
    }
    _validate_child_name(p_child, p_internal);

    // 添加到子节点列表
    children.push_back(p_child);
    p_child->parent = this;
    children_map[p_child->name] = p_child;

    // 通知子节点已被父化
    p_child->_notification(NOTIFICATION_PARENTED);

    // 如果当前节点已在场景树中，立即将子节点也加入树
    if (is_inside_tree()) {
        // 如果子节点未被阻塞（通常 scene instantiation 时会阻塞）
        if (!p_child->block_locked) {
            p_child->_propagate_enter_tree();
        }
    }
}
```

### add_child 的时序图

```
parent.add_child(child) 调用流程：

  parent                          child                      SceneTree
    │                               │                           │
    │── 检查 child 有效性 ──────────│                           │
    │                               │                           │
    │── 设置名称唯一性 ─────────────│                           │
    │                               │                           │
    │── children.push_back(child) ─│                           │
    │                               │                           │
    │── child->parent = this ──────│                           │
    │                               │                           │
    │── child.NOTIFICATION_PARENTED │                           │
    │                               │                           │
    │── if is_inside_tree(): ──────│                           │
    │                               │                           │
    │   └── child._propagate_enter_tree()                      │
    │       ├── ENTER_TREE (child)                              │
    │       ├── ENTER_TREE (递归子节点)                          │
    │       └── push_call(child, "_ready") → MessageQueue      │
    │                               │                           │
    │── 发出 child_entered_tree 信号 │                           │
    │                               │                           │
```

### remove_child() 源码分析

```cpp
// scene/main/node.cpp（简化）
void Node::remove_child(Node *p_child) {
    ERR_FAIL_COND_MSG(!p_child, "Cannot remove nullptr child.");
    ERR_FAIL_COND_MSG(p_child->parent != this, "Cannot remove child that is not mine.");

    // 如果子节点在场景树中，先让它退出树
    if (is_inside_tree()) {
        p_child->_propagate_exit_tree();
    }

    // 通知子节点已被取消父化
    p_child->_notification(NOTIFICATION_UNPARENTED);

    // 从列表中移除
    children.remove(p_child);  // O(1) 操作（链表）
    children_map.erase(p_child->name);
    p_child->parent = nullptr;

    // 发出信号
    emit_signal(SNAME("child_exiting_tree"), p_child);
}
```

### 其他树操作方法

```cpp
// 查找操作
Node *get_child(int p_index) const;              // 按索引获取子节点
Node *get_node(const NodePath &p_path) const;    // 按路径获取节点（支持 ".." 和 "/"）
Node *find_child(const String &p_pattern,        // 按名称模式搜索
                 bool p_recursive = true,
                 bool p_owned = true) const;
bool has_node(const NodePath &p_path) const;     // 检查路径是否存在
int get_child_count() const;                      // 子节点数量

// 路径示例
get_node("Player/Camera3D")     // 绝对路径
get_node("../Sibling")          // 相对路径（.. = 父节点）
get_node("/root")               // 根节点

// 获取节点路径（在树中的完整路径）
NodePath get_path() const;      // 返回如 "/root/Scene/Player"
NodePath get_path_to(const Node *p_node) const;  // 获取到目标节点的相对路径
```

### find_child 的实现

```cpp
// scene/main/node.cpp（简化）
Node *Node::find_child(const String &p_pattern, bool p_recursive, bool p_owned) const {
    for (const List<Node *>::Element *E = children.front(); E; E = E->next()) {
        Node *child = E->get();

        if (!p_owned || child->get_owner() == get_owner() || !get_owner()) {
            // 检查名称是否匹配模式
            if (p_pattern.is_empty() || child->get_name().match(p_pattern)) {
                return child;
            }
        }

        // 递归搜索子节点
        if (p_recursive) {
            Node *found = child->find_child(p_pattern, p_recursive, p_owned);
            if (found) {
                return found;
            }
        }
    }
    return nullptr;
}
```

---

## 4. _notification() 通知系统

### 通知机制的设计哲学

Godot 选择通知系统而非多个虚函数的原因：

```
方案 1：多个虚函数（Unity 风格）
    virtual void _enter_tree() {}
    virtual void _ready() {}
    virtual void _process(double delta) {}
    virtual void _physics_process(double delta) {}
    ...
    缺点：每添加一个通知就要改 Node 类接口

方案 2：单一 _notification() 方法（Godot 选择）
    virtual void _notification(int p_what) {
        switch (p_what) {
            case NOTIFICATION_ENTER_TREE: ...
            case NOTIFICATION_READY: ...
            case NOTIFICATION_PROCESS: ...
        }
    }
    优点：
      - 添加新通知不需要修改接口
      - 子类可以方便地拦截所有通知
      - 可以用 if-else 或 match 处理多个通知
      - 源码中可以看到所有通知处理集中在一处
```

### 通知常量定义

```cpp
// scene/main/node.h（完整通知常量列表）
class Node : public Object {
public:
    enum {
        // ====== 生命周期通知 ======
        NOTIFICATION_ENTER_TREE = 10,     // 进入场景树
        NOTIFICATION_EXIT_TREE = 11,      // 退出场景树
        NOTIFICATION_READY = 13,          // 节点就绪（只触发一次）
        NOTIFICATION_PAUSED = 14,         // 游戏暂停
        NOTIFICATION_UNPAUSED = 15,       // 游戏恢复

        // ====== 处理通知 ======
        NOTIFICATION_PHYSICS_PROCESS = 16, // 物理帧处理
        NOTIFICATION_PROCESS = 17,         // 渲染帧处理

        // ====== 父节点变化通知 ======
        NOTIFICATION_PARENTED = 18,       // 被添加为子节点
        NOTIFICATION_UNPARENTED = 19,     // 被从父节点移除

        // ====== 场景实例化通知 ======
        NOTIFICATION_INSTANCED = 20,      // 被实例化（非根节点）
        NOTIFICATION_DEBLOCKED = 21,      // 信号阻塞解除

        // ====== 内部处理通知 ======
        NOTIFICATION_INTERNAL_PHYSICS_PROCESS = 25,  // 内部物理处理
        NOTIFICATION_INTERNAL_PROCESS = 26,          // 内部普通处理

        // ====== 配置变化通知 ======
        NOTIFICATION_WM_MOUSE_ENTER = 1002,   // 鼠标进入窗口
        NOTIFICATION_WM_MOUSE_EXIT = 1003,    // 鼠标离开窗口
        NOTIFICATION_WM_WINDOW_FOCUS_IN = 1004,
        NOTIFICATION_WM_WINDOW_FOCUS_OUT = 1005,

        // ====== 编辑器专用 ======
        NOTIFICATION_EDITOR_PRE_SAVE = 9001,
        NOTIFICATION_EDITOR_POST_SAVE = 9002,
    };
};
```

### _notification 在源码中的实现

```cpp
// scene/main/node.cpp（简化）
void Node::_notification(int p_notification) {
    switch (p_notification) {
        case NOTIFICATION_READY: {
            // 首次 ready 处理
            if (ready_first) {
                ready_first = false;
                _ready();  // 调用 GDScript 的 _ready()
            }
        } break;

        case NOTIFICATION_PROCESS: {
            double delta = process_time;
            _process(delta);  // 调用 GDScript 的 _process()
        } break;

        case NOTIFICATION_PHYSICS_PROCESS: {
            double delta = physics_process_time;
            _physics_process(delta);  // 调用 GDScript 的 _physics_process()
        } break;

        case NOTIFICATION_ENTER_TREE: {
            // 检查并处理子节点的 ready
            _enter_tree();
        } break;

        case NOTIFICATION_EXIT_TREE: {
            _exit_tree();
            // 清理场景树引用
            tree = nullptr;
            inside_tree = false;
        } break;
    }
}
```

### _propagate_enter_tree() 传播机制

```cpp
// scene/main/node.cpp（简化）
void Node::_propagate_enter_tree() {
    // 1. 设置场景树引用
    tree = get_parent()->get_tree();
    inside_tree = true;

    // 2. 通知自己（DFS 先序）
    _notification(NOTIFICATION_ENTER_TREE);

    // 3. 递归通知子节点
    for (List<Node *>::Element *E = children.front(); E; E = E->next()) {
        Node *child = E->get();
        child->_propagate_enter_tree();
    }

    // 4. 延迟触发 ready（通过 MessageQueue）
    if (ready_first) {
        // ready 在所有 ENTER_TREE 完成后通过 MessageQueue 触发
        MessageQueue::get_singleton()->push_call(this, SNAME("_ready"));
    }
}
```

### 通知传播的完整时序

```
假设执行 parent.add_child(child_A)，其中 child_A 包含 child_B：

时间 →  t1          t2          t3          t4          t5

child_A  │ENTER_TREE │           │           │READY      │
child_B  │           │ENTER_TREE │           │READY      │
parent   │           │           │child_     │           │
         │           │           │entered_   │           │
         │           │           │tree信号   │           │

详细时序：
  t1: child_A._propagate_enter_tree()
      → child_A.INSIDE_TREE = true
      → child_A._notification(NOTIFICATION_ENTER_TREE)

  t2: child_B._propagate_enter_tree()（child_A 的子节点）
      → child_B.INSIDE_TREE = true
      → child_B._notification(NOTIFICATION_ENTER_TREE)

  t3: parent.emit_signal("child_entered_tree", child_A)

  t4: MessageQueue flush
      → child_B._notification(NOTIFICATION_READY)  ← 子节点先 ready
      → child_A._notification(NOTIFICATION_READY)  ← 父节点后 ready
```

---

## 5. 处理模式（Process Mode）

### ProcessMode 枚举

```cpp
// scene/main/node.h
enum ProcessMode {
    PROCESS_MODE_INHERIT,    // 继承父节点的处理模式
    PROCESS_MODE_PAUSABLE,   // 游戏暂停时停止处理（默认行为）
    PROCESS_MODE_WHEN_PAUSED, // 只在游戏暂停时处理
    PROCESS_MODE_ALWAYS,     // 始终处理（暂停也不影响）
    PROCESS_MODE_DISABLED,   // 完全禁用处理
};
```

### 处理模式的级联逻辑

```
场景树暂停状态 = SceneTree.paused

确定节点是否处理的规则：

  1. DISABLED → 不处理（任何情况）
  2. INHERIT → 使用父节点的处理模式
     如果所有祖先都是 INHERIT，最终使用 PAUSABLE
  3. PAUSABLE → 未暂停时处理
  4. WHEN_PAUSED → 暂停时处理
  5. ALWAYS → 始终处理

示例：

  SceneTree.paused = true

  Root (INHERIT → PAUSABLE)     ← 不处理
  ├── PauseMenu (ALWAYS)         ← 处理（用于暂停菜单交互）
  │   ├── ResumeBtn (INHERIT)    ← 处理（继承 ALWAYS）
  │   └── QuitBtn (INHERIT)      ← 处理（继承 ALWAYS）
  ├── Player (INHERIT → PAUSABLE) ← 不处理
  └── GameWorld (INHERIT → PAUSABLE) ← 不处理
```

### process_priority 优先级

```cpp
// 处理优先级控制节点的执行顺序
// 数值越小越先执行，默认为 0
// 用于控制同一帧中多个节点的处理顺序

// 使用场景：
//   - AI 决策应在角色移动之前
//   - 摄像机跟随应在角色移动之后
//   - 输入处理应在逻辑更新之前

void Node::set_process_priority(int p_priority) {
    process_priority = p_priority;
    // SceneTree 会在下一帧重新排序处理列表
    if (tree) {
        tree->_process_priority_changed(this);
    }
}
```

```
处理优先级示例（每帧执行顺序）：

  priority = -100: InputManager    ← 最先执行
  priority =    0: Enemy           ← 默认优先级
  priority =    0: Player          ← 同优先级按添加顺序
  priority =   10: CameraFollow    ← 在所有逻辑之后
  priority =  100: HUD             ← 最后更新 UI
```

### 源码中的处理列表排序

```cpp
// scene/main/scene_tree.cpp（简化）
void SceneTree::_process_priority_changed(Node *p_node) {
    // 标记处理列表需要重新排序
    process_order_dirty = true;
}

// 在下一帧处理前排序
void SceneTree::_ensure_process_order() {
    if (process_order_dirty) {
        // 按优先级排序
        process_nodes.sort_custom<ProcessNodeComparator>();
        physics_process_nodes.sort_custom<ProcessNodeComparator>();
        process_order_dirty = false;
    }
}
```

---

## 6. 场景树成员关系

### is_inside_tree() 与 get_tree()

```cpp
// 检查节点是否在场景树中
bool Node::is_inside_tree() const {
    return inside_tree;
}

// 获取场景树（必须先检查 is_inside_tree()）
SceneTree *Node::get_tree() const {
    ERR_FAIL_COND_V_MSG(!inside_tree, nullptr,
        "Node is not inside the tree. Use is_inside_tree() to check.");
    return tree;
}
```

### 进入/退出场景树的状态变化

```
节点状态转换图：

                    add_child()
  [不在树中] ──────────────────→ [在树中]
      ↑                              │
      │  remove_child()              │
      │←─────────────────────────────┘

  进入树时发生的事：
    1. tree = parent->tree
    2. inside_tree = true
    3. NOTIFICATION_ENTER_TREE
    4. 延迟 NOTIFICATION_READY（如果是首次）
    5. 添加到 SceneTree 的处理列表

  退出树时发生的事：
    1. NOTIFICATION_EXIT_TREE（先自己，再递归子节点）
    2. tree = nullptr
    3. inside_tree = false
    4. 从 SceneTree 的处理列表中移除
    5. 清理信号连接
```

### queue_free() 延迟删除

```cpp
// scene/main/node.cpp
void Node::queue_free() {
    // 如果不在树中，直接删除
    if (!is_inside_tree()) {
        memdelete(this);
        return;
    }

    // 在树中，延迟到帧末尾删除
    MessageQueue::get_singleton()->push_call(this, SNAME("free"));
    is_deleting = true;
}

// 为什么用 queue_free 而非直接 free：
// 1. 避免在 _process() 中删除自己导致迭代器失效
// 2. 保证当前帧的所有通知都能正常处理完
// 3. MessageQueue 在帧末尾 flush 时安全删除
```

---

## 7. 分组系统

### 分组的基本概念

分组（Group）是 Godot 提供的一种**非层级**的节点组织方式。一个节点可以属于多个分组，常用于：

```
分组用途：
  - 扮演特定角色：add_to_group("enemies")
  - 触发特定事件：get_tree().call_group("enemies", "alert")
  - 批量操作：get_tree().get_nodes_in_group("collectibles")
  - 碰撞过滤：通过碰撞层/掩码（与分组不同但概念类似）
```

### 源码实现

```cpp
// scene/main/node.cpp
void Node::add_to_group(const StringName &p_identifier, bool p_persistent) {
    // 添加到节点的组集合
    group_set.insert(p_identifier);

    // 如果已在树中，同时注册到 SceneTree 的组映射
    if (tree) {
        tree->add_to_group(p_identifier, this, p_persistent);
    }
}

void Node::remove_from_group(const StringName &p_identifier) {
    group_set.erase(p_identifier);
    if (tree) {
        tree->remove_from_group(p_identifier, this);
    }
}

bool Node::is_in_group(const StringName &p_identifier) const {
    return group_set.has(p_identifier);
}
```

### SceneTree 中的组管理

```cpp
// scene/main/scene_tree.h（简化）
class SceneTree : public MainLoop {
    // 组名 → 节点列表的映射
    HashMap<StringName, Group> group_map;

    struct Group {
        HashSet<Node *> nodes;    // 组中的节点集合
        bool changed = false;     // 是否在本帧修改过
    };

public:
    // 获取组中所有节点
    TypedArray<Node> get_nodes_in_group(const StringName &p_group);

    // 对组中所有节点调用方法
    void call_group(const StringName &p_group, const StringName &p_method,
                    const Variant **p_args, int p_argcount);

    // 通知组中所有节点
    void notify_group(const StringName &p_group, int p_notification);

    // 设置组中所有节点的暂停状态
    void set_group_pause(const StringName &p_group, bool p_paused);
};
```

### 分组操作示例

```
分组操作的时间复杂度分析：

操作                          复杂度         说明
─────────────────────────────────────────────────────
add_to_group()               O(1)           HashMap 插入
remove_from_group()          O(1)           HashMap 删除
is_in_group()                O(1)           HashMap 查找
get_nodes_in_group()         O(n)           n = 组中节点数
call_group()                 O(n)           遍历组中所有节点

性能注意事项：
  - 分组不是树的替代品，不要用分组代替父子关系
  - call_group() 每帧调用时注意性能
  - 大量节点的组操作可能影响帧率
```

---

## 8. 源码结构总览

### node.h 关键方法分类

```cpp
// scene/main/node.h 方法分类（按功能）

class Node : public Object {
    // ====== 生命周期 ======
    virtual void _enter_tree();
    virtual void _exit_tree();
    virtual void _ready();
    virtual void _process(double p_delta);
    virtual void _physics_process(double p_delta);
    virtual void _notification(int p_what);

    // ====== 树管理 ======
    void add_child(Node *p_child, bool p_force_readable_name = false);
    void remove_child(Node *p_child);
    Node *get_child(int p_index) const;
    int get_child_count() const;
    Node *get_node(const NodePath &p_path) const;
    Node *find_child(const String &p_pattern, ...) const;
    NodePath get_path() const;
    NodePath get_path_to(const Node *p_node) const;

    // ====== 处理控制 ======
    void set_process(bool p_process);
    void set_physics_process(bool p_physics_process);
    void set_process_mode(ProcessMode p_mode);
    void set_process_priority(int p_priority);
    bool is_processing() const;
    bool is_physics_processing() const;

    // ====== 分组 ======
    void add_to_group(const StringName &p_identifier, bool p_persistent = false);
    void remove_from_group(const StringName &p_identifier);
    bool is_in_group(const StringName &p_identifier) const;

    // ====== 场景树 ======
    SceneTree *get_tree() const;
    bool is_inside_tree() const;

    // ====== 删除 ======
    void queue_free();

    // ====== 查找/移动 ======
    void move_child(Node *p_child, int p_index);
    int get_index() const;

    // ====== 所有者 ======
    void set_owner(Node *p_owner);
    Node *get_owner() const;

    // ====== 信号 ======
    // child_entered_tree(Node *)
    // child_exiting_tree(Node *)
    // ready()
    // renamed()
    // tree_entered()
    // tree_exiting()
    // tree_exited()
};
```

### 关键源文件

| 文件 | 行数 | 说明 |
|------|------|------|
| `scene/main/node.h` | ~900 | Node 类声明，包含所有成员变量和方法 |
| `scene/main/node.cpp` | ~5500 | Node 类实现，引擎最长的单文件之一 |
| `scene/register_scene_types.cpp` | ~800 | 注册所有场景相关类到 ClassDB |

---

## 关键设计总结

| 设计决策 | Godot 选择 | 替代方案 | 优缺点 |
|---------|-----------|---------|--------|
| 通知系统 | `_notification(int)` | 多个虚函数 | 集中管理，扩展方便 |
| 子节点存储 | `List<Node*>` 双向链表 | `Vector<Node*>` 数组 | 插入/删除 O(1)，随机访问 O(n) |
| 名称查找 | `HashMap<StringName, Node*>` | 线性搜索 | O(1) 查找 |
| 处理模式 | 级联继承 | 全局开关 | 灵活的暂停/恢复控制 |
| 延迟删除 | `queue_free()` + MessageQueue | 引用计数归零立即删除 | 安全，避免迭代器失效 |
| 组管理 | SceneTree 全局 HashMap | 节点本地存储 | O(1) 查询，但需同步 |

---

> 下一节：[02-场景树与主循环](./02-scene-tree.md) - 深入分析 SceneTree 类和帧循环的完整实现。
