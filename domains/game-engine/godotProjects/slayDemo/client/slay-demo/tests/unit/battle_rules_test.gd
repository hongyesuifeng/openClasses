extends RefCounted

const BattleControllerScript := preload("res://scripts/battle/battle_controller.gd")


func name() -> String:
	return "BattleController core rules"


func run(ctx: Variant) -> void:
	_test_damage_and_energy(ctx)
	_test_block_absorbs_damage(ctx)
	_test_enemy_art_key_is_preserved(ctx)
	_test_barricade_retains_block(ctx)
	_test_exhaust_non_attack_hand(ctx)


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


func _test_enemy_art_key_is_preserved(ctx: Variant) -> void:
	var battle: Variant = BattleControllerScript.new()
	battle.setup("v1_normal_04", [], _player_state())
	ctx.assert_true(not battle.enemies.is_empty(), "encounter creates enemies")
	ctx.assert_eq(str((battle.enemies[0] as Dictionary).get("art_key", "")), "enemy_bat", "runtime enemy keeps configured art key")


func _test_barricade_retains_block(ctx: Variant) -> void:
	var data_loader: Variant = ctx.autoload("DataLoader")
	var battle: Variant = BattleControllerScript.new()
	battle.setup("v1_normal_01", [
		data_loader.create_card_instance("barricade"),
		data_loader.create_card_instance("defend")
	], _player_state())
	battle.start_combat()
	battle.energy = 4

	var barricade_index: int = _find_card_index(battle.get_snapshot().get("hand", []), "barricade")
	ctx.assert_true(barricade_index >= 0, "test hand contains barricade")
	ctx.assert_true(battle.play_card(barricade_index), "barricade can be played")
	battle.player_block = 12
	battle.start_player_turn()
	ctx.assert_eq(battle.player_block, 12, "barricade retains block at player turn start")


func _test_exhaust_non_attack_hand(ctx: Variant) -> void:
	var data_loader: Variant = ctx.autoload("DataLoader")
	var battle: Variant = BattleControllerScript.new()
	battle.setup("v1_normal_01", [], _player_state())
	battle.start_combat()
	battle.energy = 3
	battle.deck.hand = [
		data_loader.create_card_instance("sever_soul"),
		data_loader.create_card_instance("defend"),
		data_loader.create_card_instance("strike")
	]

	var enemy_hp_before: int = int(battle.enemies[0].get("hp", 0))
	var played: bool = battle.play_card(0, 0)
	ctx.assert_true(played, "sever soul can be played")
	ctx.assert_eq(battle.deck.exhaust_pile.size(), 1, "non-attack hand cards are exhausted")
	ctx.assert_eq(str((battle.deck.exhaust_pile[0] as Dictionary).get("card_id", "")), "defend", "defend is exhausted")
	ctx.assert_eq(battle.deck.discard_pile.size(), 1, "played sever soul is discarded")
	ctx.assert_eq(str((battle.deck.discard_pile[0] as Dictionary).get("card_id", "")), "sever_soul", "sever soul itself is not exhausted")
	ctx.assert_eq(battle.deck.hand.size(), 1, "attack cards remain in hand")
	ctx.assert_eq(str((battle.deck.hand[0] as Dictionary).get("card_id", "")), "strike", "strike remains in hand")
	ctx.assert_eq(int(battle.enemies[0].get("hp", 0)), enemy_hp_before - 16, "sever soul deals damage")


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
