extends RefCounted
class_name PotionService

const EffectRunnerScript := preload("res://scripts/battle/effect_runner.gd")


## 根据稀有度权重随机选择一瓶药水（common 50%，uncommon 35%，rare 15%）
static func choose_potion_reward(data_loader: Variant) -> Dictionary:
	var all_potions: Array = data_loader.get_all_potions()
	var common_pool: Array = []
	var uncommon_pool: Array = []
	var rare_pool: Array = []
	for p in all_potions:
		match str((p as Dictionary).get("rarity", "common")):
			"uncommon": uncommon_pool.append(str((p as Dictionary).get("id", "")))
			"rare":     rare_pool.append(str((p as Dictionary).get("id", "")))
			_:          common_pool.append(str((p as Dictionary).get("id", "")))

	var roll := randf()
	var pool: Array
	if roll < 0.50 and not common_pool.is_empty():
		pool = common_pool
	elif roll < 0.85 and not uncommon_pool.is_empty():
		pool = uncommon_pool
	elif not rare_pool.is_empty():
		pool = rare_pool
	else:
		pool = all_potions.map(func(p: Dictionary) -> String: return str(p.get("id", "")))

	if pool.is_empty():
		return {}
	var chosen_id := str(pool[randi() % pool.size()])
	return data_loader.get_potion(chosen_id)


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
