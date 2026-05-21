# 02 - 战斗系统技术方案

## 1. 战斗状态机实现方案

### 1.1 状态定义

战斗流程通过有限状态机管理，每个状态有明确的进入、更新、退出逻辑。

```gdscript
# scripts/battle/battle_manager.gd

enum BattleState {
    BATTLE_START,       # 战斗初始化：加载敌人、洗牌、设置初始能量
    PLAYER_TURN,        # 玩家回合：抽牌、打牌、使用技能
    PLAYER_RESOLVE,     # 玩家行动结算：执行卡牌效果的动画和逻辑
    ENEMY_TURN,         # 敌人回合：执行敌人意图
    ENEMY_RESOLVE,      # 敌人行动结算
    BATTLE_END,         # 战斗结束：胜利/失败判定、清理
}

signal state_changed(old_state: BattleState, new_state: BattleState)
signal battle_started()
signal battle_ended(result: int)  # 0=胜利, 1=失败

var _current_state: BattleState = BattleState.BATTLE_START
var _state_locked: bool = false   # 防止动画期间状态被篡改
```

### 1.2 状态转换实现

```gdscript
func _transition_to(new_state: BattleState) -> void:
    if _state_locked:
        push_warning("BattleManager: 状态被锁定，无法转换到 %s" % BattleState.keys()[new_state])
        return

    var old_state := _current_state
    _exit_state(old_state)
    _current_state = new_state
    _enter_state(new_state)
    state_changed.emit(old_state, new_state)


func _enter_state(state: BattleState) -> void:
    match state:
        BattleState.BATTLE_START:
            _on_battle_start()
        BattleState.PLAYER_TURN:
            _on_player_turn_start()
        BattleState.PLAYER_RESOLVE:
            _on_player_resolve()
        BattleState.ENEMY_TURN:
            _on_enemy_turn_start()
        BattleState.ENEMY_RESOLVE:
            _on_enemy_resolve()
        BattleState.BATTLE_END:
            _on_battle_end()


func _exit_state(state: BattleState) -> void:
    match state:
        BattleState.PLAYER_TURN:
            _on_player_turn_end()
        BattleState.ENEMY_TURN:
            _on_enemy_turn_end()
        _:
            pass


func _on_battle_start() -> void:
    _initialize_battle()
    battle_started.emit()
    # 自动进入玩家回合
    _transition_to(BattleState.PLAYER_TURN)
```

### 1.3 状态转换图

```
BATTLE_START ──────▶ PLAYER_TURN ◀────────────────────┐
      │                   │                             │
      │             玩家打出卡牌                         │
      │                   │                             │
      │                   ▼                             │
      │            PLAYER_RESOLVE ──▶ ENEMY_TURN       │
      │                                    │            │
      │                              敌人执行意图        │
      │                                    │            │
      │                                    ▼            │
      │             PLAYER_TURN ◀── ENEMY_RESOLVE ─────┘
      │                  │
      │           任一方HP<=0
      │                  │
      ▼                  ▼
                BATTLE_END
```

## 2. 回合管理器设计

### 2.1 TurnManager

TurnManager 负责管理单回合内的阶段推进，与 BattleManager 配合工作。

```gdscript
# scripts/battle/turn_manager.gd
extends Node

signal turn_started(turn_number: int, is_player_turn: bool)
signal turn_phase_changed(phase: StringName)
signal turn_ended(turn_number: int)

var current_turn: int = 0
var is_player_turn: bool = true


func start_new_turn() -> void:
    current_turn += 1
    is_player_turn = !is_player_turn if current_turn > 1 else true

    turn_started.emit(current_turn, is_player_turn)

    if is_player_turn:
        _start_player_turn()
    else:
        _start_enemy_turn()


func _start_player_turn() -> void:
    # 1. 回合开始时触发状态效果（如"回合开始抽牌"等）
    BattleManager.status_manager.on_turn_start(is_player_entity := true)

    # 2. 恢复能量
    BattleManager.energy_system.refresh_energy()

    # 3. 抽牌
    var draw_count := BattleManager.status_manager.get_modified_draw_count(
        BaseDrawCount.DRAW_PER_TURN  # 默认5
    )
    BattleManager.deck_manager.draw_cards(draw_count)


func _start_enemy_turn() -> void:
    # 1. 回合开始时触发敌人的状态效果
    BattleManager.status_manager.on_turn_start(is_player_entity := false)

    # 2. 执行敌人意图
    BattleManager.enemy_ai.execute_intents()

    # 3. 生成下一回合的意图
    BattleManager.enemy_ai.generate_intents()


func end_current_turn() -> void:
    turn_ended.emit(current_turn)
```

### 2.2 回合流程时序

```
玩家回合开始
  ├── on_turn_start(player) 触发状态
  ├── 恢复能量到上限
  ├── 抽牌（默认5张）
  │
  ├── [玩家操作阶段：打牌/使用药水/结束回合]
  │     │
  │     ├── 打出卡牌 → 消耗能量 → 执行效果
  │     └── 点击"结束回合"
  │
  ├── 弃掉所有手牌
  ├── on_turn_end(player) 触发状态
  │
  ▼
敌人回合开始
  ├── on_turn_start(enemies) 触发状态
  ├── 逐一执行敌人意图
  │     ├── 造成伤害
  │     ├── 获得格挡
  │     └── 施加状态
  ├── on_turn_end(enemies) 触发状态
  ├── 生成下一回合意图
  │
  ▼
回到玩家回合
```

## 3. 卡组流转引擎

### 3.1 数据结构

```gdscript
# scripts/battle/deck_manager.gd
extends Node

signal card_drawn(card: CardData)
signal card_discarded(card: CardData)
signal card_exhausted(card: CardData)  # 消耗（移出战斗）
signal deck_shuffled()
signal hand_changed(hand: Array[CardData])

# 三大卡组
var draw_pile: Array[CardData] = []     # 抽牌堆
var hand: Array[CardData] = []          # 手牌
var discard_pile: Array[CardData] = []  # 弃牌堆
var exhaust_pile: Array[CardData] = []  # 消耗堆（可选，Exhaust 机制用）

const MAX_HAND_SIZE: int = 10


func _init() -> void:
    pass
```

### 3.2 初始化

```gdscript
## 用当前卡组初始化战斗卡组
func initialize_with_deck(deck: Array[CardData]) -> void:
    draw_pile.clear()
    hand.clear()
    discard_pile.clear()
    exhaust_pile.clear()

    # 深拷贝，避免修改原始卡组数据
    for card: CardData in deck:
        draw_pile.append(card.duplicate())

    shuffle_draw_pile()


func shuffle_draw_pile() -> void:
    draw_pile.shuffle()
    deck_shuffled.emit()
```

### 3.3 抽牌操作

```gdscript
## 从抽牌堆顶部抽一张牌
func draw_card() -> CardData:
    if hand.size() >= MAX_HAND_SIZE:
        push_warning("DeckManager: 手牌已满，无法抽牌")
        return null

    # 抽牌堆为空时，洗入弃牌堆
    if draw_pile.is_empty():
        if discard_pile.is_empty():
            return null  # 无牌可抽
        _reshuffle_discard_into_draw()

    var card: CardData = draw_pile.pop_back()
    if card:
        hand.append(card)
        card_drawn.emit(card)
        hand_changed.emit(hand)

    return card


## 抽多张牌
func draw_cards(count: int) -> Array[CardData]:
    var drawn: Array[CardData] = []
    for i in range(count):
        var card := draw_card()
        if card:
            drawn.append(card)
    return drawn


## 弃牌堆洗入抽牌堆
func _reshuffle_discard_into_draw() -> void:
    draw_pile.append_array(discard_pile)
    discard_pile.clear()
    shuffle_draw_pile()
```

### 3.4 弃牌与消耗

```gdscript
## 将手牌移至弃牌堆
func discard_card(card: CardData) -> void:
    var index := hand.find(card)
    if index == -1:
        return
    hand.remove_at(index)
    discard_pile.append(card)
    card_discarded.emit(card)
    hand_changed.emit(hand)


## 将手牌移至消耗堆
func exhaust_card(card: CardData) -> void:
    var index := hand.find(card)
    if index == -1:
        return
    hand.remove_at(index)
    exhaust_pile.append(card)
    card_exhausted.emit(card)
    hand_changed.emit(hand)


## 弃掉所有手牌（回合结束时调用）
func discard_entire_hand() -> void:
    while hand.size() > 0:
        discard_card(hand[0])
```

### 3.5 查询接口

```gdscript
## 按名称查询手牌索引
func get_hand_index(card: CardData) -> int:
    return hand.find(card)

## 获取卡组统计信息（用于 UI 展示）
func get_pile_counts() -> Dictionary:
    return {
        draw = draw_pile.size(),
        hand = hand.size(),
        discard = discard_pile.size(),
        exhaust = exhaust_pile.size(),
    }
```

## 4. 能量系统实现

### 4.1 能量数据

```gdscript
# scripts/battle/energy_system.gd
extends Node

signal energy_changed(current: int, maximum: int)
signal energy_spent(amount: int)
signal energy_gained(amount: int)

var _current_energy: int = 3
var _max_energy: int = 3


func initialize(max_energy: int = 3) -> void:
    _max_energy = max_energy
    _current_energy = max_energy
    energy_changed.emit(_current_energy, _max_energy)
```

### 4.2 能量操作

```gdscript
## 回合开始时恢复能量
func refresh_energy() -> void:
    _current_energy = _max_energy
    energy_changed.emit(_current_energy, _max_energy)


## 检查是否有足够能量
func can_afford(cost: int) -> bool:
    return _current_energy >= cost


## 消耗能量（打牌时调用）
func spend_energy(amount: int) -> bool:
    if not can_afford(amount):
        return false
    _current_energy -= amount
    energy_spent.emit(amount)
    energy_changed.emit(_current_energy, _max_energy)
    return true


## 获得额外能量（卡牌效果）
func gain_energy(amount: int) -> void:
    _current_energy += amount
    energy_gained.emit(amount)
    energy_changed.emit(_current_energy, _max_energy)
```

### 4.3 与卡牌打出联动

```gdscript
# battle_manager.gd 中的卡牌打出流程
func try_play_card(card_index: int, target: Node = null) -> bool:
    var card: CardData = deck_manager.hand[card_index]
    if card == null:
        return false

    # 能量检查
    if not energy_system.can_afford(card.cost):
        return false

    # 目标合法性检查
    if not _is_valid_target(card, target):
        return false

    # 锁定状态，防止操作冲突
    _state_locked = true

    # 执行
    energy_system.spend_energy(card.cost)
    deck_manager.discard_card(card)

    # 执行卡牌效果
    await card_effect_engine.execute_effects(card.effects, target)

    _state_locked = false

    # 检查战斗结束条件
    if _check_battle_end():
        _transition_to(BattleState.BATTLE_END)

    return true
```

## 5. 战斗初始化与清理流程

### 5.1 战斗初始化

```gdscript
# battle_manager.gd

signal battle_initialized()

var player: Node           # 玩家实体节点
var enemies: Array[Node] = []  # 敌人实体节点列表


func start_battle(encounter: EncounterData) -> void:
    _transition_to(BattleState.BATTLE_START)


func _initialize_battle() -> void:
    # 1. 从 GameState 获取当前遭遇配置
    var encounter: EncounterData = GameState.current_encounter
    if encounter == null:
        push_error("BattleManager: 无遭遇数据")
        return

    # 2. 初始化卡组
    deck_manager.initialize_with_deck(GameState.current_deck)

    # 3. 初始化能量系统
    energy_system.initialize(GameState.base_energy)

    # 4. 创建敌人实体
    _spawn_enemies(encounter)

    # 5. 初始化状态管理器
    status_manager.initialize(player, enemies)

    # 6. 生成敌人初始意图
    enemy_ai.initialize(enemies)
    enemy_ai.generate_intents()

    battle_initialized.emit()


func _spawn_enemies(encounter: EncounterData) -> void:
    enemies.clear()
    for enemy_data: EnemyData in encounter.enemy_list:
        var enemy := _create_enemy_instance(enemy_data)
        enemies.append(enemy)
        enemy.spawned.emit()
```

### 5.2 战斗清理

```gdscript
func _on_battle_end() -> void:
    var result := _determine_battle_result()
    battle_ended.emit(result)

    # 清理敌人节点
    for enemy in enemies:
        enemy.queue_free()
    enemies.clear()

    # 清理卡组数据
    deck_manager.cleanup()

    # 清理状态管理器
    status_manager.cleanup()


func _determine_battle_result() -> int:
    if player_hp <= 0:
        return BattleResult.DEFEAT
    return BattleResult.VICTORY


func cleanup() -> void:
    deck_manager.cleanup()
    energy_system.cleanup()
    status_manager.cleanup()
    enemy_ai.cleanup()
```

## 6. 类图与核心接口定义

### 6.1 核心类关系图

```
┌──────────────────────────────────────────┐
│            BattleManager                 │
│  - _current_state: BattleState           │
│  - _state_locked: bool                   │
│  + start_battle(encounter)               │
│  + try_play_card(index, target) -> bool  │
│  + end_player_turn()                     │
│  + _transition_to(state)                 │
├──────────────────────────────────────────┤
│ 持有引用:                                 │
│  deck_manager: DeckManager               │
│  energy_system: EnergySystem             │
│  status_manager: StatusManager           │
│  enemy_ai: EnemyAI                       │
│  card_effect_engine: CardEffectEngine    │
└──────────────────────────────────────────┘
        │                 │
        ▼                 ▼
┌────────────────┐  ┌────────────────┐
│  DeckManager   │  │ EnergySystem   │
│  + draw_card() │  │ + spend()      │
│  + discard()   │  │ + can_afford() │
│  + shuffle()   │  │ + refresh()    │
└────────────────┘  └────────────────┘
        │
        ▼
┌────────────────┐  ┌────────────────┐  ┌────────────────┐
│  CardEffect    │  │  EnemyAI       │  │ StatusManager  │
│  Engine        │  │                │  │                │
│  + execute()   │  │ + gen_intent() │  │ + apply()      │
│  + resolve()   │  │ + execute()    │  │ + trigger()    │
└────────────────┘  └────────────────┘  └────────────────┘
```

### 6.2 实体接口

玩家和敌人共享一个 `BattleEntity` 接口，便于统一管理。

```gdscript
# scripts/battle/battle_entity.gd
extends Node
class_name BattleEntity

signal hp_changed(current: int, maximum: int)
signal block_changed(new_block: int)
signal entity_died(entity: BattleEntity)

@export var max_hp: int = 50
var current_hp: int = 50
var block: int = 0
var is_player: bool = false


func take_damage(amount: int) -> int:
    # 格挡吸收
    var actual_damage := amount
    if block > 0:
        var absorbed := mini(block, amount)
        block -= absorbed
        actual_damage -= absorbed
        block_changed.emit(block)

    current_hp -= actual_damage
    current_hp = maxi(current_hp, 0)
    hp_changed.emit(current_hp, max_hp)

    if current_hp <= 0:
        entity_died.emit(self)

    return actual_damage


func gain_block(amount: int) -> void:
    block += amount
    block_changed.emit(block)


func heal(amount: int) -> void:
    current_hp = mini(current_hp + amount, max_hp)
    hp_changed.emit(current_hp, max_hp)


func reset_block() -> void:
    block = 0
    block_changed.emit(block)
```

### 6.3 战斗结果枚举

```gdscript
# scripts/battle/battle_result.gd
class_name BattleResult

const VICTORY: int = 0
const DEFEAT: int = 1
const FLED: int = 2  # 可选：逃跑
```

### 6.4 BattleManager 公开接口汇总

```gdscript
# BattleManager 对外暴露的完整接口
func start_battle(encounter: EncounterData) -> void              # 开始战斗
func try_play_card(card_index: int, target: Node) -> bool        # 打出卡牌
func end_player_turn() -> void                                    # 结束玩家回合
func get_current_state() -> BattleState                           # 获取当前状态
func is_player_turn() -> bool                                     # 是否玩家回合
func get_player() -> BattleEntity                                 # 获取玩家实体
func get_enemies() -> Array[BattleEntity]                         # 获取敌人列表
func get_deck_manager() -> DeckManager                            # 获取卡组管理器
func get_energy_system() -> EnergySystem                          # 获取能量系统
```
