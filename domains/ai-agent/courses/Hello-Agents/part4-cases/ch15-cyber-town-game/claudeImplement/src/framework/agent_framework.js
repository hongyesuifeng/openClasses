/**
 * Agent框架核心模块 - 赛博小镇版
 *
 * 实现Agent基类和核心范式：
 * 1. ReAct范式：推理(Reasoning) + 行动(Acting)
 * 2. 记忆系统：短期、长期、语义记忆
 * 3. 消息系统：Agent间通信
 *
 * 知识点映射：
 * - 第4章：ReAct范式
 * - 第7章：多Agent协作
 * - 第8章：记忆系统
 */

/**
 * 消息类 - Agent间通信的基本单位
 */
class Message {
    constructor(sender, receiver, type, content, metadata = {}) {
        this.id = this.generateId();
        this.sender = sender;
        this.receiver = receiver;
        this.type = type; // 'text', 'action', 'event', 'social', 'control'
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
 *
 * 知识点：多Agent协作的通信机制
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

    /**
     * 清空历史
     */
    clearHistory() {
        this.messageHistory = [];
    }
}

/**
 * 工具注册系统
 * 管理Agent可用的行为/动作集
 */
class ToolRegistry {
    constructor() {
        this.tools = new Map();
    }

    /**
     * 注册工具/行为
     * @param {Object} tool - 工具对象 {name, description, parameters, execute}
     */
    register(tool) {
        if (!tool.name || typeof tool.execute !== 'function') {
            throw new Error('Tool must have name and execute function');
        }
        this.tools.set(tool.name, tool);
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
            return {
                success: false,
                error: `Tool not found: ${name}`,
                tool: name
            };
        }

        const tool = this.tools.get(name);

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
            if (tool.parameters && tool.parameters.required) {
                desc += `\n  Parameters: ${tool.parameters.required.join(', ')}`;
            }
            return desc;
        }).join('\n');
    }
}

/**
 * 记忆系统
 * 管理Agent的短期、长期和语义记忆
 *
 * 知识点：第8章 记忆系统
 */
class MemorySystem {
    constructor(config = {}) {
        this.shortTermMemory = [];     // 对话历史、近期上下文
        this.longTermMemory = [];      // 重要事件、知识
        this.semanticMemory = new Map(); // 知识图谱、实体关系

        this.shortTermLimit = config.shortTermLimit || 50;
        this.longTermLimit = config.longTermLimit || 500;

        // 记忆衰减配置
        this.decayRate = config.decayRate || 0.01; // 每小时衰减率
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
     * @param {string} content - 记忆内容
     * @param {number} importance - 重要性 (0-1)
     * @param {object} metadata - 元数据
     */
    addLongTerm(content, importance = 0.5, metadata = {}) {
        this.longTermMemory.push({
            content,
            importance,
            timestamp: Date.now(),
            createdAt: Date.now(),
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
                createdAt: Date.now()
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
     * 知识点：记忆衰减机制
     * importance(t) = importance_0 × e^(-decay_rate × t)
     */
    retrieveLongTerm(query = null, limit = 20, currentHour = 0) {
        let memories = this.longTermMemory;

        // 计算衰减后的重要性
        memories = memories.map(m => {
            const hoursPassed = (Date.now() - m.createdAt) / (1000 * 60 * 60);
            const decayedImportance = m.importance * Math.exp(-this.decayRate * hoursPassed);
            return { ...m, currentImportance: decayedImportance };
        });

        // 简单的相关性检索
        if (query) {
            memories = memories.filter(m => {
                const content = JSON.stringify(m.content).toLowerCase();
                return content.includes(query.toLowerCase());
            });
        }

        // 按衰减后的重要性和访问次数排序
        memories.sort((a, b) => {
            const scoreA = a.currentImportance + a.accessCount * 0.05;
            const scoreB = b.currentImportance + b.accessCount * 0.05;
            return scoreB - scoreA;
        });

        // 更新访问计数
        memories.slice(0, limit).forEach(m => {
            const original = this.longTermMemory.find(mem => mem.timestamp === m.timestamp);
            if (original) original.accessCount++;
        });

        return memories.slice(0, limit);
    }

    /**
     * 检索语义记忆
     */
    retrieveSemantic(entity) {
        return this.semanticMemory.get(entity);
    }

    /**
     * 获取上下文（用于决策）
     */
    getContext(maxItems = 10) {
        return {
            recent: this.retrieveShortTerm(5),
            relevant: this.retrieveLongTerm(null, maxItems - 5)
        };
    }

    /**
     * 记忆限制
     */
    limitMemory(memory, limit) {
        while (memory.length > limit) {
            // 移除最旧的记忆
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

    /**
     * 导入记忆
     */
    import(data) {
        if (data.shortTerm) this.shortTermMemory = data.shortTerm;
        if (data.longTerm) this.longTermMemory = data.longTerm;
        if (data.semantic) this.semanticMemory = new Map(data.semantic);
    }
}

/**
 * 基础Agent类
 * 实现Agent的核心功能：ReAct循环、消息处理
 *
 * 知识点：第4章 ReAct范式
 */
class BaseAgent {
    constructor(config) {
        this.name = config.name || 'Agent';
        this.llm = config.llm;           // LLM客户端（可选）
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
     * 知识点：第4章 ReAct范式
     * Thought → Action → Observation 循环
     */
    async reactLoop(query, maxIterations = 10) {
        this.status = 'thinking';
        const steps = [];

        let context = this.buildContext();

        for (let i = 0; i < maxIterations; i++) {
            // 1. Thought: 生成思考
            const thought = await this.think(query, context, steps);
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

                // 3. Observation: 执行并观察结果
                const observation = await this.executeAction(action);
                steps.push({ type: 'observation', content: observation });
                this.emitProgress('observation', observation);

                // 存储记忆
                this.memory.addShortTerm(
                    `Action: ${action.tool}, Result: ${JSON.stringify(observation)}`,
                    { type: 'react_step' }
                );

                // 更新上下文
                context.lastAction = action;
                context.lastObservation = observation;
            }
        }

        this.status = 'done';
        return { steps, completed: false };
    }

    /**
     * 思考阶段
     */
    async think(query, context, history) {
        // 如果有LLM，使用LLM生成思考
        if (this.llm) {
            const prompt = this.buildThinkPrompt(query, context, history);
            return await this.llm.generate(prompt);
        }

        // 否则返回简单的基于规则的思考
        return this.ruleBasedThink(query, context, history);
    }

    /**
     * 基于规则的思考（无LLM时的后备方案）
     */
    ruleBasedThink(query, context, history) {
        return `Thought: I need to respond to ${query}`;
    }

    /**
     * 构建思考提示
     */
    buildThinkPrompt(query, context, history) {
        const historyStr = history.slice(-3).map(h =>
            `${h.type}: ${JSON.stringify(h.content)}`
        ).join('\n');

        return `
Current context: ${JSON.stringify(context)}
Recent history:
${historyStr}

Query: ${query}

What should I do next? Think step by step.
`;
    }

    /**
     * 解析行动
     */
    parseAction(text) {
        // 解析格式: Action: tool_name(params)
        const actionMatch = text.match(/Action:\s*(\w+)(?:\((.*)\))?/i);
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
     * 执行行动
     */
    async executeAction(action) {
        try {
            return await this.tools.execute(action.tool, action.params);
        } catch (error) {
            return { error: error.message };
        }
    }

    /**
     * 检查是否是最终答案
     */
    isFinalAnswer(text) {
        return /final answer|answer:|完成|done/i.test(text);
    }

    /**
     * 提取最终答案
     */
    extractFinalAnswer(text) {
        const match = text.match(/(?:final answer|answer|结论):\s*(.+)/is);
        return match ? match[1].trim() : text;
    }

    /**
     * 构建上下文
     */
    buildContext() {
        return {
            memory: this.memory.getContext(),
            status: this.status,
            tools: this.tools.listTools()
        };
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
