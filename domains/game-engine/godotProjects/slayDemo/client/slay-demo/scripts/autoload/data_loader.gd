extends Node

const CARDS_PATH := "res://data/cards.json"
const ENEMIES_PATH := "res://data/enemies.json"
const ENCOUNTERS_PATH := "res://data/encounters.json"
const REWARDS_PATH := "res://data/rewards.json"
const RELICS_PATH := "res://data/relics.json"
const RUNS_PATH := "res://data/run_v1.json"

const CARD_TYPES := ["attack", "skill", "power", "status"]
const CARD_RARITIES := ["starter", "common", "uncommon", "rare", "special"]
const CARD_TARGETS := ["self", "single_enemy", "all_enemies", "none"]
const ENCOUNTER_TYPES := ["normal", "elite", "boss"]
const RUN_NODE_TYPES := ["battle", "reward", "rest", "shop", "chest", "result"]
const EFFECT_TYPES := ["damage", "block", "draw", "apply_status", "gain_strength", "gain_barricade", "heal", "multi_damage", "aoe_damage", "gain_energy", "exhaust"]
const RELIC_RARITIES := ["common", "uncommon", "rare"]
const RELIC_EFFECT_TYPES := ["battle_start_block", "first_turn_energy", "max_hp", "card_gain_heal", "battle_win_gold"]

var _cards: Dictionary = {}
var _enemies: Dictionary = {}
var _encounters: Dictionary = {}
var _reward_profiles: Dictionary = {}
var _relics: Dictionary = {}
var _runs: Dictionary = {}
var _loaded := false
var _next_card_instance_id := 1


func load_all() -> void:
	_cards = _load_collection(CARDS_PATH, "cards")
	_enemies = _load_collection(ENEMIES_PATH, "enemies")
	_encounters = _load_collection(ENCOUNTERS_PATH, "encounters")
	_reward_profiles = _load_collection(REWARDS_PATH, "reward_profiles")
	_relics = _load_collection(RELICS_PATH, "relics")
	_runs = _load_collection(RUNS_PATH, "runs")
	_loaded = true


func clear_cache() -> void:
	_cards.clear()
	_enemies.clear()
	_encounters.clear()
	_reward_profiles.clear()
	_relics.clear()
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
		_require_array(enemy, "actions", "enemy", id, errors)

		var actions: Array = enemy.get("actions", [])
		if actions.is_empty():
			errors.append("enemy:%s must define at least one action" % id)

		for action_index in range(actions.size()):
			var action: Variant = actions[action_index]
			if not (action is Dictionary):
				errors.append("enemy:%s action[%d] must be an object" % [id, action_index])
				continue

			var action_dict := action as Dictionary
			_require_string(action_dict, "id", "enemy_action", "%s[%d]" % [id, action_index], errors)
			_require_array(action_dict, "effects", "enemy_action", "%s[%d]" % [id, action_index], errors)
			_validate_effects(action_dict.get("effects", []), "enemy:%s action:%d" % [id, action_index], errors)


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


func _validate_effects(effects: Variant, owner: String, errors: PackedStringArray) -> void:
	if not (effects is Array):
		errors.append("%s effects must be an array" % owner)
		return

	var effect_list := effects as Array
	for index in range(effect_list.size()):
		var effect: Variant = effect_list[index]
		if not (effect is Dictionary):
			errors.append("%s effect[%d] must be an object" % [owner, index])
			continue

		var effect_dict := effect as Dictionary
		_require_string(effect_dict, "type", "effect", "%s[%d]" % [owner, index], errors)
		_enum_value(effect_dict, "type", EFFECT_TYPES, "effect", "%s[%d]" % [owner, index], errors)


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
