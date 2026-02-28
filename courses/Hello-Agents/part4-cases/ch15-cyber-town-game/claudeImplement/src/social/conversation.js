/**
 * 对话系统 - Conversation
 *
 * 管理角色间的对话：
 * 1. 对话生成
 * 2. 对话历史
 * 3. 对话情感分析
 *
 * 知识点映射：
 * - 第15章：NPC对话系统
 */

/**
 * 对话类型
 */
const ConversationType = {
    GREETING: 'greeting',       // 问候
    CHAT: 'chat',               // 闲聊
    GOSSIP: 'gossip',           // 八卦
    WORK: 'work',               // 工作讨论
    PERSONAL: 'personal',       // 私人话题
    CONFLICT: 'conflict',       // 冲突
    HELP: 'help',               // 求助
    FAREWELL: 'farewell'        // 告别
};

/**
 * 对话模板
 */
const CONVERSATION_TEMPLATES = {
    greeting: {
        friendly: [
            "嘿，{target}！好久不见！",
            "嗨，{target}，今天过得怎么样？",
            "哦，{target}！真高兴见到你！"
        ],
        neutral: [
            "你好，{target}。",
            "嗨，{target}。",
            "哦，{target}，你也在啊。"
        ],
        cold: [
            "哦，是你啊。",
            "……",
            "有事吗？"
        ]
    },
    chat: {
        friendly: [
            "你听说了吗？最近镇上发生了一些有趣的事情！",
            "今天天气真不错，不是吗？",
            "我最近在思考一些事情……"
        ],
        neutral: [
            "最近怎么样？",
            "有什么新鲜事吗？",
            "今天过得如何？"
        ]
    },
    gossip: [
        "你听说了关于{topic}的事吗？",
        "我听说{topic}最近很活跃呢。",
        "有传言说{topic}……"
    ],
    work: [
        "最近工作怎么样？",
        "我觉得我们可以合作一下。",
        "关于那个项目，你有什么想法？"
    ],
    help: {
        request: [
            "能帮帮我吗？",
            "我遇到了一些麻烦……",
            "你有时间吗？我需要一些建议。"
        ],
        offer: [
            "需要帮忙吗？",
            "如果有什么我能做的，随时告诉我。",
            "你看起来有些困扰，要我帮忙吗？"
        ]
    },
    farewell: {
        friendly: [
            "再见，{target}！下次再聊！",
            "保持联系，{target}！",
            "希望很快能再见到你！"
        ],
        neutral: [
            "再见。",
            "回见。",
            "那我先走了。"
        ]
    }
};

/**
 * 对话话题
 */
const TOPICS = [
    '小镇最近的变化',
    '新来的居民',
    '天气',
    '最近的活动',
    '工作',
    '兴趣爱好'
];

/**
 * 对话类
 */
class Conversation {
    constructor(participants, location) {
        this.id = 'conv_' + Date.now();
        this.participants = participants; // [CharacterAgent, CharacterAgent]
        this.location = location;
        this.messages = [];
        this.startTime = Date.now();
        this.endTime = null;
        this.sentiment = 0;
        this.type = ConversationType.CHAT;
    }

    /**
     * 添加消息
     */
    addMessage(speaker, content, sentiment = 0) {
        const message = {
            speaker: speaker.name,
            content,
            sentiment,
            timestamp: Date.now()
        };
        this.messages.push(message);

        // 更新整体情感
        this.sentiment = (this.sentiment * (this.messages.length - 1) + sentiment) / this.messages.length;

        return message;
    }

    /**
     * 结束对话
     */
    end() {
        this.endTime = Date.now();
    }

    /**
     * 获取对话摘要
     */
    getSummary() {
        return {
            id: this.id,
            participants: this.participants.map(c => c.name),
            location: this.location,
            messageCount: this.messages.length,
            sentiment: this.sentiment,
            duration: this.endTime ? this.endTime - this.startTime : Date.now() - this.startTime
        };
    }

    /**
     * 导出
     */
    export() {
        return {
            id: this.id,
            participants: this.participants.map(c => c.name),
            location: this.location,
            messages: this.messages,
            sentiment: this.sentiment,
            startTime: this.startTime,
            endTime: this.endTime
        };
    }
}

/**
 * 对话系统
 */
class ConversationSystem {
    constructor(config = {}) {
        // LLM客户端（可选，用于生成更智能的对话）
        this.llm = config.llm || null;

        // 对话历史
        this.conversationHistory = [];
        this.maxHistory = config.maxHistory || 100;

        // 当前活跃的对话
        this.activeConversations = new Map(); // location -> Conversation

        // MiniMax API配置
        this.minimaxConfig = config.minimaxConfig || null;
    }

    /**
     * 生成问候语
     */
    generateGreeting(speaker, target, relationship) {
        const templates = CONVERSATION_TEMPLATES.greeting;
        let category = 'neutral';

        if (relationship.value > 0.5) {
            category = 'friendly';
        } else if (relationship.value < -0.3) {
            category = 'cold';
        }

        const options = templates[category] || templates.neutral;
        const template = options[Math.floor(Math.random() * options.length)];

        return template.replace('{target}', target.name);
    }

    /**
     * 生成对话内容
     */
    generateResponse(speaker, target, context, relationship) {
        const responseType = this.determineResponseType(context, relationship);
        const templates = CONVERSATION_TEMPLATES[responseType];

        if (!templates) {
            return this.generateDefaultResponse(speaker, target);
        }

        // 根据关系选择合适的回复类别
        let category = 'neutral';
        if (relationship.value > 0.5) category = 'friendly';

        const options = templates[category] || templates;
        const template = options[Math.floor(Math.random() * options.length)];

        // 替换模板变量
        let response = template.replace('{target}', target.name);
        response = response.replace('{topic}', TOPICS[Math.floor(Math.random() * TOPICS.length)]);

        return response;
    }

    /**
     * 确定回复类型
     */
    determineResponseType(context, relationship) {
        // 基于上下文和关系决定对话类型
        if (context.lastMessage?.includes('帮助')) {
            return ConversationType.HELP;
        }
        if (context.lastMessage?.includes('工作')) {
            return ConversationType.WORK;
        }
        if (relationship.familiarity > 0.5 && Math.random() > 0.7) {
            return ConversationType.GOSSIP;
        }
        return ConversationType.CHAT;
    }

    /**
     * 生成默认回复
     */
    generateDefaultResponse(speaker, target) {
        const defaults = [
            "嗯，有道理。",
            "我明白你的意思。",
            "确实是这样。",
            "你说得对。"
        ];
        return defaults[Math.floor(Math.random() * defaults.length)];
    }

    /**
     * 生成告别语
     */
    generateFarewell(speaker, target, relationship) {
        const templates = CONVERSATION_TEMPLATES.farewell;
        let category = 'neutral';

        if (relationship.value > 0.5) {
            category = 'friendly';
        }

        const options = templates[category] || templates.neutral;
        const template = options[Math.floor(Math.random() * options.length)];

        return template.replace('{target}', target.name);
    }

    /**
     * 开始对话
     */
    startConversation(char1, char2, location) {
        // 检查是否已有活跃对话
        if (this.activeConversations.has(location)) {
            return this.activeConversations.get(location);
        }

        const conversation = new Conversation([char1, char2], location);

        // 获取关系
        const relationship = this.getOrCreateRelationship(char1, char2);

        // 生成开场白
        const greeting = this.generateGreeting(char1, char2, relationship);
        conversation.addMessage(char1, greeting, this.calculateSentiment(greeting, relationship));

        this.activeConversations.set(location, conversation);

        return conversation;
    }

    /**
     * 继续对话
     */
    async continueConversation(conversation, speaker, target) {
        const relationship = this.getOrCreateRelationship(speaker, target);
        const context = {
            lastMessage: conversation.messages[conversation.messages.length - 1]?.content,
            location: conversation.location
        };

        let response;
        let sentiment;

        // 如果有LLM，使用LLM生成
        if (this.llm) {
            response = await this.generateLLMResponse(speaker, target, conversation, context);
            sentiment = this.analyzeSentiment(response);
        } else {
            response = this.generateResponse(speaker, target, context, relationship);
            sentiment = this.calculateSentiment(response, relationship);
        }

        conversation.addMessage(speaker, response, sentiment);

        return { response, sentiment };
    }

    /**
     * 结束对话
     */
    endConversation(location) {
        const conversation = this.activeConversations.get(location);
        if (!conversation) return null;

        conversation.end();

        // 保存到历史
        this.conversationHistory.push(conversation.export());
        if (this.conversationHistory.length > this.maxHistory) {
            this.conversationHistory.shift();
        }

        // 移除活跃对话
        this.activeConversations.delete(location);

        return conversation;
    }

    /**
     * 使用LLM生成回复
     * 支持MiniMax API
     */
    async generateLLMResponse(speaker, target, conversation, context) {
        if (!this.llm && !this.minimaxConfig) {
            return this.generateResponse(speaker, target, context,
                this.getOrCreateRelationship(speaker, target));
        }

        try {
            // 构建对话上下文
            const recentMessages = conversation.messages.slice(-5);
            const conversationContext = recentMessages.map(m =>
                `${m.speaker}: ${m.content}`
            ).join('\n');

            const prompt = `你是一个名为${speaker.name}的角色。
性格特点：${this.describePersonality(speaker.personality)}
当前心情：${this.describeMood(speaker.state.mood)}
你正在和${target.name}聊天。

最近的对话：
${conversationContext}

请用简短的话（1-2句话）继续对话，保持角色一致性。`;

            // 如果有MiniMax配置，使用MiniMax API
            if (this.minimaxConfig) {
                return await this.callMiniMaxAPI(prompt);
            }

            // 否则使用传入的LLM
            if (this.llm && this.llm.generate) {
                return await this.llm.generate(prompt);
            }

            // 回退到模板生成
            return this.generateResponse(speaker, target, context,
                this.getOrCreateRelationship(speaker, target));

        } catch (error) {
            console.error('LLM generation error:', error);
            return this.generateResponse(speaker, target, context,
                this.getOrCreateRelationship(speaker, target));
        }
    }

    /**
     * 调用MiniMax API
     */
    async callMiniMaxAPI(prompt) {
        if (!this.minimaxConfig || !this.minimaxConfig.apiKey) {
            throw new Error('MiniMax API key not configured');
        }

        try {
            const response = await fetch('https://api.minimax.chat/v1/text/chatcompletion_v2', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.minimaxConfig.apiKey}`
                },
                body: JSON.stringify({
                    model: this.minimaxConfig.model || 'MiniMax-Text-01',
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.8,
                    max_tokens: 100
                })
            });

            const data = await response.json();

            if (data.choices && data.choices[0]) {
                return data.choices[0].message.content.trim();
            }

            throw new Error('Invalid response from MiniMax API');

        } catch (error) {
            console.error('MiniMax API error:', error);
            throw error;
        }
    }

    /**
     * 描述性格
     */
    describePersonality(personality) {
        const traits = [];
        if (personality.extraversion > 0.7) traits.push('外向');
        if (personality.extraversion < 0.3) traits.push('内向');
        if (personality.agreeableness > 0.7) traits.push('友善');
        if (personality.conscientiousness > 0.7) traits.push('认真');
        if (personality.openness > 0.7) traits.push('好奇');
        return traits.join('、') || '普通';
    }

    /**
     * 描述心情
     */
    describeMood(mood) {
        if (mood > 0.5) return '心情很好';
        if (mood < -0.5) return '心情不好';
        return '心情一般';
    }

    /**
     * 计算情感值
     */
    calculateSentiment(text, relationship) {
        // 简单的关键词情感分析
        let sentiment = 0;

        const positiveWords = ['高兴', '好', '喜欢', '谢谢', '棒', '太好了'];
        const negativeWords = ['讨厌', '不好', '烦', '不行', '差'];

        positiveWords.forEach(word => {
            if (text.includes(word)) sentiment += 0.1;
        });

        negativeWords.forEach(word => {
            if (text.includes(word)) sentiment -= 0.1;
        });

        // 考虑关系影响
        sentiment += relationship.value * 0.2;

        return Math.max(-1, Math.min(1, sentiment));
    }

    /**
     * 分析情感
     */
    analyzeSentiment(text) {
        return this.calculateSentiment(text, { value: 0 });
    }

    /**
     * 获取或创建临时关系对象
     */
    getOrCreateRelationship(char1, char2) {
        // 简单的关系获取，实际应使用RelationshipSystem
        const value = char1.getRelationship(char2.name) || 0;
        return { value, familiarity: 0.5 };
    }

    /**
     * 获取对话历史
     */
    getHistory(options = {}) {
        let history = [...this.conversationHistory];

        if (options.character) {
            history = history.filter(c =>
                c.participants.includes(options.character)
            );
        }

        const limit = options.limit || 20;
        return history.slice(-limit);
    }

    /**
     * 导出
     */
    export() {
        return {
            history: this.conversationHistory,
            active: Array.from(this.activeConversations.entries()).map(([loc, conv]) => ({
                location: loc,
                conversation: conv.export()
            }))
        };
    }
}

export {
    ConversationSystem,
    Conversation,
    ConversationType,
    CONVERSATION_TEMPLATES,
    TOPICS
};
