# 卡牌美术模板方案

> 适用项目：SlayDemo — 类《杀戮尖塔》卡牌 Roguelike Demo
> 文档版本：v1.0

---

## 一、卡牌版面布局设计

### 1.1 卡牌尺寸

- 标准尺寸：**180 x 250 px**（比例约 5:7）
- 手牌区缩放：缩小至 **144 x 200 px**（80%）
- 悬停放大：放大至 **216 x 300 px**（120%）
- 奖励选择界面：**180 x 250 px**（原尺寸）

### 1.2 ASCII 版面布局示意

```
+------------------------------------------+
|  [费用]                                   |
|   3                          +----------+|
|                              |  稀有度   ||
|                              |  标识条   ||
|  +--------------------------------------+|
|  |                                      ||
|  |         [卡牌图标/插画区域]            ||
|  |              64 x 64                  ||
|  |                                      ||
|  |         居中放置，带背景色块            ||
|  |                                      ||
|  +--------------------------------------+|
|                                          |
|  ====== 卡牌名称 ======                  |
|         猛力斩击                          |
|                                          |
|  --------------------------------------  |
|  |                                    |  |
|  |  描述文字区域                        |  |
|  |  造成 8 点伤害                       |  |
|  |  如果目标处于易伤状态                 |  |
|  |  额外造成 4 点伤害                   |  |
|  |                                    |  |
|  --------------------------------------  |
|                                          |
|  [类型图标]  攻击              [稀有度角标] |
+------------------------------------------+
```

### 1.3 区域划分与尺寸

```
+-- 180px --+--- 250px 高 ---+

区域                    Y范围           高度    说明
─────────────────────────────────────────────────
费用区域                0 - 35         35px    左上角，含圆形背景
插画区域                35 - 155      120px    图标 + 背景色块
名称区域               155 - 185       30px    卡牌名称，居中
分隔线                  185 - 190       5px    细线分隔
描述区域               190 - 235      45px    效果描述文字
底部信息               235 - 250      15px    类型图标 + 类型文字
```

### 1.4 各区域详细设计

#### 费用区域（左上角）

- 位置：左上角，距左边 8px，距上边 8px
- 圆形背景：直径 36px，填充 `#00d2ff`（能量色）
- 数字：白色，字体 Roboto Bold，24px，居中于圆形中
- 当费用为 0 时，圆形背景为 `#2a9d8f`（绿色调）
- 当费用为 X 时，显示 "X"

#### 插画/图标区域

- 背景色块：按卡牌类型着色
  - 攻击卡：`#441111`（深红底）
  - 技能卡：`#114422`（深绿底）
  - 能力卡：`#112244`（深蓝底）
- 中心图标：64x64px，白色或浅色，来自 Game-Icons.net
- 图标与背景之间有 16px 内边距

#### 名称区域

- 字体：Chakra Petch Bold，18px
- 颜色：`#e2e2e2`（浅白）
- 对齐：水平居中
- 底部有 1px 横线分隔（颜色同稀有度色）

#### 描述区域

- 字体：Chakra Petch Regular，12px
- 颜色：`#a0a0b0`（柔灰）
- 对齐：水平居中，垂直居中
- 行间距：16px
- 数值变量用颜色高亮：
  - 伤害数值：`#ff4444`（红色）
  - 格挡数值：`#4488ff`（蓝色）
  - 其他数值：`#ffcc00`（金色）

#### 底部信息区域

- 左侧：类型图标（24x24px）
  - 攻击：剑图标
  - 技能：齿轮图标
  - 能力：星形图标
- 中间：类型文字（10px，小字）
- 右侧：稀有度角标（小圆点或小标签）

---

## 二、稀有度视觉区分方案

### 2.1 边框颜色方案

| 稀有度 | 边框色 | 边框宽度 | 说明 |
|--------|--------|----------|------|
| 普通 | `#8b8b8b` | 2px | 灰色边框 |
| 罕见 | `#44aa44` | 2px | 绿色边框 |
| 稀有 | `#4488ff` | 3px | 蓝色边框，略粗 |
| 诅咒 | `#9944cc` | 2px | 紫色边框 |

### 2.2 底部稀有度条

在卡牌底部有一条细色条，颜色与稀有度对应：

| 稀有度 | 色条样式 |
|--------|----------|
| 普通 | 纯灰色细条 |
| 罕见 | 绿色细条 + 微微发光 |
| 稀有 | 蓝色粗条 + 发光 + 微闪动画 |
| 诅咒 | 紫色细条 + 暗影效果 |

### 2.3 光效与动画（P1/P2）

- **稀有卡牌**：手牌中悬停时，边框有微微脉动发光效果
- **普通/罕见**：无特殊光效
- **诅咒**：暗淡，边框有轻微的紫雾效果

> **实现建议**：光效用 Godot Shader 实现最方便。一个简单的 `outline` shader + `sin(time)` 控制透明度即可。

---

## 三、Godot Scene 结构建议

### 3.1 卡牌场景树

```
Card (Control, 180x250)
├── Background (NinePatchRect 或 Panel)
│   └── StyleBoxFlat：圆角 8px，深色填充，稀有度边框色
│
├── CostArea (Control, 36x36, position: 8, 8)
│   ├── CostBg (TextureRect) -- 能量水晶圆形背景
│   └── CostLabel (Label) -- 费用数字
│
├── ArtArea (Control, 164x120, position: 8, 35)
│   ├── ArtBackground (ColorRect) -- 类型对应背景色
│   └── ArtIcon (TextureRect) -- 卡牌图标，居中
│
├── NameArea (Control, 164x30, position: 8, 155)
│   └── NameLabel (Label) -- 卡牌名称
│
├── Separator (HSeparator, position: 8, 185)
│
├── DescArea (Control, 164x45, position: 8, 190)
│   └── DescLabel (Label) -- 描述文字，支持 BBCode
│
├── BottomArea (Control, 164x15, position: 8, 235)
│   ├── TypeIcon (TextureRect, 24x24)
│   ├── TypeLabel (Label) -- "攻击"/"技能"/"能力"
│   └── RarityDot (ColorRect, 8x8, 圆形)
│
└── RarityGlow (ColorRect, 全尺寸) -- 稀有卡牌发光遮罩
    └── ShaderMaterial：outline/glow shader
```

### 3.2 推荐的 Godot 组件

| 组件 | Godot 类型 | 说明 |
|------|------------|------|
| 卡牌容器 | `Control` 或 `PanelContainer` | 根节点，处理鼠标事件 |
| 背景 | `NinePatchRect` 或 `Panel` + `StyleBoxFlat` | 九宫格拉伸，支持不同尺寸 |
| 费用 | `Label` + `TextureRect` | 圆形底 + 数字 |
| 图标 | `TextureRect` | 居中显示，`stretch_mode = KEEP_ASPECT_CENTERED` |
| 名称 | `Label` | `horizontal_alignment = CENTER` |
| 描述 | `RichTextLabel` | 支持 BBCode 实现数值高亮 |
| 类型图标 | `TextureRect` | 小图标 |
| 稀有度光效 | `ColorRect` + `ShaderMaterial` | 仅稀有卡牌启用 |

### 3.3 关键脚本接口

```gdscript
# card.gd
extends Control

@export var card_data: CardData  # 卡牌数据资源

func _ready():
    update_display()

func update_display():
    # 根据 card_data 更新所有视觉元素
    cost_label.text = str(card_data.cost)
    name_label.text = card_data.card_name
    desc_label.text = card_data.get_formatted_description()
    art_icon.texture = card_data.icon
    # 根据 card_data.type 设置背景色
    # 根据 card_data.rarity 设置边框色和光效
```

---

## 四、模板化批量生产方案

### 4.1 卡牌数据驱动

**核心思路**：卡牌视觉 = 模板 + 数据。只需要一个卡牌场景模板，通过数据驱动生成不同卡牌。

需要的"唯一性"素材：
1. **卡牌图标**（64x64px）：每张卡牌一个，共 25-30 个
2. **卡牌数据**：Godot Resource（.tres）文件，定义名称、费用、描述、类型、稀有度

不需要为每张卡牌制作单独的美术文件。

### 4.2 数据定义（CardData Resource）

```gdscript
# card_data.gd
class_name CardData
extends Resource

enum CardType { ATTACK, SKILL, POWER }
enum Rarity { COMMON, UNCOMMON, RARE, CURSE }

@export var id: String = ""
@export var card_name: String = ""
@export var cost: int = 0
@export var description: String = ""
@export var type: CardType = CardType.ATTACK
@export var rarity: Rarity = Rarity.COMMON
@export var icon: Texture2D  # 唯一需要单独美术的资源
@export var effects: Array[CardEffect] = []
```

### 4.3 批量制作流程

```
Step 1: 创建 1 个 CardScene.tscn（模板场景）
        └── 一次性工作，约 2-3 小时

Step 2: 从 Game-Icons.net 下载 25-30 个图标
        └── 约 2-3 小时（含搜索和调色）

Step 3: 创建 25-30 个 CardData .tres 文件
        └── 约 2-3 小时（纯数据录入）

Step 4: 在游戏场景中实例化 CardScene + CardData
        └── 约 1 小时

总计：约 8 小时完成全部卡牌视觉
```

### 4.4 描述文字格式化

使用 BBCode 在 RichTextLabel 中实现数值高亮：

```
原始描述：造成 {damage} 点伤害。获得 {block} 点格挡。
BBCode 输出：造成 [color=#ff4444]8[/color] 点伤害。获得 [color=#4488ff]5[/color] 点格挡。
```

```gdscript
func get_formatted_description() -> String:
    var text = description
    # 替换数值变量为带颜色的 BBCode
    text = text.replace("{damage}", "[color=#ff4444]%d[/color]" % damage)
    text = text.replace("{block}", "[color=#4488ff]%d[/color]" % block)
    text = text.replace("{poison}", "[color=#44cc88]%d[/color]" % poison)
    return text
```

---

## 五、卡牌字体与排版规范

### 5.1 字体规范

| 区域 | 字体 | 字号 | 字重 | 颜色 |
|------|------|------|------|------|
| 费用数字 | Roboto Bold | 24px | Bold | `#ffffff` |
| 卡牌名称 | Chakra Petch | 18px | Bold | `#e2e2e2` |
| 卡牌描述 | Chakra Petch | 12px | Regular | `#a0a0b0` |
| 描述中数值 | Roboto Bold | 12px | Bold | 见色彩方案 |
| 类型文字 | Chakra Petch | 10px | Regular | `#707080` |

### 5.2 排版规范

| 参数 | 值 | 说明 |
|------|------|------|
| 行间距 | 字号 x 1.4 | 描述区域 |
| 字间距 | 0 | 默认 |
| 段间距 | 4px | 描述中不同效果之间 |
| 文本对齐 | 水平居中 | 所有区域 |
| 自动换行 | 开启 | 描述区域，宽度 150px |
| 截断模式 | 省略号 | 名称区域（超长时） |

### 5.3 特殊文字规则

- 数值用**数字**而非中文（写 "8" 不写 "八"）
- 关键词用**粗体**（如 **易伤**、**虚弱**）
- 正面效果用绿色，负面效果用红色/紫色
- 描述尽量简洁，不超过 3 行

---

## 六、卡牌背面设计

```
+------------------------------------------+
|                                          |
|                                          |
|              +----------+                |
|              |          |                |
|              |  游戏LOGO |                |
|              |  或符号   |                |
|              |          |                |
|              +----------+                |
|                                          |
|           ═══════════════                 |
|                                          |
|              装  饰  纹  样                |
|                                          |
+------------------------------------------+
```

- 背景：`#0f3460`（深蓝）
- 边框：`#1a3a6a`（稍浅蓝）2px
- 中央图案：一个简单的几何装饰（菱形 + 十字）
- 使用 Kenney Boardgame Pack 的卡背图案修改即可

---

## 七、卡牌状态视觉

| 状态 | 视觉效果 |
|------|----------|
| 不可用（费用不足） | 整体变暗，modulate = Color(0.5, 0.5, 0.5, 1.0) |
| 可用 | 正常显示 |
| 悬停 | 放大 120%，z_index 提升，微微上移 |
| 拖拽中 | 跟随鼠标，轻微旋转（±5度），放大 110% |
| 打出中 | 向目标方向飞出 + 缩小 + 淡出 |
| 弃牌 | 缩小 + 淡出 + 向下位移 |

### 悬停效果的 Godot 实现

```gdscript
func _on_mouse_entered():
    if not playable: return
    var tween = create_tween()
    tween.tween_property(self, "scale", Vector2(1.2, 1.2), 0.15)
    tween.parallel().tween_property(self, "position:y", position.y - 30, 0.15)
    z_index = 10

func _on_mouse_exited():
    var tween = create_tween()
    tween.tween_property(self, "scale", Vector2(1.0, 1.0), 0.15)
    tween.parallel().tween_property(self, "position:y", position.y + 30, 0.15)
    z_index = 0
```

---

## 八、完整卡牌制作检查清单

每制作一张新卡牌，确认以下项目：

- [ ] 图标已下载并放入 `assets/card/icons/`
- [ ] CardData .tres 文件已创建，所有字段已填写
- [ ] 描述文字简洁清晰，不超过 3 行
- [ ] 数值使用 BBCode 高亮
- [ ] 费用、类型、稀有度设置正确
- [ ] 在场景中实例化测试，显示正常
- [ ] 在 1920x1080 下文字清晰可读
- [ ] 悬停/不可用状态显示正确
