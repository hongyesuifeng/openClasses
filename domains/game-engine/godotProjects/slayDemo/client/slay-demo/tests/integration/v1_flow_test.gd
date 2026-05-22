extends RefCounted

const BattleControllerScript := preload("res://scripts/battle/battle_controller.gd")
const RewardServiceScript := preload("res://scripts/reward/reward_service.gd")


func name() -> String:
	return "V1 fixed run can complete"


func run(ctx: Variant) -> void:
	var data_loader: Variant = ctx.autoload("DataLoader")
	var game_state: Variant = ctx.autoload("GameState")

	game_state.start_new_run(data_loader.get_run_config("v1_fixed_run"))
	_win_battle_or_fail(ctx, "v1_normal_01", 101)

	var choices: Array = RewardServiceScript.generate_card_choices("normal_card_reward", game_state.master_deck)
	ctx.assert_eq(choices.size(), 3, "reward appears after first battle")
	game_state.add_card_to_deck("heavy_strike")

	_win_battle_or_fail(ctx, "v1_normal_02", 202)
	game_state.add_card_to_deck("inflame")

	_win_battle_or_fail(ctx, "v1_normal_03", 303)
	game_state.add_card_to_deck("heavy_strike")

	_win_battle_or_fail(ctx, "v1_boss_01", 404)
	game_state.finish_run(true)

	var summary: Dictionary = game_state.get_result_summary()
	ctx.assert_true(bool(summary.get("won", false)), "run ends as victory")
	ctx.assert_eq(int(summary.get("battle_wins", 0)), 4, "run records 4 battle wins")
	ctx.assert_gt(int(summary.get("deck_size", 0)), 5, "rewards grow the deck")


func _win_battle_or_fail(ctx: Variant, encounter_id: String, seed: int) -> void:
	var game_state: Variant = ctx.autoload("GameState")
	var battle: Variant = BattleControllerScript.new()
	battle.deck.set_seed(seed)
	battle.setup(encounter_id, game_state.master_deck, {
		"hp": game_state.player_hp,
		"max_hp": game_state.player_max_hp,
		"energy_per_turn": game_state.energy_per_turn,
		"draw_per_turn": game_state.draw_per_turn
	})
	battle.start_combat()

	var won := _finish_battle(battle)
	ctx.assert_true(won, "%s is winnable" % encounter_id)
	if won:
		game_state.apply_post_battle_hp(battle.player_hp)
		game_state.record_battle_win()


func _finish_battle(battle: Variant) -> bool:
	var safety := 0
	while str(battle.phase) == "player" or str(battle.phase) == "enemy":
		safety += 1
		if safety > 80:
			return false

		if str(battle.phase) != "player":
			continue

		var played := false
		var current_snapshot: Dictionary = battle.get_snapshot()
		var hand: Array = current_snapshot.get("hand", [])
		for priority in ["gain_strength", "damage", "draw", "block"]:
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


func _card_matches_priority(card: Dictionary, priority: String) -> bool:
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
