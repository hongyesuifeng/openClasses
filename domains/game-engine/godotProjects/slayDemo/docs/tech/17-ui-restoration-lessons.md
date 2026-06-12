# 17 - UI 还原问题复盘要点记录

> 用途：记录每次 UI 还原问题修复后的可复用教训，防止 UI 生成 Agent 和 Coding Agent 在后续场景里重复踩同一类坑。  
> 维护者：每一位参与 UI 生成、接入、还原、微调的 Agent。  
> 规则：修复 UI 还原问题后，必须追加一条复盘记录；如果教训会改变生成/接入契约，还要同步更新 `12-ui-pipeline-agent-rules.md` 或 `13-ui-agent-specification.md`。

---

## 1. 固定流程

每次修复 UI 还原问题后，按以下顺序收尾：

1. 对比 `target.png` 与 `ui_snapshots/current/<scene>_current.png`，确认问题已收敛。
2. 跑 `tools/ui_lint.gd`，确保相关场景无 ERROR。
3. 在本文档追加一条复盘记录，包含：场景、症状、根因、修复动作、可复用规则、验证结果。
4. 如果根因来自 UI 生成契约不清晰，同步更新 `13-ui-agent-specification.md`。
5. 如果根因来自 Coding Agent 接入规则不清晰，同步更新 `12-ui-pipeline-agent-rules.md`。
6. 最终回复中说明本次沉淀记录已更新到本文档。

---

## 2. 复盘记录模板

```md
### YYYY-MM-DD - <scene/feature> - <short title>

**症状**
- 当前截图与 target 的主要差异。

**根因**
- 资源、spec、visual、运行时动态渲染或工具链中的真正原因。

**修复动作**
- 这次实际改了什么。

**沉淀规则**
- 后续 UI 生成 Agent / Coding Agent 必须遵守的要点。

**验证**
- lint、截图渲染、测试或人工对比结果。
```

---

## 3. 通用要点

- `target.png` 不是气氛参考图，必须能被“干净背景 + 静态 UI 切图 + 动态运行时内容”重组出来。
- 背景图必须是纯场景底图，不应烘焙标题、按钮、节点、路径、货币栏、底部 HUD 等 UI 元素；如果背景里有 UI 残影或模糊节点，应先视为资源问题。
- manifest key 名称不能替代视觉验收。接入前必须打开关键 PNG 看实际内容，避免把带占位符、低清图标或旧风格资源误当成目标资源。
- 删除或新增 `ui_specs` 节点时，必须同步更新 `ui_design_specs/*.visual.json` 的 `expected_node`、bbox、dynamic rules；不能留下已不存在节点。
- 动态容器可以在运行时由 GDScript 填充，但 Gallery / 截图预览也要有合理 mock 或 fallback，否则 current 截图会出现“空画布”，误导后续微调。
- Lint 只能保证结构一致，不能保证“像 target”。修复 UI 还原问题时必须同时查看渲染截图。

---

## 4. 记录

### 2026-06-12 - map - 地图事件 UI 还原不完整

**症状**
- 地图界面背景发糊，并带有旧版节点和 UI 残影。
- 运行时地图节点使用旧资源或占位资源，部分节点内部显示方框，不像 target 中的剑、盾、问号、包、心、Boss 图标。
- 底部出现 target 中不存在的 HP/遗物/查看卡组 HUD，挤占了地图画面。
- `NodeSurface` 在预览状态下可能拿不到 GameState，导致 current 截图只剩空区域或背景残影。

**根因**
- `backgrounds.map_event` 是带 UI 残影的模糊合成图，不是干净地图背景。
- `map_scene.gd` 仍在混用旧 `assets/ui/map/*` 与 `assets/ui/map_event/nodes/*` 资源，且部分 `map_event` 节点 PNG 本身是占位方框。
- `ui_specs/map.ui.json` 保留了 target 不需要的底部状态栏、遗物栏和卡组按钮。
- `ui_design_specs/map.visual.json` 未跟随 spec 删除旧节点，导致 lint 继续寻找不存在的 expected_node。
- 动态地图区域缺少无 GameState 时的预览 fallback。

**修复动作**
- 地图背景改回清晰 `backgrounds.map`，避免使用带残影的合成背景。
- 删除 map spec 中 target 不存在的底部状态/遗物/卡组 UI，只保留进度条。
- 地图节点使用高质量语义节点资源，并对宝箱这类缺少完整节点图的类型叠加真实图标。
- 起点改为头像式视觉节点，并在预览 fallback 中生成样例地图节点和路径。
- 重写 `map.visual.json`，只保留当前 spec 中真实存在的节点。

**沉淀规则**
- 地图、战斗等核心场景的背景资源必须先确认“无 UI 烘焙”；带 UI 残影的合成图不能作为 `backgrounds.*` 接入。
- 节点类 UI 不能只看 manifest key，要打开 PNG 检查语义图标是否真实存在；占位方框必须替换或叠加真实图标。
- target 中没有的 HUD 不要为了“展示状态”保留在 spec 里；静态 UI 必须以 target 为准。
- 动态区域的运行时渲染和预览渲染都要有方案：运行时读 GameState，预览态用 mock/fallback。
- 每次删改 spec 节点后，必须同步 visual，否则 lint 会暴露 expected_node 失配。

**验证**
- `ui_lint.gd`：`map.ui.json` 为 0 错误 / 0 警告。
- `render_ui_preview.gd`：成功重新生成 `ui_snapshots/current/map_current.png`。
- 人工对比：背景清晰度、节点语义、起点节点、底部 HUD 与 target 的主要差异已收敛。
