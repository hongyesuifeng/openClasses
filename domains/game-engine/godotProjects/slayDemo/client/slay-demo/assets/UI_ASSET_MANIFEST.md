# SlayDemo UI 资源清单

> 生成日期：2026-06-10  
> 压缩包：`slaydemo_ui_assets_export.zip`（位于项目根目录）  
> 替换规则：**直接覆盖同名文件**，Godot 编辑器重新导入后自动生效  
> 验证方式：替换后在 `res://scenes/dev/ui_gallery_scene.tscn` 中查看对应 Tab

---

## 📁 backgrounds/ — 场景背景

| 文件 | 尺寸 | 使用场景 | 替换要求 |
|------|------|---------|---------|
| `bg_main_menu.png` | 1920×1080 | 主菜单 | 建议 ≥1280×720，全屏铺满，`keep_aspect_covered` |
| `bg_map.png` | 1920×1080 | 地图 / 商店 / 休息 / 事件 / 宝箱 / 奖励 | 同上 |
| `bg_battle_dungeon.png` | 1920×1080 | 普通战斗 | 同上 |
| `bg_battle_boss.png` | 1920×1080 | Boss 战 | 同上 |
| `bg_battle_cave.png` | 1920×1080 | 备用（当前未使用） | — |

---

## 📁 ui/buttons/ — 按钮九宫格贴图（Nine-Patch）

| 文件 | 尺寸 | 九宫格边距 `[L,T,R,B]` | 用途 | 替换要求 |
|------|------|----------------------|------|---------|
| `ui_btn_pink_normal.png` | 240×80 | [36,24,36,24] | 主按钮普通态（开始/确认） | 保留中央可拉伸区域 |
| `ui_btn_pink_pressed.png` | 240×80 | [36,24,36,24] | 主按钮按下态 | 与 normal 同尺寸 |
| `ui_btn_pink_disabled.png` | 240×80 | [36,24,36,24] | 主按钮禁用态 | 同上 |
| `ui_btn_normal.png` | 192×64 | [28,20,28,20] | 次要按钮普通态 | — |
| `ui_btn_pressed.png` | 192×64 | [28,20,28,20] | 次要按钮按下态 | — |
| `ui_btn_disabled.png` | 192×64 | [28,20,28,20] | 次要按钮禁用态 | — |
| `ui_btn_hover.png` | 192×64 | — | 次要按钮悬停态 | — |
| `ui_btn_purple_normal.png` | 240×80 | — | 紫色操作按钮（返回/放弃） | — |

---

## 📁 ui/panels/ — 面板九宫格贴图

| 文件 | 尺寸 | 用途 | 替换要求 |
|------|------|------|---------|
| `ui_panel_dark.png` | 64×64 | 深色半透明面板（战斗/弹窗） | 建议圆角边框，中央全透明可拉伸 |
| `ui_panel_light.png` | 64×64 | 浅色面板（卡牌描述区） | 同上 |

---

## 📁 ui/bars/ — 进度条贴图（Nine-Patch，水平拉伸）

| 文件 | 尺寸 | 用途 | 替换要求 |
|------|------|------|---------|
| `ui_hp_bar_bg.png` | 512×48 | HP 条底层背景 | 横向可拉伸 |
| `ui_hp_bar_fill.png` | 512×48 | HP 条填充层（粉/红色） | 用于 TextureProgressBar，同上 |
| `ui_block_bar_fill.png` | 512×48 | 格挡条填充层（蓝色） | 同上 |

---

## 📁 ui/icons/ — 功能图标

| 文件 | 尺寸 | 用途 |
|------|------|------|
| `icon_achievement.png` | 128×128 | 主菜单侧边栏：成就 |
| `icon_collection.png` | 128×128 | 主菜单侧边栏：图鉴 |
| `icon_settings.png` | 50×50 | 主菜单侧边栏：设置 |
| `icon_notice.png` | 128×128 | 主菜单侧边栏：公告 |
| `icon_battle.png` | 32×32 | 地图节点：战斗 |
| `icon_shop.png` | 32×32 | 地图节点：商店 / 金币图标 |
| `icon_chest.png` | 32×32 | 地图节点：宝箱 |
| `icon_question.png` | 32×32 | 地图节点：事件 |
| `icon_rest.png` | 32×32 | 地图节点：休息 |
| `icon_boss.png` | 32×32 | 地图节点：Boss/终点 |
| `icon_elite.png` | 32×32 | 地图节点：精英 |
| `icon_draw_pile.png` | 40×40 | 战斗界面：牌堆图标 |
| `icon_discard_pile.png` | 40×40 | 战斗界面：弃牌堆图标 |
| `icon_audio_on.png` | 50×50 | 音效开启按钮 |
| `icon_audio_off.png` | 50×50 | 音效关闭按钮 |
| `icon_close.png` | 50×50 | 关闭/取消按钮 |
| `ui_energy_crystal.png` | 36×36 | 战斗界面：能量水晶静态图 |
| `ui_energy_base.png` | 80×80 | 能量底座 |
| `energy_crystal_anim/ui_energy_crystal_000~005.png` | 64×64 | 能量水晶序列帧动画（6帧，约12fps） |

---

## 📁 ui/intents/ — 敌人意图图标（48×48）

| 文件 | 用途 |
|------|------|
| `intent_sword.png` | 攻击意图 |
| `intent_shield.png` | 防御意图 |
| `intent_buff.png` | 增益意图 |
| `intent_debuff.png` | 减益意图 |
| `intent_stun.png` | 眩晕意图 |
| `intent_question.png` | 未知意图 |

---

## 📁 ui/relics/ — 遗物图标（64×64，透明背景）

| 文件 | 遗物名 | 稀有度 | 效果描述 |
|------|--------|--------|---------|
| `relic_anchor.png` | 锚 | ★ 普通 | 每回合开始额外获得 1 点格挡 |
| `relic_lantern.png` | 星光提灯 | ★ 普通 | 每场战斗开始获得 10 点格挡 |
| `relic_strawberry.png` | 幸运草莓 | ★ 普通 | 最大生命值提高 10 |
| `relic_meal_ticket.png` | 餐券 | ★ 普通 | 每个商店节点回复 15 点生命 |
| `relic_golden_idol.png` | 黄金神像 | ★★ 非常见 | 战斗胜利额外获得 25 金币 |
| `relic_iron_boots.png` | 铁靴 | ★★ 非常见 | 每回合开始获得 2 点力量 |
| `relic_blood_ring.png` | 血戒 | ★★ 非常见 | 每次受伤后回复 3 点生命 |
| `relic_war_drum.png` | 战鼓 | ★★ 非常见 | 每回合手牌上限+1 |
| `relic_ancient_scroll.png` | 古老卷轴 | ★★ 非常见 | 每回合开始额外抽1张牌 |
| `relic_crystal_ball.png` | 水晶球 | ★★★ 稀有 | 可以预知敌人下一回合行动 |
| `relic_healing_spring.png` | 治愈泉 | ★★★ 稀有 | 每次进入休息节点额外回复 15 点生命 |
| `relic_philosopher_stone.png` | 贤者之石 | ★★★ 稀有 | 战斗开始时所有敌人获得 1 层力量，但初始能量+1 |
| `relic_burning_blood.png` | 燃烧之血 | 👑 Boss | 战斗结束后回复 6 点生命 |
| `relic_ring_of_serpent.png` | 蛇之戒 | 👑 Boss | 每回合开始时手牌中随机一张费用-1 |
| `relic_fusion_hammer.png` | 融合之锤 | 👑 Boss | 升级费用降低，每次休息可额外升级一张 |
| `relic_runic_dome.png` | 符文穹顶 | 👑 Boss | 无法预知敌人意图，但初始格挡+12 |

---

## 📁 ui/status/ — 状态效果图标（40×40，透明背景）

| 文件 | 状态名 | 类型 | 效果描述 |
|------|--------|------|---------|
| `status_strength.png` | 力量 | 增益 | 每层使攻击伤害+1 |
| `status_dexterity.png` | 敏捷 | 增益 | 每层使每回合格挡+1 |
| `status_regeneration.png` | 再生 | 增益 | 每回合开始回复等同层数的生命 |
| `status_barricade.png` | 要塞 | 增益 | 回合结束时格挡不消失 |
| `status_ritual.png` | 仪式 | 增益 | 每回合结束获得等同层数的力量 |
| `status_metallicize.png` | 金属化 | 增益 | 每回合结束获得等同层数的格挡 |
| `status_thorns.png` | 荆棘 | 增益 | 被攻击时反弹等同层数的伤害 |
| `status_fortify.png` | 防御 | 增益 | 通用防御状态 |
| `status_retain.png` | 保留 | 增益 | 本张牌回合结束不弃牌 |
| `status_vulnerable.png` | 脆弱 | 减益 | 每层使受到伤害×1.5 |
| `status_weak.png` | 虚弱 | 减益 | 每层使攻击伤害×0.75 |
| `status_frail.png` | 脆弱格挡 | 减益 | 每层使获得格挡×0.75 |
| `status_poison.png` | 中毒 | 减益 | 每回合结束扣除等同层数的生命，层数-1 |

---

## 📁 card/ — 卡牌模板与图标

### card/templates/ — 卡牌框（180×250）

| 文件 | 用途 |
|------|------|
| `card_template_common.png` | 普通稀有度卡牌框 |
| `card_template_uncommon.png` | 非常见稀有度卡牌框 |
| `card_template_rare.png` | 稀有度卡牌框 |
| `card_template_legendary.png` | 传说稀有度卡牌框 |
| `card_back.png` | 卡牌背面 |
| `cost_crystal.png` | 费用水晶底座（40×40） |
| `cost_crystal_anim/cost_crystal_000~003.png` | 费用水晶动画（4帧，40×40） |

### card/icons/ — 卡牌类型图标（64×64）

| 文件 | 用途 |
|------|------|
| `card_icon_attack.png` | 攻击牌 |
| `card_icon_skill.png` | 技能牌 |
| `card_icon_power.png` | 能力牌 |
| `card_icon_defend.png` | 防御牌 |
| `card_icon_strike.png` | 打击牌 |
| `card_icon_buff.png` | 增益牌 |
| `card_icon_debuff.png` | 减益牌 |

---

## 📁 player/ — 玩家角色

| 文件 | 尺寸 | 用途 | 替换要求 |
|------|------|------|---------|
| `player/portrait/player_portrait.png` | 96×96 | 战斗状态栏左侧头像 | 正方形，透明背景 |
| `player/sprites/player_warrior_idle.png` | 128×128 | Idle 静态帧（兼容） | 正方形 |
| `player/sprites/idle/player_warrior_idle_000~003.png` | 128×128 | Idle 序列帧（4帧，6fps循环） | 每帧同尺寸，文件名编号不变 |
| `player/sprites/hit/player_warrior_hit_000~003.png` | 128×128 | 受击序列帧（4帧，播放一次） | 同上 |

---

## 📁 shop/ — 商店

| 文件 | 尺寸 | 用途 | 替换要求 |
|------|------|------|---------|
| `shop/merchant_portrait.png` | 300×400 | 商人立绘（商店右侧） | 建议竖版，透明背景 |

---

## 📁 enemies/ — 敌人精灵（序列帧）

> 所有敌人各有 `idle`（6帧循环）和 `hit`（6帧播放一次）两组动画  
> 替换时每组6个文件需**编号完整**（_000 ~ _005），且同组**尺寸一致**

| 敌人目录 | 尺寸 | 敌人名 | 类型 |
|---------|------|--------|------|
| `enemies/slime/` | 128×128 | 史莱姆 | 普通 |
| `enemies/bat/` | 128×128 | 蝙蝠 | 普通 |
| `enemies/mushroom/` | 128×128 | 蘑菇人 | 普通 |
| `enemies/gargoyle/` | 128×128 | 石像鬼 | 普通 |
| `enemies/shadow_mage/` | 128×128 | 暗影法师 | 普通 |
| `enemies/skeleton/` | 128×128 | 骷髅 | 普通 |
| `enemies/slime_king/` | 160×160 | 史莱姆王 | 精英 |
| `enemies/orc_berserker/` | 160×160 | 兽人狂战士 | 精英 |
| `enemies/corrupted_knight/` | 200×200 | 堕落骑士 | 精英/Boss |
| `enemies/ancient_dragon/` | 200×200 | 远古巨龙 | Boss |

> 另有 4 个未列出的敌人（gargoyle_boss / boss_witch 等）精灵路径见 `battle_scene.gd` 中 `ENEMY_ART_BY_KEY`

---

## 📁 vfx/ — 战斗特效序列帧（可选替换）

| 目录 | 尺寸 | 帧数 | 用途 |
|------|------|------|------|
| `vfx/slash/hit_slash_000~007.png` | 128×128 | 8帧 | 物理攻击命中特效 |
| `vfx/magic/magic_burst_000~007.png` | 128×128 | 8帧 | 魔法爆炸特效 |
| `vfx/fire/particle_fire_000~007.png` | 128×128 | 8帧 | 火焰粒子特效 |
| `vfx/poison/particle_poison_000~007.png` | 128×128 | 8帧 | 毒液粒子特效 |
| `vfx/heal/particle_spark_000~005.png` | 96×96 | 6帧 | 治疗/回血特效 |
| `vfx/block/particle_shield_000~005.png` | 96×96 | 6帧 | 格挡特效 |
| `vfx/death/death_effect_000~009.png` | 160×160 | 10帧 | 敌人死亡特效 |
| `vfx/effects/hit_slash.png` | 128×128 | 静帧 | 命中单帧 |
| `vfx/effects/magic_burst.png` | 128×128 | 静帧 | 魔法单帧 |
| `vfx/particles/particle_*.png` | 32×32 | 静帧 | 粒子系统原始贴图 |

---

## 📁 fonts/ — 字体文件

| 文件 | 用途 | 格式 |
|------|------|------|
| `ChakraPetch-Bold.ttf` | 标题字体（英文/数字，大字号） | TTF |
| `ChakraPetch-Regular.ttf` | 正文英文 | TTF |
| `NotoSansSC-VariableFont_wght.ttf` | 所有中文文字 | TTF Variable |

---

## 替换注意事项

1. **直接覆盖同名文件**，路径和文件名不要改变
2. **九宫格按钮**（buttons/ 目录）替换后需在 `ui_manifest/manifest.assets.json` 里确认 `nine_patch` 边距值是否还匹配新素材
3. **序列帧动画**（enemies/、vfx/、energy_crystal_anim/）替换时6帧必须全部替换，尺寸保持一致
4. 替换后在 Godot 编辑器里**重新导入**（Project → Reimport 或重启编辑器）
5. 可在 `res://scenes/dev/ui_gallery_scene.tscn` 的「遗物」「状态」「🎬动画」Tab 快速验证图标/动画是否正确
