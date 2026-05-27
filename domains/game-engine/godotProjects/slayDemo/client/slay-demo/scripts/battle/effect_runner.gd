extends RefCounted
class_name EffectRunner

const StatusManagerScript := preload("res://scripts/battle/status_manager.gd")


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
	var base_amount := int(effect.get("value", 0))
	var final_amount := base_amount

	if source == "player":
		# 玩家攻击：计算玩家力量和敌人易伤
		var player_status: StatusManager = battle.player_status
		final_amount = player_status.calculate_damage(base_amount, true)

		# 应用敌人易伤（如果敌人有易伤状态）
		if target_index >= 0 and target_index < battle.enemies.size():
			var enemy: Dictionary = battle.enemies[target_index]
			if enemy.has("status_manager"):
				var enemy_status: StatusManager = enemy["status_manager"]
				final_amount = enemy_status.calculate_damage(final_amount, false)

		return battle.damage_enemy(target_index, final_amount)
	else:
		# 敌人攻击：计算敌人力量和玩家易伤
		var enemy_index := acting_enemy_index
		if enemy_index >= 0 and enemy_index < battle.enemies.size():
			var enemy: Dictionary = battle.enemies[enemy_index]
			if enemy.has("status_manager"):
				var enemy_status: StatusManager = enemy["status_manager"]
				final_amount = enemy_status.calculate_damage(base_amount, true)

		# 应用玩家易伤（如果玩家有易伤状态）
		var player_status: StatusManager = battle.player_status
		final_amount = player_status.calculate_damage(final_amount, false)

		return battle.damage_player(final_amount)


static func _apply_block(effect: Dictionary, battle: Variant, source: String, _target_index: int, acting_enemy_index: int) -> Dictionary:
	var base_amount := int(effect.get("value", 0))
	var final_amount := base_amount

	if source == "player" or (str(effect.get("target", "")) == "self" and acting_enemy_index < 0):
		# 玩家获得格挡：计算敏捷和虚弱
		var player_status: StatusManager = battle.player_status
		final_amount = player_status.calculate_block(base_amount)
		battle.player_block += final_amount
		return { "type": "player_block", "value": final_amount, "base": base_amount }

	if acting_enemy_index >= 0:
		# 敌人获得格挡：计算敏捷和虚弱
		var enemy: Dictionary = battle.enemies[acting_enemy_index]
		if enemy.has("status_manager"):
			var enemy_status: StatusManager = enemy["status_manager"]
			final_amount = enemy_status.calculate_block(base_amount)
		enemy["block"] = int(enemy.get("block", 0)) + final_amount
		return { "type": "enemy_block", "enemy_index": acting_enemy_index, "value": final_amount, "base": base_amount }

	return {}


static func _apply_strength(effect: Dictionary, battle: Variant, source: String, _target_index: int, acting_enemy_index: int) -> Dictionary:
	var amount := int(effect.get("value", 0))
	if source == "player" or acting_enemy_index < 0:
		# 玩家获得力量
		var player_status: StatusManager = battle.player_status
		player_status.apply_status("strength", player_status.get_stacks("strength") + amount)
		return { "type": "player_strength", "value": amount }

	# 敌人获得力量
	var enemy: Dictionary = battle.enemies[acting_enemy_index]
	if enemy.has("status_manager"):
		var enemy_status: StatusManager = enemy["status_manager"]
		enemy_status.apply_status("strength", enemy_status.get_stacks("strength") + amount)
	return { "type": "enemy_strength", "enemy_index": acting_enemy_index, "value": amount }


static func _apply_status(effect: Dictionary, battle: Variant, source: String, target_index: int, acting_enemy_index: int) -> Dictionary:
	var status_id := str(effect.get("status_id", ""))
	var stacks := int(effect.get("value", 1))

	# 兼容旧的 strength 写法
	if status_id == "strength":
		return _apply_strength(effect, battle, source, target_index, acting_enemy_index)

	# 通用状态应用
	if source == "player":
		# 玩家施加状态给敌人
		if target_index >= 0 and target_index < battle.enemies.size():
			var enemy: Dictionary = battle.enemies[target_index]
			if enemy.has("status_manager"):
				var enemy_status: StatusManager = enemy["status_manager"]
				enemy_status.apply_status(status_id, stacks)
				return { "type": "apply_status", "target": "enemy", "target_index": target_index, "status_id": status_id, "stacks": stacks }
	else:
		# 敌人施加状态给玩家
		if str(effect.get("target", "")) == "player":
			var player_status: StatusManager = battle.player_status
			player_status.apply_status(status_id, stacks)
			return { "type": "apply_status", "target": "player", "status_id": status_id, "stacks": stacks }

	return {}
