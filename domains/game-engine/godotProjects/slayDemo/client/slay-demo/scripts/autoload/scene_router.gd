extends Node

const SCENES := {
	"main_menu": "res://scenes/main_menu/main_menu_scene.tscn",
	"map": "res://scenes/map/map_scene.tscn",
	"battle": "res://scenes/battle/battle_scene.tscn",
	"reward": "res://scenes/reward/reward_scene.tscn",
	"rest": "res://scenes/rest/rest_scene.tscn",
	"shop": "res://scenes/shop/shop_scene.tscn",
	"chest": "res://scenes/chest/chest_scene.tscn",
	"event": "res://scenes/event/event_scene.tscn",
	"result": "res://scenes/result/result_scene.tscn"
}

const FADE_DURATION := 0.15

var is_switching := false
var _overlay: ColorRect = null


func _ready() -> void:
	_overlay = ColorRect.new()
	_overlay.color = Color(0, 0, 0, 0)
	_overlay.set_anchors_preset(Control.PRESET_FULL_RECT)
	_overlay.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_overlay.z_index = 100
	_overlay.process_mode = Node.PROCESS_MODE_ALWAYS
	add_child(_overlay)


func go_to(scene_key: String) -> void:
	if is_switching:
		return
	if not SCENES.has(scene_key):
		push_error("SceneRouter: unknown scene key '%s'" % scene_key)
		return

	is_switching = true

	## 淡出
	var fade_out := create_tween()
	fade_out.tween_property(_overlay, "color:a", 1.0, FADE_DURATION)
	await fade_out.finished

	## BGM 切换
	var audio_manager: Variant = get_node_or_null("/root/AudioManager")
	if audio_manager != null:
		audio_manager.play_bgm(scene_key)

	var error := get_tree().change_scene_to_file(SCENES[scene_key])
	if error != OK:
		is_switching = false
		_overlay.color = Color(0, 0, 0, 0)
		push_error("SceneRouter: failed to change scene to %s (%s)" % [scene_key, error])
		return

	await get_tree().process_frame

	## 淡入
	var fade_in := create_tween()
	fade_in.tween_property(_overlay, "color:a", 0.0, FADE_DURATION)
	await fade_in.finished

	is_switching = false
