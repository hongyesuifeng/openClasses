extends RefCounted
class_name DeckRuntime

var draw_pile: Array = []
var hand: Array = []
var discard_pile: Array = []
var exhaust_pile: Array = []
var _rng := RandomNumberGenerator.new()
var _fixed_seed := -1


func setup(master_deck: Array) -> void:
	if _fixed_seed >= 0:
		_rng.seed = _fixed_seed
	else:
		_rng.randomize()
	draw_pile = master_deck.duplicate(true)
	hand.clear()
	discard_pile.clear()
	exhaust_pile.clear()
	_shuffle_draw_pile()


func set_seed(rng_seed: int) -> void:
	_fixed_seed = rng_seed


func draw(count: int) -> Array:
	var drawn: Array = []
	for _i in range(count):
		if draw_pile.is_empty():
			_refill_draw_pile()
		if draw_pile.is_empty():
			break

		var card: Dictionary = draw_pile.pop_back()
		hand.append(card)
		drawn.append(card)

	return drawn


func take_from_hand(index: int) -> Dictionary:
	if index < 0 or index >= hand.size():
		return {}
	var card: Variant = hand.pop_at(index)
	if card is Dictionary:
		return card as Dictionary
	return {}


func discard(card: Dictionary) -> void:
	if not card.is_empty():
		discard_pile.append(card)


func exhaust(card: Dictionary) -> void:
	if not card.is_empty():
		exhaust_pile.append(card)


func discard_hand() -> void:
	var keep: Array = []
	while not hand.is_empty():
		var card: Variant = hand.pop_back()
		if card is Dictionary:
			var tags: Array = (card as Dictionary).get("tags", [])
			var has_retain := false
			for tag in tags:
				if str(tag) == "retain":
					has_retain = true
					break
			if has_retain and not (card as Dictionary).get("_retain_used", false):
				(card as Dictionary)["_retain_used"] = true
				keep.append(card)
				continue
			if card is Dictionary:
				(card as Dictionary).erase("_retain_used")
		discard_pile.append(card)
	hand.append_array(keep)


func get_counts() -> Dictionary:
	return {
		"draw": draw_pile.size(),
		"hand": hand.size(),
		"discard": discard_pile.size(),
		"exhaust": exhaust_pile.size()
	}


func _refill_draw_pile() -> void:
	if discard_pile.is_empty():
		return

	draw_pile = discard_pile.duplicate(true)
	discard_pile.clear()
	_shuffle_draw_pile()


func _shuffle_draw_pile() -> void:
	for index in range(draw_pile.size() - 1, 0, -1):
		var swap_index: int = _rng.randi_range(0, index)
		var temp: Variant = draw_pile[index]
		draw_pile[index] = draw_pile[swap_index]
		draw_pile[swap_index] = temp
