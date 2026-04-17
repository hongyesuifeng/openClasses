# 粒子系统

粒子系统用于模拟火焰、烟雾、爆炸、魔法特效等视觉效果。它通过大量小粒子的生成、运动和消亡来创造复杂的视觉表现。

## 目录

- [架构概述](#架构概述)
- [ParticleSystem 粒子主类](#particlesystem-粒子主类)
- [发射器配置](#发射器配置)
- [动画器模块](#动画器模块)
- [渲染模式](#渲染模式)
- [技术原理](#技术原理)

---

## 架构概述

```
┌─────────────────────────────────────────────────────────┐
│                    粒子系统架构                           │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │           ParticleSystem (组件)                   │   │
│  │                                                  │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐       │   │
│  │  │ Emitter  │  │Animator  │  │ Renderer │       │   │
│  │  │ 发射器   │→ │ 动画器   │→ │ 渲染器   │       │   │
│  │  │ 粒子生成 │  │ 粒子更新 │  │ 粒子绘制 │       │   │
│  │  └──────────┘  └──────────┘  └──────────┘       │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 核心文件

| 文件 | 路径 | 说明 |
|------|------|------|
| 粒子系统 | `cocos/particle/particle-system.ts` | 粒子主类 |
| Billboard 渲染 | `cocos/particle/billboard.ts` | 面板渲染模式 |
| Line 渲染 | `cocos/particle/line.ts` | 线条渲染模式 |
| 颜色动画 | `cocos/particle/animator/color-overtime.ts` | 颜色随时间变化 |
| 大小动画 | `cocos/particle/animator/size-overtime.ts` | 大小随时间变化 |
| 速度动画 | `cocos/particle/animator/velocity-overtime.ts` | 速度随时间变化 |
| 力动画 | `cocos/particle/animator/force-overtime.ts` | 力随时间变化 |
| 噪声动画 | `cocos/particle/animator/noise.ts` | 噪声扰动 |

---

## ParticleSystem 粒子主类

```typescript
// cocos/particle/particle-system.ts

export class ParticleSystem extends Component {
    // ─── 发射参数 ───
    rateOverTime: number;           // 每秒发射数量
    rateOverDistance: number;       // 每移动距离发射数量
    burst: Burst[];                 // 爆发配置

    // ─── 粒子属性 ───
    startColor: Color;              // 初始颜色
    startSize: number;              // 初始大小
    startSpeed: number;             // 初始速度
    startLifetime: number;          // 粒子生命周期（秒）
    maxParticles: number;           // 最大粒子数
    simulationSpace: Space;         // 模拟空间（LOCAL/WORLD）

    // ─── 动画器模块 ───
    colorOverLifetime: ColorOvertimeModule;
    sizeOverLifetime: SizeOvertimeModule;
    velocityOverLifetime: VelocityOvertimeModule;
    forceOverLifetime: ForceOvertimeModule;
    noiseModule: NoiseModule;
    textureAnimation: TextureAnimationModule;

    // ─── 生命周期 ───
    play(): void;                   // 开始播放
    pause(): void;                  // 暂停
    stop(): void;                   // 停止
    clear(): void;                  // 清除所有粒子
    emit(count: number): void;      // 手动发射粒子
}
```

---

## 发射器配置

### 发射形状

| 形状 | 说明 |
|------|------|
| Box | 盒体内随机发射 |
| Sphere | 球面上/内随机发射 |
| Circle | 圆形边缘/内发射 |
| Cone | 锥体内发射 |
| Hemisphere | 半球面发射 |

### 爆发配置（Burst）

```typescript
interface Burst {
    time: number;       // 触发时间（秒）
    count: number;      // 粒子数量
    repeatCount: number; // 重复次数（0=无限）
    repeatInterval: number; // 重复间隔
}
```

### 发射流程

```
每帧更新:
    │
    ├── 1. 计算本帧应发射粒子数
    │   ├── rateOverTime × deltaTime
    │   ├── rateOverDistance × 移动距离
    │   └── burst 触发检测
    │
    ├── 2. 从粒子池获取空闲粒子
    │   └── maxParticles 限制
    │
    └── 3. 初始化粒子属性
        ├── 位置（按发射形状随机）
        ├── 速度（startSpeed + 方向）
        ├── 大小（startSize）
        ├── 颜色（startColor）
        └── 生命周期（startLifetime）
```

---

## 动画器模块

每个动画器模块控制粒子属性随时间的变化：

### ColorOverLifetime（颜色动画）

```typescript
// cocos/particle/animator/color-overtime.ts

export class ColorOverLifetime {
    enable: boolean;
    color: GradientRange;  // 颜色梯度

    // 粒子颜色 = 初始颜色 × gradient.evaluate(time/lifetime)
}
```

```
Gradient 示例：
  time=0.0 → 颜色=白(1,1,1,1)  刚生成时白色
  time=0.3 → 颜色=橙(1,0.5,0,1) 中期变为橙色
  time=1.0 → 颜色=红(1,0,0,0)   结束时变红变透明
```

### SizeOverLifetime（大小动画）

```typescript
// cocos/particle/animator/size-overtime.ts

export class SizeOverLifetime {
    enable: boolean;
    size: CurveRange;  // 大小曲线

    // 粒子大小 = startSize × curve.evaluate(time/lifetime)
}
```

### VelocityOverLifetime（速度动画）

```typescript
// cocos/particle/animator/velocity-overtime.ts

export class VelocityOverLifetime {
    enable: boolean;
    x: CurveRange;  // X 轴速度
    y: CurveRange;  // Y 轴速度
    z: CurveRange;  // Z 轴速度
    speedModifier: CurveRange;  // 速度缩放因子
}
```

### ForceOverLifetime（力动画）

```typescript
// cocos/particle/animator/force-overtime.ts

export class ForceOverLifetime {
    enable: boolean;
    x: CurveRange;  // X 轴力
    y: CurveRange;  // Y 轴力
    z: CurveRange;  // Z 轴力

    // 力在每帧叠加到粒子速度上
}
```

---

## 渲染模式

### Billboard（面板渲染）

粒子始终面向相机，是最常用的渲染模式：

```
         Camera
           │
           │  粒子自动旋转面向相机
           ▼
      ┌─────────┐
      │ 粒子纹理 │  ← Billboard
      └─────────┘
```

### Line（线条渲染）

粒子之间用线条连接，形成拖尾效果：

```
    ● ─── ● ─── ● ─── ●
    起点    中间    中间    终点

适用于：彗星拖尾、激光、尾迹
```

### 渲染模式对比

| 模式 | 说明 | 适用场景 |
|------|------|----------|
| Billboard | 面向相机的面板 | 火焰、烟雾、闪光 |
| StretchedBillboard | 沿速度方向拉伸 | 飞行拖尾 |
| HorizontalBillboard | 水平面板 | 地面光效 |
| VerticalBillboard | 垂直面板 | 竖立的火焰 |
| Mesh | 使用 3D 模型 | 复杂粒子形状 |
| Line | 线条连接 | 拖尾效果 |

---

## 技术原理

### 1. 粒子池（Particle Pool）

粒子系统使用对象池管理粒子，避免频繁的内存分配：

```
Particle Pool (maxParticles = 1000)

┌── 活跃粒子 ──────────────────┐  ┌── 空闲粒子 ──────────────┐
│ [0] alive, t=0.3            │  │ [500] free                │
│ [1] alive, t=0.7            │  │ [501] free                │
│ [2] alive, t=0.1            │  │ [502] free                │
│ ...                         │  │ ...                       │
└─────────────────────────────┘  └───────────────────────────┘

粒子死亡时归还到池中，新粒子从池中取用
```

### 2. GPU 粒子 vs CPU 粒子

Cocos Creator 3.8 的粒子系统主要运行在 CPU：

```
CPU 粒子流程:
  每帧:
    1. CPU 更新粒子位置、速度、大小、颜色
    2. 将粒子数据写入顶点缓冲
    3. GPU 执行绘制

GPU 粒子（未来优化方向）:
  1. 粒子数据存储在 GPU 缓冲
  2. Compute Shader 更新粒子
  3. 直接渲染，无需 CPU→GPU 数据传输
```

### 3. 模块化设计

粒子系统的每个功能都是一个独立模块（Module），可以按需启用：

```
ParticleSystem
├── 必选模块: Emitter（发射器）
├── 可选动画模块:
│   ├── ColorOverLifetime      ← 可开关
│   ├── SizeOverLifetime       ← 可开关
│   ├── VelocityOverLifetime   ← 可开关
│   ├── ForceOverLifetime      ← 可开关
│   └── Noise                  ← 可开关
└── 渲染模块: Renderer（渲染器）
```

---

## 下一步

完成粒子系统的学习后，继续学习 [05-资源管理](../05-asset-management/README.md)。
