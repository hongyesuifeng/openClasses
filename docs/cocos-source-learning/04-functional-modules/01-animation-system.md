# 动画系统

动画系统是 Cocos Creator 中最丰富的功能模块之一，包含关键帧动画、骨骼动画和补间动画三种主要动画方式。

## 目录

- [架构概述](#架构概述)
- [AnimationClip 动画剪辑](#animationclip-动画剪辑)
- [AnimationState 动画状态](#animationstate-动画状态)
- [AnimationManager 动画管理器](#animationmanager-动画管理器)
- [骨骼动画](#骨骼动画)
- [补间动画 Tween](#补间动画-tween)
- [技术原理](#技术原理)

---

## 架构概述

```
┌─────────────────────────────────────────────────────────┐
│                    动画系统架构                           │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Animation (组件)                     │   │
│  │  挂载到 Node 上，管理动画播放                       │   │
│  └────────────┬─────────────────────────────────────┘   │
│               │                                         │
│               ▼                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │          AnimationClip (数据资源)                  │   │
│  │  包含关键帧、轨道、曲线等动画数据                    │   │
│  └────────────┬─────────────────────────────────────┘   │
│               │ 创建                                    │
│               ▼                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │         AnimationState (运行时状态)                │   │
│  │  控制播放进度、速度、循环模式、混合权重              │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │        AnimationManager (全局管理器)               │   │
│  │  每帧更新所有活跃的 AnimationState                 │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   骨骼动画                               │
│  SkeletalAnimation → 骨骼矩阵 → GPU 蒙皮               │
├─────────────────────────────────────────────────────────┤
│                   补间动画                               │
│  Tween → 属性插值 → 每帧更新目标属性                    │
└─────────────────────────────────────────────────────────┘
```

### 核心文件

| 文件 | 路径 | 说明 |
|------|------|------|
| 动画剪辑 | `cocos/animation/animation-clip.ts` | 动画数据资源 |
| 动画状态 | `cocos/animation/animation-state.ts` | 播放状态 |
| 动画组件 | `cocos/animation/animation-component.ts` | 动画组件 |
| 动画管理器 | `cocos/animation/animation-manager.ts` | 全局管理 |
| 动画曲线 | `cocos/animation/animation-curve.ts` | 动画曲线 |
| 骨骼动画 | `cocos/3d/skeletal-animation/` | 骨骼动画 |
| 补间动画 | `cocos/tween/tween.ts` | Tween 系统 |

---

## AnimationClip 动画剪辑

`AnimationClip` 是动画数据容器，包含关键帧、轨道和曲线信息。

### 核心结构

```typescript
// cocos/animation/animation-clip.ts

export class AnimationClip extends Asset {
    duration: number;                // 动画时长（秒）
    samples: number;                 // 采样率（帧/秒）
    speed: number;                   // 播放速度
    wrapMode: WrapMode;              // 循环模式
    tracks: RealTrack[];             // 动画轨道数组

    // 关键方法
    addTrack(track): void;           // 添加轨道
    removeTrack(track): void;        // 移除轨道
    sample(time, node): void;        // 在指定时间采样
}
```

### WrapMode 循环模式

| 模式 | 说明 |
|------|------|
| `Default` | 默认（使用 Clip 设置） |
| `Once` | 播放一次后停止 |
| `Loop` | 循环播放 |
| `PingPong` | 来回播放 |
| `ClampForever` | 播放到结尾后保持最后帧 |

### 动画轨道（Track）

```
AnimationClip
├── Track[0]: "position.x"     ─── 位置 X 轨道
│   ├── curve: AnimationCurve  ─── 关键帧曲线
│   │   ├── keyframe 0: time=0, value=0
│   │   ├── keyframe 1: time=0.5, value=100
│   │   └── keyframe 2: time=1.0, value=0
│   └── interpolation: Linear / Step / Cubic
│
├── Track[1]: "position.y"     ─── 位置 Y 轨道
├── Track[2]: "scale.x"        ─── 缩放 X 轨道
└── Track[3]: "rotation.z"     ─── 旋转 Z 轨道
```

---

## AnimationState 动画状态

`AnimationState` 是动画运行时状态，控制动画的播放过程。

### 核心结构

```typescript
// cocos/animation/animation-state.ts

export class AnimationState {
    clip: AnimationClip;             // 关联的动画剪辑
    name: string;                    // 状态名称
    duration: number;                // 时长
    speed: number;                   // 播放速度（可负值倒放）
    weight: number;                  // 混合权重（0~1）
    wrapMode: WrapMode;              // 循环模式
    repeatCount: number;             // 重复次数

    // ─── 播放控制 ───
    play(): void;                    // 开始播放
    pause(): void;                   // 暂停
    resume(): void;                  // 恢复
    stop(): void;                    // 停止
    step(): void;                    // 前进一帧

    // ─── 时间控制 ───
    time: number;                    // 当前时间
    setCurrentTime(time): void;      // 设置当前时间

    // ─── 回调事件 ───
    onPlay: EventCallback;           // 开始播放回调
    onPause: EventCallback;          // 暂停回调
    onStop: EventCallback;           // 停止回调
    onLastLoop: EventCallback;       // 最后一轮循环回调
}
```

### 动画状态机

```
                 play()
    [Stopped] ──────────→ [Playing]
       ↑                     │  │
       │            pause()  │  │ 每帧 update
       │                     │  │
       │                     ▼  │
       │              [Paused]  │
       │                     │  │
       │            resume() │  │
       │                     │  ▼
       │  stop()             │ [Updating]
       └─────────────────────┘
```

---

## AnimationManager 动画管理器

`AnimationManager` 是全局单例，每帧更新所有活跃的动画状态。

```typescript
// cocos/animation/animation-manager.ts

export class AnimationManager {
    animationStates: AnimationState[];  // 所有活跃动画状态

    update(dt: number): void {
        // 遍历所有活跃状态
        for (const state of this.animationStates) {
            // 更新时间
            state.time += dt * state.speed;
            // 处理循环/停止逻辑
            // 采样当前时间的值
            // 应用到目标属性
        }
    }

    addCrossFade(...): void;     // 添加交叉淡入淡出
    removeCrossFade(...): void;  // 移除交叉淡入淡出
}
```

### 交叉淡入淡出（Cross Fade）

```
动画 A (weight=1.0 → 0.0)
         ╲
          ╲ duration: 0.3s
           ╲
动画 B (weight=0.0 → 1.0)

时间轴:
0.0s  → A=100%, B=0%
0.1s  → A=67%,  B=33%
0.2s  → A=33%,  B=67%
0.3s  → A=0%,   B=100%
```

---

## 骨骼动画

骨骼动画位于 `cocos/3d/skeletal-animation/`，用于角色和生物的动画驱动。

### 核心文件

| 文件 | 说明 |
|------|------|
| `skeletal-animation.ts` | 骨骼动画组件 |
| `skeletal-animation-state.ts` | 骨骼动画状态 |
| `skeletal-animation-blending.ts` | 动画混合 |
| `skeletal-animation-data-hub.ts` | 数据管理 |

### 骨骼层次结构

```
Root (根骨骼)
├── Hips (臀部)
│   ├── Spine (脊柱)
│   │   ├── Chest (胸部)
│   │   │   ├── LeftShoulder → LeftArm → LeftHand
│   │   │   └── RightShoulder → RightArm → RightHand
│   │   └── Neck → Head
│   ├── LeftUpLeg → LeftLeg → LeftFoot
│   └── RightUpLeg → RightLeg → RightFoot
```

### Socket 绑定

```typescript
// cocos/3d/skeletal-animation/skeletal-animation.ts

class Socket {
    path: string;    // 骨骼路径，如 "Hips/Spine/RightHand"
    target: Node;    // 跟随骨骼变换的目标节点
}

// 典型用途：将武器绑定到角色手掌
animation.sockets = [
    { path: "RightHand", target: weaponNode }
];
```

---

## 补间动画 Tween

Tween 是轻量级的属性动画系统，通过链式调用创建平滑的属性过渡。

### 核心文件

| 文件 | 路径 | 说明 |
|------|------|------|
| Tween | `cocos/tween/tween.ts` | Tween 主类 |
| TweenAction | `cocos/tween/tween-action.ts` | Tween 动作 |
| TweenSystem | `cocos/tween/tween-system.ts` | Tween 系统管理 |

### Tween API

```typescript
// cocos/tween/tween.ts

export class Tween<T> {
    to(duration: number, props: Partial<T>, opts?): Tween<T>;   // 过渡到目标值
    by(duration: number, props: Partial<T>, opts?): Tween<T>;   // 相对变化
    delay(duration: number): Tween<T>;    // 延迟
    call(callback: Function): Tween<T>;   // 回调
    repeat(times: number): Tween<T>;      // 重复
    repeatForever(): Tween<T>;            // 永远重复
    start(): Tween<T>;                    // 开始执行
    stop(): void;                         // 停止
    clone(): Tween<T>;                    // 克隆
}
```

### 使用示例

```typescript
// 简单位移动画
tween(node)
    .to(1.0, { position: new Vec3(100, 0, 0) }, { easing: 'quadOut' })
    .delay(0.5)
    .to(0.5, { position: new Vec3(0, 0, 0) }, { easing: 'backIn' })
    .call(() => { console.log('动画完成'); })
    .start();

// 支持的缓动函数
// linear, quadIn, quadOut, quadInOut
// cubicIn, cubicOut, cubicInOut
// elasticIn, elasticOut, elasticInOut
// bounceIn, bounceOut, bounceInOut
// backIn, backOut, backInOut
```

---

## 技术原理

### 1. 关键帧插值

动画系统在关键帧之间进行插值计算：

```
线性插值 (Linear):
  value = lerp(keyA.value, keyB.value, t)

阶梯插值 (Step):
  value = t < 0.5 ? keyA.value : keyB.value

三次插值 (Cubic/Hermite):
  value = hermite(keyA.value, keyA.outTangent, keyB.value, keyB.inTangent, t)
```

### 2. 动画混合（Blending）

多个动画可以按权重混合：

```
最终属性值 = Σ(weight[i] × animation[i].value) / Σ(weight[i])

例如：
  行走动画 weight=0.5 + 奔跑动画 weight=0.5 = 慢跑效果
```

### 3. Tween 的实现原理

Tween 内部基于引擎的调度系统：

```
Tween.start()
    │
    ▼
TweenSystem.addAction(tweenAction)
    │
    ▼ 每帧
TweenAction.update(dt)
    ├── 计算进度 t = elapsed / duration
    ├── 应用缓动函数 t = easing(t)
    ├── 插值属性 value = lerp(start, end, t)
    └── 设置到目标对象 target[prop] = value
```

---

## 下一步

完成动画系统的学习后，继续学习 [02-物理系统](./02-physics-system.md)。
