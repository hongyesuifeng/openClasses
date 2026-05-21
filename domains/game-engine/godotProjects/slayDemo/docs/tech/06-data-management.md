# 06 - 数据管理技术方案

## 1. Resource 的组织与加载策略

### 1.1 目录结构

```
resources/
├── cards/
│   ├── red/                  # 铁甲（战士）卡牌
│   │   ├── strike.tres
│   │   ├── defend.tres
│   │   ├── bash.tres
│   │   ├── anger.tres
│   │   ├── body_slam.tres
│   │   ├── clothesline.tres
│   │   ├── headbutt.tres
│   │   ├── iron_wave.tres
│   │   ├── pounding.tres
│   │   ├── sword_boomerang.tres
│   │   ├── thunderclap.tres
│   │   └── twin_strike.tres
│   ├── colorless/            # 无色卡牌
│   │   └── ...
│   └── curse/                # 诅咒卡牌
│       └── ...
│
├── enemies/
│   ├── act1/                 # 第一幕敌人
│   │   ├── jaw_worm.tres
│   │   ├── red_slaver.tres
│   │   ├── blue_slaver.tres
│   │   ├── slime_m.tres
│   │   ├── slime_s.tres
│   │   ├── fungi_beast.tres
│   │   └── gremlin_nob.tres
│   └── bosses/
│       └── slime_boss.tres
│
├── statuses/
│   ├── vulnerable.tres
│   ├── weak.tres
│   ├── strength.tres
│   ├── dexterity.tres
│   ├── poison.tres
│   ├── thorns.tres
│   ├── metallicize.tres
│   ├── barricade.tres
│   └── plated_armor.tres
│
└── encounters/
    ├── act1_normal/           # 第一幕普通遭遇
    │   ├── enc_01_easy.tres
    │   ├── enc_02_medium.tres
    │   └── enc_03_hard.tres
    ├── act1_elite/            # 第一幕精英遭遇
    │   ├── elite_gremlin_nob.tres
    │   ├── elite_lagavulin.tres
    │   └── elite_3_sentries.tres
    └── act1_boss/
        └── boss_slime_boss.tres
```

### 1.2 加载策略

```gdscript
# scripts/systems/data_loader.gd
extends Node

# 缓存：避免重复加载
static var _card_cache: Dictionary = {}      # StringName -> CardData
static var _enemy_cache: Dictionary = {}     # StringName -> EnemyData
static var _status_cache: Dictionary = {}    # StringName -> StatusData
static var _encounter_cache: Dictionary = {} # StringName -> EncounterData


## 加载所有卡牌数据
static func load_all_cards() -> Dictionary:
    if not _card_cache.is_empty():
        return _card_cache

    _load_resources_from_dir("res://resources/cards/", _card_cache, "CardData")
    return _card_cache


## 按 ID 获取卡牌
static func get_card(card_id: StringName) -> CardData:
    if _card_cache.is_empty():
        load_all_cards()
    return _card_cache.get(card_id)


## 加载指定目录下的所有 Resource
static func _load_resources_from_dir(dir_path: String, cache: Dictionary, expected_type: String) -> void:
    var dir := DirAccess.open(dir_path)
    if dir == null:
        push_error("DataLoader: 无法打开目录 '%s'" % dir_path)
        return

    dir.list_dir_begin()
    var file_name := dir.get_next()
    while file_name != "":
        if file_name.ends_with(".tres"):
            var full_path := dir_path.path_join(file_name)
            var resource := load(full_path)
            if resource and resource.get_class() == "Resource":
                # 通过类名验证类型
                if expected_type == "CardData" and resource is CardData:
                    _card_cache[resource.id] = resource
                elif expected_type == "EnemyData" and resource is EnemyData:
                    _enemy_cache[resource.id] = resource
                elif expected_type == "StatusData" and resource is StatusData:
                    _status_cache[resource.id] = resource
                elif expected_type == "EncounterData" and resource is EncounterData:
                    _encounter_cache[resource.id] = resource
        elif dir.current_is_dir():
            # 递归加载子目录
            var sub_path := dir_path.path_join(file_name)
            if file_name != "." and file_name != "..":
                _load_resources_from_dir(sub_path, cache, expected_type)
        file_name = dir.get_next()
    dir.list_dir_end()
```

### 1.3 热重载支持

```gdscript
## 清除缓存，强制重新加载（开发调试用）
static func clear_cache() -> void:
    _card_cache.clear()
    _enemy_cache.clear()
    _status_cache.clear()
    _encounter_cache.clear()


## 重新加载单个资源
static func reload_card(card_id: StringName) -> CardData:
    for cached_path in _card_cache:
        var card: CardData = _card_cache[cached_path]
        if card.id == card_id:
            var reloaded := load(card.resource_path) as CardData
            _card_cache[card_id] = reloaded
            return reloaded
    return null
```

## 2. 卡牌数据表设计

### 2.1 CardData 完整字段

```gdscript
# scripts/cards/card_data.gd
extends Resource
class_name CardData

# === 基础信息 ===
@export var id: StringName = &""
@export var card_name: String = ""
@export var description: String = ""
@export var upgraded_description: String = ""
@export var flavor_text: String = ""
@export var card_art: Texture2D

# === 费用 ===
@export var cost: int = 1
@export var upgraded_cost: int = -1          # -1 表示不改变
@export var is_x_cost: bool = false

# === 类型与标签 ===
@export var card_type: CardType = CardType.ATTACK
@export var card_rarity: CardRarity = CardRarity.COMMON
@export var card_color: CardColor = CardColor.RED
@export var tags: Array[CardTag] = []

# === 目标 ===
@export var target_type: TargetType = TargetType.SINGLE_ENEMY

# === 效果 ===
@export var effects: Array[EffectAction] = []
@export var upgraded_effects: Array[EffectAction] = []

# === 特殊属性 ===
@export var is_exhaust: bool = false
@export var upgraded_exhaust: bool = false       # 升级后是否改变exhaust
@export var is_ethereal: bool = false
@export var is_innate: bool = false

# === 运行时状态 ===
var is_upgraded: bool = false
```

### 2.2 初始卡牌数据示例

#### Strike（打击）

```gdscript
# 资源配置值 (resources/cards/red/strike.tres):
id = &"strike"
card_name = "打击"
description = "造成 {damage} 点伤害。"
cost = 1
card_type = CardType.ATTACK
card_rarity = CardRarity.COMMON
card_color = CardColor.RED
target_type = TargetType.SINGLE_ENEMY
tags = [CardTag.STARTER_STRIKE]

effects = [
    EffectAction.new(effect_type = EffectType.DEAL_DAMAGE, value = 6)
]
upgraded_effects = [
    EffectAction.new(effect_type = EffectType.DEAL_DAMAGE, value = 9)
]
```

#### Defend（防御）

```gdscript
# 资源配置值 (resources/cards/red/defend.tres):
id = &"defend"
card_name = "防御"
description = "获得 {block} 点格挡。"
cost = 1
card_type = CardType.SKILL
card_rarity = CardRarity.COMMON
card_color = CardColor.RED
target_type = TargetType.SELF
tags = [CardTag.STARTER_DEFEND]

effects = [
    EffectAction.new(effect_type = EffectType.GAIN_BLOCK, value = 5)
]
upgraded_effects = [
    EffectAction.new(effect_type = EffectType.GAIN_BLOCK, value = 8)
]
```

#### Bash（痛击）

```gdscript
# 资源配置值 (resources/cards/red/bash.tres):
id = &"bash"
card_name = "痛击"
description = "造成 {damage} 点伤害。\n施加 {status_stacks} 层易伤。"
cost = 2
card_type = CardType.ATTACK
card_rarity = CardRarity.STARTER  # 初始卡组自带
card_color = CardColor.RED
target_type = TargetType.SINGLE_ENEMY

effects = [
    EffectAction.new(effect_type = EffectType.DEAL_DAMAGE, value = 8),
    EffectAction.new(effect_type = EffectType.APPLY_STATUS, value = 0, status_id = &"vulnerable", status_stacks = 2),
]
upgraded_effects = [
    EffectAction.new(effect_type = EffectType.DEAL_DAMAGE, value = 10),
    EffectAction.new(effect_type = EffectType.APPLY_STATUS, value = 0, status_id = &"vulnerable", status_stacks = 3),
]
```

#### Anger（怒气）

```gdscript
# 资源配置值 (resources/cards/red/anger.tres):
id = &"anger"
card_name = "怒气"
description = "造成 {damage} 点伤害。\n将一张怒气的副本加入弃牌堆。"
cost = 0
card_type = CardType.ATTACK
card_rarity = CardRarity.COMMON
card_color = CardColor.RED
target_type = TargetType.SINGLE_ENEMY

effects = [
    EffectAction.new(effect_type = EffectType.DEAL_DAMAGE, value = 6),
    EffectAction.new(effect_type = EffectType.CREATE_CARD_IN_HAND, value = 0),  # 创建自身副本
]
upgraded_effects = [
    EffectAction.new(effect_type = EffectType.DEAL_DAMAGE, value = 8),
    EffectAction.new(effect_type = EffectType.CREATE_CARD_IN_HAND, value = 0),
]
```

### 2.3 Demo 阶段卡牌清单

| ID | 名称 | 费用 | 类型 | 稀有度 | 效果 | 升级后 |
|----|------|------|------|--------|------|--------|
| strike | 打击 | 1 | 攻击 | 普通 | 6伤害 | 9伤害 |
| defend | 防御 | 1 | 技能 | 普通 | 5格挡 | 8格挡 |
| bash | 痛击 | 2 | 攻击 | 初始 | 8伤害+2易伤 | 10伤害+3易伤 |
| anger | 怒气 | 0 | 攻击 | 普通 | 6伤害+复制 | 8伤害+复制 |
| body_slam | 猛摔 | 1 | 攻击 | 普通 | 等同格挡值伤害 | 0费 |
| clothesline | 衣领钩拳 | 2 | 攻击 | 普通 | 12伤害+2虚弱 | 12伤害+3虚弱 |
| headbutt | 头槌 | 1 | 攻击 | 普通 | 9伤害 | 12伤害 |
| iron_wave | 铁浪 | 1 | 攻击 | 普通 | 5伤害+5格挡 | 7伤害+7格挡 |
| pounding | 蓄力痛击 | 1 | 攻击 | 普通 | 多段伤害 | 伤害提升 |
| twin_strike | 双重打击 | 1 | 攻击 | 普通 | 5x2伤害 | 7x2伤害 |
| thunderclap | 雷击 | 1 | 攻击 | 普通 | 4伤害+1易伤(全体) | 7伤害+1易伤(全体) |
| inflame | 炎爆 | 1 | 能力 | 罕见 | +2力量 | +3力量 |
| metal_lord | 金属领主 | 1 | 能力 | 罕见 | 获得3金属化 | 获得4金属化 |

## 3. 敌人数据表设计

### 3.1 EnemyData 完整字段

见 `04-enemy-ai-system.md` 中的 EnemyData 定义。这里补充具体数据。

### 3.2 Demo 阶段敌人清单

#### Jaw Worm（颚虫）

```gdscript
# resources/enemies/act1/jaw_worm.tres:
id = &"jaw_worm"
enemy_name = "颚虫"
min_hp = 40
max_hp = 44
behavior_type = BehaviorType.WEIGHTED_POOL

action_list = [
    EnemyActionData.new(
        action_name = "撕咬",
        intent_type = IntentType.ATTACK,
        intent_value = 11,
        effects = [EffectAction.new(EffectType.DEAL_DAMAGE, 11)],
        weight = 30,
    ),
    EnemyActionData.new(
        action_name = "长嚎",
        intent_type = IntentType.BUFF,
        intent_value = 0,
        effects = [
            EffectAction.new(EffectType.APPLY_STATUS, 0, status_id = &"strength", status_stacks = 3),
            EffectAction.new(EffectType.GAIN_BLOCK, 6),
        ],
        weight = 30,
    ),
    EnemyActionData.new(
        action_name = "猛击",
        intent_type = IntentType.ATTACK,
        intent_value = 18,
        effects = [EffectAction.new(EffectType.DEAL_DAMAGE, 18)],
        weight = 20,
        cooldown = 2,
    ),
]
```

#### Slime M（中型史莱姆）

```gdscript
# resources/enemies/act1/slime_m.tres:
id = &"slime_m"
enemy_name = "中型史莱姆"
min_hp = 28
max_hp = 32
behavior_type = BehaviorType.WEIGHTED_POOL

action_list = [
    EnemyActionData.new(
        action_name = "黏液攻击",
        intent_type = IntentType.ATTACK_DEBUFF,
        intent_value = 10,
        effects = [
            EffectAction.new(EffectType.DEAL_DAMAGE, 10),
            EffectAction.new(EffectType.APPLY_STATUS, 0, status_id = &"weak", status_stacks = 1),
        ],
        weight = 40,
    ),
    EnemyActionData.new(
        action_name = "准备",
        intent_type = IntentType.DEFEND,
        intent_value = 8,
        effects = [EffectAction.new(EffectType.GAIN_BLOCK, 8)],
        weight = 30,
    ),
    EnemyActionData.new(
        action_name = "舔舐",
        intent_type = IntentType.DEBUFF,
        intent_value = 0,
        effects = [
            EffectAction.new(EffectType.APPLY_STATUS, 0, status_id = &"weak", status_stacks = 2),
        ],
        weight = 30,
    ),
]
```

## 4. 状态效果数据表设计

### 4.1 StatusData 示例

#### Vulnerable（易伤）

```gdscript
# resources/statuses/vulnerable.tres:
id = &"vulnerable"
status_name = "易伤"
description = "受到的攻击伤害增加50%。"
icon = preload("res://assets/art/statuses/vulnerable.png")
is_debuff = true
is_buff = false
stack_type = StackType.DURATION
max_stacks = 99
decay_type = DecayType.DECREASE_BY_ONE
trigger_timing = TriggerTiming.NONE
color = Color(1.0, 0.4, 0.4)  # 红色调
```

#### Strength（力量）

```gdscript
# resources/statuses/strength.tres:
id = &"strength"
status_name = "力量"
description = "攻击伤害增加{stacks}点。"
icon = preload("res://assets/art/statuses/strength.png")
is_debuff = false
is_buff = true
stack_type = StackType.INTENSITY
max_stacks = 99
decay_type = DecayType.NONE
trigger_timing = TriggerTiming.NONE
color = Color(0.4, 1.0, 0.4)  # 绿色调
```

#### Poison（毒素）

```gdscript
# resources/statuses/poison.tres:
id = &"poison"
status_name = "毒素"
description = "回合开始时受到{stacks}点伤害，层数-1。"
icon = preload("res://assets/art/statuses/poison.png")
is_debuff = true
is_buff = false
stack_type = StackType.DURATION
max_stacks = 99
decay_type = DecayType.DECREASE_BY_ONE
trigger_timing = TriggerTiming.ON_TURN_START
color = Color(0.6, 0.2, 0.8)  # 紫色调
```

## 5. 遭遇数据表设计

### 5.1 EncounterData 定义

```gdscript
# resources/encounters/encounter_data.gd
extends Resource
class_name EncounterData

@export var id: StringName = &""
@export var encounter_name: String = ""
@export var encounter_type: EncounterType = EncounterType.NORMAL
@export var difficulty: int = 1               # 难度等级 1-5
@export var enemy_list: Array[EnemyData] = [] # 敌人列表
@export var is_elite: bool = false
@export var is_boss: bool = false


enum EncounterType {
    NORMAL,         # 普通战斗
    ELITE,          # 精英战斗
    BOSS,           # Boss 战斗
    EVENT,          # 事件（预留）
}
```

### 5.2 遭遇数据示例

```gdscript
# resources/encounters/act1_normal/enc_01_easy.tres:
id = &"enc_act1_01"
encounter_name = "简单遭遇"
encounter_type = EncounterType.NORMAL
difficulty = 1
enemy_list = [
    preload("res://resources/enemies/act1/jaw_worm.tres"),
]

# resources/encounters/act1_normal/enc_02_medium.tres:
id = &"enc_act1_02"
encounter_name = "双史莱姆"
encounter_type = EncounterType.NORMAL
difficulty = 2
enemy_list = [
    preload("res://resources/enemies/act1/slime_m.tres"),
    preload("res://resources/enemies/act1/slime_s.tres"),
]

# resources/encounters/act1_boss/boss_slime_boss.tres:
id = &"enc_act1_boss_01"
encounter_name = "史莱姆Boss"
encounter_type = EncounterType.BOSS
difficulty = 5
enemy_list = [
    preload("res://resources/enemies/bosses/slime_boss.tres"),
]
```

### 5.3 遭遇选取规则

```gdscript
# scripts/map/encounter_selector.gd
extends RefCounted

## 根据房间类型和楼层选择遭遇
static func select_encounter(room_type: int, floor: int) -> EncounterData:
    var pool: Array[EncounterData] = []

    match room_type:
        RoomType.NORMAL:
            pool = _get_normal_encounters(floor)
        RoomType.ELITE:
            pool = _get_elite_encounters(floor)
        RoomType.BOSS:
            pool = _get_boss_encounters(floor)

    if pool.is_empty():
        return null

    return pool[randi() % pool.size()]


static func _get_normal_encounters(floor: int) -> Array[EncounterData]:
    var all_encounters := DataLoader.load_encounters()
    var result: Array[EncounterData] = []
    for enc: EncounterData in all_encounters.values():
        if enc.encounter_type == EncounterType.NORMAL:
            result.append(enc)
    return result
```

## 6. 初始卡组定义

```gdscript
# scripts/autoload/game_state.gd 中定义初始卡组

const STARTER_DECK: Array[StringName] = [
    &"strike",   # 5张打击
    &"strike",
    &"strike",
    &"strike",
    &"strike",
    &"defend",   # 4张防御
    &"defend",
    &"defend",
    &"defend",
    &"bash",     # 1张痛击
]

func create_starter_deck() -> Array[CardData]:
    var deck: Array[CardData] = []
    for card_id: StringName in STARTER_DECK:
        var card: CardData = DataLoader.get_card(card_id)
        if card:
            deck.append(card.duplicate())
    return deck
```

## 7. 数据热重载与调试支持

### 7.1 编辑器内调试

```gdscript
# 在编辑器中运行时，可以通过快捷键触发热重载
# 添加到 app_root.gd

func _input(event: InputEvent) -> void:
    if OS.is_debug_build():
        if event.is_action_pressed(&"debug_reload_data"):
            DataLoader.clear_cache()
            DataLoader.load_all_cards()
            print("[Debug] 数据已重新加载")
```

### 7.2 数据验证

```gdscript
# scripts/systems/data_validator.gd
extends RefCounted

## 验证所有卡牌数据的完整性
static func validate_cards() -> PackedStringArray:
    var errors: PackedStringArray = []
    var cards := DataLoader.load_all_cards()

    for card_id: StringName in cards:
        var card: CardData = cards[card_id]

        if card.id.is_empty():
            errors.append("发现空 ID 的卡牌: %s" % card.resource_path)
        if card.card_name.is_empty():
            errors.append("卡牌 '%s' 缺少名称" % card_id)
        if card.effects.is_empty():
            errors.append("卡牌 '%s' 没有效果" % card_id)
        if card.cost < 0 and not card.is_x_cost:
            errors.append("卡牌 '%s' 费用为负数但不是 X 费" % card_id)

    return errors


## 验证所有敌人数据的完整性
static func validate_enemies() -> PackedStringArray:
    var errors: PackedStringArray = []
    var enemies := DataLoader.load_all_enemies()

    for enemy_id: StringName in enemies:
        var enemy: EnemyData = enemies[enemy_id]
        if enemy.action_list.is_empty():
            errors.append("敌人 '%s' 没有行动列表" % enemy_id)
        if enemy.min_hp > enemy.max_hp:
            errors.append("敌人 '%s' min_hp > max_hp" % enemy_id)

    return errors
```

### 7.3 数据导出工具（可选）

```gdscript
# 将 Resource 数据导出为可读的 JSON（用于文档或外部工具）
static func export_card_to_dict(card: CardData) -> Dictionary:
    return {
        id = String(card.id),
        name = card.card_name,
        cost = card.cost,
        type = CardType.keys()[card.card_type],
        rarity = CardRarity.keys()[card.card_rarity],
        effects = card.effects.map(func(e): return _effect_to_dict(e)),
        target = TargetType.keys()[card.target_type],
        exhaust = card.is_exhaust,
        ethereal = card.is_ethereal,
    }
```
