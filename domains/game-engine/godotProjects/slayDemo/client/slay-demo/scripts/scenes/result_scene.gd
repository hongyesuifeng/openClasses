extends Control

const _UIBuilder := preload("res://addons/ui_builder/ui_builder.gd")
const RelicViewFactoryScript := preload("res://scripts/ui/relic_view_factory.gd")
const CardViewFactoryScript  := preload("res://scripts/ui/card_view_factory.gd")

const SPEC_PATH := "res://ui_specs/result.ui.json"


func _ready() -> void:
	var audio_manager: Variant = _autoload("AudioManager")
	var game_state: Variant = _autoload("GameState")
	if audio_manager != null and game_state != null:
		var summary: Dictionary = game_state.get_result_summary()
		var bgm_key := "victory" if bool(summary.get("won", false)) else "defeat"
		audio_manager.play_bgm(bgm_key)
	_build()


func _build() -> void:
	var game_state: Variant = _autoload("GameState")
	var data_loader: Variant = _autoload("DataLoader")
	var summary: Dictionary = game_state.get_result_summary()
	var won: bool = bool(summary.get("won", false))

	var ui := _UIBuilder.build(SPEC_PATH)
	ui.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(ui)

	## ── 标题 ──────────────────────────────────────────────────────────
	var title_lbl := ui.find_child("TitleLabel", true, false) as Label
	if title_lbl != null:
		title_lbl.text = "🏆 胜利！" if won else "💀 失败"
		title_lbl.add_theme_color_override("font_color",
			Color(0.98, 0.88, 0.40) if won else Color(0.90, 0.36, 0.36))

	## ── 评价 / 得分 ──────────────────────────────────────────────────
	var grade_lbl := ui.find_child("GradeLabel", true, false) as Label
	var score_lbl := ui.find_child("ScoreLabel", true, false) as Label
	var breakdown_lbl := ui.find_child("BreakdownLabel", true, false) as Label

	if won:
		var score := _calc_score(summary)
		var grade := _score_to_grade(score)
		if grade_lbl != null:
			grade_lbl.text = grade
			grade_lbl.add_theme_font_size_override("font_size", 72)
			grade_lbl.add_theme_color_override("font_color", _grade_color(grade))
			grade_lbl.visible = true
		if score_lbl != null:
			score_lbl.text = "得分：%d 分" % score
			score_lbl.visible = true
		if breakdown_lbl != null:
			breakdown_lbl.text = _score_breakdown(summary)
			breakdown_lbl.visible = true
	else:
		if grade_lbl != null: grade_lbl.visible = false
		if score_lbl != null: score_lbl.visible = false
		if breakdown_lbl != null: breakdown_lbl.visible = false

	## ── 核心数据 ──────────────────────────────────────────────────────
	var stats_vbox := ui.find_child("StatsVBox", true, false) as VBoxContainer
	if stats_vbox != null:
		var stats := [
			["击败战斗", str(int(summary.get("battle_wins", 0))) + " 场"],
			["最终 HP",  "%d / %d" % [int(summary.get("player_hp", 0)), int(summary.get("player_max_hp", 0))]],
			["剩余金币", str(int(summary.get("gold", 0))) + " 枚"],
			["完成节点", str(int(summary.get("completed_map_nodes", 0))) + " 个"],
			["牌组大小", str(int(summary.get("deck_size", 0))) + " 张"],
			["持有遗物", str(int(summary.get("relic_count", 0))) + " 个"],
			["剩余药水", str(int(summary.get("potions_held", 0))) + " 瓶"],
		]
		for stat in stats:
			var row := HBoxContainer.new()
			row.add_theme_constant_override("separation", 8)
			stats_vbox.add_child(row)
			var key_lbl := Label.new()
			key_lbl.text = str(stat[0]) + "："
			key_lbl.custom_minimum_size = Vector2(120, 0)
			key_lbl.add_theme_font_size_override("font_size", 16)
			key_lbl.add_theme_color_override("font_color", Color(0.78, 0.72, 0.60))
			row.add_child(key_lbl)
			var val_lbl := Label.new()
			val_lbl.text = str(stat[1])
			val_lbl.add_theme_font_size_override("font_size", 16)
			val_lbl.add_theme_color_override("font_color", Color(0.96, 0.90, 0.76))
			row.add_child(val_lbl)

	## ── 遗物列表 ──────────────────────────────────────────────────────
	var relic_ids: Array = summary.get("relic_ids", [])
	var relic_section := ui.find_child("RelicSectionLabel", true, false) as Label
	var relic_row := ui.find_child("RelicRow", true, false) as HBoxContainer
	if not relic_ids.is_empty() and data_loader != null:
		if relic_section != null: relic_section.visible = true
		if relic_row != null:
			for relic_id in relic_ids:
				var relic: Dictionary = data_loader.get_relic(str(relic_id))
				if relic.is_empty(): continue
				relic_row.add_child(RelicViewFactoryScript.create_relic_button(relic))
	else:
		if relic_section != null: relic_section.visible = false

	## ── 最终牌组 ──────────────────────────────────────────────────────
	var master_deck: Array = summary.get("master_deck", [])
	var deck_section := ui.find_child("DeckSectionLabel", true, false) as Label
	var deck_row := ui.find_child("DeckRow", true, false) as HBoxContainer
	if not master_deck.is_empty() and data_loader != null:
		if deck_section != null:
			deck_section.text = "最终牌组（%d 张）" % master_deck.size()
		if deck_row != null:
			for card_instance in master_deck:
				var card_data: Dictionary = data_loader.resolve_card_instance(card_instance as Dictionary)
				if card_data.is_empty(): continue
				var card_btn := CardViewFactoryScript.create_card_button(card_data, Vector2(110, 145))
				card_btn.focus_mode = Control.FOCUS_NONE
				deck_row.add_child(card_btn)


func handle_action(action_name: String, _source: Node) -> void:
	match action_name:
		"result.on_restart": _on_restart_pressed()
		"result.on_menu":    _on_menu_pressed()


func _on_restart_pressed() -> void:
	var run_controller: Variant = _autoload("RunController")
	run_controller.start_new_run()


func _on_menu_pressed() -> void:
	var scene_router: Variant = _autoload("SceneRouter")
	scene_router.go_to("main_menu")


func _autoload(autoload_name: String) -> Variant:
	return get_node_or_null("/root/%s" % autoload_name)


func _calc_score(summary: Dictionary) -> int:
	var hp      := int(summary.get("player_hp", 0))
	var gold    := int(summary.get("gold", 0))
	var relics  := int(summary.get("relic_count", 0))
	var battles := int(summary.get("battle_wins", 0))
	var nodes   := int(summary.get("completed_map_nodes", 0))
	return hp * 2 + gold + relics * 50 + battles * 30 + nodes * 10


func _score_to_grade(score: int) -> String:
	if score >= 800: return "S"
	if score >= 600: return "A"
	if score >= 400: return "B"
	if score >= 200: return "C"
	return "D"


func _grade_color(grade: String) -> Color:
	match grade:
		"S": return Color(1.00, 0.90, 0.20)
		"A": return Color(0.60, 1.00, 0.60)
		"B": return Color(0.50, 0.80, 1.00)
		"C": return Color(0.90, 0.70, 0.40)
		_:   return Color(0.72, 0.68, 0.68)


func _score_breakdown(summary: Dictionary) -> String:
	var hp      := int(summary.get("player_hp", 0))
	var gold    := int(summary.get("gold", 0))
	var relics  := int(summary.get("relic_count", 0))
	var battles := int(summary.get("battle_wins", 0))
	var nodes   := int(summary.get("completed_map_nodes", 0))
	return "HP %d×2=%d  金币 %d  遗物 %d×50=%d  战斗 %d×30=%d  节点 %d×10=%d" % [
		hp, hp*2, gold, relics, relics*50, battles, battles*30, nodes, nodes*10
	]
