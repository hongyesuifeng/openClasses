# 序列帧动画改造——深度分析与需求清单

## Context

《甜心迷宫》世界观替换完成，新美术资源全部为静态单帧 PNG。游戏内所有动态表现依赖 Tween 驱动（放大缩小、抖动、透明度变化），缺乏真正的序列帧动画。
目标：梳理每个可改造点的当前实现方式、渲染区域尺寸、动画节奏，给出完整的序列帧需求规格——便于直接交给 AI 基于静态图生成序列帧。

---

## 一、当前静态图与渲染区域全览

### 敌人精灵（10 张源图 → 14 种敌人）

| art_key | 源图尺寸 | 代码渲染区域 | 使用该 key 的敌人 |
|---------|---------|------------|----------------|
| enemy_slime | 128×128 | 202×165（在 260×252 按钮内，offset 29,0）| 布丁怪、暴躁布丁 |
| enemy_slime_king | 160×160 | 同上 | 布丁女王（精英）|
| enemy_bat | 128×128 | 同上 | 泡泡蝙蝠 |
| enemy_shadow_mage | 128×128 | 同上 | 见习巫女、诅咒魔女（精英）|
| enemy_orc_berserker | 160×160 | 同上 | 暴走熊 |
| enemy_skeleton | 128×128 | 同上 | 星座魔女 |
| enemy_gargoyle | 128×128 | 同上 | 布偶守卫、石头布偶哨兵（精英）、狂暴糖果熊（精英）|
| enemy_corrupted_knight | 200×200 | 同上 | 棉花甲士、甜心骑士长（Boss）|
| enemy_ancient_dragon | 200×200 | 同上 | 星愿守护龙（Boss）|
| enemy_mushroom | 128×128 | 同上 | （目前无敌人使用，保留兜底）|

> **渲染核心参数**：敌人精灵在 260×252 的按钮面板内，TextureRect 位置 (29, 0)，尺寸 202×165，`STRETCH_KEEP_ASPECT_CENTERED`——**实际展示区域约 165×165**。

### 玩家角色

| 资源 | 尺寸 | 代码渲染区域 |
|------|------|------------|
| player_warrior_idle.png | 128×128 | `custom_minimum_size = Vector2(72, 68)`，`STRETCH_KEEP_ASPECT_CENTERED` |
| player_portrait.png | 96×96 | 未在战斗场景使用（仅 UIGallery 展示）|

### VFX 特效资源

| 资源 | 尺寸 | 用途 | Tween 时长 |
|------|------|------|-----------|
| hit_slash.png | 128×128 | 斩击特效主图，pivot (64,64)，scale 1→1.3，rotation 0→0.4rad | 0.2s |
| magic_burst.png | 128×128 | 魔法爆发主图，pivot (64,64)，scale 1→1.5 | 0.25s |
| particle_fire.png | 32×32 | GPUParticles2D 粒子纹理，8粒子，lifetime 0.35s | — |
| particle_poison.png | 32×32 | GPUParticles2D 粒子纹理，8粒子 | — |
| particle_shield.png | 32×32 | GPUParticles2D 粒子纹理，12粒子 | — |
| particle_spark.png | 32×32 | GPUParticles2D 粒子纹理，10粒子 | — |

### UI 可动化元素

| 元素 | 资源 | 尺寸 | 当前状态 | 动画潜力 |
|------|------|------|---------|---------|
| 能量水晶 | ui_energy_crystal.png | 36×36 | 静态 | 脉冲循环 |
| 能量底座 | ui_energy_base.png | 80×80 | 未使用 | 可配合水晶做底座动画 |
| 意图图标 | intent_*.png（6种）| 48×48 | 静态 | 攻击意图可做轻微抖动循环 |
| 卡牌费用水晶 | cost_crystal.png | 40×40 | 未接入 | 闪烁循环 |
| 卡牌模板 | card_template_*.png | 180×250 | 静态 | 选中时边框光效 |

---

## 二、现有 Tween 动画分类

### A 类：目标是换成序列帧（视觉提升明显）

| 动画 | 位置 | 当前 Tween 实现 | 改为序列帧后效果 |
|------|------|--------------|--------------|
| 敌人受击 | battle_scene `_hit_enemy_feedback` | 位移抖动 ±10px + modulate 红色闪 0.12s | 受击变形帧（压扁拉伸）+ 光效 |
| 敌人 idle | battle_scene 无 | 完全静态 | 呼吸/浮动循环 |
| 玩家受击 | battle_scene `_flash_player_panel` | 面板 modulate 黄色闪 0.18s | 角色压缩变形帧 |
| 玩家 idle | battle_scene 无 | 完全静态 | 呼吸循环 |
| 攻击特效 slash | vfx_manager | scale 1→1.3 + rotation + alpha 0.2s | 斩光展开消散序列 |
| 攻击特效 magic | vfx_manager | scale 1→1.5 + alpha 0.25s | 魔法爆炸展开序列 |
| 死亡特效 | vfx_manager `_spawn_death_dissolve` | ColorRect（红色方块）收缩 0.4s | Q版爆炸散开序列 |

### B 类：保留 Tween，叠加序列帧（增强不替换）

| 动画 | 位置 | 建议 |
|------|------|------|
| 伤害数字飘字 | battle_scene `_spawn_damage_text` | Tween 位移保留，数字背景可换序列帧气泡 |
| 卡牌打出回响 | battle_scene `_spawn_card_echo` | Tween 保留，可叠加星光序列帧 |
| 回合横幅 | battle_scene `_spawn_turn_banner` | 文字 Tween 保留即可，足够清晰 |
| 格挡特效 | vfx_manager `_spawn_shield_particles` | 粒子保留，可替换粒子纹理 particle_shield 为序列帧单帧切片 |
| 治疗特效 | vfx_manager `play_heal_effect` | 粒子保留，可替换 particle_spark 纹理 |

### C 类：不需要改造（Tween 已够用）

| 动画 | 原因 |
|------|------|
| 卡牌悬浮放大 / 缩回 | scale Tween 完全够用，改序列帧反而变复杂 |
| BGM 音量淡入淡出 | 纯音频处理，无视觉 |
| 卡牌选中缩放 | Tween scale 足够清晰 |
| 地图过渡 | 场景级别，非序列帧范畴 |

---

## 三、序列帧规格与 AI 生图需求清单

### 全局约定

- **格式**：每帧独立 PNG，RGBA 透明背景，文件命名 `frame_000.png`、`frame_001.png`…
- **风格**：Q版马卡龙粉彩，圆润可爱，与现有静态图风格一致
- **参考图**：每条需求附带"使用哪张现有静态图作为参考"

---

### P0 组：敌人角色动画（最高优先级，直接影响战斗感知）

**规格说明：**
敌人在代码中展示区域约 165×165px（202×165 区域内保持比例缩放），序列帧建议原始尺寸与对应静态图一致。

---

#### E01 — enemy_slime idle（布丁怪 / 暴躁布丁）

| 项目 | 规格 |
|------|------|
| 参考静态图 | `assets/enemies/slime/enemy_slime_idle.png`（128×128）|
| 每帧尺寸 | 128×128 px |
| 帧数 | 4 帧 |
| 循环 | 是 |
| 帧率 | 6 fps（每帧约 0.16s）|
| 总时长 | 0.66s / 循环 |
| 动画描述 | 果冻身体轻微上下浮动（振幅约 4px），眼睛配合眨动一次 |
| 目录 | `assets/enemies/slime/idle/` |

#### E02 — enemy_slime hit（布丁怪 / 暴躁布丁 受击）

| 项目 | 规格 |
|------|------|
| 参考静态图 | `assets/enemies/slime/enemy_slime_idle.png` |
| 每帧尺寸 | 128×128 px |
| 帧数 | 5 帧 |
| 循环 | 否（播完停在第1帧或交由代码切回 idle）|
| 帧率 | 24 fps |
| 总时长 | 0.2s |
| 动画描述 | 第1帧：被击中向右移 6px 并压扁（宽+10% 高-10%）；第2-3帧：红色或白色闪光叠加全身；第4帧：弹回；第5帧：恢复正常 |
| 目录 | `assets/enemies/slime/hit/` |

---

#### E03 — enemy_slime_king idle（布丁女王 精英）

| 项目 | 规格 |
|------|------|
| 参考静态图 | `assets/enemies/slime_king/enemy_slime_king_idle.png`（160×160）|
| 每帧尺寸 | 160×160 px |
| 帧数 | 4 帧 |
| 循环 | 是 |
| 帧率 | 5 fps |
| 总时长 | 0.8s / 循环 |
| 动画描述 | 皇冠轻微摇晃，身体缓慢浮动，偶尔发出一粒小星星粒子（可用纯色圆点代替）|
| 目录 | `assets/enemies/slime_king/idle/` |

#### E04 — enemy_slime_king hit（布丁女王 受击）

| 项目 | 规格 |
|------|------|
| 参考静态图 | `assets/enemies/slime_king/enemy_slime_king_idle.png` |
| 每帧尺寸 | 160×160 px |
| 帧数 | 6 帧 |
| 循环 | 否 |
| 帧率 | 24 fps |
| 总时长 | 0.25s |
| 动画描述 | 受击压扁变形更明显（精英应有更夸张的受击反馈），皇冠歪斜，全身闪白，弹回 |
| 目录 | `assets/enemies/slime_king/hit/` |

---

#### E05 — enemy_bat idle（泡泡蝙蝠）

| 项目 | 规格 |
|------|------|
| 参考静态图 | `assets/enemies/bat/enemy_bat_idle.png`（128×128）|
| 每帧尺寸 | 128×128 px |
| 帧数 | 6 帧 |
| 循环 | 是 |
| 帧率 | 10 fps |
| 总时长 | 0.6s / 循环 |
| 动画描述 | 翅膀上下扇动（翅膀有3个开合状态），身体随之轻微上下移动约 3px |
| 目录 | `assets/enemies/bat/idle/` |

#### E06 — enemy_bat hit（泡泡蝙蝠 受击）

| 项目 | 规格 |
|------|------|
| 参考静态图 | `assets/enemies/bat/enemy_bat_idle.png` |
| 每帧尺寸 | 128×128 px |
| 帧数 | 4 帧 |
| 循环 | 否 |
| 帧率 | 24 fps |
| 总时长 | 0.17s |
| 动画描述 | 翅膀折叠收拢，身体闪白，翅膀展开，恢复 |
| 目录 | `assets/enemies/bat/hit/` |

---

#### E07 — enemy_shadow_mage idle（见习巫女 / 诅咒魔女）

| 项目 | 规格 |
|------|------|
| 参考静态图 | `assets/enemies/shadow_mage/enemy_shadow_mage_idle.png`（128×128）|
| 每帧尺寸 | 128×128 px |
| 帧数 | 4 帧 |
| 循环 | 是 |
| 帧率 | 5 fps |
| 总时长 | 0.8s / 循环 |
| 动画描述 | 裙摆轻微飘动，魔法书/法杖有微弱发光闪烁，头发轻飘 |
| 目录 | `assets/enemies/shadow_mage/idle/` |

#### E08 — enemy_shadow_mage hit（见习巫女 / 诅咒魔女 受击）

| 项目 | 规格 |
|------|------|
| 参考静态图 | `assets/enemies/shadow_mage/enemy_shadow_mage_idle.png` |
| 每帧尺寸 | 128×128 px |
| 帧数 | 5 帧 |
| 循环 | 否 |
| 帧率 | 24 fps |
| 总时长 | 0.2s |
| 动画描述 | 向后倾斜，帽子偏歪，全身闪白，恢复站姿 |
| 目录 | `assets/enemies/shadow_mage/hit/` |

---

#### E09 — enemy_orc_berserker idle（暴走熊）

| 项目 | 规格 |
|------|------|
| 参考静态图 | `assets/enemies/orc_berserker/enemy_orc_berserker_idle.png`（160×160）|
| 每帧尺寸 | 160×160 px |
| 帧数 | 4 帧 |
| 循环 | 是 |
| 帧率 | 5 fps |
| 总时长 | 0.8s / 循环 |
| 动画描述 | 身体左右轻微摆动（愤怒待机感），拳头偶尔握紧松开 |
| 目录 | `assets/enemies/orc_berserker/idle/` |

#### E10 — enemy_orc_berserker hit（暴走熊 受击）

| 项目 | 规格 |
|------|------|
| 参考静态图 | `assets/enemies/orc_berserker/enemy_orc_berserker_idle.png` |
| 每帧尺寸 | 160×160 px |
| 帧数 | 5 帧 |
| 循环 | 否 |
| 帧率 | 24 fps |
| 总时长 | 0.2s |
| 动画描述 | 身体向后推，表情变怒，闪白，向前弹回 |
| 目录 | `assets/enemies/orc_berserker/hit/` |

---

#### E11 — enemy_gargoyle idle（布偶守卫 / 石头布偶哨兵 / 狂暴糖果熊）

| 项目 | 规格 |
|------|------|
| 参考静态图 | `assets/enemies/gargoyle/enemy_gargoyle_idle.png`（128×128）|
| 每帧尺寸 | 128×128 px |
| 帧数 | 4 帧 |
| 循环 | 是 |
| 帧率 | 4 fps |
| 总时长 | 1.0s / 循环（守卫节奏慢）|
| 动画描述 | 眼睛缓慢发光（明暗交替），身体几乎不动（守卫感），偶尔眨眼 |
| 目录 | `assets/enemies/gargoyle/idle/` |

#### E12 — enemy_gargoyle hit（布偶守卫系列 受击）

| 项目 | 规格 |
|------|------|
| 参考静态图 | `assets/enemies/gargoyle/enemy_gargoyle_idle.png` |
| 每帧尺寸 | 128×128 px |
| 帧数 | 5 帧 |
| 循环 | 否 |
| 帧率 | 24 fps |
| 总时长 | 0.2s |
| 动画描述 | 轻微后仰，裂纹短暂出现（Q版），闪白，恢复 |
| 目录 | `assets/enemies/gargoyle/hit/` |

---

#### E13 — enemy_skeleton idle（星座魔女）

| 项目 | 规格 |
|------|------|
| 参考静态图 | `assets/enemies/skeleton/enemy_skeleton_idle.png`（128×128）|
| 每帧尺寸 | 128×128 px |
| 帧数 | 4 帧 |
| 循环 | 是 |
| 帧率 | 6 fps |
| 总时长 | 0.67s / 循环 |
| 动画描述 | 头顶星座符号缓慢旋转，裙摆轻摆，手持魔法道具有微光 |
| 目录 | `assets/enemies/skeleton/idle/` |

#### E14 — enemy_skeleton hit（星座魔女 受击）

| 项目 | 规格 |
|------|------|
| 参考静态图 | `assets/enemies/skeleton/enemy_skeleton_idle.png` |
| 每帧尺寸 | 128×128 px |
| 帧数 | 5 帧 |
| 循环 | 否 |
| 帧率 | 24 fps |
| 总时长 | 0.2s |
| 动画描述 | 星座符号散乱，向后倾斜，闪白，恢复 |
| 目录 | `assets/enemies/skeleton/hit/` |

---

#### E15 — enemy_corrupted_knight idle（棉花甲士 / 甜心骑士长 Boss）

| 项目 | 规格 |
|------|------|
| 参考静态图 | `assets/enemies/corrupted_knight/enemy_corrupted_knight_idle.png`（200×200）|
| 每帧尺寸 | 200×200 px |
| 帧数 | 4 帧 |
| 循环 | 是 |
| 帧率 | 4 fps |
| 总时长 | 1.0s / 循环 |
| 动画描述 | 盔甲上的爱心装饰轻微发光，盾牌偶尔反光，站姿庄重基本不动 |
| 目录 | `assets/enemies/corrupted_knight/idle/` |

#### E16 — enemy_corrupted_knight hit（棉花甲士 / 甜心骑士长 受击）

| 项目 | 规格 |
|------|------|
| 参考静态图 | `assets/enemies/corrupted_knight/enemy_corrupted_knight_idle.png` |
| 每帧尺寸 | 200×200 px |
| 帧数 | 6 帧 |
| 循环 | 否 |
| 帧率 | 24 fps |
| 总时长 | 0.25s |
| 动画描述 | Boss 受击更夸张：盾牌向后推、盔甲碎片短暂飞散（Q版爱心碎片）、闪白、恢复 |
| 目录 | `assets/enemies/corrupted_knight/hit/` |

---

#### E17 — enemy_ancient_dragon idle（星愿守护龙 Boss）

| 项目 | 规格 |
|------|------|
| 参考静态图 | `assets/enemies/ancient_dragon/enemy_ancient_dragon_idle.png`（200×200）|
| 每帧尺寸 | 200×200 px |
| 帧数 | 6 帧 |
| 循环 | 是 |
| 帧率 | 6 fps |
| 总时长 | 1.0s / 循环 |
| 动画描述 | 翅膀缓慢展合（小幅度），身上星光粒子偶尔闪烁，头部轻微摇摆 |
| 目录 | `assets/enemies/ancient_dragon/idle/` |

#### E18 — enemy_ancient_dragon hit（星愿守护龙 受击）

| 项目 | 规格 |
|------|------|
| 参考静态图 | `assets/enemies/ancient_dragon/enemy_ancient_dragon_idle.png` |
| 每帧尺寸 | 200×200 px |
| 帧数 | 6 帧 |
| 循环 | 否 |
| 帧率 | 24 fps |
| 总时长 | 0.25s |
| 动画描述 | 翅膀向后收拢、全身闪金色/白色光（Boss 档次）、怒目表情帧、弹回 |
| 目录 | `assets/enemies/ancient_dragon/hit/` |

---

### P0 组：玩家角色动画

#### P01 — 玩家 idle（魔法少女）

| 项目 | 规格 |
|------|------|
| 参考静态图 | `assets/player/sprites/player_warrior_idle.png`（128×128）|
| 每帧尺寸 | 128×128 px |
| 帧数 | 4 帧 |
| 循环 | 是 |
| 帧率 | 6 fps |
| 总时长 | 0.67s / 循环 |
| 代码渲染区域 | 72×68 px（STRETCH_KEEP_ASPECT_CENTERED）|
| 动画描述 | 裙摆轻飘，发丝飘动，手持魔法杖有微弱光芒跳动 |
| 目录 | `assets/player/sprites/idle/` |

#### P02 — 玩家受击

| 项目 | 规格 |
|------|------|
| 参考静态图 | `assets/player/sprites/player_warrior_idle.png` |
| 每帧尺寸 | 128×128 px |
| 帧数 | 4 帧 |
| 循环 | 否 |
| 帧率 | 24 fps |
| 总时长 | 0.17s |
| 动画描述 | 向后倾斜、表情皱眉、全身闪白/粉色、恢复正常 |
| 目录 | `assets/player/sprites/hit/` |

---

### P1 组：战斗特效序列帧

#### V01 — 斩击特效（slash）

| 项目 | 规格 |
|------|------|
| 参考静态图 | `assets/vfx/effects/hit_slash.png`（128×128）|
| 每帧尺寸 | 128×128 px |
| 帧数 | 8 帧 |
| 循环 | 否 |
| 帧率 | 32 fps |
| 总时长 | 0.25s |
| 代码中心点 | (64, 64)（即图片中心）|
| 动画描述 | 帧1-2：斩光从左上→右下划出（刀光展开）；帧3-5：全展开+白色放射光晕；帧6-8：渐渐消散扩散 |
| 目录 | `assets/vfx/slash/` |

#### V02 — 魔法爆发特效（magic）

| 项目 | 规格 |
|------|------|
| 参考静态图 | `assets/vfx/effects/magic_burst.png`（128×128）|
| 每帧尺寸 | 128×128 px |
| 帧数 | 8 帧 |
| 循环 | 否 |
| 帧率 | 32 fps |
| 总时长 | 0.25s |
| 代码中心点 | (64, 64) |
| 动画描述 | 帧1-2：中心出现小圆球；帧3-5：星光/魔法圆圈向外展开到最大；帧6-8：光圈消散，留下小星点飘散 |
| 目录 | `assets/vfx/magic/` |

#### V03 — 火焰特效（fire）

| 项目 | 规格 |
|------|------|
| 参考静态图 | `assets/vfx/particles/particle_fire.png`（32×32，当前粒子纹理）|
| 每帧尺寸 | 128×128 px |
| 帧数 | 8 帧 |
| 循环 | 否 |
| 帧率 | 28 fps |
| 总时长 | 0.29s |
| 动画描述 | Q版火焰爆炸：帧1-3 小火球出现并膨胀；帧4-5 橙红火焰最大展开（带卡通线稿感）；帧6-8 火焰收缩消散，留下几粒小火星 |
| 颜色范围 | 橙红 #FF7B1C → 黄色 #FFE566，边缘浅粉 |
| 目录 | `assets/vfx/fire/` |

#### V04 — 毒素特效（poison）

| 项目 | 规格 |
|------|------|
| 参考静态图 | `assets/vfx/particles/particle_poison.png`（32×32）|
| 每帧尺寸 | 128×128 px |
| 帧数 | 8 帧 |
| 循环 | 否 |
| 帧率 | 24 fps |
| 总时长 | 0.33s |
| 动画描述 | Q版毒泡：帧1-3 绿色泡泡从中心出现；帧4-5 泡泡们向外浮散展开（3-4个小泡泡）；帧6-8 泡泡逐个破裂消失，留下绿色水花小点 |
| 颜色范围 | 绿紫 #9B6FD6 → 薄荷绿 #7DC95E |
| 目录 | `assets/vfx/poison/` |

#### V05 — 死亡特效

| 项目 | 规格 |
|------|------|
| 参考静态图 | 无（当前是红色 ColorRect），风格参考现有敌人 |
| 每帧尺寸 | 160×160 px |
| 帧数 | 10 帧 |
| 循环 | 否 |
| 帧率 | 24 fps |
| 总时长 | 0.42s |
| 动画描述 | Q版爆炸消散：帧1-2 金色/彩色光圈向外爆发；帧3-5 爱心形状碎片/星星向四周飞散（符合甜心迷宫世界观）；帧6-8 碎片落下；帧9-10 只剩几粒小星点渐消 |
| 颜色范围 | 金色 #F4D76B + 粉色 #FF9EC8 + 淡紫 |
| 目录 | `assets/vfx/death/` |

#### V06 — 格挡特效

| 项目 | 规格 |
|------|------|
| 参考静态图 | `assets/vfx/particles/particle_shield.png`（32×32）|
| 每帧尺寸 | 96×96 px |
| 帧数 | 6 帧 |
| 循环 | 否 |
| 帧率 | 24 fps |
| 总时长 | 0.25s |
| 动画描述 | 蓝色盾牌光圈：帧1-2 中心出现盾形光；帧3-4 蓝色六边形/盾形放射展开；帧5-6 消散留下蓝色星点 |
| 颜色范围 | 蓝 #5BA8E5 → 浅蓝白 |
| 目录 | `assets/vfx/block/` |

#### V07 — 治疗特效

| 项目 | 规格 |
|------|------|
| 参考静态图 | `assets/vfx/particles/particle_spark.png`（32×32）|
| 每帧尺寸 | 96×96 px |
| 帧数 | 6 帧 |
| 循环 | 否 |
| 帧率 | 24 fps |
| 总时长 | 0.25s |
| 动画描述 | 爱心/十字绿光：帧1-2 中心绿色十字或爱心出现；帧3-4 向外散出小爱心/星星；帧5-6 消散 |
| 颜色范围 | 绿 #42F052 → 浅绿白 #D4FFD7 |
| 目录 | `assets/vfx/heal/` |

---

### P2 组：UI 动画（可选，视时间安排）

#### U01 — 能量水晶循环动画

| 项目 | 规格 |
|------|------|
| 参考静态图 | `assets/ui/icons/ui_energy_crystal.png`（36×36）|
| 每帧尺寸 | 36×36 px（或 64×64 更清晰）|
| 帧数 | 6 帧 |
| 循环 | 是 |
| 帧率 | 8 fps |
| 总时长 | 0.75s / 循环 |
| 动画描述 | 水晶内部光芒缓慢脉动（明→暗→明），表面偶尔有一道光晕扫过 |
| 目录 | `assets/ui/icons/energy_crystal_anim/` |

#### U02 — 卡牌费用水晶循环

| 项目 | 规格 |
|------|------|
| 参考静态图 | `assets/card/templates/cost_crystal.png`（40×40）|
| 每帧尺寸 | 40×40 px |
| 帧数 | 4 帧 |
| 循环 | 是 |
| 帧率 | 6 fps |
| 总时长 | 0.67s / 循环 |
| 动画描述 | 费用数字背景水晶微微闪烁，能量消耗时有短暂抖动（可做 use 动画 3 帧）|
| 目录 | `assets/card/templates/cost_crystal_anim/` |

---

## 四、汇总表

| 编号 | 名称 | 类型 | 帧数 | 每帧尺寸 | 帧率 | 时长 | 优先级 | 参考静态图 |
|------|------|------|------|---------|------|------|--------|----------|
| E01 | enemy_slime idle | 循环 | 4 | 128×128 | 6fps | 0.66s | P0 | slime/enemy_slime_idle.png |
| E02 | enemy_slime hit | 一次 | 5 | 128×128 | 24fps | 0.2s | P0 | slime/enemy_slime_idle.png |
| E03 | enemy_slime_king idle | 循环 | 4 | 160×160 | 5fps | 0.8s | P0 | slime_king/enemy_slime_king_idle.png |
| E04 | enemy_slime_king hit | 一次 | 6 | 160×160 | 24fps | 0.25s | P0 | slime_king/enemy_slime_king_idle.png |
| E05 | enemy_bat idle | 循环 | 6 | 128×128 | 10fps | 0.6s | P0 | bat/enemy_bat_idle.png |
| E06 | enemy_bat hit | 一次 | 4 | 128×128 | 24fps | 0.17s | P0 | bat/enemy_bat_idle.png |
| E07 | enemy_shadow_mage idle | 循环 | 4 | 128×128 | 5fps | 0.8s | P0 | shadow_mage/enemy_shadow_mage_idle.png |
| E08 | enemy_shadow_mage hit | 一次 | 5 | 128×128 | 24fps | 0.2s | P0 | shadow_mage/enemy_shadow_mage_idle.png |
| E09 | enemy_orc_berserker idle | 循环 | 4 | 160×160 | 5fps | 0.8s | P0 | orc_berserker/enemy_orc_berserker_idle.png |
| E10 | enemy_orc_berserker hit | 一次 | 5 | 160×160 | 24fps | 0.2s | P0 | orc_berserker/enemy_orc_berserker_idle.png |
| E11 | enemy_gargoyle idle | 循环 | 4 | 128×128 | 4fps | 1.0s | P0 | gargoyle/enemy_gargoyle_idle.png |
| E12 | enemy_gargoyle hit | 一次 | 5 | 128×128 | 24fps | 0.2s | P0 | gargoyle/enemy_gargoyle_idle.png |
| E13 | enemy_skeleton idle | 循环 | 4 | 128×128 | 6fps | 0.67s | P0 | skeleton/enemy_skeleton_idle.png |
| E14 | enemy_skeleton hit | 一次 | 5 | 128×128 | 24fps | 0.2s | P0 | skeleton/enemy_skeleton_idle.png |
| E15 | enemy_corrupted_knight idle | 循环 | 4 | 200×200 | 4fps | 1.0s | P0 | corrupted_knight/enemy_corrupted_knight_idle.png |
| E16 | enemy_corrupted_knight hit | 一次 | 6 | 200×200 | 24fps | 0.25s | P0 | corrupted_knight/enemy_corrupted_knight_idle.png |
| E17 | enemy_ancient_dragon idle | 循环 | 6 | 200×200 | 6fps | 1.0s | P0 | ancient_dragon/enemy_ancient_dragon_idle.png |
| E18 | enemy_ancient_dragon hit | 一次 | 6 | 200×200 | 24fps | 0.25s | P0 | ancient_dragon/enemy_ancient_dragon_idle.png |
| P01 | player idle | 循环 | 4 | 128×128 | 6fps | 0.67s | P0 | player/sprites/player_warrior_idle.png |
| P02 | player hit | 一次 | 4 | 128×128 | 24fps | 0.17s | P0 | player/sprites/player_warrior_idle.png |
| V01 | slash 斩击特效 | 一次 | 8 | 128×128 | 32fps | 0.25s | P1 | vfx/effects/hit_slash.png |
| V02 | magic 魔法爆发 | 一次 | 8 | 128×128 | 32fps | 0.25s | P1 | vfx/effects/magic_burst.png |
| V03 | fire 火焰 | 一次 | 8 | 128×128 | 28fps | 0.29s | P1 | vfx/particles/particle_fire.png（风格参考）|
| V04 | poison 毒素 | 一次 | 8 | 128×128 | 24fps | 0.33s | P1 | vfx/particles/particle_poison.png |
| V05 | death 死亡 | 一次 | 10 | 160×160 | 24fps | 0.42s | P1 | （无，参考整体世界观）|
| V06 | block 格挡 | 一次 | 6 | 96×96 | 24fps | 0.25s | P1 | vfx/particles/particle_shield.png |
| V07 | heal 治疗 | 一次 | 6 | 96×96 | 24fps | 0.25s | P1 | vfx/particles/particle_spark.png |
| U01 | 能量水晶脉动 | 循环 | 6 | 64×64 | 8fps | 0.75s | P2 | ui/icons/ui_energy_crystal.png |
| U02 | 费用水晶闪烁 | 循环 | 4 | 40×40 | 6fps | 0.67s | P2 | card/templates/cost_crystal.png |

**P0 合计：20 组（敌人18 + 玩家2）**
**P1 合计：7 组（攻击特效4 + 死亡1 + 格挡1 + 治疗1）**
**P2 合计：2 组（UI动画）**
**总计：29 组序列帧**

---

## 五、代码接入方案（资源到位后）

### 修改点汇总

| 文件 | 改动 |
|------|------|
| `scripts/scenes/battle_scene.gd` | `_render_enemies()`：TextureRect → AnimatedSprite2D；`_hit_enemy_feedback()`：触发 hit 动画；玩家立绘换 AnimatedSprite2D |
| `scripts/vfx/vfx_manager.gd` | V01~V07 改用 AnimatedSprite2D，保留 Tween 作为 fallback |

### AnimatedSprite2D 接入模式（复用 art_key）

```
assets/enemies/{art_key_name}/
├── enemy_{name}_idle.png   ← 现有静态图（fallback）
├── idle/
│   ├── frame_000.png … frame_003.png
└── hit/
    ├── frame_000.png … frame_004.png
```

art_key 到目录名的映射（`enemy_slime` → `slime`，`enemy_ancient_dragon` → `ancient_dragon`）与现有目录结构完全对齐，无需新增字段。

### 兼容策略

资源未就绪时，代码检测 `idle/frame_000.png` 是否存在：
- **存在** → 用 AnimatedSprite2D 播放序列帧
- **不存在** → 降级为现有 TextureRect 静态图 + 原有 Tween 抖动

这样可以分批接入资源，不影响游戏正常运行。

---

## 六、序列帧文件命名规范（给 AI 生成时使用）

### 命名格式

```
{原始图文件名（去掉_idle后缀）}_{动画类型}_{帧序号}.png
```

### 具体示例

| 原始图 | 动画类型 | 生成文件命名示例 |
|--------|---------|----------------|
| enemy_slime_idle.png | idle | enemy_slime_idle_000.png … enemy_slime_idle_003.png |
| enemy_slime_idle.png | hit | enemy_slime_hit_000.png … enemy_slime_hit_004.png |
| enemy_slime_king_idle.png | idle | enemy_slime_king_idle_000.png … enemy_slime_king_idle_003.png |
| enemy_slime_king_idle.png | hit | enemy_slime_king_hit_000.png … enemy_slime_king_hit_005.png |
| enemy_bat_idle.png | idle | enemy_bat_idle_000.png … enemy_bat_idle_005.png |
| enemy_bat_idle.png | hit | enemy_bat_hit_000.png … enemy_bat_hit_003.png |
| enemy_shadow_mage_idle.png | idle | enemy_shadow_mage_idle_000.png … enemy_shadow_mage_idle_003.png |
| enemy_shadow_mage_idle.png | hit | enemy_shadow_mage_hit_000.png … enemy_shadow_mage_hit_004.png |
| enemy_orc_berserker_idle.png | idle | enemy_orc_berserker_idle_000.png … enemy_orc_berserker_idle_003.png |
| enemy_orc_berserker_idle.png | hit | enemy_orc_berserker_hit_000.png … enemy_orc_berserker_hit_004.png |
| enemy_gargoyle_idle.png | idle | enemy_gargoyle_idle_000.png … enemy_gargoyle_idle_003.png |
| enemy_gargoyle_idle.png | hit | enemy_gargoyle_hit_000.png … enemy_gargoyle_hit_004.png |
| enemy_skeleton_idle.png | idle | enemy_skeleton_idle_000.png … enemy_skeleton_idle_003.png |
| enemy_skeleton_idle.png | hit | enemy_skeleton_hit_000.png … enemy_skeleton_hit_004.png |
| enemy_corrupted_knight_idle.png | idle | enemy_corrupted_knight_idle_000.png … enemy_corrupted_knight_idle_003.png |
| enemy_corrupted_knight_idle.png | hit | enemy_corrupted_knight_hit_000.png … enemy_corrupted_knight_hit_005.png |
| enemy_ancient_dragon_idle.png | idle | enemy_ancient_dragon_idle_000.png … enemy_ancient_dragon_idle_005.png |
| enemy_ancient_dragon_idle.png | hit | enemy_ancient_dragon_hit_000.png … enemy_ancient_dragon_hit_005.png |
| player_warrior_idle.png | idle | player_warrior_idle_000.png … player_warrior_idle_003.png |
| player_warrior_idle.png | hit | player_warrior_hit_000.png … player_warrior_hit_003.png |
| hit_slash.png | anim | hit_slash_anim_000.png … hit_slash_anim_007.png |
| magic_burst.png | anim | magic_burst_anim_000.png … magic_burst_anim_007.png |
| particle_fire.png | anim | particle_fire_anim_000.png … particle_fire_anim_007.png |
| particle_poison.png | anim | particle_poison_anim_000.png … particle_poison_anim_007.png |
| particle_shield.png | anim | particle_shield_anim_000.png … particle_shield_anim_005.png |
| particle_spark.png | anim | particle_spark_anim_000.png … particle_spark_anim_005.png |
| ui_energy_crystal.png | anim | ui_energy_crystal_anim_000.png … ui_energy_crystal_anim_005.png |
| cost_crystal.png | anim | cost_crystal_anim_000.png … cost_crystal_anim_003.png |

### 注意事项

1. 帧序号统一 3 位补零：000、001、002…
2. idle 动画的第 000 帧应与原始静态图完全一致（作为默认帧）
3. hit 动画的第 000 帧是受击开始帧（不是待机帧）
4. 所有生成帧必须是 RGBA 透明背景，不能有白色底
5. 每帧尺寸必须与原始图严格一致（见汇总表中"每帧尺寸"列）
6. death 特效（V05）无参考图，命名为 `vfx_death_anim_000.png … vfx_death_anim_009.png`
