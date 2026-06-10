extends RefCounted

## 验证 Gallery 的编辑中预览可以让真实场景读取临时 Spec JSON。

const SCENES := {
	"main_menu": {
		"scene": "res://scenes/main_menu/main_menu_scene.tscn",
		"spec": "res://ui_specs/main_menu.ui.json",
	},
	"battle": {
		"scene": "res://scenes/battle/battle_scene.tscn",
		"spec": "res://ui_specs/battle.ui.json",
	},
	"chest": {
		"scene": "res://scenes/chest/chest_scene.tscn",
		"spec": "res://ui_specs/chest.ui.json",
	},
	"event": {
		"scene": "res://scenes/event/event_scene.tscn",
		"spec": "res://ui_specs/event.ui.json",
	},
	"map": {
		"scene": "res://scenes/map/map_scene.tscn",
		"spec": "res://ui_specs/map.ui.json",
	},
	"rest": {
		"scene": "res://scenes/rest/rest_scene.tscn",
		"spec": "res://ui_specs/rest.ui.json",
	},
	"result": {
		"scene": "res://scenes/result/result_scene.tscn",
		"spec": "res://ui_specs/result.ui.json",
	},
	"reward": {
		"scene": "res://scenes/reward/reward_scene.tscn",
		"spec": "res://ui_specs/reward.ui.json",
	},
	"shop": {
		"scene": "res://scenes/shop/shop_scene.tscn",
		"spec": "res://ui_specs/shop.ui.json",
	},
}


func name() -> String:
	return "UI scene spec override preview"


func run_async(ctx: Variant) -> void:
	for key in SCENES.keys():
		_prepare_mock_run()

		var info := SCENES[key] as Dictionary
		var marker := "PreviewOverride_%s" % key
		var tmp_path := "user://%s_override.ui.json" % key
		_write_override_spec(str(info["spec"]), tmp_path, marker)

		var packed := load(str(info["scene"])) as PackedScene
		ctx.assert_true(packed != null, "%s: 场景可加载" % key)
		if packed == null:
			DirAccess.remove_absolute(tmp_path)
			continue

		var scene := packed.instantiate()
		scene.set_meta("gallery_preview", true)
		scene.set_meta("ui_spec_override_path", tmp_path)
		scene.call("_build")

		ctx.assert_true(_find_node_by_name(scene, marker) != null,
			"%s: 真实场景使用 ui_spec_override_path 构建 UI" % key)

		scene.free()
		DirAccess.remove_absolute(tmp_path)


func _write_override_spec(source_path: String, tmp_path: String, marker: String) -> void:
	var f := FileAccess.open(source_path, FileAccess.READ)
	var json := JSON.new()
	var err := json.parse(f.get_as_text())
	f.close()
	if err != OK:
		return

	var spec := json.data as Dictionary
	spec["scene"] = marker

	var out := FileAccess.open(tmp_path, FileAccess.WRITE)
	out.store_string(JSON.stringify(spec, "\t"))
	out.close()


func _prepare_mock_run() -> void:
	var data_loader: Variant = _autoload("DataLoader")
	var game_state: Variant = _autoload("GameState")
	if data_loader == null or game_state == null:
		return
	data_loader.load_all()
	var run_config: Dictionary = data_loader.get_run_config("act1_map_run")
	if not run_config.is_empty():
		game_state.start_new_run(run_config)
	game_state.player_gold = 999
	game_state.battle_wins = 3


func _find_node_by_name(root: Node, node_name: String) -> Node:
	if root.name == node_name:
		return root
	for child in root.get_children():
		var found := _find_node_by_name(child, node_name)
		if found != null:
			return found
	return null


func _autoload(autoload_name: String) -> Variant:
	return _get_root().get_node_or_null(autoload_name)


func _get_tree() -> SceneTree:
	return Engine.get_main_loop() as SceneTree


func _get_root() -> Window:
	return _get_tree().root
