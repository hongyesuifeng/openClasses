# 研究代理系统 - 核心知识点映射

本文档详细说明《Hello-Agents》课程的核心知识点在研究代理系统中的具体应用。

---

## 一、ReAct范式（推理 + 行动）

### 知识点来源
- **第4章：智能体经典范式构建**

### 核心原理

ReAct = **Re**asoning（推理）+ **Act**ing（行动）

智能体通过循环执行以下步骤来解决问题：

```
1. Thought（思考）: 分析当前情况，决定下一步
2. Action（行动）: 执行具体操作或调用工具
3. Observation（观察）: 观察行动结果
4. 循环重复直到达成目标
```

### 系统中的应用

#### 1. SearcherAgent（检索Agent）

**文件位置**: `src/agents/searcher_agent.js`

**应用场景**: 信息检索迭代优化

**ReAct循环示例**:

```
=== 迭代 1 ===
Thought: 用户想要了解"AI医疗诊断"，我需要先搜索相关的基础信息
Action: search
Action Input: {"query": "AI medical diagnosis overview", "source": "academic"}
Observation: 找到15篇相关论文，但大多是2020年前的，需要最新信息

=== 迭代 2 ===
Thought: 现有信息比较旧，我需要添加时间限定搜索最新研究
Action: search
Action Input: {"query": "AI medical diagnosis 2023 2024", "source": "academic"}
Observation: 找到8篇2023-2024年的高相关性论文

=== 迭代 3 ===
Thought: 我获得了足够的来源信息，现在可以返回结果
Final Answer: 收集到23个相关来源，时间跨度2019-2024年
```

#### 2. 代码实现

**核心方法** (`src/framework/agent_framework.js`):

```javascript
async reactLoop(query, maxIterations = 10) {
    const steps = [];
    let prompt = this.buildReActPrompt(query);

    for (let i = 0; i < maxIterations; i++) {
        // 1. Thought: 生成思考
        const thought = await this.thought(prompt, steps);
        steps.push({ type: 'thought', content: thought });

        // 检查是否完成
        if (this.isFinalAnswer(thought)) {
            return this.extractFinalAnswer(thought);
        }

        // 2. Action: 解析并执行行动
        const action = this.parseAction(thought);
        if (action) {
            // 3. Observation: 执行并观察结果
            const observation = await this.executeAction(action);
            steps.push({ type: 'observation', content: observation });

            // 更新prompt，继续循环
            prompt = this.updatePrompt(prompt, thought, action, observation);
        }
    }
}
```

**Prompt模板**:

```javascript
buildReActPrompt(query) {
    return `
You are a ${this.name} agent.

Available tools:
${this.tools.getToolListString()}

Use the following format:
Thought: [your reasoning process]
Action: [tool name]
Action Input: [tool parameters]

Observation: [tool result]
... (repeat Thought-Action-Observation)

If you have the final answer, use:
Thought: [reasoning]
Final Answer: [your answer]

Question: ${query}

Thought:
`;
}
```

### 学习要点

1. **思考驱动**: 每次行动前都要思考为什么
2. **工具使用**: 通过调用工具获取新信息
3. **迭代优化**: 根据观察结果调整策略
4. **终止判断**: 知道何时可以给出最终答案

---

## 二、Plan-and-Solve范式（规划与解决）

### 知识点来源
- **第4章：智能体经典范式构建**

### 核心原理

将复杂问题分解为两个阶段：

```
Plan阶段: 先制定详细的执行计划
  ↓
Solve阶段: 按计划逐步执行
```

### 系统中的应用

#### 1. PlannerAgent（规划Agent）

**文件位置**: `src/agents/planner_agent.js`

**核心方法**: `createResearchPlan()` - Plan-and-Solve范式的规划阶段

**应用场景**: 研究流程规划

**Plan阶段输出示例**:

```javascript
{
    topic: "人工智能在医疗诊断中的应用",
    steps: [
        "搜索AI医疗诊断的最新研究进展",
        "分析主要的技术方法和应用场景",
        "评估诊断准确性和局限性",
        "识别当前面临的主要挑战",
        "总结未来发展趋势和方向"
    ]
}
```

**Solve阶段执行**:

```javascript
async planAndSolve(query) {
    // Phase 1: Plan - 制定计划
    const plan = await this.makePlan(query);

    // Phase 2: Solve - 执行计划
    const results = [];
    for (let i = 0; i < plan.steps.length; i++) {
        const step = plan.steps[i];
        const result = await this.executeStep(step, query, results);
        results.push({ step, result });
    }

    // 综合结果
    return await this.synthesizeResults(plan, results);
}
```

#### 2. Prompt模板

**Plan阶段**:

```javascript
const planPrompt = `
Given the following research topic, create a detailed execution plan.

Topic: ${query}

Break down the topic into 3-7 specific, executable steps.
Each step should be:
- Clear and specific
- Actionable
- Logically ordered

Format:
1. [Step 1]
2. [Step 2]
...

Plan:
`;
```

**Solve阶段**:

```javascript
const solvePrompt = `
Context:
Original query: ${originalQuery}

Previous steps completed:
${previousResults.map((r, i) => `${i + 1}. ${r.step}: ${r.result}`).join('\n')}

Current step: ${step}

Please execute this step and provide specific results.

Result:
`;
```

### 学习要点

1. **规划优先**: 先想清楚要做什么，再动手
2. **任务分解**: 将复杂问题拆解为可执行的小任务
3. **顺序执行**: 按照计划一步步完成
4. **上下文传递**: 后续步骤可以看到前面步骤的结果

---

## 三、Reflection范式（反思与改进）

### 知识点来源
- **第4章：智能体经典范式构建**

### 核心原理

对结果进行反思和评估，识别不足并提出改进建议：

```
生成结果
  ↓
反思评估
  ↓
识别不足
  ↓
提出改进
  ↓
优化输出
```

### 系统中的应用

#### 1. EvaluatorAgent（评估Agent）

**文件位置**: `src/agents/evaluator_agent.js`

**核心方法**: `reflect()` - Reflection范式的核心实现

**应用场景**: 研究质量评估

**反思流程**:

```javascript
async reflect(result, criteria = null) {
    const reflectionPrompt = this.buildReflectionPrompt(result, criteria);
    const feedback = await this.llm.generate(reflectionPrompt);

    const evaluation = {
        raw: feedback,
        score: this.extractScore(feedback),
        strengths: this.extractStrengths(feedback),
        weaknesses: this.extractWeaknesses(feedback),
        suggestions: this.extractSuggestions(feedback)
    };

    return evaluation;
}
```

**评估维度**:

```javascript
{
    overallScore: 8.5,
    dimensions: {
        completeness: { score: 8, comment: "覆盖了主要方面，但深度可加强" },
        accuracy: { score: 9, comment: "引用准确，事实核查充分" },
        timeliness: { score: 7, comment: "缺少2024年最新研究" },
        reliability: { score: 9, comment: "来源权威，数据可靠" },
        readability: { score: 8, comment: "结构清晰，易于理解" }
    },
    strengths: [
        "信息来源多样且权威",
        "分析维度全面",
        "逻辑结构清晰"
    ],
    weaknesses: [
        "部分数据时效性不足",
        "缺少对新兴技术的讨论"
    ],
    suggestions: [
        "补充2024年最新研究数据",
        "增加对多模态AI的讨论",
        "添加更多实际应用案例"
    ]
}
```

#### 2. Reflection Prompt

```javascript
buildReflectionPrompt(result, criteria) {
    return `
Evaluate the following research result:

${JSON.stringify(result, null, 2)}

${criteria ? `Evaluation criteria: ${criteria}` : ''}

Please provide:

1. Overall Score (1-10)

2. Dimension Scores:
   - Completeness (信息完整性)
   - Accuracy (事实准确性)
   - Timeliness (信息时效性)
   - Reliability (来源可靠性)
   - Readability (可读性)

3. Strengths (至少3个)

4. Weaknesses (至少2个)

5. Suggestions for Improvement (至少3个)

Format your response clearly with sections.
`;
}
```

### 学习要点

1. **质量意识**: 主动评估工作质量
2. **多维度评估**: 从多个角度审视结果
3. **批判思维**: 识别不足和问题
4. **持续改进**: 提出具体改进建议

---

## 四、Agent框架核心组件

### 知识点来源
- **第7章：构建你的Agent框架**

### 4.1 消息系统（MessageBus）

#### 核心原理

实现Agent间通信，支持点对点和广播模式。

#### 系统实现

**文件位置**: `src/framework/agent_framework.js` (lines 33-118)

**核心功能**:

```javascript
class MessageBus {
    // 订阅消息
    subscribe(agentName, callback) {
        if (!this.subscribers.has(agentName)) {
            this.subscribers.set(agentName, new Set());
        }
        this.subscribers.get(agentName).add(callback);
    }

    // 发送点对点消息
    send(from, to, type, content) {
        const message = new Message(from, to, type, content);
        if (this.subscribers.has(to)) {
            this.subscribers.get(to).forEach(cb => cb(message));
        }
        return message;
    }

    // 广播消息
    broadcast(from, type, content) {
        const results = [];
        this.subscribers.forEach((callbacks, receiver) => {
            if (receiver !== from) {
                results.push(this.send(from, receiver, type, content));
            }
        });
        return results;
    }

    // 获取消息历史
    getHistory(agentName, limit) {
        return this.messageHistory.slice(-limit);
    }
}
```

**消息类型**:

```javascript
const MessageType = {
    TEXT: 'text',       // 文本对话
    ACTION: 'action',   // 行动请求
    RESULT: 'result',   // 结果返回
    ERROR: 'error',     // 错误信息
    CONTROL: 'control', // 控制指令
    PROGRESS: 'progress'// 进度更新
};
```

**应用示例**:

```javascript
// Orchestrator协调PlannerAgent
orchestrator.messageBus.send(
    'Orchestrator',
    'PlannerAgent',
    'action',
    { task: 'create_plan', topic: 'AI医疗诊断' }
);

// PlannerAgent返回结果
plannerAgent.sendMessage(
    'Orchestrator',
    'result',
    { plan: {...} }
);

// SearcherAgent广播进度
searcherAgent.broadcast(
    'progress',
    { stage: 'searching', progress: 0.3, message: '正在搜索...' }
);
```

### 学习要点

1. **解耦通信**: Agent间通过消息总线解耦
2. **异步处理**: 消息处理是异步的
3. **历史追踪**: 记录所有消息便于调试
4. **订阅模式**: 使用发布-订阅模式

### 4.2 工具系统（ToolRegistry）

#### 核心原理

管理Agent可用的工具集，提供统一的工具调用接口。

#### 系统实现

**核心功能**:

```javascript
class ToolRegistry {
    // 注册工具
    register(tool) {
        this.tools.set(tool.name, tool);
    }

    // 执行工具
    async execute(name, params) {
        const tool = this.tools.get(name);

        // 参数验证
        this.validateParams(params, tool.parameters);

        // 执行工具
        const result = await tool.execute(params);
        return { success: true, result };
    }

    // 列出工具
    listTools() {
        return Array.from(this.tools.keys());
    }
}
```

**工具定义规范**:

```javascript
const searchTool = {
    name: 'search',
    description: '执行网络搜索获取信息',
    parameters: {
        type: 'object',
        properties: {
            query: {
                type: 'string',
                description: '搜索关键词'
            },
            source: {
                type: 'string',
                enum: ['web', 'academic', 'news'],
                description: '搜索来源类型'
            },
            limit: {
                type: 'number',
                description: '返回结果数量',
                default: 10
            }
        },
        required: ['query']
    },
    execute: async (params) => {
        // 工具实现
        const results = await performSearch(params);
        return results;
    }
};

// 注册工具
toolRegistry.register(searchTool);
```

**应用示例**:

```javascript
// Agent调用工具
const result = await this.tools.execute('search', {
    query: 'AI medical diagnosis',
    source: 'academic',
    limit: 15
});
```

### 学习要点

1. **统一接口**: 所有工具遵循相同接口
2. **参数验证**: 自动验证工具参数
3. **错误处理**: 统一的错误处理机制
4. **可扩展**: 轻松添加新工具

### 4.3 记忆系统（MemorySystem）

#### 核心原理

管理Agent的短期、长期和语义记忆。

#### 系统实现

**记忆类型**:

```javascript
class MemorySystem {
    constructor() {
        this.shortTermMemory = [];     // 对话历史
        this.longTermMemory = [];      // 重要事件
        this.semanticMemory = new Map(); // 知识图谱
    }

    // 添加短期记忆
    addShortTerm(content, metadata) {
        this.shortTermMemory.push({
            content,
            timestamp: Date.now(),
            metadata
        });
    }

    // 添加长期记忆
    addLongTerm(content, importance, metadata) {
        this.longTermMemory.push({
            content,
            importance,      // 重要性评分
            timestamp: Date.now(),
            accessCount: 0   // 访问次数
        });
    }

    // 添加语义记忆（知识图谱）
    addSemantic(entity, relations) {
        this.semanticMemory.set(entity, {
            name: entity,
            relations: relations
        });
    }

    // 检索记忆
    retrieveShortTerm(limit) {
        return this.shortTermMemory.slice(-limit);
    }

    retrieveLongTerm(query, limit) {
        let memories = this.longTermMemory;
        if (query) {
            memories = memories.filter(m =>
                JSON.stringify(m.content).includes(query)
            );
        }
        // 按重要性和访问次数排序
        return memories.sort((a, b) =>
            (b.importance + b.accessCount * 0.1) -
            (a.importance + a.accessCount * 0.1)
        ).slice(0, limit);
    }

    // 获取上下文（用于Prompt）
    getContext(maxTokens) {
        return {
            recent: this.retrieveShortTerm(5),
            relevant: this.retrieveLongTerm(null, 3)
        };
    }
}
```

**应用示例**:

```javascript
// Agent保存检索结果到记忆
this.memory.addLongTerm({
    type: 'search_result',
    query: 'AI medical diagnosis',
    results: searchResults
}, importance = 0.8);

// 添加知识图谱节点
this.memory.addSemantic('深度学习', {
    '应用于': ['医疗诊断', '影像分析'],
    '优势': ['高准确率', '自动化'],
    '挑战': ['数据需求', '可解释性']
});

// 检索相关记忆
const context = this.memory.getContext(2000);
```

### 学习要点

1. **记忆分层**: 短期、长期、语义三类记忆
2. **重要性评分**: 长期记忆按重要性排序
3. **访问计数**: 记录记忆访问频率
4. **上下文构建**: 自动构建Prompt上下文

---

## 五、多智能体协作

### 知识点来源
- **第7章：构建你的Agent框架**
- **第13章：智能旅行助手**

### 核心原理

多个专业Agent协同工作，每个Agent负责特定任务。

### 协作模式

#### 层次式协作（研究代理采用）

```
        Orchestrator (编排器)
              ↓
    ┌─────────┼─────────┐
    ↓         ↓         ↓
Planner   Searcher   Analyzer
    ↓         ↓         ↓
    └─────────┼─────────┘
              ↓
       Synthesizer
              ↓
         Evaluator
```

### 系统实现

#### ResearchOrchestrator（研究编排器）

**文件位置**: `src/orchestrator.js` (lines 223-535)

**核心方法**: `conductResearch()` - 完整研究流程编排

**核心流程**:

```javascript
class ResearchOrchestrator {
    async conductResearch(topic, config) {
        // 阶段1: 规划
        this.emitProgress('planning', '创建研究计划...');
        const plan = await this.planner.planAndSolve(topic);

        // 阶段2: 检索
        this.emitProgress('searching', '执行信息检索...');
        const sources = await Promise.all(
            plan.queries.map(query =>
                this.searcher.reactLoop(query)
            )
        );

        // 阶段3: 分析（并行）
        this.emitProgress('analyzing', '分析内容...');
        const analyzers = [
            new AnalyzerAgent({ name: 'Analyzer-1' }),
            new AnalyzerAgent({ name: 'Analyzer-2' }),
            new AnalyzerAgent({ name: 'Analyzer-3' })
        ];
        const analyses = await Promise.all(
            sources.map((source, i) =>
                analyzers[i % analyzers.length].analyze(source)
            )
        );

        // 阶段4: 综合
        this.emitProgress('synthesizing', '整合研究结果...');
        const report = await this.synthesizer.generate(analyses);

        // 阶段5: 评估
        this.emitProgress('evaluating', '评估研究质量...');
        const evaluation = await this.evaluator.reflect(report);

        return { report, evaluation };
    }
}
```

**消息流转**:

```javascript
// 1. Orchestrator → Planner
this.messageBus.send(
    'Orchestrator',
    'PlannerAgent',
    'action',
    { task: 'create_plan', topic }
);

// 2. Planner → Orchestrator
// Planner通过sendMessage返回结果

// 3. Orchestrator → Searcher
plan.queries.forEach((query, i) => {
    this.messageBus.send(
        'Orchestrator',
        'SearcherAgent',
        'action',
        { task: 'search', query, index: i }
    );
});

// 4. Searcher广播进度
this.messageBus.broadcast(
    'SearcherAgent',
    'progress',
    { stage: 'searching', progress: 0.5 }
);

// ... 继续流转
```

### 学习要点

1. **专业分工**: 每个Agent专注特定领域
2. **编排协调**: Orchestrator统一调度
3. **并行处理**: 多个Analyzer并行工作
4. **消息传递**: 通过MessageBus通信
5. **进度追踪**: 实时反馈执行进度

---

## 六、提示工程（Prompt Engineering）

### 知识点来源
- **第3章：大语言模型基础**
- **第14章：研究代理**

### 系统中的应用

#### 1. 角色设定

```javascript
const rolePrompt = `
You are a professional Research Agent with expertise in:
- Information retrieval from multiple sources
- Critical analysis of academic literature
- Knowledge synthesis and integration
- Clear and structured report writing

Your goal is to help users conduct thorough research on any topic.
`;
```

#### 2. 任务描述

```javascript
const taskPrompt = `
Your task is to conduct comprehensive research on: ${topic}

Requirements:
1. Gather information from diverse, reliable sources
2. Analyze and extract key insights
3. Identify patterns and contradictions
4. Synthesize findings into a coherent report
5. Provide proper citations and references
`;
```

#### 3. 输出格式

```javascript
const formatPrompt = `
Output Format:

## Research Report: ${title}

### Executive Summary
[2-3 sentence overview]

### Background
[Context and importance]

### Key Findings
1. [Finding 1 with supporting evidence]
2. [Finding 2 with supporting evidence]
...

### Analysis
[Detailed analysis of findings]

### Conclusions
[Main conclusions and implications]

### References
[All sources cited]
`;
```

#### 4. Few-Shot示例

```javascript
const fewShotPrompt = `
Example Research Process:

Topic: "量子计算的应用"

Plan:
1. 搜索量子计算基础概念
2. 搜索量子计算在密码学的应用
3. 搜索量子计算在药物研发的应用
4. 搜索量子计算的当前挑战

Execution:
- Step 1: Found 15 sources on quantum computing basics
- Step 2: Found 8 sources on quantum cryptography
- Step 3: Found 6 sources on quantum drug discovery
- Step 4: Found 10 sources on current challenges

Report:
[Generated report following the format]

Now, conduct research on: ${topic}
`;
```

### 学习要点

1. **角色清晰**: 明确Agent的角色定位
2. **任务具体**: 清晰描述需要完成的任务
3. **格式规范**: 明确输出格式要求
4. **示例引导**: 使用Few-Shot提升效果

---

## 七、学习检查清单

完成研究代理系统学习后，你应该能够：

### Agent框架
- [x] 理解Agent基类的核心功能 (`BaseAgent` class, lines 375-820)
- [x] 掌握MessageBus的实现原理 (lines 33-118)
- [x] 能够使用ToolRegistry管理工具 (lines 124-231)
- [x] 理解MemorySystem的记忆分层 (lines 237-369)

### 三大范式
- [x] 能够实现ReAct循环 (`reactLoop()` method)
- [x] 能够实现Plan-and-Solve流程 (`planner_agent.js`)
- [x] 能够实现Reflection评估 (`evaluator_agent.js`)
- [x] 知道何时使用哪种范式

### 多智能体协作
- [x] 理解层次式协作模式
- [x] 能够设计Agent间的消息流
- [x] 能够实现Orchestrator编排器 (`orchestrator.js`)
- [x] 能够实现并行Agent协作

### 提示工程
- [x] 能够设计有效的角色设定
- [x] 能够构建清晰的任务描述
- [x] 能够规范输出格式
- [x] 能够使用Few-Shot提升效果

### 实践能力
- [x] 能够独立实现简单Agent
- [x] 能够扩展现有Agent功能
- [x] 能够调试Agent交互问题
- [x] 能够评估Agent性能质量

### 已验证功能 ✅

以下功能已在实际代码中验证通过：

- [x] 完整研究流程可正常运行（规划→检索→分析→综合→评估）
- [x] 前端界面功能完整（进度显示、日志输出、结果展示）
- [x] 多LLM服务支持（WebLLM、Ollama、HuggingFace）
- [x] 进度追踪和日志记录系统
- [x] 消息系统点对点和广播通信
- [x] 工具注册和执行验证
- [x] 记忆系统的三种类型存储
