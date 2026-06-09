class_name UISpecEditor

## UISpecEditor — 读写 ui_specs/*.ui.json，支持 UILayoutEditor 回写布局调整结果
##
## 主要用途：
##   - 从 spec 文件读取节点的当前 layout 配置（用于编辑器填充初始值）
##   - 将编辑器调整后的 layout 数据写回 spec 文件对应节点
##   - 提供场景 spec 列表和热重载能力（Gallery 的 JSON 编辑 Tab 使用）
##
## spec_node_path 格式（UIBuilder 构建时打入 meta "ui_spec_node_path"）：
##   "background"             → spec["background"]
##   "children[0]"            → spec["children"][0]
##   "children[1].children[0]"→ spec["children"][1]["children"][0]


## 读取 spec 文件，返回解析后的字典；失败返回空字典
static func read_spec(spec_path: String) -> Dictionary:
	if not FileAccess.file_exists(spec_path):
		push_warning("UISpecEditor: 文件不存在 '%s'" % spec_path)
		return {}
	var f := FileAccess.open(spec_path, FileAccess.READ)
	var json := JSON.new()
	var err := json.parse(f.get_as_text())
	f.close()
	if err != OK:
		push_warning("UISpecEditor: JSON 解析失败 '%s'" % spec_path)
		return {}
	return json.data


## 将 spec 字典写回文件（漂亮格式）；返回 OK 或错误码
static func write_spec(spec_path: String, spec: Dictionary) -> int:
	var text := JSON.stringify(spec, "\t")
	var f := FileAccess.open(spec_path, FileAccess.WRITE)
	if f == null:
		push_error("UISpecEditor: 无法写入 '%s'" % spec_path)
		return ERR_FILE_CANT_WRITE
	f.store_string(text)
	f.close()
	return OK


## 根据 spec_node_path 找到 spec 里对应的节点字典（引用，可直接修改）
## 返回 null 表示路径无效
static func locate_node(spec: Dictionary, spec_node_path: String) -> Dictionary:
	if spec_node_path.is_empty():
		return {}
	var parts := _parse_path(spec_node_path)
	var current: Variant = spec
	for part in parts:
		if part is String and (current as Dictionary).has(part):
			current = (current as Dictionary)[part]
		elif part is int and current is Array and int(part) < (current as Array).size():
			current = (current as Array)[int(part)]
		else:
			push_warning("UISpecEditor: 路径无效 '%s' @ '%s'" % [spec_node_path, str(part)])
			return {}
	if current is Dictionary:
		return current
	return {}


## 把控件当前的 anchor/offset/size 转成 spec layout 字典
static func layout_from_control(node: Control) -> Dictionary:
	return {
		"preset":        "absolute_rect",
		"anchor_left":   node.anchor_left,
		"anchor_top":    node.anchor_top,
		"anchor_right":  node.anchor_right,
		"anchor_bottom": node.anchor_bottom,
		"offset_left":   node.offset_left,
		"offset_top":    node.offset_top,
		"offset_right":  node.offset_right,
		"offset_bottom": node.offset_bottom,
	}


## 将控件的布局调整结果回写到对应 spec 文件
## node 必须有 meta "ui_spec_path" 和 "ui_spec_node_path"
static func save_node_layout(node: Control) -> int:
	var spec_path := str(node.get_meta("ui_spec_path", ""))
	var node_path := str(node.get_meta("ui_spec_node_path", ""))
	if spec_path.is_empty() or node_path.is_empty():
		push_warning("UISpecEditor: 节点缺少 ui_spec_path / ui_spec_node_path meta")
		return ERR_INVALID_DATA

	var spec := read_spec(spec_path)
	if spec.is_empty():
		return ERR_FILE_NOT_FOUND

	var node_dict := locate_node(spec, node_path)
	if node_dict.is_empty():
		push_warning("UISpecEditor: 找不到节点路径 '%s' in '%s'" % [node_path, spec_path])
		return ERR_INVALID_DATA

	## 保留原有 preset 字段名，更新数值
	var old_layout: Dictionary = node_dict.get("layout", {}) as Dictionary
	var new_layout := old_layout.duplicate()
	## 如果原来是语义 preset，改为 raw_anchors 保存精确值
	new_layout["anchor_left"]   = node.anchor_left
	new_layout["anchor_top"]    = node.anchor_top
	new_layout["anchor_right"]  = node.anchor_right
	new_layout["anchor_bottom"] = node.anchor_bottom
	new_layout["offset_left"]   = node.offset_left
	new_layout["offset_top"]    = node.offset_top
	new_layout["offset_right"]  = node.offset_right
	new_layout["offset_bottom"] = node.offset_bottom
	## 若原 preset 是 full_rect / absolute_rect 以外的语义，改为 raw_anchors 标记
	var preset: String = str(new_layout.get("preset", ""))
	if preset != "full_rect" and preset != "absolute_rect":
		new_layout["preset"] = "raw_anchors"
	node_dict["layout"] = new_layout

	return write_spec(spec_path, spec)


## 列出 ui_specs/ 目录下所有 .ui.json 文件路径
static func list_specs(specs_dir: String = "res://ui_specs") -> Array[String]:
	var result: Array[String] = []
	var da := DirAccess.open(specs_dir)
	if da == null:
		return result
	da.list_dir_begin()
	var file_name := da.get_next()
	while not file_name.is_empty():
		if not da.current_is_dir() and file_name.ends_with(".ui.json"):
			result.append(specs_dir.path_join(file_name))
		file_name = da.get_next()
	da.list_dir_end()
	result.sort()
	return result


## 在 UIBuilder 支持的 layout 里新增 "raw_anchors" preset：直接使用 anchor_* / offset_* 字段
## 需要在 UIBuilder._apply_layout 里添加对这个 preset 的支持
static func apply_raw_anchors_layout(node: Control, layout: Dictionary) -> void:
	node.anchor_left   = float(layout.get("anchor_left",   0.0))
	node.anchor_top    = float(layout.get("anchor_top",    0.0))
	node.anchor_right  = float(layout.get("anchor_right",  0.0))
	node.anchor_bottom = float(layout.get("anchor_bottom", 0.0))
	node.offset_left   = float(layout.get("offset_left",   0.0))
	node.offset_top    = float(layout.get("offset_top",    0.0))
	node.offset_right  = float(layout.get("offset_right",  0.0))
	node.offset_bottom = float(layout.get("offset_bottom", 0.0))


## ── 私有：解析路径字符串为 token 列表 ──────────────────────────────────
## "children[1].children[0]" → ["children", 1, "children", 0]
static func _parse_path(path: String) -> Array:
	var tokens: Array = []
	var parts := path.split(".")
	for part in parts:
		if part.contains("["):
			var bracket_pos := part.find("[")
			var key := part.substr(0, bracket_pos)
			if not key.is_empty():
				tokens.append(key)
			var idx_str := part.substr(bracket_pos + 1, part.length() - bracket_pos - 2)
			tokens.append(int(idx_str))
		else:
			tokens.append(part)
	return tokens
