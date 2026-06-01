extends RefCounted


## 事件效果类型枚举
enum EffectType {
	LOSE_HP,
	GAIN_GOLD,
	REMOVE_CARD,
	GAIN_CARD,
	UPGRADE_CARD,
	TRANSFORM_CARD  ## 新增：变换卡牌（删除一张，获得一张新的）
}

## 事件结果
class EventResult:
	var messages: Array[String] = []
	var needs_card_selection := false
	var selection_type := ""  ## "remove", "upgrade", "transform"
	var selection_filter := ""  ## 卡牌ID筛选（空表示任意）
	var pending_effects: Array = []  ## 待执行的后续效果
	var transform_card_id := ""  ## 变换后的目标卡牌ID

	func _init() -> void:
		pass


## 解析事件选择并返回结果
static func resolve_choice(choice: Dictionary, game_state: Variant, data_loader: Variant) -> EventResult:
	var result := EventResult.new()
	var effects: Array = choice.get("effects", [])

	for effect in effects:
		var effect_dict := effect as Dictionary
		var partial := _resolve_single_effect(effect_dict, game_state, data_loader, result)
		if not partial.is_empty():
			result.messages.append(partial)

	return result


## 解析单个效果，返回即时消息
static func _resolve_single_effect(effect: Dictionary, game_state: Variant, data_loader: Variant, result: EventResult) -> String:
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
			## 检查是否需要玩家选择
			var card_id := str(effect.get("card_id", ""))
			if effect.get("requires_selection", false) or card_id.is_empty():
				## 需要玩家选择
				result.needs_card_selection = true
				result.selection_type = "remove"
				result.selection_filter = card_id
				result.pending_effects.append(effect)
				return ""
			else:
				## 自动移除第一张匹配牌
				var removed_name := _remove_first_card(game_state, data_loader, card_id)
				return "移除 %s" % removed_name if not removed_name.is_empty() else "没有可移除的卡牌"

		"upgrade_card":
			var card_id := str(effect.get("card_id", ""))
			if effect.get("requires_selection", false) or card_id.is_empty():
				## 需要玩家选择
				result.needs_card_selection = true
				result.selection_type = "upgrade"
				result.selection_filter = card_id
				result.pending_effects.append(effect)
				return ""
			else:
				## 自动升级第一张匹配牌
				var upgraded_name := _upgrade_first_card(game_state, data_loader, card_id)
				return "%s 已升级" % upgraded_name if not upgraded_name.is_empty() else "没有可升级的卡牌"

		"transform_card":
			## 变换卡牌：删除一张牌，获得一张新牌
			var from_card_id := str(effect.get("from_card_id", ""))
			var to_card_id := str(effect.get("to_card_id", ""))
			if effect.get("requires_selection", false) or from_card_id.is_empty():
				result.needs_card_selection = true
				result.selection_type = "transform"
				result.selection_filter = from_card_id
				result.transform_card_id = to_card_id
				result.pending_effects.append(effect)
				return ""
			else:
				var removed_name := _remove_first_card(game_state, data_loader, from_card_id)
				if removed_name.is_empty():
					return "没有可变换的卡牌"
				game_state.add_card_to_deck(to_card_id)
				var to_card: Dictionary = data_loader.get_card(to_card_id)
				return "%s 变换为 %s" % [removed_name, str(to_card.get("name", to_card_id))]

		"gain_card":
			var card_id := str(effect.get("card_id", ""))
			var card: Dictionary = data_loader.get_card(card_id)
			if card.is_empty():
				return "没有获得卡牌"
			game_state.add_card_to_deck(card_id)
			return "获得 %s" % str(card.get("name", card_id))

		_:
			return ""


## 执行选牌后的效果
static func apply_card_selection(
	selection_type: String,
	selected_instance_id: int,
	game_state: Variant,
	data_loader: Variant,
	pending_effects: Array,
	transform_card_id: String = ""
) -> String:

	match selection_type:
		"remove":
			for effect in pending_effects:
				if str(effect.get("type", "")) == "remove_card":
					return _remove_card_by_instance_id(selected_instance_id, game_state, data_loader)
			return "移除失败"

		"upgrade":
			for effect in pending_effects:
				if str(effect.get("type", "")) == "upgrade_card":
					return _upgrade_card_by_instance_id(selected_instance_id, game_state, data_loader)
			return "升级失败"

		"transform":
			var removed_name := _remove_card_by_instance_id(selected_instance_id, game_state, data_loader)
			if removed_name.is_empty():
				return "变换失败"
			game_state.add_card_to_deck(transform_card_id)
			var to_card: Dictionary = data_loader.get_card(transform_card_id)
			return "%s 变换为 %s" % [removed_name, str(to_card.get("name", transform_card_id))]

		_:
			return "未知操作"


## 获取可选卡牌列表
static func get_selectable_cards(game_state: Variant, data_loader: Variant, selection_type: String, filter: String) -> Array:
	var result: Array = []
	var master_deck: Array = game_state.master_deck

	for card_instance in master_deck:
		var instance := card_instance as Dictionary
		var card_id := str(instance.get("card_id", ""))

		## 应用筛选
		if not filter.is_empty() and card_id != filter:
			continue

		match selection_type:
			"remove":
				## 所有卡牌都可以移除
				result.append(instance)
			"upgrade":
				## 只有未升级的卡牌可以升级
				if not bool(instance.get("is_upgraded", false)):
					var card: Dictionary = data_loader.resolve_card_instance(instance)
					if card.has("upgrade"):
						result.append(instance)
			"transform":
				## 所有卡牌都可以变换
				result.append(instance)

	return result


## 移除第一张匹配的卡牌
static func _remove_first_card(game_state: Variant, data_loader: Variant, card_id: String) -> String:
	for card_instance in game_state.master_deck:
		var instance := card_instance as Dictionary
		if not card_id.is_empty() and str(instance.get("card_id", "")) != card_id:
			continue
		var card: Dictionary = data_loader.resolve_card_instance(instance)
		if game_state.remove_card_by_instance_id(int(instance.get("instance_id", 0))):
			return str(card.get("name", card_id))
	return ""


## 升级第一张匹配的卡牌
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


## 通过 instance_id 移除卡牌
static func _remove_card_by_instance_id(instance_id: int, game_state: Variant, data_loader: Variant) -> String:
	for card_instance in game_state.master_deck:
		var instance := card_instance as Dictionary
		if int(instance.get("instance_id", 0)) == instance_id:
			var card: Dictionary = data_loader.resolve_card_instance(instance)
			if game_state.remove_card_by_instance_id(instance_id):
				return "移除 %s" % str(card.get("name", ""))
			break
	return "移除失败"


## 通过 instance_id 升级卡牌
static func _upgrade_card_by_instance_id(instance_id: int, game_state: Variant, data_loader: Variant) -> String:
	for card_instance in game_state.master_deck:
		var instance := card_instance as Dictionary
		if int(instance.get("instance_id", 0)) != instance_id:
			continue
		if bool(instance.get("is_upgraded", false)):
			return "这张牌已经升级过了"
		var card: Dictionary = data_loader.resolve_card_instance(instance)
		if card.is_empty() or not card.has("upgrade"):
			return "这张牌无法升级"
		instance["is_upgraded"] = true
		return "%s 已升级" % str(card.get("name", ""))
	return "升级失败"


## 保留旧方法以兼容现有代码
static func apply_choice(choice: Dictionary, game_state: Variant, data_loader: Variant) -> Array[String]:
	var result := resolve_choice(choice, game_state, data_loader)
	return result.messages
