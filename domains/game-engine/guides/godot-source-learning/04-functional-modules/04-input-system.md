# 输入系统

Godot 的输入系统负责接收来自硬件（键盘、鼠标、手柄、触摸屏等）的输入，经过抽象和映射后传递给游戏逻辑。核心设计围绕 **事件模型** 和 **Action 映射** 两个概念展开，实现了硬件输入与游戏逻辑的解耦。

---

## 目录

1. [输入系统架构](#1-输入系统架构)
2. [Input 单例](#2-input-单例)
3. [InputEvent 层次结构](#3-inputevent-层次结构)
4. [事件传播流程](#4-事件传播流程)
5. [InputMap 与 Action 系统](#5-inputmap-与-action-系统)
6. [输入缓冲与累积](#6-输入缓冲与累积)
7. [源码导航](#7-源码导航)

---

## 1. 输入系统架构

```
输入系统完整架构：

  ┌───────────────────────────────────────────────────────────┐
  │                  硬件层 (Hardware)                         │
  │  键盘 · 鼠标 · 手柄 · 触摸屏 · MIDI · 麦克风               │
  └──────────────────────┬────────────────────────────────────┘
                         │ OS / 平台事件
                         ▼
  ┌───────────────────────────────────────────────────────────┐
  │              DisplayServer (平台抽象)                       │
  │  将平台事件转换为 Godot InputEvent                          │
  │  SDL / Win32 / X11 / Cocoa / Android                      │
  └──────────────────────┬────────────────────────────────────┘
                         │ parse_input_event()
                         ▼
  ┌───────────────────────────────────────────────────────────┐
  │                 Input 单例 (核心)                           │
  │  core/input/input.h                                       │
  │                                                           │
  │  ├── accumulate events（累积事件）                         │
  │  ├── flush buffer（刷新到场景树）                           │
  │  ├── action state tracking（Action 状态追踪）               │
  │  ├── mouse/touch state（鼠标/触摸状态）                     │
  │  └── joy pad state（手柄状态）                              │
  └──────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
  ┌────────────┐  ┌────────────┐  ┌────────────┐
  │ InputMap   │  │ SceneTree  │  │ GUI 系统    │
  │ Action映射  │  │ 事件分发    │  │ Control    │
  └────────────┘  └────────────┘  └────────────┘
```

---

## 2. Input 单例

`Input`（`core/input/input.h`）是输入系统的全局单例，管理所有输入状态。

### 2.1 核心状态

```cpp
// core/input/input.h（简化）

class Input : public Object {
    GDCLASS(Input, Object);

    // === 输入事件缓冲区 ===
    // 本帧累积的所有输入事件
    List<Ref<InputEvent>> buffered_events;
    bool use_accumulated_input = true;  // 是否累积输入

    // === 鼠标状态 ===
    Point2 mouse_pos;                    // 鼠标位置
    BitField<MouseButtonMask> mouse_button_mask;  // 按下的鼠标键
    Vector2 last_mouse_speed;            // 鼠标速度（平滑值）

    // === 按键状态 ===
    // 当前帧按下的键
    HashSet<Key> pressed_keys;

    // === 手柄状态 ===
    // 每个设备的按键和轴状态
    HashMap<int, JoypadState> joy_states;

    struct JoypadState {
        BitField<JoyButtonMask> buttons;  // 按键状态位掩码
        float axis[JoyAxis::JOY_AXIS_MAX] = {}; // 轴值 [-1, 1]
        HashMap<StringName, float> axis_value_cache;
    };

    // === Action 状态 ===
    // 每个 Action 的当前状态 (pressed/released + strength)
    HashMap<StringName, ActionState> action_states;

    struct ActionState {
        bool pressed = false;
        float strength = 0.0f;           // 模拟输入强度 [0, 1]
        float exact_strength = 0.0f;     // 精确强度（未经死区处理）
        uint64_t pressed_time = 0;       // 按下时间戳
    };

    // === 鼠标模式 ===
    MouseMode mouse_mode = MOUSE_MODE_VISIBLE;
    // MOUSE_MODE_VISIBLE     - 显示鼠标
    // MOUSE_MODE_HIDDEN      - 隐藏鼠标
    // MOUSE_MODE_CAPTURED    - 捕获鼠标（FPS 游戏用）
    // MOUSE_MODE_CONFINED    - 限制在窗口内

    // === 输入处理参数 ===
    bool emulate_touch_from_mouse = false;
    bool emulate_mouse_from_touch = false;
    bool accept_input = true;
};
```

### 2.2 关键 API

```
Input 单例关键 API：

  查询方法（可在 _process / _physics_process 中调用）：
  ┌─────────────────────────────────────────────────────────┐
  │  // Action 查询                                        │
  │  is_action_pressed(action) → bool                      │
  │  is_action_just_pressed(action) → bool                 │
  │  is_action_just_released(action) → bool                │
  │  get_action_strength(action) → float                   │
  │  get_vector(neg_x, pos_x, neg_y, pos_y) → Vector2     │
  │                                                        │
  │  // 按键查询                                           │
  │  is_key_pressed(keycode) → bool                        │
  │  is_physical_key_pressed(keycode) → bool               │
  │                                                        │
  │  // 鼠标查询                                           │
  │  get_mouse_position() → Vector2                       │
  │  get_last_mouse_velocity() → Vector2                   │
  │  is_mouse_button_pressed(button) → bool                │
  │                                                        │
  │  // 手柄查询                                           │
  │  is_joy_button_pressed(device, button) → bool          │
  │  get_joy_axis(device, axis) → float                    │
  │  get_connected_joypads() → Array                      │
  │                                                        │
  │  // 控制方法                                           │
  │  set_mouse_mode(mode)                                  │
  │  warp_mouse(position)                                  │
  │  set_default_cursor_shape(shape)                       │
  │  flush_buffered_events()                               │
  └─────────────────────────────────────────────────────────┘
```

---

## 3. InputEvent 层次结构

所有输入事件都继承自 `InputEvent`（`core/input/input_event.h`）：

```
InputEvent 类层次：

  Resource
  └── InputEvent (基类: core/input/input_event.h)
      ├── device: int         // 设备 ID
      ├── get_action_match()  // 事件是否匹配某个 Action
      │
      ├── InputEventKey
      │   ├── keycode: Key              // 逻辑按键码 (KEY_A)
      │   ├── physical_keycode: Key     // 物理按键码（键盘布局无关）
      │   ├── key_label: Key            // 显示标签
      │   ├── unicode: uint32_t         // Unicode 字符
      │   ├── pressed: bool             // 按下/释放
      │   ├── echo: bool                // 按键重复
      │   ├── ctrl_pressed: bool        // Ctrl 修饰键
      │   ├── shift_pressed: bool       // Shift 修饰键
      │   ├── alt_pressed: bool         // Alt 修饰键
      │   └── meta_pressed: bool        // Meta/Command 修饰键
      │
      ├── InputEventMouse (中间基类)
      │   ├── modifier_flags
      │   ├── button_mask: MouseButtonMask
      │   └── position: Vector2
      │   │
      │   ├── InputEventMouseButton
      │   │   ├── button_index: MouseButton  // LEFT/RIGHT/MIDDLE/...
      │   │   ├── factor: float              // 滚轮因子
      │   │   ├── double_click: bool
      │   │   └── pressed: bool
      │   │
      │   └── InputEventMouseMotion
      │       ├── relative: Vector2     // 相对移动量
      │       ├── screen_relative: Vector2
      │       ├── velocity: Vector2     // 移动速度
      │       └── tilt: Vector2         // 触控板倾斜
      │
      ├── InputEventJoypadButton
      │   ├── button_index: JoyButton   // A/B/X/Y/LB/RB/...
      │   └── pressure: float           // 按压力度 [0, 1]
      │
      ├── InputEventJoypadMotion
      │   ├── axis: JoyAxis             // LEFT_X/LEFT_Y/RIGHT_X/RIGHT_Y/...
      │   └── axis_value: float         // [-1, 1]
      │
      ├── InputEventScreenTouch
      │   ├── index: int                // 手指索引
      │   ├── position: Vector2
      │   └── pressed: bool
      │
      ├── InputEventScreenDrag
      │   ├── index: int
      │   ├── position: Vector2
      │   ├── relative: Vector2
      │   └── velocity: Vector2
      │
      ├── InputEventAction
      │   ├── action: StringName
      │   └── strength: float
      │
      ├── InputEventGesture
      │   ├── InputEventMagnifyGesture  // 缩放手势
      │   └── InputEventPanGesture      // 平移手势
      │
      ├── InputEventMIDI
      │   ├── channel, message, pitch, velocity, ...
      │
      └── InputEventShortcut
          └── shortcut: Ref<Shortcut>
```

---

## 4. 事件传播流程

### 4.1 从硬件到节点

```
完整事件传播路径（以键盘按下为例）：

  1. 硬件中断
     用户按下键盘 → 键盘控制器发送扫描码

  2. OS / 平台层
     Windows: WM_KEYDOWN 消息
     Linux: XKeyEvent / SDL_KEYDOWN
     macOS: NSEvent keyDown:

  3. DisplayServer 转换
     DisplayServer::process_events()
     ├── 将平台事件转换为 InputEventKey
     │   keycode = Key::KEY_A
     │   pressed = true
     │   shift_pressed = true
     │
     └── Input::get_singleton()->parse_input_event(event)

  4. Input 单例处理
     Input::parse_input_event(event)
     ├── 更新内部状态：
     │   pressed_keys.insert(KEY_A)
     │   修饰键状态更新
     │
     ├── InputMap 检查：
     │   遍历所有 Action，检查 event 是否匹配
     │   如果 "attack" 映射了 KEY_A → 更新 action_states["attack"]
     │
     ├── 累积或立即发送：
     │   if use_accumulated_input:
     │     buffered_events.push_back(event)
     │   else:
     │     SceneTree::get_singleton()->input_event(event)

  5. SceneTree 事件分发
     SceneTree::input_event(event)
     │
     ├── _call_input_pause("_input", event)
     │   按逆序（子节点优先）调用节点的 _input()
     │   如果节点 consume 了事件 → 停止传播
     │
     ├── _call_input_pause("_shortcut_input", event)
     │   快捷键处理阶段
     │
     ├── _call_input_pause("_unhandled_key_input", event)
     │   未处理的键盘输入
     │
     ├── _call_input_pause("_unhandled_input", event)
     │   未处理的输入（通常在这里响应游戏操作）
     │
     └── GUI 处理
         如果是鼠标事件 → Control::_gui_input_event()
         处理 Button、LineEdit 等 GUI 控件
```

### 4.2 节点输入处理方法

```
Node 的输入处理方法（按优先级排列）：

  ┌─────────────────────────────────────────────────────┐
  │  优先级    方法                  典型用途              │
  ├─────────────────────────────────────────────────────┤
  │  最高     _input()             全局输入拦截           │
  │           │                     (暂停菜单、调试)      │
  │           ▼                                          │
  │           _shortcut_input()   快捷键处理              │
  │           │                                          │
  │           ▼                                          │
  │           _unhandled_key_input()  未处理的键盘输入     │
  │           │                                          │
  │           ▼                                          │
  │  最低     _unhandled_input()   游戏逻辑输入            │
  │                                 (移动、攻击等)         │
  └─────────────────────────────────────────────────────┘

  调用顺序：从场景树最深的子节点向上冒泡
  任何节点调用 viewport.set_input_as_handled() → 停止传播

  示例：
  SceneTree
  ├── CanvasLayer (PauseMenu)      ← _input() 拦截暂停
  ├── Player
  │   ├── _unhandled_input()       ← 接收移动/攻击输入
  │   └── ...
  └── Camera2D
```

---

## 5. InputMap 与 Action 系统

### 5.1 InputMap 单例

`InputMap`（`core/input/input_map.h`）管理 Action 到物理输入的映射。

```cpp
// core/input/input_map.h（简化）

class InputMap : public Object {
    GDCLASS(InputMap, Object);

    // Action → 输入映射列表
    // 每个输入是一个 InputEvent 的子类实例，表示一个"匹配模板"
    struct Action {
        int id;                                    // Action ID
        float deadzone = 0.2f;                     // 死区
        List<Ref<InputEvent>> inputs;              // 绑定的输入列表
    };

    HashMap<StringName, Action> input_actions;

    // 核心方法
    bool has_action(const StringName &p_action) const;
    void action_add_event(const StringName &p_action, const Ref<InputEvent> &p_event);
    void action_erase_event(const StringName &p_action, const Ref<InputEvent> &p_event);
    bool event_is_action(const Ref<InputEvent> &p_event, const StringName &p_action) const;
    float action_get_deadzone(const StringName &p_action) const;
};
```

### 5.2 Action 匹配算法

```
Action 匹配流程（event_is_action）：

  event_is_action(event, "jump")：

  1. 获取 Action: action = input_actions["jump"]
  2. 遍历 action.inputs:
     for input in action.inputs:
       if event->action_match(input, deadzone):
         return true

  3. action_match() 对不同类型的比较：

     InputEventKey::action_match():
       ├── keycode 必须匹配
       ├── physical_keycode 必须匹配（如果使用）
       └── 修饰键必须匹配（或允许部分匹配）

     InputEventJoypadButton::action_match():
       ├── button_index 必须匹配
       └── device 必须匹配（-1 = 任意设备）

     InputEventJoypadMotion::action_match():
       ├── axis 必须匹配
       └── abs(axis_value) > deadzone
           即：超过死区的摇杆偏移才算匹配

  4. 强度计算（get_action_strength）：
     ├── 键盘/鼠标按键: 0.0 或 1.0（二值）
     ├── 手柄按键: pressure 值 [0, 1]
     └── 手柄摇杆: clamp(abs(axis_value), 0, 1)
```

### 5.3 配置存储

```
Action 映射存储在 project.godot 中：

  [input]
  jump={
    "deadzone": 0.5,
    "events": [
      Object(InputEventKey, "keycode": 32),        // Space
      Object(InputEventJoypadButton, "button_index": 0)  // A button
    ]
  }
  move_left={
    "deadzone": 0.5,
    "events": [
      Object(InputEventKey, "keycode": 4194319),   // Left Arrow
      Object(InputEventKey, "keycode": 65),        // A
      Object(InputEventJoypadMotion, "axis": 0, "axis_value": -1.0)
    ]
  }

  运行时修改：
    InputMap.add_action("crouch")
    InputMap.action_add_event("crouch", event)
```

---

## 6. 输入缓冲与累积

### 6.1 累积输入机制

```
输入累积与刷新：

  问题：操作系统可能在一帧内产生多个输入事件
        （如鼠标移动、多个按键），直接分发会导致
        多次回调，浪费性能。

  解决：累积输入，在合适的时机统一刷新。

  ┌──────────────────────────────────────────────────────────┐
  │                    时间线                                  │
  │                                                          │
  │  Frame N:                                                │
  │  ├── 主循环开始                                           │
  │  ├── OS::process_events()                                │
  │  │   ├── 鼠标移动 → Input::parse_input_event(event1)    │
  │  │   │   → 累积到 buffered_events                        │
  │  │   ├── 按键 A → Input::parse_input_event(event2)      │
  │  │   │   → 累积到 buffered_events                        │
  │  │   └── 按键 B → Input::parse_input_event(event3)      │
  │  │       → 累积到 buffered_events                        │
  │  │                                                      │
  │  ├── SceneTree::_process(delta)                          │
  │  │   ├── Input::flush_buffered_events()                  │
  │  │   │   └── 分发所有累积事件到场景树                     │
  │  │   │       event1 → _input/_unhandled_input            │
  │  │   │       event2 → _input/_unhandled_input            │
  │  │   │       event3 → _input/_unhandled_input            │
  │  │   │                                                  │
  │  │   └── 游戏逻辑 _process()                            │
  │  │                                                      │
  │  └── 渲染                                               │
  │                                                          │
  │  Frame N+1: ...                                          │
  └──────────────────────────────────────────────────────────┘
```

### 6.2 just_pressed / just_released 的实现

```
is_action_just_pressed() 实现原理：

  ActionState {
    pressed: bool              // 当前是否按下
    pressed_time: uint64_t     // 按下的时间戳
  }

  is_action_just_pressed(action):
    state = action_states[action]
    if state.pressed:
      // 检查是否在本帧或上一帧刚按下
      return (state.pressed_time >= last_frame_time)
    return false

  问题：如果帧率低（如 30fps），而物理帧率高（60fps），
        一个 just_pressed 可能被多个物理帧读取到。

  解决：Input 增加了额外的帧计数来防止重复：
    uint64_t action_exact_pressed_frame[action]
    对比当前帧号确保只匹配一次
```

---

## 7. 源码导航

### 关键文件一览

| 文件 | 路径 | 说明 |
|------|------|------|
| Input | `core/input/input.h/cpp` | 输入单例，状态管理 |
| InputEvent | `core/input/input_event.h/cpp` | 输入事件基类 |
| InputEventKey | `core/input/input_event.h` | 键盘事件 |
| InputEventMouse | `core/input/input_event.h` | 鼠标事件 |
| InputEventJoypad | `core/input/input_event.h` | 手柄事件 |
| InputMap | `core/input/input_map.h/cpp` | Action 映射管理 |
| Shortcut | `core/input/shortcut.h` | 快捷键定义 |
| SceneTree (input) | `scene/main/scene_tree.h/cpp` | 事件分发 |
| DisplayServer | `servers/display_server.h` | 平台事件入口 |

### 推荐阅读顺序

```
1. core/input/input_event.h
   → 理解所有输入事件类型的数据结构

2. core/input/input.h
   → 理解 Input 单例的完整接口

3. core/input/input.cpp
   → 跟踪 parse_input_event() 和 flush_buffered_events()
   → 理解 is_action_just_pressed() 的实现

4. core/input/input_map.h/cpp
   → 理解 Action 匹配逻辑

5. scene/main/scene_tree.cpp
   → 搜索 input_event / _call_input_pause
   → 理解事件分发到节点的完整流程

6. scene/main/node.cpp
   → 搜索 _input / _unhandled_input
   → 理解节点如何接收和处理输入
```

---

## 下一步

- [05-粒子系统](./05-particle-system.md) - 深入了解 GPU 粒子系统
- [返回目录](./README.md)
