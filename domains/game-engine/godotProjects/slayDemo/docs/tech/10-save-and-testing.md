# 10 - 存档与测试技术方案

## 1. 存档系统设计

### 1.1 存档策略

Demo 阶段采用最小化实现：仅在关键节点（每场战斗结束后、每层地图选择后）自动保存。不实现多存档槽位。

### 1.2 SaveData 定义

```gdscript
# scripts/systems/save_data.gd
extends Resource
class_name SaveData

@export var version: int = 1                    # 存档版本号
@export var timestamp: int = 0                  # 保存时间戳

# === 玩家数据 ===
@export var player_max_hp: int = 80
@export var player_current_hp: int = 80
@export var player_gold: int = 99

# === 卡组数据 ===
@export var deck_card_ids: Array[StringName] = []  # 卡牌ID列表
@export var upgraded_card_indices: Array[int] = [] # 已升级卡牌的索引

# === 地图数据 ===
@export var map_seed: int = 0
@export var current_node_id: int = -1
@export var visited_node_ids: Array[int] = []

# === 流程数据 ===
@export var current_floor: int = 0
@export var current_act: int = 1
```

### 1.3 SaveManager

```gdscript
# scripts/systems/save_manager.gd
extends Node

const SAVE_PATH: String = "user://save_data.tres"
const SAVE_VERSION: int = 1


## 保存游戏
static func save_game() -> bool:
    var data := SaveData.new()
    data.version = SAVE_VERSION
    data.timestamp = Time.get_unix_time_from_system() as int

    # 收集玩家数据
    data.player_max_hp = GameState.player_max_hp
    data.player_current_hp = GameState.player_current_hp
    data.player_gold = GameState.player_gold

    # 收集卡组数据（只存ID，不存整个Resource）
    data.deck_card_ids = []
    data.upgraded_card_indices = []
    for i in range(GameState.current_deck.size()):
        var card: CardData = GameState.current_deck[i]
        data.deck_card_ids.append(card.id)
        if card.is_upgraded:
            data.upgraded_card_indices.append(i)

    # 收集地图数据
    data.map_seed = GameState.map_seed
    data.current_node_id = GameState.current_map_ui.get_current_node_id()
    data.visited_node_ids = GameState.current_map_ui.get_visited_node_ids()
    data.current_floor = GameState.current_floor
    data.current_act = 1

    # 写入文件
    var result := ResourceSaver.save(data, SAVE_PATH)
    if result == OK:
        print("[SaveManager] 游戏已保存到 %s" % SAVE_PATH)
        return true
    else:
        push_error("[SaveManager] 保存失败，错误码: %d" % result)
        return false
```

### 1.4 加载存档

```gdscript
## 加载存档
static func load_game() -> bool:
    if not ResourceLoader.exists(SAVE_PATH):
        push_warning("[SaveManager] 无存档文件")
        return false

    var data: SaveData = load(SAVE_PATH) as SaveData
    if data == null:
        push_error("[SaveManager] 存档数据损坏")
        return false

    # 版本检查
    if data.version != SAVE_VERSION:
        push_warning("[SaveManager] 存档版本不匹配 (存档=%d, 当前=%d)" % [data.version, SAVE_VERSION])
        return false

    # 恢复玩家数据
    GameState.player_max_hp = data.player_max_hp
    GameState.player_current_hp = data.player_current_hp
    GameState.player_gold = data.player_gold

    # 恢复卡组
    GameState.current_deck.clear()
    for i in range(data.deck_card_ids.size()):
        var card_id: StringName = data.deck_card_ids[i]
        var card: CardData = DataLoader.get_card(card_id)
        if card:
            card = card.duplicate()
            if i in data.upgraded_card_indices:
                card.upgrade()
            GameState.current_deck.append(card)

    # 恢复地图
    GameState.map_seed = data.map_seed
    var generator := MapGenerator.new(data.map_seed)
    GameState.current_map = generator.generate()
    GameState.current_floor = data.current_floor

    print("[SaveManager] 存档已加载")
    return true


## 检查是否有存档
static func has_save() -> bool:
    return ResourceLoader.exists(SAVE_PATH)


## 删除存档
static func delete_save() -> void:
    if FileAccess.file_exists(SAVE_PATH):
        DirAccess.remove_absolute(SAVE_PATH)
        print("[SaveManager] 存档已删除")
```

### 1.5 自动保存触发点

```gdscript
# 在 GameState 中集成自动保存

func on_reward_finished() -> void:
    # ... 正常流程逻辑 ...
    SaveManager.save_game()  # 战斗结束 + 奖励选择后自动保存


func on_rest_finished() -> void:
    # ... 正常流程逻辑 ...
    SaveManager.save_game()  # 休息点后自动保存
```

## 2. 测试策略

### 2.1 测试框架选择

推荐使用 [GUT (Godot Unit Testing)](https://github.com/bitwes/Gut) 框架。GUT 是 Godot 社区最成熟的单元测试框架，支持 GDScript。

安装方式：将 GUT 插件放入 `addons/gut/` 目录。

### 2.2 测试场景结构

```
tests/
├── unit/
│   ├── test_deck_manager.gd
│   ├── test_card_effect_engine.gd
│   ├── test_status_manager.gd
│   ├── test_energy_system.gd
│   ├── test_enemy_ai.gd
│   └── test_map_generator.gd
├── integration/
│   ├── test_battle_flow.gd
│   └── test_game_flow.gd
└── test_runner.tscn              # 测试运行器场景
```

### 2.3 单元测试示例

#### DeckManager 测试

```gdscript
# tests/unit/test_deck_manager.gd
extends GutTest

var deck_manager: DeckManager


func before_each() -> void:
    deck_manager = DeckManager.new()
    # 创建测试用卡牌
    var cards := _create_test_cards(10)
    deck_manager.initialize_with_deck(cards)


func test_initialize_shuffles_deck() -> void:
    # 抽牌堆应该有10张牌
    assert_eq(deck_manager.draw_pile.size(), 10)
    assert_eq(deck_manager.hand.size(), 0)
    assert_eq(deck_manager.discard_pile.size(), 0)


func test_draw_card() -> void:
    var card := deck_manager.draw_card()
    assert_not_null(card, "应该抽到一张牌")
    assert_eq(deck_manager.hand.size(), 1)
    assert_eq(deck_manager.draw_pile.size(), 9)


func test_draw_cards_multiple() -> void:
    var drawn := deck_manager.draw_cards(3)
    assert_eq(drawn.size(), 3)
    assert_eq(deck_manager.hand.size(), 3)


func test_draw_card_hand_full() -> void:
    deck_manager.draw_cards(10)  # 填满手牌
    var result := deck_manager.draw_card()
    assert_null(result, "手牌已满时不应抽到牌")


func test_discard_card() -> void:
    deck_manager.draw_cards(3)
    var card: CardData = deck_manager.hand[0]
    deck_manager.discard_card(card)
    assert_eq(deck_manager.hand.size(), 2)
    assert_eq(deck_manager.discard_pile.size(), 1)


func test_discard_entire_hand() -> void:
    deck_manager.draw_cards(5)
    deck_manager.discard_entire_hand()
    assert_eq(deck_manager.hand.size(), 0)
    assert_eq(deck_manager.discard_pile.size(), 5)


func test_reshuffle_when_draw_empty() -> void:
    deck_manager.draw_cards(10)  # 抽空
    deck_manager.discard_entire_hand()  # 全部弃掉
    var card := deck_manager.draw_card()  # 应触发洗牌
    assert_not_null(card, "弃牌堆洗入后应能抽到牌")
    assert_eq(deck_manager.draw_pile.size(), 9)


func test_exhaust_card() -> void:
    deck_manager.draw_cards(3)
    var card: CardData = deck_manager.hand[0]
    deck_manager.exhaust_card(card)
    assert_eq(deck_manager.hand.size(), 2)
    assert_eq(deck_manager.exhaust_pile.size(), 1)
    assert_eq(deck_manager.discard_pile.size(), 0)


func _create_test_cards(count: int) -> Array[CardData]:
    var cards: Array[CardData] = []
    for i in range(count):
        var card := CardData.new()
        card.id = StringName("test_card_%d" % i)
        card.card_name = "测试卡 %d" % i
        card.cost = 1
        cards.append(card)
    return cards
```

#### StatusManager 测试

```gdscript
# tests/unit/test_status_manager.gd
extends GutTest

var status_manager: StatusManager
var test_entity: BattleEntity


func before_each() -> void:
    status_manager = StatusManager.new()
    test_entity = BattleEntity.new()
    test_entity.max_hp = 50
    test_entity.current_hp = 50

    # 手动注册状态数据库（不依赖文件加载）
    status_manager._status_database[&"strength"] = _create_status_data(&"strength", StackType.INTENSITY, DecayType.NONE)
    status_manager._status_database[&"vulnerable"] = _create_status_data(&"vulnerable", StackType.DURATION, DecayType.DECREASE_BY_ONE)
    status_manager._status_database[&"poison"] = _create_status_data(&"poison", StackType.DURATION, DecayType.DECREASE_BY_ONE)
    status_manager._status_database[&"test_trigger"] = _create_status_data(&"test_trigger", StackType.INTENSITY, DecayType.NONE, TriggerTiming.ON_TURN_START)


func test_apply_new_status() -> void:
    status_manager.apply_status(test_entity, &"strength", 3)
    assert_eq(status_manager.get_status_stacks(test_entity, &"strength"), 3)


func test_apply_existing_status_stacks() -> void:
    status_manager.apply_status(test_entity, &"strength", 2)
    status_manager.apply_status(test_entity, &"strength", 3)
    assert_eq(status_manager.get_status_stacks(test_entity, &"strength"), 5)


func test_remove_status() -> void:
    status_manager.apply_status(test_entity, &"vulnerable", 2)
    status_manager.remove_status(test_entity, &"vulnerable")
    assert_eq(status_manager.get_status_stacks(test_entity, &"vulnerable"), 0)


func test_decay_duration_status() -> void:
    status_manager.apply_status(test_entity, &"vulnerable", 3)
    # 模拟回合结束
    status_manager._decay_status(test_entity, &"vulnerable",
        status_manager._get_instance(test_entity, &"vulnerable"))
    assert_eq(status_manager.get_status_stacks(test_entity, &"vulnerable"), 2)


func test_non_decay_status() -> void:
    status_manager.apply_status(test_entity, &"strength", 3)
    status_manager._decay_status(test_entity, &"strength",
        status_manager._get_instance(test_entity, &"strength"))
    assert_eq(status_manager.get_status_stacks(test_entity, &"strength"), 3)


func test_max_stacks_cap() -> void:
    # 创建最大层数为5的状态
    var data := _create_status_data(&"capped", StackType.INTENSITY, DecayType.NONE)
    data.max_stacks = 5
    status_manager._status_database[&"capped"] = data

    status_manager.apply_status(test_entity, &"capped", 10)
    assert_eq(status_manager.get_status_stacks(test_entity, &"capped"), 5)


func _create_status_data(
    id: StringName,
    stack_type: StackType,
    decay_type: DecayType,
    trigger: TriggerTiming = TriggerTiming.NONE
) -> StatusData:
    var data := StatusData.new()
    data.id = id
    data.stack_type = stack_type
    data.decay_type = decay_type
    data.trigger_timing = trigger
    data.max_stacks = 99
    return data
```

#### MapGenerator 测试

```gdscript
# tests/unit/test_map_generator.gd
extends GutTest

func test_generate_returns_map_data() -> void:
    var generator := MapGenerator.new(12345)
    var map := generator.generate()
    assert_not_null(map)
    assert(map is MapData)


func test_generate_has_start_node() -> void:
    var generator := MapGenerator.new(12345)
    var map := generator.generate()
    var start := map.get_start_node()
    assert_not_null(start, "应有起始节点")
    assert_eq(start.room_type, RoomType.START)


func test_generate_has_boss_node() -> void:
    var generator := MapGenerator.new(12345)
    var map := generator.generate()
    var boss := map.get_boss_node()
    assert_not_null(boss, "应有Boss节点")
    assert_eq(boss.room_type, RoomType.BOSS)


func test_generate_deterministic_with_seed() -> void:
    var gen1 := MapGenerator.new(42)
    var gen2 := MapGenerator.new(42)
    var map1 := gen1.generate()
    var map2 := gen2.generate()

    assert_eq(map1.nodes.size(), map2.nodes.size(), "相同种子应生成相同数量的节点")

    for i in range(map1.nodes.size()):
        assert_eq(map1.nodes[i].room_type, map2.nodes[i].room_type)


func test_generate_all_nodes_connected() -> void:
    var generator := MapGenerator.new(12345)
    var map := generator.generate()

    # 每个非Boss节点应有至少一个连接
    for node: MapNodeData in map.nodes:
        if node.room_type != RoomType.BOSS:
            assert_gt(node.connections.size(), 0, "非Boss节点应有连接")
```

### 2.4 集成测试示例

```gdscript
# tests/integration/test_battle_flow.gd
extends GutTest

## 测试完整战斗流程
func test_full_battle_victory() -> void:
    # 1. 准备
    var battle_manager := BattleManager.new()
    var encounter := _create_test_encounter()

    # 2. 开始战斗
    battle_manager.start_battle(encounter)
    assert_eq(battle_manager.get_current_state(), BattleState.PLAYER_TURN)

    # 3. 打出卡牌（模拟）
    var result := battle_manager.try_play_card(0, battle_manager.get_enemies()[0])
    assert_true(result, "应能打出第一张手牌")

    # 4. 结束玩家回合
    battle_manager.end_player_turn()
    # 敌人回合应自动执行


func _create_test_encounter() -> EncounterData:
    var encounter := EncounterData.new()
    encounter.id = &"test_encounter"

    var enemy := EnemyData.new()
    enemy.id = &"test_enemy"
    enemy.enemy_name = "测试敌人"
    enemy.min_hp = 10
    enemy.max_hp = 10
    enemy.behavior_type = BehaviorType.FIXED_SEQUENCE

    var action := EnemyActionData.new()
    action.action_name = "测试攻击"
    action.intent_type = IntentType.ATTACK
    action.intent_value = 5
    action.effects = [EffectAction.new(EffectType.DEAL_DAMAGE, 5)]
    enemy.action_list = [action]
    enemy.action_sequence = [0]

    encounter.enemy_list = [enemy]
    return encounter
```

## 3. 调试工具

### 3.1 作弊菜单

```gdscript
# scripts/debug/cheat_menu.gd
extends CanvasLayer

## Debug 模式下按 F1 打开作弊菜单
## 仅在 OS.is_debug_build() 时激活

var _visible: bool = false

@onready var panel: PanelContainer = $PanelContainer
@onready var vbox: VBoxContainer = $PanelContainer/MarginContainer/VBoxContainer


func _ready() -> void:
    if not OS.is_debug_build():
        queue_free()
        return
    panel.visible = false
    _setup_buttons()


func _input(event: InputEvent) -> void:
    if not OS.is_debug_build():
        return
    if event.is_action_pressed(&"debug_toggle_cheat_menu"):
        _visible = !_visible
        panel.visible = _visible


func _setup_buttons() -> void:
    _add_cheat_button("无限能量", _cheat_infinite_energy)
    _add_cheat_button("满血", _cheat_full_hp)
    _add_cheat_button("抽5张牌", _cheat_draw_5)
    _add_cheat_button("获得100金币", _cheat_add_gold)
    _add_cheat_button("秒杀所有敌人", _cheat_kill_all_enemies)
    _add_cheat_button("重新加载所有数据", _cheat_reload_data)
    _add_cheat_button("跳过当前战斗", _cheat_skip_battle)


func _add_cheat_button(label: String, callback: Callable) -> void:
    var button := Button.new()
    button.text = label
    button.pressed.connect(callback)
    vbox.add_child(button)


func _cheat_infinite_energy() -> void:
    BattleManager.energy_system.gain_energy(99)


func _cheat_full_hp() -> void:
    GameState.heal_player(999)


func _cheat_draw_5() -> void:
    BattleManager.deck_manager.draw_cards(5)


func _cheat_add_gold() -> void:
    GameState.add_gold(100)


func _cheat_kill_all_enemies() -> void:
    for enemy: BattleEntity in BattleManager.get_enemies():
        enemy.take_damage(9999)


func _cheat_reload_data() -> void:
    DataLoader.clear_cache()
    DataLoader.load_all_cards()
    DataLoader.load_all_enemies()


func _cheat_skip_battle() -> void:
    BattleManager._transition_to(BattleState.BATTLE_END)
```

### 3.2 日志系统

```gdscript
# scripts/debug/logger.gd
extends Node

enum LogLevel {
    DEBUG,
    INFO,
    WARNING,
    ERROR,
}

var _min_level: LogLevel = LogLevel.INFO
var _log_buffer: Array[String] = []
var _max_buffer_size: int = 500


func _ready() -> void:
    if not OS.is_debug_build():
        _min_level = LogLevel.WARNING


static func debug(message: String, context: String = "") -> void:
    _log(LogLevel.DEBUG, message, context)


static func info(message: String, context: String = "") -> void:
    _log(LogLevel.INFO, message, context)


static func warn(message: String, context: String = "") -> void:
    _log(LogLevel.WARNING, message, context)


static func error(message: String, context: String = "") -> void:
    _log(LogLevel.ERROR, message, context)


static func _log(level: LogLevel, message: String, context: String) -> void:
    var logger := _get_instance()
    if level < logger._min_level:
        return

    var prefix := _level_prefix(level)
    var context_str := "[%s] " % context if context != "" else ""
    var formatted := "%s %s%s" % [prefix, context_str, message]

    match level:
        LogLevel.DEBUG:
            print(formatted)
        LogLevel.INFO:
            print(formatted)
        LogLevel.WARNING:
            push_warning(formatted)
        LogLevel.ERROR:
            push_error(formatted)

    logger._log_buffer.append(formatted)
    if logger._log_buffer.size() > logger._max_buffer_size:
        logger._log_buffer.pop_front()


static func _level_prefix(level: LogLevel) -> String:
    match level:
        LogLevel.DEBUG:   return "[DBG]"
        LogLevel.INFO:    return "[INF]"
        LogLevel.WARNING: return "[WRN]"
        LogLevel.ERROR:   return "[ERR]"
        _:                return "[???]"


static func _get_instance() -> Node:
    return Engine.get_main_loop().root.get_node("Logger")


## 导出日志到文件
static func dump_to_file(path: String = "user://debug_log.txt") -> void:
    var logger := _get_instance()
    var file := FileAccess.open(path, FileAccess.WRITE)
    if file:
        for line: String in logger._log_buffer:
            file.store_line(line)
        file.close()
```

### 3.3 战斗日志面板

```gdscript
# scripts/debug/battle_log_panel.gd
extends RichTextLabel

## 实时显示战斗事件日志

func _ready() -> void:
    if not OS.is_debug_build():
        visible = false
        return

    bbcode_enabled = true
    scroll_following = true

    # 监听所有战斗信号
    BattleManager.state_changed.connect(_log_state_change)
    BattleManager.damage_dealt.connect(_log_damage)
    BattleManager.battle_ended.connect(_log_battle_end)


func _log_state_change(old_state: int, new_state: int) -> void:
    append_text("[color=gray]%s → %s[/color]\n" % [
        BattleState.keys()[old_state],
        BattleState.keys()[new_state],
    ])


func _log_damage(target: NodePath, amount: int) -> void:
    append_text("[color=red]%s 受到 %d 伤害[/color]\n" % [target, amount])


func _log_battle_end(result: int) -> void:
    var result_text := "胜利" if result == BattleResult.VICTORY else "失败"
    append_text("[color=yellow]战斗结束: %s[/color]\n" % result_text)
```

## 4. 导出配置

### 4.1 导出预设

```ini
# export_presets.cfg 关键配置

[preset.0]
name="Windows Desktop"
platform="Windows Desktop"
runnable=true

[preset.0.options]
custom_template/debug=""
custom_template/release=""
binary_format/64_bits=true
binary_format/embed_pck=true
texture_format/bptc=true
texture_format/s3tc=true
```

### 4.2 项目设置建议

```
# project.godot 关键配置

[display]
window/size/viewport_width=1280
window/size/viewport_height=720
window/stretch/mode="canvas_items"
window/stretch/aspect="keep"

[input]
debug_toggle_cheat_menu=Key(F1)
debug_reload_data=Key(F5, ctrl)
end_turn=Key(Space)

[autoload]
GameState="*res://scripts/autoload/game_state.gd"
SceneRouter="*res://scripts/autoload/scene_router.gd"
Logger="*res://scripts/debug/logger.gd"
```

## 5. 性能基准与优化建议

### 5.1 性能基准目标

```
场景                      目标帧时间        说明
───────────────────────────────────────────────────
地图场景                   < 2ms/frame      静态UI，几乎无计算
战斗场景（空闲）           < 3ms/frame      等待玩家输入
战斗场景（效果结算）       < 5ms/frame      卡牌效果链执行
地图生成                   < 50ms           一次性操作
卡牌数据加载               < 100ms          游戏启动时
存档/读档                  < 50ms           Resource序列化
```

### 5.2 潜在性能瓶颈与优化

#### 5.2.1 状态管理器查询优化

```
问题: 每次伤害计算都查询状态，高频调用
优化: 对常用状态（力量、易伤、虚弱）使用缓存值

# 在 BattleEntity 上缓存常用状态值
var cached_strength: int = 0
var is_vulnerable: bool = false
var is_weak: bool = false

# 状态变化时更新缓存
func _on_status_changed(status_id: StringName, stacks: int) -> void:
    match status_id:
        &"strength":
            cached_strength = stacks
        &"vulnerable":
            is_vulnerable = stacks > 0
        &"weak":
            is_weak = stacks > 0
```

#### 5.2.2 卡牌效果执行优化

```
问题: await 等待动画可能造成帧率波动
优化: 轻量效果不等待动画，仅重型效果等待

# 区分需要等待的效果类型
const INSTANT_EFFECTS: Array[EffectType] = [
    EffectType.GAIN_BLOCK,
    EffectType.GAIN_ENERGY,
    EffectType.DRAW_CARDS,
]

const ANIMATED_EFFECTS: Array[EffectType] = [
    EffectType.DEAL_DAMAGE,
    EffectType.APPLY_STATUS,
]
```

#### 5.2.3 UI 更新频率优化

```
问题: 每次状态变化都更新UI
优化: 合并同一帧内的多次更新

# 使用标志位延迟更新
var _ui_dirty: bool = false

func mark_ui_dirty() -> void:
    _ui_dirty = true

func _process(_delta: float) -> void:
    if _ui_dirty:
        _refresh_ui()
        _ui_dirty = false
```

#### 5.2.4 Resource 加载优化

```
问题: 运行时 load() 可能有卡顿
优化:
  1. 启动时预加载所有 Resource
  2. 使用 ResourceLoader.load_threaded() 异步加载大资源
  3. 图片资源启用压缩
```

### 5.3 内存管理清单

```
1. 战斗结束时清理 BattleManager 及所有子系统
2. 场景切换时 queue_free() 旧场景的所有子节点
3. StatusInstance 使用 RefCounted，自动释放
4. DataLoader 缓存全局持有，不随场景释放
5. 动画创建的临时节点（浮动数字等）需手动 queue_free
6. Signal 连接在 _exit_tree 时断开（Godot 自动处理对象级连接）
```

### 5.4 Profiling 建议

```
# 使用 Godot 内置 Profiler
# 编辑器 → 调试 → Profiler

重点关注:
1. _process() 和 _physics_process() 的耗时
2. 信号 emit 的高频调用
3. Resource 加载耗时
4. 节点实例化（instantiate）耗时
5. 内存使用趋势（是否持续增长）
```
