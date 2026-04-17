# 输入系统

输入系统负责处理来自键盘、鼠标、触摸屏和游戏手柄等输入设备的事件，将其转化为统一的事件接口供游戏逻辑使用。

## 目录

- [架构概述](#架构概述)
- [Input 输入管理器](#input-输入管理器)
- [事件类型](#事件类型)
- [InputSource 输入源](#inputsource-输入源)
- [多平台适配](#多平台适配)
- [技术原理](#技术原理)

---

## 架构概述

```
┌─────────────────────────────────────────────────────────┐
│                    输入系统架构                           │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Input (输入管理器)                    │   │
│  │  on(event, callback) · off(event, callback)      │   │
│  └────────────────────┬─────────────────────────────┘   │
│                       │ 统一事件                          │
│                       ▼                                  │
│  ┌──────────────────────────────────────────────────┐   │
│  │           PAL 输入层                              │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐       │   │
│  │  │   Web    │  │  Native  │  │ Minigame │       │   │
│  │  │ DOM事件  │  │ 系统事件  │  │ WX事件   │       │   │
│  │  └──────────┘  └──────────┘  └──────────┘       │   │
│  └──────────────────────────────────────────────────┘   │
│                       │ 原始事件                          │
│                       ▼                                  │
│  ┌──────────────────────────────────────────────────┐   │
│  │              输入设备                              │   │
│  │  键盘 · 鼠标 · 触摸屏 · 手柄 · 陀螺仪            │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 核心文件

| 文件 | 路径 | 说明 |
|------|------|------|
| Input 管理器 | `cocos/input/input.ts` | 输入主入口 |
| 系统事件 | `cocos/input/system-event.ts` | 系统级事件 |
| 输入源 | `pal/input/input-source.ts` | 输入源抽象 |
| 按键码 | `pal/input/keycodes.ts` | 按键码定义 |
| 触摸管理 | `pal/input/touch-manager.ts` | 触摸点管理 |

---

## Input 输入管理器

`Input` 是输入系统的全局入口，管理所有输入事件的分发。

```typescript
// cocos/input/input.ts

export class Input {
    // ─── 事件注册 ───
    on(type: InputEventType, callback, target?): EventCallback;
    off(type: InputEventType, callback, target?): void;
    once(type: InputEventType, callback, target?): EventCallback;
    targetOff(target): void;

    // ─── 设备检测 ───
    hasMouse(): boolean;       // 是否有鼠标
    hasTouch(): boolean;       // 是否支持触摸
    hasKeyboard(): boolean;    // 是否有键盘

    // ─── 陀螺仪 ───
    setAccelerometerEnabled(value: boolean): void;
    setAccelerometerInterval(value: number): void;
}
```

### 使用方式

```typescript
import { input, Input, EventKeyboard, KeyCode, EventTouch } from 'cc';

// 键盘事件
input.on(Input.EventType.KEY_DOWN, (event: EventKeyboard) => {
    if (event.keyCode === KeyCode.SPACE) {
        console.log('空格键按下');
    }
});

// 触摸事件
input.on(Input.EventType.TOUCH_START, (event: EventTouch) => {
    const pos = event.getUILocation();
    console.log(`触摸位置: ${pos.x}, ${pos.y}`);
});

// 鼠标事件
input.on(Input.EventType.MOUSE_DOWN, (event: EventMouse) => {
    if (event.getButton() === 0) {
        console.log('左键点击');
    }
});
```

---

## 事件类型

### InputEventType 枚举

| 事件类型 | 说明 | 事件数据 |
|----------|------|----------|
| `KEY_DOWN` | 键盘按下 | `EventKeyboard` (keyCode) |
| `KEY_UP` | 键盘抬起 | `EventKeyboard` |
| `MOUSE_DOWN` | 鼠标按下 | `EventMouse` (button, location) |
| `MOUSE_UP` | 鼠标抬起 | `EventMouse` |
| `MOUSE_MOVE` | 鼠标移动 | `EventMouse` (deltaX, deltaY) |
| `MOUSE_WHEEL` | 鼠标滚轮 | `EventMouse` (scrollY) |
| `TOUCH_START` | 触摸开始 | `EventTouch` (location, ID) |
| `TOUCH_MOVE` | 触摸移动 | `EventTouch` |
| `TOUCH_END` | 触摸结束 | `EventTouch` |
| `TOUCH_CANCEL` | 触摸取消 | `EventTouch` |
| `DEVICEMOTION` | 设备运动 | `EventAcceleration` |

### KeyCode 常用按键码

```typescript
enum KeyCode {
    // 字母键
    A, B, C, D, E, F, G, H, I, J, K, L, M,
    N, O, P, Q, R, S, T, U, V, W, X, Y, Z,
    // 数字键
    NUM_0 ~ NUM_9,
    // 功能键
    SPACE, ENTER, TAB, ESCAPE, BACKSPACE,
    SHIFT, CTRL, ALT, CAPS_LOCK,
    // 方向键
    ARROW_UP, ARROW_DOWN, ARROW_LEFT, ARROW_RIGHT,
    // F 键
    F1 ~ F12,
}
```

---

## InputSource 输入源

`InputSource` 是 PAL 层的输入抽象，将不同平台的原始输入转换为统一格式。

```typescript
// pal/input/input-source.ts

export class InputSource {
    // 每种输入设备有独立的 InputSource
    // 负责将平台特定的输入事件转换为引擎标准事件

    // 键盘输入源
    keyboard: InputSourceKeyboard;
    // 鼠标输入源
    mouse: InputSourceMouse;
    // 触摸输入源
    touchscreen: InputSourceTouchscreen;
    // 加速度计输入源
    accelerometer: InputSourceAccelerometer;
}
```

---

## 多平台适配

### Web 平台

```
DOM 事件 → InputSource 转换 → Input 事件分发

document.addEventListener('keydown', (e) => {
    inputSource.keyboard.dispatch(EventKeyboard, keyCode);
});

canvas.addEventListener('touchstart', (e) => {
    inputSource.touchscreen.dispatch(EventTouch, touches);
});
```

### 原生平台

```
系统事件 → JNI/JSB → InputSource → Input 事件分发

Android: KeyEvent / MotionEvent → JNI → TS
iOS: UIResponder touch events → JSB → TS
```

### 小游戏平台

```
wx.onTouchStart((e) => {
    inputSource.touchscreen.dispatch(EventTouch, e.touches);
});
```

---

## 技术原理

### 1. 统一事件接口

不同平台输入差异被 PAL 层屏蔽：

```
Web 触摸:     TouchEvent.touches[i]     ─┐
Native 触摸:  MotionEvent → JNI 转换     ─┤─→ EventTouch (统一格式)
Minigame:     wx.onTouchStart           ─┘   (location, ID, phase)
```

### 2. 触摸点管理

```typescript
// pal/input/touch-manager.ts
// 管理所有活跃的触摸点

class TouchManager {
    // 维护触摸点池
    // 每个 Touch 对象: { id, x, y, force }
    // 支持多点触控（最多 10 个触摸点）
}
```

### 3. 事件冒泡

输入事件沿节点树冒泡：

```
Root
├── Scene
│   ├── NodeA ← 触摸点
│   │   ├── ChildB (先收到)
│   │   └── ChildC
│   └── NodeD
```

触摸事件先传递给最顶层节点，然后沿树冒泡，任何节点都可以 `event.propagationStopped = true` 中止冒泡。

---

## 下一步

完成输入系统的学习后，继续学习 [05-粒子系统](./05-particle-system.md)。
