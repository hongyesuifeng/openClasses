extends Node

const RelicServiceScript := preload("res://scripts/relic/relic_service.gd")
const MapGeneratorScript := preload("res://scripts/map/map_generator.gd")
const SaveServiceScript := preload("res://scripts/autoload/save_service.gd")

var active_run_id := "v1_fixed_run"
var use_generated_map := true  ## 是否使用随机生成的地图


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

	## 清除上一局的存档
	SaveServiceScript.delete_save()

	## 使用随机生成的地图或预设地图
	var run_config: Dictionary
	if use_generated_map:
		run_config = MapGeneratorScript.generate_map(randi(), 9)
	else:
		run_config = data_loader.get_run_config(active_run_id)

	game_state.start_new_run(run_config)
	if game_state.has_map():
		var scene_router: Variant = _autoload("SceneRouter")
		scene_router.go_to("map")
	else:
		enter_current_node()


func resume_run() -> void:
	var save_data: Dictionary = SaveServiceScript.load_save()
	if save_data.is_empty():
		push_error("RunController: no save data found, starting new run")
		start_new_run()
		return

	var data_loader: Variant = _autoload("DataLoader")
	var game_state: Variant = _autoload("GameState")
	SaveServiceScript.restore(save_data, game_state, self, data_loader)

	var scene_router: Variant = _autoload("SceneRouter")
	scene_router.go_to("map")


func select_map_node(node_id: String) -> void:
	var game_state: Variant = _autoload("GameState")
	if not game_state.select_map_node(node_id):
		push_error("RunController: map node '%s' is not selectable" % node_id)
		return
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
		"chest":
			scene_router.go_to("chest")
		"event":
			scene_router.go_to("event")
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
	_grant_battle_gold_reward()
	_apply_battle_win_relics()
	_grant_elite_relic_if_needed()
	if game_state.has_map():
		if game_state.current_map_node_is_final():
			game_state.complete_current_map_node()
			game_state.finish_run(true)
			SaveServiceScript.delete_save()
			var scene_router: Variant = _autoload("SceneRouter")
			scene_router.go_to("result")
			return

		var reward_profile_id := get_current_reward_profile_id()
		game_state.prepare_map_reward(reward_profile_id)
		_autosave()
		enter_current_node()
		return

	game_state.advance_node()
	_autosave()
	enter_current_node()


func on_battle_lost() -> void:
	var game_state: Variant = _autoload("GameState")
	var scene_router: Variant = _autoload("SceneRouter")
	game_state.finish_run(false)
	SaveServiceScript.delete_save()
	scene_router.go_to("result")


func complete_reward(card_id: String = "") -> void:
	var game_state: Variant = _autoload("GameState")
	if not card_id.is_empty():
		game_state.add_card_to_deck(card_id)
	if game_state.has_map() and game_state.has_pending_map_reward():
		game_state.complete_current_map_node()
		_autosave()
		var scene_router: Variant = _autoload("SceneRouter")
		scene_router.go_to("map")
		return

	game_state.advance_node()
	_autosave()
	enter_current_node()


func get_current_rest_heal_percent() -> float:
	var game_state: Variant = _autoload("GameState")
	var node: Dictionary = game_state.get_current_node()
	return float(node.get("heal_percent", 0.3))


func complete_rest() -> void:
	var game_state: Variant = _autoload("GameState")
	if game_state.has_map():
		game_state.complete_current_map_node()
		_autosave()
		var scene_router: Variant = _autoload("SceneRouter")
		scene_router.go_to("map")
		return

	game_state.advance_node()
	_autosave()
	enter_current_node()


func complete_shop() -> void:
	var game_state: Variant = _autoload("GameState")
	if game_state.has_map():
		game_state.complete_current_map_node()
		_autosave()
		var scene_router: Variant = _autoload("SceneRouter")
		scene_router.go_to("map")
		return

	game_state.advance_node()
	_autosave()
	enter_current_node()


func complete_chest() -> void:
	var game_state: Variant = _autoload("GameState")
	if game_state.has_map():
		game_state.complete_current_map_node()
		_autosave()
		var scene_router: Variant = _autoload("SceneRouter")
		scene_router.go_to("map")
		return

	game_state.advance_node()
	_autosave()
	enter_current_node()


func complete_event() -> void:
	var game_state: Variant = _autoload("GameState")
	if game_state.has_map():
		game_state.complete_current_map_node()
		_autosave()
		var scene_router: Variant = _autoload("SceneRouter")
		scene_router.go_to("map")
		return

	game_state.advance_node()
	_autosave()
	enter_current_node()


func _apply_battle_win_relics() -> void:
	var data_loader: Variant = _autoload("DataLoader")
	var game_state: Variant = _autoload("GameState")
	var bonus_gold := RelicServiceScript.get_effect_total(game_state.owned_relic_ids, data_loader, "battle_win_gold")
	if bonus_gold > 0:
		game_state.add_gold(bonus_gold)


func _grant_battle_gold_reward() -> void:
	var data_loader: Variant = _autoload("DataLoader")
	var game_state: Variant = _autoload("GameState")
	var encounter_id := get_current_encounter_id()
	var encounter: Dictionary = data_loader.get_encounter(encounter_id)
	var gold_reward: Dictionary = encounter.get("gold_reward", {})

	if gold_reward.is_empty():
		return

	var min_gold := int(gold_reward.get("min", 0))
	var max_gold := int(gold_reward.get("max", 0))

	if max_gold <= 0:
		return

	## 基于楼层增加金币 (后期战斗奖励更多)
	var floor_bonus := 0
	if game_state.has_map():
		var node: Dictionary = game_state.get_current_node()
		var floor_index := int(node.get("floor", 1))
		floor_bonus = int(floor_index * 1.5)

	## 随机金币
	var base_gold := randi_range(min_gold, max_gold)
	var total_gold := base_gold + floor_bonus

	game_state.add_gold(total_gold)
	print("战斗胜利获得 %d 金币 (基础: %d, 楼层加成: %d)" % [total_gold, base_gold, floor_bonus])


func _grant_elite_relic_if_needed() -> void:
	var data_loader: Variant = _autoload("DataLoader")
	var game_state: Variant = _autoload("GameState")
	var encounter_id := get_current_encounter_id()
	var encounter: Dictionary = data_loader.get_encounter(encounter_id)
	if str(encounter.get("encounter_type", "")) != "elite":
		return

	var relic: Dictionary = RelicServiceScript.choose_relic_reward(game_state.owned_relic_ids, data_loader)
	if relic.is_empty():
		return
	if game_state.add_relic(str(relic.get("id", ""))):
		print("获得遗物: %s" % str(relic.get("name", "")))


func _autoload(autoload_name: String) -> Variant:
	return get_node_or_null("/root/%s" % autoload_name)


func _autosave() -> void:
	var game_state: Variant = _autoload("GameState")
	var data_loader: Variant = _autoload("DataLoader")
	if game_state != null and data_loader != null:
		SaveServiceScript.save(game_state, self, data_loader)
