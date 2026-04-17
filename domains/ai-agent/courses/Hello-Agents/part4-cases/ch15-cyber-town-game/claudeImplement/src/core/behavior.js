/**
 * 行为系统 - BehaviorSystem
 *
 * 实现NPC的行为决策：
 * 1. ReAct范式（Thought → Action → Observation）
 * 2. 基于需求的行为选择
 * 3. 行为评估与执行
 *
 * 知识点映射：
 * - 第4章：ReAct范式
 * - 第15章：NPC行为决策
 */

import { ToolRegistry } from '../framework/agent_framework.js';

/**
 * 行为类型
 */
const BehaviorType = {
    MOVE: 'move',
    EAT: 'eat',
    REST: 'rest',
    SOCIALIZE: 'socialize',
    WORK: 'work',
    EXPLORE: 'explore',
    INTERACT: 'interact',
    IDLE: 'idle'
};

/**
 * 行为定义
 */
const BEHAVIORS = {
    move: {
        type: BehaviorType.MOVE,
        name: '移动',
        description: '前往另一个地点',
        effects: { energy: -0.05 },
        requirements: { energy: 0.1 },
        duration: 1
    },
    eat: {
        type: BehaviorType.EAT,
        name: '进食',
        description: '吃食物满足饥饿',
        effects: { hunger: -0.5, energy: 0.1, mood: 0.1 },
        requirements: { location: ['restaurant', 'home', 'cafe'] },
        duration: 1
    },
    rest: {
        type: BehaviorType.REST,
        name: '休息',
        description: '休息恢复能量',
        effects: { energy: 0.4, mood: 0.1 },
        requirements: { location: ['home', 'park'] },
        duration: 2
    },
    socialize: {
        type: BehaviorType.SOCIALIZE,
        name: '社交',
        description: '与他人互动',
        effects: { social: -0.3, mood: 0.2 },
        requirements: { energy: 0.2 },
        duration: 1
    },
    work: {
        type: BehaviorType.WORK,
        name: '工作',
        description: '完成工作任务',
        effects: { energy: -0.2, mood: -0.1 },
        requirements: { energy: 0.3, location: ['office'] },
        duration: 3
    },
    explore: {
        type: BehaviorType.EXPLORE,
        name: '探索',
        description: '探索新地点',
        effects: { energy: -0.1, mood: 0.15 },
        requirements: { energy: 0.2 },
        duration: 2
    }
};

/**
 * ReAct决策步骤
 * 知识点：第4章 ReAct范式
 */
class ReActStep {
    constructor(type, content) {
        this.type = type; // 'thought', 'action', 'observation'
        this.content = content;
        this.timestamp = Date.now();
    }
}

/**
 * 行为决策结果
 */
class BehaviorDecision {
    constructor(behavior, target = null, reason = '') {
        this.behavior = behavior;
        this.target = target; // 目标地点或角色
        this.reason = reason;
        this.timestamp = Date.now();
    }
}

/**
 * 行为系统
 */
class BehaviorSystem {
    constructor(config = {}) {
        this.tools = new ToolRegistry();
        this.llm = config.llm || null;

        // 注册行为作为工具
        this.registerBehaviors();

        // 决策历史
        this.decisionHistory = [];
        this.maxHistory = 100;
    }

    /**
     * 注册行为作为工具
     */
    registerBehaviors() {
        Object.entries(BEHAVIORS).forEach(([key, behavior]) => {
            this.tools.register({
                name: key,
                description: behavior.description,
                parameters: {
                    type: 'object',
                    properties: {
                        target: { type: 'string', description: '目标（地点或角色）' }
                    }
                },
                execute: async (params) => {
                    return { behavior: key, target: params.target };
                }
            });
        });
    }

    /**
     * ReAct决策循环
     * 知识点：第4章 ReAct范式
     *
     * @param {CharacterAgent} character - 角色
     * @param {object} worldState - 世界状态
     * @returns {BehaviorDecision} 决策结果
     */
    async decide(character, worldState) {
        const steps = [];

        // === Step 1: Thought - 分析当前状态 ===
        const thought = this.generateThought(character, worldState);
        steps.push(new ReActStep('thought', thought));

        // === Step 2: Action - 选择行为 ===
        const action = this.selectAction(character, worldState, thought);
        steps.push(new ReActStep('action', action));

        // === Step 3: Observation - 评估行为可行性 ===
        const observation = this.observeAction(character, action, worldState);
        steps.push(new ReActStep('observation', observation));

        // 如果行为不可行，重新选择
        if (!observation.feasible) {
            const alternativeAction = this.selectAlternative(character, worldState, observation.reason);
            steps.push(new ReActStep('action', alternativeAction));
            const alternativeDecision = this.createDecision(alternativeAction, steps);

            // 记录替代决策历史
            this.decisionHistory.push({
                characterId: character.id,
                steps,
                decision: alternativeDecision,
                timestamp: Date.now()
            });

            if (this.decisionHistory.length > this.maxHistory) {
                this.decisionHistory.shift();
            }

            return alternativeDecision;
        }

        // 记录决策历史
        const decision = this.createDecision(action, steps);
        this.decisionHistory.push({
            characterId: character.id,
            steps,
            decision,
            timestamp: Date.now()
        });

        if (this.decisionHistory.length > this.maxHistory) {
            this.decisionHistory.shift();
        }

        return decision;
    }

    /**
     * 生成思考
     * Thought阶段：分析当前状态、需求、目标
     */
    generateThought(character, worldState) {
        const needs = character.getNeeds();
        const tendencies = character.getBehaviorTendencies();
        const topGoal = character.goals.length > 0 ? character.getTopGoal() : null;

        let thought = `我是${character.name}，当前在${character.location}。`;

        // 分析状态
        thought += `当前状态：心情${this.formatValue(character.state.mood)}，`;
        thought += `能量${this.formatPercent(character.state.energy)}，`;
        thought += `饥饿${this.formatPercent(character.state.hunger)}。`;

        // 分析需求
        if (needs.length > 0) {
            thought += `最紧迫的需求是：${needs[0].type}（紧迫度：${needs[0].urgency.toFixed(2)}）。`;
        } else {
            thought += `目前没有紧迫的需求。`;
        }

        // 分析目标
        if (topGoal) {
            thought += `当前目标：${topGoal.description}。`;
        }

        return thought;
    }

    /**
     * 选择行为
     * Action阶段：基于需求和性格选择最佳行为
     */
    selectAction(character, worldState, thought) {
        const needs = character.getNeeds();
        const tendencies = character.getBehaviorTendencies();

        // 如果有紧急需求，优先处理
        if (needs.length > 0 && needs[0].urgency > 0.7) {
            return this.selectNeedBasedAction(needs[0], character, worldState);
        }

        // 根据性格和当前时段选择行为
        const timeOfDay = worldState.time?.timeOfDay || 'day';
        const location = character.location;

        // 工作时间倾向工作
        if (timeOfDay === 'morning' && tendencies.workPreference > 0.5) {
            return { behavior: 'work', target: 'office' };
        }

        // 社交倾向
        if (tendencies.socialPreference > 0.6 && Math.random() < tendencies.socialPreference) {
            const nearbyCharacters = worldState.characters?.filter(c =>
                c.id !== character.id && c.location === location
            ) || [];

            if (nearbyCharacters.length > 0) {
                const target = nearbyCharacters[Math.floor(Math.random() * nearbyCharacters.length)];
                return { behavior: 'socialize', target: target.name };
            }
        }

        // 探索倾向
        if (tendencies.explorationPreference > 0.6 && Math.random() < tendencies.explorationPreference * 0.5) {
            return { behavior: 'explore', target: this.getRandomLocation(worldState, location) };
        }

        // 默认：根据需求选择
        if (needs.length > 0) {
            return this.selectNeedBasedAction(needs[0], character, worldState);
        }

        // 无所事事
        return { behavior: 'idle', target: null };
    }

    /**
     * 基于需求选择行为
     */
    selectNeedBasedAction(need, character, worldState) {
        switch (need.type) {
            case 'hunger':
                return { behavior: 'eat', target: 'restaurant' };
            case 'energy':
                return { behavior: 'rest', target: 'home' };
            case 'social':
                // 找一个社交地点
                const socialPlaces = ['park', 'tavern', 'square', 'cafe'];
                const targetPlace = socialPlaces[Math.floor(Math.random() * socialPlaces.length)];
                return { behavior: 'socialize', target: targetPlace };
            default:
                return { behavior: 'idle', target: null };
        }
    }

    /**
     * 观察行为可行性
     * Observation阶段：评估行为是否可以执行
     */
    observeAction(character, action, worldState) {
        const behavior = BEHAVIORS[action.behavior];
        if (!behavior) {
            return { feasible: false, reason: `未知行为: ${action.behavior}` };
        }

        // 检查能量要求
        if (behavior.requirements.energy && character.state.energy < behavior.requirements.energy) {
            return { feasible: false, reason: '能量不足' };
        }

        // 检查地点要求
        if (behavior.requirements.location) {
            const requiredLocations = behavior.requirements.location;
            // 如果当前不在正确地点且不是移动行为
            if (!requiredLocations.includes(character.location) && action.behavior !== 'move') {
                return {
                    feasible: true,
                    requiresMove: true,
                    targetLocation: requiredLocations[0],
                    reason: `需要先前往${requiredLocations[0]}`
                };
            }
        }

        return { feasible: true, reason: '可以执行' };
    }

    /**
     * 选择替代行为
     */
    selectAlternative(character, worldState, reason) {
        // 如果需要移动
        if (reason.includes('需要先前往')) {
            return { behavior: 'move', target: this.extractLocation(reason) };
        }

        // 如果能量不足，休息
        if (reason.includes('能量不足')) {
            return { behavior: 'rest', target: 'home' };
        }

        // 默认idle
        return { behavior: 'idle', target: null };
    }

    /**
     * 创建决策结果
     */
    createDecision(action, steps) {
        const behavior = BEHAVIORS[action.behavior];
        const reason = steps.find(s => s.type === 'thought')?.content || '';

        return new BehaviorDecision(
            action.behavior,
            action.target,
            reason
        );
    }

    /**
     * 执行行为
     */
    async executeBehavior(character, decision, worldState) {
        const behavior = BEHAVIORS[decision.behavior];
        if (!behavior) {
            return { success: false, error: '未知行为' };
        }

        // 应用效果
        const effects = behavior.effects;
        Object.entries(effects).forEach(([key, value]) => {
            if (character.state[key] !== undefined) {
                character.state[key] = Math.max(-1, Math.min(1, character.state[key] + value));
            }
        });

        // 记录活动
        character.startActivity(decision.behavior);

        return {
            success: true,
            behavior: decision.behavior,
            effects,
            duration: behavior.duration
        };
    }

    /**
     * 获取随机地点
     */
    getRandomLocation(worldState, currentLocation) {
        const locations = worldState.locations?.map(l => l.name) || [];
        const otherLocations = locations.filter(l => l !== currentLocation);
        if (otherLocations.length === 0) return currentLocation;
        return otherLocations[Math.floor(Math.random() * otherLocations.length)];
    }

    /**
     * 从文本中提取地点
     */
    extractLocation(text) {
        const locations = ['home', 'office', 'park', 'restaurant', 'tavern', 'square', 'cafe', 'shop'];
        for (const loc of locations) {
            if (text.includes(loc)) return loc;
        }
        return 'home';
    }

    /**
     * 格式化值
     */
    formatValue(value) {
        if (value > 0) return '良好';
        if (value < 0) return '不佳';
        return '一般';
    }

    formatPercent(value) {
        return `${Math.round(value * 100)}%`;
    }

    /**
     * 获取决策历史
     */
    getDecisionHistory(characterId = null, limit = 20) {
        let history = this.decisionHistory;
        if (characterId) {
            history = history.filter(h => h.characterId === characterId);
        }
        return history.slice(-limit);
    }
}

export {
    BehaviorSystem,
    BehaviorType,
    BEHAVIORS,
    ReActStep,
    BehaviorDecision
};
