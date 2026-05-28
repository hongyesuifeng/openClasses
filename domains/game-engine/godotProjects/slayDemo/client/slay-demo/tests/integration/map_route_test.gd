extends RefCounted


func name() -> String:
	return "Act 1 map route rules"


func run(ctx: Variant) -> void:
	var data_loader: Variant = ctx.autoload("DataLoader")
	var game_state: Variant = ctx.autoload("GameState")
	var run_config: Dictionary = data_loader.get_run_config("act1_map_run")

	game_state.start_new_run(run_config)
	ctx.assert_true(game_state.add_relic("strawberry"), "can add a max-hp relic")
	ctx.assert_eq(game_state.player_max_hp, 90, "strawberry increases max hp")
	game_state.player_hp = 80
	ctx.assert_true(game_state.add_relic("meal_ticket"), "can add a card-gain relic")
	game_state.add_card_to_deck("strike")
	ctx.assert_eq(game_state.player_hp, 82, "meal ticket heals when a card is gained")
	ctx.assert_true(game_state.has_map(), "map run stores map nodes")
	ctx.assert_eq(game_state.get_available_map_nodes().size(), 1, "map starts with one selectable node")

	var first_node: Dictionary = game_state.get_available_map_nodes()[0]
	ctx.assert_eq(str(first_node.get("id", "")), "map_01", "first floor starts at map_01")
	ctx.assert_eq(str(game_state.get_map_node("map_03a").get("type", "")), "chest", "map contains a chest branch")
	ctx.assert_true(game_state.select_map_node("map_01"), "available map node can be selected")
	ctx.assert_eq(str(game_state.get_current_node().get("encounter_id", "")), "v1_normal_01", "selected map node becomes current battle")

	game_state.prepare_map_reward("normal_card_reward")
	ctx.assert_eq(str(game_state.get_current_node().get("type", "")), "reward", "map battle can route through reward")
	game_state.complete_current_map_node()

	var available_ids: Array[String] = []
	for node in game_state.get_available_map_nodes():
		available_ids.append(str((node as Dictionary).get("id", "")))
	ctx.assert_true(available_ids.has("map_02a"), "first branch unlocks map_02a")
	ctx.assert_true(available_ids.has("map_02b"), "first branch unlocks map_02b")
	ctx.assert_false(game_state.can_select_map_node("map_01"), "completed node cannot be selected again")

	ctx.assert_true(game_state.select_map_node("map_02a"), "one branch can be selected")
	ctx.assert_false(game_state.can_select_map_node("map_02b"), "same-floor alternatives are locked after branch selection")
