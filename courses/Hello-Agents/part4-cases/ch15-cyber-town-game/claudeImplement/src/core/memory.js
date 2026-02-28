/**
 * 记忆系统 - GameMemory
 *
 * 扩展基础记忆系统，专门用于游戏场景：
 * 1. 事件记忆
 * 2. 社交记忆
 * 3. 空间记忆
 * 4. 记忆衰减与强化
 *
 * 知识点映射：
 * - 第8章：记忆系统
 * - 第15章：记忆在NPC中的应用
 */

import { MemorySystem } from '../framework/agent_framework.js';

/**
 * 记忆类型枚举
 */
const MemoryType = {
    EVENT: 'event',         // 事件记忆
    SOCIAL: 'social',       // 社交记忆
    SPATIAL: 'spatial',     // 空间记忆
    EPISODIC: 'episodic',   // 情景记忆
    SEMANTIC: 'semantic'    // 语义记忆
};

/**
 * 游戏记忆类
 * 扩展MemorySystem，添加游戏特定功能
 */
class GameMemory extends MemorySystem {
    constructor(config = {}) {
        super(config);

        // 事件记忆
        this.eventMemory = [];

        // 社交记忆
        this.socialMemory = new Map(); // characterName -> interactions

        // 空间记忆
        this.spatialMemory = new Map(); // location -> visits

        // 记忆重要性阈值
        this.importanceThreshold = config.importanceThreshold || 0.3;

        // 强化因子
        this.reinforcementFactor = config.reinforcementFactor || 1.5;
    }

    /**
     * 添加事件记忆
     * @param {string} description - 事件描述
     * @param {number} importance - 重要性
     * @param {object} details - 详细信息
     */
    addEventMemory(description, importance = 0.5, details = {}) {
        const event = {
            type: MemoryType.EVENT,
            description,
            importance,
            timestamp: Date.now(),
            gameId: details.gameTime || 0,
            location: details.location || null,
            participants: details.participants || [],
            emotion: details.emotion || 0,
            tags: details.tags || [],
            accessCount: 0
        };

        this.eventMemory.push(event);

        // 同时添加到长期记忆
        this.addLongTerm(description, importance, {
            type: 'event',
            eventId: event.timestamp
        });

        // 限制事件记忆数量
        if (this.eventMemory.length > 200) {
            this.eventMemory.sort((a, b) => {
                const scoreA = a.importance * Math.exp(-0.01 * a.accessCount);
                const scoreB = b.importance * Math.exp(-0.01 * b.accessCount);
                return scoreB - scoreA;
            });
            this.eventMemory = this.eventMemory.slice(0, 200);
        }

        return event;
    }

    /**
     * 添加社交记忆
     * @param {string} characterName - 角色名
     * @param {string} interaction - 互动描述
     * @param {number} sentiment - 情感值 (-1 到 1)
     */
    addSocialMemory(characterName, interaction, sentiment = 0) {
        if (!this.socialMemory.has(characterName)) {
            this.socialMemory.set(characterName, {
                interactions: [],
                overallSentiment: 0,
                interactionCount: 0,
                lastInteraction: null
            });
        }

        const record = this.socialMemory.get(characterName);
        const interactionRecord = {
            description: interaction,
            sentiment,
            timestamp: Date.now()
        };

        record.interactions.push(interactionRecord);
        record.interactionCount++;
        record.lastInteraction = Date.now();

        // 更新整体情感（加权平均）
        const weight = 1 / record.interactionCount;
        record.overallSentiment = record.overallSentiment * (1 - weight) + sentiment * weight;

        // 限制互动记录数量
        if (record.interactions.length > 50) {
            record.interactions = record.interactions.slice(-50);
        }

        // 重要社交互动存入长期记忆
        if (Math.abs(sentiment) > 0.5) {
            this.addLongTerm(
                `Interaction with ${characterName}: ${interaction}`,
                Math.abs(sentiment),
                { type: 'social', character: characterName }
            );
        }

        return record;
    }

    /**
     * 添加空间记忆
     * @param {string} location - 地点名
     * @param {string} action - 行动描述
     */
    addSpatialMemory(location, action = 'visited') {
        if (!this.spatialMemory.has(location)) {
            this.spatialMemory.set(location, {
                visits: [],
                visitCount: 0,
                lastVisit: null,
                actions: []
            });
        }

        const record = this.spatialMemory.get(location);
        record.visits.push({
            action,
            timestamp: Date.now()
        });
        record.visitCount++;
        record.lastVisit = Date.now();
        record.actions.push(action);

        return record;
    }

    /**
     * 检索事件记忆
     * @param {object} query - 查询条件
     * @param {number} limit - 返回数量
     */
    retrieveEvents(query = {}, limit = 20) {
        let events = [...this.eventMemory];

        // 按地点筛选
        if (query.location) {
            events = events.filter(e => e.location === query.location);
        }

        // 按参与者筛选
        if (query.participant) {
            events = events.filter(e =>
                e.participants.includes(query.participant)
            );
        }

        // 按标签筛选
        if (query.tag) {
            events = events.filter(e =>
                e.tags.includes(query.tag)
            );
        }

        // 按重要性筛选
        if (query.minImportance) {
            events = events.filter(e =>
                e.importance >= query.minImportance
            );
        }

        // 计算衰减后的重要性并排序
        events = events.map(e => {
            const hoursPassed = (Date.now() - e.timestamp) / (1000 * 60 * 60);
            const decayedImportance = e.importance * Math.exp(-this.decayRate * hoursPassed);
            return { ...e, currentImportance: decayedImportance };
        });

        events.sort((a, b) => b.currentImportance - a.currentImportance);

        // 更新访问计数
        events.slice(0, limit).forEach(e => e.accessCount++);

        return events.slice(0, limit);
    }

    /**
     * 检索社交记忆
     * @param {string} characterName - 角色名（可选，不传则返回所有）
     */
    retrieveSocialMemory(characterName = null) {
        if (characterName) {
            return this.socialMemory.get(characterName) || null;
        }
        return Object.fromEntries(this.socialMemory);
    }

    /**
     * 检索空间记忆
     * @param {string} location - 地点名（可选）
     */
    retrieveSpatialMemory(location = null) {
        if (location) {
            return this.spatialMemory.get(location) || null;
        }
        return Object.fromEntries(this.spatialMemory);
    }

    /**
     * 获取与某角色的关系历史
     */
    getRelationshipHistory(characterName) {
        const record = this.socialMemory.get(characterName);
        if (!record) return null;

        return {
            overallSentiment: record.overallSentiment,
            interactionCount: record.interactionCount,
            lastInteraction: record.lastInteraction,
            recentInteractions: record.interactions.slice(-10)
        };
    }

    /**
     * 强化记忆
     * 通过回忆或重复来增强记忆
     */
    reinforceMemory(memoryId, factor = null) {
        const boost = factor || this.reinforcementFactor;

        // 在事件记忆中查找并强化
        const event = this.eventMemory.find(e => e.timestamp === memoryId);
        if (event) {
            event.importance = Math.min(1, event.importance * boost);
            event.accessCount++;
        }

        // 在长期记忆中强化
        const longTerm = this.longTermMemory.find(m => m.timestamp === memoryId);
        if (longTerm) {
            longTerm.importance = Math.min(1, longTerm.importance * boost);
        }
    }

    /**
     * 获取重要记忆摘要
     */
    getImportantMemories(limit = 10) {
        const events = this.retrieveEvents({ minImportance: this.importanceThreshold }, limit);

        return {
            events,
            topRelationships: this.getTopRelationships(5),
            frequentLocations: this.getFrequentLocations(5)
        };
    }

    /**
     * 获取最重要的关系
     */
    getTopRelationships(limit = 5) {
        const relationships = [];
        this.socialMemory.forEach((record, name) => {
            relationships.push({
                name,
                sentiment: record.overallSentiment,
                interactionCount: record.interactionCount
            });
        });

        // 按互动次数和情感强度排序
        relationships.sort((a, b) =>
            Math.abs(b.sentiment) * b.interactionCount -
            Math.abs(a.sentiment) * a.interactionCount
        );

        return relationships.slice(0, limit);
    }

    /**
     * 获取最常去的地点
     */
    getFrequentLocations(limit = 5) {
        const locations = [];
        this.spatialMemory.forEach((record, name) => {
            locations.push({
                name,
                visitCount: record.visitCount,
                lastVisit: record.lastVisit
            });
        });

        locations.sort((a, b) => b.visitCount - a.visitCount);
        return locations.slice(0, limit);
    }

    /**
     * 导出所有记忆
     */
    export() {
        return {
            ...super.export(),
            eventMemory: this.eventMemory,
            socialMemory: Object.fromEntries(this.socialMemory),
            spatialMemory: Object.fromEntries(this.spatialMemory)
        };
    }

    /**
     * 导入记忆
     */
    import(data) {
        super.import(data);

        if (data.eventMemory) this.eventMemory = data.eventMemory;
        if (data.socialMemory) this.socialMemory = new Map(Object.entries(data.socialMemory));
        if (data.spatialMemory) this.spatialMemory = new Map(Object.entries(data.spatialMemory));
    }

    /**
     * 清空所有记忆
     */
    clear() {
        super.clear();
        this.eventMemory = [];
        this.socialMemory.clear();
        this.spatialMemory.clear();
    }
}

/**
 * 记忆工具函数
 */

/**
 * 计算记忆重要性
 * 基于多个因素综合评估
 */
function calculateImportance(event, context = {}) {
    let importance = 0.5;

    // 情感强度影响
    if (event.emotion) {
        importance += Math.abs(event.emotion) * 0.2;
    }

    // 参与人数影响
    if (event.participants && event.participants.length > 0) {
        importance += Math.min(0.2, event.participants.length * 0.05);
    }

    // 与当前目标的相关性
    if (context.currentGoals && event.tags) {
        const relevantTags = context.currentGoals.filter(g =>
            event.tags.some(t => t.includes(g))
        );
        importance += relevantTags.length * 0.1;
    }

    return Math.min(1, importance);
}

/**
 * 格式化记忆为文本
 */
function formatMemoryForPrompt(memories) {
    return memories.map(m => {
        const time = new Date(m.timestamp).toLocaleString();
        return `[${time}] ${m.description || m.content}`;
    }).join('\n');
}

export {
    GameMemory,
    MemoryType,
    calculateImportance,
    formatMemoryForPrompt
};
