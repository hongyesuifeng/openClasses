extends GutTest

var StatusManagerScript := preload("res://scripts/battle/status_manager.gd")
var status: StatusManager


func before_each() -> void:
	status = StatusManagerScript.new()


func test_apply_status() -> void:
	assert_eq(status.get_stacks("strength"), 0, "初始力量为 0")
	status.apply_status("strength", 3)
	assert_eq(status.get_stacks("strength"), 3, "施加 3 层力量")
	status.apply_status("strength", 2)  # 力量叠加
	assert_eq(status.get_stacks("strength"), 5, "力量叠加到 5")


func test_remove_status() -> void:
	status.apply_status("vulnerable", 2)
	assert_true(status.has_status("vulnerable"))
	status.remove_status("vulnerable")
	assert_false(status.has_status("vulnerable"))
	assert_eq(status.get_stacks("vulnerable"), 0)


func test_tick_turn_end_decrements_stacks() -> void:
	status.apply_status("vulnerable", 3)
	assert_eq(status.get_stacks("vulnerable"), 3)
	status.tick_turn_end()
	assert_eq(status.get_stacks("vulnerable"), 2, "易伤层数 -1")
	status.tick_turn_end()
	assert_eq(status.get_stacks("vulnerable"), 1)
	status.tick_turn_end()
	assert_false(status.has_status("vulnerable"), "易伤消失")


func test_tick_turn_start_poison() -> void:
	status.apply_status("poison", 5)
	var result := status.tick_turn_start()
	assert_eq(result.poison_damage, 5, "中毒造成 5 点伤害")
	assert_eq(status.get_stacks("poison"), 4, "中毒层数 -1")


func test_tick_turn_start_regeneration() -> void:
	status.apply_status("regeneration", 3)
	var result := status.tick_turn_start()
	assert_eq(result.regeneration_heal, 3, "生命回复恢复 3 点")
	assert_eq(status.get_stacks("regeneration"), 2, "生命回复层数 -1")


func test_calculate_damage_with_strength() -> void:
	# 攻击者有力量
	status.apply_status("strength", 3)
	var damage := status.calculate_damage(6, true)
	assert_eq(damage, 9, "6 + 3 力量 = 9")


func test_calculate_damage_with_vulnerable() -> void:
	# 被攻击者有易伤
	status.apply_status("vulnerable", 2)
	var damage := status.calculate_damage(10, false)
	assert_eq(damage, 15, "10 * 1.5 易伤 = 15")


func test_calculate_damage_with_weak() -> void:
	# 攻击者有无力
	status.apply_status("weak", 2)
	var damage := status.calculate_damage(10, true)
	assert_eq(damage, 7, "floor(10 * 0.75) = 7")


func test_calculate_damage_combined() -> void:
	# 攻击者有力量和无力
	status.apply_status("strength", 2)
	status.apply_status("weak", 1)
	var damage := status.calculate_damage(8, true)
	# (8 + 2) * 0.75 = 7.5 -> floor = 7
	assert_eq(damage, 7, "力量 + 无力组合计算")


func test_calculate_block_with_dexterity() -> void:
	status.apply_status("dexterity", 2)
	var block := status.calculate_block(5)
	assert_eq(block, 7, "5 + 2 敏捷 = 7")


func test_calculate_block_with_frail() -> void:
	status.apply_status("frail", 2)
	var block := status.calculate_block(8)
	assert_eq(block, 6, "floor(8 * 0.75) = 6")


func test_on_hit_thorns() -> void:
	status.apply_status("thorns", 3)
	var damage := status.on_hit()
	assert_eq(damage, 3, "荆棘反弹 3 点伤害")


func test_permanent_status_not_decremented() -> void:
	# 力量是永久状态，回合结束不减少
	status.apply_status("strength", 3)
	status.tick_turn_end()
	assert_eq(status.get_stacks("strength"), 3, "力量不随回合减少")


func test_get_snapshot() -> void:
	status.apply_status("strength", 2)
	status.apply_status("vulnerable", 3)
	var snapshot := status.get_snapshot()
	assert_eq(snapshot.size(), 2, "快照包含 2 个状态")
	var has_strength := false
	var has_vulnerable := false
	for s in snapshot:
		if s.id == "strength":
			has_strength = true
			assert_eq(s.stacks, 2)
		if s.id == "vulnerable":
			has_vulnerable = true
			assert_true(s.is_debuff)
	assert_true(has_strength)
	assert_true(has_vulnerable)
