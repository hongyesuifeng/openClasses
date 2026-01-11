# Week 5 — 使用 Warp 进行代理开发

使用 `week5/` 中的应用作为你的练习场。本周镜像了之前的作业，但强调 Warp 代理开发环境和多代理工作流程。

## 了解 Warp
- Warp 代理开发环境：[warp.dev](https://www.warp.dev/)
- [Warp University](https://www.warp.dev/university?slug=university)


## 探索入门应用
最小的全栈入门应用。
- FastAPI 后端，使用 SQLite (SQLAlchemy)
- 静态前端（无需 Node 工具链）
- 最小测试（pytest）
- Pre-commit（black + ruff）
- 用于练习代理驱动工作流的任务

使用此应用作为你的练习场，来试验你构建的 Warp 自动化。

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

3) 运行应用（从 `week5/` 目录）

```bash
make run
```

4) 打开 `http://localhost:8000` 访问前端，打开 `http://localhost:8000/docs` 访问 API 文档。

5) 玩一下入门应用，感受一下它当前的功能和特性。


### 测试
运行测试（从 `week5/` 目录）
```bash
make test
```

### 格式化/检查
```bash
make format
make lint
```

## 第一部分：构建你的自动化（选择 2 个或更多）
从 `week5/docs/TASKS.md` 中选择任务来实现。你的实现必须以以下两种方式利用 Warp（更多细节如下）：

- A) 使用 Warp Drive 功能 — 例如，保存的提示词、规则或 MCP 服务器。
- (B) 在 Warp 中纳入多代理工作流程。

保持你的更改专注于 `week5/` 内的后端、前端、逻辑或测试。
对于每个选定的任务，记录其难度级别。


### A) Warp Drive 保存的提示词、规则、MCP 服务器（必需：至少一个）
创建一个或多个针对此仓库定制的可共享 Warp Drive 提示词、规则或 MCP 服务器集成。例如：
- 带覆盖率和不稳定测试重新运行的测试运行器
- 文档同步：从 `/openapi.json` 生成/更新 `docs/API.md`，列出路由增量
- 重构工具：重命名模块，更新导入，运行 lint/测试
- 发布助手：升级版本，运行检查，准备变更日志片段
- 集成 Git MCP 服务器，让 Warp 自主与 Git 交互（创建分支、提交、PR 注释等）

>*提示：保持工作流程专注，传递参数，使其幂等，并尽可能优先使用无头/非交互式步骤。*

### B) Warp 中的多代理工作流程（必需：至少一个）
运行一个多代理会话，其中不同 Warp 标签中的独立代理同时处理独立任务。
- 在单独的 Warp 标签中使用并发代理执行 `TASKS.md` 中的多个自包含任务。挑战：你可以同时运行多少个代理？

>*提示：[git worktree](https://git-scm.com/docs/git-worktree) 在这里可能很有帮助，以防止代理相互覆盖。*


## 第二部分：让你的自动化投入工作
现在你已经构建了 2+ 个自动化，让我们使用它们！在 `writeup.md` 的*"你如何使用自动化（它解决了什么痛点或加速了什么）"*部分下，描述你如何利用每个自动化来改进某些工作流程。

## 约束和范围
严格在 `week5/` 中工作（后端、前端、逻辑、测试）。除非自动化明确需要并且你记录了原因，否则避免更改其他周。

## 交付成果
1) 两个或更多 Warp 自动化，可能包括：
   - Warp Drive 工作流程/规则（共享链接和/或导出的定义）和任何辅助脚本
   - 用于协调多个代理的任何补充提示词/剧本

2) 位于 `week5/` 下的 write-up `writeup.md`，包括：
   - 每个自动化的设计，包括目标、输入/输出、步骤
   - 前后对比（即手动工作流程 vs 自动化工作流程）
   - 每个已完成任务使用的自主级别（哪些代码权限、为什么、如何监督）
   - （如适用）多代理注释：角色、协调策略以及并发获胜/风险/失败
   - 你如何使用自动化（它解决了什么痛点或加速了什么）



## 提交说明
1. 确保你已将所有更改推送到远程仓库以供评分。
2. **确保你已将 brentju 和 febielin 都添加为作业仓库的协作者。**
2. 通过 Gradescope 提交。

