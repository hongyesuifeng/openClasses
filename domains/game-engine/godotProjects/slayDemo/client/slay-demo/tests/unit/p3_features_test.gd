extends RefCounted

const StatusManagerScript := preload("res://scripts/battle/status_manager.gd")
const PotionServiceScript := preload("res://scripts/potion/potion_service.gd")


func name() -> String:
	return "P3 features: ritual/metallicize/philosopher_stone/potion_pool"


func run(ctx: Variant) -> void:
	_test_ritual_tick_turn_end(ctx)
	_test_metallicize_tick_turn_end(ctx)
	_test_ritual_stacks_accumulate(ctx)
	_test_philosopher_stone_enemy_strength(ctx)
	_test_potion_pool_all_rarities(ctx)
	_test_potion_pool_common_ids(ctx)
	_test_potion_pool_rare_ids(ctx)
	_test_new_cards_in_data(ctx)
	_test_new_encounters_in_data(ctx)


## ritual: 每回合结束增加对应层数的力量
func _test_ritual_tick_turn_end(ctx: Variant) -> void:
	var sm: RefCounted = StatusManagerScript.new()
	sm.call("apply_status", "ritual", 2)
	ctx.assert_eq(sm.call("get_stacks", "strength"), 0, "ritual: 施加前力量为 0")
	var result: Dictionary = sm.call("tick_turn_end")
	ctx.assert_eq(result.get("strength_gain", 0), 2, "ritual tick_turn_end strength_gain=2")
	ctx.assert_eq(sm.call("get_stacks", "strength"), 2, "ritual: tick 后力量变为 2")
	sm.call("tick_turn_end")
	ctx.assert_eq(sm.call("get_stacks", "strength"), 4, "ritual: 第二次 tick 后力量累积到 4")


## metallicize: tick_turn_end 返回 block_gain
func _test_metallicize_tick_turn_end(ctx: Variant) -> void:
	var sm: RefCounted = StatusManagerScript.new()
	sm.call("apply_status", "metallicize", 3)
	var result: Dictionary = sm.call("tick_turn_end")
	ctx.assert_eq(result.get("block_gain", 0), 3, "metallicize tick_turn_end block_gain=3")


## ritual 层数永久，不随回合递减
func _test_ritual_stacks_accumulate(ctx: Variant) -> void:
	var sm: RefCounted = StatusManagerScript.new()
	sm.call("apply_status", "ritual", 1)
	sm.call("tick_turn_end")
	sm.call("tick_turn_end")
	sm.call("tick_turn_end")
	ctx.assert_eq(sm.call("get_stacks", "ritual"), 1, "ritual: 永久状态不被 tick 递减")
	ctx.assert_eq(sm.call("get_stacks", "strength"), 3, "ritual: 3 次 tick 后力量为 3")


## philosopher_stone 特判：战斗开始所有敌人有 1 层力量
func _test_philosopher_stone_enemy_strength(ctx: Variant) -> void:
	var data_loader: Variant = ctx.autoload("DataLoader")
	data_loader.load_all()

	const BattleControllerScript := preload("res://scripts/battle/battle_controller.gd")
	var battle := BattleControllerScript.new()
	var player_state := {
		"hp": 80, "max_hp": 80,
		"energy_per_turn": 3, "draw_per_turn": 5,
		"relic_ids": ["philosopher_stone"]
	}
	battle.setup("v1_normal_01", [], player_state)

	ctx.assert_false(battle.enemies.is_empty(), "philosopher_stone test: enemies exist")
	for enemy in battle.enemies:
		var sm: RefCounted = enemy.get("status_manager")
		if sm != null:
			ctx.assert_eq(sm.call("get_stacks", "strength"), 1,
				"philosopher_stone: enemy '%s' has 1 strength" % str(enemy.get("name", "?")))


## 新药水奖励池覆盖全部 8 种
func _test_potion_pool_all_rarities(ctx: Variant) -> void:
	var data_loader: Variant = ctx.autoload("DataLoader")
	data_loader.load_all()
	var all: Array = data_loader.get_all_potions()
	ctx.assert_eq(all.size(), 8, "potion pool: 共 8 种药水")
	var ids := all.map(func(p: Dictionary) -> String: return str(p.get("id", "")))
	for expected in ["potion_heal", "potion_draw", "potion_dexterity",
					  "potion_energy", "potion_fire", "potion_block_large"]:
		ctx.assert_true(ids.has(expected), "potion pool 包含 %s" % expected)


## common 池应包含 potion_heal、potion_block、potion_draw
func _test_potion_pool_common_ids(ctx: Variant) -> void:
	var data_loader: Variant = ctx.autoload("DataLoader")
	data_loader.load_all()
	var all: Array = data_loader.get_all_potions()
	var common_ids: Array = []
	for p in all:
		if str((p as Dictionary).get("rarity", "")) == "common":
			common_ids.append(str((p as Dictionary).get("id", "")))
	ctx.assert_true(common_ids.has("potion_heal"), "common 池含 potion_heal")
	ctx.assert_true(common_ids.has("potion_block"), "common 池含 potion_block")
	ctx.assert_true(common_ids.has("potion_draw"), "common 池含 potion_draw")


## rare 池应包含 potion_fire、potion_block_large
func _test_potion_pool_rare_ids(ctx: Variant) -> void:
	var data_loader: Variant = ctx.autoload("DataLoader")
	data_loader.load_all()
	var all: Array = data_loader.get_all_potions()
	var rare_ids: Array = []
	for p in all:
		if str((p as Dictionary).get("rarity", "")) == "rare":
			rare_ids.append(str((p as Dictionary).get("id", "")))
	ctx.assert_true(rare_ids.has("potion_fire"), "rare 池含 potion_fire")
	ctx.assert_true(rare_ids.has("potion_block_large"), "rare 池含 potion_block_large")


## 新增的两张 Power 牌在 DataLoader 可查到
func _test_new_cards_in_data(ctx: Variant) -> void:
	var data_loader: Variant = ctx.autoload("DataLoader")
	data_loader.load_all()
	var ritual: Dictionary = data_loader.get_card("ritual_dagger")
	ctx.assert_false(ritual.is_empty(), "ritual_dagger 卡牌存在")
	ctx.assert_eq(str(ritual.get("type", "")), "power", "ritual_dagger 类型为 power")
	var metallicize: Dictionary = data_loader.get_card("metallicize_card")
	ctx.assert_false(metallicize.is_empty(), "metallicize_card 卡牌存在")
	ctx.assert_eq(str(metallicize.get("type", "")), "power", "metallicize_card 类型为 power")


## 新增精英遭遇在 DataLoader 可查到
func _test_new_encounters_in_data(ctx: Variant) -> void:
	var data_loader: Variant = ctx.autoload("DataLoader")
	data_loader.load_all()
	var e03: Dictionary = data_loader.get_encounter("v1_elite_03")
	ctx.assert_false(e03.is_empty(), "v1_elite_03 遭遇存在")
	ctx.assert_eq(str(e03.get("encounter_type", "")), "elite", "v1_elite_03 类型为 elite")
	var e04: Dictionary = data_loader.get_encounter("v1_elite_04")
	ctx.assert_false(e04.is_empty(), "v1_elite_04 遭遇存在")
	ctx.assert_eq(str(e04.get("encounter_type", "")), "elite", "v1_elite_04 类型为 elite")
