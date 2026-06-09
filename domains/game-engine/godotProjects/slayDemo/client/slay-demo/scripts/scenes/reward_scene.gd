extends Control

const _UIBuilder := preload("res://addons/ui_builder/ui_builder.gd")
const RewardServiceScript   := preload("res://scripts/reward/reward_service.gd")
const CardViewFactoryScript := preload("res://scripts/ui/card_view_factory.gd")
const UpgradeServiceScript  := preload("res://scripts/battle/upgrade_service.gd")
const PotionViewFactoryScript := preload("res://scripts/ui/potion_view_factory.gd")
const SF := preload("res://scripts/ui/ui_style_factory.gd")

const SPEC_PATH := "res://ui_specs/reward.ui.json"

var _choices: Array = []
var _choice_row: HBoxContainer
var _choice_scroll: ScrollContainer
var _status_label: Label
var _upgrade_mode := false
var _upgradeable_cards: Array = []
var _relic_mode := false
var _pending_relic: Dictionary = {}
var _potion_mode := false
var _pending_potion: Dictionary = {}
var _selected_choice_index := -1
var _selected_upgrade_index := -1
var _compare_panel: Control = null
var _confirm_button: Button


func _ready() -> void:
	var audio_manager: Variant = _autoload("AudioManager")
	if audio_manager != null:
		audio_manager.play_bgm("victory")
	var game_state: Variant = _autoload("GameState")
	if game_state != null and game_state.has_pending_relic_reward():
		_pending_relic = game_state.consume_pending_relic_reward()
		_relic_mode = true
	elif game_state != null and game_state.has_pending_potion_reward():
		_pending_potion = game_state.consume_pending_potion_reward()
		_potion_mode = true
	_check_upgrade_availability()
	_build()


func _check_upgrade_availability() -> void:
	var game_state: Variant = _autoload("GameState")
	var data_loader: Variant = _autoload("DataLoader")
	data_loader.load_all()
	_upgradeable_cards = UpgradeServiceScript.get_upgradeable_cards(game_state.master_deck, data_loader)
	var run_controller: Variant = _autoload("RunController")
	_choices = RewardServiceScript.generate_card_choices(run_controller.get_current_reward_profile_id(), game_state.master_deck)


func _build() -> void:
	var ui := _UIBuilder.build(SPEC_PATH)
	ui.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(ui)

	_status_label  = ui.find_child("StatusLabel",  true, false) as Label
	_choice_scroll = ui.find_child("ChoiceScroll", true, false) as ScrollContainer
	_choice_row    = ui.find_child("ChoiceRow",    true, false) as HBoxContainer

	var title_lbl    := ui.find_child("TitleLabel",    true, false) as Label
	var subtitle_lbl := ui.find_child("SubtitleLabel", true, false) as Label

	if _relic_mode:
		_fill_relic_reward(ui, title_lbl, subtitle_lbl)
	elif _potion_mode:
		_fill_potion_reward(ui, title_lbl, subtitle_lbl)
	else:
		_fill_card_reward(title_lbl, subtitle_lbl)


func _fill_card_reward(title_lbl: Label, subtitle_lbl: Label) -> void:
	if title_lbl != null:
		title_lbl.text = "选择一张卡牌奖励+" if not _upgrade_mode else "选择一张卡牌升级"
	if subtitle_lbl != null:
		subtitle_lbl.text = "加入牌组，增强你的冒险。" if not _upgrade_mode else "强化你的牌组！"

	_render_choices()

	## 按钮行
	var button_row_node := find_child("ButtonRow", true, false) as HBoxContainer
	if button_row_node == null:
		return

	## 动态清空模板按钮，重新填充
	for c in button_row_node.get_children():
		c.queue_free()

	if not _upgradeable_cards.is_empty() and not _upgrade_mode:
		var upgrade_btn := SF.make_pink_button("升级卡牌 (%d张可选)" % _upgradeable_cards.size(), Vector2(200, 44))
		upgrade_btn.pressed.connect(_on_upgrade_mode_pressed)
		button_row_node.add_child(upgrade_btn)

	if _upgrade_mode:
		var card_btn := SF.make_action_button("选择卡牌奖励", Vector2(160, 44))
		card_btn.pressed.connect(_on_card_mode_pressed)
		button_row_node.add_child(card_btn)

	_confirm_button = Button.new()
	_confirm_button.text = "确认升级" if _upgrade_mode else "确认选择"
	_confirm_button.custom_minimum_size = Vector2(160, 44)
	_confirm_button.disabled = true
	_confirm_button.pressed.connect(_on_confirm_upgrade_pressed if _upgrade_mode else _on_confirm_choice_pressed)
	button_row_node.add_child(_confirm_button)

	var skip_btn := SF.make_action_button("跳过", Vector2(160, 44))
	skip_btn.pressed.connect(_on_skip_pressed)
	button_row_node.add_child(skip_btn)


func _fill_relic_reward(ui: Control, title_lbl: Label, subtitle_lbl: Label) -> void:
	if title_lbl != null:
		title_lbl.text = "精英战斗奖励"
		title_lbl.add_theme_color_override("font_color", SF.CLR_GOLD)
	if subtitle_lbl != null: subtitle_lbl.text = ""

	if _status_label != null:
		_status_label.text = "获得遗物"

	## 用 choice_row 显示遗物面板
	if _choice_row != null:
		var panel := PanelContainer.new()
		panel.custom_minimum_size = Vector2(320, 0)
		panel.add_theme_stylebox_override("panel", SF.make_card_panel_style())
		_choice_row.add_child(panel)

		var vbox := VBoxContainer.new()
		vbox.add_theme_constant_override("separation", 10)
		panel.add_child(vbox)

		var name_lbl := Label.new()
		name_lbl.text = str(_pending_relic.get("name", "未知遗物"))
		name_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		name_lbl.add_theme_font_size_override("font_size", 24)
		name_lbl.add_theme_color_override("font_color", SF.CLR_GOLD)
		vbox.add_child(name_lbl)

		var rarity_lbl := Label.new()
		rarity_lbl.text = _rarity_label(str(_pending_relic.get("rarity", "common")))
		rarity_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		rarity_lbl.add_theme_font_size_override("font_size", 14)
		rarity_lbl.add_theme_color_override("font_color", _rarity_color(str(_pending_relic.get("rarity", "common"))))
		vbox.add_child(rarity_lbl)

		var desc_lbl := Label.new()
		desc_lbl.text = str(_pending_relic.get("description", ""))
		desc_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		desc_lbl.add_theme_font_size_override("font_size", 16)
		desc_lbl.add_theme_color_override("font_color", SF.CLR_TEXT_WARM)
		desc_lbl.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		vbox.add_child(desc_lbl)

	## 确认按钮
	var btn_row := ui.find_child("ButtonRow", true, false) as HBoxContainer
	if btn_row != null:
		for c in btn_row.get_children(): c.queue_free()
		var confirm_btn := SF.make_pink_button("获得遗物，继续", Vector2(220, 48))
		confirm_btn.pressed.connect(_on_relic_confirmed)
		btn_row.add_child(confirm_btn)


func _fill_potion_reward(ui: Control, title_lbl: Label, subtitle_lbl: Label) -> void:
	if title_lbl != null:
		title_lbl.text = "获得药水"
		title_lbl.add_theme_color_override("font_color", Color(0.60, 0.96, 0.72))
	if subtitle_lbl != null: subtitle_lbl.text = ""

	var game_state: Variant = _autoload("GameState")
	var is_full: bool = game_state != null and not game_state.can_add_potion()

	if _status_label != null:
		_status_label.text = "药水栏已满，请选择丢弃哪瓶" if is_full else "加入药水栏"

	var potion_name := str(_pending_potion.get("name", "未知药水"))
	if _choice_row != null:
		var panel := PanelContainer.new()
		panel.custom_minimum_size = Vector2(280, 0)
		panel.add_theme_stylebox_override("panel", SF.make_card_panel_style())
		_choice_row.add_child(panel)
		var vbox := VBoxContainer.new()
		vbox.add_theme_constant_override("separation", 8)
		panel.add_child(vbox)
		var name_lbl := Label.new(); name_lbl.text = potion_name
		name_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		name_lbl.add_theme_font_size_override("font_size", 22)
		name_lbl.add_theme_color_override("font_color", Color(0.7, 1.0, 0.8))
		vbox.add_child(name_lbl)
		var desc_lbl := Label.new(); desc_lbl.text = str(_pending_potion.get("description", ""))
		desc_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		desc_lbl.add_theme_font_size_override("font_size", 16)
		desc_lbl.add_theme_color_override("font_color", SF.CLR_TEXT_WARM)
		desc_lbl.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		vbox.add_child(desc_lbl)

	var btn_row := ui.find_child("ButtonRow", true, false) as HBoxContainer
	if btn_row == null: return
	for c in btn_row.get_children(): c.queue_free()

	if is_full and game_state != null:
		var data_loader: Variant = _autoload("DataLoader")
		for slot in range(game_state.MAX_POTION_SLOTS):
			var entry: Dictionary = game_state.get_potion_at(slot)
			if entry.is_empty(): continue
			var old_potion: Dictionary = data_loader.get_potion(str(entry.get("id", "")))
			var discard_btn := SF.make_action_button(
				"丢弃 %s\n换取 %s" % [str(old_potion.get("name", "?")), potion_name], Vector2(160, 56))
			discard_btn.pressed.connect(_on_potion_slot_discard.bind(slot))
			btn_row.add_child(discard_btn)
		var abandon_btn := SF.make_action_button("放弃新药水", Vector2(130, 48))
		abandon_btn.pressed.connect(_on_potion_abandon)
		btn_row.add_child(abandon_btn)
	else:
		var take_btn := SF.make_pink_button("收取药水", Vector2(160, 48))
		take_btn.pressed.connect(_on_potion_take)
		btn_row.add_child(take_btn)
		var skip_btn := SF.make_action_button("放弃", Vector2(110, 48))
		skip_btn.pressed.connect(_on_potion_abandon)
		btn_row.add_child(skip_btn)


func handle_action(action_name: String, _source: Node) -> void:
	match action_name:
		"reward.on_skip":    _on_skip_pressed()
		"reward.on_confirm": pass  ## 由代码按钮处理


func _render_choices() -> void:
	if _choice_row == null:
		return
	_clear_children(_choice_row)
	if _upgrade_mode:
		for index in range(_upgradeable_cards.size()):
			var card_instance := _upgradeable_cards[index] as Dictionary
			var data_loader: Variant = _autoload("DataLoader")
			var card_data: Dictionary = data_loader.resolve_card_instance(card_instance)
			var button: Button = CardViewFactoryScript.create_card_button(card_data, Vector2(180, 250), index == _selected_upgrade_index)
			button.pressed.connect(_on_upgrade_pressed.bind(index))
			_choice_row.add_child(button)
	else:
		for index in range(_choices.size()):
			var card := _choices[index] as Dictionary
			var button: Button = CardViewFactoryScript.create_card_button(card, Vector2(180, 250), index == _selected_choice_index)
			button.pressed.connect(_on_choice_pressed.bind(index))
			_choice_row.add_child(button)


func _on_relic_confirmed() -> void:
	var game_state: Variant = _autoload("GameState")
	game_state.add_relic(str(_pending_relic.get("id", "")))
	var audio_manager: Variant = _autoload("AudioManager")
	if audio_manager != null: audio_manager.play_sfx("relic")
	_relic_mode = false; _pending_relic = {}
	if game_state.has_pending_potion_reward():
		_pending_potion = game_state.consume_pending_potion_reward()
		_potion_mode = true
	_rebuild()


func _on_potion_take() -> void:
	var game_state: Variant = _autoload("GameState")
	if game_state != null: game_state.add_potion(str(_pending_potion.get("id", "")))
	_finish_potion_mode()

func _on_potion_slot_discard(slot: int) -> void:
	var game_state: Variant = _autoload("GameState")
	if game_state != null:
		game_state.remove_potion_at(slot)
		game_state.add_potion(str(_pending_potion.get("id", "")))
	_finish_potion_mode()

func _on_potion_abandon() -> void: _finish_potion_mode()

func _finish_potion_mode() -> void:
	_potion_mode = false; _pending_potion = {}
	_rebuild()


func _on_choice_pressed(index: int) -> void:
	if index < 0 or index >= _choices.size(): return
	var card := _choices[index] as Dictionary
	_selected_choice_index = index
	if _status_label != null: _status_label.text = "已选择 %s，点击确认加入牌组。" % str(card.get("name", ""))
	if _confirm_button != null: _confirm_button.disabled = false
	_render_choices()


func _on_upgrade_pressed(index: int) -> void:
	if index < 0 or index >= _upgradeable_cards.size(): return
	var card_instance := _upgradeable_cards[index] as Dictionary
	var data_loader: Variant = _autoload("DataLoader")
	var card_data: Dictionary = data_loader.resolve_card_instance(card_instance)
	_selected_upgrade_index = index
	if _status_label != null: _status_label.text = "升级 %s" % str(card_data.get("name", ""))
	if _confirm_button != null: _confirm_button.disabled = false

	if _compare_panel != null and is_instance_valid(_compare_panel): _compare_panel.queue_free()
	_compare_panel = CardViewFactoryScript.create_upgrade_compare(card_data, Vector2(120, 168))
	var parent: Node = _choice_scroll.get_parent() if _choice_scroll != null else null
	if parent != null:
		parent.add_child(_compare_panel)
		parent.move_child(_compare_panel, _choice_scroll.get_index() + 1 if _choice_scroll != null else parent.get_child_count() - 1)
	_render_choices()


func _on_confirm_choice_pressed() -> void:
	if _selected_choice_index < 0 or _selected_choice_index >= _choices.size(): return
	var card := _choices[_selected_choice_index] as Dictionary
	var run_controller: Variant = _autoload("RunController")
	run_controller.complete_reward(str(card.get("id", "")))


func _on_confirm_upgrade_pressed() -> void:
	if _selected_upgrade_index < 0 or _selected_upgrade_index >= _upgradeable_cards.size(): return
	var card_instance := _upgradeable_cards[_selected_upgrade_index] as Dictionary
	var data_loader: Variant = _autoload("DataLoader")
	var card_data: Dictionary = data_loader.resolve_card_instance(card_instance)
	if UpgradeServiceScript.upgrade_card_instance(card_instance, data_loader):
		if _status_label != null: _status_label.text = "%s 已升级！" % str(card_data.get("name", ""))
		var run_controller: Variant = _autoload("RunController")
		run_controller.call_deferred("complete_reward")
	else:
		if _status_label != null: _status_label.text = "升级失败"


func _on_upgrade_mode_pressed() -> void:
	_upgrade_mode = true; _selected_choice_index = -1; _selected_upgrade_index = -1
	_rebuild()

func _on_card_mode_pressed() -> void:
	_upgrade_mode = false; _selected_choice_index = -1; _selected_upgrade_index = -1
	_rebuild()

func _on_skip_pressed() -> void:
	var run_controller: Variant = _autoload("RunController")
	run_controller.complete_reward()


func _rarity_label(rarity: String) -> String:
	match rarity:
		"uncommon": return "★★ 非常见"
		"rare":     return "★★★ 稀有"
		_:          return "★ 普通"

func _rarity_color(rarity: String) -> Color:
	match rarity:
		"uncommon": return Color(0.4, 0.8, 1.0)
		"rare":     return Color(1.0, 0.6, 0.2)
		_:          return Color(0.85, 0.85, 0.85)


func _clear_children(node: Node) -> void:
	for child in node.get_children(): child.queue_free()

func _rebuild() -> void:
	for child in get_children(): child.queue_free()
	_compare_panel = null
	_build()

func _autoload(autoload_name: String) -> Variant:
	return get_node_or_null("/root/%s" % autoload_name)
