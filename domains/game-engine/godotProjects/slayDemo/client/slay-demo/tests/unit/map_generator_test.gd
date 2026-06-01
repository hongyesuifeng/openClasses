extends RefCounted

const MapGeneratorScript := preload("res://scripts/map/map_generator.gd")


func name() -> String:
	return "Generated map battle encounters"


func run(ctx: Variant) -> void:
	var data_loader: Variant = ctx.autoload("DataLoader")
	data_loader.load_all()
	var run_config: Dictionary = MapGeneratorScript.generate_map(12345, 9)
	var map_nodes: Array = run_config.get("map_nodes", [])

	ctx.assert_false(map_nodes.is_empty(), "generated map contains nodes")
	if map_nodes.is_empty():
		return

	var first_node := map_nodes[0] as Dictionary
	ctx.assert_eq(str(first_node.get("type", "")), "battle", "first generated node is a battle")
	ctx.assert_eq(str(first_node.get("encounter_id", "")), "v1_normal_01", "first generated battle uses the starter encounter")
	_assert_battle_node_has_enemies(ctx, data_loader, first_node)

	for node in map_nodes:
		var node_dict := node as Dictionary
		if str(node_dict.get("type", "")) == "battle":
			_assert_battle_node_has_enemies(ctx, data_loader, node_dict)


func _assert_battle_node_has_enemies(ctx: Variant, data_loader: Variant, node: Dictionary) -> void:
	var encounter_id := str(node.get("encounter_id", ""))
	ctx.assert_false(encounter_id.is_empty(), "battle node %s has encounter_id" % str(node.get("id", "")))

	var encounter: Dictionary = data_loader.get_encounter(encounter_id)
	ctx.assert_false(encounter.is_empty(), "encounter %s exists" % encounter_id)

	var enemy_ids: Array = encounter.get("enemy_ids", [])
	ctx.assert_false(enemy_ids.is_empty(), "encounter %s has enemies" % encounter_id)
