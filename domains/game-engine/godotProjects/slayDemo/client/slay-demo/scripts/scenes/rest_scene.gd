extends Control

const UIThemeScript := preload("res://scripts/ui/ui_theme.gd")
const UILayoutStoreScript := preload("res://scripts/ui/ui_layout_store.gd")

const CardViewFactoryScript := preload("res://scripts/ui/card_view_factory.gd")
const UpgradeServiceScript := preload("res://scripts/battle/upgrade_service.gd")

## ── 新 UI 色板 ─────────────────────────────
const CLR_PINK        := Color(0.95, 0.55, 0.65)
const CLR_PINK_LIGHT  := Color(1.0, 0.71, 0.76)
const CLR_GOLD        := Color(1.0, 0.84, 0.0)
const CLR_TEXT_WARM   := Color(0.98, 0.92, 0.82)
const CLR_TINT        := Color(0.04, 0.02, 0.06, 0.35)
const CLR_PANEL_BG    := Color(0.14, 0.10, 0.22, 0.88)

var _status_label: Label
var _choice_scroll: ScrollContainer
var _choice_row: HBoxContainer
var _upgradeable_cards: Array = []
var _upgrade_mode := false
var _selected_upgrade_index := -1
var _confirm_upgrade_button: Button
var _compare_panel: Control = null  ## 升级对比面板


func _ready() -> void:
	var audio_manager: Variant = _autoload("AudioManager")
	if audio_manager != null:
		audio_manager.play_bgm("rest")
	_refresh_upgradeable_cards()
	_build()


func _build() -> void:
	var background := TextureRect.new()
	background.texture = load("res://assets/backgrounds/bg_map.png")
	background.set_anchors_preset(Control.PRESET_FULL_RECT)
	background.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	background.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	add_child(background)

	var tint := ColorRect.new()
	tint.color = CLR_TINT
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
	title.add_theme_color_override("font_color", CLR_PINK_LIGHT)
	title.add_theme_color_override("font_shadow_color", Color(0.5, 0.2, 0.35, 0.8))
	title.add_theme_constant_override("shadow_offset_x", 2)
	title.add_theme_constant_override("shadow_offset_y", 2)
	UIThemeScript.apply_cn(title)
	root.add_child(title)
	UILayoutStoreScript.apply_layout(title, "rest.title")

	_status_label = Label.new()
	_status_label.text = _status_text()
	_status_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_status_label.add_theme_font_size_override("font_size", 17)
	_status_label.add_theme_color_override("font_color", CLR_TEXT_WARM)
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
		_choice_row.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		_choice_row.alignment = BoxContainer.ALIGNMENT_CENTER
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
	var heal_button := _make_pink_button("回血 %d%%" % int(round(_heal_percent() * 100.0)), Vector2(240, 56))
	heal_button.pressed.connect(_on_heal_pressed)
	_choice_row.add_child(heal_button)

	var upgrade_button := _make_pink_button("升级卡牌 (%d)" % _upgradeable_cards.size(), Vector2(240, 56))
	upgrade_button.disabled = _upgradeable_cards.is_empty()
	upgrade_button.pressed.connect(_on_upgrade_mode_pressed)
	_choice_row.add_child(upgrade_button)


func _render_upgrade_choices() -> void:
	_clear_children(_choice_row)
	for index in range(_upgradeable_cards.size()):
		var card_instance := _upgradeable_cards[index] as Dictionary
		var data_loader: Variant = _autoload("DataLoader")
		var card_data: Dictionary = data_loader.resolve_card_instance(card_instance)
		var button: Button = CardViewFactoryScript.create_card_button(card_data, Vector2(180, 250), index == _selected_upgrade_index)
		button.pressed.connect(_on_upgrade_pressed.bind(index))
		_choice_row.add_child(button)


func _render_upgrade_back_button(root: VBoxContainer) -> void:
	var button_row := HBoxContainer.new()
	button_row.alignment = BoxContainer.ALIGNMENT_CENTER
	button_row.add_theme_constant_override("separation", 16)
	root.add_child(button_row)

	_confirm_upgrade_button = Button.new()
	_confirm_upgrade_button.text = "确认升级"
	_confirm_upgrade_button.custom_minimum_size = Vector2(160, 44)
	_confirm_upgrade_button.disabled = true
	_apply_pink_button_style(_confirm_upgrade_button)
	_confirm_upgrade_button.pressed.connect(_on_confirm_upgrade_pressed)
	button_row.add_child(_confirm_upgrade_button)

	var back_button := _make_action_button("返回", Vector2(140, 44))
	back_button.pressed.connect(_on_back_pressed)
	button_row.add_child(back_button)


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
	_status_label.text = "升级 %s" % str(card_data.get("name", ""))
	if _confirm_upgrade_button != null:
		_confirm_upgrade_button.disabled = false

	## 升级前后对比面板
	if _compare_panel != null and is_instance_valid(_compare_panel):
		_compare_panel.queue_free()
	_compare_panel = CardViewFactoryScript.create_upgrade_compare(card_data, Vector2(120, 168))
	var parent: Node = _choice_scroll.get_parent() if _choice_scroll != null else null
	if parent != null:
		parent.add_child(_compare_panel)
		parent.move_child(_compare_panel, _choice_scroll.get_index() + 1)

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


# ──────────────────────────────────────────────
## 粉色金边按钮
# ──────────────────────────────────────────────
func _make_pink_button(text: String, min_size: Vector2) -> Button:
	var btn := Button.new()
	btn.text = text
	btn.custom_minimum_size = min_size
	_apply_pink_button_style(btn)
	return btn


func _apply_pink_button_style(btn: Button) -> void:
	var style_normal := StyleBoxFlat.new()
	style_normal.bg_color = CLR_PINK
	style_normal.border_color = CLR_GOLD
	style_normal.set_border_width_all(2)
	style_normal.set_corner_radius_all(14)
	style_normal.content_margin_left = 14
	style_normal.content_margin_top = 8
	style_normal.content_margin_right = 14
	style_normal.content_margin_bottom = 8
	btn.add_theme_stylebox_override("normal", style_normal)
	btn.add_theme_color_override("font_color", Color(1.0, 1.0, 1.0))
	btn.add_theme_color_override("font_hover_color", CLR_GOLD)
	btn.add_theme_font_size_override("font_size", 18)
	var style_hover := style_normal.duplicate()
	style_hover.bg_color = Color(1.0, 0.65, 0.72)
	btn.add_theme_stylebox_override("hover", style_hover)
	var style_disabled := style_normal.duplicate()
	style_disabled.bg_color = Color(0.4, 0.35, 0.42, 0.7)
	btn.add_theme_stylebox_override("disabled", style_disabled)


## 灰色操作按钮
func _make_action_button(text: String, min_size: Vector2) -> Button:
	var btn := Button.new()
	btn.text = text
	btn.custom_minimum_size = min_size
	var style_normal := StyleBoxFlat.new()
	style_normal.bg_color = Color(0.25, 0.20, 0.32, 0.85)
	style_normal.border_color = Color(0.45, 0.38, 0.55, 0.8)
	style_normal.set_border_width_all(1)
	style_normal.set_corner_radius_all(14)
	style_normal.content_margin_left = 12
	style_normal.content_margin_top = 6
	style_normal.content_margin_right = 12
	style_normal.content_margin_bottom = 6
	btn.add_theme_stylebox_override("normal", style_normal)
	btn.add_theme_color_override("font_color", Color(0.88, 0.82, 0.92))
	btn.add_theme_font_size_override("font_size", 16)
	var style_hover := style_normal.duplicate()
	style_hover.bg_color = Color(0.35, 0.28, 0.42, 0.92)
	btn.add_theme_stylebox_override("hover", style_hover)
	return btn


func _rebuild() -> void:
	for child in get_children():
		child.queue_free()
	_build()


func _clear_children(node: Node) -> void:
	for child in node.get_children():
		child.queue_free()


func _autoload(autoload_name: String) -> Variant:
	return get_node_or_null("/root/%s" % autoload_name)
