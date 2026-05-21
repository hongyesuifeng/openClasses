# 03 - 卡牌效果系统技术方案

## 1. CardData 的 Resource 结构设计

### 1.1 CardData 定义

```gdscript
# scripts/cards/card_data.gd
extends Resource
class_name CardData

@export_group("基础信息")
@export var id: StringName = &""                 # 唯一标识符 "strike" / "defend"
@export var card_name: String = ""               # 显示名称 "打击"
@export var description: String = ""             # 卡牌描述（支持占位符）
@export var flavor_text: String = ""             # 风味文本（可选）
@export var card_art: Texture2D                  # 卡牌插画

@export_group("费用")
@export var cost: int = 1                        # 能量费用
@export var cost_type: CostType = CostType.ENERGY # 费用类型
@export var is_x_cost: bool = false              # 是否 X 费（消耗所有能量）

@export_group("类型与标签")
@export var card_type: CardType = CardType.ATTACK # 卡牌类型
@export var card_rarity: CardRarity = CardRarity.COMMON  # 稀有度
@export var card_color: CardColor = CardColor.RED # 角色颜色
@export var tags: Array[CardTag] = []            # 标签列表

@export_group("目标")
@export var target_type: TargetType = TargetType.SINGLE_ENEMY

@export_group("效果")
@export var effects: Array[EffectAction] = []    # 基础效果列表
@export var upgraded_effects: Array[EffectAction] = []  # 升级后效果列表

@export_group("特殊属性")
@export var is_exhaust: bool = false             # 打出后消耗
@export var is_ethereal: bool = false            # 回合结束未打出则消耗
@export var is_innate: bool = false              # 每场战斗起始手牌
@export var discard_on_use: bool = true          # 默认打出后进弃牌堆
```

### 1.2 枚举定义

```gdscript
# scripts/cards/card_enums.gd
class_name CardEnums

enum CardType {
    ATTACK,     # 攻击牌
    SKILL,      # 技能牌
    POWER,      # 能力牌（持续效果）
    STATUS,     # 状态牌（不可打出或特殊规则）
    CURSE,      # 诅咒牌（不可打出，手牌占位）
}

enum CardRarity {
    COMMON,     # 普通
    UNCOMMON,   # 罕见
    RARE,       # 稀有
    SPECIAL,    # 特殊
    CURSE,      # 诅咒
}

enum CardColor {
    RED,        # 铁甲（战士）
    COLORLESS,  # 无色
    CURSE,      # 诅咒
}

enum CostType {
    ENERGY,     # 标准能量
    HP,         # 消耗生命值（特殊卡）
    NONE,       # 无费用
}

enum CardTag {
    NONE,
    STARTER_STRIKE,  # 初始打击
    STARTER_DEFEND,  # 初始防御
    EXHAUST,         # 消耗
}
```

### 1.3 目标类型枚举

```gdscript
enum TargetType {
    SELF,               # 自身
    SINGLE_ENEMY,       # 单体敌人（需选择）
    ALL_ENEMIES,        # 所有敌人
    SINGLE_ALLY,        # 单体友方（Demo 中暂不用）
    ALL_ALLIES,         # 所有友方
    NONE,               # 无目标（直接效果）
    RANDOM_ENEMY,       # 随机敌人
}
```

## 2. EffectAction 结构设计

### 2.1 效果动作定义

```gdscript
# scripts/cards/effect_action.gd
extends Resource
class_name EffectAction

@export var effect_type: EffectType = EffectType.DEAL_DAMAGE
@export var value: int = 0                       # 主数值
@export var secondary_value: int = 0             # 次要数值
@export var target_override: TargetType = TargetType.NONE  # 覆盖卡牌目标（如卡牌选敌人但效果加自身格挡）
@export var status_id: StringName = &""          # 关联状态ID（施加状态时使用）
@export var status_stacks: int = 0               # 状态层数
@export var card_filter: CardFilter = null       # 抽牌/弃牌过滤条件
@export var multiplier: int = 1                  # 乘数（如"对所有敌人"时实际是多次执行）


func get_effect_description() -> String:
    match effect_type:
        EffectType.DEAL_DAMAGE:
            return "造成 %d 点伤害" % value
        EffectType.GAIN_BLOCK:
            return "获得 %d 点格挡" % value
        EffectType.APPLY_STATUS:
            return "施加 %d 层 %s" % [status_stacks, _get_status_name()]
        EffectType.DRAW_CARDS:
            return "抽 %d 张牌" % value
        EffectType.GAIN_ENERGY:
            return "获得 %d 点能量" % value
        _:
            return ""
```

### 2.2 效果类型枚举

```gdscript
# scripts/cards/effect_type.gd
enum EffectType {
    # 基础效果（最小原型必须实现）
    DEAL_DAMAGE,            # 造成伤害
    GAIN_BLOCK,             # 获得格挡
    DRAW_CARDS,             # 抽牌
    GAIN_ENERGY,            # 获得能量

    # 状态效果
    APPLY_STATUS,           # 施加状态
    REMOVE_STATUS,          # 移除状态

    # 扩展效果（原型阶段可选）
    DEAL_DAMAGE_MULTI,      # 多段伤害
    HEAL,                   # 回复生命
    UPGRADE_CARD,           # 升级卡牌
    EXHAUST_CARDS,          # 消耗卡牌
    RETURN_CARD_TO_HAND,    # 卡牌回手
    RANDOM_DEBUFF,          # 随机debuff
    AOE_ATTACK,             # AOE攻击（对所有敌人）

    # 高级效果（后期扩展）
    CREATE_CARD_IN_HAND,    # 在手牌中创建卡牌
    COPY_CARD,              # 复制卡牌
    SCRY,                   # 预览抽牌堆顶
}
```

### 2.3 CardFilter（卡牌过滤条件）

```gdscript
# scripts/cards/card_filter.gd
extends Resource
class_name CardFilter

@export var filter_type: CardFilterType = CardFilterType.ANY
@export var card_type_filter: CardType = CardType.ATTACK
@export var tag_filter: CardTag = CardTag.NONE
@export var count: int = 1                       # 选择的数量


enum CardFilterType {
    ANY,            # 任意卡牌
    BY_TYPE,        # 按类型过滤
    BY_TAG,         # 按标签过滤
    RANDOM,         # 随机选择
    LOWEST_COST,    # 费用最低
    HIGHEST_COST,   # 费用最高
}
```

## 3. 效果结算引擎设计

### 3.1 CardEffectEngine 结构

```gdscript
# scripts/battle/card_effect_engine.gd
extends Node

signal effect_executed(effect_type: EffectType, source: CardData, target: Node)
signal all_effects_completed(card: CardData)

var _animation_controller: Node  # 引用动画控制器

## 执行卡牌的所有效果
func execute_effects(effects: Array[EffectAction], card: CardData, primary_target: Node) -> void:
    for effect: EffectAction in effects:
        await _execute_single_effect(effect, card, primary_target)
    all_effects_completed.emit(card)
```

### 3.2 单效果执行

```gdscript
func _execute_single_effect(effect: EffectAction, card: CardData, primary_target: Node) -> void:
    # 确定实际目标
    var targets: Array[Node] = _resolve_targets(effect, primary_target)

    # 根据乘数执行多次
    for _i in range(effect.multiplier):
        for target: Node in targets:
            await _apply_effect(effect, card, target)

    effect_executed.emit(effect.effect_type, card, primary_target)


func _resolve_targets(effect: EffectAction, primary_target: Node) -> Array[Node]:
    # 如果效果有目标覆盖，使用覆盖目标
    var target_type := effect.target_override if effect.target_override != TargetType.NONE else TargetType.NONE

    if target_type == TargetType.NONE:
        # 使用卡牌的主目标
        if primary_target:
            return [primary_target]
        return []

    match target_type:
        TargetType.SELF:
            return [BattleManager.get_player()]
        TargetType.ALL_ENEMIES:
            return BattleManager.get_enemies()
        TargetType.RANDOM_ENEMY:
            var enemies := BattleManager.get_enemies()
            if enemies.is_empty():
                return []
            return [enemies[randi() % enemies.size()]]
        _:
            if primary_target:
                return [primary_target]
            return []
```

### 3.3 效果分发器

```gdscript
func _apply_effect(effect: EffectAction, card: CardData, target: Node) -> void:
    match effect.effect_type:
        EffectType.DEAL_DAMAGE:
            _effect_deal_damage(effect, card, target)
        EffectType.DEAL_DAMAGE_MULTI:
            _effect_deal_damage_multi(effect, card, target)
        EffectType.GAIN_BLOCK:
            _effect_gain_block(effect, card, target)
        EffectType.DRAW_CARDS:
            _effect_draw_cards(effect, card)
        EffectType.GAIN_ENERGY:
            _effect_gain_energy(effect)
        EffectType.APPLY_STATUS:
            _effect_apply_status(effect, card, target)
        EffectType.HEAL:
            _effect_heal(effect, card, target)
        EffectType.AOE_ATTACK:
            _effect_aoe_attack(effect, card)
        _:
            push_warning("CardEffectEngine: 未实现的效果类型 %s" % EffectType.keys()[effect.effect_type])

    # 等待效果动画完成
    if _animation_controller:
        await _animation_controller.play_effect_animation(effect, card, target)
    else:
        await get_tree().process_frame  # 至少等一帧
```

### 3.4 各效果实现

```gdscript
func _effect_deal_damage(effect: EffectAction, card: CardData, target: Node) -> void:
    var entity: BattleEntity = target as BattleEntity
    if entity == null:
        return

    # 计算最终伤害（考虑状态修正）
    var final_damage := _calculate_damage(effect.value, BattleManager.get_player(), entity)
    entity.take_damage(final_damage)


func _effect_deal_damage_multi(effect: EffectAction, card: CardData, target: Node) -> void:
    for i in range(effect.secondary_value):  # secondary_value = 打击次数
        _effect_deal_damage(effect, card, target)
        await get_tree().create_timer(0.15).timeout  # 简单间隔


func _effect_gain_block(effect: EffectAction, card: CardData, target: Node) -> void:
    var entity: BattleEntity = target as BattleEntity
    if entity == null:
        return
    entity.gain_block(effect.value)


func _effect_draw_cards(effect: EffectAction, _card: CardData) -> void:
    BattleManager.deck_manager.draw_cards(effect.value)


func _effect_gain_energy(effect: EffectAction, _card: CardData) -> void:
    BattleManager.energy_system.gain_energy(effect.value)


func _effect_apply_status(effect: EffectAction, card: CardData, target: Node) -> void:
    BattleManager.status_manager.apply_status(
        target,
        effect.status_id,
        effect.status_stacks
    )


func _effect_heal(effect: EffectAction, card: CardData, target: Node) -> void:
    var entity: BattleEntity = target as BattleEntity
    if entity:
        entity.heal(effect.value)


func _effect_aoe_attack(effect: EffectAction, card: CardData) -> void:
    var enemies := BattleManager.get_enemies()
    var final_damage := _calculate_damage(effect.value, BattleManager.get_player(), null)
    for enemy: BattleEntity in enemies:
        enemy.take_damage(final_damage)
```

### 3.5 伤害计算

```gdscript
## 计算最终伤害（考虑力量、易伤等状态修正）
func _calculate_damage(base_damage: int, source: BattleEntity, target: BattleEntity) -> int:
    var damage := base_damage

    # 加算修正（力量）
    var strength := BattleManager.status_manager.get_status_stacks(source, &"strength")
    damage += strength

    # 乘算修正（易伤）
    if target:
        var vulnerable := BattleManager.status_manager.get_status_stacks(target, &"vulnerable")
        if vulnerable > 0:
            damage = int(damage * 1.5)

    return maxi(damage, 0)  # 不小于 0
```

## 4. 目标选择系统

### 4.1 目标选择器

```gdscript
# scripts/battle/target_selector.gd
extends Node

signal target_selected(target: Node)
signal target_selection_cancelled()

var _is_selecting: bool = false
var _valid_targets: Array[Node] = []
var _current_card: CardData = null


func start_selection(card: CardData) -> void:
    _current_card = card
    match card.target_type:
        TargetType.SELF, TargetType.NONE, TargetType.ALL_ENEMIES, TargetType.ALL_ALLIES:
            # 自动目标，无需手动选择
            _auto_target(card.target_type)
        TargetType.SINGLE_ENEMY:
            _start_enemy_selection()
        TargetType.RANDOM_ENEMY:
            _random_enemy_target()
        _:
            _auto_target(TargetType.NONE)


func _auto_target(target_type: TargetType) -> void:
    match target_type:
        TargetType.SELF:
            target_selected.emit(BattleManager.get_player())
        TargetType.ALL_ENEMIES:
            target_selected.emit(null)  # null 表示 AOE，引擎会处理
        TargetType.NONE:
            target_selected.emit(null)
        _:
            target_selected.emit(null)


func _start_enemy_selection() -> void:
    _is_selecting = true
    _valid_targets = BattleManager.get_enemies()
    # UI 层监听此状态，高亮可选敌人
    # 玩家点击敌人后调用 confirm_target()


func confirm_target(target: Node) -> void:
    if not _is_selecting:
        return
    if target not in _valid_targets:
        return
    _is_selecting = false
    target_selected.emit(target)


func cancel_selection() -> void:
    _is_selecting = false
    target_selection_cancelled.emit()


func is_selecting() -> bool:
    return _is_selecting
```

## 5. 卡牌升级的实现方式

### 5.1 升级策略

采用预定义升级方案：每张卡有两个效果列表（`effects` 和 `upgraded_effects`）。升级时替换效果列表，并修改卡牌名称显示。

```gdscript
# scripts/cards/card_data.gd 中增加

@export var upgraded_id: StringName = &""  # 升级后ID，如 "strike+"
var is_upgraded: bool = false


## 升级此卡牌
func upgrade() -> void:
    if is_upgraded:
        return
    is_upgraded = true

    # 如果定义了升级效果，替换之
    if not upgraded_effects.is_empty():
        effects = upgraded_effects.duplicate()

    # 名称追加 "+"
    if not upgraded_id.is_empty():
        id = upgraded_id
    else:
        id = StringName(str(id) + "+")

    # 更新描述
    _update_description()


## 获取当前描述（考虑升级状态）
func get_display_description() -> String:
    var desc := description
    if is_upgraded and not upgraded_description.is_empty():
        desc = upgraded_description
    return _replace_placeholders(desc)
```

### 5.2 升级效果示例

以 Strike 为例：

```
Strike (普通):         造成 6 点伤害
Strike+ (升级后):      造成 9 点伤害

Resource 配置:
  effects = [EffectAction(DEAL_DAMAGE, 6)]
  upgraded_effects = [EffectAction(DEAL_DAMAGE, 9)]
```

```
Defend (普通):         获得 5 点格挡
Defend+ (升级后):      获得 8 点格挡

Resource 配置:
  effects = [EffectAction(GAIN_BLOCK, 5)]
  upgraded_effects = [EffectAction(GAIN_BLOCK, 8)]
```

```
Bash (普通):           造成 8 伤害，施加 2 层易伤
Bash+ (升级后):        造成 10 伤害，施加 3 层易伤

Resource 配置:
  effects = [
    EffectAction(DEAL_DAMAGE, 8),
    EffectAction(APPLY_STATUS, 0, status_id="vulnerable", stacks=2),
  ]
  upgraded_effects = [
    EffectAction(DEAL_DAMAGE, 10),
    EffectAction(APPLY_STATUS, 0, status_id="vulnerable", stacks=3),
  ]
```

## 6. 效果触发链与顺序

### 6.1 效果执行顺序

一张卡内的多个效果按数组顺序依次执行。每个效果执行完毕后等待动画完成，再执行下一个。

```
卡牌打出
  │
  ├── 前置检查（能量、目标合法性）
  │
  ├── 效果1 执行 → 动画 → 完成
  ├── 效果2 执行 → 动画 → 完成
  ├── 效果3 执行 → 动画 → 完成
  │
  ├── 后续处理
  │   ├── Exhaust → 移入消耗堆
  │   └── 默认 → 移入弃牌堆
  │
  └── 检查战斗结束条件
```

### 6.2 触发时机总表

```
触发时机                    触发的效果/状态
──────────────────────────────────────────────
ON_CARD_PLAYED              力量（加成伤害）、虚弱（降低伤害）
ON_DAMAGE_DEALT             状态触发（如：魔多的事件）
ON_DAMAGE_TAKEN             易伤（增加受到的伤害）
ON_BLOCK_GAINED             无特殊触发（预留）
ON_TURN_START               回合开始抽牌、能量恢复、状态消退
ON_TURN_END                 Ethereal 消耗、格挡清零、状态层数递减
ON_ENEMY_DEATH              检查战斗结束
ON_CARD_DRAWN               检查手牌上限
ON_CARD_DISCARDED           弃牌触发效果（预留）
ON_STATUS_APPLIED           状态间连锁（预留）
```

### 6.3 效果间的依赖关系

```gdscript
# 效果执行时需要考虑的修正链
# 以伤害计算为例：

输入: base_damage = 6

修正链:
  1. + 力量 (strength):       6 + 2 = 8
  2. x 易伤 (vulnerable):     8 * 1.5 = 12
  3. - 格挡 (block):          12 - 5 = 7  (实际扣血)
  4. 记录最终伤害值

# 注意：格挡是在 take_damage 中处理的，不在效果引擎中
# 效果引擎只计算"伤害数值"，实体的 take_damage 方法处理格挡吸收
```
