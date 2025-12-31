# Week 1-2: LLM 基础与 Agent 架构

> **课程讲师**: Mihail Eric
> **周次**: 第 1-2 周
> **主题**: LLM 工作原理、Prompt Engineering、Agent 架构、MCP 协议
> **作业**: LLM Prompting Playground + Build a Custom MCP Server

---

## 一、本周学习目标

第 1-2 周是整个课程的基础，旨在建立对 AI 辅助开发的系统性理解：

### 核心目标
1. **理解 LLM 工作原理** - 深入了解大语言模型的基本机制
2. **掌握 Prompt Engineering** - 学会设计高质量提示词
3. **理解 Agent 架构** - 掌握工具调用、函数调用的原理
4. **学习 MCP 协议** - Model Context Protocol（模型上下文协议）
5. **实战构建 Coding Agent** - 从零搭建一个编码智能体

---

## 二、主要内容详解

### 2.1 LLM 工作原理

#### 基本概念
LLM（Large Language Model）是基于 Transformer 架构的深度学习模型，通过在大规模文本数据上预训练，学习语言的统计规律和语义关联。

#### 核心特性
1. **自回归生成** - 基于上下文逐个 token（词元）生成
2. **注意力机制** - 捕捉长距离依赖关系
3. **上下文窗口** - 模型能处理的最大输入长度
4. **零样本/少样本能力** - 无需或仅需少量示例即可完成任务

#### 对软件开发的影响
- **代码理解** - 能分析、解释代码逻辑
- **代码生成** - 根据需求生成代码片段
- **代码重构** - 改进代码结构和可读性
- **调试辅助** - 定位和修复 bug

---

### 2.2 Prompt Engineering（提示工程）

#### 什么是 Prompt Engineering？
Prompt Engineering 是设计、优化提示词以引导 LLM 生成期望输出的技术和艺术。

#### 核心原则

##### 1. 清晰性（Clarity）
提供明确的指令，避免歧义。

**❌ 糟糕的提示词**:
```
帮我写个函数
```

**✅ 优秀的提示词**:
```
请用 Python 编写一个函数，实现以下功能：
- 输入：一个整数列表
- 输出：列表中的第二大数字
- 要求：处理边界情况（空列表、单元素列表）
- 返回类型：int 或 None
```

##### 2. 上下文（Context）
提供足够的背景信息，让 LLM 理解任务环境。

**示例框架**:
```
【项目背景】
我们正在开发一个电商网站的后端 API...

【当前任务】
需要实现一个购物车功能...

【技术栈】
- 后端：Python + FastAPI
- 数据库：PostgreSQL
- 缓存：Redis

【具体需求】
...
```

##### 3. 示例驱动（Example-Driven）
通过 few-shot learning 提供示例。

**ReAct 框架示例**:
```
【任务】回答用户问题

【示例 1】
问题：Python 中如何读取文件？
思考：我需要解释文件读取的方法
行动：提供 open() 函数的用法和代码示例
观察：回答涵盖了基本用法

【示例 2】
问题：什么是装饰器？
思考：装饰器是 Python 的高级特性
行动：解释概念 + 提供代码示例
观察：回答清晰易懂

【现在回答】
问题：{用户问题}
```

##### 4. 思维链（Chain-of-Thought）
引导模型展示推理过程。

**应用场景**:
- 复杂问题求解
- 多步骤推理
- 代码调试

**模板**:
```
请按以下步骤思考：
1. 理解问题的核心
2. 列出可能的解决方案
3. 分析每种方案的优劣
4. 选择最优方案并说明理由
5. 给出具体实现
```

#### 高级技巧

##### 1. 角色设定（Role Playing）
```
你是一位有 10 年经验的资深 Python 开发者，
精通性能优化和代码架构设计。请以专业的角度...
```

##### 2. 约束条件（Constraints）
```
要求：
- 代码必须通过 PEP 8 规范检查
- 时间复杂度不超过 O(n log n)
- 添加类型注解
- 编写单元测试
```

##### 3. 输出格式（Output Format）
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

### 2.3 Agent 架构

#### 什么是 Agent？
Agent 是一个能够感知环境、做出决策并执行行动的智能体。在软件开发中，Coding Agent 是能自主完成编码任务的 AI 系统。

#### Agent 核心组件

##### 1. Perception（感知）
- 读取代码库
- 理解用户需求
- 分析错误信息

##### 2. Planning（规划）
- 分解复杂任务
- 制定执行步骤
- 选择合适工具

##### 3. Action（行动）
- 调用工具（Tool Calling）
- 函数执行（Function Calling）
- 代码生成与修改

##### 4. Reflection（反思）
- 检查执行结果
- 验证正确性
- 调整策略

#### 工具调用（Tool Calling）

**概念**：LLM 可以调用外部工具/API 来增强其能力。

**示例场景**：
```python
# LLM 可以调用的工具定义
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

**工作流程**：
1. LLM 分析用户请求
2. 决定需要调用哪些工具
3. 生成工具调用参数
4. 执行工具调用
5. 将结果返回给 LLM
6. LLM 基于结果继续处理

#### 函数调用（Function Calling）
函数调用是工具调用的具体实现，LLM 直接生成结构化的函数调用代码。

**与传统 API 调用的区别**：
- **传统**：开发者预设调用逻辑
- **Agent**：LLM 自主决定调用哪个函数、何时调用、参数是什么

---

### 2.4 Model Context Protocol (MCP)

#### 什么是 MCP？
MCP（Model Context Protocol）是 Anthropic 提出的**模型上下文协议**，用于标准化 LLM 与外部数据源的交互。

#### 核心问题
在传统 AI 开发中，LLM 如何访问：
- 本地文件系统
- 数据库
- API 服务
- 内部文档
- 代码库历史

#### MCP 的解决方案

##### 1. 统一接口
MCP 定义了一套统一的协议，让不同的数据源都能以标准方式被 LLM 访问。

##### 2. 上下文提供者（Context Provider）
MCP Server 作为上下文提供者，将各种数据源转换为 LLM 可理解的格式。

**示例架构**：

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

##### 3. MCP Server 示例

**文件系统 MCP Server**:
```python
from mcp import Server

server = Server("filesystem-server")

@server.resource("file://{path}")
def read_file(path: str) -> str:
    """读取文件内容"""
    with open(path, 'r') as f:
        return f.read()

@server.resource("dir://{path}")
def list_directory(path: str) -> list:
    """列出目录内容"""
    return os.listdir(path)

@server.tool("search_files")
def search_files(pattern: str, path: str = ".") -> list:
    """搜索文件"""
    import glob
    return glob.glob(f"{path}/{pattern}", recursive=True)
```

**数据库 MCP Server**:
```python
server = Server("database-server")

@server.resource("db://query")
def execute_query(query: str) -> list:
    """执行数据库查询"""
    cursor = db.cursor()
    cursor.execute(query)
    return cursor.fetchall()
```

#### MCP 的优势

1. **标准化** - 统一的接口规范
2. **可组合** - 多个 MCP Server 可以组合使用
3. **安全性** - 细粒度的权限控制
4. **扩展性** - 易于添加新的数据源

---

### 2.5 Coding Agent 架构

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

#### 实战：构建一个简单的 Coding Agent

**任务**: 创建一个能够修复简单 bug 的 Agent

**步骤 1**: 定义工具
```python
tools = {
    "read_code": "读取代码文件",
    "analyze_error": "分析错误信息",
    "write_code": "写入代码",
    "run_tests": "运行测试"
}
```

**步骤 2**: 设计提示词
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

**步骤 3**: 实现循环
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

## 三、核心思想与实践

### 3.1 核心思想

#### 1. Human-Agent Collaboration（人机协作）
- 不是完全自动化，而是人机协同
- 人类提供高层指导和验证
- Agent 执行重复性、细节性任务

#### 2. Iterative Refinement（迭代优化）
- 不要期望一次性得到完美结果
- 通过反馈循环持续改进
- 测试、验证、调整

#### 3. Context is King（上下文为王）
- LLM 的能力取决于上下文质量
- 清晰的项目结构
- 良好的文档
- 明确的需求说明

#### 4. Trust but Verify（信任但验证）
- AI 会犯错（幻觉问题）
- 必须建立验证机制
- 代码审查、测试覆盖

### 3.2 实践建议

#### 对于 Prompt Engineering

1. **建立提示词库** - 积累和复用优秀提示词
2. **版本控制** - 像管理代码一样管理提示词
3. **A/B 测试** - 比较不同提示词的效果
4. **持续优化** - 根据结果迭代改进

#### 对于 Agent 开发

1. **从小处着手** - 先构建简单 Agent
2. **模块化设计** - 易于调试和扩展
3. **日志记录** - 记录 Agent 的决策过程
4. **安全限制** - 限制 Agent 的操作范围

#### 对于 MCP 集成

1. **标准化接口** - 遵循 MCP 规范
2. **权限控制** - 只暴露必要的资源
3. **错误处理** - 优雅处理异常情况
4. **性能优化** - 缓存、索引、增量更新

---

## 四、作业实战

### Week 1: LLM Prompting Playground

**目标**: 探索和实践 Prompt Engineering

**任务**:
1. 使用 Claude Code 或其他 AI IDE
2. 尝试不同的提示词策略
3. 记录哪些提示词效果好，哪些不好
4. 总结提示词设计的最佳实践

**评价标准**:
- 提示词的清晰度
- 生成代码的质量
- 需要迭代调整的次数

### Week 2: Build a Custom MCP Server

**目标**: 从零构建一个自定义 MCP 服务器

**任务**:
1. 选择一个数据源（如文件系统、数据库、API）
2. 实现 MCP Server 接口
3. 提供资源（resources）和工具（tools）
4. 在 Claude Code 中集成并测试

**示例项目**:
- **日志分析 MCP Server** - 读取和分析应用日志
- **文档搜索 MCP Server** - 搜索项目文档
- **Git 历史 MCP Server** - 提供 Git 提交历史作为上下文
- **API 文档 MCP Server** - 将 API 文档转换为 LLM 可读格式

**评价标准**:
- MCP Server 的功能完整性
- 与 Claude Code 的集成效果
- 代码质量和可维护性

---

## 五、进阶学习资源

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

## 六、本周小结

第 1-2 周建立了 AI 辅助开发的理论基础：

1. **LLM 原理** - 理解大语言模型的工作机制
2. **Prompt Engineering** - 掌握与 LLM 有效沟通的技巧
3. **Agent 架构** - 理解智能体的核心组件和设计模式
4. **MCP 协议** - 学会连接 LLM 与外部世界
5. **实战经验** - 通过动手项目巩固理论知识

这些知识为后续学习 AI IDE、Agent 管理等高级主题打下了坚实基础。

---

**下一周预告**: Week 3-4 将深入探讨 AI IDE 与 Agent 管理策略，学习如何在真实的开发环境中高效使用 AI 工具。
