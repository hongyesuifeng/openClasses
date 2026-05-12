# Dodge the Creeps - 技术说明文档

> **项目名称**: 新建游戏项目 (Dodge the Creeps)
> **引擎版本**: Godot 4.6
> **项目类型**: 2D 街机游戏
> **创建日期**: 2026年4月

---

## 📋 目录

1. [项目概述](#项目概述)
2. [技术栈总览](#技术栈总览)
3. [架构设计](#架构设计)
4. [核心系统解析](#核心系统解析)
5. [Godot 原理应用](#godot-原理应用)
6. [代码分析](#代码分析)
7. [学习要点](#学习要点)

---

## 项目概述

### 游戏简介

这是一个经典的 2D 街机风格游戏，玩家需要控制角色在屏幕内移动，躲避从屏幕边缘随机生成的敌人。存活时间越长，分数越高。

### 核心玩法

- **移动**: 使用方向键 (↑↓←→) 控制角色移动
- **目标**: 躲避不断生成的敌人
- **得分**: 每存活一秒获得 1 分
- **失败**: 被敌人触碰即游戏结束

### 游戏循环

```
开始界面 → 游戏进行 (生成敌人、计分) → 碰撞检测 → 游戏结束 → 重新开始
```

---

## 技术栈总览

### Godot 技术体系

| 技术类别 | 具体技术 | 应用场景 |
|---------|---------|---------|
| **节点系统** | Node, Area2D, RigidBody2D, CanvasLayer | 玩家、敌人、UI |
| **场景系统** | PackedScene, 场景实例化 | 敌人动态生成 |
| **信号系统** | 自定义信号, 内置信号 | 节点间通信 |
| **输入系统** | 输入映射, 动作检测 | 玩家控制 |
| **动画系统** | AnimatedSprite2D, SpriteFrames | 角色动画 |
| **物理系统** | 碰撞形状, RigidBody2D | 碰撞检测 |
| **资源系统** | Texture2D, AudioStream, FontFile | 资源管理 |
| **UI 系统** | CanvasLayer, Label, Button | 界面显示 |
| **音频系统** | AudioStreamPlayer | 背景音乐、音效 |

---

## 架构设计

### 场景结构

```
Main (主场景)
├── player (Player.tscn 实例)
│   ├── AnimatedSprite2D
│   └── CollisionShape2D
├── HUD (HUD.tscn 实例)
│   ├── ScoreLabel
│   ├── Message
│   ├── StartButton
│   └── MessageTimer
├── MobTimer (定时器)
├── ScoreTimer (定时器)
├── StartTimer (定时器)
├── StartPosition (Marker2D)
├── MobPath (Path2D)
│   └── MobSpawnLocation (PathFollow2D)
├── MusicPlayer (AudioStreamPlayer)
└── DeathSound (AudioStreamPlayer)
```

### 文件组织

```
first2DGame/
├── main.gd/tscn          # 主场景
├── player.gd/tscn        # 玩家场景
├── hud.gd/tscn           # UI 场景
├── mod.gd/tscn           # 敌人场景
├── project.godot         # 项目配置
├── art/                  # 美术资源
│   ├── playerGrey_*.png
│   ├── enemyWalking_*.png
│   ├── enemyFlyingAlt_*.png
│   ├── enemySwimming_*.png
│   ├── House In a Forest Loop.ogg
│   └── gameover.wav
└── fonts/
    └── Xolonium-Regular.ttf
```

### 设计模式

| 模式 | 应用 | 说明 |
|------|------|------|
| **主控制器模式** | Main.gd | 统一管理游戏流程和状态 |
| **观察者模式** | 信号系统 | 节点间解耦通信 |
| **组合模式** | 场景树 | 节点的层级组织 |
| **工厂模式** | PackedScene.instantiate() | 敌人的批量创建 |

---

## 核心系统解析

### 1. 玩家系统 (Player)

#### 节点结构

```gdscript
Area2D (player)
├── AnimatedSprite2D    # 角色动画
└── CollisionShape2D    # 碰撞检测
```

#### 关键代码

```gdscript
extends Area2D

@export var speed = 400  # 移动速度
var screen_size          # 屏幕尺寸
signal hit               # 碰撞信号

func _ready():
    screen_size = get_viewport_rect().size
    hide()

func _process(delta):
    # 输入检测
    var velocity = Vector2.ZERO
    if Input.is_action_pressed("move_right"):
        velocity.x += 1
    if Input.is_action_pressed("move_left"):
        velocity.x -= 1
    if Input.is_action_pressed("move_down"):
        velocity.y += 1
    if Input.is_action_pressed("move_up"):
        velocity.y -= 1

    # 速度归一化
    if velocity.length() > 0:
        velocity = velocity.normalized() * speed
        $AnimatedSprite2D.play()
    else:
        $AnimatedSprite2D.stop()

    # 位置更新
    position += velocity * delta
    position = position.clamp(Vector2.ZERO, screen_size)

    # 动画方向
    if velocity.x != 0:
        $AnimatedSprite2D.animation = "walk"
        $AnimatedSprite2D.flip_h = velocity.x < 0
    elif velocity.y != 0:
        $AnimatedSprite2D.animation = "up"

func _on_body_entered(_body):
    hide()
    hit.emit()
    $CollisionShape2D.set_deferred("disabled", true)
```

#### 技术要点

- **Area2D**: 用于检测碰撞但不产生物理反应
- **@export**: 将变量暴露到编辑器
- **Vector2 运算**: normalized() 归一化、clamp() 限制范围
- **set_deferred**: 在物理回调中安全地修改属性

---

### 2. 敌人系统 (Mob)

#### 节点结构

```gdscript
RigidBody2D (Mob)
├── AnimatedSprite2D       # 敌人动画
├── CollisionShape2D       # 碰撞形状
└── VisibleOnScreenNotifier2D  # 屏幕可见性检测
```

#### 关键代码

```gdscript
extends RigidBody2D

func _ready():
    # 随机选择动画类型
    var mob_types = Array($AnimatedSprite2D.sprite_frames.get_animation_names())
    $AnimatedSprite2D.animation = mob_types.pick_random()
    $AnimatedSprite2D.play()

func _on_visible_on_screen_notifier_2d_screen_exited():
    queue_free()  # 离开屏幕后销毁
```

#### 技术要点

- **RigidBody2D**: 受物理引擎控制的刚体
- **gravity_scale = 0**: 禁用重力
- **collision_mask = 0**: 不与任何物体碰撞
- **queue_free()**: 延迟释放节点，防止内存泄漏

---

### 3. 主控制器 (Main)

#### 核心功能

```gdscript
extends Node

@export var mob_scene: PackedScene  # 敌人场景资源
var score

func game_over():
    $ScoreTimer.stop()
    $MobTimer.stop()
    $MusicPlayer.stop()
    $DeathSound.play()
    $HUD.show_game_over()
    get_tree().paused = true

func new_game():
    score = 0
    get_tree().paused = false
    $MusicPlayer.play()
    $player.start($StartPosition.position)
    $StartTimer.start()
    $HUD.update_score(score)
    get_tree().call_group("mobs", "queue_free")

func _on_mob_timer_timeout():
    # 创建敌人实例
    var mob = mob_scene.instantiate()

    # 随机生成位置
    var mob_spawn_location = $MobPath/MobSpawnLocation
    mob_spawn_location.progress_ratio = randf()

    # 设置位置和方向
    mob.position = mob_spawn_location.position
    var direction = mob_spawn_location.rotation + PI / 2
    direction += randf_range(-PI / 4, PI / 4)
    mob.rotation = direction

    # 设置速度
    var velocity = Vector2(randf_range(150.0, 250.0), 0.0)
    mob.linear_velocity = velocity.rotated(direction)

    add_child(mob)
```

#### 技术要点

- **PackedScene**: 场景资源，可动态实例化
- **instantiate()**: 创建场景实例
- **Path2D + PathFollow2D**: 沿路径生成敌人
- **get_tree()**: 访问场景树
- **call_group()**: 批量调用组内节点的方法

---

### 4. UI 系统 (HUD)

#### 节点结构

```gdscript
CanvasLayer (HUD)
├── ScoreLabel (Label)      # 分数显示
├── Message (Label)         # 游戏消息
├── StartButton (Button)    # 开始按钮
└── MessageTimer (Timer)    # 消息定时器
```

#### 关键代码

```gdscript
extends CanvasLayer

signal start_game

func show_message(text):
    $Message.text = text
    $Message.show()
    $MessageTimer.start()

func show_game_over():
    show_message("Game Over")
    await $MessageTimer.timeout
    $Message.text = "Dodge the Creeps!"
    $Message.show()
    await get_tree().create_timer(1.0).timeout
    $StartButton.show()

func update_score(score):
    $ScoreLabel.text = str(score)
```

#### 技术要点

- **CanvasLayer**: 独立的 UI 渲染层
- **await**: 异步等待定时器结束
- **signal**: 自定义信号用于通信
- **锚点布局**: 使用 anchors_preset 定位 UI 元素

---

## Godot 原理应用

### 节点系统原理

```
SceneTree (场景树)
    └── Main (Node)
        ├── player (Area2D)
        │   ├── AnimatedSprite2D
        │   └── CollisionShape2D
        └── HUD (CanvasLayer)
            ├── ScoreLabel
            ├── Message
            └── StartButton
```

**核心概念**:
- **继承**: 所有节点继承自 Node 或其子类
- **组合**: 通过组合不同类型的节点构建复杂对象
- **生命周期**: _enter_tree() → _ready() → _process() → _exit_tree()

---

### 场景系统原理

**场景实例化流程**:

```
PackedScene (序列化数据)
    ↓
instantiate() (创建实例)
    ↓
节点树恢复 (重建节点层次)
    ↓
_enter_tree() / _ready() (初始化)
```

**优势**:
- **复用性**: 同一场景可多次实例化
- **模块化**: 每个场景是独立的功能单元
- **数据驱动**: 场景文件包含完整的节点配置

---

### 信号系统原理

**观察者模式实现**:

```
发射者 (Emitter)
    ↓ emit()
信号 (Signal)
    ↓
接收者 (Receiver) 通过 connect() 连接
    ↓
回调函数 (Callback)
```

**示例**:
```gdscript
# 定义信号
signal hit

# 发射信号
hit.emit()

# 连接信号
player.hit.connect(game_over)

# 断开信号
player.hit.disconnect(game_over)
```

---

### 物理系统原理

**物理循环**:

```
1. 物理步进 (Physics Process)
   ↓
2. 碰撞检测
   ↓
3. 速度/位置更新
   ↓
4. 约束求解
```

**碰撞类型**:

| 类型 | 节点 | 特点 |
|------|------|------|
| **Area2D** | Area2D | 检测碰撞，无物理反应 |
| **Body** | RigidBody2D | 完整物理模拟 |
| **Static** | StaticBody2D | 静态物体 |

---

### 输入系统原理

**输入流程**:

```
硬件输入
    ↓
操作系统
    ↓
Godot 输入层
    ↓
Input Map (动作映射)
    ↓
Input.is_action_pressed()
```

**配置示例** (project.godot):
```ini
[input]
move_right={
    "deadzone": 0.2,
    "events": [InputEventKey]
}
```

---

## 代码分析

### 设计模式应用

#### 1. 主控制器模式

```gdscript
# Main.gd 作为中央控制器
# 职责:
# - 游戏流程控制
# - 状态管理
# - 节点协调
```

**优点**:
- 集中管理游戏逻辑
- 简化节点间通信
- 便于状态追踪

#### 2. 信号驱动

```gdscript
# 玩家发射信号
signal hit
hit.emit()

# 主场景监听信号
player.hit.connect(game_over)

# HUD 发射信号
signal start_game
start_game.emit()

# 主场景监听信号
$HUD.start_game.connect(new_game)
```

**优点**:
- 节点解耦
- 灵活的通信机制
- 符合 Godot 最佳实践

---

### 性能优化技巧

| 技巧 | 实现 | 效果 |
|------|------|------|
| **对象池** | 预创建敌人复用 | 减少实例化开销 |
| **屏幕剔除** | VisibleOnScreenNotifier2D | 自动销毁屏幕外对象 |
| **延迟释放** | queue_free() | 安全释放节点 |
| **时间步长** | delta 参数 | 帧率无关的移动 |

---

## 学习要点

### 核心概念掌握度

| 概念 | 重要程度 | 状态 |
|------|---------|------|
| 节点系统 | ⭐⭐⭐ | ✅ 已应用 |
| 场景实例化 | ⭐⭐⭐ | ✅ 已应用 |
| 信号系统 | ⭐⭐⭐ | ✅ 已应用 |
| 输入映射 | ⭐⭐ | ✅ 已应用 |
| 物理碰撞 | ⭐⭐ | ✅ 已应用 |
| 动画系统 | ⭐⭐ | ✅ 已应用 |
| UI 系统 | ⭐⭐ | ✅ 已应用 |
| 资源管理 | ⭐⭐ | ✅ 已应用 |

### 推荐学习路径

1. **第一阶段**: 理解节点树和场景系统
2. **第二阶段**: 掌握信号和输入系统
3. **第三阶段**: 学习物理和动画
4. **第四阶段**: 实践完整游戏开发

### 扩展方向

- [ ] 添加难度等级
- [ ] 实现道具系统
- [ ] 增加多种敌人类型
- [ ] 添加粒子特效
- [ ] 实现存档系统
- [ ] 添加音效控制

---

## 附录

### A. 项目配置说明

```ini
[application]
config/name = "新建游戏项目"
run/main_scene = "uid://djeb0cuoeaeet"
config/features = PackedStringArray("4.6", "Forward Plus")

[display]
window/size/viewport_width = 480
window/size/viewport_height = 720
window/stretch/mode = "canvas_items"

[input]
move_right = {...}
move_left = {...}
move_up = {...}
move_down = {...}
```

### B. 资源清单

| 资源类型 | 文件 | 用途 |
|---------|------|------|
| 纹理 | playerGrey_*.png | 玩家精灵 |
| 纹理 | enemyWalking_*.png | 行走敌人 |
| 纹理 | enemyFlyingAlt_*.png | 飞行敌人 |
| 纹理 | enemySwimming_*.png | 游泳敌人 |
| 音频 | House In a Forest Loop.ogg | 背景音乐 |
| 音频 | gameover.wav | 游戏结束音效 |
| 字体 | Xolonium-Regular.ttf | UI 字体 |

### C. 信号连接图

```
┌─────────────┐
│   Player    │
│   hit emit  │─────→ Main.game_over()
└─────────────┘

┌─────────────┐
│     HUD     │
│start_game   │─────→ Main.new_game()
│   emit      │
└─────────────┘

┌─────────────┐
│   Timer     │
│  timeout    │─────→ Main._on_*_timeout()
│   emit      │
└─────────────┘
```

---

**文档版本**: 1.0
**最后更新**: 2026年5月13日
**维护者**: Perry's Learning System
