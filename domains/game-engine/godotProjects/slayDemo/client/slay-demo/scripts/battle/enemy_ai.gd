extends RefCounted
class_name EnemyAI


## 初始化敌人实例
static func initialize_enemy(enemy_data: Dictionary) -> Dictionary:
	var actions: Array = (enemy_data.get("actions", []) as Array).duplicate(true)
	var phases: Array = (enemy_data.get("phases", []) as Array).duplicate(true)

	var instance := {
		"id": str(enemy_data.get("id", "")),
		"name": str(enemy_data.get("name", "")),
		"enemy_type": str(enemy_data.get("enemy_type", "normal")),
		"art_key": str(enemy_data.get("art_key", "enemy_slime")),
		"max_hp": int(enemy_data.get("max_hp", 1)),
		"hp": int(enemy_data.get("max_hp", 1)),
		"block": 0,
		"strength": 0,
		"actions": actions,
		"phases": phases,
		"current_phase_index": 0,
		"action_history": [],  ## 记录最近的动作用于冷却判断
		"turn_count": 0,
		"intent": {}
	}

	## 初始化意图
	if not phases.is_empty():
		instance["intent"] = _intent_from_phase(phases[0], instance)
	elif not actions.is_empty():
		instance["intent"] = _intent_from_action(actions[0], instance)
	else:
		instance["intent"] = {}

	return instance


## 推进意图
static func advance_intent(enemy: Dictionary, battle_state: Dictionary = {}) -> void:
	enemy["turn_count"] = int(enemy.get("turn_count", 0)) + 1

	## 检查阶段切换
	var phases: Array = enemy.get("phases", [])
	if not phases.is_empty():
		_check_phase_transition(enemy, battle_state)

	## 选择下一个动作
	if not phases.is_empty():
		_select_action_from_phase(enemy, battle_state)
	elif not enemy.get("actions", []).is_empty():
		_select_action_from_actions(enemy)

	## 记录动作历史
	_record_action_history(enemy)


## 从简单动作列表选择（旧模式兼容）
static func _select_action_from_actions(enemy: Dictionary) -> void:
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
	enemy["intent"] = _intent_from_action(actions[current_index], enemy)


## 从阶段选择动作
static func _select_action_from_phase(enemy: Dictionary, battle_state: Dictionary) -> void:
	var phases: Array = enemy.get("phases", [])
	var phase_index := int(enemy.get("current_phase_index", 0))

	if phase_index < 0 or phase_index >= phases.size():
		return

	var current_phase: Dictionary = phases[phase_index]
	var phase_actions: Array = current_phase.get("actions", [])

	if phase_actions.is_empty():
		return

	var selection_mode := str(current_phase.get("selection_mode", "loop"))

	match selection_mode:
		"weighted_pool":
			_select_weighted_action(enemy, phase_actions, battle_state)
		"conditional":
			_select_conditional_action(enemy, phase_actions, battle_state)
		_:  ## 默认 loop 模式
			_select_loop_action(enemy, phase_actions)


## 权重池选择
static func _select_weighted_action(enemy: Dictionary, actions: Array, battle_state: Dictionary) -> void:
	var valid_actions := _filter_valid_actions(actions, enemy, battle_state)

	if valid_actions.is_empty():
		valid_actions = actions  ## 如果没有有效动作，使用全部

	## 计算总权重
	var total_weight := 0
	for action in valid_actions:
		total_weight += int(action.get("weight", 50))

	## 随机选择
	var roll := randi() % total_weight
	var accumulated := 0

	for action in valid_actions:
		accumulated += int(action.get("weight", 50))
		if roll < accumulated:
			enemy["intent"] = _intent_from_action(action, enemy)
			enemy["last_selected_action_id"] = str(action.get("id", ""))
			return

	## 后备：选择第一个
	enemy["intent"] = _intent_from_action(valid_actions[0], enemy)


## 条件选择
static func _select_conditional_action(enemy: Dictionary, actions: Array, battle_state: Dictionary) -> void:
	for action in actions:
		if _check_action_conditions(action, enemy, battle_state):
			enemy["intent"] = _intent_from_action(action, enemy)
			enemy["last_selected_action_id"] = str(action.get("id", ""))
			return

	## 没有条件满足，选择默认动作
	for action in actions:
		if not action.has("conditions"):
			enemy["intent"] = _intent_from_action(action, enemy)
			return

	## 后备
	if not actions.is_empty():
		enemy["intent"] = _intent_from_action(actions[0], enemy)


## 循环选择（兼容旧模式）
static func _select_loop_action(enemy: Dictionary, actions: Array) -> void:
	var current_index := int(enemy.get("action_index", 0))
	current_index = (current_index + 1) % actions.size()
	enemy["action_index"] = current_index
	enemy["intent"] = _intent_from_action(actions[current_index], enemy)


## 过滤有效动作（检查冷却等）
static func _filter_valid_actions(actions: Array, enemy: Dictionary, battle_state: Dictionary) -> Array:
	var result: Array = []

	for action in actions:
		## 检查冷却
		var cooldown := int(action.get("cooldown", 0))
		if cooldown > 0:
			var action_id := str(action.get("id", ""))
			if _is_action_on_cooldown(enemy, action_id, cooldown):
				continue

		## 检查条件
		if not _check_action_conditions(action, enemy, battle_state):
			continue

		result.append(action)

	return result


## 检查动作是否在冷却中
static func _is_action_on_cooldown(enemy: Dictionary, action_id: String, cooldown: int) -> bool:
	var history: Array = enemy.get("action_history", [])
	var turns_to_check := mini(cooldown, history.size())

	for i in range(turns_to_check):
		var past_action := str(history[i])
		if past_action == action_id:
			return true

	return false


## 检查动作条件
static func _check_action_conditions(action: Dictionary, enemy: Dictionary, battle_state: Dictionary) -> bool:
	var conditions: Array = action.get("conditions", [])

	if conditions.is_empty():
		return true

	for condition in conditions:
		if not _evaluate_condition(condition, enemy, battle_state):
			return false

	return true


## 评估单个条件
static func _evaluate_condition(condition: Dictionary, enemy: Dictionary, battle_state: Dictionary) -> bool:
	var cond_type := str(condition.get("type", ""))

	match cond_type:
		"player_hp_below":
			var threshold := float(condition.get("value", 0))
			var player_hp := int(battle_state.get("player_hp", 100))
			var player_max_hp := int(battle_state.get("player_max_hp", 100))
			return float(player_hp) / float(player_max_hp) < threshold

		"player_hp_above":
			var threshold := float(condition.get("value", 0))
			var player_hp := int(battle_state.get("player_hp", 100))
			var player_max_hp := int(battle_state.get("player_max_hp", 100))
			return float(player_hp) / float(player_max_hp) > threshold

		"self_hp_below":
			var threshold := float(condition.get("value", 0))
			return float(enemy.get("hp", 1)) / float(enemy.get("max_hp", 1)) < threshold

		"self_hp_above":
			var threshold := float(condition.get("value", 0))
			return float(enemy.get("hp", 1)) / float(enemy.get("max_hp", 1)) > threshold

		"turn_above":
			var turn := int(condition.get("value", 0))
			return int(enemy.get("turn_count", 0)) > turn

		"has_status":
			var status_id := str(condition.get("status_id", ""))
			return _enemy_has_status(enemy, status_id)

		_:
			return true


## 检查敌人是否有状态
static func _enemy_has_status(enemy: Dictionary, status_id: String) -> bool:
	## 简化实现：检查力量等基础属性
	match status_id:
		"strength":
			return int(enemy.get("strength", 0)) > 0
		_:
			return false


## 检查阶段转换
static func _check_phase_transition(enemy: Dictionary, battle_state: Dictionary) -> void:
	var phases: Array = enemy.get("phases", [])
	var current_index := int(enemy.get("current_phase_index", 0))

	## 从后向前检查，优先匹配更严格的条件
	for i in range(phases.size() - 1, -1, -1):
		var phase: Dictionary = phases[i]
		if _check_phase_trigger(phase, enemy, battle_state):
			if i != current_index:
				_trigger_phase_transition(enemy, current_index, i, phase)
			return


## 检查阶段触发条件
static func _check_phase_trigger(phase: Dictionary, enemy: Dictionary, battle_state: Dictionary) -> bool:
	var trigger := str(phase.get("trigger", ""))

	if trigger.is_empty():
		return true

	## HP 阈值触发
	if trigger.begins_with("hp_"):
		var hp_percent := float(enemy.get("hp", 1)) / float(enemy.get("max_hp", 1))

		if trigger == "hp_above_50%":
			return hp_percent >= 0.5
		elif trigger == "hp_below_50%":
			return hp_percent < 0.5
		elif trigger == "hp_above_30%":
			return hp_percent >= 0.3
		elif trigger == "hp_below_30%":
			return hp_percent < 0.3
		elif trigger == "hp_below_40%":
			return hp_percent < 0.4

	return true


## 触发阶段转换
static func _trigger_phase_transition(enemy: Dictionary, old_index: int, new_index: int, new_phase: Dictionary) -> void:
	enemy["current_phase_index"] = new_index
	enemy["action_index"] = 0

	## 执行阶段转换效果
	var phase_effects: Array = new_phase.get("phase_effects", [])
	for effect in phase_effects:
		_apply_phase_effect(enemy, effect)

	## 记录阶段转换
	enemy["phase_transition"] = {
		"from": old_index,
		"to": new_index,
		"phase_name": str(new_phase.get("name", ""))
	}


## 应用阶段效果
static func _apply_phase_effect(enemy: Dictionary, effect: Dictionary) -> void:
	var effect_type := str(effect.get("type", ""))

	match effect_type:
		"gain_strength":
			var value := int(effect.get("value", 0))
			enemy["strength"] = int(enemy.get("strength", 0)) + value
		"heal":
			var value := int(effect.get("value", 0))
			enemy["hp"] = mini(int(enemy.get("max_hp", 100)), int(enemy.get("hp", 0)) + value)
		"apply_status":
			## 状态应用需要在 StatusManager 中处理
			pass


## 记录动作历史
static func _record_action_history(enemy: Dictionary) -> void:
	var history: Array = enemy.get("action_history", [])
	var last_action_id := str(enemy.get("last_selected_action_id", ""))

	if not last_action_id.is_empty():
		history.push_front(last_action_id)
		## 只保留最近 10 个动作记录
		if history.size() > 10:
			history.resize(10)
		enemy["action_history"] = history


## 获取当前动作
static func current_action(enemy: Dictionary) -> Dictionary:
	var intent: Dictionary = enemy.get("intent", {})
	if intent.is_empty():
		return {}

	## 从 actions 或 phases 中找到完整动作定义
	var action_id := str(intent.get("id", ""))

	## 优先从阶段中查找
	var phases: Array = enemy.get("phases", [])
	if not phases.is_empty():
		var phase_index := int(enemy.get("current_phase_index", 0))
		if phase_index >= 0 and phase_index < phases.size():
			var phase: Dictionary = phases[phase_index]
			for action in phase.get("actions", []):
				if str(action.get("id", "")) == action_id:
					return (action as Dictionary).duplicate(true)

	## 从简单 actions 中查找
	for action in enemy.get("actions", []):
		if str(action.get("id", "")) == action_id:
			return (action as Dictionary).duplicate(true)

	## 后备：返回意图本身
	return intent.duplicate(true)


## 从动作生成意图显示
static func _intent_from_action(action: Dictionary, enemy: Dictionary) -> Dictionary:
	var intent_type := str(action.get("intent_type", "unknown"))
	var base_value := int(action.get("intent_value", 0))

	## 力量加成计算
	var strength := int(enemy.get("strength", 0))
	var final_value := base_value

	if intent_type == "attack" and strength != 0:
		final_value = maxi(0, base_value + strength)

	return {
		"id": str(action.get("id", "")),
		"name": str(action.get("name", "")),
		"type": intent_type,
		"value": final_value,
		"base_value": base_value
	}


## 从阶段生成初始意图
static func _intent_from_phase(phase: Dictionary, enemy: Dictionary) -> Dictionary:
	var actions: Array = phase.get("actions", [])
	if actions.is_empty():
		return {}

	## 默认选择第一个动作
	return _intent_from_action(actions[0], enemy)


## 检查是否有阶段转换（供 UI 显示）
static func has_phase_transition(enemy: Dictionary) -> bool:
	return enemy.get("phase_transition", {}) != {}


## 获取阶段转换信息并清除
static func pop_phase_transition(enemy: Dictionary) -> Dictionary:
	var transition: Dictionary = enemy.get("phase_transition", {})
	enemy["phase_transition"] = {}
	return transition


## 获取当前阶段名称
static func get_current_phase_name(enemy: Dictionary) -> String:
	var phases: Array = enemy.get("phases", [])
	var index := int(enemy.get("current_phase_index", 0))

	if index >= 0 and index < phases.size():
		return str(phases[index].get("name", ""))

	return ""
