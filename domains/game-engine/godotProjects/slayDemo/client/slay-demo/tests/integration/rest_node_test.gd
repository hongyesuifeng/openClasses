extends RefCounted

const UpgradeServiceScript := preload("res://scripts/battle/upgrade_service.gd")
const RestSceneScript := preload("res://scripts/scenes/rest_scene.gd")
const RestScene := preload("res://scenes/rest/rest_scene.tscn")


func name() -> String:
	return "Rest node rules"


func run(ctx: Variant) -> void:
	pass


func run_async(ctx: Variant) -> void:
	var data_loader: Variant = ctx.autoload("DataLoader")
	var game_state: Variant = ctx.autoload("GameState")
	var run_config: Dictionary = data_loader.get_run_config("v2_extended_run")
	var rest_node := _find_rest_node(run_config)
	ctx.assert_false(rest_node.is_empty(), "V2 run contains a rest node")
	ctx.assert_eq(float(rest_node.get("heal_percent", 0.0)), 0.3, "rest node heals 30 percent")

	game_state.start_new_run(run_config)
	game_state.player_hp = 30
	var expected_hp := 30 + int(ceil(game_state.player_max_hp * float(rest_node.get("heal_percent", 0.3))))
	game_state.heal_player_percent(float(rest_node.get("heal_percent", 0.3)))
	ctx.assert_eq(game_state.player_hp, expected_hp, "rest heal restores configured percent of max HP")

	var first_card := game_state.master_deck[0] as Dictionary
	ctx.assert_false(bool(first_card.get("is_upgraded", false)), "starter card begins unupgraded")
	var upgraded: bool = UpgradeServiceScript.upgrade_card_instance(first_card, data_loader)
	ctx.assert_true(upgraded, "rest upgrade can upgrade a card instance")
	ctx.assert_true(bool(first_card.get("is_upgraded", false)), "card instance is marked upgraded")
	ctx.assert_eq(str(data_loader.resolve_card_instance(first_card).get("name", "")), "魔法弹+", "upgraded card resolves upgraded data")

	ctx.assert_true(RestSceneScript != null, "RestScene script compiles")
	ctx.assert_true(RestScene != null, "RestScene resource loads")
	await _test_upgrade_choices_scroll(ctx, game_state)


func _test_upgrade_choices_scroll(ctx: Variant, game_state: Variant) -> void:
	for _index in range(10):
		game_state.add_card_to_deck("strike")

	var rest_scene: Control = RestScene.instantiate()
	rest_scene.set("_upgrade_mode", true)
	_tree().root.add_child.call_deferred(rest_scene)
	await _tree().process_frame

	var scroll: ScrollContainer = rest_scene.get("_choice_scroll")
	var choice_row: HBoxContainer = rest_scene.get("_choice_row")
	ctx.assert_true(scroll != null, "rest upgrade choices are wrapped in a scroll container")
	ctx.assert_eq(scroll.horizontal_scroll_mode, ScrollContainer.SCROLL_MODE_SHOW_ALWAYS, "rest upgrade choices expose a horizontal scrollbar")
	ctx.assert_eq(scroll.vertical_scroll_mode, ScrollContainer.SCROLL_MODE_DISABLED, "rest upgrade choices do not need vertical scrolling")
	ctx.assert_true(choice_row != null and choice_row.get_parent() == scroll, "upgrade card row is inside the scroll container")
	ctx.assert_true(choice_row.get_child_count() > 8, "scroll test has enough upgrade cards to overflow horizontally")
	rest_scene.queue_free()


func _find_rest_node(run_config: Dictionary) -> Dictionary:
	for node in run_config.get("nodes", []):
		var node_dict := node as Dictionary
		if str(node_dict.get("type", "")) == "rest":
			return node_dict
	return {}


func _tree() -> SceneTree:
	return Engine.get_main_loop() as SceneTree
