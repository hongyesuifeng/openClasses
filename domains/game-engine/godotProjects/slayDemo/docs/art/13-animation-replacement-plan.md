# 动画序列帧替换计划

> 生成日期: 2026-06-04  
> 目的: 梳理游戏中哪些表现可以改为动画序列帧替代静态图和简单 Tween

---

## 一、当前 Tween 动画盘点

### 1.1 战斗场景 (battle_scene.gd)

| 动画 | 当前实现 | 代码位置 | 效果 |
|------|---------|---------|------|
| 按钮悬停 | scale 1.12 + y-8px | `_on_hand_mouse_exited` | 卡牌上浮 |
| 按钮恢复 | scale 1.0 + y+8px | `_on_hand_mouse_exited` | 卡牌归位 |
| 伤害数字飘动 | y-42px + fade out | `_spawn_damage_text` | 向上飘动消失 |
| 受击抖动 | x ±10px (4次) | `_shake_target` | 水平抖动 |
| 受击闪烁 | modulate 颜色变化 | `_shake_target` | 红→白 |
| 玩家受伤闪烁 | modulate 淡黄→白 | `_on_combat_event` | 面板闪烁 |
| 文字淡入淡出 | alpha 0→1→0 | `_show_banner` | 回合提示 |

### 1.2 VFX 场景 (vfx_manager.gd)

| 动画 | 当前实现 | 代码位置 | 效果 |
|------|---------|---------|------|
| 斩击特效 | scale 1.3 + fade | `play_slash_effect` | 斩击放大消失 |
| 闪白特效 | scale 2.0 + fade | `play_flash_effect` | 全屏闪白 |

---

## 二、可用序列帧替换的场景

### 2.1 敌人动画（高优先级）

#### 当前状态
- **所有敌人仅有单帧 idle 立绘**
- 攻击/受伤/死亡全部用 Tween 模拟

#### 替换方案

**普通敌人动画帧**：

| 敌人类型 | 动画 | 帧数建议 | 命名规范 |
|---------|------|---------|---------|
| slime | idle | 4-6帧 | `enemy_slime_idle_001.png` ~ `_004.png` |
| | attack | 3-5帧 | `enemy_slime_attack_001.png` ~ `_003.png` |
| | hurt | 1-2帧 | `enemy_slime_hurt.png` |
| | death | 4-6帧 | `enemy_slime_death_001.png` ~ `_004.png` |

**实现方式**：
```gdscript
# 使用 AnimatedSprite2D 替代 TextureRect
var enemy_sprite := AnimatedSprite2D.new()
enemy_sprite.sprites = {
    "idle": preload("res://assets/enemies/slime/idle.tres"),  # SpriteFrames 资源
    "attack": preload("res://assets/enemies/slime/attack.tres"),
    "hurt": preload("res://assets/enemies/slime/hurt.tres"),
    "death": preload("res://assets/enemies/slime/death.tres")
}
```

**优先级**：
1. **P0**：攻击动画（最频繁，影响打击感）
2. **P1**：死亡动画（反馈感强）
3. **P2**：受伤动画（可简化为单帧）

---

### 2.2 玩家动画（高优先级）

#### 当前状态
- `player_warrior_idle.png` 仅单帧
- 攻击/受伤/格挡无动画

#### 替换方案

| 动作 | 帧数建议 | 命名规范 | 说明 |
|------|---------|---------|------|
| idle | 4-6帧循环 | `player_warrior_idle_001.png` ~ `_006.png` | 呼吸感 |
| attack | 4-6帧 | `player_warrior_attack_001.png` ~ `_006.png` | 武器挥动 |
| hurt | 1-2帧 | `player_warrior_hurt.png` | 受击姿态 |
| block | 2-3帧 | `player_warrior_block_001.png` ~ `_003.png` | 举盾防御 |

**实现方式**：
```gdscript
# battle_scene.gd 中的玩家头像
var player_sprite := AnimatedSprite2D.new()
player_sprite.sprite_frames = preload("res://assets/player/sprites/player_animations.tres")
player_sprite.animation = "idle"
player_sprite.play()
```

---

### 2.3 卡牌打出动画（中优先级）

#### 当前实现
```gdscript
# 简单的向上飘动 + 淡出
tween.tween_property(card_view, "global_position:y", card_view.global_position.y - 80, 0.3)
tween.tween_property(card_view, "modulate:a", 0.0, 0.3)
```

#### 替换方案
**方案 A**：增强 Tween（低成本）
- 添加旋转（从 -15° 到 15°）
- 添加缩放（先放大 1.2 倍再缩小）
- 添加拖尾特效

**方案 B**：序列帧（高成本）
- 创建卡牌"燃烧/粉碎"动画帧
- 4-6 帧分解动画

**建议**：采用方案 A（增强 Tween），性价比更高

---

### 2.4 抽牌/弃牌动画（中优先级）

#### 当前状态
- **无动画**，卡牌直接出现在手牌中

#### 替换方案
**抽牌动画**：
```gdscript
# 从抽牌堆飞入手牌
func animate_draw_card(card_view: Control, target_position: Vector2) -> void:
    card_view.global_position = _draw_pile_global_position
    var tween := create_tween()
    tween.set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_CUBIC)
    tween.tween_property(card_view, "global_position", target_position, 0.4)
    tween.parallel().tween_property(card_view, "rotation", 0.0, 0.4).from(180.0)
    tween.parallel().tween_property(card_view, "scale", Vector2.ONE, 0.4).from(Vector2(0.5, 0.5))
```

**弃牌动画**：
```gdscript
# 飞向弃牌堆 + 旋转缩小
func animate_discard_card(card_view: Control) -> void:
    var tween := create_tween()
    tween.set_parallel(true)
    tween.tween_property(card_view, "global_position", _discard_pile_position, 0.3)
    tween.tween_property(card_view, "rotation", 360.0, 0.3)
    tween.tween_property(card_view, "scale", Vector2(0.3, 0.3), 0.3)
    tween.tween_property(card_view, "modulate:a", 0.0, 0.3)
```

---

### 2.5 状态施加动画（中优先级）

#### 当前状态
- **无动画**，状态图标直接出现在 HUD 中

#### 替换方案
**图标弹出效果**：
```gdscript
func animate_status_apply(status_icon: TextureRect) -> void:
    status_icon.scale = Vector2(0.5, 0.5)
    status_icon.modulate.a = 0.0
    
    var tween := create_tween()
    tween.set_parallel(true)
    tween.tween_property(status_icon, "scale", Vector2(1.2, 1.2), 0.15).set_ease(Tween.EASE_OUT)
    tween.tween_property(status_icon, "modulate:a", 1.0, 0.15)
    tween.tween_property(status_icon, "scale", Vector2.ONE, 0.1).set_delay(0.15)
```

**配合粒子效果**：
- 力量：向上飞散的金色粒子
- 中毒：绿色毒雾环绕
- 护盾：蓝色护盾光圈

---

### 2.6 敌人死亡动画（P1）

#### 当前实现
```gdscript
# 简单淡出
tween.tween_property(enemy_view, "modulate:a", 0.0, 0.5)
```

#### 替换方案

**方案 A**：增强 Tween（快速实现）
```gdscript
var tween := create_tween()
tween.set_parallel(true)
tween.tween_property(enemy_view, "scale", Vector2(1.5, 0.3), 0.4)  # 压扁效果
tween.tween_property(enemy_view, "rotation", 0.3, 0.4)  # 轻微倾斜
tween.tween_property(enemy_view, "modulate:a", 0.0, 0.4)
```

**方案 B**：序列帧（完整体验）
- 4-6 帧死亡动画（分解/消散/倒塌）
- 使用 `AnimatedSprite2D` 播放

**建议**：先实现方案 A，后期可升级为方案 B

---

### 2.7 Boss 阶段切换动画（P2）

#### 当前状态
- **无动画**，阶段切换无提示

#### 替换方案
**全屏特效 + 文字提示**：
```gdscript
func animate_boss_phase_transition(phase_num: int) -> void:
    # 全屏闪红/闪紫
    var flash := ColorRect.new()
    flash.color = Color(0.5, 0.0, 0.0, 0.0)
    flash.set_anchors_preset(Control.PRESET_FULL_RECT)
    add_child(flash)
    
    var tween := create_tween()
    tween.parallel().tween_property(flash, "color:a", 0.6, 0.1)
    tween.parallel().tween_property(flash, "color:a", 0.0, 0.5).set_delay(0.1)
    tween.finished.connect(flash.queue_free)
    
    # 阶段文字
    var phase_label := Label.new()
    phase_label.text = "阶段 %d 激活！" % phase_num
    phase_label.add_theme_font_size_override("font_size", 48)
    phase_label.add_theme_color_override("font_color", Color.RED)
    phase_label.z_index = 100
    # ... 居中显示 + 向上飘动消失
```

---

### 2.8 回合切换横幅（P1）

#### 当前实现
```gdscript
# 简单的淡入淡出
tween.tween_property(label, "modulate:a", 1.0, 0.2)
tween.tween_property(label, "modulate:a", 0.0, 0.3)
```

#### 替换方案
**增强版回合横幅**：
```gdscript
func show_turn_banner(text: String, color: Color) -> void:
    var banner := PanelContainer.new()
    # ... 设置样式
    
    var tween := create_tween()
    # 1. 从上方滑入
    banner.position.y = -100
    tween.tween_property(banner, "position:y", 50.0, 0.3).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
    
    # 2. 停留 1 秒
    tween.tween_interval(1.0)
    
    # 3. 向上滑出
    tween.tween_property(banner, "position:y", -100.0, 0.25).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_IN)
    tween.finished.connect(banner.queue_free)
```

---

### 2.9 能量获得动画（P2）

#### 当前状态
- **无动画**，能量直接增加

#### 替换方案
**能量水晶充光效果**：
```gdscript
func animate_energy_gained(amount: int) -> void:
    var crystal := _energy_icon  # TextureRect
    var original_scale := crystal.scale
    
    # 闪烁放大
    var tween := create_tween()
    tween.set_parallel(true)
    tween.tween_property(crystal, "scale", original_scale * 1.5, 0.15).set_trans(Tween.TRANS_ELASTIC).set_ease(Tween.EASE_OUT)
    tween.tween_property(crystal, "modulate", Color(1.5, 2.0, 1.0), 0.1)
    tween.tween_property(crystal, "modulate", Color.WHITE, 0.2).set_delay(0.1)
    tween.tween_property(crystal, "scale", original_scale, 0.2).set_delay(0.15)
```

---

### 2.10 地图节点选择动画（P2）

#### 当前状态
- **无动画**，选中节点直接跳转

#### 替换方案
**路径连线高亮**：
- 选中节点时，高亮从当前位置到目标节点的路径
- 路径连线从起点逐渐"生长"到终点
- 目标节点脉冲放大

---

## 三、不推荐用序列帧的场景

### 3.1 伤害数字飘动

**原因**：
- 数字内容动态变化，不适合预渲染序列帧
- 当前 Tween 实现（向上飘动 + 淡出）已经足够

**优化建议**：
- 添加随机水平偏移避免重叠
- 根据伤害大小调整字体大小

---

### 3.2 UI 悬停效果

**原因**：
- 按钮样式可能随时调整
- Tween 动画更灵活，易于统一调整

**优化建议**：
- 在 Godot Theme 中统一配置悬停动画
- 使用 `AnimationPlayer` 资源复用动画配置

---

## 四、实现优先级

### P0 — 核心战斗体验

| 动画 | 当前问题 | 实现方式 | 工作量 |
|------|---------|---------|--------|
| 敌人攻击动画 | 无动画，打击感差 | 序列帧 3-5帧 | 中（需美术资源） |
| 玩家攻击动画 | 无动画 | 序列帧 4-6帧 | 中 |
| 抽牌/弃牌动画 | 无动画 | 增强 Tween | 低 |

### P1 — 明显提升体验

| 动画 | 当前问题 | 实现方式 | 工作量 |
|------|---------|---------|--------|
| 敌人死亡动画 | 仅淡出 | 增强 Tween / 序列帧 | 低/中 |
| 状态施加动画 | 无动画 | 增强 Tween + 粒子 | 低 |
| 回合横幅 | 淡入淡出单调 | 滑入滑出 | 低 |

### P2 — 锦上添花

| 动画 | 当前问题 | 实现方式 | 工作量 |
|------|---------|---------|--------|
| Boss 阶段切换 | 无提示 | 全屏特效 + 文字 | 中 |
| 能量获得动画 | 无反馈 | 缩放 + 闪烁 | 低 |
| 地图节点选择 | 无高亮 | 路径动画 | 中 |

---

## 五、技术实现建议

### 5.1 使用 SpriteFrames 资源

```gdscript
# 创建 SpriteFrames 资源（.tres）
extends SpriteFrames
# 在编辑器中导入序列帧，设置帧率、循环模式

# 代码中使用
var sprite := AnimatedSprite2D.new()
sprite.sprite_frames = preload("res://assets/player/sprites/player_animations.tres")
sprite.animation = "idle"
sprite.play()
```

### 5.2 动画回调处理

```gdscript
# 监听动画完成
sprite.animation_finished.connect(func():
    if sprite.animation == "attack":
        sprite.play("idle")
)

# 监听动画帧
sprite.frame_changed.connect(func():
    if sprite.animation == "attack" and sprite.frame == 2:
        _apply_damage()  # 在特定帧触发伤害
)
```

### 5.3 性能优化

**对象池复用**：
```gdscript
# 预创建 AnimatedSprite2D 对象池
var _enemy_sprite_pool: Array[AnimatedSprite2D] = []

func get_enemy_sprite() -> AnimatedSprite2D:
    if _enemy_sprite_pool.is_empty():
        return AnimatedSprite2D.new()
    return _enemy_sprite_pool.pop_back()

func return_enemy_sprite(sprite: AnimatedSprite2D) -> void:
    sprite.stop()
    sprite.visible = false
    _enemy_sprite_pool.push_back(sprite)
```

---

## 六、资源准备清单

### 需要的序列帧资源

| 角色 | idle | attack | hurt | death | 帧数建议 |
|------|------|--------|------|-------|---------|
| 玩家战士 | ✅ | ✅ | ✅ | ❌ | idle:4-6, attack:4-6, hurt:1-2 |
| 史莱姆 | ✅ | ✅ | ✅ | ✅ | 各 3-6 帧 |
| 蝙蝠 | ✅ | ✅ | ✅ | ✅ | 各 3-6 帧 |
| 蘑菇 | ✅ | ✅ | ✅ | ✅ | 各 3-6 帧 |
| 石像鬼 | ✅ | ✅ | ✅ | ✅ | 各 3-6 帧 |
| 骷髅 | ✅ | ✅ | ✅ | ✅ | 各 3-6 帧 |
| 法师 | ✅ | ✅ | ✅ | ✅ | 各 3-6 帧 |
| 骑士（精英） | ✅ | ✅ | ✅ | ✅ | 各 4-8 帧 |
| 龙王（Boss） | ✅ | ✅ | ✅ | ✅ | 各 6-10 帧 |

**总计**：约 150-300 帧图（按每角色 4 种动作 × 4-6 帧 × 10 角色）

---

> 下一步：与美术资源问题文档结合，制定分阶段优化计划
