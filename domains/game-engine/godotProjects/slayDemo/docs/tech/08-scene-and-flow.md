# 08 - 场景与流程管理技术方案

## 1. 场景结构设计

### 1.1 场景树总览

```
AppRoot (Node)                           # 应用根节点，始终存在
├── SceneContainer (Node)                # 场景容器，切换子场景
│   └── [当前场景]                       # 同一时间只有一个子场景
│       ├── MainMenu
│       ├── MapScene
│       ├── BattleScene
│       └── RewardScene
├── GlobalUI (CanvasLayer)               # 全局UI层（覆盖在场景之上）
│   ├── TransitionOverlay              # 场景切换遮罩
│   ├── LoadingIndicator               # 加载指示器
│   └── DebugOverlay (可选)             # 调试信息叠加层
├── GameState (Autoload)                # 全局状态
├── SceneRouter (Autoload)              # 场景切换管理
└── DataLoader (Autoload, 可选)          # 数据加载器
```

### 1.2 各场景职责

| 场景 | 文件 | 职责 |
|------|------|------|
| MainMenu | `scenes/app/main_menu.tscn` | 主菜单、开始游戏、继续游戏、设置 |
| MapScene | `scenes/map/map_scene.tscn` | 地图浏览、选择下一个房间 |
| BattleScene | `scenes/battle/battle_scene.tscn` | 战斗主场景，包含所有战斗UI和逻辑 |
| RewardScene | `scenes/reward/reward_scene.tscn` | 战斗奖励选择（卡牌/金币/药水） |
| RestScene | `scenes/map/rest_scene.tscn` | 休息点（回复HP或升级卡牌） |

### 1.3 BattleScene 内部结构

```
BattleScene (Node2D)
├── Background (TextureRect)             # 战斗背景图
├── EnemyContainer (HBoxContainer)       # 敌人区域
│   ├── EnemyView (实例化)
│   │   ├── Art (TextureRect)
│   │   ├── HPBar (ProgressBar)
│   │   ├── IntentDisplay (HBoxContainer)
│   │   │   ├── IntentIcon (TextureRect)
│   │   │   └── IntentValue (Label)
│   │   └── StatusIcons (HBoxContainer)
│   └── ...
├── PlayerArea (VBoxContainer)           # 玩家区域
│   ├── PlayerArt (TextureRect)
│   ├── PlayerHPBar (ProgressBar)
│   ├── PlayerBlockLabel (Label)
│   ├── EnergyDisplay (Label)
│   └── PlayerStatusIcons (HBoxContainer)
├── HandArea (Control)                   # 手牌区域
│   └── HandLayout (Control)             # 手牌布局管理器
│       ├── CardView (实例化)
│       └── ...
├── PileButtons (HBoxContainer)          # 卡组按钮
│   ├── DrawPileButton (Button)          # "抽牌堆: N"
│   └── DiscardPileButton (Button)       # "弃牌堆: N"
├── TurnIndicator (Label)                # 回合指示
└── EndTurnButton (Button)               # "结束回合"
```

## 2. SceneRouter 实现方案

### 2.1 SceneRouter 定义

```gdscript
# scripts/autoload/scene_router.gd
extends Node

signal scene_transition_started(scene_name: StringName)
signal scene_transition_finished(scene_name: StringName)

enum TransitionType {
    INSTANT,        # 立即切换
    FADE,           # 淡入淡出
    SLIDE,          # 滑动
}

const SCENE_PATHS: Dictionary = {
    &"main_menu": "res://scenes/app/main_menu.tscn",
    &"map": "res://scenes/map/map_scene.tscn",
    &"battle": "res://scenes/battle/battle_scene.tscn",
    &"reward": "res://scenes/reward/reward_scene.tscn",
    &"rest": "res://scenes/map/rest_scene.tscn",
}

var _container: Node = null
var _transition_overlay: ColorRect = null
var _current_scene_name: StringName = &""
var _is_transitioning: bool = false


func _ready() -> void:
    # 等待场景树准备好
    await get_tree().process_frame
    _container = get_node_or_null("/root/AppRoot/SceneContainer")
    _transition_overlay = get_node_or_null("/root/AppRoot/GlobalUI/TransitionOverlay")


func change_scene(scene_name: StringName, transition: TransitionType = TransitionType.FADE) -> void:
    if _is_transitioning:
        push_warning("SceneRouter: 正在切换中，忽略请求")
        return

    if not SCENE_PATHS.has(scene_name):
        push_error("SceneRouter: 未知场景 '%s'" % scene_name)
        return

    _is_transitioning = true
    scene_transition_started.emit(scene_name)

    match transition:
        TransitionType.INSTANT:
            _do_instant_change(scene_name)
        TransitionType.FADE:
            await _do_fade_change(scene_name)

    _current_scene_name = scene_name
    _is_transitioning = false
    scene_transition_finished.emit(scene_name)
```

### 2.2 切换实现

```gdscript
func _do_instant_change(scene_name: StringName) -> void:
    _unload_current()
    _load_and_add(scene_name)


func _do_fade_change(scene_name: StringName) -> void:
    # 淡出
    if _transition_overlay:
        _transition_overlay.mouse_filter = Control.MOUSE_FILTER_STOP  # 屏蔽输入
        var tween := create_tween()
        tween.tween_property(_transition_overlay, "color:a", 1.0, 0.3)
        await tween.finished

    # 切换
    _unload_current()
    _load_and_add(scene_name)

    # 等待一帧让新场景初始化
    await get_tree().process_frame

    # 淡入
    if _transition_overlay:
        var tween := create_tween()
        tween.tween_property(_transition_overlay, "color:a", 0.0, 0.3)
        await tween.finished
        _transition_overlay.mouse_filter = Control.MOUSE_FILTER_IGNORE


func _unload_current() -> void:
    if _container == null:
        return
    for child in _container.get_children():
        child.queue_free()


func _load_and_add(scene_name: StringName) -> void:
    if _container == null:
        return
    var scene_path: String = SCENE_PATHS[scene_name]
    var packed := load(scene_path) as PackedScene
    if packed:
        var instance := packed.instantiate()
        _container.add_child(instance)
        instance.owner = _container


func get_current_scene_name() -> StringName:
    return _current_scene_name
```

### 2.3 场景切换遮罩配置

```
GlobalUI/TransitionOverlay (ColorRect)
  - anchor_right = 1.0
  - anchor_bottom = 1.0
  - color = Color(0, 0, 0, 0)  # 初始透明
  - mouse_filter = MOUSE_FILTER_IGNORE
```

## 3. 场景切换动画与过渡

### 3.1 Tween 动画方案

使用 Godot 4.x 的 SceneTreeTween 实现过渡动画。

```gdscript
# 支持的过渡效果

# 1. 淡入淡出（默认）
#    0.3s 黑色遮罩淡出 → 切换场景 → 0.3s 遮罩淡入

# 2. 快速淡入淡出
#    0.15s × 2

# 3. 无过渡
#    直接切换

# 自定义过渡示例：
func change_scene_custom(
    scene_name: StringName,
    fade_out_duration: float = 0.3,
    fade_in_duration: float = 0.3,
    overlay_color: Color = Color.BLACK
) -> void:
    if _transition_overlay:
        _transition_overlay.color = Color(overlay_color.r, overlay_color.g, overlay_color.b, 0.0)

    # ... 其余同 _do_fade_change
```

### 3.2 场景切换时的信号流

```
SceneRouter.change_scene("battle")
  │
  ├── scene_transition_started("battle")
  │     └── GameState 接收 → 暂停输入
  │
  ├── 淡出动画 (0.3s)
  │
  ├── 卸载当前场景
  │     └── 场景节点的 _exit_tree() 触发清理
  │
  ├── 加载新场景
  │     └── 新场景的 _ready() 触发初始化
  │
  ├── 淡入动画 (0.3s)
  │
  └── scene_transition_finished("battle")
        └── GameState 接收 → 恢复输入
```

## 4. 全局状态管理

### 4.1 GameState 定义

```gdscript
# scripts/autoload/game_state.gd
extends Node

signal game_phase_changed(new_phase: GamePhase)
signal player_hp_changed(current: int, maximum: int)
signal gold_changed(amount: int)

enum GamePhase {
    MENU,           # 主菜单
    MAP,            # 地图浏览
    BATTLE,         # 战斗中
    REWARD,         # 奖励选择
    REST,           # 休息点
    GAME_OVER,      # 游戏结束
    VICTORY,        # 通关胜利
}

# === 玩家持久数据 ===
var player_max_hp: int = 80
var player_current_hp: int = 80
var player_gold: int = 99

# === 卡组 ===
var current_deck: Array[CardData] = []
var master_deck: Array[CardData] = []  # 升级/移除操作的原数据

# === 地图数据 ===
var current_map: MapData = null
var current_floor: int = 0
var map_seed: int = 0

# === 遭遇数据 ===
var current_encounter: EncounterData = null

# === 流程状态 ===
var current_phase: GamePhase = GamePhase.MENU
var input_enabled: bool = true
```

### 4.2 游戏流程方法

```gdscript
## 开始新游戏
func start_new_game() -> void:
    player_max_hp = 80
    player_current_hp = 80
    player_gold = 99

    current_deck = create_starter_deck()
    master_deck = current_deck.duplicate(true)

    map_seed = randi()
    var generator := MapGenerator.new(map_seed)
    current_map = generator.generate()
    current_floor = 0

    current_phase = GamePhase.MAP
    game_phase_changed.emit(current_phase)

    SceneRouter.change_scene(&"map")


## 进入战斗
func enter_battle(encounter: EncounterData) -> void:
    current_encounter = encounter
    current_phase = GamePhase.BATTLE
    game_phase_changed.emit(current_phase)
    SceneRouter.change_scene(&"battle")


## 战斗胜利
func on_battle_victory(rewards: RewardData) -> void:
    current_phase = GamePhase.REWARD
    game_phase_changed.emit(current_phase)
    SceneRouter.change_scene(&"reward")


## 奖励选择完成，回到地图
func on_reward_finished() -> void:
    current_phase = GamePhase.MAP
    game_phase_changed.emit(current_phase)
    SceneRouter.change_scene(&"map")


## 进入休息点
func enter_rest_site() -> void:
    current_phase = GamePhase.REST
    game_phase_changed.emit(current_phase)
    SceneRouter.change_scene(&"rest")


## 玩家死亡
func on_player_death() -> void:
    current_phase = GamePhase.GAME_OVER
    game_phase_changed.emit(current_phase)
    # 显示游戏结束界面


## 回到主菜单
func return_to_menu() -> void:
    current_phase = GamePhase.MENU
    game_phase_changed.emit(current_phase)
    SceneRouter.change_scene(&"main_menu")
```

### 4.3 玩家数据操作

```gdscript
func take_player_damage(amount: int) -> void:
    player_current_hp = maxi(player_current_hp - amount, 0)
    player_hp_changed.emit(player_current_hp, player_max_hp)
    if player_current_hp <= 0:
        on_player_death()


func heal_player(amount: int) -> void:
    player_current_hp = mini(player_current_hp + amount, player_max_hp)
    player_hp_changed.emit(player_current_hp, player_max_hp)


func add_gold(amount: int) -> void:
    player_gold += amount
    gold_changed.emit(player_gold)


func spend_gold(amount: int) -> bool:
    if player_gold < amount:
        return false
    player_gold -= amount
    gold_changed.emit(player_gold)
    return true


## 将卡牌加入卡组
func add_card_to_deck(card: CardData) -> void:
    current_deck.append(card.duplicate())
    master_deck.append(card.duplicate())


## 从卡组中移除卡牌
func remove_card_from_deck(card: CardData) -> void:
    current_deck.erase(card)
    master_deck.erase(card)
```

## 5. 战斗到奖励到地图的流转实现

### 5.1 完整流程图

```
MainMenu
  │ 点击"开始游戏"
  ▼
GameState.start_new_game()
  │ 创建卡组 + 生成地图
  ▼
MapScene
  │ 玩家点击可到达的节点
  ▼
MapUIController._on_node_clicked()
  │
  ├── 战斗节点:
  │     ├── GameState.enter_battle(encounter)
  │     ▼
  │   BattleScene
  │     │ BattleManager.start_battle(encounter)
  │     │ [战斗进行...]
  │     │ BattleManager._on_battle_end() → VICTORY
  │     ▼
  │   GameState.on_battle_victory(rewards)
  │     ▼
  │   RewardScene
  │     │ 玩家选择奖励卡牌/跳过
  │     ▼
  │   GameState.on_reward_finished()
  │     └── 回到 MapScene
  │
  ├── 休息节点:
  │     ├── GameState.enter_rest_site()
  │     ▼
  │   RestScene
  │     │ 回血30% 或 升级一张卡
  │     ▼
  │   GameState.on_rest_finished()
  │     └── 回到 MapScene
  │
  ├── Boss节点:
  │     └── 同战斗节点，胜利后进入 GAME_OVER/VICTORY
  │
  └── 事件/商店:
        └── Demo 阶段可选实现
```

### 5.2 BattleScene 生命周期

```gdscript
# scenes/battle/battle_scene.gd
extends Node2D

var battle_manager: BattleManager


func _ready() -> void:
    battle_manager = BattleManager.new()
    add_child(battle_manager)

    # 连接 BattleManager 信号到 UI
    battle_manager.battle_ended.connect(_on_battle_ended)
    battle_manager.state_changed.connect(_on_battle_state_changed)

    # 启动战斗
    battle_manager.start_battle(GameState.current_encounter)


func _on_battle_ended(result: int) -> void:
    match result:
        BattleResult.VICTORY:
            # 延迟一小段时间展示胜利效果
            await get_tree().create_timer(1.0).timeout
            GameState.on_battle_victory(_generate_rewards())

        BattleResult.DEFEAT:
            await get_tree().create_timer(1.0).timeout
            GameState.on_player_death()


func _generate_rewards() -> RewardData:
    var rewards := RewardData.new()
    rewards.gold_reward = randi_range(15, 30)

    # 生成3张可选卡牌
    rewards.card_choices = _generate_card_choices()

    return rewards
```

### 5.3 RewardScene 生命周期

```gdscript
# scenes/reward/reward_scene.gd
extends Control

signal reward_card_selected(card: CardData)
signal reward_skipped()

var reward_data: RewardData

@onready var card_container: HBoxContainer = $CardChoices
@onready var gold_label: Label = $GoldReward
@onready var skip_button: Button = $SkipButton


func _ready() -> void:
    reward_data = GameState.current_rewards
    _display_rewards()


func _display_rewards() -> void:
    # 显示金币奖励
    gold_label.text = "+%d 金币" % reward_data.gold_reward
    GameState.add_gold(reward_data.gold_reward)

    # 显示可选卡牌
    for card: CardData in reward_data.card_choices:
        var card_view := _create_card_view(card)
        card_container.add_child(card_view)
        card_view.gui_input.connect(_on_card_gui_input.bind(card))

    skip_button.pressed.connect(_on_skip_pressed)


func _on_card_gui_input(event: InputEvent, card: CardData) -> void:
    if event is InputEventMouseButton and event.pressed:
        GameState.add_card_to_deck(card)
        GameState.on_reward_finished()


func _on_skip_pressed() -> void:
    GameState.on_reward_finished()
```

### 5.4 RewardData 定义

```gdscript
# scripts/systems/reward_data.gd
extends Resource
class_name RewardData

@export var gold_reward: int = 0
@export var card_choices: Array[CardData] = []
@export var potion_reward: StringName = &""  # 预留
```

## 6. 场景生命周期管理

### 6.1 场景生命周期钩子

每个场景通过 `_ready()` 和 `_exit_tree()` 管理自身生命周期。

```gdscript
# 通用模式
func _ready() -> void:
    # 初始化场景
    # 连接信号
    # 启动逻辑
    pass


func _exit_tree() -> void:
    # 断开所有信号连接
    # 清理临时资源
    # 通知管理器
    pass
```

### 6.2 输入管理

```gdscript
# GameState 中管理全局输入屏蔽
var input_enabled: bool = true


func set_input_enabled(enabled: bool) -> void:
    input_enabled = enabled


## 各场景的输入处理前检查
func _input(event: InputEvent) -> void:
    if not GameState.input_enabled:
        return
    # 处理输入...
```

### 6.3 内存管理

```gdscript
# SceneRouter 切换时确保旧场景被释放
func _unload_current() -> void:
    if _container == null:
        return
    for child in _container.get_children():
        # 先断开所有信号
        if child.has_signal("tree_exiting"):
            # Godot 会自动处理信号断开
            pass
        child.queue_free()
```
