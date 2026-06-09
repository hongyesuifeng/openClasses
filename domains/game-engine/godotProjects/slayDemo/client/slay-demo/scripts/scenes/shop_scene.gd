extends Control

const UIThemeScript := preload("res://scripts/ui/ui_theme.gd")
const CardViewFactoryScript := preload("res://scripts/ui/card_view_factory.gd")
const ShopServiceScript := preload("res://scripts/shop/shop_service.gd")
const UILayoutStoreScript := preload("res://scripts/ui/ui_layout_store.gd")

## ── 新 UI 色板 ─────────────────────────────
const CLR_PINK        := Color(0.95, 0.55, 0.65)
const CLR_PINK_LIGHT  := Color(1.0, 0.71, 0.76)
const CLR_GOLD        := Color(1.0, 0.84, 0.0)
const CLR_PANEL_BG    := Color(0.12, 0.08, 0.18, 0.85)
const CLR_BORDER      := Color(0.55, 0.35, 0.70, 0.90)
const CLR_TEXT_WARM   := Color(0.98, 0.92, 0.82)

const CLR_TINT        := Color(0.04, 0.02, 0.06, 0.35)

const MERCHANT_PORTRAIT := "res://assets/shop/merchant_portrait.png"

var _status_label: Label
var _gold_label: Label

var _content_row: HBoxContainer
var _offers: Array = []
var _relic_offer: Dictionary = {}
var _potion_offer: Dictionary = {}
var _remove_mode := false


func _ready() -> void:
	var audio_manager: Variant = _autoload("AudioManager")
	if audio_manager != null:
		audio_manager.play_bgm("shop")
	_refresh_offers()
	_build()


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

	# ── 右上角资源：金币 + 水晶 ──
	_build_resource_bar()

	# ── 主体区域：左侧内容 + 右侧商人立绘 ──
	var main_row := HBoxContainer.new()
	main_row.set_anchors_preset(Control.PRESET_FULL_RECT)
	main_row.offset_left = 32
	main_row.offset_top = 60
	main_row.offset_right = -32
	main_row.offset_bottom = -28
	main_row.add_theme_constant_override("separation", 24)
	add_child(main_row)

	# 左侧内容区
	var left_panel := VBoxContainer.new()
	left_panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	left_panel.alignment = BoxContainer.ALIGNMENT_CENTER
	left_panel.add_theme_constant_override("separation", 18)
	main_row.add_child(left_panel)

	# ── 标题："流浪商人"（粉色渐变风） ──
	var title := Label.new()
	title.text = "流浪商人"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 38)
	title.add_theme_color_override("font_color", CLR_PINK_LIGHT)
	title.add_theme_color_override("font_shadow_color", Color(0.5, 0.2, 0.35, 0.8))
	title.add_theme_constant_override("shadow_offset_x", 2)
	title.add_theme_constant_override("shadow_offset_y", 2)
	UIThemeScript.apply_cn(title)
	left_panel.add_child(title)
	UILayoutStoreScript.apply_layout(title, "shop.title")

	# ── 副标题 ──
	var subtitle := Label.new()
	subtitle.text = "一个神秘的商人在路边摆摊，他看起来很会讨价还价。"
	subtitle.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	subtitle.add_theme_font_size_override("font_size", 16)
	subtitle.add_theme_color_override("font_color", Color(0.88, 0.80, 0.92))
	subtitle.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	left_panel.add_child(subtitle)

	_status_label = Label.new()
	_status_label.text = "购买卡牌，或移除一张牌。"
	_status_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_status_label.add_theme_font_size_override("font_size", 16)
	_status_label.add_theme_color_override("font_color", Color(0.92, 0.84, 0.72))
	left_panel.add_child(_status_label)
	UILayoutStoreScript.apply_layout(_status_label, "shop.status")

	_content_row = HBoxContainer.new()
	_content_row.alignment = BoxContainer.ALIGNMENT_CENTER
	_content_row.add_theme_constant_override("separation", 16)
	left_panel.add_child(_content_row)
	UILayoutStoreScript.apply_layout(_content_row, "shop.content_row")

	if _remove_mode:
		_render_remove_choices()
	else:
		_render_shop_choices()

	var button_row := HBoxContainer.new()
	button_row.alignment = BoxContainer.ALIGNMENT_CENTER
	button_row.add_theme_constant_override("separation", 14)
	left_panel.add_child(button_row)

	var remove_button := _make_pink_button("删牌 %d 金" % _remove_price(), Vector2(160, 44))
	remove_button.pressed.connect(_on_remove_mode_pressed)
	button_row.add_child(remove_button)

	var leave_button := _make_action_card_button("离开", Vector2(160, 44))
	leave_button.pressed.connect(_on_leave_pressed)
	button_row.add_child(leave_button)

	# ── 右侧：商人立绘区域（占位） ──
	var portrait_box := VBoxContainer.new()
	portrait_box.alignment = BoxContainer.ALIGNMENT_CENTER
	portrait_box.custom_minimum_size = Vector2(180, 0)
	main_row.add_child(portrait_box)

	var portrait_bg := PanelContainer.new()
	portrait_bg.custom_minimum_size = Vector2(160, 280)
	portrait_bg.add_theme_stylebox_override("panel", _card_panel_style())
	portrait_box.add_child(portrait_bg)

	var portrait_inner := VBoxContainer.new()
	portrait_inner.alignment = BoxContainer.ALIGNMENT_CENTER
	portrait_inner.add_theme_constant_override("separation", 8)
	portrait_bg.add_child(portrait_inner)

	var portrait := TextureRect.new()
	portrait.texture = load(MERCHANT_PORTRAIT)
	portrait.custom_minimum_size = Vector2(100, 100)
	portrait.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	portrait_inner.add_child(portrait)

	var merchant_name := Label.new()
	merchant_name.text = "流浪商人"
	merchant_name.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	merchant_name.add_theme_font_size_override("font_size", 16)
	merchant_name.add_theme_color_override("font_color", CLR_PINK_LIGHT)
	portrait_inner.add_child(merchant_name)


## 右上角资源条：金币
func _build_resource_bar() -> void:
	var box := HBoxContainer.new()
	box.set_anchors_preset(Control.PRESET_TOP_RIGHT)
	box.offset_left = -160
	box.offset_top = 14
	box.offset_right = -24
	box.offset_bottom = 50
	box.alignment = BoxContainer.ALIGNMENT_END
	box.add_theme_constant_override("separation", 14)
	add_child(box)

	# 金币
	var gold_icon := TextureRect.new()
	gold_icon.texture = load("res://assets/ui/icons/icon_shop.png")
	gold_icon.custom_minimum_size = Vector2(24, 24)
	gold_icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	gold_icon.mouse_filter = Control.MOUSE_FILTER_IGNORE
	box.add_child(gold_icon)

	_gold_label = Label.new()
	_gold_label.text = _gold_text()
	_gold_label.add_theme_font_size_override("font_size", 18)
	_gold_label.add_theme_color_override("font_color", CLR_GOLD)
	_gold_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	box.add_child(_gold_label)


func _render_shop_choices() -> void:
	for index in range(_offers.size()):
		var offer := _offers[index] as Dictionary
		var card := offer.get("card", {}) as Dictionary
		var price := int(offer.get("price", 0))

		# 卡片式容器（浅紫矩形 + 金色边框）
		var card_panel := PanelContainer.new()
		card_panel.custom_minimum_size = Vector2(200, 320)
		card_panel.add_theme_stylebox_override("panel", _card_panel_style())
		_content_row.add_child(card_panel)

		var inner := VBoxContainer.new()
		inner.alignment = BoxContainer.ALIGNMENT_CENTER
		inner.add_theme_constant_override("separation", 8)
		card_panel.add_child(inner)

		var card_button: Button = CardViewFactoryScript.create_card_button(card, Vector2(160, 220), false, not _can_afford(price))
		card_button.pressed.connect(_on_buy_pressed.bind(index))
		inner.add_child(card_button)

		var buy_btn := _make_pink_button("%d 金" % price, Vector2(140, 38))
		buy_btn.disabled = not _can_afford(price)
		buy_btn.pressed.connect(_on_buy_pressed.bind(index))
		inner.add_child(buy_btn)

	# 遗物商品
	if not _relic_offer.is_empty() and not bool(_relic_offer.get("sold", false)):
		_render_relic_offer()

	# 药水商品
	if not _potion_offer.is_empty() and not bool(_potion_offer.get("sold", false)):
		_render_potion_offer()


func _render_remove_choices() -> void:
	var data_loader: Variant = _autoload("DataLoader")
	var game_state: Variant = _autoload("GameState")
	for index in range(game_state.master_deck.size()):
		var card_instance := game_state.master_deck[index] as Dictionary
		var card: Dictionary = data_loader.resolve_card_instance(card_instance)
		var button: Button = CardViewFactoryScript.create_card_button(card, Vector2(144, 200), false, not _can_afford(_remove_price()))
		button.pressed.connect(_on_remove_card_pressed.bind(int(card_instance.get("instance_id", 0))))
		_content_row.add_child(button)

	var back_button := _make_action_card_button("返回", Vector2(140, 44))
	back_button.pressed.connect(_on_back_pressed)
	_content_row.add_child(back_button)


func _render_relic_offer() -> void:
	var relic := _relic_offer.get("relic", {}) as Dictionary
	var price := int(_relic_offer.get("price", 0))

	var card_panel := PanelContainer.new()
	card_panel.custom_minimum_size = Vector2(200, 280)
	card_panel.add_theme_stylebox_override("panel", _card_panel_style())
	_content_row.add_child(card_panel)

	var inner := VBoxContainer.new()
	inner.alignment = BoxContainer.ALIGNMENT_CENTER
	inner.add_theme_constant_override("separation", 6)
	card_panel.add_child(inner)

	var tag := Label.new()
	tag.text = "遗物"
	tag.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	tag.add_theme_font_size_override("font_size", 12)
	tag.add_theme_color_override("font_color", CLR_GOLD)
	inner.add_child(tag)

	var name_label := Label.new()
	name_label.text = str(relic.get("name", ""))
	name_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	name_label.add_theme_font_size_override("font_size", 18)
	name_label.add_theme_color_override("font_color", Color(0.98, 0.9, 0.5))
	inner.add_child(name_label)

	var desc_label := Label.new()
	desc_label.text = str(relic.get("description", ""))
	desc_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	desc_label.add_theme_font_size_override("font_size", 13)
	desc_label.add_theme_color_override("font_color", Color(0.88, 0.80, 0.68))
	desc_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	desc_label.custom_minimum_size = Vector2(160, 0)
	inner.add_child(desc_label)

	var buy_btn := _make_pink_button("%d 金" % price, Vector2(140, 38))
	buy_btn.disabled = not _can_afford(price)
	buy_btn.pressed.connect(_on_buy_relic_pressed)
	inner.add_child(buy_btn)


func _on_buy_relic_pressed() -> void:
	var relic := _relic_offer.get("relic", {}) as Dictionary
	var price := int(_relic_offer.get("price", 0))
	var game_state: Variant = _autoload("GameState")
	if ShopServiceScript.buy_relic(game_state, str(relic.get("id", "")), price):
		_status_label.text = "获得遗物：%s" % str(relic.get("name", ""))
		_relic_offer["sold"] = true
		_rebuild()
	else:
		_status_label.text = "金币不足。"


func _render_potion_offer() -> void:
	var potion := _potion_offer.get("potion", {}) as Dictionary
	var price := int(_potion_offer.get("price", 0))
	var game_state: Variant = _autoload("GameState")
	var slots_full: bool = game_state != null and not game_state.can_add_potion()

	var card_panel := PanelContainer.new()
	card_panel.custom_minimum_size = Vector2(200, 280)
	card_panel.add_theme_stylebox_override("panel", _card_panel_style())
	_content_row.add_child(card_panel)

	var inner := VBoxContainer.new()
	inner.alignment = BoxContainer.ALIGNMENT_CENTER
	inner.add_theme_constant_override("separation", 6)
	card_panel.add_child(inner)

	var tag := Label.new()
	tag.text = "药水"
	tag.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	tag.add_theme_font_size_override("font_size", 12)
	tag.add_theme_color_override("font_color", Color(0.60, 0.96, 0.72))
	inner.add_child(tag)

	var name_label := Label.new()
	name_label.text = str(potion.get("name", ""))
	name_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	name_label.add_theme_font_size_override("font_size", 18)
	name_label.add_theme_color_override("font_color", Color(0.7, 1.0, 0.8))
	inner.add_child(name_label)

	var desc_label := Label.new()
	desc_label.text = str(potion.get("description", ""))
	desc_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	desc_label.add_theme_font_size_override("font_size", 13)
	desc_label.add_theme_color_override("font_color", Color(0.88, 0.80, 0.68))
	desc_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	desc_label.custom_minimum_size = Vector2(160, 0)
	inner.add_child(desc_label)

	var buy_btn := _make_pink_button("%d 金" % price, Vector2(140, 38))
	buy_btn.disabled = not _can_afford(price) or slots_full
	if slots_full:
		buy_btn.tooltip_text = "药水栏已满"
	buy_btn.pressed.connect(_on_buy_potion_pressed)
	inner.add_child(buy_btn)


func _on_buy_potion_pressed() -> void:
	var potion := _potion_offer.get("potion", {}) as Dictionary
	var price := int(_potion_offer.get("price", 0))
	var game_state: Variant = _autoload("GameState")
	if ShopServiceScript.buy_potion(game_state, str(potion.get("id", "")), price):
		_status_label.text = "获得药水：%s" % str(potion.get("name", ""))
		_potion_offer["sold"] = true
		_rebuild()
	else:
		_status_label.text = "金币不足或药水栏已满。"


func _on_buy_pressed(index: int) -> void:
	if index < 0 or index >= _offers.size():
		return
	var offer := _offers[index] as Dictionary
	var card := offer.get("card", {}) as Dictionary
	var game_state: Variant = _autoload("GameState")
	if ShopServiceScript.buy_card(game_state, str(card.get("id", "")), int(offer.get("price", 0))):
		_status_label.text = "购买 %s" % str(card.get("name", ""))
		var audio_manager: Variant = _autoload("AudioManager")
		if audio_manager != null:
			audio_manager.play_sfx("buy")
		_offers.remove_at(index)
		_rebuild()
	else:
		_status_label.text = "金币不足。"


func _on_remove_mode_pressed() -> void:
	_remove_mode = true
	_rebuild()


func _on_back_pressed() -> void:
	_remove_mode = false
	_rebuild()


func _on_remove_card_pressed(instance_id: int) -> void:
	var game_state: Variant = _autoload("GameState")
	var data_loader: Variant = _autoload("DataLoader")
	var card_name := "这张牌"
	for card_instance in game_state.master_deck:
		if int((card_instance as Dictionary).get("instance_id", -1)) == instance_id:
			var card_data: Dictionary = data_loader.resolve_card_instance(card_instance as Dictionary)
			card_name = str(card_data.get("name", card_name))
			break

	_show_remove_confirm(instance_id, card_name)


func _show_remove_confirm(instance_id: int, card_name: String) -> void:
	var overlay := ColorRect.new()
	overlay.color = Color(0, 0, 0, 0.62)
	overlay.set_anchors_preset(Control.PRESET_FULL_RECT)
	overlay.z_index = 100
	add_child(overlay)

	var panel := PanelContainer.new()
	panel.custom_minimum_size = Vector2(320, 0)
	panel.set_anchors_preset(Control.PRESET_CENTER)
	panel.z_index = 101
	panel.add_theme_stylebox_override("panel", _card_panel_style())
	add_child(panel)

	var vbox := VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 14)
	panel.add_child(vbox)

	var title := Label.new()
	title.text = "确认移除"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 20)
	title.add_theme_color_override("font_color", CLR_PINK_LIGHT)
	vbox.add_child(title)

	var msg := Label.new()
	msg.text = "花费 %d 金币移除【%s】？\n移除后无法撤销。" % [_remove_price(), card_name]
	msg.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	msg.add_theme_font_size_override("font_size", 16)
	msg.add_theme_color_override("font_color", CLR_TEXT_WARM)
	msg.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	vbox.add_child(msg)

	var btn_row := HBoxContainer.new()
	btn_row.alignment = BoxContainer.ALIGNMENT_CENTER
	btn_row.add_theme_constant_override("separation", 12)
	vbox.add_child(btn_row)

	var confirm_btn := _make_pink_button("确认移除", Vector2(130, 44))
	confirm_btn.pressed.connect(func() -> void:
		overlay.queue_free()
		panel.queue_free()
		var game_state2: Variant = _autoload("GameState")
		if ShopServiceScript.remove_card(game_state2, instance_id, _remove_price()):
			_status_label.text = "已移除 %s。" % card_name
			var audio_manager: Variant = _autoload("AudioManager")
			if audio_manager != null:
				audio_manager.play_sfx("buy")
			_remove_mode = false
			_rebuild()
		else:
			_status_label.text = "无法移除卡牌。"
	)
	btn_row.add_child(confirm_btn)

	var cancel_btn := _make_action_card_button("取消", Vector2(110, 44))
	cancel_btn.pressed.connect(func() -> void:
		overlay.queue_free()
		panel.queue_free()
	)
	btn_row.add_child(cancel_btn)


func _on_leave_pressed() -> void:
	var run_controller: Variant = _autoload("RunController")
	run_controller.call_deferred("complete_shop")


func _refresh_offers() -> void:
	var data_loader: Variant = _autoload("DataLoader")
	var game_state: Variant = _autoload("GameState")
	var floor_index := 0
	if game_state != null:
		var node: Dictionary = game_state.get_current_node()
		floor_index = int(node.get("floor", 0))
	_offers = ShopServiceScript.generate_card_offers(game_state.master_deck, data_loader, ShopServiceScript.CARD_SLOTS, floor_index)
	_relic_offer = ShopServiceScript.generate_relic_offer(game_state.owned_relic_ids, data_loader, floor_index)
	_potion_offer = ShopServiceScript.generate_potion_offer(data_loader, floor_index)


func _remove_price() -> int:
	var game_state: Variant = _autoload("GameState")
	var removal_count := 0
	if game_state != null:
		removal_count = int(game_state.card_removal_count)
	return ShopServiceScript.remove_card_price(removal_count)


func _can_afford(price: int) -> bool:
	var game_state: Variant = _autoload("GameState")
	return game_state != null and int(game_state.player_gold) >= price


func _gold_text() -> String:
	var game_state: Variant = _autoload("GameState")
	return "金币 %d" % int(game_state.player_gold) if game_state != null else "金币 0"


# ──────────────────────────────────────────────
## 粉色金边按钮
# ──────────────────────────────────────────────
func _make_pink_button(text: String, min_size: Vector2) -> Button:
	var btn := Button.new()
	btn.text = text
	btn.custom_minimum_size = min_size
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
	style_disabled.border_color = Color(0.5, 0.45, 0.55, 0.5)
	btn.add_theme_stylebox_override("disabled", style_disabled)
	return btn


## 灰色操作按钮（离开/返回等）
func _make_action_card_button(text: String, min_size: Vector2) -> Button:
	var btn := Button.new()
	btn.text = text
	btn.custom_minimum_size = min_size
	var style_normal := StyleBoxFlat.new()
	style_normal.bg_color = Color(0.25, 0.20, 0.32, 0.85)
	style_normal.border_color = Color(0.45, 0.38, 0.55, 0.8)
	style_normal.set_border_width_all(1)
	style_normal.set_corner_radius_all(14)
	style_normal.content_margin_left = 12
	style_normal.content_margin_top = 6
	style_normal.content_margin_right = 12
	style_normal.content_margin_bottom = 6
	btn.add_theme_stylebox_override("normal", style_normal)
	btn.add_theme_color_override("font_color", Color(0.88, 0.82, 0.92))
	btn.add_theme_font_size_override("font_size", 16)
	var style_hover := style_normal.duplicate()
	style_hover.bg_color = Color(0.35, 0.28, 0.42, 0.92)
	btn.add_theme_stylebox_override("hover", style_hover)
	return btn


## 商品卡片面板样式（浅紫 + 金边）
func _card_panel_style() -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.14, 0.10, 0.22, 0.88)
	style.border_color = Color(0.85, 0.70, 0.30, 0.85)
	style.set_border_width_all(2)
	style.set_corner_radius_all(12)
	style.content_margin_left = 10
	style.content_margin_top = 8
	style.content_margin_right = 10
	style.content_margin_bottom = 8
	return style


func _rebuild() -> void:
	for child in get_children():
		child.queue_free()
	_build()


func _autoload(autoload_name: String) -> Variant:
	return get_node_or_null("/root/%s" % autoload_name)
