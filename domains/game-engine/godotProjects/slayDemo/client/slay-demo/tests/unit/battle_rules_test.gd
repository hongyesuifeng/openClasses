extends RefCounted

const BattleControllerScript := preload("res://scripts/battle/battle_controller.gd")


func name() -> String:
	return "BattleController core rules"


func run(ctx: Variant) -> void:
	_test_damage_and_energy(ctx)
	_test_block_absorbs_damage(ctx)


func _test_damage_and_energy(ctx: Variant) -> void:
	var data_loader: Variant = ctx.autoload("DataLoader")
	var battle: Variant = BattleControllerScript.new()
	battle.deck.set_seed(1)
	battle.setup("v1_normal_01", [
		data_loader.create_card_instance("strike"),
		data_loader.create_card_instance("strike"),
		data_loader.create_card_instance("defend")
	], _player_state())
	battle.start_combat()

	var snapshot: Dictionary = battle.get_snapshot()
	ctx.assert_eq(str(snapshot.get("phase", "")), "player", "battle starts in player phase")
	ctx.assert_eq((snapshot.get("hand", []) as Array).size(), 3, "opening hand draws available deck")
	ctx.assert_false(battle.can_play_card(0, -1), "single-target attack needs a target")

	var strike_index: int = _find_card_index(snapshot.get("hand", []), "strike")
	ctx.assert_true(strike_index >= 0, "test hand contains strike")
	var enemy_hp_before: int = int(battle.enemies[0].get("hp", 0))
	var played: bool = battle.play_card(strike_index, 0)
	ctx.assert_true(played, "strike can be played against an enemy")
	ctx.assert_eq(battle.energy, 2, "playing a 1-cost card spends one energy")
	ctx.assert_eq(int(battle.enemies[0].get("hp", 0)), enemy_hp_before - 6, "strike deals 6 damage")


func _test_block_absorbs_damage(ctx: Variant) -> void:
	var battle: Variant = BattleControllerScript.new()
	battle.setup("v1_normal_01", [], _player_state())
	battle.player_block = 5
	battle.damage_player(8)
	ctx.assert_eq(battle.player_hp, 57, "block absorbs incoming damage first")
	ctx.assert_eq(battle.player_block, 0, "block is consumed by damage")


func _player_state() -> Dictionary:
	return {
		"hp": 60,
		"max_hp": 60,
		"energy_per_turn": 3,
		"draw_per_turn": 5
	}


func _find_card_index(hand: Array, card_id: String) -> int:
	for index in range(hand.size()):
		var card := hand[index] as Dictionary
		if str(card.get("id", "")) == card_id:
			return index
	return -1
