extends RefCounted

const DeckRuntimeScript := preload("res://scripts/battle/deck_runtime.gd")


func name() -> String:
	return "DeckRuntime draw/discard/refill"


func run(ctx: Variant) -> void:
	var deck: Variant = DeckRuntimeScript.new()
	deck.set_seed(10)
	deck.setup([
		{ "instance_id": 1, "card_id": "strike" },
		{ "instance_id": 2, "card_id": "defend" },
		{ "instance_id": 3, "card_id": "heavy_strike" }
	])

	var first_draw: Array = deck.draw(2)
	ctx.assert_eq(first_draw.size(), 2, "draw returns requested cards")
	ctx.assert_eq(deck.hand.size(), 2, "drawn cards enter hand")
	ctx.assert_eq(deck.draw_pile.size(), 1, "draw pile count decreases")

	var played: Dictionary = deck.take_from_hand(0)
	ctx.assert_false(played.is_empty(), "take_from_hand returns a card")
	deck.discard(played)
	deck.discard_hand()
	ctx.assert_eq(deck.hand.size(), 0, "discard_hand clears hand")
	ctx.assert_eq(deck.discard_pile.size(), 2, "played and leftover hand cards enter discard")

	var second_draw: Array = deck.draw(3)
	ctx.assert_eq(second_draw.size(), 3, "draw refills from discard when draw pile is empty")
	ctx.assert_eq(deck.hand.size(), 3, "refilled cards enter hand")
	ctx.assert_eq(deck.discard_pile.size(), 0, "discard pile is consumed by refill")
