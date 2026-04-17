# Agent 架构与 MCP 协议完全指南

## 📚 目录

1.  [Agent 架构概述](#1-agent-架构概述)
2.  [Agent 核心组件](#2-agent-核心组件)
3.  [Agent 架构模式](#3-agent-架构模式)
4.  [MCP 协议深度解析](#4-mcp-协议深度解析)
5.  [MCP Server 实战](#5-mcp-server-实战)
6.  [Coding Agent 最佳实践](#6-coding-agent-最佳实践)
7.  [测试与部署](#7-测试与部署)
8.  [安全与性能优化](#8-安全与性能优化)
9.  [实战案例深度解析](#9-实战案例深度解析)
10. [核心思想总结](#10-核心思想总结)
11. [参考资料](#11-参考资料)

---

## 1. Agent 架构概述

### 核心要点

-   **定义**: Agent 是一个能够自主感知环境、做出决策并执行行动的智能体。
-   **价值**: 将 LLM 从被动对话者转变为主动执行者，实现复杂的自动化任务。
-   **核心特征**: 自主性、交互性、目标导向。
-   **发展**: 从简单的对话系统演进到能够规划、执行、反思的智能体。

### 1.1 什么是 Agent？

简单说，Agent 是一个能够**自主**完成任务的 AI 系统。它不仅能理解你的需求，还能主动规划执行步骤、调用工具、并根据结果调整策略。

**公式**: `智能 Agent = LLM + 工具调用 + 规划能力 + 反思机制`

### 1.2 Agent vs 传统对话系统

| 维度 | 对话系统 | Agent |
| :--- | :--- | :--- |
| **交互模式** | 单轮/多轮对话 | 持续交互和行动 |
| **能力范围** | 仅生成文本 | 调用工具、执行代码 |
| **决策方式** | 被动响应 | 主动规划和决策 |
| **上下文** | 对话历史 | 环境、状态、记忆 |
| **输出** | 文本回复 | 行动 + 反思 + 结果 |
| **自主性** | 需要人工引导 | 可自主完成任务 |

### 1.3 Agent 的三大核心特征

#### 1. 自主性（Autonomy）
- 不需要人类持续干预
- 能够自主做出决策
- 主动执行行动

#### 2. 交互性（Interactivity）
- 与环境持续交互
- 根据反馈调整策略
- 多轮对话和行动

#### 3. 目标导向（Goal-Oriented）
- 有明确的目标
- 规划达成目标的路径
- 执行具体行动

### 1.4 为什么需要 Agent？

因为传统 LLM 对话系统有以下局限：

| 局限 | 说明 | Agent 的解决方案 |
| :--- | :--- | :--- |
| **无法行动** | 只能生成文本，不能执行操作 | 工具调用（Tool Calling） |
| **无规划能力** | 一次性回答，缺乏系统思考 | 任务分解和规划模块 |
| **无反馈机制** | 不知道结果是否正确 | 反思和验证机制 |
| **上下文受限** | 只能看到对话历史 | 感知整个代码库和环境 |

---

## 2. Agent 核心组件

### 核心要点

-   **Perception（感知）**: 理解用户需求、代码库状态、环境信息
-   **Planning（规划）**: 分解复杂任务、制定执行步骤
-   **Action（行动）**: 调用工具、执行代码、生成代码
-   **Reflection（反思）**: 检查结果、验证正确性、调整策略

### 2.1 组件 1: Perception（感知）

**作用**: 理解当前状态和环境信息

#### 感知的内容

**1. 用户需求**
```python
user_request = {
    "task": "修复登录 bug",
    "description": "用户无法登录，返回 500 错误",
    "context": {
        "file": "auth.py",
        "error": "TypeError",
        "logs": "..."
    }
}
```

**2. 代码库状态**
```python
codebase_state = {
    "files": ["auth.py", "models.py", "views.py"],
    "structure": "MVC pattern",
    "dependencies": ["Flask", "SQLAlchemy"],
    "test_coverage": "65%"
}
```

**3. 环境信息**
```python
environment = {
    "os": "Linux",
    "python_version": "3.12",
    "git_branch": "main",
    "recent_commits": [...]
}
```

**4. 执行结果**
```python
execution_result = {
    "action": "run_tests",
    "status": "failed",
    "output": "AssertionError: test_login_failed",
    "error": "Expected 200, got 500"
}
```

#### 感知工具

**文件系统感知**
```python
class FilePerception:
    def read_file(self, path: str) -> str:
        """读取文件内容"""
        pass

    def list_directory(self, path: str) -> list:
        """列出目录结构"""
        pass

    def search_code(self, pattern: str) -> list:
        """搜索代码模式"""
        pass
```

### 2.2 组件 2: Planning（规划）

**作用**: 分解任务、制定执行步骤

#### 规划层次

**1. 高层规划（策略层）**
```python
high_level_plan = """
目标：修复用户登录 bug

阶段 1：诊断
- 分析错误日志
- 定位问题代码
- 确定根本原因

阶段 2：修复
- 设计修复方案
- 实施代码修改
- 本地测试验证

阶段 3：验证
- 运行完整测试套件
- 检查回归问题
- 生成修复报告
"""
```

**2. 中层规划（战术层）**
```python
tactical_plan = {
    "step_1": {
        "action": "read_file",
        "target": "auth.py",
        "purpose": "查看登录逻辑"
    },
    "step_2": {
        "action": "analyze_logs",
        "target": "error.log",
        "purpose": "分析错误堆栈"
    },
    "step_3": {
        "action": "search_code",
        "pattern": "session['user_id']",
        "purpose": "查找相关代码"
    }
}
```

**3. 低层规划（执行层）**
```python
execution_plan = """
具体操作：
1. 读取 auth.py 的 45-60 行
2. 检查 session 初始化
3. 修改：添加 None 检查
4. 运行: python -m pytest tests/test_auth.py
5. 检查输出
"""
```

### 2.3 组件 3: Action（行动）

**作用**: 执行具体操作，调用工具

#### 工具定义

```python
tools = [
    {
        "name": "read_file",
        "description": "读取文件内容",
        "parameters": {
            "type": "object",
            "properties": {
                "path": {
                    "type": "string",
                    "description": "文件路径"
                },
                "start_line": {
                    "type": "integer",
                    "description": "起始行（可选）"
                },
                "end_line": {
                    "type": "integer",
                    "description": "结束行（可选）"
                }
            },
            "required": ["path"]
        }
    },
    {
        "name": "write_file",
        "description": "写入文件",
        "parameters": {
            "type": "object",
            "properties": {
                "path": {"type": "string"},
                "content": {"type": "string"},
                "create_dirs": {"type": "boolean"}
            },
            "required": ["path", "content"]
        }
    },
    {
        "name": "run_command",
        "description": "执行 shell 命令",
        "parameters": {
            "type": "object",
            "properties": {
                "command": {"type": "string"},
                "timeout": {"type": "integer"}
            },
            "required": ["command"]
        }
    }
]
```

#### 工作流程

```
1. LLM 分析用户请求
2. 决定需要调用哪些工具
3. 生成工具调用参数
4. 执行工具调用
5. 将结果返回给 LLM
6. LLM 基于结果继续处理
```

#### 与传统 API 调用的区别

| 特性 | 传统 API 调用 | Agent 工具调用 |
| :--- | :--- | :--- |
| **调用逻辑** | 开发者预设 | LLM 自主决定 |
| **调用时机** | 固定流程 | 根据上下文动态决定 |
| **参数选择** | 代码中定义 | LLM 生成 |
| **结果处理** | 预定义逻辑 | LLM 解析并继续 |

### 2.4 组件 4: Reflection（反思）

**作用**: 检查结果、验证正确性、调整策略

#### 反思层次

**1. 结果验证**
```python
def verify_result(action, result):
    """验证执行结果是否符合预期"""

    # 检查执行是否成功
    if result["status"] == "error":
        return {
            "valid": False,
            "issue": "执行失败",
            "suggestion": "检查参数和前置条件"
        }

    # 检查输出是否合理
    if not result["output"]:
        return {
            "valid": False,
            "issue": "无输出",
            "suggestion": "检查命令是否正确"
        }

    return {"valid": True}
```

**2. 策略调整**
```python
def reflect_and_adjust(context):
    """反思并调整策略"""

    # 分析历史行动
    actions = context["history"]

    # 检测循环
    if has_loop(actions):
        return {
            "adjustment": "change_approach",
            "reason": "当前策略陷入循环"
        }

    # 检测失败模式
    if repeated_failure(actions, same_error="file_not_found"):
        return {
            "adjustment": "try_alternative_path",
            "reason": "文件路径可能不正确"
        }

    return {"adjustment": "continue"}
```

**3. 自我纠错**
```python
def self_correct(context):
    """自我纠错机制"""

    # 重新审视目标
    goal = context["request"]["goal"]

    # 评估当前状态
    current_state = assess_current_state(context)

    # 识别差距
    gaps = identify_gaps(goal, current_state)

    # 调整计划
    new_plan = adjust_plan(context["plan"], gaps)

    return new_plan
```

---

## 3. Agent 架构模式

### 核心要点

-   **ReAct**: 交替进行推理和行动
-   **Plan-and-Execute**: 先规划，再执行
-   **Multi-Agent**: 多个 Agent 协作完成任务

### 3.1 ReAct 模式（Reasoning + Acting）

**核心思想**: 交替进行推理和行动

#### 工作流程

```
┌─────────────────────────────────────┐
│         User Request                │
└────────────────┬────────────────────┘
                 ▼
┌─────────────────────────────────────┐
│      Thought → Action → Loop        │
│      ↓        ↓        ↑            │
│   ┌──────┐ ┌──────┐ ┌──────┐       │
│   │Think │ │ Act  │ │ Obs  │       │
│   └──────┘ └──────┘ └──────┘       │
└─────────────────────────────────────┘
```

#### 实现

```python
def react_agent(query: str, max_steps: int = 10):
    context = {"query": query, "history": []}

    for step in range(max_steps):
        # 1. 推理
        thought = llm.generate(
            prompt=f"""
            当前状态: {context}
            你应该：
            1. 分析当前情况
            2. 决定下一步行动
            3. 说明理由
            """
        )

        # 2. 行动
        action = parse_action(thought)
        result = execute_action(action)

        # 3. 观察
        observation = {
            "action": action,
            "result": result
        }
        context["history"].append(observation)

        # 4. 检查是否完成
        if is_complete(observation):
            return final_answer(context)

    return "未能完成，达到最大步数"
```

#### 示例执行

```
User: "修复 auth.py 中的登录 bug"

Thought 1: 我需要先查看错误信息
Action 1: read_file("error.log")
Observation 1: "TypeError: 'NoneType' object is not subscriptable at auth.py:50"

Thought 2: 错误在 auth.py 第 50 行，我需要查看那行代码
Action 2: read_file("auth.py", lines=[45, 55])
Observation 2: "user_id = session['user']['id']"

Thought 3: 问题可能是 session['user'] 为 None，我需要添加 None 检查
Action 3: write_file("auth.py", ...)
Observation 3: 文件已更新

Thought 4: 需要测试修复是否有效
Action 4: run_tests("test_auth.py")
Observation 4: 所有测试通过

Thought 5: 任务完成
Action 5: return("Bug 已修复")
```

#### 优势与劣势

| 优势 | 劣势 |
| :--- | :--- |
| ✅ 思考清晰，可解释性强 | ❌ 可能陷入推理循环 |
| ✅ 易于调试 | ❌ 需要多轮 LLM 调用，成本较高 |
| ✅ 适合复杂任务 | ❌ 执行时间较长 |

### 3.2 Plan-and-Execute 模式

**核心思想**: 先规划，再执行

#### 工作流程

```
┌─────────────────────────────────────┐
│         User Request                │
└────────────────┬────────────────────┘
                 ▼
┌─────────────────────────────────────┐
│      Planning Phase                 │
│  - 分解任务                          │
│  - 制定步骤                          │
│  - 确定依赖                          │
└────────────────┬────────────────────┘
                 ▼
┌─────────────────────────────────────┐
│      Execution Phase                │
│  - 执行步骤 1                       │
│  - 执行步骤 2                       │
│  - ...                              │
│  - 执行步骤 N                       │
└─────────────────────────────────────┘
```

#### 实现

```python
def plan_execute_agent(task: str):
    # Phase 1: 规划
    plan = llm.generate(
        prompt=f"""
        任务: {task}

        请制定详细的执行计划：
        1. 分解为子任务
        2. 确定执行顺序
        3. 标注依赖关系

        输出格式：
        - Step 1: [步骤描述]
          - 依赖: None
          - 工具: [工具名]
          - 参数: [参数]
        ...
        """,
        response_format="json"
    )

    # Phase 2: 执行
    results = []
    for step in plan["steps"]:
        # 检查依赖
        if dependencies_met(step, results):
            result = execute_step(step)
            results.append(result)

    # Phase 3: 整合
    return consolidate_results(results)
```

#### 示例

```python
# 任务: "添加用户认证功能"

# 规划阶段
plan = {
    "steps": [
        {
            "id": 1,
            "description": "创建 User 模型",
            "dependencies": [],
            "tool": "write_file",
            "file": "models/user.py"
        },
        {
            "id": 2,
            "description": "创建认证表单",
            "dependencies": [],
            "tool": "write_file",
            "file": "forms/auth.py"
        },
        {
            "id": 3,
            "description": "创建登录视图",
            "dependencies": [1, 2],
            "tool": "write_file",
            "file": "views/auth.py"
        },
        {
            "id": 4,
            "description": "编写测试",
            "dependencies": [1, 2, 3],
            "tool": "write_file",
            "file": "tests/test_auth.py"
        }
    ]
}

# 执行阶段（按依赖顺序）
# Step 1: 创建 User 模型 ✓
# Step 2: 创建认证表单 ✓
# Step 3: 创建登录视图 ✓（依赖 1, 2）
# Step 4: 编写测试 ✓（依赖 1,2,3）
```

#### 优势与劣势

| 优势 | 劣势 |
| :--- | :--- |
| ✅ 系统性强，不会遗漏步骤 | ❌ 规划可能不完美 |
| ✅ 易于并行化（独立步骤） | ❌ 难以应对突发情况 |
| ✅ 可追溯 | ❌ 前期规划成本高 |

### 3.3 Multi-Agent Collaboration 模式

**核心思想**: 多个 Agent 协作完成任务

#### 工作流程

```
┌──────────────┐
│   Orchestrator│  ← 协调者
└──────┬───────┘
       │
       ├──→ ┌─────────────┐
       │    │ Coder Agent │  ← 编码专家
       │    └─────────────┘
       │
       ├──→ ┌──────────────┐
       │    │ Tester Agent │  ← 测试专家
       │    └──────────────┘
       │
       ├──→ ┌─────────────────┐
       │    │ Debugger Agent  │  ← 调试专家
       │    └─────────────────┘
       │
       └──→ ┌──────────────────┐
            │ Reviewer Agent   │  ← 审查专家
            └──────────────────┘
```

#### 实现

```python
class Orchestrator:
    def __init__(self):
        self.agents = {
            "coder": CoderAgent(),
            "tester": TesterAgent(),
            "debugger": DebuggerAgent(),
            "reviewer": ReviewerAgent()
        }

    def process_task(self, task: str):
        # 1. 分析任务
        subtasks = self.decompose(task)

        # 2. 分配给专业 Agent
        results = {}
        for subtask in subtasks:
            agent_type = self.select_agent(subtask)
            agent = self.agents[agent_type]
            results[subtask["id"]] = agent.execute(subtask)

        # 3. 整合结果
        return self.consolidate(results)


class CoderAgent:
    def execute(self, task):
        # 编码逻辑
        code = self.write_code(task)
        return {"code": code}


class TesterAgent:
    def execute(self, task):
        # 测试逻辑
        tests = self.generate_tests(task)
        results = self.run_tests(tests)
        return {"tests": tests, "results": results}
```

#### 模式对比

| 模式 | 优势 | 劣势 | 适用场景 |
| :--- | :--- | :--- | :--- |
| **ReAct** | 思考清晰、可解释 | 成本高、可能循环 | 复杂推理任务 |
| **Plan-Execute** | 系统性强、可追溯 | 规划不完美 | 结构化任务 |
| **Multi-Agent** | 专业分工、可并行 | 协调复杂 | 大型项目 |

---

## 4. MCP 协议深度解析

### 核心要点

-   **MCP (Model Context Protocol)**: 连接 LLM 与外部数据源的标准化协议
-   **三大核心能力**: Resources（资源访问）、Tools（工具调用）、Prompts（提示模板）
-   **架构**: LLM ↔ MCP Client ↔ MCP Server ↔ 数据源

### 4.1 什么是 MCP？

**MCP (Model Context Protocol)** 是 Anthropic 提出的开放标准协议，用于连接 AI Assistant 与外部数据源和工具。

#### 核心问题

```
┌─────────────┐
│     LLM     │
│             │
│ "被限制在"  │
│  对话窗口中 │
└─────────────┘
     ↑
     │ 无法访问
     │
     ├─→ 文件系统
     ├─→ 数据库
     ├─→ API 服务
     ├─→ 内部文档
     └─→ Git 历史
```

#### MCP 的解决方案

```
┌─────────────┐
│     LLM     │
└──────┬──────┘
       │ MCP Protocol
       ▼
┌─────────────┐
│  MCP Client │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────┐
│         MCP Server          │
│  ┌────────┐  ┌────────┐    │
│  │ Files  │  │  DB    │    │
│  ├────────┤  ├────────┤    │
│  │  API   │  │  Git   │    │
│  └────────┘  └────────┘    │
└─────────────────────────────┘
```

### 4.2 MCP 三大核心能力

#### 1. Resources（资源访问）

**定义**: 提供对数据源的**只读**访问

**特点**：
- 类似于文件系统
- 支持读取操作
- 可以列表、搜索、获取

**示例**：
```python
# MCP Server 定义的资源
resources = {
    "file:///home/user/project/README.md": {
        "uri": "file:///home/user/project/README.md",
        "name": "Project README",
        "description": "项目说明文档",
        "mimeType": "text/markdown"
    },
    "db://users/123": {
        "uri": "db://users/123",
        "name": "User 123",
        "description": "用户 123 的信息",
        "mimeType": "application/json"
    }
}
```

#### 2. Tools（工具调用）

**定义**: 提供可执行的函数或操作

**特点**：
- 可以修改数据
- 执行复杂操作
- 有输入输出

**示例**：
```python
# MCP Server 定义的工具
tools = {
    "read_file": {
        "name": "read_file",
        "description": "读取文件内容",
        "inputSchema": {
            "type": "object",
            "properties": {
                "path": {
                    "type": "string",
                    "description": "文件路径"
                }
            },
            "required": ["path"]
        }
    },
    "write_file": {
        "name": "write_file",
        "description": "写入文件",
        "inputSchema": {
            "type": "object",
            "properties": {
                "path": {"type": "string"},
                "content": {"type": "string"}
            },
            "required": ["path", "content"]
        }
    }
}
```

#### 3. Prompts（提示模板）

**定义**: 预定义的提示词模板

**用途**：
- 标准化常见任务
- 提供最佳实践
- 简化操作

**示例**：
```python
# MCP Server 定义的提示模板
prompts = {
    "review_code": {
        "name": "review_code",
        "description": "代码审查提示模板",
        "arguments": [
            {
                "name": "file_path",
                "description": "要审查的文件路径",
                "required": True
            },
            {
                "name": "focus_areas",
                "description": "审查重点（安全、性能、可读性）",
                "required": False
            }
        ]
    }
}
```

### 4.3 MCP 三大能力对比

| 能力 | 类型 | 用途 | 示例 |
| :--- | :--- | :--- | :--- |
| **Resources** | 只读 | 访问数据源 | 读取文件、查询数据库 |
| **Tools** | 可执行 | 执行操作 | 写入文件、运行命令 |
| **Prompts** | 模板 | 标准化提示 | 代码审查、错误解释 |

### 4.4 MCP 协议架构

#### 通信模式

**传输层**: MCP 可以运行在多种传输协议上：
- **stdio**: 标准输入输出（最简单）
- **SSE**: Server-Sent Events（Web 应用）
- **WebSocket**: 双向实时通信

**消息格式**: JSON-RPC 2.0

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": {}
}
```

#### 生命周期

```
1. 初始化 (Initialize)
   ↓
2. Server 描述能力 (ServerCapabilities)
   ↓
3. Client 请求 (Request)
   ↓
4. Server 响应 (Response)
   ↓
5. 持续交互 (Ongoing)
   ↓
6. 关闭 (Shutdown)
```

### 4.5 MCP 的优势

| 优势 | 说明 |
| :--- | :--- |
| **标准化** | 统一的接口规范，易于集成 |
| **可组合** | 多个 MCP Server 可以组合使用 |
| **安全性** | 细粒度的权限控制 |
| **扩展性** | 易于添加新的数据源 |

---

## 5. MCP Server 实战

### 核心要点

-   **项目结构**: 清晰的模块化组织
-   **基础实现**: Resources、Tools、Prompts 的完整实现
-   **实战案例**: 日志分析、Git 历史 MCP Server

### 5.1 项目结构

```
my-mcp-server/
├── server.py              # MCP Server 主文件
├── resources.py           # Resources 实现
├── tools.py              # Tools 实现
├── prompts.py            # Prompts 实现
├── config.json           # 配置文件
└── requirements.txt      # 依赖
```

### 5.2 基础实现步骤

#### 步骤 1: 安装依赖

```bash
pip install mcp
```

#### 步骤 2: 创建 Server

```python
# server.py
from mcp.server import Server
from mcp.types import Tool, Resource

# 创建 Server 实例
server = Server("my-custom-server")

@server.list_resources()
async def list_resources() -> list[Resource]:
    """列出所有可用资源"""
    return [
        Resource(
            uri="file:///config/app.json",
            name="Application Config",
            description="应用配置文件",
            mimeType="application/json"
        ),
        Resource(
            uri="file:///logs/app.log",
            name="Application Logs",
            description="应用日志文件",
            mimeType="text/plain"
        )
    ]

@server.read_resource()
async def read_resource(uri: str) -> str:
    """读取资源内容"""
    if uri == "file:///config/app.json":
        with open("config/app.json", "r") as f:
            return f.read()
    elif uri == "file:///logs/app.log":
        with open("logs/app.log", "r") as f:
            return f.read()
    else:
        raise ValueError(f"Unknown resource: {uri}")
```

#### 步骤 3: 添加 Tools

```python
# tools.py
import os
import subprocess
from typing import Any

@server.list_tools()
async def list_tools() -> list[Tool]:
    """列出所有可用工具"""
    return [
        Tool(
            name="read_file",
            description="读取文件内容",
            inputSchema={
                "type": "object",
                "properties": {
                    "path": {
                        "type": "string",
                        "description": "文件路径"
                    }
                },
                "required": ["path"]
            }
        ),
        Tool(
            name="write_file",
            description="写入文件",
            inputSchema={
                "type": "object",
                "properties": {
                    "path": {"type": "string"},
                    "content": {"type": "string"}
                },
                "required": ["path", "content"]
            }
        )
    ]

@server.call_tool()
async def call_tool(name: str, arguments: Any) -> str:
    """调用工具"""
    if name == "read_file":
        return read_file(arguments["path"])
    elif name == "write_file":
        return write_file(arguments["path"], arguments["content"])
    else:
        raise ValueError(f"Unknown tool: {name}")


def read_file(path: str) -> str:
    """读取文件"""
    try:
        with open(path, 'r') as f:
            return f.read()
    except FileNotFoundError:
        return f"Error: File not found: {path}"
    except Exception as e:
        return f"Error: {str(e)}"


def write_file(path: str, content: str) -> str:
    """写入文件"""
    try:
        # 确保目录存在
        os.makedirs(os.path.dirname(path), exist_ok=True)

        with open(path, 'w') as f:
            f.write(content)

        return f"Successfully wrote to {path}"
    except Exception as e:
        return f"Error: {str(e)}"
```

#### 步骤 4: 主程序

```python
# main.py
import asyncio
from server import server

async def main():
    """启动 MCP Server"""
    from mcp.server.stdio import stdio_server

    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            server.create_initialization_options()
        )

if __name__ == "__main__":
    asyncio.run(main())
```

### 5.3 实战案例 1: 日志分析 MCP Server

**功能**: 读取日志、分析错误、过滤日志、生成报告

```python
# log_analyzer_server.py
from mcp.server import Server
from mcp.types import Tool, Resource
import re
from datetime import datetime
from collections import Counter
import json

server = Server("log-analyzer")

# Resources
@server.list_resources()
async def list_logs() -> list[Resource]:
    """列出可用的日志文件"""
    logs_dir = "logs"
    log_files = []

    for filename in os.listdir(logs_dir):
        if filename.endswith(".log"):
            log_files.append(Resource(
                uri=f"log:///{filename}",
                name=filename,
                description=f"日志文件: {filename}",
                mimeType="text/plain"
            ))

    return log_files

@server.read_resource()
async def read_log(uri: str) -> str:
    """读取日志内容"""
    filename = uri.replace("log:///", "")
    path = os.path.join("logs", filename)

    with open(path, 'r') as f:
        return f.read()

# Tools
@server.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(
            name="analyze_errors",
            description="分析日志中的错误",
            inputSchema={
                "type": "object",
                "properties": {
                    "log_file": {"type": "string"},
                    "level": {
                        "type": "string",
                        "enum": ["ERROR", "WARNING", "CRITICAL"]
                    }
                },
                "required": ["log_file"]
            }
        ),
        Tool(
            name="generate_report",
            description="生成日志分析报告",
            inputSchema={
                "type": "object",
                "properties": {
                    "log_file": {"type": "string"}
                },
                "required": ["log_file"]
            }
        )
    ]

@server.call_tool()
async def call_tool(name: str, arguments: dict) -> str:
    if name == "analyze_errors":
        return analyze_errors(arguments["log_file"], arguments.get("level"))
    elif name == "generate_report":
        return generate_report(arguments["log_file"])
    else:
        raise ValueError(f"Unknown tool: {name}")


def analyze_errors(log_file: str, level: str = "ERROR") -> str:
    """分析错误日志"""
    path = os.path.join("logs", log_file)

    errors = []
    error_pattern = re.compile(rf"\[({level})\]")

    with open(path, 'r') as f:
        for line in f:
            if error_pattern.search(line):
                errors.append(line.strip())

    # 统计错误类型
    error_types = Counter()
    for error in errors:
        if "TypeError" in error:
            error_types["TypeError"] += 1
        elif "ValueError" in error:
            error_types["ValueError"] += 1
        elif "ConnectionError" in error:
            error_types["ConnectionError"] += 1

    result = {
        "total_errors": len(errors),
        "error_types": dict(error_types),
        "sample_errors": errors[:10]
    }

    return json.dumps(result, indent=2)


def generate_report(log_file: str) -> str:
    """生成日志分析报告"""
    path = os.path.join("logs", log_file)

    # 统计各种信息
    total_lines = 0
    levels = Counter()

    level_pattern = re.compile(r"\[(ERROR|WARNING|INFO|DEBUG|CRITICAL)\]")

    with open(path, 'r') as f:
        for line in f:
            total_lines += 1

            # 统计日志级别
            level_match = level_pattern.search(line)
            if level_match:
                levels[level_match.group(1)] += 1

    report = f"""
# 日志分析报告

文件: {log_file}
生成时间: {datetime.now().isoformat()}

## 概览
- 总行数: {total_lines}

## 日志级别分布
{json.dumps(dict(levels), indent=2)}

## 建议
"""
    if levels["ERROR"] > 100:
        report += "- ⚠️ 错误数量过多，建议优先处理\n"

    if levels["WARNING"] > 500:
        report += "- ⚠️ 警告数量较多，建议检查\n"

    return report
```

### 5.4 实战案例 2: Git 历史 MCP Server

**功能**: 获取提交历史、搜索提交信息、查看文件变更

```python
# git_history_server.py
from mcp.server import Server
from mcp.types import Tool
import subprocess
import json

server = Server("git-history")

@server.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(
            name="get_commits",
            description="获取 Git 提交历史",
            inputSchema={
                "type": "object",
                "properties": {
                    "limit": {
                        "type": "integer",
                        "description": "返回数量限制",
                        "default": 10
                    },
                    "branch": {
                        "type": "string",
                        "description": "分支名",
                        "default": "main"
                    }
                }
            }
        ),
        Tool(
            name="search_commits",
            description="搜索提交信息",
            inputSchema={
                "type": "object",
                "properties": {
                    "keyword": {
                        "type": "string",
                        "description": "搜索关键词"
                    }
                },
                "required": ["keyword"]
            }
        )
    ]

@server.call_tool()
async def call_tool(name: str, arguments: dict) -> str:
    if name == "get_commits":
        return get_commits(arguments.get("limit", 10), arguments.get("branch", "main"))
    elif name == "search_commits":
        return search_commits(arguments["keyword"])
    else:
        raise ValueError(f"Unknown tool: {name}")


def get_commits(limit: int = 10, branch: str = "main") -> str:
    """获取提交历史"""
    try:
        result = subprocess.run(
            ["git", "log", "-n", str(limit), branch, "--pretty=format:%H|%an|%ae|%ad|%s"],
            capture_output=True,
            text=True,
            cwd="."
        )

        if result.returncode != 0:
            return f"Error: {result.stderr}"

        commits = []
        for line in result.stdout.strip().split("\n"):
            if line:
                hash_val, author, email, date, message = line.split("|", 4)
                commits.append({
                    "hash": hash_val,
                    "author": author,
                    "email": email,
                    "date": date,
                    "message": message
                })

        return json.dumps(commits, indent=2, ensure_ascii=False)

    except Exception as e:
        return f"Error: {str(e)}"


def search_commits(keyword: str) -> str:
    """搜索提交信息"""
    try:
        result = subprocess.run(
            ["git", "log", "--all", "--grep", keyword, "--pretty=format:%H|%an|%ad|%s"],
            capture_output=True,
            text=True,
            cwd="."
        )

        if result.returncode != 0:
            return f"Error: {result.stderr}"

        commits = []
        for line in result.stdout.strip().split("\n"):
            if line:
                hash_val, author, date, message = line.split("|", 3)
                commits.append({
                    "hash": hash_val,
                    "author": author,
                    "date": date,
                    "message": message
                })

        return json.dumps(commits, indent=2, ensure_ascii=False)

    except Exception as e:
        return f"Error: {str(e)}"
```

---

## 6. Coding Agent 最佳实践

### 核心要点

-   **渐进式自动化**: 从建议模式到自主模式的渐进
-   **透明性**: 决策过程的可观察和可解释
-   **安全边界**: 沙箱执行、变更预览、回滚机制

### 6.1 原则 1: 渐进式自动化

**核心理念**: 从辅助到自主，逐步提升自动化程度

#### 自动化层次

| 层次 | 模式 | 特点 | 适用场景 |
| :--- | :--- | :--- | :--- |
| **Level 1** | 建议模式 | Agent 只提供建议，人类决策 | 学习和探索 |
| **Level 2** | 协作模式 | Agent 执行操作，人类监督 | 日常开发 |
| **Level 3** | 自主模式 | Agent 独立完成任务 | 重复性任务 |

#### 实现

```python
class CodingAgent:
    def __init__(self, automation_level: int = 2):
        self.level = automation_level  # 1, 2, or 3

    async def execute_task(self, task: str):
        if self.level == 1:
            return await self.suggest_mode(task)
        elif self.level == 2:
            return await self.collaborative_mode(task)
        elif self.level == 3:
            return await self.autonomous_mode(task)

    async def suggest_mode(self, task: str):
        """建议模式：只提供建议"""
        analysis = await self.analyze(task)
        suggestions = await self.generate_suggestions(analysis)

        return {
            "mode": "suggestion",
            "suggestions": suggestions,
            "requires_approval": True
        }

    async def collaborative_mode(self, task: str):
        """协作模式：执行并寻求确认"""
        plan = await self.create_plan(task)

        # 确认计划
        user_approval = await self.confirm_plan(plan)
        if not user_approval:
            return {"status": "cancelled"}

        # 执行计划
        results = []
        for step in plan["steps"]:
            result = await self.execute_step(step)
            results.append(result)

            # 实时反馈
            await self.show_progress(result)

        return {"status": "completed", "results": results}

    async def autonomous_mode(self, task: str):
        """自主模式：独立完成任务"""
        plan = await self.create_plan(task)

        # 执行计划（无需确认）
        results = []
        for step in plan["steps"]:
            result = await self.execute_step(step)
            results.append(result)

            # 自动纠错
            if result["status"] == "failed":
                fixed_result = await self.auto_fix(result)
                results.append(fixed_result)

        # 最终验证
        validation = await self.validate_results(results)

        return {
            "status": "completed",
            "results": results,
            "validation": validation
        }
```

### 6.2 原则 2: 透明性

**核心理念**: Agent 的决策过程应该可观察、可解释

#### 决策日志

```python
class TransparentAgent:
    def __init__(self):
        self.decision_log = []

    async def make_decision(self, context: dict):
        # 记录决策过程
        decision_record = {
            "timestamp": datetime.now().isoformat(),
            "context": context,
            "reasoning": [],
            "alternatives": [],
            "final_choice": None
        }

        # 生成推理链
        reasoning_steps = await self.generate_reasoning(context)
        decision_record["reasoning"] = reasoning_steps

        # 生成替代方案
        alternatives = await self.generate_alternatives(context)
        decision_record["alternatives"] = alternatives

        # 做出选择
        choice = await self.select_action(reasoning_steps, alternatives)
        decision_record["final_choice"] = choice

        # 保存记录
        self.decision_log.append(decision_record)

        return choice

    def get_decision_history(self) -> list:
        """获取决策历史"""
        return self.decision_log

    def explain_decision(self, decision_id: int) -> str:
        """解释特定决策"""
        record = self.decision_log[decision_id]

        explanation = f"""
# 决策解释

## 时间
{record['timestamp']}

## 推理过程
"""
        for i, step in enumerate(record['reasoning'], 1):
            explanation += f"{i}. {step}\n"

        explanation += f"\n## 最终选择\n{record['final_choice']}\n"

        return explanation
```

### 6.3 原则 3: 安全边界

**核心理念**: Agent 的操作必须在安全范围内

#### 沙箱执行

```python
class SandboxedAgent:
    def __init__(self):
        self.allowed_operations = {
            "read_file": True,
            "write_file": True,
            "run_tests": True,
            "install_package": False,  # 需要确认
            "delete_file": False,      # 禁止
            "network_call": False      # 禁止
        }
        self.sandbox_path = "/tmp/agent_sandbox"

    async def execute_operation(self, operation: str, **kwargs):
        # 检查操作是否允许
        if not self.allowed_operations.get(operation, False):
            raise PermissionError(f"Operation '{operation}' is not allowed")

        # 在沙箱中执行
        if operation == "write_file":
            # 确保路径在沙箱内
            path = kwargs["path"]
            if not path.startswith(self.sandbox_path):
                path = os.path.join(self.sandbox_path, path)

            # 执行操作
            return await self.write_file(path, kwargs["content"])
```

#### 回滚机制

```python
class RollbackAgent:
    def __init__(self):
        self.snapshot_stack = []

    async def create_snapshot(self) -> str:
        """创建当前状态快照"""
        import shutil
        import uuid

        snapshot_id = str(uuid.uuid4())
        snapshot_path = f"/tmp/snapshots/{snapshot_id}"

        # 保存当前状态
        shutil.copytree(".", snapshot_path,
                       ignore=shutil.ignore_patterns(
                           "node_modules", ".git", "__pycache__"
                       ))

        self.snapshot_stack.append(snapshot_id)

        return snapshot_id

    async def rollback(self, snapshot_id: str = None):
        """回滚到快照"""
        if snapshot_id is None:
            snapshot_id = self.snapshot_stack[-1]

        snapshot_path = f"/tmp/snapshots/{snapshot_id}"

        # 恢复状态
        shutil.copytree(snapshot_path, ".", dirs_exist_ok=True)

        return f"Rolled back to snapshot {snapshot_id}"

    async def execute_with_rollback(self, operation):
        """执行操作，失败时自动回滚"""
        # 创建快照
        snapshot_id = await self.create_snapshot()

        try:
            # 执行操作
            result = await operation()

            # 验证结果
            if await self.validate_result(result):
                return result
            else:
                raise Exception("Validation failed")

        except Exception as e:
            # 回滚
            await self.rollback(snapshot_id)
            raise Exception(f"Operation failed, rolled back: {str(e)}")
```

---

## 7. 测试与部署

### 核心要点

-   **单元测试**: 测试 Agent 组件
-   **集成测试**: 测试完整工作流
-   **部署配置**: 生产环境配置
-   **监控指标**: 性能和成功率监控

### 7.1 单元测试

```python
import pytest
from unittest.mock import AsyncMock, patch

class TestTaskDecomposer:
    @pytest.mark.asyncio
    async def test_decompose_feature_task(self):
        decomposer = TaskDecomposer()

        task = "实现用户登录功能"

        with patch.object(decomposer, 'classify_task', return_value="feature"):
            result = await decomposer.decompose(task)

            assert result["task_type"] == "feature"
            assert len(result["subtasks"]) > 0
            assert all("description" in st for st in result["subtasks"])


class TestCodeValidator:
    @pytest.mark.asyncio
    async def test_syntax_validation(self):
        validator = CodeValidator()

        # 有效代码
        valid_code = "def f(): return 1"
        result = await validator.syntax_validator(valid_code, {})
        assert result["status"] == "passed"

        # 无效代码
        invalid_code = "def f(:"
        result = await validator.syntax_validator(invalid_code, {})
        assert result["status"] == "failed"
```

### 7.2 集成测试

```python
class TestCodingAgentIntegration:
    @pytest.mark.asyncio
    async def test_bug_fix_workflow(self):
        agent = CodingAgent()

        # 提供一个 bug
        bug_report = {
            "title": "除零错误",
            "file": "math_utils.py",
            "code": """
def divide(a, b):
    return a / b
            """,
            "error": "ZeroDivisionError: division by zero"
        }

        # Agent 修复
        result = await agent.fix_bug(bug_report)

        # 验证
        assert result["status"] == "success"
        assert "fixed_code" in result

        # 检查修复后的代码
        fixed_code = result["fixed_code"]
        assert "ZeroDivisionError" in fixed_code or "if b == 0" in fixed_code
```

### 7.3 部署配置

```yaml
# config/production.yaml
agent:
  name: "coding-agent-prod"
  automation_level: 2  # 协作模式

  # 安全设置
  security:
    sandbox_enabled: true
    allowed_operations:
      - read_file
      - write_file
      - run_tests
    forbidden_patterns:
      - "rm -rf"
      - "format"
      - "shutdown"

  # 性能设置
  performance:
    max_execution_time: 300  # 5 分钟
    max_memory_usage: 2048   # 2GB
    max_file_size: 10485760  # 10MB

  # 监控设置
  monitoring:
    metrics_enabled: true
    metrics_port: 9090
    health_check_interval: 30  # 秒
```

### 7.4 监控指标

```python
class AgentMonitor:
    def __init__(self):
        self.metrics = {
            "tasks_completed": 0,
            "tasks_failed": 0,
            "average_execution_time": 0,
            "success_rate": 0.0,
            "tool_usage": defaultdict(int),
            "error_types": defaultdict(int)
        }

    def record_task_completion(self, duration: float, success: bool, tools_used: list):
        """记录任务完成"""
        if success:
            self.metrics["tasks_completed"] += 1
        else:
            self.metrics["tasks_failed"] += 1

        # 更新成功率
        total_tasks = self.metrics["tasks_completed"] + self.metrics["tasks_failed"]
        self.metrics["success_rate"] = (
            self.metrics["tasks_completed"] / total_tasks
        )

        # 记录工具使用
        for tool in tools_used:
            self.metrics["tool_usage"][tool] += 1

    def get_metrics_report(self) -> str:
        """生成指标报告"""
        report = f"""
# Agent 性能报告

## 任务统计
- 完成: {self.metrics['tasks_completed']}
- 失败: {self.metrics['tasks_failed']}
- 成功率: {self.metrics['success_rate']:.2%}
- 平均执行时间: {self.metrics['average_execution_time']:.2f}s

## 工具使用统计
"""
        for tool, count in sorted(
            self.metrics["tool_usage"].items(),
            key=lambda x: x[1],
            reverse=True
        ):
            report += f"- {tool}: {count} 次\n"

        return report
```

---

## 8. 安全与性能优化

### 核心要点

-   **权限控制**: 最小权限原则
-   **输入验证**: 防止恶意输入
-   **速率限制**: 防止滥用
-   **性能优化**: 缓存、流式响应

### 8.1 权限控制

```python
class SecureMCPServer(Server):
    def __init__(self):
        super().__init__("secure-server")
        self.allowed_paths = ["/home/user/project"]
        self.readonly = False

    def check_permission(self, path: str, operation: str) -> bool:
        """检查权限"""
        # 检查路径是否在允许范围内
        real_path = os.path.realpath(path)
        if not any(real_path.startswith(allowed) for allowed in self.allowed_paths):
            return False

        # 检查操作权限
        if operation == "write" and self.readonly:
            return False

        # 检查敏感文件
        sensitive_patterns = [".env", "secret", "password", "key"]
        if any(pattern in real_path for pattern in sensitive_patterns):
            return False

        return True
```

### 8.2 输入验证

```python
def validate_tool_arguments(tool_name: str, arguments: dict) -> bool:
    """验证工具参数"""

    if tool_name == "execute_command":
        # 禁止执行危险命令
        dangerous_commands = ["rm -rf", "format", "shutdown", "reboot"]
        cmd = arguments.get("command", "")

        if any(dangerous in cmd.lower() for dangerous in dangerous_commands):
            raise ValueError("Dangerous command detected")

    if tool_name == "write_file":
        # 验证路径
        path = arguments.get("path", "")

        # 防止路径遍历攻击
        if ".." in path or path.startswith("/"):
            raise ValueError("Invalid path")

    return True
```

### 8.3 速率限制

```python
from collections import defaultdict
import time

class RateLimiter:
    def __init__(self, max_requests: int = 100, window: int = 60):
        self.max_requests = max_requests
        self.window = window
        self.requests = defaultdict(list)

    def is_allowed(self, client_id: str) -> bool:
        """检查是否允许请求"""
        now = time.time()

        # 清理过期记录
        self.requests[client_id] = [
            req_time for req_time in self.requests[client_id]
            if now - req_time < self.window
        ]

        # 检查是否超限
        if len(self.requests[client_id]) >= self.max_requests:
            return False

        # 记录请求
        self.requests[client_id].append(now)
        return True
```

### 8.4 性能优化

#### 缓存

```python
from functools import lru_cache
import hashlib

class CachedMCPServer(Server):
    def __init__(self):
        super().__init__("cached-server")
        self.cache = {}

    def get_cache_key(self, method: str, **kwargs) -> str:
        """生成缓存键"""
        data = f"{method}:{json.dumps(kwargs, sort_keys=True)}"
        return hashlib.md5(data.encode()).hexdigest()

    @server.call_tool()
    async def call_tool(self, name: str, arguments: dict) -> str:
        cache_key = self.get_cache_key(name, **arguments)

        # 检查缓存
        if cache_key in self.cache:
            return self.cache[cache_key]

        # 执行操作
        result = await self.execute_tool(name, arguments)

        # 缓存结果
        self.cache[cache_key] = result

        return result
```

#### 流式响应

```python
async def stream_large_file(path: str):
    """流式读取大文件"""
    chunk_size = 8192  # 8KB

    with open(path, 'r') as f:
        while True:
            chunk = f.read(chunk_size)
            if not chunk:
                break
            yield chunk
```

---

## 9. 实战案例深度解析

### 核心要点

-   **Bug 修复 Agent**: 完整的修复流程实现
-   **任务分解器**: 复杂任务的自动分解
-   **迭代优化器**: 代码质量的迭代改进

### 9.1 完整的 Bug 修复 Agent

```python
class BugFixAgent:
    def __init__(self):
        self.perception = BugPerception()
        self.planner = FixPlanner()
        self.executor = CodeExecutor()
        self.reflector = FixReflector()

    def fix_bug(self, bug_report: dict) -> dict:
        # 1. 感知
        context = self.perception.analyze(bug_report)

        # 2. 规划
        plan = self.planner.create_plan(context)

        # 3. 执行
        result = self.executor.execute_plan(plan)

        # 4. 反思
        while not self.reflector.is_satisfied(result):
            # 调整并重试
            plan = self.reflector.adjust_plan(plan, result)
            result = self.executor.execute_plan(plan)

        return result
```

### 9.2 任务分解器

```python
class TaskDecomposer:
    def __init__(self, max_subtasks: int = 10):
        self.max_subtasks = max_subtasks

    async def decompose(self, task: str) -> dict:
        """分解任务"""

        # 1. 分析任务类型
        task_type = await self.classify_task(task)

        # 2. 识别依赖关系
        dependencies = await self.identify_dependencies(task)

        # 3. 生成子任务
        subtasks = await self.generate_subtasks(
            task,
            task_type,
            dependencies,
            max_count=self.max_subtasks
        )

        # 4. 排序子任务（基于依赖）
        sorted_subtasks = self.topological_sort(subtasks, dependencies)

        return {
            "original_task": task,
            "task_type": task_type,
            "subtasks": sorted_subtasks,
            "dependencies": dependencies
        }
```

### 9.3 迭代优化器

```python
class IterativeOptimizer:
    def __init__(self, max_iterations: int = 5):
        self.max_iterations = max_iterations

    async def optimize(self, code: str, requirements: dict) -> dict:
        """迭代优化代码"""

        current_code = code
        history = []

        for iteration in range(self.max_iterations):
            # 1. 评估当前代码
            evaluation = await self.evaluate(current_code, requirements)

            history.append({
                "iteration": iteration,
                "code": current_code,
                "evaluation": evaluation
            })

            # 2. 检查是否满足要求
            if self.meets_requirements(evaluation, requirements):
                return {
                    "status": "success",
                    "final_code": current_code,
                    "iterations": iteration + 1,
                    "history": history
                }

            # 3. 生成改进建议
            improvements = await self.suggest_improvements(
                current_code,
                evaluation,
                requirements
            )

            # 4. 应用改进
            current_code = await self.apply_improvements(
                current_code,
                improvements
            )

        # 达到最大迭代次数
        return {
            "status": "max_iterations_reached",
            "final_code": current_code,
            "history": history
        }
```

---

## 10. 核心思想总结

### 10.1 Human-Agent Collaboration（人机协作）

- **不是完全自动化**: 人机协同，而非完全替代
- **人类提供高层指导**: 设定目标、提供反馈
- **Agent 执行细节**: 处理重复性、细节性任务

### 10.2 Iterative Refinement（迭代优化）

- **不要期望完美**: 一次性得到完美结果是不现实的
- **反馈循环**: 通过测试、验证、调整持续改进
- **渐进改进**: 每次迭代都比前一次更好

### 10.3 Context is King（上下文为王）

- **上下文决定能力**: LLM 的能力取决于上下文质量
- **清晰的项目结构**: 良好的代码组织
- **充分的文档**: 详细的说明和注释
- **明确的需求**: 清晰的目标和约束

### 10.4 Trust but Verify（信任但验证）

- **AI 会犯错**: 幻觉问题依然存在
- **建立验证机制**: 测试、审查、监控
- **代码审查**: 必须的人工审核
- **测试覆盖**: 确保质量保障

---

## 11. 参考资料

### 11.1 经典论文

1. **[ReAct: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/abs/2210.03629)** (Yao et al., 2022)
   - ReAct 模式的原始论文

2. **[Reflexion: Language Agents with Verbal Reinforcement Learning](https://arxiv.org/abs/2303.11366)** (Shinn et al., 2023)
   - 反思机制的理论基础

3. **[Chain-of-Thought Prompting Elicits Reasoning in Large Language Models](https://arxiv.org/abs/2201.11903)** (Wei et al., 2022)
   - CoT 推理技术

4. **[Toolformer: Language Models Can Teach Themselves to Use Tools](https://arxiv.org/abs/2302.04761)** (Schick et al., 2023)
   - 工具调用的基础研究

5. **[Communicative Agents for Software Development](https://arxiv.org/abs/2307.01152)** (Chen et al., 2023)
   - Multi-Agent 协作研究

6. **[SWE-agent: Agent Computer Interfaces Enable Software Engineering Language Models](https://arxiv.org/abs/2405.15793)** (Yang et al., 2024)
   - Princeton 的 Agent 研究成果

### 11.2 官方文档

1. [MCP Specification](https://spec.modelcontextprotocol.io/)
   - MCP 协议规范

2. [MCP SDK Documentation](https://github.com/modelcontextprotocol/python-sdk)
   - Python SDK 文档

3. [MCP Examples](https://github.com/modelcontextprotocol/servers)
   - 官方示例服务器

4. [Claude Documentation](https://docs.anthropic.com/)
   - Anthropic 官方文档

### 11.3 工具和框架

| 框架 | 描述 | 链接 |
| :--- | :--- | :--- |
| **LangChain** | 流行的 LLM 应用开发框架 | https://python.langchain.com/ |
| **AutoGen** | Microsoft 的 Multi-Agent 框架 | https://github.com/microsoft/autogen |
| **CrewAI** | Multi-Agent 协作框架 | https://www.crewai.com/ |
| **LlamaIndex** | 专注于 RAG 的数据框架 | https://www.llamaindex.ai/ |
| **DSPy** | 程序化地优化提示词 | https://github.com/stanfordnlp/dspy |

### 11.4 实践项目建议

1. **构建一个代码审查 Agent**
   - 分析代码质量
   - 检测安全问题
   - 提供改进建议

2. **实现一个自动化测试生成器**
   - 分析代码结构
   - 生成测试用例
   - 运行并验证

3. **开发一个文档维护 Agent**
   - 生成 API 文档
   - 更新 README
   - 保持文档同步

4. **创建一个性能优化助手**
   - 分析性能瓶颈
   - 提供优化建议
   - 实施优化方案

---

## 总结

Agent 架构与 MCP 协议是构建现代 AI 应用的核心技术。通过本周的学习，你现在应该能够：

### 关键要点

1. **理解 Agent 架构**
   - 四大核心组件：感知、规划、行动、反思
   - 三种架构模式：ReAct、Plan-and-Execute、Multi-Agent
   - 选择合适的模式应对不同场景

2. **掌握 MCP 协议**
   - 三大核心能力：Resources、Tools、Prompts
   - 构建自定义 MCP Server
   - 集成到实际项目中

3. **应用最佳实践**
   - 渐进式自动化：从建议到自主
   - 透明性设计：可观察、可解释
   - 安全边界：沙箱、验证、回滚

4. **构建生产级 Agent**
   - 完整的测试策略
   - 监控和部署
   - 性能和安全优化

### 下一步

完成 Week 2 的作业 - **构建一个自定义 MCP Server**！

祝你 Agent 开发之旅顺利！🤖✨
