extends RefCounted
class_name RewardService


static func generate_card_choices(profile_id: String, owned_deck: Array) -> Array:
	var data_loader: Variant = _autoload("DataLoader")
	var profile: Dictionary = data_loader.get_reward_profile(profile_id)
	var choice_count := int(profile.get("card_choices", 3))
	var candidates: Array = []

	for card in data_loader.get_all_cards():
		var card_dict := card as Dictionary
		if str(card_dict.get("rarity", "")) == "starter":
			continue
		candidates.append(card_dict)

	candidates.shuffle()
	candidates.sort_custom(func(a: Dictionary, b: Dictionary) -> bool:
		return _score_card(a, owned_deck) > _score_card(b, owned_deck)
	)

	var choices: Array = []
	var seen := {}
	for card in candidates:
		var id := str((card as Dictionary).get("id", ""))
		if seen.has(id):
			continue
		seen[id] = true
		choices.append((card as Dictionary).duplicate(true))
		if choices.size() >= choice_count:
			break

	return choices


static func _score_card(card: Dictionary, owned_deck: Array) -> int:
	var score := 10
	var rarity := str(card.get("rarity", "common"))
	if rarity == "uncommon":
		score += 3
	elif rarity == "rare":
		score += 6

	var owned_count := 0
	for instance in owned_deck:
		if str((instance as Dictionary).get("card_id", "")) == str(card.get("id", "")):
			owned_count += 1

	return score - owned_count


static func _autoload(name: String) -> Variant:
	var tree := Engine.get_main_loop() as SceneTree
	if tree == null:
		return null
	return tree.root.get_node_or_null(name)
