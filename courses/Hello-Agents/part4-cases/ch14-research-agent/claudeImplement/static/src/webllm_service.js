/**
 * WebLLM 本地模型服务
 * 在浏览器中使用 WebGPU 运行大语言模型
 */

import * as webllm from "@mlc-ai/web-llm";

export class WebLLMService {
    constructor(config = {}) {
        this.config = config;
        // 使用较小的模型以加快加载速度
        this.modelId = config.modelId || "Qwen2.5-1.5B-Instruct-q4f16_1-MLC";
        this.engine = null;
        this.isInitialized = false;
        this.initPromise = null;
        this.temperature = config.temperature || 0.7;
        this.maxTokens = config.maxTokens || 1024;
    }

    /**
     * 初始化模型引擎
     */
    async init(progressCallback = null) {
        if (this.isInitialized) return;
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

    /**
     * 生成响应
     */
    async generate(prompt, systemPrompt = null) {
        // 确保模型已初始化
        if (!this.isInitialized) {
            await this.init();
        }

        if (!this.engine) {
            throw new Error("WebLLM engine not initialized");
        }

        try {
            console.log("WebLLM: Generating response...");

            const messages = [];

            // 简短的系统提示
            messages.push({
                role: "system",
                content: "You are a helpful assistant. Respond concisely in the same language as the user."
            });

            // 截断过长的 prompt
            const truncatedPrompt = prompt.length > 1000
                ? prompt.substring(0, 1000) + "..."
                : prompt;

            messages.push({
                role: "user",
                content: truncatedPrompt
            });

            // 使用较短的 max_tokens 加快生成
            const response = await this.engine.chat.completions.create({
                messages: messages,
                temperature: 0.7,
                max_tokens: 512,  // 减少输出长度
                top_p: 0.9
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

    /**
     * 检查 WebGPU 支持
     */
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

    /**
     * 获取可用模型列表
     */
    static getAvailableModels() {
        return [
            { id: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC", name: "Qwen2.5 1.5B", size: "~1GB", desc: "推荐：速度快，中文支持好" },
            { id: "Qwen2.5-3B-Instruct-q4f16_1-MLC", name: "Qwen2.5 3B", size: "~2GB", desc: "效果更好，加载较慢" },
            { id: "Llama-3.2-1B-Instruct-q4f16_1-MLC", name: "Llama 3.2 1B", size: "~0.7GB", desc: "Meta模型，英文效果好" },
            { id: "Llama-3.2-3B-Instruct-q4f16_1-MLC", name: "Llama 3.2 3B", size: "~2GB", desc: "Meta模型，效果更好" },
            { id: "Phi-3.5-mini-instruct-q4f16_1-MLC", name: "Phi-3.5 Mini", size: "~2GB", desc: "Microsoft模型，效果好" },
            { id: "gemma-2-2b-it-q4f16_1-MLC", name: "Gemma 2 2B", size: "~1.4GB", desc: "Google模型" }
        ];
    }
}

export default WebLLMService;
