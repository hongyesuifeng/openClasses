extends Control

const RelicServiceScript := preload("res://scripts/relic/relic_service.gd")

var _opened := false
var _status_label: Label
var _open_button: Button


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
	tint.color = Color(0.04, 0.035, 0.025, 0.62)
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
	title.text = "宝箱"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 34)
	title.add_theme_color_override("font_color", Color(0.98, 0.88, 0.54))
	root.add_child(title)

	_status_label = Label.new()
	_status_label.text = "打开宝箱，获得金币和遗物。"
	_status_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_status_label.add_theme_font_size_override("font_size", 17)
	_status_label.add_theme_color_override("font_color", Color(0.92, 0.84, 0.72))
	root.add_child(_status_label)

	_open_button = Button.new()
	_open_button.text = "打开"
	_open_button.custom_minimum_size = Vector2(220, 56)
	_open_button.pressed.connect(_on_open_pressed)
	root.add_child(_open_button)


func _on_open_pressed() -> void:
	if _opened:
		return
	_opened = true
	if _open_button != null:
		_open_button.disabled = true

	var data_loader: Variant = _autoload("DataLoader")
	var game_state: Variant = _autoload("GameState")
	var node: Dictionary = game_state.get_current_node()
	var gold := int(node.get("gold", 35))
	game_state.add_gold(gold)

	var relic: Dictionary = RelicServiceScript.choose_relic_reward(game_state.owned_relic_ids, data_loader)
	var relic_name := ""
	var relic_description := ""
	if not relic.is_empty() and game_state.add_relic(str(relic.get("id", ""))):
		relic_name = str(relic.get("name", ""))
		relic_description = str(relic.get("description", ""))

	if relic_name.is_empty():
		_status_label.text = "获得 %d 金币。\n没有新的遗物。" % gold
	else:
		_status_label.text = "获得 %d 金币。\n获得遗物：%s\n效果：%s" % [gold, relic_name, relic_description]
		var audio_manager: Variant = _autoload("AudioManager")
		if audio_manager != null:
			audio_manager.play_sfx("relic")

	var run_controller: Variant = _autoload("RunController")
	if run_controller != null:
		get_tree().create_timer(1.5).timeout.connect(Callable(run_controller, "complete_chest"))


func _autoload(autoload_name: String) -> Variant:
	return get_node_or_null("/root/%s" % autoload_name)
