extends RefCounted
class_name UILayoutStore

const DEFAULT_PATH := "res://data/ui_layouts.json"
const LAYOUT_KEYS := ["anchors", "offsets", "min_size"]
## 视觉属性 key 及其期望的数组长度（font_size 单独存为数值，不在此列）
const VISUAL_ARRAY_KEYS := {"font_color": 4, "modulate": 4, "scale": 2}

static var _path := DEFAULT_PATH
static var _loaded := false
static var _allow_write_override := false
static var _templates: Dictionary = {}
static var _instances: Dictionary = {}
static var _gallery: Dictionary = {}


static func get_layout(element_id: String, instance_id := "") -> Dictionary:
	_ensure_loaded()
	var result: Dictionary = {}
	_merge_layout(result, _templates.get(element_id, {}))
	if instance_id != "":
		_merge_layout(result, _instances.get(instance_id, {}).get(element_id, {}))
	return result


static func get_gallery_layout(element_id: String) -> Dictionary:
	_ensure_loaded()
	var result: Dictionary = {}
	_merge_layout(result, _gallery.get(element_id, {}))
	return result


static func apply_gallery_layout(control: Control, element_id: String) -> void:
	if control == null:
		return
	control.set_meta("layout_element_id", element_id)
	control.set_meta("layout_scope", "gallery")
	var layout := get_gallery_layout(element_id)
	_apply_layout_dictionary(control, layout)


static func apply_layout(control: Control, element_id: String, instance_id := "") -> void:
	if control == null:
		return
	control.set_meta("layout_element_id", element_id)
	if instance_id != "":
		control.set_meta("layout_instance_id", instance_id)
	var layout := get_layout(element_id, instance_id)
	_apply_layout_dictionary(control, layout)


static func _apply_layout_dictionary(control: Control, layout: Dictionary) -> void:
	if layout.has("anchors"):
		var anchors := layout["anchors"] as Array
		control.anchor_left = float(anchors[0])
		control.anchor_top = float(anchors[1])
		control.anchor_right = float(anchors[2])
		control.anchor_bottom = float(anchors[3])
	if layout.has("offsets"):
		var offsets := layout["offsets"] as Array
		control.offset_left = float(offsets[0])
		control.offset_top = float(offsets[1])
		control.offset_right = float(offsets[2])
		control.offset_bottom = float(offsets[3])
	if layout.has("min_size"):
		var min_size := layout["min_size"] as Array
		control.custom_minimum_size = Vector2(float(min_size[0]), float(min_size[1]))
	if layout.has("font_size") and control is Label:
		(control as Label).add_theme_font_size_override("font_size", int(layout["font_size"]))
	if layout.has("font_color") and control is Label:
		var fc := layout["font_color"] as Array
		(control as Label).add_theme_color_override("font_color", Color(float(fc[0]), float(fc[1]), float(fc[2]), float(fc[3])))
	if layout.has("modulate"):
		var m := layout["modulate"] as Array
		control.modulate = Color(float(m[0]), float(m[1]), float(m[2]), float(m[3]))
	if layout.has("scale"):
		var s := layout["scale"] as Array
		control.scale = Vector2(float(s[0]), float(s[1]))


static func set_override(element_id: String, layout: Dictionary, instance_id := "") -> void:
	_ensure_loaded()
	var clean := _validated_layout(layout)
	if clean.is_empty():
		return
	if instance_id == "":
		_templates[element_id] = clean
	else:
		if not _instances.has(instance_id):
			_instances[instance_id] = {}
		_instances[instance_id][element_id] = clean


static func set_gallery_override(element_id: String, layout: Dictionary) -> void:
	_ensure_loaded()
	var clean := _validated_layout(layout)
	if not clean.is_empty():
		_gallery[element_id] = clean


static func reset_gallery_override(element_id: String) -> void:
	_ensure_loaded()
	_gallery.erase(element_id)


static func reset_override(element_id: String, instance_id := "") -> void:
	_ensure_loaded()
	if instance_id == "":
		_templates.erase(element_id)
	elif _instances.has(instance_id):
		_instances[instance_id].erase(element_id)
		if _instances[instance_id].is_empty():
			_instances.erase(instance_id)


static func save() -> Error:
	_ensure_loaded()
	if not OS.is_debug_build() and not _allow_write_override:
		return ERR_UNAUTHORIZED
	var payload := {
		"version": 1,
		"templates": _sorted_dictionary(_templates),
		"instances": _sorted_dictionary(_instances),
		"gallery": _sorted_dictionary(_gallery),
	}
	var file := FileAccess.open(_path, FileAccess.WRITE)
	if file == null:
		return FileAccess.get_open_error()
	file.store_string(JSON.stringify(payload, "\t") + "\n")
	file.flush()
	file.close()
	return OK


static func reload_config() -> void:
	_loaded = false
	_ensure_loaded()


static func configure_storage(path: String, allow_write := false) -> void:
	_path = path
	_allow_write_override = allow_write
	_loaded = false


static func restore_default_storage() -> void:
	configure_storage(DEFAULT_PATH)


static func layout_from_control(control: Control) -> Dictionary:
	var result := {
		"anchors": [control.anchor_left, control.anchor_top, control.anchor_right, control.anchor_bottom],
		"offsets": [control.offset_left, control.offset_top, control.offset_right, control.offset_bottom],
		"min_size": [control.custom_minimum_size.x, control.custom_minimum_size.y],
	}
	if control is Label:
		if (control as Label).has_theme_font_size_override("font_size"):
			result["font_size"] = (control as Label).get_theme_font_size("font_size")
		if (control as Label).has_theme_color_override("font_color"):
			var fc: Color = (control as Label).get_theme_color("font_color")
			result["font_color"] = [fc.r, fc.g, fc.b, fc.a]
	result["modulate"] = [control.modulate.r, control.modulate.g, control.modulate.b, control.modulate.a]
	result["scale"] = [control.scale.x, control.scale.y]
	return result


static func _ensure_loaded() -> void:
	if _loaded:
		return
	_loaded = true
	_templates = {}
	_instances = {}
	_gallery = {}
	if not FileAccess.file_exists(_path):
		return
	var file := FileAccess.open(_path, FileAccess.READ)
	if file == null:
		return
	var parsed: Variant = JSON.parse_string(file.get_as_text())
	if not parsed is Dictionary:
		return
	_templates = _validated_section(parsed.get("templates", {}))
	_instances = _validated_instances(parsed.get("instances", {}))
	_gallery = _validated_section(parsed.get("gallery", {}))


static func _validated_section(value: Variant) -> Dictionary:
	var result: Dictionary = {}
	if not value is Dictionary:
		return result
	for element_id in value:
		var layout := _validated_layout(value[element_id])
		if not layout.is_empty():
			result[str(element_id)] = layout
	return result


static func _validated_instances(value: Variant) -> Dictionary:
	var result: Dictionary = {}
	if not value is Dictionary:
		return result
	for instance_id in value:
		var section := _validated_section(value[instance_id])
		if not section.is_empty():
			result[str(instance_id)] = section
	return result


static func _validated_layout(value: Variant) -> Dictionary:
	var result: Dictionary = {}
	if not value is Dictionary:
		return result
	## 几何属性（数组形式）
	for key in LAYOUT_KEYS:
		if not value.has(key) or not value[key] is Array:
			continue
		var expected := 2 if key == "min_size" else 4
		var source := value[key] as Array
		if source.size() != expected:
			continue
		var clean: Array = []
		var valid := true
		for entry in source:
			if typeof(entry) != TYPE_INT and typeof(entry) != TYPE_FLOAT:
				valid = false
				break
			clean.append(_round_float(float(entry)))
		if valid:
			result[key] = clean
	## 视觉属性（数组形式）
	for key in VISUAL_ARRAY_KEYS:
		if not value.has(key) or not value[key] is Array:
			continue
		var expected: int = VISUAL_ARRAY_KEYS[key]
		var source := value[key] as Array
		if source.size() != expected:
			continue
		var clean: Array = []
		var valid := true
		for entry in source:
			if typeof(entry) != TYPE_INT and typeof(entry) != TYPE_FLOAT:
				valid = false
				break
			clean.append(_round_float(float(entry)))
		if valid:
			result[key] = clean
	## font_size（单个数值）
	if value.has("font_size"):
		var fs: Variant = value["font_size"]
		if typeof(fs) == TYPE_INT or typeof(fs) == TYPE_FLOAT:
			result["font_size"] = int(fs)
	return result


static func _merge_layout(target: Dictionary, source: Variant) -> void:
	if not source is Dictionary:
		return
	for key in LAYOUT_KEYS:
		if source.has(key):
			target[key] = (source[key] as Array).duplicate()


static func _sorted_dictionary(source: Dictionary) -> Dictionary:
	var result: Dictionary = {}
	var keys := source.keys()
	keys.sort()
	for key in keys:
		var value: Variant = source[key]
		if value is Dictionary:
			result[key] = _sorted_dictionary(value)
		elif value is Array:
			var rounded: Array = []
			for entry in value:
				rounded.append(_round_float(float(entry)) if entry is float else entry)
			result[key] = rounded
		elif typeof(value) == TYPE_INT:
			result[key] = value
		else:
			result[key] = value
	return result


static func _round_float(value: float) -> float:
	return snappedf(value, 0.001)
