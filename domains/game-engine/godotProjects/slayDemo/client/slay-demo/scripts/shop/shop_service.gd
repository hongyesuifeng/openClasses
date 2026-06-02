extends RefCounted
class_name ShopService

const REMOVE_CARD_BASE_PRICE := 75
const CARD_SLOTS := 3
const RELIC_BASE_PRICE := 150


static func generate_card_offers(owned_deck: Array, data_loader: Variant, slots := CARD_SLOTS, floor_index: int = 0) -> Array:
	var candidates: Array = []
	for card in data_loader.get_all_cards():
		var card_dict := card as Dictionary
		if str(card_dict.get("rarity", "")) == "starter":
			continue
		candidates.append(card_dict)

	candidates.sort_custom(func(a: Dictionary, b: Dictionary) -> bool:
		var score_a := _score_card(a, owned_deck)
		var score_b := _score_card(b, owned_deck)
		if score_a == score_b:
			return str(a.get("id", "")) < str(b.get("id", ""))
		return score_a > score_b
	)

	var offers: Array = []
	var seen := {}
	for card in candidates:
		var card_dict := card as Dictionary
		var card_id := str(card_dict.get("id", ""))
		if seen.has(card_id):
			continue
		seen[card_id] = true
		offers.append({
			"card": card_dict.duplicate(true),
			"price": price_for_card(card_dict, floor_index)
		})
		if offers.size() >= slots:
			break

	return offers


static func price_for_card(card: Dictionary, floor_index: int = 0) -> int:
	var base: int
	match str(card.get("rarity", "common")):
		"uncommon":
			base = 85
		"rare":
			base = 140
		_:
			base = 55
	return base + floor_index * 3


static func remove_card_price(removal_count: int = 0) -> int:
	return REMOVE_CARD_BASE_PRICE + maxi(0, removal_count) * 25


static func buy_card(game_state: Variant, card_id: String, price: int) -> bool:
	if card_id.is_empty() or not game_state.spend_gold(price):
		return false
	game_state.add_card_to_deck(card_id)
	return true


static func remove_card(game_state: Variant, instance_id: int, price: int) -> bool:
	if instance_id <= 0 or not game_state.spend_gold(price):
		return false
	if game_state.remove_card_by_instance_id(instance_id):
		game_state.increment_removal_count()
		return true
	game_state.add_gold(price)
	return false


static func generate_relic_offer(owned_relic_ids: Array, data_loader: Variant, floor_index: int = 0) -> Dictionary:
	const RelicServiceScript := preload("res://scripts/relic/relic_service.gd")
	var relic: Dictionary = RelicServiceScript.choose_relic_reward(owned_relic_ids, data_loader)
	if relic.is_empty():
		return {}
	return {
		"relic": relic.duplicate(true),
		"price": price_for_relic(relic, floor_index),
		"sold": false
	}


static func price_for_relic(relic: Dictionary, floor_index: int = 0) -> int:
	var base: int
	match str(relic.get("rarity", "common")):
		"uncommon": base = 200
		"rare":     base = 300
		_:          base = RELIC_BASE_PRICE
	return base + floor_index * 5


static func buy_relic(game_state: Variant, relic_id: String, price: int) -> bool:
	if relic_id.is_empty() or not game_state.spend_gold(price):
		return false
	return game_state.add_relic(relic_id)


static func _score_card(card: Dictionary, owned_deck: Array) -> int:
	var score := 10
	match str(card.get("rarity", "common")):
		"uncommon":
			score += 3
		"rare":
			score += 6

	var owned_count := 0
	for instance in owned_deck:
		if str((instance as Dictionary).get("card_id", "")) == str(card.get("id", "")):
			owned_count += 1

	return score - owned_count
