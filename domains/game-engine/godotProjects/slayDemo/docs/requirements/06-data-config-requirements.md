# 06. 数据配置需求

> 面向: 开发、策划  
> 状态: 技术实施前配置表草案

## 1. 目标

将策划需求转成 Godot Resource 或其他数据配置结构。首版应尽量数据驱动，减少硬编码。

## 2. CardData 字段

```text
id: String
name: String
description: String
card_type: attack | skill | power | status
rarity: starter | common | uncommon | rare | special
cost: int
target_type: self | single_enemy | all_enemies | random_enemy | none
tags: Array[String]
effects: Array[EffectAction]
upgraded_effects: Array[EffectAction]
art_key: String
upgrade_name: String
```

常用 tags:

```text
draw
filter
strength
multi_hit
block
retain_block
block_scaling
block_trigger
aoe
cleanup
status_card
exhaust
starter
```

## 3. EffectAction 字段

```text
type: String
value: int
target: String
condition: String
status_id: String
duration: int
repeat: int
extra: Dictionary
```

首版需要支持的 effect type:

```text
damage
multi_hit_damage
aoe_damage
block
draw
discard
exhaust
gain_strength
apply_status
add_status_card
retain_block_modifier
conditional_bonus_block
damage_by_current_block_ratio
random_enemy_damage
```

## 4. EnemyData 字段

```text
id: String
name: String
enemy_type: normal | elite | boss | summon
max_hp: int
art_key: String
intent_icon_set: String
action_pattern_id: String
phase_rules: Array[PhaseRule]
reward_profile_id: String
tags: Array[String]
```

## 5. EnemyAction 字段

```text
id: String
name: String
intent_type: attack | defend | buff | debuff | summon | special
intent_value: int
effects: Array[EffectAction]
next_action_rule: String
```

敌人行动需要支持:

```text
damage
multi_hit_damage
gain_block
gain_strength
apply_status_to_player
add_status_card_to_discard
summon_enemy
command_summons_attack
phase_change
```

## 6. EncounterData 字段

```text
id: String
encounter_type: normal | elite | boss
enemy_ids: Array[String]
floor_range: String
weight: int
test_tags: Array[String]
reward_adjustment_tags: Array[String]
```

test_tags 示例:

```text
deck_pollution
startup_pressure
scaling_pressure
combined_pressure
multi_target
```

## 7. RewardProfile 字段

```text
id: String
base_common_weight: int
base_uncommon_weight: int
base_rare_weight: int
tag_weight_modifiers: Dictionary
gold_min: int
gold_max: int
relic_chance: float
potion_chance: float
```

动态权重规则:

```text
recent_encounter_tag -> card_tag_weight_bonus

deck_pollution -> cleanup + filter
startup_pressure -> low_cost_block + low_cost_attack
scaling_pressure -> burst + reduce_strength
combined_pressure -> stable_block + status_answer
multi_target -> aoe + random_multi_hit
```

## 8. ShopProfile 字段

```text
id: String
floor_range: String
card_slots: int
potion_slots: int
relic_slots: int
remove_service_enabled: bool
price_profile_id: String
tag_weight_modifiers: Dictionary
```

Boss 前商店 tag 权重:

```text
aoe +20
cleanup +10
block +10
potion +15
```

价格配置:

```text
remove_card_base: 75
remove_card_increment: 25
common_card: 45-60
uncommon_card: 75-100
rare_card: 120-160
potion: 35-70
relic: 150-220
```

## 9. MapNodeData 字段

```text
id: String
floor: int
node_type: normal | elite | boss | shop | event | chest | rest
encounter_pool_id: String
shop_profile_id: String
reward_profile_id: String
next_node_ids: Array[String]
route_tags: Array[String]
```

route_tags 示例:

```text
safe
combat
risk
boss_prep
event_variance
```

## 10. StatusData 字段

```text
id: String
name: String
status_type: buff | debuff | special
stack_type: intensity | duration
timing: turn_start | turn_end | on_attack | on_block | passive
description: String
icon_key: String
```

首版状态:

```text
strength
block
weak
vulnerable
poison
retain_block_modifier
```

## 11. RelicData 字段

```text
id: String
name: String
description: String
rarity: common | uncommon | rare
trigger_timing: String
effects: Array[EffectAction]
tags: Array[String]
icon_key: String
```

## 12. PotionData 字段

```text
id: String
name: String
description: String
target_type: self | single_enemy | all_enemies | none
effects: Array[EffectAction]
price_range: Vector2i
icon_key: String
```

## 13. 技术验收

- 策划能通过数据文件新增一张普通伤害牌。
- 策划能通过数据文件新增一个敌人行动序列。
- 奖励系统能根据 encounter tag 调整卡牌 tag 权重。
- 商店能根据层数使用不同 ShopProfile。
- Boss 能在半血后切换阶段。
- 卡牌 UI 能从 CardData 自动展示费用、名称、描述和关键词。
