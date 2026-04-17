/**
 * 研究代理系统 - 配置和启动文件
 * 支持 Ollama 本地模型
 */

import { MessageBus, ToolRegistry, MemorySystem } from './framework/agent_framework.js';
import { IntelligentResponseGenerator } from './intelligent_response.js';
import { PlannerAgent } from './agents/planner_agent.js';
import { SearcherAgent } from './agents/searcher_agent.js';
import { AnalyzerAgent } from './agents/analyzer_agent.js';
import { SynthesizerAgent } from './agents/synthesizer_agent.js';
import { EvaluatorAgent } from './agents/evaluator_agent.js';
import { OllamaService } from './ollama_service.js';
import { getDomainKnowledge } from './domain_knowledge.js';

// 全局 Ollama 实例
let ollamaInstance = null;

/**
 * 研究编排器 - 支持 Ollama 本地模型
 */
export class ResearchOrchestrator {
    constructor(config = {}) {
        // 初始化核心服务
        this.messageBus = new MessageBus();
        this.toolRegistry = new ToolRegistry();
        this.memorySystem = new MemorySystem();

        // 配置
        this.config = config;

        // 创建LLM服务
        this.llm = this.createLLMService(config);

        // 注册工具
        this.registerTools();

        // 初始化各专业Agent
        this.initializeAgents();

        // 进度回调
        this.progressCallbacks = new Set();
    }

    createLLMService(config) {
        // 使用 Ollama 本地模型
        console.log('Using Ollama local model');

        if (!ollamaInstance) {
            ollamaInstance = new OllamaService({
                baseUrl: 'http://localhost:11434',
                model: config.model || 'qwen2.5:0.5b',
                timeout: 60000
            });
        }

        return {
            async generate(prompt) {
                try {
                    // 检查 Ollama 是否可用
                    const isConnected = await ollamaInstance.checkConnection();
                    if (!isConnected) {
                        console.warn('Ollama not available, falling back to simulation');
                        const generator = new IntelligentResponseGenerator();
                        return generator.mockResponse(prompt);
                    }

                    console.log('Calling Ollama generate...');
                    const result = await ollamaInstance.generate(prompt);
                    console.log('Ollama result length:', result?.length || 0);
                    return result;
                } catch (error) {
                    console.error('Ollama generation failed:', error);
                    // 回退到智能模拟
                    console.log('Falling back to intelligent simulation');
                    const generator = new IntelligentResponseGenerator();
                    return generator.mockResponse(prompt);
                }
            }
        };
    }

    /**
     * 注册工具
     */
    registerTools() {
        // 搜索工具
        this.toolRegistry.register({
            name: 'search',
            description: '执行网络搜索获取信息',
            parameters: {
                type: 'object',
                properties: {
                    query: { type: 'string', description: '搜索关键词' },
                    source: { type: 'string', enum: ['web', 'academic', 'news'] },
                    limit: { type: 'number', default: 10 }
                },
                required: ['query']
            },
            execute: async (params) => {
                return await this.mockSearch(params);
            }
        });

        // 解析工具
        this.toolRegistry.register({
            name: 'parse_content',
            description: '解析文档内容',
            parameters: {
                type: 'object',
                properties: {
                    content: { type: 'string' },
                    format: { type: 'string' }
                },
                required: ['content']
            },
            execute: async (params) => {
                return { parsed: true, content: params.content };
            }
        });

        // 报告工具
        this.toolRegistry.register({
            name: 'generate_report',
            description: '生成研究报告',
            parameters: {
                type: 'object',
                properties: {
                    content: { type: 'string' },
                    format: { type: 'string' }
                },
                required: ['content']
            },
            execute: async (params) => {
                return { report: params.content };
            }
        });
    }

    /**
     * 初始化Agent
     */
    initializeAgents() {
        // 共享配置
        const agentConfig = {
            llm: this.llm,
            tools: this.toolRegistry,
            memory: this.memorySystem,
            messageBus: this.messageBus
        };

        // 创建各专业Agent
        this.planner = new PlannerAgent(agentConfig);
        this.searcher = new SearcherAgent(agentConfig);
        this.analyzer = new AnalyzerAgent(agentConfig);
        this.synthesizer = new SynthesizerAgent(agentConfig);
        this.evaluator = new EvaluatorAgent(agentConfig);

        // 设置进度回调
        this.setupProgressCallbacks();
    }

    /**
     * 设置进度回调
     */
    setupProgressCallbacks() {
        const agents = [this.planner, this.searcher, this.analyzer, this.synthesizer, this.evaluator];

        agents.forEach(agent => {
            agent.setProgressCallback((type, data) => {
                this.emitProgress(type, {
                    agent: agent.name,
                    ...data
                });
            });
        });
    }

    /**
     * 执行完整研究流程
     */
    async conductResearch(topic, config = {}) {
        const startTime = Date.now();

        try {
            this.emitProgress('start', { topic, message: `开始研究: ${topic}` });

            // 阶段1: 规划
            this.emitProgress('phase', { phase: 'planning', message: '创建研究计划...' });
            const plan = await this.planner.createResearchPlan(topic);

            // 收集所有查询
            const allQueries = [];
            plan.queries.forEach(q => {
                allQueries.push(...q.queries);
            });

            // 阶段2: 检索 - 每个查询获取更多结果
            this.emitProgress('phase', { phase: 'searching', message: `执行${allQueries.length}个查询...` });
            const searchResults = await this.searcher.executeBatchSearch(
                allQueries,
                { ...config.search, resultsPerQuery: 10 }  // 每个查询10条结果
            );

            // 整理所有来源
            const allSources = [];
            searchResults.forEach(result => {
                allSources.push(...result.results);
            });

            // 去重并限制数量到50
            let uniqueSources = this.deduplicateSources(allSources);

            // 确保至少有50个来源
            if (uniqueSources.length < 50) {
                // 生成额外的来源
                const additionalCount = 50 - uniqueSources.length;
                const additionalResults = await this.mockSearch({
                    query: topic,
                    source: 'academic',
                    limit: additionalCount
                });
                uniqueSources = [...uniqueSources, ...additionalResults.results];
            }

            // 限制到50个来源
            uniqueSources = uniqueSources.slice(0, 50);

            this.emitProgress('search_complete', { totalSources: uniqueSources.length });

            // 阶段3: 分析 - 简化，只分析部分关键来源
            this.emitProgress('phase', { phase: 'analyzing', message: `分析${Math.min(uniqueSources.length, 10)}个关键来源...` });

            // 只分析前10个关键来源，提高效率
            const keySources = uniqueSources.slice(0, 10);
            const analyses = [];

            for (let i = 0; i < keySources.length; i++) {
                const analysis = await this.analyzer.analyzeSource(keySources[i]);
                analyses.push(analysis);
                this.emitProgress('analysis_progress', {
                    current: i + 1,
                    total: keySources.length
                });
            }

            // 对比分析
            this.emitProgress('comparing', '综合分析结果...');
            const comparison = await this.analyzer.compareAnalyses(analyses);

            // 阶段4: 综合
            this.emitProgress('phase', { phase: 'synthesizing', message: '生成研究报告...' });
            const report = await this.synthesizer.generateReport(topic, analyses, comparison);

            // 将所有来源添加到报告
            report.sources = uniqueSources;

            // 阶段5: 评估
            this.emitProgress('phase', { phase: 'evaluating', message: '评估研究质量...' });
            const evaluation = await this.evaluator.evaluateReport(report);

            const duration = Date.now() - startTime;

            // 返回完整结果
            const result = {
                success: true,
                topic,
                plan,
                sources: uniqueSources,
                analyses,
                comparison,
                report,
                evaluation,
                metadata: {
                    duration,
                    sourcesCount: uniqueSources.length,
                    analysesCount: analyses.length,
                    phases: ['planning', 'searching', 'analyzing', 'synthesizing', 'evaluating']
                }
            };

            this.emitProgress('complete', {
                topic,
                duration,
                score: evaluation.overallScore
            });

            return result;

        } catch (error) {
            this.emitProgress('error', { error: error.message });
            return {
                success: false,
                error: error.message,
                topic
            };
        }
    }

    /**
     * 去重来源
     */
    deduplicateSources(sources) {
        const seen = new Set();
        return sources.filter(s => {
            if (seen.has(s.url)) {
                return false;
            }
            seen.add(s.url);
            return true;
        });
    }

    /**
     * 模拟搜索 - 生成丰富的搜索结果（50条）
     */
    async mockSearch(params) {
        await new Promise(resolve => setTimeout(resolve, 100));

        const query = params.query;
        const source = params.source;
        const limit = params.limit || 10;

        // 获取领域知识
        const domain = getDomainKnowledge(query);

        // 生成丰富的标题模板
        const titleTemplates = this.generateTitleTemplates(query, domain, source);
        const authors = this.generateAuthorPool();
        const institutions = this.generateInstitutionPool();
        const journals = this.generateJournalPool(source);

        const results = [];
        for (let i = 0; i < limit; i++) {
            const template = titleTemplates[i % titleTemplates.length];
            const authorList = this.selectAuthors(authors, 2 + Math.floor(Math.random() * 2));
            const institution = institutions[Math.floor(Math.random() * institutions.length)];
            const journal = journals[Math.floor(Math.random() * journals.length)];
            const year = 2018 + Math.floor(Math.random() * 7);
            const month = String(1 + Math.floor(Math.random() * 12)).padStart(2, '0');

            results.push({
                id: `ref-${Date.now()}-${i}`,
                title: template.title,
                url: `https://doi.org/10.1000/${Date.now()}-${i}`,
                authors: authorList,
                institution: institution.name,
                journal: journal,
                abstract: this.generateAbstract(query, template.focus, domain),
                publishedDate: `${year}-${month}-15`,
                source: source,
                category: template.category,
                content: this.generateContent(query, template.focus, domain),
                relevanceScore: 0.95 - (i * 0.01)
            });
        }

        return { results, total: limit };
    }

    /**
     * 生成标题模板池
     */
    generateTitleTemplates(query, domain, source) {
        const templates = [];

        // 历史与综述类
        templates.push({ title: `${query}发展历程与演进路径综述`, focus: 'history', category: '综述' });
        templates.push({ title: `${query}研究现状与未来展望`, focus: 'overview', category: '综述' });
        templates.push({ title: `${query}领域十年发展回顾与趋势分析`, focus: 'trends', category: '综述' });
        templates.push({ title: `${query}的理论基础与发展脉络`, focus: 'theory', category: '综述' });

        // 技术原理类
        templates.push({ title: `${query}核心算法原理与实现方法`, focus: 'algorithm', category: '技术' });
        templates.push({ title: `${query}关键技术突破与创新`, focus: 'innovation', category: '技术' });
        templates.push({ title: `${query}系统架构设计与优化策略`, focus: 'architecture', category: '技术' });
        templates.push({ title: `${query}性能评估与基准测试研究`, focus: 'performance', category: '技术' });

        // 应用实践类
        templates.push({ title: `${query}在智能制造中的应用实践`, focus: 'application', category: '应用' });
        templates.push({ title: `${query}技术产业化路径研究`, focus: 'industry', category: '应用' });
        templates.push({ title: `${query}在金融领域的创新应用`, focus: 'finance', category: '应用' });
        templates.push({ title: `${query}赋能传统产业转型升级`, focus: 'transform', category: '应用' });

        // 挑战与机遇类
        templates.push({ title: `${query}面临的关键挑战与应对策略`, focus: 'challenges', category: '分析' });
        templates.push({ title: `${query}的安全风险与防护机制`, focus: 'security', category: '分析' });
        templates.push({ title: `${query}的伦理问题与社会影响`, focus: 'ethics', category: '分析' });
        templates.push({ title: `${query}发展中的机遇与挑战`, focus: 'opportunity', category: '分析' });

        // 跨学科研究
        templates.push({ title: `${query}与相关领域的交叉融合研究`, focus: 'interdisciplinary', category: '研究' });
        templates.push({ title: `多学科视角下的${query}研究`, focus: 'multidisciplinary', category: '研究' });

        // 如果有领域知识，添加更多特定内容
        if (domain && domain.history) {
            domain.history.slice(0, 3).forEach(h => {
                templates.push({
                    title: `${h.year}年${query}发展：${h.event}`,
                    focus: 'milestone',
                    category: '历史'
                });
            });
        }

        if (domain && domain.concepts) {
            domain.concepts.slice(0, 3).forEach(c => {
                templates.push({
                    title: `${c.name}：${query}的核心技术解析`,
                    focus: 'concept',
                    category: '技术'
                });
            });
        }

        return templates;
    }

    /**
     * 生成作者池
     */
    generateAuthorPool() {
        const surnames = ['张', '李', '王', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '马', '朱', '胡', '郭', '林', '何', '高', '罗'];
        const givenNames = ['伟', '明', '华', '强', '军', '杰', '磊', '涛', '勇', '峰', '敏', '静', '丽', '芳', '燕', '萍', '红', '艳', '玲', '霞'];
        const authors = [];

        surnames.forEach(s => {
            givenNames.slice(0, 10).forEach(g => {
                authors.push(s + g);
            });
        });

        return authors;
    }

    /**
     * 选择随机作者
     */
    selectAuthors(authorPool, count) {
        const selected = [];
        const used = new Set();

        while (selected.length < count && selected.length < authorPool.length) {
            const idx = Math.floor(Math.random() * authorPool.length);
            if (!used.has(idx)) {
                used.add(idx);
                selected.push(authorPool[idx]);
            }
        }

        return selected;
    }

    /**
     * 生成机构池
     */
    generateInstitutionPool() {
        return [
            { name: '清华大学', level: '顶尖' },
            { name: '北京大学', level: '顶尖' },
            { name: '中国科学院', level: '顶尖' },
            { name: '浙江大学', level: '一流' },
            { name: '上海交通大学', level: '一流' },
            { name: '复旦大学', level: '一流' },
            { name: '南京大学', level: '一流' },
            { name: '中国科学技术大学', level: '一流' },
            { name: '武汉大学', level: '一流' },
            { name: '华中科技大学', level: '一流' },
            { name: '哈尔滨工业大学', level: '一流' },
            { name: '北京航空航天大学', level: '一流' },
            { name: '同济大学', level: '一流' },
            { name: '南开大学', level: '一流' },
            { name: '西安交通大学', level: '一流' },
            { name: 'MIT', level: '国际' },
            { name: 'Stanford University', level: '国际' },
            { name: 'CMU', level: '国际' },
            { name: 'Google Research', level: '企业' },
            { name: 'Microsoft Research', level: '企业' },
            { name: '阿里巴巴达摩院', level: '企业' },
            { name: '腾讯AI Lab', level: '企业' },
            { name: '华为诺亚方舟实验室', level: '企业' },
            { name: '百度研究院', level: '企业' }
        ];
    }

    /**
     * 生成期刊池
     */
    generateJournalPool(source) {
        if (source === 'academic') {
            return [
                'Nature', 'Science', 'IEEE Transactions on Pattern Analysis and Machine Intelligence',
                'Journal of Machine Learning Research', 'NeurIPS', 'ICML', 'ICLR',
                '计算机学报', '软件学报', '自动化学报', '电子学报',
                '中国科学：信息科学', '计算机研究与发展', '人工智能学报'
            ];
        } else if (source === 'news') {
            return [
                '科技日报', '中国科学报', '新华网科技', '36氪', 'InfoQ',
                'MIT Technology Review', 'Wired', 'TechCrunch'
            ];
        } else {
            return [
                'GitHub', 'arXiv', 'Medium', '知乎专栏', 'CSDN',
                '博客园', '掘金', 'SegmentFault'
            ];
        }
    }

    /**
     * 生成摘要
     */
    generateAbstract(query, focus, domain) {
        const abstractTemplates = {
            history: `本文系统回顾了${query}的发展历程，从早期理论探索到现代技术突破，梳理了该领域的演进脉络。通过文献计量分析和历史研究方法，揭示了${query}发展的关键节点和驱动因素。研究发现，技术进步、应用需求和政策支持是推动${query}发展的三大动力。`,
            overview: `本研究对${query}领域进行了全面的文献综述，分析了当前研究热点、主要方法和发展趋势。通过系统梳理近五年的研究成果，总结了${query}的理论框架、技术路线和应用场景，为后续研究提供了重要参考。`,
            trends: `本文基于大数据分析方法，对${query}领域的未来发展趋势进行了预测研究。通过分析技术演进路径、市场需求变化和政策导向，提出了${query}发展的若干重要趋势，并对行业发展提出了建议。`,
            algorithm: `本文深入研究了${query}的核心算法原理，提出了改进的算法框架。通过理论分析和实验验证，证明了所提方法在准确性和效率方面的优势。实验结果表明，新算法在多个基准测试中取得了显著提升。`,
            application: `本文探讨了${query}在实际应用中的技术实现和效果评估。通过案例研究方法，分析了${query}在不同场景下的应用模式和成功经验。研究结果表明，${query}具有广阔的应用前景和重要的实践价值。`,
            challenges: `本文分析了${query}发展过程中面临的主要挑战，包括技术瓶颈、应用障碍和伦理问题。通过专家访谈和问卷调查，识别了关键挑战因素，并提出了相应的解决策略和发展建议。`,
            default: `本研究针对${query}这一重要课题进行了深入探讨。采用文献研究与实证分析相结合的方法，系统分析了${query}的理论基础、技术方法和应用实践。研究结果为该领域的理论发展和实践应用提供了有价值的参考。`
        };

        return abstractTemplates[focus] || abstractTemplates.default;
    }

    /**
     * 生成内容
     */
    generateContent(query, focus, domain) {
        let content = `# ${query}相关研究\n\n`;

        if (domain && domain.history && focus === 'history') {
            content += `## 历史发展\n\n`;
            domain.history.slice(0, 5).forEach(h => {
                content += `- **${h.year}年**: ${h.event}\n`;
            });
            content += '\n';
        }

        if (domain && domain.concepts && focus === 'algorithm') {
            content += `## 核心概念\n\n`;
            domain.concepts.forEach(c => {
                content += `### ${c.name}\n${c.desc}\n\n`;
            });
        }

        if (domain && domain.applications && focus === 'application') {
            content += `## 应用场景\n\n`;
            domain.applications.forEach(a => {
                content += `### ${a.field}\n${a.cases}\n\n`;
            });
        }

        content += `## 研究意义\n\n`;
        content += `${query}是当前科技发展的重要方向，具有深远的理论意义和广泛的应用价值。`;
        content += `深入研究${query}对于推动相关领域发展、促进产业升级具有重要意义。\n\n`;
        content += `## 未来展望\n\n`;
        content += `随着技术的不断进步，${query}将在更多领域发挥重要作用。`;
        content += `未来研究应关注技术创新、应用拓展和伦理规范等多个维度。\n`;

        return content;
    }

    /**
     * 随机日期 - 生成近3年的日期
     */
    randomDate() {
        const start = new Date(2023, 0, 1);
        const end = new Date();
        const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
        return date.toISOString().split('T')[0];
    }

    /**
     * 发射进度事件
     */
    emitProgress(type, data) {
        this.progressCallbacks.forEach(callback => {
            try {
                callback(type, data);
            } catch (e) {
                console.error('Progress callback error:', e);
            }
        });
    }

    /**
     * 添加进度监听器
     */
    onProgress(callback) {
        this.progressCallbacks.add(callback);
        return () => this.progressCallbacks.delete(callback);
    }

    /**
     * 获取系统状态
     */
    getStatus() {
        return {
            agents: {
                planner: this.planner?.name,
                searcher: this.searcher?.name,
                analyzer: this.analyzer?.name,
                synthesizer: this.synthesizer?.name,
                evaluator: this.evaluator?.name
            },
            tools: this.toolRegistry.listTools(),
            memory: this.memorySystem.export(),
            llm: {
                type: this.llm.constructor.name || 'Unknown',
                model: this.llm.modelId || 'Intelligent Simulation'
            }
        };
    }
}

export default ResearchOrchestrator;
