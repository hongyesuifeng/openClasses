/**
 * Hugging Face Inference API 服务
 * 使用真实的LLM模型生成响应
 */

export class HuggingFaceLLMService {
    constructor(config = {}) {
        this.config = config;
        this.modelId = config.modelId || 'Qwen/Qwen2.5-7B-Instruct'; // 默认使用Qwen2.5
        this.apiToken = config.apiToken || '';
        this.timeout = config.timeout || 60000;
        // 使用本地代理服务器避免CORS
        this.proxyUrl = config.proxyUrl || 'http://localhost:5000';
    }

    async generate(prompt) {
        if (!this.apiToken) {
            console.warn('未设置HuggingFace API Token，使用智能模拟响应');
            // 回退到智能模拟响应
            const { IntelligentResponseGenerator } = await import('./intelligent_response.js');
            const generator = new IntelligentResponseGenerator();
            return generator.mockResponse ? generator.mockResponse(prompt) : this.fallbackResponse(prompt);
        }

        try {
            console.log(`Calling HuggingFace API via proxy: ${this.modelId}`);

            const response = await fetch(`${this.proxyUrl}/api/chat/${this.modelId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.modelId,
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a professional research assistant skilled in information retrieval, literature analysis, and knowledge integration. Provide detailed, accurate, and structured responses based on user research needs.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: 1024,
                    temperature: 0.7,
                    top_p: 0.95,
                    api_token: this.apiToken
                }),
                signal: AbortSignal.timeout(this.timeout)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`API request failed: ${response.status} - ${errorText}`);
                throw new Error(`API request failed: ${response.status}`);
            }

            const data = await response.json();
            console.log('HuggingFace API response success');

            // 解析OpenAI格式的响应
            if (data.choices && data.choices[0]?.message?.content) {
                return data.choices[0].message.content;
            }

            return JSON.stringify(data);

        } catch (error) {
            console.error('HuggingFace API call failed:', error.message);

            // 回退到智能模拟响应
            const { IntelligentResponseGenerator } = await import('./intelligent_response.js');
            const generator = new IntelligentResponseGenerator();
            return this.fallbackResponse(prompt);
        }
    }

    fallbackResponse(prompt) {
        const lowerPrompt = prompt.toLowerCase();

        // 根据prompt类型返回基础响应
        if (lowerPrompt.includes('execution plan') || lowerPrompt.includes('research topic')) {
            return `1. 搜集相关的基础知识和核心概念
2. 研究发展历程和重要里程碑
3. 分析当前技术现状和主要应用
4. 识别关键挑战和限制
5. 总结发展趋势和未来方向`;
        }

        if (lowerPrompt.includes('generate') && lowerPrompt.includes('query')) {
            return JSON.stringify({
                queries: [
                    { query: `${this.extractTopic(prompt)} 最新研究`, source: 'academic', reason: '获取最新学术研究' },
                    { query: `${this.extractTopic(prompt)} 应用案例`, source: 'web', reason: '了解实际应用' }
                ]
            });
        }

        return `关于${this.extractTopic(prompt)}的研究正在进行中...`;
    }

    extractTopic(prompt) {
        const match = prompt.match(/(?:研究主题|主题|Topic)[：:]\s*([^\n]+)/i);
        return match ? match[1].trim() : '该主题';
    }
}

// 导出工厂函数，便于创建实例
export async function createLLMService(config) {
    // 浏览器环境：使用 window.ENV 获取环境变量
    const envToken = typeof window !== 'undefined' && window.ENV ? window.ENV.HUGGINGFACE_API_TOKEN : null;

    // 如果配置了HuggingFace API Token，使用真实API
    if (config.apiToken || envToken) {
        return new HuggingFaceLLMService(config);
    }

    // 否则使用智能模拟服务
    const { IntelligentResponseGenerator } = await import('./intelligent_response.js');
    const generator = new IntelligentResponseGenerator();

    return {
        async generate(prompt) {
            return generator.mockResponse ? generator.mockResponse(prompt) : fallbackResponse(prompt);
        }
    };
}

// 基础fallback响应函数
function fallbackResponse(prompt) {
    const lowerPrompt = prompt.toLowerCase();

    if (lowerPrompt.includes('execution plan') || lowerPrompt.includes('research topic')) {
        return `1. 搜集相关的基础知识和核心概念
2. 研究发展历程和重要里程碑
3. 分析当前技术现状和主要应用
4. 识别关键挑战和限制
5. 总结发展趋势和未来方向`;
    }

    if (lowerPrompt.includes('generate') && lowerPrompt.includes('query')) {
        return JSON.stringify({
            queries: [
                { query: `相关主题 最新研究`, source: 'academic', reason: '获取最新学术研究' },
                { query: `相关主题 应用案例`, source: 'web', reason: '了解实际应用' }
            ]
        });
    }

    return `相关主题的研究正在进行中...`;
}

export default HuggingFaceLLMService;
