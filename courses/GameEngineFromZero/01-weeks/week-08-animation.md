# 第8周: 动画系统

## 目标

- Sprite Animation (帧动画)
- Tween 补间动画
- Easing Functions
- 动画状态机 (基础版)

## 任务清单

### 1. Sprite Animation (@nova/animation)

- [ ] AnimationClip 数据结构
  - [ ] 帧序列定义
  - [ ] 帧率控制
  - [ ] 循环设置

- [ ] SpriteAnimator 组件
  - [ ] 当前动画状态
  - [ ] 播放控制 (play, pause, stop)
  - [ ] 动画切换

- [ ] AnimationSystem
  - [ ] 更新帧索引
  - [ ] 更新 Sprite 纹理区域

```typescript
// 定义动画
const walkAnimation = new SpriteAnimation({
  frames: [
    { texture: 'walk_1.png', duration: 100 },
    { texture: 'walk_2.png', duration: 100 },
    { texture: 'walk_3.png', duration: 100 },
    { texture: 'walk_4.png', duration: 100 }
  ],
  loop: true
});

// 使用动画
const animator = entity.getComponent(SpriteAnimator);
animator.play('walk');
animator.play('jump');  // 自动切换
```

### 2. Tween 补间动画 (@nova/animation/tween)

- [ ] Tween 类
  - [ ] from / to 值
  - [ ] duration
  - [ ] easing function
  - [ ] callbacks (onStart, onUpdate, onComplete)

- [ ] TweenManager
  - [ ] 创建和管理 Tween
  - [ ] 更新所有活跃 Tween
  - [ ] 清理完成的 Tween

```typescript
// 简单位移动画
Tween.to(sprite, {
  x: 100,
  y: 200
}, 1000, Easing.easeInOutQuad);

// 链式调用
Tween.to(sprite, { alpha: 0 }, 500)
  .delay(200)
  .then(() => console.log('Fade out complete'))
  .start();

// 序列动画
const sequence = new TweenSequence();
sequence.append(Tween.to(sprite, { x: 100 }, 500));
sequence.append(Tween.to(sprite, { y: 100 }, 500));
sequence.append(Tween.to(sprite, { scale: 2 }, 300));
sequence.start();
```

### 3. Easing Functions

- [ ] 线性 (linear)
- [ ] 二次 (quad)
- [ ] 三次 (cubic)
- [ ] 四次 (quart)
- [ ] 五次 (quint)
- [ ] 正弦 (sine)
- [ ] 指数 (expo)
- [ ] 圆形 (circ)
- [ ] 弹性 (elastic)
- [ ] 回弹 (back)
- [ ] 弹跳 (bounce)

```typescript
// Easing 函数签名
type EasingFunction = (t: number) => number;

// 内置缓动函数
export const Easing = {
  linear: (t) => t,

  easeInQuad: (t) => t * t,
  easeOutQuad: (t) => t * (2 - t),
  easeInOutQuad: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,

  easeInCubic: (t) => t * t * t,
  // ... 更多
};
```

### 4. 动画状态机 (AnimationStateMachine)

- [ ] State 定义
- [ ] Transition 规则
- [ ] 参数系统 (bool, float, trigger)

```typescript
// 状态机定义
const animator = new AnimationStateMachine();

// 添加状态
animator.addState('idle', { animation: 'idle' });
animator.addState('walk', { animation: 'walk' });
animator.addState('jump', { animation: 'jump' });

// 添加过渡
animator.addTransition('idle', 'walk', {
  condition: () => input.isMoving
});
animator.addTransition('walk', 'jump', {
  condition: () => input.jumpPressed
});
animator.addTransition('jump', 'idle', {
  condition: () => !entity.isGrounded,
  hasExitTime: true
});

// 设置参数
animator.setBool('isMoving', true);
animator.setTrigger('jump');
```

## 文件结构

```
@nova/animation/
├── src/
│   ├── index.ts
│   ├── SpriteAnimation.ts
│   ├── SpriteAnimator.ts
│   ├── Tween.ts
│   ├── TweenManager.ts
│   ├── TweenSequence.ts
│   ├── Easing.ts
│   ├── AnimationStateMachine.ts
│   └── AnimationState.ts
└── index.ts
```

## 示例项目

`examples/05-animation-demo/`:
- 角色行走/跳跃动画
- UI 元素补间效果
- 状态机控制角色动画

## 学习资源

- Phaser Tween 系统
- Unity Animation 状态机概念
- Easing Functions Cheat Sheet

## 交付物

- `@nova/animation` 包
- 动画示例

## 验证标准

```typescript
// 帧动画测试
const anim = new SpriteAnimation({ frames, loop: true });
const animator = new SpriteAnimator();
animator.addAnimation('walk', anim);
animator.play('walk');

// 更新后帧应该正确切换
animator.update(150); // 经过 150ms
expect(animator.currentFrame).toBe(1);

// Tween 测试
const obj = { x: 0 };
const tween = Tween.to(obj, { x: 100 }, 1000, Easing.linear);
tween.start();
tween.update(500);
expect(obj.x).toBeCloseTo(50);
```
