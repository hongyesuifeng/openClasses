/**
 * Ollama 本地模型服务
 * 通过 Ollama API 调用本地运行的大语言模型
 */

export class OllamaService {
    constructor(config = {}) {
        this.config = config;
        this.baseUrl = config.baseUrl || 'http://localhost:11434';
        this.model = config.model || 'qwen2.5:0.5b';  // 使用较小的模型
        this.timeout = config.timeout || 60000;
    }

    /**
     * 检查 Ollama 服务是否运行
     */
    async checkConnection() {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`, {
                method: 'GET',
                signal: AbortSignal.timeout(5000)
            });
            return response.ok;
        } catch (error) {
            console.error('Ollama connection check failed:', error.message);
            return false;
        }
    }

    /**
     * 获取可用模型列表
     */
    async listModels() {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`, {
                method: 'GET',
                signal: AbortSignal.timeout(5000)
            });
            if (response.ok) {
                const data = await response.json();
                return data.models || [];
            }
            return [];
        } catch (error) {
            console.error('Failed to list models:', error.message);
            return [];
        }
    }

    /**
     * 生成响应
     */
    async generate(prompt, systemPrompt = null) {
        try {
            console.log(`Ollama: Generating response with model ${this.model}...`);

            // 添加中文系统提示
            const chineseSystemPrompt = "请用中文回答。";

            const body = {
                model: this.model,
                prompt: prompt,
                stream: false,
                options: {
                    temperature: 0.7,
                    num_predict: 256  // 减少输出长度，加快生成
                },
                system: systemPrompt || chineseSystemPrompt
            };

            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body),
                signal: AbortSignal.timeout(120000)  // 增加到120秒
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Ollama API error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log('Ollama: Response generated');
            return data.response || '';

        } catch (error) {
            console.error('Ollama generation error:', error.message);
            throw error;
        }
    }

    /**
     * Chat 模式生成响应
     */
    async chat(messages) {
        try {
            console.log(`Ollama: Chat with model ${this.model}...`);

            const response = await fetch(`${this.baseUrl}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: messages,
                    stream: false,
                    options: {
                        temperature: 0.7,
                        num_predict: 512
                    }
                }),
                signal: AbortSignal.timeout(this.timeout)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Ollama API error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log('Ollama: Chat response generated');
            return data.message?.content || '';

        } catch (error) {
            console.error('Ollama chat error:', error.message);
            throw error;
        }
    }

    /**
     * 拉取模型
     */
    async pullModel(modelName, progressCallback = null) {
        try {
            console.log(`Ollama: Pulling model ${modelName}...`);

            const response = await fetch(`${this.baseUrl}/api/pull`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: modelName,
                    stream: true
                })
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const text = decoder.decode(value);
                const lines = text.split('\n').filter(line => line.trim());

                for (const line of lines) {
                    try {
                        const data = JSON.parse(line);
                        if (progressCallback && data.status) {
                            progressCallback(data.status, data.completed, data.total);
                        }
                        console.log(`Ollama pull: ${data.status}`);
                    } catch (e) {
                        // Ignore parse errors
                    }
                }
            }

            console.log(`Ollama: Model ${modelName} pulled successfully`);
            return true;

        } catch (error) {
            console.error('Ollama pull error:', error.message);
            throw error;
        }
    }

    /**
     * 推荐的小模型列表
     */
    static getRecommendedModels() {
        return [
            { id: 'qwen2.5:0.5b', name: 'Qwen2.5 0.5B', size: '~400MB', desc: '最小，速度快' },
            { id: 'qwen2.5:1.5b', name: 'Qwen2.5 1.5B', size: '~1GB', desc: '小，效果好' },
            { id: 'llama3.2:1b', name: 'Llama 3.2 1B', size: '~1.3GB', desc: 'Meta模型' },
            { id: 'phi3:mini', name: 'Phi-3 Mini', size: '~2GB', desc: 'Microsoft模型' },
            { id: 'gemma2:2b', name: 'Gemma 2 2B', size: '~1.6GB', desc: 'Google模型' }
        ];
    }
}

export default OllamaService;
