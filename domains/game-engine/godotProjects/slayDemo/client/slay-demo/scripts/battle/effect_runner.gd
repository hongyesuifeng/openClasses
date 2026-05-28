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
		# 新增效果类型
		"heal":
			return _apply_heal(effect, battle, source, target_index, acting_enemy_index)
		"multi_damage":
			return _apply_multi_damage(effect, battle, source, target_index, acting_enemy_index)
		"aoe_damage":
			return _apply_aoe_damage(effect, battle, source, acting_enemy_index)
		"gain_energy":
			return _apply_gain_energy(effect, battle, source)
		"exhaust":
			return _apply_exhaust(effect, battle, source, target_index)
		_:
			return {}


static func _apply_damage(effect: Dictionary, battle: Variant, source: String, target_index: int, acting_enemy_index: int) -> Dictionary:
	var base_amount := int(effect.get("value", 0))
	var final_amount := base_amount

	if source == "player":
		var player_status: RefCounted = battle.player_status
		final_amount = player_status.call("calculate_damage", base_amount, true)

		if target_index >= 0 and target_index < battle.enemies.size():
			var enemy: Dictionary = battle.enemies[target_index]
			if enemy.has("status_manager"):
				var enemy_status: RefCounted = enemy["status_manager"]
				final_amount = enemy_status.call("calculate_damage", final_amount, false)

		return battle.damage_enemy(target_index, final_amount)
	else:
		var enemy_index := acting_enemy_index
		if enemy_index >= 0 and enemy_index < battle.enemies.size():
			var enemy: Dictionary = battle.enemies[enemy_index]
			if enemy.has("status_manager"):
				var enemy_status: RefCounted = enemy["status_manager"]
				final_amount = enemy_status.call("calculate_damage", base_amount, true)

		var player_status: RefCounted = battle.player_status
		final_amount = player_status.call("calculate_damage", final_amount, false)

		return battle.damage_player(final_amount)


static func _apply_block(effect: Dictionary, battle: Variant, source: String, _target_index: int, acting_enemy_index: int) -> Dictionary:
	var base_amount := int(effect.get("value", 0))
	var final_amount := base_amount

	if source == "player" or (str(effect.get("target", "")) == "self" and acting_enemy_index < 0):
		var player_status: RefCounted = battle.player_status
		final_amount = player_status.call("calculate_block", base_amount)
		battle.player_block += final_amount
		return { "type": "player_block", "value": final_amount, "base": base_amount }

	if acting_enemy_index >= 0:
		var enemy: Dictionary = battle.enemies[acting_enemy_index]
		if enemy.has("status_manager"):
			var enemy_status: RefCounted = enemy["status_manager"]
			final_amount = enemy_status.call("calculate_block", base_amount)
		enemy["block"] = int(enemy.get("block", 0)) + final_amount
		return { "type": "enemy_block", "enemy_index": acting_enemy_index, "value": final_amount, "base": base_amount }

	return {}


static func _apply_strength(effect: Dictionary, battle: Variant, source: String, _target_index: int, acting_enemy_index: int) -> Dictionary:
	var amount := int(effect.get("value", 0))
	if source == "player" or acting_enemy_index < 0:
		var player_status: RefCounted = battle.player_status
		player_status.call("apply_status", "strength", player_status.call("get_stacks", "strength") + amount)
		return { "type": "player_strength", "value": amount }

	var enemy: Dictionary = battle.enemies[acting_enemy_index]
	if enemy.has("status_manager"):
		var enemy_status: RefCounted = enemy["status_manager"]
		enemy_status.call("apply_status", "strength", enemy_status.call("get_stacks", "strength") + amount)
	return { "type": "enemy_strength", "enemy_index": acting_enemy_index, "value": amount }


static func _apply_status(effect: Dictionary, battle: Variant, source: String, target_index: int, acting_enemy_index: int) -> Dictionary:
	var status_id := str(effect.get("status_id", ""))
	var stacks := int(effect.get("value", 1))

	if status_id == "strength":
		return _apply_strength(effect, battle, source, target_index, acting_enemy_index)

	if source == "player":
		if target_index >= 0 and target_index < battle.enemies.size():
			var enemy: Dictionary = battle.enemies[target_index]
			if enemy.has("status_manager"):
				var enemy_status: RefCounted = enemy["status_manager"]
				enemy_status.call("apply_status", status_id, stacks)
				return { "type": "apply_status", "target": "enemy", "target_index": target_index, "status_id": status_id, "stacks": stacks }
	else:
		if str(effect.get("target", "")) == "player":
			var player_status: RefCounted = battle.player_status
			player_status.call("apply_status", status_id, stacks)
			return { "type": "apply_status", "target": "player", "status_id": status_id, "stacks": stacks }

	return {}


## 治疗：恢复生命值
static func _apply_heal(effect: Dictionary, battle: Variant, source: String, _target_index: int, acting_enemy_index: int) -> Dictionary:
	var amount := int(effect.get("value", 0))

	if source == "player":
		var old_hp: int = int(battle.player_hp)
		battle.player_hp = mini(battle.player_max_hp, battle.player_hp + amount)
		var actual_heal: int = int(battle.player_hp) - old_hp
		if actual_heal > 0:
			battle._log("玩家恢复 %d 点生命" % actual_heal)
		return { "type": "heal", "target": "player", "value": actual_heal }
	else:
		if acting_enemy_index >= 0 and acting_enemy_index < battle.enemies.size():
			var enemy: Dictionary = battle.enemies[acting_enemy_index]
			var old_hp := int(enemy.get("hp", 0))
			var max_hp := int(enemy.get("max_hp", 999))
			enemy["hp"] = mini(max_hp, old_hp + amount)
			var actual_heal := int(enemy["hp"]) - old_hp
			if actual_heal > 0:
				battle._log("%s 恢复 %d 点生命" % [str(enemy.get("name", "")), actual_heal])
			return { "type": "heal", "target": "enemy", "enemy_index": acting_enemy_index, "value": actual_heal }

	return {}


## 多段伤害：对同一目标造成多次伤害
static func _apply_multi_damage(effect: Dictionary, battle: Variant, source: String, target_index: int, acting_enemy_index: int) -> Dictionary:
	var base_damage := int(effect.get("value", 0))
	var hits := int(effect.get("hits", 2))
	var total_damage := 0

	for i in range(hits):
		var result := _apply_damage({"type": "damage", "value": base_damage}, battle, source, target_index, acting_enemy_index)
		total_damage += int(result.get("value", 0))

	return { "type": "multi_damage", "hits": hits, "total_damage": total_damage }


## AOE伤害：对所有敌人造成伤害
static func _apply_aoe_damage(effect: Dictionary, battle: Variant, source: String, acting_enemy_index: int) -> Dictionary:
	var base_damage := int(effect.get("value", 0))
	var results: Array = []

	# 对每个敌人造成伤害
	for i in range(battle.enemies.size()):
		if int(battle.enemies[i].get("hp", 0)) > 0:
			var result := _apply_damage({"type": "damage", "value": base_damage}, battle, source, i, acting_enemy_index)
			results.append(result)

	# 移除死亡敌人
	battle._remove_dead_enemies()

	return { "type": "aoe_damage", "base_damage": base_damage, "hits": results.size() }


## 获得能量：玩家/敌人获得额外能量
static func _apply_gain_energy(effect: Dictionary, battle: Variant, source: String) -> Dictionary:
	var amount := int(effect.get("value", 0))

	if source == "player":
		battle.energy += amount
		battle._log("获得 %d 点能量" % amount)
		return { "type": "gain_energy", "value": amount }

	return {}


## 消耗：消耗当前打出的卡牌（移入消耗堆而非弃牌堆）
static func _apply_exhaust(effect: Dictionary, battle: Variant, source: String, _target_index: int) -> Dictionary:
	if source != "player":
		return {}

	var target := str(effect.get("target", "current_card"))
	if target == "non_attack_hand":
		var exhausted := 0
		var data_loader: Variant = battle._autoload("DataLoader")
		for index in range(battle.deck.hand.size() - 1, -1, -1):
			var card_instance: Dictionary = battle.deck.hand[index]
			var card: Dictionary = data_loader.resolve_card_instance(card_instance) if data_loader != null else {}
			if str(card.get("type", "")) == "attack":
				continue

			var removed: Dictionary = battle.deck.take_from_hand(index)
			battle.deck.exhaust(removed)
			exhausted += 1

		if exhausted > 0:
			battle._log("消耗 %d 张非攻击牌" % exhausted)
		return { "type": "exhaust", "target": "non_attack_hand", "value": exhausted }

	if target == "all_hand":
		var exhausted := 0
		while not battle.deck.hand.is_empty():
			var removed: Dictionary = battle.deck.take_from_hand(0)
			battle.deck.exhaust(removed)
			exhausted += 1
		if exhausted > 0:
			battle._log("消耗 %d 张手牌" % exhausted)
		return { "type": "exhaust", "target": "all_hand", "value": exhausted }

	return { "type": "exhaust", "target": "current_card", "source": source }
