extends Control

const RelicViewFactoryScript := preload("res://scripts/ui/relic_view_factory.gd")

const NODE_LABELS := {
	"battle": "战斗",
	"shop": "商店",
	"chest": "宝箱",
	"event": "事件",
	"rest": "休息",
	"result": "终点"
}

const NODE_COLORS := {
	"battle": Color(0.48, 0.16, 0.12, 0.92),
	"shop": Color(0.42, 0.32, 0.12, 0.92),
	"chest": Color(0.50, 0.36, 0.08, 0.92),
	"event": Color(0.30, 0.24, 0.46, 0.92),
	"rest": Color(0.12, 0.34, 0.28, 0.92),
	"result": Color(0.28, 0.22, 0.48, 0.92)
}

var _status_label: Label
var _relic_row: HBoxContainer
var _node_root: Control
var _node_positions: Dictionary = {}


func _ready() -> void:
	_build()


func _build() -> void:
	var background := TextureRect.new()
	background.texture = load("res://assets/backgrounds/bg_map.png")
	background.set_anchors_preset(Control.PRESET_FULL_RECT)
	background.stretch_mode = TextureRect.STRETCH_SCALE
	add_child(background)

	var tint := ColorRect.new()
	tint.color = Color(0.035, 0.04, 0.045, 0.55)
	tint.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(tint)

	var root := VBoxContainer.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.offset_left = 28
	root.offset_top = 22
	root.offset_right = -28
	root.offset_bottom = -22
	root.add_theme_constant_override("separation", 12)
	add_child(root)

	var title := Label.new()
	title.text = "Act 1 地图"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 32)
	title.add_theme_color_override("font_color", Color(0.98, 0.9, 0.72))
	root.add_child(title)

	_status_label = Label.new()
	_status_label.text = _status_text()
	_status_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_status_label.add_theme_font_size_override("font_size", 16)
	_status_label.add_theme_color_override("font_color", Color(0.92, 0.84, 0.72))
	root.add_child(_status_label)

	_relic_row = HBoxContainer.new()
	_relic_row.name = "MapRelicRow"
	_relic_row.alignment = BoxContainer.ALIGNMENT_CENTER
	_relic_row.add_theme_constant_override("separation", 6)
	root.add_child(_relic_row)
	_render_relics()

	_node_root = Control.new()
	_node_root.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_node_root.custom_minimum_size = Vector2(0, 560)
	root.add_child(_node_root)

	_render_nodes()


func _render_nodes() -> void:
	var game_state: Variant = _autoload("GameState")
	var nodes: Array = game_state.get_all_map_nodes()
	var available: Array = game_state.available_map_node_ids
	var completed: Array = game_state.completed_map_node_ids
	_node_positions.clear()

	var floors := {}
	var max_floor := 1
	for node in nodes:
		var node_dict := node as Dictionary
		var floor := int(node_dict.get("floor", 1))
		max_floor = maxi(max_floor, floor)
		if not floors.has(floor):
			floors[floor] = []
		(floors[floor] as Array).append(node_dict)

	for floor in floors.keys():
		var floor_nodes := floors[floor] as Array
		floor_nodes.sort_custom(func(a: Dictionary, b: Dictionary) -> bool:
			return str(a.get("id", "")) < str(b.get("id", ""))
		)

	for node in nodes:
		var node_dict := node as Dictionary
		var node_id := str(node_dict.get("id", ""))
		var floor := int(node_dict.get("floor", 1))
		var floor_nodes := floors[floor] as Array
		var index := floor_nodes.find(node_dict)
		var position := _node_position(floor, index, floor_nodes.size(), max_floor)
		_node_positions[node_id] = position + Vector2(66.0, 29.0)

	_render_paths(nodes, completed)

	for node in nodes:
		var node_dict := node as Dictionary
		var node_id := str(node_dict.get("id", ""))
		var floor := int(node_dict.get("floor", 1))
		var floor_nodes := floors[floor] as Array
		var index := floor_nodes.find(node_dict)
		var position := _node_position(floor, index, floor_nodes.size(), max_floor)
		var selectable := available.has(node_id)
		var done := completed.has(node_id)

		var button := Button.new()
		button.text = _node_text(node_dict, selectable, done)
		button.custom_minimum_size = Vector2(132, 58)
		button.position = position
		button.disabled = not selectable
		button.add_theme_stylebox_override("normal", _node_style(str(node_dict.get("type", "")), done, selectable))
		button.add_theme_stylebox_override("hover", _node_style(str(node_dict.get("type", "")), done, true))
		button.pressed.connect(_on_node_pressed.bind(node_id))
		_node_root.add_child(button)


func _render_paths(nodes: Array, completed: Array) -> void:
	for node in nodes:
		var node_dict := node as Dictionary
		var from_id := str(node_dict.get("id", ""))
		if not _node_positions.has(from_id):
			continue

		for next_id_value in node_dict.get("next_nodes", []):
			var next_id := str(next_id_value)
			if not _node_positions.has(next_id):
				continue

			var line := Line2D.new()
			line.width = 3.0
			line.default_color = Color(0.88, 0.72, 0.38, 0.85) if completed.has(from_id) else Color(0.32, 0.29, 0.24, 0.8)
			line.points = PackedVector2Array([_node_positions[from_id], _node_positions[next_id]])
			line.z_index = -1
			_node_root.add_child(line)


func _node_position(floor: int, index: int, count: int, max_floor: int) -> Vector2:
	var viewport_size := get_viewport_rect().size
	var width := maxf(1.0, viewport_size.x - 56.0)
	var height := maxf(1.0, viewport_size.y - 130.0)
	var x_step := width / float(max_floor + 1)
	var center_y := height * 0.5
	var y_gap := 92.0
	var y := center_y + (float(index) - float(count - 1) * 0.5) * y_gap
	return Vector2(x_step * floor - 66.0, y - 29.0)


func _node_text(node: Dictionary, selectable: bool, done: bool) -> String:
	var node_type := str(node.get("type", ""))
	var prefix := "✓ " if done else ""
	var suffix := "\n可选择" if selectable else ""
	if bool(node.get("is_final", false)):
		return "%sBoss%s" % [prefix, suffix]
	return "%s%s\n%d 层%s" % [prefix, NODE_LABELS.get(node_type, node_type), int(node.get("floor", 0)), suffix]


func _status_text() -> String:
	var game_state: Variant = _autoload("GameState")
	return "HP %d/%d  金币 %d  已胜利 %d 场" % [
		int(game_state.player_hp),
		int(game_state.player_max_hp),
		int(game_state.player_gold),
		int(game_state.battle_wins)
	]


func _render_relics() -> void:
	if _relic_row == null:
		return
	_clear_children(_relic_row)
	var game_state: Variant = _autoload("GameState")
	var relics: Array = game_state.get_owned_relics() if game_state != null else []
	var row := RelicViewFactoryScript.create_relic_row(relics, Callable(self, "_on_relic_pressed"))
	for child in row.get_children():
		row.remove_child(child)
		_relic_row.add_child(child)
	row.queue_free()


func _on_relic_pressed(relic: Dictionary) -> void:
	_status_label.text = "%s  |  %s" % [_status_text(), RelicViewFactoryScript.detail_text(relic)]


func _node_style(node_type: String, done: bool, selectable: bool) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	var color: Color = NODE_COLORS.get(node_type, Color(0.2, 0.22, 0.24, 0.9))
	if done:
		color = Color(0.12, 0.14, 0.14, 0.72)
	elif not selectable:
		color = Color(color.r * 0.45, color.g * 0.45, color.b * 0.45, 0.62)
	style.bg_color = color
	style.border_color = Color(0.95, 0.82, 0.48, 0.9) if selectable else Color(0.25, 0.23, 0.2, 0.8)
	style.set_border_width_all(2 if selectable else 1)
	style.set_corner_radius_all(8)
	style.content_margin_left = 8
	style.content_margin_top = 6
	style.content_margin_right = 8
	style.content_margin_bottom = 6
	return style


func _on_node_pressed(node_id: String) -> void:
	var run_controller: Variant = _autoload("RunController")
	run_controller.select_map_node(node_id)


func _autoload(name: String) -> Variant:
	return get_node_or_null("/root/%s" % name)


func _clear_children(node: Node) -> void:
	for child in node.get_children():
		child.queue_free()
