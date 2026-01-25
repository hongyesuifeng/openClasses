# Week 2: Agent Architecture and MCP Protocol

> **第 2 周：Agent 架构与 MCP 协议**
> **主题**: 编码智能体、MCP 协议、工具调用
> **作业**: Build a Custom MCP Server

---

## 📚 本周概览

第 2 周深入探讨如何构建实际的 AI 智能体，将理论转化为实践：

1. **Agent 架构** - 理解智能体的核心组件和工作流程
2. **MCP 协议** - Model Context Protocol，连接 LLM 与外部世界
3. **工具调用** - Tool Calling 和 Function Calling 的原理与实践
4. **Coding Agent 实战** - 从零构建一个编码智能体

---

## 🎯 学习目标

完成本周学习后，你应该能够：

- ✅ 理解 Agent 的核心架构（感知、规划、行动、反思）
- ✅ 掌握 MCP（Model Context Protocol）协议的基本概念
- ✅ 学会实现工具调用（Tool Calling）和函数调用（Function Calling）
- ✅ 能够从零构建一个简单的 Coding Agent
- ✅ 实现一个自定义 MCP Server
- ✅ 理解人机协作的核心原则

---

## 📖 核心内容

### 1. Agent 架构

#### 什么是 Agent？
Agent 是一个能够感知环境、做出决策并执行行动的智能体。在软件开发中，Coding Agent 是能自主完成编码任务的 AI 系统。

#### 核心组件

**1. Perception（感知）**
- 读取代码库
- 理解用户需求
- 分析错误信息

**2. Planning（规划）**
- 分解复杂任务
- 制定执行步骤
- 选择合适工具

**3. Action（行动）**
- 调用工具（Tool Calling）
- 函数执行（Function Calling）
- 代码生成与修改

**4. Reflection（反思）**
- 检查执行结果
- 验证正确性
- 调整策略

---

### 2. 工具调用（Tool Calling）

#### 概念
LLM 可以调用外部工具/API 来增强其能力。

#### 工作流程
```
1. LLM 分析用户请求
2. 决定需要调用哪些工具
3. 生成工具调用参数
4. 执行工具调用
5. 将结果返回给 LLM
6. LLM 基于结果继续处理
```

#### 示例工具定义
```python
tools = [
    {
        "name": "read_file",
        "description": "读取文件内容",
        "parameters": {
            "path": "string (文件路径)"
        }
    },
    {
        "name": "write_file",
        "description": "写入文件",
        "parameters": {
            "path": "string (文件路径)",
            "content": "string (文件内容)"
        }
    },
    {
        "name": "run_tests",
        "description": "运行测试",
        "parameters": {
            "test_path": "string (测试路径)"
        }
    }
]
```

#### 与传统 API 调用的区别
- **传统**: 开发者预设调用逻辑
- **Agent**: LLM 自主决定调用哪个函数、何时调用、参数是什么

---

### 3. MCP 协议（Model Context Protocol）

#### 什么是 MCP？
MCP 是 Anthropic 提出的**模型上下文协议**，用于标准化 LLM 与外部数据源的交互。

#### 核心问题
LLM 如何访问：
- 本地文件系统
- 数据库
- API 服务
- 内部文档
- 代码库历史

#### MCP 架构

```
┌─────────────┐
│    LLM      │
└──────┬──────┘
       │ MCP Protocol
       ▼
┌─────────────┐
│  MCP Client │
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌──────────────┐
│ MCP Server  │────▶│  Data Source │
└─────────────┘     └──────────────┘
     (File System)
     (Database)
     (API)
     (Git History)
```

#### MCP 的优势
1. **标准化** - 统一的接口规范
2. **可组合** - 多个 MCP Server 可以组合使用
3. **安全性** - 细粒度的权限控制
4. **扩展性** - 易于添加新的数据源

---

### 4. Coding Agent 架构实战

#### 基本架构

```
┌─────────────────────────────────────────┐
│            User Request                 │
└────────────────┬────────────────────────┘
                 ▼
┌─────────────────────────────────────────┐
│          Planning Module                │
│  - Task Decomposition                   │
│  - Tool Selection                       │
│  - Step Ordering                        │
└────────────────┬────────────────────────┘
                 ▼
┌─────────────────────────────────────────┐
│         Execution Module                │
│  - Tool Calling                         │
│  - Function Execution                   │
│  - Code Generation                      │
└────────────────┬────────────────────────┘
                 ▼
┌─────────────────────────────────────────┐
│         Validation Module               │
│  - Syntax Check                         │
│  - Test Execution                       │
│  - Code Review                          │
└────────────────┬────────────────────────┘
                 ▼
         ┌───────────────┐
         │  Result       │
         └───────────────┘
```

#### 实战：构建 Bug 修复 Agent

**步骤 1: 定义工具**
```python
tools = {
    "read_code": "读取代码文件",
    "analyze_error": "分析错误信息",
    "write_code": "写入代码",
    "run_tests": "运行测试"
}
```

**步骤 2: 设计提示词**
```python
prompt_template = """
你是一个代码修复专家。当前任务：

【错误信息】
{error_message}

【相关代码】
{code}

【可用工具】
{tools}

请按照以下步骤修复：
1. 分析错误的根本原因
2. 确定需要修改的文件和位置
3. 调用相应工具进行修复
4. 验证修复是否成功
"""
```

**步骤 3: 实现循环**
```python
def fix_bug(error_message, code_context):
    while True:
        # 1. LLM 分析并决策
        decision = llm.decide(prompt_template.format(
            error_message=error_message,
            code_context=code_context,
            tools=tools
        ))

        # 2. 执行工具调用
        result = execute_tool(decision.tool, decision.params)

        # 3. 检查是否完成
        if decision.status == "completed":
            return result

        # 4. 更新上下文
        code_context = update_context(result)
```

---

## 💻 本周作业: Build a Custom MCP Server

### 作业目标
从零构建一个自定义 MCP 服务器，让 Claude Code 能够访问特定的数据源。

### 任务要求

1. **选择一个数据源**，例如：
   - 文件系统（日志、配置文件）
   - 数据库
   - REST API
   - Git 历史
   - 项目文档

2. **实现 MCP Server 接口**
   - 定义 Resources（资源访问）
   - 定义 Tools（工具调用）
   - 实现错误处理

3. **在 Claude Code 中集成并测试**

### 示例项目

#### 1. 日志分析 MCP Server
```python
from mcp import Server
import re
from datetime import datetime

server = Server("log-analyzer")

@server.resource("log://{path}")
def read_log(path: str) -> str:
    """读取日志文件"""
    with open(path, 'r') as f:
        return f.read()

@server.tool("analyze_errors")
def analyze_errors(log_path: str) -> dict:
    """分析日志中的错误"""
    errors = []
    with open(log_path, 'r') as f:
        for line in f:
            if 'ERROR' in line:
                errors.append(line.strip())
    return {
        "total_errors": len(errors),
        "errors": errors[:10]  # 返回前 10 个错误
    }

@server.tool("filter_logs_by_time")
def filter_by_time(log_path: str, start: str, end: str) -> list:
    """按时间过滤日志"""
    # 实现时间过滤逻辑
    pass
```

#### 2. 文档搜索 MCP Server
```python
server = Server("doc-search")

@server.resource("docs://{file}")
def read_documentation(file: str) -> str:
    """读取文档文件"""
    pass

@server.tool("search_docs")
def search_docs(query: str, doc_path: str = ".") -> list:
    """在文档中搜索关键词"""
    import glob
    results = []
    for file in glob.glob(f"{doc_path}/**/*.md", recursive=True):
        with open(file, 'r') as f:
            content = f.read()
            if query.lower() in content.lower():
                results.append({
                    "file": file,
                    "preview": content[:200]
                })
    return results
```

#### 3. Git 历史 MCP Server
```python
server = Server("git-history")

@server.resource("git://commits")
def get_recent_commits(limit: int = 10) -> list:
    """获取最近的提交记录"""
    import subprocess
    result = subprocess.run(
        ['git', 'log', '-n', str(limit), '--pretty=format:%H|%s|%an'],
        capture_output=True,
        text=True
    )
    commits = []
    for line in result.stdout.split('\n'):
        if line:
            hash, msg, author = line.split('|')
            commits.append({
                "hash": hash,
                "message": msg,
                "author": author
            })
    return commits

@server.tool("search_commit_messages")
def search_commits(keyword: str) -> list:
    """在提交历史中搜索关键词"""
    pass
```

### 评分标准
- **功能完整性** (40 分) - MCP Server 是否实现了必要的功能
- **集成效果** (30 分) - 与 Claude Code 的集成是否顺畅
- **代码质量** (20 分) - 代码结构、注释、错误处理
- **文档说明** (10 分) - README 和使用说明

---

## 🎓 核心思想

### 1. Human-Agent Collaboration（人机协作）
- 不是完全自动化，而是人机协同
- 人类提供高层指导和验证
- Agent 执行重复性、细节性任务

### 2. Iterative Refinement（迭代优化）
- 不要期望一次性得到完美结果
- 通过反馈循环持续改进
- 测试、验证、调整

### 3. Context is King（上下文为王）
- LLM 的能力取决于上下文质量
- 清晰的项目结构
- 良好的文档
- 明确的需求说明

### 4. Trust but Verify（信任但验证）
- AI 会犯错（幻觉问题）
- 必须建立验证机制
- 代码审查、测试覆盖

---

## 💡 实践建议

### 对于 Agent 开发
1. **从小处着手** - 先构建简单 Agent
2. **模块化设计** - 易于调试和扩展
3. **日志记录** - 记录 Agent 的决策过程
4. **安全限制** - 限制 Agent 的操作范围

### 对于 MCP 集成
1. **标准化接口** - 遵循 MCP 规范
2. **权限控制** - 只暴露必要的资源
3. **错误处理** - 优雅处理异常情况
4. **性能优化** - 缓存、索引、增量更新

---

## 🛠️ 技术要点

### Prompt Engineering 进阶

#### 1. 角色设定（Role Playing）
```
你是一位有 10 年经验的资深 Python 开发者，
精通性能优化和代码架构设计。请以专业的角度...
```

#### 2. 约束条件（Constraints）
```
要求：
- 代码必须通过 PEP 8 规范检查
- 时间复杂度不超过 O(n log n)
- 添加类型注解
- 编写单元测试
```

#### 3. 输出格式（Output Format）
```
请按以下格式输出：

【代码】
\`\`\`python
...
\`\`\`

【解释】
...

【测试用例】
...
```

---

## 📚 进阶学习资源

### 论文
- "ReAct: Synergizing Reasoning and Acting in Language Models"
- "Chain-of-Thought Prompting Elicits Reasoning in Large Language Models"
- "Toolformer: Language Models Can Teach Themselves to Use Tools"

### 工具
- **Claude Code** - Anthropic 的 AI IDE
- **MCP SDK** - https://github.com/modelcontextprotocol
- **LangChain** - 流行的 LLM 应用框架
- **AutoGPT** - 自主 Agent 实现

### 实践项目
1. 构建一个代码审查 Agent
2. 创建一个自动生成单元测试的 Agent
3. 开发一个文档生成 MCP Server
4. 实现一个 bug 修复助手

---

## 📊 本周检查清单

### 课前准备
- [ ] 复习 Week 1 的提示工程技术
- [ ] 熟悉 FastAPI 或类似框架
- [ ] 了解基本的数据库操作

### 课后实践
- [ ] 理解 Agent 的四大组件
- [ ] 实现 Tool Calling 示例
- [ ] 完成 MCP Server 项目
- [ ] 在 Claude Code 中测试 MCP Server
- [ ] 编写项目文档

### 自我评估
- [ ] 能够解释 Agent 的工作原理
- [ ] 能够设计简单的 Agent 架构
- [ ] 能够独立实现 MCP Server
- [ ] 理解 MCP 在实际项目中的应用

---

## 🚀 下周预告

**Week 3-4: AI IDE 与 Agent 管理策略**
- 深入学习 Claude Code 的高级功能
- Agent 管理和版本控制
- 在实际开发工作流中集成 AI 工具

**准备工作**:
- 熟练使用 Claude Code
- 思考如何在日常开发中应用 Agent
- 准备实际项目案例

---

**记住：构建 Agent 是一个迭代过程，从简单开始，逐步增加复杂度。** 🎉
