extends RefCounted
class_name EnemyAI


static func initialize_enemy(enemy_data: Dictionary) -> Dictionary:
	var actions: Array = (enemy_data.get("actions", []) as Array).duplicate(true)
	return {
		"id": str(enemy_data.get("id", "")),
		"name": str(enemy_data.get("name", "")),
		"enemy_type": str(enemy_data.get("enemy_type", "normal")),
		"art_key": str(enemy_data.get("art_key", "enemy_slime")),
		"max_hp": int(enemy_data.get("max_hp", 1)),
		"hp": int(enemy_data.get("max_hp", 1)),
		"block": 0,
		"strength": 0,
		"actions": actions,
		"action_index": 0,
		"intent": _intent_from_action(actions[0] if not actions.is_empty() else {})
	}


static func advance_intent(enemy: Dictionary) -> void:
	var actions: Array = enemy.get("actions", [])
	if actions.is_empty():
		enemy["intent"] = {}
		return

	var current_index := int(enemy.get("action_index", 0))
	var current_action: Dictionary = actions[current_index]
	var rule := str(current_action.get("next_action_rule", "loop"))

	match rule:
		"next":
			current_index = mini(current_index + 1, actions.size() - 1)
		"repeat":
			current_index = current_index
		"loop":
			current_index = (current_index + 1) % actions.size()
		_:
			current_index = (current_index + 1) % actions.size()

	enemy["action_index"] = current_index
	enemy["intent"] = _intent_from_action(actions[current_index])


static func current_action(enemy: Dictionary) -> Dictionary:
	var actions: Array = enemy.get("actions", [])
	if actions.is_empty():
		return {}

	var index := clampi(int(enemy.get("action_index", 0)), 0, actions.size() - 1)
	return (actions[index] as Dictionary).duplicate(true)


static func _intent_from_action(action: Dictionary) -> Dictionary:
	return {
		"id": str(action.get("id", "")),
		"name": str(action.get("name", "")),
		"type": str(action.get("intent_type", "")),
		"value": int(action.get("intent_value", 0))
	}
