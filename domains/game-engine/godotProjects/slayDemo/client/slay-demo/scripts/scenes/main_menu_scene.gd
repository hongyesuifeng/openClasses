extends Control

const SaveServiceScript := preload("res://scripts/autoload/save_service.gd")
const UIThemeScript := preload("res://scripts/ui/ui_theme.gd")

## ── 新 UI 色板 ─────────────────────────────
const CLR_PINK       := Color(0.95, 0.55, 0.65)   # 主粉色
const CLR_PINK_LIGHT := Color(1.0, 0.71, 0.76)    # 浅粉
const CLR_GOLD       := Color(1.0, 0.84, 0.0)     # 金色描边
const CLR_PURPLE_BG  := Color(0.12, 0.08, 0.18, 0.72)  # 侧栏背景
const CLR_WHITE      := Color(1.0, 1.0, 1.0)
const CLR_SUBTITLE   := Color(0.96, 0.92, 0.98)   # 白偏紫

## 左侧功能栏配置：{ icon_path, tooltip }
const SIDEBAR_ITEMS := [
	{ "icon": "res://assets/ui/icons/icon_battle.png",    "tip": "成就" },
	{ "icon": "res://assets/ui/icons/icon_question.png",  "tip": "图鉴" },
	{ "icon": "res://assets/ui/icons/icon_settings.png",  "tip": "设置" },
	{ "icon": "res://assets/ui/icons/icon_chest.png",     "tip": "公告" },
]


func _ready() -> void:
	var audio_manager: Variant = _autoload("AudioManager")
	if audio_manager != null:
		audio_manager.play_bgm("main_menu")
	_build()


func _build() -> void:
	# ── 1. 背景（不加深色遮罩，保持明亮梦幻） ──
	var background := TextureRect.new()
	background.texture = load("res://assets/backgrounds/bg_main_menu.png")
	background.set_anchors_preset(Control.PRESET_FULL_RECT)
	background.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	background.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	add_child(background)

	# ── 2. 右上角水晶 + 金币显示 ──
	_build_top_right()

	# ── 3. 左侧功能栏 ──
	_build_sidebar()

	# ── 4. 中间主体区（标题 + 副标题 + 按钮） ──
	var panel := VBoxContainer.new()
	panel.set_anchors_preset(Control.PRESET_CENTER)
	panel.custom_minimum_size = Vector2(460, 360)
	panel.offset_left = -230
	panel.offset_top = -180
	panel.offset_right = 230
	panel.offset_bottom = 180
	panel.alignment = BoxContainer.ALIGNMENT_CENTER
	panel.add_theme_constant_override("separation", 22)
	add_child(panel)

	# ── 主标题：粉金色 ──
	var title := Label.new()
	title.text = "甜心迷宫"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 56)
	title.add_theme_color_override("font_color", CLR_PINK_LIGHT)
	title.add_theme_color_override("font_shadow_color", Color(0.6, 0.2, 0.4, 0.8))
	title.add_theme_constant_override("shadow_offset_x", 3)
	title.add_theme_constant_override("shadow_offset_y", 3)
	UIThemeScript.apply_cn(title)
	panel.add_child(title)

	# ── 副标题 ──
	var subtitle := Label.new()
	subtitle.text = "甜蜜的冒险，从这里开始"
	subtitle.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	subtitle.add_theme_font_size_override("font_size", 20)
	subtitle.add_theme_color_override("font_color", CLR_SUBTITLE)
	UIThemeScript.apply_cn(subtitle)
	panel.add_child(subtitle)

	# ── 按钮区 ──
	var btn_container := VBoxContainer.new()
	btn_container.alignment = BoxContainer.ALIGNMENT_CENTER
	btn_container.add_theme_constant_override("separation", 14)
	panel.add_child(btn_container)

	if SaveServiceScript.has_save():
		var continue_button := _make_pink_button("继续游戏", Vector2(280, 58))
		continue_button.pressed.connect(_on_continue_pressed)
		btn_container.add_child(continue_button)

	var start_button := _make_pink_button("开始游戏", Vector2(280, 58))
	start_button.pressed.connect(_on_start_pressed)
	btn_container.add_child(start_button)


# ──────────────────────────────────────────────
## 右上角：设置按钮（预留）
# ──────────────────────────────────────────────
func _build_top_right() -> void:
	var box := HBoxContainer.new()
	box.set_anchors_preset(Control.PRESET_TOP_RIGHT)
	box.offset_left = -80
	box.offset_top = 18
	box.offset_right = -24
	box.offset_bottom = 58
	box.alignment = BoxContainer.ALIGNMENT_END
	box.add_theme_constant_override("separation", 12)
	add_child(box)

	var settings_btn := Button.new()
	settings_btn.icon = load("res://assets/ui/icons/icon_settings.png")
	settings_btn.custom_minimum_size = Vector2(36, 36)
	settings_btn.expand_icon = true
	settings_btn.add_theme_stylebox_override("normal", _btn_style(Color(0.18, 0.12, 0.28, 0.75)))
	settings_btn.add_theme_stylebox_override("hover", _btn_style(Color(0.30, 0.20, 0.42, 0.92)))
	settings_btn.tooltip_text = "设置"
	box.add_child(settings_btn)


# ──────────────────────────────────────────────
## 左侧垂直功能栏
# ──────────────────────────────────────────────
func _build_sidebar() -> void:
	var sidebar := VBoxContainer.new()
	sidebar.set_anchors_preset(Control.PRESET_LEFT_WIDE)
	sidebar.offset_left = 12
	sidebar.offset_top = 80
	sidebar.offset_right = 68
	sidebar.offset_bottom = -40
	sidebar.alignment = BoxContainer.ALIGNMENT_CENTER
	sidebar.add_theme_constant_override("separation", 16)
	add_child(sidebar)

	# 半透明紫色背景
	var bg := ColorRect.new()
	bg.color = CLR_PURPLE_BG
	bg.set_anchors_preset(Control.PRESET_LEFT_WIDE)
	bg.offset_left = 6
	bg.offset_top = 68
	bg.offset_right = 74
	bg.offset_bottom = -32
	bg.z_index = -1
	bg.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(bg)

	for item in SIDEBAR_ITEMS:
		var btn := Button.new()
		btn.custom_minimum_size = Vector2(48, 48)
		btn.tooltip_text = str(item["tip"])
		btn.icon = load(str(item["icon"]))
		btn.icon_alignment = HORIZONTAL_ALIGNMENT_CENTER
		btn.expand_icon = true
		btn.add_theme_stylebox_override("normal", _btn_style(Color(0.18, 0.12, 0.28, 0.85)))
		btn.add_theme_stylebox_override("hover", _btn_style(Color(0.28, 0.20, 0.40, 0.92)))
		btn.add_theme_stylebox_override("pressed", _btn_style(Color(0.35, 0.25, 0.48, 0.96)))
		btn.add_theme_color_override("icon_normal_color", CLR_GOLD)
		btn.add_theme_color_override("icon_hover_color", CLR_PINK_LIGHT)
		sidebar.add_child(btn)


# ──────────────────────────────────────────────
## 创建粉色圆角金边按钮
# ──────────────────────────────────────────────
func _make_pink_button(text: String, min_size: Vector2) -> Button:
	var btn := Button.new()
	btn.text = text
	btn.custom_minimum_size = min_size
	var style_normal := StyleBoxFlat.new()
	style_normal.bg_color = CLR_PINK
	style_normal.border_color = CLR_GOLD
	style_normal.set_border_width_all(2)
	style_normal.set_corner_radius_all(22)
	style_normal.content_margin_left = 20
	style_normal.content_margin_top = 10
	style_normal.content_margin_right = 20
	style_normal.content_margin_bottom = 10
	btn.add_theme_stylebox_override("normal", style_normal)
	btn.add_theme_color_override("font_color", CLR_WHITE)
	btn.add_theme_color_override("font_hover_color", CLR_GOLD)
	btn.add_theme_font_size_override("font_size", 22)

	var style_hover := style_normal.duplicate()
	style_hover.bg_color = Color(1.0, 0.65, 0.72)
	btn.add_theme_stylebox_override("hover", style_hover)

	var style_pressed := style_normal.duplicate()
	style_pressed.bg_color = Color(0.88, 0.45, 0.55)
	btn.add_theme_stylebox_override("pressed", style_pressed)

	return btn


func _btn_style(color: Color) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = color
	style.set_corner_radius_all(10)
	style.set_border_width_all(1)
	style.border_color = Color(0.5, 0.35, 0.7, 0.6)
	style.content_margin_left = 6
	style.content_margin_top = 6
	style.content_margin_right = 6
	style.content_margin_bottom = 6
	return style


func _on_continue_pressed() -> void:
	var run_controller: Variant = _autoload("RunController")
	run_controller.resume_run()


func _on_start_pressed() -> void:
	var run_controller: Variant = _autoload("RunController")
	run_controller.start_new_run("act1_map_run")


func _autoload(autoload_name: String) -> Variant:
	return get_node_or_null("/root/%s" % autoload_name)
