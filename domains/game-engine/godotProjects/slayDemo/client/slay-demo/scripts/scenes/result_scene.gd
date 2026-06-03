extends Control

const RelicViewFactoryScript := preload("res://scripts/ui/relic_view_factory.gd")
const CardViewFactoryScript := preload("res://scripts/ui/card_view_factory.gd")


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

	var background := ColorRect.new()
	background.color = Color(0.05, 0.06, 0.075)
	background.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(background)

	var scroll := ScrollContainer.new()
	scroll.set_anchors_preset(Control.PRESET_FULL_RECT)
	scroll.offset_left = 20
	scroll.offset_top = 16
	scroll.offset_right = -20
	scroll.offset_bottom = -16
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	add_child(scroll)

	var root := VBoxContainer.new()
	root.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	root.add_theme_constant_override("separation", 16)
	scroll.add_child(root)

	## ── 标题 ────────────────────────────────────────
	var title := Label.new()
	title.text = "🏆 胜利！" if won else "💀 失败"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 38)
	title.add_theme_color_override("font_color",
		Color(0.98, 0.88, 0.40) if won else Color(0.90, 0.36, 0.36))
	root.add_child(title)

	## ── 核心数据 ─────────────────────────────────────
	var stats_panel := PanelContainer.new()
	stats_panel.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	stats_panel.custom_minimum_size = Vector2(360, 0)
	root.add_child(stats_panel)

	var stats_vbox := VBoxContainer.new()
	stats_vbox.add_theme_constant_override("separation", 6)
	stats_panel.add_child(stats_vbox)

	var stats := [
		["击败战斗", str(int(summary.get("battle_wins", 0))) + " 场"],
		["最终 HP", "%d / %d" % [int(summary.get("player_hp", 0)), int(summary.get("player_max_hp", 0))]],
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
		var key_label := Label.new()
		key_label.text = str(stat[0]) + "："
		key_label.custom_minimum_size = Vector2(120, 0)
		key_label.add_theme_font_size_override("font_size", 16)
		key_label.add_theme_color_override("font_color", Color(0.78, 0.72, 0.60))
		row.add_child(key_label)
		var val_label := Label.new()
		val_label.text = str(stat[1])
		val_label.add_theme_font_size_override("font_size", 16)
		val_label.add_theme_color_override("font_color", Color(0.96, 0.90, 0.76))
		row.add_child(val_label)

	## ── 遗物列表 ─────────────────────────────────────
	var relic_ids: Array = summary.get("relic_ids", [])
	if not relic_ids.is_empty() and data_loader != null:
		var relic_title := Label.new()
		relic_title.text = "持有遗物"
		relic_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		relic_title.add_theme_font_size_override("font_size", 18)
		relic_title.add_theme_color_override("font_color", Color(0.94, 0.84, 0.54))
		root.add_child(relic_title)

		var relic_row := HBoxContainer.new()
		relic_row.alignment = BoxContainer.ALIGNMENT_CENTER
		relic_row.add_theme_constant_override("separation", 8)
		root.add_child(relic_row)

		for relic_id in relic_ids:
			var relic: Dictionary = data_loader.get_relic(str(relic_id))
			if relic.is_empty():
				continue
			relic_row.add_child(RelicViewFactoryScript.create_relic_button(relic))

	## ── 最终牌组 ─────────────────────────────────────
	var master_deck: Array = summary.get("master_deck", [])
	if not master_deck.is_empty() and data_loader != null:
		var deck_title := Label.new()
		deck_title.text = "最终牌组（%d 张）" % master_deck.size()
		deck_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		deck_title.add_theme_font_size_override("font_size", 18)
		deck_title.add_theme_color_override("font_color", Color(0.72, 0.88, 0.98))
		root.add_child(deck_title)

		var deck_scroll := ScrollContainer.new()
		deck_scroll.custom_minimum_size = Vector2(0, 160)
		deck_scroll.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		deck_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_SHOW_ALWAYS
		deck_scroll.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
		root.add_child(deck_scroll)

		var deck_row := HBoxContainer.new()
		deck_row.add_theme_constant_override("separation", 10)
		deck_scroll.add_child(deck_row)

		for card_instance in master_deck:
			var card_data: Dictionary = data_loader.resolve_card_instance(card_instance as Dictionary)
			if card_data.is_empty():
				continue
			var card_btn := CardViewFactoryScript.create_card_button(card_data, Vector2(110, 145))
			card_btn.focus_mode = Control.FOCUS_NONE
			deck_row.add_child(card_btn)

	## ── 操作按钮 ─────────────────────────────────────
	var button_row := HBoxContainer.new()
	button_row.alignment = BoxContainer.ALIGNMENT_CENTER
	button_row.add_theme_constant_override("separation", 16)
	root.add_child(button_row)

	var restart_button := Button.new()
	restart_button.text = "重新开始"
	restart_button.custom_minimum_size = Vector2(200, 48)
	restart_button.pressed.connect(_on_restart_pressed)
	button_row.add_child(restart_button)

	var menu_button := Button.new()
	menu_button.text = "返回主菜单"
	menu_button.custom_minimum_size = Vector2(200, 44)
	menu_button.pressed.connect(_on_menu_pressed)
	button_row.add_child(menu_button)


func _on_restart_pressed() -> void:
	var run_controller: Variant = _autoload("RunController")
	run_controller.start_new_run()


func _on_menu_pressed() -> void:
	var scene_router: Variant = _autoload("SceneRouter")
	scene_router.go_to("main_menu")


func _autoload(autoload_name: String) -> Variant:
	return get_node_or_null("/root/%s" % autoload_name)
