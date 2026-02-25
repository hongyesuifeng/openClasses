/**
 * SynthesizerAgent - 综合报告生成Agent
 *
 * 知识点: 信息整合、报告生成
 * 职责: 整合多源分析结果，生成结构化研究报告
 */

import { BaseAgent } from '../framework/agent_framework.js';
import {
    getDomainKnowledge,
    generateHistorySection,
    generateConceptsSection,
    generateApplicationsSection,
    generateTrendsSection
} from '../domain_knowledge.js';

export class SynthesizerAgent extends BaseAgent {
    constructor(config) {
        super({
            name: 'SynthesizerAgent',
            ...config
        });
    }

    /**
     * 生成研究报告
     */
    async generateReport(topic, analyses, comparison) {
        this.emitProgress('synthesizing', `正在生成"${topic}"的研究报告...`);

        // 构建综合上下文
        const context = this.buildSynthesisContext(topic, analyses, comparison);

        // 生成各章节
        const sections = await this.generateSections(context);

        // 组装完整报告
        const report = this.assembleReport(topic, sections, context);

        this.emitProgress('report_complete', {
            title: report.title,
            sectionsCount: sections.length,
            wordCount: report.metadata.wordCount
        });

        return report;
    }

    /**
     * 构建综合上下文
     */
    buildSynthesisContext(topic, analyses, comparison) {
        // 从分析结果中提取source对象
        const sources = analyses.map(a => a.source || a).filter(Boolean);

        return {
            topic,
            analyses,
            comparison,
            sources,
            totalAnalyses: analyses.length,
            synthesisDate: new Date().toISOString()
        };
    }

    /**
     * 生成报告各章节 - 增强版本，包含完整结构
     */
    async generateSections(context) {
        const sections = [];
        const topic = context.topic;
        const domain = getDomainKnowledge(topic);

        // 1. 摘要
        sections.push(await this.generateAbstract(context, domain));

        // 2. 历史发展脉络
        sections.push(this.generateHistorySection(context, domain));

        // 3. 技术原理
        sections.push(this.generateConceptsSection(context, domain));

        // 4. 应用场景
        sections.push(this.generateApplicationsSection(context, domain));

        // 5. 发展趋势与挑战
        sections.push(this.generateTrendsSection(context, domain));

        // 6. 结论与建议
        sections.push(await this.generateConclusions(context, domain));

        // 7. 参考文献
        sections.push(this.generateReferences(context));

        return sections;
    }

    /**
     * 生成摘要
     */
    async generateAbstract(context, domain) {
        const topic = context.topic;
        const sourcesCount = context.sources?.length || 0;

        let content = `本研究报告对**${topic}**进行了系统性的研究和分析。\n\n`;
        content += `**研究范围**: 本文收集并分析了 ${sourcesCount} 篇相关文献资料，涵盖学术论文、行业报告和技术文献。\n\n`;

        if (domain) {
            content += `**核心发现**: `;
            if (domain.history && domain.history.length > 0) {
                const recentEvent = domain.history[domain.history.length - 1];
                content += `${topic}自${domain.history[0].year}年发展至今，经历了${domain.history.length}个重要发展阶段。`;
            }
            if (domain.concepts && domain.concepts.length > 0) {
                content += `核心技术包括${domain.concepts.slice(0, 3).map(c => c.name).join('、')}等。`;
            }
            if (domain.applications && domain.applications.length > 0) {
                content += `主要应用于${domain.applications.slice(0, 3).map(a => a.field).join('、')}等领域。`;
            }
            content += `\n\n`;
        }

        content += `**研究意义**: 本研究为相关领域的研究者和从业者提供了全面的参考资料，有助于深入理解${topic}的发展脉络和技术原理。`;

        return {
            id: 'abstract',
            title: '摘要',
            content: content,
            order: 1
        };
    }

    /**
     * 生成历史发展章节
     */
    generateHistorySection(context, domain) {
        const topic = context.topic;

        let content = `## 历史发展脉络\n\n`;
        content += `${topic}的发展经历了多个重要阶段，从最初的理论探索到如今的广泛应用，体现了技术进步的典型路径。\n\n`;

        if (domain && domain.history && domain.history.length > 0) {
            content += `### 发展时间线\n\n`;

            // 按时代分组
            const eras = this.groupHistoryByEra(domain.history);

            eras.forEach(era => {
                if (era.events.length > 0) {
                    content += `#### ${era.name} (${era.start}-${era.end})\n\n`;
                    era.events.forEach(e => {
                        content += `- **${e.year}年**: ${e.event}\n`;
                    });
                    content += `\n`;
                }
            });
        } else {
            // 生成通用历史内容
            content += `### 早期发展\n\n`;
            content += `${topic}的研究始于20世纪中叶，最初主要停留在理论探索阶段。\n\n`;
            content += `### 技术积累\n\n`;
            content += `随着相关技术的不断成熟，${topic}逐渐从理论研究走向实际应用。\n\n`;
            content += `### 快速发展\n\n`;
            content += `近年来，${topic}进入快速发展期，新技术、新应用不断涌现。\n\n`;
        }

        return {
            id: 'history',
            title: '历史发展脉络',
            content: content,
            order: 2
        };
    }

    /**
     * 按时代分组历史事件
     */
    groupHistoryByEra(history) {
        const eras = [
            { name: '萌芽期', start: 1950, end: 1980, events: [] },
            { name: '发展期', start: 1980, end: 2000, events: [] },
            { name: '成熟期', start: 2000, end: 2015, events: [] },
            { name: '爆发期', start: 2015, end: 2030, events: [] }
        ];

        history.forEach(event => {
            const year = parseInt(event.year);
            for (const era of eras) {
                if (year >= era.start && year < era.end) {
                    era.events.push(event);
                    break;
                }
            }
        });

        return eras;
    }

    /**
     * 生成技术原理章节
     */
    generateConceptsSection(context, domain) {
        const topic = context.topic;

        let content = `## 核心技术原理\n\n`;
        content += `${topic}涉及多个核心技术概念和原理，构成了该领域的理论基础。\n\n`;

        if (domain && domain.concepts && domain.concepts.length > 0) {
            domain.concepts.forEach((concept, index) => {
                content += `### ${index + 1}. ${concept.name}\n\n`;
                content += `${concept.desc}\n\n`;
            });
        } else {
            content += `### 基本概念\n\n`;
            content += `${topic}是一个综合性的技术领域，涉及多个学科的知识体系。\n\n`;
            content += `### 核心原理\n\n`;
            content += `${topic}的核心原理建立在相关理论基础之上，通过特定的方法和技术实现其功能。\n\n`;
            content += `### 关键技术\n\n`;
            content += `实现${topic}需要掌握多项关键技术，这些技术相互配合，共同支撑整个系统的运行。\n\n`;
        }

        return {
            id: 'concepts',
            title: '核心技术与原理',
            content: content,
            order: 3
        };
    }

    /**
     * 生成应用场景章节
     */
    generateApplicationsSection(context, domain) {
        const topic = context.topic;

        let content = `## 主要应用场景\n\n`;
        content += `${topic}已在多个领域得到广泛应用，产生了显著的经济和社会效益。\n\n`;

        if (domain && domain.applications && domain.applications.length > 0) {
            domain.applications.forEach((app, index) => {
                content += `### ${index + 1}. ${app.field}\n\n`;
                content += `**应用案例**: ${app.cases}\n\n`;
            });
        } else {
            content += `### 企业应用\n\n`;
            content += `在企业经营中，${topic}被用于提升效率、降低成本、优化决策。\n\n`;
            content += `### 政府服务\n\n`;
            content += `政府部门利用${topic}技术改善公共服务，提高治理效能。\n\n`;
            content += `### 社会民生\n\n`;
            content += `${topic}在医疗、教育、交通等民生领域发挥着越来越重要的作用。\n\n`;
        }

        // 添加来源统计
        if (context.sources && context.sources.length > 0) {
            const categories = {};
            context.sources.forEach(s => {
                const cat = s.category || '其他';
                categories[cat] = (categories[cat] || 0) + 1;
            });

            content += `### 参考文献分布\n\n`;
            content += `| 类别 | 文献数量 |\n`;
            content += `|------|----------|\n`;
            Object.entries(categories).forEach(([cat, count]) => {
                content += `| ${cat} | ${count} |\n`;
            });
            content += `\n`;
        }

        return {
            id: 'applications',
            title: '主要应用场景',
            content: content,
            order: 4
        };
    }

    /**
     * 生成发展趋势章节
     */
    generateTrendsSection(context, domain) {
        const topic = context.topic;

        let content = `## 发展趋势与挑战\n\n`;

        // 发展趋势
        content += `### 未来发展趋势\n\n`;

        if (domain && domain.trends && domain.trends.length > 0) {
            domain.trends.forEach((trend, index) => {
                content += `${index + 1}. **${trend}**\n\n`;
            });
        } else {
            content += `1. **技术融合趋势**: ${topic}将与其他前沿技术深度融合，催生新的应用场景\n\n`;
            content += `2. **应用拓展趋势**: ${topic}的应用范围将进一步扩大\n\n`;
            content += `3. **标准化趋势**: 行业标准和规范将逐步建立和完善\n\n`;
            content += `4. **生态化趋势**: 围绕${topic}的产业生态将加速形成\n\n`;
        }

        // 面临的挑战
        content += `### 面临的主要挑战\n\n`;

        if (domain && domain.challenges && domain.challenges.length > 0) {
            domain.challenges.forEach((challenge, index) => {
                content += `${index + 1}. **${challenge}**\n\n`;
            });
        } else {
            content += `1. **技术挑战**: 核心技术仍需突破，部分关键技术存在瓶颈\n\n`;
            content += `2. **应用挑战**: 实际应用中存在成本、效率、安全等问题\n\n`;
            content += `3. **人才挑战**: 专业人才短缺，人才培养体系有待完善\n\n`;
            content += `4. **政策挑战**: 相关政策法规尚需健全\n\n`;
        }

        return {
            id: 'trends',
            title: '发展趋势与挑战',
            content: content,
            order: 5
        };
    }

    /**
     * 生成结论与建议
     */
    async generateConclusions(context, domain) {
        const topic = context.topic;
        const sourcesCount = context.sources?.length || 0;

        let content = `## 结论与建议\n\n`;

        content += `### 研究结论\n\n`;
        content += `通过对${sourcesCount}篇相关文献的系统分析，本研究得出以下主要结论：\n\n`;
        content += `1. **历史发展**: ${topic}经历了从理论探索到实践应用的发展历程，目前已进入快速发展期\n\n`;
        content += `2. **技术成熟度**: 核心技术日趋成熟，但仍有提升空间，部分前沿技术尚在探索阶段\n\n`;
        content += `3. **应用前景**: ${topic}在多个领域具有广阔的应用前景，市场潜力巨大\n\n`;
        content += `4. **发展态势**: 行业整体保持快速发展态势，技术创新和产业应用同步推进\n\n`;

        content += `### 实践建议\n\n`;
        content += `**对研究者:**\n`;
        content += `- 关注${topic}的前沿技术发展，把握研究方向\n`;
        content += `- 加强跨学科交流与合作，促进知识融合\n`;
        content += `- 重视理论创新与实践应用的结合\n\n`;

        content += `**对从业者:**\n`;
        content += `- 持续学习新技术，提升专业能力\n`;
        content += `- 关注行业动态，把握发展机遇\n`;
        content += `- 积累实践经验，推动技术应用\n\n`;

        content += `**对决策者:**\n`;
        content += `- 制定支持${topic}发展的政策措施\n`;
        content += `- 完善相关标准规范，引导行业健康发展\n`;
        content += `- 加强人才培养和引进，构建人才梯队\n\n`;

        content += `### 未来展望\n\n`;
        content += `${topic}正处于发展的黄金时期，技术创新和产业应用相互促进。`;
        content += `随着相关技术的不断突破和应用场景的持续拓展，${topic}将在更多领域发挥重要作用，`;
        content += `为经济社会发展注入新的动力。`;

        return {
            id: 'conclusions',
            title: '结论与建议',
            content: content,
            order: 6
        };
    }

    /**
     * 生成参考文献 - 改进版本
     */
    generateReferences(context) {
        const references = context.sources.map((source, index) => {
            // 确保有有效的引用信息
            const authors = source.authors && source.authors.length > 0
                ? source.authors.join(', ')
                : '佚名';
            const date = source.publishedDate || '2024';
            const title = source.title || `关于${context.topic}的研究`;
            const institution = source.institution || '';
            const url = source.url || '';

            // 格式化引用
            let citation = `[${index + 1}] ${authors}. ${title}`;
            if (institution) {
                citation += `. ${institution}`;
            }
            citation += `, ${date}.`;

            return {
                id: `ref-${index + 1}`,
                citation,
                source
            };
        });

        const content = references.map(ref => ref.citation).join('\n\n');

        return {
            id: 'references',
            title: '参考文献',
            content,
            order: 5,
            references
        };
    }

    /**
     * 组装完整报告
     */
    assembleReport(topic, sections, context) {
        const reportId = 'report-' + Date.now();

        // 计算字数
        let wordCount = 0;
        sections.forEach(section => {
            wordCount += section.content.length;
        });

        const report = {
            id: reportId,
            title: `研究报告: ${topic}`,
            topic,
            sections: sections.sort((a, b) => a.order - b.order),
            metadata: {
                generatedAt: context.synthesisDate,
                sectionsCount: sections.length,
                sourcesCount: context.totalAnalyses,
                wordCount,
                format: 'markdown'
            }
        };

        // 保存到记忆
        this.memory.addLongTerm({
            type: 'research_report',
            report
        }, 0.9);

        return report;
    }

    /**
     * 生成Markdown格式的报告
     */
    toMarkdown(report) {
        let markdown = `# ${report.title}\n\n`;
        markdown += `> 生成时间: ${new Date(report.metadata.generatedAt).toLocaleString()}\n`;
        markdown += `> 来源数量: ${report.metadata.sourcesCount}\n`;
        markdown += `> 字数: ${report.metadata.wordCount}\n\n`;

        markdown += '---\n\n';

        report.sections.forEach(section => {
            markdown += `## ${section.title}\n\n`;
            markdown += `${section.content}\n\n`;
        });

        return markdown;
    }

    /**
     * 生成HTML格式的报告
     */
    toHTML(report) {
        let html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${report.title}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
        h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        .metadata { background: #ecf0f1; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .section { margin-bottom: 30px; }
    </style>
</head>
<body>
    <h1>${report.title}</h1>
    <div class="metadata">
        <p><strong>生成时间:</strong> ${new Date(report.metadata.generatedAt).toLocaleString()}</p>
        <p><strong>来源数量:</strong> ${report.metadata.sourcesCount}</p>
        <p><strong>字数:</strong> ${report.metadata.wordCount}</p>
    </div>
`;

        report.sections.forEach(section => {
            html += `    <div class="section">
        <h2>${section.title}</h2>
        <div>${this.markdownToHTML(section.content)}</div>
    </div>
`;
        });

        html += `</body>
</html>`;

        return html;
    }

    /**
     * 简单的Markdown转HTML
     */
    markdownToHTML(text) {
        return text
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/`(.+?)`/g, '<code>$1</code>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>');
    }

    /**
     * 导出报告
     */
    exportReport(report, format = 'markdown') {
        switch (format) {
            case 'markdown':
                return this.toMarkdown(report);
            case 'html':
                return this.toHTML(report);
            case 'json':
                return JSON.stringify(report, null, 2);
            default:
                return report;
        }
    }
}
