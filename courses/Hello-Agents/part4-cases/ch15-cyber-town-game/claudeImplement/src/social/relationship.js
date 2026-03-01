/**
 * 关系系统 - Relationship
 *
 * 管理角色之间的关系：
 * 1. 关系值存储与更新
 * 2. 关系变化规则
 * 3. 关系类型定义
 *
 * 知识点映射：
 * - 第15章：社交网络
 */

/**
 * 关系类型
 */
const RelationType = {
    FRIEND: 'friend',           // 朋友
    ACQUAINTANCE: 'acquaintance', // 熟人
    STRANGER: 'stranger',       // 陌生人
    DISLIKE: 'dislike',         // 不喜欢
    ENEMY: 'enemy',             // 敌人
    FAMILY: 'family',           // 家人
    COLLEAGUE: 'colleague',     // 同事
    ROMANTIC: 'romantic'        // 恋爱关系
};

/**
 * 关系等级阈值
 */
const RELATION_THRESHOLDS = {
    [RelationType.ENEMY]: -0.6,
    [RelationType.DISLIKE]: -0.3,
    [RelationType.STRANGER]: 0,
    [RelationType.ACQUAINTANCE]: 0.3,
    [RelationType.FRIEND]: 0.6,
    [RelationType.FAMILY]: 0.8,
    [RelationType.COLLEAGUE]: 0.4,
    [RelationType.ROMANTIC]: 0.7
};

/**
 * 关系类
 */
class Relationship {
    constructor(fromChar, toChar, initialValue = 0) {
        this.from = fromChar;
        this.to = toChar;
        this.value = initialValue;
        this.type = this.determineType(initialValue);

        // 互动历史
        this.interactions = [];
        this.interactionCount = 0;

        // 关系属性
        this.trust = 0.5;      // 信任度
        this.familiarity = 0;  // 熟悉度
        this.respect = 0.5;    // 尊重度

        // 时间戳
        this.establishedAt = Date.now();
        this.lastInteraction = null;
    }

    /**
     * 根据值确定关系类型
     */
    determineType(value) {
        if (value >= RELATION_THRESHOLDS[RelationType.FRIEND]) {
            return RelationType.FRIEND;
        } else if (value >= RELATION_THRESHOLDS[RelationType.ACQUAINTANCE]) {
            return RelationType.ACQUAINTANCE;
        } else if (value <= RELATION_THRESHOLDS[RelationType.DISLIKE]) {
            return RelationType.DISLIKE;
        } else if (value <= RELATION_THRESHOLDS[RelationType.ENEMY]) {
            return RelationType.ENEMY;
        }
        return RelationType.STRANGER;
    }

    /**
     * 更新关系值
     */
    updateValue(delta) {
        this.value = Math.max(-1, Math.min(1, this.value + delta));
        this.type = this.determineType(this.value);
    }

    /**
     * 记录互动
     */
    recordInteraction(interaction, sentiment) {
        this.interactions.push({
            description: interaction,
            sentiment,
            timestamp: Date.now()
        });

        this.interactionCount++;
        this.lastInteraction = Date.now();

        // 更新熟悉度
        this.familiarity = Math.min(1, this.familiarity + 0.05);

        // 限制历史记录
        if (this.interactions.length > 50) {
            this.interactions.shift();
        }

        // 根据互动情感更新关系
        this.updateValue(sentiment * 0.1);
    }

    /**
     * 获取关系摘要
     */
    getSummary() {
        return {
            from: this.from,
            to: this.to,
            value: this.value,
            type: this.type,
            interactionCount: this.interactionCount,
            familiarity: this.familiarity,
            trust: this.trust,
            lastInteraction: this.lastInteraction
        };
    }

    /**
     * 导出
     */
    export() {
        return {
            from: this.from,
            to: this.to,
            value: this.value,
            type: this.type,
            interactions: this.interactions,
            interactionCount: this.interactionCount,
            trust: this.trust,
            familiarity: this.familiarity,
            respect: this.respect
        };
    }
}

/**
 * 关系管理系统
 */
class RelationshipSystem {
    constructor(config = {}) {
        // 关系矩阵 from -> to -> Relationship
        this.relationships = new Map();

        // 关系变化规则
        this.modifiers = {
            positive_interaction: 0.1,
            negative_interaction: -0.1,
            shared_activity: 0.05,
            conflict: -0.2,
            help: 0.15,
            betrayal: -0.3
        };
    }

    /**
     * 获取或创建关系
     */
    getOrCreateRelationship(fromChar, toChar) {
        if (!this.relationships.has(fromChar)) {
            this.relationships.set(fromChar, new Map());
        }

        const charRelations = this.relationships.get(fromChar);
        if (!charRelations.has(toChar)) {
            charRelations.set(toChar, new Relationship(fromChar, toChar, 0));
        }

        return charRelations.get(toChar);
    }

    /**
     * 获取关系值
     */
    getRelationshipValue(fromChar, toChar) {
        const rel = this.getOrCreateRelationship(fromChar, toChar);
        return rel.value;
    }

    /**
     * 更新关系
     */
    updateRelationship(fromChar, toChar, delta) {
        const rel = this.getOrCreateRelationship(fromChar, toChar);
        rel.updateValue(delta);
        return rel;
    }

    /**
     * 记录互动
     */
    recordInteraction(fromChar, toChar, interaction, sentiment) {
        // 双向记录
        const rel1 = this.getOrCreateRelationship(fromChar, toChar);
        rel1.recordInteraction(interaction, sentiment);

        const rel2 = this.getOrCreateRelationship(toChar, fromChar);
        rel2.recordInteraction(interaction, sentiment * 0.8); // 反向影响稍小

        return { rel1, rel2 };
    }

    /**
     * 获取角色的所有关系
     */
    getCharacterRelationships(charName) {
        const relations = this.relationships.get(charName);
        if (!relations) return [];

        const result = [];
        relations.forEach((rel, targetName) => {
            result.push(rel.getSummary());
        });

        return result;
    }

    /**
     * 获取最亲密的关系
     */
    getClosestRelationship(charName) {
        const relations = this.getCharacterRelationships(charName);
        if (relations.length === 0) return null;

        relations.sort((a, b) => b.value - a.value);
        return relations[0];
    }

    /**
     * 获取关系最好的角色（朋友推荐）
     */
    getPotentialFriends(charName, limit = 3) {
        const relations = this.getCharacterRelationships(charName);
        const potential = relations.filter(r =>
            r.type === RelationType.ACQUAINTANCE ||
            r.type === RelationType.STRANGER
        );

        potential.sort((a, b) => b.value - a.value);
        return potential.slice(0, limit);
    }

    /**
     * 检查是否可以互动
     */
    canInteract(fromChar, toChar) {
        const rel = this.getOrCreateRelationship(fromChar, toChar);
        // 敌人不太可能互动
        return rel.type !== RelationType.ENEMY;
    }

    /**
     * 获取社交网络数据（用于可视化）
     */
    getNetworkData() {
        const nodes = new Set();
        const links = [];

        this.relationships.forEach((targets, from) => {
            nodes.add(from);
            targets.forEach((rel, to) => {
                nodes.add(to);
                if (Math.abs(rel.value) > 0.1) {
                    links.push({
                        source: from,
                        target: to,
                        value: rel.value,
                        type: rel.type
                    });
                }
            });
        });

        return {
            nodes: Array.from(nodes).map(name => ({ id: name, name })),
            links
        };
    }

    /**
     * 导出所有关系
     */
    export() {
        const data = {};
        this.relationships.forEach((targets, from) => {
            data[from] = {};
            targets.forEach((rel, to) => {
                data[from][to] = rel.export();
            });
        });
        return data;
    }

    /**
     * 导入关系
     */
    import(data) {
        this.relationships.clear();
        Object.entries(data).forEach(([from, targets]) => {
            this.relationships.set(from, new Map());
            Object.entries(targets).forEach(([to, relData]) => {
                const rel = new Relationship(from, to, relData.value);
                rel.interactions = relData.interactions || [];
                rel.interactionCount = relData.interactionCount || 0;
                rel.trust = relData.trust || 0.5;
                rel.familiarity = relData.familiarity || 0;
                rel.respect = relData.respect || 0.5;
                this.relationships.get(from).set(to, rel);
            });
        });
    }
}

/**
 * 关系工具函数
 */

/**
 * 计算互动后的关系变化
 */
function calculateRelationshipChange(interaction, personality) {
    let baseChange = 0;

    switch (interaction.type) {
        case 'positive':
            baseChange = 0.1;
            break;
        case 'negative':
            baseChange = -0.1;
            break;
        case 'neutral':
            baseChange = 0;
            break;
        case 'conflict':
            baseChange = -0.2;
            break;
        case 'help':
            baseChange = 0.15;
            break;
    }

    // 宜人性影响关系变化
    const agreeablenessModifier = (personality.agreeableness - 0.5) * 0.5;
    return baseChange * (1 + agreeablenessModifier);
}

/**
 * 判断是否愿意帮助
 */
function wouldHelp(relationship, personality) {
    // 基于关系值和宜人性判断
    const helpThreshold = 0.3 - (personality.agreeableness * 0.2);
    return relationship.value > helpThreshold;
}

export {
    Relationship,
    RelationshipSystem,
    RelationType,
    RELATION_THRESHOLDS,
    calculateRelationshipChange,
    wouldHelp
};
