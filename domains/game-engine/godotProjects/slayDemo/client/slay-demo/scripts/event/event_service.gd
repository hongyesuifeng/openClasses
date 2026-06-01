extends RefCounted


static func apply_choice(choice: Dictionary, game_state: Variant, data_loader: Variant) -> Array[String]:
	var messages: Array[String] = []
	for effect in choice.get("effects", []):
		var effect_dict := effect as Dictionary
		var message := _apply_effect(effect_dict, game_state, data_loader)
		if not message.is_empty():
			messages.append(message)
	return messages


static func _apply_effect(effect: Dictionary, game_state: Variant, data_loader: Variant) -> String:
	match str(effect.get("type", "")):
		"lose_hp":
			var amount := int(effect.get("value", 0))
			game_state.apply_post_battle_hp(int(game_state.player_hp) - amount)
			return "失去 %d 点生命" % amount
		"gain_gold":
			var amount := int(effect.get("value", 0))
			game_state.add_gold(amount)
			return "获得 %d 金币" % amount
		"remove_card":
			var card_id := str(effect.get("card_id", ""))
			var removed_name := _remove_first_card(game_state, data_loader, card_id)
			return "移除 %s" % removed_name if not removed_name.is_empty() else "没有可移除的卡牌"
		"gain_card":
			var card_id := str(effect.get("card_id", ""))
			var card: Dictionary = data_loader.get_card(card_id)
			if card.is_empty():
				return "没有获得卡牌"
			game_state.add_card_to_deck(card_id)
			return "获得 %s" % str(card.get("name", card_id))
		"upgrade_card":
			var upgraded_name := _upgrade_first_card(game_state, data_loader, str(effect.get("card_id", "")))
			return "%s 已升级" % upgraded_name if not upgraded_name.is_empty() else "没有可升级的卡牌"
		_:
			return ""


static func _remove_first_card(game_state: Variant, data_loader: Variant, card_id: String) -> String:
	for card_instance in game_state.master_deck:
		var instance := card_instance as Dictionary
		if not card_id.is_empty() and str(instance.get("card_id", "")) != card_id:
			continue
		var card: Dictionary = data_loader.resolve_card_instance(instance)
		if game_state.remove_card_by_instance_id(int(instance.get("instance_id", 0))):
			return str(card.get("name", card_id))
	return ""


static func _upgrade_first_card(game_state: Variant, data_loader: Variant, card_id: String) -> String:
	for card_instance in game_state.master_deck:
		var instance := card_instance as Dictionary
		if bool(instance.get("is_upgraded", false)):
			continue
		if not card_id.is_empty() and str(instance.get("card_id", "")) != card_id:
			continue
		var card: Dictionary = data_loader.resolve_card_instance(instance)
		if card.is_empty() or not card.has("upgrade"):
			continue
		instance["is_upgraded"] = true
		return str(card.get("name", card_id))
	return ""
