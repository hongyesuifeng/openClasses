extends Node

const BattleControllerScript := preload("res://scripts/battle/battle_controller.gd")
const RewardServiceScript := preload("res://scripts/reward/reward_service.gd")


func _ready() -> void:
	if has_node("/root/MCPRuntime"):
		get_node("/root/MCPRuntime").queue_free()

	var data_loader: Variant = _autoload("DataLoader")
	var game_state: Variant = _autoload("GameState")
	var errors: PackedStringArray = data_loader.validate_all()
	if not errors.is_empty():
		for error in errors:
			printerr(error)
		get_tree().quit(1)
		return

	var run_config: Dictionary = data_loader.get_run_config("v1_fixed_run")
	game_state.start_new_run(run_config)

	var first_battle: Variant = _create_battle("v1_normal_01", 101)
	first_battle.start_combat()

	var snapshot: Dictionary = first_battle.get_snapshot()
	if str(snapshot.get("phase", "")) != "player":
		printerr("Expected player phase after battle start.")
		get_tree().quit(1)
		return

	if (snapshot.get("hand", []) as Array).is_empty():
		printerr("Expected opening hand to contain cards.")
		get_tree().quit(1)
		return

	if not _finish_battle(first_battle):
		printerr("Expected first V1 battle to be winnable, got phase: %s" % str(first_battle.phase))
		get_tree().quit(1)
		return

	game_state.apply_post_battle_hp(first_battle.player_hp)
	game_state.record_battle_win()
	var choices: Array = RewardServiceScript.generate_card_choices("normal_card_reward", game_state.master_deck)
	if choices.size() != 3:
		printerr("Expected reward service to generate 3 choices.")
		get_tree().quit(1)
		return

	_add_test_reward("heavy_strike")

	for encounter_id in ["v1_normal_02", "v1_normal_03"]:
		var battle: Variant = _create_battle(encounter_id, 200 + game_state.battle_wins)
		battle.start_combat()
		if not _finish_battle(battle):
			printerr("Expected %s to be winnable, got phase: %s" % [encounter_id, str(battle.phase)])
			get_tree().quit(1)
			return
		game_state.apply_post_battle_hp(battle.player_hp)
		game_state.record_battle_win()
		_add_test_reward("inflame" if encounter_id == "v1_normal_02" else "heavy_strike")

	var boss_battle: Variant = _create_battle("v1_boss_01", 404)
	boss_battle.start_combat()
	if not _finish_battle(boss_battle):
		printerr("Expected V1 boss battle to be winnable, got phase: %s, player hp: %d" % [str(boss_battle.phase), int(boss_battle.player_hp)])
		get_tree().quit(1)
		return

	game_state.apply_post_battle_hp(boss_battle.player_hp)
	game_state.record_battle_win()
	game_state.finish_run(true)

	var summary: Dictionary = game_state.get_result_summary()
	if int(summary.get("battle_wins", 0)) != 4 or not bool(summary.get("won", false)):
		printerr("Expected complete V1 run summary, got: %s" % str(summary))
		get_tree().quit(1)
		return

	print("V1 smoke test passed.")
	get_tree().quit(0)


func _create_battle(encounter_id: String, seed: int) -> Variant:
	var game_state: Variant = _autoload("GameState")
	var battle: Variant = BattleControllerScript.new()
	battle.deck.set_seed(seed)
	var player_state: Dictionary = {
		"hp": game_state.player_hp,
		"max_hp": game_state.player_max_hp,
		"energy_per_turn": game_state.energy_per_turn,
		"draw_per_turn": game_state.draw_per_turn
	}
	battle.setup(encounter_id, game_state.master_deck, player_state)
	return battle


func _finish_battle(battle: Variant) -> bool:
	var safety := 0
	while str(battle.phase) == "player" or str(battle.phase) == "enemy":
		safety += 1
		if safety > 80:
			printerr("Battle smoke loop exceeded safety limit.")
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


func _add_test_reward(card_id: String) -> void:
	var data_loader: Variant = _autoload("DataLoader")
	var game_state: Variant = _autoload("GameState")
	if data_loader.get_card(card_id).is_empty():
		printerr("Missing test reward card: %s" % card_id)
		get_tree().quit(1)
		return
	game_state.add_card_to_deck(card_id)


func _autoload(name: String) -> Variant:
	return get_node_or_null("/root/%s" % name)
