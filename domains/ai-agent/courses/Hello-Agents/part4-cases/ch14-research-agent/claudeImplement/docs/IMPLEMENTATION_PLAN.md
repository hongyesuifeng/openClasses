# 研究代理实现方案

## 项目概述

基于《Hello-Agents》课程核心知识点，构建一个完整的研究代理(Research Agent)系统，通过HTML交互界面展示智能体的核心能力。

---

## 课程核心知识点映射

### 1. ReAct范式（推理+行动循环）
- **应用场景**: 查询生成、信息检索迭代优化
- **实现位置**: `QueryGeneratorAgent`, `SearchAgent`

### 2. Plan-and-Solve范式（规划与解决）
- **应用场景**: 研究流程规划、任务分解
- **实现位置**: `PlannerAgent`

### 3. Reflection范式（反思优化）
- **应用场景**: 研究结果质量评估、迭代改进
- **实现位置**: `EvaluatorAgent`

### 4. Agent框架核心组件
- **消息系统**: Agent间通信
- **工具系统**: 搜索、解析等工具调用
- **记忆系统**: 研究上下文记忆
- **实现位置**: `AgentFramework`, `MessageBus`, `ToolRegistry`

### 5. 多智能体协作
- **层次式协作**: 主控Agent协调多个专业Agent
- **实现位置**: `ResearchOrchestrator`

---

## 系统架构设计

```
┌─────────────────────────────────────────────────────────────────┐
│                        研究代理系统架构                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    HTML交互界面层                        │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐              │   │
│  │  │输入区域   │  │进度显示   │  │结果展示   │              │   │
│  │  └──────────┘  └──────────┘  └──────────┘              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          ↓                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   研究编排器 (Orchestrator)              │   │
│  │            - 任务分解 - Agent调度 - 结果整合             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          ↓                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   多Agent协作层                          │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │   │
│  │  │Planner  │ │Searcher │ │Analyzer │ │Evaluator│        │   │
│  │  │ 规划Agent│ │ 检索Agent│ │ 分析Agent│ │ 评估Agent│        │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          ↓                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   Agent框架核心层                        │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │   │
│  │  │消息系统   │ │工具系统   │ │记忆系统   │ │LLM服务   │        │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          ↓                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                      工具服务层                           │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐                    │   │
│  │  │搜索API   │ │网页解析   │ │文档处理   │                    │   │
│  │  └─────────┘ └─────────┘ └─────────┘                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 核心模块设计

### 1. Agent框架核心 (`agent_framework.js`)

#### 基础Agent类
```javascript
class BaseAgent {
    constructor(name, llmClient, tools, memory) {
        this.name = name;
        this.llm = llmClient;
        this.tools = tools;
        this.memory = memory;
    }

    // ReAct循环实现
    async reactLoop(query, maxIterations = 10) {
        // 1. Thought: 思考当前状态
        // 2. Action: 决定行动
        // 3. Observation: 观察结果
        // 4. 重复直到完成
    }

    // Plan-and-Solve实现
    async planAndSolve(query) {
        // 1. Plan: 制定计划
        // 2. Solve: 执行计划
    }

    // Reflection实现
    async reflect(result) {
        // 评估结果质量并返回改进建议
    }
}
```

#### 消息系统
```javascript
class MessageBus {
    // Agent间消息传递
    send(from, to, type, content) {}

    // 订阅消息
    subscribe(agent, messageType) {}

    // 广播消息
    broadcast(from, content) {}
}
```

#### 工具系统
```javascript
class ToolRegistry {
    // 注册工具
    register(name, tool) {}

    // 执行工具
    execute(name, params) {}

    // 列出可用工具
    listTools() {}
}
```

### 2. 专业Agent实现

#### PlannerAgent（规划Agent）
- **范式**: Plan-and-Solve
- **职责**: 将研究主题分解为可执行步骤
- **输出**: 研究计划

#### SearcherAgent（检索Agent）
- **范式**: ReAct
- **职责**: 执行多源信息检索
- **工具**: 搜索API、查询生成器
- **输出**: 检索结果列表

#### AnalyzerAgent（分析Agent）
- **范式**: ReAct + 多Agent协作
- **职责**: 分析文档内容、提取关键信息
- **工具**: 文本解析、实体识别
- **输出**: 结构化分析结果

#### SynthesizerAgent（综合Agent）
- **范式**: Reflection
- **职责**: 整合多源信息、生成报告
- **工具**: 模板生成、格式化
- **输出**: 研究报告

#### EvaluatorAgent（评估Agent）
- **范式**: Reflection
- **职责**: 评估研究质量、提出改进建议
- **输出**: 质量评估报告

### 3. 研究编排器 (`research_orchestrator.js`)

```javascript
class ResearchOrchestrator {
    async conductResearch(topic, config) {
        // 1. 规划阶段
        const plan = await this.planner.plan(topic);

        // 2. 检索阶段
        const sources = await this.search(plan.queries);

        // 3. 分析阶段
        const analysis = await this.analyze(sources);

        // 4. 综合阶段
        const report = await this.synthesize(analysis);

        // 5. 评估阶段
        const evaluation = await this.evaluate(report);

        return { report, evaluation };
    }
}
```

---

## 技术选型

### 前端技术
- **HTML5**: 界面结构
- **CSS3**: 样式设计
- **JavaScript (ES6+)**: 核心逻辑
- **Chart.js**: 可视化图表

### 后端/模拟层
- **Mock LLM**: 模拟LLM响应（演示用）
- **Mock Search API**: 模拟搜索结果（演示用）

### 可选扩展
- **OpenAI API**: 真实LLM调用
- **Tavily API**: 搜索API
- **浏览器扩展**: 真实网页抓取

---

## 实际文件结构

```
claudeImplement/
├── docs/
│   ├── IMPLEMENTATION_PLAN.md     # 实现方案文档
│   ├── ARCHITECTURE.md            # 架构设计文档
│   └── KNOWLEDGE_POINTS.md        # 核心知识点映射
├── src/
│   ├── framework/
│   │   └── agent_framework.js     # 框架核心（合并了所有框架组件）
│   ├── agents/
│   │   ├── planner_agent.js       # 规划Agent
│   │   ├── searcher_agent.js      # 检索Agent
│   │   ├── analyzer_agent.js      # 分析Agent
│   │   ├── synthesizer_agent.js   # 综合Agent
│   │   └── evaluator_agent.js     # 评估Agent
│   └── orchestrator.js            # 研究编排器（含MockLLMService）
├── static/
│   ├── index.html                 # 主界面
│   ├── css/style.css              # 样式文件
│   ├── js/app.js                  # 应用入口
│   └── src/                       # 浏览器端源码（含多LLM服务）
│       ├── webllm_service.js      # WebLLM服务
│       ├── ollama_service.js      # Ollama服务
│       └── huggingface_service.js # HuggingFace服务
├── README.md
└── SUMMARY.md
```

**设计说明**: 采用精简结构，将框架核心组件（Message、MessageBus、ToolRegistry、MemorySystem、BaseAgent）合并到单文件 `agent_framework.js`，便于浏览器ES6模块加载。

---

## 实现步骤 ✅ 全部完成

### 第一阶段：框架搭建 ✅
- [x] 创建HTML界面骨架
- [x] 实现Agent框架核心（BaseAgent）
- [x] 实现消息系统
- [x] 实现工具注册系统

### 第二阶段：Agent实现 ✅
- [x] 实现PlannerAgent（Plan-and-Solve范式）
- [x] 实现SearcherAgent（ReAct范式）
- [x] 实现AnalyzerAgent（内容分析）
- [x] 实现SynthesizerAgent（报告生成）
- [x] 实现EvaluatorAgent（Reflection范式）

### 第三阶段：协作与编排 ✅
- [x] 实现ResearchOrchestrator
- [x] 实现MockLLMService
- [x] 实现多Agent协作流程
- [x] 添加进度追踪和日志

### 第四阶段：界面完善 ✅
- [x] 完善HTML交互界面
- [x] 添加实时进度显示
- [x] 添加可视化图表
- [x] 添加结果展示

### 第五阶段：优化扩展 ✅
- [x] 多LLM服务支持（WebLLM, Ollama, HuggingFace）
- [x] 错误处理
- [x] 配置选项
- [x] 文档完善

---

## 核心知识点演示

本实现将清晰展示以下核心知识点：

1. **ReAct范式**: SearcherAgent使用思考-行动-观察循环
2. **Plan-and-Solve**: PlannerAgent先规划后执行
3. **Reflection**: EvaluatorAgent评估并改进
4. **消息系统**: Agent间通过MessageBus通信
5. **工具系统**: 通过ToolRegistry调用外部工具
6. **记忆系统**: Agent共享研究上下文
7. **多智能体协作**: Orchestrator协调多个Agent

---

## 预期效果

1. 输入研究主题，自动生成研究计划
2. 执行多源信息检索
3. 分析和整合信息
4. 生成结构化研究报告
5. 评估研究质量
6. 可视化展示整个研究过程
