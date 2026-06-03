extends Control

const CardViewFactoryScript := preload("res://scripts/ui/card_view_factory.gd")
const ShopServiceScript := preload("res://scripts/shop/shop_service.gd")

var _status_label: Label
var _gold_label: Label
var _content_row: HBoxContainer
var _offers: Array = []
var _relic_offer: Dictionary = {}
var _potion_offer: Dictionary = {}
var _remove_mode := false


func _ready() -> void:
	_refresh_offers()
	_build()


func _build() -> void:
	var background := TextureRect.new()
	background.texture = load("res://assets/backgrounds/bg_map.png")
	background.set_anchors_preset(Control.PRESET_FULL_RECT)
	background.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	add_child(background)

	var tint := ColorRect.new()
	tint.color = Color(0.045, 0.035, 0.03, 0.6)
	tint.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(tint)

	var root := VBoxContainer.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.offset_left = 32
	root.offset_top = 28
	root.offset_right = -32
	root.offset_bottom = -28
	root.alignment = BoxContainer.ALIGNMENT_CENTER
	root.add_theme_constant_override("separation", 18)
	add_child(root)

	var title := Label.new()
	title.text = "商店"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 34)
	title.add_theme_color_override("font_color", Color(0.98, 0.9, 0.72))
	root.add_child(title)

	_gold_label = Label.new()
	_gold_label.text = _gold_text()
	_gold_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_gold_label.add_theme_font_size_override("font_size", 18)
	_gold_label.add_theme_color_override("font_color", Color(0.94, 0.84, 0.54))
	root.add_child(_gold_label)

	_status_label = Label.new()
	_status_label.text = "购买卡牌，或移除一张牌。"
	_status_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_status_label.add_theme_font_size_override("font_size", 16)
	_status_label.add_theme_color_override("font_color", Color(0.92, 0.84, 0.72))
	root.add_child(_status_label)

	_content_row = HBoxContainer.new()
	_content_row.alignment = BoxContainer.ALIGNMENT_CENTER
	_content_row.add_theme_constant_override("separation", 16)
	root.add_child(_content_row)

	if _remove_mode:
		_render_remove_choices()
	else:
		_render_shop_choices()

	var button_row := HBoxContainer.new()
	button_row.alignment = BoxContainer.ALIGNMENT_CENTER
	button_row.add_theme_constant_override("separation", 14)
	root.add_child(button_row)

	var remove_button := Button.new()
	remove_button.text = "删牌 %d 金" % _remove_price()
	remove_button.custom_minimum_size = Vector2(160, 44)
	remove_button.pressed.connect(_on_remove_mode_pressed)
	button_row.add_child(remove_button)

	var leave_button := Button.new()
	leave_button.text = "离开"
	leave_button.custom_minimum_size = Vector2(160, 44)
	leave_button.pressed.connect(_on_leave_pressed)
	button_row.add_child(leave_button)


func _render_shop_choices() -> void:
	for index in range(_offers.size()):
		var offer := _offers[index] as Dictionary
		var card := offer.get("card", {}) as Dictionary
		var price := int(offer.get("price", 0))
		var box := VBoxContainer.new()
		box.alignment = BoxContainer.ALIGNMENT_CENTER
		box.add_theme_constant_override("separation", 8)
		_content_row.add_child(box)

		var card_button: Button = CardViewFactoryScript.create_card_button(card, Vector2(180, 250), false, not _can_afford(price))
		card_button.pressed.connect(_on_buy_pressed.bind(index))
		box.add_child(card_button)

		var price_label := Label.new()
		price_label.text = "%d 金" % price
		price_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		price_label.add_theme_font_size_override("font_size", 16)
		price_label.add_theme_color_override("font_color", Color(0.94, 0.84, 0.54))
		box.add_child(price_label)

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

	var back_button := Button.new()
	back_button.text = "返回"
	back_button.custom_minimum_size = Vector2(140, 44)
	back_button.pressed.connect(_on_back_pressed)
	_content_row.add_child(back_button)


func _render_relic_offer() -> void:
	var relic := _relic_offer.get("relic", {}) as Dictionary
	var price := int(_relic_offer.get("price", 0))

	var box := VBoxContainer.new()
	box.alignment = BoxContainer.ALIGNMENT_CENTER
	box.add_theme_constant_override("separation", 8)
	_content_row.add_child(box)

	var panel := PanelContainer.new()
	panel.custom_minimum_size = Vector2(180, 180)
	box.add_child(panel)

	var inner := VBoxContainer.new()
	inner.alignment = BoxContainer.ALIGNMENT_CENTER
	inner.add_theme_constant_override("separation", 6)
	panel.add_child(inner)

	var tag := Label.new()
	tag.text = "遗物"
	tag.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	tag.add_theme_font_size_override("font_size", 12)
	tag.add_theme_color_override("font_color", Color(0.94, 0.84, 0.54))
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

	var buy_btn := Button.new()
	buy_btn.text = "%d 金" % price
	buy_btn.custom_minimum_size = Vector2(160, 38)
	buy_btn.disabled = not _can_afford(price)
	buy_btn.pressed.connect(_on_buy_relic_pressed)
	box.add_child(buy_btn)


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

	var box := VBoxContainer.new()
	box.alignment = BoxContainer.ALIGNMENT_CENTER
	box.add_theme_constant_override("separation", 8)
	_content_row.add_child(box)

	var panel := PanelContainer.new()
	panel.custom_minimum_size = Vector2(180, 180)
	box.add_child(panel)

	var inner := VBoxContainer.new()
	inner.alignment = BoxContainer.ALIGNMENT_CENTER
	inner.add_theme_constant_override("separation", 6)
	panel.add_child(inner)

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

	var buy_btn := Button.new()
	buy_btn.text = "%d 金" % price
	buy_btn.custom_minimum_size = Vector2(160, 38)
	buy_btn.disabled = not _can_afford(price) or slots_full
	if slots_full:
		buy_btn.tooltip_text = "药水栏已满"
	buy_btn.pressed.connect(_on_buy_potion_pressed)
	box.add_child(buy_btn)


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
	if ShopServiceScript.remove_card(game_state, instance_id, _remove_price()):
		_status_label.text = "已移除卡牌。"
		_remove_mode = false
		_rebuild()
	else:
		_status_label.text = "无法移除卡牌。"


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


func _rebuild() -> void:
	for child in get_children():
		child.queue_free()
	_build()


func _autoload(autoload_name: String) -> Variant:
	return get_node_or_null("/root/%s" % autoload_name)
