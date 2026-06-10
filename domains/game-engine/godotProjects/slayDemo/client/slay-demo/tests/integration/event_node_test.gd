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
	_test_card_selection_flow(ctx, game_state, data_loader)
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

	## 测试新的 resolve_choice 方法
	var result: Variant = EventServiceScript.resolve_choice(choice, game_state, data_loader)
	ctx.assert_eq(game_state.player_hp, start_hp - 6, "event can reduce player HP")
	ctx.assert_eq(game_state.player_gold, start_gold + 75, "event can grant gold")
	ctx.assert_true("\n".join(result.messages).contains("获得 75 金币"), "event service returns readable result messages")

	## 测试移除卡牌（非选牌模式）
	var remove_choice := ((event_node.get("choices", []) as Array)[1]) as Dictionary
	var remove_result: Variant = EventServiceScript.resolve_choice(remove_choice, game_state, data_loader)
	ctx.assert_true(remove_result.needs_card_selection, "event can request removal selection from configured choice")
	ctx.assert_eq(remove_result.selection_type, "remove", "configured removal choice uses remove selection")

	## 测试升级卡牌
	var upgrade_choice := ((event_node.get("choices", []) as Array)[2]) as Dictionary
	var upgrade_result: Variant = EventServiceScript.resolve_choice(upgrade_choice, game_state, data_loader)
	ctx.assert_true(upgrade_result.needs_card_selection, "event can request upgrade selection from configured choice")
	ctx.assert_eq(upgrade_result.selection_type, "upgrade", "configured upgrade choice uses upgrade selection")


func _test_card_selection_flow(ctx: Variant, game_state: Variant, data_loader: Variant) -> void:
	game_state.start_new_run(data_loader.get_run_config("act1_map_run"))

	## 测试需要选牌的效果
	var selection_choice := {
		"label": "测试选牌",
		"description": "选择一张牌移除",
		"effects": [
			{ "type": "remove_card", "requires_selection": true }
		]
	}

	var result: Variant = EventServiceScript.resolve_choice(selection_choice, game_state, data_loader)
	ctx.assert_true(result.needs_card_selection, "event can request card selection")
	ctx.assert_eq(result.selection_type, "remove", "selection type is correct")

	## 获取可选卡牌列表
	var selectable: Array = EventServiceScript.get_selectable_cards(game_state, data_loader, "remove", "")
	ctx.assert_gt(selectable.size(), 0, "get_selectable_cards returns available cards")

	## 模拟选择第一张牌
	if selectable.size() > 0:
		var first_card := selectable[0] as Dictionary
		var instance_id: int = first_card.get("instance_id", 0)
		var message: String = EventServiceScript.apply_card_selection(
			"remove", instance_id, game_state, data_loader, selection_choice.effects, ""
		)
		ctx.assert_true(message.contains("移除"), "card selection applies removal")


func _test_event_scene_choice(ctx: Variant, game_state: Variant, data_loader: Variant) -> void:
	game_state.start_new_run(data_loader.get_run_config("act1_map_run"))
	var event_node: Dictionary = game_state.get_map_node("map_03b")
	game_state.pending_map_reward = event_node
	game_state.current_map_node_id = "map_03b"

	var event_scene: Control = EventScene.instantiate()
	event_scene.set("_auto_complete", false)
	_tree().root.add_child.call_deferred(event_scene)
	await _tree().process_frame
	await _tree().process_frame
	game_state.pending_map_reward = event_node
	game_state.current_map_node_id = "map_03b"
	event_scene.call("_render_event")
	await _tree().process_frame

	var choice_row: HBoxContainer = event_scene.get("_choice_row")
	ctx.assert_true(choice_row != null, "event scene renders choice row")
	if choice_row != null and choice_row.get_child_count() == 0:
		event_scene.call("_render_choices", event_node.get("choices", []))
	ctx.assert_eq(choice_row.get_child_count(), 3, "event scene renders configured choices")
	var first_button := choice_row.get_child(0) as Button
	first_button.pressed.emit()

	await _tree().process_frame

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
