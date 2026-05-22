extends RefCounted
class_name BattleController

const DeckRuntimeScript := preload("res://scripts/battle/deck_runtime.gd")
const EffectRunnerScript := preload("res://scripts/battle/effect_runner.gd")
const EnemyAIScript := preload("res://scripts/battle/enemy_ai.gd")

signal state_changed(snapshot: Dictionary)
signal message_logged(message: String)
signal combat_won(remaining_hp: int)
signal combat_lost

var encounter_id := ""
var player_max_hp := 60
var player_hp := 60
var player_block := 0
var player_strength := 0
var energy := 0
var energy_per_turn := 3
var draw_per_turn := 5
var turn_number := 0
var phase := "setup"
var enemies: Array = []
var deck := DeckRuntimeScript.new()


func setup(p_encounter_id: String, master_deck: Array, player_state: Dictionary) -> void:
	encounter_id = p_encounter_id
	player_max_hp = int(player_state.get("max_hp", 60))
	player_hp = int(player_state.get("hp", player_max_hp))
	energy_per_turn = int(player_state.get("energy_per_turn", 3))
	draw_per_turn = int(player_state.get("draw_per_turn", 5))
	player_block = 0
	player_strength = 0
	turn_number = 0
	phase = "setup"
	enemies.clear()
	deck.setup(master_deck)

	var data_loader: Variant = _autoload("DataLoader")
	var encounter: Dictionary = data_loader.get_encounter(encounter_id)
	for enemy_id in encounter.get("enemy_ids", []):
		enemies.append(EnemyAIScript.initialize_enemy(data_loader.get_enemy(str(enemy_id))))


func start_combat() -> void:
	_log("遭遇开始: %s" % encounter_id)
	start_player_turn()


func start_player_turn() -> void:
	if phase == "won" or phase == "lost":
		return

	turn_number += 1
	phase = "player"
	energy = energy_per_turn
	player_block = 0
	draw_cards(draw_per_turn)
	_log("第 %d 回合: 玩家回合" % turn_number)
	_emit_state()


func draw_cards(count: int) -> void:
	deck.draw(count)


func can_play_card(hand_index: int, target_index: int = -1) -> bool:
	if phase != "player":
		return false
	if hand_index < 0 or hand_index >= deck.hand.size():
		return false

	var data_loader: Variant = _autoload("DataLoader")
	var card: Dictionary = data_loader.resolve_card_instance(deck.hand[hand_index])
	if card.is_empty():
		return false
	if int(card.get("cost", 0)) > energy:
		return false
	if str(card.get("target", "")) == "single_enemy" and not _is_valid_enemy_target(target_index):
		return false

	return true


func play_card(hand_index: int, target_index: int = -1) -> bool:
	if not can_play_card(hand_index, target_index):
		_log("无法打出这张牌。")
		_emit_state()
		return false

	var card_instance: Dictionary = deck.take_from_hand(hand_index)
	var data_loader: Variant = _autoload("DataLoader")
	var card: Dictionary = data_loader.resolve_card_instance(card_instance)
	energy -= int(card.get("cost", 0))
	_log("打出 %s" % str(card.get("name", card.get("id", ""))))
	EffectRunnerScript.apply_effects(card.get("effects", []), self, "player", target_index)
	deck.discard(card_instance)
	_remove_dead_enemies()

	if enemies.is_empty():
		phase = "won"
		_emit_state()
		combat_won.emit(player_hp)
		return true

	_emit_state()
	return true


func end_player_turn() -> void:
	if phase != "player":
		return

	deck.discard_hand()
	phase = "enemy"
	_log("敌人回合")
	_emit_state()

	for index in range(enemies.size()):
		if player_hp <= 0:
			break
		if int(enemies[index].get("hp", 0)) <= 0:
			continue

		var action: Dictionary = EnemyAIScript.current_action(enemies[index])
		_log("%s 使用 %s" % [str(enemies[index].get("name", "")), str(action.get("name", ""))])
		EffectRunnerScript.apply_effects(action.get("effects", []), self, "enemy", -1, index)
		EnemyAIScript.advance_intent(enemies[index])

	if player_hp <= 0:
		player_hp = 0
		phase = "lost"
		_emit_state()
		combat_lost.emit()
		return

	start_player_turn()


func damage_enemy(target_index: int, amount: int) -> Dictionary:
	if not _is_valid_enemy_target(target_index):
		return {}

	var enemy: Dictionary = enemies[target_index]
	var block: int = int(enemy.get("block", 0))
	var blocked: int = mini(block, amount)
	var hp_damage: int = maxi(0, amount - blocked)
	enemy["block"] = block - blocked
	enemy["hp"] = maxi(0, int(enemy.get("hp", 0)) - hp_damage)
	_log("%s 受到 %d 点伤害" % [str(enemy.get("name", "")), hp_damage])
	return { "type": "damage_enemy", "enemy_index": target_index, "value": hp_damage, "blocked": blocked }


func damage_player(amount: int) -> Dictionary:
	var blocked: int = mini(player_block, amount)
	var hp_damage: int = maxi(0, amount - blocked)
	player_block -= blocked
	player_hp = maxi(0, player_hp - hp_damage)
	_log("玩家受到 %d 点伤害" % hp_damage)
	return { "type": "damage_player", "value": hp_damage, "blocked": blocked }


func get_snapshot() -> Dictionary:
	var hand_snapshot: Array = []
	var data_loader: Variant = _autoload("DataLoader")
	for card_instance in deck.hand:
		var card: Dictionary = data_loader.resolve_card_instance(card_instance)
		card["instance_id"] = int((card_instance as Dictionary).get("instance_id", 0))
		hand_snapshot.append(card)

	var enemy_snapshot: Array = []
	for enemy in enemies:
		enemy_snapshot.append((enemy as Dictionary).duplicate(true))

	return {
		"phase": phase,
		"turn_number": turn_number,
		"player_hp": player_hp,
		"player_max_hp": player_max_hp,
		"player_block": player_block,
		"player_strength": player_strength,
		"energy": energy,
		"energy_per_turn": energy_per_turn,
		"hand": hand_snapshot,
		"piles": deck.get_counts(),
		"enemies": enemy_snapshot
	}


func _remove_dead_enemies() -> void:
	for index in range(enemies.size() - 1, -1, -1):
		if int(enemies[index].get("hp", 0)) <= 0:
			_log("%s 被击败" % str(enemies[index].get("name", "")))
			enemies.remove_at(index)


func _is_valid_enemy_target(target_index: int) -> bool:
	return target_index >= 0 and target_index < enemies.size() and int(enemies[target_index].get("hp", 0)) > 0


func _emit_state() -> void:
	state_changed.emit(get_snapshot())


func _log(message: String) -> void:
	message_logged.emit(message)


func _autoload(name: String) -> Variant:
	var tree := Engine.get_main_loop() as SceneTree
	if tree == null:
		return null
	return tree.root.get_node_or_null(name)
