extends RefCounted
class_name PotionService

const EffectRunnerScript := preload("res://scripts/battle/effect_runner.gd")


## 根据稀有度权重随机选择一瓶药水（治疗 50%，力量 30%，格挡 20%）
static func choose_potion_reward(data_loader: Variant) -> Dictionary:
	var roll := randf()
	var potion_id: String
	if roll < 0.5:
		potion_id = "potion_heal"
	elif roll < 0.8:
		potion_id = "potion_strength"
	else:
		potion_id = "potion_block"
	return data_loader.get_potion(potion_id)


## 战斗中使用药水：通过 EffectRunner 执行效果，从槽位移除
## battle 是 BattleController 节点
static func use_potion(slot: int, game_state: Variant, battle: Variant, data_loader: Variant) -> bool:
	var potion_entry: Dictionary = game_state.get_potion_at(slot)
	if potion_entry.is_empty():
		return false

	var potion_id := str(potion_entry.get("id", ""))
	var potion: Dictionary = data_loader.get_potion(potion_id)
	if potion.is_empty():
		return false

	var effects: Array = potion.get("effects", [])
	EffectRunnerScript.apply_effects(effects, battle, "player", -1, -1)
	game_state.remove_potion_at(slot)
	return true
