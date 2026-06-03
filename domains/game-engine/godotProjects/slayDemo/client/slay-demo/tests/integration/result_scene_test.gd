extends RefCounted

const ResultScene := preload("res://scenes/result/result_scene.tscn")


func name() -> String:
	return "ResultScene enhanced summary"


func run(ctx: Variant) -> void:
	var data_loader: Variant = ctx.autoload("DataLoader")
	var game_state: Variant = ctx.autoload("GameState")
	data_loader.load_all()

	## 1. get_result_summary 包含新字段
	var run_config: Dictionary = data_loader.get_run_config("act1_map_run")
	game_state.start_new_run(run_config)
	game_state.add_relic("lantern")
	game_state.add_relic("anchor")
	game_state.add_potion("potion_heal")
	game_state.finish_run(true)

	var summary: Dictionary = game_state.get_result_summary()
	ctx.assert_true(summary.has("relic_ids"), "summary includes relic_ids")
	ctx.assert_true(summary.has("master_deck"), "summary includes master_deck")
	ctx.assert_true(summary.has("potions_held"), "summary includes potions_held")
	ctx.assert_eq((summary.get("relic_ids", []) as Array).size(), 2, "summary relic_ids has 2 entries")
	ctx.assert_eq(int(summary.get("relic_count", 0)), 2, "summary relic_count is 2")
	ctx.assert_eq(int(summary.get("potions_held", 0)), 1, "summary potions_held is 1")
	ctx.assert_true((summary.get("master_deck", []) as Array).size() > 0, "summary master_deck is non-empty")
	ctx.assert_true(bool(summary.get("won", false)), "summary won is true after finish_run(true)")

	## 2. 失败局 won = false
	game_state.start_new_run(run_config)
	game_state.finish_run(false)
	var loss_summary: Dictionary = game_state.get_result_summary()
	ctx.assert_false(bool(loss_summary.get("won", true)), "summary won is false after finish_run(false)")

	## 3. ResultScene 可实例化（编译通过）
	ctx.assert_true(ResultScene != null, "ResultScene resource loads")


func run_async(ctx: Variant) -> void:
	var data_loader: Variant = ctx.autoload("DataLoader")
	var game_state: Variant = ctx.autoload("GameState")
	data_loader.load_all()

	## 4. 胜利场景渲染遗物行和牌组行
	var run_config: Dictionary = data_loader.get_run_config("act1_map_run")
	game_state.start_new_run(run_config)
	game_state.add_relic("lantern")
	game_state.finish_run(true)

	var scene: Control = ResultScene.instantiate()
	_tree_root().add_child.call_deferred(scene)
	await _tree().process_frame

	## 标题包含胜利文本
	var title_label := _find_label_with_text(scene, "胜利")
	ctx.assert_true(title_label != null, "result scene shows victory title on win")

	## 存在遗物按钮
	var relic_btn := _find_node_by_name_prefix(scene, "Relic_lantern")
	ctx.assert_true(relic_btn != null, "result scene renders owned relic button")

	scene.queue_free()

	## 5. 失败场景标题
	game_state.start_new_run(run_config)
	game_state.finish_run(false)
	var loss_scene: Control = ResultScene.instantiate()
	_tree_root().add_child.call_deferred(loss_scene)
	await _tree().process_frame

	var loss_title := _find_label_with_text(loss_scene, "失败")
	ctx.assert_true(loss_title != null, "result scene shows defeat title on loss")
	loss_scene.queue_free()


func _find_label_with_text(root: Node, text: String) -> Label:
	if root is Label and str((root as Label).text).contains(text):
		return root as Label
	for child in root.get_children():
		var found := _find_label_with_text(child, text)
		if found != null:
			return found
	return null


func _find_node_by_name_prefix(root: Node, prefix: String) -> Node:
	if root.name.begins_with(prefix):
		return root
	for child in root.get_children():
		var found := _find_node_by_name_prefix(child, prefix)
		if found != null:
			return found
	return null


func _tree_root() -> Window:
	return _tree().root


func _tree() -> SceneTree:
	return Engine.get_main_loop() as SceneTree
