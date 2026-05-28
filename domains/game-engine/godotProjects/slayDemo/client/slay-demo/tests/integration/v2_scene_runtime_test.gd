extends Node

const TIMEOUT_FRAMES := 240
const FLOW_TIMEOUT_FRAMES := 6000


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

	var start_button: Button = _find_button_by_text(main_menu, "开始 V2 扩展局")
	if start_button == null:
		_fail("V2 start button was not generated in MainMenuScene.")
		return
	start_button.pressed.emit()

	var safety := 0
	var battle_count := 0
	var reward_count := 0
	var shop_count := 0
	var rest_count := 0
	while safety < FLOW_TIMEOUT_FRAMES:
		safety += 1
		await get_tree().process_frame

		var result_scene := _find_node_by_name(get_tree().root, "ResultScene")
		if result_scene != null:
			var game_state: Variant = _autoload("GameState")
			var summary: Dictionary = game_state.get_result_summary()
			if not bool(summary.get("won", false)):
				_fail("ResultScene loaded, but V2 run was not won: %s" % str(summary))
				return
			if int(summary.get("battle_wins", 0)) != 8:
				_fail("Expected 8 V2 battle wins, got summary: %s" % str(summary))
				return
			print("V2 scene runtime test passed. battles=%d rewards=%d shops=%d rests=%d summary=%s" % [battle_count, reward_count, shop_count, rest_count, str(summary)])
			get_tree().quit(0)
			return

		var battle_scene := _find_node_by_name(get_tree().root, "BattleScene")
		if battle_scene != null:
			battle_count += 1
			if not await _win_visible_battle(battle_scene):
				_fail("Could not win V2 battle %d through BattleScene automation." % battle_count)
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
			_visit_shop(shop_scene)
			await get_tree().process_frame
			continue

		var rest_scene := _find_node_by_name(get_tree().root, "RestScene")
		if rest_scene != null:
			rest_count += 1
			rest_scene.call("_on_heal_pressed")
			await get_tree().process_frame

	_fail("Full V2 scene flow did not reach ResultScene within timeout.")


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
	var incoming_damage := _incoming_damage(snapshot)
	var player_block := int(snapshot.get("player_block", 0))
	var player_hp := int(snapshot.get("player_hp", 0))
	var priorities := ["gain_strength", "gain_energy", "draw", "aoe_damage", "multi_damage", "damage", "block"]
	if incoming_damage > player_block and (incoming_damage >= 15 or player_hp <= 35):
		priorities = ["block", "gain_energy", "draw", "gain_strength", "aoe_damage", "multi_damage", "damage"]

	for priority in priorities:
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


func _incoming_damage(snapshot: Dictionary) -> int:
	var total := 0
	for enemy in snapshot.get("enemies", []):
		var enemy_dict := enemy as Dictionary
		var intent: Dictionary = enemy_dict.get("intent", {})
		if str(intent.get("type", "")) == "attack":
			total += int(intent.get("value", 0))
	return total


func _choose_reward(reward_scene: Node) -> bool:
	var choices: Array = reward_scene.get("_choices")
	if not choices.is_empty():
		reward_scene.call("_on_choice_pressed", _best_reward_index(choices))
		return true

	var skip_button: Button = _find_button_by_text(reward_scene, "跳过")
	if skip_button == null:
		return false
	skip_button.pressed.emit()
	return true


func _visit_shop(shop_scene: Node) -> void:
	var offers: Array = shop_scene.get("_offers")
	if not offers.is_empty():
		shop_scene.call("_on_buy_pressed", 0)
	shop_scene.call("_on_leave_pressed")


func _best_reward_index(choices: Array) -> int:
	for priority in ["gain_strength", "gain_energy", "draw", "aoe_damage", "multi_damage", "damage", "block"]:
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


func _autoload(name: String) -> Variant:
	return get_node_or_null("/root/%s" % name)


func _fail(message: String) -> void:
	printerr(message)
	get_tree().quit(1)
