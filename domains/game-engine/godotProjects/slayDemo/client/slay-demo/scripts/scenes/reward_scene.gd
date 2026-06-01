extends Control

const RewardServiceScript := preload("res://scripts/reward/reward_service.gd")
const CardViewFactoryScript := preload("res://scripts/ui/card_view_factory.gd")
const UpgradeServiceScript := preload("res://scripts/battle/upgrade_service.gd")

var _choices: Array = []
var _choice_row: HBoxContainer
var _status_label: Label
var _upgrade_mode := false
var _upgradeable_cards: Array = []


func _ready() -> void:
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
	background.stretch_mode = TextureRect.STRETCH_SCALE
	add_child(background)

	var tint := ColorRect.new()
	tint.color = Color(0.055, 0.042, 0.032, 0.52)
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

	_choice_row = HBoxContainer.new()
	_choice_row.alignment = BoxContainer.ALIGNMENT_CENTER
	_choice_row.add_theme_constant_override("separation", 18)
	root.add_child(_choice_row)

	_render_choices()

	# 按钮区域
	var button_row := HBoxContainer.new()
	button_row.alignment = BoxContainer.ALIGNMENT_CENTER
	button_row.add_theme_constant_override("separation", 16)
	root.add_child(button_row)

	# 升级按钮（如果有可升级卡牌）
	if not _upgradeable_cards.is_empty() and not _upgrade_mode:
		var upgrade_button := Button.new()
		upgrade_button.text = "升级卡牌 (%d张可选)" % _upgradeable_cards.size()
		upgrade_button.custom_minimum_size = Vector2(180, 44)
		upgrade_button.pressed.connect(_on_upgrade_mode_pressed)
		button_row.add_child(upgrade_button)

	# 切换回卡牌奖励按钮
	if _upgrade_mode:
		var card_button := Button.new()
		card_button.text = "选择卡牌奖励"
		card_button.custom_minimum_size = Vector2(160, 44)
		card_button.pressed.connect(_on_card_mode_pressed)
		button_row.add_child(card_button)

	# 跳过按钮
	var skip_button := Button.new()
	skip_button.text = "跳过"
	skip_button.custom_minimum_size = Vector2(160, 44)
	skip_button.pressed.connect(_on_skip_pressed)
	button_row.add_child(skip_button)


func _render_choices() -> void:
	_clear_children(_choice_row)

	if _upgrade_mode:
		# 显示可升级卡牌
		for index in range(_upgradeable_cards.size()):
			var card_instance := _upgradeable_cards[index] as Dictionary
			var data_loader: Variant = _autoload("DataLoader")
			var card_data: Dictionary = data_loader.resolve_card_instance(card_instance)
			var button: Button = CardViewFactoryScript.create_card_button(card_data, Vector2(190, 246))
			button.pressed.connect(_on_upgrade_pressed.bind(index))
			_choice_row.add_child(button)
	else:
		# 显示卡牌奖励
		for index in range(_choices.size()):
			var card := _choices[index] as Dictionary
			var button: Button = CardViewFactoryScript.create_card_button(card, Vector2(190, 246))
			button.pressed.connect(_on_choice_pressed.bind(index))
			_choice_row.add_child(button)


func _on_choice_pressed(index: int) -> void:
	if index < 0 or index >= _choices.size():
		return
	var card := _choices[index] as Dictionary
	_status_label.text = "获得 %s" % str(card.get("name", ""))
	var run_controller: Variant = _autoload("RunController")
	run_controller.complete_reward(str(card.get("id", "")))


func _on_upgrade_pressed(index: int) -> void:
	if index < 0 or index >= _upgradeable_cards.size():
		return

	var card_instance := _upgradeable_cards[index] as Dictionary
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
	_clear_children(self)
	_build()


func _on_card_mode_pressed() -> void:
	_upgrade_mode = false
	_clear_children(self)
	_build()


func _on_skip_pressed() -> void:
	var run_controller: Variant = _autoload("RunController")
	run_controller.complete_reward()


func _clear_children(node: Node) -> void:
	for child in node.get_children():
		child.queue_free()


func _autoload(autoload_name: String) -> Variant:
	return get_node_or_null("/root/%s" % autoload_name)
