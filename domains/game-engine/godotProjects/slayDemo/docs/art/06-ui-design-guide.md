# UI 美术设计指南

> 适用项目：SlayDemo — 类《杀戮尖塔》卡牌 Roguelike Demo
> 基准分辨率：1920 x 1080（16:9 桌面）
> 文档版本：v1.0

---

## 一、全局 UI 规范

### 1.1 基准参数

| 参数 | 值 | 说明 |
|------|------|------|
| 基准分辨率 | 1920 x 1080 | 设计基准 |
| 缩放模式 | `canvas_items` | Godot 项目设置中 `stretch_mode` |
| 缩放比例 | `keep` | 保持宽高比 |
| 安全边距 | 上下左右各 20px | 避免 UI 紧贴屏幕边缘 |
| 全局圆角 | 4px（小元素）/ 8px（大面板） | 统一圆角 |
| 全局阴影 | 偏移(2,2)，模糊4px，透明度25% | 统一投影 |

### 1.2 图层（Z-Index）规范

| 层级 | Z-Index | 内容 |
|------|---------|------|
| 背景层 | -10 | 场景背景图 |
| 游戏对象层 | 0 | 角色、敌人 |
| UI 基础层 | 10 | HP 条、能量显示 |
| 卡牌层 | 20 | 手牌 |
| 卡牌悬停层 | 30 | 被悬停的卡牌 |
| 弹窗层 | 40 | 对话框、奖励选择 |
| 特效层 | 50 | 粒子、伤害数字 |
| 屏幕后处理 | 60 | 屏幕闪白/震动遮罩 |

---

## 二、主菜单布局

### 2.1 布局示意

```
+----------------------------------------------------------+
|                                                          |
|                                                          |
|              ┌──────────────────────────┐                |
|              │                          │                |
|              │     S L A Y  D E M O     │                |
|              │       (游戏标题/Logo)      │                |
|              │                          │                |
|              └──────────────────────────┘                |
|                                                          |
|                    [ 开 始 游 戏 ]                         |
|                    （主按钮，最大）                         |
|                                                          |
|                    [ 继续游戏 ]                             |
|                    （存档存在时显示）                       |
|                                                          |
|                    [ 设    置 ]                             |
|                                                          |
|                    [ 退    出 ]                             |
|                                                          |
|                                                          |
|  v0.1-alpha                           [GitHub链接]       |
+----------------------------------------------------------+
```

### 2.2 元素规格

| 元素 | 尺寸 | 位置 | 说明 |
|------|------|------|------|
| 游戏标题 | 自适应 | 垂直 25%-35% | 大号字体，居中 |
| 开始游戏按钮 | 300x60px | 标题下方 100px | 主按钮样式 |
| 继续游戏按钮 | 300x60px | 开始按钮下方 16px | 主按钮样式 |
| 设置按钮 | 300x60px | 继续按钮下方 16px | 次要按钮样式 |
| 退出按钮 | 300x60px | 设置按钮下方 16px | 次要按钮样式 |
| 版本号 | 自适应 | 左下角(20, 1060) | 小字，12px |
| 背景 | 1920x1080 | 全屏 | 可复用战斗背景加暗化 |

### 2.3 主菜单场景结构

```
MainMenu (Control, 1920x1080)
├── Background (TextureRect) -- 暗化后的战斗背景
├── TitleContainer (VBoxContainer, 居中)
│   ├── TitleLabel (Label) -- "SLAY DEMO"
│   └── SubtitleLabel (Label) -- "卡牌 Roguelike"（可选）
├── ButtonContainer (VBoxContainer, 居中, 标题下方)
│   ├── StartButton (Button)
│   ├── ContinueButton (Button)
│   ├── SettingsButton (Button)
│   └── QuitButton (Button)
├── VersionLabel (Label) -- 左下角
└── CreditsButton (Button) -- 右下角（可选）
```

---

## 三、战斗界面布局

### 3.1 整体布局示意

```
+----------------------------------------------------------+
| [地图图标]                              [设置] [暂停]      | <- 顶栏 40px
|                                                          |
|                                                          |
|         [敌人1]  [敌人2]  [敌人3]                          | <- 敌人区域
|         意图↑    意图↑    意图↑                            |
|                                                          |
|                                                          |
|                                                          |
| [玩家头像]                                               | <- 玩家区域
| HP ████████░░░ 45/60                                     |
| 状态: [力量+2] [易伤]                                    |
| [玩家角色]                 [能量:⚡]                      |
|                                                          |
| ┌────────────────────────────────────────────────────────┤
| │ [抽牌堆] [卡1] [卡2] [卡3] [卡4] [卡5]    [弃牌堆]    │ <- 手牌区域
| │    12                    [结束回合]          8          │    高度180px
| └────────────────────────────────────────────────────────┤
+----------------------------------------------------------+
```

### 3.2 区域划分

```
Y坐标分配：
0-40:    顶栏（设置按钮、地图按钮）
40-480:  敌人区域（主要展示区）
480-780: 玩家区域（角色、HP、状态）
780-1080: 手牌区域（300px）
```

### 3.3 详细元素规格

#### 顶栏（40px高）

| 元素 | 尺寸 | 位置 | 说明 |
|------|------|------|------|
| 地图按钮 | 40x40px | 左上(20, 0) | 图标按钮 |
| 设置按钮 | 40x40px | 右上(1820, 0) | 齿轮图标 |
| 暂停按钮 | 40x40px | 右上(1860, 0) | 暂停图标 |
| 回合指示 | 自适应 | 顶栏居中 | "你的回合" / "敌人回合" |

#### 敌人区域（440px高）

| 元素 | 说明 |
|------|------|
| 敌人容器 | HBoxContainer，水平居中 |
| 单个敌人容器 | VBoxContainer：意图 -> 精灵图 -> HP条 -> 状态图标 |
| 敌人间距 | 60px |
| 意图图标 | 32x32px，敌人上方 20px |
| 敌人 HP 条 | 120x16px，敌人下方 |

#### 玩家区域（300px高）

| 元素 | 尺寸 | 位置 | 说明 |
|------|------|------|------|
| 玩家角色 | 128x128px | 左下(200, 700) | 居左偏下 |
| 玩家头像 | 64x64px | 角色左上 | HP 条旁小头像 |
| HP 条 | 240x24px | 角色下方 | 红色血条 |
| HP 文字 | 自适应 | HP 条右侧 | "45/60" |
| 护盾显示 | 48x48px | HP 条上方 | 蓝色盾牌 + 数值 |
| 状态图标行 | HBoxContainer | HP 条下方 | 32x32 图标排列 |
| 能量显示 | 80x120px | 手牌区左上方 | 大号能量水晶 |
| 能量数值 | 48x48px | 水晶中心 | "3/3" |

#### 手牌区域（300px高，屏幕底部）

| 元素 | 尺寸 | 位置 | 说明 |
|------|------|------|------|
| 手牌区背景 | 1920x300px | 底部 | 半透明暗色，透明度 70% |
| 卡牌容器 | HBoxContainer | 手牌区居中 | 卡牌间距 20px |
| 单张卡牌 | 144x200px（缩放后） | — | 手牌中缩小显示 |
| 抽牌堆 | 60x80px | 手牌区左下 | 牌堆图标 + 数字 |
| 弃牌堆 | 60x80px | 手牌区右下 | 牌堆图标 + 数字 |
| 结束回合按钮 | 160x50px | 手牌区右侧中部 | "结束回合" |

### 3.4 战斗界面场景结构

```
BattleUI (Control, 1920x1080)
├── Background (TextureRect)
├── TopBar (HBoxContainer, 1920x40, 顶部)
│   ├── MapButton (Button, 40x40)
│   ├── Spacer (Control, size_flags: EXPAND)
│   ├── TurnIndicator (Label)
│   ├── Spacer (Control, size_flags: EXPAND)
│   ├── SettingsButton (Button, 40x40)
│   └── PauseButton (Button, 40x40)
│
├── EnemyArea (CenterContainer, 1920x440, Y:40-480)
│   └── EnemyContainer (HBoxContainer)
│       ├── EnemyUnit1 (VBoxContainer)
│       │   ├── IntentDisplay (HBoxContainer: 图标 + 数值)
│       │   ├── EnemySprite (TextureRect)
│       │   ├── HPBar (ProgressBar)
│       │   └── StatusContainer (HBoxContainer)
│       ├── EnemyUnit2 (...)
│       └── EnemyUnit3 (...)
│
├── PlayerArea (Control, Y:480-780)
│   ├── PlayerSprite (TextureRect, 128x128)
│   ├── PlayerInfo (VBoxContainer)
│   │   ├── ShieldDisplay (HBoxContainer)
│   │   ├── HPBar (ProgressBar, 240x24)
│   │   └── StatusContainer (HBoxContainer)
│   └── EnergyDisplay (CenterContainer)
│       ├── EnergyCrystal (TextureRect, 64x64)
│       └── EnergyLabel (Label)
│
├── HandArea (Panel, 1920x300, 底部)
│   ├── DrawPile (VBoxContainer, 左下)
│   │   ├── PileIcon (TextureRect)
│   │   └── PileCount (Label)
│   ├── CardContainer (HBoxContainer, 居中)
│   │   ├── Card1 (PackedScene instance)
│   │   ├── Card2
│   │   └── ...
│   ├── EndTurnButton (Button, 右侧)
│   └── DiscardPile (VBoxContainer, 右下)
│       ├── PileIcon (TextureRect)
│       └── PileCount (Label)
│
└── EffectLayer (CanvasLayer)
    └── DamageNumbers (Node2D) -- 动态生成的伤害数字
```

---

## 四、地图界面布局

### 4.1 布局示意

```
+----------------------------------------------------------+
| [返回]     第 1 层 / 共 3 层                [卡牌图鉴]     |
|                                                          |
|                  [Boss]  <- 终点                           |
|                    |                                     |
|              [战斗] [精英]                                |
|               |  \  /                                    |
|            [事件] [战斗] [商店]                           |
|              |  /  \  |                                  |
|           [战斗] [休息] [战斗]                            |
|              \    |    /                                  |
|              [起始节点]                                   |
|                                                          |
|                    HP: 45/60                              |
|                    金币: 120                               |
+----------------------------------------------------------+
```

### 4.2 元素规格

| 元素 | 规格 | 说明 |
|------|------|------|
| 地图背景 | 1920x1080 | 暗色或羊皮纸风格 |
| 节点图标 | 32x32（普通）/ 48x48（Boss） | 不同类型不同图标 |
| 节点间距 | 垂直 80px，水平可变 | 自适应 |
| 路径连线 | Line2D | 2px 宽，灰色（已走过为亮色） |
| 当前层高亮 | 发光/脉动动画 | 当前可选节点有高亮 |
| 已完成节点 | 变暗/打勾 | 已走过的节点变暗 |
| 玩家位置 | 48x48 标记 | 在当前节点上方显示玩家标记 |

---

## 五、奖励选择界面

### 5.1 布局示意（战斗胜利后）

```
+----------------------------------------------------------+
|                                                          |
|                    战斗胜利！                              |
|                                                          |
|        ┌──────────────────────────────┐                  |
|        │                              │                  |
|        │  [卡牌1]  [卡牌2]  [卡牌3]   │  <- 3选1         |
|        │                              │                  |
|        │  [跳过]                      │                  |
|        └──────────────────────────────┘                  |
|                                                          |
|        获得金币: +42                                      |
|                                                          |
+----------------------------------------------------------+
```

### 5.2 元素规格

| 元素 | 规格 | 说明 |
|------|------|------|
| 半透明遮罩 | 全屏 | 黑色，透明度 60% |
| 弹窗面板 | 800x500px | 居中显示 |
| 标题文字 | 32px | "选择一张卡牌加入牌组" |
| 卡牌展示 | 3张，原尺寸180x250px | 水平排列，间距 40px |
| 卡牌悬停 | 放大 + 上移 | 与手牌悬停效果一致 |
| 跳过按钮 | 160x50px | 底部居中 |
| 金币显示 | 24px | 底部，含金币图标 |

---

## 六、弹窗/对话框设计

### 6.1 弹窗通用规范

| 参数 | 值 | 说明 |
|------|------|------|
| 遮罩 | 黑色 60% 透明 | 阻止对背景的交互 |
| 弹窗面板 | 暗色背景 `#16213e`，8px圆角 | 居中显示 |
| 关闭按钮 | 右上角 X 按钮 | 32x32px |
| 标题栏 | 40px 高，含标题和关闭按钮 | 面板顶部 |
| 内容区 | 自适应 | 面板中间 |
| 按钮区 | 右对齐，含"确认"和"取消" | 面板底部 |

### 6.2 弹窗类型

| 类型 | 尺寸 | 使用场景 |
|------|------|----------|
| 小弹窗 | 400x250 | 确认操作（退出游戏？） |
| 中弹窗 | 600x400 | 设置面板、卡牌详情 |
| 大弹窗 | 800x600 | 奖励选择、卡牌图鉴 |

---

## 七、按钮设计

### 7.1 按钮状态

| 状态 | 视觉表现 | 实现 |
|------|----------|------|
| Normal | 默认背景色 `#0f3460`，浅色文字 | StyleBoxFlat |
| Hover | 背景微亮 `#1a4a7a`，文字不变 | StyleBoxFlat |
| Pressed | 背景微暗 `#0a2a4a`，文字微下移 1px | StyleBoxFlat |
| Disabled | 背景灰 `#3a3a4a`，文字暗 `#6a6a7a` | StyleBoxFlat |
| Focused | 添加 2px 亮色边框 `#00d2ff` | StyleBoxFlat |

### 7.2 按钮尺寸规范

| 类型 | 尺寸 | 字号 | 使用场景 |
|------|------|------|----------|
| 大按钮 | 300x60px | 24px | 主菜单主要选项 |
| 中按钮 | 160x50px | 18px | "结束回合"、"确认" |
| 小按钮 | 120x40px | 14px | "取消"、"跳过" |
| 图标按钮 | 40x40px | — | 设置、关闭 |
| 卡牌按钮 | 180x250px | — | 卡牌本身 |

### 7.3 Godot Theme 配置

```gdscript
# 在项目中创建统一的 Theme 资源
var theme = Theme.new()

# Button 样式
var btn_normal = StyleBoxFlat.new()
btn_normal.bg_color = Color("#0f3460")
btn_normal.border_radius_top_left = 4
btn_normal.border_radius_top_right = 4
btn_normal.border_radius_bottom_left = 4
btn_normal.border_radius_bottom_right = 4
btn_normal.content_margin_top = 8
btn_normal.content_margin_bottom = 8
btn_normal.content_margin_left = 16
btn_normal.content_margin_right = 16

var btn_hover = btn_normal.duplicate()
btn_hover.bg_color = Color("#1a4a7a")

var btn_pressed = btn_normal.duplicate()
btn_pressed.bg_color = Color("#0a2a4a")

theme.set_stylebox("normal", "Button", btn_normal)
theme.set_stylebox("hover", "Button", btn_hover)
theme.set_stylebox("pressed", "Button", btn_pressed)

# 字体
var font = load("res://assets/fonts/ChakraPetch-Bold.ttf")
theme.set_font("font", "Button", font)
theme.set_font_size("font_size", "Button", 18)
theme.set_color("font_color", "Button", Color("#e2e2e2"))
```

---

## 八、Godot Theme 统一管理方案

### 8.1 推荐做法

创建一个 `.tres` Theme 资源文件，在整个项目中统一使用：

1. 在 Godot 中右键 -> 新建资源 -> 选择 `Theme`
2. 配置所有 UI 元素的样式（按钮、标签、面板、进度条等）
3. 保存为 `res://resources/ui_theme.tres`
4. 在项目设置中设为默认主题，或在根节点 `Control` 上设置

### 8.2 需要配置的 Theme 元素

| Godot 类型 | 需要配置的属性 |
|------------|---------------|
| Button | normal/hover/pressed/disabled/focused 样式、字体、颜色 |
| Label | 字体、字号、颜色 |
| Panel | 背景 StyleBox |
| ProgressBar | 填充和背景样式 |
| RichTextLabel | 默认字体、颜色、BBCode 样式 |
| HSlider / VSlider | 滑块和轨道样式 |
| TabBar | 标签样式（如果使用） |

### 8.3 色彩 Token（供 Theme 引用）

```gdscript
# color_tokens.gd -- 全局色彩常量
class_name ColorTokens

const BG_PRIMARY := Color("#1a1a2e")
const BG_SECONDARY := Color("#16213e")
const BG_SURFACE := Color("#0f3460")
const FG_PRIMARY := Color("#e2e2e2")
const FG_SECONDARY := Color("#a0a0b0")

const ACCENT_ENERGY := Color("#00d2ff")
const ACCENT_ATTACK := Color("#ff4444")
const ACCENT_BLOCK := Color("#4488ff")
const ACCENT_SKILL := Color("#44cc88")
const ACCENT_CURSE := Color("#9944cc")
const ACCENT_GOLD := Color("#ffcc00")
const ACCENT_DANGER := Color("#ff6644")
```

---

## 九、UI 动效规范

### 9.1 通用动效参数

| 动效 | 时长 | 缓动函数 | 说明 |
|------|------|----------|------|
| 按钮悬停 | 0.15s | EaseInOut | 微亮 |
| 弹窗出现 | 0.25s | EaseOutBack | 缩放从 0.9 到 1.0 + 淡入 |
| 弹窗消失 | 0.15s | EaseIn | 缩放到 0.95 + 淡出 |
| HP 条变化 | 0.3s | EaseInOut | 平滑过渡 |
| 卡牌抽入手牌 | 0.3s | EaseOut | 从左侧飞入 |
| 伤害数字 | 0.8s | EaseOut | 上浮 + 淡出 |
| 状态图标出现 | 0.2s | EaseOutBack | 弹跳出现 |
| 屏幕震动 | 0.15s | — | 快速抖动 |

### 9.2 过渡动画

| 过渡 | 方式 | 时长 |
|------|------|------|
| 主菜单 -> 战斗 | 淡黑过渡 | 0.5s |
| 战斗 -> 地图 | 淡入淡出 | 0.3s |
| 战斗 -> 奖励 | 弹窗覆盖 | 0.25s |
| 任意 -> 主菜单 | 淡黑过渡 | 0.5s |
