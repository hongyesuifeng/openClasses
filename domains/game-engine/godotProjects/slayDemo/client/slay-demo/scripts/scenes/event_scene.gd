extends Control

const EventServiceScript := preload("res://scripts/event/event_service.gd")
const CardViewFactoryScript := preload("res://scripts/ui/card_view_factory.gd")

var _status_label: Label
var _content_container: VBoxContainer
var _choice_row: HBoxContainer
var _card_selection_scroll: ScrollContainer
var _card_selection_row: HBoxContainer
var _back_button: Button

var _resolved := false
var _in_card_selection := false
var _current_selection_type := ""
var _current_selection_filter := ""
var _pending_effects: Array = []
var _transform_card_id := ""
var _selectable_cards: Array = []
var _event_messages: Array[String] = []


func _ready() -> void:
	var audio_manager: Variant = _autoload("AudioManager")
	if audio_manager != null:
		audio_manager.play_bgm("map")
	_build()


func _build() -> void:
	var background := TextureRect.new()
	background.texture = load("res://assets/backgrounds/bg_map.png")
	background.set_anchors_preset(Control.PRESET_FULL_RECT)
	background.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	add_child(background)

	var tint := ColorRect.new()
	tint.color = Color(0.035, 0.030, 0.045, 0.64)
	tint.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(tint)

	_content_container = VBoxContainer.new()
	_content_container.set_anchors_preset(Control.PRESET_FULL_RECT)
	_content_container.offset_left = 36
	_content_container.offset_top = 34
	_content_container.offset_right = -36
	_content_container.offset_bottom = -34
	_content_container.alignment = BoxContainer.ALIGNMENT_CENTER
	_content_container.add_theme_constant_override("separation", 18)
	add_child(_content_container)

	_render_event()


func _render_event() -> void:
	## 清空内容
	for child in _content_container.get_children():
		child.queue_free()

	var node := _current_event_node()

	## 标题
	var title := Label.new()
	title.text = str(node.get("title", "事件"))
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 32)
	title.add_theme_color_override("font_color", Color(0.96, 0.86, 0.68))
	_content_container.add_child(title)

	## 状态/描述
	_status_label = Label.new()
	if _event_messages.is_empty():
		_status_label.text = str(node.get("description", "你遇到了一个事件。"))
	else:
		_status_label.text = "\n".join(_event_messages)
	_status_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_status_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_status_label.add_theme_font_size_override("font_size", 17)
	_status_label.add_theme_color_override("font_color", Color(0.92, 0.84, 0.72))
	_content_container.add_child(_status_label)

	if _in_card_selection:
		_render_card_selection()
	else:
		_render_choices(node.get("choices", []))


func _render_choices(choices: Array) -> void:
	_choice_row = HBoxContainer.new()
	_choice_row.alignment = BoxContainer.ALIGNMENT_CENTER
	_choice_row.add_theme_constant_override("separation", 16)
	_content_container.add_child(_choice_row)

	for index in range(choices.size()):
		var choice := choices[index] as Dictionary
		var button := Button.new()
		button.text = "%s\n%s" % [str(choice.get("label", "选择")), str(choice.get("description", ""))]
		button.custom_minimum_size = Vector2(250, 84)
		button.pressed.connect(_on_choice_pressed.bind(index))
		_choice_row.add_child(button)


func _render_card_selection() -> void:
	## 提示文本
	var hint_text := ""
	match _current_selection_type:
		"remove":
			hint_text = "选择一张卡牌移除"
		"upgrade":
			hint_text = "选择一张卡牌升级"
		"transform":
			hint_text = "选择一张卡牌进行变换"

	var hint_label := Label.new()
	hint_label.text = hint_text
	hint_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	hint_label.add_theme_font_size_override("font_size", 20)
	hint_label.add_theme_color_override("font_color", Color(0.96, 0.86, 0.68))
	_content_container.add_child(hint_label)

	## 卡牌选择区域
	_card_selection_scroll = ScrollContainer.new()
	_card_selection_scroll.custom_minimum_size = Vector2(0, 286)
	_card_selection_scroll.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_card_selection_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_SHOW_ALWAYS
	_card_selection_scroll.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	_card_selection_scroll.follow_focus = true
	_content_container.add_child(_card_selection_scroll)

	_card_selection_row = HBoxContainer.new()
	_card_selection_row.add_theme_constant_override("separation", 18)
	_card_selection_scroll.add_child(_card_selection_row)

	## 渲染可选卡牌
	var data_loader: Variant = _autoload("DataLoader")
	for card_instance in _selectable_cards:
		var instance := card_instance as Dictionary
		var card_data: Dictionary = data_loader.resolve_card_instance(instance)
		var button: Button = CardViewFactoryScript.create_card_button(card_data, Vector2(180, 250))
		button.pressed.connect(_on_card_selected.bind(int(instance.get("instance_id", 0))))
		_card_selection_row.add_child(button)

	## 返回按钮
	_back_button = Button.new()
	_back_button.text = "取消"
	_back_button.custom_minimum_size = Vector2(140, 44)
	_back_button.pressed.connect(_on_cancel_selection)
	_content_container.add_child(_back_button)


func _on_choice_pressed(index: int) -> void:
	if _resolved:
		return

	var node := _current_event_node()
	var choices: Array = node.get("choices", [])
	if index < 0 or index >= choices.size():
		return

	## 禁用所有按钮
	for child in _choice_row.get_children():
		if child is Button:
			(child as Button).disabled = true

	var data_loader: Variant = _autoload("DataLoader")
	var game_state: Variant = _autoload("GameState")
	var choice := choices[index] as Dictionary

	## 使用新的解析方法
	var result: Variant = EventServiceScript.resolve_choice(choice, game_state, data_loader)

	## 保存消息
	_event_messages = result.messages

	## 检查是否需要选牌
	if result.needs_card_selection:
		_in_card_selection = true
		_current_selection_type = result.selection_type
		_current_selection_filter = result.selection_filter
		_pending_effects = result.pending_effects
		_transform_card_id = result.transform_card_id
		_selectable_cards = EventServiceScript.get_selectable_cards(
			game_state, data_loader,
			result.selection_type, result.selection_filter
		)

		if _selectable_cards.is_empty():
			## 没有可选卡牌，直接完成
			_event_messages.append("没有可选的卡牌")
			_complete_event()
		else:
			## 进入选牌模式
			_rebuild()
	else:
		## 没有选牌需求，直接完成
		_complete_event()


func _on_card_selected(instance_id: int) -> void:
	var data_loader: Variant = _autoload("DataLoader")
	var game_state: Variant = _autoload("GameState")

	var message := EventServiceScript.apply_card_selection(
		_current_selection_type,
		instance_id,
		game_state,
		data_loader,
		_pending_effects,
		_transform_card_id
	)

	_event_messages.append(message)
	_complete_event()


func _on_cancel_selection() -> void:
	## 取消选牌，返回事件选择
	_in_card_selection = false
	_current_selection_type = ""
	_current_selection_filter = ""
	_pending_effects.clear()
	_transform_card_id = ""
	_selectable_cards.clear()
	_event_messages.append("你放弃了选择")
	_rebuild()


func _complete_event() -> void:
	_resolved = true
	_in_card_selection = false

	## 更新状态显示
	if _status_label:
		_status_label.text = "\n".join(_event_messages)

	## 禁用所有按钮
	if _choice_row:
		for child in _choice_row.get_children():
			if child is Button:
				(child as Button).disabled = true
	if _card_selection_row:
		for child in _card_selection_row.get_children():
			if child is Button:
				(child as Button).disabled = true
	if _back_button:
		_back_button.disabled = true

	## 延迟返回地图
	var run_controller: Variant = _autoload("RunController")
	if run_controller != null:
		get_tree().create_timer(1.5).timeout.connect(Callable(run_controller, "complete_event"))


func _rebuild() -> void:
	for child in _content_container.get_children():
		child.queue_free()
	_render_event()


func _current_event_node() -> Dictionary:
	var game_state: Variant = _autoload("GameState")
	if game_state == null:
		return {}
	return game_state.get_current_node()


func _autoload(autoload_name: String) -> Variant:
	return get_node_or_null("/root/%s" % autoload_name)
