extends Node

const TIMEOUT_FRAMES := 240
const FLOW_TIMEOUT_FRAMES := 3000


func _ready() -> void:
	if has_node("/root/MCPRuntime"):
		get_node("/root/MCPRuntime").queue_free()

	var data_loader: Variant = _autoload("DataLoader")
	data_loader.load_all()
	var errors: PackedStringArray = data_loader.validate_all()
	if not errors.is_empty():
		_fail("Data validation failed: %s" % str(errors))
		return

	var main_menu: Node = load("res://scenes/main_menu/main_menu_scene.tscn").instantiate()
	get_tree().root.add_child.call_deferred(main_menu)
	await get_tree().process_frame
	get_tree().current_scene = main_menu

	var start_button: Button = _find_button_by_text(main_menu, "开始游戏")
	if start_button == null:
		_fail("Start button was not generated in MainMenuScene.")
		return
	start_button.pressed.emit()

	var safety := 0
	var battle_count := 0
	var reward_count := 0
	var map_count := 0
	var shop_count := 0
	var rest_count := 0
	var chest_count := 0
	while safety < FLOW_TIMEOUT_FRAMES:
		safety += 1
		await get_tree().process_frame

		var result_scene := _find_node_by_name(get_tree().root, "ResultScene")
		if result_scene != null:
			var game_state: Variant = _autoload("GameState")
			var summary: Dictionary = game_state.get_result_summary()
			if not bool(summary.get("won", false)):
				_fail("ResultScene loaded, but run was not won: %s" % str(summary))
				return
			if int(summary.get("completed_map_nodes", 0)) <= 0:
				_fail("Expected completed map nodes, got summary: %s" % str(summary))
				return
			print("Map scene runtime test passed. maps=%d battles=%d rewards=%d shops=%d rests=%d chests=%d summary=%s" % [map_count, battle_count, reward_count, shop_count, rest_count, chest_count, str(summary)])
			get_tree().quit(0)
			return

		var map_scene := _find_node_by_name(get_tree().root, "MapScene")
		if map_scene != null:
			map_count += 1
			if not _choose_map_node(map_scene):
				_fail("MapScene did not expose a selectable node.")
				return
			await get_tree().process_frame
			continue

		var battle_scene := _find_node_by_name(get_tree().root, "BattleScene")
		if battle_scene != null:
			battle_count += 1
			if not await _win_visible_battle(battle_scene):
				_fail("Could not win battle %d through BattleScene automation." % battle_count)
				return
			continue

		var reward_scene := _find_node_by_name(get_tree().root, "RewardScene")
		if reward_scene != null:
			reward_count += 1
			if not _choose_reward(reward_scene):
				_fail("RewardScene did not generate selectable choices or skip button.")
				return
			await get_tree().process_frame
			continue

		var shop_scene := _find_node_by_name(get_tree().root, "ShopScene")
		if shop_scene != null:
			shop_count += 1
			shop_scene.call("_on_leave_pressed")
			await get_tree().process_frame
			continue

		var rest_scene := _find_node_by_name(get_tree().root, "RestScene")
		if rest_scene != null:
			rest_count += 1
			rest_scene.call("_on_heal_pressed")
			await get_tree().process_frame
			continue

		var chest_scene := _find_node_by_name(get_tree().root, "ChestScene")
		if chest_scene != null:
			chest_count += 1
			chest_scene.call("_on_open_pressed")
			await get_tree().process_frame
			continue

	_fail("Full scene flow did not reach ResultScene within timeout.")


func _win_visible_battle(battle_scene: Node) -> bool:
	for _frame in range(TIMEOUT_FRAMES):
		await get_tree().process_frame
		if not is_instance_valid(battle_scene):
			return true

		var battle: Variant = battle_scene.get("_battle")
		if battle == null:
			continue

		if str(battle.phase) == "won":
			return true
		if str(battle.phase) == "lost":
			return false

		if str(battle.phase) != "player":
			continue

		var acted := _play_best_visible_card(battle_scene, battle)
		if not acted:
			battle_scene.call("_on_end_turn_pressed")

	return false


func _play_best_visible_card(battle_scene: Node, battle: Variant) -> bool:
	var snapshot: Dictionary = battle.get_snapshot()
	var hand: Array = snapshot.get("hand", [])

	for priority in ["gain_strength", "damage", "draw", "block"]:
		for hand_index in range(hand.size()):
			var card := hand[hand_index] as Dictionary
			if not _card_matches_priority(card, priority):
				continue

			var target_index: int = _pick_enemy_target(battle) if str(card.get("target", "")) == "single_enemy" else -1
			if not battle.can_play_card(hand_index, target_index):
				continue

			battle_scene.call("_on_card_pressed", hand_index)
			if str(card.get("target", "")) == "single_enemy":
				battle_scene.call("_on_enemy_pressed", target_index)
			return true

	return false


func _choose_reward(reward_scene: Node) -> bool:
	var choices: Array = reward_scene.get("_choices")
	if not choices.is_empty():
		var best_index := _best_reward_index(choices)
		reward_scene.call("_on_choice_pressed", best_index)
		return true

	var skip_button: Button = _find_button_by_text(reward_scene, "跳过")
	if skip_button == null:
		return false
	skip_button.pressed.emit()
	return true


func _choose_map_node(_map_scene: Node) -> bool:
	var game_state: Variant = _autoload("GameState")
	var available: Array = game_state.get_available_map_nodes()
	if available.is_empty():
		return false

	var chosen := available[0] as Dictionary
	var run_controller: Variant = _autoload("RunController")
	run_controller.select_map_node(str(chosen.get("id", "")))
	return true


func _best_reward_index(choices: Array) -> int:
	for priority in ["gain_strength", "damage", "draw", "block"]:
		for index in range(choices.size()):
			var card := choices[index] as Dictionary
			if _card_matches_priority(card, priority):
				return index
	return 0


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


func _find_node_by_name(root: Node, node_name: String) -> Node:
	if root.name == node_name:
		return root
	for child in root.get_children():
		var found: Node = _find_node_by_name(child, node_name)
		if found != null:
			return found
	return null


func _find_button_by_text(root: Node, text: String) -> Button:
	if root is Button and (root as Button).text == text:
		return root as Button
	for child in root.get_children():
		var found: Button = _find_button_by_text(child, text)
		if found != null:
			return found
	return null


func _autoload(autoload_name: String) -> Variant:
	return get_node_or_null("/root/%s" % autoload_name)


func _fail(message: String) -> void:
	printerr(message)
	get_tree().quit(1)
