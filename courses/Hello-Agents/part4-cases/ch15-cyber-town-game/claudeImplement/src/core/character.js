/**
 * 角色系统 - CharacterAgent
 *
 * 实现NPC角色的核心逻辑：
 * 1. OCEAN性格模型（五因素模型）
 * 2. 状态管理（心情、能量、饥饿、社交需求）
 * 3. 目标系统
 * 4. 角色记忆
 *
 * 知识点映射：
 * - 第15章：OCEAN性格模型
 * - 第8章：记忆系统
 */

import { BaseAgent, MemorySystem, ToolRegistry } from '../framework/agent_framework.js';

/**
 * OCEAN性格模型（五因素模型）
 * 知识点：第15章 - 大五人格理论
 *
 * Openness (开放性): 好奇心、创造力、尝试新事物的倾向
 * Conscientiousness (尽责性): 自律、效率、组织能力
 * Extraversion (外向性): 社交性、活力、积极性
 * Agreeableness (宜人性): 合作、善良、信任他人
 * Neuroticism (神经质): 情绪稳定性、焦虑倾向
 */
const DEFAULT_PERSONALITY = {
    openness: 0.5,          // 开放性
    conscientiousness: 0.5, // 尽责性
    extraversion: 0.5,      // 外向性
    agreeableness: 0.5,     // 宜人性
    neuroticism: 0.5        // 神经质
};

/**
 * 默认状态值
 */
const DEFAULT_STATE = {
    mood: 0.5,      // 心情值 (-1 到 1, 0为中性)
    energy: 1.0,    // 能量值 (0 到 1)
    hunger: 0.0,    // 饥饿值 (0 到 1, 越高越饿)
    social: 0.5     // 社交需求 (0 到 1, 越高越需要社交)
};

/**
 * 角色Agent类
 * 继承BaseAgent，扩展游戏相关功能
 */
class CharacterAgent extends BaseAgent {
    constructor(config) {
        super(config);

        // 基础属性
        this.id = config.id || this.generateId();
        this.name = config.name || 'NPC';
        this.age = config.age || 25;
        this.occupation = config.occupation || '无业';
        this.description = config.description || '';

        // OCEAN性格模型
        this.personality = {
            ...DEFAULT_PERSONALITY,
            ...(config.personality || {})
        };

        // 状态属性
        this.state = {
            ...DEFAULT_STATE,
            ...(config.state || {})
        };

        // 位置
        this.location = config.location || '家';
        this.previousLocation = null;

        // 目标系统
        this.goals = config.goals || [];
        this.currentGoal = null;

        // 关系系统
        this.relationships = new Map(); // 角色名 -> 关系值

        // 当前行为
        this.currentActivity = null;
        this.activityStartTime = null;

        // 对话历史
        this.conversations = [];

        // 角色特定记忆
        this.characterMemory = new MemorySystem({
            shortTermLimit: 30,
            longTermLimit: 200,
            decayRate: 0.02
        });
    }

    generateId() {
        return 'char_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 更新状态
     * 每个游戏tick调用
     */
    updateState(deltaTime = 1) {
        // 状态自然变化
        this.state.energy = Math.max(0, this.state.energy - 0.01 * deltaTime);
        this.state.hunger = Math.min(1, this.state.hunger + 0.02 * deltaTime);
        this.state.social = Math.max(0, this.state.social - 0.005 * deltaTime);

        // 心情受其他状态影响
        this.updateMood();

        // 性格影响状态衰减
        this.applyPersonalityEffects(deltaTime);
    }

    /**
     * 更新心情
     */
    updateMood() {
        let moodChange = 0;

        // 低能量影响心情
        if (this.state.energy < 0.3) {
            moodChange -= 0.1;
        }

        // 高饥饿影响心情
        if (this.state.hunger > 0.7) {
            moodChange -= 0.15;
        }

        // 低社交需求满足影响心情（对外向者影响更大）
        const socialEffect = (this.state.social - 0.5) * this.personality.extraversion * 0.2;
        moodChange += socialEffect;

        // 神经质影响心情波动
        moodChange *= (1 + this.personality.neuroticism);

        this.state.mood = Math.max(-1, Math.min(1, this.state.mood + moodChange * 0.1));
    }

    /**
     * 应用性格效果
     */
    applyPersonalityEffects(deltaTime) {
        // 尽责性高的人能量消耗稍慢（更有效率）
        this.state.energy += (this.personality.conscientiousness - 0.5) * 0.005 * deltaTime;

        // 宜人性高的人社交需求恢复更快
        if (this.state.social < 0.5) {
            this.state.social += (this.personality.agreeableness - 0.5) * 0.01 * deltaTime;
        }
    }

    /**
     * 设置位置
     */
    setLocation(location) {
        this.previousLocation = this.location;
        this.location = location;

        // 记录移动
        this.characterMemory.addShortTerm(`Moved to ${location}`, {
            type: 'movement',
            from: this.previousLocation,
            to: location
        });

        return true;
    }

    /**
     * 添加目标
     */
    addGoal(goal) {
        const newGoal = {
            id: 'goal_' + Date.now(),
            description: goal.description,
            priority: goal.priority || 0.5,
            status: 'active',
            createdAt: Date.now(),
            deadline: goal.deadline || null
        };
        this.goals.push(newGoal);
        return newGoal;
    }

    /**
     * 完成目标
     */
    completeGoal(goalId) {
        const goal = this.goals.find(g => g.id === goalId);
        if (goal) {
            goal.status = 'completed';
            goal.completedAt = Date.now();

            // 完成目标提升心情
            this.state.mood = Math.min(1, this.state.mood + 0.2);

            this.characterMemory.addLongTerm(
                `Completed goal: ${goal.description}`,
                goal.priority,
                { type: 'goal_completed' }
            );
        }
        return goal;
    }

    /**
     * 获取最高优先级目标
     */
    getTopGoal() {
        const activeGoals = this.goals.filter(g => g.status === 'active');
        if (activeGoals.length === 0) return null;

        activeGoals.sort((a, b) => b.priority - a.priority);
        return activeGoals[0];
    }

    /**
     * 设置关系
     */
    setRelationship(characterName, value) {
        // 限制在 -1 到 1 之间
        const clampedValue = Math.max(-1, Math.min(1, value));
        this.relationships.set(characterName, clampedValue);
    }

    /**
     * 更新关系
     */
    updateRelationship(characterName, delta) {
        const current = this.relationships.get(characterName) || 0;
        this.setRelationship(characterName, current + delta);
    }

    /**
     * 获取关系值
     */
    getRelationship(characterName) {
        return this.relationships.get(characterName) || 0;
    }

    /**
     * 记录对话
     */
    recordConversation(withCharacter, content, sentiment = 0) {
        const conversation = {
            with: withCharacter,
            content: content,
            sentiment: sentiment,
            timestamp: Date.now()
        };
        this.conversations.push(conversation);

        // 限制对话历史
        if (this.conversations.length > 100) {
            this.conversations.shift();
        }

        // 存入长期记忆（重要对话）
        if (Math.abs(sentiment) > 0.5) {
            this.characterMemory.addLongTerm(
                `Talked with ${withCharacter}: ${content}`,
                Math.abs(sentiment),
                { type: 'conversation', with: withCharacter }
            );
        }

        return conversation;
    }

    /**
     * 开始活动
     */
    startActivity(activity) {
        this.currentActivity = activity;
        this.activityStartTime = Date.now();

        this.characterMemory.addShortTerm(`Started ${activity}`, {
            type: 'activity',
            activity: activity
        });
    }

    /**
     * 结束活动
     */
    endActivity() {
        if (this.currentActivity && this.activityStartTime) {
            const duration = (Date.now() - this.activityStartTime) / 1000;
            this.characterMemory.addShortTerm(
                `Finished ${this.currentActivity} (duration: ${Math.round(duration)}s)`,
                { type: 'activity_end', duration }
            );
        }
        this.currentActivity = null;
        this.activityStartTime = null;
    }

    /**
     * 获取当前需求（用于行为决策）
     */
    getNeeds() {
        const needs = [];

        if (this.state.hunger > 0.7) {
            needs.push({ type: 'hunger', urgency: this.state.hunger, action: 'eat' });
        }
        if (this.state.energy < 0.3) {
            needs.push({ type: 'energy', urgency: 1 - this.state.energy, action: 'rest' });
        }
        if (this.state.social > 0.7) {
            needs.push({ type: 'social', urgency: this.state.social, action: 'socialize' });
        }

        // 按紧迫程度排序
        needs.sort((a, b) => b.urgency - a.urgency);
        return needs;
    }

    /**
     * 基于性格计算行为倾向
     */
    getBehaviorTendencies() {
        return {
            // 外向者更喜欢社交
            socialPreference: this.personality.extraversion,
            // 开放性高的人喜欢尝试新地点
            explorationPreference: this.personality.openness,
            // 尽责性高的人优先工作
            workPreference: this.personality.conscientiousness,
            // 宜人性高的人更愿意帮助他人
            helpPreference: this.personality.agreeableness,
            // 神经质高的人可能更多休息
            restPreference: this.personality.neuroticism
        };
    }

    /**
     * 获取角色完整状态（用于UI显示）
     */
    getFullState() {
        return {
            id: this.id,
            name: this.name,
            age: this.age,
            occupation: this.occupation,
            personality: { ...this.personality },
            state: { ...this.state },
            location: this.location,
            previousLocation: this.previousLocation,
            currentActivity: this.currentActivity,
            goals: this.goals.map(g => ({ ...g })),
            topGoal: this.getTopGoal(),
            needs: this.getNeeds(),
            tendencies: this.getBehaviorTendencies(),
            relationshipCount: this.relationships.size,
            status: this.status
        };
    }

    /**
     * 导出角色数据
     */
    export() {
        return {
            id: this.id,
            name: this.name,
            age: this.age,
            occupation: this.occupation,
            description: this.description,
            personality: { ...this.personality },
            state: { ...this.state },
            location: this.location,
            goals: this.goals,
            relationships: Array.from(this.relationships.entries()),
            memory: this.characterMemory.export()
        };
    }

    /**
     * 导入角色数据
     */
    import(data) {
        if (data.personality) this.personality = { ...DEFAULT_PERSONALITY, ...data.personality };
        if (data.state) this.state = { ...DEFAULT_STATE, ...data.state };
        if (data.location) this.location = data.location;
        if (data.goals) this.goals = data.goals;
        if (data.relationships) this.relationships = new Map(data.relationships);
        if (data.memory) this.characterMemory.import(data.memory);
    }
}

// 预定义性格模板
const PERSONALITY_TEMPLATES = {
    // 外向社交型
    social: {
        openness: 0.6,
        conscientiousness: 0.5,
        extraversion: 0.9,
        agreeableness: 0.7,
        neuroticism: 0.3
    },
    // 内向思考型
    introvert: {
        openness: 0.8,
        conscientiousness: 0.7,
        extraversion: 0.2,
        agreeableness: 0.5,
        neuroticism: 0.4
    },
    // 勤奋工作型
    worker: {
        openness: 0.4,
        conscientiousness: 0.9,
        extraversion: 0.4,
        agreeableness: 0.6,
        neuroticism: 0.3
    },
    // 创意艺术型
    creative: {
        openness: 0.95,
        conscientiousness: 0.3,
        extraversion: 0.6,
        agreeableness: 0.5,
        neuroticism: 0.6
    },
    // 友善助人型
    helper: {
        openness: 0.5,
        conscientiousness: 0.6,
        extraversion: 0.7,
        agreeableness: 0.95,
        neuroticism: 0.2
    },
    // 焦虑敏感型
    anxious: {
        openness: 0.6,
        conscientiousness: 0.5,
        extraversion: 0.3,
        agreeableness: 0.4,
        neuroticism: 0.9
    }
};

export {
    CharacterAgent,
    DEFAULT_PERSONALITY,
    DEFAULT_STATE,
    PERSONALITY_TEMPLATES
};
