extends Control

const UIThemeScript := preload("res://scripts/ui/ui_theme.gd")
const UILayoutStoreScript := preload("res://scripts/ui/ui_layout_store.gd")

const RewardServiceScript := preload("res://scripts/reward/reward_service.gd")
const CardViewFactoryScript := preload("res://scripts/ui/card_view_factory.gd")
const UpgradeServiceScript := preload("res://scripts/battle/upgrade_service.gd")
const PotionViewFactoryScript := preload("res://scripts/ui/potion_view_factory.gd")

## ── 新 UI 色板 ─────────────────────────────
const CLR_PINK        := Color(0.95, 0.55, 0.65)
const CLR_PINK_LIGHT  := Color(1.0, 0.71, 0.76)
const CLR_GOLD        := Color(1.0, 0.84, 0.0)
const CLR_TEXT_WARM   := Color(0.98, 0.92, 0.82)
const CLR_SUBTITLE    := Color(0.88, 0.80, 0.92)
const CLR_TINT        := Color(0.04, 0.02, 0.06, 0.35)
const CLR_PANEL_BG    := Color(0.14, 0.10, 0.22, 0.88)

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
var _compare_panel: Control = null  ## 升级对比面板
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
	var background := TextureRect.new()
	background.texture = load("res://assets/backgrounds/bg_map.png")
	background.set_anchors_preset(Control.PRESET_FULL_RECT)
	background.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	background.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	add_child(background)

	var tint := ColorRect.new()
	tint.color = CLR_TINT
	tint.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(tint)

	## 用 ScrollContainer 包裹根容器，升级对比面板出现时可滚动而不超框
	var scroll := ScrollContainer.new()
	scroll.set_anchors_preset(Control.PRESET_FULL_RECT)
	scroll.offset_left = 0; scroll.offset_top = 0
	scroll.offset_right = 0; scroll.offset_bottom = 0
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	scroll.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_AUTO
	add_child(scroll)

	var root := VBoxContainer.new()
	root.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	root.offset_left = 32
	root.offset_top = 28
	root.offset_right = -32
	root.offset_bottom = -28
	root.alignment = BoxContainer.ALIGNMENT_CENTER
	root.add_theme_constant_override("separation", 20)
	scroll.add_child(root)

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
	title.add_theme_color_override("font_color", CLR_GOLD)
	title.add_theme_color_override("font_shadow_color", Color(0.4, 0.3, 0.1, 0.8))
	title.add_theme_constant_override("shadow_offset_x", 2)
	title.add_theme_constant_override("shadow_offset_y", 2)
	UIThemeScript.apply_cn(title)
	root.add_child(title)
	UILayoutStoreScript.apply_layout(title, "reward.title")

	_status_label = Label.new()
	_status_label.text = "获得遗物"
	_status_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_status_label.add_theme_font_size_override("font_size", 16)
	_status_label.add_theme_color_override("font_color", CLR_TEXT_WARM)
	root.add_child(_status_label)

	var panel := PanelContainer.new()
	panel.custom_minimum_size = Vector2(320, 0)
	panel.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	panel.add_theme_stylebox_override("panel", _card_panel_style())
	root.add_child(panel)

	var panel_vbox := VBoxContainer.new()
	panel_vbox.add_theme_constant_override("separation", 10)
	panel.add_child(panel_vbox)

	var relic_name_label := Label.new()
	relic_name_label.text = str(_pending_relic.get("name", "未知遗物"))
	relic_name_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	relic_name_label.add_theme_font_size_override("font_size", 24)
	relic_name_label.add_theme_color_override("font_color", CLR_GOLD)
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
	desc_label.add_theme_color_override("font_color", CLR_TEXT_WARM)
	desc_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	panel_vbox.add_child(desc_label)

	var confirm_button := _make_pink_button("获得遗物，继续", Vector2(220, 48))
	confirm_button.pressed.connect(_on_relic_confirmed)
	root.add_child(confirm_button)


func _build_card_reward(root: VBoxContainer) -> void:
	# ── 标题（新UI："选择一张卡牌奖励+"） ──
	var title := Label.new()
	title.text = "选择一张卡牌奖励+" if not _upgrade_mode else "选择一张卡牌升级"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 32)
	title.add_theme_color_override("font_color", CLR_PINK_LIGHT)
	title.add_theme_color_override("font_shadow_color", Color(0.5, 0.2, 0.35, 0.8))
	title.add_theme_constant_override("shadow_offset_x", 2)
	title.add_theme_constant_override("shadow_offset_y", 2)
	root.add_child(title)

	# ── 副标题 ──
	var subtitle := Label.new()
	subtitle.text = "加入牌组，增强你的冒险。" if not _upgrade_mode else "强化你的牌组！"
	subtitle.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	subtitle.add_theme_font_size_override("font_size", 16)
	subtitle.add_theme_color_override("font_color", CLR_SUBTITLE)
	root.add_child(subtitle)

	_status_label = Label.new()
	_status_label.text = ""
	_status_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_status_label.add_theme_font_size_override("font_size", 16)
	_status_label.add_theme_color_override("font_color", CLR_TEXT_WARM)
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
		var upgrade_button := _make_pink_button("升级卡牌 (%d张可选)" % _upgradeable_cards.size(), Vector2(200, 44))
		upgrade_button.pressed.connect(_on_upgrade_mode_pressed)
		button_row.add_child(upgrade_button)

	if _upgrade_mode:
		var card_button := _make_action_button("选择卡牌奖励", Vector2(160, 44))
		card_button.pressed.connect(_on_card_mode_pressed)
		button_row.add_child(card_button)

	_confirm_button = Button.new()
	_confirm_button.text = "确认升级" if _upgrade_mode else "确认选择"
	_confirm_button.custom_minimum_size = Vector2(160, 44)
	_confirm_button.disabled = true
	_apply_pink_button_style(_confirm_button)
	if _upgrade_mode:
		_confirm_button.pressed.connect(_on_confirm_upgrade_pressed)
	else:
		_confirm_button.pressed.connect(_on_confirm_choice_pressed)
	button_row.add_child(_confirm_button)

	# ── 跳过按钮（粉色圆角） ──
	var skip_button := _make_action_button("跳过", Vector2(160, 44))
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
	_status_label.add_theme_color_override("font_color", CLR_TEXT_WARM)
	root.add_child(_status_label)

	var potion_name := str(_pending_potion.get("name", "未知药水"))
	var panel := PanelContainer.new()
	panel.custom_minimum_size = Vector2(280, 0)
	panel.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	panel.add_theme_stylebox_override("panel", _card_panel_style())
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
	desc_label.add_theme_color_override("font_color", CLR_TEXT_WARM)
	desc_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	panel_vbox.add_child(desc_label)

	var button_row := HBoxContainer.new()
	button_row.alignment = BoxContainer.ALIGNMENT_CENTER
	button_row.add_theme_constant_override("separation", 14)
	root.add_child(button_row)

	if is_full and game_state != null:
		var data_loader: Variant = _autoload("DataLoader")
		for slot in range(game_state.MAX_POTION_SLOTS):
			var entry: Dictionary = game_state.get_potion_at(slot)
			if entry.is_empty():
				continue
			var old_potion: Dictionary = data_loader.get_potion(str(entry.get("id", "")))
			var discard_btn := _make_action_button("丢弃 %s\n换取 %s" % [
				str(old_potion.get("name", "?")), potion_name], Vector2(160, 56))
			discard_btn.pressed.connect(_on_potion_slot_discard.bind(slot))
			button_row.add_child(discard_btn)

		var abandon_btn := _make_action_button("放弃新药水", Vector2(130, 48))
		abandon_btn.pressed.connect(_on_potion_abandon)
		button_row.add_child(abandon_btn)
	else:
		var take_btn := _make_pink_button("收取药水", Vector2(160, 48))
		take_btn.pressed.connect(_on_potion_take)
		button_row.add_child(take_btn)

		var skip_btn := _make_action_button("放弃", Vector2(110, 48))
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
	_status_label.text = "升级 %s" % old_name
	if _confirm_button != null:
		_confirm_button.disabled = false

	## 显示升级前后对比面板
	if _compare_panel != null and is_instance_valid(_compare_panel):
		_compare_panel.queue_free()
	_compare_panel = CardViewFactoryScript.create_upgrade_compare(card_data, Vector2(120, 168))
	var parent: Node = _choice_scroll.get_parent() if _choice_scroll != null else null
	if parent != null:
		parent.add_child(_compare_panel)
		parent.move_child(_compare_panel, _choice_scroll.get_index() + 1 if _choice_scroll != null else parent.get_child_count() - 1)

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


# ──────────────────────────────────────────────
## 粉色金边按钮
# ──────────────────────────────────────────────
func _make_pink_button(text: String, min_size: Vector2) -> Button:
	var btn := Button.new()
	btn.text = text
	btn.custom_minimum_size = min_size
	_apply_pink_button_style(btn)
	return btn


func _apply_pink_button_style(btn: Button) -> void:
	var style_normal := StyleBoxFlat.new()
	style_normal.bg_color = CLR_PINK
	style_normal.border_color = CLR_GOLD
	style_normal.set_border_width_all(2)
	style_normal.set_corner_radius_all(14)
	style_normal.content_margin_left = 12
	style_normal.content_margin_top = 6
	style_normal.content_margin_right = 12
	style_normal.content_margin_bottom = 6
	btn.add_theme_stylebox_override("normal", style_normal)
	btn.add_theme_color_override("font_color", Color(1.0, 1.0, 1.0))
	btn.add_theme_color_override("font_hover_color", CLR_GOLD)
	btn.add_theme_font_size_override("font_size", 16)
	var style_hover := style_normal.duplicate()
	style_hover.bg_color = Color(1.0, 0.65, 0.72)
	btn.add_theme_stylebox_override("hover", style_hover)
	var style_disabled := style_normal.duplicate()
	style_disabled.bg_color = Color(0.4, 0.35, 0.42, 0.7)
	btn.add_theme_stylebox_override("disabled", style_disabled)


## 灰色操作按钮
func _make_action_button(text: String, min_size: Vector2) -> Button:
	var btn := Button.new()
	btn.text = text
	btn.custom_minimum_size = min_size
	var tex := ResourceLoader.load("res://assets/ui/buttons/ui_btn_purple_normal.png", "Texture2D") as Texture2D
	if tex:
		var sn := StyleBoxTexture.new(); sn.texture = tex
		sn.content_margin_left = 12; sn.content_margin_right = 12
		sn.content_margin_top = 6; sn.content_margin_bottom = 6
		btn.add_theme_stylebox_override("normal", sn)
		var sh := StyleBoxTexture.new(); sh.texture = tex; sh.modulate_color = Color(0.88, 0.82, 1.0)
		btn.add_theme_stylebox_override("hover", sh)
	btn.add_theme_color_override("font_color", Color(0.88, 0.82, 0.92))
	btn.add_theme_font_size_override("font_size", 16)
	return btn


## 商品卡片面板样式
func _card_panel_style() -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = CLR_PANEL_BG
	style.border_color = Color(0.85, 0.70, 0.30, 0.85)
	style.set_border_width_all(2)
	style.set_corner_radius_all(12)
	style.content_margin_left = 10
	style.content_margin_top = 8
	style.content_margin_right = 10
	style.content_margin_bottom = 8
	return style


func _clear_children(node: Node) -> void:
	for child in node.get_children():
		child.queue_free()


func _autoload(autoload_name: String) -> Variant:
	return get_node_or_null("/root/%s" % autoload_name)
