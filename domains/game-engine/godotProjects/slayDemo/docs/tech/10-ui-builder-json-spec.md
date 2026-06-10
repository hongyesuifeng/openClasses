# 10 - UIBuilder JSON 驱动 UI 技术方案

> 版本：2026-06-10  
> 状态：✅ 已实现并上线  
> 适用引擎：Godot 4.x (GDScript)

---

## 1. 方案概述

### 1.1 解决的问题

原有方案中，所有 UI 布局硬编码在 GDScript 的 `_build()` 函数里，存在以下问题：

| 问题 | 表现 |
|------|------|
| **布局调整成本高** | 改一个按钮位置需要找到对应代码行，修改后无法预览 |
| **样式散落各处** | 颜色值（`Color(0.95, 0.55, 0.65)`）在每个场景重复定义 |
| **AI 改场景有副作用** | 直接改 `.tscn` 容易破坏节点引用和信号连接 |
| **无法热重载** | 修改 UI 必须重启游戏才能看到效果 |

### 1.2 解决方案

将 UI 骨架描述从 GDScript 中分离到 JSON 文件，运行时由 `UIBuilder` 解析生成节点树。

```
AI / 开发者修改 ui_specs/*.ui.json
          ↓
UIBuilder.build(spec_path) 解析 JSON
          ↓
自动生成 Godot Control 节点树
          ↓
场景脚本通过 find_child() 获取节点引用，填充动态内容
```

---

## 2. 文件结构

```
res://
├── addons/ui_builder/              ← 框架核心（Godot 插件形式）
│   ├── plugin.cfg
│   ├── plugin.gd
│   ├── ui_builder.gd               ← 核心：读 Spec 生成节点树
│   ├── ui_style_resolver.gd        ← 样式解析：style_key → StyleBox/Theme
│   ├── ui_action_binder.gd         ← 按钮 action 冒泡注册
│   ├── ui_asset_loader.gd          ← manifest.assets → 纹理加载
│   ├── ui_data_binder.gd           ← 数据绑定（手动刷新模式）
│   ├── ui_spec_editor.gd           ← 读写 spec 文件（开发工具用）
│   └── base_components/            ← 跨场景通用基础组件
│       ├── UIBaseButton.gd
│       └── UIBasePanel.gd
│
├── ui_manifest/                    ← 全局配置（换皮时改这里）
│   ├── manifest.assets.json        ← 资源 key → 实际路径
│   └── manifest.styles.json        ← style_key → 视觉配置
│
├── ui_specs/                       ← 场景骨架（调布局时改这里）
│   ├── main_menu.ui.json
│   ├── battle.ui.json
│   ├── map.ui.json
│   ├── shop.ui.json
│   ├── reward.ui.json
│   ├── event.ui.json
│   ├── rest.ui.json
│   ├── result.ui.json
│   ├── chest.ui.json
│   └── demo.ui.json                ← 框架自带验证 Demo
│
└── scripts/scenes/                 ← 场景脚本（改逻辑时改这里）
    ├── main_menu_scene.gd          ← UIBuilder.build() + 动态内容填充
    └── ...
```

---

## 3. 职责分层

| 层级 | 文件 | 管理内容 | 修改时机 |
|------|------|---------|---------|
| **框架层** | `addons/ui_builder/` | JSON→节点树转换逻辑 | 框架功能升级时 |
| **全局样式** | `manifest.styles.json` | 颜色/字号/边框/圆角 | 换皮、调整主题时 |
| **全局资源** | `manifest.assets.json` | 所有图片路径映射 | 替换美术资源后 |
| **场景骨架** | `ui_specs/*.ui.json` | 节点层级/布局/style_key | 调整布局/结构时 |
| **动态内容** | `scripts/scenes/*.gd` | 卡牌列表/数据刷新/条件逻辑 | 改游戏逻辑时 |

---

## 4. UI Spec JSON 格式

### 4.1 顶层结构

```json
{
  "scene": "MainMenuUI",
  "design_resolution": [1365, 768],
  "background": { ... },
  "children": [ ... ]
}
```

### 4.2 节点字段

```json
{
  "type": "Button",
  "name": "StartButton",
  "text": "开始游戏",
  "style": "btn_primary",
  "layout": {
    "preset": "bottom_center",
    "size": [280, 58],
    "margin": [0, 0, 0, 120]
  },
  "action": "menu.on_start",
  "visible": true,
  "asset": "icons.settings",
  "bind": "battle.hp",
  "children": []
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `type` | string | 节点类型，见支持列表 |
| `name` | string | 节点名，脚本可用 `find_child()` 查找 |
| `text` | string | Label / Button 显示文字 |
| `style` | string | style_key，从 `manifest.styles.json` 读取 |
| `layout` | object | 布局配置，见 Layout 章节 |
| `action` | string | 按钮点击 action，格式 `域名.方法名` |
| `visible` | bool | 初始可见性，默认 true |
| `asset` | string | 资源 key，从 `manifest.assets.json` 读取 |
| `bind` | string | 数据绑定路径（手动刷新模式） |
| `children` | array | 子节点列表，递归 |

### 4.3 支持的节点类型

```
Control          纯容器节点
Panel            面板（自动应用 StyleBox）
PanelContainer   自适应内容大小的面板容器
Label            文本标签
Button           普通按钮
TextureRect      图片/背景
HBoxContainer    横排容器
VBoxContainer    竖排容器
ScrollContainer  可滚动容器
MarginContainer  带边距容器
CenterContainer  居中容器
ProgressBar      进度条
ComponentRef     引用游戏专用组件（见第 7 节）
```

---

## 5. Layout Preset 系统

### 5.1 禁止在 Spec 里直接写 anchor 值

Spec 里只描述"这个元素在哪个区域"，由 UIBuilder 负责转成 Godot 4.x 的 anchor/offset。

### 5.2 支持的 Preset

| Preset | 说明 | 额外必填字段 |
|--------|------|------------|
| `full_rect` | 铺满父节点 | — |
| `top_full` | 顶部横贯 | `height` |
| `bottom_full` | 底部横贯 | `height` |
| `left_full` | 左侧纵贯 | `width` |
| `right_full` | 右侧纵贯 | `width` |
| `center` | 居中 | `size: [w, h]` |
| `top_left` | 左上角 | `size: [w, h]` |
| `top_right` | 右上角 | `size: [w, h]` |
| `top_center` | 顶部居中 | `size: [w, h]` |
| `bottom_left` | 左下角 | `size: [w, h]` |
| `bottom_right` | 右下角 | `size: [w, h]` |
| `bottom_center` | 底部居中 | `size: [w, h]` |
| `left_center` | 左侧居中 | `size: [w, h]` |
| `right_center` | 右侧居中 | `size: [w, h]` |
| `absolute_rect` | 绝对坐标 | `position: [x, y]`, `size: [w, h]` |
| `raw_anchors` | 精确锚点（编辑器回写） | `anchor_*`, `offset_*` |

### 5.3 margin 语义

```json
"margin": [left, top, right, bottom]
```

含义：距离对应方向锚点的像素偏移量（正数为内缩）。

示例：
```json
{ "preset": "bottom_right", "size": [180, 60], "margin": [0, 0, 40, 40] }
```
→ 距右边 40px，距底部 40px，尺寸 180×60

---

## 6. Manifest 格式

### 6.1 manifest.styles.json

```json
{
  "colors": {
    "text_primary": "#FFFFFF",
    "text_gold":    "#FFD700"
  },
  "fonts": {
    "default": "res://assets/fonts/NotoSansSC-VariableFont_wght.ttf",
    "title":   "res://assets/fonts/ChakraPetch-Bold.ttf"
  },
  "styles": {
    "btn_primary": {
      "type": "flat",
      "bg_color": "#F28DA5",
      "border_color": "#FFD700",
      "border_width": 2,
      "corner_radius": 22,
      "font": "default",
      "font_size": 22,
      "font_color": "text_primary"
    },
    "panel_dark": {
      "type": "flat",
      "bg_color": "#1A1A2ECC",
      "border_color": "#6644AA",
      "border_width": 2,
      "corner_radius": 12
    },
    "progress_hp": {
      "type": "progress",
      "fill_color": "#FF6B9D",
      "bg_color": "#442233",
      "border_color": "#AA4477",
      "border_width": 1
    }
  }
}
```

**style_key 使用语义命名**：`btn_primary` 换游戏只改 manifest，Spec 不动。

### 6.2 manifest.assets.json

```json
{
  "backgrounds": {
    "main_menu": "res://assets/backgrounds/bg_main_menu.png"
  },
  "icons": {
    "settings": "res://assets/ui/icons/icon_settings.png"
  },
  "buttons": {
    "primary": {
      "normal":     "res://assets/ui/buttons/ui_btn_pink_normal.png",
      "nine_patch": [36, 24, 36, 24]
    }
  }
}
```

---

## 7. Action 绑定机制

### Spec 中声明

```json
{ "type": "Button", "name": "StartBtn", "action": "menu.on_start" }
```

### 场景脚本中处理

```gdscript
func handle_action(action_name: String, _source: Node) -> void:
    match action_name:
        "menu.on_start":    _on_start_pressed()
        "menu.on_continue": _on_continue_pressed()
```

UIActionBinder 在节点树中自动向上冒泡，找到实现了 `handle_action` 的父节点。

---

## 8. 场景脚本使用模式

```gdscript
extends Control

const _UIBuilder := preload("res://addons/ui_builder/ui_builder.gd")
const SPEC_PATH := "res://ui_specs/main_menu.ui.json"

func _ready() -> void:
    _build()

func _build() -> void:
    # 1. 从 JSON 生成骨架节点树
    var ui := _UIBuilder.build(SPEC_PATH)
    ui.set_anchors_preset(Control.PRESET_FULL_RECT)
    add_child(ui)

    # 2. 通过 find_child 获取容器引用，填充动态内容
    var choice_row := ui.find_child("ChoiceRow", true, false) as HBoxContainer
    var status_lbl := ui.find_child("StatusLabel", true, false) as Label

    # 3. 填入运行时数据
    status_lbl.text = _status_text()
    _render_choices(choice_row)

func handle_action(action_name: String, _source: Node) -> void:
    match action_name:
        "menu.on_start": _on_start_pressed()
```

**规则**：
- 固定布局元素（标题、背景、按钮）→ 写进 spec JSON
- 动态内容（卡牌列表、遗物行、数据统计）→ 保留在 GDScript

---

## 9. 开发工具：Gallery 预览编辑器

**运行方式**：打开 `res://scenes/dev/ui_gallery_scene.tscn`

### 9.1 Spec JSON Tab

```
左栏：spec 文件列表（点击切换）
右上：SubViewport 渲染完整 1280×720 场景预览
右下：JSON 文本编辑器
```

**操作按钮**：

| 按钮 | 功能 |
|------|------|
| `▶ 应用预览` | 临时渲染当前 JSON，不写磁盘 |
| `💾 保存` | 写回 `res://ui_specs/*.ui.json` |
| `💾 保存+预览` | 保存后刷新场景预览 |
| `整理` | JSON 美化格式 |
| `验证` | JSON 语法检查 |
| `注入 Mock` | 注入 GameState 测试数据后刷新 |

### 9.2 Live 布局编辑器

在预览场景上**右键任意 UI 节点** → 右侧弹出属性面板：
- 拖拽调整节点位置
- 输入框精确修改 anchor/offset/font_size/modulate
- 「应用并保存」写回 spec JSON + UILayoutStore

---

## 10. 数据绑定（第一阶段：手动刷新）

```gdscript
# Spec 中声明绑定路径
{ "type": "Label", "bind": "battle.hp_text" }

# 运行时注册
UIDataBinder.register_root(ui)

# 数据变化时手动刷新
UIDataBinder.refresh("battle.hp_text", "45 / 80")
```

支持绑定的节点类型：
- `Label` → 更新 `text`
- `ProgressBar` → 更新 `value`
- `Button` → 更新 `text`

---

## 11. headless 测试兼容

插件在 `--headless` 测试模式下不自动加载，使用时必须显式 preload：

```gdscript
## ✅ 正确：显式 preload
const _UIBuilder := preload("res://addons/ui_builder/ui_builder.gd")

## ❌ 错误：依赖 class_name 全局注册
UIBuilder.build(...)  # headless 下可能找不到
```

测试覆盖：`tests/unit/ui_builder_test.gd`（132 条断言）

---

## 12. 三种微调途径

### 途径 1：直接编辑 JSON（最轻量）

调整节点布局 → 改 `ui_specs/*.ui.json` 对应节点的 `layout` 字段

```json
"layout": { "preset": "bottom_center", "size": [280, 58], "margin": [0, 0, 0, 80] }
```

### 途径 2：拖拽调整（精确定位）

Gallery → Spec JSON Tab → 预览区右键节点 → 拖拽 → 保存

修改自动回写到 spec JSON，格式为 `raw_anchors` preset：
```json
"layout": { "preset": "raw_anchors", "anchor_left": 0.5, "offset_left": -140, ... }
```

### 途径 3：改 manifest 换皮（全局生效）

改 `manifest.styles.json` 里任一 style_key 的颜色/字号，所有引用该 key 的节点同步生效：

```json
"btn_primary": { "bg_color": "#FF0000" }  ← 改一行，所有主按钮变色
```

---

## 13. 当前已迁移场景

| 场景 | Spec 文件 | 骨架节点数 | 动态内容 |
|------|----------|-----------|---------|
| 主菜单 | `main_menu.ui.json` | 8 | 继续按钮条件显示、Toast |
| 战斗 | `battle.ui.json` | 12 | HP条、手牌、敌人行 |
| 地图 | `map.ui.json` | 7 | 节点按钮、路径连线 |
| 商店 | `shop.ui.json` | 10 | 商品卡片、遗物/药水 |
| 奖励 | `reward.ui.json` | 9 | 卡牌选择列表 |
| 事件 | `event.ui.json` | 5 | 选项按钮、选牌区域 |
| 休息 | `rest.ui.json` | 5 | 升级卡牌列表 |
| 结算 | `result.ui.json` | 11 | 数据统计行、牌组展示 |
| 宝箱 | `chest.ui.json` | 4 | 开箱结果文字 |

---

## 14. 扩展：ComponentRef（游戏专用组件接入）

在 Spec 里引用游戏专属组件场景：

```json
{
  "type": "ComponentRef",
  "component": "CardHandView",
  "name": "HandCards",
  "layout": { "preset": "bottom_center", "size": [760, 180], "margin": [0, 0, 0, 24] },
  "props": { "max_visible_cards": 7 }
}
```

UIBuilder 处理：
1. 在 `ui_components/` 目录下找 `card_hand_view.tscn`（PascalCase → snake_case）
2. 实例化场景
3. 调用 `setup(props)` 传入参数
4. 应用 layout

组件规范：
```gdscript
class_name CardHandView extends Control

func setup(props: Dictionary) -> void:
    max_visible_cards = props.get("max_visible_cards", 5)
```
