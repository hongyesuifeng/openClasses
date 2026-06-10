# 11 - AI 多模态驱动 UI 视觉还原技术方案

> 版本：2026-06-10  
> 状态：✅ 架构设计完成 / 🚧 工具层待实现  
> 前提：项目已具备 UIBuilder JSON 驱动 UI 能力（见 `docs/tech/10-ui-builder-json-spec.md`）

---

## 1. 背景与痛点

项目已进入 UI 视觉接入阶段，目标工作流是：

```
ChatGPT 生成 UI 效果图
     ↓
ChatGPT 生成对应美术资源
     ↓
Coding Agent 根据效果图还原 Godot UI
     ↓
开发者 / Agent 继续微调布局和表现
```

但这条流水线当前存在以下断点：

| 痛点 | 表现 | 后果 |
|------|------|------|
| 效果图→UI Spec 缺少中间层 | Agent 直接看图猜 JSON | 坐标、层级、样式不稳定 |
| 资源生成和 manifest 没有强绑定 | 有图但不知道资源 key | 资源引用混乱 |
| 缺少 target/current 对比 | 只能靠人眼描述偏差 | 微调效率低 |
| 动态 UI 缺少 mock 数据 | 战斗/商店/奖励页显示空壳 | Agent 无法判断真实布局 |
| 缺少 UI lint | JSON/style/asset/action 容易断 | 改完后运行时才发现问题 |
| Agent 权限边界不清晰 | 可能误改战斗逻辑或 .tscn | 副作用扩大 |

优化重点不是换掉 UIBuilder，而是补齐视觉闭环：

```
效果图 → 视觉拆解 → 结构化 UI Spec → Godot 渲染截图 → 视觉对比 → JSON 微调
```

---

## 2. 完整流水线

```
设计目标图 target.png
     ↓  [ChatGPT 视觉拆解]
ui_design_specs/*.visual.json
     ↓  [ChatGPT 资源清单]
manifest.assets.patch.json + manifest.styles.patch.json
     ↓  [Coding Agent 合并 patch，修改 ui_specs]
ui_specs/*.ui.json（更新）
     ↓  [Godot Gallery / Headless 渲染]
ui_snapshots/current/*_current.png
     ↓  [视觉模型对比]
delta.json（布局/样式差异）
     ↓  [Coding Agent 微调]
下一轮迭代 ↑
```

---

## 3. 目录结构（新增部分）

在现有目录基础上新增：

```
res://
├── ui_specs/                     # 已有：Godot UIBuilder 运行时
├── ui_manifest/                  # 已有：资源和样式
│   ├── manifest.assets.json
│   ├── manifest.styles.json
│   └── manifest.actions.json     # 🚧 新增：action 合法性声明
│
├── ui_design_specs/              # 🚧 新增：AI 视觉拆解中间层
│   ├── battle.visual.json
│   ├── shop.visual.json
│   └── ...
│
├── ui_mock_data/                 # 🚧 新增：动态 UI 预览 mock 数据
│   ├── battle.mock.json
│   ├── shop.mock.json
│   └── ...
│
├── ui_snapshots/                 # 🚧 新增：视觉回归快照
│   ├── target/                   # 目标效果图（设计稿）
│   │   ├── battle_target.png
│   │   └── shop_target.png
│   └── current/                  # 当前渲染截图（自动生成）
│       ├── battle_current.png
│       └── shop_current.png
│
├── ui_reports/                   # 🚧 新增：视觉差异报告
│   ├── battle_diff.json
│   └── battle_report.md
│
└── tools/
    ├── ui_lint.gd                # 🚧 新增：UI Spec 校验脚本
    ├── render_ui_preview.gd      # 🚧 新增：渲染截图脚本
    ├── compare_ui_snapshot.py    # 🚧 可选：像素级对比
    └── generate_ui_report.py     # 🚧 可选：汇总验收报告
```

---

## 4. 核心文件规范

### 4.1 `*.visual.json` — 视觉拆解文件

> 不直接给 Godot 使用，给 Coding Agent 使用。是从效果图抽取出来的结构化设计说明。

```json
{
  "scene": "battle",
  "target_image": "res://ui_snapshots/target/battle_target.png",
  "design_resolution": [1365, 768],
  "style_theme": "甜心迷宫 - 紫粉马卡龙主题",
  "elements": [
    {
      "id": "player_hp_bar",
      "role": "player_status",
      "type_hint": "ProgressBar",
      "expected_node": "PlayerHPBar",
      "bbox": [80, 60, 320, 28],
      "anchor_hint": "top_left",
      "z_layer": "HUDLayer",
      "style_token": "progress_hp",
      "dynamic": true,
      "bind_hint": "battle.player_hp",
      "priority": "high"
    },
    {
      "id": "end_turn_btn",
      "role": "end_turn_button",
      "type_hint": "Button",
      "expected_node": "EndTurnButton",
      "bbox": [1185, 610, 140, 60],
      "anchor_hint": "bottom_right",
      "z_layer": "InteractionLayer",
      "style_token": "btn_primary",
      "dynamic": false,
      "action_hint": "battle.on_end_turn",
      "priority": "high"
    }
  ]
}
```

| 字段 | 说明 |
|------|------|
| `bbox` | 元素在目标图中的 `[x, y, width, height]` |
| `type_hint` | 建议映射到的 Godot 节点类型 |
| `expected_node` | 建议生成到 ui_specs 里的节点名 |
| `style_token` | 建议绑定的 style key |
| `asset_token` | 建议绑定的 asset key |
| `dynamic` | 是否由运行时数据驱动 |
| `bind_hint` | 数据绑定建议 |
| `action_hint` | 按钮 action 建议 |
| `priority` | 视觉还原优先级 high/medium/low |

### 4.2 `manifest.assets.patch.json` — 资源补丁

```json
{
  "backgrounds": {
    "battle_candy": "res://assets/backgrounds/bg_battle_candy.png"
  },
  "ui": {
    "player_hp_frame": {
      "path": "res://assets/ui/battle/player_hp_frame.png",
      "size": [320, 28],
      "nine_patch": [12, 8, 12, 8],
      "usage": "player hp bar frame"
    }
  },
  "buttons": {
    "end_turn": {
      "normal":   "res://assets/ui/battle/btn_end_turn_normal.png",
      "pressed":  "res://assets/ui/battle/btn_end_turn_pressed.png",
      "size": [140, 60],
      "nine_patch": [24, 16, 24, 16]
    }
  }
}
```

**规则：**
- 每个资源必须有明确 key，禁止 Coding Agent 自行猜路径
- 可拉伸面板/按钮必须提供 `nine_patch`
- 不可拉伸图标必须标明 `"nine_patch": null`

### 4.3 `manifest.styles.patch.json` — 样式补丁

```json
{
  "colors": {
    "text_neon_pink": "#FF4F8B",
    "panel_dark_candy": "#1A0D2ECC"
  },
  "styles": {
    "panel_battle_bottom": {
      "type": "flat",
      "bg_color": "panel_dark_candy",
      "border_color": "#FF4F8B",
      "border_width": 2,
      "corner_radius": 18
    },
    "progress_enemy_hp": {
      "type": "progress",
      "fill_color": "#FF315A",
      "bg_color": "#2B1218",
      "border_color": "#FFD166",
      "border_width": 1
    }
  }
}
```

### 4.4 `*.mock.json` — 动态预览数据

```json
{
  "battle": {
    "player_hp": [45, 80],
    "player_block": 12,
    "enemy_hp": [120, 180],
    "energy": [2, 3],
    "turn": 3,
    "hand_cards": [
      { "id": "strike", "name": "打击", "cost": 1, "type": "attack" },
      { "id": "defend", "name": "防御", "cost": 1, "type": "skill" },
      { "id": "bash",   "name": "重击", "cost": 2, "type": "attack" }
    ],
    "relics": ["anchor", "lantern"],
    "potions": ["heal"]
  }
}
```

---

## 5. UI Spec 编写规范

### 5.1 固定五层结构

每个 UI spec 默认分为五层，从下到上：

```json
{
  "children": [
    { "type": "Control", "name": "BackgroundLayer",  "layout": { "preset": "full_rect" }, "children": [] },
    { "type": "Control", "name": "DecorationLayer",  "layout": { "preset": "full_rect" }, "children": [] },
    { "type": "Control", "name": "HUDLayer",         "layout": { "preset": "full_rect" }, "children": [] },
    { "type": "Control", "name": "InteractionLayer", "layout": { "preset": "full_rect" }, "children": [] },
    { "type": "Control", "name": "PopupLayer",       "layout": { "preset": "full_rect" }, "children": [] }
  ]
}
```

| 层级 | 职责 |
|------|------|
| `BackgroundLayer` | 背景图、场景底图 |
| `DecorationLayer` | 边框、角标、霓虹装饰、非交互元素 |
| `HUDLayer` | HP/能量/回合数/状态栏 |
| `InteractionLayer` | 按钮、卡牌、技能栏、可点击区域 |
| `PopupLayer` | 弹窗、确认框、奖励提示 |

### 5.2 节点命名规范

格式：`场景名 + 角色 + 类型`

```
BattleBackground       PlayerHPBar        EnemyHPBar
EnergyLabel            EndTurnButton      HandCardContainer
ShopTitleLabel         ShopContentRow     MerchantPortrait
```

规则：
- 同一 spec 内节点名唯一（防止 `find_child()` 找错）
- 动态容器命名清晰：`CardListContainer`、`ShopItemGrid`
- 禁止随意重命名已有脚本依赖的节点

### 5.3 `ai_hint` 字段（UIBuilder 运行时忽略，Agent 读取）

```json
{
  "type": "ProgressBar",
  "name": "PlayerHPBar",
  "style": "progress_hp",
  "layout": { "preset": "top_left", "size": [320, 28], "margin": [80, 60, 0, 0] },
  "bind": "battle.player_hp",
  "ai_hint": {
    "role": "player hp bar, top-left of battle scene",
    "target_bbox": [80, 60, 320, 28],
    "visual_priority": "high",
    "can_adjust_layout": true,
    "can_replace_asset": false
  }
}
```

---

## 6. Agent 权限边界

### 默认允许修改

```
res://ui_specs/*.ui.json
res://ui_manifest/manifest.assets.json
res://ui_manifest/manifest.styles.json
res://ui_manifest/manifest.actions.json
res://ui_design_specs/*.visual.json
res://ui_mock_data/*.mock.json
res://ui_components/**/*.gd
res://ui_components/**/*.tscn
res://tools/ui_*.gd
```

### 默认禁止修改

```
res://scripts/battle/**
res://scripts/autoload/**
res://scripts/map/**
res://scripts/data/**
res://scenes/**/*.tscn（主场景）
res://data/**/*.json（游戏数据）
```

### 每次改动必须输出

```
1. 修改文件列表
2. 修改原因
3. 是否触碰禁止区域
4. UI lint 结果
5. 预览截图路径
6. 剩余视觉差异
```

---

## 7. 自动化工具规范

### 7.1 `ui_lint.gd` — UI Spec 校验

```bash
godot --headless --script res://tools/ui_lint.gd
```

校验项：

| 校验项 | 说明 |
|--------|------|
| JSON 语法 | spec / manifest / visual 均可解析 |
| 节点类型合法 | type 在 UIBuilder 支持列表中 |
| 节点名唯一 | 防止 find_child() 找错 |
| style key 存在 | 防止样式丢失 |
| asset key 存在 | 防止黑图 |
| bind key 合法 | 防止动态刷新失败 |
| action key 合法 | 防止按钮无响应 |
| layout 合法 | preset 必填字段完整 |
| 关键节点存在 | 每个场景保留核心节点 |
| bbox 不越界 | 节点不能跑出 1365×768 |

### 7.2 `render_ui_preview.gd` — 渲染截图

```bash
godot --headless --script res://tools/render_ui_preview.gd \
  --scene battle \
  --out res://ui_snapshots/current/battle_current.png
```

输入：`ui_specs/battle.ui.json` + `ui_mock_data/battle.mock.json`  
输出：`ui_snapshots/current/battle_current.png`

### 7.3 `generate_ui_report.py` — 验收报告

报告内容：
- 目标图路径 / 当前图路径
- 修改文件列表
- lint 结果
- 关键节点是否存在
- 资源缺失列表
- 样式缺失列表
- 人工验收项

---

## 8. 标准执行流程（四阶段）

### 阶段 A：生成目标 UI（ChatGPT 负责）

输入：
- 当前场景说明 + 当前 `ui_specs/*.ui.json`
- 游戏风格关键词：甜心迷宫，紫粉马卡龙主题
- 设计分辨率：1365×768
- 动态数据示例

输出：
- `ui_snapshots/target/<scene>_target.png`
- `ui_design_specs/<scene>.visual.json`
- `manifest.assets.patch.json`
- `manifest.styles.patch.json`

### 阶段 B：生成美术资源（ChatGPT 负责）

资源命名规范：
```
assets/ui/<scene>/
├── bg_<scene>_<variant>.png           背景图（1920×1080，无 UI 元素）
├── panel_<role>_frame.png             面板边框（含 nine_patch 参数）
├── <role>_hp_frame.png / fill.png     进度条（512×48）
├── btn_<role>_normal/pressed.png      按钮（含 nine_patch 参数）
└── icon_<role>.png                    图标（32~64px，透明背景）
```

要求：
- 文件名和 manifest key 一一对应
- 面板类资源必须提供九宫格参数
- 图标类资源必须透明背景
- 背景图不包含任何 UI 元素
- 效果图只作为 target 参考，不直接作为游戏资源

### 阶段 C：Agent 实现 UI Spec（Coding Agent 负责）

输入：
- `battle.visual.json`
- `battle_target.png`
- `manifest.assets.patch.json`
- `manifest.styles.patch.json`
- 当前 `battle.ui.json`

执行步骤：
1. 合并 manifest patch
2. 修改 `battle.ui.json`
3. 保留动态区域 `ComponentRef`
4. 不改战斗逻辑
5. 运行 `ui_lint.gd`
6. 渲染 `battle_current.png`
7. 输出改动报告

### 阶段 D：视觉对比与微调（视觉模型负责）

输入：`battle_target.png` + `battle_current.png` + `battle.visual.json`

输出示例：
```json
{
  "layout_diffs": [
    {
      "element": "PlayerHPBar",
      "problem": "当前图偏上约 18px",
      "suggested_delta": [0, 18],
      "confidence": 0.82
    }
  ],
  "style_diffs": [
    {
      "element": "BottomPanel",
      "problem": "当前背景透明度过高",
      "suggested_change": { "bg_alpha": "+0.18" }
    }
  ]
}
```

Coding Agent 根据 delta 继续微调 `ui_specs/*.ui.json` 和 `manifest.styles.json`。

---

## 9. Prompt 模板

### 9.1 效果图 + 视觉拆解生成

```
你是游戏 UI 美术与技术美术 Agent。

目标：为 Godot 4.x 项目生成一张 UI 效果图，并同步输出可供 Coding Agent 实现的结构化视觉规格。

游戏风格：甜心迷宫，Q 版卡通，紫粉马卡龙主题，玩家扮演魔法少女挑战甜心塔楼。
设计分辨率：1365×768。
目标场景：<scene>。
当前 UI 架构：UIBuilder JSON 驱动 UI，固定 UI 写 ui_specs/*.ui.json，
样式写 manifest.styles.json，资源写 manifest.assets.json，
动态区域通过 ComponentRef 或 GDScript 填充。

请输出：
1. <scene>_target.png 的画面设计说明
2. <scene>.visual.json（含所有主要 UI 元素的 id/type_hint/bbox/anchor_hint/
   z_layer/style_token/asset_token/dynamic/bind_hint/action_hint）
3. manifest.assets.patch.json
4. manifest.styles.patch.json
5. 需要单独切图的资源列表

要求：
- 设计分辨率 1365×768，坐标以此为准
- 不要把动态内容硬编码进 UI spec，使用 ComponentRef
- 不要让 UI 遮挡场景核心视野区域
```

### 9.2 Coding Agent 实现

```
你是 Godot UI Coding Agent。

目标：根据 <scene>_target.png、<scene>.visual.json、
manifest.assets.patch.json、manifest.styles.patch.json，还原 <scene> UI。

项目约束：
1. 使用 UIBuilder JSON 驱动 UI
2. 固定布局写 ui_specs/<scene>.ui.json
3. 全局资源写 ui_manifest/manifest.assets.json
4. 全局样式写 ui_manifest/manifest.styles.json
5. 动态内容使用 ComponentRef 或现有 GDScript 逻辑填充

允许修改：ui_specs / ui_manifest / ui_mock_data / ui_components / tools/ui_*.gd
禁止修改：scripts/battle / scripts/autoload / scenes/*.tscn / data/*.json

执行步骤：
1. 阅读 visual.json
2. 合并 manifest patch
3. 修改 <scene>.ui.json（使用五层结构：BackgroundLayer/DecorationLayer/
   HUDLayer/InteractionLayer/PopupLayer）
4. 保留或补充必要 ComponentRef
5. 运行 UI lint
6. 渲染 <scene>_current.png
7. 对比目标图和当前图，输出剩余差异
8. 输出修改文件列表
```

### 9.3 视觉微调

```
请对比 <scene>_target.png 和 <scene>_current.png。

输出：
1. 按元素列出布局差异
2. 给出每个元素建议移动量 suggested_delta: [dx, dy]
3. 给出尺寸调整建议 suggested_size_delta: [dw, dh]
4. 给出样式差异（透明度/颜色/字号/边框厚度）
5. 输出可直接交给 Coding Agent 的修改建议

限制：
- 不建议修改战斗逻辑
- 布局问题优先修改 ui_specs/<scene>.ui.json 的 layout
- 样式问题优先修改 manifest.styles.json
- 资源问题优先修改 manifest.assets.json
```

---

## 10. 落地优先级

### P0（立即执行）

| 任务 | 价值 |
|------|------|
| 固定所有 UI 设计分辨率 1365×768 | 降低坐标漂移 |
| 每张 target 图同步生成 `*.visual.json` | 降低 Agent 看图猜测 |
| 资源生成同步输出 manifest patch | 降低资源引用混乱 |
| Coding Agent 只允许改 JSON/manifest/UI 组件 | 控制副作用 |
| Gallery 支持一键渲染 current 截图 | 建立视觉反馈闭环 |

### P1（尽快完成）

| 任务 | 价值 |
|------|------|
| 实现 `ui_lint.gd` | 自动发现错误 |
| 建立 `ui_mock_data/` | 让预览接近真实游戏状态 |
| 给 spec 增加 `ai_hint` | 提升 Agent 修改准确性 |
| 统一 UI spec 五层结构 | 降低层级错乱 |
| 建立 target/current 差异报告 | 提高微调效率 |

### P2（后续增强）

| 任务 | 价值 |
|------|------|
| 自动 bbox 检测 | 提升视觉还原精度 |
| OCR 检查文字 | 防止字号/文本错位 |
| 多分辨率截图测试 | 适配微信小游戏不同机型 |
| 视觉回归历史报告 | 管理多轮 UI 迭代 |

---

## 11. 验收标准

### 文件完整性

```
ui_specs/<scene>.ui.json              ✅ 已有
ui_design_specs/<scene>.visual.json   🚧 待建立
ui_mock_data/<scene>.mock.json        🚧 待建立
ui_snapshots/target/<scene>_target.png 🚧 待建立
ui_snapshots/current/<scene>_current.png 🚧 工具就绪后自动生成
```

### 结构正确性

- JSON 可解析，节点名唯一
- 关键节点存在，动态区域不硬编码假内容
- asset / style / action / bind key 全部可解析

### 视觉正确性

- UI 主体布局接近目标效果图
- 关键交互按钮位置正确，场景核心视野无遮挡
- 血条/能量/状态信息清晰可读
- 面板和按钮没有明显拉伸变形
- mock 状态下动态内容显示正常

### 工程安全性

- 未修改禁止区域，未破坏战斗逻辑
- 未直接修改主场景 `.tscn`
- 修改记录清晰，可回滚

---

## 12. 角色分工总结

| 环节 | 负责工具 |
|------|---------|
| UI 创意和效果图 | ChatGPT |
| 美术资源生成 | ChatGPT |
| 视觉拆解（visual.json） | ChatGPT / Claude |
| 工程实现（spec + manifest） | Claude Code / Codex CLI |
| 局部布局微调 | Cursor |
| 预览截图 | Godot Gallery / Headless 脚本 |
| 验收对比 | ChatGPT / Claude + 人工确认 |

> 核心原则：不是找"最强多模态 Coding Agent 一把梭"，而是建立**可控、可验证、可反复迭代**的 AI UI 生产流水线。每个环节的工具做它最擅长的事，JSON 是各环节之间的稳定接口。
