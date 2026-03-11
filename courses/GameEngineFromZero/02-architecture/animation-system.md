# 动画系统设计 (@nova/animation)

## 概述

动画系统提供帧动画、Tween 动画和动画状态机，支持精灵表动画、UI 动画和角色动画控制。

## 设计目标

1. **多类型支持**: Tween、帧动画、骨骼动画
2. **状态机**: 动画状态管理和平滑过渡
3. **性能优化**: 对象池、批量更新
4. **易用 API**: 链式调用，可配置缓动函数

## Tween 动画

### Tween - 补间动画

```typescript
// tween.ts
export type EasingFunction = (t: number) => number;

// 内置缓动函数
export const Easing = {
  linear: (t: number) => t,

  // 二次
  easeInQuad: (t: number) => t * t,
  easeOutQuad: (t: number) => t * (2 - t),
  easeInOutQuad: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,

  // 三次
  easeInCubic: (t: number) => t * t * t,
  easeOutCubic: (t: number) => (--t) * t * t + 1,
  easeInOutCubic: (t: number) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,

  // 四次
  easeInQuart: (t: number) => t * t * t * t,
  easeOutQuart: (t: number) => 1 - (--t) * t * t * t,
  easeInOutQuart: (t: number) => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,

  // 弹性
  easeInElastic: (t: number) => {
    if (t === 0 || t === 1) return t;
    return -Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI);
  },
  easeOutElastic: (t: number) => {
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10 * t) * Math.sin((t - 0.1) * 5 * Math.PI) + 1;
  },

  // 弹跳
  easeOutBounce: (t: number) => {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t;
    } else if (t < 2 / 2.75) {
      return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    } else if (t < 2.5 / 2.75) {
      return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    } else {
      return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
    }
  },

  // 正弦
  easeInSine: (t: number) => 1 - Math.cos(t * Math.PI / 2),
  easeOutSine: (t: number) => Math.sin(t * Math.PI / 2),
  easeInOutSine: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,

  // 指数
  easeInExpo: (t: number) => t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),
  easeOutExpo: (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  easeInOutExpo: (t: number) => {
    if (t === 0 || t === 1) return t;
    return t < 0.5
      ? Math.pow(2, 20 * t - 10) / 2
      : (2 - Math.pow(2, -20 * t + 10)) / 2;
  },
};

export class Tween {
  private target: any;
  private properties: Map<string, { from: number; to: number }> = new Map();
  private duration: number = 1000;
  private elapsed: number = 0;
  private easing: EasingFunction = Easing.linear;
  private loop: boolean = false;
  private yoyo: boolean = false;
  private reverse: boolean = false;

  private onStart: (() => void) | null = null;
  private onUpdate: ((progress: number) => void) | null = null;
  private onComplete: (() => void) | null = null;

  private _isPlaying: boolean = false;
  private _isComplete: boolean = false;

  constructor(target: any) {
    this.target = target;
  }

  // 配置
  to(properties: Record<string, number>, duration: number): this {
    for (const [key, value] of Object.entries(properties)) {
      this.properties.set(key, { from: this.target[key], to: value });
    }
    this.duration = duration;
    return this;
  }

  from(properties: Record<string, number>): this {
    for (const [key, value] of Object.entries(properties)) {
      const prop = this.properties.get(key);
      if (prop) {
        prop.from = value;
      } else {
        this.properties.set(key, { from: value, to: this.target[key] });
      }
    }
    return this;
  }

  setEasing(easing: EasingFunction): this {
    this.easing = easing;
    return this;
  }

  setLoop(loop: boolean = true): this {
    this.loop = loop;
    return this;
  }

  setYoyo(yoyo: boolean = true): this {
    this.yoyo = yoyo;
    return this;
  }

  // 回调
  onStartCallback(callback: () => void): this {
    this.onStart = callback;
    return this;
  }

  onUpdateCallback(callback: (progress: number) => void): this {
    this.onUpdate = callback;
    return this;
  }

  onCompleteCallback(callback: () => void): this {
    this.onComplete = callback;
    return this;
  }

  // 控制
  start(): this {
    this._isPlaying = true;
    this._isComplete = false;
    this.elapsed = 0;

    // 记录起始值
    for (const [key, prop] of this.properties) {
      prop.from = this.target[key];
    }

    this.onStart?.();
    TweenManager.add(this);
    return this;
  }

  stop(): this {
    this._isPlaying = false;
    TweenManager.remove(this);
    return this;
  }

  pause(): this {
    this._isPlaying = false;
    return this;
  }

  resume(): this {
    if (!this._isComplete) {
      this._isPlaying = true;
    }
    return this;
  }

  reset(): this {
    this._isPlaying = false;
    this._isComplete = false;
    this.elapsed = 0;
    this.reverse = false;

    // 恢复起始值
    for (const [key, prop] of this.properties) {
      this.target[key] = prop.from;
    }

    return this;
  }

  // 更新
  update(dt: number): boolean {
    if (!this._isPlaying) return false;

    this.elapsed += dt;

    let progress = Math.min(this.elapsed / this.duration, 1);

    // Yoyo 反转
    if (this.yoyo) {
      if (this.reverse) {
        progress = 1 - progress;
      }
    }

    // 应用缓动
    const easedProgress = this.easing(progress);

    // 更新属性
    for (const [key, prop] of this.properties) {
      this.target[key] = prop.from + (prop.to - prop.from) * easedProgress;
    }

    this.onUpdate?.(progress);

    // 完成检查
    if (this.elapsed >= this.duration) {
      if (this.yoyo && !this.reverse) {
        this.reverse = true;
        this.elapsed = 0;
      } else if (this.loop) {
        this.elapsed = 0;
        this.reverse = false;
        // 重新记录起始值
        for (const [key, prop] of this.properties) {
          prop.from = this.target[key];
        }
      } else {
        this._isPlaying = false;
        this._isComplete = true;
        this.onComplete?.();
        return true; // 标记完成
      }
    }

    return false;
  }

  get isPlaying(): boolean {
    return this._isPlaying;
  }

  get isComplete(): boolean {
    return this._isComplete;
  }
}

// Tween 管理器
export class TweenManager {
  private static tweens: Set<Tween> = new Set();

  static add(tween: Tween): void {
    this.tweens.add(tween);
  }

  static remove(tween: Tween): void {
    this.tweens.delete(tween);
  }

  static update(dt: number): void {
    const completed: Tween[] = [];

    for (const tween of this.tweens) {
      if (tween.update(dt)) {
        completed.push(tween);
      }
    }

    for (const tween of completed) {
      this.tweens.delete(tween);
    }
  }

  static removeAll(): void {
    this.tweens.clear();
  }
}
```

## 帧动画

### SpriteAnimation - 精灵动画

```typescript
// sprite-animation.ts
export interface Frame {
  texture: Texture;
  duration: number; // 毫秒
  offsetX?: number;
  offsetY?: number;
}

export interface AnimationClip {
  name: string;
  frames: Frame[];
  loop: boolean;
}

export class SpriteAnimation {
  private clips: Map<string, AnimationClip> = new Map();
  private currentClip: AnimationClip | null = null;
  private currentFrame: number = 0;
  private elapsed: number = 0;

  private _isPlaying: boolean = false;
  private _speed: number = 1;

  onFrameChange: Signal<[frame: number]> = new Signal();
  onAnimationEnd: Signal<[name: string]> = new Signal();

  // 添加动画
  addClip(clip: AnimationClip): void {
    this.clips.set(clip.name, clip);
  }

  // 从精灵表创建动画
  createFromSpritesheet(
    name: string,
    texture: Texture,
    frameWidth: number,
    frameHeight: number,
    frames: number,
    options: {
      duration?: number;
      loop?: boolean;
      offsetX?: number;
      offsetY?: number;
    } = {}
  ): void {
    const frameDuration = options.duration ?? 100;
    const clipFrames: Frame[] = [];

    const cols = Math.floor(texture.width / frameWidth);
    const rows = Math.floor(texture.height / frameHeight);

    for (let i = 0; i < frames && i < cols * rows; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);

      // 创建子纹理
      const frameTexture = texture.subTexture(
        col * frameWidth,
        row * frameHeight,
        frameWidth,
        frameHeight
      );

      clipFrames.push({
        texture: frameTexture,
        duration: frameDuration,
        offsetX: options.offsetX ?? 0,
        offsetY: options.offsetY ?? 0,
      });
    }

    this.addClip({
      name,
      frames: clipFrames,
      loop: options.loop ?? true,
    });
  }

  // 播放
  play(name: string, restart: boolean = false): void {
    const clip = this.clips.get(name);
    if (!clip) {
      console.warn(`Animation clip not found: ${name}`);
      return;
    }

    if (this.currentClip === clip && !restart && this._isPlaying) {
      return;
    }

    this.currentClip = clip;
    this.currentFrame = 0;
    this.elapsed = 0;
    this._isPlaying = true;

    this.onFrameChange.emit(0);
  }

  stop(): void {
    this._isPlaying = false;
  }

  pause(): void {
    this._isPlaying = false;
  }

  resume(): void {
    if (this.currentClip) {
      this._isPlaying = true;
    }
  }

  // 更新
  update(dt: number): void {
    if (!this._isPlaying || !this.currentClip) return;

    this.elapsed += dt * this._speed;

    const frame = this.currentClip.frames[this.currentFrame];
    if (this.elapsed >= frame.duration) {
      this.elapsed -= frame.duration;
      this.currentFrame++;

      if (this.currentFrame >= this.currentClip.frames.length) {
        if (this.currentClip.loop) {
          this.currentFrame = 0;
        } else {
          this.currentFrame = this.currentClip.frames.length - 1;
          this._isPlaying = false;
          this.onAnimationEnd.emit(this.currentClip.name);
          return;
        }
      }

      this.onFrameChange.emit(this.currentFrame);
    }
  }

  // 获取当前帧
  getCurrentFrame(): Frame | null {
    if (!this.currentClip) return null;
    return this.currentClip.frames[this.currentFrame];
  }

  get currentClipName(): string | null {
    return this.currentClip?.name ?? null;
  }

  get isPlaying(): boolean {
    return this._isPlaying;
  }

  get speed(): number {
    return this._speed;
  }

  set speed(value: number) {
    this._speed = Math.max(0, value);
  }
}
```

## 动画状态机

### AnimationStateMachine - 动画状态机

```typescript
// animation-state-machine.ts
export interface AnimationState {
  name: string;
  clip: string;
  loop: boolean;
  speed: number;
  onEnter?: () => void;
  onExit?: () => void;
}

export interface AnimationTransition {
  from: string;
  to: string;
  condition: () => boolean;
  duration: number; // 混合时间 (毫秒)
  hasExitTime: boolean;
  exitTime: number; // 0-1
}

export class AnimationStateMachine {
  private states: Map<string, AnimationState> = new Map();
  private transitions: AnimationTransition[] = [];
  private currentState: AnimationState | null = null;
  private previousState: AnimationState | null = null;

  private blendDuration: number = 0;
  private blendElapsed: number = 0;
  private _isBlending: boolean = false;

  // 参数 (用于条件判断)
  private parameters: Map<string, any> = new Map();

  // 动画组件引用
  private animation: SpriteAnimation;

  onChange: Signal<[state: string]> = new Signal();

  constructor(animation: SpriteAnimation) {
    this.animation = animation;
  }

  // 添加状态
  addState(state: AnimationState): void {
    this.states.set(state.name, state);
  }

  // 添加转换
  addTransition(transition: AnimationTransition): void {
    this.transitions.push(transition);
  }

  // 设置参数
  setParameter(name: string, value: any): void {
    this.parameters.set(name, value);
  }

  getParameter(name: string): any {
    return this.parameters.get(name);
  }

  // 初始化
  start(stateName: string): void {
    const state = this.states.get(stateName);
    if (!state) {
      console.warn(`State not found: ${stateName}`);
      return;
    }

    this.currentState = state;
    this.animation.play(state.clip);
    this.animation.speed = state.speed;
    this.onChange.emit(stateName);
  }

  // 更新
  update(dt: number): void {
    if (!this.currentState) return;

    // 更新混合
    if (this._isBlending) {
      this.blendElapsed += dt;
      if (this.blendElapsed >= this.blendDuration) {
        this._isBlending = false;
        this.previousState = null;
      }
    }

    // 检查转换
    this.checkTransitions();
  }

  private checkTransitions(): void {
    if (!this.currentState) return;

    for (const transition of this.transitions) {
      if (transition.from !== this.currentState.name) continue;

      // 检查退出时间
      if (transition.hasExitTime) {
        const progress = this.getAnimationProgress();
        if (progress < transition.exitTime) continue;
      }

      // 检查条件
      if (transition.condition()) {
        this.transitionTo(transition.to, transition.duration);
        break;
      }
    }
  }

  // 获取当前动画进度
  private getAnimationProgress(): number {
    // 简化实现
    return 0;
  }

  // 状态转换
  private transitionTo(stateName: string, blendDuration: number = 0): void {
    const newState = this.states.get(stateName);
    if (!newState || newState === this.currentState) return;

    // 退出当前状态
    this.currentState?.onExit?.();

    // 开始混合
    this.previousState = this.currentState;
    this.currentState = newState;
    this.blendDuration = blendDuration;
    this.blendElapsed = 0;
    this._isBlending = blendDuration > 0;

    // 进入新状态
    newState.onEnter?.();
    this.animation.play(newState.clip);
    this.animation.speed = newState.speed;

    this.onChange.emit(stateName);
  }

  // 强制切换状态
  setState(stateName: string, blendDuration: number = 0): void {
    this.transitionTo(stateName, blendDuration);
  }

  get currentStateName(): string | null {
    return this.currentState?.name ?? null;
  }

  get isBlending(): boolean {
    return this._isBlending;
  }

  get blendProgress(): number {
    if (!this._isBlending || this.blendDuration === 0) return 1;
    return Math.min(this.blendElapsed / this.blendDuration, 1);
  }
}

// 创建示例
function createCharacterAnimator(animation: SpriteAnimation): AnimationStateMachine {
  const fsm = new AnimationStateMachine(animation);

  // 添加状态
  fsm.addState({ name: 'idle', clip: 'idle', loop: true, speed: 1 });
  fsm.addState({ name: 'walk', clip: 'walk', loop: true, speed: 1 });
  fsm.addState({ name: 'run', clip: 'run', loop: true, speed: 1.2 });
  fsm.addState({ name: 'jump', clip: 'jump', loop: false, speed: 1 });
  fsm.addState({ name: 'attack', clip: 'attack', loop: false, speed: 1.5 });

  // 添加转换
  fsm.addTransition({
    from: 'idle', to: 'walk',
    condition: () => fsm.getParameter('speed') > 0.1,
    duration: 100, hasExitTime: false, exitTime: 0
  });

  fsm.addTransition({
    from: 'walk', to: 'idle',
    condition: () => fsm.getParameter('speed') <= 0.1,
    duration: 100, hasExitTime: false, exitTime: 0
  });

  fsm.addTransition({
    from: 'walk', to: 'run',
    condition: () => fsm.getParameter('speed') > 0.8,
    duration: 150, hasExitTime: false, exitTime: 0
  });

  fsm.addTransition({
    from: 'run', to: 'walk',
    condition: () => fsm.getParameter('speed') <= 0.8,
    duration: 150, hasExitTime: false, exitTime: 0
  });

  fsm.addTransition({
    from: '*', to: 'jump',
    condition: () => fsm.getParameter('jump'),
    duration: 50, hasExitTime: false, exitTime: 0
  });

  fsm.addTransition({
    from: 'jump', to: 'idle',
    condition: () => fsm.getParameter('grounded'),
    duration: 100, hasExitTime: true, exitTime: 0.9
  });

  fsm.addTransition({
    from: '*', to: 'attack',
    condition: () => fsm.getParameter('attack'),
    duration: 0, hasExitTime: false, exitTime: 0
  });

  return fsm;
}
```

## 动画事件

### AnimationEvent - 动画事件系统

```typescript
// animation-events.ts
export interface AnimationEvent {
  frame: number;
  name: string;
  callback: () => void;
}

export class AnimationEventSystem {
  private events: Map<string, AnimationEvent[]> = new Map();
  private lastFrame: number = -1;

  // 添加事件
  addEvent(clipName: string, event: AnimationEvent): void {
    if (!this.events.has(clipName)) {
      this.events.set(clipName, []);
    }
    this.events.get(clipName)!.push(event);
  }

  // 在指定帧触发事件
  onFrame(clipName: string, frame: number, callback: () => void): void {
    this.addEvent(clipName, {
      frame,
      name: `frame_${frame}`,
      callback
    });
  }

  // 更新
  update(clipName: string, currentFrame: number): void {
    if (currentFrame === this.lastFrame) return;

    const events = this.events.get(clipName);
    if (!events) return;

    for (const event of events) {
      if (event.frame === currentFrame && currentFrame !== this.lastFrame) {
        event.callback();
      }
    }

    this.lastFrame = currentFrame;
  }
}

// 使用示例
const eventSystem = new AnimationEventSystem();

// 在攻击动画的第 5 帧产生伤害
eventSystem.onFrame('attack', 5, () => {
  dealDamageToEnemy();
});

// 在跳跃动画的第 1 帧播放音效
eventSystem.onFrame('jump', 1, () => {
  audio.play('jump');
});
```

## 使用示例

```typescript
import { Tween, Easing, TweenManager, SpriteAnimation, AnimationStateMachine } from '@nova/animation';

class Game {
  private tweenManager: TweenManager;

  init() {
    // UI 动画
    const uiElement = { x: 0, y: 100, alpha: 0 };

    new Tween(uiElement)
      .to({ y: 0, alpha: 1 }, 500)
      .setEasing(Easing.easeOutBack)
      .onCompleteCallback(() => {
        console.log('Animation complete');
      })
      .start();

    // 角色 Tween
    new Tween(player.position)
      .to({ x: 100, y: 200 }, 1000)
      .setEasing(Easing.easeInOutQuad)
      .setYoyo(true)
      .setLoop(true)
      .start();
  }

  update(dt: number) {
    // 更新所有 Tween
    TweenManager.update(dt);
  }
}

// 角色动画
class Player {
  private animation: SpriteAnimation;
  private animator: AnimationStateMachine;

  init() {
    this.animation = new SpriteAnimation();

    // 从精灵表创建动画
    this.animation.createFromSpritesheet(
      'idle',
      idleTexture,
      32, 32,
      4,
      { duration: 200, loop: true }
    );

    this.animation.createFromSpritesheet(
      'walk',
      walkTexture,
      32, 32,
      6,
      { duration: 100, loop: true }
    );

    // 创建状态机
    this.animator = new AnimationStateMachine(this.animation);
    this.animator.addState({ name: 'idle', clip: 'idle', loop: true, speed: 1 });
    this.animator.addState({ name: 'walk', clip: 'walk', loop: true, speed: 1 });

    this.animator.start('idle');
  }

  update(dt: number) {
    // 根据输入更新参数
    const speed = Math.abs(input.getAxisX());
    this.animator.setParameter('speed', speed);

    // 更新状态机
    this.animator.update(dt);

    // 更新动画
    this.animation.update(dt);
  }
}
```

## 参考资源

- [GreenSock (GSAP)](https://greensock.com/) - 专业动画库
- [tween.js](https://github.com/tweenjs/tween.js/) - Tween 引擎
- [Unity Animator](https://docs.unity3d.com/Manual/AnimationOverview.html) - 状态机参考
