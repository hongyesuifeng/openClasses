## 序列帧动画辅助工具
## 基于 TextureRect 手动切帧，兼容 Control UI 场景
## 使用方式：
##   var anim = SpriteAnimHelper.new(texture_rect, "res://assets/enemies/slime", "idle", 4, 6.0, true)
##   anim.play()                        # 开始播放
##   anim.play("hit", func(): anim.play("idle"))  # 播完回 idle
##   anim.update(delta)                 # 在 _process 中调用
##   anim.stop()                        # 停止

extends RefCounted
class_name SpriteAnimHelper

var _texture_rect: TextureRect
var _base_dir: String       ## 例如 "res://assets/enemies/slime"
var _anim_name: String      ## 当前动画名 "idle" / "hit"
var _frame_prefix: String   ## 帧文件名前缀，例如 "enemy_slime"
var _frame_count: int
var _fps: float
var _loop: bool
var _current_frame: int = 0
var _elapsed: float = 0.0
var _playing: bool = false
var _on_finish: Callable = Callable()

## frames_cache[dir_path] = [Texture2D, ...]
static var _cache: Dictionary = {}


func _init(texture_rect: TextureRect, base_dir: String, frame_prefix: String) -> void:
	_texture_rect = texture_rect
	_base_dir = base_dir
	_frame_prefix = frame_prefix


## 开始播放指定动画
## anim: "idle" 或 "hit"
## fps / frame_count / loop 优先用参数，传 0 则用内置默认值
## on_finish: 动画结束时回调（loop=false 时有效）
func play(anim: String = "idle", on_finish: Callable = Callable(),
		fps: float = 0.0, frame_count: int = 0, loop: bool = true) -> void:
	_anim_name = anim
	_fps = fps if fps > 0.0 else 6.0
	_loop = loop
	_frame_count = frame_count if frame_count > 0 else _count_frames(anim)
	_on_finish = on_finish
	_current_frame = 0
	_elapsed = 0.0
	_playing = _frame_count > 0
	_show_frame(0)


func stop() -> void:
	_playing = false


## 在 _process(delta) 中调用
func update(delta: float) -> void:
	if not _playing or _frame_count <= 0:
		return

	_elapsed += delta
	var frame_duration := 1.0 / _fps
	if _elapsed >= frame_duration:
		_elapsed -= frame_duration
		_current_frame += 1
		if _current_frame >= _frame_count:
			if _loop:
				_current_frame = 0
			else:
				_current_frame = _frame_count - 1
				_playing = false
				_show_frame(_current_frame)
				if _on_finish.is_valid():
					_on_finish.call()
				return
		_show_frame(_current_frame)


## 检查序列帧资源是否存在（用于 fallback 判断）
func has_frames(anim: String) -> bool:
	var path := "%s/%s/%s_%s_000.png" % [_base_dir, anim, _frame_prefix, anim]
	return ResourceLoader.exists(path, "Texture2D")


func _show_frame(frame_index: int) -> void:
	if _texture_rect == null or not is_instance_valid(_texture_rect):
		return
	var path := "%s/%s/%s_%s_%03d.png" % [_base_dir, _anim_name, _frame_prefix, _anim_name, frame_index]
	var tex := _load_cached(path)
	if tex != null:
		_texture_rect.texture = tex


func _count_frames(anim: String) -> int:
	var count := 0
	while true:
		var path := "%s/%s/%s_%s_%03d.png" % [_base_dir, anim, _frame_prefix, anim, count]
		if not ResourceLoader.exists(path, "Texture2D"):
			break
		count += 1
	return count


static func _load_cached(path: String) -> Texture2D:
	if _cache.has(path):
		return _cache[path] as Texture2D
	if not ResourceLoader.exists(path, "Texture2D"):
		return null
	var tex := ResourceLoader.load(path, "Texture2D") as Texture2D
	if tex != null:
		_cache[path] = tex
	return tex
