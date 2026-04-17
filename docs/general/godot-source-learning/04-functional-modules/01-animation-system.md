# 动画系统

Godot 的动画系统提供了一套完整的动画解决方案，从简单的属性动画到复杂的骨骼动画混合状态机。本文档深入分析动画系统的源码实现。

---

## 目录

1. [动画系统架构](#1-动画系统架构)
2. [Animation 资源](#2-animation-资源)
3. [AnimationPlayer](#3-animationplayer)
4. [AnimationTree](#4-animationtree)
5. [Tween 系统](#5-tween-系统)
6. [骨骼动画与蒙皮](#6-骨骼动画与蒙皮)
7. [混合变形（Blend Shapes）](#7-混合变形blend-shapes)
8. [源码导航](#8-源码导航)

---

## 1. 动画系统架构

```
动画系统组件关系：

  ┌─────────────────────────────────────────────────────────┐
  │                    动画系统架构                           │
  │                                                         │
  │  ┌─────────────────┐    ┌───────────────────────────┐  │
  │  │ AnimationPlayer │    │ AnimationTree              │  │
  │  │ (简单播放器)     │    │ (高级混合/状态机)           │  │
  │  │                 │    │                             │  │
  │  │ • play()        │    │ ├── AnimationNodeAnimation │  │
  │  │ • play_backw()  │    │ ├── AnimationNodeBlend2   │  │
  │  │ • queue()       │    │ ├── AnimationNodeBlend3   │  │
  │  │ • seek()        │    │ ├── AnimationNodeOneShot   │  │
  │  │                 │    │ ├── AnimationNodeTransition│  │
  │  └────────┬────────┘    │ └── AnimationNodeSM       │  │
  │           │             └──────────┬──────────────────┘  │
  │           │                        │                     │
  │           ▼                        ▼                     │
  │  ┌─────────────────────────────────────────────────────┐│
  │  │            Animation 资源                             ││
  │  │  ┌─────────┐ ┌──────────┐ ┌────────┐ ┌──────────┐  ││
  │  │  │Value    │ │Transform │ │Method  │ │Audio     │  ││
  │  │  │Track    │ │Track     │ │Track   │ │Track     │  ││
  │  │  └─────────┘ └──────────┘ └────────┘ └──────────┘  ││
  │  │  ┌─────────┐ ┌──────────┐                          ││
  │  │  │Animation│ │Bezier    │                          ││
  │  │  │Track    │ │Track     │                          ││
  │  │  └─────────┘ └──────────┘                          ││
  │  └─────────────────────────────────────────────────────┘│
  │                                                         │
  │  ┌──────────────┐    ┌───────────────────┐              │
  │  │ Tween 系统    │    │ Skeleton3D        │              │
  │  │ (轻量级动画)   │    │ (骨骼蒙皮)         │              │
  │  └──────────────┘    └───────────────────┘              │
  │                                                         │
  └─────────────────────────────────────────────────────────┘
```

### 关键设计决策

| 设计决策 | 说明 |
|----------|------|
| **Animation 与 Player 分离** | Animation 是数据资源（`Resource`），AnimationPlayer 是播放控制逻辑，实现数据与逻辑解耦 |
| **基于 Track 的架构** | 每个动画包含多条轨道（Track），每条轨道控制不同属性的动画 |
| **AnimationTree 独立于 Player** | AnimationTree 内部创建自己的 AnimationPlayer，实现更复杂的混合逻辑 |
| **Tween 不依赖节点** | Tween 系统是轻量级的属性插值工具，不需要 Animation 资源 |

---

## 2. Animation 资源

`Animation` 类（`scene/resources/animation.h`）是动画数据的容器，存储所有关键帧和轨道信息。

### 2.1 轨道类型

```cpp
// scene/resources/animation.h

// 轨道类型枚举
enum TrackType {
    TYPE_VALUE,         // 通用值轨道：任意属性动画
    TYPE_POSITION_3D,   // 3D 位置轨道
    TYPE_ROTATION_3D,   // 3D 旋转轨道
    TYPE_SCALE_3D,      // 3D 缩放轨道
    TYPE_BLEND_SHAPE,   // 混合变形轨道
    TYPE_METHOD,        // 方法调用轨道：在关键帧时间调用函数
    TYPE_BEZIER,        // 贝塞尔曲线轨道：精确曲线控制
    TYPE_AUDIO,         // 音频轨道
    TYPE_ANIMATION,     // 动画轨道：嵌套播放其他动画
};
```

### 2.2 轨道数据结构

```
Animation 资源内部结构：

  Animation
  ├── length: float                    // 动画总时长
  ├── step: float                      // 快照间隔（0 = 不使用快照）
  ├── loop_mode: LoopMode              // 循环模式
  │   ├── LOOP_NONE                    //   不循环
  │   ├── LOOP_LINEAR                  //   线性循环
  │   └── LOOP_PINGPONG                //   来回循环
  │
  ├── tracks[]: Vector<Track *>        // 轨道数组
  │   │
  │   ├── [0] ValueTrack
  │   │   ├── path: NodePath           //   目标属性路径 "Sprite2D:modulate"
  │   │   ├── interpolated: bool       //   是否插值
  │   │   ├── update_mode: UpdateMode  //   更新模式
  │   │   │   ├── UPDATE_CONTINUOUS    //     每帧插值
  │   │   │   ├── UPDATE_DISCRETE      //     仅在关键帧更新
  │   │   │   └── UPDATE_TRIGGER       //     单次触发
  │   │   └── keyframes[]:
  │   │       ├── time: float
  │   │       ├── value: Variant
  │   │       └── interpolation: InterpolationType
  │   │
  │   ├── [1] TransformTrack (3D)
  │   │   ├── path: NodePath           //   目标 Node3D 路径
  │   │   └── keyframes[]:
  │   │       ├── time: float
  │   │       ├── location: Vector3
  │   │       ├── rotation: Quaternion
  │   │       └── scale: Vector3
  │   │
  │   ├── [2] MethodTrack
  │   │   ├── path: NodePath           //   目标节点路径
  │   │   └── keyframes[]:
  │   │       ├── time: float
  │   │       ├── method: StringName   //   方法名
  │   │       └── args: Array<Variant> //   参数
  │   │
  │   └── [3] AudioTrack
  │       ├── path: NodePath           //   目标 AudioStreamPlayer
  │       └── keyframes[]:
  │           ├── time: float
  │           ├── stream: Ref<AudioStream>
  │           ├── start_offset: float
  │           └── end_offset: float
  │
  └── track_count: int
```

### 2.3 关键帧插值实现

```cpp
// scene/resources/animation.cpp（简化）
// 线性插值
Variant Animation::_interpolate(const Variant &p_a, const Variant &p_b,
                                 float p_c, InterpolationType p_interp) {
    // p_c = 插值因子 [0, 1]

    switch (p_a.get_type()) {
        case Variant::FLOAT: {
            double a = p_a;
            double b = p_b;
            return a + (b - a) * p_c;
        }
        case Variant::VECTOR2: {
            Vector2 a = p_a;
            Vector2 b = p_b;
            return a + (b - a) * p_c;
        }
        case Variant::VECTOR3: {
            Vector3 a = p_a;
            Vector3 b = p_b;
            return a + (b - a) * p_c;
        }
        case Variant::QUATERNION: {
            Quaternion a = p_a;
            Quaternion b = p_b;
            // 旋转使用球面线性插值 (SLERP)
            return a.slerp(b, p_c);
        }
        case Variant::COLOR: {
            // 颜色在 RGB 空间线性插值
            Color a = p_a;
            Color b = p_b;
            return a + (b - a) * p_c;
        }
        // ... 其他类型
    }
}
```

---

## 3. AnimationPlayer

`AnimationPlayer`（`scene/animation/animation_player.h`）是动画播放控制器。

### 3.1 核心数据结构

```cpp
// scene/animation/animation_player.h（简化）

class AnimationPlayer : public Node {
    GDCLASS(AnimationPlayer, Node);

    // 动画库
    HashMap<StringName, AnimationData> animation_set;
    // 其中 AnimationData = { Ref<Animation> animation; StringName name; };

    // 播放状态
    struct Playback {
        AnimationData *anim = nullptr;  // 当前动画数据
        float pos = 0.0;                // 播放位置（时间）
        float speed_scale = 1.0;        // 速度缩放
        float delta = 0.0;              // 本帧时间增量
        bool started = false;
        // ... blending 状态
    } playback;

    // 播放队列（串行播放多个动画）
    List<StringName> queued;
    StringName assigned_animation;

    // 混合
    float blending_speed = 0.0;
    float blend_time = 0.0;
    struct Blend {
        Playback from;
        float blend_time = 0.0;
        float blend_left = 0.0;
    } blend;
};
```

### 3.2 播放流程

```
AnimationPlayer::play() 调用链：

  play("walk")
    │
    ├── 设置 playback.anim = &animation_set["walk"]
    ├── 设置 playback.pos = 0.0（或继续上次位置）
    │
    ▼
  _process(delta)  ← 每帧调用
    │
    ├── _playback_process(delta)
    │   ├── 计算新位置: pos += delta * speed * speed_scale
    │   ├── 处理循环: if pos > length → 循环或停止
    │   ├── 处理混合: blend_left -= delta（混合衰减）
    │   │
    │   ▼
    ├── _animation_process(delta)
    │   │
    │   ├── 对混合中的两个动画分别处理
    │   │
    │   ▼
    ├── animation_blend(delta, Playback, float blend_weight)
    │   │
    │   ├── 对每条 Track 调用 track_update:
    │   │
    │   ├── TYPE_VALUE → _value_track_interpolate()
    │   │   找到 pos 两侧的关键帧
    │   │   计算 alpha = (pos - k0.time) / (k1.time - k0.time)
    │   │   插值 value = _interpolate(k0.value, k1.value, alpha)
    │   │   设置目标节点属性
    │   │
    │   ├── TYPE_POSITION_3D → _transform_track_interpolate()
    │   │   插值 location, rotation, scale
    │   │   构建 Transform3D 设置给目标 Node3D
    │   │
    │   ├── TYPE_METHOD → 检查是否经过关键帧时间
    │   │   如果经过 → 调用 Object::call(method, args)
    │   │
    │   ├── TYPE_AUDIO → 管理 AudioStreamPlayer 播放
    │   │
    │   └── TYPE_BLEND_SHAPE → 设置 MeshInstance3D 的 blend_shape 值
    │
    └── 发射信号: animation_finished / animation_changed
```

### 3.3 动画混合

```
动画混合流程（从 idle 过渡到 walk）：

  1. 正在播放 "idle"（blend_weight = 1.0）
  2. 调用 play("walk") 时：
     - 将当前 playback 保存到 blend.from
     - 开始播放 "walk" 作为主动画
     - 设置 blend.blend_time = transition_time

  3. 每帧混合：
     blend_left -= delta
     blend_weight = blend_left / blend.blend_time  // 1→0

     // 每个属性都要混合
     final_value = walk_value * (1 - blend_weight)
                 + idle_value * blend_weight

  时间轴：
  blend_weight: 1.0 ──╲──────────────── 0.0
                       ╲ blend_time = 0.3s
  idle 影响:    ████████████░░░░░░░░░░
  walk 影响:    ░░░░░░░░░░░░████████████
```

---

## 4. AnimationTree

`AnimationTree`（`scene/animation/animation_tree.h`）提供高级动画混合和状态机功能。

### 4.1 节点类型层次

```
AnimationNode 类层次：

  AnimationNode (基类)
  │   ├── process()           // 纯虚函数，子类实现混合逻辑
  │   ├── get_parameter()     // 获取参数
  │   └── blend_input()       // 混合输入节点
  │
  ├── AnimationRootNode (根节点)
  │   ├── AnimationNodeBlendTree
  │   └── AnimationNodeStateMachine
  │
  └── AnimationChildNode (子节点)
      ├── AnimationNodeAnimation     // 叶子：引用 Animation 资源
      ├── AnimationNodeOneShot       // 一次性覆盖
      ├── AnimationNodeAdd2          // 加法混合
      ├── AnimationNodeAdd3          // 三输入加法
      ├── AnimationNodeBlend2        // 二路线性混合
      ├── AnimationNodeBlend3        // 三路混合
      ├── AnimationNodeSub2          // 减法混合
      ├── AnimationNodeTimeScale     // 时间缩放
      ├── AnimationNodeTimeSeek      // 时间跳转
      ├── AnimationNodeTransition    // 过渡节点
      └── AnimationNodeOutput        // 输出节点
```

### 4.2 AnimationNodeStateMachine

```cpp
// scene/animation/animation_node_state_machine.h（简化）

class AnimationNodeStateMachine : public AnimationRootNode {
    GDCLASS(AnimationNodeStateMachine, AnimationRootNode);

    // 状态集合
    HashMap<StringName, Ref<AnimationNode>> states;

    // 过渡图
    struct Transition {
        StringName from;          // 源状态
        StringName to;            // 目标状态
        StringName advance_condition;     // 过渡条件名
        float xfade_time = 0.0;  // 混合过渡时间
        SwitchMode switch_mode;   // 过渡模式
    };
    Vector<Transition> transitions;

    // 当前状态
    StringName current;
    StringName transition_target;
    float transition_time = 0.0;
};
```

状态机执行逻辑：

```
状态机执行：

  _process()
    │
    ├── 获取当前状态节点
    ├── 调用 current_node->process()
    │   └── 如果是 AnimationNodeAnimation → 播放动画
    │
    ├── 检查所有从当前状态出发的 Transition
    │   ├── 评估 advance_condition
    │   │   get_parameter(condition) → bool
    │   └── 如果条件满足 → 启动过渡
    │
    ├── 过渡执行（xfade）
    │   ├── 同时运行 from 和 to 两个状态
    │   ├── blend_weight 从 0→1
    │   └── 过渡完成后 current = to
    │
    └── 返回最终混合结果
```

---

## 5. Tween 系统

Tween（`scene/main/tween.h`）提供轻量级属性插值，无需 Animation 资源。

```cpp
// 使用示例
// GDScript: tween.tween_property(sprite, "position", Vector2(100, 200), 0.5)

// C++ 等价流程：
Tween *tween = node->create_tween();
tween->tween_property(sprite, "position", Vector2(100, 200), 0.5)
      .set_trans(Tween::TRANS_LINEAR)
      .set_ease(Tween::EASE_IN_OUT);
```

### Tween 内部结构

```
Tween 内部结构：

  Tween
  ├── tweens[]: Vector<Interpolator>    // 活动的插值器列表
  │   │
  │   ├── PropertyInterpolator
  │   │   ├── object: ObjectID          // 目标对象
  │   │   ├── property: StringName      // 属性名
  │   │   ├── initial_value: Variant    // 起始值
  │   │   ├── final_value: Variant      // 目标值
  │   │   ├── duration: float           // 持续时间
  │   │   ├── elapsed: float            // 已过时间
  │   │   ├── trans_type: TransitionType // 过渡曲线
  │   │   └── ease_type: EaseType       // 缓动方向
  │   │
  │   ├── CallbackInterpolator
  │   │   └── callback: Callable        // 回调函数
  │   │
  │   ├── IntervalInterpolator
  │   │   └── duration: float           // 等待时间
  │   │
  │   └── MethodInterpolator
  │       ├── method: Callable           // 方法引用
  │       └── args: Array               // 参数
  │
  ├── is_parallel: bool                  // 并行/串行模式
  └── loops: int                         // 循环次数

  缓动函数 (TransitionType):
  ┌──────────────┐
  │ LINEAR       │  f(t) = t
  │ SINE         │  f(t) = 1 - cos(t * π/2)
  │ QUAD         │  f(t) = t²
  │ CUBIC        │  f(t) = t³
  │ QUART        │  f(t) = t⁴
  │ QUINT        │  f(t) = t⁵
  │ EXPO         │  f(t) = 2^(10*(t-1))
  │ CIRC         │  f(t) = 1 - √(1 - t²)
  │ BACK         │  f(t) = t² * ((s+1)*t - s)  // 带回弹
  │ BOUNCE       │  弹跳效果
  │ ELASTIC      │  弹性效果
  └──────────────┘
```

---

## 6. 骨骼动画与蒙皮

### 6.1 Skeleton3D

`Skeleton3D`（`scene/3d/skeleton_3d.h`）管理骨骼层级和蒙皮数据。

```cpp
// scene/3d/skeleton_3d.h（简化）

class Skeleton3D : public Node3D {
    GDCLASS(Skeleton3D, Node3D);

    struct Bone {
        StringName name;
        int parent = -1;           // 父骨骼索引，-1 = 根骨骼
        Transform3D rest;          // 绑定姿态（T-Pose）
        Transform3D pose;          // 当前动画姿态
        bool enabled = true;
        // ...
    };

    Vector<Bone> bones;
    Vector<Transform3D> bone_global_poses;  // 全局变换缓存
    Vector<bool> bone_global_poses_dirty;   // 脏标记

    // 蒙皮数据
    struct SkinReference {
        RID skeleton;              // RenderingServer 中的骨骼 RID
        Ref<Skin> skin;
        Vector<Transform3D> bone_transforms;  // 最终骨骼矩阵
    };
};
```

### 6.2 蒙皮计算流程

```
骨骼蒙皮计算流程：

  1. 动画更新骨骼局部变换 (pose)
     AnimationPlayer → Skeleton3D::set_bone_pose(bone_idx, transform)

  2. 计算全局变换（级联）
     Skeleton3D::bone_pose_update()
       for bone in bones:
         if bone.parent == -1:
           global[bone] = bone.pose
         else:
           global[bone] = global[bone.parent] * bone.pose

  3. 计算蒙皮矩阵
     for bone_idx in range(bone_count):
       skin_matrix[bone_idx] = global_inverse_rest[bone_idx] × global_pose[bone_idx]

     其中 global_inverse_rest = global_rest.inverse()
     这将顶点从绑定空间变换到当前姿态空间

  4. 上传 GPU
     RenderingServer::skeleton_bone_set_transforms(skeleton_rid, skin_matrices)
     → 上传为 Uniform / SSBO
     → 顶点着色器中使用：
       vec3 final_pos = (bone_matrix[b0] * vec4(vertex, 1.0)) * w0
                      + (bone_matrix[b1] * vec4(vertex, 1.0)) * w1
                      + (bone_matrix[b2] * vec4(vertex, 1.0)) * w2
                      + (bone_matrix[b3] * vec4(vertex, 1.0)) * w3;
```

---

## 7. 混合变形（Blend Shapes）

混合变形（又称 Morph Targets）通过在基础网格和目标网格之间插值来变形网格：

```
混合变形原理：

  基础形状 (base)       目标形状 (target)      50% 混合
  ┌──────────┐          ┌──────────┐          ┌──────────┐
  │  ▬▬▬▬▬   │          │  ╱╲╱╲╱   │          │  ──╲╱──  │
  │ │      │ │    +     │ │      │ │    =    │ │      │ │
  │  ▬▬▬▬▬   │          │  ╲╱╲╱   │          │  ──╱╲──  │
  └──────────┘          └──────────┘          └──────────┐

  顶点计算：
    V_final = V_base + Σ(blend_shape[i].weight × ΔV[i])

  其中：
    ΔV[i] = V_target[i] - V_base    // 差分向量
    weight ∈ [0, 1]                  // 权重

  典型用途：
    • 面部表情（微笑、眨眼、张嘴）
    • 肌肉变形
    • 衣服褶皱
    • 车辆损坏

  源码位置：
    MeshInstance3D::set_blend_shape_value(int, float)
    → RenderingServer::mesh_set_blend_shape_value()
    → 上传到 GPU Uniform Buffer
    → 顶点着色器中应用
```

---

## 8. 源码导航

### 关键文件一览

| 文件 | 路径 | 说明 |
|------|------|------|
| AnimationPlayer | `scene/animation/animation_player.h/cpp` | 动画播放器 |
| AnimationTree | `scene/animation/animation_tree.h/cpp` | 动画树 |
| AnimationNode | `scene/animation/animation_node.h/cpp` | 动画节点基类 |
| AnimationNodeSM | `scene/animation/animation_node_state_machine.h/cpp` | 状态机 |
| AnimationNodeBlend | `scene/animation/animation_node_blend_tree.h/cpp` | 混合树 |
| Animation 资源 | `scene/resources/animation.h/cpp` | 动画数据 |
| Tween | `scene/main/tween.h/cpp` | 补间动画 |
| Skeleton3D | `scene/3d/skeleton_3d.h/cpp` | 骨骼节点 |
| Skin | `scene/resources/skin.h/cpp` | 蒙皮数据 |
| MeshInstance3D | `scene/3d/mesh_instance_3d.h/cpp` | 混合变形接口 |

### 推荐阅读顺序

```
1. scene/resources/animation.h         → 理解动画数据结构
2. scene/animation/animation_player.h  → 理解播放控制
3. scene/animation/animation_player.cpp → 跟踪 play() 和 _process()
4. scene/animation/animation_tree.h    → 理解动画树架构
5. scene/animation/animation_node.h    → 理解节点基类接口
6. scene/animation/animation_node_state_machine.h → 状态机实现
7. scene/3d/skeleton_3d.h              → 骨骼与蒙皮
8. scene/main/tween.h                  → Tween 系统
```

---

## 下一步

- [02-物理系统](./02-physics-system.md) - 深入了解 PhysicsServer 和碰撞检测
- [返回目录](./README.md)
