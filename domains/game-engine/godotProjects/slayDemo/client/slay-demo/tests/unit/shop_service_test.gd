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

	var remove_price: int = ShopServiceScript.remove_card_price(int(game_state.card_removal_count))
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

	## 楼层价格加成测试
	var common_card := {"rarity": "common", "id": "strike"}
	var price_floor0: int = ShopServiceScript.price_for_card(common_card, 0)
	var price_floor8: int = ShopServiceScript.price_for_card(common_card, 8)
	ctx.assert_true(price_floor8 > price_floor0, "floor 8 card price is higher than floor 0")
	ctx.assert_eq(price_floor8, price_floor0 + 24, "floor bonus is 3 gold per floor")

	## 删牌递增测试
	game_state.start_new_run(data_loader.get_run_config("v1_fixed_run"))
	game_state.player_gold = 999
	ctx.assert_eq(int(game_state.card_removal_count), 0, "removal count starts at 0 each run")

	var price_1st: int = ShopServiceScript.remove_card_price(int(game_state.card_removal_count))
	ctx.assert_eq(price_1st, 75, "first removal costs 75")

	var inst1 := int((game_state.master_deck[0] as Dictionary).get("instance_id", 0))
	ShopServiceScript.remove_card(game_state, inst1, price_1st)
	ctx.assert_eq(int(game_state.card_removal_count), 1, "removal count increments after remove")

	var price_2nd: int = ShopServiceScript.remove_card_price(int(game_state.card_removal_count))
	ctx.assert_eq(price_2nd, 100, "second removal costs 100")

	var inst2 := int((game_state.master_deck[0] as Dictionary).get("instance_id", 0))
	ShopServiceScript.remove_card(game_state, inst2, price_2nd)
	var price_3rd: int = ShopServiceScript.remove_card_price(int(game_state.card_removal_count))
	ctx.assert_eq(price_3rd, 125, "third removal costs 125")

	ctx.assert_true(ShopSceneScript != null, "ShopScene script compiles")
	ctx.assert_true(load("res://scenes/shop/shop_scene.tscn") != null, "ShopScene resource loads")

	## 药水商品生成测试
	var potion_offer: Dictionary = ShopServiceScript.generate_potion_offer(data_loader, 0)
	ctx.assert_false(potion_offer.is_empty(), "generate_potion_offer returns non-empty dict")
	ctx.assert_true(potion_offer.has("potion"), "potion offer has potion key")
	ctx.assert_true(potion_offer.has("price"), "potion offer has price key")
	ctx.assert_gt(int(potion_offer.get("price", 0)), 0, "potion offer price > 0")

	var potion_data := potion_offer.get("potion", {}) as Dictionary
	ctx.assert_false(str(potion_data.get("id", "")).is_empty(), "potion offer has valid id")

	## 楼层价格加成
	var price_fl0: int = ShopServiceScript.price_for_potion({"rarity": "common"}, 0)
	var price_fl5: int = ShopServiceScript.price_for_potion({"rarity": "common"}, 5)
	ctx.assert_eq(price_fl5, price_fl0 + 10, "potion floor bonus is 2 gold per floor")

	## buy_potion 成功路径
	game_state.start_new_run(data_loader.get_run_config("v1_fixed_run"))
	game_state.player_gold = 300
	var potion_id := str(potion_data.get("id", "potion_heal"))
	var bought_potion: bool = ShopServiceScript.buy_potion(game_state, potion_id, int(potion_offer.get("price", 0)))
	ctx.assert_true(bought_potion, "buy_potion succeeds with enough gold and empty slot")
	ctx.assert_eq(game_state.owned_potions.size(), 1, "buy_potion adds to owned_potions")

	## buy_potion 槽满时失败
	game_state.add_potion("potion_block")
	ctx.assert_false(game_state.can_add_potion(), "slots full after two potions")
	var failed_potion: bool = ShopServiceScript.buy_potion(game_state, "potion_heal", 50)
	ctx.assert_false(failed_potion, "buy_potion fails when slots full")
