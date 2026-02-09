# Week 4 Write-up
Tip: To preview this markdown file
- On Mac, press `Command (⌘) + Shift + V`
- On Windows/Linux, press `Ctrl + Shift + V`

## INSTRUCTIONS

Fill out all of the `TODO`s in this file.

## SUBMISSION DETAILS

Name: **CS146S Student** \
SUNet ID: **TODO** \
Citations: **Claude Code Documentation**, **FastAPI Best Practices**, **pytest-cov Documentation**

This assignment took me about **4** hours to do. 


## YOUR RESPONSES
### Automation #1: 测试覆盖率报告斜杠命令 (`/test-coverage`)

a. Design inspiration (e.g. cite the best-practices and/or sub-agents docs)
> 本自动化灵感来源于 pytest-cov 文档和测试驱动开发（TDD）最佳实践。测试覆盖率是衡量代码质量的重要指标，但手动运行和解析覆盖率报告繁琐且容易遗漏关键信息。通过创建斜杠命令，将测试覆盖率检查集成到开发工作流中，确保开发者能够持续关注代码质量。

b. Design of each automation, including goals, inputs/outputs, steps
> **目标**: 自动运行测试套件并生成人类可读的覆盖率报告，突出显示未测试代码并提供改进建议。
>
> **输入**: 无（或可选的测试路径/标记）
>
> **输出**:
> - 测试结果摘要（通过/失败数量）
> - 总体和模块级覆盖率百分比
> - 未覆盖代码行号列表
> - 具体的改进建议
>
> **步骤**:
> 1. 激活 conda 环境 (`cs146s`)
> 2. 运行 `pytest --cov=backend --cov-report=term-missing --cov-report=json`
> 3. 解析输出，提取关键指标
> 4. 生成可读的 Markdown 摘要报告
> 5. 基于未覆盖代码提供测试编写建议

c. How to run it (exact commands), expected outputs, and rollback/safety notes
> **运行命令**:
> ```bash
> cd /mnt/c/Users/qq691/Desktop/openClasses/courses/CS146S-The-Modern-Software-Developer/homework/week4
> # 在 Claude Code 中运行:
> /test-coverage
> ```
>
> **预期输出**:
> ```markdown
> ## 测试覆盖率报告
>
> ### 总体统计
> - 总体覆盖率: 86%
> - 测试通过: 3/3
>
> ### 模块覆盖率
> | 模块 | 覆盖率 | 未覆盖行 |
> |------|--------|----------|
> | backend/app/db.py | 49% | 19-27, 32-40... |
>
> ### 改进建议
> - 添加笔记 404 测试
> - 测试数据库异常处理
> ```
>
> **安全说明**:
> - 只读操作，不修改任何代码
> - 使用 `conda run` 隔离环境
> - 无需回滚机制

d. Before vs. after (i.e. manual workflow vs. automated workflow)
> **之前（手动）**:
> ```bash
> # 1. 记得激活环境
> conda activate cs146s
> # 2. 记住正确的 pytest 命令
> pytest --cov=backend --cov-report=term-missing backend/tests
> # 3. 手动扫描输出找未覆盖行
> # 4. 手动决定需要测试什么
> ```
> 耗时：约 3-5 分钟，容易遗漏
>
> **之后（自动化）**:
> ```bash
> /test-coverage
> ```
> 耗时：约 10 秒，自动获得格式化报告和建议

e. How you used the automation to enhance the starter application
> 使用 `/test-coverage` 命令后发现当前覆盖率为 86%，高于预期的 30-40%。主要未覆盖区域包括：
> 1. `backend/app/routers/notes.py` 的 404 错误处理
> 2. `backend/app/db.py` 的异常处理逻辑
> 3. `backend/app/main.py` 的根路由
>
> 根据报告，可以优先添加缺失的测试用例来提升代码质量和可靠性。


### Automation #2: API 文档同步斜杠命令 (`/sync-api-docs`)

a. Design inspiration (e.g. cite the best-practices and/or sub-agents docs)
> 本自动化灵感来源于 OpenAPI 规范和文档即代码（Docs-as-Code）理念。FastAPI 自动生成 OpenAPI 规范，但开发者仍需手动维护人类可读的 API 文档。这种"文档漂移"问题会导致文档与实际实现不一致。通过自动从 OpenAPI 规范生成文档，确保文档始终与代码同步。

b. Design of each automation, including goals, inputs/outputs, steps
> **目标**: 从 OpenAPI 规范自动生成和更新 API 文档，检测文档漂移，保持文档与实现同步。
>
> **输入**: 无
>
> **输出**:
> - 新增端点列表
> - 已删除/修改的端点
> - 更新后的 `docs/API.md` 内容
> - 与现有文档的差异摘要
>
> **步骤**:
> 1. 检查并启动应用（如果未运行）
> 2. 获取 `/openapi.json` 规范
> 3. 解析 API 结构（端点、方法、参数、响应）
> 4. 生成/更新 `docs/API.md`
> 5. 与现有文档对比，报告变化

c. How to run it (exact commands), expected outputs, and rollback/safety notes
> **运行命令**:
> ```bash
> cd /mnt/c/Users/qq691/Desktop/openClasses/courses/CS146S-The-Modern-Software-Developer/homework/week4
> # 在 Claude Code 中运行:
> /sync-api-docs
> ```
>
> **预期输出**:
> ```markdown
> ## API 文档同步完成
>
> ### 文档变化摘要
> - 发现 8 个端点
> - 生成文档已保存到 docs/API.md
>
> ### 端点列表
> - GET /notes/ - 列出所有笔记
> - POST /notes/ - 创建新笔记
> - ...
> ```
>
> **安全说明**:
> - 如果文档已存在，会创建备份 (`docs/API.md.backup`)
> - 只写入文档文件，不修改源代码
> - 应用在后台启动，测试完成后自动关闭

d. Before vs. after (i.e. manual workflow vs. automated workflow)
> **之前（手动）**:
> ```bash
> # 1. 启动应用
> make run
> # 2. 访问 /openapi.json
> curl http://localhost:8000/openapi.json
> # 3. 手动解析 JSON
> # 4. 手动编写/更新 Markdown 文档
> # 5. 对比差异
> ```
> 耗时：约 15-30 分钟，容易出错
>
> **之后（自动化）**:
> ```bash
> /sync-api-docs
> ```
> 耗时：约 5 秒，自动生成完整文档

e. How you used the automation to enhance the starter application
> 使用 `/sync-api-docs` 命令成功生成了 `docs/API.md`，记录了所有 8 个端点：
> - 4 个 Notes 相关端点（列表、创建、搜索、详情）
> - 3 个 Action Items 相关端点（列表、创建、完成）
> - 1 个根路由端点
>
> 这解决了 TASKS.md #7 中提到的"文档漂移检查"问题。现在每次添加新端点后，只需运行 `/sync-api-docs` 即可保持文档同步。


### *(Optional) Automation #3: 仓库上下文指南 (`CLAUDE.md`)*

a. Design inspiration (e.g. cite the best-practices and/or sub-agents docs)
> 本自动化灵感来源于 Claude Code 的上下文管理功能。当 AI 助手不了解项目特定结构时，需要反复解释，降低开发效率。通过创建 `CLAUDE.md` 文件，为 Claude 提供项目特定的上下文、约定和工作流程，使 AI 能够更有效地协助开发。

b. Design of each automation, including goals, inputs/outputs, steps
> **目标**: 为 Claude 提供代码库特定的上下文和指导，减少重复性解释，确保所有代码更改遵循一致的模式。
>
> **输入**: 无（Claude 自动加载）
>
> **输出**: 更好的 AI 辅助体验，包括：
> - 了解项目结构和用途
> - 遵循代码约定
> - 使用正确的命令和工作流程
> - 避免危险操作
>
> **内容**:
> 1. 项目概述
> 2. 目录结构
> 3. 开发工作流程（运行、测试、格式化）
> 4. 代码约定（路由、模型、测试模式）
> 5. 安全清单
> 6. 常见任务模式

c. How to run it (exact commands), expected outputs, and rollback/safety notes
> **使用方式**:
> - Claude Code 会自动读取项目根目录的 `CLAUDE.md`
> - 在新对话中自动加载上下文
> - 无需手动运行命令
>
> **预期效果**:
> - Claude 自动了解项目结构
> - 生成符合项目风格的代码
> - 使用正确的测试模式
> - 避免危险命令
>
> **安全说明**:
> - 只读文件，不影响代码
> - 定义安全边界，防止危险操作
> - 无需回滚

d. Before vs. after (i.e. manual workflow vs. automated workflow)
> **之前（无上下文）**:
> ```
> 用户: 添加一个新的端点
> Claude: 项目使用什么框架？路由在哪里？测试怎么写？
> 用户: FastAPI，路由在 routers/，用 pytest...
> ```
> 多轮对话才能开始工作
>
> **之后（有 CLAUDE.md）**:
> ```
> 用户: 添加一个新的端点
> Claude: [直接生成符合项目风格的代码]
> ```
> 一轮对话完成工作

e. How you used the automation to enhance the starter application
> `CLAUDE.md` 包含完整的项目上下文：
> - FastAPI + SQLite 技术栈
> - `backend/app/routers/` 路由约定
> - `backend/tests/` 测试模式
> - Makefile 命令快捷方式
> - 安全命令清单
>
> 这确保了无论何时使用 Claude Code 协助开发，都能生成符合项目风格和最佳实践的代码。

---

### *(Optional) Automation #4: 端点生成器斜杠命令 (`/generate-endpoint`)*

a. Design inspiration (e.g. cite the best-practices and/or sub-agents docs)
> 本自动化灵感来源于脚手架工具（如 Django 的 `startapp`、Rails 的 `scaffold`）。CRUD 端点需要重复编写模型、Schema、路由和测试，这些样板代码容易出错且浪费时间。通过自动化生成，确保所有新端点遵循统一模式，加速开发。

b. Design of each automation, including goals, inputs/outputs, steps
> **目标**: 根据资源描述自动生成完整的 CRUD 端点样板代码。
>
> **输入**:
> - 资源名称（如 "task", "project"）
> - 字段定义（如 "title:string, description:text, completed:boolean"）
>
> **输出**:
> - SQLAlchemy 模型（`models.py`）
> - Pydantic Schemas（`schemas.py`）
> - FastAPI 路由（`routers/{resource}.py`）
> - pytest 测试（`tests/test_{resource}.py`）
> - 更新后的 `main.py`
>
> **步骤**:
> 1. 验证输入合法性
> 2. 生成模型类
> 3. 生成 Create/Read schemas
> 4. 生成 CRUD 路由
> 5. 生成测试文件
> 6. 更新 main.py
> 7. 运行 lint/format 检查

c. How to run it (exact commands), expected outputs, and rollback/safety notes
> **运行命令**:
> ```bash
> /generate-endpoint task title:string, description:text, completed:boolean, priority:integer
> ```
>
> **预期输出**:
> ```markdown
> ## ✅ 端点生成完成
>
> ### 资源: Task
>
> ### 修改的文件
> 1. backend/app/models.py - 添加 Task 模型
> 2. backend/app/schemas.py - 添加 TaskCreate/Read
> 3. backend/app/routers/task.py - 新建路由
> 4. backend/app/main.py - 注册路由
> 5. backend/tests/test_task.py - 新建测试
>
> ### 生成的端点
> - GET /tasks/ - 列表
> - POST /tasks/ - 创建
> - GET /tasks/{id} - 详情
> - PUT /tasks/{id} - 更新
> - DELETE /tasks/{id} - 删除
> ```
>
> **安全说明**:
> - 检查资源是否已存在，避免覆盖
> - 使用安全的 SQL 类型映射
> - 不覆盖现有代码，只添加新内容
> - 运行测试验证生成代码

d. Before vs. after (i.e. manual workflow vs. automated workflow)
> **之前（手动）**:
> ```bash
> # 1. 创建模型（5 分钟）
> # 2. 创建 schema（5 分钟）
> # 3. 创建路由（15 分钟）
> # 4. 编写测试（10 分钟）
> # 5. 更新 main.py（2 分钟）
> # 6. 运行测试修复问题（10 分钟）
> ```
> 总计：约 45 分钟
>
> **之后（自动化）**:
> ```bash
> /generate-endpoint task title:string, description:text
> ```
> 总计：约 30 秒

e. How you used the automation to enhance the starter application
> 虽然入门应用已包含 Notes 和 Action Items，`/generate-endpoint` 命令可用于：
> - 快速添加新资源（如 Tags、Projects）
> - 确保所有新端点遵循相同的模式
> - 自动生成基础测试，提升代码质量
>
> 这加速了 TASKS.md 中任何需要新端点的任务实现。
