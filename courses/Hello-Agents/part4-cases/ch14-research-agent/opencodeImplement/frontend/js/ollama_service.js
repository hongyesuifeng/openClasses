class OllamaService {
    constructor(config = {}) {
        this.config = config;
        this.model = config.model || "llama3.2:1b";
        this.baseUrl = config.baseUrl || "http://localhost:11434";
        this.temperature = config.temperature || 0.7;
        this.maxTokens = config.maxTokens || 2048;
        this.isInitialized = false;
    }

    async init(progressCallback = null) {
        if (this.isInitialized) return true;
        
        try {
            if (progressCallback) {
                progressCallback(50, '连接Ollama服务...');
            }
            
            const response = await fetch(`${this.baseUrl}/api/tags`);
            if (!response.ok) {
                throw new Error('Ollama服务未运行');
            }
            
            const data = await response.json();
            const models = data.models || [];
            
            const hasModel = models.some(m => m.name.startsWith(this.model.split(':')[0]));
            if (!hasModel) {
                console.log('Model not found, using available model');
                this.model = models[0]?.name || "llama3.2:1b";
            }
            
            this.isInitialized = true;
            if (progressCallback) {
                progressCallback(100, 'Ollama已就绪');
            }
            
            return true;
        } catch (error) {
            console.error('Ollama init error:', error);
            throw new Error('无法连接Ollama服务，请确保已启动Ollama');
        }
    }

    async generate(prompt, systemPrompt = null) {
        if (!this.isInitialized) {
            await this.init();
        }

        try {
            const messages = [];
            
            if (systemPrompt) {
                messages.push({ role: "system", content: systemPrompt });
            } else {
                messages.push({ 
                    role: "system", 
                    content: "你是一个专业的研究助手。请用详细的中文回答问题。" 
                });
            }

            messages.push({ role: "user", content: prompt });

            const response = await fetch(`${this.baseUrl}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: this.model,
                    messages: messages,
                    temperature: this.temperature,
                    max_tokens: this.maxTokens,
                    stream: false
                })
            });

            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.status}`);
            }

            const text = await response.text();
            
            try {
                const lines = text.trim().split('\n');
                let content = '';
                for (const line of lines) {
                    if (line.trim()) {
                        const data = JSON.parse(line);
                        if (data.message?.content) {
                            content += data.message.content;
                        }
                        if (data.done) break;
                    }
                }
                return content || text;
            } catch (parseError) {
                console.error('JSON parse error:', parseError, 'Response:', text);
                return text;
            }

        } catch (error) {
            console.error('Ollama generation error:', error);
            throw error;
        }
    }

    static async checkOllamaSupport() {
        try {
            const response = await fetch('http://localhost:11434/api/tags');
            if (response.ok) {
                const data = await response.json();
                return {
                    supported: true,
                    reason: `Ollama已运行，可用模型: ${(data.models || []).map(m => m.name).join(', ')}`
                };
            }
            return { supported: false, reason: 'Ollama服务未运行' };
        } catch (error) {
            return { supported: false, reason: 'Ollama服务未运行，请安装并启动Ollama' };
        }
    }

    static getAvailableModels() {
        return [
            { id: "llama3.2:1b", name: "Llama 3.2 1B", desc: "推荐：速度快" },
            { id: "llama3.2:3b", name: "Llama 3.2 3B", desc: "效果更好" },
            { id: "qwen2.5:1.5b", name: "Qwen 2.5 1.5B", desc: "中文支持好" },
            { id: "qwen2.5:3b", name: "Qwen 2.5 3B", desc: "中文效果好" },
            { id: "phi3:3.8b", name: "Phi-3 3.8B", desc: "Microsoft模型" }
        ];
    }
}

window.OllamaService = OllamaService;
