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
     * 构建规划Prompt
     */
    buildPlanPrompt(topic) {
        return `
你是一位专业的研究规划专家。请为以下研究主题制定详细的研究计划。

研究主题: ${topic}

请将研究主题分解为 3-7 个具体的、可执行的步骤。

每个步骤应该:
- 清晰具体，明确要做什么
- 可以独立执行
- 逻辑顺序合理
- 有明确的产出

格式要求:
1. [第一步描述]
2. [第二步描述]
3. [第三步描述]
...

请只输出步骤列表，不要包含其他内容。

计划:
`;
    }

    /**
     * 为每个步骤生成搜索查询
     */
    async generateQueries(topic, steps) {
        const queries = [];

        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            this.emitProgress('generating_query', `步骤${i + 1}: ${step}`);

            const queryPrompt = `
基于研究主题"${topic}"和研究步骤"${step}"，生成3个优化过的搜索查询。

查询要求:
- 针对学术研究（英文优先）
- 使用专业术语
- 包含时间限定（近3-5年）
- 每个查询角度不同

格式（JSON）:
{
    "queries": [
        {"query": "...", "source": "academic", "reason": "..."},
        {"query": "...", "source": "web", "reason": "..."},
        {"query": "...", "source": "news", "reason": "..."}
    ]
}
`;

            const response = await this.llm.generate(queryPrompt);
            const stepQueries = this.extractQueries(response);

            queries.push({
                stepIndex: i,
                step,
                queries: stepQueries
            });

            // 保存到记忆
            this.memory.addShortTerm({
                type: 'query_generated',
                step,
                queries: stepQueries
            });
        }

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
