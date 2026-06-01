extends RefCounted

const EventServiceScript := preload("res://scripts/event/event_service.gd")
const EventScene := preload("res://scenes/event/event_scene.tscn")


func name() -> String:
	return "Event node rules"


func run(ctx: Variant) -> void:
	pass


func run_async(ctx: Variant) -> void:
	var data_loader: Variant = ctx.autoload("DataLoader")
	var game_state: Variant = ctx.autoload("GameState")
	data_loader.load_all()

	_test_event_node_config(ctx, game_state, data_loader)
	_test_event_effects(ctx, game_state, data_loader)
	await _test_event_scene_choice(ctx, game_state, data_loader)


func _test_event_node_config(ctx: Variant, game_state: Variant, data_loader: Variant) -> void:
	var run_config: Dictionary = data_loader.get_run_config("act1_map_run")
	game_state.start_new_run(run_config)
	var event_node: Dictionary = game_state.get_map_node("map_03b")
	ctx.assert_eq(str(event_node.get("type", "")), "event", "Act 1 map contains an event branch")
	ctx.assert_gt((event_node.get("choices", []) as Array).size(), 0, "event branch defines choices")


func _test_event_effects(ctx: Variant, game_state: Variant, data_loader: Variant) -> void:
	game_state.start_new_run(data_loader.get_run_config("act1_map_run"))
	var start_hp := int(game_state.player_hp)
	var start_gold := int(game_state.player_gold)
	var event_node: Dictionary = game_state.get_map_node("map_03b")
	var choice := ((event_node.get("choices", []) as Array)[0]) as Dictionary

	var messages: Array[String] = EventServiceScript.apply_choice(choice, game_state, data_loader)
	ctx.assert_eq(game_state.player_hp, start_hp - 6, "event can reduce player HP")
	ctx.assert_eq(game_state.player_gold, start_gold + 75, "event can grant gold")
	ctx.assert_true("\n".join(messages).contains("获得 75 金币"), "event service returns readable result messages")

	var remove_choice := ((event_node.get("choices", []) as Array)[1]) as Dictionary
	var before_deck_size: int = game_state.master_deck.size()
	EventServiceScript.apply_choice(remove_choice, game_state, data_loader)
	ctx.assert_eq(game_state.master_deck.size(), before_deck_size - 1, "event can remove a configured card")

	var gain_choice := ((event_node.get("choices", []) as Array)[2]) as Dictionary
	EventServiceScript.apply_choice(gain_choice, game_state, data_loader)
	ctx.assert_true(_deck_has_card(game_state.master_deck, "cleave"), "event can grant a configured card")


func _test_event_scene_choice(ctx: Variant, game_state: Variant, data_loader: Variant) -> void:
	game_state.start_new_run(data_loader.get_run_config("act1_map_run"))
	game_state.current_map_node_id = "map_03b"

	var event_scene: Control = EventScene.instantiate()
	event_scene.set("_auto_complete", false)
	_tree().root.add_child.call_deferred(event_scene)
	await _tree().process_frame

	var choice_row: HBoxContainer = event_scene.get("_choice_row")
	ctx.assert_true(choice_row != null, "event scene renders choice row")
	ctx.assert_eq(choice_row.get_child_count(), 3, "event scene renders configured choices")
	var first_button := choice_row.get_child(0) as Button
	first_button.pressed.emit()

	var status_label: Label = event_scene.get("_status_label")
	ctx.assert_true(status_label.text.contains("失去 6 点生命"), "event scene reports applied HP cost")
	ctx.assert_true(status_label.text.contains("获得 75 金币"), "event scene reports applied reward")
	ctx.assert_true(first_button.disabled, "event choice buttons are disabled after picking")
	event_scene.queue_free()


func _deck_has_card(deck: Array, card_id: String) -> bool:
	for card_instance in deck:
		if str((card_instance as Dictionary).get("card_id", "")) == card_id:
			return true
	return false


func _tree() -> SceneTree:
	return Engine.get_main_loop() as SceneTree
