/**
 * WebLLM 本地模型服务
 * 在浏览器中使用 WebGPU 运行大语言模型
 */

class WebLLMService {
    constructor(config = {}) {
        this.config = config;
        this.modelId = config.modelId || "Qwen2.5-1.5B-Instruct-q4f16_1-MLC";
        this.engine = null;
        this.isInitialized = false;
        this.initPromise = null;
        this.temperature = config.temperature || 0.7;
        this.maxTokens = config.maxTokens || 2048;
    }

    async init(progressCallback = null) {
        if (this.isInitialized) return true;
        if (this.initPromise) return this.initPromise;

        this.initPromise = this._doInit(progressCallback);
        return this.initPromise;
    }

    async _doInit(progressCallback) {
        try {
            console.log(`Loading WebLLM model: ${this.modelId}`);

            const initProgressCallback = (progress) => {
                const percent = Math.round(progress.progress * 100);
                const text = progress.text || `Loading: ${percent}%`;
                console.log(`WebLLM: ${text}`);
                if (progressCallback) {
                    progressCallback(percent, text);
                }
            };

            const webllm = await import("@mlc-ai/web-llm");
            
            this.engine = await webllm.CreateMLCEngine(this.modelId, {
                initProgressCallback: initProgressCallback
            });

            this.isInitialized = true;
            console.log("WebLLM model loaded successfully");
            return true;
        } catch (error) {
            console.error("Failed to load WebLLM model:", error);
            this.initPromise = null;
            throw error;
        }
    }

    async generate(prompt, systemPrompt = null) {
        if (!this.isInitialized) {
            await this.init();
        }

        if (!this.engine) {
            throw new Error("WebLLM engine not initialized");
        }

        try {
            console.log("WebLLM: Generating response...");

            const messages = [];

            if (systemPrompt) {
                messages.push({
                    role: "system",
                    content: systemPrompt
                });
            } else {
                messages.push({
                    role: "system",
                    content: "你是一个专业的研究助手。请用详细的中文回答问题，提供深入的分析和见解。"
                });
            }

            messages.push({
                role: "user",
                content: prompt
            });

            const webllm = await import("@mlc-ai/web-llm");
            
            const response = await this.engine.chat.completions.create({
                messages: messages,
                temperature: this.temperature,
                max_tokens: this.maxTokens,
                top_p: 0.95
            });

            console.log("WebLLM: Response generated");
            const content = response.choices[0]?.message?.content || "";
            console.log("WebLLM: Response length:", content.length);
            return content;

        } catch (error) {
            console.error("WebLLM generation error:", error);
            throw error;
        }
    }

    static async checkWebGPUSupport() {
        if (!navigator.gpu) {
            return {
                supported: false,
                reason: "WebGPU is not supported in this browser. Please use Chrome 113+ or Edge 113+."
            };
        }

        try {
            const adapter = await navigator.gpu.requestAdapter();
            if (!adapter) {
                return {
                    supported: false,
                    reason: "No WebGPU adapter found. Your GPU may not support WebGPU."
                };
            }

            const device = await adapter.requestDevice();
            if (!device) {
                return {
                    supported: false,
                    reason: "Failed to create WebGPU device."
                };
            }

            return {
                supported: true,
                reason: "WebGPU is supported and ready."
            };
        } catch (error) {
            return {
                supported: false,
                reason: `WebGPU check failed: ${error.message}`
            };
        }
    }

    static getAvailableModels() {
        return [
            { id: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC", name: "Qwen2.5 1.5B", size: "~1GB", desc: "推荐：速度快，中文支持好" },
            { id: "Qwen2.5-3B-Instruct-q4f16_1-MLC", name: "Qwen2.5 3B", size: "~2GB", desc: "效果更好，加载较慢" },
            { id: "Llama-3.2-1B-Instruct-q4f16_1-MLC", name: "Llama 3.2 1B", size: "~0.7GB", desc: "Meta模型，英文效果好" },
            { id: "Llama-3.2-3B-Instruct-q4f16_1-MLC", name: "Llama 3.2 3B", size: "~2GB", desc: "Meta模型，效果更好" },
            { id: "Phi-3.5-mini-instruct-q4f16_1-MLC", name: "Phi-3.5 Mini", size: "~2GB", desc: "Microsoft模型，效果好" }
        ];
    }
}

window.WebLLMService = WebLLMService;
