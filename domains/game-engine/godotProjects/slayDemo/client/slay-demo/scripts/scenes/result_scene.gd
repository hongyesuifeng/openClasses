extends Control


func _ready() -> void:
	_build()


func _build() -> void:
	var game_state: Variant = _autoload("GameState")
	var summary: Dictionary = game_state.get_result_summary()
	var background := ColorRect.new()
	background.color = Color(0.05, 0.06, 0.075)
	background.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(background)

	var root := VBoxContainer.new()
	root.set_anchors_preset(Control.PRESET_CENTER)
	root.custom_minimum_size = Vector2(440, 320)
	root.offset_left = -220
	root.offset_top = -160
	root.offset_right = 220
	root.offset_bottom = 160
	root.alignment = BoxContainer.ALIGNMENT_CENTER
	root.add_theme_constant_override("separation", 18)
	add_child(root)

	var title := Label.new()
	title.text = "胜利结算" if bool(summary.get("won", false)) else "失败结算"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 36)
	root.add_child(title)

	var detail := Label.new()
	detail.text = "击败战斗: %d\n最终 HP: %d/%d\n最终牌组: %d 张" % [
		int(summary.get("battle_wins", 0)),
		int(summary.get("player_hp", 0)),
		int(summary.get("player_max_hp", 0)),
		int(summary.get("deck_size", 0))
	]
	detail.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	root.add_child(detail)

	var restart_button := Button.new()
	restart_button.text = "重新开始"
	restart_button.custom_minimum_size = Vector2(220, 48)
	restart_button.pressed.connect(_on_restart_pressed)
	root.add_child(restart_button)

	var menu_button := Button.new()
	menu_button.text = "返回主菜单"
	menu_button.custom_minimum_size = Vector2(220, 44)
	menu_button.pressed.connect(_on_menu_pressed)
	root.add_child(menu_button)


func _on_restart_pressed() -> void:
	var run_controller: Variant = _autoload("RunController")
	run_controller.start_new_run()


func _on_menu_pressed() -> void:
	var scene_router: Variant = _autoload("SceneRouter")
	scene_router.go_to("main_menu")


func _autoload(name: String) -> Variant:
	return get_node_or_null("/root/%s" % name)
