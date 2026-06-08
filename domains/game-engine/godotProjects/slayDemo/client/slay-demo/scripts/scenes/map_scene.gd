extends Control

const RelicViewFactoryScript := preload("res://scripts/ui/relic_view_factory.gd")
const UIThemeScript := preload("res://scripts/ui/ui_theme.gd")
const UILayoutStoreScript := preload("res://scripts/ui/ui_layout_store.gd")

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

const NODE_ICON_PATHS := {
	"battle": "res://assets/ui/icons/icon_battle.png",
	"shop": "res://assets/ui/icons/icon_shop.png",
	"chest": "res://assets/ui/icons/icon_chest.png",
	"event": "res://assets/ui/icons/icon_question.png",
	"rest": "res://assets/ui/icons/icon_rest.png",
	"result": "res://assets/ui/icons/icon_boss.png"
}

var _status_label: Label
var _relic_row: HBoxContainer
var _node_root: Control
var _node_positions: Dictionary = {}
## 连线数据：Array of {from, to, open}，供 _line_canvas._draw() 使用
var _path_lines: Array = []
var _line_canvas: Control


func _ready() -> void:
	var audio_manager: Variant = _autoload("AudioManager")
	if audio_manager != null:
		audio_manager.play_bgm("map")
	_build()


func _build() -> void:
	var background := TextureRect.new()
	background.texture = load("res://assets/backgrounds/bg_map.png")
	background.set_anchors_preset(Control.PRESET_FULL_RECT)
	background.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	background.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	add_child(background)
	UILayoutStoreScript.apply_layout(background, "map.background")

	var tint := ColorRect.new()
	tint.color = Color(0.025, 0.028, 0.032, 0.70)
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
	UIThemeScript.apply_cn(title)
	root.add_child(title)
	UILayoutStoreScript.apply_layout(title, "map.title")

	_status_label = Label.new()
	_status_label.text = _status_text()
	_status_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_status_label.add_theme_font_size_override("font_size", 16)
	UIThemeScript.apply_cn(_status_label)
	_status_label.add_theme_color_override("font_color", Color(0.92, 0.84, 0.72))
	root.add_child(_status_label)
	UILayoutStoreScript.apply_layout(_status_label, "map.status")

	_relic_row = HBoxContainer.new()
	_relic_row.name = "MapRelicRow"
	_relic_row.alignment = BoxContainer.ALIGNMENT_CENTER
	_relic_row.add_theme_constant_override("separation", 6)
	root.add_child(_relic_row)
	_render_relics()

	_node_root = Control.new()
	_node_root.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_node_root.custom_minimum_size = Vector2(0, 600)
	root.add_child(_node_root)
	UILayoutStoreScript.apply_layout(_node_root, "map.node_surface")

	## 连线画布：铺满 _node_root，在节点按钮之下绘制
	_line_canvas = Control.new()
	_line_canvas.set_anchors_preset(Control.PRESET_FULL_RECT)
	_line_canvas.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_line_canvas.z_index = -1
	_line_canvas.draw.connect(_draw_path_lines)
	_node_root.add_child(_line_canvas)

	var map_surface := ColorRect.new()
	map_surface.color = Color(0.025, 0.026, 0.026, 0.46)
	map_surface.set_anchors_preset(Control.PRESET_FULL_RECT)
	map_surface.mouse_filter = Control.MOUSE_FILTER_IGNORE
	map_surface.z_index = -10
	_node_root.add_child(map_surface)

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
		var index := floor_nodes.find(node_dict)
		var node_pos := _node_position(floor_index, index, floor_nodes.size(), max_floor)
		## 存按钮左上角坐标，连线时再加半个按钮尺寸得到中心
		_node_positions[node_id] = node_pos

	_render_paths(nodes, completed, available)

	for node in nodes:
		var node_dict := node as Dictionary
		var node_id := str(node_dict.get("id", ""))
		var floor_index := int(node_dict.get("floor", 1))
		var floor_nodes := floors[floor_index] as Array
		var index := floor_nodes.find(node_dict)
		var node_pos := _node_position(floor_index, index, floor_nodes.size(), max_floor)
		var selectable := available.has(node_id)
		var done := completed.has(node_id)

		var button := Button.new()
		button.text = ""
		button.custom_minimum_size = Vector2(144, 64)
		button.position = node_pos
		button.disabled = not selectable
		button.add_theme_stylebox_override("normal", _node_style(str(node_dict.get("type", "")), done, selectable))
		button.add_theme_stylebox_override("hover", _node_style(str(node_dict.get("type", "")), done, true))
		button.pressed.connect(_on_node_pressed.bind(node_id))
		_add_node_content(button, node_dict, selectable, done)
		_node_root.add_child(button)
		UILayoutStoreScript.apply_layout(button, "map.node.root", node_id)


func _render_paths(nodes: Array, completed: Array, available: Array) -> void:
	## 节点中心偏移（按钮尺寸 144×64 的一半）
	const NODE_HALF := Vector2(72.0, 32.0)
	_path_lines.clear()
	for node in nodes:
		var node_dict := node as Dictionary
		var from_id := str(node_dict.get("id", ""))
		if not _node_positions.has(from_id):
			continue
		for next_id_value in node_dict.get("next_nodes", []):
			var next_id := str(next_id_value)
			if not _node_positions.has(next_id):
				continue
			_path_lines.append({
				"from": _node_positions[from_id] + NODE_HALF,
				"to":   _node_positions[next_id] + NODE_HALF,
				"open": completed.has(from_id) or available.has(from_id),
			})
	if _line_canvas != null:
		_line_canvas.call_deferred("queue_redraw")


func _draw_path_lines() -> void:
	for line_data in _path_lines:
		var from: Vector2 = line_data["from"]
		var to: Vector2   = line_data["to"]
		var open: bool    = line_data["open"]
		## 描边（深色）
		_line_canvas.draw_line(from, to, Color(0.02, 0.018, 0.012, 0.86), 8.0 if open else 6.0, true)
		## 主线
		var col := Color(1.0, 0.78, 0.30, 0.95) if open else Color(0.62, 0.52, 0.34, 0.62)
		_line_canvas.draw_line(from, to, col, 4.0 if open else 3.0, true)


func _node_position(floor_index: int, index: int, count: int, max_floor: int) -> Vector2:
	var viewport_size := get_viewport_rect().size
	var width := maxf(1.0, viewport_size.x - 56.0)
	var height := maxf(1.0, viewport_size.y - 130.0)
	var x_step := width / float(max_floor + 1)
	var center_y := height * 0.5
	var y_gap := 80.0
	var y := center_y + (float(index) - float(count - 1) * 0.5) * y_gap
	return Vector2(x_step * floor_index - 72.0, y - 32.0)


func _node_text(node: Dictionary, selectable: bool, done: bool) -> String:
	var node_type := str(node.get("type", ""))
	var prefix := "✓ " if done else ""
	var suffix := " 可选" if selectable else ""
	if bool(node.get("is_final", false)):
		return "%sBoss%s" % [prefix, suffix]
	return "%s%s\n%d 层%s" % [prefix, NODE_LABELS.get(node_type, node_type), int(node.get("floor", 0)), suffix]


func _add_node_content(button: Button, node: Dictionary, selectable: bool, done: bool) -> void:
	var node_type := str(node.get("type", ""))
	var icon_path := str(NODE_ICON_PATHS.get(node_type, NODE_ICON_PATHS["event"]))
	if bool(node.get("is_final", false)):
		icon_path = str(NODE_ICON_PATHS["result"])

	var icon := TextureRect.new()
	icon.texture = load(icon_path)
	icon.position = Vector2(9, 14)
	icon.size = Vector2(34, 34)
	icon.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	icon.modulate = Color(1, 1, 1, 1) if selectable or done else Color(0.62, 0.62, 0.62, 0.82)
	icon.mouse_filter = Control.MOUSE_FILTER_IGNORE
	button.add_child(icon)
	UILayoutStoreScript.apply_layout(icon, "map.node.icon", str(node.get("id", "")))

	var label := Label.new()
	label.text = _node_text(node, selectable, done)
	label.anchor_left = 0.34
	label.anchor_top = 0.08
	label.anchor_right = 0.96
	label.anchor_bottom = 0.92
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
	label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	label.add_theme_font_size_override("font_size", 14)
	label.add_theme_color_override("font_color", Color(0.98, 0.91, 0.74) if selectable or done else Color(0.72, 0.68, 0.58))
	label.add_theme_color_override("font_shadow_color", Color(0.06, 0.045, 0.035, 0.9))
	label.add_theme_constant_override("shadow_offset_x", 1)
	label.add_theme_constant_override("shadow_offset_y", 1)
	label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	button.add_child(label)
	UILayoutStoreScript.apply_layout(label, "map.node.label", str(node.get("id", "")))

	if done:
		var check := Label.new()
		check.text = "✓"
		check.anchor_left = 0.74
		check.anchor_top = -0.04
		check.anchor_right = 0.98
		check.anchor_bottom = 0.36
		check.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
		check.vertical_alignment = VERTICAL_ALIGNMENT_TOP
		check.add_theme_font_size_override("font_size", 24)
		check.add_theme_color_override("font_color", Color(0.55, 1.0, 0.58))
		check.add_theme_color_override("font_shadow_color", Color(0.02, 0.05, 0.02, 0.95))
		check.add_theme_constant_override("shadow_offset_x", 2)
		check.add_theme_constant_override("shadow_offset_y", 2)
		check.mouse_filter = Control.MOUSE_FILTER_IGNORE
		button.add_child(check)
		UILayoutStoreScript.apply_layout(check, "map.node.completed", str(node.get("id", "")))


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
		color = Color(0.12, 0.18, 0.13, 0.82)
	elif not selectable:
		color = Color(color.r * 0.45, color.g * 0.45, color.b * 0.45, 0.62)
	style.bg_color = color
	style.border_color = Color(0.95, 0.82, 0.48, 0.95) if selectable else (Color(0.50, 0.95, 0.48, 0.9) if done else Color(0.32, 0.29, 0.22, 0.82))
	style.set_border_width_all(3 if selectable else (2 if done else 1))
	style.set_corner_radius_all(8)
	style.content_margin_left = 8
	style.content_margin_top = 6
	style.content_margin_right = 8
	style.content_margin_bottom = 6
	return style


func _on_node_pressed(node_id: String) -> void:
	var audio_manager: Variant = _autoload("AudioManager")
	if audio_manager != null:
		audio_manager.play_sfx("button")
	var run_controller: Variant = _autoload("RunController")
	run_controller.select_map_node(node_id)


func _autoload(autoload_name: String) -> Variant:
	return get_node_or_null("/root/%s" % autoload_name)


func _clear_children(node: Node) -> void:
	for child in node.get_children():
		child.queue_free()
