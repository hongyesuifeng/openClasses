extends Node

const TIMEOUT_FRAMES := 180


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

	var start_button: Button = _find_button_by_text(main_menu, "开始新局")
	if start_button == null:
		_fail("Start button was not generated in MainMenuScene.")
		return
	start_button.pressed.emit()

	var battle_scene: Node = await _wait_for_scene("BattleScene")
	if battle_scene == null:
		_fail("BattleScene did not load after pressing start.")
		return

	if not await _win_visible_battle(battle_scene):
		_fail("Could not win first battle through BattleScene automation.")
		return

	var reward_scene: Node = await _wait_for_scene("RewardScene")
	if reward_scene == null:
		_fail("RewardScene did not load after first battle victory.")
		return

	var skip_button: Button = _find_button_by_text(reward_scene, "跳过")
	if skip_button == null:
		_fail("RewardScene did not generate skip button.")
		return

	print("Scene runtime test passed.")
	get_tree().quit(0)


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

			battle_scene.call("_on_card_pressed", hand_index)
			if str(card.get("target", "")) == "single_enemy":
				var target_index: int = _pick_enemy_target(battle)
				if target_index < 0:
					return false
				battle_scene.call("_on_enemy_pressed", target_index)
			return true

	return false


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


func _wait_for_scene(scene_name: String) -> Node:
	for _frame in range(TIMEOUT_FRAMES):
		await get_tree().process_frame
		var found: Node = _find_node_by_name(get_tree().root, scene_name)
		if found != null:
			return found
	return null


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


func _autoload(name: String) -> Variant:
	return get_node_or_null("/root/%s" % name)


func _fail(message: String) -> void:
	printerr(message)
	get_tree().quit(1)
