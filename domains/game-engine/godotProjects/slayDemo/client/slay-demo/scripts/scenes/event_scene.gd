extends Control

const _UIBuilder := preload("res://addons/ui_builder/ui_builder.gd")
const EventServiceScript    := preload("res://scripts/event/event_service.gd")
const CardViewFactoryScript := preload("res://scripts/ui/card_view_factory.gd")
const SF := preload("res://scripts/ui/ui_style_factory.gd")

const SPEC_PATH := "res://ui_specs/event.ui.json"

var _status_label: Label
var _content_container: VBoxContainer
var _choice_row: HBoxContainer
var _card_selection_scroll: ScrollContainer
var _card_selection_row: HBoxContainer
var _back_button: Button

var _resolved := false
var _in_card_selection := false
var _current_selection_type := ""
var _current_selection_filter := ""
var _pending_effects: Array = []
var _transform_card_id := ""
var _selectable_cards: Array = []
var _event_messages: Array[String] = []


func _ready() -> void:
	var audio_manager: Variant = _autoload("AudioManager")
	if audio_manager != null and not _is_gallery_preview():
		audio_manager.play_bgm("map")
	_build()


func _build() -> void:
	var ui := _UIBuilder.build(_spec_path())
	ui.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(ui)

	_content_container = ui.find_child("ContentContainer", true, false) as VBoxContainer
	_status_label      = ui.find_child("StatusLabel",       true, false) as Label
	_choice_row        = ui.find_child("ChoiceRow",         true, false) as HBoxContainer

	_render_event()


func handle_action(action_name: String, _source: Node) -> void:
	pass


func _render_event() -> void:
	if _content_container == null:
		return
	## 保留背景和外层，只清空动态内容（choice_row 内部）
	if _choice_row != null:
		_clear_children(_choice_row)
	if _card_selection_scroll != null and is_instance_valid(_card_selection_scroll):
		_card_selection_scroll.queue_free()
		_card_selection_scroll = null
		_card_selection_row = null
	if _back_button != null and is_instance_valid(_back_button):
		_back_button.queue_free()
		_back_button = null

	var node := _current_event_node()

	## 标题
	var title_lbl := _content_container.find_child("TitleLabel", true, false) as Label
	if title_lbl != null:
		title_lbl.text = str(node.get("title", "事件"))

	## 状态
	if _status_label != null:
		if _event_messages.is_empty():
			_status_label.text = str(node.get("description", "你遇到了一个事件。"))
		else:
			_status_label.text = "\n".join(_event_messages)

	if _in_card_selection:
		_render_card_selection()
	else:
		_render_choices(node.get("choices", []))


func _render_choices(choices: Array) -> void:
	if _choice_row == null:
		return
	_choice_row.alignment = BoxContainer.ALIGNMENT_CENTER
	_choice_row.add_theme_constant_override("separation", 28)
	for index in range(choices.size()):
		var choice := choices[index] as Dictionary
		var button := Button.new()
		button.text = "%s\n\n%s" % [str(choice.get("label", "选择")), str(choice.get("description", ""))]
		button.custom_minimum_size = Vector2(240, 280)
		button.add_theme_stylebox_override("normal", SF.make_choice_panel_style())
		button.add_theme_stylebox_override("hover", SF.make_panel_style(Color(0.98, 0.82, 0.92, 0.92), SF.CLR_GOLD, 16, 3))
		button.add_theme_font_size_override("font_size", 20)
		button.add_theme_color_override("font_color", Color(0.34, 0.18, 0.34))
		button.pressed.connect(_on_choice_pressed.bind(index))
		_choice_row.add_child(button)


func _render_card_selection() -> void:
	if _content_container == null:
		return

	var hint_text := ""
	match _current_selection_type:
		"remove":    hint_text = "选择一张卡牌移除"
		"upgrade":   hint_text = "选择一张卡牌升级"
		"transform": hint_text = "选择一张卡牌进行变换"

	var hint_label := Label.new()
	hint_label.text = hint_text
	hint_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	hint_label.add_theme_font_size_override("font_size", 20)
	hint_label.add_theme_color_override("font_color", Color(0.96, 0.86, 0.68))
	_content_container.add_child(hint_label)

	_card_selection_scroll = ScrollContainer.new()
	_card_selection_scroll.custom_minimum_size = Vector2(0, 286)
	_card_selection_scroll.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_card_selection_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_SHOW_ALWAYS
	_card_selection_scroll.vertical_scroll_mode   = ScrollContainer.SCROLL_MODE_DISABLED
	_card_selection_scroll.follow_focus = true
	_content_container.add_child(_card_selection_scroll)

	_card_selection_row = HBoxContainer.new()
	_card_selection_row.add_theme_constant_override("separation", 18)
	_card_selection_scroll.add_child(_card_selection_row)

	var data_loader: Variant = _autoload("DataLoader")
	for card_instance in _selectable_cards:
		var instance := card_instance as Dictionary
		var card_data: Dictionary = data_loader.resolve_card_instance(instance)
		var button: Button = CardViewFactoryScript.create_card_button(card_data, Vector2(180, 250))
		button.pressed.connect(_on_card_selected.bind(int(instance.get("instance_id", 0))))
		_card_selection_row.add_child(button)

	_back_button = Button.new()
	_back_button.text = "取消"
	_back_button.custom_minimum_size = Vector2(140, 44)
	_back_button.pressed.connect(_on_cancel_selection)
	_content_container.add_child(_back_button)


func _on_choice_pressed(index: int) -> void:
	if _resolved:
		return
	var node := _current_event_node()
	var choices: Array = node.get("choices", [])
	if index < 0 or index >= choices.size():
		return

	var audio_manager: Variant = _autoload("AudioManager")
	if audio_manager != null:
		audio_manager.play_sfx("button")

	if _choice_row != null:
		for child in _choice_row.get_children():
			if child is Button:
				(child as Button).disabled = true

	var data_loader: Variant = _autoload("DataLoader")
	var game_state: Variant = _autoload("GameState")
	var choice := choices[index] as Dictionary
	var result: Variant = EventServiceScript.resolve_choice(choice, game_state, data_loader)

	_event_messages = result.messages

	if result.needs_card_selection:
		_in_card_selection = true
		_current_selection_type   = result.selection_type
		_current_selection_filter = result.selection_filter
		_pending_effects   = result.pending_effects
		_transform_card_id = result.transform_card_id
		_selectable_cards = EventServiceScript.get_selectable_cards(
			game_state, data_loader,
			result.selection_type, result.selection_filter
		)
		if _selectable_cards.is_empty():
			_event_messages.append("没有可选的卡牌")
			_complete_event()
		else:
			_rebuild()
	else:
		_complete_event()


func _on_card_selected(instance_id: int) -> void:
	var data_loader: Variant = _autoload("DataLoader")
	var game_state: Variant = _autoload("GameState")
	var message := EventServiceScript.apply_card_selection(
		_current_selection_type, instance_id,
		game_state, data_loader,
		_pending_effects, _transform_card_id
	)
	_event_messages.append(message)
	_complete_event()


func _on_cancel_selection() -> void:
	_in_card_selection = false
	_current_selection_type   = ""
	_current_selection_filter = ""
	_pending_effects.clear()
	_transform_card_id = ""
	_selectable_cards.clear()
	_event_messages.append("你放弃了选择")
	_rebuild()


func _complete_event() -> void:
	_resolved = true
	_in_card_selection = false

	if _status_label != null:
		_status_label.text = "\n".join(_event_messages)

	if _choice_row != null:
		for child in _choice_row.get_children():
			if child is Button: (child as Button).disabled = true
	if _card_selection_row != null:
		for child in _card_selection_row.get_children():
			if child is Button: (child as Button).disabled = true
	if _back_button != null:
		_back_button.disabled = true

	var run_controller: Variant = _autoload("RunController")
	if run_controller != null:
		get_tree().create_timer(1.5).timeout.connect(Callable(run_controller, "complete_event"))


func _rebuild() -> void:
	for child in get_children():
		child.queue_free()
	_card_selection_scroll = null
	_card_selection_row    = null
	_back_button           = null
	_build()


func _clear_children(node: Node) -> void:
	for child in node.get_children():
		child.queue_free()


func _current_event_node() -> Dictionary:
	var game_state: Variant = _autoload("GameState")
	if game_state == null:
		return {}
	return game_state.get_current_node()


func _autoload(autoload_name: String) -> Variant:
	if is_inside_tree():
		return get_node_or_null("/root/%s" % autoload_name)
	var tree := Engine.get_main_loop() as SceneTree
	return tree.root.get_node_or_null(autoload_name) if tree != null else null


func _spec_path() -> String:
	return str(get_meta("ui_spec_override_path", SPEC_PATH))


func _is_gallery_preview() -> bool:
	return bool(get_meta("gallery_preview", false))
