# 输入系统设计 (@nova/input)

## 概述

输入系统负责处理键盘、鼠标、触摸和游戏手柄的输入，提供统一的查询接口，支持输入映射和组合键。

## 设计目标

1. **统一接口**: 所有输入设备使用相同的查询方式
2. **输入映射**: 支持自定义按键绑定
3. **事件驱动**: 支持即时响应和轮询两种模式
4. **多平台**: 兼容桌面和移动端

## 核心类型

### InputManager - 输入管理器

```typescript
// input-manager.ts
export class InputManager {
  private keyboard: Keyboard;
  private mouse: Mouse;
  private touch: Touch;
  private gamepad: GamepadManager;

  constructor(element: HTMLElement) {
    this.keyboard = new Keyboard(element);
    this.mouse = new Mouse(element);
    this.touch = new Touch(element);
    this.gamepad = new GamepadManager();
  }

  // 键盘
  isKeyDown(key: string): boolean {
    return this.keyboard.isKeyDown(key);
  }

  isKeyUp(key: string): boolean {
    return this.keyboard.isKeyUp(key);
  }

  isKeyJustPressed(key: string): boolean {
    return this.keyboard.isKeyJustPressed(key);
  }

  isKeyJustReleased(key: string): boolean {
    return this.keyboard.isKeyJustReleased(key);
  }

  // 鼠标
  getMousePosition(): Vec2 {
    return this.mouse.position;
  }

  getMouseDelta(): Vec2 {
    return this.mouse.delta;
  }

  isMouseButtonDown(button: number): boolean {
    return this.mouse.isButtonDown(button);
  }

  isMouseButtonJustPressed(button: number): boolean {
    return this.mouse.isButtonJustPressed(button);
  }

  getMouseWheel(): Vec2 {
    return this.mouse.wheel;
  }

  // 触摸
  getTouchCount(): number {
    return this.touch.count;
  }

  getTouch(index: number): TouchPoint | null {
    return this.touch.getTouch(index);
  }

  getTouches(): TouchPoint[] {
    return this.touch.getTouches();
  }

  // 游戏手柄
  getGamepad(index: number): GamepadState | null {
    return this.gamepad.getGamepad(index);
  }

  // 更新 (每帧调用)
  update(): void {
    this.keyboard.update();
    this.mouse.update();
    this.touch.update();
    this.gamepad.update();
  }

  // 销毁
  destroy(): void {
    this.keyboard.destroy();
    this.mouse.destroy();
    this.touch.destroy();
    this.gamepad.destroy();
  }
}
```

### Keyboard - 键盘输入

```typescript
// keyboard.ts
export class Keyboard {
  private element: HTMLElement;
  private keyStates: Map<string, KeyState> = new Map();
  private justPressed: Set<string> = new Set();
  private justReleased: Set<string> = new Set();

  // 事件
  onKeyDown: Signal<[key: string, event: KeyboardEvent]> = new Signal();
  onKeyUp: Signal<[key: string, event: KeyboardEvent]> = new Signal();
  onKeyPress: Signal<[key: string, event: KeyboardEvent]> = new Signal();

  constructor(element: HTMLElement) {
    this.element = element;
    this.bindEvents();
  }

  private bindEvents(): void {
    this.element.addEventListener('keydown', this.handleKeyDown);
    this.element.addEventListener('keyup', this.handleKeyUp);
    this.element.addEventListener('keypress', this.handleKeyPress);
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    const key = e.key;
    const state = this.keyStates.get(key);

    if (state !== KeyState.Down) {
      this.keyStates.set(key, KeyState.Down);
      this.justPressed.add(key);
    }

    this.onKeyDown.emit(key, e);
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    const key = e.key;
    this.keyStates.set(key, KeyState.Up);
    this.justReleased.add(key);
    this.onKeyUp.emit(key, e);
  };

  private handleKeyPress = (e: KeyboardEvent): void => {
    this.onKeyPress.emit(e.key, e);
  };

  isKeyDown(key: string): boolean {
    return this.keyStates.get(key) === KeyState.Down;
  }

  isKeyUp(key: string): boolean {
    return this.keyStates.get(key) === KeyState.Up;
  }

  isKeyJustPressed(key: string): boolean {
    return this.justPressed.has(key);
  }

  isKeyJustReleased(key: string): boolean {
    return this.justReleased.has(key);
  }

  // 检查组合键
  areKeysDown(...keys: string[]): boolean {
    return keys.every(key => this.isKeyDown(key));
  }

  // 获取所有按下的键
  getPressedKeys(): string[] {
    const keys: string[] = [];
    for (const [key, state] of this.keyStates) {
      if (state === KeyState.Down) {
        keys.push(key);
      }
    }
    return keys;
  }

  // 每帧更新
  update(): void {
    this.justPressed.clear();
    this.justReleased.clear();
  }

  destroy(): void {
    this.element.removeEventListener('keydown', this.handleKeyDown);
    this.element.removeEventListener('keyup', this.handleKeyUp);
    this.element.removeEventListener('keypress', this.handleKeyPress);
  }
}

enum KeyState {
  Up = 'up',
  Down = 'down'
}
```

### Mouse - 鼠标输入

```typescript
// mouse.ts
export enum MouseButton {
  Left = 0,
  Middle = 1,
  Right = 2,
  Back = 3,
  Forward = 4
}

export class Mouse {
  private element: HTMLElement;
  private position: Vec2 = new Vec2();
  private lastPosition: Vec2 = new Vec2();
  private delta: Vec2 = new Vec2();
  private wheel: Vec2 = new Vec2();
  private buttonStates: Map<number, ButtonState> = new Map();
  private justPressed: Set<number> = new Set();
  private justReleased: Set<number> = new Set();

  // 事件
  onMove: Signal<[x: number, y: number, dx: number, dy: number]> = new Signal();
  onDown: Signal<[button: number, x: number, y: number]> = new Signal();
  onUp: Signal<[button: number, x: number, y: number]> = new Signal();
  onWheel: Signal<[deltaX: number, deltaY: number]> = new Signal();

  private isPointerLocked: boolean = false;

  constructor(element: HTMLElement) {
    this.element = element;
    this.bindEvents();
  }

  private bindEvents(): void {
    this.element.addEventListener('mousemove', this.handleMouseMove);
    this.element.addEventListener('mousedown', this.handleMouseDown);
    this.element.addEventListener('mouseup', this.handleMouseUp);
    this.element.addEventListener('wheel', this.handleWheel);
    this.element.addEventListener('contextmenu', this.handleContextMenu);
    document.addEventListener('pointerlockchange', this.handlePointerLockChange);
  }

  private handleMouseMove = (e: MouseEvent): void => {
    this.lastPosition.copy(this.position);

    if (this.isPointerLocked) {
      // 指针锁定模式，使用相对坐标
      this.delta.x += e.movementX;
      this.delta.y += e.movementY;
      this.position.x += e.movementX;
      this.position.y += e.movementY;
    } else {
      // 普通模式，使用绝对坐标
      const rect = this.element.getBoundingClientRect();
      this.position.x = e.clientX - rect.left;
      this.position.y = e.clientY - rect.top;
      this.delta.x = this.position.x - this.lastPosition.x;
      this.delta.y = this.position.y - this.lastPosition.y;
    }

    this.onMove.emit(this.position.x, this.position.y, this.delta.x, this.delta.y);
  };

  private handleMouseDown = (e: MouseEvent): void => {
    this.buttonStates.set(e.button, ButtonState.Down);
    this.justPressed.add(e.button);
    this.onDown.emit(e.button, this.position.x, this.position.y);
  };

  private handleMouseUp = (e: MouseEvent): void => {
    this.buttonStates.set(e.button, ButtonState.Up);
    this.justReleased.add(e.button);
    this.onUp.emit(e.button, this.position.x, this.position.y);
  };

  private handleWheel = (e: WheelEvent): void => {
    e.preventDefault();
    this.wheel.x += e.deltaX;
    this.wheel.y += e.deltaY;
    this.onWheel.emit(e.deltaX, e.deltaY);
  };

  private handleContextMenu = (e: Event): void => {
    e.preventDefault();
  };

  private handlePointerLockChange = (): void => {
    this.isPointerLocked = document.pointerLockElement === this.element;
  };

  // 查询
  getPosition(): Vec2 {
    return this.position.clone();
  }

  getDelta(): Vec2 {
    return this.delta.clone();
  }

  isButtonDown(button: MouseButton | number): boolean {
    return this.buttonStates.get(button) === ButtonState.Down;
  }

  isButtonJustPressed(button: MouseButton | number): boolean {
    return this.justPressed.has(button);
  }

  isButtonJustReleased(button: MouseButton | number): boolean {
    return this.justReleased.has(button);
  }

  getWheel(): Vec2 {
    return this.wheel.clone();
  }

  // 指针锁定
  lockPointer(): void {
    this.element.requestPointerLock();
  }

  unlockPointer(): void {
    document.exitPointerLock();
  }

  isLocked(): boolean {
    return this.isPointerLocked;
  }

  // 每帧更新
  update(): void {
    this.delta.set(0, 0);
    this.wheel.set(0, 0);
    this.justPressed.clear();
    this.justReleased.clear();
  }

  destroy(): void {
    this.element.removeEventListener('mousemove', this.handleMouseMove);
    this.element.removeEventListener('mousedown', this.handleMouseDown);
    this.element.removeEventListener('mouseup', this.handleMouseUp);
    this.element.removeEventListener('wheel', this.handleWheel);
    this.element.removeEventListener('contextmenu', this.handleContextMenu);
    document.removeEventListener('pointerlockchange', this.handlePointerLockChange);
  }
}

enum ButtonState {
  Up = 'up',
  Down = 'down'
}
```

### Touch - 触摸输入

```typescript
// touch.ts
export interface TouchPoint {
  id: number;
  position: Vec2;
  startPosition: Vec2;
  delta: Vec2;
  pressure: number;
}

export class Touch {
  private element: HTMLElement;
  private touches: Map<number, TouchPoint> = new Map();
  private justStarted: Set<number> = new Set();
  private justEnded: Set<number> = new Set();
  private endedTouches: TouchPoint[] = [];

  // 事件
  onTouchStart: Signal<[touches: TouchPoint[]]> = new Signal();
  onTouchMove: Signal<[touches: TouchPoint[]]> = new Signal();
  onTouchEnd: Signal<[touches: TouchPoint[]]> = new Signal();
  onTap: Signal<[x: number, y: number]> = new Signal();

  // 点击检测
  private tapThreshold: number = 10; // 像素
  private tapTimeThreshold: number = 300; // 毫秒

  constructor(element: HTMLElement) {
    this.element = element;
    this.bindEvents();
  }

  private bindEvents(): void {
    this.element.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    this.element.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    this.element.addEventListener('touchend', this.handleTouchEnd, { passive: false });
    this.element.addEventListener('touchcancel', this.handleTouchEnd, { passive: false });
  }

  private handleTouchStart = (e: TouchEvent): void => {
    e.preventDefault();
    const rect = this.element.getBoundingClientRect();
    const newTouches: TouchPoint[] = [];

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const point: TouchPoint = {
        id: touch.identifier,
        position: new Vec2(touch.clientX - rect.left, touch.clientY - rect.top),
        startPosition: new Vec2(touch.clientX - rect.left, touch.clientY - rect.top),
        delta: new Vec2(),
        pressure: (touch as any).force || 1
      };

      this.touches.set(touch.identifier, point);
      this.justStarted.add(touch.identifier);
      newTouches.push(point);
    }

    if (newTouches.length > 0) {
      this.onTouchStart.emit(newTouches);
    }
  };

  private handleTouchMove = (e: TouchEvent): void => {
    e.preventDefault();
    const rect = this.element.getBoundingClientRect();
    const movedTouches: TouchPoint[] = [];

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const point = this.touches.get(touch.identifier);

      if (point) {
        const oldPos = point.position.clone();
        point.position.x = touch.clientX - rect.left;
        point.position.y = touch.clientY - rect.top;
        point.delta.x = point.position.x - oldPos.x;
        point.delta.y = point.position.y - oldPos.y;
        point.pressure = (touch as any).force || 1;
        movedTouches.push(point);
      }
    }

    if (movedTouches.length > 0) {
      this.onTouchMove.emit(movedTouches);
    }
  };

  private handleTouchEnd = (e: TouchEvent): void => {
    e.preventDefault();
    const rect = this.element.getBoundingClientRect();
    const endedTouches: TouchPoint[] = [];

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const point = this.touches.get(touch.identifier);

      if (point) {
        const endTime = performance.now();
        const startPos = point.startPosition;
        const endPos = new Vec2(touch.clientX - rect.left, touch.clientY - rect.top);

        // 检测点击
        const distance = startPos.distance(endPos);
        if (distance < this.tapThreshold) {
          this.onTap.emit(endPos.x, endPos.y);
        }

        this.justEnded.add(touch.identifier);
        this.endedTouches.push(point);
        endedTouches.push(point);
        this.touches.delete(touch.identifier);
      }
    }

    if (endedTouches.length > 0) {
      this.onTouchEnd.emit(endedTouches);
    }
  };

  // 查询
  get count(): number {
    return this.touches.size;
  }

  getTouch(id: number): TouchPoint | null {
    return this.touches.get(id) || null;
  }

  getTouches(): TouchPoint[] {
    return Array.from(this.touches.values());
  }

  getFirstTouch(): TouchPoint | null {
    const touches = this.getTouches();
    return touches.length > 0 ? touches[0] : null;
  }

  isTouchJustStarted(id: number): boolean {
    return this.justStarted.has(id);
  }

  isTouchJustEnded(id: number): boolean {
    return this.justEnded.has(id);
  }

  // 获取滑动方向
  getSwipeDirection(): Vec2 | null {
    if (this.touches.size === 0) return null;
    const touch = this.getFirstTouch();
    if (!touch) return null;

    const delta = touch.position.subtract(touch.startPosition);
    const len = delta.length();
    if (len < 30) return null; // 最小滑动距离

    return delta.normalize();
  }

  // 多指手势
  getPinchScale(): number {
    const touches = this.getTouches();
    if (touches.length < 2) return 1;

    const t1 = touches[0];
    const t2 = touches[1];
    const currentDist = t1.position.distance(t2.position);
    const startDist = t1.startPosition.distance(t2.startPosition);

    return startDist > 0 ? currentDist / startDist : 1;
  }

  getRotationAngle(): number {
    const touches = this.getTouches();
    if (touches.length < 2) return 0;

    const t1 = touches[0];
    const t2 = touches[1];

    const currentAngle = t2.position.subtract(t1.position).angle();
    const startAngle = t2.startPosition.subtract(t1.startPosition).angle();

    return currentAngle - startAngle;
  }

  // 每帧更新
  update(): void {
    this.justStarted.clear();
    this.justEnded.clear();
    this.endedTouches = [];

    // 重置 delta
    for (const touch of this.touches.values()) {
      touch.delta.set(0, 0);
    }
  }

  destroy(): void {
    this.element.removeEventListener('touchstart', this.handleTouchStart);
    this.element.removeEventListener('touchmove', this.handleTouchMove);
    this.element.removeEventListener('touchend', this.handleTouchEnd);
    this.element.removeEventListener('touchcancel', this.handleTouchEnd);
  }
}
```

### GamepadManager - 游戏手柄

```typescript
// gamepad.ts
export interface GamepadState {
  index: number;
  id: string;
  connected: boolean;
  buttons: boolean[];
  buttonValues: number[];
  axes: number[];
}

export class GamepadManager {
  private gamepads: Map<number, GamepadState> = new Map();
  private previousButtons: Map<number, boolean[]> = new Map();

  onConnect: Signal<[index: number]> = new Signal();
  onDisconnect: Signal<[index: number]> = new Signal();

  constructor() {
    this.bindEvents();
    this.scanGamepads();
  }

  private bindEvents(): void {
    window.addEventListener('gamepadconnected', this.handleConnect);
    window.addEventListener('gamepaddisconnected', this.handleDisconnect);
  }

  private handleConnect = (e: GamepadEvent): void => {
    this.addGamepad(e.gamepad);
    this.onConnect.emit(e.gamepad.index);
  };

  private handleDisconnect = (e: GamepadEvent): void => {
    const gamepad = this.gamepads.get(e.gamepad.index);
    if (gamepad) {
      gamepad.connected = false;
    }
    this.onDisconnect.emit(e.gamepad.index);
  };

  private addGamepad(gamepad: Gamepad): void {
    this.gamepads.set(gamepad.index, {
      index: gamepad.index,
      id: gamepad.id,
      connected: true,
      buttons: new Array(gamepad.buttons.length).fill(false),
      buttonValues: new Array(gamepad.buttons.length).fill(0),
      axes: new Array(gamepad.axes.length).fill(0)
    });
    this.previousButtons.set(gamepad.index, new Array(gamepad.buttons.length).fill(false));
  }

  private scanGamepads(): void {
    const gamepads = navigator.getGamepads();
    for (const gamepad of gamepads) {
      if (gamepad && !this.gamepads.has(gamepad.index)) {
        this.addGamepad(gamepad);
      }
    }
  }

  getGamepad(index: number): GamepadState | null {
    return this.gamepads.get(index) || null;
  }

  getConnectedGamepads(): GamepadState[] {
    return Array.from(this.gamepads.values()).filter(g => g.connected);
  }

  isButtonDown(index: number, button: number): boolean {
    const gamepad = this.gamepads.get(index);
    return gamepad ? gamepad.buttons[button] || false : false;
  }

  isButtonJustPressed(index: number, button: number): boolean {
    const gamepad = this.gamepads.get(index);
    const prev = this.previousButtons.get(index);
    if (!gamepad || !prev) return false;
    return gamepad.buttons[button] && !prev[button];
  }

  getAxis(index: number, axis: number): number {
    const gamepad = this.gamepads.get(index);
    return gamepad ? gamepad.axes[axis] || 0 : 0;
  }

  // 获取左摇杆
  getLeftStick(index: number): Vec2 {
    return new Vec2(
      this.applyDeadzone(this.getAxis(index, 0)),
      this.applyDeadzone(this.getAxis(index, 1))
    );
  }

  // 获取右摇杆
  getRightStick(index: number): Vec2 {
    return new Vec2(
      this.applyDeadzone(this.getAxis(index, 2)),
      this.applyDeadzone(this.getAxis(index, 3))
    );
  }

  private deadzone: number = 0.15;

  private applyDeadzone(value: number): number {
    if (Math.abs(value) < this.deadzone) return 0;
    const sign = value > 0 ? 1 : -1;
    return sign * (Math.abs(value) - this.deadzone) / (1 - this.deadzone);
  }

  setDeadzone(value: number): void {
    this.deadzone = Math.max(0, Math.min(1, value));
  }

  // 振动
  async vibrate(index: number, duration: number, strongMagnitude: number = 1, weakMagnitude: number = 1): Promise<void> {
    const gamepads = navigator.getGamepads();
    const gamepad = gamepads[index];
    if (gamepad && 'vibrationActuator' in gamepad) {
      await (gamepad as any).vibrationActuator?.playEffect?.('dual-rumble', {
        duration,
        strongMagnitude,
        weakMagnitude
      });
    }
  }

  update(): void {
    const gamepads = navigator.getGamepads();

    for (const gamepad of gamepads) {
      if (!gamepad) continue;

      const state = this.gamepads.get(gamepad.index);
      if (!state || !state.connected) continue;

      // 保存上一帧按钮状态
      const prev = this.previousButtons.get(gamepad.index);
      if (prev) {
        for (let i = 0; i < gamepad.buttons.length; i++) {
          prev[i] = state.buttons[i];
        }
      }

      // 更新当前状态
      for (let i = 0; i < gamepad.buttons.length; i++) {
        state.buttons[i] = gamepad.buttons[i].pressed;
        state.buttonValues[i] = gamepad.buttons[i].value;
      }

      for (let i = 0; i < gamepad.axes.length; i++) {
        state.axes[i] = gamepad.axes[i];
      }
    }
  }

  destroy(): void {
    window.removeEventListener('gamepadconnected', this.handleConnect);
    window.removeEventListener('gamepaddisconnected', this.handleDisconnect);
  }
}

// 标准按钮映射
export enum GamepadButton {
  A = 0,
  B = 1,
  X = 2,
  Y = 3,
  LeftBumper = 4,
  RightBumper = 5,
  LeftTrigger = 6,
  RightTrigger = 7,
  Select = 8,
  Start = 9,
  LeftStick = 10,
  RightStick = 11,
  DPadUp = 12,
  DPadDown = 13,
  DPadLeft = 14,
  DPadRight = 15
}
```

## 输入映射

### InputAction - 输入动作映射

```typescript
// input-action.ts
export interface InputBinding {
  key?: string;           // 键盘按键
  mouseButton?: number;   // 鼠标按钮
  gamepadButton?: number; // 手柄按钮
  gamepadAxis?: number;   // 手柄轴
  positive?: boolean;     // 轴的正向
}

export class InputAction {
  private bindings: InputBinding[] = [];
  private input: InputManager;

  constructor(input: InputManager, bindings: InputBinding | InputBinding[]) {
    this.input = input;
    this.bindings = Array.isArray(bindings) ? bindings : [bindings];
  }

  isPressed(): boolean {
    for (const binding of this.bindings) {
      if (binding.key && this.input.isKeyDown(binding.key)) return true;
      if (binding.mouseButton !== undefined &&
          this.input.isMouseButtonDown(binding.mouseButton)) return true;
      // gamepad 检查...
    }
    return false;
  }

  isJustPressed(): boolean {
    for (const binding of this.bindings) {
      if (binding.key && this.input.isKeyJustPressed(binding.key)) return true;
      if (binding.mouseButton !== undefined &&
          this.input.isMouseButtonJustPressed(binding.mouseButton)) return true;
    }
    return false;
  }

  getValue(): number {
    for (const binding of this.bindings) {
      if (binding.gamepadAxis !== undefined) {
        const gamepad = this.input.getGamepad(0);
        if (gamepad) {
          let value = gamepad.axes[binding.gamepadAxis] || 0;
          if (binding.positive === false) value = -value;
          if (binding.positive === true) value = Math.max(0, value);
          return value;
        }
      }
    }
    return this.isPressed() ? 1 : 0;
  }
}

// 使用示例
const inputManager = new InputManager(canvas);

const moveLeft = new InputAction(inputManager, [
  { key: 'a' },
  { key: 'ArrowLeft' },
  { gamepadAxis: 0, positive: false }
]);

const jump = new InputAction(inputManager, [
  { key: ' ' },
  { key: 'w' },
  { mouseButton: MouseButton.Left },
  { gamepadButton: GamepadButton.A }
]);

// 游戏循环
if (jump.isJustPressed()) {
  player.jump();
}
```

## 虚拟按键

### VirtualJoystick - 虚拟摇杆

```typescript
// virtual-joystick.ts
export class VirtualJoystick {
  private container: HTMLElement;
  private base: HTMLElement;
  private stick: HTMLElement;
  private position: Vec2 = new Vec2();
  private active: boolean = false;
  private touchId: number | null = null;

  onChange: Signal<[x: number, y: number]> = new Signal();

  constructor(container: HTMLElement) {
    this.container = container;
    this.createUI();
    this.bindEvents();
  }

  private createUI(): void {
    this.base = document.createElement('div');
    this.base.style.cssText = `
      width: 120px; height: 120px;
      border-radius: 50%;
      background: rgba(255,255,255,0.3);
      position: absolute;
      bottom: 50px; left: 50px;
      touch-action: none;
    `;

    this.stick = document.createElement('div');
    this.stick.style.cssText = `
      width: 50px; height: 50px;
      border-radius: 50%;
      background: rgba(255,255,255,0.8);
      position: absolute;
      left: 35px; top: 35px;
      pointer-events: none;
    `;

    this.base.appendChild(this.stick);
    this.container.appendChild(this.base);
  }

  private bindEvents(): void {
    this.base.addEventListener('touchstart', this.handleStart);
    this.base.addEventListener('touchmove', this.handleMove);
    this.base.addEventListener('touchend', this.handleEnd);
  }

  private handleStart = (e: TouchEvent): void => {
    e.preventDefault();
    const touch = e.touches[0];
    this.touchId = touch.identifier;
    this.active = true;
    this.updatePosition(touch);
  };

  private handleMove = (e: TouchEvent): void => {
    if (!this.active) return;
    e.preventDefault();

    for (let i = 0; i < e.touches.length; i++) {
      if (e.touches[i].identifier === this.touchId) {
        this.updatePosition(e.touches[i]);
        break;
      }
    }
  };

  private handleEnd = (e: TouchEvent): void => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === this.touchId) {
        this.active = false;
        this.touchId = null;
        this.position.set(0, 0);
        this.updateStickPosition();
        this.onChange.emit(0, 0);
        break;
      }
    }
  };

  private updatePosition(touch: Touch): void {
    const rect = this.base.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;

    const maxRadius = 35;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const clampedDist = Math.min(distance, maxRadius);

    const angle = Math.atan2(dy, dx);
    this.position.x = Math.cos(angle) * clampedDist / maxRadius;
    this.position.y = Math.sin(angle) * clampedDist / maxRadius;

    this.updateStickPosition();
    this.onChange.emit(this.position.x, this.position.y);
  }

  private updateStickPosition(): void {
    const x = 35 + this.position.x * 35;
    const y = 35 + this.position.y * 35;
    this.stick.style.left = `${x}px`;
    this.stick.style.top = `${y}px`;
  }

  getValue(): Vec2 {
    return this.position.clone();
  }

  isActive(): boolean {
    return this.active;
  }

  destroy(): void {
    this.base.removeEventListener('touchstart', this.handleStart);
    this.base.removeEventListener('touchmove', this.handleMove);
    this.base.removeEventListener('touchend', this.handleEnd);
    this.container.removeChild(this.base);
  }
}
```

## 使用示例

```typescript
import { InputManager, MouseButton, GamepadButton } from '@nova/input';

class PlayerController {
  private input: InputManager;

  constructor(canvas: HTMLCanvasElement) {
    this.input = new InputManager(canvas);

    // 监听事件
    this.input.keyboard.onKeyDown.on((key, e) => {
      if (key === ' ') {
        this.jump();
      }
    });
  }

  update(dt: number): void {
    // 更新输入状态
    this.input.update();

    // 移动
    const speed = 200;
    let vx = 0;
    let vy = 0;

    if (this.input.isKeyDown('a') || this.input.isKeyDown('ArrowLeft')) {
      vx -= speed;
    }
    if (this.input.isKeyDown('d') || this.input.isKeyDown('ArrowRight')) {
      vx += speed;
    }

    // 使用手柄
    const gamepad = this.input.getGamepad(0);
    if (gamepad) {
      const stick = gamepad.getLeftStick(0);
      vx += stick.x * speed;
      vy += stick.y * speed;
    }

    this.player.velocity.x = vx;

    // 鼠标点击
    if (this.input.isMouseButtonJustPressed(MouseButton.Left)) {
      const pos = this.input.getMousePosition();
      this.shoot(pos);
    }
  }
}
```

## 参考资源

- [MDN - Keyboard Events](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent)
- [MDN - Pointer Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API)
- [MDN - Gamepad API](https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API)
