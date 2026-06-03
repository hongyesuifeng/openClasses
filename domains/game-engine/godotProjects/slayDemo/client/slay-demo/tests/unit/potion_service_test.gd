extends RefCounted

const PotionServiceScript := preload("res://scripts/potion/potion_service.gd")
const SaveServiceScript := preload("res://scripts/autoload/save_service.gd")


func name() -> String:
	return "PotionService slot/use/save rules"


func run(ctx: Variant) -> void:
	var data_loader: Variant = ctx.autoload("DataLoader")
	var game_state: Variant = ctx.autoload("GameState")
	var run_controller: Variant = ctx.autoload("RunController")

	data_loader.load_all()
	var run_config: Dictionary = data_loader.get_run_config("act1_map_run")
	game_state.start_new_run(run_config)

	## 1. 初始药水栏为空
	ctx.assert_eq(game_state.owned_potions.size(), 0, "potion slots start empty")
	ctx.assert_true(game_state.can_add_potion(), "can add potion when slots empty")

	## 2. 加入一瓶药水
	ctx.assert_true(game_state.add_potion("potion_heal"), "add_potion returns true")
	ctx.assert_eq(game_state.owned_potions.size(), 1, "slot count is 1 after add")

	## 3. 再加一瓶达到上限
	ctx.assert_true(game_state.add_potion("potion_block"), "add second potion returns true")
	ctx.assert_eq(game_state.owned_potions.size(), 2, "slot count is 2 after second add")
	ctx.assert_false(game_state.can_add_potion(), "can_add_potion false when full")

	## 4. 槽满时加入失败
	ctx.assert_false(game_state.add_potion("potion_strength"), "add_potion fails when full")
	ctx.assert_eq(game_state.owned_potions.size(), 2, "slot count unchanged after failed add")

	## 5. get_potion_at 返回正确槽位
	var slot0: Dictionary = game_state.get_potion_at(0)
	ctx.assert_eq(str(slot0.get("id", "")), "potion_heal", "slot 0 is potion_heal")
	var slot1: Dictionary = game_state.get_potion_at(1)
	ctx.assert_eq(str(slot1.get("id", "")), "potion_block", "slot 1 is potion_block")

	## 6. 越界返回空
	ctx.assert_true(game_state.get_potion_at(5).is_empty(), "out-of-bounds slot returns empty")

	## 7. remove_potion_at 移除指定槽
	ctx.assert_true(game_state.remove_potion_at(0), "remove_potion_at returns true")
	ctx.assert_eq(game_state.owned_potions.size(), 1, "slot count drops to 1 after remove")
	ctx.assert_eq(str(game_state.get_potion_at(0).get("id", "")), "potion_block", "remaining slot is potion_block")

	## 8. DataLoader 能加载药水数据
	var heal_potion: Dictionary = data_loader.get_potion("potion_heal")
	ctx.assert_false(heal_potion.is_empty(), "get_potion returns non-empty dict")
	ctx.assert_eq(str(heal_potion.get("id", "")), "potion_heal", "potion id matches")
	ctx.assert_false(str(heal_potion.get("name", "")).is_empty(), "potion has name")

	var all_potions: Array = data_loader.get_all_potions()
	ctx.assert_eq(all_potions.size(), 8, "get_all_potions returns 8 entries")

	## 9. validate_all 不报错（potions.json 格式正确）
	var errors: PackedStringArray = data_loader.validate_all()
	ctx.assert_eq(errors.size(), 0, "validate_all reports no errors with potions.json")

	## 10. 存档序列化 owned_potions
	game_state.start_new_run(run_config)
	game_state.add_potion("potion_strength")
	run_controller.active_run_id = "act1_map_run"
	SaveServiceScript.save(game_state, run_controller, data_loader)

	var loaded: Dictionary = SaveServiceScript.load_save()
	var saved_potions: Variant = loaded.get("owned_potions", [])
	ctx.assert_true(saved_potions is Array, "owned_potions is saved as array")
	ctx.assert_eq((saved_potions as Array).size(), 1, "saved potions count is 1")
	ctx.assert_eq(str(((saved_potions as Array)[0] as Dictionary).get("id", "")), "potion_strength", "saved potion id is potion_strength")

	## 11. restore 后 owned_potions 正确恢复
	game_state.start_new_run(run_config)
	ctx.assert_eq(game_state.owned_potions.size(), 0, "start_new_run clears potions")
	var save_data: Dictionary = SaveServiceScript.load_save()
	SaveServiceScript.restore(save_data, game_state, run_controller, data_loader)
	ctx.assert_eq(game_state.owned_potions.size(), 1, "restore recovers potion count")
	ctx.assert_eq(str(game_state.get_potion_at(0).get("id", "")), "potion_strength", "restore recovers potion id")

	## 12. choose_potion_reward 返回有效药水
	var reward: Dictionary = PotionServiceScript.choose_potion_reward(data_loader)
	ctx.assert_false(reward.is_empty(), "choose_potion_reward returns non-empty dict")
	ctx.assert_false(str(reward.get("id", "")).is_empty(), "reward has id")

	## 清理
	SaveServiceScript.delete_save()
