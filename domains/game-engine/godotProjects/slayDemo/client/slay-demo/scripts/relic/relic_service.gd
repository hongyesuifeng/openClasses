extends RefCounted
class_name RelicService


static func get_effect_total(relic_ids: Array, data_loader: Variant, effect_type: String) -> int:
	var total := 0
	for relic_id in relic_ids:
		var relic: Dictionary = data_loader.get_relic(str(relic_id))
		for effect in relic.get("effects", []):
			var effect_dict := effect as Dictionary
			if str(effect_dict.get("type", "")) == effect_type:
				total += int(effect_dict.get("value", 0))
	return total


static func choose_relic_reward(owned_relic_ids: Array, data_loader: Variant) -> Dictionary:
	var candidates: Array = []
	for relic in data_loader.get_all_relics():
		var relic_dict := relic as Dictionary
		if owned_relic_ids.has(str(relic_dict.get("id", ""))):
			continue
		candidates.append(relic_dict)

	candidates.sort_custom(func(a: Dictionary, b: Dictionary) -> bool:
		var rarity_a := _rarity_score(str(a.get("rarity", "common")))
		var rarity_b := _rarity_score(str(b.get("rarity", "common")))
		if rarity_a == rarity_b:
			return str(a.get("id", "")) < str(b.get("id", ""))
		return rarity_a < rarity_b
	)

	if candidates.is_empty():
		return {}
	return (candidates[0] as Dictionary).duplicate(true)


static func _rarity_score(rarity: String) -> int:
	match rarity:
		"common":
			return 0
		"uncommon":
			return 1
		"rare":
			return 2
		_:
			return 3
