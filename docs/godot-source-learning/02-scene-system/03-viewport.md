# 视口系统

> Viewport 是 Godot 中极其重要的类，它同时承担渲染目标、输入路由器、音频监听器和节点子树容器四个核心角色。本文深入分析 Viewport 的源码实现，包括渲染管线、输入事件传播、摄像机关联和 2D/3D 渲染机制。

---

## 目录

- [1. Viewport 类概览](#1-viewport-类概览)
- [2. 渲染目标与纹理](#2-渲染目标与纹理)
- [3. 输入事件传播](#3-输入事件传播)
- [4. 摄像机关联与渲染](#4-摄像机关联与渲染)
- [5. 2D 渲染机制](#5-2d-渲染机制)
- [6. 3D 渲染机制](#6-3d-渲染机制)
- [7. SubViewport 与离屏渲染](#7-subviewport-与离屏渲染)
- [8. Window 类](#8-window-类)
- [9. 源码结构总览](#9-源码结构总览)

---

## 1. Viewport 类概览

### 继承体系

```
Object
└── Node
    └── Viewport                ← 视口基类（本节重点）
        └── Window              ← 窗口类（有操作系统窗口关联）
```

### Viewport 的四大职责

```
┌─────────────────────────────────────────────────────────┐
│                     Viewport                             │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐                     │
│  │  1. 渲染目标  │  │  2. 输入路由  │                     │
│  │  Render Target│  │  Input Route  │                     │
│  │              │  │              │                      │
│  │  可渲染区域   │  │  事件接收     │                     │
│  │  渲染纹理     │  │  2D 拾取     │                     │
│  │  2D/3D 渲染   │  │  3D 射线     │                     │
│  │              │  │  GUI 分发     │                     │
│  └──────────────┘  └──────────────┘                     │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐                     │
│  │  3. 音频监听  │  │  4. 节点子树  │                     │
│  │  Audio Listen │  │  Node Subtree │                     │
│  │              │  │              │                      │
│  │  2D/3D 监听器 │  │  独立坐标空间 │                     │
│  │  位置/方向    │  │  子节点管理   │                     │
│  │              │  │  渲染隔离     │                     │
│  └──────────────┘  └──────────────┘                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Viewport 核心成员

```cpp
// scene/main/viewport.h（简化）
class Viewport : public Node {
    GDCLASS(Viewport, Node);

    // ====== 渲染相关 ======
    Size2i size;                           // 视口尺寸（像素）
    RID viewport_render_target;            // RenderingServer 中的渲染目标 RID
    RID canvas_item;                       // Canvas 项目 RID（用于 2D 渲染）

    bool render_target_clear_requested = false;
    bool render_target_update_mode = RS::VIEWPORT_UPDATE_WHEN_VISIBLE;

    // ====== 世界与场景 ======
    World2D *world_2d = nullptr;           // 2D 世界（Canvas、物理空间）
    Ref<World3D> world_3d;                 // 3D 世界（场景、物理空间）

    // ====== 摄像机 ======
    Camera3D *camera_3d = nullptr;         // 当前活跃的 3D 摄像机
    bool own_world_3d = false;             // 是否拥有独立的 3D 世界

    // ====== 输入 ======
    bool handle_input_locally = true;
    void *_input_group = nullptr;          // _input 回调组
    void *_gui_input_group = nullptr;      // _gui_input 回调组
    void *_unhandled_input_group = nullptr; // _unhandled_input 回调组

    // ====== GUI (仅 Window 子类完整实现) ======
    Control *gui_focus_owner = nullptr;    // 当前焦点控件
    bool gui_disable_input = false;

    // ====== 渲染配置 ======
    RS::ViewportScaling3DMode scaling_3d_mode = RS::VIEWPORT_SCALING_3D_MODE_OFF;
    float scaling_3d_scale = 1.0;
    RS::ViewportScreenSpaceAA screen_space_aa = RS::VIEWPORT_SCREEN_SPACE_AA_DISABLED;

    // ====== 音频 ======
    bool is_audio_listener_2d = false;
    bool is_audio_listener_3d = false;

    // ====== 物理拾取 ======
    PhysicsDirectSpaceState2D *physics_space_2d_override = nullptr;
    PhysicsDirectSpaceState3D *physics_space_3d_override = nullptr;

    // ====== 渲染层级 ======
    struct CanvasKey {
        int layer;
        RID canvas;
        bool operator<(const CanvasKey &p_other) const { return layer < p_other.layer; }
    };
    // Canvas 层排序映射
    RBMap<CanvasKey, CanvasData> canvas_map;
};
```

---

## 2. 渲染目标与纹理

### 渲染目标的创建

```cpp
// scene/main/viewport.cpp（简化）
void Viewport::_create_render_target() {
    // 1. 在 RenderingServer 中创建渲染目标
    RID rid_rs = RS::get_singleton();  // RenderingServer 单例

    viewport_render_target = rid_rs.viewport_create();

    // 2. 设置渲染目标参数
    rid_rs.viewport_set_size(viewport_render_target, size.x, size.y);
    rid_rs.viewport_set_update_mode(viewport_render_target, update_mode);
    rid_rs.viewport_set_clear_mode(viewport_render_target, clear_mode);

    // 3. 如果有自己的 3D 世界，创建 3D 渲染场景
    if (world_3d.is_valid()) {
        RID scenario = world_3d->get_scenario();
        rid_rs.viewport_set_scenario(viewport_render_target, scenario);
    }

    // 4. 创建 2D Canvas
    if (world_2d) {
        RID canvas = world_2d->get_canvas();
        rid_rs.viewport_attach_canvas(viewport_render_target, canvas);
    }

    // 5. 设置渲染目标纹理
    render_target_texture = rid_rs.viewport_get_render_target(viewport_render_target);
}
```

### 渲染目标的 RID 管理

```
Viewport 与 RenderingServer 的关系：

  Viewport (场景层)                    RenderingServer (渲染层)
  ┌─────────────────┐                 ┌─────────────────────┐
  │ viewport_       │──── RID ──────→│ RenderingServer 内部 │
  │ render_target   │                 │ 渲染目标对象          │
  │                 │                 │                     │
  │ world_2d ───────│─── RID ──────→│ Canvas 对象          │
  │ world_3d ───────│─── RID ──────→│ Scenario 对象        │
  │ camera_3d ──────│─── RID ──────→│ Camera 对象          │
  └─────────────────┘                 └─────────────────────┘

  RID (Resource ID) 是 Godot 的 Server 架构核心：
    - 场景层通过 RID 引用渲染层的对象
    - 场景层不直接操作 GPU，通过 RID 委托给 Server
    - Server 层可以多线程处理渲染命令
```

### 渲染目标纹理的用途

```
Viewport 纹理的使用：

  1. 直接显示（Window 子类）
     Window → 操作系统窗口 → DisplayServer → 显示到屏幕

  2. 作为纹理引用
     SubViewport → ViewportTexture → Sprite2D.texture
     SubViewport → ViewportTexture → MeshInstance3D 材质

  3. 后处理链
     SubViewport1 → Render → SubViewport2 (shader) → 显示

使用示例（GDScript）：
  @onready var viewport = $SubViewport
  @onready var sprite = $Sprite2D

  func _ready():
      sprite.texture = viewport.get_texture()
```

### 渲染更新模式

```cpp
// RenderingServer 中的更新模式
enum ViewportUpdateMode {
    VIEWPORT_UPDATE_DISABLED,      // 不更新（静态渲染）
    VIEWPORT_UPDATE_ONCE,          // 只更新一次
    VIEWPORT_UPDATE_WHEN_VISIBLE,  // 可见时更新（默认）
    VIEWPORT_UPDATE_WHEN_PARENT_VISIBLE, // 父节点可见时更新
    VIEWPORT_UPDATE_ALWAYS,        // 始终更新
};

// 性能影响：
// DISABLED → 最高性能，不消耗渲染资源
// ONCE → 适合静态场景（如菜单背景）
// WHEN_VISIBLE → 默认，不可见时跳过渲染
// ALWAYS → 最耗性能，始终渲染（适合截图/录制）
```

---

## 3. 输入事件传播

### 输入事件的完整传播路径

```
操作系统输入事件传播路径：

  操作系统（键盘/鼠标/触摸/手柄）
      │
      ▼
  DisplayServer.get_events()
      │
      ▼
  Input.parse_input_event()
      │
      ├── 输入映射检查（InputMap）
      │   └── 检查 action 绑定
      │
      ├── _input() 回调
      │   └── SceneTree 通知所有注册 _input 的节点
      │       └── 从后向前通知
      │
      └── SceneTree._input_event()
          │
          ▼
      Root Viewport._process_input_event()
          │
          ├── SubViewport 传递
          │   └── 递归传递给子视口
          │
          ├── _gui_input 处理
          │   └── Control 节点系统
          │
          ├── _unhandled_input 处理
          │   └── 未被 GUI 处理的输入
          │
          └── Shortcut 匹配
```

### Viewport 中的输入处理源码

```cpp
// scene/main/viewport.cpp（简化）
void Viewport::_process_input_event(const Ref<InputEvent> &p_event) {
    // 1. 本地输入处理
    if (handle_input_locally) {
        _push_input(p_event);
    }

    // 2. 传递给子 Viewport
    for (Viewport *sub_viewport : sub_viewports) {
        sub_viewport->_process_input_event(p_event);
    }
}

void Viewport::_push_input(const Ref<InputEvent> &p_event) {
    // 阶段 1: _gui_input（GUI 系统处理）
    if (!gui_disable_input) {
        _gui_input_event(p_event);
    }

    // 如果 GUI 已消费事件，不再传播
    if (p_event->is_accepted()) return;

    // 阶段 2: _unhandled_input
    // 通知所有注册了 _unhandled_input 的节点
    _call_input_handlers("_unhandled_input", p_event);

    if (p_event->is_accepted()) return;

    // 阶段 3: _unhandled_key_input（仅键盘事件）
    if (p_event->is_class("InputEventKey")) {
        _call_input_handlers("_unhandled_key_input", p_event);
    }
}
```

### 2D 输入拾取（Picking）

```
2D 输入拾取的原理（从后向前检测）：

  Viewport 中的节点渲染顺序（z_index 排序后）：

  最后渲染的（最前面）  ← 最先检测
  ┌──────────┐
  │ Button   │ ← 鼠标在 Button 上 → Button 处理事件
  └──────────┘
  ┌──────────┐
  │ Panel    │ ← 鼠标不在 Button 上但在 Panel 上 → Panel 处理
  └──────────┘
  ┌──────────┐
  │ Sprite   │ ← 不可点击（不是 Control）→ 跳过
  └──────────┘
  最先渲染的（最后面）    ← 最后检测

  检测流程：
  1. 收集所有 CanvasItem 节点
  2. 按 z_index 和渲染顺序排序
  3. 从后向前遍历
  4. 对每个 CanvasItem 执行点检测
     ├── Control: 检查矩形区域
     └── 其他: 检查碰撞形状
  5. 找到第一个命中节点
  6. 触发 _gui_input
```

### 3D 输入拾取（Raycast）

```
3D 输入拾取的原理（射线检测）：

  鼠标位置 → 屏幕坐标 (x, y)
      │
      ▼
  通过 Camera 的逆投影矩阵转换为射线
      │
      ▼
  起点 (origin) + 方向 (direction)
      │
      ▼
  PhysicsServer3D 射线检测
      │
      ├── 检测所有 CollisionObject3D
      ├── 返回最近的碰撞点
      └── 返回碰撞的 Object

  源码流程：
  Viewport._process_input_event()
    → Camera3D.project_ray_origin(mouse_pos)
    → Camera3D.project_ray_normal(mouse_pos)
    → PhysicsDirectSpaceState3D.intersect_ray(origin, direction)
    → CollisionObject3D._input_event()
```

---

## 4. 摄像机关联与渲染

### Camera3D 的注册与选择

```cpp
// scene/main/viewport.cpp（简化）
void Viewport::_camera_3d_changed(Camera3D *p_camera) {
    if (p_camera == camera_3d) {
        // 当前摄像机发生变化
        _update_camera_3d();
    }
}

void Viewport::_register_camera_3d(Camera3D *p_camera) {
    // 将摄像机添加到候选列表
    camera_3d_set.insert(p_camera);

    // 如果摄像机标记为 current，设为活跃摄像机
    if (p_camera->is_current()) {
        _set_current_camera_3d(p_camera);
    }
}

void Viewport::_set_current_camera_3d(Camera3D *p_camera) {
    camera_3d = p_camera;

    // 更新 RenderingServer 中的摄像机
    if (p_camera) {
        RenderingServer::get_singleton()->viewport_set_camera(
            viewport_render_target,
            p_camera->get_camera_rid()
        );
    }
}
```

### Camera2D 与 Camera3D 的区别

```
Camera2D:
  - 直接修改 Viewport 的 Canvas 变换
  - 通过 Canvas 变换实现滚动/缩放/旋转
  - 不需要 RID，只设置 Viewport 的 canvas_transform
  - 支持平滑跟随、限制区域、拖拽边距

Camera3D:
  - 通过 RID 在 RenderingServer 中注册
  - 提供 View Matrix 和 Projection Matrix
  - 支持透视投影（Perspective）和正交投影（Orthographic）
  - 视口必须关联 Camera3D 才能渲染 3D 场景

关系图：
  Viewport
  ├── Camera2D → 修改 viewport.canvas_transform
  │   └── 影响 2D Canvas 的显示变换
  └── Camera3D → RS.viewport_set_camera(camera_rid)
      └── 在 RenderingServer 中设置 view/projection 矩阵
```

---

## 5. 2D 渲染机制

### World2D 的结构

```cpp
// scene/resources/world_2d.h
class World2D : public Resource {
    GDCLASS(World2D, Resource);

    RID canvas;               // RenderingServer 中的 Canvas RID
    RID space;                // PhysicsServer2D 中的物理空间 RID
    RID navigation_map;       // NavigationServer 中的导航地图 RID

    // 2D 导航地图
    RID navigation_map;
};
```

### Canvas 渲染架构

```
2D 渲染层次：

  Viewport
  └── World2D
      ├── Canvas RID → RenderingServer
      │
      ├── CanvasLayer (z_index = -1)   ← 背景层
      │   └── ParallaxBackground
      │       └── ParallaxLayer
      │
      ├── CanvasLayer (z_index = 0)    ← 默认层
      │   └── Node2D 节点们
      │       ├── TileMap
      │       ├── Sprite2D
      │       └── AnimatedSprite2D
      │
      └── CanvasLayer (z_index = 1)    ← 前景层
          └── 粒子效果等

  RenderingServer 处理流程：
  1. Viewport 收集所有 Canvas 层
  2. 按 z_index 排序
  3. 应用 Camera2D 变换
  4. 遍历每层的 CanvasItem
  5. 提交渲染命令
```

### CanvasItem 的绘制

```cpp
// scene/2d/canvas_item.h（简化）
class CanvasItem : public Node {
    // 每个 CanvasItem 在 RenderingServer 中有一个 CanvasItem RID
    RID canvas_item;

    // 绘制 API（通过 RenderingServer 代理）
    void draw_line(const Point2 &p_from, const Point2 &p_to, const Color &p_color, ...);
    void draw_rect(const Rect2 &p_rect, const Color &p_color);
    void draw_texture(const Ref<Texture2D> &p_texture, const Point2 &p_pos, ...);
    void draw_circle(const Point2 &p_pos, float p_radius, const Color &p_color);

    // 变换
    Transform2D transform;
    bool visible = true;

    // 绘制顺序
    int z_index = 0;
    bool z_as_relative = true;
};
```

---

## 6. 3D 渲染机制

### World3D 的结构

```cpp
// scene/resources/world_3d.h
class World3D : public Resource {
    GDCLASS(World3D, Resource);

    RID scenario;             // RenderingServer 中的 Scenario RID
    RID space;                // PhysicsServer3D 中的物理空间 RID
    RID navigation_map;       // NavigationServer 中的导航地图 RID

    // 场景管理
    RID get_scenario() const { return scenario; }
    RID get_space() const { return space; }
};
```

### 3D 渲染管线

```
3D 渲染流程（Viewport → RenderingServer）：

  1. Viewport 收集渲染数据
     ├── 获取当前 Camera3D
     │   └── view_matrix, projection_matrix
     ├── 遍历 VisualInstance3D 节点
     │   ├── MeshInstance3D → mesh RID, material
     │   ├── Light3D → light RID, 参数
     │   └── 其他可视化节点
     └── 可见性检测（frustum culling）

  2. 提交到 RenderingServer
     RS.viewport_set_camera(viewport_rid, camera_rid)
     RS.camera_set_transform(camera_rid, transform)
     RS.instance_set_transform(instance_rid, transform)
     RS.instance_set_visible(instance_rid, visible)

  3. RenderingServer 渲染
     ├── 准备渲染列表
     ├── 执行渲染通道
     │   ├── Shadow pass
     │   ├── Opaque pass
     │   ├── Transparent pass
     │   └── Post-processing
     └── 输出到 Render Target

  4. DisplayServer 显示
     └── 交换缓冲区到屏幕
```

### 视口与 Scenario 的关系

```
Scenario 的共享与隔离：

  ┌─────────────────────────────────────┐
  │         Viewport A                  │
  │  World3D_A → Scenario_A             │
  │  ├── 独立的 3D 世界                 │
  │  ├── 独立的灯光                     │
  │  └── 独立的物理空间                 │
  └─────────────────────────────────────┘

  ┌─────────────────────────────────────┐
  │         Viewport B                  │
  │  World3D_A → Scenario_A             │  ← 共享同一个 World3D
  │  ├── 与 Viewport A 共享场景         │
  │  ├── 共享灯光和物体                 │
  │  └── 不同角度的摄像机               │
  └─────────────────────────────────────┘

  ┌─────────────────────────────────────┐
  │         Viewport C                  │
  │  World3D_B → Scenario_B             │  ← 不同的 World3D
  │  ├── 完全独立的 3D 世界             │
  │  └── 独立的灯光和物体               │
  └─────────────────────────────────────┘
```

---

## 7. SubViewport 与离屏渲染

### SubViewport 的特点

```
SubViewport vs Window：

  Window:
  ├── 继承 Viewport
  ├── 关联操作系统窗口（通过 DisplayServer）
  ├── 可以是独立窗口或嵌入父窗口
  ├── 接收操作系统输入事件
  └── 有标题栏、边框等窗口装饰

  SubViewport:
  ├── 继承 Viewport（不继承 Window）
  ├── 不关联操作系统窗口
  ├── 纯离屏渲染目标
  ├── 不直接接收输入事件（由父 Viewport 传递）
  └── 渲染结果作为纹理使用
```

### SubViewport 的使用场景

```
典型场景 1：小地图

  SubViewport (size = 200x200)
  ├── Camera3D (俯视角，指向玩家)
  ├── 与主场景共享 World3D
  └── 渲染结果 → SubViewportContainer → 显示在屏幕角落

典型场景 2：安全摄像头

  SubViewport
  ├── Camera3D (指向监控区域)
  ├── 独立 World3D（或共享）
  └── 渲染结果 → MeshInstance3D 材质（屏幕模型上显示）

典型场景 3：后处理效果

  主 Viewport → 渲染场景
      │
      ▼
  SubViewport (自定义着色器) → 后处理
      │
      ▼
  最终结果 → 显示到屏幕

典型场景 4：动态纹理

  SubViewport
  ├── Control 子节点（动态 UI 内容）
  └── 渲染结果 → 3D 物体表面的动态纹理
```

### SubViewportContainer

```
SubViewportContainer 的角色：

  ┌─────────────────────────────┐
  │    SubViewportContainer      │  ← Control 子类
  │  ┌───────────────────────┐  │
  │  │   SubViewport         │  │  ← 作为子节点
  │  │                       │  │
  │  │   渲染内容显示在此区域  │  │
  │  │                       │  │
  │  └───────────────────────┘  │
  └─────────────────────────────┘

  关键属性：
  - stretch: 是否拉伸子视口以填充容器
  - stretch_shrink: 缩放因子（用于降低分辨率提升性能）
```

---

## 8. Window 类

### Window 继承体系

```
Object → Node → Viewport → Window
```

### Window 的核心功能

```cpp
// scene/main/window.h（简化）
class Window : public Viewport {
    GDCLASS(Window, Viewport);

    // ====== 窗口属性 ======
    String title;                   // 窗口标题
    Vector2i position;              // 窗口位置
    Size2i size;                    // 窗口大小
    Size2i min_size, max_size;      // 大小限制
    Mode mode = MODE_WINDOWED;      // 窗口模式

    // ====== 窗口模式 ======
    enum Mode {
        MODE_WINDOWED,              // 普通窗口
        MODE_MINIMIZED,             // 最小化
        MODE_MAXIMIZED,             // 最大化
        MODE_FULLSCREEN,            // 全屏
        MODE_EXCLUSIVE_FULLSCREEN,  // 独占全屏
    };

    // ====== 窗口标志 ======
    bool borderless = false;
    bool always_on_top = false;
    bool transparent = false;
    bool unfocusable = false;
    bool popup = false;

    // ====== 嵌入模式 ======
    bool embedded = false;          // 是否嵌入父窗口（编辑器中）

    // ====== 交互 ======
    bool exclusive = false;         // 是否独占（阻止与父窗口交互）
    bool transient = false;         // 是否是临时窗口

    // ====== 与 DisplayServer 的关联 ======
    DisplayServer::WindowID window_id = DisplayServer::INVALID_WINDOW_ID;
};
```

### SceneTree 中的根窗口

```
SceneTree 启动时创建根窗口：

  SceneTree._initialize()
  └── 创建 root Window
      ├── window_id = DisplayServer::MAIN_WINDOW_ID
      ├── size = 项目设置中的窗口大小
      ├── title = 项目名称
      └── 添加到 SceneTree

  场景树结构：
  SceneTree
  └── root (Window)                ← 主窗口
      ├── AutoLoad_1
      ├── AutoLoad_2
      └── CurrentScene

  root 窗口是所有节点的最终祖先
  所有场景最终都添加为 root 的子节点
```

---

## 9. 源码结构总览

### Viewport 关键方法

```cpp
// scene/main/viewport.h 方法分类

class Viewport : public Node {
    // ====== 渲染 ======
    void _create_render_target();
    void _draw_scene();
    Size2i get_size() const;
    RID get_render_target() const;
    Ref<Texture2D> get_texture() const;  // 获取渲染目标纹理

    // ====== 世界 ======
    void set_world_2d(World2D *p_world_2d);
    World2D *get_world_2d() const;
    void set_world_3d(const Ref<World3D> &p_world_3d);
    Ref<World3D> get_world_3d() const;

    // ====== 摄像机 ======
    void _register_camera_3d(Camera3D *p_camera);
    void _remove_camera_3d(Camera3D *p_camera);
    Camera3D *get_camera_3d() const;

    // ====== 输入 ======
    void _process_input_event(const Ref<InputEvent> &p_event);
    void _gui_input_event(const Ref<InputEvent> &p_event);
    void push_input(const Ref<InputEvent> &p_event, bool p_local = false);

    // ====== 坐标变换 ======
    Vector2 get_mouse_position() const;
    Vector2 getviewport_to_world_2d(const Vector2 &p_pos) const;
    Vector2 world_to_viewport_2d(const Vector2 &p_pos) const;

    // ====== 音频 ======
    void set_as_audio_listener_2d(bool p_enable);
    void set_as_audio_listener_3d(bool p_enable);

    // ====== 配置 ======
    void set_scaling_3d_mode(Scaling3DMode p_mode);
    void set_scaling_3d_scale(float p_scale);
    void set_screen_space_aa(ScreenSpaceAA p_aa);
};
```

### 关键源文件

| 文件 | 路径 | 行数(约) | 说明 |
|------|------|---------|------|
| Viewport 声明 | `scene/main/viewport.h` | 700 | Viewport 类声明 |
| Viewport 实现 | `scene/main/viewport.cpp` | 4000 | Viewport 核心实现 |
| Window 声明 | `scene/main/window.h` | 300 | Window 类声明 |
| Window 实现 | `scene/main/window.cpp` | 2000 | Window 实现 |
| World2D | `scene/resources/world_2d.h` | 80 | 2D 世界资源 |
| World3D | `scene/resources/world_3d.h` | 100 | 3D 世界资源 |
| Camera3D | `scene/3d/camera_3d.h` | 250 | 3D 摄像机 |
| Camera2D | `scene/2d/camera_2d.h` | 200 | 2D 摄像机 |

### Viewport 架构总结图

```
┌───────────────────────────────────────────────────────────────┐
│                         Viewport                               │
│                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │
│  │   World2D   │  │   World3D   │  │     Camera3D        │   │
│  │  Canvas RID │  │ Scenario RID│  │  Camera RID         │   │
│  │  Space RID  │  │  Space RID  │  │  View/Proj Matrix   │   │
│  │  NavMap RID │  │  NavMap RID │  │                     │   │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘   │
│         │                │                     │              │
│         └────────────────┼─────────────────────┘              │
│                          │                                    │
│                    ┌─────▼─────┐                               │
│                    │ Render    │                               │
│                    │ Target    │                               │
│                    │ (RID)     │                               │
│                    └─────┬─────┘                               │
│                          │                                    │
│            ┌─────────────┼─────────────┐                      │
│            │             │             │                      │
│       ┌────▼────┐  ┌────▼────┐  ┌────▼────┐                  │
│       │ 2D渲染   │  │ 3D渲染  │  │ 输入路由 │                  │
│       │ Canvas  │  │Scenario │  │ Event   │                  │
│       └─────────┘  └─────────┘  └─────────┘                  │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

---

> 下一节：[04-打包场景与序列化](./04-packed-scene.md) - 深入分析 PackedScene、SceneState、.tscn 格式和场景实例化机制。
