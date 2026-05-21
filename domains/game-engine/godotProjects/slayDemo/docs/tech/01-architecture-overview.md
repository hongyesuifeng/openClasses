# 01 - 技术架构总览

## 1. 整体架构图

本项目采用分层架构（Layered Architecture），将系统划分为四个职责清晰的层次。数据自底向上流动，控制信号自顶向下传递。

```
┌─────────────────────────────────────────────────────────┐
│                     表现层 (Presentation)                │
│   UI 节点 │ 动画控制器 │ 特效系统 │ 场景视图             │
├─────────────────────────────────────────────────────────┤
│                     流程层 (Flow)                        │
│   GameState │ SceneRouter │ 回合管理器 │ 场景生命周期     │
├─────────────────────────────────────────────────────────┤
│                     逻辑层 (Logic)                       │
│   战斗引擎 │ 卡牌效果引擎 │ 敌人AI │ 状态管理器          │
├─────────────────────────────────────────────────────────┤
│                     数据层 (Data)                        │
│   CardData │ EnemyData │ StatusData │ EncounterData      │
└─────────────────────────────────────────────────────────┘
```

每一层只依赖其下层，不产生反向依赖。表现层通过信号或回调接收逻辑层的结果，逻辑层不直接操作 UI 节点。

## 2. 核心模块划分与职责

### 2.1 数据层模块

| 模块 | 文件位置 | 职责 |
|------|----------|------|
| CardData | `resources/cards/` | 卡牌的静态数据定义（费用、效果列表、目标类型等） |
| EnemyData | `resources/enemies/` | 敌人的静态数据定义（HP、行为模式列表等） |
| StatusData | `resources/statuses/` | 状态效果的静态定义（名称、图标、叠加规则等） |
| EncounterData | `resources/encounters/` | 遭遇战配置（敌人组合、难度层级等） |

数据层全部使用 Godot 的 `Resource` 类实现，通过 `.tres` 文件存储，支持编辑器内可视化编辑和运行时动态加载。

### 2.2 逻辑层模块

| 模块 | 文件位置 | 职责 |
|------|----------|------|
| BattleManager | `scripts/battle/battle_manager.gd` | 战斗状态机、回合推进、胜负判定 |
| CardEffectEngine | `scripts/battle/card_effect_engine.gd` | 解析卡牌效果并执行结算 |
| EnemyAI | `scripts/battle/enemy_ai.gd` | 敌人意图生成与行动执行 |
| StatusManager | `scripts/battle/status_manager.gd` | Buff/Debuff 的挂载、叠加、触发、消退 |
| DeckManager | `scripts/battle/deck_manager.gd` | 卡组流转（抽牌堆/手牌/弃牌堆） |
| EnergySystem | `scripts/battle/energy_system.gd` | 能量的分配、消耗、回复 |

### 2.3 流程层模块

| 模块 | 文件位置 | 职责 |
|------|----------|------|
| GameState | `scripts/autoload/game_state.gd` | 全局流程状态、运行数据持久化 |
| SceneRouter | `scripts/autoload/scene_router.gd` | 统一场景切换入口 |
| TurnManager | `scripts/battle/turn_manager.gd` | 回合内各阶段调度 |

### 2.4 表现层模块

| 模块 | 文件位置 | 职责 |
|------|----------|------|
| BattleUI | `scenes/ui/` | 战斗界面（手牌、能量、HP、意图等） |
| MapUI | `scenes/map/` | 地图节点展示与交互 |
| CardView | `scenes/ui/card_view.tscn` | 单张卡牌的视觉表现 |
| AnimationController | `scripts/ui/animation_controller.gd` | 统一动画播放与队列管理 |

## 3. 模块间通信方式

### 3.1 通信策略总览

```
通信方式          适用场景                            方向
──────────────────────────────────────────────────────────────
Signal           逻辑层 → 表现层（通知 UI 更新）      单向广播
直接引用          流程层 → 逻辑层（调度控制）          自顶向下
Autoload         跨场景共享的全局状态                  任意方向
回调/Callable     异步流程控制（动画完成后继续）       反向通知
```

### 3.2 Signal 使用规范

逻辑层通过 Signal 广播事件，表现层监听并响应。信号只携带必要的数据参数，不传递节点引用。

```gdscript
# battle_manager.gd - 逻辑层定义信号
signal turn_started(turn_owner: StringName)
signal turn_ended(turn_owner: StringName)
signal damage_dealt(target: NodePath, amount: int)
signal battle_finished(result: BattleResult)

# battle_ui.gd - 表现层监听信号
func _ready() -> void:
    BattleManager.turn_started.connect(_on_turn_started)
    BattleManager.damage_dealt.connect(_on_damage_dealt)
```

### 3.3 直接引用使用规范

流程层和逻辑层之间使用直接引用。上层持有下层的引用，调用公开方法。逻辑层之间也可通过 BattleManager 协调引用。

```gdscript
# battle_manager.gd - 持有各子系统引用
var deck_manager: DeckManager
var energy_system: EnergySystem
var status_manager: StatusManager
var enemy_ai: EnemyAI

func _ready() -> void:
    deck_manager = DeckManager.new()
    energy_system = EnergySystem.new()
    status_manager = StatusManager.new()
    enemy_ai = EnemyAI.new()
```

### 3.4 可选 EventBus

对于需要跨多个系统广播的事件（如"任意实体受到伤害"），可以引入一个轻量的 EventBus Autoload。学习型项目中建议先用直接 Signal，仅在信号传递超过两层时才引入 EventBus。

```gdscript
# 可选 autoload/event_bus.gd
extends Node

signal entity_damaged(entity: Node, amount: int, source: String)
signal entity_healed(entity: Node, amount: int)
signal status_applied(entity: Node, status_id: StringName, stacks: int)
```

## 4. 数据流向图

### 4.1 战斗核心数据流

```
                    ┌──────────────┐
                    │  CardData    │ (Resource .tres)
                    │  EnemyData   │
                    │  StatusData  │
                    └──────┬───────┘
                           │ 加载
                           ▼
┌─────────────┐    ┌──────────────┐    ┌──────────────┐
│  GameState  │───▶│ BattleManager│───▶│ DeckManager  │
│ (全局状态)   │    │ (战斗状态机)  │    │ (卡组流转)    │
└─────────────┘    └──────┬───────┘    └──────────────┘
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
    ┌──────────────┐ ┌──────────┐ ┌──────────────┐
    │ CardEffect   │ │ EnemyAI  │ │ StatusManager│
    │ Engine       │ │          │ │              │
    └──────────────┘ └──────────┘ └──────────────┘
              │           │           │
              └───────────┼───────────┘
                          │ Signal 广播
                          ▼
                 ┌──────────────────┐
                 │    UI 表现层      │
                 │  BattleUI / etc. │
                 └──────────────────┘
```

### 4.2 全局流程数据流

```
App 启动
  │
  ▼
MainMenu ──[SceneRouter]──▶ MapScene
                              │
                              ▼ 玩家选择节点
                          BattleScene
                              │
                              ▼ 战斗结束
                          RewardScene
                              │
                              ▼ 玩家确认
                          MapScene (循环)
```

### 4.3 卡牌打出数据流

```
玩家点击手牌
  │
  ▼
UI 发送 play_card(card_index, target) 到 BattleManager
  │
  ▼
BattleManager 验证（能量、目标合法性）
  │
  ▼
EnergySystem 消耗能量
  │
  ▼
DeckManager 将卡牌从手牌移至弃牌堆
  │
  ▼
CardEffectEngine 逐条执行效果
  │   ├── 对目标造成伤害 → StatusManager 检查状态修正
  │   ├── 获得格挡 → 更新玩家格挡值
  │   └── 抽牌 → DeckManager 执行抽牌
  │
  ▼
BattleManager 广播信号 → UI 层更新表现
```

## 5. 关键技术决策及理由

### 5.1 使用 Resource 而非 JSON 做数据定义

| 方案 | 优点 | 缺点 |
|------|------|------|
| Resource (.tres) | 编辑器原生支持、类型安全、支持热重载 | 不易批量编辑 |
| JSON | 便于外部工具生成、批量编辑 | 需要自定义解析、无类型检查 |
| SQLite | 适合大量数据查询 | 过于复杂、引入额外依赖 |

**决策：使用 Resource。** 理由：卡牌 Roguelike 的数据量在几百条级别，Resource 完全胜任。Godot 编辑器可直接编辑，学习成本低，类型安全对 Debug 友好。

### 5.2 战斗逻辑与 UI 分离

逻辑层不持有任何 UI 节点引用，通过 Signal 广播事件。UI 层监听 Signal 并自行更新表现。

**理由：** 解耦后逻辑层可以独立测试（不依赖场景树），也方便替换 UI 方案而不影响核心逻辑。

### 5.3 使用状态机而非 Behavior Tree 做战斗流程

**决策：使用有限状态机（FSM）。**

战斗流程的阶段是明确且有限的（player_turn / enemy_turn / resolving 等），状态之间的转换条件清晰。Behavior Tree 更适合复杂 AI 决策，对战斗流程管理而言过重。

```gdscript
enum BattleState {
    BATTLE_START,
    PLAYER_TURN,
    PLAYER_RESOLVE,
    ENEMY_TURN,
    BATTLE_END,
}

var _current_state: BattleState = BattleState.BATTLE_START

func _transition_to(new_state: BattleState) -> void:
    _exit_state(_current_state)
    _current_state = new_state
    _enter_state(new_state)
    state_changed.emit(new_state)
```

### 5.4 卡牌效果使用枚举 + 参数而非脚本继承

每张卡的效果用 `EffectAction` 结构（枚举类型 + 参数字典）描述，由统一的 `CardEffectEngine` 解释执行。不做"每张卡一个脚本"的继承方案。

**理由：**
- 避免大量脚本文件，降低维护成本
- 效果引擎集中管理，便于统一调试和日志
- 新增效果只需扩展枚举和引擎，不需要新建脚本
- 数据驱动，编辑器内直接配置效果

```gdscript
# 不采用：每张卡一个脚本的继承方案
# class_name CardStrike extends CardBase

# 采用：数据驱动方案
@export var effects: Array[EffectAction]

# EffectAction 结构
class EffectAction:
    var effect_type: EffectType      # 枚举
    var value: int                   # 数值
    var target_type: TargetType      # 目标类型
```

### 5.5 使用 Autoload 管理全局状态

将 `GameState` 和 `SceneRouter` 作为 Autoload 单例。其他系统通过 `GameState` 读写跨场景数据。

**理由：** Autoload 是 Godot 推荐的全局管理方式，实现简单，学习型项目不需要引入更复杂的依赖注入框架。

### 5.6 Typed Array 优先

Godot 4.x 支持 Typed Array（`Array[CardData]`、`Array[EffectAction]` 等），在所有公开接口中使用类型化数组。

**理由：** 类型安全、编辑器补全友好、减少运行时类型错误。

```gdscript
# 推荐
var hand: Array[CardData] = []
var draw_pile: Array[CardData] = []

# 不推荐
var hand = []       # 无类型信息
var hand: Array = [] # 弱类型
```

## 6. 项目文件结构详图

```
slay_demo/
├── project.godot
│
├── autoload/
│   ├── game_state.gd              # 全局流程状态
│   └── scene_router.gd            # 场景切换管理
│
├── resources/
│   ├── cards/                     # 卡牌数据 .tres
│   │   ├── strike.tres
│   │   ├── defend.tres
│   │   └── bash.tres
│   ├── enemies/                   # 敌人数据 .tres
│   │   ├── jaw_worm.tres
│   │   └── slime_m.tres
│   ├── statuses/                  # 状态效果数据 .tres
│   │   ├── vulnerable.tres
│   │   └── strength.tres
│   └── encounters/                # 遭遇配置 .tres
│       ├── encounter_1.tres
│       └── boss_1.tres
│
├── scripts/
│   ├── autoload/
│   │   ├── game_state.gd
│   │   └── scene_router.gd
│   ├── battle/
│   │   ├── battle_manager.gd      # 战斗状态机
│   │   ├── turn_manager.gd        # 回合阶段管理
│   │   ├── card_effect_engine.gd  # 效果执行引擎
│   │   ├── deck_manager.gd        # 卡组流转
│   │   ├── energy_system.gd       # 能量系统
│   │   └── enemy_ai.gd            # 敌人AI
│   ├── cards/
│   │   ├── card_data.gd           # CardData Resource 定义
│   │   └── effect_action.gd       # 效果动作结构
│   ├── enemies/
│   │   ├── enemy_data.gd          # EnemyData Resource 定义
│   │   └── intent.gd              # 意图数据结构
│   ├── systems/
│   │   ├── status_manager.gd      # 状态效果管理器
│   │   └── status_data.gd         # StatusData Resource 定义
│   ├── map/
│   │   ├── map_generator.gd       # 地图生成算法
│   │   └── map_data.gd            # 地图数据结构
│   └── ui/
│       ├── battle_ui.gd           # 战斗界面控制器
│       ├── card_view.gd           # 卡牌视图
│       ├── hand_layout.gd         # 手牌布局管理
│       ├── enemy_intent_ui.gd     # 敌人意图显示
│       └── animation_controller.gd
│
├── scenes/
│   ├── app/
│   │   └── app_root.tscn          # 应用根节点
│   ├── battle/
│   │   └── battle_scene.tscn      # 战斗场景
│   ├── map/
│   │   └── map_scene.tscn         # 地图场景
│   ├── reward/
│   │   └── reward_scene.tscn      # 奖励场景
│   └── ui/
│       ├── card_view.tscn         # 卡牌视图场景
│       ├── main_menu.tscn         # 主菜单
│       └── hud.tscn               # 战斗HUD
│
├── assets/
│   ├── art/                       # 图片资源
│   ├── audio/                     # 音频资源
│   └── fonts/                     # 字体
│
└── tests/
    ├── test_card_effect_engine.gd
    ├── test_deck_manager.gd
    └── test_status_manager.gd
```

## 7. 技术选型总结

| 维度 | 选型 | 理由 |
|------|------|------|
| 数据格式 | Resource (.tres) | 编辑器原生、类型安全、热重载 |
| 战斗流程 | 有限状态机 (FSM) | 状态明确、转换清晰、实现简单 |
| 卡牌效果 | 枚举 + 参数（数据驱动） | 集中维护、易扩展、可配置 |
| 模块通信 | Signal + 直接引用混合 | 逻辑通知用 Signal、流程控制用引用 |
| 全局管理 | Autoload 单例 | Godot 推荐方式、简单直接 |
| 集合类型 | Typed Array | 类型安全、补全友好 |
| UI 框架 | Control 节点 + 自定义容器 | 轻量、可控 |
| 测试 | GUT 框架或手动场景测试 | 社区主流、上手快 |
