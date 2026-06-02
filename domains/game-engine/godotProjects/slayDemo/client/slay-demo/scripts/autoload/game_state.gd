extends Node

const RelicServiceScript := preload("res://scripts/relic/relic_service.gd")

var current_phase := "boot"
var current_node_index := 0
var player_max_hp := 60
var player_hp := 60
var player_gold := 0
var energy_per_turn := 3
var draw_per_turn := 5
var card_removal_count := 0
var master_deck: Array = []
var owned_relic_ids: Array[String] = []
var run_nodes: Array = []
var map_nodes: Array = []
var completed_map_node_ids: Array[String] = []
var available_map_node_ids: Array[String] = []
var current_map_node_id := ""
var pending_map_reward: Dictionary = {}
var pending_relic_reward: Dictionary = {}
var battle_wins := 0
var is_run_won := false
var is_run_finished := false


func start_new_run(run_config: Dictionary) -> void:
	var player: Dictionary = run_config.get("player", {})
	player_max_hp = int(player.get("max_hp", 60))
	player_hp = player_max_hp
	player_gold = int(player.get("gold", 0))
	energy_per_turn = int(player.get("energy_per_turn", 3))
	draw_per_turn = int(player.get("draw_per_turn", 5))
	current_node_index = 0
	battle_wins = 0
	is_run_won = false
	is_run_finished = false
	current_phase = "run"
	card_removal_count = 0
	run_nodes = (run_config.get("nodes", []) as Array).duplicate(true)
	map_nodes = (run_config.get("map_nodes", []) as Array).duplicate(true)
	completed_map_node_ids.clear()
	available_map_node_ids.clear()
	current_map_node_id = ""
	pending_map_reward.clear()
	pending_relic_reward.clear()
	master_deck.clear()
	owned_relic_ids.clear()

	var data_loader: Variant = _autoload("DataLoader")
	for card_id in run_config.get("start_deck", []):
		master_deck.append(data_loader.create_card_instance(str(card_id)))
	for relic_id in run_config.get("start_relics", []):
		add_relic(str(relic_id))

	if has_map():
		_unlock_starting_map_nodes()


func get_current_node() -> Dictionary:
	if has_map():
		if not pending_map_reward.is_empty():
			return pending_map_reward.duplicate(true)
		if current_map_node_id.is_empty():
			return {}
		return get_map_node(current_map_node_id)

	if current_node_index < 0 or current_node_index >= run_nodes.size():
		return {}
	return (run_nodes[current_node_index] as Dictionary).duplicate(true)


func advance_node() -> void:
	current_node_index += 1


func has_map() -> bool:
	return not map_nodes.is_empty()


func get_map_node(node_id: String) -> Dictionary:
	for node in map_nodes:
		var node_dict := node as Dictionary
		if str(node_dict.get("id", "")) == node_id:
			return node_dict.duplicate(true)
	return {}


func get_available_map_nodes() -> Array:
	var result: Array = []
	for node_id in available_map_node_ids:
		var node := get_map_node(node_id)
		if not node.is_empty():
			result.append(node)
	return result


func get_all_map_nodes() -> Array:
	return map_nodes.duplicate(true)


func can_select_map_node(node_id: String) -> bool:
	return available_map_node_ids.has(node_id) and not completed_map_node_ids.has(node_id)


func select_map_node(node_id: String) -> bool:
	if not can_select_map_node(node_id):
		return false
	var selected_node := get_map_node(node_id)
	var selected_floor := int(selected_node.get("floor", -1))
	for available_id in available_map_node_ids.duplicate():
		var available_node := get_map_node(str(available_id))
		if int(available_node.get("floor", -2)) == selected_floor:
			available_map_node_ids.erase(str(available_id))
	current_map_node_id = node_id
	return true


func prepare_map_reward(reward_profile_id: String) -> void:
	if reward_profile_id.is_empty():
		return
	pending_map_reward = {
		"id": "%s_reward" % current_map_node_id,
		"type": "reward",
		"reward_profile_id": reward_profile_id
	}


func has_pending_map_reward() -> bool:
	return not pending_map_reward.is_empty()


func complete_current_map_node() -> void:
	pending_map_reward.clear()
	if current_map_node_id.is_empty():
		return

	if not completed_map_node_ids.has(current_map_node_id):
		completed_map_node_ids.append(current_map_node_id)

	var node := get_map_node(current_map_node_id)
	for next_id in node.get("next_nodes", []):
		var next_node_id := str(next_id)
		if not available_map_node_ids.has(next_node_id) and not completed_map_node_ids.has(next_node_id):
			available_map_node_ids.append(next_node_id)

	current_map_node_id = ""


func current_map_node_is_final() -> bool:
	var node := get_map_node(current_map_node_id)
	return bool(node.get("is_final", false)) or (node.has("next_nodes") and (node.get("next_nodes", []) as Array).is_empty())


func add_card_to_deck(card_id: String) -> void:
	var data_loader: Variant = _autoload("DataLoader")
	var instance: Dictionary = data_loader.create_card_instance(card_id)
	if not instance.is_empty():
		master_deck.append(instance)
		var heal_amount := RelicServiceScript.get_effect_total(owned_relic_ids, data_loader, "card_gain_heal")
		if heal_amount > 0:
			heal_player(heal_amount)


func add_relic(relic_id: String) -> bool:
	if relic_id.is_empty() or owned_relic_ids.has(relic_id):
		return false

	var data_loader: Variant = _autoload("DataLoader")
	var relic: Dictionary = data_loader.get_relic(relic_id)
	if relic.is_empty():
		return false

	owned_relic_ids.append(relic_id)
	var max_hp_bonus := RelicServiceScript.get_effect_total([relic_id], data_loader, "max_hp")
	if max_hp_bonus > 0:
		player_max_hp += max_hp_bonus
		player_hp = mini(player_max_hp, player_hp + max_hp_bonus)
	return true


func set_pending_relic_reward(relic: Dictionary) -> void:
	pending_relic_reward = relic.duplicate(true)


func consume_pending_relic_reward() -> Dictionary:
	var relic := pending_relic_reward.duplicate(true)
	pending_relic_reward.clear()
	return relic


func has_pending_relic_reward() -> bool:
	return not pending_relic_reward.is_empty()


func get_owned_relics() -> Array:
	var data_loader: Variant = _autoload("DataLoader")
	var result: Array = []
	for relic_id in owned_relic_ids:
		var relic: Dictionary = data_loader.get_relic(relic_id)
		if not relic.is_empty():
			result.append(relic)
	return result


func remove_card_by_instance_id(instance_id: int) -> bool:
	for index in range(master_deck.size()):
		var card_instance := master_deck[index] as Dictionary
		if int(card_instance.get("instance_id", 0)) == instance_id:
			master_deck.remove_at(index)
			return true
	return false


func add_gold(amount: int) -> void:
	player_gold = maxi(0, player_gold + amount)


func spend_gold(amount: int) -> bool:
	if amount < 0 or player_gold < amount:
		return false
	player_gold -= amount
	return true


func record_battle_win() -> void:
	battle_wins += 1


func apply_post_battle_hp(hp: int) -> void:
	player_hp = clampi(hp, 0, player_max_hp)


func heal_player(amount: int) -> void:
	player_hp = clampi(player_hp + amount, 0, player_max_hp)


func heal_player_percent(percent: float) -> void:
	heal_player(int(ceil(player_max_hp * percent)))


func increment_removal_count() -> void:
	card_removal_count += 1


func finish_run(won: bool) -> void:
	is_run_won = won
	is_run_finished = true
	current_phase = "result"


func get_result_summary() -> Dictionary:
	return {
		"won": is_run_won,
		"battle_wins": battle_wins,
		"deck_size": master_deck.size(),
		"gold": player_gold,
		"player_hp": player_hp,
		"player_max_hp": player_max_hp,
		"relic_count": owned_relic_ids.size(),
		"completed_map_nodes": completed_map_node_ids.size()
	}


func _unlock_starting_map_nodes() -> void:
	var lowest_floor := 999999
	for node in map_nodes:
		var node_dict := node as Dictionary
		lowest_floor = mini(lowest_floor, int(node_dict.get("floor", 0)))

	for node in map_nodes:
		var node_dict := node as Dictionary
		if int(node_dict.get("floor", 0)) == lowest_floor:
			available_map_node_ids.append(str(node_dict.get("id", "")))


func _autoload(autoload_name: String) -> Variant:
	return get_node_or_null("/root/%s" % autoload_name)
