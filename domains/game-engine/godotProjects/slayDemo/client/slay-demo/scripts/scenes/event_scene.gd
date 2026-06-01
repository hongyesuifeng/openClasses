extends Control

const EventServiceScript := preload("res://scripts/event/event_service.gd")

var _status_label: Label
var _choice_row: HBoxContainer
var _resolved := false
var _auto_complete := true


func _ready() -> void:
	_build()


func _build() -> void:
	var background := TextureRect.new()
	background.texture = load("res://assets/backgrounds/bg_map.png")
	background.set_anchors_preset(Control.PRESET_FULL_RECT)
	background.stretch_mode = TextureRect.STRETCH_SCALE
	add_child(background)

	var tint := ColorRect.new()
	tint.color = Color(0.035, 0.030, 0.045, 0.64)
	tint.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(tint)

	var root := VBoxContainer.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.offset_left = 36
	root.offset_top = 34
	root.offset_right = -36
	root.offset_bottom = -34
	root.alignment = BoxContainer.ALIGNMENT_CENTER
	root.add_theme_constant_override("separation", 18)
	add_child(root)

	var node := _current_event_node()
	var title := Label.new()
	title.text = str(node.get("title", "事件"))
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 32)
	title.add_theme_color_override("font_color", Color(0.96, 0.86, 0.68))
	root.add_child(title)

	_status_label = Label.new()
	_status_label.text = str(node.get("description", "你遇到了一个事件。"))
	_status_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_status_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_status_label.add_theme_font_size_override("font_size", 17)
	_status_label.add_theme_color_override("font_color", Color(0.92, 0.84, 0.72))
	root.add_child(_status_label)

	_choice_row = HBoxContainer.new()
	_choice_row.alignment = BoxContainer.ALIGNMENT_CENTER
	_choice_row.add_theme_constant_override("separation", 16)
	root.add_child(_choice_row)

	_render_choices(node.get("choices", []))


func _render_choices(choices: Array) -> void:
	for index in range(choices.size()):
		var choice := choices[index] as Dictionary
		var button := Button.new()
		button.text = "%s\n%s" % [str(choice.get("label", "选择")), str(choice.get("description", ""))]
		button.custom_minimum_size = Vector2(250, 84)
		button.pressed.connect(_on_choice_pressed.bind(index))
		_choice_row.add_child(button)


func _on_choice_pressed(index: int) -> void:
	if _resolved:
		return
	var node := _current_event_node()
	var choices: Array = node.get("choices", [])
	if index < 0 or index >= choices.size():
		return
	_resolved = true
	for child in _choice_row.get_children():
		if child is Button:
			(child as Button).disabled = true

	var data_loader: Variant = _autoload("DataLoader")
	var game_state: Variant = _autoload("GameState")
	var choice := choices[index] as Dictionary
	var messages: Array[String] = EventServiceScript.apply_choice(choice, game_state, data_loader)
	_status_label.text = "\n".join(messages)

	var run_controller: Variant = _autoload("RunController")
	if _auto_complete and run_controller != null:
		get_tree().create_timer(1.0).timeout.connect(Callable(run_controller, "complete_event"))


func _current_event_node() -> Dictionary:
	var game_state: Variant = _autoload("GameState")
	if game_state == null:
		return {}
	return game_state.get_current_node()


func _autoload(name: String) -> Variant:
	return get_node_or_null("/root/%s" % name)
