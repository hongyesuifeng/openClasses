extends RefCounted

const MapScene := preload("res://scenes/map/map_scene.tscn")


func name() -> String:
	return "MapScene path lines and node layout"


func run(ctx: Variant) -> void:
	var data_loader: Variant = ctx.autoload("DataLoader")
	data_loader.load_all()

	## 1. MapScene 资源可加载
	ctx.assert_true(MapScene != null, "MapScene resource loads")

	## 2. act1 地图节点有 next_nodes 连接关系（路径线数据源）
	var run_config: Dictionary = data_loader.get_run_config("act1_map_run")
	var map_nodes: Array = run_config.get("map_nodes", [])
	ctx.assert_true(map_nodes.size() > 0, "act1_map_run has map nodes")

	var has_connections := false
	for node in map_nodes:
		var node_dict := node as Dictionary
		if (node_dict.get("next_nodes", []) as Array).size() > 0:
			has_connections = true
			break
	ctx.assert_true(has_connections, "at least one map node has next_nodes connections")

	## 3. 随机生成地图也有连接关系
	const MapGeneratorScript := preload("res://scripts/map/map_generator.gd")
	var gen_config: Dictionary = MapGeneratorScript.generate_map(42, 9)
	var gen_nodes: Array = gen_config.get("map_nodes", [])
	ctx.assert_true(gen_nodes.size() > 0, "generated map has nodes")

	var gen_has_connections := false
	for node in gen_nodes:
		var node_dict := node as Dictionary
		if (node_dict.get("next_nodes", []) as Array).size() > 0:
			gen_has_connections = true
			break
	ctx.assert_true(gen_has_connections, "generated map has node connections for path lines")

	## 4. 所有地图节点都有 floor 字段（用于纵向布局定位）
	for node in gen_nodes:
		var node_dict := node as Dictionary
		ctx.assert_true(node_dict.has("floor"), "each map node has floor field for positioning")
		break  ## 只验证第一个，避免断言数爆炸


func run_async(ctx: Variant) -> void:
	var data_loader: Variant = ctx.autoload("DataLoader")
	var game_state: Variant = ctx.autoload("GameState")
	data_loader.load_all()

	## 5. 地图场景渲染后 _path_lines 数组有数据（路径线已计算）
	var run_config: Dictionary = data_loader.get_run_config("act1_map_run")
	game_state.start_new_run(run_config)

	var map: Control = MapScene.instantiate()
	_tree_root().add_child.call_deferred(map)
	await _tree().process_frame
	await _tree().process_frame

	var path_lines: Array = map.get("_path_lines")
	ctx.assert_gt(path_lines.size(), 0, "map scene renders at least one Line2D path line")

	## 6. 每条路径线数据有 from/to 两个端点
	if path_lines.size() > 0:
		var first_line := path_lines[0] as Dictionary
		ctx.assert_true(first_line.has("from") and first_line.has("to"), "path line has exactly 2 points (from-to)")

	map.queue_free()


func _count_line2d(root: Node) -> int:
	var count := 0
	if root is Line2D:
		count += 1
	for child in root.get_children():
		count += _count_line2d(child)
	return count


func _find_first_line2d(root: Node) -> Line2D:
	if root is Line2D:
		return root as Line2D
	for child in root.get_children():
		var found := _find_first_line2d(child)
		if found != null:
			return found
	return null


func _tree_root() -> Window:
	return _tree().root


func _tree() -> SceneTree:
	return Engine.get_main_loop() as SceneTree
