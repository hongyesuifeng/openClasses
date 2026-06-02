extends RefCounted

const SaveServiceScript := preload("res://scripts/autoload/save_service.gd")


func name() -> String:
	return "SaveService save/load/restore"


func run(ctx: Variant) -> void:
	var data_loader: Variant = ctx.autoload("DataLoader")
	var game_state: Variant = ctx.autoload("GameState")
	var run_controller: Variant = ctx.autoload("RunController")

	data_loader.load_all()

	## 清理可能残留的存档
	SaveServiceScript.delete_save()

	## 1. 无存档时 has_save 返回 false
	ctx.assert_false(SaveServiceScript.has_save(), "has_save returns false when no save exists")

	## 2. 初始化一个局并存档
	var run_config: Dictionary = data_loader.get_run_config("act1_map_run")
	game_state.start_new_run(run_config)
	game_state.player_hp = 42
	game_state.player_gold = 87
	run_controller.active_run_id = "act1_map_run"

	SaveServiceScript.save(game_state, run_controller, data_loader)
	ctx.assert_true(SaveServiceScript.has_save(), "has_save returns true after saving")

	## 3. load_save 还原基本字段
	var loaded: Dictionary = SaveServiceScript.load_save()
	ctx.assert_eq(int(loaded.get("player_hp", 0)), 42, "load_save restores player_hp")
	ctx.assert_eq(int(loaded.get("player_gold", 0)), 87, "load_save restores player_gold")
	ctx.assert_eq(int(loaded.get("master_deck", []).size()), game_state.master_deck.size(), "load_save restores deck size")
	ctx.assert_eq(str(loaded.get("run_id", "")), "act1_map_run", "load_save restores run_id")

	## 4. delete_save 后 has_save 变 false
	SaveServiceScript.delete_save()
	ctx.assert_false(SaveServiceScript.has_save(), "has_save returns false after delete")

	## 5. restore 后 GameState 字段与原始一致
	game_state.start_new_run(run_config)
	game_state.player_hp = 35
	game_state.player_gold = 155
	var deck_size_before: int = game_state.master_deck.size()
	SaveServiceScript.save(game_state, run_controller, data_loader)

	## 修改 game_state 模拟新局
	game_state.player_hp = 60
	game_state.player_gold = 0

	var save_data: Dictionary = SaveServiceScript.load_save()
	SaveServiceScript.restore(save_data, game_state, run_controller, data_loader)

	ctx.assert_eq(int(game_state.player_hp), 35, "restore sets player_hp correctly")
	ctx.assert_eq(int(game_state.player_gold), 155, "restore sets player_gold correctly")
	ctx.assert_eq(game_state.master_deck.size(), deck_size_before, "restore restores deck size")

	## 6. restore 后 master_deck instance_id 正确
	if game_state.master_deck.size() > 0:
		var first_instance := game_state.master_deck[0] as Dictionary
		ctx.assert_gt(int(first_instance.get("instance_id", 0)), 0, "restored deck has valid instance_ids")

	## 7. restore 后 DataLoader._next_card_instance_id 大于存档最大值
	var max_id := 0
	for card_instance in game_state.master_deck:
		var inst := card_instance as Dictionary
		max_id = maxi(max_id, int(inst.get("instance_id", 0)))
	ctx.assert_gt(data_loader.get_next_instance_id(), max_id, "DataLoader instance counter is ahead of restored deck max id")

	## 8. restore 后 map_nodes 与存档一致（随机地图节点不被静态配置覆盖）
	game_state.start_new_run(run_config)
	## 模拟随机地图：手动注入一个与静态配置不同的节点集
	game_state.map_nodes = [
		{"id": "rnd_1_a", "floor": 1, "type": "battle", "next_nodes": ["rnd_2_a"]},
		{"id": "rnd_2_a", "floor": 2, "type": "rest",   "next_nodes": []}
	]
	game_state.available_map_node_ids.clear()
	game_state.available_map_node_ids.append("rnd_1_a")
	SaveServiceScript.save(game_state, run_controller, data_loader)

	## 修改 game_state 模拟新局（会清掉 map_nodes）
	game_state.start_new_run(run_config)
	ctx.assert_true(game_state.map_nodes.size() != 2, "sanity: new run replaces map_nodes")

	var save_data2: Dictionary = SaveServiceScript.load_save()
	SaveServiceScript.restore(save_data2, game_state, run_controller, data_loader)
	ctx.assert_eq(game_state.map_nodes.size(), 2, "restore preserves saved map_nodes count")
	ctx.assert_eq(str((game_state.map_nodes[0] as Dictionary).get("id", "")), "rnd_1_a", "restore preserves first map node id")

	## 9. 继续游戏回到地图时不应自动选择下一个节点
	game_state.start_new_run(run_config)
	ctx.assert_true(game_state.select_map_node("map_01"), "sanity: first node can be selected before resume repair")
	game_state.prepare_map_reward("normal_card_reward")
	game_state.complete_current_map_node()

	var available_after_complete: Array = game_state.available_map_node_ids.duplicate()
	run_controller._verify_and_repair_map_selection_state(game_state)
	ctx.assert_eq(str(game_state.current_map_node_id), "", "resume repair keeps map waiting for player selection")
	ctx.assert_eq(game_state.available_map_node_ids.size(), available_after_complete.size(), "resume repair preserves selectable nodes")
	ctx.assert_true(game_state.available_map_node_ids.has("map_02a"), "resume repair keeps map_02a selectable")
	ctx.assert_true(game_state.available_map_node_ids.has("map_02b"), "resume repair keeps map_02b selectable")

	## 10. 存档可用节点缺失时，只重新计算，不自动进入节点
	game_state.available_map_node_ids.clear()
	run_controller._verify_and_repair_map_selection_state(game_state)
	ctx.assert_eq(str(game_state.current_map_node_id), "", "resume repair does not auto-select after recalculation")
	ctx.assert_true(game_state.available_map_node_ids.has("map_02a"), "resume repair recalculates map_02a")
	ctx.assert_true(game_state.available_map_node_ids.has("map_02b"), "resume repair recalculates map_02b")

	## 11. 战斗胜利后奖励未结算的存档不应被当作地图选点等待态
	game_state.start_new_run(run_config)
	ctx.assert_true(game_state.select_map_node("map_01"), "sanity: selected first node before pending reward")
	game_state.prepare_map_reward("normal_card_reward")
	game_state.available_map_node_ids.clear()
	ctx.assert_false(run_controller._is_waiting_for_map_selection(game_state), "pending reward save should resume current node, not map")
	ctx.assert_eq(str(game_state.get_current_node().get("type", "")), "reward", "pending reward remains current node after battle win save")

	## 12. 随机地图没有 prev_nodes，修复时必须从已完成节点的 next_nodes 恢复可选节点
	game_state.start_new_run(run_config)
	game_state.map_nodes = [
		{"id": "rnd_1_a", "floor": 1, "type": "battle", "next_nodes": ["rnd_2_a"]},
		{"id": "rnd_2_a", "floor": 2, "type": "battle", "next_nodes": ["rnd_3_a"]},
		{"id": "rnd_2_b", "floor": 2, "type": "event", "next_nodes": ["rnd_3_a"]},
		{"id": "rnd_3_a", "floor": 3, "type": "rest", "next_nodes": []}
	]
	game_state.completed_map_node_ids.clear()
	game_state.completed_map_node_ids.append("rnd_1_a")
	game_state.current_map_node_id = ""
	game_state.available_map_node_ids.clear()
	run_controller._verify_and_repair_map_selection_state(game_state)
	ctx.assert_eq(game_state.available_map_node_ids.size(), 1, "random map repair restores direct next node only")
	ctx.assert_true(game_state.available_map_node_ids.has("rnd_2_a"), "random map repair uses next_nodes")
	ctx.assert_false(game_state.available_map_node_ids.has("rnd_2_b"), "random map repair does not unlock unconnected same-floor node")

	## 清理
	SaveServiceScript.delete_save()
