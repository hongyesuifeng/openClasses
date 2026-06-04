extends RefCounted
class_name PotionViewFactory

const UILayoutStoreScript := preload("res://scripts/ui/ui_layout_store.gd")

const RARITY_COLORS := {
	"common":   Color(0.30, 0.48, 0.38, 0.95),
	"uncommon": Color(0.22, 0.34, 0.52, 0.95),
	"rare":     Color(0.50, 0.28, 0.48, 0.95)
}


static func create_potion_button(potion: Dictionary, use_callback: Callable = Callable()) -> Button:
	var potion_name := str(potion.get("name", "药水"))
	var description := str(potion.get("description", ""))
	var button := Button.new()
	button.name = "Potion_%s" % str(potion.get("id", potion_name))
	button.text = _short_name(potion_name)
	button.tooltip_text = "%s\n%s" % [potion_name, description]
	button.custom_minimum_size = Vector2(60, 30)
	button.focus_mode = Control.FOCUS_NONE
	button.add_theme_font_size_override("font_size", 13)
	button.add_theme_color_override("font_color", Color(0.96, 0.92, 0.80))
	button.add_theme_stylebox_override("normal",  _style_for(str(potion.get("rarity", "common")), 0.95))
	button.add_theme_stylebox_override("hover",   _style_for(str(potion.get("rarity", "common")), 1.12))
	button.add_theme_stylebox_override("pressed", _style_for(str(potion.get("rarity", "common")), 1.22))
	if use_callback.is_valid():
		button.pressed.connect(use_callback)
	UILayoutStoreScript.apply_layout(button, "potion.root", str(potion.get("id", potion_name)))
	return button


static func create_empty_slot() -> Button:
	var button := Button.new()
	button.text = "空"
	button.custom_minimum_size = Vector2(60, 30)
	button.focus_mode = Control.FOCUS_NONE
	button.disabled = true
	button.add_theme_font_size_override("font_size", 12)
	button.add_theme_color_override("font_color", Color(0.55, 0.50, 0.45))
	button.add_theme_stylebox_override("disabled", _empty_style())
	UILayoutStoreScript.apply_layout(button, "potion.empty")
	return button


static func _short_name(potion_name: String) -> String:
	if potion_name.length() <= 4:
		return potion_name
	return potion_name.left(4)


static func _style_for(rarity: String, multiplier: float) -> StyleBoxFlat:
	var base: Color = RARITY_COLORS.get(rarity, RARITY_COLORS["common"])
	var style := StyleBoxFlat.new()
	style.bg_color = Color(
		minf(base.r * multiplier, 1.0),
		minf(base.g * multiplier, 1.0),
		minf(base.b * multiplier, 1.0),
		base.a
	)
	style.border_color = Color(0.90, 0.82, 0.50, 0.85)
	style.set_border_width_all(1)
	style.set_corner_radius_all(6)
	style.content_margin_left = 6
	style.content_margin_top = 3
	style.content_margin_right = 6
	style.content_margin_bottom = 3
	return style


static func _empty_style() -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.18, 0.16, 0.14, 0.60)
	style.border_color = Color(0.40, 0.36, 0.30, 0.50)
	style.set_border_width_all(1)
	style.set_border_width_all(1)
	style.set_corner_radius_all(6)
	style.content_margin_left = 6
	style.content_margin_top = 3
	style.content_margin_right = 6
	style.content_margin_bottom = 3
	return style
