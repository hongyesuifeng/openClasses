extends Control

const RewardServiceScript := preload("res://scripts/reward/reward_service.gd")
const CardViewFactoryScript := preload("res://scripts/ui/card_view_factory.gd")

var _choices: Array = []
var _choice_row: HBoxContainer
var _status_label: Label


func _ready() -> void:
	var game_state: Variant = _autoload("GameState")
	var run_controller: Variant = _autoload("RunController")
	_choices = RewardServiceScript.generate_card_choices(run_controller.get_current_reward_profile_id(), game_state.master_deck)
	_build()


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
	title.text = "选择一张卡牌奖励"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 30)
	title.add_theme_color_override("font_color", Color(0.98, 0.9, 0.72))
	root.add_child(title)

	_status_label = Label.new()
	_status_label.text = "加入牌组，继续下一场战斗。"
	_status_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_status_label.add_theme_font_size_override("font_size", 16)
	_status_label.add_theme_color_override("font_color", Color(0.92, 0.84, 0.72))
	root.add_child(_status_label)

	_choice_row = HBoxContainer.new()
	_choice_row.alignment = BoxContainer.ALIGNMENT_CENTER
	_choice_row.add_theme_constant_override("separation", 18)
	root.add_child(_choice_row)

	for index in range(_choices.size()):
		var card := _choices[index] as Dictionary
		var button: Button = CardViewFactoryScript.create_card_button(card, Vector2(190, 246))
		button.pressed.connect(_on_choice_pressed.bind(index))
		_choice_row.add_child(button)

	var skip_button := Button.new()
	skip_button.text = "跳过"
	skip_button.custom_minimum_size = Vector2(160, 44)
	skip_button.pressed.connect(_on_skip_pressed)
	root.add_child(skip_button)


func _on_choice_pressed(index: int) -> void:
	if index < 0 or index >= _choices.size():
		return
	var card := _choices[index] as Dictionary
	_status_label.text = "获得 %s" % str(card.get("name", ""))
	var run_controller: Variant = _autoload("RunController")
	run_controller.complete_reward(str(card.get("id", "")))


func _on_skip_pressed() -> void:
	var run_controller: Variant = _autoload("RunController")
	run_controller.complete_reward()


func _autoload(name: String) -> Variant:
	return get_node_or_null("/root/%s" % name)
