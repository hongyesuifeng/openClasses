extends Control

const SaveServiceScript := preload("res://scripts/autoload/save_service.gd")


func _ready() -> void:
	var audio_manager: Variant = _autoload("AudioManager")
	if audio_manager != null:
		audio_manager.play_bgm("main_menu")
	_build()


func _build() -> void:
	var background := ColorRect.new()
	background.color = Color(0.08, 0.08, 0.1)
	background.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(background)

	var panel := VBoxContainer.new()
	panel.set_anchors_preset(Control.PRESET_CENTER)
	panel.custom_minimum_size = Vector2(420, 320)
	panel.offset_left = -210
	panel.offset_top = -160
	panel.offset_right = 210
	panel.offset_bottom = 160
	panel.alignment = BoxContainer.ALIGNMENT_CENTER
	panel.add_theme_constant_override("separation", 18)
	add_child(panel)

	var title := Label.new()
	title.text = "SlayDemo"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 42)
	panel.add_child(title)

	var subtitle := Label.new()
	subtitle.text = "Act 1 地图路线原型"
	subtitle.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	subtitle.add_theme_font_size_override("font_size", 18)
	panel.add_child(subtitle)

	if SaveServiceScript.has_save():
		var continue_button := Button.new()
		continue_button.text = "继续游戏"
		continue_button.custom_minimum_size = Vector2(260, 54)
		continue_button.pressed.connect(_on_continue_pressed)
		panel.add_child(continue_button)

	var start_button := Button.new()
	start_button.text = "开始游戏"
	start_button.custom_minimum_size = Vector2(260, 54)
	start_button.pressed.connect(_on_start_pressed)
	panel.add_child(start_button)


func _on_continue_pressed() -> void:
	var run_controller: Variant = _autoload("RunController")
	run_controller.resume_run()


func _on_start_pressed() -> void:
	var run_controller: Variant = _autoload("RunController")
	run_controller.start_new_run("act1_map_run")


func _autoload(autoload_name: String) -> Variant:
	return get_node_or_null("/root/%s" % autoload_name)
