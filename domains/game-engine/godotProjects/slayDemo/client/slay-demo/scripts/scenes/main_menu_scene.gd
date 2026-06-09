extends Control

const _UIBuilder := preload("res://addons/ui_builder/ui_builder.gd")
const SaveServiceScript := preload("res://scripts/autoload/save_service.gd")

const SPEC_PATH := "res://ui_specs/main_menu.ui.json"

const SIDEBAR_TIPS := {
	"SidebarAchievement": "成就",
	"SidebarCollection":  "图鉴",
	"SidebarSettings":    "设置",
	"SidebarNotice":      "公告",
}


func _ready() -> void:
	var audio_manager: Variant = _autoload("AudioManager")
	if audio_manager != null:
		audio_manager.play_bgm("main_menu")
	_build()


func _build() -> void:
	var ui := _UIBuilder.build(SPEC_PATH)
	ui.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(ui)

	## 继续游戏按钮：仅有存档时显示
	var continue_btn := ui.find_child("ContinueButton", true, false) as Button
	if continue_btn != null:
		continue_btn.visible = SaveServiceScript.has_save()

	## 侧边栏按钮大小和图标样式（JSON 已声明节点，这里补充图标尺寸）
	for btn_name in SIDEBAR_TIPS.keys():
		var btn := ui.find_child(btn_name, true, false) as Button
		if btn == null:
			continue
		btn.custom_minimum_size = Vector2(48, 48)
		btn.tooltip_text = SIDEBAR_TIPS[btn_name]
		btn.icon_alignment = HORIZONTAL_ALIGNMENT_CENTER
		btn.expand_icon = true


func handle_action(action_name: String, _source: Node) -> void:
	match action_name:
		"menu.on_continue":          _on_continue_pressed()
		"menu.on_start":             _on_start_pressed()
		"menu.on_settings":          _on_sidebar_pressed("设置")
		"menu.sidebar.achievement":  _on_sidebar_pressed("成就")
		"menu.sidebar.collection":   _on_sidebar_pressed("图鉴")
		"menu.sidebar.settings":     _on_sidebar_pressed("设置")
		"menu.sidebar.notice":       _on_sidebar_pressed("公告")


func _on_sidebar_pressed(tip: String) -> void:
	## Toast 提示（运行时动态创建，不属于骨架）
	var toast := Label.new()
	toast.text = "%s 暂未开放" % tip
	toast.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	toast.add_theme_font_size_override("font_size", 18)
	toast.add_theme_color_override("font_color", Color(1, 1, 1))
	toast.add_theme_color_override("font_shadow_color", Color(0, 0, 0, 0.8))
	toast.add_theme_constant_override("shadow_offset_x", 1)
	toast.add_theme_constant_override("shadow_offset_y", 1)

	var panel := PanelContainer.new()
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.1, 0.05, 0.2, 0.88)
	style.set_corner_radius_all(10)
	style.set_border_width_all(1)
	style.border_color = Color(1.0, 0.84, 0.0)
	panel.add_theme_stylebox_override("panel", style)
	panel.add_child(toast)
	panel.set_anchors_preset(Control.PRESET_CENTER)
	panel.offset_left = -120; panel.offset_right = 120
	panel.offset_top = -28;   panel.offset_bottom = 28
	panel.z_index = 50
	add_child(panel)

	var tween := create_tween()
	tween.tween_interval(1.5)
	tween.tween_property(panel, "modulate:a", 0.0, 0.4)
	tween.finished.connect(panel.queue_free)


func _on_continue_pressed() -> void:
	var run_controller: Variant = _autoload("RunController")
	run_controller.resume_run()


func _on_start_pressed() -> void:
	var run_controller: Variant = _autoload("RunController")
	run_controller.start_new_run("act1_map_run")


func _autoload(autoload_name: String) -> Variant:
	return get_node_or_null("/root/%s" % autoload_name)
