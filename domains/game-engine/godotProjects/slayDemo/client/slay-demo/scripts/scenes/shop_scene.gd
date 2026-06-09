extends Control

const _UIBuilder := preload("res://addons/ui_builder/ui_builder.gd")
const CardViewFactoryScript := preload("res://scripts/ui/card_view_factory.gd")
const ShopServiceScript     := preload("res://scripts/shop/shop_service.gd")

const SPEC_PATH := "res://ui_specs/shop.ui.json"

const CLR_PINK       := Color(0.95, 0.55, 0.65)
const CLR_PINK_LIGHT := Color(1.0, 0.71, 0.76)
const CLR_GOLD       := Color(1.0, 0.84, 0.0)
const CLR_TEXT_WARM  := Color(0.98, 0.92, 0.82)

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
	var ui := _UIBuilder.build(SPEC_PATH)
	ui.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(ui)

	_status_label = ui.find_child("StatusLabel", true, false) as Label
	_content_row  = ui.find_child("ContentRow",  true, false) as HBoxContainer

	## 右上角资源条（动态金币）
	var resource_bar := ui.find_child("ResourceBar", true, false) as HBoxContainer
	if resource_bar != null:
		var gold_icon := TextureRect.new()
		gold_icon.texture = load("res://assets/ui/icons/icon_shop.png")
		gold_icon.custom_minimum_size = Vector2(24, 24)
		gold_icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		gold_icon.mouse_filter = Control.MOUSE_FILTER_IGNORE
		resource_bar.add_child(gold_icon)

		_gold_label = Label.new()
		_gold_label.text = _gold_text()
		_gold_label.add_theme_font_size_override("font_size", 18)
		_gold_label.add_theme_color_override("font_color", CLR_GOLD)
		_gold_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
		resource_bar.add_child(_gold_label)

	## 删牌按钮更新文字
	var remove_btn := ui.find_child("RemoveButton", true, false) as Button
	if remove_btn != null:
		remove_btn.text = "删牌 %d 金" % _remove_price()

	if _remove_mode:
		_render_remove_choices()
	else:
		_render_shop_choices()


func handle_action(action_name: String, _source: Node) -> void:
	match action_name:
		"shop.on_remove_mode": _on_remove_mode_pressed()
		"shop.on_leave":       _on_leave_pressed()


func _render_shop_choices() -> void:
	if _content_row == null:
		return
	for index in range(_offers.size()):
		var offer := _offers[index] as Dictionary
		var card  := offer.get("card", {}) as Dictionary
		var price := int(offer.get("price", 0))

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

	if not _relic_offer.is_empty() and not bool(_relic_offer.get("sold", false)):
		_render_relic_offer()
	if not _potion_offer.is_empty() and not bool(_potion_offer.get("sold", false)):
		_render_potion_offer()


func _render_remove_choices() -> void:
	if _content_row == null:
		return
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

	var tag := Label.new(); tag.text = "遗物"
	tag.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	tag.add_theme_font_size_override("font_size", 12)
	tag.add_theme_color_override("font_color", CLR_GOLD)
	inner.add_child(tag)

	var name_label := Label.new(); name_label.text = str(relic.get("name", ""))
	name_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	name_label.add_theme_font_size_override("font_size", 18)
	name_label.add_theme_color_override("font_color", Color(0.98, 0.9, 0.5))
	inner.add_child(name_label)

	var desc_label := Label.new(); desc_label.text = str(relic.get("description", ""))
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


func _render_potion_offer() -> void:
	var potion := _potion_offer.get("potion", {}) as Dictionary
	var price  := int(_potion_offer.get("price", 0))
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

	var tag := Label.new(); tag.text = "药水"
	tag.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	tag.add_theme_font_size_override("font_size", 12)
	tag.add_theme_color_override("font_color", Color(0.60, 0.96, 0.72))
	inner.add_child(tag)

	var name_label := Label.new(); name_label.text = str(potion.get("name", ""))
	name_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	name_label.add_theme_font_size_override("font_size", 18)
	name_label.add_theme_color_override("font_color", Color(0.7, 1.0, 0.8))
	inner.add_child(name_label)

	var desc_label := Label.new(); desc_label.text = str(potion.get("description", ""))
	desc_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	desc_label.add_theme_font_size_override("font_size", 13)
	desc_label.add_theme_color_override("font_color", Color(0.88, 0.80, 0.68))
	desc_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	desc_label.custom_minimum_size = Vector2(160, 0)
	inner.add_child(desc_label)

	var buy_btn := _make_pink_button("%d 金" % price, Vector2(140, 38))
	buy_btn.disabled = not _can_afford(price) or slots_full
	if slots_full: buy_btn.tooltip_text = "药水栏已满"
	buy_btn.pressed.connect(_on_buy_potion_pressed)
	inner.add_child(buy_btn)


func _on_buy_relic_pressed() -> void:
	var relic := _relic_offer.get("relic", {}) as Dictionary
	var price := int(_relic_offer.get("price", 0))
	var game_state: Variant = _autoload("GameState")
	if ShopServiceScript.buy_relic(game_state, str(relic.get("id", "")), price):
		if _status_label != null: _status_label.text = "获得遗物：%s" % str(relic.get("name", ""))
		_relic_offer["sold"] = true
		_rebuild()
	else:
		if _status_label != null: _status_label.text = "金币不足。"


func _on_buy_potion_pressed() -> void:
	var potion := _potion_offer.get("potion", {}) as Dictionary
	var price  := int(_potion_offer.get("price", 0))
	var game_state: Variant = _autoload("GameState")
	if ShopServiceScript.buy_potion(game_state, str(potion.get("id", "")), price):
		if _status_label != null: _status_label.text = "获得药水：%s" % str(potion.get("name", ""))
		_potion_offer["sold"] = true
		_rebuild()
	else:
		if _status_label != null: _status_label.text = "金币不足或药水栏已满。"


func _on_buy_pressed(index: int) -> void:
	if index < 0 or index >= _offers.size():
		return
	var offer := _offers[index] as Dictionary
	var card  := offer.get("card", {}) as Dictionary
	var game_state: Variant = _autoload("GameState")
	if ShopServiceScript.buy_card(game_state, str(card.get("id", "")), int(offer.get("price", 0))):
		if _status_label != null: _status_label.text = "购买 %s" % str(card.get("name", ""))
		var audio_manager: Variant = _autoload("AudioManager")
		if audio_manager != null: audio_manager.play_sfx("buy")
		_offers.remove_at(index)
		_rebuild()
	else:
		if _status_label != null: _status_label.text = "金币不足。"


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

	var title := Label.new(); title.text = "确认移除"
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
		var gs: Variant = _autoload("GameState")
		if ShopServiceScript.remove_card(gs, instance_id, _remove_price()):
			if _status_label != null: _status_label.text = "已移除 %s。" % card_name
			var am: Variant = _autoload("AudioManager")
			if am != null: am.play_sfx("buy")
			_remove_mode = false
			_rebuild()
		else:
			if _status_label != null: _status_label.text = "无法移除卡牌。"
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
	_offers       = ShopServiceScript.generate_card_offers(game_state.master_deck, data_loader, ShopServiceScript.CARD_SLOTS, floor_index)
	_relic_offer  = ShopServiceScript.generate_relic_offer(game_state.owned_relic_ids, data_loader, floor_index)
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


func _make_pink_button(text: String, min_size: Vector2) -> Button:
	var btn := Button.new()
	btn.text = text
	btn.custom_minimum_size = min_size
	var s := StyleBoxFlat.new()
	s.bg_color = CLR_PINK; s.border_color = CLR_GOLD
	s.set_border_width_all(2); s.set_corner_radius_all(14)
	btn.add_theme_stylebox_override("normal", s)
	btn.add_theme_color_override("font_color", Color(1, 1, 1))
	btn.add_theme_color_override("font_hover_color", CLR_GOLD)
	btn.add_theme_font_size_override("font_size", 16)
	return btn


func _make_action_card_button(text: String, min_size: Vector2) -> Button:
	var btn := Button.new()
	btn.text = text
	btn.custom_minimum_size = min_size
	var s := StyleBoxFlat.new()
	s.bg_color = Color(0.25, 0.20, 0.32, 0.85)
	s.border_color = Color(0.45, 0.38, 0.55, 0.8)
	s.set_border_width_all(1); s.set_corner_radius_all(14)
	btn.add_theme_stylebox_override("normal", s)
	btn.add_theme_color_override("font_color", Color(0.88, 0.82, 0.92))
	btn.add_theme_font_size_override("font_size", 16)
	return btn


func _card_panel_style() -> StyleBoxFlat:
	var s := StyleBoxFlat.new()
	s.bg_color = Color(0.14, 0.10, 0.22, 0.88)
	s.border_color = Color(0.85, 0.70, 0.30, 0.85)
	s.set_border_width_all(2); s.set_corner_radius_all(12)
	s.content_margin_left = 10; s.content_margin_top = 8
	s.content_margin_right = 10; s.content_margin_bottom = 8
	return s


func _rebuild() -> void:
	for child in get_children():
		child.queue_free()
	_build()


func _autoload(autoload_name: String) -> Variant:
	return get_node_or_null("/root/%s" % autoload_name)
