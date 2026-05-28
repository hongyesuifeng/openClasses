extends Node

var active_run_id := "v1_fixed_run"


func start_new_run(run_id: String = "") -> void:
	if not run_id.is_empty():
		active_run_id = run_id

	var data_loader: Variant = _autoload("DataLoader")
	var game_state: Variant = _autoload("GameState")
	data_loader.load_all()
	var errors: PackedStringArray = data_loader.validate_all()
	if not errors.is_empty():
		for error in errors:
			push_error(error)
		return

	game_state.start_new_run(data_loader.get_run_config(active_run_id))
	enter_current_node()


func enter_current_node() -> void:
	var game_state: Variant = _autoload("GameState")
	var scene_router: Variant = _autoload("SceneRouter")
	var node: Dictionary = game_state.get_current_node()
	if node.is_empty():
		game_state.finish_run(true)
		scene_router.go_to("result")
		return

	match str(node.get("type", "")):
		"battle":
			scene_router.go_to("battle")
		"reward":
			scene_router.go_to("reward")
		"rest":
			scene_router.go_to("rest")
		"shop":
			scene_router.go_to("shop")
		"result":
			game_state.finish_run(true)
			scene_router.go_to("result")
		_:
			push_error("RunController: unsupported node type '%s'" % str(node.get("type", "")))


func get_current_encounter_id() -> String:
	var game_state: Variant = _autoload("GameState")
	return str(game_state.get_current_node().get("encounter_id", ""))


func get_current_reward_profile_id() -> String:
	var data_loader: Variant = _autoload("DataLoader")
	var game_state: Variant = _autoload("GameState")
	var node: Dictionary = game_state.get_current_node()
	if node.has("reward_profile_id"):
		return str(node.get("reward_profile_id", ""))

	var encounter: Dictionary = data_loader.get_encounter(str(node.get("encounter_id", "")))
	return str(encounter.get("reward_profile_id", ""))


func on_battle_won(remaining_hp: int) -> void:
	var game_state: Variant = _autoload("GameState")
	game_state.apply_post_battle_hp(remaining_hp)
	game_state.record_battle_win()
	game_state.advance_node()
	enter_current_node()


func on_battle_lost() -> void:
	var game_state: Variant = _autoload("GameState")
	var scene_router: Variant = _autoload("SceneRouter")
	game_state.finish_run(false)
	scene_router.go_to("result")


func complete_reward(card_id: String = "") -> void:
	var game_state: Variant = _autoload("GameState")
	if not card_id.is_empty():
		game_state.add_card_to_deck(card_id)
	game_state.advance_node()
	enter_current_node()


func get_current_rest_heal_percent() -> float:
	var game_state: Variant = _autoload("GameState")
	var node: Dictionary = game_state.get_current_node()
	return float(node.get("heal_percent", 0.3))


func complete_rest() -> void:
	var game_state: Variant = _autoload("GameState")
	game_state.advance_node()
	enter_current_node()


func complete_shop() -> void:
	var game_state: Variant = _autoload("GameState")
	game_state.advance_node()
	enter_current_node()


func _autoload(name: String) -> Variant:
	return get_node_or_null("/root/%s" % name)
