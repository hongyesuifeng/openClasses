extends Control

const _UIBuilder := preload("res://addons/ui_builder/ui_builder.gd")
const RelicServiceScript := preload("res://scripts/relic/relic_service.gd")

const SPEC_PATH := "res://ui_specs/chest.ui.json"

var _opened := false
var _status_label: Label
var _open_button: Button


func _ready() -> void:
	var audio_manager: Variant = _autoload("AudioManager")
	if audio_manager != null and not _is_gallery_preview():
		audio_manager.play_bgm("map")
	_build()


func _build() -> void:
	var ui := _UIBuilder.build(_spec_path())
	ui.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(ui)

	_status_label = ui.find_child("StatusLabel", true, false) as Label
	_open_button  = ui.find_child("OpenButton",  true, false) as Button


func handle_action(action_name: String, _source: Node) -> void:
	match action_name:
		"chest.on_open": _on_open_pressed()


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

	if _status_label != null:
		if relic_name.is_empty():
			_status_label.text = "获得 %d 金币。\n没有新的遗物。" % gold
		else:
			_status_label.text = "获得 %d 金币。\n获得遗物：%s\n效果：%s" % [gold, relic_name, relic_description]

	var audio_manager: Variant = _autoload("AudioManager")
	if audio_manager != null and not relic_name.is_empty():
		audio_manager.play_sfx("relic")

	var run_controller: Variant = _autoload("RunController")
	if run_controller != null:
		get_tree().create_timer(1.5).timeout.connect(Callable(run_controller, "complete_chest"))


func _autoload(autoload_name: String) -> Variant:
	if is_inside_tree():
		return get_node_or_null("/root/%s" % autoload_name)
	var tree := Engine.get_main_loop() as SceneTree
	return tree.root.get_node_or_null(autoload_name) if tree != null else null


func _spec_path() -> String:
	return str(get_meta("ui_spec_override_path", SPEC_PATH))


func _is_gallery_preview() -> bool:
	return bool(get_meta("gallery_preview", false))
