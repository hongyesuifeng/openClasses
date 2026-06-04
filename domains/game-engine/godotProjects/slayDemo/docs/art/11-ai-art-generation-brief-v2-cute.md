# SlayDemo AI 美术生成需求文档（Q版卡通完整版）

> 版本：v2.1（完整版，100% 覆盖所有图片资源）
> 日期：2026-06-04
> 世界观：《甜心迷宫》—— 云端魔法学院 Q版卡通美女风
> 操作说明：同名文件覆盖 `assets/` 对应子目录，无需改任何代码

---

## 一、全局风格定义（每张图都要带上）

```
整体风格：Q版卡通（Chibi / Kawaii cartoon）
头身比：2~2.5 头身（大头小身），仅角色类适用
色调：马卡龙粉彩色系（粉/蓝/紫/黄/绿），高饱和，亮丽
线条：2~3px 均匀黑色描边，填充纯色或轻微渐变（2色以内）
阴影：仅平面色块分层，无写实阴影
质感：扁平干净，允许白色高光圆点或星星点
装饰元素：爱心、星星、气泡、彩虹、花朵、光点——大量使用
氛围：轻松可爱，略带调皮
参考：《宝可梦》图鉴插画 / 《皇室战争》卡牌插画 / 日系Q版
```

### 主色板

| 用途 | 色值 |
|------|------|
| 背景主色 | `#f0e6ff` 淡薰衣草紫 |
| 面板底色 | `#fce4ec` 浅玫瑰粉 |
| 交互元素 | `#ce93d8` 中紫 |
| 主要文字 | `#3e2a5a` 深紫 |
| 次要文字 | `#7b5ea7` 中紫灰 |
| 攻击/伤害 | `#ef5350` 粉红红 |
| 格挡/防御 | `#42a5f5` 天蓝 |
| 技能/治愈 | `#66bb6a` 嫩绿 |
| 能量/费用 | `#80deea` 浅青 |
| 金币/奖励 | `#ffd54f` 暖黄 |
| 负面状态 | `#ab47bc` 亮紫 |
| 危险/意图 | `#ff7043` 橙红 |

### 输出规范

- 格式：PNG，sRGB
- 背景：透明（背景图除外）
- 命名：严格按下表文件名，不要更改

---

## 二、完整资源清单（共 91 张）

### A. 背景图（5张）

> 1920×1080，**不透明**，横向构图，中央大片留白放 UI

| # | 文件路径 | 场景 | 描述 | Prompt 关键词 |
|---|----------|------|------|--------------|
| A1 | `assets/backgrounds/bg_main_menu.png` | 主菜单 | 云端魔法学院入口，蓝天白云上彩色塔楼，花圃彩虹蝴蝶环绕，中央留空放标题按钮 | `cute chibi magical academy entrance, floating clouds, colorful pastel tower, rainbow, flower garden, butterflies, kawaii scene background, 1920x1080` |
| A2 | `assets/backgrounds/bg_map.png` | 地图/商店/休息/事件/奖励/宝箱（6场景共用） | 迷宫中庭空中花园，粉色喷泉、飘落花瓣、远处云雾中塔楼，温馨过渡场景，中央大片留空 | `chibi magical garden courtyard, pink fountain, floating flower petals, pastel, cozy cute background, kawaii scene, 1920x1080` |
| A3 | `assets/backgrounds/bg_battle_dungeon.png` | 普通战斗 | 糖果走廊，彩色糖砖墙、黑白棋盘格地板、棒棒糖路灯、糖果挂饰天花板，中央偏暗突出角色 | `chibi candy dungeon corridor, colorful candy brick walls, checkerboard floor, lollipop lamps, bright pastel, battle background, kawaii, 1920x1080` |
| A4 | `assets/backgrounds/bg_battle_cave.png` | 精英战斗 | 魔法水晶洞，彩色发光水晶、蘑菇灯、地面小水潭，蓝紫色调，比糖果走廊更有压迫感 | `chibi magical crystal cave, glowing colorful crystals, mushroom lamps, reflective puddles, blue purple atmosphere, mysterious kawaii, 1920x1080` |
| A5 | `assets/backgrounds/bg_battle_boss.png` | Boss战斗 | 星愿殿堂，金色穹顶大厅、发光星座纹路地面、水晶柱、星光天花板，金色+深紫，最终决战感 | `chibi magical star wish palace, golden dome, glowing constellation floor, crystal pillars, starfall ceiling, gold purple epic, kawaii boss chamber, 1920x1080` |

---

### B. 敌人立绘（14张）

> 透明背景，正面朝向，Q版2~2.5头身比，2~3px黑色描边，idle站立姿态

#### 普通敌人（128×128）

| # | 文件路径 | 角色名 | 描述 | Prompt 关键词 |
|---|----------|--------|------|--------------|
| B1 | `assets/enemies/slime/enemy_slime_idle.png` | 布丁怪 | 粉色圆滚滚果冻布丁，顶插红草莓，两大圆眼有高光白点，底部略扁，调皮眼神 | `cute pink chibi pudding slime, round jelly body, strawberry on top, big sparkly eyes, kawaii, 2px outline, transparent bg, idle, 128x128` |
| B2 | `assets/enemies/mushroom/enemy_mushroom_idle.png` | 暴躁布丁 | 紫色布丁，身上插几根蜡笔当刺，眉毛皱起很凶，比B1略大 | `chibi purple angry pudding, crayons as spikes, grumpy eyebrows, kawaii monster, transparent bg, 128x128` |
| B3 | `assets/enemies/bat/enemy_bat_idle.png` | 泡泡蝙蝠 | 浅紫圆脸小蝙蝠，翅膀粉色爱心图案，嘴吐彩色泡泡，大圆眼，悬停姿态 | `chibi cute purple bat, heart pattern wings, blowing colorful bubbles, round big eyes, hovering, kawaii, transparent bg, 128x128` |
| B4 | `assets/enemies/shadow_mage/enemy_shadow_mage_idle.png` | 星座魔女 | Q版小女生，超大黑色魔法帽（帽上星座符文和星星装饰），黑色短裙制服，持发光魔法球，脸颊腮红，高冷表情 | `chibi witch girl, oversized black hat with star runes, school uniform dress, glowing magic orb, rosy cheeks, cool expression, kawaii, transparent bg, 128x128` |
| B5 | `assets/enemies/skeleton/enemy_skeleton_idle.png` | 棉花甲士 | 胖Q版骑士，粉白色棉花糖质感盔甲，圆头盔眼缝透出蓝光，左手大圆盾，蓬松可爱但一脸认真 | `chibi fluffy white cotton candy knight, blue glowing eyes in round helmet, big round white shield, chubby serious, kawaii, transparent bg, 128x128` |
| B6 | `assets/enemies/gargoyle/enemy_gargoyle_idle.png` | 暴走熊 | 圆滚Q版熊，棕色迷你皮革盔甲（有铆钉），双手各握大棒棒糖武器，脸颊红红，一脸不服气，有战斗贴贴伤疤 | `chibi bear warrior, tiny leather armor with rivets, lollipop weapons both hands, red cheeks, defiant expression, bandage stickers, kawaii, transparent bg, 128x128` |
| B7 | `assets/enemies/corrupted_knight/enemy_corrupted_knight_idle.png` | 布偶守卫 | 方形大头布偶，毛线X形缝合眼睛，棉布身体有缝合纹路，拿枕头当盾，浅棕米白色，破旧可爱 | `chibi stuffed ragdoll guardian, square head, X button eyes sewn, pillow shield, beige light brown, cute doll monster, kawaii, transparent bg, 128x128` |
| B8 | `assets/enemies/orc_berserker/enemy_orc_berserker_idle.png` | 暴走熊骑士 | 与B6相似但穿蓝色金属盔甲（有星星纹），持Q版巨剑，头顶小翅膀装饰，表情更凶 | `chibi armored bear, blue metal armor with star pattern, oversized chibi sword, small wing helmet decoration, fierce, kawaii, transparent bg, 128x128` |

#### 精英敌人（160×160）

| # | 文件路径 | 角色名 | 描述 | Prompt 关键词 |
|---|----------|--------|------|--------------|
| B9 | `assets/enemies/slime_king/enemy_slime_king_idle.png` | 布丁女王 | 大号粉紫布丁（比B1大1.5倍），夸张金色大皇冠，傲娇眼神翘睫毛，周围漂浮2~3颗小布丁臣子 | `chibi large pink purple pudding queen, oversized golden crown, tsundere eyes long lashes, small pudding minions floating, elite, kawaii, transparent bg, 160x160` |
| B10 | `assets/enemies/ancient_dragon/enemy_ancient_dragon_idle.png` | 狂暴糖果熊 | 巨大Q版糖果条纹熊，身上彩色糖果纹，双持特大棒棒糖，愤怒但圆润搞笑，头顶彩色爆炸发型 | `chibi large candy stripe bear berserker, dual giant lollipops, angry but round, rainbow afro hair, elite, kawaii, transparent bg, 160x160` |
| B11 | `assets/enemies/shadow_mage/enemy_shadow_mage_idle.png` | 诅咒魔女（精英版） | 黑白双色Q版小女生，左眼有紫色诅咒符文，半黑半白发，漂浮魔法书书页飘动，神秘一笑 | `chibi witch girl half black white hair, left eye purple curse rune, floating open magic tome, mysterious smile, monochrome, elite, kawaii, transparent bg, 160x160` |
| B12 | `assets/enemies/gargoyle/enemy_gargoyle_idle.png` | 石头布偶哨兵（精英版） | 更大布偶守卫（160），布艺展开翅膀，大号纽扣眼，棉花棒武器，大型布偶玩具感，存在感更强 | `chibi large stuffed doll sentinel, fabric wings spread, giant button eyes, cotton staff weapon, intimidating yet cute ragdoll, elite, kawaii, transparent bg, 160x160` |

> **注意**：B4与B11路径相同，B6与B12路径相同——代码用同一张图显示不同敌人。生成时选择精英版（B11、B12）覆盖即可，精英感比普通版稍强。

#### Boss（200×200）

| # | 文件路径 | 角色名 | 描述 | Prompt 关键词 |
|---|----------|--------|------|--------------|
| B13 | `assets/enemies/corrupted_knight/enemy_corrupted_knight_idle.png` | 甜心骑士长 | 全套粉色Q版盔甲，爱心纹路，被甜蜜魔法侵蚀散发粉色光晕，武器是巨型螺旋糖果棒棒糖剑，表情严肃 | `chibi boss knight, pink heart-patterned full armor, giant lollipop sword candy stripes, pink magical glow aura, serious face, boss, kawaii, transparent bg, 200x200` |
| B14 | `assets/enemies/ancient_dragon/enemy_ancient_dragon_idle.png` | 星愿守护龙 | Q版龙娘，人形+小龙尾+迷你龙翅，金色鳞片礼服，持星愿水晶权杖（顶端发光星星），高贵威严守护者气质，身后光晕 | `chibi dragon girl boss, small dragon tail wings, golden scale dress, star crystal scepter glowing, noble guardian expression, golden halo, kawaii boss, transparent bg, 200x200` |

> **注意**：B7与B13路径相同，B10与B14路径相同——生成时以Boss版（B13、B14）为准覆盖。

---

### C. 玩家角色（2张）

| # | 文件路径 | 描述 | Prompt 关键词 |
|---|----------|------|--------------|
| C1 | `assets/player/sprites/player_warrior_idle.png` | 128×128，Q版魔法少女2.5头身，粉紫魔法制服蓬蓬裙，银白双马尾，侧身发光卡牌契约册悬浮，左手指右，脸颊腮红，自信表情，朝右idle姿态 | `chibi magical girl, 2.5 head ratio, pink purple school uniform poofy skirt, silver twin tails, glowing card spellbook floating, facing right, rosy cheeks, confident, idle, kawaii, transparent bg, 128x128` |
| C2 | `assets/player/portrait/player_portrait.png` | 64×64，同角色半侧面特写（头至肩），大圆眼、腮红、双马尾，活泼自信表情，头像图，集中在正方形中央偏上 | `chibi magical girl portrait, big round eyes, rosy cheeks, twin tails, expressive happy face, avatar icon, kawaii, transparent bg, 64x64` |

---

### D. 卡牌模板（6张）

> 180×250，**不透明**（底色深色）。三个区域不放装饰（留空给代码叠加）：左上角费用区、中央上部图标区、中央下部描述文字区。装饰集中在边框和四角。

| # | 文件路径 | 级别 | 描述 | Prompt 关键词 |
|---|----------|------|------|--------------|
| D1 | `assets/card/templates/card_template_common.png` | 普通 | 白色圆角卡框，粉紫细边，四角小爱心装饰，简洁可爱，底色 `#fce4ec` | `chibi kawaii card frame common, white rounded border, pink purple thin edge, heart corner deco, pastel, RPG card template, 180x250` |
| D2 | `assets/card/templates/card_template_uncommon.png` | 罕见 | 浅绿色卡框，绿色发光边，四角四叶草装饰，比普通更精致，底色浅绿 | `chibi kawaii card frame uncommon, light green glowing border, clover corner deco, cute RPG card template, 180x250` |
| D3 | `assets/card/templates/card_template_rare.png` | 稀有 | 天蓝卡框，蓝宝石镶嵌边，四角星星宝石，微发光，底色浅蓝 | `chibi kawaii card frame rare, sky blue gem border, star gem corners, soft glow, cute RPG card template, 180x250` |
| D4 | `assets/card/templates/card_template_legendary.png` | 传说 | 金色卡框，金色爱心+星星装饰边，四角皇冠图案，彩虹光晕，底色深紫 | `chibi kawaii card frame legendary, gold rainbow border, crown corners, heart star deco, rainbow glow, cute RPG card template, 180x250` |
| D5 | `assets/card/templates/card_back.png` | 牌背 | 粉紫色底，中央大圆形徽章（内含星星眼睛+魔法阵），周围放射装饰线 | `chibi kawaii card back, pink purple bg, circular magical emblem, star eye pattern, radiating lines deco, cute RPG card back, 180x250` |
| D6 | `assets/card/templates/cost_crystal.png` | 费用水晶 | 32×32，Q版六边形宝石，浅青蓝 `#80deea`，有切面和白色高光点，周围微星星光点 | `chibi hexagonal crystal gem, cyan blue, sparkle highlight dots, energy cost icon, kawaii game UI, transparent bg, 32x32` |

---

### E. 卡牌类型图标（7张）

> 64×64，透明背景，Q版彩色图标

| # | 文件路径 | 名称 | 颜色 | 描述 | Prompt 关键词 |
|---|----------|------|------|------|--------------|
| E1 | `assets/card/icons/card_icon_attack.png` | 攻击 | 红 `#ef5350` | Q版小剑，剑刃高光，星星装饰爆炸感 | `chibi red sword with star burst sparkle, attack card icon, kawaii, transparent bg, 64x64` |
| E2 | `assets/card/icons/card_icon_defend.png` | 防御 | 蓝 `#42a5f5` | Q版圆盾，中央爱心，有光晕 | `chibi blue round shield, heart center, soft glow, defend card icon, kawaii, transparent bg, 64x64` |
| E3 | `assets/card/icons/card_icon_skill.png` | 技能 | 绿 `#66bb6a` | Q版魔法手势或五角星，有光效 | `chibi green magic hand gesture or pentagram with sparkles, skill card icon, kawaii, transparent bg, 64x64` |
| E4 | `assets/card/icons/card_icon_power.png` | 能力 | 金 `#ffd54f` | Q版皇冠+闪电组合，代表持续被动 | `chibi golden crown with lightning bolt, power card icon, kawaii, transparent bg, 64x64` |
| E5 | `assets/card/icons/card_icon_buff.png` | 增益 | 绿 `#66bb6a` | 向上箭头+星星，增益感 | `chibi green upward arrow with stars, buff card icon, kawaii, transparent bg, 64x64` |
| E6 | `assets/card/icons/card_icon_debuff.png` | 减益 | 紫 `#ab47bc` | 向下箭头+泡泡，减益感 | `chibi purple downward arrow with bubble, debuff card icon, kawaii, transparent bg, 64x64` |
| E7 | `assets/card/icons/card_icon_strike.png` | 斩击 | 红 `#ef5350` | 两剑X交叉，有星星爆炸效果 | `chibi red crossed swords X shape, star explosion sparkle, strike card icon, kawaii, transparent bg, 64x64` |

---

### F. 遗物图标（16张）

> 48×48，透明背景，Q版小物件风格，色彩鲜艳，有高光点

| # | 文件路径 | 遗物名 | 图形描述 | Prompt 关键词 |
|---|----------|--------|---------|--------------|
| F1 | `assets/ui/relics/relic_anchor.png` | 魔法护符 | 圆形金色护身符，星星保护纹路，淡金光晕 | `chibi golden round amulet charm, star pattern, soft glow, kawaii item icon, transparent bg, 48x48` |
| F2 | `assets/ui/relics/relic_lantern.png` | 星光提灯 | 粉色迷你灯笼，内有跳动星星光芒，灯笼上星星纹 | `chibi pink star lantern, glowing stars inside, star pattern, kawaii item icon, transparent bg, 48x48` |
| F3 | `assets/ui/relics/relic_strawberry.png` | 幸运草莓 | 圆润红草莓，表面金色光晕和星星点缀，叶片翠绿 | `chibi magical glowing strawberry, golden sparkles, green leaf, kawaii item icon, transparent bg, 48x48` |
| F4 | `assets/ui/relics/relic_meal_ticket.png` | 学院饭票 | 粉色小票据，爱心印章，锯齿边，轻微折痕 | `chibi pink meal ticket coupon, heart stamp seal, zigzag edge, kawaii item icon, transparent bg, 48x48` |
| F5 | `assets/ui/relics/relic_golden_idol.png` | 招财猫像 | 金色招财猫小摆件，一手举金币，宝石眼睛，小底座 | `chibi golden lucky cat figurine, raised paw holding coin, gem eyes, small base, kawaii item icon, transparent bg, 48x48` |
| F6 | `assets/ui/relics/relic_iron_boots.png` | 跑跑魔法鞋 | 有翅膀装饰的彩色运动鞋，翅膀微发光 | `chibi colorful winged sneakers, small glowing wings, kawaii item icon, transparent bg, 48x48` |
| F7 | `assets/ui/relics/relic_blood_ring.png` | 守护戒指 | 粉红宝石戒指，宝石发光晕，戒环爱心纹路 | `chibi pink gem ring, glowing heart pattern band, kawaii item icon, transparent bg, 48x48` |
| F8 | `assets/ui/relics/relic_war_drum.png` | 应援鼓 | 彩色小鼓，鼓面星星纹，系彩带，有弹跳感 | `chibi colorful drum, star pattern drumhead, colorful ribbons, kawaii item icon, transparent bg, 48x48` |
| F9 | `assets/ui/relics/relic_ancient_scroll.png` | 秘密笔记 | 卷起的粉色笔记本页，星星贴纸和心形涂鸦，边缘略翘 | `chibi rolled pink notebook page, star stickers, heart doodles, curled edge, kawaii item icon, transparent bg, 48x48` |
| F10 | `assets/ui/relics/relic_crystal_ball.png` | 魔法水晶球 | 圆形水晶球，内有漂浮星星和小闪光，底座云朵造型 | `chibi crystal ball with floating stars inside, cloud base, magical glow, kawaii item icon, transparent bg, 48x48` |
| F11 | `assets/ui/relics/relic_healing_spring.png` | 治愈喷泉 | 粉蓝色迷你喷泉，水花是心形，底盘花朵纹路 | `chibi pink blue mini fountain, heart-shaped water splash, flower base, kawaii item icon, transparent bg, 48x48` |
| F12 | `assets/ui/relics/relic_philosopher_stone.png` | 双刃水晶 | 紫色双色水晶，左侧暖光右侧冷光，两水晶合并造型 | `chibi dual color crystal, warm and cool light sides fused, purple, magical item icon, transparent bg, 48x48` |
| F13 | `assets/ui/relics/relic_burning_blood.png` | 胜利能量瓶 | 红色小能量饮料瓶，标签闪电图案，瓶盖气泡 | `chibi red energy drink bottle, lightning bolt label, bubbles on cap, kawaii item icon, transparent bg, 48x48` |
| F14 | `assets/ui/relics/relic_ring_of_serpent.png` | 敏捷蛇环 | 绿色可爱小蛇弯成戒指形状，蛇眼是蓝宝石，蛇身有鳞片 | `chibi cute green snake ring, sapphire eyes, scale pattern, kawaii item icon, transparent bg, 48x48` |
| F15 | `assets/ui/relics/relic_fusion_hammer.png` | 金币锤 | 锤头是金色大硬币的小锤子，锤柄彩色条纹，圆润可爱 | `chibi gold coin hammer, colorful striped handle, round cute, kawaii item icon, transparent bg, 48x48` |
| F16 | `assets/ui/relics/relic_runic_dome.png` | 迷雾水晶 | 半透明蓝色圆顶水晶罩，内有星形雾气，底部符文环 | `chibi blue translucent crystal dome, star fog inside, rune ring base, kawaii item icon, transparent bg, 48x48` |

---

### G. 状态效果图标（13张）

> 32×32，透明背景，Q版图标，颜色鲜明一眼可辨

| # | 文件路径 | 状态名 | 颜色 | 图形描述 | Prompt 关键词 |
|---|----------|--------|------|---------|--------------|
| G1 | `assets/ui/status/status_strength.png` | 魔力强化 | 红 `#ef5350` | 握拳+星星爆炸，力量感 | `chibi red fist with star burst, strength status icon, kawaii, transparent bg, 32x32` |
| G2 | `assets/ui/status/status_dexterity.png` | 轻盈加速 | 绿 `#66bb6a` | 绿色羽毛或风纹，轻盈感 | `chibi green feather wind swirl, dexterity status icon, kawaii, transparent bg, 32x32` |
| G3 | `assets/ui/status/status_vulnerable.png` | 弱点暴露 | 橙 `#ff7043` | 橙色破碎盾牌，裂纹碎片飞散 | `chibi orange cracked shield fragments, vulnerable status icon, kawaii, transparent bg, 32x32` |
| G4 | `assets/ui/status/status_weak.png` | 软绵绵 | 黄 `#ffd54f` | 下垂的黄色魔法棒，耷拉无力感 | `chibi yellow drooping magic wand, weak status icon, kawaii, transparent bg, 32x32` |
| G5 | `assets/ui/status/status_poison.png` | 毒毒状态 | 毒绿 `#a5d6a7` | 毒绿圆形泡泡内有骷髅，黏液感 | `chibi toxic green bubble with skull inside, poison status icon, kawaii, transparent bg, 32x32` |
| G6 | `assets/ui/status/status_thorns.png` | 反弹星星 | 棕绿 `#8d6e63` | 带刺的小星星，棕绿色，尖刺感 | `chibi spiky star with thorns, brown green, thorns status icon, kawaii, transparent bg, 32x32` |
| G7 | `assets/ui/status/status_regeneration.png` | 回复光环 | 粉 `#f48fb1` | 心形+向上螺旋小箭头，粉红治愈感 | `chibi pink heart with upward spiral arrow, regeneration status icon, kawaii, transparent bg, 32x32` |
| G8 | `assets/ui/status/status_fortify.png` | 泡泡护甲 | 蓝 `#90caf9` | 圆形泡泡盾，蓝色，有高光点 | `chibi blue bubble shield with highlight, fortify status icon, kawaii, transparent bg, 32x32` |
| G9 | `assets/ui/status/status_barricade.png` | 永久护盾 | 蓝 `#42a5f5` | 蓝色盾牌+小锁图案，格挡保留感 | `chibi blue shield with small lock icon, barricade status icon, kawaii, transparent bg, 32x32` |
| G10 | `assets/ui/status/status_ritual.png` | 成长光环 | 金 `#ffd54f` | 金色向上螺旋+小星星，成长感 | `chibi golden upward spiral with small stars, ritual growth status icon, kawaii, transparent bg, 32x32` |
| G11 | `assets/ui/status/status_metallicize.png` | 钢铁少女 | 银 `#b0bec5` | 银色金属盾纹，有机械感但圆润 | `chibi silver metallic shield pattern hexagon, metallicize status icon, kawaii, transparent bg, 32x32` |
| G12 | `assets/ui/status/status_frail.png` | 脆脆状态 | 橙 `#ffcc80` | 橙色破碎心形，碎裂感 | `chibi orange cracked heart, frail status icon, kawaii, transparent bg, 32x32` |
| G13 | `assets/ui/status/status_weak.png` | 留牌标记 | 绿 `#a5d6a7` | 绿色小书签，有爱心 | `chibi green bookmark with heart, retain status icon, kawaii, transparent bg, 32x32` |

> **注意**：G9（status_barricade.png）、G10（status_ritual.png）、G11（status_metallicize.png）、G12（status_frail.png）当前代码中 `icon_path` 为空，需要**新建文件**并同时更新代码中对应的 `icon_path` 字段。

---

### H. 地图节点图标（7张）

> 32×32，透明背景，小尺寸下清晰可辨，Q版圆润图标

| # | 文件路径 | 节点名 | 颜色 | Prompt 关键词 |
|---|----------|--------|------|--------------|
| H1 | `assets/ui/icons/icon_battle.png` | 怪怪对决 | 红 | `chibi crossed swords with star sparkle, red, battle map node icon, kawaii, transparent bg, 32x32` |
| H2 | `assets/ui/icons/icon_elite.png` | 强敌来袭 | 橙 | `chibi crown with exclamation mark, orange, elite map node icon, kawaii, transparent bg, 32x32` |
| H3 | `assets/ui/icons/icon_boss.png` | 最终守护者 | 深红 | `chibi small dragon head silhouette, dark red, boss map node icon, kawaii, transparent bg, 32x32` |
| H4 | `assets/ui/icons/icon_shop.png` | 魔法杂货铺 | 金 | `chibi gold coin bag with sparkle, golden yellow, shop map node icon, kawaii, transparent bg, 32x32` |
| H5 | `assets/ui/icons/icon_question.png` | 神秘事件 | 紫 | `chibi question mark with small scroll, purple, mystery event map node icon, kawaii, transparent bg, 32x32` |
| H6 | `assets/ui/icons/icon_rest.png` | 甜蜜休息站 | 暖绿 | `chibi campfire with heart-shaped flame, warm orange, rest map node icon, kawaii, transparent bg, 32x32` |
| H7 | `assets/ui/icons/icon_chest.png` | 惊喜宝箱 | 金棕 | `chibi treasure chest with ribbon bow, golden brown, chest map node icon, kawaii, transparent bg, 32x32` |

---

### I. 战斗意图图标（6张）

> 32×32，透明背景，**白色单色**图标（代码用 modulate 上色），简洁轮廓

| # | 文件路径 | 意图 | Prompt 关键词 |
|---|----------|------|--------------|
| I1 | `assets/ui/intents/intent_sword.png` | 攻击 | `white minimal chibi sword pointing up, clean outline, game intent icon, transparent bg, 32x32` |
| I2 | `assets/ui/intents/intent_shield.png` | 防御 | `white minimal chibi round shield with heart, clean outline, game intent icon, transparent bg, 32x32` |
| I3 | `assets/ui/intents/intent_buff.png` | 增益 | `white minimal upward arrow with star rays, clean outline, game intent icon, transparent bg, 32x32` |
| I4 | `assets/ui/intents/intent_debuff.png` | 减益 | `white minimal downward arrow with small bubble, clean outline, game intent icon, transparent bg, 32x32` |
| I5 | `assets/ui/intents/intent_stun.png` | 眩晕 | `white minimal three stars circling, dizzy effect, clean outline, game intent icon, transparent bg, 32x32` |
| I6 | `assets/ui/intents/intent_question.png` | 未知 | `white minimal rounded question mark, clean outline, game intent icon, transparent bg, 32x32` |

---

### J. 能量 HUD 图标（2张）

| # | 文件路径 | 尺寸 | 描述 | Prompt 关键词 |
|---|----------|------|------|--------------|
| J1 | `assets/ui/icons/ui_energy_crystal.png` | 36×36 | Q版六边形水晶，浅青蓝 `#80deea`，星星高光，小光晕；代码在旁叠加「3/3」数字 | `chibi hexagonal energy crystal, cyan blue, star sparkle highlight, soft glow halo, game HUD icon, kawaii, transparent bg, 36x36` |
| J2 | `assets/ui/icons/ui_energy_base.png` | 80×80 | 圆形或六边形石质底座，中央凹陷水晶镶嵌槽，边缘有能量流动光线，粉紫色系 | `chibi round hexagonal pedestal base, crystal socket center, glowing energy lines on edge, pink purple, kawaii game HUD, transparent bg, 80x80` |

---

### K. 牌堆图标（2张）

| # | 文件路径 | 尺寸 | 描述 | Prompt 关键词 |
|---|----------|------|------|--------------|
| K1 | `assets/ui/icons/icon_draw_pile.png` | 32×32 | 叠放整齐的Q版小卡牌（俯视角），蓝色调，牌背朝上，整齐可爱 | `chibi stacked cards pile top view, blue tones, neat card backs, kawaii game icon, transparent bg, 32x32` |
| K2 | `assets/ui/icons/icon_discard_pile.png` | 32×32 | 散乱的Q版小卡牌（角度不齐，「用过了」感觉），灰色调 | `chibi scattered used cards messy pile, grey tones, kawaii game icon, transparent bg, 32x32` |

---

### L. 系统功能图标（4张）

> 32×32，透明背景，Q版简洁风格

| # | 文件路径 | 名称 | 描述 | Prompt 关键词 |
|---|----------|------|------|--------------|
| L1 | `assets/ui/icons/icon_audio_on.png` | 音效开 | Q版喇叭，有声波纹，粉紫色，开启感 | `chibi speaker icon with sound waves, pink purple, audio on, kawaii game UI icon, transparent bg, 32x32` |
| L2 | `assets/ui/icons/icon_audio_off.png` | 音效关 | Q版喇叭，有红色×或斜线，关闭感 | `chibi speaker icon with red X cross, muted, audio off, kawaii game UI icon, transparent bg, 32x32` |
| L3 | `assets/ui/icons/icon_settings.png` | 设置 | Q版圆形齿轮，粉色系，中央有星星 | `chibi round gear settings icon, pink pastel, star center, kawaii game UI icon, transparent bg, 32x32` |
| L4 | `assets/ui/icons/icon_close.png` | 关闭 | Q版圆形×号，红色，边缘有圆润感 | `chibi round close button X, red, rounded edges, kawaii game UI icon, transparent bg, 32x32` |

---

### M. 按钮样式图片（4张）

> 按钮背景图，作为 Godot NineSlatch 九宫格拉伸纹理，尺寸建议 **64×32**（可横向拉伸），带透明背景，圆角胶囊形状

| # | 文件路径 | 状态 | 描述 | Prompt 关键词 |
|---|----------|------|------|--------------|
| M1 | `assets/ui/buttons/ui_btn_normal.png` | 普通态 | 粉紫色圆角胶囊按钮，略有渐变（上亮下暗），有小星星装饰边 | `chibi kawaii button normal state, pink purple capsule shape, subtle gradient, star edge deco, transparent bg, 64x32` |
| M2 | `assets/ui/buttons/ui_btn_hover.png` | 悬停态 | 比普通态亮一点，有淡淡发光边框 | `chibi kawaii button hover state, brighter pink purple capsule, soft glow border, transparent bg, 64x32` |
| M3 | `assets/ui/buttons/ui_btn_pressed.png` | 按下态 | 比普通态暗一点、略向下偏移感，有按下的「凹陷」感 | `chibi kawaii button pressed state, darker pink purple capsule, slightly indented look, transparent bg, 64x32` |
| M4 | `assets/ui/buttons/ui_btn_disabled.png` | 禁用态 | 灰色，透明度较低，整体暗淡 | `chibi kawaii button disabled state, grey capsule, low opacity dull, transparent bg, 64x32` |

---

### N. 面板背景（2张）

> Godot NineSlatch 九宫格拉伸纹理，建议尺寸 **96×96**，透明背景，圆角矩形

| # | 文件路径 | 名称 | 描述 | Prompt 关键词 |
|---|----------|------|------|--------------|
| N1 | `assets/ui/panels/ui_panel_dark.png` | 深色面板 | 深紫色半透明圆角面板，边框有细光线，内部略透明 | `chibi kawaii dark panel, deep purple semi-transparent rounded rectangle, thin glowing border, UI panel, transparent bg, 96x96` |
| N2 | `assets/ui/panels/ui_panel_light.png` | 浅色面板 | 浅粉/白色半透明圆角面板，有粉色细边框，用于信息展示 | `chibi kawaii light panel, soft white pink semi-transparent rounded rectangle, pink thin border, UI panel, transparent bg, 96x96` |

---

### O. 血量和格挡条（3张）

> 256×24，**不透明**，横向条形，可水平拉伸，圆角两端

| # | 文件路径 | 用途 | 描述 | Prompt 关键词 |
|---|----------|------|------|--------------|
| O1 | `assets/ui/bars/ui_hp_bar_bg.png` | 血量条背景槽 | 浅粉色圆角槽，`#fce4ec`，有轻微凹陷感，两端圆角 | `kawaii HP bar background slot, soft pink rounded, subtle inset shadow, 256x24` |
| O2 | `assets/ui/bars/ui_hp_bar_fill.png` | 血量填充条 | 粉红渐变 `#f48fb1`→`#e91e63`，表面有爱心光泽高光，两端圆角 | `kawaii HP bar fill, pink red gradient, heart gloss highlight, rounded ends, 256x24` |
| O3 | `assets/ui/bars/ui_block_bar_fill.png` | 格挡填充条 | 天蓝渐变 `#81d4fa`→`#0288d1`，表面有星星光泽高光，两端圆角 | `kawaii block bar fill, sky blue gradient, star gloss highlight, rounded ends, 256x24` |

---

### P. 特效纹理（6张）

> 透明背景，Godot 粒子系统单帧纹理，每张都是单颗粒子或单次特效

| # | 文件路径 | 尺寸 | 用途 | 描述 | Prompt 关键词 |
|---|----------|------|------|------|--------------|
| P1 | `assets/vfx/effects/hit_slash.png` | 128×128 | 斩击命中特效 | 粉红/白色弧形刀光，有速度线，少女漫风格 | `kawaii pink white slash arc speed lines, hit effect texture, transparent bg, 128x128` |
| P2 | `assets/vfx/effects/magic_burst.png` | 128×128 | 魔法爆发特效 | 粉紫色圆形爆炸，中央亮外围淡，有星星散射 | `kawaii pink purple magic burst circle, bright center fade out, star scatter, VFX texture, transparent bg, 128x128` |
| P3 | `assets/vfx/particles/particle_fire.png` | 32×32 | 火焰粒子 | 圆润Q版小火焰，橙粉色，可爱 | `chibi round cute flame particle, orange pink, kawaii, transparent bg, 32x32` |
| P4 | `assets/vfx/particles/particle_poison.png` | 32×32 | 毒液粒子 | 毒绿色小水滴，有小骷髅图案，Q版 | `chibi toxic green water drop with tiny skull, poison particle, kawaii, transparent bg, 32x32` |
| P5 | `assets/vfx/particles/particle_shield.png` | 32×32 | 护盾粒子 | 蓝色菱形水晶，有高光点 | `chibi blue diamond crystal with highlight, shield particle, kawaii, transparent bg, 32x32` |
| P6 | `assets/vfx/particles/particle_spark.png` | 32×32 | 火花粒子 | 四角星形，粉黄色，少女漫闪光感 | `chibi four-point star sparkle, pink yellow, shojo manga style, spark particle, transparent bg, 32x32` |

---

## 三、汇总统计

| 分组 | 类别 | 数量 |
|------|------|------|
| A | 背景图 | 5 |
| B | 敌人立绘（普通8+精英4+Boss2，含路径复用） | 14 |
| C | 玩家角色 | 2 |
| D | 卡牌模板+背面+费用水晶 | 6 |
| E | 卡牌类型图标 | 7 |
| F | 遗物图标 | 16 |
| G | 状态效果图标 | 13 |
| H | 地图节点图标 | 7 |
| I | 战斗意图图标 | 6 |
| J | 能量 HUD 图标 | 2 |
| K | 牌堆图标 | 2 |
| L | 系统功能图标 | 4 |
| M | 按钮样式图片 | 4 |
| N | 面板背景 | 2 |
| O | 血量格挡条 | 3 |
| P | 特效纹理 | 6 |
| **合计** | | **99 张** |

---

## 四、操作流程

```
1. 用 AI 工具（Midjourney / DALL-E / NovelAI 等）生成对应图片
2. 将文件重命名为表格中的文件名
3. 放入 assets/ 对应子目录，直接覆盖原文件
4. 重新运行 Godot 项目，自动重新导入，无需改代码
```

**例外（需要同时改代码）**：
- G9 `status_barricade.png`：需在 `status_view_factory.gd` 第 63 行补上 `"icon_path": "res://assets/ui/status/status_barricade.png"`
- G10 `status_ritual.png`：需在第 70 行补上 `"icon_path": "res://assets/ui/status/status_ritual.png"`
- G11 `status_metallicize.png`：需在第 77 行补上 `"icon_path": "res://assets/ui/status/status_metallicize.png"`
- G12 `status_frail.png`：需在第 36 行补上 `"icon_path": "res://assets/ui/status/status_frail.png"`
