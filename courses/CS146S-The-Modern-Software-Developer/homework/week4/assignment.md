# Week 4 — 实际中的自主编码代理

> ***我们建议在开始之前完整阅读本文档。***

本周，你的任务是使用以下 **Claude Code** 功能的任意组合，在此仓库的上下文中构建至少 **2 个自动化**：


- 自定义斜杠命令（提交到 `.claude/commands/*.md`）

- 用于仓库或上下文指导的 `CLAUDE.md` 文件

- Claude 子代理（角色专业化的代理协同工作）

- 集成到 Claude Code 的 MCP 服务器

你的自动化应该有意义地改善开发人员工作流程——例如，通过简化测试、文档、重构或数据相关任务。然后，你将使用创建的自动化来扩展在 `week4/` 中找到的入门应用。


## 了解 Claude Code
要更深入地了解 Claude Code 并探索你的自动化选项，请阅读以下两个资源：

1. **Claude Code 最佳实践：** [anthropic.com/engineering/claude-code-best-practices](https://www.anthropic.com/engineering/claude-code-best-practices)

2. **子代理概述：** [docs.anthropic.com/en/docs/claude-code/sub-agents](https://docs.anthropic.com/en/docs/claude-code/sub-agents)

## 探索入门应用
最小的全栈入门应用，旨在成为**"开发者指挥中心"**。
- FastAPI 后端，使用 SQLite (SQLAlchemy)
- 静态前端（无需 Node 工具链）
- 最小测试（pytest）
- Pre-commit（black + ruff）
- 用于练习代理驱动工作流的任务

使用此应用作为你的练习场，来试验你构建的 Claude 自动化。

### 结构

```
backend/                # FastAPI 应用
frontend/               # 由 FastAPI 提供的静态 UI
data/                   # SQLite 数据库 + 种子
docs/                   # 代理驱动工作流的 TASKS
```

### 快速入门

1) 激活你的 conda 环境。

```bash
conda activate cs146s
```

2) （可选）安装 pre-commit 钩子

```bash
pre-commit install
```

3) 运行应用（从 `week4/` 目录）

```bash
make run
```

4) 打开 `http://localhost:8000` 访问前端，打开 `http://localhost:8000/docs` 访问 API 文档。

5) 玩一下入门应用，感受一下它当前的功能和特性。


### 测试
运行测试（从 `week4/` 目录）
```bash
make test
```

### 格式化/检查
```bash
make format
make lint
```

## 第一部分：构建你的自动化（选择 2 个或更多）
现在你已熟悉入门应用，下一步是构建自动化来增强或扩展它。以下是几种你可以选择的自动化选项。你可以跨类别混合搭配。

在构建自动化时，在 `writeup.md` 文件中记录你的更改。暂时将*"你如何使用自动化来增强入门应用"*部分留空 - 你将在作业的第二部分中返回此部分。

### A) Claude 自定义斜杠命令
斜杠命令是用于重复工作流程的功能，允许你在 `.claude/commands/` 内的 Markdown 文件中创建可重用的工作流程。Claude 通过 `/` 暴露这些命令。


- 示例 1：带覆盖率的测试运行器
  - 名称：`tests.md`
  - 意图：运行 `pytest -q backend/tests --maxfail=1 -x`，如果通过，则运行覆盖率。
  - 输入：可选标记或路径。
  - 输出：总结失败并建议后续步骤。
- 示例 2：文档同步
  - 名称：`docs-sync.md`
  - 意图：读取 `/openapi.json`，更新 `docs/API.md`，并列出路由增量。
  - 输出：类似差异的摘要和 TODO。
- 示例 3：重构工具
  - 名称：`refactor-module.md`
  - 意图：重命名模块（例如，`services/extract.py` → `services/parser.py`），更新导入，运行 lint/测试。
  - 输出：修改文件和验证步骤的清单。

>*提示：保持命令专注，使用 `$ARGUMENTS`，并优先使用幂等步骤。考虑将安全工具列入白名单，并使用无头模式以实现可重复性。*

### B) `CLAUDE.md` 指导文件
`CLAUDE.md` 文件在开始对话时自动读取，允许你提供特定于仓库的指令、上下文或指导，以影响 Claude 的行为。在仓库根目录（以及可选地在 `week4/` 子文件夹中）创建 `CLAUDE.md` 以指导 Claude 的行为。

- 示例 1：代码导航和入口点
  - 包括：如何运行应用、路由器的位置（`backend/app/routers`）、测试的位置、数据库的播种方式。
- 示例 2：样式和安全护栏
  - 包括：工具期望（black/ruff）、可安全运行的命令、要避免的命令，以及 lint/测试关卡。
- 示例 3：工作流程片段
  - 包括："当被要求添加端点时，首先编写失败的测试，然后实现，然后运行 pre-commit。"

> *提示：像提示词一样迭代 `CLAUDE.md`，保持简洁和可操作，并记录你期望 Claude 使用的自定义工具/脚本。*

### C) 子代理（角色专业化）

子代理是配置为处理特定任务的专业 AI 助手，具有自己的系统提示词、工具和上下文。设计两个或多个协作代理，每个负责单个工作流程中的不同步骤。

- 示例 1：TestAgent + CodeAgent
  - 流程：TestAgent 为更改编写/更新测试 → CodeAgent 实现代码以通过测试 → TestAgent 验证。
- 示例 2：DocsAgent + CodeAgent
  - 流程：CodeAgent 添加新的 API 路由 → DocsAgent 更新 `API.md` 和 `TASKS.md` 并检查与 `/openapi.json` 的偏差。
- 示例 3：DBAgent + RefactorAgent
  - 流程：DBAgent 提出架构更改（调整 `data/seed.sql`）→ RefactorAgent 更新模型/模式/路由并修复 lints。

>*提示：使用清单/草稿板，在角色之间重置上下文（`/clear`），并对独立任务并行运行代理。*

## 第二部分：让你的自动化投入工作
现在你已经构建了 2+ 个自动化，让我们使用它们！在 `writeup.md` 的*"你如何使用自动化来增强入门应用"*部分下，描述你如何利用每个自动化来改进或扩展应用的功能。

例如，如果你实现了自定义斜杠命令 `/generate-test-cases`，解释你如何使用它来与入门应用交互和测试。


## 交付成果
1) 两个或更多自动化，可能包括：
   - `.claude/commands/*.md` 中的斜杠命令
   - `CLAUDE.md` 文件
   - 子代理提示词/配置（清晰记录，如有任何文件/脚本）

2) 位于 `week4/` 下的 write-up `writeup.md`，包括：
  - 设计灵感（例如，引用最佳实践和/或子代理文档）
  - 每个自动化的设计，包括目标、输入/输出、步骤
  - 如何运行它（确切命令）、预期输出和回滚/安全说明
  - 前后对比（即手动工作流程 vs 自动化工作流程）
  - 你如何使用自动化来增强入门应用



## 提交说明
1. 确保你已将所有更改推送到远程仓库以供评分。
2. **确保你已将 brentju 和 febielin 都添加为作业仓库的协作者。**
2. 通过 Gradescope 提交。



