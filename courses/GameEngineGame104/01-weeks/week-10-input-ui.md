# 第10周: 输入与UI系统

> **学习目标**: 学习输入管理和UI渲染
>
> **时间安排**: 2026-05-01 ~ 2026-05-08
> **学习时长**: 每天3-4小时

---

## 本周学习重点

### 1. 输入系统
- [ ] 键盘/鼠标事件处理
- [ ] 手柄输入支持
- [ ] 输入映射和动作
- [ ] 输入上下文

### 2. UI系统
- [ ] Canvas和坐标系
- [ ] UI元素（Button, Image, Text）
- [ ] 事件系统
- [ ] UI渲染

### 3. 实践任务
- [ ] 配置输入映射
- [ ] 创建简单UI界面
- [ ] 响应按钮点击事件

---

## 核心知识点

### 输入系统架构

```cpp
// 输入键码
enum class Key : int {
    Unknown = -1,
    Space = 32,
    Apostrophe = 39,
    Comma = 44,
    Minus = 45,
    Period = 46,
    Slash = 47,
    Num0 = 48, Num1 = 49, Num2 = 50, Num3 = 51, Num4 = 52,
    Num5 = 53, Num6 = 54, Num7 = 55, Num8 = 56, Num9 = 57,
    Semicolon = 59,
    Equal = 61,
    A = 65, B = 66, C = 67, D = 68, E = 69, F = 70, G = 71,
    H = 72, I = 73, J = 74, K = 75, L = 76, M = 77, N = 78,
    O = 79, P = 80, Q = 81, R = 82, S = 83, T = 84, U = 85,
    V = 86, W = 87, X = 88, Y = 89, Z = 90,
    Escape = 256, Enter = 257, Tab = 258, Backspace = 259,
    Insert = 260, Delete = 261, Right = 262, Left = 263,
    Down = 264, Up = 265, PageUp = 266, PageDown = 267,
    Home = 268, End = 269, CapsLock = 280, ScrollLock = 281,
    NumLock = 282, PrintScreen = 283,
    F1 = 290, F2 = 291, F3 = 292, F4 = 293, F5 = 294,
    F6 = 295, F7 = 296, F8 = 297, F9 = 298, F10 = 299,
    F11 = 300, F12 = 301
};

enum class MouseButton : int {
    Left = 0,
    Right = 1,
    Middle = 2
};

enum class GamepadButton : int {
    A = 0, B = 1, X = 2, Y = 3,
    LeftBumper = 4, RightBumper = 5,
    Back = 6, Start = 7,
    LeftStick = 8, RightStick = 9,
    DPadUp = 10, DPadRight = 11, DPadDown = 12, DPadLeft = 13
};

// 输入状态
class InputState {
public:
    bool isKeyDown(Key key) const {
        return m_key_states[static_cast<int>(key)];
    }

    bool isKeyPressed(Key key) const {
        return !m_key_states_prev[static_cast<int>(key)] &&
               m_key_states[static_cast<int>(key)];
    }

    bool isKeyReleased(Key key) const {
        return m_key_states_prev[static_cast<int>(key)] &&
               !m_key_states[static_cast<int>(key)];
    }

    bool isMouseButtonDown(MouseButton button) const {
        return m_mouse_button_states[static_cast<int>(button)];
    }

    vec2 getMousePosition() const {
        return m_mouse_position;
    }

    vec2 getMouseDelta() const {
        return m_mouse_position - m_mouse_position_prev;
    }

    float getMouseScroll() const {
        return m_mouse_scroll;
    }

    bool isGamepadConnected(int gamepad_id) const {
        return m_gamepad_connected[gamepad_id];
    }

    bool isGamepadButtonDown(int gamepad_id, GamepadButton button) const {
        return m_gamepad_button_states[gamepad_id][static_cast<int>(button)];
    }

    float getGamepadAxis(int gamepad_id, int axis) const {
        return m_gamepad_axes[gamepad_id][axis];
    }

    // 更新状态
    void update() {
        // 保存上一帧状态
        m_key_states_prev = m_key_states;
        m_mouse_position_prev = m_mouse_position;
        m_mouse_scroll = 0.0f;
    }

    // 设置状态（由平台层调用）
    void setKeyDown(Key key, bool down) {
        m_key_states[static_cast<int>(key)] = down;
    }

    void setMouseButtonDown(MouseButton button, bool down) {
        m_mouse_button_states[static_cast<int>(button)] = down;
    }

    void setMousePosition(const vec2& pos) {
        m_mouse_position = pos;
    }

    void setMouseScroll(float scroll) {
        m_mouse_scroll = scroll;
    }

    void setGamepadConnected(int gamepad_id, bool connected) {
        m_gamepad_connected[gamepad_id] = connected;
    }

    void setGamepadButtonDown(int gamepad_id, GamepadButton button, bool down) {
        m_gamepad_button_states[gamepad_id][static_cast<int>(button)] = down;
    }

    void setGamepadAxis(int gamepad_id, int axis, float value) {
        m_gamepad_axes[gamepad_id][axis] = value;
    }

private:
    std::array<bool, 512> m_key_states{false};
    std::array<bool, 512> m_key_states_prev{false};

    std::array<bool, 3> m_mouse_button_states{false};
    vec2 m_mouse_position{0};
    vec2 m_mouse_position_prev{0};
    float m_mouse_scroll = 0.0f;

    static constexpr int MAX_GAMEPADS = 4;
    std::array<bool, MAX_GAMEPADS> m_gamepad_connected{false};
    std::array<std::array<bool, 14>, MAX_GAMEPADS> m_gamepad_button_states{};
    std::array<std::array<float, 6>, MAX_GAMEPADS> m_gamepad_axes{};
};

// 输入系统
class InputSystem {
public:
    static InputSystem& instance() {
        static InputSystem inst;
        return inst;
    }

    void update() {
        m_state.update();
    }

    bool isKeyDown(Key key) const {
        return m_state.isKeyDown(key);
    }

    bool isKeyPressed(Key key) const {
        return m_state.isKeyPressed(key);
    }

    vec2 getMousePosition() const {
        return m_state.getMousePosition();
    }

    vec2 getMouseDelta() const {
        return m_state.getMouseDelta();
    }

    float getMouseScroll() const {
        return m_state.getMouseScroll();
    }

    // 内部接口（由平台层调用）
    InputState& getState() {
        return m_state;
    }

private:
    InputSystem() = default;
    InputState m_state;
};
```

### 输入映射

```cpp
// 输入动作
class InputAction {
public:
    enum class Type {
        Button,     // 按钮（按下/释放）
        Axis        // 轴（连续值）
    };

    InputAction(std::string name, Type type)
        : m_name(name), m_type(type) {}

    const std::string& getName() const {
        return m_name;
    }

    Type getType() const {
        return m_type;
    }

    // 添加键绑定
    void addKeyBinding(Key key) {
        m_key_bindings.push_back(key);
    }

    void addMouseButtonBinding(MouseButton button) {
        m_mouse_button_bindings.push_back(button);
    }

    void addGamepadButtonBinding(GamepadButton button) {
        m_gamepad_button_bindings.push_back(button);
    }

    // 添加轴绑定
    void addAxisBinding(Key positive, Key negative) {
        m_axis_bindings.push_back({positive, negative});
    }

    void addGamepadAxisBinding(int axis) {
        m_gamepad_axis_bindings.push_back(axis);
    }

    // 查询状态
    bool isPressed() const {
        if (m_type != Type::Button) return false;

        // 检查所有绑定
        for (auto key : m_key_bindings) {
            if (InputSystem::instance().isKeyPressed(key)) {
                return true;
            }
        }

        for (auto button : m_mouse_button_bindings) {
            if (InputSystem::instance().getState().isMouseButtonDown(button)) {
                return true;
            }
        }

        for (auto button : m_gamepad_button_bindings) {
            for (int i = 0; i < 4; i++) {
                if (InputSystem::instance().getState().isGamepadConnected(i)) {
                    if (InputSystem::instance().getState().isGamepadButtonDown(i, button)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    bool isDown() const {
        if (m_type != Type::Button) return false;

        for (auto key : m_key_bindings) {
            if (InputSystem::instance().isKeyDown(key)) {
                return true;
            }
        }

        // ... 其他绑定

        return false;
    }

    float getAxis() const {
        if (m_type != Type::Axis) return 0.0f;

        float value = 0.0f;

        // 键轴
        for (auto [pos, neg] : m_axis_bindings) {
            if (InputSystem::instance().isKeyDown(pos)) {
                value += 1.0f;
            }
            if (InputSystem::instance().isKeyDown(neg)) {
                value -= 1.0f;
            }
        }

        // 手柄轴
        for (auto axis : m_gamepad_axis_bindings) {
            for (int i = 0; i < 4; i++) {
                if (InputSystem::instance().getState().isGamepadConnected(i)) {
                    float axis_value = InputSystem::instance().getState().getGamepadAxis(i, axis);
                    if (std::abs(axis_value) > std::abs(value)) {
                        value = axis_value;
                    }
                }
            }
        }

        // 死区
        if (std::abs(value) < m_dead_zone) {
            return 0.0f;
        }

        return value;
    }

    void setDeadZone(float dead_zone) {
        m_dead_zone = dead_zone;
    }

private:
    std::string m_name;
    Type m_type;
    std::vector<Key> m_key_bindings;
    std::vector<MouseButton> m_mouse_button_bindings;
    std::vector<GamepadButton> m_gamepad_button_bindings;
    std::vector<std::pair<Key, Key>> m_axis_bindings;
    std::vector<int> m_gamepad_axis_bindings;
    float m_dead_zone = 0.1f;
};

// 输入映射管理器
class InputMapping {
public:
    void addAction(std::shared_ptr<InputAction> action) {
        m_actions[action->getName()] = action;
    }

    std::shared_ptr<InputAction> getAction(const std::string& name) {
        auto it = m_actions.find(name);
        return it != m_actions.end() ? it->second : nullptr;
    }

private:
    std::unordered_map<std::string, std::shared_ptr<InputAction>> m_actions;
};
```

---

## UI系统

### Canvas和UI元素

```cpp
// Canvas变换
enum class Anchor {
    TopLeft,
    TopCenter,
    TopRight,
    MiddleLeft,
    MiddleCenter,
    MiddleRight,
    BottomLeft,
    BottomCenter,
    BottomRight
};

// UI元素基类
class UIElement {
public:
    UIElement() = default;
    virtual ~UIElement() = default;

    // 位置和大小
    void setPosition(const vec2& position) {
        m_position = position;
        m_is_dirty = true;
    }

    void setSize(const vec2& size) {
        m_size = size;
        m_is_dirty = true;
    }

    void setAnchor(Anchor anchor) {
        m_anchor = anchor;
        m_is_dirty = true;
    }

    void setPivot(const vec2& pivot) {
        m_pivot = pivot;
        m_is_dirty = true;
    }

    // 层级
    void setParent(UIElement* parent) {
        m_parent = parent;
    }

    void addChild(std::shared_ptr<UIElement> child) {
        child->setParent(this);
        m_children.push_back(child);
    }

    // 可见性
    void setVisible(bool visible) {
        m_visible = visible;
    }

    bool isVisible() const {
        return m_visible && (m_parent == nullptr || m_parent->isVisible());
    }

    // 事件
    virtual void onMouseEnter(const vec2& mouse_pos) {}
    virtual void onMouseLeave(const vec2& mouse_pos) {}
    virtual void onMouseDown(const vec2& mouse_pos, MouseButton button) {}
    virtual void onMouseUp(const vec2& mouse_pos, MouseButton button) {}
    virtual void onClick(const vec2& mouse_pos) {}

    // 更新和渲染
    virtual void update(float delta_time) {
        for (auto& child : m_children) {
            if (child->isVisible()) {
                child->update(delta_time);
            }
        }
    }

    virtual void render(UIRenderer* renderer) {
        for (auto& child : m_children) {
            if (child->isVisible()) {
                child->render(renderer);
            }
        }
    }

    // 碰撞检测
    bool containsPoint(const vec2& point) const {
        vec2 min = m_position - m_pivot * m_size;
        vec2 max = min + m_size;
        return point.x >= min.x && point.x <= max.x &&
               point.y >= min.y && point.y <= max.y;
    }

    // 获取世界位置
    vec2 getWorldPosition() const {
        vec2 pos = m_position;
        if (m_parent) {
            pos += m_parent->getWorldPosition();
        }
        return pos;
    }

protected:
    vec2 m_position{0};
    vec2 m_size{100, 100};
    Anchor m_anchor = Anchor::TopLeft;
    vec2 m_pivot{0};
    bool m_visible = true;
    bool m_is_dirty = false;

    UIElement* m_parent = nullptr;
    std::vector<std::shared_ptr<UIElement>> m_children;
};

// 按钮类
class Button : public UIElement {
public:
    using ClickCallback = std::function<void()>;

    Button(std::string text) : m_text(text) {
        setSize(vec2(120, 40));
    }

    void setOnClick(ClickCallback callback) {
        m_on_click = callback;
    }

    void update(float delta_time) override {
        // 检测鼠标状态
        vec2 mouse_pos = InputSystem::instance().getMousePosition();
        vec2 world_pos = getWorldPosition();
        vec2 local_pos = mouse_pos - world_pos;

        if (containsPoint(mouse_pos)) {
            if (InputSystem::instance().getState().isMouseButtonDown(MouseButton::Left)) {
                m_state = State::Pressed;
            } else {
                if (m_state == State::Pressed) {
                    // 点击事件
                    if (m_on_click) {
                        m_on_click();
                    }
                }
                m_state = State::Hovered;
            }
        } else {
            m_state = State::Normal;
        }

        UIElement::update(delta_time);
    }

    void render(UIRenderer* renderer) override {
        // 根据状态选择颜色
        vec4 color;
        switch (m_state) {
            case State::Normal:   color = vec4(0.2f, 0.2f, 0.2f, 1.0f); break;
            case State::Hovered:  color = vec4(0.3f, 0.3f, 0.3f, 1.0f); break;
            case State::Pressed:  color = vec4(0.1f, 0.1f, 0.1f, 1.0f); break;
        }

        // 绘制背景
        renderer->drawRect(getWorldPosition(), getSize(), color);

        // 绘制文本
        vec2 text_pos = getWorldPosition() + getSize() * 0.5f;
        renderer->drawText(m_text, text_pos, vec4(1), TextAlignment::Center);

        UIElement::render(renderer);
    }

private:
    enum class State {
        Normal,
        Hovered,
        Pressed
    };

    std::string m_text;
    State m_state = State::Normal;
    ClickCallback m_on_click;
};

// 图片类
class Image : public UIElement {
public:
    void setTexture(std::shared_ptr<Texture> texture) {
        m_texture = texture;
    }

    void setColor(const vec4& color) {
        m_color = color;
    }

    void render(UIRenderer* renderer) override {
        if (m_texture) {
            renderer->drawImage(getWorldPosition(), getSize(), m_texture, m_color);
        }
        UIElement::render(renderer);
    }

private:
    std::shared_ptr<Texture> m_texture;
    vec4 m_color{1};
};

// 文本类
class Text : public UIElement {
public:
    void setText(const std::string& text) {
        m_text = text;
    }

    void setFontSize(float size) {
        m_font_size = size;
    }

    void setColor(const vec4& color) {
        m_color = color;
    }

    void render(UIRenderer* renderer) override {
        renderer->drawText(m_text, getWorldPosition(), m_color, m_font_size);
        UIElement::render(renderer);
    }

private:
    std::string m_text;
    float m_font_size = 16.0f;
    vec4 m_color{1};
};
```

---

## 关键目录

```
runtime/function/input/
├── input_system.h
├── input_state.h
├── input_action.h
└── input_mapping.h

runtime/function/ui/
├── ui_system.h
├── ui_element.h
├── ui_canvas.h
├── ui_renderer.h
└── widgets/
    ├── button.h
    ├── image.h
    ├── text.h
    └── slider.h
```

---

## 实践任务

### 任务1: 配置输入映射

```cpp
// 初始化输入映射
void initInputMapping() {
    auto mapping = std::make_shared<InputMapping>();

    // 移动动作
    auto move_forward = std::make_shared<InputAction>("MoveForward", InputAction::Type::Axis);
    move_forward->addKeyBinding(Key::W);
    move_forward->addKeyBinding(Key::Up);
    move_forward->addGamepadAxisBinding(1);  // 左摇杆Y轴
    mapping->addAction(move_forward);

    auto move_backward = std::make_shared<InputAction>("MoveBackward", InputAction::Type::Axis);
    move_backward->addKeyBinding(Key::S);
    move_backward->addKeyBinding(Key::Down);
    mapping->addAction(move_backward);

    // 跳跃动作
    auto jump = std::make_shared<InputAction>("Jump", InputAction::Type::Button);
    jump->addKeyBinding(Key::Space);
    jump->addGamepadButtonBinding(GamepadButton::A);
    mapping->addAction(jump);

    // 射击动作
    auto shoot = std::make_shared<InputAction>("Shoot", InputAction::Type::Button);
    shoot->addMouseButtonBinding(MouseButton::Left);
    shoot->addGamepadButtonBinding(GamepadButton::RightBumper);
    mapping->addAction(shoot);
}

// 使用输入映射
void PlayerController::update(float delta_time) {
    auto forward = m_input_mapping->getAction("MoveForward");
    auto backward = m_input_mapping->getAction("MoveBackward");

    float move = forward->getAxis() - backward->getAxis();
    m_character->move(vec3(0, 0, move));

    auto jump = m_input_mapping->getAction("Jump");
    if (jump->isPressed()) {
        m_character->jump();
    }
}
```

### 任务2: 创建UI界面

```cpp
// 创建主菜单UI
void createMainMenu() {
    auto canvas = std::make_shared<UICanvas>();
    canvas->setSize(vec2(1920, 1080));

    // 标题
    auto title = std::make_shared<Text>("GAME TITLE");
    title->setPosition(vec2(960, 200));
    title->setAnchor(Anchor::TopCenter);
    title->setFontSize(64.0f);
    title->setColor(vec4(1, 0.8f, 0.2f, 1));
    canvas->addChild(title);

    // 开始按钮
    auto start_button = std::make_shared<Button>("Start Game");
    start_button->setPosition(vec2(960, 400));
    start_button->setAnchor(Anchor::TopCenter);
    start_button->setOnClick([]() {
        std::cout << "Starting game..." << std::endl;
        startGame();
    });
    canvas->addChild(start_button);

    // 设置按钮
    auto settings_button = std::make_shared<Button>("Settings");
    settings_button->setPosition(vec2(960, 460));
    settings_button->setAnchor(Anchor::TopCenter);
    settings_button->setOnClick([]() {
        openSettings();
    });
    canvas->addChild(settings_button);

    // 退出按钮
    auto quit_button = std::make_shared<Button>("Quit");
    quit_button->setPosition(vec2(960, 520));
    quit_button->setAnchor(Anchor::TopCenter);
    quit_button->setOnClick([]() {
        quitGame();
    });
    canvas->addChild(quit_button);

    m_ui_system->addCanvas(canvas);
}
```

---

## 验证标准

- [ ] 理解输入系统
  - [ ] 能处理键盘/鼠标事件
  - [ ] 知道输入映射的作用
  - [ ] 能配置游戏手柄

- [ ] 掌握UI系统
  - [ ] 理解Canvas和坐标系统
  - [ ] 能创建各种UI元素
  - [ ] 能处理UI事件

- [ ] 实践完成
  - [ ] 配置输入映射
  - [ ] 创建UI界面
  - [ ] 响应按钮事件

---

## 下周预告

第11周: 性能优化 - CPU/GPU优化技术
