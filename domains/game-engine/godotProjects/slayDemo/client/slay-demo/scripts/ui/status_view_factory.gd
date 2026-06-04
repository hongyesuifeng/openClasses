extends RefCounted
class_name StatusViewFactory

const STATUS_CONFIG := {
	"strength": {
		"name": "力量",
		"color": Color(1.0, 0.65, 0.2),
		"icon": "⚔",
		"icon_path": "res://assets/ui/status/status_strength.png",
		"description": "伤害 +{stacks}"
	},
	"dexterity": {
		"name": "敏捷",
		"color": Color(0.4, 0.8, 1.0),
		"icon": "🛡",
		"icon_path": "res://assets/ui/status/status_dexterity.png",
		"description": "格挡 +{stacks}"
	},
	"vulnerable": {
		"name": "易伤",
		"color": Color(1.0, 0.3, 0.3),
		"icon": "💔",
		"icon_path": "res://assets/ui/status/status_vulnerable.png",
		"description": "受伤 +50% ({stacks}回合)"
	},
	"weak": {
		"name": "无力",
		"color": Color(0.6, 0.6, 0.7),
		"icon": "💫",
		"icon_path": "res://assets/ui/status/status_weak.png",
		"description": "伤害 -25% ({stacks}回合)"
	},
	"frail": {
		"name": "虚弱",
		"color": Color(0.7, 0.5, 0.3),
		"icon": "🦴",
		"icon_path": "res://assets/ui/status/status_frail.png",
		"description": "格挡 -25% ({stacks}回合)"
	},
	"poison": {
		"name": "中毒",
		"color": Color(0.5, 0.2, 0.8),
		"icon": "☠",
		"icon_path": "res://assets/ui/status/status_poison.png",
		"description": "回合开始 {stacks} 伤害"
	},
	"thorns": {
		"name": "荆棘",
		"color": Color(0.3, 0.7, 0.3),
		"icon": "🌵",
		"icon_path": "res://assets/ui/status/status_thorns.png",
		"description": "反弹 {stacks} 伤害"
	},
	"regeneration": {
		"name": "再生",
		"color": Color(0.3, 1.0, 0.4),
		"icon": "💚",
		"icon_path": "res://assets/ui/status/status_regeneration.png",
		"description": "回合开始回复 {stacks}"
	},
	"barricade": {
		"name": "堡垒",
		"color": Color(0.75, 0.9, 1.0),
		"icon": "▣",
		"icon_path": "res://assets/ui/status/status_barricade.png",
		"description": "格挡不会在回合开始清除"
	},
	"ritual": {
		"name": "仪式",
		"color": Color(0.95, 0.70, 0.95),
		"icon": "★",
		"icon_path": "res://assets/ui/status/status_ritual.png",
		"description": "每回合结束获得 {stacks} 层力量"
	},
	"metallicize": {
		"name": "金属化",
		"color": Color(0.8, 0.85, 0.95),
		"icon": "⬡",
		"icon_path": "res://assets/ui/status/status_metallicize.png",
		"description": "每回合结束获得 {stacks} 点格挡"
	},
	"retain": {
		"name": "保留",
		"color": Color(0.6, 0.9, 0.6),
		"icon": "📎",
		"icon_path": "res://assets/ui/status/status_retain.png",
		"description": "此牌保留至下回合"
	},
}


## 创建单个状态图标（图片图标 + 数量标签，无图片时退回 emoji Label）
## click_callback: 可选，点击时调用，参数为 (status_id, stacks)
static func create_status_label(status_id: String, stacks: int, compact: bool = true, click_callback: Callable = Callable()) -> Control:
	var config: Dictionary = STATUS_CONFIG.get(status_id, {"name": status_id, "color": Color.WHITE, "icon": "?", "icon_path": ""})
	var icon_path := str(config.get("icon_path", ""))
	var tooltip := "%s\n%s" % [str(config.get("name", status_id)), get_status_description(status_id, stacks)]

	var widget: Control
	if icon_path != "" and ResourceLoader.exists(icon_path, "Texture2D"):
		var texture := ResourceLoader.load(icon_path, "Texture2D") as Texture2D
		if texture != null:
			widget = _create_icon_widget(texture, stacks, config.get("color", Color.WHITE) as Color, compact)

	if widget == null:
		var label := Label.new()
		if compact:
			label.text = "%s%d" % [config.get("icon", "?"), stacks]
		else:
			label.text = "%s %s: %d" % [config.get("icon", "?"), config.get("name", status_id), stacks]
		label.add_theme_font_size_override("font_size", 14 if compact else 16)
		label.add_theme_color_override("font_color", config.get("color", Color.WHITE))
		label.add_theme_color_override("font_shadow_color", Color(0, 0, 0, 0.8))
		label.add_theme_constant_override("shadow_offset_x", 1)
		label.add_theme_constant_override("shadow_offset_y", 1)
		widget = label

	widget.tooltip_text = tooltip

	if click_callback.is_valid():
		var btn := Button.new()
		btn.tooltip_text = tooltip
		btn.focus_mode = Control.FOCUS_NONE
		btn.add_theme_stylebox_override("normal", _transparent_style())
		btn.add_theme_stylebox_override("hover", _hover_style())
		btn.add_theme_stylebox_override("pressed", _transparent_style())
		btn.custom_minimum_size = widget.custom_minimum_size
		btn.add_child(widget)
		btn.pressed.connect(click_callback.bind(status_id, stacks))
		return btn

	return widget


## 创建状态容器（多个状态图标横向排列）
## click_callback: 可选，点击时调用，参数为 (status_id, stacks)
static func create_status_row(statuses: Array, compact: bool = true, click_callback: Callable = Callable()) -> HBoxContainer:
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 6)

	for status in statuses:
		var status_id := str(status.get("id", ""))
		var stacks := int(status.get("stacks", 0))
		if stacks <= 0:
			continue
		row.add_child(create_status_label(status_id, stacks, compact, click_callback))

	return row


static func _create_icon_widget(texture: Texture2D, stacks: int, _color: Color, compact: bool) -> Control:
	var container := Control.new()
	var container_size := 32 if compact else 36
	var icon_size := 28 if compact else 32
	container.custom_minimum_size = Vector2(container_size, container_size)

	var tex := TextureRect.new()
	tex.texture = texture
	tex.custom_minimum_size = Vector2(icon_size, icon_size)
	tex.size = Vector2(icon_size, icon_size)
	tex.position = Vector2(
		float(container_size - icon_size) * 0.5,
		float(container_size - icon_size) * 0.5
	)
	tex.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	tex.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	tex.mouse_filter = Control.MOUSE_FILTER_IGNORE
	container.add_child(tex)

	var count_label := Label.new()
	count_label.text = str(stacks)
	count_label.anchor_left = 0.50
	count_label.anchor_top = 0.50
	count_label.anchor_right = 1.0
	count_label.anchor_bottom = 1.0
	count_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	count_label.vertical_alignment = VERTICAL_ALIGNMENT_BOTTOM
	count_label.add_theme_font_size_override("font_size", 13 if compact else 15)
	count_label.add_theme_color_override("font_color", Color(1.0, 0.96, 0.82))
	count_label.add_theme_color_override("font_shadow_color", Color(0, 0, 0, 0.8))
	count_label.add_theme_constant_override("shadow_offset_x", 1)
	count_label.add_theme_constant_override("shadow_offset_y", 1)
	count_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	container.add_child(count_label)

	return container


## 获取状态描述文本
static func get_status_description(status_id: String, stacks: int) -> String:
	var config: Dictionary = STATUS_CONFIG.get(status_id, {"description": status_id})
	var template := str(config.get("description", status_id))
	return template.format({"stacks": stacks})


## 判断是否为负面状态
static func is_debuff(status_id: String) -> bool:
	return status_id in ["vulnerable", "weak", "frail", "poison"]


static func _transparent_style() -> StyleBoxFlat:
	var s := StyleBoxFlat.new()
	s.bg_color = Color(0, 0, 0, 0)
	return s


static func _hover_style() -> StyleBoxFlat:
	var s := StyleBoxFlat.new()
	s.bg_color = Color(1, 1, 1, 0.12)
	s.set_corner_radius_all(4)
	return s
