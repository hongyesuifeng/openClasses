extends Node

## 战斗特效管理器 - 统一管理所有战斗视觉特效

# 特效资源
const HIT_SLASH := "res://assets/vfx/effects/hit_slash.png"
const MAGIC_BURST := "res://assets/vfx/effects/magic_burst.png"
const PARTICLE_FIRE := "res://assets/vfx/particles/particle_fire.png"
const PARTICLE_POISON := "res://assets/vfx/particles/particle_poison.png"
const PARTICLE_SHIELD := "res://assets/vfx/particles/particle_shield.png"
const PARTICLE_SPARK := "res://assets/vfx/particles/particle_spark.png"

# 颜色配置
const COLOR_DAMAGE := Color(1.0, 0.35, 0.24)
const COLOR_BLOCK := Color(0.4, 0.75, 1.0)
const COLOR_HEAL := Color(0.35, 0.9, 0.45)
const COLOR_STRENGTH := Color(1.0, 0.65, 0.25)
const COLOR_POISON := Color(0.55, 0.2, 0.75)
const COLOR_FIRE := Color(1.0, 0.5, 0.15)

# 当前场景引用
var _current_scene: Node = null


func set_current_scene(scene: Node) -> void:
	_current_scene = scene


## 播放攻击特效
func play_attack_effect(effect_type: String, target_position: Vector2) -> void:
	match effect_type:
		"slash", "attack":
			_spawn_slash_effect(target_position)
		"fire":
			_spawn_fire_effect(target_position)
		"poison":
			_spawn_poison_effect(target_position)
		"magic":
			_spawn_magic_effect(target_position)
		_:
			_spawn_slash_effect(target_position)


## 播放格挡特效
func play_block_effect(target_position: Vector2, _amount: int = 0) -> void:
	_spawn_shield_particles(target_position)


## 播放治疗特效
func play_heal_effect(target_position: Vector2) -> void:
	_spawn_floating_text("+", target_position, COLOR_HEAL)
	_spawn_spark_particles(target_position, Color(0.35, 0.9, 0.45))


## 播放力量变化特效
func play_strength_effect(target_position: Vector2, value: int) -> void:
	var text := "+%d" % value if value > 0 else "%d" % value
	_spawn_floating_text(text, target_position, COLOR_STRENGTH)


## 播放状态施加特效
func play_status_effect(status_id: String, target_position: Vector2) -> void:
	match status_id:
		"poison":
			_spawn_poison_particles(target_position)
		"vulnerable":
			_spawn_floating_text("易伤", target_position, Color(1.0, 0.5, 0.3))
		"weak":
			_spawn_floating_text("虚弱", target_position, Color(0.6, 0.6, 0.7))
		"strength":
			_spawn_spark_particles(target_position, COLOR_STRENGTH)
		_:
			_spawn_magic_effect(target_position)


## 播放敌人死亡特效
func play_death_effect(target_position: Vector2) -> void:
	_spawn_death_dissolve(target_position)


## 播放数字弹出
func spawn_floating_number(value: int, target_position: Vector2, color: Color = COLOR_DAMAGE) -> void:
	var text := "-%d" % value if value < 0 else "+%d" % value
	_spawn_floating_text(text, target_position, color)


## ========== 内部实现 ==========


## 斩击特效
func _spawn_slash_effect(pos: Vector2) -> void:
	var sprite := TextureRect.new()
	sprite.texture = load(HIT_SLASH)
	sprite.pivot_offset = Vector2(64, 64)  # 假设图片 128x128
	sprite.global_position = pos - Vector2(64, 64)
	sprite.modulate = Color(1.0, 1.0, 1.0, 0.95)
	sprite.mouse_filter = Control.MOUSE_FILTER_IGNORE
	sprite.z_index = 50
	_add_to_scene(sprite)

	var tween := _create_tween()
	tween.set_parallel(true)
	tween.tween_property(sprite, "scale", Vector2(1.3, 1.3), 0.15)
	tween.tween_property(sprite, "modulate:a", 0.0, 0.2)
	tween.tween_property(sprite, "rotation", 0.4, 0.15)
	tween.finished.connect(sprite.queue_free)


## 火焰特效
func _spawn_fire_effect(pos: Vector2) -> void:
	# 粒子效果
	var particles := _create_particles(PARTICLE_FIRE, pos, COLOR_FIRE)
	_add_to_scene(particles)

	# 闪光效果
	var flash := _create_flash(pos, COLOR_FIRE)
	_add_to_scene(flash)

	var tween := _create_tween()
	tween.set_parallel(true)
	tween.tween_property(flash, "scale", Vector2(2.0, 2.0), 0.2)
	tween.tween_property(flash, "modulate:a", 0.0, 0.25)
	tween.finished.connect(func(): flash.queue_free())


## 毒素特效
func _spawn_poison_effect(pos: Vector2) -> void:
	var particles := _create_particles(PARTICLE_POISON, pos, COLOR_POISON)
	_add_to_scene(particles)


## 魔法爆发特效
func _spawn_magic_effect(pos: Vector2) -> void:
	var sprite := TextureRect.new()
	sprite.texture = load(MAGIC_BURST)
	sprite.pivot_offset = Vector2(64, 64)
	sprite.global_position = pos - Vector2(64, 64)
	sprite.modulate = Color(0.7, 0.6, 1.0, 0.9)
	sprite.mouse_filter = Control.MOUSE_FILTER_IGNORE
	sprite.z_index = 50
	_add_to_scene(sprite)

	var tween := _create_tween()
	tween.set_parallel(true)
	tween.tween_property(sprite, "scale", Vector2(1.5, 1.5), 0.2)
	tween.tween_property(sprite, "modulate:a", 0.0, 0.25)
	tween.finished.connect(sprite.queue_free)


## 护盾粒子
func _spawn_shield_particles(pos: Vector2) -> void:
	var particles := _create_particles(PARTICLE_SHIELD, pos, COLOR_BLOCK)
	particles.amount = 12
	_add_to_scene(particles)


## 毒素粒子
func _spawn_poison_particles(pos: Vector2) -> void:
	var particles := _create_particles(PARTICLE_POISON, pos, COLOR_POISON)
	particles.amount = 8
	_add_to_scene(particles)


## 火花粒子
func _spawn_spark_particles(pos: Vector2, color: Color) -> void:
	var particles := _create_particles(PARTICLE_SPARK, pos, color)
	particles.amount = 10
	_add_to_scene(particles)


## 死亡溶解效果
func _spawn_death_dissolve(pos: Vector2) -> void:
	var rect := ColorRect.new()
	rect.color = Color(0.8, 0.2, 0.1, 0.6)
	rect.custom_minimum_size = Vector2(100, 100)
	rect.global_position = pos - Vector2(50, 50)
	rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
	rect.z_index = 45
	_add_to_scene(rect)

	var tween := _create_tween()
	tween.set_parallel(true)
	tween.tween_property(rect, "scale", Vector2(0.1, 0.1), 0.4)
	tween.tween_property(rect, "modulate:a", 0.0, 0.35)
	tween.tween_property(rect, "rotation", 0.5, 0.4)
	tween.finished.connect(rect.queue_free)


## 飘动文字
func _spawn_floating_text(text: String, pos: Vector2, color: Color) -> void:
	var label := Label.new()
	label.text = text
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	label.custom_minimum_size = Vector2(80, 32)
	label.size = Vector2(80, 32)
	label.add_theme_font_size_override("font_size", 22)
	label.add_theme_color_override("font_color", color)
	label.add_theme_color_override("font_shadow_color", Color(0.1, 0.05, 0.0, 0.9))
	label.add_theme_constant_override("shadow_offset_x", 2)
	label.add_theme_constant_override("shadow_offset_y", 2)
	label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	label.global_position = pos - Vector2(40, 16)
	label.z_index = 60
	_add_to_scene(label)

	var tween := _create_tween()
	tween.set_parallel(true)
	tween.tween_property(label, "global_position:y", pos.y - 50, 0.5).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
	tween.tween_property(label, "modulate:a", 0.0, 0.5).set_delay(0.1)
	tween.finished.connect(label.queue_free)


## 闪光效果
func _create_flash(pos: Vector2, color: Color) -> ColorRect:
	var rect := ColorRect.new()
	rect.color = color
	rect.custom_minimum_size = Vector2(80, 80)
	rect.global_position = pos - Vector2(40, 40)
	rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
	rect.z_index = 48
	return rect


## 创建粒子系统
func _create_particles(texture_path: String, pos: Vector2, color: Color) -> GPUParticles2D:
	var particles := GPUParticles2D.new()
	particles.texture = load(texture_path)
	particles.global_position = pos
	particles.emitting = true
	particles.one_shot = true
	particles.explosiveness = 0.7
	particles.amount = 8
	particles.lifetime = 0.35
	particles.modulate = color
	particles.z_index = 55

	var mat := ParticleProcessMaterial.new()
	mat.direction = Vector3(0, -1, 0)
	mat.spread = 45.0
	mat.initial_velocity_min = 40.0
	mat.initial_velocity_max = 80.0
	mat.gravity = Vector3(0, 30, 0)
	mat.scale_min = 0.3
	mat.scale_max = 0.7
	mat.color = color
	particles.process_material = mat

	# 自动清理
	particles.finished.connect(particles.queue_free)

	return particles


## 添加到当前场景
func _add_to_scene(node: Node) -> void:
	if _current_scene and is_instance_valid(_current_scene):
		_current_scene.add_child(node)


## 创建 Tween
func _create_tween() -> Tween:
	if _current_scene and is_instance_valid(_current_scene):
		return _current_scene.create_tween()
	return null
