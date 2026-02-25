/**
 * SynthesizerAgent - 综合报告生成Agent
 *
 * 知识点: 信息整合、报告生成
 * 职责: 整合多源分析结果，生成结构化研究报告
 */

import { BaseAgent } from '../framework/agent_framework.js';

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
     * 生成报告各章节
     */
    async generateSections(context) {
        const sections = [];

        // 1. 标题与摘要
        sections.push(await this.generateAbstract(context));

        // 2. 研究背景
        sections.push(await this.generateBackground(context));

        // 3. 研究方法
        sections.push(await this.generateMethodology(context));

        // 4. 主要发现
        sections.push(await this.generateFindings(context));

        // 5. 讨论与分析
        sections.push(await this.generateDiscussion(context));

        // 6. 结论与建议
        sections.push(await this.generateConclusions(context));

        // 7. 参考文献
        sections.push(this.generateReferences(context));

        return sections;
    }

    /**
     * 生成摘要
     */
    async generateAbstract(context) {
        const prompt = `
基于以下研究分析，生成研究报告的摘要。

研究主题: ${context.topic}

分析来源数: ${context.totalAnalyses}

主要发现:
${context.comparison?.commonGround?.map(c => `- ${c.point}`).join('\n') || 'N/A'}

请生成一份200-300字的研究摘要，包括:
1. 研究背景和目的
2. 主要方法
3. 核心发现
4. 主要结论

摘要:
`;

        const response = await this.llm.generate(prompt);

        return {
            id: 'abstract',
            title: '摘要',
            content: response,
            order: 1
        };
    }

    /**
     * 生成研究背景
     */
    async generateBackground(context) {
        const prompt = `
基于研究主题"${context.topic}"和收集到的信息，撰写研究背景部分。

要求:
1. 阐述研究主题的重要性
2. 说明研究现状
3. 指出研究意义

内容应基于收集到的${context.totalAnalyses}个来源的信息。

请撰写500字左右的研究背景。

研究背景:
`;

        const response = await this.llm.generate(prompt);

        return {
            id: 'background',
            title: '研究背景',
            content: response,
            order: 2
        };
    }

    /**
     * 生成研究方法
     */
    async generateMethodology(context) {
        const sources = context.sources;
        const academicCount = sources.filter(s => s.source === 'academic').length;
        const webCount = sources.filter(s => s.source === 'web').length;

        const content = `
本研究采用系统性的文献综述方法，具体包括:

**信息收集**
- 搜索策略: 多源并行检索
- 数据来源: 学术文献(${academicCount}篇)、网页资源(${webCount}篇)
- 时间范围: 近5年
- 检索工具: 学术数据库、网络搜索引擎

**分析方法**
- 内容分析: 提取关键信息和观点
- 对比分析: 识别共同点和差异
- 综合整合: 整合多源信息

**质量评估**
- 来源权威性评估
- 内容相关性筛选
- 信息准确性验证

本报告共分析了${context.totalAnalyses}个高质量来源，确保研究的全面性和可靠性。
`;

        return {
            id: 'methodology',
            title: '研究方法',
            content: content.trim(),
            order: 3
        };
    }

    /**
     * 生成主要发现
     */
    async generateFindings(context) {
        const prompt = `
基于以下分析结果，撰写"主要发现"章节。

研究主题: ${context.topic}

共同观点:
${context.comparison?.commonGround?.map(c => `- ${c.point} (支持度: ${c.strength})`).join('\n') || 'N/A'}

关键数据:
${context.analyses.map(a => `- ${a.source?.title}: ${a.data?.length || 0}项数据`).join('\n')}

请撰写结构化的主要发现，包括:
1. 核心发现1 (详细说明 + 数据支撑)
2. 核心发现2 (详细说明 + 数据支撑)
3. 核心发现3 (详细说明 + 数据支撑)

每个发现应该:
- 清晰明确
- 有证据支持
- 标注信息来源

主要发现:
`;

        const response = await this.llm.generate(prompt);

        return {
            id: 'findings',
            title: '主要发现',
            content: response,
            order: 4
        };
    }

    /**
     * 生成讨论与分析
     */
    async generateDiscussion(context) {
        const prompt = `
基于研究发现，撰写"讨论与分析"章节。

研究主题: ${context.topic}

需要讨论的差异点:
${context.comparison?.differences?.map(d => `- ${d.topic}: ${d.viewA} vs ${d.viewB}`).join('\n') || 'N/A'}

知识缺口:
${context.comparison?.gaps?.map(g => `- ${g.topic} (优先级: ${g.priority})`).join('\n') || 'N/A'}

请撰写讨论与分析，包括:
1. 结果解读
2. 差异分析 (为什么有不同观点)
3. 局限性说明
4. 与现有研究的关联

讨论与分析:
`;

        const response = await this.llm.generate(prompt);

        return {
            id: 'discussion',
            title: '讨论与分析',
            content: response,
            order: 5
        };
    }

    /**
     * 生成结论与建议
     */
    async generateConclusions(context) {
        const prompt = `
基于整个研究过程，撰写"结论与建议"章节。

研究主题: ${context.topic}

主要发现:
${context.comparison?.commonGround?.slice(0, 3).map(c => c.point).join('\n') || 'N/A'}

请撰写结论与建议，包括:

1. **研究结论**
   - 总结3-5个核心结论
   - 每个结论简明扼要

2. **实践建议**
   - 对相关从业者的建议
   - 具体可行的行动方案

3. **未来研究方向**
   - 尚待解决的问题
   - 值得深入探讨的方面

结论与建议:
`;

        const response = await this.llm.generate(prompt);

        return {
            id: 'conclusions',
            title: '结论与建议',
            content: response,
            order: 6
        };
    }

    /**
     * 生成参考文献
     */
    generateReferences(context) {
        const references = context.sources.map((source, index) => {
            const authors = source.authors || ['Unknown'];
            const date = source.publishedDate || 'n.d.';
            const title = source.title || 'Untitled';
            const url = source.url || '';

            const citation = `${authors.join(', ')} (${date}). ${title}.`;
            const fullCitation = url ? `${citation} Retrieved from ${url}` : citation;

            return {
                id: `ref-${index + 1}`,
                citation: fullCitation,
                source
            };
        });

        const content = references.map((ref, index) =>
            `${index + 1}. ${ref.citation}`
        ).join('\n');

        return {
            id: 'references',
            title: '参考文献',
            content,
            order: 7,
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
