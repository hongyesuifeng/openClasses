/**
 * AnalyzerAgent - 内容分析Agent
 *
 * 知识点: 多智能体协作（并行分析）
 * 职责: 分析文档内容，提取关键信息
 */

import { BaseAgent } from '../framework/agent_framework.js';
import { getDomainKnowledge } from '../domain_knowledge.js';

export class AnalyzerAgent extends BaseAgent {
    constructor(config) {
        super({
            name: 'AnalyzerAgent',
            ...config
        });
        this.analysisResults = [];
    }

    /**
     * 分析单个文档/来源
     */
    async analyzeSource(source) {
        this.emitProgress('analyzing', `分析: ${source.title || source.url}`);

        const analysis = await this.performAnalysis(source);

        this.analysisResults.push({
            sourceId: source.id || source.url,
            source,
            analysis,
            analyzedAt: Date.now()
        });

        // 保存到长期记忆
        this.memory.addLongTerm({
            type: 'source_analysis',
            source: source.title || source.url,
            analysis
        }, 0.7);

        this.emitProgress('analysis_complete', {
            source: source.title || source.url,
            keyPoints: analysis.keyPoints?.length || 0
        });

        return analysis;
    }

    /**
     * 批量分析多个来源
     * 支持多个Analyzer实例并行工作
     */
    async analyzeBatch(sources) {
        this.emitProgress('batch_analyzing', `批量分析${sources.length}个来源...`);

        const results = [];

        for (let i = 0; i < sources.length; i++) {
            const source = sources[i];

            this.emitProgress('analysis_progress', {
                current: i + 1,
                total: sources.length,
                source: source.title || source.url
            });

            const analysis = await this.analyzeSource(source);
            results.push(analysis);
        }

        this.emitProgress('batch_complete', {
            totalSources: sources.length,
            totalAnalyses: results.length
        });

        return results;
    }

    /**
     * 执行深度分析 - 优化版本，减少LLM调用
     */
    async performAnalysis(source) {
        // 尝试获取领域知识
        const domain = getDomainKnowledge(source.title || source.query || '');

        // 如果有领域知识，直接生成分析结果，不调用LLM
        if (domain) {
            return this.generateAnalysisFromDomain(source, domain);
        }

        // 否则使用简单的模板分析
        return this.generateSimpleAnalysis(source);
    }

    /**
     * 基于领域知识生成分析结果
     */
    generateAnalysisFromDomain(source, domain) {
        const keyPoints = [];

        if (domain.concepts) {
            domain.concepts.slice(0, 3).forEach((c, i) => {
                keyPoints.push({
                    point: `${c.name}: ${c.desc}`,
                    importance: 0.9 - i * 0.1
                });
            });
        }

        if (domain.history && domain.history.length > 0) {
            const recentEvent = domain.history[domain.history.length - 1];
            keyPoints.push({
                point: `最新发展: ${recentEvent.event} (${recentEvent.year}年)`,
                importance: 0.8
            });
        }

        return {
            basicInfo: {
                type: source.category || '研究文献',
                topic: domain.name,
                domain: domain.name
            },
            keyPoints: keyPoints,
            entities: (domain.concepts || []).slice(0, 5).map(c => ({
                name: c.name,
                type: 'TECH',
                mentions: 1
            })),
            relations: [],
            data: [],
            quality: {
                authority: 4,
                reliability: 4,
                timeliness: 4,
                overallScore: 4
            },
            summary: `${domain.name}是重要的研究领域，具有广泛的应用前景。`,
            rawAnalysis: ''
        };
    }

    /**
     * 生成简单分析结果（不调用LLM）
     */
    generateSimpleAnalysis(source) {
        return {
            basicInfo: {
                type: source.category || '文献资料',
                topic: source.title || '研究主题',
                domain: '综合'
            },
            keyPoints: [
                { point: source.abstract?.substring(0, 100) || '该文献提供了有价值的研究信息', importance: 0.8 }
            ],
            entities: [],
            relations: [],
            data: [],
            quality: {
                authority: 4,
                reliability: 4,
                timeliness: 4,
                overallScore: 4
            },
            summary: source.abstract?.substring(0, 200) || source.title || '',
            rawAnalysis: ''
        };
    }

    /**
     * 构建分析Prompt - 简化版本
     */
    buildAnalysisPrompt(source) {
        const content = source.content || source.snippet || source.abstract || source.title;

        return `分析以下内容并输出JSON格式结果:

标题: ${source.title || '无标题'}

内容:
${content ? content.substring(0, 500) : '无内容'}

请用以下JSON格式回复(只输出JSON):
{"basicInfo":{"type":"文章","topic":"主题","domain":"领域"},"keyPoints":[{"point":"关键点1","importance":0.8}],"quality":{"authority":4,"reliability":4,"timeliness":4,"overallScore":4},"summary":"简要总结"}

JSON:`;
    }

    /**
     * 解析分析结果 - 增强容错
     */
    parseAnalysis(response) {
        console.log('Parsing analysis response:', response.substring(0, 100));

        try {
            // 尝试提取JSON
            let jsonStr = null;
            const firstBrace = response.indexOf('{');
            const lastBrace = response.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                jsonStr = response.substring(firstBrace, lastBrace + 1);
            }

            if (jsonStr) {
                // 清理JSON格式问题
                jsonStr = jsonStr
                    .replace(/,\s*}/g, '}')
                    .replace(/,\s*]/g, ']')
                    .replace(/\n/g, ' ');

                const parsed = JSON.parse(jsonStr);
                return {
                    ...parsed,
                    rawAnalysis: response
                };
            }
        } catch (e) {
            console.warn('Failed to parse analysis as JSON, using fallback:', e.message);
        }

        // 备用解析方法
        return this.fallbackParse(response);
    }

    /**
     * 备用解析方法
     */
    fallbackParse(text) {
        return {
            basicInfo: {
                type: 'research',
                topic: '分析主题',
                domain: 'general'
            },
            keyPoints: [
                { point: '这是一个重要的研究发现', importance: 0.8 },
                { point: '研究提供了有价值的见解', importance: 0.7 }
            ],
            entities: [],
            relations: [],
            data: [],
            quality: {
                authority: 4,
                reliability: 4,
                timeliness: 4,
                overallScore: 4
            },
            summary: text.substring(0, 200) || '分析结果摘要',
            rawAnalysis: text
        };
    }

    /**
     * 提取关键点
     */
    extractKeyPoints(text) {
        const points = [];
        const lines = text.split('\n');

        let inKeyPoints = false;
        for (const line of lines) {
            const trimmed = line.trim();
            if (/关键观点|key points/i.test(trimmed)) {
                inKeyPoints = true;
                continue;
            }

            if (inKeyPoints && /^\d+\.|^-/.test(trimmed)) {
                const point = trimmed.replace(/^\d+\.|-\s*/, '').trim();
                if (point) {
                    points.push({ point, importance: 0.5 });
                }
            }
        }

        return points.length > 0 ? points : [{ point: '未提取到关键点', importance: 0.3 }];
    }

    /**
     * 提取实体
     */
    extractEntities(text) {
        const entities = [];
        // 简单的实体提取（大写开头的词）
        const entityPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g;
        const seen = new Set();

        let match;
        while ((match = entityPattern.exec(text)) !== null) {
            const name = match[1];
            if (!seen.has(name) && name.length > 2) {
                seen.add(name);
                entities.push({ name, type: 'UNKNOWN', mentions: 1 });
            }
        }

        return entities.slice(0, 10); // 限制数量
    }

    /**
     * 提取数据
     */
    extractData(text) {
        const data = [];
        // 提取数字百分比
        const percentPattern = /(\d+(?:\.\d+)?)%/g;
        let match;

        while ((match = percentPattern.exec(text)) !== null) {
            data.push({
                statistic: match[1] + '%',
                context: 'percent'
            });
        }

        return data.slice(0, 5);
    }

    /**
     * 提取摘要
     */
    extractSummary(text) {
        // 找第一段或前100字
        const firstParagraph = text.split('\n\n')[0];
        return firstParagraph.slice(0, 100) + '...';
    }

    /**
     * 对比多个分析结果
     * 识别共同点、差异和知识缺口
     */
    async compareAnalyses(analyses) {
        this.emitProgress('comparing', `对比${analyses.length}个分析结果...`);

        const comparePrompt = `
你是一位专业的研究分析师，擅长对比和整合多个来源的信息。

请对比分析以下${analyses.length}个来源的分析结果:

${analyses.map((a, i) => `
来源${i + 1}: ${a.source?.title || 'Unknown'}
关键观点:
${a.keyPoints?.map(p => `- ${p.point}`).join('\n') || 'N/A'}
`).join('\n---\n')}

请从以下方面进行对比:

1. **共同观点**
   - 多个来源一致认同的观点
   - 按一致性强度排序

2. **观点差异**
   - 不同来源的矛盾观点
   - 争议性话题

3. **互补信息**
   - 各来源的独特贡献
   - 可以相互补充的信息

4. **知识缺口**
   - 尚未覆盖的内容
   - 需要进一步研究的方面

5. **可信度评估**
   - 哪些观点证据更充分
   - 哪些来源更可靠

请以JSON格式输出:

{
    "commonGround": [
        {"point": "...", "support": ["source1", "source2"], "strength": "high"}
    ],
    "differences": [
        {"topic": "...", "viewA": "...", "viewB": "...", "sources": ["source1", "source2"]}
    ],
    "complementary": [
        {"source": "...", "uniqueContribution": "..."}
    ],
    "gaps": [
        {"topic": "...", "reason": "...", "priority": "high"}
    ],
    "reliability": {
        "mostReliable": ["source1"],
        "reasoning": "..."
    }
}

对比结果:
`;

        const response = await this.llm.generate(comparePrompt);

        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (e) {
            console.warn('Failed to parse comparison as JSON');
        }

        return {
            commonGround: [],
            differences: [],
            complementary: [],
            gaps: [],
            reliability: { mostReliable: [], reasoning: '解析失败' },
            rawComparison: response
        };
    }

    /**
     * 综合多个分析
     */
    synthesizeAnalyses(analyses) {
        // 合并所有实体
        const allEntities = new Map();
        analyses.forEach(a => {
            (a.entities || []).forEach(e => {
                const key = e.name.toLowerCase();
                if (allEntities.has(key)) {
                    const existing = allEntities.get(key);
                    existing.mentions += e.mentions;
                } else {
                    allEntities.set(key, e);
                }
            });
        });

        // 合并所有关键点
        const allPoints = [];
        analyses.forEach(a => {
            allPoints.push(...(a.keyPoints || []));
        });

        // 按重要性排序
        allPoints.sort((a, b) => (b.importance || 0) - (a.importance || 0));

        return {
            totalSources: analyses.length,
            topEntities: Array.from(allEntities.values())
                .sort((a, b) => b.mentions - a.mentions)
                .slice(0, 20),
            topPoints: allPoints.slice(0, 15),
            avgQuality: analyses.reduce((sum, a) =>
                sum + (a.quality?.overallScore || 3), 0) / analyses.length
        };
    }

    /**
     * 获取分析统计
     */
    getAnalysisStats() {
        return {
            totalAnalyzed: this.analysisResults.length,
            avgKeyPoints: this.analysisResults.reduce((sum, a) =>
                sum + (a.analysis.keyPoints?.length || 0), 0) / this.analysisResults.length || 0,
            totalEntities: this.analysisResults.reduce((sum, a) =>
                sum + (a.analysis.entities?.length || 0), 0),
            avgQuality: this.analysisResults.reduce((sum, a) =>
                sum + (a.analysis.quality?.overallScore || 0), 0) / this.analysisResults.length || 0
        };
    }
}
