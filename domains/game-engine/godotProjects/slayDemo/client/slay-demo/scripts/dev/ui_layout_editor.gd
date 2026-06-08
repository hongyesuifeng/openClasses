extends Control
class_name UILayoutEditor

const UILayoutStoreScript := preload("res://scripts/ui/ui_layout_store.gd")

signal closed(saved: bool)

var _preview_host: Control
var _interaction: Control
var _preview: Control
var _selected: Control
var _tree: Tree
var _fields: Dictionary = {}
var _visual_section: Control
var _label_section: Control
var _instance_toggle: CheckBox
var _grid_toggle: CheckBox
var _resolution: OptionButton
var _selected_label: Label
var _zoom_label: Label
var _status_label: Label
var _zoom := 1.0
var _undo: Array[Dictionary] = []
var _redo: Array[Dictionary] = []
var _initial: Dictionary = {}
var _drag_mode := ""
var _drag_start := Vector2.ZERO
var _before_drag: Dictionary = {}
var _syncing := false
## live 模式：直接操作真实场景节点，不 duplicate，画布区隐藏
var _live_mode := false


func open(source: Control, live_mode := false) -> void:
	_live_mode = live_mode
	set_anchors_preset(Control.PRESET_FULL_RECT)
	z_index = 1000
	_build_ui()

	if _live_mode:
		## Live 模式：直接持有真实节点，隐藏画布区，背后场景即是预览
		_preview = source
		if _preview_host != null:
			_preview_host.get_parent().visible = false
		_interaction = Control.new()  ## 虚拟 interaction，不需要实际绘制
	else:
		_preview = source.duplicate() as Control
		if _preview == null:
			_preview = ColorRect.new()
			(_preview as ColorRect).color = Color(0.3, 0.35, 0.45)
			_preview.custom_minimum_size = source.size
			_preview.set_meta("layout_element_id", str(source.get_meta("layout_element_id", "gallery.preview")))
		_preview.position = Vector2(80, 60)
		_preview_host.add_child(_preview)
		_disable_input(_preview)
		_interaction.move_to_front()

	_build_tree()
	for control in _editable_controls(_preview):
		_initial[control] = _snapshot(control)
	var editable := _editable_controls(_preview)
	_select_control(editable[0] if not editable.is_empty() else _preview)
	if not _live_mode:
		_interaction.grab_focus()


func _build_ui() -> void:
	var shade := ColorRect.new()
	shade.color = Color(0.025, 0.03, 0.04, 0.98)
	shade.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(shade)

	var root := VBoxContainer.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.add_theme_constant_override("separation", 4)
	add_child(root)

	var toolbar := HBoxContainer.new()
	toolbar.custom_minimum_size.y = 46
	toolbar.add_theme_constant_override("separation", 6)
	root.add_child(toolbar)
	_add_button(toolbar, "撤销", _undo_change)
	_add_button(toolbar, "重做", _redo_change)
	_add_button(toolbar, "重置选中项", _reset_selected)
	_add_button(toolbar, "重置当前模板", _reset_template)

	_resolution = OptionButton.new()
	for label in ["1280×720", "1600×900", "1920×1080", "1024×768"]:
		_resolution.add_item(label)
	_resolution.item_selected.connect(_set_resolution)
	toolbar.add_child(_resolution)

	_add_button(toolbar, "缩小", func(): _set_zoom(_zoom / 1.1))
	_grid_toggle = CheckBox.new()
	_grid_toggle.text = "8px 网格吸附"
	_grid_toggle.button_pressed = true
	_grid_toggle.toggled.connect(func(_enabled: bool): _interaction.queue_redraw())
	toolbar.add_child(_grid_toggle)

	_zoom_label = Label.new()
	_zoom_label.text = "缩放 100%"
	toolbar.add_child(_zoom_label)
	_add_button(toolbar, "放大", func(): _set_zoom(_zoom * 1.1))

	var help := Label.new()
	help.text = "左侧选元素  |  中间拖动  |  蓝色方块缩放"
	help.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	help.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	toolbar.add_child(help)

	var columns := HSplitContainer.new()
	columns.size_flags_vertical = Control.SIZE_EXPAND_FILL
	root.add_child(columns)

	_tree = Tree.new()
	_tree.custom_minimum_size.x = 220
	_tree.hide_root = true
	_tree.item_selected.connect(_on_tree_selected)
	columns.add_child(_tree)

	var work_area := HSplitContainer.new()
	work_area.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	columns.add_child(work_area)

	var viewport_panel := PanelContainer.new()
	viewport_panel.name = "EditableCanvasPanel"
	viewport_panel.custom_minimum_size = Vector2(500, 400)
	viewport_panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	viewport_panel.size_flags_vertical = Control.SIZE_EXPAND_FILL
	var viewport_style := StyleBoxFlat.new()
	viewport_style.bg_color = Color(0.055, 0.06, 0.075)
	viewport_style.border_color = Color(0.35, 0.68, 0.92)
	viewport_style.set_border_width_all(3)
	viewport_style.set_content_margin_all(10)
	viewport_panel.add_theme_stylebox_override("panel", viewport_style)
	## live 模式：画布区折叠，背后的真实场景本身就是预览
	viewport_panel.visible = not _live_mode
	work_area.add_child(viewport_panel)

	_preview_host = Control.new()
	_preview_host.custom_minimum_size = Vector2(480, 360)
	_preview_host.set_anchors_preset(Control.PRESET_FULL_RECT)
	_preview_host.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_preview_host.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_preview_host.mouse_filter = Control.MOUSE_FILTER_PASS
	_preview_host.clip_contents = true
	viewport_panel.add_child(_preview_host)

	_interaction = Control.new()
	_interaction.set_anchors_preset(Control.PRESET_FULL_RECT)
	_interaction.mouse_filter = Control.MOUSE_FILTER_STOP
	_interaction.focus_mode = Control.FOCUS_ALL
	_interaction.gui_input.connect(_on_canvas_input)
	_interaction.draw.connect(_draw_selection)
	_preview_host.add_child(_interaction)

	var canvas_hint := Label.new()
	canvas_hint.text = "可操作画布"
	canvas_hint.position = Vector2(12, 10)
	canvas_hint.mouse_filter = Control.MOUSE_FILTER_IGNORE
	canvas_hint.add_theme_font_size_override("font_size", 18)
	canvas_hint.add_theme_color_override("font_color", Color(0.52, 0.78, 1.0))
	_preview_host.add_child(canvas_hint)
	_interaction.move_to_front()

	var inspector := VBoxContainer.new()
	inspector.name = "LayoutInspector"
	inspector.custom_minimum_size.x = 290
	inspector.add_theme_constant_override("separation", 6)
	work_area.add_child(inspector)

	var title := Label.new()
	title.text = "布局属性"
	title.add_theme_font_size_override("font_size", 18)
	inspector.add_child(title)

	var instructions := Label.new()
	instructions.text = "左侧选择元素后，在中央画布拖动。\n拖动蓝框上的方块调整尺寸。\n方向键移动 1px，Shift+方向键移动 8px。"
	instructions.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	instructions.custom_minimum_size.y = 76
	instructions.add_theme_color_override("font_color", Color(0.72, 0.82, 0.94))
	inspector.add_child(instructions)

	_selected_label = Label.new()
	_selected_label.text = "当前选择："
	_selected_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_selected_label.add_theme_color_override("font_color", Color(0.35, 0.78, 1.0))
	inspector.add_child(_selected_label)

	_instance_toggle = CheckBox.new()
	_instance_toggle.text = "仅覆盖当前实例"
	inspector.add_child(_instance_toggle)

	var property_scroll := ScrollContainer.new()
	property_scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	inspector.add_child(property_scroll)
	var property_list := VBoxContainer.new()
	property_list.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	property_scroll.add_child(property_list)
	for key in [
		"x", "y", "w", "h",
		"anchor_left", "anchor_top", "anchor_right", "anchor_bottom",
		"offset_left", "offset_top", "offset_right", "offset_bottom",
	]:
		_add_number_field(property_list, key)

	## ── 视觉属性区 ──
	var vis_sep := HSeparator.new()
	property_list.add_child(vis_sep)

	var vis_title := Label.new()
	vis_title.text = "视觉属性"
	vis_title.add_theme_font_size_override("font_size", 14)
	vis_title.add_theme_color_override("font_color", Color(0.72, 0.86, 1.0))
	property_list.add_child(vis_title)

	_visual_section = VBoxContainer.new()
	_visual_section.add_theme_constant_override("separation", 4)
	property_list.add_child(_visual_section)

	## modulate / scale（所有节点）
	for key in ["modulate_r", "modulate_g", "modulate_b", "modulate_a", "scale_x", "scale_y"]:
		_add_visual_field(_visual_section, key)

	## Label 专属
	_label_section = VBoxContainer.new()
	_label_section.add_theme_constant_override("separation", 4)
	var lbl_sep := HSeparator.new()
	_label_section.add_child(lbl_sep)
	var lbl_title := Label.new()
	lbl_title.text = "文字属性 (Label)"
	lbl_title.add_theme_font_size_override("font_size", 13)
	lbl_title.add_theme_color_override("font_color", Color(1.0, 0.86, 0.55))
	_label_section.add_child(lbl_title)
	for key in ["font_size", "font_color_r", "font_color_g", "font_color_b", "font_color_a"]:
		_add_visual_field(_label_section, key)
	_visual_section.add_child(_label_section)

	var separator := HSeparator.new()
	inspector.add_child(separator)

	_status_label = Label.new()
	_status_label.text = "修改尚未保存"
	_status_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_status_label.add_theme_color_override("font_color", Color(1.0, 0.78, 0.35))
	inspector.add_child(_status_label)

	var save_button := Button.new()
	save_button.name = "ApplyAndSaveButton"
	save_button.text = "应用并保存"
	save_button.custom_minimum_size.y = 48
	save_button.add_theme_font_size_override("font_size", 18)
	save_button.pressed.connect(_save_and_close)
	inspector.add_child(save_button)

	var discard_button := Button.new()
	discard_button.name = "DiscardAndCloseButton"
	discard_button.text = "放弃更改并关闭"
	discard_button.custom_minimum_size.y = 38
	discard_button.pressed.connect(_close_without_save)
	inspector.add_child(discard_button)


func _add_button(parent: Control, text: String, callback: Callable) -> void:
	var button := Button.new()
	button.text = text
	button.pressed.connect(callback)
	parent.add_child(button)


func _add_number_field(parent: Control, key: String) -> void:
	var row := HBoxContainer.new()
	parent.add_child(row)
	var label := Label.new()
	label.text = key
	label.custom_minimum_size.x = 105
	row.add_child(label)
	var field := SpinBox.new()
	field.allow_greater = true
	field.allow_lesser = true
	field.min_value = -4096
	field.max_value = 4096
	field.step = 0.001 if key.begins_with("anchor") else 1.0
	field.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	field.value_changed.connect(_on_field_changed.bind(key))
	row.add_child(field)
	_fields[key] = field


func _add_visual_field(parent: Control, key: String) -> void:
	var row := HBoxContainer.new()
	parent.add_child(row)
	var label := Label.new()
	label.text = key
	label.custom_minimum_size.x = 105
	row.add_child(label)
	var field := SpinBox.new()
	field.allow_greater = true
	field.allow_lesser = true
	if key == "font_size":
		field.min_value = 8
		field.max_value = 72
		field.step = 1.0
	elif key.begins_with("scale"):
		field.min_value = 0.01
		field.max_value = 10.0
		field.step = 0.01
	else:
		## modulate_* / font_color_*：0.0 ~ 1.0
		field.min_value = 0.0
		field.max_value = 1.0
		field.step = 0.01
	field.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	field.value_changed.connect(_on_field_changed.bind(key))
	row.add_child(field)
	_fields[key] = field


func _build_tree() -> void:
	_tree.clear()
	var root_item := _tree.create_item()
	_add_tree_control(_preview, root_item)


func _add_tree_control(control: Control, parent_item: TreeItem) -> void:
	if control.has_meta("layout_element_id"):
		var item := _tree.create_item(parent_item)
		item.set_text(0, str(control.get_meta("layout_element_id")))
		item.set_metadata(0, control)
		parent_item = item
	for child in control.get_children():
		if child is Control:
			_add_tree_control(child as Control, parent_item)


func _on_tree_selected() -> void:
	var item := _tree.get_selected()
	if item != null and item.get_metadata(0) is Control:
		_select_control(item.get_metadata(0) as Control)


func _select_control(control: Control) -> void:
	_selected = control
	if _selected_label != null:
		_selected_label.text = "当前选择：%s" % str(control.get_meta("layout_element_id", control.name))
	_sync_fields()
	_interaction.queue_redraw()


func _sync_fields() -> void:
	if _selected == null:
		return
	_syncing = true
	_fields["x"].value = _selected.position.x
	_fields["y"].value = _selected.position.y
	_fields["w"].value = _selected.size.x
	_fields["h"].value = _selected.size.y
	_fields["anchor_left"].value = _selected.anchor_left
	_fields["anchor_top"].value = _selected.anchor_top
	_fields["anchor_right"].value = _selected.anchor_right
	_fields["anchor_bottom"].value = _selected.anchor_bottom
	_fields["offset_left"].value = _selected.offset_left
	_fields["offset_top"].value = _selected.offset_top
	_fields["offset_right"].value = _selected.offset_right
	_fields["offset_bottom"].value = _selected.offset_bottom
	## 视觉属性
	_fields["modulate_r"].value = _selected.modulate.r
	_fields["modulate_g"].value = _selected.modulate.g
	_fields["modulate_b"].value = _selected.modulate.b
	_fields["modulate_a"].value = _selected.modulate.a
	_fields["scale_x"].value = _selected.scale.x
	_fields["scale_y"].value = _selected.scale.y
	## Label 专属字段
	var is_label := _selected is Label
	if _label_section != null:
		_label_section.visible = is_label
	if is_label:
		var lbl := _selected as Label
		var fs := lbl.get_theme_font_size("font_size") if lbl.has_theme_font_size_override("font_size") else lbl.get_theme_font_size("font_size")
		_fields["font_size"].value = fs
		var fc := lbl.get_theme_color("font_color") if lbl.has_theme_color_override("font_color") else Color(0.96, 0.91, 0.82)
		_fields["font_color_r"].value = fc.r
		_fields["font_color_g"].value = fc.g
		_fields["font_color_b"].value = fc.b
		_fields["font_color_a"].value = fc.a
	_instance_toggle.disabled = str(_selected.get_meta("layout_instance_id", "")) == ""
	_syncing = false


func _on_field_changed(value: float, key: String) -> void:
	if _syncing or _selected == null:
		return
	_push_undo()
	match key:
		"x": _selected.position.x = value
		"y": _selected.position.y = value
		"w": _selected.size.x = maxf(value, _selected.custom_minimum_size.x)
		"h": _selected.size.y = maxf(value, _selected.custom_minimum_size.y)
		"anchor_left": _selected.anchor_left = value
		"anchor_top": _selected.anchor_top = value
		"anchor_right": _selected.anchor_right = value
		"anchor_bottom": _selected.anchor_bottom = value
		"offset_left": _selected.offset_left = value
		"offset_top": _selected.offset_top = value
		"offset_right": _selected.offset_right = value
		"offset_bottom": _selected.offset_bottom = value
		"modulate_r": _selected.modulate.r = value
		"modulate_g": _selected.modulate.g = value
		"modulate_b": _selected.modulate.b = value
		"modulate_a": _selected.modulate.a = value
		"scale_x": _selected.scale.x = value
		"scale_y": _selected.scale.y = value
		"font_size":
			if _selected is Label:
				(_selected as Label).add_theme_font_size_override("font_size", int(value))
		"font_color_r", "font_color_g", "font_color_b", "font_color_a":
			if _selected is Label:
				var lbl := _selected as Label
				var fc := lbl.get_theme_color("font_color") if lbl.has_theme_color_override("font_color") else Color(0.96, 0.91, 0.82)
				match key:
					"font_color_r": fc.r = value
					"font_color_g": fc.g = value
					"font_color_b": fc.b = value
					"font_color_a": fc.a = value
				lbl.add_theme_color_override("font_color", fc)
	_interaction.queue_redraw()
	_mark_dirty()


func _on_canvas_input(event: InputEvent) -> void:
	if _selected == null:
		return
	if event is InputEventKey:
		var key := event as InputEventKey
		if key.pressed and key.keycode in [KEY_LEFT, KEY_RIGHT, KEY_UP, KEY_DOWN]:
			var amount := 8.0 if key.shift_pressed else 1.0
			var direction := Vector2.ZERO
			match key.keycode:
				KEY_LEFT: direction = Vector2.LEFT
				KEY_RIGHT: direction = Vector2.RIGHT
				KEY_UP: direction = Vector2.UP
				KEY_DOWN: direction = Vector2.DOWN
			_push_undo()
			_selected.position += direction * amount
			_sync_fields()
			_interaction.queue_redraw()
			_mark_dirty()
			accept_event()
			return
	if event is InputEventMouseButton:
		var mouse := event as InputEventMouseButton
		if mouse.button_index == MOUSE_BUTTON_WHEEL_UP and mouse.pressed:
			_set_zoom(_zoom * 1.1)
		elif mouse.button_index == MOUSE_BUTTON_WHEEL_DOWN and mouse.pressed:
			_set_zoom(_zoom / 1.1)
		elif mouse.button_index == MOUSE_BUTTON_LEFT:
			_interaction.grab_focus()
			if mouse.pressed:
				var hit := _pick_editable(_preview, mouse.position)
				if hit != null:
					_select_control(hit)
				_drag_mode = _resize_mode(mouse.position)
				_drag_start = mouse.position
				_before_drag = _snapshot(_selected)
			elif _drag_mode != "":
				_commit_drag()
	elif event is InputEventMouseMotion and _drag_mode != "":
		var delta := (event as InputEventMouseMotion).position - _drag_start
		_apply_drag(delta)


func _pick_editable(control: Control, point: Vector2) -> Control:
	for index in range(control.get_child_count() - 1, -1, -1):
		var child := control.get_child(index)
		if child is Control:
			var hit := _pick_editable(child as Control, point)
			if hit != null:
				return hit
	if control.has_meta("layout_element_id") and _rect_in_editor(control).has_point(point):
		return control
	return null


func _resize_mode(point: Vector2) -> String:
	var rect := _rect_in_editor(_selected)
	var left := absf(point.x - rect.position.x) <= 7
	var right := absf(point.x - rect.end.x) <= 7
	var top := absf(point.y - rect.position.y) <= 7
	var bottom := absf(point.y - rect.end.y) <= 7
	if top and left: return "tl"
	if top and right: return "tr"
	if bottom and left: return "bl"
	if bottom and right: return "br"
	if left: return "l"
	if right: return "r"
	if top: return "t"
	if bottom: return "b"
	return "move"


func _apply_drag(delta: Vector2) -> void:
	_restore_snapshot(_selected, _before_drag)
	delta = _snap(delta)
	if _drag_mode == "move":
		_selected.position += delta
	else:
		var rect := Rect2(_selected.position, _selected.size)
		if "l" in _drag_mode:
			rect.position.x += delta.x
			rect.size.x -= delta.x
		if "r" in _drag_mode:
			rect.size.x += delta.x
		if "t" in _drag_mode:
			rect.position.y += delta.y
			rect.size.y -= delta.y
		if "b" in _drag_mode:
			rect.size.y += delta.y
		rect.size = rect.size.max(_selected.custom_minimum_size).max(Vector2.ONE)
		_selected.position = rect.position
		_selected.size = rect.size
	_sync_fields()
	_interaction.queue_redraw()


func _snap(value: Vector2) -> Vector2:
	if not _grid_toggle.button_pressed:
		return value
	return value.snapped(Vector2(8, 8))


func _commit_drag() -> void:
	_undo.append(_before_drag)
	_redo.clear()
	_drag_mode = ""
	_mark_dirty()


func _push_undo() -> void:
	_undo.append(_snapshot(_selected))
	_redo.clear()


func _undo_change() -> void:
	if _undo.is_empty():
		return
	var change := _undo.pop_back() as Dictionary
	var control := change.get("control") as Control
	if control == null:
		return
	_redo.append(_snapshot(control))
	_restore_snapshot(control, change)
	_select_control(control)
	_sync_fields()
	_interaction.queue_redraw()


func _redo_change() -> void:
	if _redo.is_empty():
		return
	var change := _redo.pop_back() as Dictionary
	var control := change.get("control") as Control
	if control == null:
		return
	_undo.append(_snapshot(control))
	_restore_snapshot(control, change)
	_select_control(control)
	_sync_fields()
	_interaction.queue_redraw()


func _snapshot(control: Control) -> Dictionary:
	return {"control": control, "layout": UILayoutStoreScript.layout_from_control(control)}


func _restore_snapshot(control: Control, snapshot: Dictionary) -> void:
	if snapshot.is_empty() or snapshot.get("control") != control:
		return
	var layout := snapshot["layout"] as Dictionary
	var anchors := layout["anchors"] as Array
	var offsets := layout["offsets"] as Array
	control.anchor_left = anchors[0]
	control.anchor_top = anchors[1]
	control.anchor_right = anchors[2]
	control.anchor_bottom = anchors[3]
	control.offset_left = offsets[0]
	control.offset_top = offsets[1]
	control.offset_right = offsets[2]
	control.offset_bottom = offsets[3]
	if layout.has("modulate"):
		var m := layout["modulate"] as Array
		control.modulate = Color(m[0], m[1], m[2], m[3])
	if layout.has("scale"):
		var s := layout["scale"] as Array
		control.scale = Vector2(s[0], s[1])
	if control is Label:
		if layout.has("font_size"):
			(control as Label).add_theme_font_size_override("font_size", int(layout["font_size"]))
		if layout.has("font_color"):
			var fc := layout["font_color"] as Array
			(control as Label).add_theme_color_override("font_color", Color(fc[0], fc[1], fc[2], fc[3]))


func _reset_selected() -> void:
	if _selected == null:
		return
	var element_id := str(_selected.get_meta("layout_element_id", ""))
	var instance_id := str(_selected.get_meta("layout_instance_id", "")) if _instance_toggle.button_pressed else ""
	if str(_selected.get_meta("layout_scope", "")) == "gallery":
		UILayoutStoreScript.reset_gallery_override(element_id)
		UILayoutStoreScript.apply_gallery_layout(_selected, element_id)
	else:
		UILayoutStoreScript.reset_override(element_id, instance_id)
	if _initial.has(_selected):
		_restore_snapshot(_selected, _initial[_selected])
	_sync_fields()
	_interaction.queue_redraw()


func _reset_template() -> void:
	for control in _editable_controls(_preview):
		var element_id := str(control.get_meta("layout_element_id", ""))
		if str(control.get_meta("layout_scope", "")) == "gallery":
			UILayoutStoreScript.reset_gallery_override(element_id)
		else:
			UILayoutStoreScript.reset_override(element_id)
		if _initial.has(control):
			_restore_snapshot(control, _initial[control])
	_sync_fields()
	_interaction.queue_redraw()


func _save_and_close() -> void:
	for control in _editable_controls(_preview):
		if _initial.has(control) and UILayoutStoreScript.layout_from_control(control) == (_initial[control] as Dictionary)["layout"]:
			continue
		var element_id := str(control.get_meta("layout_element_id", ""))
		var instance_id := str(control.get_meta("layout_instance_id", "")) if _instance_toggle.button_pressed else ""
		if str(control.get_meta("layout_scope", "")) == "gallery":
			UILayoutStoreScript.set_gallery_override(element_id, UILayoutStoreScript.layout_from_control(control))
		else:
			UILayoutStoreScript.set_override(element_id, UILayoutStoreScript.layout_from_control(control), instance_id)
	var error := UILayoutStoreScript.save()
	if error == OK:
		closed.emit(true)
		## live 模式：节点属于外部场景，只释放编辑器自身
		if _live_mode:
			queue_free()
		else:
			queue_free()


func _close_without_save() -> void:
	if _live_mode:
		## 恢复节点到保存前的状态
		for control in _editable_controls(_preview):
			if _initial.has(control):
				_restore_snapshot(control, _initial[control])
	UILayoutStoreScript.reload_config()
	closed.emit(false)
	queue_free()


func _editable_controls(root: Control) -> Array[Control]:
	var result: Array[Control] = []
	if root.has_meta("layout_element_id"):
		result.append(root)
	for child in root.get_children():
		if child is Control:
			result.append_array(_editable_controls(child as Control))
	return result


func _set_resolution(index: int) -> void:
	var sizes := [Vector2(1280, 720), Vector2(1600, 900), Vector2(1920, 1080), Vector2(1024, 768)]
	_preview_host.set_meta("preview_resolution", sizes[index])


func _set_zoom(value: float) -> void:
	if _live_mode:
		return
	_zoom = clampf(value, 0.25, 2.0)
	_preview.scale = Vector2.ONE * _zoom
	if _zoom_label != null:
		_zoom_label.text = "缩放 %d%%" % int(round(_zoom * 100.0))
	_interaction.queue_redraw()


func _mark_dirty() -> void:
	if _status_label != null:
		_status_label.text = "有未保存修改"
		_status_label.add_theme_color_override("font_color", Color(1.0, 0.62, 0.28))


func _disable_input(control: Control) -> void:
	control.mouse_filter = Control.MOUSE_FILTER_IGNORE
	for child in control.get_children():
		if child is Control:
			_disable_input(child as Control)


func _rect_in_editor(control: Control) -> Rect2:
	var global_rect := control.get_global_rect()
	return Rect2(global_rect.position - _interaction.global_position, global_rect.size)


func _draw_selection() -> void:
	if _live_mode:
		return
	var canvas_size := _interaction.size
	var grid_color := Color(0.24, 0.29, 0.36, 0.42)
	var major_grid_color := Color(0.32, 0.40, 0.50, 0.55)
	for x in range(0, int(canvas_size.x), 16):
		_interaction.draw_line(Vector2(x, 0), Vector2(x, canvas_size.y), major_grid_color if x % 64 == 0 else grid_color)
	for y in range(0, int(canvas_size.y), 16):
		_interaction.draw_line(Vector2(0, y), Vector2(canvas_size.x, y), major_grid_color if y % 64 == 0 else grid_color)
	if _selected == null:
		return
	var rect := _rect_in_editor(_selected)
	_interaction.draw_rect(rect, Color(0.16, 0.62, 1.0, 0.18), true)
	_interaction.draw_rect(rect, Color(0.20, 0.78, 1.0), false, 3.0)
	for point in [
		rect.position, Vector2(rect.end.x, rect.position.y), rect.end, Vector2(rect.position.x, rect.end.y),
		Vector2(rect.get_center().x, rect.position.y), Vector2(rect.end.x, rect.get_center().y),
		Vector2(rect.get_center().x, rect.end.y), Vector2(rect.position.x, rect.get_center().y),
	]:
		_interaction.draw_rect(Rect2(point - Vector2(6, 6), Vector2(12, 12)), Color(0.08, 0.12, 0.18), true)
		_interaction.draw_rect(Rect2(point - Vector2(6, 6), Vector2(12, 12)), Color(0.20, 0.86, 1.0), false, 2.0)
