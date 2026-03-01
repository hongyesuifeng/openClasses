/**
 * SearcherAgent - 信息检索Agent
 *
 * 知识点: ReAct范式（推理-行动循环）
 * 职责: 执行多源信息检索，迭代优化查询
 */

import { BaseAgent } from '../framework/agent_framework.js';

export class SearcherAgent extends BaseAgent {
    constructor(config) {
        super({
            name: 'SearcherAgent',
            ...config
        });
        this.searchResults = [];
        this.queriesUsed = new Set();
    }

    /**
     * 执行搜索任务
     * 使用ReAct范式进行迭代检索
     */
    async executeSearch(query, config = {}) {
        this.emitProgress('searching', `搜索: "${query}"`);

        const maxIterations = config.maxIterations || 3;
        const resultsPerQuery = config.resultsPerQuery || 10;

        // ReAct循环
        const searchResult = await this.reactLoop(
            { query, resultsPerQuery },
            maxIterations
        );

        this.emitProgress('search_complete', {
            query,
            resultCount: this.searchResults.length
        });

        return {
            query,
            results: this.searchResults,
            iterations: searchResult.iterations || maxIterations,
            summary: searchResult
        };
    }

    /**
     * 批量执行多个搜索查询
     */
    async executeBatchSearch(queries, config = {}) {
        this.emitProgress('batch_searching', `批量搜索${queries.length}个查询...`);

        const results = [];

        for (let i = 0; i < queries.length; i++) {
            const queryObj = queries[i];
            const query = typeof queryObj === 'string' ? queryObj : queryObj.query;

            this.emitProgress('search_progress', {
                current: i + 1,
                total: queries.length,
                query
            });

            const result = await this.executeSearch(query, config);
            results.push(result);

            // 避免重复查询
            this.queriesUsed.add(query.toLowerCase());
        }

        this.emitProgress('batch_complete', {
            totalQueries: queries.length,
            totalResults: results.reduce((sum, r) => sum + r.results.length, 0)
        });

        return results;
    }

    /**
     * ReAct Thought - 生成搜索思考
     */
    async thought(prompt, history) {
        const response = await this.llm.generate(prompt);

        // 记录思考过程
        this.memory.addShortTerm({
            type: 'thought',
            content: response
        });

        return response;
    }

    /**
     * ReAct Action - 执行搜索
     */
    async executeAction(action) {
        if (action.tool === 'search') {
            return await this.performSearch(action.params);
        } else if (action.tool === 'refine_query') {
            return await this.refineQuery(action.params);
        } else {
            return await super.executeAction(action);
        }
    }

    /**
     * 执行实际搜索
     */
    async performSearch(params) {
        const { query, source = 'academic', limit = 10 } = params;

        this.emitProgress('searching_detail', `${source}: ${query}`);

        // 调用搜索工具
        const result = await this.tools.execute('search', {
            query,
            source,
            limit
        });

        if (result.success) {
            // 保存搜索结果
            result.result.results.forEach(item => {
                if (!this.searchResults.find(r => r.url === item.url)) {
                    this.searchResults.push({
                        ...item,
                        query,
                        source,
                        foundAt: Date.now()
                    });
                }
            });

            return {
                found: result.result.results.length,
                total: this.searchResults.length,
                message: `找到${result.result.results.length}个结果，累计${this.searchResults.length}个`
            };
        } else {
            return {
                found: 0,
                error: result.error
            };
        }
    }

    /**
     * 优化查询
     */
    async refineQuery(params) {
        const { originalQuery, context } = params;

        const refinePrompt = `
当前查询: "${originalQuery}"

上下文: ${context || '搜索结果不足或相关性低'}

请优化这个查询，使其能够获得更好的搜索结果。

考虑因素:
- 使用更精确的关键词
- 添加限定词（时间、领域等）
- 使用学术术语
- 调整查询角度

只输出优化后的查询，不要包含其他解释。

优化后的查询:
`;

        const response = await this.llm.generate(refinePrompt);

        return {
            original: originalQuery,
            refined: response.trim(),
            suggestion: response.trim()
        };
    }

    /**
     * 构建ReAct Prompt
     */
    buildReActPrompt(searchRequest) {
        const { query, resultsPerQuery } = searchRequest;

        return `
你是一位专业的研究检索专家，擅长从多个来源获取高质量信息。

研究查询: "${query}"

目标: 找到${resultsPerQuery}个高质量、相关的信息来源

可用工具:
- search(query, source, limit): 执行搜索
  * source: academic (学术), web (网页), news (新闻)
  * limit: 返回结果数量
- refine_query(originalQuery, context): 优化查询

搜索策略:
1. 首先使用学术搜索获取权威信息
2. 如果结果不足，使用网页搜索获取更多视角
3. 必要时优化查询关键词
4. 避免重复内容

使用格式:
Thought: [分析当前情况，决定下一步]
Action: search
Action Input: {"query": "...", "source": "academic", "limit": ${resultsPerQuery}}

Observation: [搜索结果]

...重复思考-行动-观察...

当找到足够结果时:
Thought: [说明为什么可以结束]
Final Answer: [总结找到的结果数量和质量]

Thought:
`;
    }

    /**
     * 解析行动
     */
    parseAction(text) {
        // 确保text是字符串
        if (typeof text !== 'string') {
            text = String(text || '');
        }

        // 尝试解析JSON格式的Action Input
        const actionMatch = text.match(/Action:\s*(\w+)/);
        if (actionMatch) {
            const tool = actionMatch[1];

            const inputMatch = text.match(/Action Input:\s*(\{[^}]*\})/);
            let params = {};

            if (inputMatch) {
                try {
                    params = JSON.parse(inputMatch[1]);
                } catch (e) {
                    // 如果解析失败，尝试简单的键值对
                    params = { input: inputMatch[1] };
                }
            }

            return { tool, params };
        }

        return null;
    }

    /**
     * 检查是否是最终答案
     */
    isFinalAnswer(text) {
        if (typeof text !== 'string') {
            text = String(text || '');
        }
        return /Final Answer|final answer|最终答案/i.test(text);
    }

    /**
     * 提取最终答案
     */
    extractFinalAnswer(text) {
        if (typeof text !== 'string') {
            text = String(text || '');
        }

        const match = text.match(/(?:Final Answer|final answer|最终答案):\s*(.+)/is);
        const answer = match ? match[1].trim() : text;

        return {
            summary: answer,
            iterations: this.searchResults.length > 0 ? 'completed' : 'partial',
            resultCount: this.searchResults.length
        };
    }

    /**
     * 更新Prompt
     */
    updatePrompt(prompt, thought, action, observation) {
        const observationText = typeof observation === 'string'
            ? observation
            : JSON.stringify(observation);

        return prompt + `
Thought: ${thought}
Action: ${action.tool}
Action Input: ${JSON.stringify(action.params)}
Observation: ${observationText}

Thought:
`;
    }

    /**
     * 获取搜索统计
     */
    getSearchStats() {
        const bySource = {};
        this.searchResults.forEach(r => {
            bySource[r.source] = (bySource[r.source] || 0) + 1;
        });

        return {
            totalResults: this.searchResults.length,
            uniqueQueries: this.queriesUsed.size,
            bySource
        };
    }

    /**
     * 去重搜索结果
     */
    deduplicateResults() {
        const seen = new Set();
        this.searchResults = this.searchResults.filter(r => {
            if (seen.has(r.url)) {
                return false;
            }
            seen.add(r.url);
            return true;
        });
    }

    /**
     * 按相关性排序结果
     */
    sortResultsByRelevance(query) {
        // 简单的相关性排序（基于标题匹配）
        const queryLower = query.toLowerCase();
        const queryWords = queryLower.split(/\s+/);

        this.searchResults.forEach(result => {
            let score = 0;
            const titleLower = (result.title || '').toLowerCase();

            queryWords.forEach(word => {
                if (titleLower.includes(word)) {
                    score += 1;
                }
            });

            result.relevanceScore = score;
        });

        this.searchResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }

    /**
     * 获取结果摘要
     */
    getResultsSummary() {
        return {
            total: this.searchResults.length,
            academic: this.searchResults.filter(r => r.source === 'academic').length,
            web: this.searchResults.filter(r => r.source === 'web').length,
            news: this.searchResults.filter(r => r.source === 'news').length,
            uniqueUrls: new Set(this.searchResults.map(r => r.url)).size
        };
    }
}
