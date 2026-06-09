extends Control

var last_action: String = ""

func handle_action(action_name: String, _source_node: Node) -> void:
	last_action = action_name
