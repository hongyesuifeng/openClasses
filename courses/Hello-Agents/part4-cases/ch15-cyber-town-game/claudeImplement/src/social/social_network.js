/**
 * 社交网络系统 - SocialNetwork
 *
 * 管理整个小镇的社交网络：
 * 1. 网络可视化数据
 * 2. 社交影响力计算
 * 3. 社区发现
 *
 * 知识点映射：
 * - 第15章：社交网络分析
 */

import { RelationshipSystem, RelationType } from './relationship.js';

/**
 * 社交网络分析类
 */
class SocialNetwork {
    constructor(config = {}) {
        this.relationshipSystem = config.relationshipSystem || new RelationshipSystem();
        this.nodes = new Map(); // 角色节点
        this.edges = [];        // 关系边
    }

    /**
     * 添加节点（角色）
     */
    addNode(character) {
        this.nodes.set(character.name, {
            id: character.name,
            name: character.name,
            personality: character.personality,
            location: character.location,
            connections: 0,
            influence: 0
        });
    }

    /**
     * 更新边（关系）
     */
    updateEdges() {
        this.edges = [];
        const networkData = this.relationshipSystem.getNetworkData();

        this.edges = networkData.links.map(link => ({
            source: link.source,
            target: link.target,
            weight: Math.abs(link.value),
            type: link.type,
            positive: link.value > 0
        }));

        // 更新节点连接数
        this.nodes.forEach(node => {
            node.connections = this.edges.filter(
                e => e.source === node.id || e.target === node.id
            ).length;
        });
    }

    /**
     * 获取可视化数据
     */
    getVisualizationData() {
        this.updateEdges();

        const nodes = Array.from(this.nodes.values()).map(node => ({
            ...node,
            // 节点大小基于连接数
            size: 10 + node.connections * 3,
            // 颜色基于影响力
            color: this.getNodeColor(node)
        }));

        return {
            nodes,
            links: this.edges
        };
    }

    /**
     * 获取节点颜色
     */
    getNodeColor(node) {
        const influence = node.influence || 0;
        if (influence > 0.7) return '#4CAF50'; // 高影响力 - 绿色
        if (influence > 0.4) return '#2196F3'; // 中影响力 - 蓝色
        return '#9E9E9E'; // 低影响力 - 灰色
    }

    /**
     * 计算社交影响力
     * 基于连接数量和质量
     */
    calculateInfluence(characterName) {
        const node = this.nodes.get(characterName);
        if (!node) return 0;

        const connections = this.edges.filter(
            e => e.source === characterName || e.target === characterName
        );

        if (connections.length === 0) return 0;

        // 影响力 = 连接数 × 平均关系强度
        const avgWeight = connections.reduce((sum, e) => sum + e.weight, 0) / connections.length;
        const influence = (connections.length / this.nodes.size) * avgWeight;

        node.influence = influence;
        return influence;
    }

    /**
     * 计算所有角色的影响力
     */
    calculateAllInfluence() {
        const influences = {};
        this.nodes.forEach((_, name) => {
            influences[name] = this.calculateInfluence(name);
        });
        return influences;
    }

    /**
     * 获取最有影响力的角色
     */
    getMostInfluential(limit = 3) {
        const influences = this.calculateAllInfluence();
        const sorted = Object.entries(influences)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit);

        return sorted.map(([name, influence]) => ({
            name,
            influence
        }));
    }

    /**
     * 发现社区（简化版）
     * 基于关系强度进行分组
     */
    detectCommunities() {
        const communities = [];
        const visited = new Set();

        this.nodes.forEach((_, nodeName) => {
            if (visited.has(nodeName)) return;

            const community = this.findConnectedComponent(nodeName, visited);
            if (community.length > 1) {
                communities.push(community);
            }
        });

        return communities;
    }

    /**
     * 找到连通分量
     */
    findConnectedComponent(startNode, visited) {
        const component = [];
        const queue = [startNode];

        while (queue.length > 0) {
            const current = queue.shift();
            if (visited.has(current)) continue;

            visited.add(current);
            component.push(current);

            // 找到相邻节点（关系值 > 0.3）
            const neighbors = this.edges
                .filter(e =>
                    (e.source === current || e.target === current) &&
                    e.weight > 0.3
                )
                .map(e => e.source === current ? e.target : e.source);

            neighbors.forEach(n => {
                if (!visited.has(n)) {
                    queue.push(n);
                }
            });
        }

        return component;
    }

    /**
     * 找到共同朋友
     */
    findMutualFriends(char1, char2) {
        const friends1 = this.getFriends(char1);
        const friends2 = this.getFriends(char2);

        return friends1.filter(f => friends2.includes(f));
    }

    /**
     * 获取朋友列表
     */
    getFriends(characterName) {
        return this.edges
            .filter(e =>
                (e.source === characterName || e.target === characterName) &&
                e.positive &&
                e.weight > 0.3
            )
            .map(e => e.source === characterName ? e.target : e.source);
    }

    /**
     * 获取社交推荐
     * 推荐可能成为朋友的角色
     */
    getRecommendations(characterName, limit = 3) {
        const currentFriends = new Set(this.getFriends(characterName));
        currentFriends.add(characterName);

        const recommendations = [];
        const potentialScores = new Map();

        // 通过共同朋友计算推荐分数
        currentFriends.forEach(friend => {
            const friendsOfFriend = this.getFriends(friend);
            friendsOfFriend.forEach(fof => {
                if (!currentFriends.has(fof)) {
                    potentialScores.set(fof, (potentialScores.get(fof) || 0) + 1);
                }
            });
        });

        // 排序并返回
        potentialScores.forEach((score, name) => {
            recommendations.push({ name, score });
        });

        recommendations.sort((a, b) => b.score - a.score);
        return recommendations.slice(0, limit);
    }

    /**
     * 获取网络统计信息
     */
    getStatistics() {
        const influences = this.calculateAllInfluence();
        const influenceValues = Object.values(influences);

        return {
            nodeCount: this.nodes.size,
            edgeCount: this.edges.length,
            avgConnections: this.edges.length * 2 / this.nodes.size || 0,
            avgInfluence: influenceValues.reduce((a, b) => a + b, 0) / influenceValues.length || 0,
            mostInfluential: this.getMostInfluential(1)[0],
            communities: this.detectCommunities().length
        };
    }

    /**
     * 导出网络数据
     */
    export() {
        return {
            nodes: Array.from(this.nodes.entries()),
            edges: this.edges,
            relationships: this.relationshipSystem.export()
        };
    }

    /**
     * 导入网络数据
     */
    import(data) {
        if (data.nodes) {
            this.nodes = new Map(data.nodes);
        }
        if (data.relationships) {
            this.relationshipSystem.import(data.relationships);
        }
        this.updateEdges();
    }
}

/**
 * 社交网络工具函数
 */

/**
 * 计算两个角色之间的社交距离
 */
function calculateSocialDistance(socialNetwork, char1, char2) {
    // BFS找最短路径
    const visited = new Set();
    const queue = [{ node: char1, distance: 0 }];
    visited.add(char1);

    while (queue.length > 0) {
        const { node, distance } = queue.shift();

        if (node === char2) {
            return distance;
        }

        const friends = socialNetwork.getFriends(node);
        friends.forEach(friend => {
            if (!visited.has(friend)) {
                visited.add(friend);
                queue.push({ node: friend, distance: distance + 1 });
            }
        });
    }

    return Infinity; // 没有连接
}

/**
 * 判断是否是小团体（clique）
 */
function isClique(socialNetwork, characters) {
    for (let i = 0; i < characters.length; i++) {
        for (let j = i + 1; j < characters.length; j++) {
            const friends = socialNetwork.getFriends(characters[i]);
            if (!friends.includes(characters[j])) {
                return false;
            }
        }
    }
    return true;
}

export {
    SocialNetwork,
    calculateSocialDistance,
    isClique
};
