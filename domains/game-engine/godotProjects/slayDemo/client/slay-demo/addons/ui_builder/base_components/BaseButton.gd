class_name UIBaseButton
extends Button

const _StyleResolver := preload("res://addons/ui_builder/ui_style_resolver.gd")

func setup(style_key: String, label_text: String = "") -> void:
	if not style_key.is_empty() and _StyleResolver.has_style(style_key):
		add_theme_stylebox_override("normal", _StyleResolver.get_stylebox(style_key))
		var font := _StyleResolver.get_font(style_key)
		if font:
			add_theme_font_override("font", font)
		add_theme_font_size_override("font_size", _StyleResolver.get_font_size(style_key))
		add_theme_color_override("font_color", _StyleResolver.get_color(style_key, "font_color"))
	if not label_text.is_empty():
		text = label_text
