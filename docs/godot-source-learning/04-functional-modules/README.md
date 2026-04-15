# 功能模块

功能模块层是 Godot 引擎的核心能力层，建立在核心基础（01）和场景系统（02）之上，为游戏提供动画、物理、音频、输入和粒子等关键功能。每个模块都遵循 Godot 的 Server 架构模式——前端提供场景节点 API，后端通过 Server 实现高性能处理。

## 目录

- **[00-技术原理](./00-technical-principles.md) - 游戏功能模块的底层技术原理（建议首先阅读）**
- [01-动画系统](./01-animation-system.md) - AnimationPlayer、AnimationTree、骨骼动画、混合变形
- [02-物理系统](./02-physics-system.md) - PhysicsServer 架构、碰撞检测、物理步进
- [03-音频系统](./03-audio-system.md) - AudioServer、音频总线、空间音频
- [04-输入系统](./04-input-system.md) - Input 单例、事件传播、Action 映射
- [05-粒子系统](./05-particle-system.md) - GPU 粒子、发射器、粒子材质

---

## 核心概念

### 功能模块架构

```
┌──────────────────────────────────────────────────────────────┐
│                     功能模块架构总览                           │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              场景节点层 (Scene Nodes)                   │ │
│  │                                                        │ │
│  │  AnimationPlayer  RigidBody3D  AudioStreamPlayer3D     │ │
│  │  AnimationTree    StaticBody3D  AudioStreamPlayer2D    │ │
│  │  GPUParticles3D   CharacterBody3D  ...                 │ │
│  └──────────────────────┬─────────────────────────────────┘ │
│                         │                                    │
│                         ▼                                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Server 层 (Backend Processing)             │ │
│  │                                                        │ │
│  │  RenderingServer    PhysicsServer3D/2D   AudioServer   │ │
│  │  (03-渲染系统)      (本章)              (本章)          │ │
│  └──────────────────────┬─────────────────────────────────┘ │
│                         │                                    │
│                         ▼                                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              平台与驱动层 (Drivers)                      │ │
│  │                                                        │ │
│  │  Vulkan/Metal/D3D12   GodotPhysics/Bullet   ALSA/WASAPI│ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 模块依赖关系

```
                     ┌──────────────┐
                     │  Input 单例   │ ◄── OS / DisplayServer
                     └──────┬───────┘
                            │ 输入事件
                            ▼
┌──────────┐  变换更新  ┌──────────────┐  物理事件  ┌──────────────┐
│ 动画系统  │ ────────► │   场景树      │ ◄──────── │  物理系统     │
└──────────┘           └──────┬───────┘           └──────────────┘
                            │                         │
              ┌─────────────┼─────────────┐          │
              ▼             ▼             ▼          ▼
       ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
       │ 音频系统  │  │ 粒子系统  │  │ 渲染系统  │  │ 脚本回调  │
       └──────────┘  └──────────┘  └──────────┘  └──────────┘
```

---

## 核心文件

| 模块 | 关键文件 | 路径 |
|------|----------|------|
| 动画系统 | AnimationPlayer | `scene/animation/animation_player.h` |
| 动画系统 | AnimationTree | `scene/animation/animation_tree.h` |
| 动画系统 | Animation 资源 | `scene/resources/animation.h` |
| 物理系统 | PhysicsServer3D | `servers/physics_3d/physics_server_3d.h` |
| 物理系统 | GodotPhysics3D | `modules/godot_physics_3d/` |
| 物理系统 | GodotStep3D | `modules/godot_physics_3d/godot_step_3d.h` |
| 音频系统 | AudioServer | `servers/audio_server.h` |
| 音频系统 | AudioStream | `scene/resources/audio_stream.h` |
| 输入系统 | Input | `core/input/input.h` |
| 输入系统 | InputMap | `core/input/input_map.h` |
| 粒子系统 | GPUParticles3D | `scene/3d/gpu_particles_3d.h` |
| 粒子系统 | ParticleProcessMaterial | `scene/resources/particle_process_material.h` |

---

## 学习目标

完成本章节后，你将能够：

1. 理解动画系统的关键帧插值、骨骼蒙皮、动画状态机和混合树原理
2. 掌握物理引擎的碰撞检测流水线（BVH → GJK/EPA → 约束求解）
3. 理解音频引擎的 PCM 处理、总线效果链和空间音频实现
4. 掌握输入系统的事件传播模型和 Action 映射机制
5. 理解 GPU 粒子系统的计算着色器驱动架构
6. 能够阅读和修改 Godot 各功能模块的 C++ 源码

---

## 预计时间

- 技术原理：2-3 天
- 动画系统：2-3 天
- 物理系统：2-3 天
- 音频系统：1-2 天
- 输入系统：1 天
- 粒子系统：1-2 天

**总计：约 9-14 天**

---

## 导航

- **上一章**：[渲染系统](../03-rendering/README.md)
- **下一章**：[资源管理](../05-asset-management/README.md)
- **[返回总目录](../README.md)**
