class_name BasePanel
extends Panel

const _StyleResolver := preload("res://addons/ui_builder/ui_style_resolver.gd")

func setup(style_key: String) -> void:
	if not style_key.is_empty() and _StyleResolver.has_style(style_key):
		add_theme_stylebox_override("panel", _StyleResolver.get_stylebox(style_key))
