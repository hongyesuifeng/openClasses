extends RefCounted
class_name EffectRunner


static func apply_effects(effects: Array, battle: Variant, source: String, target_index: int = -1, acting_enemy_index: int = -1) -> Array:
	var results: Array = []

	for effect in effects:
		if not (effect is Dictionary):
			continue

		var effect_dict := effect as Dictionary
		var repeat := maxi(1, int(effect_dict.get("repeat", 1)))
		for _i in range(repeat):
			var result := _apply_one(effect_dict, battle, source, target_index, acting_enemy_index)
			if not result.is_empty():
				results.append(result)

	return results


static func _apply_one(effect: Dictionary, battle: Variant, source: String, target_index: int, acting_enemy_index: int) -> Dictionary:
	match str(effect.get("type", "")):
		"damage":
			return _apply_damage(effect, battle, source, target_index, acting_enemy_index)
		"block":
			return _apply_block(effect, battle, source, target_index, acting_enemy_index)
		"draw":
			var amount := int(effect.get("value", 0))
			battle.draw_cards(amount)
			return { "type": "draw", "value": amount }
		"gain_strength":
			return _apply_strength(effect, battle, source, target_index, acting_enemy_index)
		"apply_status":
			return _apply_status(effect, battle, source, target_index, acting_enemy_index)
		_:
			return {}


static func _apply_damage(effect: Dictionary, battle: Variant, source: String, target_index: int, acting_enemy_index: int) -> Dictionary:
	var amount := int(effect.get("value", 0))
	if source == "player":
		amount += int(battle.player_strength)
		return battle.damage_enemy(target_index, amount)

	var enemy_index := acting_enemy_index
	if enemy_index >= 0:
		amount += int(battle.enemies[enemy_index].get("strength", 0))
	return battle.damage_player(amount)


static func _apply_block(effect: Dictionary, battle: Variant, source: String, _target_index: int, acting_enemy_index: int) -> Dictionary:
	var amount := int(effect.get("value", 0))
	if source == "player" or (str(effect.get("target", "")) == "self" and acting_enemy_index < 0):
		battle.player_block += amount
		return { "type": "player_block", "value": amount }

	if acting_enemy_index >= 0:
		battle.enemies[acting_enemy_index]["block"] = int(battle.enemies[acting_enemy_index].get("block", 0)) + amount
		return { "type": "enemy_block", "enemy_index": acting_enemy_index, "value": amount }

	return {}


static func _apply_strength(effect: Dictionary, battle: Variant, source: String, _target_index: int, acting_enemy_index: int) -> Dictionary:
	var amount := int(effect.get("value", 0))
	if source == "player" or acting_enemy_index < 0:
		battle.player_strength += amount
		return { "type": "player_strength", "value": amount }

	battle.enemies[acting_enemy_index]["strength"] = int(battle.enemies[acting_enemy_index].get("strength", 0)) + amount
	return { "type": "enemy_strength", "enemy_index": acting_enemy_index, "value": amount }


static func _apply_status(effect: Dictionary, battle: Variant, source: String, target_index: int, acting_enemy_index: int) -> Dictionary:
	var status_id := str(effect.get("status_id", ""))
	if status_id == "strength":
		return _apply_strength(effect, battle, source, target_index, acting_enemy_index)
	return {}
