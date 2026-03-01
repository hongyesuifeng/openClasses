/**
 * EvaluatorAgent - 质量评估Agent
 *
 * 知识点: Reflection范式（反思与改进）
 * 职责: 评估研究报告质量，提供改进建议
 */

import { BaseAgent } from '../framework/agent_framework.js';

export class EvaluatorAgent extends BaseAgent {
    constructor(config) {
        super({
            name: 'EvaluatorAgent',
            ...config
        });
    }

    /**
     * 评估研究报告
     * 使用Reflection范式进行质量评估
     */
    async evaluateReport(report) {
        this.emitProgress('evaluating', '正在评估研究报告质量...');

        const evaluation = await this.reflect(report, this.getEvaluationCriteria());

        this.emitProgress('evaluation_complete', {
            overallScore: evaluation.overallScore,
            dimensionCount: Object.keys(evaluation.dimensions || {}).length
        });

        return evaluation;
    }

    /**
     * Reflection反思评估
     */
    async reflect(report, criteria) {
        const reflectionPrompt = this.buildReflectionPrompt(report, criteria);
        const feedback = await this.llm.generate(reflectionPrompt);

        const evaluation = this.parseReflection(feedback);

        // 添加报告元信息
        evaluation.reportId = report.id;
        evaluation.evaluatedAt = Date.now();

        // 保存评估结果到记忆
        this.memory.addLongTerm({
            type: 'report_evaluation',
            reportId: report.id,
            evaluation
        }, 0.8);

        return evaluation;
    }

    /**
     * 获取评估标准
     */
    getEvaluationCriteria() {
        return {
            dimensions: [
                { name: 'completeness', label: '完整性', description: '信息覆盖度、角度全面性、深度充分性' },
                { name: 'accuracy', label: '准确性', description: '事实准确性、引用正确性、逻辑一致性' },
                { name: 'timeliness', label: '时效性', description: '信息新鲜度、最新研究覆盖、数据时效性' },
                { name: 'reliability', label: '可靠性', description: '来源权威性、证据充分性、可重复性' },
                { name: 'readability', label: '可读性', description: '结构清晰度、表达简洁性、理解容易度' }
            ],
            scoreRange: { min: 1, max: 10 }
        };
    }

    /**
     * 构建反思Prompt
     */
    buildReflectionPrompt(report, criteria) {
        const reportSummary = this.summarizeReport(report);

        return `
你是一位专业的研究质量评估专家，负责评估研究报告的质量和提供改进建议。

## 评估报告概要

**报告标题**: ${report.title}
**研究主题**: ${report.topic}
**来源数量**: ${report.metadata.sourcesCount}
**字数**: ${report.metadata.wordCount}
**章节数量**: ${report.metadata.sectionsCount}

## 报告摘要

${reportSummary}

## 评估标准

请从以下维度评估报告质量:

1. **完整性 (Completeness)**
   - 信息是否覆盖主题的主要方面
   - 角度是否全面
   - 分析深度是否足够

2. **准确性 (Accuracy)**
   - 事实陈述是否准确
   - 引用是否正确
   - 逻辑是否一致

3. **时效性 (Timeliness)**
   - 信息是否新鲜
   - 是否覆盖最新研究
   - 数据是否及时

4. **可靠性 (Reliability)**
   - 来源是否权威
   - 证据是否充分
   - 结论是否可靠

5. **可读性 (Readability)**
   - 结构是否清晰
   - 表达是否简洁
   - 是否易于理解

## 评估要求

请以JSON格式输出评估结果:

{
    "overallScore": 8.5,
    "overallComment": "总体评价（1-2句话）",
    "dimensions": {
        "completeness": {
            "score": 8,
            "comment": "维度评价",
            "strengths": ["优点1", "优点2"],
            "weaknesses": ["不足1", "不足2"]
        },
        "accuracy": { ... },
        "timeliness": { ... },
        "reliability": { ... },
        "readability": { ... }
    },
    "strengths": [
        "整体优点1",
        "整体优点2",
        "整体优点3"
    ],
    "weaknesses": [
        "整体不足1",
        "整体不足2"
    ],
    "suggestions": [
        "改进建议1（具体可行）",
        "改进建议2（具体可行）",
        "改进建议3（具体可行）"
    ],
    "priorityActions": [
        { "action": "高优先级行动", "reason": "原因" },
        { "action": "中优先级行动", "reason": "原因" }
    ]
}

评分说明:
- 9-10分: 优秀
- 7-8分: 良好
- 5-6分: 一般
- 3-4分: 较差
- 1-2分: 很差

评估结果:
`;
    }

    /**
     * 总结报告
     */
    summarizeReport(report) {
        let summary = '';

        // 添加各章节标题
        report.sections.forEach(section => {
            summary += `\n### ${section.title}\n`;
            // 提取前200字作为预览
            const preview = section.content.slice(0, 200);
            summary += `${preview}${section.content.length > 200 ? '...' : ''}\n`;
        });

        return summary;
    }

    /**
     * 解析评估结果
     */
    parseReflection(feedback) {
        try {
            // 尝试提取JSON
            const jsonMatch = feedback.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);

                // 确保所有必要字段存在
                return {
                    overallScore: parsed.overallScore || 7.0,
                    overallComment: parsed.overallComment || '',
                    dimensions: parsed.dimensions || {},
                    strengths: parsed.strengths || [],
                    weaknesses: parsed.weaknesses || [],
                    suggestions: parsed.suggestions || [],
                    priorityActions: parsed.priorityActions || [],
                    rawEvaluation: feedback
                };
            }
        } catch (e) {
            console.warn('Failed to parse evaluation as JSON:', e);
        }

        // 备用解析
        return this.fallbackParse(feedback);
    }

    /**
     * 备用解析方法
     */
    fallbackParse(text) {
        return {
            overallScore: this.extractScore(text) || 7.0,
            overallComment: this.extractComment(text),
            dimensions: this.extractDimensionScores(text),
            strengths: this.extractListItems(text, ['strength', '优点', '优势', 'strengths']),
            weaknesses: this.extractListItems(text, ['weakness', '不足', '缺点', 'weaknesses']),
            suggestions: this.extractListItems(text, ['suggestion', '建议', 'improvement', 'suggestions']),
            priorityActions: [],
            rawEvaluation: text
        };
    }

    /**
     * 提取评分
     */
    extractScore(text) {
        const patterns = [
            /overall\s*score["\s:]+(\d+(?:\.\d+)?)/i,
            /总体评分["\s:]+(\d+(?:\.\d+)?)/i,
            /综合评分["\s:]+(\d+(?:\.\d+)?)/i,
            /["\s]score["\s:]+(\d+(?:\.\d+)?)/i
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                const score = parseFloat(match[1]);
                if (score >= 1 && score <= 10) {
                    return score;
                }
            }
        }

        return null;
    }

    /**
     * 提取评论
     */
    extractComment(text) {
        const patterns = [
            /overall\s*comment["\s:]+(["'])([^\1]+?)\1/i,
            /总体评价["\s:]+(["'])([^\1]+?)\1/i
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                return match[2];
            }
        }

        // 提取前100字作为评论
        return text.slice(0, 100) + '...';
    }

    /**
     * 提取维度评分
     */
    extractDimensionScores(text) {
        const dimensions = ['completeness', 'accuracy', 'timeliness', 'reliability', 'readability'];
        const result = {};

        for (const dim of dimensions) {
            const pattern = new RegExp(`${dim}["\\s:]+{\\s*"?:?score["\\s:]+(\\d+(?:\\.\\d+)?)`, 'i');
            const match = text.match(pattern);
            if (match) {
                result[dim] = {
                    score: parseFloat(match[1]),
                    comment: ''
                };
            } else {
                result[dim] = { score: 7.0, comment: '未评分' };
            }
        }

        return result;
    }

    /**
     * 提取列表项
     */
    extractListItems(text, keywords) {
        const items = [];
        const lines = text.split('\n');
        let inSection = false;

        for (const line of lines) {
            const trimmed = line.trim();

            // 检查是否进入目标段落
            if (keywords.some(k => trimmed.toLowerCase().includes(k))) {
                inSection = true;
                continue;
            }

            // 如果进入下一个段落，停止
            if (inSection && /^\d+\.|^-/.test(trimmed) === false && trimmed) {
                // 检查是否是新段落标题
                if (/^[#A-Z]/.test(trimmed)) {
                    break;
                }
            }

            // 提取列表项
            if (inSection && /^\d+\.|^-/.test(trimmed)) {
                const item = trimmed.replace(/^\d+\.|-\s*/, '').trim();
                if (item && item.length < 200) {
                    items.push(item);
                }
            }
        }

        return items;
    }

    /**
     * 生成质量报告
     */
    generateQualityReport(evaluation) {
        const report = {
            summary: this.generateSummary(evaluation),
            detail: this.generateDetail(evaluation),
            recommendations: this.generateRecommendations(evaluation)
        };

        return report;
    }

    /**
     * 生成评估摘要
     */
    generateSummary(evaluation) {
        return {
            overallScore: evaluation.overallScore,
            grade: this.getGrade(evaluation.overallScore),
            dimensionScores: this.getDimensionScores(evaluation.dimensions),
            summary: evaluation.overallComment
        };
    }

    /**
     * 获取等级
     */
    getGrade(score) {
        if (score >= 9) return '优秀 (A)';
        if (score >= 7) return '良好 (B)';
        if (score >= 5) return '一般 (C)';
        if (score >= 3) return '较差 (D)';
        return '很差 (F)';
    }

    /**
     * 获取维度评分
     */
    getDimensionScores(dimensions) {
        const scores = {};
        for (const [key, value] of Object.entries(dimensions)) {
            scores[key] = value.score || 7.0;
        }
        return scores;
    }

    /**
     * 生成详细报告
     */
    generateDetail(evaluation) {
        const detail = {
            strengths: evaluation.strengths,
            weaknesses: evaluation.weaknesses,
            dimensionDetails: evaluation.dimensions
        };

        return detail;
    }

    /**
     * 生成改进建议
     */
    generateRecommendations(evaluation) {
        return {
            suggestions: evaluation.suggestions,
            priorityActions: evaluation.priorityActions,
            quickWins: evaluation.suggestions.slice(0, 3)
        };
    }

    /**
     * 评估对比（对比多个报告）
     */
    async compareEvaluations(evaluations) {
        this.emitProgress('comparing_evaluations', `对比${evaluations.length}个评估结果...`);

        const comparison = {
            count: evaluations.length,
            averageScore: evaluations.reduce((sum, e) => sum + e.overallScore, 0) / evaluations.length,
            bestReport: evaluations.reduce((best, current) =>
                current.overallScore > best.overallScore ? current : best
            ),
            dimensionComparison: {}
        };

        // 对比各维度
        const dimensions = Object.keys(evaluations[0].dimensions || {});
        for (const dim of dimensions) {
            const scores = evaluations.map(e => e.dimensions?.[dim]?.score || 0);
            comparison.dimensionComparison[dim] = {
                average: scores.reduce((a, b) => a + b, 0) / scores.length,
                best: Math.max(...scores),
                worst: Math.min(...scores)
            };
        }

        return comparison;
    }
}
