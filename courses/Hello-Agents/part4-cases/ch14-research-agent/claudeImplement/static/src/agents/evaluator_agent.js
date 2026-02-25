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
     * 构建反思Prompt - 中文简化版本
     */
    buildReflectionPrompt(report, criteria) {
        return `请评估这份研究报告的质量。

主题: ${report.topic}
来源数量: ${report.metadata.sourcesCount}
字数: ${report.metadata.wordCount}

请按1-10分评估以下维度:
1. 完整性 (覆盖度)
2. 准确性 (事实正确)
3. 时效性 (最新信息)
4. 可靠性 (来源权威)
5. 可读性 (清晰易懂)

请用以下JSON格式回复(只输出JSON):
{"overallScore":7.5,"overallComment":"总体评价","dimensions":{"completeness":{"score":7,"comment":"评价"},"accuracy":{"score":8,"comment":"评价"},"timeliness":{"score":7,"comment":"评价"},"reliability":{"score":7,"comment":"评价"},"readability":{"score":8,"comment":"评价"}},"strengths":["优点1","优点2"],"weaknesses":["不足1"],"suggestions":["建议1"]}

JSON:`;
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
     * 解析评估结果 - 增强容错
     */
    parseReflection(feedback) {
        console.log('Parsing evaluation feedback:', feedback.substring(0, 200));

        try {
            // 尝试多种方式提取JSON
            let jsonStr = null;

            // 方法1: 查找第一个 { 到最后一个 }
            const firstBrace = feedback.indexOf('{');
            const lastBrace = feedback.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                jsonStr = feedback.substring(firstBrace, lastBrace + 1);
            }

            // 方法2: 使用正则
            if (!jsonStr) {
                const jsonMatch = feedback.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    jsonStr = jsonMatch[0];
                }
            }

            if (jsonStr) {
                // 清理常见的JSON格式问题
                jsonStr = jsonStr
                    .replace(/,\s*}/g, '}')  // 移除尾随逗号
                    .replace(/,\s*]/g, ']')  // 移除数组尾随逗号
                    .replace(/'/g, '"')      // 单引号转双引号
                    .replace(/\n/g, ' ')     // 移除换行
                    .replace(/\s+/g, ' ');   // 压缩空格

                const parsed = JSON.parse(jsonStr);

                // 确保所有必要字段存在
                return {
                    overallScore: parsed.overallScore || 7.0,
                    overallComment: parsed.overallComment || 'Evaluation completed',
                    dimensions: this.normalizeDimensions(parsed.dimensions),
                    strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
                    weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
                    suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
                    priorityActions: Array.isArray(parsed.priorityActions) ? parsed.priorityActions : [],
                    rawEvaluation: feedback
                };
            }
        } catch (e) {
            console.warn('Failed to parse evaluation as JSON:', e.message);
        }

        // 备用解析
        return this.fallbackParse(feedback);
    }

    /**
     * 标准化维度数据
     */
    normalizeDimensions(dimensions) {
        const defaultDims = ['completeness', 'accuracy', 'timeliness', 'reliability', 'readability'];
        const result = {};

        for (const dim of defaultDims) {
            if (dimensions && dimensions[dim]) {
                const d = dimensions[dim];
                result[dim] = {
                    score: typeof d.score === 'number' ? d.score : (typeof d === 'number' ? d : 7),
                    comment: d.comment || ''
                };
            } else {
                result[dim] = { score: 7, comment: '' };
            }
        }

        return result;
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
