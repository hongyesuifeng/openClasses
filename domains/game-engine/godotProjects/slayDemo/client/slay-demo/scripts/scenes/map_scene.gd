extends Control

const _UIBuilder := preload("res://addons/ui_builder/ui_builder.gd")
const RelicViewFactoryScript := preload("res://scripts/ui/relic_view_factory.gd")

const SPEC_PATH := "res://ui_specs/map.ui.json"
const START_NODE_ID := "__visual_start"

const NODE_ICON_PATHS := {
	"start": "res://assets/ui/map/map_player_start_marker.png",
	"battle": "res://assets/ui/map/map_node_battle.png",
	"elite": "res://assets/ui/map/map_node_elite.png",
	"shop": "res://assets/ui/map/map_node_shop.png",
	"chest": "res://assets/ui/map_event/nodes/node_chest.png",
	"event": "res://assets/ui/map/map_node_event.png",
	"rest": "res://assets/ui/map/map_node_rest.png",
	"result": "res://assets/ui/map/map_node_boss.png",
	"boss": "res://assets/ui/map/map_node_boss.png",
}

const NODE_OVERLAY_ICON_PATHS := {
	"chest": "res://assets/ui/icons/icon_chest.png",
}

const NODE_SIZE := Vector2(112.0, 112.0)
const BOSS_NODE_SIZE := Vector2(128.0, 128.0)
const START_NODE_SIZE := Vector2(132.0, 162.0)

var _status_label: Label
var _relic_row: HBoxContainer
var _node_root: Control
var _node_positions: Dictionary = {}
var _path_lines: Array = []
var _line_canvas: Control


func _ready() -> void:
	var audio_manager: Variant = _autoload("AudioManager")
	if audio_manager != null and not _is_gallery_preview():
		audio_manager.play_bgm("map")
	_build()


func _build() -> void:
	var ui := _UIBuilder.build(_spec_path())
	ui.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(ui)

	_status_label = ui.find_child("StatusLabel", true, false) as Label
	if _status_label != null:
		_status_label.text = _status_text()

	_relic_row = ui.find_child("RelicRow", true, false) as HBoxContainer
	_render_relics()

	_node_root = ui.find_child("NodeSurface", true, false) as Control
	if _node_root == null:
		return

	_node_root.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_node_root.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_node_root.custom_minimum_size = Vector2(1140, 380)

	_line_canvas = Control.new()
	_line_canvas.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_line_canvas.set_anchors_preset(Control.PRESET_FULL_RECT)
	_line_canvas.z_index = 0
	_line_canvas.draw.connect(_draw_path_lines)
	_node_root.add_child(_line_canvas)
	_node_root.resized.connect(_on_node_root_resized)

	_render_nodes()


func handle_action(_action_name: String, _source: Node) -> void:
	pass


func _render_relics() -> void:
	if _relic_row == null:
		return
	for child in _relic_row.get_children():
		child.queue_free()
	var game_state: Variant = _autoload("GameState")
	var data_loader: Variant = _autoload("DataLoader")
	if game_state == null or data_loader == null:
		return
	for relic_id in game_state.owned_relic_ids:
		var relic: Dictionary = data_loader.get_relic(str(relic_id))
		if relic.is_empty():
			continue
		var callback := func(r: Dictionary) -> void:
			if _status_label != null:
				_status_label.text = "%s: %s" % [str(r.get("name", "")), str(r.get("description", ""))]
		_relic_row.add_child(RelicViewFactoryScript.create_relic_button(relic, callback))


func _render_nodes() -> void:
	if _node_root == null:
		return
	for child in _node_root.get_children():
		if child != _line_canvas:
			child.queue_free()

	var nodes := _map_nodes_for_render()
	var available := _available_node_ids_for_render(nodes)
	var completed := _completed_node_ids_for_render()
	_node_positions.clear()

	var floors := {}
	var min_floor := 999999
	var max_floor := 1
	for node in nodes:
		var node_dict := node as Dictionary
		var floor_index := int(node_dict.get("floor", 1))
		min_floor = mini(min_floor, floor_index)
		max_floor = maxi(max_floor, floor_index)
		if not floors.has(floor_index):
			floors[floor_index] = []
		(floors[floor_index] as Array).append(node_dict)

	for floor_key in floors.keys():
		var floor_nodes := floors[floor_key] as Array
		floor_nodes.sort_custom(func(a: Dictionary, b: Dictionary) -> bool:
			return str(a.get("id", "")) < str(b.get("id", ""))
		)

	for node in nodes:
		var node_dict := node as Dictionary
		var node_id := str(node_dict.get("id", ""))
		var floor_index := int(node_dict.get("floor", 1))
		var floor_nodes := floors[floor_index] as Array
		var idx := floor_nodes.find(node_dict)
		_node_positions[node_id] = _node_position(floor_index, idx, floor_nodes.size(), min_floor, max_floor, node_dict)

	if not nodes.is_empty():
		_node_positions[START_NODE_ID] = _start_node_position()
		_add_static_node(START_NODE_ID, "start", START_NODE_SIZE, _node_positions[START_NODE_ID])

	_render_paths(nodes, completed, available, min_floor)

	for node in nodes:
		var node_dict := node as Dictionary
		var node_id := str(node_dict.get("id", ""))
		var node_size := _node_size(node_dict)
		var selectable := available.has(node_id)
		var done := completed.has(node_id)

		var button := Button.new()
		button.text = ""
		button.custom_minimum_size = node_size
		button.size = node_size
		button.position = _node_positions[node_id]
		button.z_index = 5
		button.disabled = not selectable
		button.pressed.connect(_on_node_pressed.bind(node_id))
		_apply_hotspot_button_style(button, selectable)
		_add_node_content(button, node_dict, selectable, done)
		_node_root.add_child(button)


func _render_paths(nodes: Array, completed: Array, available: Array, min_floor: int) -> void:
	_path_lines.clear()
	var start_center := _node_center(START_NODE_ID)
	for node in nodes:
		var node_dict := node as Dictionary
		var from_id := str(node_dict.get("id", ""))
		if int(node_dict.get("floor", 1)) == min_floor:
			_path_lines.append({
				"from": start_center,
				"to": _node_center(from_id),
				"open": available.has(from_id) or completed.has(from_id),
			})
		for next_id in (node_dict.get("next_nodes", []) as Array):
			var to_id := str(next_id)
			if not _node_positions.has(from_id) or not _node_positions.has(to_id):
				continue
			_path_lines.append({
				"from": _node_center(from_id),
				"to": _node_center(to_id),
				"open": available.has(to_id) and (completed.has(from_id) or available.has(from_id)),
			})
	if _line_canvas != null:
		_line_canvas.queue_redraw()


func _draw_path_lines() -> void:
	if _line_canvas == null:
		return
	for line in _path_lines:
		var from := line["from"] as Vector2
		var to := line["to"] as Vector2
		var open := bool(line.get("open", false))
		_line_canvas.draw_line(from, to, Color(0.42, 0.18, 0.27, 0.86), 14.0 if open else 11.0, true)
		var color := Color(1.0, 0.93, 0.40, 1.0) if open else Color(1.0, 0.86, 0.42, 0.86)
		_line_canvas.draw_line(from, to, color, 8.0 if open else 6.0, true)
		_line_canvas.draw_line(from, to, Color(1.0, 0.98, 0.70, 0.55), 3.0, true)
		_draw_arrow(from, to, color, open)


func _draw_arrow(from: Vector2, to: Vector2, color: Color, open: bool) -> void:
	var direction := to - from
	if direction.length() < 1.0:
		return
	var unit := direction.normalized()
	var arrow_center := to - unit * 56.0
	var side := Vector2(-unit.y, unit.x)
	var size := 14.0 if open else 11.0
	var arrow_points := PackedVector2Array([
		arrow_center + unit * size,
		arrow_center - unit * size * 0.75 + side * size * 0.55,
		arrow_center - unit * size * 0.75 - side * size * 0.55,
	])
	_line_canvas.draw_colored_polygon(arrow_points, color)


func _on_node_root_resized() -> void:
	if _line_canvas != null:
		_line_canvas.queue_redraw()


func _node_position(floor_index: int, index: int, floor_count: int, min_floor: int, max_floor: int, node_dict: Dictionary) -> Vector2:
	if _node_root == null:
		return Vector2.ZERO
	var surface_size := _node_root.size
	var node_size := _node_size(node_dict)
	var total_w := surface_size.x if surface_size.x > 0 else 1140.0
	var total_h := surface_size.y if surface_size.y > 0 else 380.0
	var route_columns := maxi(1, max_floor - min_floor + 1)
	var start_reserved := START_NODE_SIZE.x + 38.0
	var right_reserved := BOSS_NODE_SIZE.x * 0.55
	var usable_w := maxf(240.0, total_w - start_reserved - right_reserved)
	var x_step := usable_w / float(route_columns)
	var x := start_reserved + float(floor_index - min_floor) * x_step + (x_step - node_size.x) / 2.0
	var y_step := total_h / float(floor_count + 1)
	var y := y_step * float(index + 1) - node_size.y / 2.0
	if floor_count == 1:
		y += sin(float(floor_index) * 1.7) * 42.0
	return Vector2(x, y)


func _on_node_pressed(node_id: String) -> void:
	var run_controller: Variant = _autoload("RunController")
	if run_controller != null:
		run_controller.select_map_node(node_id)


func _add_node_content(button: Button, node_dict: Dictionary, selectable: bool, done: bool) -> void:
	var node_type := _node_visual_type(node_dict)
	var icon_path := str(NODE_ICON_PATHS.get(node_type, ""))
	if icon_path.is_empty() or not FileAccess.file_exists(icon_path):
		return
	var icon_rect := TextureRect.new()
	icon_rect.texture = load(icon_path)
	icon_rect.set_anchors_preset(Control.PRESET_FULL_RECT)
	icon_rect.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT
	icon_rect.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	icon_rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
	icon_rect.modulate = Color(1.08, 1.06, 1.08, 1.0) if selectable else (Color(1, 1, 1, 0.96) if done else Color(0.92, 0.88, 0.96, 0.92))
	button.add_child(icon_rect)
	_add_node_overlay_icon(button, node_type)


func _node_visual_type(node_dict: Dictionary) -> String:
	if bool(node_dict.get("is_final", false)):
		return "boss"
	var node_type := str(node_dict.get("type", ""))
	if node_type == "result":
		return "boss"
	return node_type


func _apply_hotspot_button_style(button: Button, selectable: bool) -> void:
	var empty := StyleBoxEmpty.new()
	var normal_style: StyleBox = _selected_node_style() if selectable else empty
	for state in ["normal", "hover", "pressed"]:
		button.add_theme_stylebox_override(state, normal_style)
	for state in ["disabled", "focus"]:
		button.add_theme_stylebox_override(state, empty)
	button.add_theme_color_override("font_color", Color.TRANSPARENT)
	button.add_theme_color_override("font_hover_color", Color.TRANSPARENT)
	button.add_theme_color_override("font_pressed_color", Color.TRANSPARENT)
	button.add_theme_color_override("font_disabled_color", Color.TRANSPARENT)
	button.focus_mode = Control.FOCUS_NONE


func _selected_node_style() -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = Color(1.0, 0.34, 0.78, 0.25)
	style.border_color = Color(1.0, 0.95, 0.10, 1.0)
	style.set_border_width_all(5)
	style.set_corner_radius_all(58)
	style.set_content_margin_all(0)
	return style


func _add_static_node(node_id: String, node_type: String, node_size: Vector2, node_pos: Vector2) -> void:
	var icon_path := str(NODE_ICON_PATHS.get(node_type, ""))
	if icon_path.is_empty() or not FileAccess.file_exists(icon_path):
		return
	var root := Control.new()
	root.name = node_id
	root.position = node_pos
	root.size = node_size
	root.custom_minimum_size = node_size
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.z_index = 4
	_node_root.add_child(root)

	var rect := TextureRect.new()
	rect.texture = load(icon_path)
	rect.position = Vector2(0, 0)
	rect.size = Vector2(node_size.x, node_size.x)
	rect.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT
	rect.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(rect)

	if node_type == "start":
		var label := Label.new()
		label.text = "起点"
		label.position = Vector2(18, node_size.x - 10)
		label.size = Vector2(node_size.x - 36, 38)
		label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
		label.add_theme_font_size_override("font_size", 25)
		label.add_theme_color_override("font_color", Color(1.0, 0.93, 0.92))
		label.add_theme_color_override("font_shadow_color", Color(0.45, 0.08, 0.28, 0.85))
		label.add_theme_constant_override("shadow_offset_x", 0)
		label.add_theme_constant_override("shadow_offset_y", 2)
		var label_bg := StyleBoxFlat.new()
		label_bg.bg_color = Color(0.88, 0.27, 0.58, 0.96)
		label_bg.border_color = Color(1.0, 0.86, 0.48, 0.95)
		label_bg.set_border_width_all(2)
		label_bg.set_corner_radius_all(14)
		label.add_theme_stylebox_override("normal", label_bg)
		root.add_child(label)


func _node_center(node_id: String) -> Vector2:
	if not _node_positions.has(node_id):
		return Vector2.ZERO
	if node_id == START_NODE_ID:
		return (_node_positions[node_id] as Vector2) + Vector2(START_NODE_SIZE.x * 0.82, START_NODE_SIZE.x * 0.50)
	var node := _node_by_id(node_id)
	return (_node_positions[node_id] as Vector2) + _node_size(node) / 2.0


func _start_node_position() -> Vector2:
	if _node_root == null:
		return Vector2.ZERO
	var h := _node_root.size.y if _node_root.size.y > 0 else 380.0
	return Vector2(4.0, h * 0.50 - START_NODE_SIZE.y * 0.50)


func _add_node_overlay_icon(parent: Control, node_type: String) -> void:
	var overlay_path := str(NODE_OVERLAY_ICON_PATHS.get(node_type, ""))
	if overlay_path.is_empty() or not FileAccess.file_exists(overlay_path):
		return
	var overlay := TextureRect.new()
	overlay.texture = load(overlay_path)
	overlay.anchor_left = 0.5
	overlay.anchor_top = 0.5
	overlay.anchor_right = 0.5
	overlay.anchor_bottom = 0.5
	overlay.offset_left = -31
	overlay.offset_top = -33
	overlay.offset_right = 31
	overlay.offset_bottom = 29
	overlay.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	overlay.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	overlay.mouse_filter = Control.MOUSE_FILTER_IGNORE
	overlay.modulate = Color(1.12, 1.08, 1.08, 1.0)
	parent.add_child(overlay)


func _node_size(node_dict: Dictionary) -> Vector2:
	return BOSS_NODE_SIZE if _node_visual_type(node_dict) == "boss" else NODE_SIZE


func _node_by_id(node_id: String) -> Dictionary:
	for node in _map_nodes_for_render():
		var node_dict := node as Dictionary
		if str(node_dict.get("id", "")) == node_id:
			return node_dict
	return {}


func _map_nodes_for_render() -> Array:
	var game_state: Variant = _autoload("GameState")
	if game_state != null and game_state.has_map():
		return game_state.get_all_map_nodes()
	return _preview_nodes()


func _available_node_ids_for_render(nodes: Array) -> Array:
	var game_state: Variant = _autoload("GameState")
	if game_state != null and game_state.has_map():
		return game_state.available_map_node_ids
	var lowest_floor := 999999
	for node in nodes:
		lowest_floor = mini(lowest_floor, int((node as Dictionary).get("floor", 0)))
	var result: Array = []
	for node in nodes:
		var node_dict := node as Dictionary
		if int(node_dict.get("floor", 0)) == lowest_floor:
			result.append(str(node_dict.get("id", "")))
	return result


func _completed_node_ids_for_render() -> Array:
	var game_state: Variant = _autoload("GameState")
	if game_state != null and game_state.has_map():
		return game_state.completed_map_node_ids
	return []


func _preview_nodes() -> Array:
	return [
		{"id": "preview_01", "floor": 1, "type": "battle", "next_nodes": ["preview_02a", "preview_02b"]},
		{"id": "preview_02a", "floor": 2, "type": "battle", "next_nodes": ["preview_03a"]},
		{"id": "preview_02b", "floor": 2, "type": "battle", "next_nodes": ["preview_03b"]},
		{"id": "preview_03a", "floor": 3, "type": "battle", "next_nodes": ["preview_04"]},
		{"id": "preview_03b", "floor": 3, "type": "event", "next_nodes": ["preview_04"]},
		{"id": "preview_04", "floor": 4, "type": "chest", "next_nodes": ["preview_05a", "preview_05b"]},
		{"id": "preview_05a", "floor": 5, "type": "shop", "next_nodes": ["preview_06a"]},
		{"id": "preview_05b", "floor": 5, "type": "battle", "next_nodes": ["preview_06b"]},
		{"id": "preview_06a", "floor": 6, "type": "event", "next_nodes": ["preview_07"]},
		{"id": "preview_06b", "floor": 6, "type": "shop", "next_nodes": ["preview_07"]},
		{"id": "preview_07", "floor": 7, "type": "rest", "next_nodes": ["preview_boss"]},
		{"id": "preview_boss", "floor": 8, "type": "result", "is_final": true, "next_nodes": []},
	]


func _status_text() -> String:
	var game_state: Variant = _autoload("GameState")
	if game_state == null:
		return "Select the next node"
	return "HP %d/%d  Gold %d" % [
		int(game_state.player_hp), int(game_state.player_max_hp), int(game_state.player_gold)
	]


func _autoload(autoload_name: String) -> Variant:
	if is_inside_tree():
		return get_node_or_null("/root/%s" % autoload_name)
	var tree := Engine.get_main_loop() as SceneTree
	return tree.root.get_node_or_null(autoload_name) if tree != null else null


func _spec_path() -> String:
	return str(get_meta("ui_spec_override_path", SPEC_PATH))


func _is_gallery_preview() -> bool:
	return bool(get_meta("gallery_preview", false))
