# 战斗动画系统规划

> 目标: 让战斗更加生动、有打击感，提升游戏体验。

---

## 一、现状分析

### 1.1 已有动画

| 动画 | 实现方式 | 效果 |
|------|---------|------|
| 卡牌打出 | Tween + 向上飘动淡出 | ✅ 已有 |
| 敌人受击 | 敌人闪红 + 水平抖动 | ✅ 已有 |
| 伤害数字 | 向上飘动 + 淡出 | ✅ 已有 |
| 玩家面板闪烁 | 颜色闪烁 | ✅ 已有 |
| 卡牌音效 | AudioStreamPlayer | ✅ 已有 |

### 1.2 可用资源

```
assets/vfx/effects/
- hit_slash.png      # 斩击特效
- magic_burst.png    # 魔法爆发

assets/vfx/particles/
- particle_fire.png   # 火焰粒子
- particle_poison.png # 毒素粒子
- particle_shield.png # 护盾粒子
- particle_spark.png  # 火花粒子
```

---

## 二、待实现动画

### 2.1 高优先级

| 动画 | 说明 | 实现复杂度 |
|------|------|-----------|
| **攻击特效** | 斩击/火焰/毒素等命中效果 | 中 |
| **格挡特效** | 护盾闪烁 + 粒子 | 低 |
| **状态施加** | 图标弹出 + 粒子环绕 | 中 |
| **敌人死亡** | 缩小淡出 / 溶解效果 | 低 |
| **回合切换** | 能量条动画 + 文字提示 | 低 |

### 2.2 中优先级

| 动画 | 说明 | 实现复杂度 |
|------|------|-----------|
| 卡牌悬浮 | 鼠标悬停时卡牌放大上浮 | 低 |
| 抽牌动画 | 卡牌从抽牌堆飞入手牌 | 中 |
| 弃牌动画 | 卡牌飞入弃牌堆 | 中 |
| 力量变化 | 数字弹出 + 图标闪烁 | 低 |
| Boss 阶段切换 | 全屏特效 + 文字提示 | 高 |

### 2.3 低优先级（后期打磨）

| 动画 | 说明 |
|------|------|
| 背景动态 | 战斗背景微动 |
| 屏幕震动 | 大伤害时屏幕震动 |
| 慢动作 | 关键时刻时间减速 |

---

## 三、实现方案

### 3.1 动画管理器设计

创建 `VFXManager` 单例，统一管理所有战斗特效：

```gdscript
# scripts/vfx/vfx_manager.gd
extends Node

# 特效池
var _effect_pool: Dictionary = {}

# 播放攻击特效
func play_attack_effect(type: String, position: Vector2) -> void:
    match type:
        "slash": _spawn_slash_effect(position)
        "fire": _spawn_fire_effect(position)
        "poison": _spawn_poison_effect(position)
        _: _spawn_default_effect(position)

# 播放格挡特效
func play_block_effect(position: Vector2, amount: int) -> void:
    pass

# 播放状态施加特效
func play_status_effect(status_id: String, position: Vector2) -> void:
    pass

# 播放数字弹出
func spawn_floating_number(value: int, position: Vector2, color: Color) -> void:
    pass
```

### 3.2 攻击特效实现

```gdscript
func _spawn_slash_effect(pos: Vector2) -> void:
    var sprite := TextureRect.new()
    sprite.texture = preload("res://assets/vfx/effects/hit_slash.png")
    sprite.global_position = pos
    sprite.pivot_offset = sprite.size * 0.5
    sprite.modulate = Color.WHITE
    add_child(sprite)
    
    var tween := create_tween()
    tween.set_parallel(true)
    tween.tween_property(sprite, "scale", Vector2(1.5, 1.5), 0.2)
    tween.tween_property(sprite, "modulate:a", 0.0, 0.25)
    tween.tween_property(sprite, "rotation", 0.3, 0.15)
    tween.finished.connect(sprite.queue_free)
```

### 3.3 粒子系统

使用 Godot 内置 GPUParticles2D：

```gdscript
func _create_fire_particles(pos: Vector2) -> GPUParticles2D:
    var particles := GPUParticles2D.new()
    particles.texture = preload("res://assets/vfx/particles/particle_fire.png")
    particles.global_position = pos
    particles.emitting = true
    particles.one_shot = true
    particles.explosiveness = 0.8
    particles.amount = 15
    particles.lifetime = 0.4
    
    # 配置粒子属性
    var mat := ParticleProcessMaterial.new()
    mat.direction = Vector3(0, -1, 0)
    mat.initial_velocity_min = 50.0
    mat.initial_velocity_max = 100.0
    mat.scale_min = 0.3
    mat.scale_max = 0.8
    particles.process_material = mat
    
    return particles
```

### 3.4 动画队列系统

防止多个动画同时播放导致混乱：

```gdscript
var _animation_queue: Array = []
var _is_playing := false

func queue_animation(callback: Callable) -> void:
    _animation_queue.append(callback)
    if not _is_playing:
        _process_next_animation()

func _process_next_animation() -> void:
    if _animation_queue.is_empty():
        _is_playing = false
        return
    
    _is_playing = true
    var callback: Callable = _animation_queue.pop_front()
    callback.call()
    
    # 等待一段时间后处理下一个
    await get_tree().create_timer(0.15).timeout
    _process_next_animation()
```

---

## 四、集成到 BattleScene

### 4.1 修改 combat_event 处理

```gdscript
func _on_combat_event(event: Dictionary) -> void:
    match str(event.get("type", "")):
        "enemy_damage":
            var enemy_index := int(event.get("enemy_index", -1))
            var damage := int(event.get("value", 0))
            var blocked := int(event.get("blocked", 0))
            
            # 播放攻击特效
            var pos := _get_enemy_center(enemy_index)
            VFXManager.play_attack_effect("slash", pos)
            
            # 播放伤害数字
            _spawn_enemy_damage_text(enemy_index, damage, blocked)
            
        "player_damage":
            _flash_player_panel()
            _spawn_player_damage_text(...)
            
        "enemy_block":
            var pos := _get_enemy_center(enemy_index)
            VFXManager.play_block_effect(pos, int(event.get("value", 0)))
            
        "status_applied":
            var status_id := str(event.get("status_id", ""))
            var pos := _get_target_position(event)
            VFXManager.play_status_effect(status_id, pos)
```

### 4.2 新增事件类型

在 EffectRunner 中添加事件发送：

```gdscript
# 伤害后发送特效事件
battle.combat_event.emit({
    "type": "attack_effect",
    "effect_type": "slash",  # 或 "fire", "poison" 等
    "position": target_position
})

# 格挡获得时
battle.combat_event.emit({
    "type": "block_gained",
    "target": "player",  # 或 "enemy"
    "value": block_amount
})

# 状态施加时
battle.combat_event.emit({
    "type": "status_applied",
    "status_id": "poison",
    "target": "enemy",
    "target_index": 0,
    "stacks": 2
})
```

---

## 五、实现计划

### 阶段一：基础特效 (1-2小时)

- [ ] 创建 VFXManager 自动加载
- [ ] 实现斩击特效 (hit_slash.png)
- [ ] 实现魔法爆发特效 (magic_burst.png)
- [ ] 实现护盾粒子效果

### 阶段二：状态特效 (1小时)

- [ ] 力量变化特效
- [ ] 中毒粒子环绕
- [ ] 虚弱/易伤图标弹出

### 阶段三：UI 动画 (1小时)

- [ ] 卡牌悬浮放大
- [ ] 敌人死亡动画
- [ ] 回合切换提示

### 阶段四：高级效果 (可选)

- [ ] Boss 阶段切换特效
- [ ] 屏幕震动
- [ ] 慢动作系统

---

## 六、验收标准

1. **打击感** - 攻击时有明显的视觉反馈
2. **流畅性** - 动画不影响游戏帧率
3. **可读性** - 玩家能清晰看到发生了什么
4. **不干扰** - 动画不阻挡玩家操作

---

## 七、风险与缓解

| 风险 | 缓解 |
|------|------|
| 动画过多影响性能 | 使用对象池复用 |
| 动画时间过长拖慢战斗 | 控制单个动画在 0.3s 内 |
| 粒子效果过于花哨 | 保持简约风格 |
