extends Control

const RewardServiceScript := preload("res://scripts/reward/reward_service.gd")
const CardViewFactoryScript := preload("res://scripts/ui/card_view_factory.gd")
const UpgradeServiceScript := preload("res://scripts/battle/upgrade_service.gd")
const PotionViewFactoryScript := preload("res://scripts/ui/potion_view_factory.gd")

var _choices: Array = []
var _choice_scroll: ScrollContainer
var _choice_row: HBoxContainer
var _status_label: Label
var _upgrade_mode := false
var _upgradeable_cards: Array = []
var _relic_mode := false
var _pending_relic: Dictionary = {}
var _potion_mode := false
var _pending_potion: Dictionary = {}
var _selected_choice_index := -1
var _selected_upgrade_index := -1
var _confirm_button: Button


func _ready() -> void:
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
	var background := TextureRect.new()
	background.texture = load("res://assets/backgrounds/bg_map.png")
	background.set_anchors_preset(Control.PRESET_FULL_RECT)
	background.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	add_child(background)

	var tint := ColorRect.new()
	tint.color = Color(0.025, 0.024, 0.025, 0.72)
	tint.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(tint)

	var root := VBoxContainer.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.offset_left = 32
	root.offset_top = 28
	root.offset_right = -32
	root.offset_bottom = -28
	root.alignment = BoxContainer.ALIGNMENT_CENTER
	root.add_theme_constant_override("separation", 20)
	add_child(root)

	if _relic_mode:
		_build_relic_reward(root)
	elif _potion_mode:
		_build_potion_reward(root)
	else:
		_build_card_reward(root)


func _build_relic_reward(root: VBoxContainer) -> void:
	var title := Label.new()
	title.text = "精英战斗奖励"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 30)
	title.add_theme_color_override("font_color", Color(0.98, 0.84, 0.4))
	root.add_child(title)

	_status_label = Label.new()
	_status_label.text = "获得遗物"
	_status_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_status_label.add_theme_font_size_override("font_size", 16)
	_status_label.add_theme_color_override("font_color", Color(0.92, 0.84, 0.72))
	root.add_child(_status_label)

	# 遗物展示面板
	var panel := PanelContainer.new()
	panel.custom_minimum_size = Vector2(320, 0)
	panel.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	root.add_child(panel)

	var panel_vbox := VBoxContainer.new()
	panel_vbox.add_theme_constant_override("separation", 10)
	panel.add_child(panel_vbox)

	var relic_name_label := Label.new()
	relic_name_label.text = str(_pending_relic.get("name", "未知遗物"))
	relic_name_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	relic_name_label.add_theme_font_size_override("font_size", 24)
	relic_name_label.add_theme_color_override("font_color", Color(0.98, 0.9, 0.5))
	panel_vbox.add_child(relic_name_label)

	var rarity_str := _rarity_label(str(_pending_relic.get("rarity", "common")))
	var rarity_label := Label.new()
	rarity_label.text = rarity_str
	rarity_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	rarity_label.add_theme_font_size_override("font_size", 14)
	rarity_label.add_theme_color_override("font_color", _rarity_color(str(_pending_relic.get("rarity", "common"))))
	panel_vbox.add_child(rarity_label)

	var desc_label := Label.new()
	desc_label.text = str(_pending_relic.get("description", ""))
	desc_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	desc_label.add_theme_font_size_override("font_size", 16)
	desc_label.add_theme_color_override("font_color", Color(0.92, 0.84, 0.72))
	desc_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	panel_vbox.add_child(desc_label)

	var confirm_button := Button.new()
	confirm_button.text = "获得遗物，继续"
	confirm_button.custom_minimum_size = Vector2(200, 48)
	confirm_button.pressed.connect(_on_relic_confirmed)
	root.add_child(confirm_button)


func _build_card_reward(root: VBoxContainer) -> void:
	var title := Label.new()
	title.text = "选择一张卡牌奖励" if not _upgrade_mode else "选择一张卡牌升级"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 30)
	title.add_theme_color_override("font_color", Color(0.98, 0.9, 0.72))
	root.add_child(title)

	_status_label = Label.new()
	_status_label.text = "加入牌组，继续下一场战斗。" if not _upgrade_mode else "强化你的牌组！"
	_status_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_status_label.add_theme_font_size_override("font_size", 16)
	_status_label.add_theme_color_override("font_color", Color(0.92, 0.84, 0.72))
	root.add_child(_status_label)

	_choice_scroll = ScrollContainer.new()
	_choice_scroll.custom_minimum_size = Vector2(0, 280)
	_choice_scroll.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_choice_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_SHOW_ALWAYS
	_choice_scroll.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	_choice_scroll.follow_focus = true
	root.add_child(_choice_scroll)

	_choice_row = HBoxContainer.new()
	_choice_row.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_choice_row.alignment = BoxContainer.ALIGNMENT_CENTER
	_choice_row.add_theme_constant_override("separation", 18)
	_choice_scroll.add_child(_choice_row)

	_render_choices()

	var button_row := HBoxContainer.new()
	button_row.alignment = BoxContainer.ALIGNMENT_CENTER
	button_row.add_theme_constant_override("separation", 16)
	root.add_child(button_row)

	if not _upgradeable_cards.is_empty() and not _upgrade_mode:
		var upgrade_button := Button.new()
		upgrade_button.text = "升级卡牌 (%d张可选)" % _upgradeable_cards.size()
		upgrade_button.custom_minimum_size = Vector2(180, 44)
		upgrade_button.pressed.connect(_on_upgrade_mode_pressed)
		button_row.add_child(upgrade_button)

	if _upgrade_mode:
		var card_button := Button.new()
		card_button.text = "选择卡牌奖励"
		card_button.custom_minimum_size = Vector2(160, 44)
		card_button.pressed.connect(_on_card_mode_pressed)
		button_row.add_child(card_button)

	_confirm_button = Button.new()
	_confirm_button.text = "确认升级" if _upgrade_mode else "确认选择"
	_confirm_button.custom_minimum_size = Vector2(160, 44)
	_confirm_button.disabled = true
	if _upgrade_mode:
		_confirm_button.pressed.connect(_on_confirm_upgrade_pressed)
	else:
		_confirm_button.pressed.connect(_on_confirm_choice_pressed)
	button_row.add_child(_confirm_button)

	var skip_button := Button.new()
	skip_button.text = "跳过"
	skip_button.custom_minimum_size = Vector2(160, 44)
	skip_button.pressed.connect(_on_skip_pressed)
	button_row.add_child(skip_button)


func _render_choices() -> void:
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
	if audio_manager != null:
		audio_manager.play_sfx("relic")
	_relic_mode = false
	_pending_relic = {}
	## 遗物确认后，检查是否还有待处理药水
	if game_state.has_pending_potion_reward():
		_pending_potion = game_state.consume_pending_potion_reward()
		_potion_mode = true
	_clear_children(self)
	_build()


func _build_potion_reward(root: VBoxContainer) -> void:
	var game_state: Variant = _autoload("GameState")
	var is_full: bool = game_state != null and not game_state.can_add_potion()

	var title := Label.new()
	title.text = "获得药水"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 30)
	title.add_theme_color_override("font_color", Color(0.60, 0.96, 0.72))
	root.add_child(title)

	_status_label = Label.new()
	_status_label.text = "药水栏已满，请选择丢弃哪瓶" if is_full else "加入药水栏"
	_status_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_status_label.add_theme_font_size_override("font_size", 16)
	_status_label.add_theme_color_override("font_color", Color(0.92, 0.84, 0.72))
	root.add_child(_status_label)

	## 新药水展示
	var potion_name := str(_pending_potion.get("name", "未知药水"))
	var panel := PanelContainer.new()
	panel.custom_minimum_size = Vector2(280, 0)
	panel.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	root.add_child(panel)
	var panel_vbox := VBoxContainer.new()
	panel_vbox.add_theme_constant_override("separation", 8)
	panel.add_child(panel_vbox)
	var name_label := Label.new()
	name_label.text = potion_name
	name_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	name_label.add_theme_font_size_override("font_size", 22)
	name_label.add_theme_color_override("font_color", Color(0.7, 1.0, 0.8))
	panel_vbox.add_child(name_label)
	var desc_label := Label.new()
	desc_label.text = str(_pending_potion.get("description", ""))
	desc_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	desc_label.add_theme_font_size_override("font_size", 16)
	desc_label.add_theme_color_override("font_color", Color(0.92, 0.84, 0.72))
	desc_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	panel_vbox.add_child(desc_label)

	var button_row := HBoxContainer.new()
	button_row.alignment = BoxContainer.ALIGNMENT_CENTER
	button_row.add_theme_constant_override("separation", 14)
	root.add_child(button_row)

	if is_full and game_state != null:
		## 槽满：展示每格旧药水，让玩家选择丢弃
		var data_loader: Variant = _autoload("DataLoader")
		for slot in range(game_state.MAX_POTION_SLOTS):
			var entry: Dictionary = game_state.get_potion_at(slot)
			if entry.is_empty():
				continue
			var old_potion: Dictionary = data_loader.get_potion(str(entry.get("id", "")))
			var discard_btn := Button.new()
			discard_btn.text = "丢弃 %s\n换取 %s" % [
				str(old_potion.get("name", "?")), potion_name]
			discard_btn.custom_minimum_size = Vector2(160, 56)
			discard_btn.pressed.connect(_on_potion_slot_discard.bind(slot))
			button_row.add_child(discard_btn)

		var abandon_btn := Button.new()
		abandon_btn.text = "放弃新药水"
		abandon_btn.custom_minimum_size = Vector2(130, 48)
		abandon_btn.pressed.connect(_on_potion_abandon)
		button_row.add_child(abandon_btn)
	else:
		var take_btn := Button.new()
		take_btn.text = "收取药水"
		take_btn.custom_minimum_size = Vector2(160, 48)
		take_btn.pressed.connect(_on_potion_take)
		button_row.add_child(take_btn)

		var skip_btn := Button.new()
		skip_btn.text = "放弃"
		skip_btn.custom_minimum_size = Vector2(110, 48)
		skip_btn.pressed.connect(_on_potion_abandon)
		button_row.add_child(skip_btn)


func _on_potion_take() -> void:
	var game_state: Variant = _autoload("GameState")
	if game_state != null:
		game_state.add_potion(str(_pending_potion.get("id", "")))
	_finish_potion_mode()


func _on_potion_slot_discard(slot: int) -> void:
	var game_state: Variant = _autoload("GameState")
	if game_state != null:
		game_state.remove_potion_at(slot)
		game_state.add_potion(str(_pending_potion.get("id", "")))
	_finish_potion_mode()


func _on_potion_abandon() -> void:
	_finish_potion_mode()


func _finish_potion_mode() -> void:
	_potion_mode = false
	_pending_potion = {}
	_clear_children(self)
	_build()


func _on_choice_pressed(index: int) -> void:
	if index < 0 or index >= _choices.size():
		return
	var card := _choices[index] as Dictionary
	_selected_choice_index = index
	_status_label.text = "已选择 %s，点击确认加入牌组。" % str(card.get("name", ""))
	if _confirm_button != null:
		_confirm_button.disabled = false
	_render_choices()


func _on_upgrade_pressed(index: int) -> void:
	if index < 0 or index >= _upgradeable_cards.size():
		return

	var card_instance := _upgradeable_cards[index] as Dictionary
	var data_loader: Variant = _autoload("DataLoader")
	var card_data: Dictionary = data_loader.resolve_card_instance(card_instance)
	var old_name := str(card_data.get("name", ""))

	_selected_upgrade_index = index
	_status_label.text = "已选择 %s，点击确认升级。" % old_name
	if _confirm_button != null:
		_confirm_button.disabled = false
	_render_choices()


func _on_confirm_choice_pressed() -> void:
	if _selected_choice_index < 0 or _selected_choice_index >= _choices.size():
		return
	var card := _choices[_selected_choice_index] as Dictionary
	var run_controller: Variant = _autoload("RunController")
	run_controller.complete_reward(str(card.get("id", "")))


func _on_confirm_upgrade_pressed() -> void:
	if _selected_upgrade_index < 0 or _selected_upgrade_index >= _upgradeable_cards.size():
		return

	var card_instance := _upgradeable_cards[_selected_upgrade_index] as Dictionary
	var data_loader: Variant = _autoload("DataLoader")
	var card_data: Dictionary = data_loader.resolve_card_instance(card_instance)
	var old_name := str(card_data.get("name", ""))
	if UpgradeServiceScript.upgrade_card_instance(card_instance, data_loader):
		_status_label.text = "%s 已升级！" % old_name
		var run_controller: Variant = _autoload("RunController")
		run_controller.call_deferred("complete_reward")
	else:
		_status_label.text = "升级失败"


func _on_upgrade_mode_pressed() -> void:
	_upgrade_mode = true
	_selected_choice_index = -1
	_selected_upgrade_index = -1
	_clear_children(self)
	_build()


func _on_card_mode_pressed() -> void:
	_upgrade_mode = false
	_selected_choice_index = -1
	_selected_upgrade_index = -1
	_clear_children(self)
	_build()


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
	for child in node.get_children():
		child.queue_free()


func _autoload(autoload_name: String) -> Variant:
	return get_node_or_null("/root/%s" % autoload_name)
