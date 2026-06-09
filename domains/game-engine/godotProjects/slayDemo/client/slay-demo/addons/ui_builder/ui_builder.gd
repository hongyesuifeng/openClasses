class_name UIBuilder

const _StyleResolver := preload("res://addons/ui_builder/ui_style_resolver.gd")
const _AssetLoader   := preload("res://addons/ui_builder/ui_asset_loader.gd")
const _ActionBinder  := preload("res://addons/ui_builder/ui_action_binder.gd")

const PRESET_ANCHORS := {
	"full_rect":      [0.0, 0.0, 1.0, 1.0],
	"top_full":       [0.0, 0.0, 1.0, 0.0],
	"bottom_full":    [0.0, 1.0, 1.0, 1.0],
	"left_full":      [0.0, 0.0, 0.0, 1.0],
	"right_full":     [1.0, 0.0, 1.0, 1.0],
	"center":         [0.5, 0.5, 0.5, 0.5],
	"top_left":       [0.0, 0.0, 0.0, 0.0],
	"top_right":      [1.0, 0.0, 1.0, 0.0],
	"top_center":     [0.5, 0.0, 0.5, 0.0],
	"bottom_left":    [0.0, 1.0, 0.0, 1.0],
	"bottom_right":   [1.0, 1.0, 1.0, 1.0],
	"bottom_center":  [0.5, 1.0, 0.5, 1.0],
	"left_center":    [0.0, 0.5, 0.0, 0.5],
	"right_center":   [1.0, 0.5, 1.0, 0.5],
}

const COMPONENTS_DIR := "res://ui_components/"


static func build(spec_path: String) -> Control:
	if not FileAccess.file_exists(spec_path):
		push_error("UIBuilder: spec 文件不存在 '%s'" % spec_path)
		return Control.new()
	var file := FileAccess.open(spec_path, FileAccess.READ)
	var json := JSON.new()
	var err := json.parse(file.get_as_text())
	file.close()
	if err != OK:
		push_error("UIBuilder: JSON 解析失败 '%s'" % spec_path)
		return Control.new()
	var spec: Dictionary = json.data
	var root := Control.new()
	root.name = spec.get("scene", "UIRoot")
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	if spec.has("background"):
		var bg := _build_node(spec["background"])
		if bg:
			root.add_child(bg)
	for child_spec in (spec.get("children", []) as Array):
		var child := _build_node(child_spec)
		if child:
			root.add_child(child)
	_ActionBinder.bind_all(root)
	return root


static func _build_node(spec: Dictionary) -> Control:
	var type: String = spec.get("type", "Control")
	var node: Control
	if type == "ComponentRef":
		node = _instantiate_component(spec)
	else:
		node = _create_node(type)
	if node == null:
		return null
	node.name = spec.get("name", type)
	if node is Label and spec.has("text"):
		(node as Label).text = spec["text"]
	elif node is Button and spec.has("text"):
		(node as Button).text = spec["text"]
	var style_key: String = spec.get("style", "")
	if not style_key.is_empty():
		_apply_style(node, style_key, type)
	if spec.has("asset"):
		_apply_asset(node, spec["asset"], spec.get("stretch_mode", ""), type)
	if spec.has("layout"):
		_apply_layout(node, spec["layout"], type)
	if spec.has("visible"):
		node.visible = bool(spec["visible"])
	var action: String = spec.get("action", "")
	if not action.is_empty():
		node.set_meta("ui_action", action)
	var bind_path: String = spec.get("bind", "")
	if not bind_path.is_empty():
		node.set_meta("ui_bind", bind_path)
	for child_spec in (spec.get("children", []) as Array):
		var child := _build_node(child_spec)
		if child:
			node.add_child(child)
	return node


static func _create_node(type: String) -> Control:
	match type:
		"Control":         return Control.new()
		"Panel":           return Panel.new()
		"Label":           return Label.new()
		"Button":          return Button.new()
		"TextureRect":     return TextureRect.new()
		"HBoxContainer":   return HBoxContainer.new()
		"VBoxContainer":   return VBoxContainer.new()
		"MarginContainer": return MarginContainer.new()
		"CenterContainer": return CenterContainer.new()
		"ProgressBar":     return ProgressBar.new()
		_:
			push_warning("UIBuilder: 未知节点类型 '%s'，降级为 Control" % type)
			return Control.new()


static func _instantiate_component(spec: Dictionary) -> Control:
	var component_name: String = spec.get("component", "")
	if component_name.is_empty():
		push_error("UIBuilder: ComponentRef 缺少 component 字段")
		return Control.new()
	var snake_name := _pascal_to_snake(component_name)
	var scene_path := COMPONENTS_DIR + snake_name + ".tscn"
	if not ResourceLoader.exists(scene_path):
		push_error("UIBuilder: 找不到组件场景 '%s'" % scene_path)
		return Control.new()
	var packed := load(scene_path) as PackedScene
	if packed == null:
		push_error("UIBuilder: 无法加载组件场景 '%s'" % scene_path)
		return Control.new()
	var instance := packed.instantiate() as Control
	if instance == null:
		push_error("UIBuilder: 组件场景根节点不是 Control: '%s'" % scene_path)
		return Control.new()
	if spec.has("props") and instance.has_method("setup"):
		instance.call("setup", spec["props"])
	return instance


static func _apply_style(node: Control, style_key: String, type: String) -> void:
	if not _StyleResolver.has_style(style_key):
		return
	match type:
		"Panel":
			(node as Panel).add_theme_stylebox_override("panel", _StyleResolver.get_stylebox(style_key))
		"Button":
			var btn := node as Button
			btn.add_theme_stylebox_override("normal", _StyleResolver.get_stylebox(style_key))
			var font := _StyleResolver.get_font(style_key)
			if font:
				btn.add_theme_font_override("font", font)
			btn.add_theme_font_size_override("font_size", _StyleResolver.get_font_size(style_key))
			btn.add_theme_color_override("font_color", _StyleResolver.get_color(style_key, "font_color"))
		"Label":
			var lbl := node as Label
			var font := _StyleResolver.get_font(style_key)
			if font:
				lbl.add_theme_font_override("font", font)
			lbl.add_theme_font_size_override("font_size", _StyleResolver.get_font_size(style_key))
			lbl.add_theme_color_override("font_color", _StyleResolver.get_color(style_key, "color"))
		"ProgressBar":
			var pb := node as ProgressBar
			pb.add_theme_stylebox_override("fill", _StyleResolver.get_progress_fill(style_key))
			pb.add_theme_stylebox_override("background", _StyleResolver.get_progress_bg(style_key))


static func _apply_asset(node: Control, asset_key: String, stretch_override: String, type: String) -> void:
	if type == "TextureRect":
		var tr := node as TextureRect
		var tex := _AssetLoader.load_texture(asset_key)
		if tex:
			tr.texture = tex
		var sm := stretch_override if not stretch_override.is_empty() else "keep_aspect_centered"
		tr.stretch_mode = _parse_stretch_mode(sm)
	elif type == "Button":
		var btn := node as Button
		var path := _AssetLoader.resolve_path(asset_key)
		if not path.is_empty() and FileAccess.file_exists(path):
			var tex := load(path) as Texture2D
			if tex:
				btn.icon = tex


static func _parse_stretch_mode(sm: String) -> TextureRect.StretchMode:
	match sm:
		"scale":                return TextureRect.STRETCH_SCALE
		"keep":                 return TextureRect.STRETCH_KEEP
		"keep_centered":        return TextureRect.STRETCH_KEEP_CENTERED
		"keep_aspect":          return TextureRect.STRETCH_KEEP_ASPECT
		"keep_aspect_centered": return TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		"keep_aspect_covered":  return TextureRect.STRETCH_KEEP_ASPECT_COVERED
		"tile":                 return TextureRect.STRETCH_TILE
		_:                      return TextureRect.STRETCH_KEEP_ASPECT_CENTERED


static func _apply_layout(node: Control, layout: Dictionary, _type: String) -> void:
	var preset: String = layout.get("preset", "full_rect")
	if preset == "full_rect":
		node.set_anchors_preset(Control.PRESET_FULL_RECT)
		return
	if preset == "absolute_rect":
		var pos: Array = layout.get("position", [0, 0])
		var sz: Array = layout.get("size", [0, 0])
		node.set_position(Vector2(float(pos[0]), float(pos[1])))
		node.set_size(Vector2(float(sz[0]), float(sz[1])))
		return
	if not PRESET_ANCHORS.has(preset):
		push_warning("UIBuilder: 未知 preset '%s'" % preset)
		node.set_anchors_preset(Control.PRESET_FULL_RECT)
		return
	var a: Array = PRESET_ANCHORS[preset]
	node.anchor_left   = a[0]
	node.anchor_top    = a[1]
	node.anchor_right  = a[2]
	node.anchor_bottom = a[3]
	var margin: Array = layout.get("margin", [0, 0, 0, 0])
	var ml := float(margin[0]) if margin.size() > 0 else 0.0
	var mt := float(margin[1]) if margin.size() > 1 else 0.0
	var mr := float(margin[2]) if margin.size() > 2 else 0.0
	var mb := float(margin[3]) if margin.size() > 3 else 0.0
	var size: Array = layout.get("size", [0, 0])
	var sw := float(size[0]) if size.size() > 0 else 0.0
	var sh := float(size[1]) if size.size() > 1 else 0.0
	var height := float(layout.get("height", sh))
	var width  := float(layout.get("width",  sw))
	match preset:
		"top_full":
			node.offset_left   = ml
			node.offset_top    = mt
			node.offset_right  = -mr
			node.offset_bottom = height
		"bottom_full":
			node.offset_left   = ml
			node.offset_top    = -height
			node.offset_right  = -mr
			node.offset_bottom = -mb
		"left_full":
			node.offset_left   = ml
			node.offset_top    = mt
			node.offset_right  = width
			node.offset_bottom = -mb
		"right_full":
			node.offset_left   = -width
			node.offset_top    = mt
			node.offset_right  = -mr
			node.offset_bottom = -mb
		"top_left":
			node.offset_left   = ml
			node.offset_top    = mt
			node.offset_right  = ml + sw
			node.offset_bottom = mt + sh
		"top_right":
			node.offset_left   = -(mr + sw)
			node.offset_top    = mt
			node.offset_right  = -mr
			node.offset_bottom = mt + sh
		"top_center":
			node.offset_left   = -sw / 2.0
			node.offset_top    = mt
			node.offset_right  = sw / 2.0
			node.offset_bottom = mt + sh
		"bottom_left":
			node.offset_left   = ml
			node.offset_top    = -(mb + sh)
			node.offset_right  = ml + sw
			node.offset_bottom = -mb
		"bottom_right":
			node.offset_left   = -(mr + sw)
			node.offset_top    = -(mb + sh)
			node.offset_right  = -mr
			node.offset_bottom = -mb
		"bottom_center":
			node.offset_left   = -sw / 2.0
			node.offset_top    = -(mb + sh)
			node.offset_right  = sw / 2.0
			node.offset_bottom = -mb
		"center":
			node.offset_left   = -sw / 2.0
			node.offset_top    = -sh / 2.0
			node.offset_right  = sw / 2.0
			node.offset_bottom = sh / 2.0
		"left_center":
			node.offset_left   = ml
			node.offset_top    = -sh / 2.0
			node.offset_right  = ml + sw
			node.offset_bottom = sh / 2.0
		"right_center":
			node.offset_left   = -(mr + sw)
			node.offset_top    = -sh / 2.0
			node.offset_right  = -mr
			node.offset_bottom = sh / 2.0


static func _pascal_to_snake(name: String) -> String:
	var result := ""
	for i in name.length():
		var c := name[i]
		if c == c.to_upper() and c != c.to_lower() and i > 0:
			result += "_"
		result += c.to_lower()
	return result
