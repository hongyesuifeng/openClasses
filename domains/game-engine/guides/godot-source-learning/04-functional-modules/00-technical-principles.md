# 技术原理：游戏功能模块

本文档介绍 Godot 引擎各功能模块的底层技术原理，为后续深入源码奠定理论基础。内容涵盖动画、物理、音频、输入和粒子五大子系统的核心算法与设计思想。

---

## 目录

1. [动画系统原理](#1-动画系统原理)
2. [物理引擎原理](#2-物理引擎原理)
3. [音频引擎原理](#3-音频引擎原理)
4. [输入系统原理](#4-输入系统原理)
5. [粒子系统原理](#5-粒子系统原理)

---

## 1. 动画系统原理

### 1.1 关键帧插值

动画的本质是**随时间变化的属性值序列**。关键帧动画存储离散时间点上的属性值，通过插值算法在帧之间生成平滑过渡。

```
关键帧插值示意：

值
│    ●─────────●╌╌╌╌╌╌●─────────●
│   k0         k1       k2         k3
│   t=0       t=0.3    t=0.7      t=1.0
│
│  k0→k1: LINEAR（线性插值）
│  k1→k2: CUBIC（三次埃尔米特插值，带 handle）
│  k2→k3: LINEAR
└──────────────────────────────────────── 时间

插值公式：
  线性：value = k0.value * (1 - alpha) + k1.value * alpha
        其中 alpha = (t - k0.time) / (k1.time - k0.time)

  三次埃尔米特：value = h00*p0 + h10*m0 + h01*p1 + h11*m1
        其中 h00, h10, h01, h11 为埃尔米特基函数
```

Godot 支持以下插值类型（定义在 `animation.h` 的 `UpdateMode` 和 `InterpolationType` 中）：

| 插值类型 | 说明 | 适用场景 |
|----------|------|----------|
| `INTERPOLATION_LINEAR` | 线性插值 | 大部分属性动画 |
| `INTERPOLATION_CUBIC` | 三次贝塞尔/埃尔米特 | 需要平滑加减速的动画 |
| `INTERPOLATION_CUBIC_CATMULL_ROM` | Catmull-Rom 样条 | 曲线路径动画 |
| `INTERPOLATION_CUBIC_BEZIER` | 自由贝塞尔曲线 | 精确控制的缓动曲线 |

### 1.2 骨骼动画与蒙皮

3D 角色动画的核心是**骨骼动画**（Skeletal Animation），由两个部分组成：

- **骨骼层级**（Skeleton）：一组以树状层级组织的骨骼（Bone），每根骨骼有自己的变换（位置、旋转、缩放）
- **蒙皮网格**（Skinned Mesh）：顶点绑定到骨骼上，通过骨骼变换驱动网格变形

```
骨骼层级示例：

            Root (Bone 0)
           /    \
       Spine     Hips
       /    \
    L.Arm   R.Arm
    /         \
 L.Forearm  R.Forearm
    |           |
 L.Hand     R.Hand


蒙皮权重（每个顶点最多绑定 4 根骨骼）：

  Vertex V 的最终位置：
  V' = w0 * (B0 * V) + w1 * (B1 * V) + w2 * (B2 * V) + w3 * (B3 * V)

  其中：
    B0..B3 = 骨骼的骨骼变换矩阵（当前姿态 × 绑定姿态的逆）
    w0..w3 = 蒙皮权重，w0 + w1 + w2 + w3 = 1.0
```

**关键数据结构**（对应源码 `scene/3d/skeleton_3d.h`）：

```
绑定姿态 (Rest Pose)：
  每根骨骼在 T-Pose 下的局部变换，存储为 Transform3D 数组

当前姿态 (Current Pose)：
  动画播放时每根骨骼的局部变换

骨骼变换矩阵 (Bone Pose Matrix)：
  final_pose = global_rest_inverse × current_global_pose
  用于 GPU 蒙皮着色器
```

### 1.3 动画混合与状态机

复杂角色通常需要将多个动画混合起来，例如行走时转身、跑步中攻击。Godot 提供 **AnimationTree** 节点来管理动画混合。

```
AnimationTree 节点类型：

AnimationNodeAnimation    ─ 直接播放一个 Animation 资源
AnimationNodeBlendTree    ─ 混合多个动画输入
AnimationNodeBlend2       ─ 两路线性/加法混合
AnimationNodeBlend3       ─ 三路混合（-1, 0, +1）
AnimationNodeOneShot      ─ 一次性覆盖动画
AnimationNodeStateMachine ─ 状态机（含过渡条件）
AnimationNodeTransition   ─ 状态间过渡控制
AnimationNodeAdd2         ─ 加法混合（如将"受伤"叠加到"行走"）

混合树示意：

           ┌──────────┐
           │  State    │
           │  Machine  │
           └─────┬─────┘
                 │
        ┌────────┼────────┐
        ▼        ▼        ▼
   ┌────────┐ ┌────────┐ ┌────────┐
   │  Idle  │ │  Walk  │ │  Run   │
   └────┬───┘ └────┬───┘ └────┬───┘
        │          │          │
        └─────┬────┘──────────┘
              ▼
        ┌──────────┐
        │ Blend2   │ ◄─── speed 参数控制混合权重
        │ Idle↔Walk│
        └──────────┘
```

**动画状态机**（AnimationNodeStateMachine）的核心是**过渡图**：

```
状态过渡：

  [Idle] ──速度>0.1──► [Walk] ──速度>3.0──► [Run]
    ▲                     │                     │
    └───────速度<0.1──────┘───────速度<2.0──────┘

  过渡条件可以是：
    • 属性值比较（speed > threshold）
    • 布尔标志（is_on_floor）
    • 时间条件（动画播放完毕）

  过渡模式：
    • Immediate：立即切换
    • Sync：同步切换（保持时间轴连续）
    • At End：等当前动画播完再切换
```

---

## 2. 物理引擎原理

### 2.1 力的积分

物理引擎的核心任务是**模拟牛顿力学**。每帧对每个刚体执行以下步骤：

```
运动方程：

  F = m * a            (牛顿第二定律)
  a = F / m            (加速度)
  v = v + a * dt       (速度积分)
  x = x + v * dt       (位置积分)

在 Godot 中（semi-implicit Euler 积分）：

  1. 计算合力 F_total = F_gravity + F_applied + F_damping + F_impulse
  2. 计算加速度 a = F_total / mass
  3. 更新速度 v_new = v_old + a * delta
  4. 更新位置 x_new = x_old + v_new * delta

  注意：先更新速度再更新位置，这是 semi-implicit（半隐式）Euler 方法
  比显式 Euler 更稳定
```

### 2.2 碰撞检测：宽相 + 窄相

碰撞检测是物理引擎中计算量最大的部分，采用**两阶段策略**：

```
碰撞检测流水线：

  所有物体 ──► 宽相 (Broad Phase) ──► 候选对 ──► 窄相 (Narrow Phase) ──► 碰撞信息
  (N个)       时间复杂度 O(N log N)    (少量)     时间复杂度 O(1) 每对     (接触点等)

  ┌──────────────────────────────────────────────────────────────────┐
  │  宽相 (Broad Phase)                                               │
  │                                                                  │
  │  目的：快速排除不可能碰撞的物体对                                    │
  │  方法：BVH (Bounding Volume Hierarchy) 层次包围体树                │
  │                                                                  │
  │  场景:                          BVH:                             │
  │  ┌─────────────────────┐       [Root: 整个场景 AABB]             │
  │  │ ┌──A──┐   ┌──C──┐  │         ├── [A区域]                     │
  │  │ │     │   │     │  │         │     ├── 物体1                  │
  │  │ └─────┘   └─────┘  │         │     └── 物体2                  │
  │  │       ┌──B──┐      │         └── [B+C区域]                   │
  │  │       │     │      │               ├── 物体3                  │
  │  │       └─────┘      │               └── [C区域]               │
  │  └─────────────────────┘                     ├── 物体4          │
  │                                              └── 物体5          │
  │                                                                  │
  │  只有 AABB 重叠的物体对才进入窄相：                                  │
  │  候选对 = {(1,2), (3,4), (3,5), (4,5)}                          │
  └──────────────────────────────────────────────────────────────────┘
```

**窄相碰撞检测**使用 **GJK**（Gilbert-Johnson-Keerthi）算法和 **EPA**（Expanding Polytope Algorithm）：

```
GJK/EPA 算法流程：

  1. GJK 算法：判断两个凸体是否相交
     - 利用 Minkowski 差 (A - B) 的性质
     - 在 Minkowski 差空间中寻找包含原点的单纯形
     - 如果找到 → 两体相交

  2. EPA 算法：计算穿透深度和方向
     - 从 GJK 找到的单纯形开始
     - 逐步扩展多面体逼近 Minkowski 差边界
     - 找到原点到边界的最短距离 → 穿透向量

  Minkowski 差示意：
     形状A    形状B    A - B（Minkowski差）
     ┌──┐     ┌─┐      ┌─────────┐
     │  │  -  │ │  =   │  原点●   │  ← 原点在内部 = 相交！
     └──┘     └─┘      └─────────┘

  支撑函数 (Support Function)：
    s_A(d) = max{ a · d | a ∈ A }  // 沿方向d的最远点
    s_{A-B}(d) = s_A(d) - s_B(-d)  // Minkowski差的支撑函数
```

### 2.3 约束求解

碰撞检测找到接触点后，需要**约束求解器**防止物体穿透：

```
约束求解（Sequential Impulse 方法）：

  对于每个接触点：
    1. 计算穿透深度
    2. 计算接触法线 n
    3. 施加冲量使物体沿法线分离

  法线冲量：
    j_n = -(1 + e) * v_rel · n / (1/mA + 1/mB + ...)

  其中 e = 恢复系数 (restitution / bounciness)

  摩擦冲量（沿接触平面）：
    j_t = -v_rel_tangent / (1/mA + 1/mB)

  约束求解迭代（多次迭代提高精度）：
    for iteration in range(solver_iterations):    // 默认 8 次
        for contact in contacts:
            apply_impulse(contact)
            warm_starting()  // 使用上一帧的冲量作为初始值
```

---

## 3. 音频引擎原理

### 3.1 PCM 音频与采样

数字音频的基础是 **PCM**（Pulse Code Modulation，脉冲编码调制）：

```
PCM 音频：

  模拟声波：        采样（离散化）：       量化（数字化）：
       ╱╲               |·|·|·|            32767 ─●─
      ╱  ╲              |·| |·|            16384 ─●─
  ───╱────╲───   →   ──●───●───   →          0 ──●──
     ╱      ╲           |·|·|·|          -16384 ─●─
    ╱        ╲          |·| |·|          -32767 ─●─

  采样率 (Sample Rate)：每秒采样次数
    • 44100 Hz (CD 质量)
    • 48000 Hz (专业音频)

  位深度 (Bit Depth)：每个采样的精度
    • 16-bit：-32768 ~ 32767
    • 24-bit / 32-bit float (Godot 内部使用 32-bit float)

  声道 (Channels)：
    • Mono：1 声道
    • Stereo：2 声道 (L + R)
```

### 3.2 空间音频

3D 游戏需要**空间音频**（Spatial Audio），让声音随距离和方向变化：

```
空间音频模型：

  3D 衰减曲线：
  音量
  1.0 ┤●
      │ ╲  Inverse（反比衰减）
  0.5 ┤   ●   Linear（线性衰减）
      │     ╲ ● Exponential（指数衰减）
  0.0 ┤───────●──────────
      0   min_dist   max_dist
                   距离

  Godot 支持的衰减模型 (AudioStreamPlayer3D::AttenuationModel)：
  ┌──────────────┬─────────────────────────────┐
  │ 模型          │ 公式                         │
  ├──────────────┼─────────────────────────────┤
  │ INVERSE      │ d = (ref+1)/(ref + r)       │
  │ LINEAR       │ d = 1 - r/max, clamp ≥ 0    │
  │ EXPONENTIAL  │ d = pow(ref/r, exp)         │
  └──────────────┴─────────────────────────────┘

  多普勒效应 (Doppler Effect)：
    f_observed = f_source * (v_sound ± v_listener) / (v_sound ± v_source)

    当声源朝向听者移动 → 频率升高 → 音调变高
    当声源远离听者移动 → 频率降低 → 音调变低
```

### 3.3 音频总线与效果链

```
音频总线系统：

  ┌────────────────────────────────────────────────────┐
  │                   AudioServer                       │
  │                                                    │
  │  AudioStreamPlayer ──► Master Bus ──► 输出设备     │
  │                          │                         │
  │  AudioStreamPlayer ──►──►├── Bus "SFX"             │
  │                          │     ├── Volume 1.0      │
  │                          │     ├── LowPassFilter   │
  │                          │     └── Reverb          │
  │                          │                         │
  │  AudioStreamPlayer ──►──►└── Bus "Music"           │
  │                                ├── Volume 0.5      │
  │                                └── Chorus          │
  │                                                    │
  └────────────────────────────────────────────────────┘

  效果处理顺序（按添加顺序）：
  Input → Effect1 → Effect2 → ... → Bus Output → Send → Next Bus

  每个 Effect 是一个 AudioEffect 子类：
    AudioEffectReverb       - 混响
    AudioEffectChorus       - 合唱
    AudioEffectDelay        - 延迟
    AudioEffectEQ           - 均衡器
    AudioEffectCompressor   - 压缩器
    AudioEffectLimiter      - 限幅器
    AudioEffectLowPassFilter - 低通滤波
    AudioEffectHighPassFilter - 高通滤波
    ...
```

---

## 4. 输入系统原理

### 4.1 事件模型

输入系统基于**事件驱动模型**，所有用户输入都被抽象为 `InputEvent` 对象：

```
输入事件层次结构：

  InputEvent (基类)
  ├── InputEventKey           - 键盘按键
  │   ├── keycode             - 按键码 (KEY_A, KEY_SPACE, ...)
  │   ├── physical_keycode    - 物理按键码（基于键盘布局）
  │   ├── unicode             - Unicode 字符
  │   ├── pressed             - 按下/释放
  │   ├── echo                - 是否为重复按键
  │   └── ctrl/shift/alt/meta - 修饰键状态
  ├── InputEventMouseButton   - 鼠标按键
  │   ├── button_index        - 按键索引 (LEFT, RIGHT, MIDDLE)
  │   ├── position            - 鼠标位置
  │   └── double_click        - 双击
  ├── InputEventMouseMotion   - 鼠标移动
  │   ├── position / global_position
  │   └── relative / velocity
  ├── InputEventJoypadButton  - 手柄按键
  ├── InputEventJoypadMotion  - 手柄摇杆/扳机
  ├── InputEventScreenTouch   - 触摸
  ├── InputEventScreenDrag    - 拖拽
  ├── InputEventAction        - Action 事件
  ├── InputEventGesture       - 手势（缩放、平移）
  └── InputEventMIDI          - MIDI 输入
```

### 4.2 事件传播路径

```
输入事件传播路径：

  硬件 (键盘/鼠标/手柄)
      │
      ▼
  OS / 平台层
      │ SDL / Win32 / X11 / Cocoa 事件
      ▼
  DisplayServer
      │ 转换为 Godot InputEvent
      ▼
  Input 单例 (core/input/input.h)
      │
      ├──► InputMap：检查是否匹配某个 Action
      │    生成对应的 InputEventAction
      │
      ├──► Input 缓冲区（累积本帧所有事件）
      │
      ▼
  SceneTree::_input() 回调
      │
      ├──► 节点 _input() 回调（全局处理，按逆序遍历）
      │
      ├──► 节点 _shortcut_input() 回调（快捷键处理）
      │
      ├──► 节点 _unhandled_key_input() 回调
      │
      ├──► 节点 _unhandled_input() 回调（未被处理的输入）
      │
      ▼
  GUI / Control 节点处理
```

### 4.3 Action 映射系统

Action 系统将物理输入映射为逻辑动作，实现**输入与逻辑的解耦**：

```
Action 映射：

  InputMap (project.godot / Input Map 编辑器)
  ┌─────────────────────────────────────────────────────┐
  │  Action: "jump"                                     │
  │    ├── Key: Space                                    │
  │    ├── Key: W                                        │
  │    └── Joypad: A button (device 0)                  │
  │                                                     │
  │  Action: "move_left"                                │
  │    ├── Key: A                                        │
  │    ├── Key: Left Arrow                               │
  │    └── Joypad: Left Stick X < -0.5                  │
  └─────────────────────────────────────────────────────┘

  使用方式（GDScript / C++）：
    Input.is_action_pressed("jump")       → bool
    Input.get_vector("move_left", "move_right", "move_up", "move_down")
    Input.get_axis("move_left", "move_right")

  Deadzone（死区）：摇杆模拟输入的灵敏度阈值
    default: 0.5 (0.0 ~ 1.0)
    低于死区的输入被视为 0，防止摇杆漂移
```

---

## 5. 粒子系统原理

### 5.1 粒子生命周期

每个粒子都有完整的生命周期：

```
粒子生命周期：

  ┌─────────┐    ┌──────────┐    ┌─────────┐    ┌─────────┐
  │ 发射     │ →  │ 模拟更新  │ →  │ 渲染     │ →  │ 死亡/    │
  │ Emit     │    │ Update   │    │ Render  │    │ 回收     │
  └─────────┘    └──────────┘    └─────────┘    └─────────┘

  单个粒子属性：
  {
    position:     Vector3,      // 当前位置
    velocity:     Vector3,      // 速度
    color:        Color,        // 颜色（含 alpha）
    size:         float,        // 大小
    rotation:     float,        // 旋转角度
    lifetime:     float,        // 剩余生命时间
    age_ratio:    float,        // age / lifetime (0→1)
    custom:       Vector4,      // 自定义数据
  }

  每帧更新：
    velocity += gravity * delta + turbulence(position) * delta
    velocity *= 1.0 - damping * delta
    position += velocity * delta
    age_ratio = age / lifetime
    if age >= lifetime → 粒子死亡
```

### 5.2 发射器类型

```
发射器形状 (EmissionShape)：

  ┌──────────────────────────────────────────────────┐
  │  Point (点)        Box (盒子)     Sphere (球面)   │
  │                                                    │
  │     *              ┌────┐         ╱ ╲              │
  │                    │    │       ╱     ╲            │
  │   单点发射          │  * │      │   *    │          │
  │                    │    │       ╲     ╱            │
  │                    └────┘         ╲ ╱              │
  │  精确位置          体积内随机      球面/球体内随机    │
  ├──────────────────────────────────────────────────┤
  │  Ring (环)         Mesh (网格)    Directed (定向)  │
  │                                                    │
  │    ╱ ╲              ╱╲            ↑ ↑ ↑            │
  │   │   │            ╱  ╲           │ │ │            │
  │    ╲ ╱            ╱ *  ╲          ↓ ↓ ↓            │
  │                    ╲    ╱                           │
  │   环面发射          沿网格表面     沿法线方向          │
  └──────────────────────────────────────────────────┘
```

### 5.3 GPU 粒子与 CPU 粒子

```
GPU 粒子 vs CPU 粒子：

  ┌─────────────────────┬───────────────────┬──────────────────┐
  │       特性           │  GPUParticles     │  CPUParticles    │
  ├─────────────────────┼───────────────────┼──────────────────┤
  │  计算位置             │  GPU Compute      │  CPU 循环         │
  │  粒子数量上限         │  数十万           │  数千             │
  │  碰撞检测             │  GPU SDF 碰撞     │  CPU 物理碰撞     │
  │  自定义粒子行为       │  Compute Shader   │  GDScript 回调    │
  │  跨平台兼容性         │  需要 Compute     │  全平台           │
  │  2D 支持             │  GPUParticles2D   │  CPUParticles2D  │
  │  源码路径             │  scene/3d/gpu_*   │  scene/3d/cpu_*  │
  └─────────────────────┴───────────────────┴──────────────────┘

  GPU 粒子模拟流程（使用 Compute Shader）：

  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
  │ Particle     │     │ Compute      │     │ Vertex +     │
  │ Buffer       │ ──► │ Shader       │ ──► │ Fragment     │ ──► 屏幕
  │ (SSBO)       │     │ (模拟更新)    │     │ Shader       │
  │              │     │              │     │ (渲染绘制)    │
  │ pos[N]       │     │ 更新 pos,    │     │ Billboard /  │
  │ vel[N]       │     │ vel, color,  │     │ Mesh 绘制    │
  │ color[N]     │     │ size, life   │     │              │
  │ ...          │     │              │     │              │
  └──────────────┘     └──────────────┘     └──────────────┘
```

---

## 总结

| 模块 | 核心算法 | 关键源码目录 |
|------|----------|-------------|
| 动画 | 关键帧插值、骨骼蒙皮、状态机 | `scene/animation/` |
| 物理 | Semi-implicit Euler、BVH + GJK/EPA、Sequential Impulse | `modules/godot_physics_3d/` |
| 音频 | PCM 混音、IIR 滤波器、HRTF 空间化 | `servers/audio_server/` |
| 输入 | 事件队列、Action 映射、死区处理 | `core/input/` |
| 粒子 | GPU Compute Shader、发射器算法 | `scene/3d/gpu_particles_3d*` |

---

## 下一步

- [01-动画系统](./01-animation-system.md) - 深入了解 AnimationPlayer 和 AnimationTree 的源码实现
- [02-物理系统](./02-physics-system.md) - 深入了解 PhysicsServer 和碰撞检测
- [03-音频系统](./03-audio-system.md) - 深入了解 AudioServer 架构
- [04-输入系统](./04-input-system.md) - 深入了解输入事件传播
- [05-粒子系统](./05-particle-system.md) - 深入了解 GPU 粒子系统
