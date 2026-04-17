# 研究代理系统 (Research Agent System)

基于《Hello-Agents》课程核心知识点实现的完整研究代理系统，通过HTML交互界面展示智能体的核心能力。

## 📚 课程核心知识点

本系统完整实现了以下课程核心知识点：

### 1. ReAct范式（推理+行动）
- **应用位置**: `SearcherAgent`
- **实现方式**: 推理(Thought) → 行动(Action) → 观察(Observation) 循环
- **代码文件**: `src/framework/agent_framework.js` (reactLoop方法)

### 2. Plan-and-Solve范式（规划与解决）
- **应用位置**: `PlannerAgent`
- **实现方式**: 先制定详细计划(Plan)，再按计划执行(Solve)
- **代码文件**: `src/agents/planner_agent.js`

### 3. Reflection范式（反思与改进）
- **应用位置**: `EvaluatorAgent`
- **实现方式**: 对结果进行反思评估，识别不足并给出改进建议
- **代码文件**: `src/agents/evaluator_agent.js`

### 4. Agent框架核心组件
- **消息系统 (MessageBus)**: Agent间通信机制
- **工具系统 (ToolRegistry)**: 管理和执行工具调用
- **记忆系统 (MemorySystem)**: 短期、长期、语义记忆管理
- **代码文件**: `src/framework/agent_framework.js`

### 5. 多智能体协作
- **协作模式**: 层次式协作（Orchestrator协调多个专业Agent）
- **代码文件**: `src/orchestrator.js`

## 🏗️ 系统架构

```
用户界面 (HTML)
      ↓
研究编排器 (Orchestrator)
      ↓
┌─────────┬─────────┬─────────┬─────────┬─────────┐
│Planner  │Searcher │Analyzer │Synthesizer│Evaluator│
│  Agent  │  Agent  │  Agent  │   Agent  │  Agent  │
└─────────┴─────────┴─────────┴─────────┴─────────┘
      ↓
Agent框架核心 (MessageBus + ToolRegistry + MemorySystem)
      ↓
工具服务 (Search + Parser + Report)
```

## 📁 项目结构

```
claudeImplement/
├── docs/                           # 文档目录
│   ├── IMPLEMENTATION_PLAN.md      # 实现方案
│   ├── ARCHITECTURE.md             # 技术架构
│   └── KNOWLEDGE_POINTS.md         # 核心知识点映射
│
├── src/                            # 源代码目录
│   ├── framework/                  # Agent框架核心
│   │   └── agent_framework.js      # BaseAgent + MessageBus + ToolRegistry + MemorySystem
│   │
│   ├── agents/                     # 专业Agent
│   │   ├── planner_agent.js        # 规划Agent (Plan-and-Solve)
│   │   ├── searcher_agent.js       # 检索Agent (ReAct)
│   │   ├── analyzer_agent.js       # 分析Agent
│   │   ├── synthesizer_agent.js    # 综合Agent
│   │   └── evaluator_agent.js      # 评估Agent (Reflection)
│   │
│   └── orchestrator.js             # 研究编排器
│
├── static/                         # 静态文件目录
│   ├── index.html                  # 主界面
│   ├── css/
│   │   └── style.css               # 样式文件
│   └── js/
│       └── app.js                  # 应用入口
│
└── README.md                       # 本文件
```

## 🚀 快速开始

### 本地运行

1. **使用HTTP服务器**

   由于ES6模块需要HTTP协议，需要启动本地服务器：

   ```bash
   # 使用Python
   cd claudeImplement/static
   python -m http.server 8000

   # 或使用Node.js
   npx http-server -p 8000

   # 或使用PHP
   php -S localhost:8000
   ```

2. **访问应用**

   打开浏览器访问: `http://localhost:8000`

### 基本使用

1. 在文本框中输入研究主题，例如：
   - 人工智能在医疗诊断中的应用
   - 量子计算的发展现状
   - 区块链技术在金融领域的应用

2. 点击"开始研究"按钮

3. 观察研究进度：
   - 规划阶段：制定研究计划
   - 检索阶段：多源信息检索
   - 分析阶段：内容分析
   - 综合阶段：报告生成
   - 评估阶段：质量评估

4. 查看研究结果：
   - 研究摘要
   - 统计信息
   - 主要发现
   - 质量评估
   - 完整报告

## 💡 核心功能

### 1. 智能规划
- 自动将研究主题分解为可执行步骤
- 为每个步骤生成优化的搜索查询
- 支持多种数据源（学术、网页、新闻）

### 2. 迭代检索
- 使用ReAct循环优化检索策略
- 根据初步结果调整查询
- 去重和相关性排序

### 3. 深度分析
- 提取关键信息和观点
- 识别实体和关系
- 多来源对比分析

### 4. 报告生成
- 结构化章节组织
- Markdown/HTML格式导出
- 完整的参考文献

### 5. 质量评估
- 多维度质量评分
- 识别优势和不足
- 提供改进建议

## 🎓 学习要点

通过本系统，你可以学习：

1. **如何实现ReAct循环**
   - 查看 `SearcherAgent.reactLoop()` 方法

2. **如何实现Plan-and-Solve**
   - 查看 `PlannerAgent.planAndSolve()` 方法

3. **如何实现Reflection评估**
   - 查看 `EvaluatorAgent.reflect()` 方法

4. **如何构建消息系统**
   - 查看 `MessageBus` 类

5. **如何实现工具系统**
   - 查看 `ToolRegistry` 类

6. **如何管理记忆**
   - 查看 `MemorySystem` 类

7. **如何协调多Agent**
   - 查看 `ResearchOrchestrator` 类

## 🔧 扩展开发

### 添加新Agent

```javascript
import { BaseAgent } from './framework/agent_framework.js';

export class CustomAgent extends BaseAgent {
    constructor(config) {
        super({
            name: 'CustomAgent',
            ...config
        });
    }

    async execute(task) {
        // 实现你的Agent逻辑
        return await this.reactLoop(task);
    }
}
```

### 添加新工具

```javascript
// 在orchestrator.js中注册
this.toolRegistry.register({
    name: 'my_tool',
    description: '工具描述',
    parameters: {
        type: 'object',
        properties: {
            param1: { type: 'string' }
        },
        required: ['param1']
    },
    execute: async (params) => {
        // 工具实现
        return result;
    }
});
```

### 连接真实LLM API

替换 `MockLLMService` 为真实API：

```javascript
import { OpenAI } from 'openai';

const llm = new OpenAI({ apiKey: 'your-api-key' });

const response = await llm.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }]
});
```

## 📖 技术文档

- [实现方案](./docs/IMPLEMENTATION_PLAN.md)
- [技术架构](./docs/ARCHITECTURE.md)
- [核心知识点映射](./docs/KNOWLEDGE_POINTS.md)

## 🛠️ 技术栈

- **前端**: HTML5, CSS3, JavaScript ES6+
- **框架**: 自研Agent框架
- **模块**: ES6 Modules
- **构建**: 无需构建工具，直接运行

## 📝 许可证

本项目仅用于学习目的。

## 🙏 致谢

基于《Hello-Agents》课程内容实现，感谢课程作者的贡献。

---

**开始你的Agent学习之旅吧！** 🚀
