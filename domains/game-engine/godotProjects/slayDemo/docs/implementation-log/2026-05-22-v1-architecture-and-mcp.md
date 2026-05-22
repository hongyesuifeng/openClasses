# 2026-05-22 - V1 架构与 Godot MCP 执行记录

> 日期: 2026-05-22  
> 范围: SlayDemo V1 垂直切片方案、Godot MCP 连接验证与修复记录  
> 关联文档: `docs/tech/12-v1-vertical-slice-architecture.md`、`docs/adr/0001-use-json-as-source-data.md`

## 1. 今日结论

- V1 范围确认为垂直切片。
- V1 主流程为:

```text
3 场普通战斗 + 每场后的卡牌奖励 + Boss 战 + 结算
```

- V1 数据源确认为 JSON。
- 现有 `docs/tech/11-current-implementation-architecture.md` 保留为完整 MVP 历史基准，不覆盖。
- 新增 `docs/tech/12-v1-vertical-slice-architecture.md` 作为 V1 实施前技术基准。
- 新增 ADR 记录 JSON 数据源决策。

## 2. Godot MCP 状态

Godot MCP 连接验证通过。

已验证能力:

- MCP 可以连接 Godot 工程。
- MCP 可以创建场景和节点。
- 已创建 `scenes/codextest.tscn` 作为 MCP 可操作 Godot 的验证场景。

## 3. 已完成修复

### 3.1 避免 Godot 扫描 `Gopeak-godot-mcp`

问题:

- `Gopeak-godot-mcp` 位于 Godot 工程目录下时会被 Godot 扫描。
- 该目录内脚本可能与工程脚本产生 `class_name` 冲突或导入噪音。

处理:

- 已添加 `.gdignore`，阻止 Godot 将该目录作为项目资源扫描。

影响:

- MCP 工具代码仍可保留在工程目录中。
- Godot 不再把该目录当作游戏资源导入。

### 3.2 修复 MCP 插件断线后不自动重连

问题:

- MCP 插件断线后不会自动恢复连接。
- 这会影响后续 agent 通过 MCP 持续操作 Godot。

处理:

- 已修复 `addons/godot_mcp_editor/mcp_client.gd` 中的重连逻辑。

影响:

- Godot MCP 连接稳定性提高。
- 后续执行 Godot 场景创建、节点调整或验证时，不需要频繁手动重启连接。

### 3.3 MCP 场景创建验证

处理:

- 创建 `scenes/codextest.tscn`。

目的:

- 验证 MCP 能创建场景。
- 验证 MCP 能写入节点结构。
- 为后续通过 MCP 操作 Godot 留下可追溯记录。

## 4. V1 架构沉淀

本次新增主文档:

```text
docs/tech/12-v1-vertical-slice-architecture.md
```

主文档覆盖:

- V1 范围。
- 总体分层架构图。
- 模块关系图。
- 战斗流程图。
- JSON 数据定义方案。
- 核心模块职责。
- UI/场景方案。
- 第一版内容清单。
- 测试计划与验收标准。
- 明确假设和暂缓范围。

## 5. 决策记录

本次新增 ADR:

```text
docs/adr/0001-use-json-as-source-data.md
```

决策:

- V1 使用 JSON 作为主数据源。

背景:

- 前期数据定义需要可批量编辑。
- JSON 易于 diff 和审查。
- JSON 便于 agent、脚本和工具生成。

影响:

- 需要实现 `DataLoader`。
- 需要 JSON 校验。
- 需要从静态 JSON 转换为运行时实例。

暂不采用:

- Godot Resource 作为 V1 主配置。

## 6. 后续执行建议

建议下一步按以下顺序实施:

1. 创建 `client/slay-demo/data/*.json` 的 V1 最小内容。
2. 实现 `DataLoader` 和数据校验入口。
3. 实现 `GameState`、`SceneRouter`、`RunController` 的固定流程。
4. 实现 `BattleController`、`DeckRuntime`、`EffectRunner`、`EnemyAI` 的最小闭环。
5. 创建 `BattleScene`、`RewardScene`、`ResultScene` 的可用 UI。
6. 补数据校验、战斗核心和流程 smoke test。

## 7. 注意事项

- 不要覆盖 `docs/tech/11-current-implementation-architecture.md`。
- 后续关键决策继续写入 `docs/adr/`。
- 后续重要执行过程继续写入 `docs/implementation-log/`。
- Godot/MCP 相关已有改动应在提交前单独复核，确认它们与文档记录一致。
