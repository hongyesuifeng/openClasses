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

var is_switching := false


func go_to(scene_key: String) -> void:
	if is_switching:
		return
	if not SCENES.has(scene_key):
		push_error("SceneRouter: unknown scene key '%s'" % scene_key)
		return

	is_switching = true

	## BGM 切换：scene key 直接对应 bgm key，battle 场景由 BattleScene._ready 覆盖精英/Boss 版本
	var audio_manager: Variant = get_node_or_null("/root/AudioManager")
	if audio_manager != null:
		audio_manager.play_bgm(scene_key)

	var error := get_tree().change_scene_to_file(SCENES[scene_key])
	if error != OK:
		is_switching = false
		push_error("SceneRouter: failed to change scene to %s (%s)" % [scene_key, error])
		return

	await get_tree().process_frame
	is_switching = false
