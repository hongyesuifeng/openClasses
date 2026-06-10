# 12 - UI 流水线 Agent 执行规则

> 版本：2026-06-10  
> 适用对象：所有参与 UI 还原的 Coding Agent（Claude Code / Codex CLI / Cursor）  
> 前提：已阅读 `docs/tech/10-ui-builder-json-spec.md` 和 `docs/tech/11-ai-multimodal-ui-workflow.md`

---

## 1. 你能改什么

```
✅ res://ui_specs/*.ui.json
✅ res://ui_manifest/manifest.assets.json
✅ res://ui_manifest/manifest.styles.json
✅ res://ui_manifest/manifest.actions.json
✅ res://ui_design_specs/*.visual.json
✅ res://ui_mock_data/*.mock.json
✅ res://ui_components/**/*.gd
✅ res://ui_components/**/*.tscn
✅ res://tools/ui_*.gd
✅ res://scenes/dev/（Gallery 开发工具）
```

---

## 2. 你不能改什么

```
❌ res://scripts/battle/**          战斗逻辑
❌ res://scripts/autoload/**        GameState / DataLoader / SceneRouter / RunController
❌ res://scripts/map/**             地图生成逻辑
❌ res://scripts/data/**            数据定义
❌ res://data/**/*.json             游戏配置数据
❌ res://scenes/**/*.tscn           所有主场景文件
❌ res://scripts/ui/card_view_factory.gd   已有视图工厂（除非专项任务明确要求）
❌ res://scripts/ui/relic_view_factory.gd
❌ res://scripts/ui/status_view_factory.gd
❌ res://addons/ui_builder/*.gd     UIBuilder 框架核心（除非框架升级任务）
```

**违反此规则的改动必须立即回滚。**

---

## 3. 如何读取 visual.json

`ui_design_specs/<scene>.visual.json` 描述了 UI 的视觉规格，你需要从中提取：

```
elements[].expected_node  → ui_specs 里对应的节点 name
elements[].type_hint      → 建议使用的 Godot 节点类型
elements[].bbox           → 目标位置 [x, y, width, height]（1365×768 坐标系）
elements[].anchor_hint    → 建议的 layout.preset
elements[].style_token    → 建议绑定的 style_key
elements[].asset_token    → 建议绑定的 asset_key
elements[].dynamic        → true 时不能硬编码子节点
elements[].bind_hint      → 数据绑定建议
elements[].action_hint    → 按钮 action 建议
elements[].tolerance      → 视觉容差参考（position_px / size_px / color_delta）
elements[].acceptance_weight → 对比权重（越高越重要，越接近 1 越严格）
```

### bbox → layout 的转换规则

```
bbox [x, y, w, h] + anchor_hint
→ layout.preset = anchor_hint
→ layout.size = [w, h]（大多数 preset）
→ layout.margin = [从锚点算的偏移]
```

示例：
```
bbox [1210, 608, 140, 56] + anchor_hint "bottom_right"
→ margin = [0, 0, 1365-1210-140, 768-608-56]
         = [0, 0, 15, 104]
→ 写入：{"preset": "bottom_right", "size": [140, 56], "margin": [0, 0, 15, 104]}
```

---

## 4. 如何合并 manifest patch

当你收到 `manifest.assets.patch.json` 或 `manifest.styles.patch.json` 时：

### assets patch

```json
// patch 文件
{ "ui": { "player_hp_frame": { "path": "...", "nine_patch": [...] } } }

// 合并到 manifest.assets.json：
// 找到对应的 key，直接写入，不覆盖其他 key
```

**规则：**
- 禁止删除现有 key
- 禁止修改现有 key 的值（除非 patch 明确标注 `"override": true`）
- 新增 key 直接插入对应分类

### styles patch

```json
// patch 文件
{ "colors": { "text_neon_pink": "#FF4F8B" }, "styles": { "panel_battle_bottom": {...} } }

// 合并到 manifest.styles.json：
// colors 和 styles 两个区分开合并
```

---

## 5. 如何修改 ui_specs

### 必须遵守的规则

**1. 动态内容禁止硬编码**

凡是数量会随游戏状态变化的区域，`children` 必须为空或只包含 `ComponentRef`：

```json
// ❌ 错误：硬编码 3 张手牌
{ "type": "HBoxContainer", "name": "HandRow",
  "children": [
    {"type": "Button", "name": "Card1", ...},
    {"type": "Button", "name": "Card2", ...}
  ]
}

// ✅ 正确：空容器，由 GDScript 动态填充
{ "type": "HBoxContainer", "name": "HandRow", "layout": {...} }
```

以下容器名**绝对禁止**有硬编码子节点：

| 容器名关键字 | 说明 |
|------------|------|
| `HandRow` | 手牌区 |
| `EnemyRow` | 敌人区 |
| `RelicRow` | 遗物栏 |
| `PotionRow` | 药水栏 |
| `PlayerStatusRow` | 玩家状态栏 |
| `CardList` | 卡牌列表 |
| `ShopItemGrid` | 商店商品 |
| `ChoiceRow` | 选项行（事件/奖励） |
| `DeckRow` | 牌组展示 |

**2. 节点名唯一**

同一个 `*.ui.json` 文件内，所有节点的 `name` 必须唯一（包括嵌套节点）。

**3. 只使用 UIBuilder 白名单类型**

```
Control / Panel / PanelContainer / Label / Button / TextureRect
HBoxContainer / VBoxContainer / ScrollContainer / MarginContainer
CenterContainer / ProgressBar / ComponentRef / ColorRect
```

不允许使用：`Node2D`、`Sprite2D`、`AnimationPlayer`、`AudioStreamPlayer` 等非 Control 节点。

**4. style_key 和 asset_key 必须先注册**

改动前确认 `manifest.styles.json` 和 `manifest.assets.json` 中已有对应 key，否则先在 manifest 中注册。

---

## 6. Token 命名规范

所有 key 统一使用以下格式（小写，点号分隔）：

| 类型 | 格式 | 示例 |
|------|------|------|
| asset | `<category>.<scene>.<role>[.<state>]` | `asset.battle.end_turn_btn.normal` |
| style | `<scene>.<role>[.<variant>]` 或语义名 | `btn_primary` / `progress_hp` |
| action | `<scene>.<verb>` | `battle.on_end_turn` |
| bind | `<scene>.<field>` | `battle.player_hp` |

**style_key 使用语义命名（不绑定具体场景），asset_key 可场景化。**

---

## 7. 每轮改动后必须输出

```
1. 修改文件列表（路径 + 改动类型 new/modified/deleted）
2. 是否触碰禁止区域（是/否）
3. ui_lint.gd 运行结果（通过/失败+错误数）
4. 剩余视觉差异（对比 visual.json 中的 bbox/anchor，哪些还未匹配）
5. 下一步建议（如需继续微调）
```

**示例输出格式：**

```
[改动] ui_specs/battle.ui.json — modified（调整 EndTurnButton layout）
[改动] ui_manifest/manifest.styles.json — modified（新增 panel_battle_bottom）
[安全] 未触碰禁止区域 ✅
[Lint] 10 个文件，0 错误，0 警告 ✅
[差异] EndTurnButton: 位置偏左 8px（当前 x=1202，目标 x=1210）
[建议] 调整 EndTurnButton margin.right 从 13 → 15
```

---

## 8. 如何跑 Lint

```bash
# Windows CMD / WSL
cmd.exe /c "C:\Users\Lenovo\Downloads\Godot_v4.6.2-stable_win64.exe\Godot_v4.6.2-stable_win64_console.exe --headless --path D:\openClass\openClasses\domains\game-engine\godotProjects\slayDemo\client\slay-demo --script res://tools/ui_lint.gd"
```

期望输出：
```
[LINT] ✅ 全部通过 — 10 个文件，0 错误，0 警告
```

**有 ERROR 时禁止提交代码。**

---

## 9. 失败时如何处理

| 情况 | 处理方式 |
|------|---------|
| Lint 报 style_key 不存在 | 先在 manifest.styles.json 注册，再提交 spec |
| Lint 报动态容器有硬编码子节点 | 删除硬编码子节点，改为空容器 |
| Lint 报节点名重复 | 重命名使其唯一 |
| 不小心改了禁止文件 | 立即 `git restore <file>` 恢复 |
| UI 预览和 target 差异大 | 优先改 layout.margin / layout.size，不要改节点层级 |
| 颜色/透明度不对 | 改 manifest.styles.json 对应 key，不要在 spec 里写颜色值 |

---

## 10. 参考文档

| 文档 | 内容 |
|------|------|
| `docs/tech/10-ui-builder-json-spec.md` | UIBuilder 完整技术规格 |
| `docs/tech/11-ai-multimodal-ui-workflow.md` | UI 视觉还原流水线设计 |
| `ui_manifest/manifest.actions.json` | 所有合法 action 声明 |
| `ui_design_specs/<scene>.visual.json` | 场景视觉规格（bbox/tolerance） |
| `ui_mock_data/<scene>.mock.json` | 场景 mock 数据（多状态） |
| `tools/README.md` | 工具使用说明 |
