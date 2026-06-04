# SlayDemo AI 美术生成需求文档（v1 · 已废弃）

> ⚠️ **本文档已废弃**，请使用新版：[11-ai-art-generation-brief-v2-cute.md](./11-ai-art-generation-brief-v2-cute.md)
>
> 版本：v1.0（暗黑奇幻旧世界观，已被《甜心迷宫》Q版卡通世界观取代）
> 废弃日期：2026-06-04

---

## 一、项目美术背景

SlayDemo 是一款暗黑奇幻卡牌游戏，玩家在地下城地图中探索、战斗、获得卡牌和遗物。  
当前资源为从网络爬取的占位素材，风格不统一，需通过 AI 批量生成一套风格统一的完整美术包。

**换资源的方式很简单**：Godot 代码通过文件路径加载图片，只需用同名文件覆盖 `assets/` 目录下的对应文件即可，无需改代码（新增资源除外）。

---

## 二、全局风格定义

所有资源必须遵循以下统一风格，生成每张图时都要带上这段描述：

### 2.1 风格关键词

```
整体风格：暗黑奇幻扁平手绘（Dark Fantasy Flat Hand-drawn）
色调基调：深蓝紫为主，暖金色点缀，局部高光
光影处理：无写实光影，允许轻微渐变（2色以内），无内阴影
线条：2px 均匀描边（可以无描边），填充纯色或微渐变
质感：轻微噪点叠加可选，整体保持"扁平但有重量感"
动画：仅静帧，无动画需求
参考游戏：Slay the Spire（杀戮尖塔），风格比原作更扁平、更简洁
```

### 2.2 主色板

| 用途 | 色值 | 说明 |
|------|------|------|
| 场景底色 | `#1a1a2e` | 极深蓝紫，所有背景图的主色 |
| 次级面板底色 | `#16213e` | 深海蓝，用于卡牌底框和面板 |
| 交互元素底色 | `#0f3460` | 钴蓝，按钮和可点击元素 |
| 主要文字色 | `#e2e2e2` | 不纯白，所有 UI 文字 |
| 次要文字色 | `#a0a0b0` | 柔灰，描述文字 |
| 攻击 / 伤害 | `#ff4444` | 鲜红，攻击类元素 |
| 格挡 / 防御 | `#4488ff` | 盾牌蓝，防御类元素 |
| 技能 / 治愈 | `#44cc88` | 翠绿，技能类元素 |
| 能量 / 费用 | `#00d2ff` | 亮青，能量水晶 |
| 金币 / 奖励 | `#ffcc00` | 金黄，奖励类元素 |
| 诅咒 / 负面 | `#9944cc` | 暗紫，减益类元素 |
| 危险 / 意图 | `#ff6644` | 橙红，敌人攻击预警 |

### 2.3 输出规范

| 参数 | 要求 |
|------|------|
| 格式 | PNG |
| 色彩空间 | sRGB |
| 背景 | **透明背景**（背景图除外） |
| 命名 | 严格按文档中的文件名，不要更改 |
| 尺寸 | 按每条需求中标注的尺寸，不要缩放 |

---

## 三、资源需求清单

### ★ 分批建议

| 批次 | 内容 | 优先级 | 预计数量 |
|------|------|--------|---------|
| **第一批** | 状态图标、遗物图标、地图图标 | P0，缺失影响体验 | 20 张 |
| **第二批** | 敌人立绘、玩家角色 | P1，影响战斗视觉 | 12 张 |
| **第三批** | 背景图、卡牌底框 | P2，整体氛围 | 10 张 |
| **第四批** | 卡牌图标、HUD、特效 | P3，细节打磨 | 37 张 |

---

### 3.1 背景图（P2）

**通用要求**：1920×1080 px，无透明背景，横向构图，画面中央留出较大空白区域（用于放置游戏 UI），主视觉集中在画面边缘和背景层次。

---

**[BG-01] 主菜单背景**  
文件路径：`assets/backgrounds/bg_main_menu.png`  
尺寸：1920×1080

> 场景描述：游戏主菜单的背景，玩家第一眼看到的画面，需要建立"暗黑奇幻冒险"的氛围。
>
> 画面内容：远处地下城入口，拱形石门微微透出内部神秘蓝光；前景是几根风化石柱的轮廓；地面是粗糙石板，有少量青苔；整体画面沉浸感强但不压抑。画面中央偏上 40% 区域保持相对干净（用于放标题和按钮）。
>
> 关键词：`dark dungeon entrance, stone arch, mysterious blue glow, torchlight, ancient ruins, atmospheric, dark fantasy, flat art style`

---

**[BG-02] 通用界面背景（地图/商店/奖励/事件/休息/宝箱）**  
文件路径：`assets/backgrounds/bg_map.png`  
尺寸：1920×1080

> 场景描述：地图、商店、奖励选择、事件、休息点、宝箱等 6 个场景共用此背景。需要足够通用，不能有太强的特定场景感，整体作为"过渡/决策界面"的底衬。
>
> 画面内容：俯视古旧地图感，羊皮纸质地的石板地面，边缘有古代符文刻纹，少量蜡烛或荧光石点缀；不出现具体角色或场景物体；整体色调偏暖（相比其他背景图），有探索感。
>
> 关键词：`ancient map parchment, stone floor overhead view, runes, candlelight, exploration feeling, warm tones, flat dark fantasy`

---

**[BG-03] 普通战斗背景**  
文件路径：`assets/backgrounds/bg_battle_dungeon.png`  
尺寸：1920×1080

> 场景描述：与普通敌人战斗时的背景，代表地下城某处走廊。战斗感，但不是最终决战。
>
> 画面内容：地牢走廊内部，两侧石砖墙，有铁制壁灯或火把，地面湿润带反光；拱形天花板上方渐隐入黑暗；整体光线昏暗，有 2-3 处火把光源；画面中央（放角色的位置）偏暗，更突出角色。
>
> 关键词：`dungeon corridor interior, stone walls, torches wall sconces, dark and gritty, battle background, fantasy RPG, moody lighting`

---

**[BG-04] 精英战斗背景**  
文件路径：`assets/backgrounds/bg_battle_cave.png`  
尺寸：1920×1080

> 场景描述：与精英敌人战斗时的背景，比普通战斗更有压迫感和神秘感，暗示遇到了更强的对手。
>
> 画面内容：深处洞窟，钟乳石从天花板垂落，地面有发光蓝色真菌或水晶；整体蓝紫色调；能感觉到这里是野兽或强大生物的巢穴；比普通战斗背景更"邪恶"。
>
> 关键词：`deep cave, stalactites, glowing blue crystals, fungi, purple atmosphere, ominous, elite encounter, dark fantasy battle background`

---

**[BG-05] Boss 战斗背景**  
文件路径：`assets/backgrounds/bg_battle_boss.png`  
尺寸：1920×1080

> 场景描述：与 Boss 战斗的最终场景，全游戏最具压迫感的背景，玩家进入时应立刻感受到"这是最终决战"。
>
> 画面内容：宏大的地下大厅，巨大石柱两侧排列，地面有发光的古代阵法符文；远处有巨大的暗红色熔岩缝隙透出光；整体红黑色调，局部橙红高光；空间感要大，天花板高不可见；左右各有一个巨大的石刻图腾。
>
> 关键词：`massive underground throne room, ancient pillars, lava cracks, glowing runes, red and black, boss battle chamber, epic scale, dark fantasy`

---

### 3.2 卡牌资源（P2-P3）

#### 3.2.1 卡牌底框

**通用要求**：180×250 px，无透明背景（底色为深色）。卡牌分为几个固定区域，AI 生成时注意留白：
- **左上角**：约 25% 宽 × 18% 高的区域，用于显示费用数字（代码叠加）
- **中央上部**：约 64% 宽 × 29% 高的矩形区域，用于显示卡牌图标（代码叠加）
- **中央下部**：约 78% 宽 × 30% 高的区域，用于显示卡牌描述文字（代码叠加）

这三个区域**不要有任何文字、图案或装饰**，只能有底色或极淡的纹理。装饰集中在卡牌边框、四角和最下方区域。

---

**[CARD-01] 普通卡牌底框**  
文件路径：`assets/card/templates/card_template_common.png`  
尺寸：180×250

> 风格：朴素、坚实，灰色系，无过多装饰，适合基础卡牌。
>
> 画面内容：深灰蓝色卡牌底色 `#16213e`；边框用 2px 浅灰色 `#8b8b8b`；四角有简单的石纹装饰；卡牌上边和下边有轻微的石材纹理；整体感觉厚重、基础。
>
> 关键词：`card frame common grey, stone border, simple RPG card template, dark background, minimal decoration, flat design`

---

**[CARD-02] 非常见卡牌底框**  
文件路径：`assets/card/templates/card_template_uncommon.png`  
尺寸：180×250

> 风格：比普通卡牌更精致，绿色金属质感，有少量符文装饰。
>
> 画面内容：深蓝绿色底色；边框用绿色金属感 `#44aa44`；四角有符文花纹；边框上有轻微光泽感；整体比普通级别更"华贵"一些。
>
> 关键词：`card frame uncommon green, metallic border, rune decoration, RPG card template, dark fantasy, flat design`

---

**[CARD-03] 稀有卡牌底框**  
文件路径：`assets/card/templates/card_template_rare.png`  
尺寸：180×250

> 风格：明显区别于前两者，蓝色宝石镶嵌边框，有明显的装饰性。
>
> 画面内容：深蓝色底色；边框用蓝色 `#4488ff` 配合小型宝石镶嵌点；四角有精致的卷草纹或宝石图案；边框发出微弱蓝色光晕；整体有"珍贵"的感觉。
>
> 关键词：`card frame rare blue, sapphire gems embedded, glowing border, ornate decoration, RPG card template, dark fantasy`

---

**[CARD-04] 传说卡牌底框**  
文件路径：`assets/card/templates/card_template_legendary.png`  
尺寸：180×250

> 风格：全套中最华丽，金色龙纹图案，有明显发光效果。
>
> 画面内容：极深紫色底色；边框用金色 `#ffcc00`；四角有龙头或龙爪图案；边框上有细密的金色纹路；整体散发金色光晕；看上去极度珍贵。
>
> 关键词：`card frame legendary gold, dragon motif, glowing golden border, ornate, royal, RPG card template, dark fantasy`

---

**[CARD-05] 卡牌背面**  
文件路径：`assets/card/templates/card_back.png`  
尺寸：180×250

> 场景描述：牌堆中未被玩家看到时显示的卡牌背面，需要有神秘感。
>
> 画面内容：深蓝紫色底色；中央有一个圆形徽章图案，内含星辰/眼睛/符文等神秘元素；徽章周围有放射状装饰纹路；整体对称，无文字。
>
> 关键词：`card back, mystical emblem, dark blue, runes, star pattern, symmetrical design, mysterious, RPG deck card back`

---

**[CARD-06] 费用水晶图标**  
文件路径：`assets/card/templates/cost_crystal.png`  
尺寸：32×32，透明背景

> 场景描述：每张卡牌左上角的能量费用图标，代码会在上面叠加数字。
>
> 画面内容：六边形宝石/水晶形状；亮青色 `#00d2ff`；有明显的宝石切面高光；周围有微弱的能量光晕；整体小巧但醒目。
>
> 关键词：`energy crystal gem hexagonal, cyan blue, glowing, faceted gem, game UI cost icon, transparent background`

---

#### 3.2.2 卡牌类型图标（用于卡牌中央图案区域）

**通用要求**：64×64 px，透明背景，单色图标（前景色为下方标注的颜色，背景透明）。图标需要在小尺寸下保持清晰可辨。

| 编号 | 文件路径 | 图标名 | 颜色 | 图形描述 |
|------|----------|--------|------|---------|
| ICON-C01 | `assets/card/icons/card_icon_attack.png` | 攻击 | `#ff4444` 红色 | 单把向上的剑，剑身有简单光泽，棱角分明，刀锋锋利感 |
| ICON-C02 | `assets/card/icons/card_icon_defend.png` | 防御 | `#4488ff` 蓝色 | 正面圆形盾牌，中央有简单纹章，厚实感，盾牌弧度明显 |
| ICON-C03 | `assets/card/icons/card_icon_skill.png` | 技能 | `#44cc88` 绿色 | 魔法手势轮廓（手掌朝上，指尖有星光），或五角星形光效 |
| ICON-C04 | `assets/card/icons/card_icon_power.png` | 能力（持久） | `#ffcc00` 金色 | 闪电 + 皇冠组合，或发光的宝石核心，代表持续生效的被动 |
| ICON-C05 | `assets/card/icons/card_icon_buff.png` | 增益 | `#44cc88` 绿色 | 向上箭头 + 光芒，箭头顶部有光晕放射，代表强化效果 |
| ICON-C06 | `assets/card/icons/card_icon_debuff.png` | 减益 | `#9944cc` 紫色 | 向下箭头 + 毒液滴，箭头尾部有毒雾感，代表弱化效果 |
| ICON-C07 | `assets/card/icons/card_icon_strike.png` | 斩击 | `#ff4444` 红色 | 两把剑呈 X 形交叉，有斩击轨迹感，代表基础攻击 |

---

### 3.3 敌人立绘（P1）

**通用要求**：
- 透明背景
- 正面或四分之三侧面朝向屏幕，整体竖直构图
- 扁平手绘风格，有轮廓线，无写实光影
- 人物需要有明显的"站立待机"（idle）姿态感，不能是动作中途
- 普通敌人 128×128，精英敌人 160×160，Boss 200×200

---

**[ENEMY-01] 小史莱姆**  
文件路径：`assets/enemies/slime/enemy_slime_idle.png`  
尺寸：128×128

> 描述：游戏中最弱的敌人，基础小怪。应该看起来有点可爱但带着邪恶感，是游戏的入门威胁。
>
> 外形：圆滚滚的水滴/椭圆形身体，浅绿色（明亮的草绿 `#55cc44`）；两个圆形大白眼睛，瞳孔是垂直的黑色细长椭圆（有点邪恶）；身体底部略扁，有黏液感；无手无脚，整体只有圆形身体和眼睛；2px 深绿色描边。
>
> 关键词：`small green slime monster, cute but menacing, round blob body, big oval eyes, slimy texture, dark fantasy flat art, idle pose, transparent background`

---

**[ENEMY-02] 尖刺史莱姆**  
文件路径：`assets/enemies/mushroom/enemy_mushroom_idle.png`  
尺寸：128×128

> 描述：比小史莱姆更危险的史莱姆变种，身体带尖刺，是尖刺史莱姆而不是蘑菇（文件名保留旧名以兼容代码）。
>
> 外形：整体形状与小史莱姆相似，但颜色偏紫色 `#9944cc`；身体外表有 5-7 根尖锐的刺突出（像仙人掌）；眼睛更细更凶，带红色眼眶；整体比小史莱姆大 20-30%；更有攻击性的感觉。
>
> 关键词：`spiky slime monster, purple, thorns on body, aggressive eyes, dangerous, dark fantasy flat art, idle pose, transparent background`

---

**[ENEMY-03] 毒素蝙蝠**  
文件路径：`assets/enemies/bat/enemy_bat_idle.png`  
尺寸：128×128

> 描述：地下城中的毒性蝙蝠，飞行单位，有毒液效果。
>
> 外形：展开双翅的蝙蝠，翅膀呈紫绿色渐变（翅膜半透明感）；身体小而紧凑，深灰色；眼睛发出毒绿色荧光；翅膀边缘有轻微毒液滴落的效果；嘴部有尖牙；整体感觉是在悬停/盘旋的姿态。
>
> 关键词：`poison bat monster, spread wings, purple-green wings, glowing toxic eyes, fangs, dark fantasy flat art, hovering idle pose, transparent background`

---

**[ENEMY-04] 暗影法师**  
文件路径：`assets/enemies/shadow_mage/enemy_shadow_mage_idle.png`  
尺寸：128×128

> 描述：黑袍魔法使者，同时用于暗影信徒和亡灵法师两个敌人（文件复用）。偏魔法/法术型敌人的通用形象。
>
> 外形：穿黑色连帽长袍的人形轮廓，脸部在阴影中看不清；双手持一根末端发暗紫色光的法杖；袍子下摆飘动感（如同漂浮在空中）；袍子上有发光的暗紫色符文图案；整体形象神秘且威胁感强。
>
> 关键词：`dark robe mage, hooded figure, glowing purple runes, magic staff, shadow caster, floating robes, dark fantasy flat art, idle pose, transparent background`

---

**[ENEMY-05] 盾卫骷髅**  
文件路径：`assets/enemies/skeleton/enemy_skeleton_idle.png`  
尺寸：128×128

> 描述：亡灵骷髅士兵，手持盾牌，以防御著称的近战小怪。
>
> 外形：骷髅人形，骨骼清晰可见；左手持大圆盾（盾牌用深蓝色，带骷髅纹章）；右手持短剑；眼窝发蓝色幽火；穿破损的铁质护甲（胸甲、护腕）；站立备战姿态，盾牌前置。
>
> 关键词：`skeleton warrior with shield, bone soldier, blue soul fire eyes, iron armor, tower shield, undead, dark fantasy flat art, idle pose, transparent background`

---

**[ENEMY-06] 石像鬼**  
文件路径：`assets/enemies/gargoyle/enemy_gargoyle_idle.png`  
尺寸：128×128

> 描述：石质怪物，用于狂战士、石像守卫、狂暴兽人的通用占位形象。偏"重甲近战蛮力型"敌人。
>
> 外形：石质皮肤，灰棕色；身体粗壮，有翼但翼膀折叠在背后；蹲伏的备战姿态，拳头落地；眼睛发橙红色光；整体厚重、笨拙但力量感强；有裂缝纹路感（像石雕）。
>
> 关键词：`gargoyle stone monster, crouched stance, folded wings, glowing eyes, stone texture, brutish, dark fantasy flat art, idle pose, transparent background`

---

**[ENEMY-07] 腐化骑士（Boss）**  
文件路径：`assets/enemies/corrupted_knight/enemy_corrupted_knight_idle.png`  
尺寸：200×200

> 描述：第一个 Boss，曾经的荣耀骑士被腐化成恶魔仆从，是游戏的"阶段性挑战"。比普通敌人大且更具戏剧性。
>
> 外形：全身重甲骑士，但盔甲是黑色锈蚀的（有腐蚀裂痕，紫色邪能从裂缝渗出）；体型高大；右手持巨型双手剑（剑上也有邪能侵蚀）；头盔眼缝发紫色幽火；左手有残破的盾牌或空手握拳；整体有"曾经是英雄，现在堕落了"的悲剧感；画面中要有少量邪气光效环绕身体。
>
> 关键词：`corrupted knight boss, black rusted armor, purple corruption cracks, giant sword, fallen hero, undead champion, dark fantasy flat art, boss idle pose, 200x200, transparent background`

---

**[ENEMY-08] 火焰领主（Boss）**  
文件路径：`assets/enemies/ancient_dragon/enemy_ancient_dragon_idle.png`  
尺寸：200×200

> 描述：最终 Boss，火焰与熔岩的化身，代表终极威胁。是游戏最强的敌人。
>
> 外形：巨大的龙形生物或类龙的火焰恶魔（不必须是传统龙，也可以是身披熔岩盔甲的巨人）；身体颜色深红 + 熔岩橙（`#cc2200` 配合 `#ff6600` 发光缝隙）；翅膀展开（若是龙形）或双臂张开（若是人形）；整体散发火焰和熔岩的炙热感；眼睛是纯白或纯橙的灼热感；比腐化骑士更大、更压迫。
>
> 关键词：`fire lord boss, lava armor, molten cracks glowing, dragon or demon, massive, red and orange, ultimate boss, intimidating, dark fantasy flat art, boss idle pose, 200x200, transparent background`

---

**[ENEMY-09] 史莱姆王（精英 · 新增）**  
文件路径：`assets/enemies/slime_king/enemy_slime_king_idle.png`  
尺寸：160×160

> 描述：史莱姆精英，比小史莱姆大 2-3 倍，头戴金色王冠，是史莱姆的"领袖"。
>
> 外形：深紫色或深绿色大型史莱姆；头部戴一顶精致但滑稽的金色小王冠；眼睛更大更凶，带威严感；身体尺寸明显大于普通史莱姆；周围有少量小史莱姆"臣子"的轮廓点缀（可选）；黏液感更强。
>
> 关键词：`slime king elite, large purple slime, golden crown, royal slime, bigger and meaner, dark fantasy flat art, elite monster, 160x160, transparent background`

---

**[ENEMY-10] 狂暴兽人（精英 · 新增）**  
文件路径：`assets/enemies/orc_berserker/enemy_orc_berserker_idle.png`  
尺寸：160×160

> 描述：精英近战敌人，兽人狂战士，爆发力强，视觉上要有冲劲和力量感。
>
> 外形：绿色皮肤的兽人，肌肉发达；双手各持一把战斧（双斧）；有残破的皮革护甲和肩甲；眼睛充血发红；嘴部有突出的獠牙；有战斗伤疤；整体前倾的备战姿态，充满侵略性。
>
> 关键词：`orc berserker elite, green skin, dual axes, muscular, leather armor, war scars, aggressive stance, dark fantasy flat art, elite monster, 160x160, transparent background`

---

### 3.4 玩家角色（P1）

---

**[PLAYER-01] 玩家战士立绘**  
文件路径：`assets/player/sprites/player_warrior_idle.png`  
尺寸：128×128，透明背景

> 场景描述：玩家角色，在战斗界面左下角显示。代表玩家在这次冒险中扮演的勇士。
>
> 外形：身穿深色皮革盔甲（黑色 + 深棕色）的人类战士；右手握单手剑（剑尖朝下，放松待命的姿态）；左手无盾或持小圆盾；面朝画面右侧（即朝向敌人方向）；体型中等，不过于魁梧；有旅者/冒险者的感觉，带些疲惫感；整体侧身站立的"idle"姿态。
>
> 关键词：`warrior hero idle stance, leather armor, sword at rest, facing right, adventurer, dark fantasy flat art, player character, 128x128, transparent background`

---

**[PLAYER-02] 玩家头像**  
文件路径：`assets/player/portrait/player_portrait.png`  
尺寸：64×64，透明背景

> 场景描述：战斗界面左上角的玩家 HP 条旁边的头像，小尺寸展示，需要在小尺寸下依然清晰可辨。
>
> 外形：与 PLAYER-01 同一角色；半侧面特写（头部至肩部）；戴有头盔（头盔有面甲，面甲微微抬起露出眼睛）；眼神坚毅，有主角气质；圆形裁切感（图案集中在正方形中央偏上）。
>
> 关键词：`warrior portrait headshot, helmet, determined eyes, dark fantasy flat art, small avatar icon, 64x64, transparent background`

---

### 3.5 战斗意图图标（P2）

**通用要求**：32×32 px，透明背景，**白色单色图标**（不带颜色，代码会通过 modulate 上色）。图标要在 32×32 的小尺寸下清晰可辨，线条简洁不复杂。

| 编号 | 文件路径 | 意图类型 | 图形描述 |
|------|----------|---------|---------|
| INTENT-01 | `assets/ui/intents/intent_sword.png` | 攻击意图 | 单把竖立的剑，剑尖朝上，简洁轮廓，白色 |
| INTENT-02 | `assets/ui/intents/intent_shield.png` | 防御意图 | 正面盾牌，圆形或六边形，白色轮廓 |
| INTENT-03 | `assets/ui/intents/intent_buff.png` | 增益意图 | 向上箭头，顶部有放射光点，白色 |
| INTENT-04 | `assets/ui/intents/intent_debuff.png` | 减益意图 | 向下箭头，箭头有毒液滴效果，白色 |
| INTENT-05 | `assets/ui/intents/intent_stun.png` | 眩晕意图 | 三颗星星围绕圆心旋转，眩晕感，白色 |
| INTENT-06 | `assets/ui/intents/intent_question.png` | 未知意图 | 问号，加粗描边，白色，fallback 用 |

> 生成 Prompt 格式：`white single-color [图形描述] icon, 32x32, minimal clean lines, transparent background, for game UI`

---

### 3.6 状态效果图标（P0 · 全部新增）

**通用要求**：32×32 px，透明背景。这批图标目前用 emoji 占位，是视觉体验的最大痛点，优先生成。每个图标有自己的颜色，不是单色白色。需要一眼能分辨状态类型。

---

**[STATUS-01] 力量图标**  
文件路径：`assets/ui/status/status_strength.png`  
颜色：`#ff4444` 红色系

> 代表攻击力提升效果，越多叠层越强。
>
> 图形：握紧的拳头轮廓，或向上的剑配合+号；红色，有力量感；32×32 内图形居中，四周留少许空白。

---

**[STATUS-02] 敏捷图标**  
文件路径：`assets/ui/status/status_dexterity.png`  
颜色：`#44cc88` 绿色系

> 代表防御/格挡提升效果。
>
> 图形：快速移动的足迹或风纹，或羽毛轮廓；绿色，轻盈感；32×32。

---

**[STATUS-03] 易伤图标**  
文件路径：`assets/ui/status/status_vulnerable.png`  
颜色：`#ff6644` 橙红色系

> 代表受到更多伤害（防御削弱），是常用的负面状态。
>
> 图形：破碎的盾牌，或盾牌上有裂纹；橙红色；表达"防御被打破"的感觉；32×32。

---

**[STATUS-04] 虚弱图标**  
文件路径：`assets/ui/status/status_weak.png`  
颜色：`#998822` 暗黄色系

> 代表造成更少伤害（攻击力削弱），是常用的负面状态。
>
> 图形：向下垂落的剑（剑尖朝下），或折断的剑；暗黄色；表达"力量丧失"的感觉；32×32。

---

**[STATUS-05] 中毒图标**  
文件路径：`assets/ui/status/status_poison.png`  
颜色：`#44cc88` 毒绿色系

> 代表每回合受到毒素伤害，会持续叠加。
>
> 图形：毒液水滴形状，或骷髅 + 水滴；毒绿色，有黏液感；32×32。

---

**[STATUS-06] 荆棘图标**  
文件路径：`assets/ui/status/status_thorns.png`  
颜色：`#558833` 棕绿色系

> 代表受到近战攻击时反弹伤害。
>
> 图形：荆棘刺环绕的圆形，或单根荆棘枝；棕绿色；有刺痛感；32×32。

---

**[STATUS-07] 再生图标**  
文件路径：`assets/ui/status/status_regeneration.png`  
颜色：`#ff88aa` 粉红色系

> 代表每回合回复生命值，是正面状态。
>
> 图形：心形 + 向上螺旋箭头，或绿色十字 + 光晕；粉红色，治愈感；32×32。

---

**[STATUS-08] 堡垒图标**  
文件路径：`assets/ui/status/status_fortify.png`  
颜色：`#6688aa` 蓝灰色系

> 代表额外格挡加成，防御强化效果。
>
> 图形：城堡塔楼剪影，或加厚的盾牌正面；蓝灰色，坚固感；32×32。

---

### 3.7 遗物图标（P0 · 全部新增）

**通用要求**：48×48 px，透明背景，有一定细节（比状态图标精细），整体有"珍贵收藏品"的感觉。每个遗物是独特的物品，风格保持统一（暗黑奇幻手绘风）。

---

**[RELIC-01] 船锚**  
文件路径：`assets/ui/relics/relic_anchor.png`  
效果：每场战斗开始获得 10 点格挡

> 图形：锈铁海锚，深灰色金属质感，有轻微锈迹；金色描边；海锚上绕着一段锁链；整体厚重感；48×48。

---

**[RELIC-02] 灯笼**  
文件路径：`assets/ui/relics/relic_lantern.png`  
效果：每场战斗第一回合获得 1 点额外能量

> 图形：古旧铁质方形灯笼，内部有蓝白色魔法火焰（发光感）；笼子有精致的铁艺装饰；整体偏暖但带魔幻感；48×48。

---

**[RELIC-03] 草莓**  
文件路径：`assets/ui/relics/relic_strawberry.png`  
效果：获得时最大生命值提高 10

> 图形：一颗发光的魔法草莓，比普通草莓更圆润饱满；有金色光晕环绕；表面有细腻的红色质感；叶片翠绿；整体有"神奇果实"的神秘感；48×48。

---

**[RELIC-04] 餐券**  
文件路径：`assets/ui/relics/relic_meal_ticket.png`  
效果：每次获得卡牌时回复 2 点生命

> 图形：古旧的羊皮纸小券，边缘略微焦黄；中央有金色印章或蜡封；券面有模糊的装饰文字纹路（不需要可读）；整体有"神圣小物件"的感觉；48×48。

---

**[RELIC-05] 黄金神像**  
文件路径：`assets/ui/relics/relic_golden_idol.png`  
效果：战斗胜利后额外获得 15 金币

> 图形：小型金色神像，人形或动物形（狐狸/猫等）；纯金色，有细腻的雕刻纹路；宝石眼睛（红色或绿色）；底部有一个小底座；整体财富感强，让人联想到"考古宝藏"；48×48。

---

### 3.8 地图节点图标（P0 · 部分新增）

**通用要求**：32×32 px，透明背景，需要在 32×32 的小尺寸下清晰可辨。不同节点类型要有明显区分，颜色编码与游戏中的节点颜色对应。

| 编号 | 文件路径 | 节点类型 | 对应节点颜色 | 图形描述 |
|------|----------|---------|------------|---------|
| MAP-01 | `assets/ui/icons/icon_battle.png` | 普通战斗 ⚔ | 暗红 `#7a2820` | 双剑交叉，红色，战斗感 |
| MAP-02 | `assets/ui/icons/icon_elite.png` | 精英 ☆ | 橙色 `#6b5220` | 盾牌+星星或骷髅+星，橙色，比普通战斗更亮 |
| MAP-03 | `assets/ui/icons/icon_boss.png` | Boss ☠ | 暗红威胁 | 骷髅头或龙头，深红色，最具威胁感 |
| MAP-04 | `assets/ui/icons/icon_shop.png` | 商店 🏪 | 暗金 `#6b5214` | 金币袋或商店招牌，金色 |
| MAP-05 | `assets/ui/icons/icon_question.png` | 事件 ? | 深紫 `#4d3c75` | 问号+卷轴，紫色，神秘感 |
| MAP-06 | `assets/ui/icons/icon_rest.png` | 休息 🔥 | 暗绿 `#1e5647` | 篝火或营帐，橙暖色，安全感 |
| MAP-07 | `assets/ui/icons/icon_chest.png` | 宝箱 📦 | 暗金棕 | 宝箱正面，金黄色，有锁扣 |

> 生成 Prompt 格式：`[图形描述] map node icon, 32x32, flat icon design, [颜色] tones, transparent background, simple and clear at small size, dark fantasy game UI`

---

### 3.9 战斗 HUD 图标（P3）

---

**[HUD-01] 能量水晶**  
文件路径：`assets/ui/icons/ui_energy_crystal.png`  
尺寸：36×36，透明背景

> 在战斗界面右上显示当前/最大能量值，代码在图标旁叠加"3/3"数字。
>
> 图形：六边形切割宝石，颜色亮青 `#00d2ff`，有明显的宝石切面和中央高光；周围有微弱的蓝色光晕；整体清晰醒目。

---

**[HUD-02] 能量底座**  
文件路径：`assets/ui/icons/ui_energy_base.png`  
尺寸：80×80，透明背景

> 能量水晶的底座，代表能量槽的整体容器。
>
> 图形：圆形或六边形石质底座，中央有凹陷的水晶镶嵌槽；石质纹理，深灰色，有古代符文刻纹；底座边缘有发光的能量流动线条。

---

**[HUD-03] 抽牌堆图标**  
文件路径：`assets/ui/icons/icon_draw_pile.png`  
尺寸：32×32，透明背景

> 显示在战斗界面左下，代表剩余可抽的卡牌数量，旁边有数字。
>
> 图形：叠放的多张卡牌（俯视角，展示叠放效果），蓝色调，有整齐的"牌堆"感；卡牌背面朝上。

---

**[HUD-04] 弃牌堆图标**  
文件路径：`assets/ui/icons/icon_discard_pile.png`  
尺寸：32×32，透明背景

> 显示在战斗界面右下，代表已出过/已弃掉的卡牌。
>
> 图形：散乱的卡牌（稍微角度不齐，有"用过了"的感觉），灰色调；与抽牌堆图标形成对比（整齐 vs 散乱）。

---

### 3.10 血量和格挡条（P3）

**通用要求**：256×24 px，无透明背景（有底色），横向条形，可水平拉伸。

| 编号 | 文件路径 | 用途 | 颜色要求 |
|------|----------|------|---------|
| BAR-01 | `assets/ui/bars/ui_hp_bar_bg.png` | 血量条背景槽 | 深灰色 `#2a2a2a`，凹陷石槽感，四角圆弧 |
| BAR-02 | `assets/ui/bars/ui_hp_bar_fill.png` | 血量填充条 | 红色渐变 `#ff4444`→`#cc2222`，表面有玻璃光泽高光 |
| BAR-03 | `assets/ui/bars/ui_block_bar_fill.png` | 格挡填充条 | 蓝色渐变 `#4488ff`→`#2266cc`，表面有金属光泽高光 |

---

### 3.11 特效纹理（P3）

**通用要求**：透明背景，用作 Godot 粒子系统的纹理，需要是"单帧"图像（不是精灵动画表）。

| 编号 | 文件路径 | 尺寸 | 用途 | 图形描述 |
|------|----------|------|------|---------|
| VFX-01 | `assets/vfx/effects/hit_slash.png` | 128×128 | 斩击命中特效 | 白色/淡红色弧形刀光，有速度感的光迹，透明背景 |
| VFX-02 | `assets/vfx/effects/magic_burst.png` | 128×128 | 魔法爆发特效 | 蓝紫色圆形光爆，中央亮外围淡，爆炸扩散感 |
| VFX-03 | `assets/vfx/particles/particle_fire.png` | 32×32 | 火焰粒子 | 小火焰形状，橙红色，朦胧感，单颗粒子 |
| VFX-04 | `assets/vfx/particles/particle_poison.png` | 32×32 | 毒液粒子 | 水滴形，毒绿色半透明，单颗粒子 |
| VFX-05 | `assets/vfx/particles/particle_shield.png` | 32×32 | 护盾粒子 | 菱形/多边形，蓝色，结晶硬质感，单颗粒子 |
| VFX-06 | `assets/vfx/particles/particle_spark.png` | 32×32 | 火花粒子 | 四角星形，白黄色，明亮，单颗粒子 |

---

## 四、新增资源的代码接入说明

以下资源是新增的（目前代码中没有引用），生成后还需要修改对应脚本才能显示：

| 资源 | 需要修改的脚本 | 修改说明 |
|------|-------------|---------|
| 状态图标 × 8 | `scripts/ui/status_view_factory.gd` | 将 emoji 替换为 `TextureRect` 加载对应图标 |
| 遗物图标 × 5 | `scripts/ui/relic_view_factory.gd` | 在遗物按钮上加载图标纹理 |
| 地图图标（battle/rest/chest）× 3 | `scripts/scenes/map_scene.gd` | 在 `_node_text()` 中改为用图标代替文字 |
| 抽/弃牌堆图标 × 2 | `scripts/scenes/battle_scene.gd` | 在牌堆显示处加载图标纹理 |
| 新增敌人立绘 × 2 | `scripts/scenes/battle_scene.gd` 的 `ENEMY_ART_BY_KEY` 字典 | 添加新的 art_key 映射 |
| 新增敌人立绘 × 2 | `data/enemies.json` | 更新对应敌人的 `art_key` 字段 |

---

## 五、替换现有资源的操作说明

对于"已有但待替换"的资源（`⚠️` 标注），操作非常简单：

```
1. 用 AI 生成对应图片，命名为文档中标注的文件名
2. 将文件放入 assets/ 对应子目录（覆盖原文件）
3. 重新运行 Godot 项目，Godot 会自动重新导入
4. 无需修改任何代码
```

---

## 六、资源数量统计

| 分类 | 替换现有 | 全新新增 | 合计 |
|------|---------|---------|------|
| 背景图 | 5 | 0 | 5 |
| 卡牌底框 + 费用水晶 | 6 | 0 | 6 |
| 卡牌类型图标 | 7 | 0 | 7 |
| 敌人立绘 | 8 | 2 | 10 |
| 玩家角色 | 2 | 0 | 2 |
| 意图图标 | 6 | 0 | 6 |
| 状态效果图标 | 0 | **8** | 8 |
| 遗物图标 | 0 | **5** | 5 |
| 地图节点图标 | 4 | **3** | 7 |
| HUD 图标 | 2 | **2** | 4 |
| 血量格挡条 | 3 | 0 | 3 |
| 特效纹理 | 6 | 0 | 6 |
| **合计** | **49** | **20** | **69** |
