extends RefCounted

const AudioManagerScript := preload("res://scripts/audio/audio_manager.gd")


func name() -> String:
	return "AudioManager register/play/silent-degrade"


func run(ctx: Variant) -> void:
	## AudioManager 脚本可加载（编译通过）
	ctx.assert_true(AudioManagerScript != null, "audio_manager.gd compiles")

	## 注册表 JSON 格式正确，可被解析
	var file := FileAccess.open("res://data/audio_registry.json", FileAccess.READ)
	ctx.assert_true(file != null, "audio_registry.json exists and is readable")
	if file != null:
		var parsed: Variant = JSON.parse_string(file.get_as_text())
		ctx.assert_true(parsed is Dictionary, "audio_registry.json is valid JSON object")
		var root := parsed as Dictionary
		ctx.assert_true(root.has("sfx"), "audio_registry has sfx section")
		ctx.assert_true(root.has("bgm"), "audio_registry has bgm section")

		var sfx := root.get("sfx", {}) as Dictionary
		ctx.assert_true(sfx.has("card_place"), "sfx registry has card_place key")
		ctx.assert_true(sfx.has("hit"), "sfx registry has hit key")
		ctx.assert_true(sfx.has("player_hurt"), "sfx registry has player_hurt key")
		ctx.assert_true(sfx.has("heal"), "sfx registry has heal key")
		ctx.assert_true(sfx.has("enemy_die"), "sfx registry has enemy_die key")
		ctx.assert_true(sfx.has("victory"), "sfx registry has victory key")
		ctx.assert_true(sfx.has("defeat"), "sfx registry has defeat key")
		ctx.assert_true(sfx.has("buy"), "sfx registry has buy key")
		ctx.assert_true(sfx.has("button"), "sfx registry has button key")
		ctx.assert_true(sfx.has("potion"), "sfx registry has potion key")
		ctx.assert_true(sfx.has("relic"), "sfx registry has relic key")

		var bgm := root.get("bgm", {}) as Dictionary
		ctx.assert_true(bgm.has("main_menu"), "bgm registry has main_menu key")
		ctx.assert_true(bgm.has("battle"), "bgm registry has battle key")
		ctx.assert_true(bgm.has("battle_elite"), "bgm registry has battle_elite key")
		ctx.assert_true(bgm.has("battle_boss"), "bgm registry has battle_boss key")
		ctx.assert_true(bgm.has("map"), "bgm registry has map key")
		ctx.assert_true(bgm.has("shop"), "bgm registry has shop key")
		ctx.assert_true(bgm.has("rest"), "bgm registry has rest key")

		## 每个 sfx/bgm 条目都有 path 和 volume_db 字段
		for key in sfx.keys():
			var entry := (sfx[key] as Dictionary)
			ctx.assert_true(entry.has("path"), "sfx entry '%s' has path" % key)
			ctx.assert_true(entry.has("volume_db"), "sfx entry '%s' has volume_db" % key)

	## autoload 实例可从场景树获取
	var audio_manager: Variant = _get_autoload("AudioManager")
	ctx.assert_true(audio_manager != null, "AudioManager autoload is registered and accessible")

	if audio_manager == null:
		return

	## play_sfx 对缺失资产不崩溃（静默降级）
	audio_manager.play_sfx("nonexistent_key_xyz")   ## 不报错
	ctx.assert_true(true, "play_sfx with unknown key does not crash")

	audio_manager.play_sfx("hit")   ## hit.ogg 未必存在，但不应崩溃
	ctx.assert_true(true, "play_sfx with missing asset does not crash")

	## play_bgm 对缺失资产不崩溃
	audio_manager.play_bgm("nonexistent_bgm_xyz")
	ctx.assert_true(true, "play_bgm with unknown key does not crash")

	## is_bgm_playing 接口
	ctx.assert_false(audio_manager.is_bgm_playing("battle"), "is_bgm_playing returns false before playing")

	## register_sfx / register_bgm 接口
	audio_manager.register_sfx("test_sfx", "res://nonexistent_test.ogg", 0.0)
	audio_manager.play_sfx("test_sfx")   ## 文件不存在，静默跳过
	ctx.assert_true(true, "manually registered sfx with missing file does not crash")

	audio_manager.register_bgm("test_bgm", "res://nonexistent_bgm.ogg", 0.0)
	audio_manager.play_bgm("test_bgm")
	ctx.assert_true(true, "manually registered bgm with missing file does not crash")

	## stop_bgm 不崩溃
	audio_manager.stop_bgm()
	ctx.assert_true(true, "stop_bgm does not crash")

	## 已有的 card_place sfx 资产路径正确
	ctx.assert_true(
		ResourceLoader.exists("res://assets/audio/sfx/card_place_1.ogg"),
		"card_place_1.ogg asset exists"
	)
	ctx.assert_true(
		ResourceLoader.exists("res://assets/audio/sfx/card_slide_1.ogg"),
		"card_slide_1.ogg asset exists"
	)


func _get_autoload(autoload_name: String) -> Variant:
	var tree := Engine.get_main_loop() as SceneTree
	if tree == null:
		return null
	return tree.root.get_node_or_null(autoload_name)
