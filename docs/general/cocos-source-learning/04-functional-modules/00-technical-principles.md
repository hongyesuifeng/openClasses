# 技术原理：游戏功能模块

> 功能模块在渲染系统之上提供了动画、物理、音频、输入和粒子系统。在阅读源码之前，先理解这些系统背后的技术原理。

---

## 目录

- [1. 动画系统原理](#1-动画系统原理)
- [2. 物理引擎原理](#2-物理引擎原理)
- [3. 音频引擎原理](#3-音频引擎原理)
- [4. 输入系统原理](#4-输入系统原理)
- [5. 粒子系统原理](#5-粒子系统原理)

---

## 1. 动画系统原理

### 关键帧动画（Keyframe Animation）

#### 基本概念

动画的本质是**在时间轴上采样属性值的变化**：

```
时间轴：  0.0s    0.3s    0.6s    0.9s    1.2s
          │       │       │       │       │
位置 Y：  0.0     1.0     0.0     1.0     0.0    ← 关键帧
          │       │       │       │       │
          ▼──插值─▼──插值─▼──插值─▼──插值─▼
          连续的弹跳动画
```

#### 插值（Interpolation）

关键帧之间需要插值来获得平滑的中间值：

```
线性插值 (Linear)：
  value = (1 - t) × key1 + t × key2
  特点：匀速变化，机械感

三次样条插值 (Cubic / Bezier / Hermite)：
  value = Hermite(t, p0, p1, tangent0, tangent1)
  特点：有加速减速，自然

在 Cocos 中：
  AnimationClip 存储关键帧数据
  每个曲线（AnimationCurve）包含关键帧数组和插值类型
```

#### 多通道动画

一个动画可以同时驱动多个属性：

```
AnimationClip = 多条曲线的集合

角色跑步动画：
  曲线 1: 左腿旋转 (X/Y/Z)
  曲线 2: 右腿旋转 (X/Y/Z)
  曲线 3: 身体上下位移 (Y)
  曲线 4: 左臂旋转
  曲线 5: 右臂旋转
  ...
```

> 源码 `cocos/animation/animation-clip.ts` 中 `AnimCurve` 和 `Track` 类实现了多通道动画数据

### 骨骼动画（Skeletal Animation）

#### 为什么需要骨骼动画

```
关键帧动画的问题：
  一个角色有 10000 个顶点
  每个顶点 3 个分量 × 60 帧 = 180000 个数值
  → 数据量巨大

骨骼动画的解决方案：
  只动画少量骨骼（~50 根）的数据
  每帧通过骨骼变换蒙皮顶点
  → 数据量小 100 倍
```

#### 骨骼层次结构

```
骨骼树（类似场景图）：

Root (髋部)
├── Spine (脊椎)
│   ├── L_Shoulder (左肩)
│   │   ├── L_Elbow (左肘)
│   │   └── L_Hand (左手)
│   ├── R_Shoulder (右肩)
│   │   └── ...
│   └── Head (头部)
├── L_Hip (左髋)
│   ├── L_Knee (左膝)
│   └── L_Foot (左脚)
└── R_Hip (右髋)
    └── ...
```

#### 蒙皮（Skinning）

```
每个顶点绑定到若干骨骼上，带有权重：

顶点 V 的位置 = Σ (weight_i × boneMatrix_i × bindPose_i⁻¹ × V)

其中：
  weight_i = 顶点对第 i 根骨骼的权重（权重和 = 1）
  boneMatrix_i = 第 i 根骨骼的当前变换矩阵
  bindPose_i⁻¹ = 第 i 根骨骼的绑定姿态逆矩阵

GPU 蒙皮：
  在顶点着色器中执行，每个顶点最多影响 4 根骨骼
  uniform mat4 boneMatrices[MAX_BONES];  // 骨骼矩阵数组
```

#### 动画混合（Animation Blending）

```
同时播放多个动画，按权重混合：

  待机动画 (权重 0.3) ─┐
                        ├─► 混合结果
  行走动画 (权重 0.7) ─┘

  finalPose = lerp(idlePose, walkPose, weight)

用途：
  - 平滑切换动画（从走到跑）
  - 叠加层动画（行走 + 挥手）
  - IK（反向动力学）修正
```

> 源码 `cocos/animation/` 中 `animation-blend.ts` 和 `skeletal-animation.ts` 实现了混合和骨骼动画

---

## 2. 物理引擎原理

### 物理引擎的核心步骤

```
每帧物理更新：

1. 力的累积 (Force Accumulation)
   重力 + 摩擦力 + 用户施加的力 → 合力

2. 积分求解 (Integration)
   F = ma → a = F/m
   velocity += a × dt
   position += velocity × dt

3. 碰撞检测 (Collision Detection)
   检查所有物体对是否相交

4. 碰撞响应 (Collision Response)
   计算碰撞力和冲量
   修正穿透位置

5. 同步回引擎
   物理位置 → Node.position
```

### 碰撞检测

#### 宽阶段（Broad Phase）

快速排除不可能碰撞的物体对：

```
空间划分策略：

AABB 包围盒：先用简单的轴对齐包围盒排除
  if (AABB_A ∩ AABB_B = ∅) → 不可能碰撞 → 跳过

常用数据结构：
  - 均匀网格 (Uniform Grid)
  - 四叉树 / 八叉树 (Quadtree / Octree)
  - BVH (Bounding Volume Hierarchy)
  - Sweep and Prune (SAP)
```

#### 窄阶段（Narrow Phase）

精确检测碰撞：

```
常见形状对的碰撞检测：

球 vs 球：
  distance(centerA, centerB) < radiusA + radiusB → 碰撞

AABB vs AABB：
  三个轴上都重叠 → 碰撞 (Separating Axis Theorem)

球 vs 平面：
  distance(center, plane) < radius → 碰撞

凸包 vs 凸包 (GJK 算法)：
  通过 Minkowski 差判断是否包含原点
```

### 物理引擎后端

Cocos Creator 支持多个物理引擎后端：

```
              ┌──────────────────────────┐
              │    物理抽象接口            │
              │    (cocos/physics/spec/)  │
              └────────────┬─────────────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
            ▼              ▼              ▼
      ┌──────────┐  ┌──────────┐  ┌──────────┐
      │ Bullet   │  │ Cannon   │  │ Builtin  │
      │ (C++)    │  │ (JS)     │  │ (Simple) │
      │          │  │          │  │          │
      │ 3D 物理   │  │ 3D 物理  │  │ 简单碰撞  │
      │ 精确      │  │ 轻量     │  │ 仅检测    │
      └──────────┘  └──────────┘  └──────────┘

为什么需要多后端？
  - 移动端：Bullet（C++ 高性能）
  - Web 端：Cannon.js（纯 JS，兼容性好）
  - 简单游戏：Builtin（只做碰撞检测，无物理模拟）
```

> 源码 `cocos/physics/` 的 `spec/` 定义接口，`bullet/`、`cannon/`、`builtin/` 分别实现

---

## 3. 音频引擎原理

### 数字音频基础

```
模拟声波 (连续)
    │ 采样 + 量化
    ▼
数字音频 (离散)

PCM (Pulse Code Modulation)：
  - 采样率：44100 Hz（每秒采样 44100 次）
  - 位深度：16 bit（每个采样点的精度）
  - 声道数：1（单声道）或 2（立体声）

数据量：
  44100 × 16bit × 2声道 = 176 KB/s = ~10 MB/分钟
```

### 游戏音频的特殊需求

| 需求 | 说明 | 实现方式 |
|------|------|---------|
| **多音源同时播放** | 背景音乐 + 多个音效 | Audio Mixer / 多 Channel |
| **3D 空间音频** | 声音随距离衰减 | HRTF / 距离衰减曲线 |
| **实时控制** | 播放、暂停、音量、变速 | Web Audio API / 平台 SDK |
| **流式播放** | 大文件边下载边播放 | Streaming 解码 |
| **低延迟** | 按键音效需要即时响应 | 预加载 + 缓冲 |

### Web Audio API 架构

```
浏览器端音频处理管线：

AudioBuffer (原始音频数据)
    │
    ▼
AudioBufferSourceNode (播放节点)
    │
    ▼
GainNode (音量控制)
    │
    ▼
PannerNode (3D 空间定位)
    │
    ▼
AnalyserNode (频谱分析)
    │
    ▼
AudioDestinationNode (输出到扬声器)
```

> 源码 `cocos/audio/` 和 `pal/audio/web/` 实现了基于 Web Audio API 的音频播放

---

## 4. 输入系统原理

### 输入事件模型

```
硬件事件 → 操作系统 → 浏览器/平台 → 游戏引擎 → 游戏逻辑

鼠标/触摸 → MouseEvent/TouchEvent
键盘       → KeyboardEvent
手柄       → GamepadEvent
加速度计   → DeviceMotionEvent
```

### 输入抽象层

```
为什么需要抽象：

各平台的输入 API 完全不同：
  Web:     document.addEventListener('touchstart', ...)
  Android: onTouchEvent(MotionEvent)
  iOS:     touchesBegan(_:with:)
  微信:    wx.onTouchStart(callback)

Cocos Input 的统一接口：
  input.on(Input.EventType.TOUCH_START, callback)
  → 各平台 PAL 实现自动转换
```

### 输入事件传播

```
Touch/Click 事件传播（类似 DOM）：

1. 捕获阶段 (Capture)：从根节点向下传播
2. 目标阶段 (Target)：到达实际触摸的节点
3. 冒泡阶段 (Bubble)：从目标节点向上冒泡

UI 系统：
  触摸点 → 射线检测 → 找到命中节点 → 事件冒泡

3D 场景：
  触摸点 → 屏幕坐标转射线 → 射线与碰撞体检测 → 命中物体
```

> 源码 `cocos/input/` 提供统一接口，`pal/input/` 各平台实现

---

## 5. 粒子系统原理

### 粒子系统的本质

```
粒子系统 = 大量简单元素的集体行为模拟复杂效果

单个粒子：
  {
    position, velocity,     ← 运动状态
    color, opacity,         ← 外观
    size, rotation,         ← 形状
    lifetime, age           ← 生命周期
  }

粒子系统：
  每帧：
    1. 发射新粒子
    2. 更新所有粒子状态（移动、旋转、颜色变化...）
    3. 移除过期粒子
    4. 渲染所有存活粒子
```

### 粒子发射器

```
发射器控制粒子的初始状态：

位置：
  点发射器：从中心点发出
  盒子发射器：在盒子范围内随机位置
  球体发射器：在球面上随机位置
  网格发射器：从模型表面发出

方向：
  锥形散射：在指定角度范围内随机方向
  法线方向：沿表面法线方向
  随机方向：均匀球面分布

频率：
  每秒发射 N 个粒子（或每个距离单位 N 个）
```

### 粒子生命周期曲线

```
粒子属性随生命时间变化的曲线：

    大小
  1.0 ──╮
       │ ╲
  0.5 ──│  ╲─────
       │
  0.0 ───────────── 生命进度
       0%  25%  50% 100%

    透明度
  1.0 ───────╮
             │╲
  0.5 ───────│─╲
             │  ╲
  0.0 ───────────╲─ 生命进度
       0%  50% 75% 100%
```

### 粒子渲染

```
粒子通常用 Billboard（公告板）渲染：

  永远面向相机的四边形

  Camera
     │
     ▼ 视线方向
  ┌───────┐
  │       │  ← 粒子贴图（始终正面朝向相机）
  │  🔥   │
  │       │
  └───────┘

粒子排序：
  透明粒子需要从远到近排序（画家算法）
  不透明粒子可以不排序
```

### GPU 粒子 vs CPU 粒子

```
CPU 粒子：
  在 JavaScript/C++ 中更新每个粒子
  适合少量粒子（~1000）
  灵活，可做复杂逻辑

GPU 粒子：
  在着色器中并行更新粒子
  适合大量粒子（~100000）
  需要使用 Transform Feedback / Compute Shader
  逻辑受限于着色器能力
```

> 源码 `cocos/particle/` 实现了 CPU 粒子系统。粒子数据通过 `ParticleChunk` 管理内存

---

## 延伸阅读

- [Animation Blending - GPU Gems](https://developer.nvidia.com/gpugems/GPUGems3/gpugems3_ch02.html)
- [Collision Detection - Real-Time Collision Detection (Christer Ericson)](https://realtimecollisiondetection.net/)
- [Particle Systems - GPU Gems](https://developer.nvidia.com/gpugems/GPUGems3/gpugems3_ch06.html)

---

> 理解了这些原理后，继续阅读 [01-动画系统](./01-animation-system.md) 查看对应的源码实现。
