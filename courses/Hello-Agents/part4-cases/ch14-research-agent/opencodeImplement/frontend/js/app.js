let llmService = null;
let isModelLoaded = false;
let iterationCount = 0;
const MAX_ITERATIONS = 2;
const USE_BACKEND_LLM = true;

class BackendLLMService {
    constructor(config = {}) {
        this.model = config.model || "qwen2.5:0.5b";
        this.baseUrl = config.baseUrl || "";
        this.temperature = config.temperature || 0.7;
        this.maxTokens = config.maxTokens || 2048;
        this.isInitialized = false;
    }

    async init(progressCallback = null) {
        if (this.isInitialized) return true;
        
        try {
            if (progressCallback) {
                progressCallback(50, '连接后端LLM服务...');
            }
            
            const response = await fetch('/api/llm/status');
            if (!response.ok) {
                throw new Error('后端LLM服务未运行');
            }
            
            const data = await response.json();
            if (!data.available) {
                console.log('LLM not available, using fallback');
            }
            
            this.isInitialized = true;
            if (progressCallback) {
                progressCallback(100, 'LLM服务已就绪');
            }
            
            return true;
        } catch (error) {
            console.error('Backend LLM init error:', error);
            throw new Error('无法连接后端LLM服务');
        }
    }

    async generate(prompt, systemPrompt = null) {
        if (!this.isInitialized) {
            await this.init();
        }

        try {
            const response = await fetch('/api/llm/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        { role: "system", content: systemPrompt || "你是一个专业的研究助手。请用详细的中文回答问题。" },
                        { role: "user", content: prompt }
                    ]
                })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || `Backend API error: ${response.status}`);
            }

            const data = await response.json();
            return data.response || data.message?.content || '';
        } catch (error) {
            console.error('LLM generation error:', error);
            throw error;
        }
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    const topicInput = document.getElementById('topic');
    const researchBtn = document.getElementById('researchBtn');
    const progressSection = document.getElementById('progressSection');
    const progressPercent = document.getElementById('progressPercent');
    const progressFill = document.getElementById('progressFill');
    const progressMessages = document.getElementById('progressMessages');
    const resultSection = document.getElementById('resultSection');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const quickBtns = document.querySelectorAll('.quick-btn');
    
    const modelState = document.getElementById('modelState');

    if (USE_BACKEND_LLM) {
        llmService = new BackendLLMService({
            model: "qwen2.5:0.5b",
            temperature: 0.7,
            maxTokens: 2048
        });
    } else {
        llmService = new OllamaService({
            model: "qwen2.5:0.5b",
            temperature: 0.7,
            maxTokens: 2048
        });
    }

    async function autoConnect() {
        try {
            modelState.textContent = '连接中...';
            await llmService.init((percent, text) => {
                modelState.textContent = text || `加载中: ${percent}%`;
            });
            isModelLoaded = true;
            modelState.textContent = '✓ 已就绪';
            modelState.classList.add('ready');
        } catch (error) {
            modelState.textContent = '连接失败: ' + error.message;
            modelState.classList.add('error');
        }
    }
    
    autoConnect();

    quickBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            topicInput.value = this.dataset.topic;
        });
    });
    
    researchBtn.addEventListener('click', startResearch);
    topicInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') startResearch();
    });
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            tabBtns.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            document.getElementById(this.dataset.tab + 'Tab').classList.add('active');
        });
    });
    
    async function startResearch() {
        const topic = topicInput.value.trim();
        if (!topic) {
            alert('请输入研究主题');
            return;
        }
        
        if (!isModelLoaded) {
            alert('模型未连接，请稍等...');
            return;
        }
        
        researchBtn.disabled = true;
        progressSection.style.display = 'block';
        resultSection.style.display = 'none';
        progressMessages.innerHTML = '';
        iterationCount = 0;
        
        try {
            updateProgress(3, '🚀 开始研究: ' + topic);
            
            updateProgress(5, '📚 正在多维度检索信息...');
            const searchResults = await performSearch(topic);
            updateProgress(25, `✅ 检索完成，发现 ${searchResults.length} 个参考资料`);
            
            let report = await generateInitialReport(topic, searchResults);
            
            for (let i = 0; i < MAX_ITERATIONS; i++) {
                iterationCount = i + 1;
                updateProgress(30 + i * 25, `🔄 迭代优化中 (${iterationCount}/${MAX_ITERATIONS})...`);
                report = await optimizeReport(topic, searchResults, report);
            }
            
            updateProgress(95, '📝 正在整理最终报告...');
            
            updateProgress(100, '✨ 研究完成!');
            
            displayResults(topic, report, searchResults);
            
        } catch (error) {
            updateProgress(0, '错误: ' + error.message);
            console.error(error);
        } finally {
            researchBtn.disabled = false;
        }
    }
    
    async function performSearch(topic) {
        try {
            const response = await fetch('/api/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic: topic })
            });
            
            if (!response.ok) {
                throw new Error('搜索失败');
            }
            
            const data = await response.json();
            return data.results || [];
        } catch (error) {
            console.error('Search error:', error);
            return [];
        }
    }
    
    async function generateInitialReport(topic, searchResults) {
        const sourcesByType = {};
        searchResults.forEach(r => {
            const type = r.source || 'Web';
            if (!sourcesByType[type]) {
                sourcesByType[type] = [];
            }
            sourcesByType[type].push(r);
        });
        
        // 1. 生成历史发展脉络
        let historyPrompt = `请为"${topic}"生成详细的历史发展脉络（600字以上），要求：
1. 描述该领域的起源和早期发展
2. 列出各个重要发展阶段和里程碑
3. 关键技术突破和时间节点
4. 重要人物、机构和事件
请用详细的中文按时间顺序撰写。`;

        if (searchResults.length > 0) {
            const titles = searchResults.slice(0, 15).map(r => `- ${r.title}`).join('\n');
            historyPrompt += `\n\n参考来源：\n${titles}`;
        }
        
        updateProgress(30, '📜 正在分析历史发展...');
        const history = await llmService.generate(historyPrompt);
        
        // 2. 生成技术原理
        let techPrompt = `请为"${topic}"生成核心技术原理分析（600字以上），要求：
1. 基础理论和技术架构
2. 核心算法和实现方法
3. 主要技术分支和路线
4. 技术栈和工具生态
请用详细的中文撰写，使用专业术语。`;

        updateProgress(35, '⚙️ 正在分析技术原理...');
        const technology = await llmService.generate(techPrompt);
        
        // 3. 生成应用场景
        let appPrompt = `请为"${topic}"生成详细的应用场景分析（500字以上），要求：
1. 当前主要应用领域和场景
2. 典型应用案例和实践
3. 各行业的应用现状
4. 实际效果和价值
请用详细的中文分点撰写。`;

        updateProgress(40, '🌐 正在分析应用场景...');
        const applications = await llmService.generate(appPrompt);
        
        // 4. 生成未来发展
        let futurePrompt = `请为"${topic}"分析未来发展趋势（500字以上），要求：
1. 未来5-10年的发展方向
2. 潜在的技术突破
3. 新兴应用领域
4. 面临的挑战和机遇
请用详细的中文撰写。`;

        updateProgress(45, '🔮 正在分析未来趋势...');
        const future = await llmService.generate(futurePrompt);
        
        // 5. 生成摘要
        let summaryPrompt = `请为"${topic}"生成一份简洁的研究摘要（300字以上），要求：
1. 概括该领域的研究意义
2. 总结当前发展现状
3. 展望未来趋势
请用流畅的中文撰写。`;

        if (searchResults.length > 0) {
            const titles = searchResults.slice(0, 10).map(r => `- ${r.title}`).join('\n');
            summaryPrompt += `\n\n参考来源：\n${titles}`;
        }

        updateProgress(48, '📝 正在生成摘要...');
        const summary = await llmService.generate(summaryPrompt);
        
        return {
            history: history,
            technology: technology,
            applications: applications,
            future: future,
            summary: summary,
            searchResults: searchResults
        };
    }
    
    async function optimizeReport(topic, searchResults, currentReport) {
        let optimizePrompt = `你是一个研究报告优化专家。请根据以下信息优化改进这份关于"${topic}"的研究报告。

当前报告结构：
1. 历史发展脉络：${currentReport.history.substring(0, 200)}...
2. 技术原理：${currentReport.technology.substring(0, 200)}...
3. 应用场景：${currentReport.applications.substring(0, 200)}...
4. 未来趋势：${currentReport.future.substring(0, 200)}...

参考资料数量：${searchResults.length}个

请根据以下原则优化报告：
1. 填补当前报告中的空白和不足
2. 深化技术原理的描述
3. 补充更多实际应用案例
4. 增强历史发展的完整性
5. 使内容更加连贯和深入

请用中文输出优化后的各部分内容，格式如下：
---
【优化后的历史发展】
[内容]
【优化后的技术原理】
[内容]
【优化后的应用场景】
[内容]
【优化后的未来趋势】
[内容]
---`;

        const optimized = await llmService.generate(optimizePrompt);
        
        // 解析优化结果
        const parts = optimized.split('【');
        let newReport = { ...currentReport };
        
        for (const part of parts) {
            if (part.includes('历史发展】')) {
                newReport.history = part.split('】')[1].trim();
            } else if (part.includes('技术原理】')) {
                newReport.technology = part.split('】')[1].trim();
            } else if (part.includes('应用场景】')) {
                newReport.applications = part.split('】')[1].trim();
            } else if (part.includes('未来趋势】')) {
                newReport.future = part.split('】')[1].trim();
            }
        }
        
        // 如果解析失败，使用原始优化结果
        if (newReport.history === currentReport.history) {
            newReport.history = currentReport.history + '\n\n' + optimized.substring(0, 500);
        }
        
        return newReport;
    }
    
    async function generateReferences(searchResults, progressCallback) {
        const references = [];
        const batchSize = 5;
        const totalRefs = Math.min(searchResults.length, 50);
        
        for (let i = 0; i < totalRefs; i += batchSize) {
            const batch = searchResults.slice(i, i + batchSize);
            const batchPromises = batch.map(async (r) => {
                let summaryPrompt = `请为以下参考资料生成一个简洁的中文小结（30-50字）：
标题：${r.title}
来源：${r.source}
内容：${(r.snippet || '').substring(0, 150)}

要求：小结要准确概括该资料的核心内容。`;
                
                try {
                    const summary = await llmService.generate(summaryPrompt);
                    return {
                        title: r.title,
                        url: r.url,
                        source: r.source,
                        summary: summary
                    };
                } catch (e) {
                    return {
                        title: r.title,
                        url: r.url,
                        source: r.source,
                        summary: '该资料对了解该领域具有参考价值。'
                    };
                }
            });
            
            const batchResults = await Promise.all(batchPromises);
            references.push(...batchResults);
            
            if (progressCallback) {
                const progress = 85 + Math.floor((i / totalRefs) * 15);
                progressCallback(progress, `📚 正在生成参考资料小结 (${Math.min(i + batchSize, totalRefs)}/${totalRefs})`);
            }
        }
        
        return references;
    }
    
    function updateProgress(percent, message) {
        progressPercent.textContent = percent + '%';
        progressFill.style.width = percent + '%';
        
        const msgDiv = document.createElement('div');
        msgDiv.textContent = `[${percent}%] ${message}`;
        progressMessages.appendChild(msgDiv);
        progressMessages.scrollTop = progressMessages.scrollHeight;
    }
    
    async function displayResults(topic, report, searchResults) {
        resultSection.style.display = 'block';
        
        const reportContent = document.getElementById('reportContent');
        
        // 生成参考资料（使用回调更新进度）
        const references = await generateReferences(searchResults, updateProgress);
        
        updateProgress(100, '✨ 研究完成!');
        
        reportContent.innerHTML = `
            <div class="report-header">
                <h1>${topic}</h1>
                <p class="report-meta">参考资料数量: ${references.length} | 迭代优化次数: ${MAX_ITERATIONS}</p>
            </div>
            
            <section class="report-section">
                <h2>📝 研究摘要</h2>
                <div class="section-content">${report.summary}</div>
            </section>
            
            <section class="report-section">
                <h2>📜 历史发展脉络</h2>
                <div class="section-content">${report.history}</div>
            </section>
            
            <section class="report-section">
                <h2>⚙️ 核心技术原理</h2>
                <div class="section-content">${report.technology}</div>
            </section>
            
            <section class="report-section">
                <h2>🌐 应用场景</h2>
                <div class="section-content">${report.applications}</div>
            </section>
            
            <section class="report-section">
                <h2>🔮 未来发展趋势</h2>
                <div class="section-content">${report.future}</div>
            </section>
        `;
        
        const sourcesList = document.getElementById('sourcesList');
        const sourceByType = {};
        references.forEach(r => {
            const sourceType = r.source || '其他';
            if (!sourceByType[sourceType]) {
                sourceByType[sourceType] = [];
            }
            sourceByType[sourceType].push(r);
        });
        
        let sourcesHtml = `<p class="total-sources">共 ${references.length} 个参考资料</p>`;
        
        for (const [sourceType, refs] of Object.entries(sourceByType)) {
            sourcesHtml += `<div class="source-type-section">
                <h3 class="source-type-title">${sourceType} (${refs.length}条)</h3>`;
            
            refs.forEach(r => {
                sourcesHtml += `
                <div class="source-item">
                    <h4><a href="${r.url}" target="_blank">${r.title}</a></h4>
                    <span class="source-tag">${r.source || '未知来源'}</span>
                    <p class="source-summary">${r.summary || '暂无小结'}</p>
                </div>`;
            });
            
            sourcesHtml += '</div>';
        }
        
        if (references.length === 0) {
            sourcesHtml = '<p class="no-data">暂无参考资料数据</p>';
        }
        
        sourcesList.innerHTML = sourcesHtml;
    }
});
