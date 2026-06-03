extends RefCounted

const RARITY_COLORS := {
	"common":   Color(0.46, 0.40, 0.32, 0.95),
	"uncommon": Color(0.22, 0.40, 0.32, 0.95),
	"rare":     Color(0.34, 0.24, 0.50, 0.95),
	"boss":     Color(0.55, 0.18, 0.18, 0.95),
	"starter":  Color(0.28, 0.36, 0.50, 0.95),
}

const RELIC_ICON_PATHS := {
	"anchor":             "res://assets/ui/relics/relic_anchor.png",
	"lantern":            "res://assets/ui/relics/relic_lantern.png",
	"strawberry":         "res://assets/ui/relics/relic_strawberry.png",
	"meal_ticket":        "res://assets/ui/relics/relic_meal_ticket.png",
	"golden_idol":        "res://assets/ui/relics/relic_golden_idol.png",
	"iron_boots":         "res://assets/ui/relics/relic_iron_boots.png",
	"blood_ring":         "res://assets/ui/relics/relic_blood_ring.png",
	"war_drum":           "res://assets/ui/relics/relic_war_drum.png",
	"ancient_scroll":     "res://assets/ui/relics/relic_ancient_scroll.png",
	"crystal_ball":       "res://assets/ui/relics/relic_crystal_ball.png",
	"healing_spring":     "res://assets/ui/relics/relic_healing_spring.png",
	"philosopher_stone":  "res://assets/ui/relics/relic_philosopher_stone.png",
	"burning_blood":      "res://assets/ui/relics/relic_burning_blood.png",
	"ring_of_serpent":    "res://assets/ui/relics/relic_ring_of_serpent.png",
	"fusion_hammer":      "res://assets/ui/relics/relic_fusion_hammer.png",
	"runic_dome":         "res://assets/ui/relics/relic_runic_dome.png",
}


static func create_relic_button(relic: Dictionary, detail_callback: Callable = Callable()) -> Button:
	var relic_id   := str(relic.get("id", ""))
	var relic_name := str(relic.get("name", str(relic.get("id", "遗物"))))
	var description := str(relic.get("description", ""))
	var rarity     := str(relic.get("rarity", "common"))

	var button := Button.new()
	button.name = "Relic_%s" % relic_id
	button.tooltip_text = "%s\n%s" % [relic_name, description]
	button.focus_mode = Control.FOCUS_NONE
	button.add_theme_stylebox_override("normal",  _style_for(rarity, 0.95))
	button.add_theme_stylebox_override("hover",   _style_for(rarity, 1.08))
	button.add_theme_stylebox_override("pressed", _style_for(rarity, 1.18))

	var icon_path: String = RELIC_ICON_PATHS.get(relic_id, "")
	var texture: Texture2D = null
	if icon_path != "" and ResourceLoader.exists(icon_path, "Texture2D"):
		texture = ResourceLoader.load(icon_path, "Texture2D") as Texture2D

	if texture != null:
		# 图标按钮：56×56 正方形，显示图片
		button.text = ""
		button.custom_minimum_size = Vector2(56, 56)

		var tex := TextureRect.new()
		tex.texture = texture
		tex.set_anchors_preset(Control.PRESET_FULL_RECT)
		tex.offset_left   = 4
		tex.offset_top    = 4
		tex.offset_right  = -4
		tex.offset_bottom = -4
		tex.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		tex.mouse_filter = Control.MOUSE_FILTER_IGNORE
		button.add_child(tex)
	else:
		# fallback：无图片时用文字按钮
		button.text = _short_name(relic_name)
		button.custom_minimum_size = Vector2(72, 30)
		button.add_theme_font_size_override("font_size", 14)
		button.add_theme_color_override("font_color", Color(0.96, 0.90, 0.78))

	if detail_callback.is_valid():
		button.pressed.connect(detail_callback.bind(relic.duplicate(true)))
	return button


static func create_relic_row(relics: Array, detail_callback: Callable = Callable()) -> HBoxContainer:
	var row := HBoxContainer.new()
	row.name = "RelicRow"
	row.add_theme_constant_override("separation", 6)
	if relics.is_empty():
		var empty := Label.new()
		empty.name = "RelicEmptyLabel"
		empty.text = "遗物: 无"
		empty.add_theme_font_size_override("font_size", 14)
		empty.add_theme_color_override("font_color", Color(0.84, 0.78, 0.66))
		row.add_child(empty)
		return row

	var prefix := Label.new()
	prefix.text = "遗物:"
	prefix.add_theme_font_size_override("font_size", 14)
	prefix.add_theme_color_override("font_color", Color(0.90, 0.82, 0.68))
	row.add_child(prefix)

	for relic in relics:
		row.add_child(create_relic_button(relic as Dictionary, detail_callback))
	return row


static func detail_text(relic: Dictionary) -> String:
	return "%s：%s" % [str(relic.get("name", "")), str(relic.get("description", ""))]


static func _short_name(relic_name: String) -> String:
	if relic_name.length() <= 4:
		return relic_name
	return relic_name.left(4)


static func _style_for(rarity: String, multiplier: float) -> StyleBoxFlat:
	var base: Color = RARITY_COLORS.get(rarity, RARITY_COLORS["common"])
	var style := StyleBoxFlat.new()
	style.bg_color = Color(
		minf(base.r * multiplier, 1.0),
		minf(base.g * multiplier, 1.0),
		minf(base.b * multiplier, 1.0),
		base.a
	)
	style.border_color = Color(0.86, 0.70, 0.36, 0.88)
	style.set_border_width_all(1)
	style.set_corner_radius_all(6)
	style.content_margin_left = 8
	style.content_margin_top = 4
	style.content_margin_right = 8
	style.content_margin_bottom = 4
	return style
