extends Node

const SAVE_PATH := "user://save.json"


static func has_save() -> bool:
	return FileAccess.file_exists(SAVE_PATH)


static func save(game_state: Variant, run_controller: Variant, data_loader: Variant) -> void:
	var save_data := {
		"run_id": str(run_controller.active_run_id),
		"next_card_instance_id": int(data_loader.get_next_instance_id()),
		"player_hp": int(game_state.player_hp),
		"player_max_hp": int(game_state.player_max_hp),
		"player_gold": int(game_state.player_gold),
		"energy_per_turn": int(game_state.energy_per_turn),
		"draw_per_turn": int(game_state.draw_per_turn),
		"card_removal_count": int(game_state.card_removal_count),
		"master_deck": _serialize_deck(game_state.master_deck),
		"owned_relic_ids": (game_state.owned_relic_ids as Array).duplicate(),
		"completed_map_node_ids": (game_state.completed_map_node_ids as Array).duplicate(),
		"available_map_node_ids": (game_state.available_map_node_ids as Array).duplicate(),
		"current_map_node_id": str(game_state.current_map_node_id),
		"pending_map_reward": (game_state.pending_map_reward as Dictionary).duplicate(true),
		"battle_wins": int(game_state.battle_wins),
		"current_phase": str(game_state.current_phase),
	}

	var json_text := JSON.stringify(save_data, "\t")
	var file := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if file == null:
		push_error("SaveService: cannot open %s for writing" % SAVE_PATH)
		return
	file.store_string(json_text)
	file.close()


static func load_save() -> Dictionary:
	if not FileAccess.file_exists(SAVE_PATH):
		return {}

	var file := FileAccess.open(SAVE_PATH, FileAccess.READ)
	if file == null:
		push_error("SaveService: cannot open %s for reading" % SAVE_PATH)
		return {}

	var parsed: Variant = JSON.parse_string(file.get_as_text())
	if not (parsed is Dictionary):
		push_error("SaveService: invalid save file")
		return {}

	return parsed as Dictionary


static func delete_save() -> void:
	if FileAccess.file_exists(SAVE_PATH):
		var dir := DirAccess.open("user://")
		if dir != null:
			dir.remove("save.json")


static func restore(save_data: Dictionary, game_state: Variant, run_controller: Variant, data_loader: Variant) -> void:
	data_loader.load_all()

	var run_id := str(save_data.get("run_id", "act1_map_run"))
	run_controller.active_run_id = run_id

	var next_id := int(save_data.get("next_card_instance_id", 1))
	data_loader.restore_instance_id_counter(next_id)

	var run_config: Dictionary = data_loader.get_run_config(run_id)
	game_state.map_nodes = (run_config.get("map_nodes", []) as Array).duplicate(true)
	game_state.run_nodes = (run_config.get("nodes", []) as Array).duplicate(true)

	game_state.player_hp = int(save_data.get("player_hp", 60))
	game_state.player_max_hp = int(save_data.get("player_max_hp", 60))
	game_state.player_gold = int(save_data.get("player_gold", 0))
	game_state.energy_per_turn = int(save_data.get("energy_per_turn", 3))
	game_state.draw_per_turn = int(save_data.get("draw_per_turn", 5))
	game_state.card_removal_count = int(save_data.get("card_removal_count", 0))
	game_state.battle_wins = int(save_data.get("battle_wins", 0))
	game_state.current_phase = str(save_data.get("current_phase", "run"))
	game_state.is_run_finished = false
	game_state.is_run_won = false
	game_state.current_node_index = 0

	game_state.master_deck = _deserialize_deck(save_data.get("master_deck", []))

	game_state.owned_relic_ids.clear()
	for relic_id in save_data.get("owned_relic_ids", []):
		game_state.owned_relic_ids.append(str(relic_id))

	game_state.completed_map_node_ids.clear()
	for node_id in save_data.get("completed_map_node_ids", []):
		game_state.completed_map_node_ids.append(str(node_id))

	game_state.available_map_node_ids.clear()
	for node_id in save_data.get("available_map_node_ids", []):
		game_state.available_map_node_ids.append(str(node_id))

	game_state.current_map_node_id = str(save_data.get("current_map_node_id", ""))

	var pending: Variant = save_data.get("pending_map_reward", {})
	if pending is Dictionary:
		game_state.pending_map_reward = (pending as Dictionary).duplicate(true)
	else:
		game_state.pending_map_reward = {}

	## 遗物的 max_hp 加成不重新触发（存档时已包含在 player_max_hp 里）


static func _serialize_deck(deck: Array) -> Array:
	var result: Array = []
	for card_instance in deck:
		var instance := card_instance as Dictionary
		result.append({
			"instance_id": int(instance.get("instance_id", 0)),
			"card_id": str(instance.get("card_id", "")),
			"is_upgraded": bool(instance.get("is_upgraded", false)),
		})
	return result


static func _deserialize_deck(raw: Variant) -> Array:
	var result: Array = []
	if not (raw is Array):
		return result
	for item in (raw as Array):
		if not (item is Dictionary):
			continue
		var d := item as Dictionary
		result.append({
			"instance_id": int(d.get("instance_id", 0)),
			"card_id": str(d.get("card_id", "")),
			"is_upgraded": bool(d.get("is_upgraded", false)),
		})
	return result
