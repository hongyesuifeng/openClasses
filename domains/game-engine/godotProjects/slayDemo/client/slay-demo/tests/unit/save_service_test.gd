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

	## 清理
	SaveServiceScript.delete_save()
