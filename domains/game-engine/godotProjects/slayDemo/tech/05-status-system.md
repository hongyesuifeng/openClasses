# 05 - 状态效果系统技术方案

## 1. StatusData 的 Resource 结构设计

### 1.1 StatusData 定义

```gdscript
# scripts/systems/status_data.gd
extends Resource
class_name StatusData

@export var id: StringName = &""                  # 唯一标识 "vulnerable"
@export var status_name: String = ""              # 显示名称 "易伤"
@export var description: String = ""              # 效果描述
@export var icon: Texture2D                       # 状态图标
@export var is_debuff: bool = false               # 是否为负面效果
@export var is_buff: bool = false                 # 是否为正面效果
@export var stack_type: StackType = StackType.DURATION
@export var max_stacks: int = 99                  # 最大叠加层数
@export var decay_type: DecayType = DecayType.DECREASE_BY_ONE
@export var trigger_timing: TriggerTiming = TriggerTiming.NONE
@export var color: Color = Color.WHITE            # 显示颜色（正面绿/负面红）
```

### 1.2 叠加类型枚举

```gdscript
enum StackType {
    DURATION,      # 持续回合数（如易伤：2层=持续2回合，每回合-1）
    INTENSITY,     # 强度叠加（如力量：3层=+3伤害，不自动消退）
    COUNTER,       # 计数器（如护体：受到X次攻击后触发）
}
```

### 1.3 消退类型枚举

```gdscript
enum DecayType {
    NONE,                  # 不消退（如力量）
    DECREASE_BY_ONE,       # 每回合-1（如易伤）
    RESET_TO_ZERO,         # 回合结束时归零（如格挡）
    DECREASE_BY_HALF,      # 每回合减半（特殊效果）
}
```

### 1.4 触发时机枚举

```gdscript
enum TriggerTiming {
    NONE,                  # 被动效果，无主动触发
    ON_TURN_START,         # 回合开始
    ON_TURN_END,           # 回合结束
    ON_DAMAGE_TAKEN,       # 受到伤害时
    ON_DAMAGE_DEALT,       # 造成伤害时
    ON_ATTACK_PLAYED,      # 打出攻击牌时
    ON_CARD_PLAYED,        # 打出任意牌时
    ON_CARD_DRAWN,         # 抽牌时
    ON_BLOCK_GAINED,       # 获得格挡时
    ON_ENTITY_DEATH,       # 实体死亡时
}
```

## 2. 状态管理器设计

### 2.1 StatusManager 结构

```gdscript
# scripts/systems/status_manager.gd
extends Node

signal status_applied(entity: BattleEntity, status_id: StringName, stacks: int)
signal status_removed(entity: BattleEntity, status_id: StringName)
signal status_changed(entity: BattleEntity, status_id: StringName, new_stacks: int)

# 存储结构：entity -> status_id -> StatusInstance
var _status_map: Dictionary = {}  # Dictionary[NodePath, Dictionary[StringName, StatusInstance]]
var _status_database: Dictionary = {}  # StringName -> StatusData（缓存）
```

### 2.2 StatusInstance 运行时结构

```gdscript
# scripts/systems/status_instance.gd
extends RefCounted
class_name StatusInstance

var status_id: StringName
var data: StatusData         # 引用静态数据
var stacks: int = 0
var source_entity: Node     # 施加来源（可选，用于溯源）
var applied_turn: int = 0   # 施加时的回合数


func _init(id: StringName, data: StatusData, initial_stacks: int, source: Node = null) -> void:
    status_id = id
    self.data = data
    stacks = initial_stacks
    source_entity = source
    applied_turn = BattleManager.turn_manager.current_turn if BattleManager.turn_manager else 0
```

### 2.3 初始化与数据加载

```gdscript
func initialize(player: BattleEntity, enemies: Array[BattleEntity]) -> void:
    _status_map.clear()
    _load_status_database()


func _load_status_database() -> void:
    _status_database.clear()
    var status_dir := "res://resources/statuses/"
    var dir := DirAccess.open(status_dir)
    if dir:
        dir.list_dir_begin()
        var file_name := dir.get_next()
        while file_name != "":
            if file_name.ends_with(".tres"):
                var status: StatusData = load(status_dir + file_name) as StatusData
                if status:
                    _status_database[status.id] = status
            file_name = dir.get_next()
        dir.list_dir_end()
```

## 3. 状态操作接口

### 3.1 施加状态

```gdscript
## 对目标施加状态效果
func apply_status(target: BattleEntity, status_id: StringName, stacks: int, source: Node = null) -> void:
    if stacks <= 0:
        return

    var status_data: StatusData = _status_database.get(status_id) as StatusData
    if status_data == null:
        push_warning("StatusManager: 未找到状态数据 '%s'" % status_id)
        return

    # 确保目标有条目
    if not _status_map.has(target):
        _status_map[target] = {}

    var entity_statuses: Dictionary = _status_map[target]

    if entity_statuses.has(status_id):
        # 已有同类状态：叠加
        var existing: StatusInstance = entity_statuses[status_id]
        existing.stacks = mini(existing.stacks + stacks, status_data.max_stacks)
        status_changed.emit(target, status_id, existing.stacks)
    else:
        # 新状态
        var instance := StatusInstance.new(status_id, status_data, stacks, source)
        entity_statuses[status_id] = instance
        status_applied.emit(target, status_id, stacks)

    # 触发 ON_STATUS_APPLIED 时机
    _on_status_just_applied(target, status_id, stacks)
```

### 3.2 移除状态

```gdscript
## 完全移除一个状态
func remove_status(target: BattleEntity, status_id: StringName) -> void:
    if not _status_map.has(target):
        return
    var entity_statuses: Dictionary = _status_map[target]
    if entity_statuses.erase(status_id):
        status_removed.emit(target, status_id)


## 减少状态层数
func decrease_stacks(target: BattleEntity, status_id: StringName, amount: int) -> void:
    if not _has_status(target, status_id):
        return

    var instance: StatusInstance = _get_instance(target, status_id)
    instance.stacks -= amount

    if instance.stacks <= 0:
        remove_status(target, status_id)
    else:
        status_changed.emit(target, status_id, instance.stacks)


## 移除目标的所有状态
func remove_all_statuses(target: BattleEntity) -> void:
    if _status_map.has(target):
        var entity_statuses: Dictionary = _status_map[target]
        for status_id in entity_statuses.keys():
            status_removed.emit(target, status_id)
        _status_map.erase(target)
```

### 3.3 查询接口

```gdscript
## 查询状态层数
func get_status_stacks(target: BattleEntity, status_id: StringName) -> int:
    var instance: StatusInstance = _get_instance(target, status_id)
    return instance.stacks if instance else 0


## 是否有某状态
func _has_status(target: BattleEntity, status_id: StringName) -> bool:
    if not _status_map.has(target):
        return false
    return _status_map[target].has(status_id)


## 获取目标所有状态
func get_all_statuses(target: BattleEntity) -> Dictionary:
    return _status_map.get(target, {})


## 获取状态实例
func _get_instance(target: BattleEntity, status_id: StringName) -> StatusInstance:
    if not _status_map.has(target):
        return null
    return _status_map[target].get(status_id)
```

## 4. 触发时机调度

### 4.1 回合开始调度

```gdscript
## 回合开始时调用
func on_turn_start(is_player_entity: bool) -> void:
    var entities := _get_entities_by_side(is_player_entity)

    for entity: BattleEntity in entities:
        if entity.current_hp <= 0:
            continue

        var statuses := get_all_statuses(entity).duplicate()  # 复制key避免迭代中修改
        for status_id: StringName in statuses:
            var instance: StatusInstance = statuses[status_id]
            if instance.data.trigger_timing == TriggerTiming.ON_TURN_START:
                _execute_status_effect(entity, instance)
```

### 4.2 回合结束调度（含消退）

```gdscript
## 回合结束时调用
func on_turn_end(is_player_entity: bool) -> void:
    var entities := _get_entities_by_side(is_player_entity)

    for entity: BattleEntity in entities:
        if entity.current_hp <= 0:
            continue

        var statuses := get_all_statuses(entity).duplicate()
        for status_id: StringName in statuses:
            var instance: StatusInstance = statuses[status_id]

            # 触发回合结束效果
            if instance.data.trigger_timing == TriggerTiming.ON_TURN_END:
                _execute_status_effect(entity, instance)

            # 状态消退
            _decay_status(entity, status_id, instance)


## 状态消退处理
func _decay_status(entity: BattleEntity, status_id: StringName, instance: StatusInstance) -> void:
    match instance.data.decay_type:
        DecayType.NONE:
            pass  # 不消退
        DecayType.DECREASE_BY_ONE:
            decrease_stacks(entity, status_id, 1)
        DecayType.RESET_TO_ZERO:
            remove_status(entity, status_id)
        DecayType.DECCREASE_BY_HALF:
            var new_stacks := instance.stacks / 2
            if new_stacks <= 0:
                remove_status(entity, status_id)
            else:
                instance.stacks = new_stacks
                status_changed.emit(entity, status_id, new_stacks)
```

### 4.3 事件触发调度

```gdscript
## 受到伤害时触发
func on_damage_taken(entity: BattleEntity, amount: int) -> void:
    var statuses := get_all_statuses(entity).duplicate()
    for status_id: StringName in statuses:
        var instance: StatusInstance = statuses[status_id]
        if instance.data.trigger_timing == TriggerTiming.ON_DAMAGE_TAKEN:
            _execute_status_effect(entity, instance, amount)


## 造成伤害时触发
func on_damage_dealt(entity: BattleEntity, target: BattleEntity, amount: int) -> void:
    var statuses := get_all_statuses(entity).duplicate()
    for status_id: StringName in statuses:
        var instance: StatusInstance = statuses[status_id]
        if instance.data.trigger_timing == TriggerTiming.ON_DAMAGE_DEALT:
            _execute_status_effect(entity, instance, amount)


## 打出卡牌时触发
func on_card_played(entity: BattleEntity, card: CardData) -> void:
    var statuses := get_all_statuses(entity).duplicate()
    for status_id: StringName in statuses:
        var instance: StatusInstance = statuses[status_id]
        match instance.data.trigger_timing:
            TriggerTiming.ON_CARD_PLAYED:
                _execute_status_effect(entity, instance)
            TriggerTiming.ON_ATTACK_PLAYED:
                if card.card_type == CardType.ATTACK:
                    _execute_status_effect(entity, instance)
```

### 4.4 辅助方法

```gdscript
## 获取指定阵营的所有实体
func _get_entities_by_side(is_player: bool) -> Array[BattleEntity]:
    var result: Array[BattleEntity] = []
    if is_player:
        result.append(BattleManager.get_player())
    else:
        result.append_array(BattleManager.get_enemies())
    return result
```

## 5. 状态效果执行

### 5.1 效果执行分发

```gdscript
## 执行状态效果
func _execute_status_effect(entity: BattleEntity, instance: StatusInstance, context_value: int = 0) -> void:
    var status_id: StringName = instance.status_id

    match status_id:
        # === 核心状态效果 ===
        &"vulnerable":
            pass  # 易伤是被动效果，在伤害计算中处理
        &"weak":
            pass  # 虚弱是被动效果，在伤害计算中处理
        &"strength":
            pass  # 力量是被动效果，在伤害计算中处理
        &"dexterity":
            pass  # 敏捷是被动效果，在格挡计算中处理

        # === 回合触发型状态 ===
        &"poison":
            # 毒素：回合开始时造成等同于层数的伤害，层数-1
            entity.take_damage(instance.stacks)
            decrease_stacks(entity, status_id, 1)

        &"regeneration":
            # 回复：回合开始时回复等同于层数的HP，层数-1
            entity.heal(instance.stacks)
            decrease_stacks(entity, status_id, 1)

        &"metallicize":
            # 金属化：回合结束获得N点格挡
            entity.gain_block(instance.stacks)

        &"plated_armor":
            # 铁甲：回合结束获得N点格挡，受到攻击伤害时层数-1
            entity.gain_block(instance.stacks)

        &"thorns":
            # 荆棘：受到攻击时对攻击者造成N点伤害
            if context_value > 0:
                # context_value 是攻击者的引用，需要从外部传入
                pass

        &"ritual":
            # 仪式：回合开始获得N点力量
            apply_status(entity, &"strength", instance.stacks)

        &"barricade":
            # 壁垒：格挡不在回合结束时消失（被动标记）

        &"draw_card_status":
            # 回合开始额外抽牌
            BattleManager.deck_manager.draw_cards(instance.stacks)

        _:
            push_warning("StatusManager: 未定义状态效果 '%s'" % status_id)
```

### 5.2 被动状态查询

被动状态不主动触发，而是在伤害/格挡计算时查询。

```gdscript
## 获取伤害修正值（最终伤害 = base + strength修正，再乘以 vulnerable/weak 系数）
func get_damage_modifier(source: BattleEntity, target: BattleEntity) -> float:
    var multiplier := 1.0

    # 攻击方有力量：在 CardEffectEngine 中以加算处理
    # 防守方有易伤：乘 1.5
    if get_status_stacks(target, &"vulnerable") > 0:
        multiplier *= 1.5

    # 攻击方有虚弱：乘 0.75
    if get_status_stacks(source, &"weak") > 0:
        multiplier *= 0.75

    return multiplier


## 获取格挡修正值
func get_block_modifier(source: BattleEntity) -> int:
    var bonus := 0
    # 敏捷加成
    bonus += get_status_stacks(source, &"dexterity")
    return bonus


## 获取修正后的抽牌数
func get_modified_draw_count(base_count: int) -> int:
    var count := base_count
    # 可以根据状态增加抽牌数
    return count
```

## 6. 状态间交互规则

### 6.1 交互规则表

```
状态A          状态B          交互规则
─────────────────────────────────────────────────────
易伤(vulnerable) + 力量(strength)  → 独立计算：伤害+力量，再x1.5
虚弱(weak)      + 易伤(vulnerable) → 独立计算：先x1.5（易伤），再x0.75（虚弱）
力量(strength)  + 敏捷(dexterity)  → 完全独立：力量影响伤害，敏捷影响格挡
荆棘(thorns)    + 反伤             → 触发时先计算荆棘伤害
铁甲(plated)    + 受到攻击         → 受到未格挡攻击时层数-1
毒素(poison)    + 壁垒(barricade)  → 独立生效
```

### 6.2 结算优先级

状态效果的结算按以下优先级顺序：

```
1. 回合开始触发（按施加先后顺序）
   a. ritual（仪式力量）
   b. draw_card_status（额外抽牌）
   c. poison（毒素伤害）

2. 伤害计算修正（查询式，不触发）
   a. strength（力量加减）
   b. vulnerable（易伤乘算）
   c. weak（虚弱乘算）

3. 格挡计算修正（查询式，不触发）
   a. dexterity（敏捷加减）

4. 受伤触发
   a. thorns（荆棘反击）
   b. plated_armor（铁甲衰减）

5. 回合结束触发
   a. metallicize（金属化格挡）
   b. 状态消退（decay）
```

### 6.3 互斥与覆盖规则

```gdscript
## 状态叠加时的互斥检查
func apply_status(target: BattleEntity, status_id: StringName, stacks: int, source: Node = null) -> void:
    # 互斥规则示例：
    # 1. 同一状态叠加到上限
    # 2. 对立状态：某些buff和debuff不互斥（如同时有力量和虚弱）

    # 标准叠加逻辑
    if _has_status(target, status_id):
        var existing: StatusInstance = _get_instance(target, status_id)
        var max_s: int = existing.data.max_stacks
        existing.stacks = mini(existing.stacks + stacks, max_s)
        status_changed.emit(target, status_id, existing.stacks)
    else:
        # 新建实例...
        pass
```

## 7. 最小原型状态清单

Demo 阶段需要实现的状态效果：

### 7.1 核心 Buff

| ID | 名称 | 类型 | 叠加方式 | 消退 | 效果 |
|----|------|------|----------|------|------|
| `strength` | 力量 | Buff | 强度叠加 | 不消退 | 伤害+N |
| `dexterity` | 敏捷 | Buff | 强度叠加 | 不消退 | 格挡+N |
| `barricade` | 壁垒 | Buff | 不叠加 | 不消退 | 格挡不清零 |

### 7.2 核心 Debuff

| ID | 名称 | 类型 | 叠加方式 | 消退 | 效果 |
|----|------|------|----------|------|------|
| `vulnerable` | 易伤 | Debuff | 持续回合 | -1/回合 | 受到伤害x1.5 |
| `weak` | 虚弱 | Debuff | 持续回合 | -1/回合 | 造成伤害x0.75 |
| `poison` | 毒素 | Debuff | 持续回合 | -1/回合 | 回合开始受到N点伤害 |

### 7.3 扩展状态（可选）

| ID | 名称 | 类型 | 叠加方式 | 效果 |
|----|------|------|----------|------|
| `thorns` | 荆棘 | Buff | 强度叠加 | 受到攻击时对攻击者造成N伤害 |
| `metallicize` | 金属化 | Buff | 强度叠加 | 回合结束获得N格挡 |
| `plated_armor` | 铁甲 | Buff | 强度叠加 | 回合结束获得N格挡，受伤时-1 |
| `ritual` | 仪式 | Buff | 强度叠加 | 回合开始获得N力量 |
| `regeneration` | 回复 | Buff | 持续回合 | 回合开始回复N HP |

## 8. 性能考虑

### 8.1 状态查询优化

状态修正查询（力量/易伤/虚弱）在每次伤害计算时调用，需要高效。

```gdscript
# 使用 Dictionary 查询，O(1) 复杂度
func get_status_stacks(target: BattleEntity, status_id: StringName) -> int:
    # Dictionary[entity][status_id] 直接查找
    if not _status_map.has(target):
        return 0
    var entity_map: Dictionary = _status_map[target]
    if not entity_map.has(status_id):
        return 0
    return entity_map[status_id].stacks
```

### 8.2 批量消退优化

回合结束时的状态消退采用批量处理，先收集所有待消退的状态，再统一处理，避免迭代中修改集合。

```gdscript
func _process_decay_batch(entity: BattleEntity) -> void:
    var to_decay: Array[Dictionary] = []

    var statuses := get_all_statuses(entity)
    for status_id: StringName in statuses:
        var instance: StatusInstance = statuses[status_id]
        if instance.data.decay_type != DecayType.NONE:
            to_decay.append({"id": status_id, "instance": instance})

    # 统一处理
    for entry: Dictionary in to_decay:
        _decay_status(entity, entry.id, entry.instance)
```

### 8.3 内存管理

- `StatusInstance` 使用 `RefCounted`，无需手动释放
- 实体死亡时调用 `remove_all_statuses()` 清理引用
- `_status_database` 只加载一次，所有实例共享同一个 `StatusData`

```gdscript
func cleanup() -> void:
    for entity_key in _status_map.keys():
        var entity_statuses: Dictionary = _status_map[entity_key]
        entity_statuses.clear()
    _status_map.clear()
```
