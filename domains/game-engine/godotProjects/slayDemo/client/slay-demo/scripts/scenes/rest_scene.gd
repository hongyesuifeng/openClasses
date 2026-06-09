extends Control

const _UIBuilder := preload("res://addons/ui_builder/ui_builder.gd")
const CardViewFactoryScript := preload("res://scripts/ui/card_view_factory.gd")
const UpgradeServiceScript := preload("res://scripts/battle/upgrade_service.gd")

const SPEC_PATH := "res://ui_specs/rest.ui.json"

var _status_label: Label
var _choice_row: HBoxContainer
var _choice_scroll: ScrollContainer
var _upgradeable_cards: Array = []
var _upgrade_mode := false
var _selected_upgrade_index := -1
var _confirm_upgrade_button: Button
var _compare_panel: Control = null
var _ui_root: Control


func _ready() -> void:
	var audio_manager: Variant = _autoload("AudioManager")
	if audio_manager != null:
		audio_manager.play_bgm("rest")
	_refresh_upgradeable_cards()
	_build()


func _build() -> void:
	_ui_root = _UIBuilder.build(SPEC_PATH)
	_ui_root.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(_ui_root)

	_status_label = _ui_root.find_child("StatusLabel", true, false) as Label
	if _status_label != null:
		_status_label.text = _status_text()

	_choice_row = _ui_root.find_child("ChoiceRow", true, false) as HBoxContainer
	if _upgrade_mode:
		_render_upgrade_choices()
	else:
		_render_rest_choices()


func handle_action(action_name: String, _source: Node) -> void:
	match action_name:
		"rest.on_heal":    _on_heal_pressed()
		"rest.on_upgrade_mode": _on_upgrade_mode_pressed()


func _render_rest_choices() -> void:
	if _choice_row == null:
		return
	_clear_children(_choice_row)

	var heal_btn := _make_pink_button("回血 %d%%" % int(round(_heal_percent() * 100.0)), Vector2(240, 56))
	heal_btn.pressed.connect(_on_heal_pressed)
	_choice_row.add_child(heal_btn)

	var upgrade_btn := _make_pink_button("升级卡牌 (%d)" % _upgradeable_cards.size(), Vector2(240, 56))
	upgrade_btn.disabled = _upgradeable_cards.is_empty()
	upgrade_btn.pressed.connect(_on_upgrade_mode_pressed)
	_choice_row.add_child(upgrade_btn)


func _render_upgrade_choices() -> void:
	if _choice_row == null:
		return
	_clear_children(_choice_row)

	## 确保 _choice_row 被 ScrollContainer 包裹（测试和运行时一致性）
	var parent := _choice_row.get_parent()
	if parent == null or not (parent is ScrollContainer):
		## 把 _choice_row 从当前位置移入新的 ScrollContainer
		var grandparent: Node = parent
		var insert_idx := 0
		if grandparent != null:
			insert_idx = _choice_row.get_index()
			grandparent.remove_child(_choice_row)

		var scroll := ScrollContainer.new()
		scroll.name = "UpgradeChoiceScroll"
		scroll.custom_minimum_size = Vector2(0, 286)
		scroll.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_SHOW_ALWAYS
		scroll.vertical_scroll_mode   = ScrollContainer.SCROLL_MODE_DISABLED
		scroll.follow_focus = true
		if grandparent != null:
			grandparent.add_child(scroll)
			grandparent.move_child(scroll, insert_idx)
		scroll.add_child(_choice_row)
		_choice_scroll = scroll
	else:
		_choice_scroll = parent as ScrollContainer
	for index in range(_upgradeable_cards.size()):
		var card_instance := _upgradeable_cards[index] as Dictionary
		var data_loader: Variant = _autoload("DataLoader")
		var card_data: Dictionary = data_loader.resolve_card_instance(card_instance)
		var button: Button = CardViewFactoryScript.create_card_button(card_data, Vector2(180, 250), index == _selected_upgrade_index)
		button.pressed.connect(_on_upgrade_pressed.bind(index))
		_choice_row.add_child(button)

	## 操作按钮行（confirm + back）
	var btn_parent: Node = _choice_row.get_parent()
	if btn_parent == null:
		return
	var btn_row := HBoxContainer.new()
	btn_row.alignment = BoxContainer.ALIGNMENT_CENTER
	btn_row.add_theme_constant_override("separation", 16)
	btn_parent.get_parent().add_child(btn_row) if btn_parent.get_parent() != null else btn_parent.add_child(btn_row)

	_confirm_upgrade_button = Button.new()
	_confirm_upgrade_button.text = "确认升级"
	_confirm_upgrade_button.custom_minimum_size = Vector2(160, 44)
	_confirm_upgrade_button.disabled = true
	_confirm_upgrade_button.pressed.connect(_on_confirm_upgrade_pressed)
	btn_row.add_child(_confirm_upgrade_button)

	var back_btn := _make_action_button("返回", Vector2(140, 44))
	back_btn.pressed.connect(_on_back_pressed)
	btn_row.add_child(back_btn)


func _on_heal_pressed() -> void:
	var game_state: Variant = _autoload("GameState")
	game_state.heal_player_percent(_heal_percent())
	var audio_manager: Variant = _autoload("AudioManager")
	if audio_manager != null:
		audio_manager.play_sfx("heal")
	_complete_rest()


func _on_upgrade_mode_pressed() -> void:
	_upgrade_mode = true
	_selected_upgrade_index = -1
	_rebuild()


func _on_back_pressed() -> void:
	_upgrade_mode = false
	_selected_upgrade_index = -1
	_rebuild()


func _on_upgrade_pressed(index: int) -> void:
	if index < 0 or index >= _upgradeable_cards.size():
		return
	_selected_upgrade_index = index
	var card_instance := _upgradeable_cards[index] as Dictionary
	var data_loader: Variant = _autoload("DataLoader")
	var card_data: Dictionary = data_loader.resolve_card_instance(card_instance)
	if _status_label != null:
		_status_label.text = "升级 %s" % str(card_data.get("name", ""))
	if _confirm_upgrade_button != null:
		_confirm_upgrade_button.disabled = false

	if _compare_panel != null and is_instance_valid(_compare_panel):
		_compare_panel.queue_free()
	_compare_panel = CardViewFactoryScript.create_upgrade_compare(card_data, Vector2(120, 168))
	var parent: Node = _choice_row.get_parent() if _choice_row != null else null
	if parent != null:
		parent.add_child(_compare_panel)
		parent.move_child(_compare_panel, _choice_row.get_index() + 1)

	_render_upgrade_choices()


func _on_confirm_upgrade_pressed() -> void:
	if _selected_upgrade_index < 0 or _selected_upgrade_index >= _upgradeable_cards.size():
		return
	var card_instance := _upgradeable_cards[_selected_upgrade_index] as Dictionary
	var data_loader: Variant = _autoload("DataLoader")
	if UpgradeServiceScript.upgrade_card_instance(card_instance, data_loader):
		var audio_manager: Variant = _autoload("AudioManager")
		if audio_manager != null:
			audio_manager.play_sfx("status_buff")
		_complete_rest()
	else:
		if _status_label != null:
			_status_label.text = "这张牌无法升级。"


func _complete_rest() -> void:
	var run_controller: Variant = _autoload("RunController")
	run_controller.call_deferred("complete_rest")


func _refresh_upgradeable_cards() -> void:
	var game_state: Variant = _autoload("GameState")
	var data_loader: Variant = _autoload("DataLoader")
	_upgradeable_cards = UpgradeServiceScript.get_upgradeable_cards(game_state.master_deck, data_loader)


func _heal_percent() -> float:
	var run_controller: Variant = _autoload("RunController")
	if run_controller == null:
		return 0.3
	return run_controller.get_current_rest_heal_percent()


func _status_text() -> String:
	var game_state: Variant = _autoload("GameState")
	var heal_amount := int(ceil(int(game_state.player_max_hp) * _heal_percent())) if game_state != null else 0
	var hp_text := "HP %d/%d" % [int(game_state.player_hp), int(game_state.player_max_hp)] if game_state != null else "HP -/-"
	return "%s  |  回血 +%d 或升级 1 张牌" % [hp_text, heal_amount]


func _make_pink_button(text: String, min_size: Vector2) -> Button:
	var btn := Button.new()
	btn.text = text
	btn.custom_minimum_size = min_size
	var s := StyleBoxFlat.new()
	s.bg_color = Color(0.95, 0.55, 0.65)
	s.border_color = Color(1.0, 0.84, 0.0)
	s.set_border_width_all(2)
	s.set_corner_radius_all(14)
	btn.add_theme_stylebox_override("normal", s)
	btn.add_theme_color_override("font_color", Color(1, 1, 1))
	btn.add_theme_font_size_override("font_size", 18)
	return btn


func _make_action_button(text: String, min_size: Vector2) -> Button:
	var btn := Button.new()
	btn.text = text
	btn.custom_minimum_size = min_size
	var s := StyleBoxFlat.new()
	s.bg_color = Color(0.25, 0.20, 0.32, 0.85)
	s.border_color = Color(0.45, 0.38, 0.55, 0.8)
	s.set_border_width_all(1)
	s.set_corner_radius_all(14)
	btn.add_theme_stylebox_override("normal", s)
	btn.add_theme_color_override("font_color", Color(0.88, 0.82, 0.92))
	btn.add_theme_font_size_override("font_size", 16)
	return btn


func _rebuild() -> void:
	for child in get_children():
		child.queue_free()
	_compare_panel = null
	_build()


func _clear_children(node: Node) -> void:
	for child in node.get_children():
		child.queue_free()


func _autoload(autoload_name: String) -> Variant:
	return get_node_or_null("/root/%s" % autoload_name)
