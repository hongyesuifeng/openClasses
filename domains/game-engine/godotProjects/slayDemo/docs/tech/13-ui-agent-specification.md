# 甜心迷宫 — UI 生成 Agent 规范文档

> 项目：甜心迷宫（Q 版卡通卡牌 Roguelike，Godot 4.x）  
> 版本：2026-06-10（✅ 工具链已就绪，可执行版）  
> 用途：发送给负责生成 UI 效果图 + 美术资源 + 结构化规格的 Agent

---

## 1. 项目背景与你的任务

这是一款**Q 版卡通卡牌 Roguelike 游戏**，玩家扮演魔法少女，挑战云端甜心迷宫塔楼。

**你负责的环节：**

```
你（UI 生成 Agent）
     │
     ├── 生成 UI 效果图（target.png）
     ├── 生成美术资源（图片文件）
     ├── 生成结构化视觉规格（*.visual.json）
     ├── 生成资源补丁（manifest.assets.patch.json）
     └── 生成样式补丁（manifest.styles.patch.json）
```

Coding Agent 接收你的输出后，将其合并到 Godot 工程并渲染截图验证。

---

## 2. 视觉风格

**关键词：** 紫粉马卡龙 / Q 版卡通 / 甜心魔法少女 / 糖果塔楼  
**设计分辨率：** 1365 × 768（所有坐标以此为准）  
**配色主调：**

| 用途 | 颜色 |
|------|------|
| 主粉色（按钮/标题） | `#F28DA5` |
| 金色（边框/强调） | `#FFD700` |
| 深紫背景 | `#1A1A2E` 半透明 |
| 白色文字 | `#FFFFFF` |
| 暖白文字 | `#FAEBD0` |

---

## 3. 项目 UI 架构（必须了解）

### 3.1 分层原则

每个 UI 场景分五层（从下到上）：

| 层名 | 职责 |
|------|------|
| `BackgroundLayer` | 背景图、场景底图 |
| `DecorationLayer` | 装饰边框、光效、非交互元素 |
| `HUDLayer` | HP/能量/状态栏 |
| `InteractionLayer` | 按钮、卡牌、可点击区域 |
| `PopupLayer` | 弹窗、确认框 |

### 3.2 动态 vs 静态规则

**这些区域由游戏逻辑动态填充，你不能在 visual.json 里假设具体数量：**

| 区域名 | 说明 |
|--------|------|
| 手牌区 `HandRow` | 0～10 张卡牌，游戏运行时动态创建 |
| 敌人区 `EnemyRow` | 1～4 个敌人，动态创建 |
| 遗物栏 `RelicRow` | 0～8 个遗物图标 |
| 药水槽 `PotionRow` | 0～3 个药水 |
| 玩家状态栏 `PlayerStatusRow` | 0～8+ 种状态效果 |
| 商店商品 `ContentRow` | 数量由数据决定 |
| 事件选项 `ChoiceRow` | 2～4 个按钮 |
| 奖励卡牌 `ChoiceRow` | 3 张卡牌 |

**这些区域的 UI 节点必须留空容器，由 Coding Agent 用 GDScript 动态填充。**

### 3.3 中心视野保护

战斗场景的中央区域（敌人展示区）不能被 HUD 遮挡：

```
顶部状态栏：约 0～90px（保留给玩家 HP/遗物/药水）
底部交互区：约 550～768px（保留给手牌 + 结束回合按钮）
中央视野区：90～550px（敌人展示，不能放固定 UI 元素）
```

---

## 4. 已注册的 style_key（直接使用，不要新造颜色）

```
按钮类：
  btn_primary    主按钮（粉色金边，字号 22，用于开始/确认/结束回合）
  btn_secondary  次要按钮（深紫，字号 18，用于次要操作）
  btn_action     操作按钮（暗紫，字号 16，用于返回/放弃/离开）
  btn_icon       图标按钮（半透明，字号 14，用于侧边栏图标）

面板类：
  panel_dark     深色半透明面板（主要用途，#1A1A2E，圆角 12）
  panel_card     卡牌/深色内容面板（#241338，圆角 10）
  panel_light    浅色面板（白色半透明）
  panel_resource 资源栏面板（右上角金币/水晶栏）
  panel_sidebar  侧边栏背景（左侧功能栏）

文字类：
  text_hero_title  游戏主标题（字号 56，粉色）
  text_title       标题（字号 32，白色）
  text_title_pink  粉色标题（字号 32，#FFB5C2）
  text_title_gold  金色标题（字号 30，#FFD700）
  text_subtitle    副标题（字号 20，浅紫白）
  text_body        正文（字号 17，暖白 #FAEBD0）
  text_caption     小字注释（字号 14，灰色）
  text_section     区块标题（字号 18，金色）
  text_gold_label  金币数字（字号 18，金色）

进度条：
  progress_hp      HP 条（粉色填充 #FF6B9D，深红背景）
  progress_energy  能量条（紫色填充 #AA66FF）
```

如需新增 style，必须在 `manifest.styles.patch.json` 中声明，不能在资源中硬编码颜色。

---

## 5. 已注册的 asset_key（直接使用）

```
背景图（1920×1080，keep_aspect_covered）：
  backgrounds.main_menu    主菜单背景
  backgrounds.battle       普通战斗背景
  backgrounds.battle_boss  Boss 战背景
  backgrounds.map          地图/商店/休息/事件/宝箱/奖励（共用）

角色：
  characters.merchant      商人立绘（300×400）
  player.portrait          玩家头像（96×96）

功能图标（32×32 或 50×50）：
  icons.achievement / icons.collection / icons.settings / icons.notice
  icons.battle / icons.shop / icons.chest / icons.question
  icons.rest / icons.boss / icons.elite / icons.crystal / icons.gold

按钮贴图（240×80，九宫格 [36,24,36,24]）：
  buttons.primary.normal / pressed / disabled
  buttons.secondary.normal / pressed / disabled

面板贴图（64×64）：
  panels.dark / panels.light
```

---

## 6. 你需要输出的内容

### 输出 A：UI 效果图（PNG）

文件路径：`ui_snapshots/target/<scene>_target.png`

要求：
- 尺寸：**1365 × 768**
- 格式：PNG，RGB（不需要透明背景）
- 内容：完整的场景 UI，含背景 + 所有 UI 元素
- 动态内容区域：用合理的占位内容填充（如 3 张示例手牌）
- 背景图不包含 UI 按钮（UI 和背景分层生成）

---

### 输出 B：`*.visual.json`（结构化视觉规格）

文件路径：`ui_design_specs/<scene>.visual.json`

**完整字段说明：**

```json
{
  "scene": "<场景名>",
  "target_image": "res://ui_snapshots/target/<scene>_target.png",
  "design_resolution": [1365, 768],
  "style_theme": "甜心迷宫 — 紫粉马卡龙主题",
  "elements": [
    {
      "id": "唯一标识符（snake_case）",
      "role": "元素职责描述",
      "type_hint": "Godot 节点类型（见白名单）",
      "expected_node": "Godot 节点名（PascalCase，对应 find_child 查找）",
      "bbox": [x, y, width, height],
      "anchor_hint": "layout preset（见支持列表）",
      "z_layer": "BackgroundLayer/DecorationLayer/HUDLayer/InteractionLayer/PopupLayer",
      "style_token": "已注册的 style_key（可选）",
      "asset_token": "已注册的 asset_key（可选）",
      "action_hint": "按钮的 action，格式 scene.verb（可选）",
      "bind_hint": "数据绑定提示（可选）",
      "dynamic": false,
      "priority": "high/medium/low",
      "tolerance": {
        "position_px": 8,
        "size_px": 10,
        "color_delta": 15
      },
      "acceptance_weight": 0.9,
      "ai_hint": "给 Coding Agent 的补充说明（可选）"
    }
  ],
  "static_dynamic_rules": {
    "note": "动态区域说明",
    "dynamic_areas": ["区域名及原因"]
  }
}
```

**type_hint 只能用以下类型（UIBuilder 白名单）：**
```
Control / Panel / PanelContainer / Label / Button
TextureRect / HBoxContainer / VBoxContainer / ScrollContainer
MarginContainer / CenterContainer / ProgressBar / ComponentRef / ColorRect
```

**anchor_hint 支持的 preset：**
```
full_rect           铺满父节点
top_full            顶部横贯（需 height）
bottom_full         底部横贯（需 height）
left_full           左侧纵贯（需 width）
right_full          右侧纵贯（需 width）
center              居中（需 size: [w, h]）
top_left / top_right / top_center
bottom_left / bottom_right / bottom_center
left_center / right_center
```

**tolerance 参考值（按元素重要性）：**

| 元素类型 | position_px | size_px | color_delta | acceptance_weight |
|---------|-------------|---------|-------------|-------------------|
| 核心按钮（结束回合/开始游戏） | 6 | 6 | 8 | 0.95 |
| HP 条 / 能量条 | 4 | 4 | 8 | 0.90 |
| 标题文字 | 8 | 8 | 12 | 0.85 |
| 功能图标 | 8 | 8 | 15 | 0.70 |
| 动态容器（空容器） | 12 | 16 | 20 | 0.60 |
| 背景图 | 0 | 0 | 30 | 0.30 |
| 装饰元素 | 16 | 20 | 25 | 0.40 |

---

### 输出 C：`manifest.assets.patch.json`

每个新资源必须有：
- 明确的 key（格式：`category.scene.role[.state]`）
- 实际文件路径（`res://assets/ui/<scene>/<filename>.png`）
- 对于按钮/面板：必须提供 `nine_patch: [left, top, right, bottom]`
- 对于图标：标明 `nine_patch: null`

```json
{
  "backgrounds": {
    "battle_new_variant": "res://assets/backgrounds/bg_battle_new.png"
  },
  "ui": {
    "battle.player_hp_frame": {
      "path": "res://assets/ui/battle/player_hp_frame.png",
      "size": [320, 28],
      "nine_patch": [12, 8, 12, 8],
      "usage": "player hp bar frame"
    },
    "battle.end_turn_btn": {
      "normal":   "res://assets/ui/battle/btn_end_turn_normal.png",
      "pressed":  "res://assets/ui/battle/btn_end_turn_pressed.png",
      "size": [140, 60],
      "nine_patch": [24, 16, 24, 16]
    }
  },
  "icons": {
    "new_icon": "res://assets/ui/icons/icon_new.png"
  }
}
```

**资源文件命名规范：**
```
背景图：bg_<scene>_<variant>.png          （1920×1080，无 UI 元素）
面板：  ui_panel_<role>.png               （64×64 基础尺寸，九宫格可拉伸）
进度条：ui_<type>_bar_bg/fill.png         （512×48）
按钮：  ui_btn_<style>_normal/pressed/disabled.png （240×80）
图标：  icon_<role>.png                   （32×32 或 50×50，透明背景）
遗物：  relic_<id>.png                    （64×64，透明背景）
状态：  status_<id>.png                   （40×40，透明背景）
```

---

### 输出 D：`manifest.styles.patch.json`

只在需要新 style_key 时才输出。优先复用已有 key。

```json
{
  "colors": {
    "新颜色名（语义命名）": "#十六进制颜色值"
  },
  "styles": {
    "新_style_key": {
      "type": "flat",
      "bg_color": "引用颜色名或直接十六进制",
      "border_color": "#颜色",
      "border_width": 2,
      "corner_radius": 12,
      "font": "default",
      "font_size": 18,
      "font_color": "text_primary"
    }
  }
}
```

**style type 支持：**
- `"flat"` — 纯色 StyleBoxFlat（用于按钮、面板）
- `"progress"` — 进度条（需 fill_color + bg_color）

---

## 7. 九个游戏场景说明

### 主菜单（main_menu）

```
功能：游戏入口，开始/继续游戏
固定元素：背景图、游戏标题、副标题、开始按钮、继续按钮（有存档时）
动态元素：继续按钮可见性（有存档时才显示）
侧边栏：左侧 4 个图标按钮（成就/图鉴/设置/公告）
右上角：设置按钮
```

### 战斗（battle）

```
功能：核心战斗玩法
固定元素：背景、顶部玩家状态栏、结束回合按钮、右上角工具按钮
动态元素：
  - 敌人行（1~4 个敌人，含精灵/HP条/意图/状态）
  - 手牌区（0~10 张卡牌，横向滚动）
  - 玩家 HP 条 + 格挡条
  - 遗物行、药水行、玩家状态行
注意：中央区域（90~550px）不要放固定 UI
```

### 地图（map）

```
功能：路线选择，看到全局进度
固定元素：背景、标题、状态文字、遗物行
动态元素：节点按钮（从左到右布局，floor_index 控制 x 轴）
          路径连线（代码绘制）
```

### 商店（shop）

```
功能：购买卡牌/遗物/药水，删牌
固定元素：背景、标题、副标题、状态标签、右上角金币栏
           删牌按钮、离开按钮、商人立绘
动态元素：商品展示区（卡牌/遗物/药水卡片）
```

### 奖励（reward）

```
功能：战斗后选择卡牌/遗物/药水奖励
固定元素：背景、标题、副标题、状态标签、操作按钮行
动态元素：奖励选项（卡牌/遗物/药水）
```

### 事件（event）

```
功能：随机剧情事件，做出选择
固定元素：背景、事件标题、事件描述
动态元素：选项按钮行（2~4 个按钮，由事件数据决定）
```

### 休息（rest）

```
功能：回血 or 升级卡牌
固定元素：背景、标题、状态文字
动态元素：选项区（回血/升级两按钮，升级模式时显示卡牌列表）
```

### 结算（result）

```
功能：胜利/失败后的游戏总结
固定元素：深色背景、标题、评级、得分分解、数据统计面板、操作按钮
动态元素：遗物列表、最终牌组
```

### 宝箱（chest）

```
功能：打开宝箱获得金币+遗物
固定元素：背景、标题、状态文字、打开按钮
```

---

## 8. 执行步骤（每次任务）

```
Step 1  读当前 ui_specs/<scene>.ui.json，了解现有节点结构
Step 2  生成 <scene>_target.png（效果图）
Step 3  生成 <scene>.visual.json（所有元素的 bbox/type/style/asset/tolerance）
Step 4  列出需要新增的美术资源
Step 5  生成美术资源图片（按命名规范）
Step 6  生成 manifest.assets.patch.json
Step 7  如需新 style，生成 manifest.styles.patch.json
Step 8  输出资源清单和修改说明
```

---

## 9. Prompt 模板

### 9.1 生成单个场景的完整输出

```
你是游戏 UI 美术与技术美术 Agent。

项目：甜心迷宫，Q 版卡通卡牌 Roguelike，Godot 4.x
风格：紫粉马卡龙 / 魔法少女 / 糖果塔楼
设计分辨率：1365 × 768
目标场景：<scene>

当前 ui_specs/<scene>.ui.json 内容：
<粘贴当前 spec 内容>

请输出：
1. <scene>_target.png 的画面设计说明（详细描述各区域内容和视觉效果）
2. ui_design_specs/<scene>.visual.json（包含所有主要元素，必须有 tolerance 和 acceptance_weight）
3. 需要新增或替换的美术资源列表（文件名、尺寸、是否需要九宫格）
4. manifest.assets.patch.json（如有新资源）
5. manifest.styles.patch.json（如有新 style_key，优先复用现有 key）

约束：
- 坐标基于 1365×768，bbox 格式为 [x, y, width, height]
- 动态区域（HandRow/EnemyRow/RelicRow 等）的 dynamic 必须为 true，不要描述具体子元素数量
- style_token 优先使用已注册的 key，不要发明新的颜色
- asset_token 优先使用已注册的 key
- 背景图不包含 UI 按钮文字
- 战斗场景中央区域（90~550px 高度范围）不放固定 UI 元素
```

### 9.2 视觉微调

```
请对比以下两张图：
- 目标图：<scene>_target.png
- 当前图：<scene>_current.png
- 当前规格：ui_design_specs/<scene>.visual.json（含 tolerance 容差值）

输出内容：
1. 按元素列出布局差异（参考 visual.json 中每个元素的 tolerance）
2. 超出 tolerance 的元素：给出建议移动量 [dx, dy] 和尺寸调整 [dw, dh]
3. 在 acceptance_weight > 0.8 的元素上重点关注
4. 样式差异（颜色/透明度/字号/边框）
5. 输出可直接给 Coding Agent 执行的修改指令

注意：
- 不建议修改战斗逻辑
- 布局问题修改 ui_specs/<scene>.ui.json 的 layout 字段
- 颜色/样式问题修改 manifest.styles.json
- 资源问题修改 manifest.assets.json
```

### 9.3 资源补充生成

```
当前场景：<scene>
需要以下美术资源，请生成并提供 manifest.assets.patch.json：

资源列表（参考 manifest.assets.patch.json 格式）：
<列出需要的资源和规格>

要求：
- 文件名符合命名规范
- 面板/按钮资源提供九宫格参数
- 图标透明背景
- 背景图 1920×1080，不包含 UI 文字和按钮
- 每个资源对应一个唯一 asset_key
```

---

## 10. 验收清单

Coding Agent 会用以下标准检查你的输出，确保满足：

### visual.json 检查
- [ ] 所有 `type_hint` 在 UIBuilder 白名单内
- [ ] 动态区域的 `dynamic: true` 已标注
- [ ] 每个元素有 `tolerance` 和 `acceptance_weight`
- [ ] `anchor_hint` 在支持的 preset 列表内
- [ ] 有 `static_dynamic_rules` 说明

### 资源检查
- [ ] 文件命名符合规范
- [ ] 按钮/面板提供 `nine_patch`
- [ ] 图标标注 `"nine_patch": null`
- [ ] 背景图不含 UI 元素
- [ ] 每个资源对应唯一 asset_key

### 样式检查
- [ ] 优先复用已有 style_key
- [ ] 新 style 使用语义命名（不用坐标/场景命名）
- [ ] 颜色值统一进 manifest，不散落在 spec 里

### 布局检查
- [ ] 战斗场景中央视野区域无遮挡（90~550px）
- [ ] 动态容器 `children` 为空（不硬编码子节点）
- [ ] `bbox` 坐标在 1365×768 范围内
