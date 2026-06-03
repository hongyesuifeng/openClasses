## AudioManager — 与业务完全解耦的音频管理单例
##
## 使用方式：
##   AudioManager.play_sfx("card_place")
##   AudioManager.play_bgm("battle")
##   AudioManager.stop_bgm()
##
## 资源路径通过 data/audio_registry.json 注册，缺失资产静默跳过不报错。
## 可直接复制到任意 Godot 4.x 项目使用（无业务依赖）。

extends Node

const REGISTRY_PATH := "res://data/audio_registry.json"
const SFX_POOL_SIZE := 4
const BGM_FADE_IN_DEFAULT := 0.5
const BGM_FADE_OUT_DEFAULT := 0.8

var _sfx_registry: Dictionary = {}   ## key → { path, volume_db }
var _bgm_registry: Dictionary = {}   ## key → { path, volume_db }

var _sfx_pool: Array[AudioStreamPlayer] = []
var _bgm_players: Array[AudioStreamPlayer] = []   ## 两个轮换，用于交叉淡入淡出
var _active_bgm_index := 0
var _current_bgm_key := ""

var _sfx_volume_offset: float = 0.0
var _bgm_volume_offset: float = 0.0

var _bgm_tween: Tween = null


func _ready() -> void:
	_build_sfx_pool()
	_build_bgm_players()
	_load_registry()


## ── 注册接口（也可从代码手动注册，不依赖 JSON）────────────────

func register_sfx(key: String, path: String, volume_db: float = 0.0) -> void:
	_sfx_registry[key] = {"path": path, "volume_db": volume_db}


func register_bgm(key: String, path: String, volume_db: float = 0.0) -> void:
	_bgm_registry[key] = {"path": path, "volume_db": volume_db}


## ── 播放接口 ─────────────────────────────────────────────────────

func play_sfx(key: String) -> void:
	if not _sfx_registry.has(key):
		return
	var entry := _sfx_registry[key] as Dictionary
	var path := str(entry.get("path", ""))
	if path.is_empty() or not ResourceLoader.exists(path):
		return
	var stream := ResourceLoader.load(path) as AudioStream
	if stream == null:
		return
	var player := _get_free_sfx_player()
	if player == null:
		return
	player.stream = stream
	player.volume_db = float(entry.get("volume_db", 0.0)) + _sfx_volume_offset
	player.play()


func play_bgm(key: String, fade_in: float = BGM_FADE_IN_DEFAULT) -> void:
	if _current_bgm_key == key:
		return
	_current_bgm_key = key

	if not _bgm_registry.has(key):
		_stop_all_bgm(BGM_FADE_OUT_DEFAULT)
		return

	var entry := _bgm_registry[key] as Dictionary
	var path := str(entry.get("path", ""))
	if path.is_empty() or not ResourceLoader.exists(path):
		_stop_all_bgm(BGM_FADE_OUT_DEFAULT)
		return

	var stream := ResourceLoader.load(path) as AudioStream
	if stream == null:
		return

	var target_volume := float(entry.get("volume_db", 0.0)) + _bgm_volume_offset
	var old_index := _active_bgm_index
	_active_bgm_index = 1 - _active_bgm_index
	var new_player := _bgm_players[_active_bgm_index]
	var old_player := _bgm_players[old_index]

	new_player.stream = stream
	new_player.volume_db = target_volume - 80.0
	new_player.play()

	if _bgm_tween != null and _bgm_tween.is_valid():
		_bgm_tween.kill()
	_bgm_tween = create_tween().set_parallel(true)
	_bgm_tween.tween_property(new_player, "volume_db", target_volume, fade_in)
	_bgm_tween.tween_property(old_player, "volume_db", -80.0, BGM_FADE_OUT_DEFAULT).finished.connect(
		func() -> void:
			if old_player.volume_db <= -79.0:
				old_player.stop()
	)


func stop_bgm(fade_out: float = BGM_FADE_OUT_DEFAULT) -> void:
	_current_bgm_key = ""
	_stop_all_bgm(fade_out)


## ── 音量控制 ─────────────────────────────────────────────────────

func set_sfx_volume(volume_db: float) -> void:
	_sfx_volume_offset = volume_db


func set_bgm_volume(volume_db: float) -> void:
	_bgm_volume_offset = volume_db
	for player in _bgm_players:
		if player.playing:
			player.volume_db = player.volume_db + volume_db


func is_bgm_playing(key: String) -> bool:
	return _current_bgm_key == key


## ── 内部方法 ─────────────────────────────────────────────────────

func _build_sfx_pool() -> void:
	for i in range(SFX_POOL_SIZE):
		var player := AudioStreamPlayer.new()
		player.name = "SfxPlayer%d" % i
		player.bus = "SFX" if AudioServer.get_bus_index("SFX") >= 0 else "Master"
		add_child(player)
		_sfx_pool.append(player)


func _build_bgm_players() -> void:
	for i in range(2):
		var player := AudioStreamPlayer.new()
		player.name = "BgmPlayer%d" % i
		player.bus = "BGM" if AudioServer.get_bus_index("BGM") >= 0 else "Master"
		add_child(player)
		_bgm_players.append(player)


func _load_registry() -> void:
	if not FileAccess.file_exists(REGISTRY_PATH):
		push_warning("AudioManager: registry not found at %s" % REGISTRY_PATH)
		return
	var file := FileAccess.open(REGISTRY_PATH, FileAccess.READ)
	if file == null:
		return
	var parsed: Variant = JSON.parse_string(file.get_as_text())
	if not (parsed is Dictionary):
		push_warning("AudioManager: invalid JSON in %s" % REGISTRY_PATH)
		return
	var root := parsed as Dictionary
	for key in root.get("sfx", {}).keys():
		var entry := (root["sfx"] as Dictionary)[key] as Dictionary
		register_sfx(str(key), str(entry.get("path", "")), float(entry.get("volume_db", 0.0)))
	for key in root.get("bgm", {}).keys():
		var entry := (root["bgm"] as Dictionary)[key] as Dictionary
		register_bgm(str(key), str(entry.get("path", "")), float(entry.get("volume_db", 0.0)))


func _get_free_sfx_player() -> AudioStreamPlayer:
	for player in _sfx_pool:
		if not player.playing:
			return player
	return _sfx_pool[0]


func _stop_all_bgm(fade_out: float) -> void:
	if _bgm_tween != null and _bgm_tween.is_valid():
		_bgm_tween.kill()
	var any_playing := false
	for player in _bgm_players:
		if player.playing:
			any_playing = true
			break
	if not any_playing:
		return
	_bgm_tween = create_tween().set_parallel(true)
	for player in _bgm_players:
		if player.playing:
			_bgm_tween.tween_property(player, "volume_db", -80.0, fade_out).finished.connect(
				func() -> void:
					player.stop()
			)
