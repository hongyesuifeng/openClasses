# SlayDemo 美术资源清单

> 生成日期: 2026-06-02  
> 用途: 开发侧资源状态核查 + UI 主题替换规划  
> 说明: "当前状态"列描述资源实际存在情况，"代码接入状态"描述是否已被代码正确引用

---

## 一、背景图（backgrounds/）

| 文件名 | 用途 | 当前状态 | 代码接入 |
|--------|------|----------|----------|
| `bg_battle_boss.png` | Boss 战斗背景 | ✅ 有文件 | ✅ battle_scene.gd |
| `bg_battle_cave.png` | 普通战斗背景（洞穴） | ✅ 有文件 | ✅ battle_scene.gd |
| `bg_battle_dungeon.png` | 普通战斗背景（地牢） | ✅ 有文件 | ✅ battle_scene.gd |
| `bg_main_menu.png` | 主菜单背景 | ✅ 有文件 | ✅ main_menu_scene.gd |
| `bg_map.png` | 地图 / 奖励 / 商店通用背景 | ✅ 有文件 | ✅ 多场景复用 |
| `bg_battle_elite.png` | 精英战斗专用背景 | ❌ 缺失 | ─ 当前复用 bg_battle_cave |
| `bg_rest.png` | 休息节点背景 | ❌ 缺失 | ─ 当前无 |
| `bg_event.png` | 事件节点背景 | ❌ 缺失 | ─ 当前无 |

---

## 二、卡牌资源（card/）

### 卡牌模板（card/templates/）

| 文件名 | 用途 | 当前状态 | 代码接入 |
|--------|------|----------|----------|
| `card_template_common.png` | 普通卡牌底框 | ✅ 有文件 | ✅ card_view_factory.gd |
| `card_template_uncommon.png` | 非常见卡牌底框 | ✅ 有文件 | ✅ card_view_factory.gd |
| `card_template_rare.png` | 稀有卡牌底框 | ✅ 有文件 | ✅ card_view_factory.gd |
| `card_template_legendary.png` | 传说卡牌底框 | ✅ 有文件 | ✅ card_view_factory.gd |
| `card_back.png` | 卡牌背面 | ✅ 有文件 | ✅ deck_pile UI |
| `cost_crystal.png` | 费用水晶图标 | ✅ 有文件 | ✅ card_view_factory.gd |

### 卡牌类型图标（card/icons/）

| 文件名 | 用途 | 当前状态 | 代码接入 |
|--------|------|----------|----------|
| `card_icon_attack.png` | 攻击类卡牌图标 | ✅ 有文件 | ✅ card_view_factory.gd |
| `card_icon_defend.png` | 防御类卡牌图标 | ✅ 有文件 | ✅ card_view_factory.gd |
| `card_icon_skill.png` | 技能类卡牌图标 | ✅ 有文件 | ✅ card_view_factory.gd |
| `card_icon_power.png` | 能力类卡牌图标 | ✅ 有文件 | ✅ card_view_factory.gd |
| `card_icon_buff.png` | 增益类卡牌图标 | ✅ 有文件 | ✅ card_view_factory.gd |
| `card_icon_debuff.png` | 减益类卡牌图标 | ✅ 有文件 | ✅ card_view_factory.gd |
| `card_icon_strike.png` | 斩击类卡牌图标 | ✅ 有文件 | ✅ card_view_factory.gd |

### 卡牌插图（card/artwork/）— 整类缺失

| 用途 | 当前状态 | 说明 |
|------|----------|------|
| 25 张卡牌各自的插图 | ❌ 整类缺失 | 当前代码用 card_icon 类型图标代替，无独立卡牌插画 |

---

## 三、敌人资源（enemies/）

### 当前文件 vs 数据层 art_key 映射

> 注意：同一张图被多个敌人复用（如 shadow_mage 对应信徒和法师），这是临时占位

| art_key（代码引用） | 文件路径 | 对应敌人（data） | 当前状态 |
|---------------------|----------|------------------|----------|
| `enemy_slime` | `slime/enemy_slime_idle.png` | 小史莱姆 | ✅ 独占，图文一致 |
| `enemy_bat` | `bat/enemy_bat_idle.png` | 毒素蝙蝠 | ✅ 独占，图文一致 |
| `enemy_mushroom` | `mushroom/enemy_mushroom_idle.png` | 尖刺史莱姆 / 史莱姆王（复用） | ⚠️ 图文不一致，占位 |
| `enemy_shadow_mage` | `shadow_mage/enemy_shadow_mage_idle.png` | 暗影信徒 / 亡灵法师（复用） | ⚠️ 图文不一致，占位 |
| `enemy_gargoyle` | `gargoyle/enemy_gargoyle_idle.png` | 狂战士 / 石像守卫 / 狂暴兽人（复用） | ⚠️ 图文不一致，占位 |
| `enemy_skeleton` | `skeleton/enemy_skeleton_idle.png` | 盾卫 | ✅ 可接受（盾牌骷髅） |
| `enemy_corrupted_knight` | `corrupted_knight/enemy_corrupted_knight_idle.png` | 腐化骑士（Boss） | ✅ 独占，图文一致 |
| `enemy_ancient_dragon` | `ancient_dragon/enemy_ancient_dragon_idle.png` | 火焰领主（Boss） | ✅ 近似，可接受 |

### 缺失的独立敌人立绘

| 敌人ID | 名称 | 当前占位图 | 需要的专属图 |
|--------|------|-----------|-------------|
| `slime_spiky_v1` | 尖刺史莱姆 | enemy_mushroom | ❌ 需要带刺史莱姆形象 |
| `cultist_v1` | 暗影信徒 | enemy_shadow_mage | ❌ 需要信徒/法袍形象 |
| `shield_guard_v1` | 盾卫 | enemy_skeleton | ⚠️ 可接受或替换为持盾形象 |
| `berserker_v1` | 狂战士 | enemy_gargoyle | ❌ 需要狂战士形象 |
| `necromancer_v1` | 亡灵法师 | enemy_shadow_mage | ❌ 与信徒共用，区分度低 |
| `stone_guardian_v1` | 石像守卫 | enemy_gargoyle | ⚠️ 石像守卫与石像鬼接近，可接受 |
| `elite_slime_king_v1` | 史莱姆王（精英） | enemy_mushroom | ❌ 需要大型史莱姆王 |
| `elite_orc_berserker_v1` | 狂暴兽人（精英） | enemy_gargoyle | ❌ 需要兽人形象 |

### 敌人动画帧（全部缺失）

| 动作 | 当前状态 | 临时方案 |
|------|----------|---------|
| 攻击动画 | ❌ 缺失 | Tween 位移模拟 |
| 受伤动画 | ❌ 缺失 | Tween 闪烁模拟 |
| 死亡动画 | ❌ 缺失 | Tween 淡出模拟 |

---

## 四、玩家资源（player/）

| 文件名 | 用途 | 当前状态 | 代码接入 |
|--------|------|----------|----------|
| `sprites/player_warrior_idle.png` | 玩家战斗站立 | ✅ 有文件 | ✅ battle_scene.gd |
| `portrait/player_portrait.png` | 玩家头像（HUD） | ✅ 有文件 | ✅ battle_scene.gd |
| `sprites/player_warrior_attack.png` | 玩家攻击动画 | ❌ 缺失 | ─ 无 |
| `sprites/player_warrior_hurt.png` | 玩家受伤动画 | ❌ 缺失 | ─ 无 |
| `sprites/player_warrior_block.png` | 玩家格挡动画 | ❌ 缺失 | ─ 无 |

---

## 五、UI 资源（ui/）

### 按钮（ui/buttons/）

| 文件名 | 用途 | 当前状态 | 代码接入 |
|--------|------|----------|----------|
| `ui_btn_normal.png` | 按钮默认态 | ✅ 有文件 | ⚠️ 资源存在但场景代码多用 StyleBoxFlat 程序化生成 |
| `ui_btn_hover.png` | 按钮悬停态 | ✅ 有文件 | ⚠️ 同上 |
| `ui_btn_pressed.png` | 按钮按下态 | ✅ 有文件 | ⚠️ 同上 |
| `ui_btn_disabled.png` | 按钮禁用态 | ✅ 有文件 | ⚠️ 同上 |

### 血量/格挡条（ui/bars/）

| 文件名 | 用途 | 当前状态 | 代码接入 |
|--------|------|----------|----------|
| `ui_hp_bar_bg.png` | 血量条背景 | ✅ 有文件 | ✅ battle_scene.gd |
| `ui_hp_bar_fill.png` | 血量条填充 | ✅ 有文件 | ✅ battle_scene.gd |
| `ui_block_bar_fill.png` | 格挡条填充 | ✅ 有文件 | ✅ battle_scene.gd |
| `ui_hp_bar_enemy_fill.png` | 敌人血量条专用颜色 | ❌ 缺失 | ─ 当前与玩家共用 |

### 功能图标（ui/icons/）

| 文件名 | 用途 | 当前状态 | 代码接入 |
|--------|------|----------|----------|
| `icon_audio_on.png` | 音频开图标 | ✅ 有文件 | ✅ |
| `icon_audio_off.png` | 音频关图标 | ✅ 有文件 | ✅ |
| `icon_boss.png` | 地图 Boss 节点图标 | ✅ 有文件 | ✅ map_scene.gd |
| `icon_elite.png` | 地图精英节点图标 | ✅ 有文件 | ✅ map_scene.gd |
| `icon_question.png` | 地图事件节点图标 | ✅ 有文件 | ✅ map_scene.gd |
| `icon_shop.png` | 地图商店节点图标 | ✅ 有文件 | ✅ map_scene.gd |
| `icon_close.png` | 关闭按钮图标 | ✅ 有文件 | ✅ |
| `icon_settings.png` | 设置图标 | ✅ 有文件 | ✅ |
| `ui_energy_base.png` | 能量 HUD 底座 | ✅ 有文件 | ✅ battle_scene.gd |
| `ui_energy_crystal.png` | 能量水晶图标 | ✅ 有文件 | ✅ battle_scene.gd |
| `icon_battle.png` | 地图普通战斗节点图标 | ❌ 缺失 | ─ 当前用文字"⚔"代替 |
| `icon_rest.png` | 地图休息节点图标 | ❌ 缺失 | ─ 当前用文字代替 |
| `icon_chest.png` | 地图宝箱节点图标 | ❌ 缺失 | ─ 当前无 |
| `icon_draw_pile.png` | 抽牌堆图标 | ❌ 缺失 | ─ 当前用数字标签代替 |
| `icon_discard_pile.png` | 弃牌堆图标 | ❌ 缺失 | ─ 当前用数字标签代替 |

### 意图图标（ui/intents/）

| 文件名 | 用途 | 当前状态 | 代码接入 |
|--------|------|----------|----------|
| `intent_sword.png` | 攻击意图 | ✅ 有文件 | ✅ battle_scene.gd |
| `intent_shield.png` | 防御意图 | ✅ 有文件 | ✅ battle_scene.gd |
| `intent_buff.png` | 增益意图 | ✅ 有文件 | ✅ battle_scene.gd |
| `intent_debuff.png` | 减益意图 | ✅ 有文件 | ✅ battle_scene.gd |
| `intent_stun.png` | 眩晕意图 | ✅ 有文件 | ✅ battle_scene.gd |
| `intent_question.png` | 未知意图（fallback） | ✅ 有文件 | ✅ battle_scene.gd |

### 面板（ui/panels/）

| 文件名 | 用途 | 当前状态 | 代码接入 |
|--------|------|----------|----------|
| `ui_panel_dark.png` | 深色面板背景 | ✅ 有文件 | ⚠️ 资源存在但场景多用 StyleBoxFlat |
| `ui_panel_light.png` | 浅色面板背景 | ✅ 有文件 | ⚠️ 同上 |

---

## 六、遗物图标（ui/relics/）— 整类缺失

| 遗物ID | 名称 | 当前状态 | 代码接入现状 |
|--------|------|----------|------------|
| `anchor` | 船锚 | ❌ 缺失 | relic_view_factory 用文字按钮代替 |
| `lantern` | 灯笼 | ❌ 缺失 | relic_view_factory 用文字按钮代替 |
| `strawberry` | 草莓 | ❌ 缺失 | relic_view_factory 用文字按钮代替 |
| `meal_ticket` | 餐券 | ❌ 缺失 | relic_view_factory 用文字按钮代替 |
| `golden_idol` | 黄金神像 | ❌ 缺失 | relic_view_factory 用文字按钮代替 |

---

## 七、状态效果图标（ui/status/）— 整类缺失

| 状态 ID | 名称 | 当前状态 | 代码接入现状 |
|---------|------|----------|------------|
| `strength` | 力量 | ❌ 缺失 | status_view_factory 用 emoji ⚔ 文字代替 |
| `dexterity` | 敏捷 | ❌ 缺失 | 用 emoji 💫 代替 |
| `vulnerable` | 易伤 | ❌ 缺失 | 用 emoji 💔 代替 |
| `weak` | 虚弱 | ❌ 缺失 | 用 emoji 🌵 代替 |
| `poison` | 中毒 | ❌ 缺失 | 用 emoji 💚 代替 |
| `thorns` | 荆棘 | ❌ 缺失 | 用 emoji 🦴 代替 |
| `regeneration` | 再生 | ❌ 缺失 | 用 emoji ─ 代替 |
| `fortify` | 堡垒 | ❌ 缺失 | 用 emoji ▣ 代替 |

---

## 八、特效资源（vfx/）

### 特效帧图（vfx/effects/）

| 文件名 | 用途 | 当前状态 | 代码接入 |
|--------|------|----------|----------|
| `hit_slash.png` | 斩击命中特效 | ✅ 有文件 | ✅ vfx_manager.gd |
| `magic_burst.png` | 魔法爆发特效 | ✅ 有文件 | ✅ vfx_manager.gd |

### 粒子纹理（vfx/particles/）

| 文件名 | 用途 | 当前状态 | 代码接入 |
|--------|------|----------|----------|
| `particle_fire.png` | 火焰粒子 | ✅ 有文件 | ✅ vfx_manager.gd |
| `particle_poison.png` | 毒雾粒子 | ✅ 有文件 | ✅ vfx_manager.gd |
| `particle_shield.png` | 护盾粒子 | ✅ 有文件 | ✅ vfx_manager.gd |
| `particle_spark.png` | 火花粒子 | ✅ 有文件 | ✅ vfx_manager.gd |
| `particle_heal.png` | 治疗粒子 | ❌ 缺失 | ─ |
| `particle_buff.png` | 增益粒子 | ❌ 缺失 | ─ |

---

## 九、音频资源（audio/）

| 文件名 | 用途 | 当前状态 | 代码接入 |
|--------|------|----------|----------|
| `sfx/card_place_1.ogg` | 出牌音效 | ✅ 有文件 | ❌ AudioManager 未接入 |
| `sfx/card_slide_1.ogg` | 卡牌滑动音效 | ✅ 有文件 | ❌ AudioManager 未接入 |
| `sfx/hit_attack.ogg` | 攻击命中音效 | ❌ 缺失 | ─ |
| `sfx/hit_block.ogg` | 格挡音效 | ❌ 缺失 | ─ |
| `sfx/status_apply.ogg` | 状态施加音效 | ❌ 缺失 | ─ |
| `sfx/turn_end.ogg` | 回合结束音效 | ❌ 缺失 | ─ |
| `sfx/win.ogg` | 战斗胜利音效 | ❌ 缺失 | ─ |
| `sfx/lose.ogg` | 战斗失败音效 | ❌ 缺失 | ─ |
| `bgm/bgm_battle.ogg` | 战斗背景音乐 | ❌ 缺失 | ─ |
| `bgm/bgm_map.ogg` | 地图背景音乐 | ❌ 缺失 | ─ |
| `bgm/bgm_menu.ogg` | 主菜单背景音乐 | ❌ 缺失 | ─ |

---

## 十、字体（fonts/）

| 文件名 | 用途 | 当前状态 | 代码接入 |
|--------|------|----------|----------|
| `ChakraPetch-Bold.ttf` | 英文粗体（标题） | ✅ 有文件 | ⚠️ 资源存在，场景脚本尚未统一引用 |
| `ChakraPetch-Regular.ttf` | 英文常规 | ✅ 有文件 | ⚠️ 同上 |
| `NotoSansSC-VariableFont_wght.ttf` | 中文字体 | ✅ 有文件 | ⚠️ 同上 |

---

## 十一、优先级汇总

### P0 — 影响功能可用性（缺失导致 fallback 不够用）

| 资源 | 数量 | 影响 |
|------|------|------|
| 状态效果图标 | 8 张 | 战斗 HUD 可读性低，当前用 emoji 占位 |
| 遗物图标 | 5 张 | 遗物展示仅文字，无视觉辨识度 |
| 地图普通节点图标（battle/rest/chest） | 3 张 | 地图路线节点图标不完整 |

### P1 — 明显影响体验

| 资源 | 数量 | 影响 |
|------|------|------|
| 独立敌人立绘（替换占位图） | 5–6 张 | 多敌人共用同张图，视觉混乱 |
| 抽/弃牌堆图标 | 2 张 | 战斗 HUD 牌堆区域无图标 |
| 音效接入（已有文件，待接入） | 2 个 | 出牌无手感反馈 |

### P2 — 锦上添花

| 资源 | 数量 | 影响 |
|------|------|------|
| 玩家/敌人动画帧 | 若干 | 战斗动态感不足，当前用 Tween 代替 |
| 卡牌插图 | 25 张 | 卡牌无插画，用类型图标占位 |
| BGM | 3 首 | 无背景音乐 |
| 更多音效 | 6+ 个 | 战斗反馈音效稀少 |
| 精英战/休息/事件专用背景 | 3 张 | 所有非战斗场景共用同一背景 |

---

## 十二、UI 主题替换说明

当前场景代码（`shop_scene.gd`、`battle_scene.gd` 等）普遍使用 **程序化 StyleBoxFlat** 生成 UI，而非引用 `ui/buttons/` 和 `ui/panels/` 下的纹理资源。

> **替换路径**：将来替换 UI 主题时，统一在 Godot 项目里创建 `Theme` 资源（`.tres`），场景脚本只需切换 Theme 引用，不需逐个改代码。当前 `assets/ui/buttons/*.png` 和 `assets/ui/panels/*.png` 已为此做好了资源储备。

**建议步骤**：
1. 确定一套新视觉风格（如像素风/奇幻手绘）
2. 制作或替换 `ui/buttons/`、`ui/panels/`、`card/templates/` 纹理
3. 制作 Godot Theme 资源，绑定 StyleBox 使用新纹理
4. 各场景脚本中统一切换 `theme` 属性，覆盖现有程序化样式
