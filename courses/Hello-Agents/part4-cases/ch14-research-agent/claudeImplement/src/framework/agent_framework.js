/**
 * Agent框架核心模块
 *
 * 实现Agent基类和核心范式：
 * 1. ReAct范式：推理(Reasoning) + 行动(Acting)
 * 2. Plan-and-Solve范式：规划 + 执行
 * 3. Reflection范式：反思和改进
 */

/**
 * 消息类 - Agent间通信的基本单位
 */
class Message {
    constructor(sender, receiver, type, content, metadata = {}) {
        this.id = this.generateId();
        this.sender = sender;
        this.receiver = receiver;
        this.type = type; // 'text', 'action', 'result', 'error', 'control'
        this.content = content;
        this.timestamp = Date.now();
        this.metadata = metadata;
    }

    generateId() {
        return 'msg_' + Math.random().toString(36).substr(2, 9);
    }
}

/**
 * 消息总线 - Agent间通信系统
 * 实现发布-订阅模式，支持点对点和广播通信
 */
class MessageBus {
    constructor() {
        this.subscribers = new Map(); // agentName -> Set of callbacks
        this.messageHistory = [];     // 消息历史记录
        this.maxHistory = 1000;       // 最大历史记录数
    }

    /**
     * 订阅消息
     * @param {string} agentName - 订阅者名称
     * @param {Function} callback - 消息处理回调
     */
    subscribe(agentName, callback) {
        if (!this.subscribers.has(agentName)) {
            this.subscribers.set(agentName, new Set());
        }
        this.subscribers.get(agentName).add(callback);
    }

    /**
     * 取消订阅
     */
    unsubscribe(agentName, callback) {
        if (this.subscribers.has(agentName)) {
            this.subscribers.get(agentName).delete(callback);
        }
    }

    /**
     * 发送点对点消息
     */
    send(from, to, type, content, metadata = {}) {
        const message = new Message(from, to, type, content, metadata);
        this.recordMessage(message);

        // 通知接收者
        if (this.subscribers.has(to)) {
            this.subscribers.get(to).forEach(callback => {
                try {
                    callback(message);
                } catch (error) {
                    console.error(`Error in ${to} message handler:`, error);
                }
            });
        }

        return message;
    }

    /**
     * 广播消息给所有订阅者
     */
    broadcast(from, type, content, metadata = {}) {
        const results = [];
        this.subscribers.forEach((callbacks, receiver) => {
            if (receiver !== from) { // 不发送给自己
                const msg = this.send(from, receiver, type, content, metadata);
                results.push(msg);
            }
        });
        return results;
    }

    /**
     * 记录消息历史
     */
    recordMessage(message) {
        this.messageHistory.push(message);
        if (this.messageHistory.length > this.maxHistory) {
            this.messageHistory.shift();
        }
    }

    /**
     * 获取消息历史
     */
    getHistory(agentName = null, limit = 50) {
        let history = this.messageHistory;
        if (agentName) {
            history = history.filter(m =>
                m.sender === agentName || m.receiver === agentName
            );
        }
        return history.slice(-limit);
    }
}

/**
 * 工具注册系统
 * 管理Agent可用的工具集
 */
class ToolRegistry {
    constructor() {
        this.tools = new Map();
    }

    /**
     * 注册工具
     * @param {Object} tool - 工具对象 {name, description, parameters, execute}
     */
    register(tool) {
        if (!tool.name || typeof tool.execute !== 'function') {
            throw new Error('Tool must have name and execute function');
        }
        this.tools.set(tool.name, tool);
        console.log(`Tool registered: ${tool.name}`);
    }

    /**
     * 批量注册工具
     */
    registerAll(tools) {
        tools.forEach(tool => this.register(tool));
    }

    /**
     * 执行工具
     */
    async execute(name, params) {
        if (!this.tools.has(name)) {
            throw new Error(`Tool not found: ${name}`);
        }

        const tool = this.tools.get(name);

        // 参数验证
        if (tool.parameters) {
            this.validateParams(params, tool.parameters);
        }

        // 执行工具
        try {
            const result = await tool.execute(params);
            return {
                success: true,
                result: result,
                tool: name
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                tool: name
            };
        }
    }

    /**
     * 参数验证
     */
    validateParams(params, schema) {
        if (schema.required) {
            schema.required.forEach(param => {
                if (!(param in params)) {
                    throw new Error(`Missing required parameter: ${param}`);
                }
            });
        }
    }

    /**
     * 获取工具描述
     */
    getToolDescription(name) {
        if (!this.tools.has(name)) {
            return null;
        }
        const tool = this.tools.get(name);
        return {
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters
        };
    }

    /**
     * 列出所有工具
     */
    listTools() {
        return Array.from(this.tools.keys()).map(name => ({
            name,
            ...this.getToolDescription(name)
        }));
    }

    /**
     * 生成工具列表字符串（用于Prompt）
     */
    getToolListString() {
        const tools = this.listTools();
        return tools.map(tool => {
            let desc = `- ${tool.name}: ${tool.description}`;
            if (tool.parameters) {
                desc += `\n  Parameters: ${JSON.stringify(tool.parameters)}`;
            }
            return desc;
        }).join('\n');
    }
}

/**
 * 记忆系统
 * 管理Agent的短期、长期和语义记忆
 */
class MemorySystem {
    constructor(config = {}) {
        this.shortTermMemory = [];     // 对话历史、近期上下文
        this.longTermMemory = [];      // 重要事件、知识
        this.semanticMemory = new Map(); // 知识图谱、实体关系

        this.shortTermLimit = config.shortTermLimit || 100;
        this.longTermLimit = config.longTermLimit || 1000;
    }

    /**
     * 添加短期记忆
     */
    addShortTerm(content, metadata = {}) {
        this.shortTermMemory.push({
            content,
            timestamp: Date.now(),
            metadata
        });
        this.limitMemory(this.shortTermMemory, this.shortTermLimit);
    }

    /**
     * 添加长期记忆
     */
    addLongTerm(content, importance = 0.5, metadata = {}) {
        this.longTermMemory.push({
            content,
            importance,
            timestamp: Date.now(),
            metadata,
            accessCount: 0
        });
        this.limitMemory(this.longTermMemory, this.longTermLimit);
    }

    /**
     * 添加语义记忆（知识图谱节点）
     */
    addSemantic(entity, relations = {}) {
        if (!this.semanticMemory.has(entity)) {
            this.semanticMemory.set(entity, {
                name: entity,
                relations: {},
                embeddings: null
            });
        }
        const node = this.semanticMemory.get(entity);
        Object.assign(node.relations, relations);
    }

    /**
     * 检索短期记忆
     */
    retrieveShortTerm(limit = 10) {
        return this.shortTermMemory.slice(-limit);
    }

    /**
     * 检索长期记忆
     */
    retrieveLongTerm(query = null, limit = 20) {
        let memories = this.longTermMemory;

        // 简单的相关性检索
        if (query) {
            memories = memories.filter(m => {
                const content = JSON.stringify(m.content).toLowerCase();
                return content.includes(query.toLowerCase());
            });
        }

        // 按重要性和访问次数排序
        memories.sort((a, b) => {
            const scoreA = a.importance + a.accessCount * 0.1;
            const scoreB = b.importance + b.accessCount * 0.1;
            return scoreB - scoreA;
        });

        // 更新访问计数
        memories.slice(0, limit).forEach(m => m.accessCount++);

        return memories.slice(0, limit);
    }

    /**
     * 检索语义记忆
     */
    retrieveSemantic(entity) {
        return this.semanticMemory.get(entity);
    }

    /**
     * 获取上下文（用于Prompt）
     */
    getContext(maxTokens = 2000) {
        const context = {
            recent: this.retrieveShortTerm(5),
            relevant: this.retrieveLongTerm(null, 3)
        };
        return context;
    }

    /**
     * 记忆限制
     */
    limitMemory(memory, limit) {
        while (memory.length > limit) {
            // 移除最旧的或不重要的记忆
            memory.shift();
        }
    }

    /**
     * 清空记忆
     */
    clear() {
        this.shortTermMemory = [];
        this.longTermMemory = [];
        this.semanticMemory.clear();
    }

    /**
     * 导出记忆
     */
    export() {
        return {
            shortTerm: this.shortTermMemory,
            longTerm: this.longTermMemory,
            semantic: Array.from(this.semanticMemory.entries())
        };
    }
}

/**
 * 基础Agent类
 * 实现Agent的核心功能：ReAct循环、Plan-and-Solve、Reflection
 */
class BaseAgent {
    constructor(config) {
        this.name = config.name || 'Agent';
        this.llm = config.llm;           // LLM客户端
        this.tools = config.tools || new ToolRegistry();
        this.memory = config.memory || new MemorySystem();
        this.messageBus = config.messageBus;

        // Agent状态
        this.status = 'idle'; // idle, thinking, acting, done
        this.currentTask = null;

        // 注册到消息总线
        if (this.messageBus) {
            this.messageBus.subscribe(this.name, (msg) => this.receiveMessage(msg));
        }
    }

    /**
     * ReAct范式：推理 + 行动循环
     * @param {string} query - 用户查询
     * @param {number} maxIterations - 最大迭代次数
     */
    async reactLoop(query, maxIterations = 10) {
        this.status = 'thinking';
        const steps = [];

        let prompt = this.buildReActPrompt(query);

        for (let i = 0; i < maxIterations; i++) {
            // 1. Thought: LLM生成思考
            const thought = await this.thought(prompt, steps);
            steps.push({ type: 'thought', content: thought });
            this.emitProgress('thought', thought);

            // 检查是否完成
            if (this.isFinalAnswer(thought)) {
                this.status = 'done';
                return this.extractFinalAnswer(thought);
            }

            // 2. Action: 解析并执行行动
            const action = this.parseAction(thought);
            if (action) {
                this.status = 'acting';
                steps.push({ type: 'action', content: action });
                this.emitProgress('action', action);

                // 3. Observation: 执行工具并观察结果
                const observation = await this.executeAction(action);
                steps.push({ type: 'observation', content: observation });
                this.emitProgress('observation', observation);

                // 更新prompt
                prompt = this.updatePrompt(prompt, thought, action, observation);
            }
        }

        this.status = 'done';
        return this.extractFinalAnswer(steps[steps.length - 1].content);
    }

    /**
     * Plan-and-Solve范式：先规划，后执行
     * @param {string} query - 用户查询
     */
    async planAndSolve(query) {
        // Phase 1: Plan - 制定计划
        this.emitProgress('planning', 'Creating research plan...');
        const plan = await this.makePlan(query);
        this.emitProgress('plan', plan);

        // Phase 2: Solve - 执行计划
        const results = [];
        for (let i = 0; i < plan.steps.length; i++) {
            const step = plan.steps[i];
            this.emitProgress('executing', `Step ${i + 1}/${plan.steps.length}: ${step}`);

            const result = await this.executeStep(step, query, results);
            results.push({ step, result });
            this.emitProgress('step_result', { step, result });
        }

        // 综合结果
        const finalResult = await this.synthesizeResults(plan, results);
        return finalResult;
    }

    /**
     * Reflection范式：反思和改进
     * @param {any} result - 需要评估的结果
     * @param {string} criteria - 评估标准
     */
    async reflect(result, criteria = null) {
        this.status = 'reflecting';

        const reflectionPrompt = this.buildReflectionPrompt(result, criteria);
        const feedback = await this.llm.generate(reflectionPrompt);

        const evaluation = this.parseReflection(feedback);

        this.status = 'done';
        return evaluation;
    }

    /**
     * Thought: 生成思考
     */
    async thought(prompt, history) {
        const response = await this.llm.generate(prompt);
        return response;
    }

    /**
     * 制定计划
     */
    async makePlan(query) {
        const prompt = `
Given the following research topic, create a detailed execution plan.

Topic: ${query}

Break down the topic into 3-7 specific, executable steps.
Each step should be clear and actionable.

Format:
1. [Step 1]
2. [Step 2]
...

Plan:
`;

        const response = await this.llm.generate(prompt);
        const steps = this.parsePlan(response);

        return { topic: query, steps };
    }

    /**
     * 执行单个步骤
     */
    async executeStep(step, originalQuery, previousResults) {
        const prompt = `
Context:
Original query: ${originalQuery}

Previous steps completed:
${previousResults.map((r, i) => `${i + 1}. ${r.step}: ${JSON.stringify(r.result)}`).join('\n')}

Current step: ${step}

Please execute this step and provide specific results.
If you need to use tools, specify which tool and parameters.

Result:
`;

        const response = await this.llm.generate(prompt);

        // 检查是否需要调用工具
        const toolCall = this.parseToolCall(response);
        if (toolCall) {
            return await this.tools.execute(toolCall.name, toolCall.params);
        }

        return response;
    }

    /**
     * 综合结果
     */
    async synthesizeResults(plan, results) {
        const prompt = `
Based on the following research plan and execution results, generate a comprehensive summary.

Plan: ${plan.topic}
Steps: ${plan.steps.join(', ')}

Results:
${results.map((r, i) => `${i + 1}. ${r.step}: ${JSON.stringify(r.result)}`).join('\n')}

Provide a comprehensive summary that integrates all findings.
`;

        return await this.llm.generate(prompt);
    }

    /**
     * 解析并执行行动
     */
    async executeAction(action) {
        try {
            return await this.tools.execute(action.tool, action.params);
        } catch (error) {
            return { error: error.message };
        }
    }

    /**
     * 解析行动
     */
    parseAction(text) {
        // 解析格式: Action: tool_name(params)
        const actionMatch = text.match(/Action:\s*(\w+)(?:\((.*)\))?/);
        if (actionMatch) {
            const tool = actionMatch[1];
            let params = {};
            if (actionMatch[2]) {
                try {
                    params = JSON.parse(actionMatch[2]);
                } catch (e) {
                    params = { input: actionMatch[2] };
                }
            }
            return { tool, params };
        }
        return null;
    }

    /**
     * 解析工具调用
     */
    parseToolCall(text) {
        // 查找工具调用模式
        const patterns = [
            /use\s+(\w+):\s*(\{.*?\})/i,
            /tool:\s*(\w+),\s*params:\s*(\{.*?\})/i,
            /call\s+(\w+)\s+with\s+(.+)/i
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                try {
                    return {
                        name: match[1],
                        params: JSON.parse(match[2])
                    };
                } catch (e) {
                    return {
                        name: match[1],
                        params: { input: match[2] || '' }
                    };
                }
            }
        }
        return null;
    }

    /**
     * 检查是否是最终答案
     */
    isFinalAnswer(text) {
        return /final answer|answer:|结论/i.test(text);
    }

    /**
     * 提取最终答案
     */
    extractFinalAnswer(text) {
        const match = text.match(/(?:final answer|answer|结论):\s*(.+)/is);
        return match ? match[1].trim() : text;
    }

    /**
     * 解析计划
     */
    parsePlan(text) {
        const lines = text.split('\n');
        const steps = [];
        const stepRegex = /^\d+\.?\s+(.+)/;

        for (const line of lines) {
            const match = line.match(stepRegex);
            if (match) {
                steps.push(match[1].trim());
            }
        }

        return steps.length > 0 ? steps : [text];
    }

    /**
     * 解析反思结果
     */
    parseReflection(feedback) {
        return {
            raw: feedback,
            score: this.extractScore(feedback),
            suggestions: this.extractSuggestions(feedback)
        };
    }

    extractScore(text) {
        const match = text.match(/score|rating:\s*(\d+)/i);
        return match ? parseInt(match[1]) : null;
    }

    extractSuggestions(text) {
        // 简单提取建议列表
        const suggestions = [];
        const lines = text.split('\n');
        let inSuggestions = false;

        for (const line of lines) {
            if (/suggestion|improvement/i.test(line)) {
                inSuggestions = true;
            }
            if (inSuggestions && /^\s*[-*]\s*(.+)/.test(line)) {
                suggestions.push(line.replace(/^\s*[-*]\s*/, '').trim());
            }
        }

        return suggestions;
    }

    /**
     * 构建ReAct Prompt
     */
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

    /**
     * 更新Prompt
     */
    updatePrompt(prompt, thought, action, observation) {
        return prompt + `
Thought: ${thought}
Action: ${action.tool}
Action Input: ${JSON.stringify(action.params)}
Observation: ${JSON.stringify(observation)}

Thought:
`;
    }

    /**
     * 构建反思Prompt
     */
    buildReflectionPrompt(result, criteria) {
        return `
Evaluate the following result:

${JSON.stringify(result, null, 2)}

${criteria ? `Evaluation criteria: ${criteria}` : ''}

Provide:
1. Score (1-10)
2. Strengths
3. Weaknesses
4. Suggestions for improvement
`;
    }

    /**
     * 接收消息
     */
    async receiveMessage(message) {
        this.memory.addShortTerm(message.content, {
            from: message.sender,
            type: message.type
        });

        // 子类可以重写此方法来处理特定消息
    }

    /**
     * 发送消息
     */
    sendMessage(to, type, content, metadata = {}) {
        if (this.messageBus) {
            return this.messageBus.send(this.name, to, type, content, metadata);
        }
    }

    /**
     * 广播消息
     */
    broadcast(type, content, metadata = {}) {
        if (this.messageBus) {
            return this.messageBus.broadcast(this.name, type, content, metadata);
        }
    }

    /**
     * 发射进度事件
     */
    emitProgress(type, data) {
        // 可以被监听器捕获
        if (this._progressCallback) {
            this._progressCallback(type, data);
        }
    }

    /**
     * 设置进度回调
     */
    setProgressCallback(callback) {
        this._progressCallback = callback;
    }

    /**
     * 获取状态
     */
    getState() {
        return {
            name: this.name,
            status: this.status,
            memory: this.memory.export(),
            tools: this.tools.listTools()
        };
    }
}

// 导出所有核心类
export {
    Message,
    MessageBus,
    ToolRegistry,
    MemorySystem,
    BaseAgent
};
