extends RefCounted

const RewardScene := preload("res://scenes/reward/reward_scene.tscn")
const BattleScene := preload("res://scenes/battle/battle_scene.tscn")


func name() -> String:
	return "Potion reward flow integration"


func run(ctx: Variant) -> void:
	pass


func run_async(ctx: Variant) -> void:
	var data_loader: Variant = ctx.autoload("DataLoader")
	var game_state: Variant = ctx.autoload("GameState")
	data_loader.load_all()

	await _test_elite_battle_sets_pending_potion(ctx, game_state, data_loader)
	await _test_reward_scene_shows_potion_layer(ctx, game_state, data_loader)
	await _test_potion_slot_full_shows_discard_buttons(ctx, game_state, data_loader)
	await _test_battle_scene_renders_potion_row(ctx, game_state, data_loader)


## 精英战胜利后 pending_potion_reward 被写入
func _test_elite_battle_sets_pending_potion(ctx: Variant, game_state: Variant, data_loader: Variant) -> void:
	game_state.start_new_run(data_loader.get_run_config("act1_map_run"))
	ctx.assert_true(game_state.pending_potion_reward.is_empty(), "pending_potion_reward starts empty")

	## 模拟 RunController._grant_potion_if_needed 的逻辑：
	## 精英战（v1_elite_01）胜利后写入 pending
	game_state.current_map_node_id = "map_04b"
	var run_controller: Variant = ctx.autoload("RunController")
	run_controller.active_run_id = "act1_map_run"

	## 直接调用内部方法验证逻辑
	run_controller._grant_potion_if_needed()

	ctx.assert_false(game_state.pending_potion_reward.is_empty(), "elite battle sets pending_potion_reward")
	var potion_id := str(game_state.pending_potion_reward.get("id", ""))
	ctx.assert_false(potion_id.is_empty(), "pending_potion_reward has valid id")
	var all_potions: Array = data_loader.get_all_potions()
	var valid_ids := all_potions.map(func(p: Dictionary) -> String: return str(p.get("id", "")))
	ctx.assert_true(valid_ids.has(potion_id), "pending potion id is one of the valid potions")


## 普通战斗不写入 pending_potion_reward
func _test_normal_battle_no_potion(ctx: Variant, game_state: Variant, data_loader: Variant) -> void:
	game_state.start_new_run(data_loader.get_run_config("act1_map_run"))
	game_state.current_map_node_id = "map_01"
	var run_controller: Variant = ctx.autoload("RunController")
	run_controller._grant_potion_if_needed()
	ctx.assert_true(game_state.pending_potion_reward.is_empty(), "normal battle does not set pending_potion_reward")


## RewardScene 检测到 pending_potion_reward 进入药水弹层
func _test_reward_scene_shows_potion_layer(ctx: Variant, game_state: Variant, data_loader: Variant) -> void:
	game_state.start_new_run(data_loader.get_run_config("act1_map_run"))
	game_state.current_map_node_id = "map_04b"

	## 注入一个 pending potion（跳过战斗，直接模拟战后状态）
	game_state.pending_potion_reward = data_loader.get_potion("potion_heal").duplicate(true)
	game_state.prepare_map_reward("elite_card_reward")

	var reward: Control = RewardScene.instantiate()
	_tree_root().add_child.call_deferred(reward)
	await _tree().process_frame

	## 药水弹层优先于卡牌奖励展示，pending 已被消费
	ctx.assert_true(game_state.pending_potion_reward.is_empty(), "RewardScene consumes pending_potion_reward on _ready")

	## 场景处于药水模式：_potion_mode 为 true
	var potion_mode: bool = bool(reward.get("_potion_mode"))
	ctx.assert_true(potion_mode, "RewardScene enters potion mode when pending_potion_reward exists")

	## 界面包含药水名称
	var found_label := _find_label_with_text(reward, "治疗药水")
	ctx.assert_true(found_label != null, "RewardScene shows pending potion name in potion mode")

	reward.queue_free()


## 槽位满时展示丢弃按钮
func _test_potion_slot_full_shows_discard_buttons(ctx: Variant, game_state: Variant, data_loader: Variant) -> void:
	game_state.start_new_run(data_loader.get_run_config("act1_map_run"))
	game_state.current_map_node_id = "map_04b"
	game_state.add_potion("potion_heal")
	game_state.add_potion("potion_block")
	ctx.assert_false(game_state.can_add_potion(), "slots are full before test")

	game_state.pending_potion_reward = data_loader.get_potion("potion_strength").duplicate(true)
	game_state.prepare_map_reward("elite_card_reward")

	var reward: Control = RewardScene.instantiate()
	_tree_root().add_child.call_deferred(reward)
	await _tree().process_frame

	## 槽满时必须有丢弃按钮
	var discard_btn := _find_button_with_partial_text(reward, "丢弃")
	ctx.assert_true(discard_btn != null, "RewardScene shows discard button when potion slots full")

	## 也必须有放弃按钮
	var abandon_btn := _find_button_with_partial_text(reward, "放弃")
	ctx.assert_true(abandon_btn != null, "RewardScene shows abandon button when potion slots full")

	reward.queue_free()


## BattleScene 渲染药水行
func _test_battle_scene_renders_potion_row(ctx: Variant, game_state: Variant, data_loader: Variant) -> void:
	game_state.start_new_run(data_loader.get_run_config("act1_map_run"))
	game_state.add_potion("potion_strength")
	game_state.current_map_node_id = "map_01"

	var battle: Control = BattleScene.instantiate()
	_tree_root().add_child.call_deferred(battle)
	await _tree().process_frame

	var potion_row: HBoxContainer = battle.get("_potion_row")
	ctx.assert_true(potion_row != null, "battle scene has _potion_row")

	## 找到药水按钮
	var potion_btn := _find_button_with_partial_text(potion_row, "力量")
	ctx.assert_true(potion_btn != null, "battle scene renders owned potion button")

	battle.queue_free()


## ── helpers ─────────────────────────────────────────────

func _find_label_with_text(root: Node, text: String) -> Label:
	if root is Label and str((root as Label).text).contains(text):
		return root as Label
	for child in root.get_children():
		var found := _find_label_with_text(child, text)
		if found != null:
			return found
	return null


func _find_button_with_partial_text(root: Node, partial: String) -> Button:
	if root is Button and str((root as Button).text).contains(partial):
		return root as Button
	for child in root.get_children():
		var found := _find_button_with_partial_text(child, partial)
		if found != null:
			return found
	return null


func _tree_root() -> Window:
	return _tree().root


func _tree() -> SceneTree:
	return Engine.get_main_loop() as SceneTree
