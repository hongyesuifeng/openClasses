extends Control

const CardViewFactoryScript := preload("res://scripts/ui/card_view_factory.gd")
const UpgradeServiceScript := preload("res://scripts/battle/upgrade_service.gd")

var _status_label: Label
var _choice_scroll: ScrollContainer
var _choice_row: HBoxContainer
var _upgradeable_cards: Array = []
var _upgrade_mode := false


func _ready() -> void:
	_refresh_upgradeable_cards()
	_build()


func _build() -> void:
	var background := TextureRect.new()
	background.texture = load("res://assets/backgrounds/bg_map.png")
	background.set_anchors_preset(Control.PRESET_FULL_RECT)
	background.stretch_mode = TextureRect.STRETCH_SCALE
	add_child(background)

	var tint := ColorRect.new()
	tint.color = Color(0.04, 0.045, 0.05, 0.58)
	tint.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(tint)

	var root := VBoxContainer.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.offset_left = 32
	root.offset_top = 28
	root.offset_right = -32
	root.offset_bottom = -28
	root.alignment = BoxContainer.ALIGNMENT_CENTER
	root.add_theme_constant_override("separation", 18)
	add_child(root)

	var title := Label.new()
	title.text = "休息点"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 34)
	title.add_theme_color_override("font_color", Color(0.98, 0.9, 0.72))
	root.add_child(title)

	_status_label = Label.new()
	_status_label.text = _status_text()
	_status_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_status_label.add_theme_font_size_override("font_size", 17)
	_status_label.add_theme_color_override("font_color", Color(0.92, 0.84, 0.72))
	root.add_child(_status_label)

	if _upgrade_mode:
		_choice_scroll = ScrollContainer.new()
		_choice_scroll.name = "UpgradeChoiceScroll"
		_choice_scroll.custom_minimum_size = Vector2(0, 286)
		_choice_scroll.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		_choice_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_SHOW_ALWAYS
		_choice_scroll.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
		_choice_scroll.follow_focus = true
		root.add_child(_choice_scroll)

		_choice_row = HBoxContainer.new()
		_choice_row.name = "UpgradeChoiceRow"
		_choice_row.add_theme_constant_override("separation", 18)
		_choice_scroll.add_child(_choice_row)

		_render_upgrade_choices()
		_render_upgrade_back_button(root)
	else:
		_choice_scroll = null
		_choice_row = HBoxContainer.new()
		_choice_row.alignment = BoxContainer.ALIGNMENT_CENTER
		_choice_row.add_theme_constant_override("separation", 18)
		root.add_child(_choice_row)

		_render_rest_choices()


func _render_rest_choices() -> void:
	var heal_button := Button.new()
	heal_button.text = "回血 %d%%" % int(round(_heal_percent() * 100.0))
	heal_button.custom_minimum_size = Vector2(220, 56)
	heal_button.pressed.connect(_on_heal_pressed)
	_choice_row.add_child(heal_button)

	var upgrade_button := Button.new()
	upgrade_button.text = "升级卡牌 (%d)" % _upgradeable_cards.size()
	upgrade_button.custom_minimum_size = Vector2(220, 56)
	upgrade_button.disabled = _upgradeable_cards.is_empty()
	upgrade_button.pressed.connect(_on_upgrade_mode_pressed)
	_choice_row.add_child(upgrade_button)


func _render_upgrade_choices() -> void:
	for index in range(_upgradeable_cards.size()):
		var card_instance := _upgradeable_cards[index] as Dictionary
		var data_loader: Variant = _autoload("DataLoader")
		var card_data: Dictionary = data_loader.resolve_card_instance(card_instance)
		var button: Button = CardViewFactoryScript.create_card_button(card_data, Vector2(190, 246))
		button.pressed.connect(_on_upgrade_pressed.bind(index))
		_choice_row.add_child(button)

func _render_upgrade_back_button(root: VBoxContainer) -> void:
	var back_button := Button.new()
	back_button.text = "返回"
	back_button.custom_minimum_size = Vector2(140, 44)
	back_button.pressed.connect(_on_back_pressed)
	root.add_child(back_button)


func _on_heal_pressed() -> void:
	var game_state: Variant = _autoload("GameState")
	game_state.heal_player_percent(_heal_percent())
	_complete_rest()


func _on_upgrade_mode_pressed() -> void:
	_upgrade_mode = true
	_rebuild()


func _on_back_pressed() -> void:
	_upgrade_mode = false
	_rebuild()


func _on_upgrade_pressed(index: int) -> void:
	if index < 0 or index >= _upgradeable_cards.size():
		return

	var card_instance := _upgradeable_cards[index] as Dictionary
	var data_loader: Variant = _autoload("DataLoader")
	if UpgradeServiceScript.upgrade_card_instance(card_instance, data_loader):
		_complete_rest()
	else:
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


func _rebuild() -> void:
	for child in get_children():
		child.queue_free()
	_build()


func _autoload(autoload_name: String) -> Variant:
	return get_node_or_null("/root/%s" % autoload_name)
