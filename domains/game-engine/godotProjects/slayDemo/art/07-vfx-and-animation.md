# 特效与动画方案

> 适用项目：SlayDemo — 类《杀戮尖塔》卡牌 Roguelike Demo
> 文档版本：v1.0

---

## 一、基础战斗特效清单

### 1.1 特效总表

| 特效名称 | 触发时机 | 优先级 | 实现方式 | 说明 |
|----------|----------|--------|----------|------|
| 伤害数字弹出 | 任何角色受到伤害 | P0 | Tween 动画 | 红色数字上浮淡出 |
| 格挡数值显示 | 获得格挡时 | P0 | Tween 动画 | 蓝色数值弹出 |
| 攻击命中闪光 | 攻击卡牌命中敌人 | P0 | GPUParticles2D | 白色闪光粒子 |
| 屏幕震动 | 玩家受伤/Boss攻击 | P0 | Camera2D offset | 按伤害量调整强度 |
| 闪白效果 | 任何角色受击 | P0 | modulate | 0.1s 白色闪烁 |
| 抽牌动画 | 回合开始抽牌 | P1 | Tween | 从牌堆位置飞入手牌 |
| 弃牌动画 | 回合结束弃牌 | P1 | Tween | 卡牌缩小淡出 |
| 中毒泡泡 | 中毒角色每回合 | P1 | GPUParticles2D | 绿色泡泡上升 |
| 护盾闪光 | 获得格挡时 | P1 | Shader/动画 | 蓝色六边形闪光 |
| 卡牌打出飞行 | 打出卡牌时 | P1 | Tween | 从手牌飞向目标 |
| 力量增强 | 获得力量增益 | P1 | Tween | 向上箭头图标弹出 |
| 燃烧效果 | 燃烧卡牌在手牌中 | P2 | GPUParticles2D | 火焰粒子 |
| 冰冻效果 | 被冰冻时 | P2 | Shader | 蓝色叠加 + 减速动画 |
| 治疗效果 | 回复 HP | P2 | Tween | 绿色数字上浮 |
| 金币飞入 | 获得金币 | P2 | Tween | 金色粒子向金币位置飞 |

---

## 二、特效实现方式详解

### 2.1 GPUParticles2D — 粒子特效

#### 通用闪光粒子（P0，用于攻击命中）

```gdscript
# 场景：在敌人位置生成闪光粒子
func spawn_hit_effect(target_position: Vector2):
    var particles = GPUParticles2D.new()
    var process_mat = ParticleProcessMaterial.new()

    # 发射量
    process_mat.emission_shape = ParticleProcessMaterial.EMISSION_SHAPE_POINT
    process_mat.particle_flag_disable_z = true

    # 方向：球形发散
    process_mat.direction = Vector3(0, -1, 0)
    process_mat.spread = 60.0
    process_mat.gravity = Vector3(0, 0, 0)

    # 生命周期
    process_mat.lifetime_randomness = 0.3

    # 初始速度
    process_mat.initial_velocity_min = 50.0
    process_mat.initial_velocity_max = 150.0

    # 颜色：白色 -> 透明
    var color_ramp = Gradient.new()
    color_ramp.colors = PackedColorArray([Color.WHITE, Color.WHITE, Color.TRANSPARENT])
    color_ramp.offsets = PackedFloat32Array([0.0, 0.3, 1.0])
    process_mat.color_ramp = color_ramp

    particles.process_material = process_mat
    particles.amount = 8
    particles.lifetime = 0.3
    particles.one_shot = true
    particles.explosiveness = 0.9

    # 使用白色小圆点纹理
    particles.texture = preload("res://assets/vfx/particle_spark.png")

    particles.position = target_position
    get_tree().current_scene.add_child(particles)
    particles.finished.connect(particles.queue_free)
```

#### 中毒泡泡（P1）

```gdscript
func spawn_poison_effect(target: Node2D):
    var particles = GPUParticles2D.new()
    var process_mat = ParticleProcessMaterial.new()

    process_mat.emission_shape = ParticleProcessMaterial.EMISSION_SHAPE_SPHERE
    process_mat.emission_sphere_radius = 30.0

    # 向上飘
    process_mat.direction = Vector3(0, -1, 0)
    process_mat.spread = 30.0
    process_mat.gravity = Vector3(0, -20, 0)

    # 绿色
    var color_ramp = Gradient.new()
    color_ramp.colors = PackedColorArray([
        Color("#44cc88"), Color("#44cc88"), Color.TRANSPARENT
    ])
    color_ramp.offsets = PackedFloat32Array([0.0, 0.5, 1.0])
    process_mat.color_ramp = color_ramp

    particles.process_material = process_mat
    particles.amount = 5
    particles.lifetime = 1.5
    particles.one_shot = false

    # 挂载到目标上，跟随移动
    target.add_child(particles)
```

### 2.2 Tween 动画 — 补间动画

#### 伤害数字弹出（P0）

```gdscript
func show_damage_number(value: int, position: Vector2, is_heal: bool = false):
    var label = Label.new()
    label.text = str(value)
    label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER

    # 字体设置
    label.add_theme_font_size_override("font_size", 28)
    label.add_theme_color_override("font_color",
        Color.RED if not is_heal else Color.GREEN)

    # 添加描边
    label.add_theme_color_override("font_shadow_color", Color.BLACK)
    label.add_theme_constant_override("shadow_offset_x", 2)
    label.add_theme_constant_override("shadow_offset_y", 2)

    label.position = position + Vector2(randf_range(-10, 10), 0)
    label.z_index = 50

    get_tree().current_scene.add_child(label)

    # Tween 动画：上浮 + 缩放 + 淡出
    var tween = create_tween()
    tween.set_parallel(true)
    tween.tween_property(label, "position:y", position.y - 60, 0.8)
    tween.tween_property(label, "modulate:a", 0.0, 0.8).set_delay(0.3)
    tween.tween_property(label, "scale", Vector2(1.2, 1.2), 0.1)  # 弹出
    tween.chain().tween_property(label, "scale", Vector2(1.0, 1.0), 0.1)
    tween.finished.connect(label.queue_free)
```

#### 卡牌打出飞行（P1）

```gdscript
func play_card_animation(card: Control, target_position: Vector2):
    var start_pos = card.global_position
    var start_scale = card.scale

    # 先将卡牌移到场景顶层
    card.z_index = 30

    var tween = create_tween()
    tween.set_parallel(true)
    # 飞向目标
    tween.tween_property(card, "global_position", target_position, 0.3)\
        .set_ease(Tween.EASE_IN)
    # 缩小
    tween.tween_property(card, "scale", Vector2(0.5, 0.5), 0.3)
    # 淡出
    tween.tween_property(card, "modulate:a", 0.0, 0.3).set_delay(0.15)
    tween.finished.connect(func():
        card.queue_free()
    )
```

### 2.3 Shader — 着色器效果

#### 闪白/受伤效果（P0，用 modulate 替代即可）

```gdscript
# 最简方案：直接修改 modulate，无需 Shader
func flash_white(sprite: Sprite2D, duration: float = 0.1):
    sprite.modulate = Color.WHITE  # 先变白
    await get_tree().create_timer(duration).timeout
    sprite.modulate = Color(1.0, 0.5, 0.5)  # 变红
    await get_tree().create_timer(duration).timeout
    sprite.modulate = Color.WHITE  # 恢复
```

#### 卡牌发光边框（P1，稀有卡牌用）

```glsl
// card_glow.gdshader
shader_type canvas_item;

uniform vec4 glow_color : source_color = vec4(0.27, 0.53, 1.0, 1.0);
uniform float glow_intensity : hint_range(0.0, 2.0) = 1.0;

void fragment() {
    vec4 color = COLOR;
    // 简单的边缘检测发光
    float alpha = texture(TEXTURE, UV).a;

    // 采样周围像素
    float edge = 0.0;
    float pixel_size = 1.0 / TEXTURE_PIXEL_SIZE.x;
    edge += texture(TEXTURE, UV + vec2(0.0, -1.0/pixel_size)).a;
    edge += texture(TEXTURE, UV + vec2(0.0, 1.0/pixel_size)).a;
    edge += texture(TEXTURE, UV + vec2(-1.0/pixel_size, 0.0)).a;
    edge += texture(TEXTURE, UV + vec2(1.0/pixel_size, 0.0)).a;
    edge = edge / 4.0;

    // 边缘发光
    float glow = (1.0 - alpha) * edge * glow_intensity;
    color.rgb = mix(color.rgb, glow_color.rgb, glow * glow_color.a);
    color.a = alpha + glow * 0.5;

    COLOR = color;
}
```

> **简化建议**：如果 Shader 编写困难，完全可以用 `ColorRect` 叠加 + `modulate` + `sin(time)` 动画来模拟发光效果。

---

## 三、状态效果视觉反馈

### 3.1 状态效果视觉表

| 状态 | 目标 | 持续效果 | 获得时效果 | 失去时效果 |
|------|------|----------|-----------|-----------|
| 力量+ | 玩家/敌人 | 角色边缘微红 | 向上箭头弹出 | 箭头淡出 |
| 敏捷+ | 玩家/敌人 | 角色边缘微蓝 | 闪电图标弹出 | 图标淡出 |
| 中毒 | 敌人/玩家 | 绿色泡泡粒子 | 绿色闪光 | 泡泡消失 |
| 易伤 | 敌人/玩家 | 角色轮廓变红 | 破盾图标弹出 | 轮廓恢复 |
| 虚弱 | 敌人/玩家 | 角色灰暗 | 断剑图标弹出 | 颜色恢复 |
| 格挡 | 玩家 | 蓝色护盾光圈 | 盾牌弹出 | 光圈消失 |
| 燃烧 | 玩家(手牌) | 卡牌周围火焰 | 火焰粒子 | 火焰消失 |

### 3.2 状态图标动画

```gdscript
# 状态图标出现动画
func show_status_icon(icon: TextureRect):
    icon.scale = Vector2.ZERO
    icon.visible = true
    var tween = create_tween()
    tween.tween_property(icon, "scale", Vector2(1.2, 1.2), 0.15)\
        .set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_BACK)
    tween.tween_property(icon, "scale", Vector2(1.0, 1.0), 0.1)

# 状态叠加数字更新动画
func update_status_stack(icon: TextureRect, new_count: int):
    # 微微抖动表示变化
    var tween = create_tween()
    tween.tween_property(icon, "scale", Vector2(1.3, 1.3), 0.1)
    tween.tween_property(icon, "scale", Vector2(1.0, 1.0), 0.1)
```

---

## 四、打击感增强手段

### 4.1 屏幕震动

```gdscript
# screen_shake.gd -- 挂载到 Camera2D 上
extends Camera2D

var shake_intensity: float = 0.0
var shake_decay: float = 5.0
var original_offset: Vector2 = Vector2.ZERO

func shake(intensity: float = 4.0, duration: float = 0.15):
    shake_intensity = intensity
    await get_tree().create_timer(duration).timeout
    shake_intensity = 0.0
    offset = original_offset

func _process(delta):
    if shake_intensity > 0:
        offset = Vector2(
            randf_range(-shake_intensity, shake_intensity),
            randf_range(-shake_intensity, shake_intensity)
        )
        shake_intensity = max(0, shake_intensity - shake_decay * delta)
```

#### 震动强度参考

| 场景 | 强度 | 持续时间 |
|------|------|----------|
| 普通攻击命中 | 2-3 | 0.1s |
| 重击命中 | 5-6 | 0.15s |
| Boss 攻击 | 8-10 | 0.2s |
| 玩家受伤 | 4-5 | 0.12s |
| 玩家重创（HP < 25%） | 6-8 | 0.2s |

### 4.2 命中停顿（Hit Stop）

```gdscript
# 命中瞬间短暂冻结，增强打击感
func hit_stop(duration: float = 0.05):
    get_tree().paused = true
    await get_tree().create_timer(duration, true, true).timeout  # process_in_parent = true
    get_tree().paused = false
```

> 停顿 0.04-0.08s 是最常用的"打击停顿"时长，太短感觉不到，太长会卡顿。

### 4.3 组合打击感方案

一次"好的"攻击命中应该包含以下要素的组合：

```
攻击卡打出 → 卡牌飞向敌人
→ 命中瞬间：Hit Stop 0.05s
→ 同时：屏幕微震 (intensity: 3)
→ 同时：敌人闪白 0.1s
→ 同时：白色闪光粒子
→ Hit Stop 结束后：伤害数字弹出（红色，上浮）
→ 稍后：敌人 HP 条平滑减少

总时长：约 0.4-0.5s，非常紧凑
```

---

## 五、敌人动画方案

### 5.1 敌人受击动画

```gdscript
func on_enemy_hit(enemy: Node2D):
    # 1. 闪白
    enemy.modulate = Color(3, 3, 3)  # 过曝白
    # 2. 微微后退
    var original_x = enemy.position.x
    var tween = create_tween()
    tween.tween_property(enemy, "position:x", original_x + 10, 0.05)
    tween.tween_property(enemy, "position:x", original_x, 0.1)
    # 3. 恢复颜色
    await get_tree().create_timer(0.1).timeout
    enemy.modulate = Color.WHITE
```

### 5.2 敌人死亡动画

```gdscript
func on_enemy_death(enemy: Node2D):
    # 1. 暂停一下（戏剧效果）
    await get_tree().create_timer(0.2).timeout

    # 2. 多重效果并行
    var tween = create_tween()
    tween.set_parallel(true)

    # 缩小
    tween.tween_property(enemy, "scale", Vector2(0.1, 0.1), 0.5)\
        .set_ease(Tween.EASE_IN)
    # 淡出
    tween.tween_property(enemy, "modulate:a", 0.0, 0.5)
    # 上浮（像灵魂升天）
    tween.tween_property(enemy, "position:y",
        enemy.position.y - 50, 0.5)

    # 3. 死亡粒子（可选）
    spawn_death_particles(enemy.global_position)

    # 4. 清理
    tween.finished.connect(enemy.queue_free)
```

### 5.3 敌人攻击动画

```gdscript
func enemy_attack_animation(enemy: Node2D, player_pos: Vector2):
    var original_pos = enemy.position
    var direction = (player_pos - enemy.global_position).normalized()

    var tween = create_tween()
    # 前冲
    tween.tween_property(enemy, "position",
        original_pos + Vector2(direction.x * 60, direction.y * 30), 0.12)\
        .set_ease(Tween.EASE_IN)
    # 停顿
    tween.tween_interval(0.03)
    # 弹回
    tween.tween_property(enemy, "position", original_pos, 0.15)\
        .set_ease(Tween.EASE_OUT)
```

---

## 六、卡牌动画方案

### 6.1 抽牌动画

```gdscript
# 从抽牌堆位置飞入手牌区
func draw_card_animation(card: Control, hand_position: Vector2):
    # 初始位置：抽牌堆位置（屏幕左下）
    card.global_position = draw_pile_position
    card.scale = Vector2(0.5, 0.5)
    card.modulate.a = 0.0
    card.rotation = randf_range(-0.1, 0.1)

    var tween = create_tween()
    tween.set_parallel(true)
    tween.tween_property(card, "global_position", hand_position, 0.3)\
        .set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_BACK)
    tween.tween_property(card, "scale", Vector2(1.0, 1.0), 0.3)
    tween.tween_property(card, "modulate:a", 1.0, 0.2)
    tween.tween_property(card, "rotation", 0.0, 0.3)
```

### 6.2 弃牌动画

```gdscript
# 卡牌缩小淡出，向弃牌堆方向移动
func discard_card_animation(card: Control):
    var discard_pos = discard_pile_position  # 屏幕右下

    var tween = create_tween()
    tween.set_parallel(true)
    tween.tween_property(card, "global_position", discard_pos, 0.25)\
        .set_ease(Tween.EASE_IN)
    tween.tween_property(card, "scale", Vector2(0.3, 0.3), 0.25)
    tween.tween_property(card, "modulate:a", 0.0, 0.25)
    tween.tween_property(card, "rotation", randf_range(-0.3, 0.3), 0.25)
    tween.finished.connect(card.queue_free)
```

### 6.3 手牌排列

```gdscript
# 手牌扇形排列（可选，或直接水平排列）
func arrange_hand(cards: Array[Control]):
    var hand_center = Vector2(960, 950)  # 屏幕底部居中
    var card_spacing = 160  # 卡牌间距
    var total_width = cards.size() * card_spacing
    var start_x = hand_center.x - total_width / 2

    for i in cards.size():
        var card = cards[i]
        var target_x = start_x + i * card_spacing + card_spacing / 2
        var target_pos = Vector2(target_x, hand_center.y)

        # 扇形偏移：中间的卡牌略高
        var offset_from_center = (i - cards.size() / 2.0)
        target_pos.y -= (1.0 - abs(offset_from_center) / cards.size()) * 20

        var tween = create_tween()
        tween.tween_property(card, "global_position", target_pos, 0.2)\
            .set_ease(Tween.EASE_OUT)
```

---

## 七、最小资源实现有效视觉反馈

### 7.1 "零美术资源"特效方案

如果完全没有粒子纹理和特效精灵图，可以用以下纯代码方案：

| 特效 | 纯代码实现 |
|------|-----------|
| 攻击命中 | ColorRect 白色闪烁 0.05s |
| 伤害数字 | Label + Tween 上浮淡出 |
| 屏幕震动 | Camera2D offset 随机偏移 |
| 受伤反馈 | modulate 闪白 -> 变红 -> 恢复 |
| 死亡 | scale -> 0 + modulate.a -> 0 |
| 中毒 | 每隔 1s 闪绿 + 绿色数字弹出 |
| 格挡 | modulate 短暂变蓝 |
| Buff/Debuff | 32x32 ColorRect 作为图标背景 + Label 显示数值 |

### 7.2 逐步升级路线

```
阶段 1（最小可行）：
  └── 纯代码特效（Tween + modulate + Label）
  └── 时间：2h 实现全部基础反馈

阶段 2（加粒子）：
  └── 加入 GPUParticles2D（用默认白色圆点）
  └── 时间：2-3h

阶段 3（加纹理）：
  └── 从 Kenney Particle Pack 获取纹理
  └── 自定义粒子材质
  └── 时间：1-2h

阶段 4（加 Shader）：
  └── 卡牌发光、边缘检测等高级效果
  └── 时间：3-4h（需要 Shader 知识）
```

### 7.3 推荐的最低投入

建议至少完成**阶段 1 + 阶段 2**，总投入约 4-5 小时。这足以提供清晰、有效的视觉反馈，让玩家感受到战斗的节奏和打击感。

---

## 八、特效资源文件清单

需要在 `assets/vfx/` 目录下准备的文件：

| 文件名 | 尺寸 | 说明 | 来源 |
|--------|------|------|------|
| `particle_spark.png` | 16x16 | 白色圆形粒子 | Kenney Particle Pack 或自制 |
| `particle_fire.png` | 16x16 | 橙色不规则粒子 | Kenney Particle Pack |
| `particle_poison.png` | 16x16 | 绿色圆形粒子 | Kenney Particle Pack |
| `particle_shield.png` | 16x16 | 蓝色菱形粒子 | Kenney Particle Pack |
| `hit_flash.tscn` | — | 命中闪光特效场景 | 自制（GPUParticles2D） |
| `damage_number.tscn` | — | 伤害数字弹出场景 | 自制（Label + Tween） |

> 所有粒子纹理都可以用一张 16x16 白色圆点的 PNG 替代，通过 GPUParticles2D 的 `modulate` 属性着色。
