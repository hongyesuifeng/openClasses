class_name UIDataBinder

# 第一阶段：只手动刷新，记录 bind 路径 → 节点映射
# 调用方在数据变化时调用 refresh(path, value) 更新对应节点

static var _bindings: Dictionary = {}


static func register_root(root: Control) -> void:
	_bindings.clear()
	_traverse(root)


static func refresh(bind_path: String, value: Variant) -> void:
	if not _bindings.has(bind_path):
		return
	for node in (_bindings[bind_path] as Array):
		if is_instance_valid(node):
			_apply_value(node, value)


static func clear() -> void:
	_bindings.clear()


static func _traverse(node: Node) -> void:
	if node.has_meta("ui_bind"):
		var path: String = node.get_meta("ui_bind")
		if not _bindings.has(path):
			_bindings[path] = []
		(_bindings[path] as Array).append(node)
	for child in node.get_children():
		_traverse(child)


static func _apply_value(node: Node, value: Variant) -> void:
	if node is Label:
		(node as Label).text = str(value)
	elif node is ProgressBar:
		(node as ProgressBar).value = float(value)
	elif node is Button:
		(node as Button).text = str(value)
