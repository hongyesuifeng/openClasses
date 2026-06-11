extends Control

const _UIBuilder := preload("res://addons/ui_builder/ui_builder.gd")
const RelicViewFactoryScript := preload("res://scripts/ui/relic_view_factory.gd")
const UILayoutStoreScript    := preload("res://scripts/ui/ui_layout_store.gd")

const SPEC_PATH := "res://ui_specs/map.ui.json"

const NODE_ICON_PATHS := {
	"battle": "res://assets/ui/map/map_node_battle.png",
	"elite":  "res://assets/ui/map/map_node_elite.png",
	"shop":   "res://assets/ui/map/map_node_shop.png",
	"chest":  "res://assets/ui/map_event/nodes/node_chest.png",
	"event":  "res://assets/ui/map/map_node_event.png",
	"rest":   "res://assets/ui/map/map_node_rest.png",
	"result": "res://assets/ui/map/map_node_boss.png",
	"boss":   "res://assets/ui/map/map_node_boss.png"
}
const NODE_SIZE := Vector2(100.0, 100.0)

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
	if _node_root != null:
		_node_root.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		_node_root.size_flags_vertical   = Control.SIZE_EXPAND_FILL
		_node_root.custom_minimum_size   = Vector2(0, 400)
		UILayoutStoreScript.apply_layout(_node_root, "map.node_surface")

		_line_canvas = Control.new()
		_line_canvas.mouse_filter = Control.MOUSE_FILTER_IGNORE
		_line_canvas.set_anchors_preset(Control.PRESET_FULL_RECT)
		_line_canvas.z_index = 0
		_line_canvas.draw.connect(_draw_path_lines)
		_node_root.add_child(_line_canvas)
		_node_root.resized.connect(_on_node_root_resized)

		_render_nodes()


func handle_action(action_name: String, _source: Node) -> void:
	pass


func _render_relics() -> void:
	if _relic_row == null:
		return
	for child in _relic_row.get_children():
		child.queue_free()
	var game_state: Variant = _autoload("GameState")
	if game_state == null:
		return
	var data_loader: Variant = _autoload("DataLoader")
	for relic_id in game_state.owned_relic_ids:
		var relic: Dictionary = data_loader.get_relic(str(relic_id))
		if relic.is_empty():
			continue
		var callback := func(r: Dictionary) -> void:
			if _status_label != null:
				_status_label.text = "%s：%s" % [str(r.get("name", "")), str(r.get("description", ""))]
		_relic_row.add_child(RelicViewFactoryScript.create_relic_button(relic, callback))


func _render_nodes() -> void:
	if _node_root == null:
		return
	var game_state: Variant = _autoload("GameState")
	var nodes: Array = game_state.get_all_map_nodes()
	var available: Array = game_state.available_map_node_ids
	var completed: Array = game_state.completed_map_node_ids
	_node_positions.clear()

	var floors := {}
	var max_floor := 1
	for node in nodes:
		var node_dict := node as Dictionary
		var floor_index := int(node_dict.get("floor", 1))
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
		_node_positions[node_id] = _node_position(floor_index, idx, floor_nodes.size(), max_floor)

	_render_paths(nodes, completed, available)

	for node in nodes:
		var node_dict := node as Dictionary
		var node_id := str(node_dict.get("id", ""))
		var floor_index := int(node_dict.get("floor", 1))
		var floor_nodes := floors[floor_index] as Array
		var idx := floor_nodes.find(node_dict)
		var node_pos := _node_position(floor_index, idx, floor_nodes.size(), max_floor)
		var selectable := available.has(node_id)
		var done := completed.has(node_id)

		var button := Button.new()
		button.text = ""
		button.custom_minimum_size = NODE_SIZE
		button.size = NODE_SIZE
		button.position = node_pos
		button.z_index = 5
		button.disabled = not selectable
		_apply_hotspot_button_style(button, selectable)
		button.pressed.connect(_on_node_pressed.bind(node_id))
		_add_node_content(button, node_dict, selectable, done)
		_node_root.add_child(button)
		UILayoutStoreScript.apply_layout(button, "map.node.root", node_id)


func _render_paths(nodes: Array, completed: Array, available: Array) -> void:
	_path_lines.clear()
	for node in nodes:
		var node_dict := node as Dictionary
		var from_id := str(node_dict.get("id", ""))
		for next_id in (node_dict.get("next_nodes", []) as Array):
			if not _node_positions.has(from_id) or not _node_positions.has(str(next_id)):
				continue
			var from_pos: Vector2 = _node_positions[from_id]
			var to_pos:   Vector2 = _node_positions[str(next_id)]
			_path_lines.append({
				"from": from_pos + NODE_SIZE / 2.0,
				"to":   to_pos   + NODE_SIZE / 2.0,
				"open": available.has(str(next_id)) and (completed.has(from_id) or available.has(from_id))
			})
	if _line_canvas != null:
		_line_canvas.queue_redraw()


func _draw_path_lines() -> void:
	if _line_canvas == null:
		return
	for line in _path_lines:
		var from := line["from"] as Vector2
		var to   := line["to"]   as Vector2
		var open := bool(line.get("open", false))
		## 描边（深紫）
		_line_canvas.draw_line(from, to, Color(0.28, 0.11, 0.28, 0.92), 13.0 if open else 10.0, true)
		## 主线（粉金色）
		var col := Color(1.0, 0.92, 0.48, 1.0) if open else Color(1.0, 0.84, 0.42, 0.82)
		_line_canvas.draw_line(from, to, col, 7.0 if open else 5.0, true)
		## 箭头
		_draw_arrow(from, to, col, open)


func _draw_arrow(from: Vector2, to: Vector2, color: Color, open: bool) -> void:
	var direction := to - from
	if direction.length() < 1.0:
		return
	var unit := direction.normalized()
	var arrow_center := to - unit * 46.0
	var side := Vector2(-unit.y, unit.x)
	var size := 15.0 if open else 12.0
	var arrow_points := PackedVector2Array([
		arrow_center + unit * size,
		arrow_center - unit * size * 0.75 + side * size * 0.55,
		arrow_center - unit * size * 0.75 - side * size * 0.55,
	])
	_line_canvas.draw_colored_polygon(arrow_points, color)


func _on_node_root_resized() -> void:
	if _line_canvas != null:
		_line_canvas.queue_redraw()


func _node_position(floor_index: int, index: int, floor_count: int, max_floor: int) -> Vector2:
	if _node_root == null:
		return Vector2.ZERO
	var surface_size := _node_root.size
	var total_w := surface_size.x if surface_size.x > 0 else 1000.0
	var total_h := surface_size.y if surface_size.y > 0 else 600.0
	## 从左到右：floor_index 控制 x，index 控制 y
	var x_step := total_w / float(max_floor + 1)
	var x := float(floor_index) * x_step + (x_step - NODE_SIZE.x) / 2.0
	var y_step := total_h / float(floor_count + 1)
	var y := y_step * float(index + 1) - NODE_SIZE.y / 2.0
	return Vector2(x, y)


func _on_node_pressed(node_id: String) -> void:
	var run_controller: Variant = _autoload("RunController")
	run_controller.select_map_node(node_id)


func _add_node_content(button: Button, node_dict: Dictionary, selectable: bool, done: bool) -> void:
	var node_type := _node_visual_type(node_dict)
	var icon_path := str(NODE_ICON_PATHS.get(node_type, ""))
	if not icon_path.is_empty() and FileAccess.file_exists(icon_path):
		var icon_rect := TextureRect.new()
		icon_rect.texture = load(icon_path)
		icon_rect.set_anchors_preset(Control.PRESET_FULL_RECT)
		icon_rect.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		icon_rect.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		icon_rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
		icon_rect.modulate = Color(1.08, 1.05, 1.08, 1.0) if selectable else (Color(1, 1, 1, 0.95) if done else Color(0.86, 0.82, 0.90, 0.86))
		button.add_child(icon_rect)


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
	style.bg_color = Color(0.91, 0.30, 0.72, 0.40)
	style.border_color = Color(1.0, 0.95, 0.10, 1.0)
	style.set_border_width_all(4)
	style.set_corner_radius_all(50)
	style.set_content_margin_all(0)
	return style


func _status_text() -> String:
	var game_state: Variant = _autoload("GameState")
	if game_state == null:
		return "选择下一个节点"
	return "HP %d/%d  金币 %d" % [
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
