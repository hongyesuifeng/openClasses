# 16. 运行时 UI 可视化编辑系统 — 技术方案

> **版本**：v1.0 草案
> **日期**：2026-06-08
> **目标**：让开发者在 Godot 运行时直接调整所有场景的 UI 布局和视觉参数，保存后自动同步到游戏。

---

## 1. 现状分析

### 1.1 已有能力（不用重建）

| 模块 | 文件 | 状态 |
|------|------|------|
| `UILayoutStore` | `scripts/ui/ui_layout_store.gd` | ✅ 读写 JSON，支持 templates/instances/gallery 三层覆盖 |
| `UILayoutEditor` | `scripts/dev/ui_layout_editor.gd` | ✅ 拖拽、字段编辑、撤销/重做、保存 |
| `UIGallery` | `scripts/dev/ui_gallery_scene.gd` | ✅ 右键打开编辑器，Tab 预览系统 |
| 存储文件 | `data/ui_layouts.json` | ✅ 9 个模板条目，格式稳定 |

### 1.2 当前覆盖缺口

**已接入 `apply_layout` 的场景/组件**：

| 文件 | apply_layout 调用数 | 已注册 element_id 数 |
|------|---------------------|----------------------|
| `battle_scene.gd` | 15 处 | 15 个（battle.* 系列） |
| `map_scene.gd` | 6 处 | 6 个（map.* 系列） |
| `card_view_factory.gd` | 7 处 | 7 个（card.* 系列） |
| `relic_view_factory.gd` | 2 处 | 2 个（relic.* 系列） |
| `status_view_factory.gd` | 1 处 | 1 个（status.* 系列） |
| `potion_view_factory.gd` | 1 处 | 1 个（potion.* 系列） |

**未接入的场景**（仍有 50~64 处硬编码视觉参数）：

| 场景 | 硬编码参数数 | 优先级 |
|------|-------------|--------|
| `shop_scene.gd` | 51 处 | 高 |
| `reward_scene.gd` | 53 处 | 高 |
| `event_scene.gd` | 18 处 | 中 |
| `rest_scene.gd` | 19 处 | 中 |
| `result_scene.gd` | 37 处 | 中 |
| `chest_scene.gd` | 7 处 | 低 |
| `main_menu_scene.gd` | 12 处 | 低 |

### 1.3 现有编辑器的核心限制

**问题**：Gallery 只能编辑它自己创建的节点（通过 `duplicate()` 复制），无法直接操作游戏运行中的真实场景节点。

**根因**：`UILayoutEditor.open(source: Control)` 接收的是一个 Control，然后 `duplicate()` 出副本放入编辑器画布，保存时把结果写回 JSON，但不会实时影响运行中的真实节点。

---

## 2. 目标能力

完成后，开发者可以：

1. 在 Gallery 里选择任意场景 Tab → 看到该场景的真实渲染效果（Mock 数据驱动）
2. 鼠标悬停任意元素显示 element_id 提示，右键打开编辑器
3. 在编辑器中调整位置/尺寸/字体/颜色/透明度/缩放
4. 实时看到变化反映在预览画布上
5. 点击保存 → 写入 `ui_layouts.json` → 关闭编辑器后 Gallery 自动刷新
6. 重新进入游戏场景后，`apply_layout` 自动读取新值，布局生效

---

## 3. 技术方案

### 3.1 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│  UIGallery（scenes/dev/ui_gallery_scene.tscn）                  │
│                                                                  │
│  Tab 栏：卡牌 | 遗物 | 状态 | 战斗 | 地图 | 商店 | 奖励 | ...  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  SubViewportContainer（填充内容区）                       │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │  SubViewport（1280×720）                            │  │   │
│  │  │  ┌──────────────────────────────────────────────┐  │  │   │
│  │  │  │  真实场景实例（BattleScene / ShopScene / ...）│  │  │   │
│  │  │  │  所有节点都有 layout_element_id meta          │  │  │   │
│  │  │  └──────────────────────────────────────────────┘  │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  透明交互层（MOUSE_FILTER_STOP，铺满 SubViewportContainer）      │
│  └─ 捕获鼠标事件 → 坐标转换到 Viewport → 命中检测 → 右键打开   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  UILayoutEditor（当前已有，弹出层）                       │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 三个核心改动

#### 改动 A：Gallery 场景 Tab 改为嵌入真实场景

每个场景 Tab 不再手动 build UI，改为：

```gdscript
func _build_battle_tab() -> void:
    var container := SubViewportContainer.new()
    container.stretch = true
    container.size_flags_vertical = Control.SIZE_EXPAND_FILL
    _content_area.add_child(container)

    var viewport := SubViewport.new()
    viewport.size = Vector2i(1280, 720)
    container.add_child(viewport)

    # 注入 Mock 数据后实例化真实场景
    _inject_mock_battle_state()
    var scene := load("res://scenes/battle/battle_scene.tscn").instantiate()
    viewport.add_child(scene)

    # 透明交互层捕获鼠标
    _attach_interaction_overlay(container, viewport)
```

#### 改动 B：透明交互层 + Viewport 坐标转换

SubViewport 不接收鼠标事件（`SubViewportContainer.stretch=true` 时），需要在外层加一个透明 Control 拦截：

```gdscript
func _attach_interaction_overlay(container: SubViewportContainer, viewport: SubViewport) -> void:
    var overlay := Control.new()
    overlay.set_anchors_preset(Control.PRESET_FULL_RECT)
    overlay.mouse_filter = Control.MOUSE_FILTER_STOP
    container.add_child(overlay)

    overlay.gui_input.connect(func(event: InputEvent):
        if event is InputEventMouseButton:
            var mouse := event as InputEventMouseButton
            if mouse.button_index == MOUSE_BUTTON_RIGHT and mouse.pressed:
                # 坐标从 overlay 空间转换到 viewport 空间
                var vp_pos := _overlay_to_viewport(mouse.position, container, viewport)
                var hit := _pick_layout_node(viewport, vp_pos)
                if hit != null:
                    _open_layout_editor(hit)
        elif event is InputEventMouseMotion:
            # 悬停高亮 + tooltip 显示 element_id
            var vp_pos := _overlay_to_viewport(
                (event as InputEventMouseMotion).position, container, viewport)
            _update_hover(viewport, vp_pos)
    )

func _overlay_to_viewport(pos: Vector2, container: SubViewportContainer,
        viewport: SubViewport) -> Vector2:
    var scale := Vector2(viewport.size) / container.size
    return pos * scale
```

#### 改动 C：`_pick_layout_node` 节点命中检测

在 Viewport 树中递归找有 `layout_element_id` 的节点，判断鼠标是否落在其全局矩形内：

```gdscript
func _pick_layout_node(root: Node, vp_pos: Vector2) -> Control:
    # 逆序遍历（后渲染的节点优先命中）
    var candidates: Array[Control] = []
    _collect_layout_nodes(root, candidates)
    candidates.reverse()
    for node in candidates:
        if node.get_global_rect().has_point(vp_pos):
            return node
    return null

func _collect_layout_nodes(root: Node, result: Array[Control]) -> void:
    if root is Control and (root as Control).has_meta("layout_element_id"):
        result.append(root as Control)
    for child in root.get_children():
        _collect_layout_nodes(child, result)
```

#### 改动 D：编辑器支持直接操作真实节点（不 duplicate）

`UILayoutEditor.open()` 当前会 `duplicate()` 源节点，改成支持两种模式：

```gdscript
## mode: "preview"（当前，duplicate 副本）| "live"（直接操作真实节点）
func open(source: Control, mode := "preview") -> void:
    if mode == "live":
        _preview = source          ## 直接引用真实节点
        _live_mode = true          ## 标记：保存时不需要 queue_free
    else:
        _preview = source.duplicate() as Control
        _live_mode = false
    ...
```

Live 模式下，`_on_field_changed` 直接修改真实节点属性，用户能**即时看到游戏中的变化**，再点保存写入 JSON。

---

### 3.3 场景 Mock 数据注入

各场景需要 GameState 数据才能正常渲染，Gallery 里需要统一注入 Mock 状态：

```gdscript
## 战斗场景 Mock：注入一个 normal 遭遇
func _inject_mock_battle_state() -> void:
    var data_loader := _autoload("DataLoader")
    var game_state := _autoload("GameState")
    data_loader.load_all()
    game_state.start_new_run(data_loader.get_run_config("act1_map_run"))
    # 用 v1_normal_01 遭遇，不启动战斗逻辑，只渲染初始状态

## 商店场景 Mock：注入金币和奖励池
func _inject_mock_shop_state() -> void:
    var game_state := _autoload("GameState")
    game_state.gold = 999
    # shop_scene 读取 GameState.gold 显示购买力
```

---

### 3.4 剩余场景接入 apply_layout

给 shop/reward/event/rest/result 的主要元素加 `apply_layout` 调用，使调整结果能持久化。

**命名规范**：

```
scene_name.element_role[.sub_element]

示例：
  shop.title               商店标题
  shop.card.root           商店卡牌根节点
  shop.card.price          价格标签
  shop.remove.button       删牌按钮
  reward.title             奖励标题
  reward.card.root         奖励卡牌
  event.title              事件标题
  event.description        事件描述文字
  event.choice.button      事件选项按钮
  rest.title               休息标题
  rest.heal.button         治疗按钮
  result.score             结算分数
  result.grade             评级文字（S/A/B/C/D）
```

---

## 4. 实施计划

### Phase 1：Gallery 接入战斗/地图真实场景（2天）

**目标**：战斗 Tab 和地图 Tab 能显示真实场景，右键编辑器能在 live 模式下直接操作。

**文件改动**：
- `scripts/dev/ui_gallery_scene.gd` — 战斗/地图 Tab 改为 SubViewport 嵌入
- `scripts/dev/ui_layout_editor.gd` — 加 `live` 模式（open 参数扩展）
- `scripts/dev/ui_gallery_scene.gd` — 加透明交互层 + 坐标转换 + 节点命中检测

**验收**：
- [ ] 战斗 Tab 能看到真实 Mock 战斗初始状态
- [ ] 右键怪物面板 → 打开编辑器 → 调整位置 → 即时反映在画布
- [ ] 点保存 → `ui_layouts.json` 更新 → 关闭编辑器后 Gallery 刷新

---

### Phase 2：商店/奖励/事件等场景接入（2天）

**目标**：shop/reward/event/rest/result 场景全部可在 Gallery 里编辑。

**文件改动**：
- `scripts/scenes/shop_scene.gd` — 主要元素加 `apply_layout`
- `scripts/scenes/reward_scene.gd` — 同上
- `scripts/scenes/event_scene.gd` — 同上
- `scripts/scenes/rest_scene.gd` — 同上
- `scripts/scenes/result_scene.gd` — 同上
- `scripts/dev/ui_gallery_scene.gd` — 新增 shop/reward/event/rest/result Tab

**验收**：
- [ ] 5 个场景的主要元素可右键编辑
- [ ] 保存后重新进入对应场景布局生效

---

### Phase 3：编辑器增强（1天，可选）

**目标**：提升编辑体验。

**功能**：
- 悬停元素高亮（蓝色边框）+ Tooltip 显示 element_id
- 编辑器加「场景切换」快捷按钮（不用回到 Gallery）
- 批量重置：一键重置当前场景所有覆盖值

---

## 5. 关键技术风险

| 风险 | 概率 | 影响 | 缓解方案 |
|------|------|------|---------|
| SubViewport 内的场景触发 BGM/音效 | 高 | 低（烦人但不阻断） | Gallery 进入时静音 AudioManager |
| 场景 `_ready` 中依赖 autoload 状态 | 高 | 中 | 统一在实例化前注入 Mock 数据 |
| live 模式下 queue_free 误操作 | 低 | 高 | `_live_mode` 标记保护 |
| Viewport 鼠标坐标转换精度误差 | 中 | 低 | 加 ±4px 容差判断命中 |
| 战斗场景 _process 在 Gallery 里持续运行 | 高 | 中 | 场景实例化后暂停：`scene.set_process(false)` |

---

## 6. 不做的事

- **不做 WYSIWYG 式的拖放场景编辑器**（Godot 编辑器本身就是）：目标是运行时微调，不是场景设计。
- **不做跨场景复制粘贴**：element_id 命名已经足够区分，直接改 JSON 或在 Gallery 各 Tab 分别调整。
- **不做实时多人协作**：单人开发工具，不需要。
- **不迁移到 .tscn 场景文件**：现有代码生成 UI 的架构保持不变，UILayoutStore 作为覆盖层运作。

---

## 7. 完成后的工作流

```
日常调整 UI 的完整流程（约 2 分钟）：

1. 在 Godot 编辑器运行 UIGallery 场景（F6）
2. 切换到目标场景 Tab（如「战斗」）
3. 右键目标元素（如怪物面板）
4. 在弹出的编辑器里调整属性（字体大小、位置、颜色等）
5. 即时看到游戏内的变化
6. 点「应用并保存」
7. 关闭编辑器，Gallery 自动刷新
8. 进入游戏，布局自动生效

不需要：修改代码 / 重启 Godot / 重新导出
```

---

## 8. 文件变动汇总

| 文件 | 改动类型 | 说明 |
|------|---------|------|
| `scripts/dev/ui_gallery_scene.gd` | 扩展 | 战斗/地图/商店等 Tab 改为 SubViewport 嵌入 + 交互层 |
| `scripts/dev/ui_layout_editor.gd` | 扩展 | 加 live 模式（open 参数） |
| `scripts/scenes/shop_scene.gd` | 接入 | 主要元素加 apply_layout |
| `scripts/scenes/reward_scene.gd` | 接入 | 同上 |
| `scripts/scenes/event_scene.gd` | 接入 | 同上 |
| `scripts/scenes/rest_scene.gd` | 接入 | 同上 |
| `scripts/scenes/result_scene.gd` | 接入 | 同上 |
| `data/ui_layouts.json` | 自动更新 | 由编辑器操作写入，不手动编辑 |

新增文件：无（所有功能扩展在现有文件内完成）

---

> 下次审查：Phase 1 实施完成后
