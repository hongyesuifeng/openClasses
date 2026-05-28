extends RefCounted

var StatusManagerScript := preload("res://scripts/battle/status_manager.gd")
var status: StatusManager


func name() -> String:
	return "StatusManager rules"


func run(ctx: Variant) -> void:
	_test_apply_status(ctx)
	_test_remove_status(ctx)
	_test_tick_turn_end_decrements_stacks(ctx)
	_test_tick_turn_start_poison(ctx)
	_test_tick_turn_start_regeneration(ctx)
	_test_calculate_damage_with_strength(ctx)
	_test_calculate_damage_with_vulnerable(ctx)
	_test_calculate_damage_with_weak(ctx)
	_test_calculate_damage_combined(ctx)
	_test_calculate_block_with_dexterity(ctx)
	_test_calculate_block_with_frail(ctx)
	_test_on_hit_thorns(ctx)
	_test_permanent_status_not_decremented(ctx)
	_test_get_snapshot(ctx)


func _before_each() -> void:
	status = StatusManagerScript.new()


func _test_apply_status(ctx: Variant) -> void:
	_before_each()
	ctx.assert_eq(status.get_stacks("strength"), 0, "初始力量为 0")
	status.apply_status("strength", 3)
	ctx.assert_eq(status.get_stacks("strength"), 3, "施加 3 层力量")
	status.apply_status("strength", 2)
	ctx.assert_eq(status.get_stacks("strength"), 2, "力量更新到 2")


func _test_remove_status(ctx: Variant) -> void:
	_before_each()
	status.apply_status("vulnerable", 2)
	ctx.assert_true(status.has_status("vulnerable"), "施加后存在易伤")
	status.remove_status("vulnerable")
	ctx.assert_false(status.has_status("vulnerable"), "移除后不存在易伤")
	ctx.assert_eq(status.get_stacks("vulnerable"), 0, "移除后易伤层数为 0")


func _test_tick_turn_end_decrements_stacks(ctx: Variant) -> void:
	_before_each()
	status.apply_status("vulnerable", 3)
	ctx.assert_eq(status.get_stacks("vulnerable"), 3, "初始易伤层数为 3")
	status.tick_turn_end()
	ctx.assert_eq(status.get_stacks("vulnerable"), 2, "易伤层数 -1")
	status.tick_turn_end()
	ctx.assert_eq(status.get_stacks("vulnerable"), 1, "易伤层数再次 -1")
	status.tick_turn_end()
	ctx.assert_false(status.has_status("vulnerable"), "易伤消失")


func _test_tick_turn_start_poison(ctx: Variant) -> void:
	_before_each()
	status.apply_status("poison", 5)
	var result: Dictionary = status.tick_turn_start()
	ctx.assert_eq(result.poison_damage, 5, "中毒造成 5 点伤害")
	ctx.assert_eq(status.get_stacks("poison"), 4, "中毒层数 -1")


func _test_tick_turn_start_regeneration(ctx: Variant) -> void:
	_before_each()
	status.apply_status("regeneration", 3)
	var result: Dictionary = status.tick_turn_start()
	ctx.assert_eq(result.regeneration_heal, 3, "生命回复恢复 3 点")
	ctx.assert_eq(status.get_stacks("regeneration"), 2, "生命回复层数 -1")


func _test_calculate_damage_with_strength(ctx: Variant) -> void:
	_before_each()
	# 攻击者有力量
	status.apply_status("strength", 3)
	var damage := status.calculate_damage(6, true)
	ctx.assert_eq(damage, 9, "6 + 3 力量 = 9")


func _test_calculate_damage_with_vulnerable(ctx: Variant) -> void:
	_before_each()
	# 被攻击者有易伤
	status.apply_status("vulnerable", 2)
	var damage := status.calculate_damage(10, false)
	ctx.assert_eq(damage, 15, "10 * 1.5 易伤 = 15")


func _test_calculate_damage_with_weak(ctx: Variant) -> void:
	_before_each()
	# 攻击者有无力
	status.apply_status("weak", 2)
	var damage := status.calculate_damage(10, true)
	ctx.assert_eq(damage, 7, "floor(10 * 0.75) = 7")


func _test_calculate_damage_combined(ctx: Variant) -> void:
	_before_each()
	# 攻击者有力量和无力
	status.apply_status("strength", 2)
	status.apply_status("weak", 1)
	var damage := status.calculate_damage(8, true)
	# (8 + 2) * 0.75 = 7.5 -> floor = 7
	ctx.assert_eq(damage, 7, "力量 + 无力组合计算")


func _test_calculate_block_with_dexterity(ctx: Variant) -> void:
	_before_each()
	status.apply_status("dexterity", 2)
	var block := status.calculate_block(5)
	ctx.assert_eq(block, 7, "5 + 2 敏捷 = 7")


func _test_calculate_block_with_frail(ctx: Variant) -> void:
	_before_each()
	status.apply_status("frail", 2)
	var block := status.calculate_block(8)
	ctx.assert_eq(block, 6, "floor(8 * 0.75) = 6")


func _test_on_hit_thorns(ctx: Variant) -> void:
	_before_each()
	status.apply_status("thorns", 3)
	var damage := status.on_hit()
	ctx.assert_eq(damage, 3, "荆棘反弹 3 点伤害")


func _test_permanent_status_not_decremented(ctx: Variant) -> void:
	_before_each()
	# 力量是永久状态，回合结束不减少
	status.apply_status("strength", 3)
	status.tick_turn_end()
	ctx.assert_eq(status.get_stacks("strength"), 3, "力量不随回合减少")


func _test_get_snapshot(ctx: Variant) -> void:
	_before_each()
	status.apply_status("strength", 2)
	status.apply_status("vulnerable", 3)
	var snapshot := status.get_snapshot()
	ctx.assert_eq(snapshot.size(), 2, "快照包含 2 个状态")
	var has_strength := false
	var has_vulnerable := false
	for s in snapshot:
		if s.id == "strength":
			has_strength = true
			ctx.assert_eq(s.stacks, 2, "快照中力量层数正确")
		if s.id == "vulnerable":
			has_vulnerable = true
			ctx.assert_true(s.is_debuff, "易伤是 debuff")
	ctx.assert_true(has_strength, "快照包含力量")
	ctx.assert_true(has_vulnerable, "快照包含易伤")
