/**
 * 目标系统 - GoalSystem
 *
 * 管理NPC的目标和行为动机：
 * 1. 目标的创建、更新、完成
 * 2. 目标优先级管理
 * 3. 目标与行为的关联
 *
 * 知识点映射：
 * - 第4章：目标驱动的行为
 * - 第15章：NPC目标系统
 */

/**
 * 目标状态
 */
const GoalStatus = {
    PENDING: 'pending',
    ACTIVE: 'active',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    FAILED: 'failed',
    ABANDONED: 'abandoned'
};

/**
 * 目标类型
 */
const GoalType = {
    NEED: 'need',           // 基本需求（吃饭、休息）
    SOCIAL: 'social',       // 社交目标
    WORK: 'work',           // 工作目标
    EXPLORATION: 'exploration', // 探索目标
    PERSONAL: 'personal'    // 个人目标
};

/**
 * 目标类
 */
class Goal {
    constructor(config) {
        this.id = config.id || 'goal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        this.description = config.description || '';
        this.type = config.type || GoalType.PERSONAL;

        // 优先级 (0-1)
        this.priority = config.priority || 0.5;

        // 状态
        this.status = config.status || GoalStatus.PENDING;

        // 子目标
        this.subGoals = config.subGoals || [];

        // 进度
        this.progress = 0;
        this.targetProgress = config.targetProgress || 1;

        // 时间约束
        this.createdAt = Date.now();
        this.deadline = config.deadline || null;
        this.estimatedDuration = config.estimatedDuration || null;

        // 相关行为
        this.relatedActions = config.relatedActions || [];

        // 成功/失败条件
        this.successCondition = config.successCondition || null;
        this.failureCondition = config.failureCondition || null;

        // 元数据
        this.metadata = config.metadata || {};
    }

    /**
     * 更新进度
     */
    updateProgress(amount) {
        this.progress = Math.min(this.targetProgress, this.progress + amount);

        if (this.progress >= this.targetProgress) {
            this.status = GoalStatus.COMPLETED;
        }

        return this.progress;
    }

    /**
     * 检查是否过期
     */
    isExpired() {
        return this.deadline && Date.now() > this.deadline;
    }

    /**
     * 检查条件是否满足
     */
    checkConditions(context) {
        // 检查成功条件
        if (this.successCondition && this.successCondition(context)) {
            this.status = GoalStatus.COMPLETED;
            return 'completed';
        }

        // 检查失败条件
        if (this.failureCondition && this.failureCondition(context)) {
            this.status = GoalStatus.FAILED;
            return 'failed';
        }

        // 检查过期
        if (this.isExpired()) {
            this.status = GoalStatus.FAILED;
            return 'expired';
        }

        return null;
    }

    /**
     * 获取有效优先级
     * 考虑时间压力
     */
    getEffectivePriority() {
        let effectivePriority = this.priority;

        // 如果有截止日期，根据剩余时间调整优先级
        if (this.deadline) {
            const remaining = this.deadline - Date.now();
            const total = this.deadline - this.createdAt;
            const urgency = 1 - (remaining / total);
            effectivePriority += urgency * 0.3;
        }

        // 根据进度调整
        const progressBonus = this.progress / this.targetProgress * 0.1;
        effectivePriority += progressBonus;

        return Math.min(1, effectivePriority);
    }

    /**
     * 添加子目标
     */
    addSubGoal(subGoal) {
        this.subGoals.push(subGoal);
        return subGoal;
    }

    /**
     * 导出
     */
    export() {
        return {
            id: this.id,
            description: this.description,
            type: this.type,
            priority: this.priority,
            status: this.status,
            progress: this.progress,
            targetProgress: this.targetProgress,
            deadline: this.deadline,
            subGoals: this.subGoals.map(g => g.export ? g.export() : g)
        };
    }
}

/**
 * 目标管理系统
 */
class GoalSystem {
    constructor(config = {}) {
        // 活跃目标列表
        this.goals = [];

        // 已完成目标历史
        this.completedGoals = [];

        // 最大活跃目标数
        this.maxActiveGoals = config.maxActiveGoals || 5;

        // 默认目标模板
        this.templates = new Map();
        this.initDefaultTemplates();
    }

    /**
     * 初始化默认目标模板
     */
    initDefaultTemplates() {
        // 基本需求目标
        this.registerTemplate('eat', {
            description: 'Find food and eat',
            type: GoalType.NEED,
            priority: 0.8,
            relatedActions: ['move_to_restaurant', 'eat', 'buy_food']
        });

        this.registerTemplate('rest', {
            description: 'Get some rest',
            type: GoalType.NEED,
            priority: 0.9,
            relatedActions: ['move_to_home', 'sleep', 'relax']
        });

        this.registerTemplate('socialize', {
            description: 'Meet and talk with others',
            type: GoalType.SOCIAL,
            priority: 0.5,
            relatedActions: ['move_to_social_place', 'start_conversation', 'join_activity']
        });

        this.registerTemplate('work', {
            description: 'Complete work tasks',
            type: GoalType.WORK,
            priority: 0.7,
            relatedActions: ['move_to_work', 'work', 'complete_task']
        });

        this.registerTemplate('explore', {
            description: 'Explore new places',
            type: GoalType.EXPLORATION,
            priority: 0.3,
            relatedActions: ['move_to_new_place', 'look_around']
        });
    }

    /**
     * 注册目标模板
     */
    registerTemplate(name, template) {
        this.templates.set(name, template);
    }

    /**
     * 从模板创建目标
     */
    createFromTemplate(templateName, overrides = {}) {
        const template = this.templates.get(templateName);
        if (!template) {
            console.warn(`Template not found: ${templateName}`);
            return null;
        }

        return new Goal({
            ...template,
            ...overrides
        });
    }

    /**
     * 添加目标
     */
    addGoal(goal) {
        if (this.goals.length >= this.maxActiveGoals) {
            // 移除优先级最低的目标
            this.goals.sort((a, b) => b.getEffectivePriority() - a.getEffectivePriority());
            const removed = this.goals.pop();
            if (removed) {
                removed.status = GoalStatus.ABANDONED;
            }
        }

        this.goals.push(goal);
        return goal;
    }

    /**
     * 移除目标
     */
    removeGoal(goalId) {
        const index = this.goals.findIndex(g => g.id === goalId);
        if (index !== -1) {
            const removed = this.goals.splice(index, 1)[0];
            return removed;
        }
        return null;
    }

    /**
     * 完成目标
     */
    completeGoal(goalId) {
        const goal = this.goals.find(g => g.id === goalId);
        if (goal) {
            goal.status = GoalStatus.COMPLETED;
            this.completedGoals.push(goal);
            this.removeGoal(goalId);
            return goal;
        }
        return null;
    }

    /**
     * 获取最高优先级目标
     */
    getTopGoal() {
        if (this.goals.length === 0) return null;

        // 更新有效优先级并排序
        this.goals.forEach(g => g._effectivePriority = g.getEffectivePriority());
        this.goals.sort((a, b) => b._effectivePriority - a._effectivePriority);

        return this.goals[0];
    }

    /**
     * 获取所有活跃目标
     */
    getActiveGoals() {
        return this.goals.filter(g =>
            g.status === GoalStatus.ACTIVE ||
            g.status === GoalStatus.PENDING ||
            g.status === GoalStatus.IN_PROGRESS
        );
    }

    /**
     * 根据需求生成目标
     */
    generateNeedsGoals(needs) {
        const goals = [];

        needs.forEach(need => {
            let templateName = null;
            let priority = need.urgency;

            switch (need.type) {
                case 'hunger':
                    templateName = 'eat';
                    break;
                case 'energy':
                    templateName = 'rest';
                    break;
                case 'social':
                    templateName = 'socialize';
                    break;
            }

            if (templateName) {
                const goal = this.createFromTemplate(templateName, { priority });
                if (goal) {
                    goals.push(goal);
                }
            }
        });

        return goals;
    }

    /**
     * 更新目标状态
     */
    updateGoals(context) {
        const results = [];

        this.goals.forEach(goal => {
            const result = goal.checkConditions(context);
            if (result) {
                results.push({ goal, result });
            }
        });

        return results;
    }

    /**
     * 获取目标建议的行动
     */
    getSuggestedActions(goal) {
        if (!goal || !goal.relatedActions) return [];

        return goal.relatedActions;
    }

    /**
     * 导出
     */
    export() {
        return {
            goals: this.goals.map(g => g.export()),
            completedGoals: this.completedGoals.slice(-50).map(g => g.export())
        };
    }

    /**
     * 导入
     */
    import(data) {
        if (data.goals) {
            this.goals = data.goals.map(g => new Goal(g));
        }
        if (data.completedGoals) {
            this.completedGoals = data.completedGoals.map(g => new Goal(g));
        }
    }
}

export {
    Goal,
    GoalSystem,
    GoalStatus,
    GoalType
};
