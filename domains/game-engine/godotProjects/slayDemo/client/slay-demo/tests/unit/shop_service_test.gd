extends RefCounted

const ShopServiceScript := preload("res://scripts/shop/shop_service.gd")
const ShopSceneScript := preload("res://scripts/scenes/shop_scene.gd")


func name() -> String:
	return "ShopService buy/remove rules"


func run(ctx: Variant) -> void:
	var data_loader: Variant = ctx.autoload("DataLoader")
	var game_state: Variant = ctx.autoload("GameState")
	game_state.start_new_run(data_loader.get_run_config("v1_fixed_run"))
	game_state.player_gold = 300

	var offers: Array = ShopServiceScript.generate_card_offers(game_state.master_deck, data_loader)
	ctx.assert_eq(offers.size(), 3, "shop generates 3 card offers")

	var first_offer := offers[0] as Dictionary
	var card := first_offer.get("card", {}) as Dictionary
	var price := int(first_offer.get("price", 0))
	var deck_size_before: int = game_state.master_deck.size()
	var gold_before: int = int(game_state.player_gold)
	var bought: bool = ShopServiceScript.buy_card(game_state, str(card.get("id", "")), price)
	ctx.assert_true(bought, "shop can buy an affordable card")
	ctx.assert_eq(game_state.master_deck.size(), deck_size_before + 1, "buying grows deck")
	ctx.assert_eq(int(game_state.player_gold), gold_before - price, "buying spends gold")

	var remove_price: int = ShopServiceScript.remove_card_price()
	var remove_instance_id := int((game_state.master_deck[0] as Dictionary).get("instance_id", 0))
	deck_size_before = game_state.master_deck.size()
	gold_before = int(game_state.player_gold)
	var removed: bool = ShopServiceScript.remove_card(game_state, remove_instance_id, remove_price)
	ctx.assert_true(removed, "shop can remove an affordable card")
	ctx.assert_eq(game_state.master_deck.size(), deck_size_before - 1, "removing shrinks deck")
	ctx.assert_eq(int(game_state.player_gold), gold_before - remove_price, "removing spends gold")

	game_state.player_gold = 0
	var failed_buy: bool = ShopServiceScript.buy_card(game_state, "heavy_strike", 55)
	ctx.assert_false(failed_buy, "shop rejects unaffordable card")

	ctx.assert_true(ShopSceneScript != null, "ShopScene script compiles")
	ctx.assert_true(load("res://scenes/shop/shop_scene.tscn") != null, "ShopScene resource loads")
