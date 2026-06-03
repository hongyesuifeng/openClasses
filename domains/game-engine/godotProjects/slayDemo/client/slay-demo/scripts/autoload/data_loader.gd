extends Node

const CARDS_PATH := "res://data/cards.json"
const ENEMIES_PATH := "res://data/enemies.json"
const ENCOUNTERS_PATH := "res://data/encounters.json"
const REWARDS_PATH := "res://data/rewards.json"
const RELICS_PATH := "res://data/relics.json"
const POTIONS_PATH := "res://data/potions.json"
const RUNS_PATH := "res://data/run_v1.json"

const CARD_TYPES := ["attack", "skill", "power", "status"]
const CARD_RARITIES := ["starter", "common", "uncommon", "rare", "special"]
const CARD_TARGETS := ["self", "single_enemy", "all_enemies", "none"]
const ENCOUNTER_TYPES := ["normal", "elite", "boss"]
const RUN_NODE_TYPES := ["battle", "reward", "rest", "shop", "chest", "event", "result"]
const EFFECT_TYPES := ["damage", "block", "draw", "apply_status", "gain_strength", "gain_barricade", "heal", "multi_damage", "aoe_damage", "gain_energy", "exhaust", "summon", "lose_hp"]
const RELIC_RARITIES := ["common", "uncommon", "rare", "boss", "starter"]
const RELIC_EFFECT_TYPES := ["battle_start_block", "first_turn_energy", "max_hp", "card_gain_heal", "battle_win_gold", "draw_per_turn"]
const POTION_RARITIES := ["common", "uncommon", "rare"]
const POTION_EFFECT_TYPES := ["heal", "block", "apply_status", "draw", "gain_energy", "gain_strength", "damage", "aoe_damage"]
const EVENT_EFFECT_TYPES := ["lose_hp", "gain_gold", "remove_card", "upgrade_card", "gain_card", "transform_card"]

var _cards: Dictionary = {}
var _enemies: Dictionary = {}
var _encounters: Dictionary = {}
var _reward_profiles: Dictionary = {}
var _relics: Dictionary = {}
var _potions: Dictionary = {}
var _runs: Dictionary = {}
var _loaded := false
var _next_card_instance_id := 1


func load_all() -> void:
	_cards = _load_collection(CARDS_PATH, "cards")
	_enemies = _load_collection(ENEMIES_PATH, "enemies")
	_encounters = _load_collection(ENCOUNTERS_PATH, "encounters")
	_reward_profiles = _load_collection(REWARDS_PATH, "reward_profiles")
	_relics = _load_collection(RELICS_PATH, "relics")
	_potions = _load_collection(POTIONS_PATH, "potions")
	_runs = _load_collection(RUNS_PATH, "runs")
	_loaded = true


func clear_cache() -> void:
	_cards.clear()
	_enemies.clear()
	_encounters.clear()
	_reward_profiles.clear()
	_relics.clear()
	_potions.clear()
	_runs.clear()
	_loaded = false
	_next_card_instance_id = 1


func validate_all() -> PackedStringArray:
	if not _loaded:
		load_all()

	var errors := PackedStringArray()
	_validate_cards(errors)
	_validate_enemies(errors)
	_validate_encounters(errors)
	_validate_rewards(errors)
	_validate_relics(errors)
	_validate_potions(errors)
	_validate_runs(errors)
	return errors


func get_card(id: String) -> Dictionary:
	_ensure_loaded()
	return _duplicate_entry(_cards.get(id, {}))


func get_enemy(id: String) -> Dictionary:
	_ensure_loaded()
	return _duplicate_entry(_enemies.get(id, {}))


func get_encounter(id: String) -> Dictionary:
	_ensure_loaded()
	return _duplicate_entry(_encounters.get(id, {}))


func get_reward_profile(id: String) -> Dictionary:
	_ensure_loaded()
	return _duplicate_entry(_reward_profiles.get(id, {}))


func get_relic(id: String) -> Dictionary:
	_ensure_loaded()
	return _duplicate_entry(_relics.get(id, {}))


func get_run_config(id: String) -> Dictionary:
	_ensure_loaded()
	return _duplicate_entry(_runs.get(id, {}))


func get_all_cards() -> Array:
	_ensure_loaded()
	var result: Array = []
	for card in _cards.values():
		result.append((card as Dictionary).duplicate(true))
	return result


func get_all_relics() -> Array:
	_ensure_loaded()
	var result: Array = []
	for relic in _relics.values():
		result.append((relic as Dictionary).duplicate(true))
	return result


func get_potion(id: String) -> Dictionary:
	_ensure_loaded()
	return _duplicate_entry(_potions.get(id, {}))


func get_all_potions() -> Array:
	_ensure_loaded()
	var result: Array = []
	for potion in _potions.values():
		result.append((potion as Dictionary).duplicate(true))
	return result


func get_next_instance_id() -> int:
	return _next_card_instance_id


func restore_instance_id_counter(next_id: int) -> void:
	_next_card_instance_id = maxi(next_id, 1)


func create_card_instance(card_id: String) -> Dictionary:
	_ensure_loaded()
	if not _cards.has(card_id):
		push_error("DataLoader: unknown card id '%s'" % card_id)
		return {}

	var instance := {
		"instance_id": _next_card_instance_id,
		"card_id": card_id,
		"is_upgraded": false
	}
	_next_card_instance_id += 1
	return instance


func resolve_card_instance(card_instance: Dictionary) -> Dictionary:
	var card_id := str(card_instance.get("card_id", ""))
	var card := get_card(card_id)
	if card.is_empty():
		return {}

	if bool(card_instance.get("is_upgraded", false)) and card.has("upgrade"):
		var upgrade: Dictionary = card.get("upgrade", {})
		card["name"] = str(upgrade.get("name", card.get("name", "")))
		card["description"] = str(upgrade.get("description", card.get("description", "")))
		card["cost"] = int(upgrade.get("cost", card.get("cost", 0)))
		card["effects"] = (upgrade.get("effects", card.get("effects", [])) as Array).duplicate(true)
	return card


func _ensure_loaded() -> void:
	if not _loaded:
		load_all()


func _duplicate_entry(value: Variant) -> Dictionary:
	if value is Dictionary:
		return (value as Dictionary).duplicate(true)
	return {}


func _load_collection(path: String, key: String) -> Dictionary:
	var root := _read_json(path)
	var cache: Dictionary = {}
	var entries: Array = root.get(key, [])

	for index in range(entries.size()):
		var entry: Variant = entries[index]
		if not (entry is Dictionary):
			push_error("DataLoader: %s[%d] is not an object" % [key, index])
			continue

		var typed_entry := entry as Dictionary
		var id := str(typed_entry.get("id", ""))
		if id.is_empty():
			push_error("DataLoader: %s[%d] has no id" % [key, index])
			continue

		if cache.has(id):
			push_error("DataLoader: duplicate id '%s' in %s" % [id, path])
			continue

		cache[id] = typed_entry.duplicate(true)

	return cache


func _read_json(path: String) -> Dictionary:
	if not FileAccess.file_exists(path):
		push_error("DataLoader: missing JSON file %s" % path)
		return {}

	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		push_error("DataLoader: cannot open %s" % path)
		return {}

	var parsed: Variant = JSON.parse_string(file.get_as_text())
	if parsed == null:
		push_error("DataLoader: invalid JSON in %s" % path)
		return {}

	if not (parsed is Dictionary):
		push_error("DataLoader: root of %s must be an object" % path)
		return {}

	return parsed as Dictionary


func _validate_cards(errors: PackedStringArray) -> void:
	for id in _cards:
		var card: Dictionary = _cards[id]
		_require_string(card, "id", "card", id, errors)
		_require_string(card, "name", "card", id, errors)
		_require_string(card, "description", "card", id, errors)
		_require_string(card, "type", "card", id, errors)
		_require_string(card, "rarity", "card", id, errors)
		_require_int(card, "cost", "card", id, errors)
		_require_string(card, "target", "card", id, errors)
		_require_array(card, "effects", "card", id, errors)

		_enum_value(card, "type", CARD_TYPES, "card", id, errors)
		_enum_value(card, "rarity", CARD_RARITIES, "card", id, errors)
		_enum_value(card, "target", CARD_TARGETS, "card", id, errors)
		_validate_effects(card.get("effects", []), "card:%s" % id, errors)


func _validate_enemies(errors: PackedStringArray) -> void:
	for id in _enemies:
		var enemy: Dictionary = _enemies[id]
		_require_string(enemy, "id", "enemy", id, errors)
		_require_string(enemy, "name", "enemy", id, errors)
		_require_int(enemy, "max_hp", "enemy", id, errors)

		## 敌人必须有 actions 或 phases
		var has_actions := enemy.has("actions") and not (enemy.get("actions", []) as Array).is_empty()
		var has_phases := enemy.has("phases") and not (enemy.get("phases", []) as Array).is_empty()

		if not has_actions and not has_phases:
			errors.append("enemy:%s must define actions or phases" % id)

		if has_actions:
			_validate_enemy_actions(id, enemy.get("actions", []), errors)

		if has_phases:
			_validate_enemy_phases(id, enemy.get("phases", []), errors)


func _validate_enemy_actions(enemy_id: String, actions: Array, errors: PackedStringArray) -> void:
	for action_index in range(actions.size()):
		var action: Variant = actions[action_index]
		if not (action is Dictionary):
			errors.append("enemy:%s action[%d] must be an object" % [enemy_id, action_index])
			continue

		var action_dict := action as Dictionary
		_require_string(action_dict, "id", "enemy_action", "%s[%d]" % [enemy_id, action_index], errors)
		_require_array(action_dict, "effects", "enemy_action", "%s[%d]" % [enemy_id, action_index], errors)
		_validate_effects(action_dict.get("effects", []), "enemy:%s action:%d" % [enemy_id, action_index], errors)


func _validate_enemy_phases(enemy_id: String, phases: Array, errors: PackedStringArray) -> void:
	for phase_index in range(phases.size()):
		var phase: Variant = phases[phase_index]
		if not (phase is Dictionary):
			errors.append("enemy:%s phase[%d] must be an object" % [enemy_id, phase_index])
			continue

		var phase_dict := phase as Dictionary
		_require_array(phase_dict, "actions", "enemy_phase", "%s[%d]" % [enemy_id, phase_index], errors)

		var phase_actions: Array = phase_dict.get("actions", [])
		if phase_actions.is_empty():
			errors.append("enemy:%s phase[%d] must define at least one action" % [enemy_id, phase_index])

		_validate_enemy_actions("%s phase[%d]" % [enemy_id, phase_index], phase_actions, errors)


func _validate_encounters(errors: PackedStringArray) -> void:
	for id in _encounters:
		var encounter: Dictionary = _encounters[id]
		_require_string(encounter, "id", "encounter", id, errors)
		_require_string(encounter, "encounter_type", "encounter", id, errors)
		_require_array(encounter, "enemy_ids", "encounter", id, errors)
		_enum_value(encounter, "encounter_type", ENCOUNTER_TYPES, "encounter", id, errors)

		for enemy_id in encounter.get("enemy_ids", []):
			if not _enemies.has(str(enemy_id)):
				errors.append("encounter:%s references missing enemy '%s'" % [id, str(enemy_id)])

		var reward_id := str(encounter.get("reward_profile_id", ""))
		if not reward_id.is_empty() and not _reward_profiles.has(reward_id):
			errors.append("encounter:%s references missing reward profile '%s'" % [id, reward_id])


func _validate_rewards(errors: PackedStringArray) -> void:
	for id in _reward_profiles:
		var reward: Dictionary = _reward_profiles[id]
		_require_string(reward, "id", "reward_profile", id, errors)
		_require_int(reward, "card_choices", "reward_profile", id, errors)


func _validate_relics(errors: PackedStringArray) -> void:
	for id in _relics:
		var relic: Dictionary = _relics[id]
		_require_string(relic, "id", "relic", id, errors)
		_require_string(relic, "name", "relic", id, errors)
		_require_string(relic, "description", "relic", id, errors)
		_require_string(relic, "rarity", "relic", id, errors)
		_require_array(relic, "effects", "relic", id, errors)
		_enum_value(relic, "rarity", RELIC_RARITIES, "relic", id, errors)

		for effect_index in range((relic.get("effects", []) as Array).size()):
			var effect: Variant = (relic.get("effects", []) as Array)[effect_index]
			if not (effect is Dictionary):
				errors.append("relic:%s effect[%d] must be an object" % [id, effect_index])
				continue
			var effect_dict := effect as Dictionary
			_require_string(effect_dict, "type", "relic_effect", "%s[%d]" % [id, effect_index], errors)
			_require_int(effect_dict, "value", "relic_effect", "%s[%d]" % [id, effect_index], errors)
			_enum_value(effect_dict, "type", RELIC_EFFECT_TYPES, "relic_effect", "%s[%d]" % [id, effect_index], errors)


func _validate_potions(errors: PackedStringArray) -> void:
	for id in _potions:
		var potion: Dictionary = _potions[id]
		_require_string(potion, "id", "potion", id, errors)
		_require_string(potion, "name", "potion", id, errors)
		_require_string(potion, "description", "potion", id, errors)
		_require_string(potion, "rarity", "potion", id, errors)
		_require_array(potion, "effects", "potion", id, errors)
		_enum_value(potion, "rarity", POTION_RARITIES, "potion", id, errors)

		for effect_index in range((potion.get("effects", []) as Array).size()):
			var effect: Variant = (potion.get("effects", []) as Array)[effect_index]
			if not (effect is Dictionary):
				errors.append("potion:%s effect[%d] must be an object" % [id, effect_index])
				continue
			var effect_dict := effect as Dictionary
			_require_string(effect_dict, "type", "potion_effect", "%s[%d]" % [id, effect_index], errors)
			_enum_value(effect_dict, "type", POTION_EFFECT_TYPES, "potion_effect", "%s[%d]" % [id, effect_index], errors)


func _validate_runs(errors: PackedStringArray) -> void:
	for id in _runs:
		var run: Dictionary = _runs[id]
		_require_string(run, "id", "run", id, errors)
		_require_array(run, "start_deck", "run", id, errors)
		if not run.has("nodes") and not run.has("map_nodes"):
			errors.append("run:%s must define nodes or map_nodes" % id)
		if run.has("nodes"):
			_require_array(run, "nodes", "run", id, errors)
		if run.has("map_nodes"):
			_require_array(run, "map_nodes", "run", id, errors)

		for card_id in run.get("start_deck", []):
			if not _cards.has(str(card_id)):
				errors.append("run:%s start_deck references missing card '%s'" % [id, str(card_id)])

		for relic_id in run.get("start_relics", []):
			if not _relics.has(str(relic_id)):
				errors.append("run:%s start_relics references missing relic '%s'" % [id, str(relic_id)])

		var nodes: Array = run.get("nodes", [])
		_validate_run_nodes(id, nodes, "node", errors)
		_validate_map_nodes(id, run.get("map_nodes", []), errors)


func _validate_run_nodes(run_id: String, nodes: Array, label: String, errors: PackedStringArray) -> void:
	for node_index in range(nodes.size()):
		var node: Variant = nodes[node_index]
		if not (node is Dictionary):
			errors.append("run:%s %s[%d] must be an object" % [run_id, label, node_index])
			continue

		var node_dict := node as Dictionary
		_require_string(node_dict, "type", "run_node", "%s[%d]" % [run_id, node_index], errors)
		_enum_value(node_dict, "type", RUN_NODE_TYPES, "run_node", "%s[%d]" % [run_id, node_index], errors)

		var node_type := str(node_dict.get("type", ""))
		if node_type == "battle" and not _encounters.has(str(node_dict.get("encounter_id", ""))):
			errors.append("run:%s %s[%d] references missing encounter '%s'" % [run_id, label, node_index, str(node_dict.get("encounter_id", ""))])
		if node_type == "reward" and not _reward_profiles.has(str(node_dict.get("reward_profile_id", ""))):
			errors.append("run:%s %s[%d] references missing reward profile '%s'" % [run_id, label, node_index, str(node_dict.get("reward_profile_id", ""))])
		if node_type == "event":
			_validate_event_node(run_id, label, node_index, node_dict, errors)


func _validate_event_node(run_id: String, label: String, node_index: int, node: Dictionary, errors: PackedStringArray) -> void:
	_require_string(node, "title", "event_node", "%s[%d]" % [run_id, node_index], errors)
	_require_string(node, "description", "event_node", "%s[%d]" % [run_id, node_index], errors)
	_require_array(node, "choices", "event_node", "%s[%d]" % [run_id, node_index], errors)
	var choices: Array = node.get("choices", [])
	if choices.is_empty():
		errors.append("run:%s %s[%d] event must define at least one choice" % [run_id, label, node_index])

	for choice_index in range(choices.size()):
		var choice: Variant = choices[choice_index]
		if not (choice is Dictionary):
			errors.append("run:%s %s[%d] event choice[%d] must be an object" % [run_id, label, node_index, choice_index])
			continue
		var choice_dict := choice as Dictionary
		_require_string(choice_dict, "label", "event_choice", "%s[%d].choice[%d]" % [run_id, node_index, choice_index], errors)
		_require_string(choice_dict, "description", "event_choice", "%s[%d].choice[%d]" % [run_id, node_index, choice_index], errors)
		_require_array(choice_dict, "effects", "event_choice", "%s[%d].choice[%d]" % [run_id, node_index, choice_index], errors)
		_validate_event_effects(choice_dict.get("effects", []), "run:%s %s[%d] event choice[%d]" % [run_id, label, node_index, choice_index], errors)


func _validate_map_nodes(run_id: String, nodes: Array, errors: PackedStringArray) -> void:
	var node_ids := {}
	for node_index in range(nodes.size()):
		var node: Variant = nodes[node_index]
		if not (node is Dictionary):
			errors.append("run:%s map_node[%d] must be an object" % [run_id, node_index])
			continue

		var node_dict := node as Dictionary
		var node_id := str(node_dict.get("id", ""))
		_require_string(node_dict, "id", "map_node", "%s[%d]" % [run_id, node_index], errors)
		_require_int(node_dict, "floor", "map_node", "%s[%d]" % [run_id, node_index], errors)
		_require_array(node_dict, "next_nodes", "map_node", "%s[%d]" % [run_id, node_index], errors)
		node_ids[node_id] = true

	_validate_run_nodes(run_id, nodes, "map_node", errors)

	for node_index in range(nodes.size()):
		var node := nodes[node_index] as Dictionary
		for next_id in node.get("next_nodes", []):
			if not node_ids.has(str(next_id)):
				errors.append("run:%s map_node[%d] references missing next node '%s'" % [run_id, node_index, str(next_id)])


func _validate_effects(effects: Variant, owner_label: String, errors: PackedStringArray) -> void:
	if not (effects is Array):
		errors.append("%s effects must be an array" % owner_label)
		return

	var effect_list := effects as Array
	for index in range(effect_list.size()):
		var effect: Variant = effect_list[index]
		if not (effect is Dictionary):
			errors.append("%s effect[%d] must be an object" % [owner_label, index])
			continue

		var effect_dict := effect as Dictionary
		_require_string(effect_dict, "type", "effect", "%s[%d]" % [owner_label, index], errors)
		_enum_value(effect_dict, "type", EFFECT_TYPES, "effect", "%s[%d]" % [owner_label, index], errors)


func _validate_event_effects(effects: Variant, owner_label: String, errors: PackedStringArray) -> void:
	if not (effects is Array):
		errors.append("%s effects must be an array" % owner_label)
		return

	var effect_list := effects as Array
	for index in range(effect_list.size()):
		var effect: Variant = effect_list[index]
		if not (effect is Dictionary):
			errors.append("%s effect[%d] must be an object" % [owner_label, index])
			continue

		var effect_dict := effect as Dictionary
		var effect_type := str(effect_dict.get("type", ""))
		_require_string(effect_dict, "type", "event_effect", "%s[%d]" % [owner_label, index], errors)
		_enum_value(effect_dict, "type", EVENT_EFFECT_TYPES, "event_effect", "%s[%d]" % [owner_label, index], errors)
		if ["lose_hp", "gain_gold"].has(effect_type):
			_require_int(effect_dict, "value", "event_effect", "%s[%d]" % [owner_label, index], errors)
		if ["remove_card", "upgrade_card"].has(effect_type) and bool(effect_dict.get("requires_selection", false)):
			continue
		if ["remove_card", "gain_card", "upgrade_card"].has(effect_type):
			var card_id := str(effect_dict.get("card_id", ""))
			if card_id.is_empty():
				errors.append("event_effect:%s[%d] missing string field 'card_id'" % [owner_label, index])
			elif not _cards.has(card_id):
				errors.append("event_effect:%s[%d] references missing card '%s'" % [owner_label, index, card_id])
		if effect_type == "transform_card":
			var to_card_id := str(effect_dict.get("to_card_id", ""))
			if to_card_id.is_empty():
				errors.append("event_effect:%s[%d] missing string field 'to_card_id'" % [owner, index])
			elif not _cards.has(to_card_id):
				errors.append("event_effect:%s[%d] references missing card '%s'" % [owner, index, to_card_id])


func _require_string(data: Dictionary, key: String, kind: String, id: String, errors: PackedStringArray) -> void:
	if not data.has(key) or str(data.get(key, "")).is_empty():
		errors.append("%s:%s missing string field '%s'" % [kind, id, key])


func _require_int(data: Dictionary, key: String, kind: String, id: String, errors: PackedStringArray) -> void:
	if not data.has(key) or not (data[key] is int or data[key] is float):
		errors.append("%s:%s missing numeric field '%s'" % [kind, id, key])


func _require_array(data: Dictionary, key: String, kind: String, id: String, errors: PackedStringArray) -> void:
	if not data.has(key) or not (data[key] is Array):
		errors.append("%s:%s missing array field '%s'" % [kind, id, key])


func _enum_value(data: Dictionary, key: String, allowed: Array, kind: String, id: String, errors: PackedStringArray) -> void:
	if data.has(key) and not allowed.has(str(data.get(key, ""))):
		errors.append("%s:%s has invalid %s '%s'" % [kind, id, key, str(data.get(key, ""))])
