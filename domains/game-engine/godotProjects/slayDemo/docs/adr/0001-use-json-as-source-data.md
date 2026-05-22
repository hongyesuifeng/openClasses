# ADR 0001 - V1 使用 JSON 作为主数据源

> 日期: 2026-05-22  
> 状态: Accepted  
> 影响范围: `client/slay-demo/data/`、`DataLoader`、数据校验、V1 内容生产流程

## 背景

SlayDemo V1 需要在实现前快速定义卡牌、敌人、遭遇、奖励和固定 run 流程。当前项目已有早期技术文档建议使用 Godot Resource 组织数据，但 V1 目标更强调快速批量编辑、清晰 diff、便于 agent 或工具生成，以及在实现前先沉淀数据结构。

用户已确认 V1 范围为垂直切片:

```text
3 场普通战斗 + 奖励 + Boss + 结算
```

同时确认 V1 数据源采用 JSON。

## 决策

V1 使用 JSON 作为主数据源。

首版数据文件建议:

```text
client/slay-demo/data/
├── cards.json
├── enemies.json
├── encounters.json
├── rewards.json
└── run_v1.json
```

Godot 运行时通过 `DataLoader` 加载 JSON、校验字段和引用，再转换为战斗、奖励和流程需要的运行时实例。

## 选择理由

- JSON 更适合早期批量编辑和代码审查。
- 文本 diff 能直接看出配置变化，便于多 agent 协作。
- 可以由脚本、表格工具或 LLM 批量生成。
- 与 Godot 编辑器资源序列化解耦，降低早期结构调整成本。
- 在实现数据校验前，JSON schema 或轻量校验函数都更直接。

## 影响

必须实现:

- `DataLoader` 加载 `data/*.json`。
- 重复 ID 校验。
- 必填字段和枚举字段校验。
- 跨表引用校验。
- 静态数据到运行时实例的转换。
- 调试期明确输出配置错误。

代码层需要避免:

- 直接把 JSON 字典传入 UI 后由 UI 修改。
- 在战斗中修改静态配置缓存。
- 依赖文件名作为数据 ID。

## 暂不采用

### Godot Resource 作为主配置

暂不把 `.tres` / `.res` 作为 V1 主数据源。

原因:

- 前期字段变化频繁，Resource 文件不如 JSON 易读易改。
- 批量生成和审查成本更高。
- 不利于外部工具直接处理。

这不代表永久排除 Godot Resource。后续如果需要编辑器检查、Inspector 体验、类型化资源引用，可以在 V2 或更后阶段从 JSON 导入生成 Resource，或将 Resource 作为运行时缓存格式。

## 后续约束

- 新增 V1 卡牌、敌人、遭遇和奖励时，先改 JSON。
- 如果 JSON 字段发生破坏性变化，必须同步更新 `docs/tech/12-v1-vertical-slice-architecture.md`。
- 如果后续改回 Godot Resource 或引入表格导入链路，必须新增 ADR，不直接改写本 ADR 结论。
