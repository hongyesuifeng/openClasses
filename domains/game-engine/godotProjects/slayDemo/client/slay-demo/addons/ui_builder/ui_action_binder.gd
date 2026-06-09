class_name UIActionBinder


static func bind_all(root: Control) -> void:
	_traverse(root)


static func _traverse(node: Node) -> void:
	if node is Button and node.has_meta("ui_action"):
		var action: String = node.get_meta("ui_action")
		var btn := node as Button
		if not btn.pressed.is_connected(_make_handler(btn, action)):
			btn.pressed.connect(_make_handler(btn, action))
	for child in node.get_children():
		_traverse(child)


static func _make_handler(source: Node, action: String) -> Callable:
	return func() -> void:
		var parent := source.get_parent()
		while parent != null:
			if parent.has_method("handle_action"):
				parent.handle_action(action, source)
				return
			parent = parent.get_parent()
		push_warning("UIActionBinder: 找不到 handle_action 处理者，action='%s'" % action)
