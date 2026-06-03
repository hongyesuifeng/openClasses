extends RefCounted

const BattleControllerScript := preload("res://scripts/battle/battle_controller.gd")
const RewardServiceScript := preload("res://scripts/reward/reward_service.gd")
const ShopServiceScript := preload("res://scripts/shop/shop_service.gd")


func name() -> String:
	return "V2 extended content run can complete"


func run(ctx: Variant) -> void:
	var data_loader: Variant = ctx.autoload("DataLoader")
	var game_state: Variant = ctx.autoload("GameState")
	var run_config: Dictionary = data_loader.get_run_config("v2_extended_run")
	ctx.assert_eq((run_config.get("nodes", []) as Array).size(), 19, "V2 run has fixed 19 nodes")

	game_state.start_new_run(run_config)

	var battles := 0
	var rewards := 0
	var rests := 0
	var shops := 0
	while true:
		var node: Dictionary = game_state.get_current_node()
		if node.is_empty():
			break

		match str(node.get("type", "")):
			"battle":
				battles += 1
				_win_battle_or_fail(ctx, str(node.get("encounter_id", "")), 900 + battles)
				game_state.advance_node()
			"reward":
				rewards += 1
				_choose_reward(ctx, str(node.get("reward_profile_id", "")))
				game_state.advance_node()
			"rest":
				rests += 1
				game_state.heal_player_percent(float(node.get("heal_percent", 0.3)))
				game_state.advance_node()
			"shop":
				shops += 1
				_visit_shop(ctx)
				game_state.advance_node()
			"result":
				game_state.finish_run(true)
				break
			_:
				ctx.fail("unsupported V2 node type: %s" % str(node.get("type", "")))
				return

	var summary: Dictionary = game_state.get_result_summary()
	ctx.assert_true(bool(summary.get("won", false)), "V2 run ends as victory")
	ctx.assert_eq(battles, 8, "V2 run covers 8 battles")
	ctx.assert_eq(rewards, 7, "V2 run covers 7 rewards")
	ctx.assert_eq(rests, 1, "V2 run covers boss prep rest")
	ctx.assert_eq(shops, 2, "V2 run covers 2 shops")
	ctx.assert_eq(int(summary.get("battle_wins", 0)), 8, "V2 run records 8 battle wins")
	ctx.assert_gt(int(summary.get("deck_size", 0)), 12, "V2 rewards grow the deck")


func _win_battle_or_fail(ctx: Variant, encounter_id: String, rng_seed: int) -> void:
	var game_state: Variant = ctx.autoload("GameState")
	var battle: Variant = BattleControllerScript.new()
	seed(rng_seed)
	battle.deck.set_seed(rng_seed)
	battle.setup(encounter_id, game_state.master_deck, {
		"hp": game_state.player_hp,
		"max_hp": game_state.player_max_hp,
		"energy_per_turn": game_state.energy_per_turn,
		"draw_per_turn": game_state.draw_per_turn,
		"relic_ids": game_state.owned_relic_ids
	})
	battle.start_combat()

	var won := _finish_battle(battle)
	ctx.assert_true(won, "%s is winnable in V2 run" % encounter_id)
	if won:
		game_state.apply_post_battle_hp(battle.player_hp)
		game_state.record_battle_win()


func _choose_reward(ctx: Variant, profile_id: String) -> void:
	var game_state: Variant = ctx.autoload("GameState")
	var choices: Array = RewardServiceScript.generate_card_choices(profile_id, game_state.master_deck)
	ctx.assert_eq(choices.size(), 3, "%s generates 3 reward choices" % profile_id)
	if choices.is_empty():
		return

	var card := choices[_best_reward_index(choices)] as Dictionary
	game_state.add_card_to_deck(str(card.get("id", "")))


func _visit_shop(ctx: Variant) -> void:
	var data_loader: Variant = ctx.autoload("DataLoader")
	var game_state: Variant = ctx.autoload("GameState")
	var offers: Array = ShopServiceScript.generate_card_offers(game_state.master_deck, data_loader)
	ctx.assert_eq(offers.size(), 3, "shop generates 3 offers in V2 run")
	if offers.is_empty():
		return

	var offer := offers[0] as Dictionary
	var card := offer.get("card", {}) as Dictionary
	var price := int(offer.get("price", 0))
	if int(game_state.player_gold) >= price:
		var bought: bool = ShopServiceScript.buy_card(game_state, str(card.get("id", "")), price)
		ctx.assert_true(bought, "V2 shop can buy first affordable offer")


func _finish_battle(battle: Variant) -> bool:
	var safety := 0
	while str(battle.phase) == "player" or str(battle.phase) == "enemy":
		safety += 1
		if safety > 300:
			return false

		if str(battle.phase) != "player":
			continue

		var played := false
		var snapshot: Dictionary = battle.get_snapshot()
		var hand: Array = snapshot.get("hand", [])
		# 先按优先级出牌，兜底：尝试打出手中任意一张可出的牌
		var priority_list := ["gain_strength", "gain_energy", "draw", "aoe_damage", "multi_damage", "damage", "heal", "block", "exhaust", "lose_hp", "_any"]
		for priority in priority_list:
			for hand_index in range(hand.size()):
				var card := hand[hand_index] as Dictionary
				if not _card_matches_priority(card, priority):
					continue
				var target_index: int = _pick_enemy_target(battle) if str(card.get("target", "")) == "single_enemy" else -1
				if battle.can_play_card(hand_index, target_index):
					battle.play_card(hand_index, target_index)
					played = true
					break
			if played:
				break

		if not played:
			battle.end_player_turn()

	return str(battle.phase) == "won"


func _best_reward_index(choices: Array) -> int:
	for priority in ["gain_strength", "gain_energy", "draw", "aoe_damage", "multi_damage", "damage", "apply_status", "heal", "block", "exhaust", "lose_hp"]:
		for index in range(choices.size()):
			var card := choices[index] as Dictionary
			if _card_matches_priority(card, priority):
				return index
	return 0


func _card_matches_priority(card: Dictionary, priority: String) -> bool:
	if priority == "_any":
		return true
	for effect in card.get("effects", []):
		if str((effect as Dictionary).get("type", "")) == priority:
			return true
	return false


func _pick_enemy_target(battle: Variant) -> int:
	var best_index := -1
	var best_hp := 999999
	for index in range(battle.enemies.size()):
		var enemy := battle.enemies[index] as Dictionary
		var hp: int = int(enemy.get("hp", 0))
		if hp > 0 and hp < best_hp:
			best_hp = hp
			best_index = index
	return best_index
