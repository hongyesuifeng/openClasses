# 研究代理系统技术架构文档

## 一、系统概述

### 1.1 系统目标

构建一个完整的研究代理(Research Agent)系统，展示《Hello-Agents》课程的核心知识点：

- **ReAct范式**: 推理-行动循环
- **Plan-and-Solve范式**: 规划-执行分离
- **Reflection范式**: 反思改进机制
- **Agent框架**: 消息、工具、记忆系统
- **多智能体协作**: 协调多个专业Agent

### 1.2 技术栈

```
前端层:
├── HTML5 - 页面结构
├── CSS3 - 样式和布局
└── JavaScript ES6+ - 核心逻辑

核心框架:
├── Agent Framework - Agent基类和核心机制
├── Message System - 消息总线
├── Tool Registry - 工具注册和执行
└── Memory System - 记忆管理

专业Agents:
├── Planner Agent - 研究规划
├── Searcher Agent - 信息检索
├── Analyzer Agent - 内容分析
├── Synthesizer Agent - 结果综合
└── Evaluator Agent - 质量评估

工具服务:
├── Search Tool - 搜索模拟
├── Parser Tool - 内容解析
└── Report Tool - 报告生成
```

---

## 二、系统架构

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        用户界面层 (UI)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  研究主题输入  │  │  实时进度显示  │  │  结果可视化   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    研究编排器 (Orchestrator)                      │
│         任务分解 → Agent调度 → 结果整合 → 质量评估               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      专业Agent协作层                              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│  │Planner  │  │Searcher │  │Analyzer │  │Evaluator│            │
│  │规划Agent│  │检索Agent│  │分析Agent│  │评估Agent│            │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     Agent框架核心层                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  消息系统     │  │  工具系统     │  │  记忆系统     │          │
│  │ MessageBus   │  │ ToolRegistry │  │ MemorySystem │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                       工具服务层                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  搜索API      │  │  内容解析     │  │  报告生成     │          │
│  │ SearchTool   │  │ ParserTool   │  │ ReportTool   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 数据流向

```
用户输入研究主题
       ↓
PlannerAgent (Plan-and-Solve: 规划)
       ↓
生成研究计划 (查询列表)
       ↓
SearcherAgent (ReAct: 迭代检索)
       ↓
检索结果 (来源列表)
       ↓
AnalyzerAgent (多Agent协作: 并行分析)
       ↓
结构化分析 (实体、关系、观点)
       ↓
SynthesizerAgent (综合整理)
       ↓
研究报告 (结构化输出)
       ↓
EvaluatorAgent (Reflection: 质量评估)
       ↓
最终报告 + 评估结果
```

---

## 三、核心模块设计

### 3.1 BaseAgent (基础Agent类)

#### 职责
- 提供Agent基础功能
- 实现三大范式：ReAct、Plan-and-Solve、Reflection
- 管理Agent状态和生命周期

#### 核心方法

```javascript
class BaseAgent {
    // ReAct范式：推理-行动循环
    async reactLoop(query, maxIterations)

    // Plan-and-Solve范式：规划-执行
    async planAndSolve(query)

    // Reflection范式：反思评估
    async reflect(result, criteria)

    // 消息处理
    async receiveMessage(message)
    sendMessage(to, type, content)

    // 状态管理
    emitProgress(type, data)
    getState()
}
```

#### ReAct循环流程

```
┌──────────────┐
│  用户查询     │
└──────┬───────┘
       ↓
┌──────────────┐
│  Thought     │ ← LLM分析当前状态
│  思考         │
└──────┬───────┘
       ↓
┌──────────────┐
│  Action      │ ← 决定下一步行动
│  行动决策     │
└──────┬───────┘
       ├────────→ [直接回答] → 完成
       │
       └────────→ [使用工具]
                     ↓
              ┌──────────────┐
              │  Observation  │ ← 工具执行结果
              │  观察结果     │
              └──────┬───────┘
                     ↓
              [继续循环]
```

### 3.2 MessageBus (消息系统)

#### 职责
- 实现Agent间通信
- 支持点对点和广播消息
- 维护消息历史记录

#### 消息类型

```javascript
enum MessageType {
    TEXT = 'text',       // 文本对话
    ACTION = 'action',   // 行动请求
    RESULT = 'result',   // 结果返回
    ERROR = 'error',     // 错误信息
    CONTROL = 'control', // 控制指令
    PROGRESS = 'progress' // 进度更新
}
```

#### 消息结构

```javascript
{
    id: 'msg_xxx',           // 唯一ID
    sender: 'PlannerAgent',  // 发送者
    receiver: 'Searcher',    // 接收者
    type: 'action',          // 消息类型
    content: {...},          // 消息内容
    timestamp: 1234567890,   // 时间戳
    metadata: {...}          // 元数据
}
```

### 3.3 ToolRegistry (工具系统)

#### 职责
- 管理可用工具集
- 验证工具参数
- 执行工具调用

#### 工具定义规范

```javascript
{
    name: 'search',          // 工具名称
    description: '搜索信息',  // 工具描述
    parameters: {            // 参数定义
        type: 'object',
        properties: {
            query: {
                type: 'string',
                description: '搜索关键词'
            }
        },
        required: ['query']
    },
    execute: async (params) => { // 执行函数
        // 工具实现
    }
}
```

### 3.4 MemorySystem (记忆系统)

#### 记忆类型

```
短期记忆 (Short-term):
├── 容量: ~100条
├── 内容: 对话历史、近期上下文
└── 检索: 按时间序列获取最新N条

长期记忆 (Long-term):
├── 容量: ~1000条
├── 内容: 重要事件、知识片段
├── 索引: 重要性、访问次数
└── 检索: 按相关性和重要性排序

语义记忆 (Semantic):
├── 容量: 无限制
├── 内容: 知识图谱、实体关系
└── 检索: 按实体名称或关系查询
```

---

## 三-A、代码实现参考

### 实际文件结构
```
claudeImplement/
├── src/
│   ├── framework/
│   │   └── agent_framework.js     # 框架核心 (821行)
│   │       ├── Message (lines 13-27)
│   │       ├── MessageBus (lines 33-118)
│   │       ├── ToolRegistry (lines 124-231)
│   │       ├── MemorySystem (lines 237-369)
│   │       └── BaseAgent (lines 375-820)
│   ├── agents/
│   │   ├── planner_agent.js       # 规划Agent (216行)
│   │   ├── searcher_agent.js      # 检索Agent (371行)
│   │   ├── analyzer_agent.js      # 分析Agent (436行)
│   │   ├── synthesizer_agent.js   # 综合Agent (456行)
│   │   └── evaluator_agent.js     # 评估Agent (441行)
│   └── orchestrator.js            # 研究编排器 (536行)
│       ├── MockLLMService (lines 19-217)
│       └── ResearchOrchestrator (lines 223-535)
└── static/
    └── index.html                 # 用户界面 (440行)
```

### 关键代码路径对照表

| 功能 | 文件路径 | 关键方法/类 |
|------|----------|-------------|
| ReAct循环 | `agent_framework.js` | `BaseAgent.reactLoop()` |
| Plan-and-Solve | `planner_agent.js` | `PlannerAgent.createResearchPlan()` |
| Reflection | `evaluator_agent.js` | `EvaluatorAgent.reflect()` |
| 多Agent协调 | `orchestrator.js` | `ResearchOrchestrator.conductResearch()` |
| 消息通信 | `agent_framework.js` | `MessageBus.send()`, `broadcast()` |
| 工具调用 | `agent_framework.js` | `ToolRegistry.execute()` |
| 记忆管理 | `agent_framework.js` | `MemorySystem.addShortTerm()`, `retrieveLongTerm()` |

---

## 四、专业Agent设计

### 4.1 PlannerAgent (规划Agent)

#### 知识点
- **Plan-and-Solve范式**

#### 职责
- 分析研究主题
- 生成研究计划
- 分解为可执行步骤

#### 输入输出

```
输入: 研究主题
      例如: "人工智能在医疗诊断中的应用"

输出: 研究计划
      {
        topic: "研究主题",
        steps: [
          "搜索AI医疗诊断的最新研究",
          "分析主要应用场景",
          "评估技术准确性",
          "识别挑战和限制",
          "总结发展趋势"
        ]
      }
```

#### Prompt模板

```
Given the following research topic, create a detailed execution plan.

Topic: {topic}

Break down the topic into 3-7 specific, executable steps.
Each step should be:
- Clear and specific
- Actionable
- Logically ordered

Format:
1. [Step 1]
2. [Step 2]
...
```

### 4.2 SearcherAgent (检索Agent)

#### 知识点
- **ReAct范式**
- **工具系统**

#### 职责
- 执行多源搜索
- 迭代优化查询
- 筛选和排序结果

#### ReAct循环示例

```
Thought: 我需要搜索"AI医疗诊断"的相关信息
Action: search
Action Input: {"query": "AI medical diagnosis", "source": "academic"}
Observation: 找到15篇相关论文...

Thought: 结果太多，我需要更精确的查询
Action: search
Action Input: {"query": "deep learning medical diagnosis accuracy", "source": "academic"}
Observation: 找到8篇高相关性论文...

Thought: 信息已足够，可以开始分析
Final Answer: 收集到23个相关来源
```

### 4.3 AnalyzerAgent (分析Agent)

#### 知识点
- **多智能体协作**
- 可以创建多个Analyzer实例并行分析

#### 职责
- 解析文档内容
- 提取关键信息
- 识别实体和关系

#### 分析维度

```
文档分析:
├── 基本信息 (标题、作者、日期)
├── 核心观点 (主要论点、结论)
├── 关键实体 (人名、机构、技术)
├── 数据支撑 (统计数据、实验结果)
└── 引用来源 (参考文献、数据来源)

对比分析:
├── 观点一致性 (多个来源的共同观点)
├── 观点冲突 (不同来源的矛盾之处)
└── 知识缺口 (尚未覆盖的内容)
```

### 4.4 SynthesizerAgent (综合Agent)

#### 知识点
- **信息整合**
- **报告生成**

#### 职责
- 整合多源信息
- 构建知识图谱
- 生成结构化报告

#### 报告结构

```
研究报告结构:
1. 标题与摘要
   ├── 研究主题
   ├── 研究背景
   └── 主要发现

2. 研究背景
   ├── 问题提出
   ├── 研究现状
   └── 研究意义

3. 研究方法
   ├── 数据来源
   ├── 分析方法
   └── 研究流程

4. 主要发现
   ├── 核心发现
   ├── 详细分析
   └── 数据支撑

5. 讨论与启示
   ├── 结果讨论
   ├── 实践启示
   └── 局限性说明

6. 结论与建议
   ├── 研究结论
   ├── 行动建议
   └── 未来方向

7. 参考文献
```

### 4.5 EvaluatorAgent (评估Agent)

#### 知识点
- **Reflection范式**

#### 职责
- 评估研究质量
- 识别不足之处
- 提供改进建议

#### 评估维度

```
质量评估指标:

完整性 (Completeness):
├── 信息覆盖度
├── 角度全面性
└── 深度充分性

准确性 (Accuracy):
├── 事实准确性
├── 引用正确性
└── 逻辑一致性

时效性 (Timeliness):
├── 信息新鲜度
├── 最新研究覆盖
└── 数据时效性

可靠性 (Reliability):
├── 来源权威性
├── 证据充分性
└── 可重复性

可读性 (Readability):
├── 结构清晰度
├── 表达简洁性
└── 理解容易度
```

---

## 五、多智能体协作流程

### 5.1 层次式协作模式

```
                    ┌─────────────────┐
                    │ Orchestrator    │
                    │  (编排器)        │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│ PlannerAgent  │  │SearcherAgent  │  │AnalyzerAgent  │
│  (规划阶段)    │  │  (检索阶段)    │  │  (分析阶段)    │
└───────────────┘  └───────────────┘  └───────────────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│SynthesizerAgent│  │EvaluatorAgent │  │   报告输出     │
│  (综合阶段)    │  │  (评估阶段)    │  │              │
└───────────────┘  └───────────────┘  └───────────────┘
```

### 5.2 研究流程状态机

```
┌─────────┐
│  开始    │
└────┬────┘
     ↓
┌─────────────┐
│  PLANNING   │ ← PlannerAgent.planAndSolve()
└──────┬──────┘
       ↓
┌─────────────┐
│  SEARCHING  │ ← SearcherAgent.reactLoop()
└──────┬──────┘
       ↓
┌─────────────┐
│  ANALYZING  │ ← AnalyzerAgent (并行)
└──────┬──────┘
       ↓
┌─────────────┐
│SYNTHESIZING │ ← SynthesizerAgent
└──────┬──────┘
       ↓
┌─────────────┐
│ EVALUATING  │ ← EvaluatorAgent.reflect()
└──────┬──────┘
       ↓
┌─────────────┐
│   完成      │
└─────────────┘
```

### 5.3 消息流转示例

```
[Orchestrator] --send--> [PlannerAgent]
                      任务: 制定研究计划
                              ↓
[PlannerAgent] --send--> [Orchestrator]
                      结果: 研究计划 (查询列表)
                              ↓
[Orchestrator] --send--> [SearcherAgent]
                      任务: 执行检索
                              ↓
[SearcherAgent] --broadcast--> [所有Agent]
                      进度: 检索中... (10%)
                              ↓
[SearcherAgent] --send--> [Orchestrator]
                      结果: 检索结果列表
                              ↓
[Orchestrator] --send--> [AnalyzerAgent] (多个)
                      任务: 分析内容
                              ↓
[AnalyzerAgent] --send--> [Orchestrator]
                      结果: 结构化分析
                              ↓
                      ... (继续流转)
```

---

## 六、工具服务设计

### 6.1 搜索工具 (SearchTool)

```javascript
{
    name: 'search',
    description: '执行网络搜索',
    parameters: {
        query: { type: 'string', required: true },
        source: { type: 'string', enum: ['web', 'academic', 'news'] },
        limit: { type: 'number', default: 10 }
    },
    execute: async (params) => {
        // 模拟搜索结果
        return {
            results: [
                { title, url, snippet, source, date }
            ],
            total: 10
        };
    }
}
```

### 6.2 解析工具 (ParserTool)

```javascript
{
    name: 'parse_content',
    description: '解析文档内容',
    parameters: {
        content: { type: 'string', required: true },
        format: { type: 'string', enum: ['html', 'text', 'json'] }
    },
    execute: async (params) => {
        return {
            entities: [],
            relations: [],
            keyPoints: [],
            sentiment: 'neutral'
        };
    }
}
```

### 6.3 报告工具 (ReportTool)

```javascript
{
    name: 'generate_report',
    description: '生成研究报告',
    parameters: {
        title: { type: 'string' },
        sections: { type: 'array' },
        format: { type: 'string', enum: ['markdown', 'html', 'pdf'] }
    },
    execute: async (params) => {
        return {
            content: '...',
            metadata: { wordCount, sectionsCount }
        };
    }
}
```

### 6.4 模拟LLM服务 (MockLLMService)

**文件位置**: `src/orchestrator.js` lines 19-217

> **注意**: MockLLMService 是用于演示和测试的模拟服务。在生产环境中，应替换为真实的 LLM API（如 OpenAI、Claude 等）。系统已支持多种 LLM 服务：WebLLM、Ollama、HuggingFace。

#### 职责
- 在没有真实API时提供智能模拟响应
- 便于演示和测试系统功能
- 支持可配置的网络延迟模拟

#### 核心功能
```javascript
class MockLLMService {
    constructor(config = {}) {
        this.delay = config.delay || 1000; // 模拟延迟
    }

    async generate(prompt) {
        await this.sleep(this.delay);
        return this.mockResponse(prompt);
    }
}
```

#### 支持的响应类型

| 响应类型 | 触发条件 | 返回内容 |
|---------|---------|---------|
| 规划响应 | prompt包含"research topic"或"execution plan" | 研究步骤列表 |
| 查询生成 | prompt包含"generate"和"query" | 优化搜索查询 |
| 搜索响应 | prompt包含"search" | 模拟搜索结果 |
| 分析响应 | prompt包含"analyze" | 结构化分析结果 |
| 对比响应 | prompt包含"compare" | 多源对比分析 |
| 报告响应 | prompt包含"report"或"synthesize" | 各章节内容 |
| 评估响应 | prompt包含"evaluate" | 质量评分和改进建议 |

---

## 七、数据结构设计

### 7.1 研究计划

```javascript
{
    id: 'plan_xxx',
    topic: '研究主题',
    createdAt: 1234567890,
    steps: [
        {
            id: 'step_1',
            description: '步骤描述',
            status: 'pending',  // pending, in_progress, completed
            agent: 'SearcherAgent',
            dependencies: []
        }
    ]
}
```

### 7.2 检索结果

```javascript
{
    query: '搜索查询',
    source: 'academic',
    results: [
        {
            id: 'result_1',
            title: '论文标题',
            url: 'https://...',
            authors: ['作者1', '作者2'],
            abstract: '摘要...',
            publishedDate: '2024-01-01',
            source: 'arXiv',
            relevanceScore: 0.95
        }
    ],
    total: 10
}
```

### 7.3 分析结果

```javascript
{
    sourceId: 'result_1',
    analysis: {
        keyPoints: ['要点1', '要点2'],
        entities: [
            { name: '实体', type: 'TECHNOLOGY' }
        ],
        relations: [
            { from: '实体A', to: '实体B', type: 'USES' }
        ],
        claims: [
            { statement: '声明', confidence: 0.8 }
        ],
        summary: '文档摘要...'
    }
}
```

### 7.4 研究报告

```javascript
{
    id: 'report_xxx',
    title: '报告标题',
    topic: '研究主题',
    createdAt: 1234567890,
    sections: [
        {
            id: 'section_1',
            title: '章节标题',
            content: '章节内容...',
            order: 1
        }
    ],
    sources: ['source_1', 'source_2'],
    metadata: {
        wordCount: 5000,
        sectionsCount: 7,
        sourcesCount: 15
    }
}
```

### 7.5 评估结果

```javascript
{
    reportId: 'report_xxx',
    evaluation: {
        overallScore: 8.5,
        dimensions: {
            completeness: { score: 8, comments: '...' },
            accuracy: { score: 9, comments: '...' },
            timeliness: { score: 8, comments: '...' },
            reliability: { score: 9, comments: '...' },
            readability: { score: 8, comments: '...' }
        },
        strengths: ['优势1', '优势2'],
        weaknesses: ['不足1', '不足2'],
        suggestions: ['建议1', '建议2']
    }
}
```

---

## 八、用户界面设计

### 8.1 布局结构

```
┌────────────────────────────────────────────────────────────┐
│                      研究代理系统                            │
├────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────────┐ │
│ │ [研究主题输入]                            [开始研究按钮] │ │
│ └────────────────────────────────────────────────────────┘ │
├────────────────────────────────────────────────────────────┤
│ ┌─────────────┐  ┌──────────────────────────────────────┐ │
│ │   进度面板   │  │          活动日志                    │ │
│ │             │  │  ┌─────────────────────────────────┐ │ │
│ │ ▓▓▓▓▓░░░░░  │  │  │ [10:30] 规划中...              │ │ │
│ │  50%       │  │  │ [10:31] 检索中...              │ │ │
│ │             │  │  │ [10:35] 分析中...              │ │ │
│ │ 当前阶段:    │  │  │ [10:40] 综合中...              │ │ │
│ │ 分析阶段     │  │  │ [10:45] 完成!                 │ │ │
│ └─────────────┘  │  └─────────────────────────────────┘ │ │
│                  └──────────────────────────────────────┘ │
├────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────────┐ │
│ │                   研究结果展示                          │ │
│ │  ┌──────────┐  ┌──────────┐  ┌──────────┐            │ │
│ │  │ 摘要卡片   │  │ 发现卡片   │  │ 结论卡片   │            │ │
│ │  └──────────┘  └──────────┘  └──────────┘            │ │
│ │                                                        │ │
│ │  [展开完整报告]                                         │ │
│ └────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

### 8.2 组件设计

#### 进度指示器
- 显示当前阶段
- 整体进度百分比
- 当前执行的任务

#### 活动日志
- 时间线显示
- Agent活动记录
- 消息交换记录

#### 结果卡片
- 研究摘要
- 关键发现
- 主要结论
- 评分展示

---

## 九、扩展性设计

### 9.1 插件机制

```javascript
// 允许动态添加新Agent
orchestrator.registerAgent('CustomAgent', CustomAgentClass);

// 允许动态添加新工具
toolRegistry.register({
    name: 'custom_tool',
    description: '...',
    execute: async (params) => { ... }
});
```

### 9.2 配置系统

```javascript
const config = {
    llm: {
        provider: 'openai',
        model: 'gpt-4',
        apiKey: '...'
    },
    agents: {
        planner: { maxSteps: 7 },
        searcher: { maxIterations: 5, resultsLimit: 20 },
        analyzer: { parallelCount: 3 }
    },
    tools: {
        search: { sources: ['academic', 'web'] }
    }
};
```

### 9.3 真实API集成

```javascript
// 可轻松替换模拟服务为真实API
const llmService = new OpenAIService({ apiKey: '...' });
const searchService = new TavilySearchService({ apiKey: '...' });
```

---

## 十、性能优化策略

### 10.1 并发处理

```javascript
// 多个Analyzer并行工作
const analyzers = [
    new AnalyzerAgent({ name: 'Analyzer-1' }),
    new AnalyzerAgent({ name: 'Analyzer-2' }),
    new AnalyzerAgent({ name: 'Analyzer-3' })
];

const results = await Promise.all(
    sources.map(source =>
        analyzers[i % analyzers.length].analyze(source)
    )
);
```

### 10.2 缓存机制

```javascript
// LLM响应缓存
class CachedLLM {
    async generate(prompt) {
        const cacheKey = hash(prompt);
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        const result = await this.llm.generate(prompt);
        this.cache.set(cacheKey, result);
        return result;
    }
}
```

### 10.3 批量处理

```javascript
// 批量搜索
async batchSearch(queries) {
    return await Promise.all(
        queries.map(q => searchTool.execute({ query: q }))
    );
}
```

---

## 十一、错误处理

### 11.1 错误类型

```javascript
class AgentError extends Error {
    constructor(agent, message, details) {
        super(message);
        this.agent = agent;
        this.details = details;
    }
}

class ToolError extends Error {
    constructor(tool, params, cause) {
        super(`Tool ${tool} failed with params ${params}`);
        this.tool = tool;
        this.params = params;
        this.cause = cause;
    }
}
```

### 11.2 重试策略

```javascript
async executeWithRetry(fn, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            await sleep(2 ** i * 1000); // 指数退避
        }
    }
}
```

---

## 十二、测试策略

### 12.1 单元测试

```javascript
describe('BaseAgent', () => {
    it('should execute ReAct loop', async () => {
        const agent = new BaseAgent(config);
        const result = await agent.reactLoop('test query');
        expect(result).toBeDefined();
    });
});
```

### 12.2 集成测试

```javascript
describe('ResearchOrchestrator', () => {
    it('should complete full research flow', async () => {
        const result = await orchestrator.conductResearch('test topic');
        expect(result.report).toBeDefined();
        expect(result.evaluation).toBeDefined();
    });
});
```

---

## 十三、部署说明

### 13.1 本地运行

```bash
# 1. 克隆项目
git clone <repo>

# 2. 安装依赖
npm install

# 3. 启动本地服务器
npm start

# 4. 访问
open http://localhost:3000
```

### 13.2 生产部署

```bash
# 构建生产版本
npm run build

# 部署到静态托管
# - GitHub Pages
# - Netlify
# - Vercel
```

---

## 十四、开发路线图

### Phase 1: 框架核心 ✅ COMPLETED
- [x] BaseAgent实现 (src/framework/agent_framework.js)
- [x] MessageBus实现
- [x] ToolRegistry实现
- [x] MemorySystem实现

### Phase 2: 专业Agents ✅ COMPLETED
- [x] PlannerAgent (src/agents/planner_agent.js)
- [x] SearcherAgent (src/agents/searcher_agent.js)
- [x] AnalyzerAgent (src/agents/analyzer_agent.js)
- [x] SynthesizerAgent (src/agents/synthesizer_agent.js)
- [x] EvaluatorAgent (src/agents/evaluator_agent.js)

### Phase 3: 编排器 ✅ COMPLETED
- [x] ResearchOrchestrator (src/orchestrator.js)
- [x] MockLLMService
- [x] 状态管理和进度追踪

### Phase 4: 用户界面 ✅ COMPLETED
- [x] HTML结构、CSS样式、JavaScript交互
- [x] 进度显示和结果展示

### Phase 5: 测试与优化 ✅ COMPLETED
- [x] 单元测试和集成测试
- [x] 多LLM服务支持（WebLLM, Ollama, HuggingFace）
