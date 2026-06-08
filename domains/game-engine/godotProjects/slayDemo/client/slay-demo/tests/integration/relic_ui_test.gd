extends RefCounted

const ChestScene := preload("res://scenes/chest/chest_scene.tscn")
const BattleScene := preload("res://scenes/battle/battle_scene.tscn")
const MapScene := preload("res://scenes/map/map_scene.tscn")


func name() -> String:
	return "Relic reward and visible relic UI"


func run(ctx: Variant) -> void:
	pass


func run_async(ctx: Variant) -> void:
	var data_loader: Variant = ctx.autoload("DataLoader")
	var game_state: Variant = ctx.autoload("GameState")
	data_loader.load_all()

	await _test_chest_reward_feedback(ctx, game_state, data_loader)
	await _test_battle_relic_row(ctx, game_state, data_loader)
	await _test_battle_enemy_sprite_visible(ctx, game_state, data_loader)
	await _test_map_relic_row(ctx, game_state, data_loader)


func _test_chest_reward_feedback(ctx: Variant, game_state: Variant, data_loader: Variant) -> void:
	game_state.start_new_run(data_loader.get_run_config("act1_map_run"))
	game_state.current_map_node_id = "map_03a"

	var chest: Control = ChestScene.instantiate()
	_tree_root().add_child.call_deferred(chest)
	await _tree().process_frame
	chest.call("_on_open_pressed")
	chest.call("_on_open_pressed")

	var status_label: Label = chest.get("_status_label")
	ctx.assert_true(status_label.text.contains("获得 45 金币"), "chest reward shows gold")
	ctx.assert_true(status_label.text.contains("获得遗物：魔法护符"), "chest reward shows relic name")
	ctx.assert_true(status_label.text.contains("效果：每场战斗开始获得 10 点格挡。"), "chest reward shows relic description")
	ctx.assert_eq(game_state.player_gold, 165, "chest cannot grant gold twice")
	ctx.assert_eq(game_state.owned_relic_ids.size(), 1, "chest cannot grant relic twice")

	var open_button: Button = chest.get("_open_button")
	ctx.assert_true(open_button.disabled, "chest open button is disabled after opening")
	chest.queue_free()


func _test_battle_relic_row(ctx: Variant, game_state: Variant, data_loader: Variant) -> void:
	game_state.start_new_run(data_loader.get_run_config("act1_map_run"))
	game_state.add_relic("lantern")
	game_state.current_map_node_id = "map_01"

	var battle: Control = BattleScene.instantiate()
	_tree_root().add_child.call_deferred(battle)
	await _tree().process_frame

	var relic_row: HBoxContainer = battle.get("_relic_row")
	var relic_button := _find_relic_button(relic_row, "lantern", "星光提灯")
	ctx.assert_true(relic_button != null, "battle scene renders owned relic button")
	ctx.assert_true(relic_button.tooltip_text.contains("每场战斗第一回合获得 1 点额外能量。"), "battle relic tooltip includes description")
	relic_button.pressed.emit()

	var status_label: Label = battle.get("_status_label")
	ctx.assert_true(status_label.text.contains("星光提灯"), "battle relic click writes name to status text")
	ctx.assert_true(status_label.text.contains("额外能量"), "battle relic click writes effect to status text")
	battle.queue_free()


func _test_battle_enemy_sprite_visible(ctx: Variant, game_state: Variant, data_loader: Variant) -> void:
	game_state.start_new_run(data_loader.get_run_config("act1_map_run"))
	game_state.current_map_node_id = "map_01"

	var battle: Control = BattleScene.instantiate()
	_tree_root().add_child.call_deferred(battle)
	await _tree().process_frame
	await _tree().process_frame

	var enemy_row: HBoxContainer = battle.get("_enemy_row")
	ctx.assert_true(enemy_row != null, "battle scene has an enemy row")
	ctx.assert_gt(enemy_row.get_child_count(), 0, "first battle renders at least one enemy control")

	var sprite := _find_enemy_sprite(enemy_row)
	ctx.assert_true(sprite != null, "first battle renders an enemy texture")
	if sprite != null:
		ctx.assert_eq(sprite.size, Vector2(200, 165), "enemy sprite uses a scaled visible render area")
		ctx.assert_eq(sprite.position, Vector2(10, 0), "enemy sprite leaves room for labels below")
	battle.queue_free()


func _test_map_relic_row(ctx: Variant, game_state: Variant, data_loader: Variant) -> void:
	game_state.start_new_run(data_loader.get_run_config("act1_map_run"))
	game_state.add_relic("strawberry")

	var map: Control = MapScene.instantiate()
	_tree_root().add_child.call_deferred(map)
	await _tree().process_frame

	var relic_row: HBoxContainer = map.get("_relic_row")
	var relic_button := _find_relic_button(relic_row, "strawberry", "幸运草莓")
	ctx.assert_true(relic_button != null, "map scene renders owned relic button")
	ctx.assert_true(relic_button.tooltip_text.contains("获得时最大生命值提高 10。"), "map relic tooltip includes description")
	relic_button.pressed.emit()

	var status_label: Label = map.get("_status_label")
	ctx.assert_true(status_label.text.contains("幸运草莓"), "map relic click writes name to status text")
	ctx.assert_true(status_label.text.contains("最大生命值"), "map relic click writes effect to status text")
	map.queue_free()


func _find_relic_button(root: Node, relic_id: String, relic_name: String) -> Button:
	# 图标按钮模式：name = "Relic_<id>"
	var by_name := root.find_child("Relic_%s" % relic_id, true, false)
	if by_name is Button:
		return by_name as Button
	# fallback：文字按钮模式
	return _find_button_by_text(root, relic_name)


func _find_button_by_text(root: Node, text: String) -> Button:
	if root is Button and (root as Button).text == text:
		return root as Button
	for child in root.get_children():
		var found := _find_button_by_text(child, text)
		if found != null:
			return found
	return null


func _find_enemy_sprite(root: Node) -> TextureRect:
	if root is TextureRect:
		var texture := (root as TextureRect).texture
		if texture != null and str(texture.resource_path).contains("assets/enemies"):
			return root as TextureRect
	for child in root.get_children():
		var found := _find_enemy_sprite(child)
		if found != null:
			return found
	return null


func _tree_root() -> Window:
	return _tree().root


func _tree() -> SceneTree:
	var tree := Engine.get_main_loop() as SceneTree
	return tree
