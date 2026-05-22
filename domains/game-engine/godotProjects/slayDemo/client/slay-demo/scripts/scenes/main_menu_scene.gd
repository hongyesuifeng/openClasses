extends Control


func _ready() -> void:
	_build()


func _build() -> void:
	var background := ColorRect.new()
	background.color = Color(0.08, 0.08, 0.1)
	background.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(background)

	var panel := VBoxContainer.new()
	panel.set_anchors_preset(Control.PRESET_CENTER)
	panel.custom_minimum_size = Vector2(420, 260)
	panel.offset_left = -210
	panel.offset_top = -130
	panel.offset_right = 210
	panel.offset_bottom = 130
	panel.alignment = BoxContainer.ALIGNMENT_CENTER
	panel.add_theme_constant_override("separation", 18)
	add_child(panel)

	var title := Label.new()
	title.text = "SlayDemo V1"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 42)
	panel.add_child(title)

	var subtitle := Label.new()
	subtitle.text = "固定垂直切片: 3 场普通战斗 + 奖励 + Boss"
	subtitle.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	subtitle.add_theme_font_size_override("font_size", 18)
	panel.add_child(subtitle)

	var start_button := Button.new()
	start_button.text = "开始新局"
	start_button.custom_minimum_size = Vector2(260, 54)
	start_button.pressed.connect(_on_start_pressed)
	panel.add_child(start_button)

	var validate_button := Button.new()
	validate_button.text = "校验数据"
	validate_button.custom_minimum_size = Vector2(260, 44)
	validate_button.pressed.connect(_on_validate_pressed)
	panel.add_child(validate_button)


func _on_start_pressed() -> void:
	var run_controller: Variant = _autoload("RunController")
	run_controller.start_new_run()


func _on_validate_pressed() -> void:
	var data_loader: Variant = _autoload("DataLoader")
	var errors: PackedStringArray = data_loader.validate_all()
	if errors.is_empty():
		print("SlayDemo V1 data validation passed.")
	else:
		for error in errors:
			push_error(error)


func _autoload(name: String) -> Variant:
	return get_node_or_null("/root/%s" % name)
