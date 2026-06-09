extends Control

const _UIBuilder := preload("res://addons/ui_builder/ui_builder.gd")
const RelicViewFactoryScript := preload("res://scripts/ui/relic_view_factory.gd")
const UILayoutStoreScript    := preload("res://scripts/ui/ui_layout_store.gd")
const SF := preload("res://scripts/ui/ui_style_factory.gd")

const SPEC_PATH := "res://ui_specs/map.ui.json"

const NODE_LABELS := {
	"battle": "战斗", "shop": "商店", "chest": "宝箱",
	"event": "事件", "rest": "休息", "result": "终点"
}
const NODE_COLORS := {
	"battle": Color(0.48, 0.22, 0.38, 0.92), "shop": Color(0.42, 0.32, 0.52, 0.92),
	"chest": Color(0.55, 0.38, 0.22, 0.92), "event": Color(0.35, 0.24, 0.50, 0.92),
	"rest": Color(0.22, 0.38, 0.34, 0.92), "result": Color(0.38, 0.22, 0.52, 0.92)
}
const NODE_ICON_PATHS := {
	"battle": "res://assets/ui/icons/icon_battle.png",
	"shop":   "res://assets/ui/icons/icon_shop.png",
	"chest":  "res://assets/ui/icons/icon_chest.png",
	"event":  "res://assets/ui/icons/icon_question.png",
	"rest":   "res://assets/ui/icons/icon_rest.png",
	"result": "res://assets/ui/icons/icon_boss.png"
}

var _status_label: Label
var _relic_row: HBoxContainer
var _node_root: Control
var _node_positions: Dictionary = {}
var _path_lines: Array = []
var _line_canvas: Control


func _ready() -> void:
	var audio_manager: Variant = _autoload("AudioManager")
	if audio_manager != null:
		audio_manager.play_bgm("map")
	_build()


func _build() -> void:
	var ui := _UIBuilder.build(SPEC_PATH)
	ui.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(ui)

	_status_label = ui.find_child("StatusLabel", true, false) as Label
	if _status_label != null:
		_status_label.text = _status_text()

	_relic_row = ui.find_child("RelicRow", true, false) as HBoxContainer
	_render_relics()

	_node_root = ui.find_child("NodeSurface", true, false) as Control
	if _node_root != null:
		_node_root.size_flags_vertical = Control.SIZE_EXPAND_FILL
		_node_root.custom_minimum_size = Vector2(0, 600)
		UILayoutStoreScript.apply_layout(_node_root, "map.node_surface")

		_line_canvas = Control.new()
		_line_canvas.mouse_filter = Control.MOUSE_FILTER_IGNORE
		_line_canvas.set_anchors_preset(Control.PRESET_FULL_RECT)
		_line_canvas.z_index = 0
		_line_canvas.draw.connect(_draw_path_lines)
		_node_root.add_child(_line_canvas)
		_node_root.resized.connect(_on_node_root_resized)

		var map_surface := ColorRect.new()
		map_surface.color = Color(0.04, 0.02, 0.06, 0.15)
		map_surface.set_anchors_preset(Control.PRESET_FULL_RECT)
		map_surface.mouse_filter = Control.MOUSE_FILTER_IGNORE
		map_surface.z_index = 0
		_node_root.add_child(map_surface)

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
		button.custom_minimum_size = Vector2(110, 56)
		button.position = node_pos
		button.z_index = 5
		button.disabled = not selectable
		button.add_theme_stylebox_override("normal", _node_style(str(node_dict.get("type", "")), done, selectable))
		button.add_theme_stylebox_override("hover", _node_style(str(node_dict.get("type", "")), done, true))
		button.pressed.connect(_on_node_pressed.bind(node_id))
		_add_node_content(button, node_dict, selectable, done)
		_node_root.add_child(button)
		UILayoutStoreScript.apply_layout(button, "map.node.root", node_id)


func _render_paths(nodes: Array, completed: Array, available: Array) -> void:
	const NODE_W := 110.0
	const NODE_H := 56.0
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
				"from": from_pos + Vector2(NODE_W / 2.0, NODE_H / 2.0),
				"to":   to_pos   + Vector2(NODE_W / 2.0, NODE_H / 2.0),
				"open": available.has(str(next_id)) and (completed.has(from_id) or available.has(from_id))
			})


func _draw_path_lines() -> void:
	if _line_canvas == null:
		return
	for line in _path_lines:
		var from := line["from"] as Vector2
		var to   := line["to"]   as Vector2
		var open := bool(line.get("open", false))
		var color := Color(0.85, 0.68, 0.95, 0.72) if open else Color(0.40, 0.32, 0.50, 0.36)
		_line_canvas.draw_line(from, to, color, 2.0)


func _on_node_root_resized() -> void:
	if _line_canvas != null:
		_line_canvas.size = _node_root.size
		_line_canvas.queue_redraw()


func _node_position(floor_index: int, index: int, floor_count: int, max_floor: int) -> Vector2:
	if _node_root == null:
		return Vector2.ZERO
	var surface_size := _node_root.size
	const NODE_W := 110.0
	const NODE_H := 56.0
	var total_h := surface_size.y if surface_size.y > 0 else 600.0
	var total_w := surface_size.x if surface_size.x > 0 else 1000.0
	var y_step := total_h / float(max_floor + 1)
	var y := total_h - (float(floor_index) * y_step) - NODE_H / 2.0
	var x_step := total_w / float(floor_count + 1)
	var x := x_step * float(index + 1) - NODE_W / 2.0
	return Vector2(x, y)


func _on_node_pressed(node_id: String) -> void:
	var run_controller: Variant = _autoload("RunController")
	run_controller.select_map_node(node_id)


func _add_node_content(button: Button, node_dict: Dictionary, selectable: bool, done: bool) -> void:
	var node_type := str(node_dict.get("type", ""))
	var label_text := str(NODE_LABELS.get(node_type, node_type))
	var icon_path := str(NODE_ICON_PATHS.get(node_type, ""))
	var inner := VBoxContainer.new()
	inner.set_anchors_preset(Control.PRESET_FULL_RECT)
	inner.alignment = BoxContainer.ALIGNMENT_CENTER
	inner.mouse_filter = Control.MOUSE_FILTER_IGNORE
	button.add_child(inner)
	if not icon_path.is_empty() and FileAccess.file_exists(icon_path):
		var icon_rect := TextureRect.new()
		icon_rect.texture = load(icon_path)
		icon_rect.custom_minimum_size = Vector2(22, 22)
		icon_rect.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		icon_rect.expand_mode = TextureRect.EXPAND_FIT_WIDTH
		icon_rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
		icon_rect.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
		icon_rect.modulate = Color(1, 1, 1, 0.90) if (selectable or done) else Color(0.5, 0.5, 0.5, 0.6)
		inner.add_child(icon_rect)
	var lbl := Label.new()
	lbl.text = label_text
	lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	lbl.add_theme_font_size_override("font_size", 11)
	lbl.add_theme_color_override("font_color",
		Color(1, 1, 1, 0.95) if selectable else (Color(0.7, 0.9, 0.7, 0.85) if done else Color(0.6, 0.55, 0.65, 0.75)))
	lbl.mouse_filter = Control.MOUSE_FILTER_IGNORE
	inner.add_child(lbl)
	if done:
		var done_lbl := Label.new()
		done_lbl.text = "✓"
		done_lbl.add_theme_font_size_override("font_size", 10)
		done_lbl.add_theme_color_override("font_color", Color(0.5, 1.0, 0.5, 0.8))
		done_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		done_lbl.mouse_filter = Control.MOUSE_FILTER_IGNORE
		inner.add_child(done_lbl)


func _node_style(node_type: String, done: bool, selectable: bool) -> StyleBoxFlat:
	var base_color: Color = NODE_COLORS.get(node_type, Color(0.35, 0.24, 0.48, 0.88))
	var style := StyleBoxFlat.new()
	if done:
		style.bg_color = Color(base_color.r * 0.55, base_color.g * 0.55, base_color.b * 0.55, 0.60)
		style.border_color = Color(0.5, 0.5, 0.5, 0.35)
	elif selectable:
		style.bg_color = Color(base_color.r * 1.15, base_color.g * 1.05, base_color.b * 1.20, 0.96)
		style.border_color = SF.CLR_GOLD
	else:
		style.bg_color = Color(base_color.r * 0.68, base_color.g * 0.65, base_color.b * 0.72, 0.75)
		style.border_color = Color(SF.CLR_BORDER.r * 0.6, SF.CLR_BORDER.g * 0.6, SF.CLR_BORDER.b * 0.6, 0.45)
	style.set_border_width_all(2 if selectable else 1)
	style.set_corner_radius_all(10)
	style.content_margin_left = 4
	style.content_margin_top = 2
	style.content_margin_right = 4
	style.content_margin_bottom = 2
	return style


func _status_text() -> String:
	var game_state: Variant = _autoload("GameState")
	if game_state == null:
		return "选择下一个节点"
	return "HP %d/%d  金币 %d" % [
		int(game_state.player_hp), int(game_state.player_max_hp), int(game_state.player_gold)
	]


func _autoload(autoload_name: String) -> Variant:
	return get_node_or_null("/root/%s" % autoload_name)
