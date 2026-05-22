extends Node

var current_phase := "boot"
var current_node_index := 0
var player_max_hp := 60
var player_hp := 60
var player_gold := 0
var energy_per_turn := 3
var draw_per_turn := 5
var master_deck: Array = []
var run_nodes: Array = []
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
	run_nodes = (run_config.get("nodes", []) as Array).duplicate(true)
	master_deck.clear()

	var data_loader: Variant = _autoload("DataLoader")
	for card_id in run_config.get("start_deck", []):
		master_deck.append(data_loader.create_card_instance(str(card_id)))


func get_current_node() -> Dictionary:
	if current_node_index < 0 or current_node_index >= run_nodes.size():
		return {}
	return (run_nodes[current_node_index] as Dictionary).duplicate(true)


func advance_node() -> void:
	current_node_index += 1


func add_card_to_deck(card_id: String) -> void:
	var data_loader: Variant = _autoload("DataLoader")
	var instance: Dictionary = data_loader.create_card_instance(card_id)
	if not instance.is_empty():
		master_deck.append(instance)


func record_battle_win() -> void:
	battle_wins += 1


func apply_post_battle_hp(hp: int) -> void:
	player_hp = clampi(hp, 0, player_max_hp)


func finish_run(won: bool) -> void:
	is_run_won = won
	is_run_finished = true
	current_phase = "result"


func get_result_summary() -> Dictionary:
	return {
		"won": is_run_won,
		"battle_wins": battle_wins,
		"deck_size": master_deck.size(),
		"player_hp": player_hp,
		"player_max_hp": player_max_hp
	}


func _autoload(name: String) -> Variant:
	return get_node_or_null("/root/%s" % name)
