extends SceneTree

## render_ui_preview.gd — UI 场景截图渲染工具
##
## 注意：Godot 4.x --headless 模式禁用 GPU，无法渲染截图。
## 本脚本设计为在 Gallery 内部通过 SubViewport 截图，
## 或在带 GPU 的非 headless 模式下运行。
##
## 用法（需要 GPU，不能加 --headless）：
##   Godot_console.exe --path <project> --script res://tools/render_ui_preview.gd
##
## 输出：res://ui_snapshots/current/<scene>_current.png
##
## 推荐替代方案：在 Gallery「📄 Spec JSON」Tab 中点击截图按钮，
## 对当前 SubViewport 预览直接截图保存。

const SPECS_DIR    := "res://ui_specs"
const OUTPUT_DIR   := "res://ui_snapshots/current"
const MOCK_DIR     := "res://ui_mock_data"

const SCENE_MAP := {
	"main_menu": "res://scenes/main_menu/main_menu_scene.tscn",
	"battle":    "res://scenes/battle/battle_scene.tscn",
	"map":       "res://scenes/map/map_scene.tscn",
	"shop":      "res://scenes/shop/shop_scene.tscn",
	"reward":    "res://scenes/reward/reward_scene.tscn",
	"event":     "res://scenes/event/event_scene.tscn",
	"rest":      "res://scenes/rest/rest_scene.tscn",
	"result":    "res://scenes/result/result_scene.tscn",
	"chest":     "res://scenes/chest/chest_scene.tscn",
}


func _init() -> void:
	## 检查是否在 headless 模式
	if DisplayServer.get_name() == "headless":
		printerr("[RENDER] ❌ headless 模式下无法渲染截图（GPU 被禁用）")
		printerr("[RENDER] 请改用 Gallery 内的截图按钮，或去掉 --headless 参数运行")
		quit(1)
		return

	print("\n[RENDER] ══════════════════════════════════════")
	print("[RENDER] UI Preview Renderer")
	print("[RENDER] 输出目录: %s" % OUTPUT_DIR)
	print("[RENDER] ══════════════════════════════════════\n")

	_ensure_output_dir()
	_render_all()


func _render_all() -> void:
	var da := DirAccess.open(SPECS_DIR)
	if da == null:
		printerr("[RENDER] 找不到 ui_specs 目录")
		quit(1)
		return

	var spec_files: Array[String] = []
	da.list_dir_begin()
	var name := da.get_next()
	while not name.is_empty():
		if not da.current_is_dir() and name.ends_with(".ui.json"):
			spec_files.append(name.replace(".ui.json", ""))
		name = da.get_next()
	da.list_dir_end()
	spec_files.sort()

	var success_count := 0
	for scene_key in spec_files:
		if _render_scene(scene_key):
			success_count += 1

	print("\n[RENDER] ─────────────────────────────────────")
	print("[RENDER] 完成：%d / %d 个场景截图成功" % [success_count, spec_files.size()])
	print("[RENDER] 截图保存在: %s" % OUTPUT_DIR)
	print("[RENDER] ══════════════════════════════════════\n")
	quit(0)


func _render_scene(scene_key: String) -> bool:
	var scene_path: String = SCENE_MAP.get(scene_key, "") as String
	if scene_path.is_empty() or not ResourceLoader.exists(scene_path):
		print("[RENDER] ⚠ %s — 无对应 .tscn，跳过" % scene_key)
		return false

	var output_path := OUTPUT_DIR.path_join("%s_current.png" % scene_key)

	## 创建 SubViewport 渲染
	var viewport := SubViewport.new()
	viewport.size = Vector2i(1365, 768)
	viewport.render_target_update_mode = SubViewport.UPDATE_ONCE
	viewport.transparent_bg = false
	get_root().add_child(viewport)

	## 加载场景
	var packed := load(scene_path) as PackedScene
	if packed == null:
		print("[RENDER] ❌ %s — 无法加载场景" % scene_key)
		viewport.queue_free()
		return false

	var scene_node := packed.instantiate()
	scene_node.set_meta("gallery_preview", true)
	scene_node.set_process(false)
	scene_node.set_physics_process(false)
	viewport.add_child(scene_node)

	## 等待一帧完成渲染
	await process_frame
	await process_frame

	## 截图
	var img := viewport.get_texture().get_image()
	if img == null:
		print("[RENDER] ❌ %s — 无法获取截图" % scene_key)
		viewport.queue_free()
		return false

	var err := img.save_png(output_path)
	viewport.queue_free()

	if err == OK:
		print("[RENDER] ✅ %s → %s" % [scene_key, output_path])
		return true
	else:
		print("[RENDER] ❌ %s — 保存失败 (err=%d)" % [scene_key, err])
		return false


func _ensure_output_dir() -> void:
	var da := DirAccess.open("res://")
	if da == null:
		return
	if not da.dir_exists("ui_snapshots"):
		da.make_dir("ui_snapshots")
	if not da.dir_exists("ui_snapshots/current"):
		var da2 := DirAccess.open("res://ui_snapshots")
		if da2 != null:
			da2.make_dir("current")
