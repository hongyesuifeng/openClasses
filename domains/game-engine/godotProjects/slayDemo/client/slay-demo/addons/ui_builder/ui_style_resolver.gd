class_name UIStyleResolver

const STYLES_PATH := "res://ui_manifest/manifest.styles.json"

static var _data: Dictionary = {}
static var _loaded := false


static func get_stylebox(style_key: String) -> StyleBox:
	_ensure_loaded()
	var styles: Dictionary = _data.get("styles", {})
	if not styles.has(style_key):
		push_warning("UIStyleResolver: style_key 未注册 '%s'" % style_key)
		return _fallback_stylebox()
	var cfg: Dictionary = styles[style_key]
	var type: String = cfg.get("type", "flat")
	match type:
		"flat", "texture_button":
			return _make_flat(cfg)
		"texture":
			return _make_texture_stylebox(cfg)
		"progress":
			return _make_progress_bg(cfg)
		_:
			return _fallback_stylebox()


static func get_progress_fill(style_key: String) -> StyleBoxFlat:
	_ensure_loaded()
	var styles: Dictionary = _data.get("styles", {})
	if not styles.has(style_key):
		return _fallback_stylebox()
	var cfg: Dictionary = styles[style_key]
	var colors: Dictionary = _data.get("colors", {})
	var s := StyleBoxFlat.new()
	if cfg.has("fill_color"):
		s.bg_color = _resolve_color(cfg["fill_color"], colors)
	if cfg.has("border_color"):
		s.border_color = _resolve_color(cfg["border_color"], colors)
	var bw := int(cfg.get("border_width", 0))
	s.border_width_left   = bw
	s.border_width_top    = bw
	s.border_width_right  = bw
	s.border_width_bottom = bw
	return s


static func get_progress_bg(style_key: String) -> StyleBoxFlat:
	_ensure_loaded()
	var styles: Dictionary = _data.get("styles", {})
	if not styles.has(style_key):
		return _fallback_stylebox()
	return _make_progress_bg(styles[style_key])


static func get_color(style_key: String, token: String) -> Color:
	_ensure_loaded()
	var styles: Dictionary = _data.get("styles", {})
	var colors: Dictionary = _data.get("colors", {})
	if styles.has(style_key):
		var cfg: Dictionary = styles[style_key]
		if cfg.has(token):
			return _resolve_color(cfg[token], colors)
	push_warning("UIStyleResolver: 找不到颜色 style_key=%s token=%s" % [style_key, token])
	return Color.WHITE


static func get_font(style_key: String) -> Font:
	_ensure_loaded()
	var styles: Dictionary = _data.get("styles", {})
	var fonts: Dictionary = _data.get("fonts", {})
	if styles.has(style_key):
		var cfg: Dictionary = styles[style_key]
		var font_key: String = cfg.get("font", "default")
		var path: String = fonts.get(font_key, "")
		if not path.is_empty() and FileAccess.file_exists(path):
			return load(path) as Font
	return null


static func get_font_size(style_key: String) -> int:
	_ensure_loaded()
	var styles: Dictionary = _data.get("styles", {})
	if styles.has(style_key):
		return int(styles[style_key].get("font_size", 20))
	return 20


static func has_style(style_key: String) -> bool:
	_ensure_loaded()
	return (_data.get("styles", {}) as Dictionary).has(style_key)


static func _make_flat(cfg: Dictionary) -> StyleBoxFlat:
	var s := StyleBoxFlat.new()
	var colors: Dictionary = _data.get("colors", {})
	if cfg.has("bg_color"):
		s.bg_color = _resolve_color(cfg["bg_color"], colors)
	if cfg.has("border_color"):
		s.border_color = _resolve_color(cfg["border_color"], colors)
	var bw := int(cfg.get("border_width", 0))
	s.border_width_left   = bw
	s.border_width_top    = bw
	s.border_width_right  = bw
	s.border_width_bottom = bw
	var cr := int(cfg.get("corner_radius", 0))
	s.corner_radius_top_left     = cr
	s.corner_radius_top_right    = cr
	s.corner_radius_bottom_left  = cr
	s.corner_radius_bottom_right = cr
	return s


static func _make_progress_bg(cfg: Dictionary) -> StyleBoxFlat:
	var s := StyleBoxFlat.new()
	var colors: Dictionary = _data.get("colors", {})
	if cfg.has("bg_color"):
		s.bg_color = _resolve_color(cfg["bg_color"], colors)
	if cfg.has("border_color"):
		s.border_color = _resolve_color(cfg["border_color"], colors)
	var bw := int(cfg.get("border_width", 0))
	s.border_width_left   = bw
	s.border_width_top    = bw
	s.border_width_right  = bw
	s.border_width_bottom = bw
	return s


static func _make_texture_stylebox(cfg: Dictionary) -> StyleBox:
	var asset_path := str(cfg.get("texture", ""))
	if asset_path.is_empty():
		asset_path = str(cfg.get("texture_asset", ""))
	if not asset_path.is_empty() and ResourceLoader.exists(asset_path, "Texture2D"):
		var tex := ResourceLoader.load(asset_path, "Texture2D") as Texture2D
		if tex != null:
			var s := StyleBoxTexture.new()
			s.texture = tex
			var margins: Array = cfg.get("texture_margins", cfg.get("nine_patch", [0, 0, 0, 0]))
			if margins.size() >= 4:
				s.texture_margin_left = float(margins[0])
				s.texture_margin_top = float(margins[1])
				s.texture_margin_right = float(margins[2])
				s.texture_margin_bottom = float(margins[3])
			return s
	return _make_flat(cfg)


static func _resolve_color(value: Variant, colors: Dictionary) -> Color:
	if value is String:
		if (value as String).begins_with("#"):
			return Color(value)
		if colors.has(value):
			return Color(colors[value])
	return Color.WHITE


static func _fallback_stylebox() -> StyleBoxFlat:
	var s := StyleBoxFlat.new()
	s.bg_color = Color(0.2, 0.2, 0.2, 0.8)
	return s


static func _ensure_loaded() -> void:
	if _loaded:
		return
	_loaded = true
	var file := FileAccess.open(STYLES_PATH, FileAccess.READ)
	if file == null:
		push_warning("UIStyleResolver: 找不到 manifest.styles.json")
		return
	var json := JSON.new()
	var err := json.parse(file.get_as_text())
	file.close()
	if err != OK:
		push_warning("UIStyleResolver: manifest.styles.json 解析失败")
		return
	_data = json.data


static func clear_cache() -> void:
	_data.clear()
	_loaded = false
