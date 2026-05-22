extends Control

const BattleControllerScript := preload("res://scripts/battle/battle_controller.gd")

var _battle := BattleControllerScript.new()
var _selected_card_index := -1
var _header_label: Label
var _enemy_row: HBoxContainer
var _hand_row: HBoxContainer
var _pile_label: Label
var _log_label: RichTextLabel
var _status_label: Label
var _messages: Array[String] = []


func _ready() -> void:
	_build()
	_battle.state_changed.connect(_on_state_changed)
	_battle.message_logged.connect(_on_message_logged)
	_battle.combat_won.connect(_on_combat_won)
	_battle.combat_lost.connect(_on_combat_lost)

	var game_state: Variant = _autoload("GameState")
	var run_controller: Variant = _autoload("RunController")
	var player_state := {
		"hp": game_state.player_hp,
		"max_hp": game_state.player_max_hp,
		"energy_per_turn": game_state.energy_per_turn,
		"draw_per_turn": game_state.draw_per_turn
	}
	_battle.setup(run_controller.get_current_encounter_id(), game_state.master_deck, player_state)
	_battle.start_combat()


func _build() -> void:
	var background := ColorRect.new()
	background.color = Color(0.07, 0.075, 0.08)
	background.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(background)

	var root := VBoxContainer.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.offset_left = 24
	root.offset_top = 18
	root.offset_right = -24
	root.offset_bottom = -18
	root.add_theme_constant_override("separation", 14)
	add_child(root)

	_header_label = Label.new()
	_header_label.add_theme_font_size_override("font_size", 22)
	root.add_child(_header_label)

	_status_label = Label.new()
	_status_label.add_theme_font_size_override("font_size", 16)
	root.add_child(_status_label)

	_enemy_row = HBoxContainer.new()
	_enemy_row.custom_minimum_size = Vector2(0, 210)
	_enemy_row.alignment = BoxContainer.ALIGNMENT_CENTER
	_enemy_row.add_theme_constant_override("separation", 18)
	root.add_child(_enemy_row)

	var lower := HBoxContainer.new()
	lower.size_flags_vertical = Control.SIZE_EXPAND_FILL
	lower.add_theme_constant_override("separation", 16)
	root.add_child(lower)

	_log_label = RichTextLabel.new()
	_log_label.custom_minimum_size = Vector2(320, 0)
	_log_label.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_log_label.fit_content = true
	lower.add_child(_log_label)

	var hand_panel := VBoxContainer.new()
	hand_panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	hand_panel.add_theme_constant_override("separation", 8)
	lower.add_child(hand_panel)

	_pile_label = Label.new()
	hand_panel.add_child(_pile_label)

	_hand_row = HBoxContainer.new()
	_hand_row.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_hand_row.add_theme_constant_override("separation", 8)
	hand_panel.add_child(_hand_row)

	var end_turn_button := Button.new()
	end_turn_button.text = "结束回合"
	end_turn_button.custom_minimum_size = Vector2(160, 44)
	end_turn_button.pressed.connect(_on_end_turn_pressed)
	hand_panel.add_child(end_turn_button)


func _on_state_changed(snapshot: Dictionary) -> void:
	_header_label.text = "HP %d/%d  格挡 %d  力量 %d  能量 %d/%d  回合 %d" % [
		int(snapshot.get("player_hp", 0)),
		int(snapshot.get("player_max_hp", 0)),
		int(snapshot.get("player_block", 0)),
		int(snapshot.get("player_strength", 0)),
		int(snapshot.get("energy", 0)),
		int(snapshot.get("energy_per_turn", 0)),
		int(snapshot.get("turn_number", 0))
	]

	var phase := str(snapshot.get("phase", ""))
	_status_label.text = "选择攻击牌后点击目标。当前阶段: %s" % phase
	_render_enemies(snapshot.get("enemies", []))
	_render_hand(snapshot.get("hand", []), phase)

	var piles: Dictionary = snapshot.get("piles", {})
	_pile_label.text = "抽牌堆 %d | 手牌 %d | 弃牌堆 %d | 消耗 %d" % [
		int(piles.get("draw", 0)),
		int(piles.get("hand", 0)),
		int(piles.get("discard", 0)),
		int(piles.get("exhaust", 0))
	]


func _render_enemies(enemies: Array) -> void:
	_clear_children(_enemy_row)
	for index in range(enemies.size()):
		var enemy := enemies[index] as Dictionary
		var intent: Dictionary = enemy.get("intent", {})
		var button := Button.new()
		button.custom_minimum_size = Vector2(190, 150)
		button.text = "%s\nHP %d/%d  格挡 %d\n意图: %s %d" % [
			str(enemy.get("name", "")),
			int(enemy.get("hp", 0)),
			int(enemy.get("max_hp", 0)),
			int(enemy.get("block", 0)),
			str(intent.get("name", "")),
			int(intent.get("value", 0))
		]
		button.pressed.connect(_on_enemy_pressed.bind(index))
		_enemy_row.add_child(button)


func _render_hand(hand: Array, phase: String) -> void:
	_clear_children(_hand_row)
	for index in range(hand.size()):
		var card := hand[index] as Dictionary
		var button := Button.new()
		button.custom_minimum_size = Vector2(150, 190)
		button.disabled = phase != "player"
		button.text = "[%d] %s\n%s\n%s" % [
			int(card.get("cost", 0)),
			str(card.get("name", "")),
			str(card.get("type", "")),
			str(card.get("description", ""))
		]
		button.pressed.connect(_on_card_pressed.bind(index))
		_hand_row.add_child(button)


func _on_card_pressed(index: int) -> void:
	var snapshot := _battle.get_snapshot()
	var hand: Array = snapshot.get("hand", [])
	if index < 0 or index >= hand.size():
		return

	var card := hand[index] as Dictionary
	if str(card.get("target", "")) == "single_enemy":
		_selected_card_index = index
		_status_label.text = "已选择 %s，点击一个敌人。" % str(card.get("name", ""))
	else:
		_battle.play_card(index)


func _on_enemy_pressed(index: int) -> void:
	if _selected_card_index < 0:
		return

	var played := _battle.play_card(_selected_card_index, index)
	if played:
		_selected_card_index = -1


func _on_end_turn_pressed() -> void:
	_selected_card_index = -1
	_battle.end_player_turn()


func _on_message_logged(message: String) -> void:
	_messages.append(message)
	if _messages.size() > 10:
		_messages.pop_front()
	_log_label.text = "\n".join(_messages)


func _on_combat_won(remaining_hp: int) -> void:
	_status_label.text = "战斗胜利"
	var run_controller: Variant = _autoload("RunController")
	run_controller.call_deferred("on_battle_won", remaining_hp)


func _on_combat_lost() -> void:
	_status_label.text = "战斗失败"
	var run_controller: Variant = _autoload("RunController")
	run_controller.call_deferred("on_battle_lost")


func _clear_children(node: Node) -> void:
	for child in node.get_children():
		child.queue_free()


func _autoload(name: String) -> Variant:
	return get_node_or_null("/root/%s" % name)
