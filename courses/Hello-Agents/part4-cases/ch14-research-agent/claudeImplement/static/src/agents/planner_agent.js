/**
 * PlannerAgent - 研究规划Agent
 *
 * 知识点: Plan-and-Solve范式
 * 职责: 将研究主题分解为可执行的研究计划
 */

import { BaseAgent } from '../framework/agent_framework.js';

export class PlannerAgent extends BaseAgent {
    constructor(config) {
        super({
            name: 'PlannerAgent',
            ...config
        });
    }

    /**
     * 生成研究计划
     * 使用Plan-and-Solve范式的Plan阶段
     */
    async createResearchPlan(topic) {
        this.emitProgress('planning', `正在为"${topic}"制定研究计划...`);

        // 直接调用makePlan而不是planAndSolve
        const plan = await this.makePlan(topic);

        this.emitProgress('plan_created', plan);

        return plan;
    }

    /**
     * 制定计划（Plan阶段）
     */
    async makePlan(topic) {
        const prompt = this.buildPlanPrompt(topic);
        const response = await this.llm.generate(prompt);

        const steps = this.parsePlan(response);

        // 为每个步骤生成查询
        const queries = await this.generateQueries(topic, steps);

        return {
            topic,
            steps,
            queries,
            estimatedDuration: steps.length * 5 // 估算时间（分钟）
        };
    }

    /**
     * 构建规划Prompt - 中文简化版本
     */
    buildPlanPrompt(topic) {
        return `请为研究主题"${topic}"制定研究计划。

列出5个研究步骤（用数字编号）:
1. [第一步]
2. [第二步]
...

步骤:`;
    }

    /**
     * 为每个步骤生成搜索查询 - 增强版本，生成更多查询
     */
    async generateQueries(topic, steps) {
        const queries = [];

        // 生成多维度搜索查询，确保获取足够的参考资料
        const queryDimensions = [
            // 历史发展
            { query: `${topic} 发展历史 演进过程`, source: 'academic', reason: '了解历史发展' },
            { query: `${topic} 发展历程 里程碑`, source: 'web', reason: '关键事件和里程碑' },
            { query: `${topic} 历史回顾 发展脉络`, source: 'academic', reason: '发展脉络梳理' },

            // 技术原理
            { query: `${topic} 核心技术 原理`, source: 'academic', reason: '核心技术原理' },
            { query: `${topic} 算法 架构 设计`, source: 'academic', reason: '算法和架构' },
            { query: `${topic} 技术原理 实现方法`, source: 'web', reason: '实现方法详解' },

            // 应用实践
            { query: `${topic} 应用场景 案例`, source: 'web', reason: '应用案例分析' },
            { query: `${topic} 实践 经验 最佳实践`, source: 'web', reason: '最佳实践经验' },
            { query: `${topic} 行业应用 解决方案`, source: 'web', reason: '行业解决方案' },

            // 发展趋势
            { query: `${topic} 发展趋势 未来`, source: 'academic', reason: '未来发展趋势' },
            { query: `${topic} 前沿技术 创新`, source: 'academic', reason: '前沿技术创新' },
            { query: `${topic} 市场前景 预测`, source: 'news', reason: '市场前景预测' },

            // 挑战与机遇
            { query: `${topic} 挑战 问题 难点`, source: 'academic', reason: '面临的主要挑战' },
            { query: `${topic} 机遇 发展机会`, source: 'news', reason: '发展机遇分析' },
            { query: `${topic} 瓶颈 突破方向`, source: 'academic', reason: '技术瓶颈和突破' }
        ];

        // 添加查询到结果
        queries.push({
            stepIndex: 0,
            step: '多维度信息收集',
            queries: queryDimensions
        });

        return queries;
    }

    /**
     * 解析计划步骤
     */
    parsePlan(text) {
        const lines = text.split('\n');
        const steps = [];
        const stepRegex = /^(\d+)[.、.)]?\s*(.+)/;

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            const match = trimmed.match(stepRegex);
            if (match) {
                steps.push(match[2].trim());
            } else if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
                steps.push(trimmed.substring(1).trim());
            }
        }

        // 如果没有解析到步骤，返回原文本
        if (steps.length === 0) {
            return [text];
        }

        return steps;
    }

    /**
     * 提取查询列表
     */
    extractQueries(text) {
        try {
            // 尝试提取JSON
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                if (parsed.queries && Array.isArray(parsed.queries)) {
                    return parsed.queries;
                }
            }
        } catch (e) {
            console.warn('Failed to parse queries as JSON:', e);
        }

        // 备用解析方法
        const queries = [];
        const lines = text.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('-') || trimmed.startsWith('*') || /^\d+/.test(trimmed)) {
                const query = trimmed.replace(/^[-*]?\d*\.?\s*/, '').trim();
                if (query) {
                    queries.push({ query, source: 'academic', reason: 'auto-generated' });
                }
            }
        }

        return queries.length > 0 ? queries : [{ query: text, source: 'academic', reason: 'fallback' }];
    }

    /**
     * 执行步骤（Solve阶段的单个步骤执行）
     */
    async executeStep(step, originalQuery, previousResults) {
        // 在规划阶段，我们主要返回步骤信息
        // 实际执行由其他Agent完成
        return {
            step,
            status: 'planned',
            dependencies: previousResults.map(r => r.step)
        };
    }

    /**
     * 综合规划结果
     */
    async synthesizeResults(plan, results) {
        return {
            plan,
            execution: results,
            ready: true
        };
    }
}
