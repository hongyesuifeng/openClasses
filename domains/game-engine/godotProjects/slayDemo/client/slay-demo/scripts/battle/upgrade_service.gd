extends RefCounted
class_name UpgradeService

## 升级卡牌实例
static func upgrade_card_instance(card_instance: Dictionary, data_loader: Variant) -> bool:
	if card_instance.get("is_upgraded", false):
		return false  # 已经升级过

	var card_id := str(card_instance.get("card_id", ""))
	var card_data: Dictionary = data_loader.get_card(card_id)
	if card_data.is_empty():
		return false

	if not card_data.has("upgrade"):
		return false  # 没有升级定义

	card_instance["is_upgraded"] = true
	return true


## 获取可升级卡牌列表（从玩家牌组中）
static func get_upgradeable_cards(master_deck: Array, data_loader: Variant) -> Array:
	var result: Array = []

	for card_instance in master_deck:
		if not card_instance is Dictionary:
			continue

		var card_id := str(card_instance.get("card_id", ""))
		if card_id.is_empty():
			continue

		if bool(card_instance.get("is_upgraded", false)):
			continue  # 已升级

		var card_data: Dictionary = data_loader.get_card(card_id)
		if card_data.has("upgrade"):
			result.append(card_instance)

	return result


## 随机选择一张可升级的卡牌
static func pick_random_upgradeable(master_deck: Array, data_loader: Variant, rng: RandomNumberGenerator = null) -> Dictionary:
	var upgradeable := get_upgradeable_cards(master_deck, data_loader)
	if upgradeable.is_empty():
		return {}

	if rng == null:
		rng = RandomNumberGenerator.new()
		rng.randomize()

	return upgradeable[rng.randi() % upgradeable.size()]
