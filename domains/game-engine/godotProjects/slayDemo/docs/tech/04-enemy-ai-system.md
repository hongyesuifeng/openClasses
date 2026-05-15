# 04 - 敌人 AI 系统技术方案

## 1. EnemyData 的 Resource 结构设计

### 1.1 EnemyData 定义

```gdscript
# scripts/enemies/enemy_data.gd
extends Resource
class_name EnemyData

@export_group("基础信息")
@export var id: StringName = &""                  # 唯一标识 "jaw_worm"
@export var enemy_name: String = ""               # 显示名称 "颚虫"
@export var enemy_art: Texture2D                  # 敌人图片
@export var is_boss: bool = false                 # 是否 Boss

@export_group("生命值")
@export var min_hp: int = 40                      # 最小HP（随机范围内）
@export var max_hp: int = 44                      # 最大HP

@export_group("行为模式")
@export var behavior_type: BehaviorType = BehaviorType.WEIGHTED_POOL
@export var action_list: Array[EnemyActionData] = []  # 所有可用行动
@export var action_sequence: Array[int] = []      # 固定序列模式的行动索引（可选）

@export_group("Boss 专属")
@export var boss_phase_data: Array[BossPhaseData] = []  # Boss 阶段数据
@export var phase_change_hp_thresholds: Array[float] = []  # 触发阶段变化的 HP 百分比
```

### 1.2 行为类型枚举

```gdscript
enum BehaviorType {
    FIXED_SEQUENCE,    # 固定序列（按索引循环）
    WEIGHTED_POOL,     # 权重池（随机抽取，带限制）
    CONDITIONAL,       # 条件分支（根据 HP/回合数选择）
    BOSS_PHASED,       # Boss 分阶段（不同阶段不同行为池）
}
```

### 1.3 EnemyActionData 定义

```gdscript
# scripts/enemies/enemy_action_data.gd
extends Resource
class_name EnemyActionData

@export var action_name: String = ""               # 行动名称 "撕咬"
@export var intent_type: IntentType = IntentType.ATTACK
@export var intent_value: int = 0                  # 意图显示数值（伤害/格挡等）
@export var effects: Array[EffectAction] = []      # 效果列表（复用卡牌效果系统）
@export var weight: int = 30                       # 权重（仅权重池模式）
@export var max_uses_per_turn: int = 99            # 每回合最多使用次数
@export var min_turn: int = 0                      # 最早出现的回合数
@export var cooldown: int = 0                      # 冷却回合数
@export var condition: ActionCondition = null       # 触发条件（可选）
```

### 1.4 IntentType 枚举

```gdscript
# scripts/enemies/intent.gd
enum IntentType {
    ATTACK,            # 攻击意图（显示剑图标 + 伤害数字）
    ATTACK_BUFF,       # 攻击 + 自身增益
    ATTACK_DEBUFF,     # 攻击 + 施加debuff
    ATTACK_DEFEND,     # 攻击 + 防御
    DEFEND,            # 防御意图（显示盾图标 + 格挡数字）
    DEFEND_BUFF,       # 防御 + 增益
    BUFF,              # 增益意图（显示增益图标）
    DEBUFF,            # 减益意图（显示减益图标）
    STRONG_DEBUFF,     # 强力减益（高亮显示）
    UNKNOWN,           # 未知意图（问号，Boss 特殊行为）
    MAGIC,             # 魔法意图（特殊效果）
    SLEEP,             # 沉睡状态
    STUN,              # 眩晕状态（无行动）
    ESCAPE,            # 逃跑
}
```

## 2. 意图系统实现

### 2.1 Intent 数据结构

```gdscript
# scripts/enemies/intent.gd
extends RefCounted
class_name Intent

var intent_type: IntentType = IntentType.ATTACK
var value: int = 0                    # 主数值（伤害/格挡）
var secondary_value: int = 0          # 次要数值
var effects: Array[EffectAction] = [] # 对应的行动效果
var action_name: String = ""          # 行动名
var target_is_player: bool = true     # 目标是否为玩家


static func from_action(action: EnemyActionData, damage_modifier: int = 0) -> Intent:
    var intent := Intent.new()
    intent.intent_type = action.intent_type
    intent.value = action.intent_value + damage_modifier
    intent.effects = action.effects
    intent.action_name = action.action_name
    return intent


func get_icon_name() -> String:
    match intent_type:
        IntentType.ATTACK, IntentType.ATTACK_BUFF, IntentType.ATTACK_DEBUFF, IntentType.ATTACK_DEFEND:
            return "sword"
        IntentType.DEFEND, IntentType.DEFEND_BUFF:
            return "shield"
        IntentType.BUFF:
            return "buff"
        IntentType.DEBUFF, IntentType.STRONG_DEBUFF:
            return "debuff"
        IntentType.UNKNOWN:
            return "question_mark"
        IntentType.SLEEP:
            return "sleep"
        IntentType.STUN:
            return "stun"
        _:
            return "unknown"
```

### 2.2 敌人实体

```gdscript
# scripts/enemies/enemy_entity.gd
extends BattleEntity
class_name EnemyEntity

signal intent_changed(intent: Intent)
signal action_executed(action_name: String)

var enemy_data: EnemyData
var current_intent: Intent
var action_history: Array[int] = []  # 已执行的行动索引记录
var _action_cooldowns: Dictionary = {}  # action_index -> 剩余冷却回合
var _turns_uses: Dictionary = {}       # action_index -> 本回合已用次数


func initialize(data: EnemyData) -> void:
    enemy_data = data
    is_player = false

    # 随机 HP
    max_hp = randi_range(data.min_hp, data.max_hp)
    current_hp = max_hp


## 生成下一回合的意图
func generate_intent() -> void:
    var action: EnemyActionData = _select_action()
    if action == null:
        # 默认攻击
        current_intent = Intent.new()
        current_intent.intent_type = IntentType.ATTACK
        current_intent.value = 5
        current_intent.action_name = "普通攻击"
    else:
        var damage_mod := _get_damage_modifier()
        current_intent = Intent.from_action(action, damage_mod)

    intent_changed.emit(current_intent)


## 执行当前意图
func execute_intent() -> void:
    if current_intent == null:
        return

    for effect: EffectAction in current_intent.effects:
        var target := _resolve_target(effect)
        await BattleManager.card_effect_engine._apply_effect(effect, null, target)

    # 记录到历史
    action_executed.emit(current_intent.action_name)


## 回合开始时更新冷却
func on_turn_start() -> void:
    _turns_uses.clear()
    var keys := _action_cooldowns.keys()
    for key in keys:
        _action_cooldowns[key] = _action_cooldowns[key] - 1
        if _action_cooldowns[key] <= 0:
            _action_cooldowns.erase(key)
```

## 3. 行动执行引擎

### 3.1 行动选择算法

```gdscript
func _select_action() -> EnemyActionData:
    match enemy_data.behavior_type:
        BehaviorType.FIXED_SEQUENCE:
            return _select_from_sequence()
        BehaviorType.WEIGHTED_POOL:
            return _select_from_weighted_pool()
        BehaviorType.CONDITIONAL:
            return _select_conditional()
        BehaviorType.BOSS_PHASED:
            return _select_boss_phase()
        _:
            return _select_from_weighted_pool()


func _select_from_sequence() -> EnemyActionData:
    if enemy_data.action_sequence.is_empty():
        if enemy_data.action_list.is_empty():
            return null
        return enemy_data.action_list[0]

    var index_in_sequence := action_history.size() % enemy_data.action_sequence.size()
    var action_index := enemy_data.action_sequence[index_in_sequence]

    if action_index < enemy_data.action_list.size():
        return enemy_data.action_list[action_index]
    return null


func _select_from_weighted_pool() -> EnemyActionData:
    # 过滤可用行动
    var available: Array[EnemyActionData] = []
    var weights: Array[int] = []

    for i in range(enemy_data.action_list.size()):
        var action: EnemyActionData = enemy_data.action_list[i]

        # 检查冷却
        if _action_cooldowns.has(i) and _action_cooldowns[i] > 0:
            continue

        # 检查每回合使用次数
        if _turns_uses.get(i, 0) >= action.max_uses_per_turn:
            continue

        # 检查最早回合
        var current_turn := BattleManager.turn_manager.current_turn
        if current_turn < action.min_turn:
            continue

        # 检查条件
        if action.condition and not _evaluate_condition(action.condition):
            continue

        available.append(action)
        weights.append(action.weight)

    if available.is_empty():
        # 降级：返回第一个行动
        return enemy_data.action_list[0] if not enemy_data.action_list.is_empty() else null

    # 加权随机选择
    var total_weight := 0
    for w in weights:
        total_weight += w

    var roll := randi() % total_weight
    var cumulative := 0
    for i in range(available.size()):
        cumulative += weights[i]
        if roll < cumulative:
            # 记录使用
            var action_index := enemy_data.action_list.find(available[i])
            _turns_uses[action_index] = _turns_uses.get(action_index, 0) + 1
            if available[i].cooldown > 0:
                _action_cooldowns[action_index] = available[i].cooldown
            action_history.append(action_index)
            return available[i]

    return available[-1]
```

### 3.2 条件评估

```gdscript
# scripts/enemies/action_condition.gd
extends Resource
class_name ActionCondition

enum ConditionType {
    HP_BELOW_PERCENT,      # HP 低于百分比
    HP_ABOVE_PERCENT,      # HP 高于百分比
    TURN_ABOVE,            # 回合数大于
    TURN_BELOW,            # 回合数小于
    STATUS_ACTIVE,         # 指定状态激活
    STATUS_NOT_ACTIVE,     # 指定状态未激活
    BLOCK_ABOVE,           # 格挡大于
    LAST_ACTION_WAS,       # 上次行动是指定行动
    LAST_ACTION_NOT,       # 上次行动不是指定行动
}

@export var condition_type: ConditionType
@export var threshold: float = 0.0
@export var status_id: StringName = &""
@export var action_index: int = -1


func evaluate(entity: EnemyEntity) -> bool:
    match condition_type:
        ConditionType.HP_BELOW_PERCENT:
            return float(entity.current_hp) / float(entity.max_hp) < threshold
        ConditionType.HP_ABOVE_PERCENT:
            return float(entity.current_hp) / float(entity.max_hp) > threshold
        ConditionType.TURN_ABOVE:
            return BattleManager.turn_manager.current_turn > int(threshold)
        ConditionType.TURN_BELOW:
            return BattleManager.turn_manager.current_turn < int(threshold)
        ConditionType.LAST_ACTION_WAS:
            if entity.action_history.is_empty():
                return false
            return entity.action_history[-1] == action_index
        ConditionType.LAST_ACTION_NOT:
            if entity.action_history.is_empty():
                return true
            return entity.action_history[-1] != action_index
        _:
            return true
```

### 3.3 伤害修正计算

```gdscript
func _get_damage_modifier() -> int:
    var modifier := 0
    # 力量加成
    var strength := BattleManager.status_manager.get_status_stacks(self, &"strength")
    modifier += strength
    return modifier


func _resolve_target(effect: EffectAction) -> Node:
    match effect.target_override:
        TargetType.SELF:
            return self
        TargetType.ALL_ENEMIES:
            return BattleManager.get_player()  # 敌人的 "所有敌人" = 玩家
        _:
            return BattleManager.get_player()
```

## 4. 行为模式设计

### 4.1 固定序列模式

适用于行为可预测的简单敌人。

```
示例：Green Slime
行动序列: [0, 1, 0, 2]  (索引循环)

action_list[0] = "黏液攻击" (ATTACK, 5)
action_list[1] = "准备" (DEFEND, 4)
action_list[2] = "强力黏液" (ATTACK, 8)

回合1: 黏液攻击 → 回合2: 准备 → 回合3: 黏液攻击 → 回合4: 强力黏液
回合5: 黏液攻击 → ... (循环)
```

### 4.2 权重池模式

最常用的模式，行为有随机性但受约束。

```
示例：Jaw Worm

action_list:
  [0] "撕咬"     weight=30  ATTACK  11
  [1] "长嚎"     weight=30  BUFF    (str+3, block=6)
  [2] "猛击"     weight=20  ATTACK  18, cooldown=2
  [3] "嘲讽"     weight=10  DEFEND  8, min_turn=3

权重总和=90, 每回合随机抽取
"猛击"有2回合冷却，不会连续出现
"嘲讽"第3回合才可能出现
```

### 4.3 条件分支模式

```gdscript
func _select_conditional() -> EnemyActionData:
    var hp_ratio := float(current_hp) / float(max_hp)

    if hp_ratio < 0.3:
        # 低血量：优先防御
        return _find_action_by_name("紧急防御")
    elif hp_ratio < 0.6:
        # 中等血量：混合攻击
        return _select_from_weighted_pool()
    else:
        # 满血：积极攻击
        return _find_action_by_name("猛烈攻击")
```

## 5. Boss 特殊行为实现

### 5.1 BossPhaseData

```gdscript
# scripts/enemies/boss_phase_data.gd
extends Resource
class_name BossPhaseData

@export var phase_name: String = "Phase 1"
@export var hp_threshold: float = 0.5              # 触发阈值（HP百分比）
@export var phase_actions: Array[EnemyActionData] = []  # 该阶段的行动池
@export var phase_behavior_type: BehaviorType = BehaviorType.WEIGHTED_POOL
@export var on_phase_enter_effects: Array[EffectAction] = []  # 进入阶段时的效果
```

### 5.2 Boss 阶段切换

```gdscript
# enemy_entity.gd 中 Boss 专属逻辑

var current_phase: int = 0


func _select_boss_phase() -> EnemyActionData:
    _update_phase()
    var phase: BossPhaseData = enemy_data.boss_phase_data[current_phase]

    # 使用当前阶段的行为类型和行动池
    match phase.phase_behavior_type:
        BehaviorType.WEIGHTED_POOL:
            return _select_from_phase_pool(phase.phase_actions)
        BehaviorType.FIXED_SEQUENCE:
            return _select_from_phase_sequence(phase.phase_actions)
        _:
            if phase.phase_actions.is_empty():
                return null
            return phase.phase_actions[0]


func _update_phase() -> void:
    var hp_ratio := float(current_hp) / float(max_hp)

    for i in range(enemy_data.boss_phase_data.size() - 1, -1, -1):
        var phase: BossPhaseData = enemy_data.boss_phase_data[i]
        if hp_ratio <= phase.hp_threshold and i > current_phase:
            _enter_phase(i)
            break


func _enter_phase(phase_index: int) -> void:
    current_phase = phase_index
    var phase: BossPhaseData = enemy_data.boss_phase_data[phase_index]

    # 清除历史记录（新阶段重新开始）
    action_history.clear()
    _action_cooldowns.clear()
    _turns_uses.clear()

    # 执行阶段进入效果
    for effect: EffectAction in phase.on_phase_enter_effects:
        await BattleManager.card_effect_engine._apply_effect(effect, null, self)

    print("[Boss] 进入阶段: %s" % phase.phase_name)
```

### 5.3 Boss 示例

```
示例 Boss：双阶段设计

Phase 1 (HP > 50%):
  "重击"    weight=40  ATTACK 20
  "蓄力"    weight=30  BUFF (str+2)
  "防御姿态" weight=30  DEFEND 15

Phase 2 (HP <= 50%):
  触发效果: 施加 2 层易伤给玩家
  "狂暴重击"  weight=35  ATTACK 30
  "横扫"      weight=30  AOE_ATTACK 15
  "咆哮"      weight=35  DEBUFF (vulnerable+2)
```

## 6. AI 与战斗状态机的交互

### 6.1 交互时序

```
BattleManager 状态转换与 AI 的关系:

PLAYER_TURN 结束
  │
  ├── TurnManager.end_current_turn()
  │     ├── status_manager.on_turn_end(player)
  │     └── deck_manager.discard_entire_hand()
  │
  ▼
BattleManager._transition_to(ENEMY_TURN)
  │
  ├── turn_manager._start_enemy_turn()
  │     ├── status_manager.on_turn_start(enemies)
  │     │
  │     ├── 对每个敌人:
  │     │     enemy.execute_intent()    ← 执行上回合生成的意图
  │     │     ├── 执行效果
  │     │     └── 检查战斗结束
  │     │
  │     └── 对每个存活敌人:
  │           enemy.generate_intent()   ← 生成下回合意图
  │
  ▼
BattleManager._transition_to(PLAYER_TURN)
  │
  ├── turn_manager._start_player_turn()
  │     ├── status_manager.on_turn_start(player)
  │     ├── energy_system.refresh_energy()
  │     └── deck_manager.draw_cards(5)
```

### 6.2 EnemyAI 管理器

```gdscript
# scripts/battle/enemy_ai.gd
extends Node

signal intents_generated(intents: Dictionary)  # {enemy: Intent}
signal all_intents_executed()

var _enemies: Array[EnemyEntity] = []


func initialize(enemies: Array[Node]) -> void:
    _enemies.clear()
    for e in enemies:
        var entity: EnemyEntity = e as EnemyEntity
        if entity:
            _enemies.append(entity)


## 为所有敌人生成意图（战斗开始时和每回合结束时调用）
func generate_intents() -> void:
    var intents: Dictionary = {}
    for enemy: EnemyEntity in _enemies:
        if enemy.current_hp > 0:
            enemy.generate_intent()
            intents[enemy] = enemy.current_intent
    intents_generated.emit(intents)


## 执行所有敌人意图（敌人回合调用）
func execute_intents() -> void:
    for enemy: EnemyEntity in _enemies:
        if enemy.current_hp <= 0:
            continue

        await enemy.execute_intent()

        # 每个敌人行动后检查战斗结束
        if BattleManager.get_player().current_hp <= 0:
            BattleManager._transition_to(BattleState.BATTLE_END)
            return

    all_intents_executed.emit()


## 移除已死亡的敌人
func remove_dead_enemy(enemy: EnemyEntity) -> void:
    _enemies.erase(enemy)


func cleanup() -> void:
    _enemies.clear()
```

### 6.3 多敌人行动顺序

敌人按从左到右的顺序执行。如果一个敌人在行动过程中被击杀（如被反伤状态击杀），则跳过后续行动。

```gdscript
func execute_intents() -> void:
    var alive_enemies := _enemies.duplicate()
    for enemy: EnemyEntity in alive_enemies:
        if enemy.current_hp <= 0:
            continue

        await enemy.execute_intent()

        # 检查玩家是否已死亡
        if BattleManager.get_player().current_hp <= 0:
            return  # 战斗结束

    all_intents_executed.emit()
```
