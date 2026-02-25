/**
 * 研究代理系统 - 应用入口
 *
 * 整合所有模块，提供用户交互界面
 */

import { ResearchOrchestrator as Orchestrator } from '../src/research_orchestrator_new.js';

class ResearchAgentApp {
    constructor() {
        this.orchestrator = null;
        this.isRunning = false;
        this.currentResearch = null;

        // 初始化
        this.init();
    }

    /**
     * 初始化应用
     */
    init() {
        this.setupEventListeners();
        this.setupProgressCallbacks();
        console.log('Research Agent System initialized');
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // API配置按钮
        const apiConfigBtn = document.getElementById('api-config-btn');
        if (apiConfigBtn) {
            apiConfigBtn.addEventListener('click', () => this.openApiModal());
        }

        // 开始研究按钮
        const startBtn = document.getElementById('start-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.startResearch());
        }

        // 报告操作按钮
        const expandBtn = document.getElementById('expand-report');
        const copyBtn = document.getElementById('copy-report');
        const downloadBtn = document.getElementById('download-report');

        if (expandBtn) {
            expandBtn.addEventListener('click', () => this.toggleReport());
        }

        if (copyBtn) {
            copyBtn.addEventListener('click', () => this.copyReport());
        }

        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => this.downloadReport());
        }
    }

    /**
     * 设置进度回调
     */
    setupProgressCallbacks() {
        // 创建编排器时会设置回调
    }

    /**
     * 开始研究
     */
    async startResearch() {
        const topicInput = document.getElementById('research-topic');
        const topic = topicInput.value.trim();

        if (!topic) {
            this.showError('请输入研究主题');
            return;
        }

        if (this.isRunning) {
            this.showError('研究正在进行中，请稍候...');
            return;
        }

        try {
            this.isRunning = true;
            this.updateUIState('running');

            // 显示进度区
            this.showSection('progress-section');
            this.hideSection('results-section');

            // 清空日志
            this.clearLogs();

            // 创建编排器 - 使用 Ollama 本地模型
            if (!this.orchestrator) {
                let apiConfig = {
                    model: 'qwen2.5:0.5b'  // 使用 Qwen2.5 0.5B 模型
                };

                console.log('Using Ollama local model:', apiConfig.model);
                this.addLog('info', 'Model Config', `Using Ollama: ${apiConfig.model}`);

                this.orchestrator = new Orchestrator(apiConfig);
            }

            // 设置进度监听
            this.orchestrator.onProgress((type, data) => {
                this.handleProgress(type, data);
            });

            // 执行研究
            this.addLog('info', '开始研究流程', `主题: ${topic}`);

            this.currentResearch = await this.orchestrator.conductResearch(topic, {
                parallelAnalyzers: 3,
                search: {
                    maxIterations: 3,
                    resultsPerQuery: 10
                }
            });

            if (this.currentResearch.success) {
                this.displayResults(this.currentResearch);
                this.addLog('success', '研究完成', `评分: ${this.currentResearch.evaluation.overallScore}`);
            } else {
                this.showError('研究失败: ' + this.currentResearch.error);
            }

        } catch (error) {
            console.error('Research error:', error);
            this.showError('研究过程中发生错误: ' + error.message);
        } finally {
            this.isRunning = false;
            this.updateUIState('idle');
        }
    }

    /**
     * 处理进度事件
     */
    handleProgress(type, data) {
        switch (type) {
            case 'start':
                this.addLog('info', '开始', data.message);
                break;

            case 'phase':
                this.updatePhase(data.phase);
                this.addLog('info', '阶段切换', data.message);
                break;

            case 'planning':
                this.updatePhase('planning', 'active');
                this.addLog('planner', '规划中', data.message || '创建研究计划...');
                break;

            case 'plan_created':
                this.addLog('planner', '计划已创建', `步骤数: ${data.plan?.steps?.length || 0}`);
                break;

            case 'searching':
            case 'batch_searching':
                this.updatePhase('searching', 'active');
                this.addLog('searcher', '检索中', data.message || '执行信息检索...');
                break;

            case 'search_progress':
                this.addLog('searcher', '检索进度',
                    `${data.current}/${data.total}: ${data.query?.substring(0, 30)}...`);
                this.updateProgress(30 + (data.current / data.total) * 20);
                break;

            case 'search_complete':
                this.addLog('searcher', '检索完成', `来源数: ${data.totalSources}`);
                break;

            case 'analyzing':
            case 'batch_analyzing':
                this.updatePhase('analyzing', 'active');
                this.addLog('analyzer', '分析中', data.message || '分析内容...');
                break;

            case 'analysis_progress':
                this.addLog('analyzer', '分析进度',
                    `${data.current}/${data.total}: ${data.source?.substring(0, 30)}...`);
                this.updateProgress(50 + (data.current / data.total) * 15);
                break;

            case 'analysis_complete':
                this.addLog('analyzer', '分析完成', `关键点: ${data.keyPoints}`);
                break;

            case 'comparing':
                this.addLog('analyzer', '对比中', '对比分析结果...');
                break;

            case 'synthesizing':
                this.updatePhase('synthesizing', 'active');
                this.addLog('synthesizer', '生成中', '整合研究结果...');
                break;

            case 'report_complete':
                this.addLog('synthesizer', '报告已生成', `章节数: ${data.sectionsCount}`);
                break;

            case 'evaluating':
                this.updatePhase('evaluating', 'active');
                this.addLog('evaluator', '评估中', '评估研究质量...');
                break;

            case 'evaluation_complete':
                this.addLog('evaluator', '评估完成', `评分: ${data.overallScore}`);
                this.updatePhase('evaluating', 'completed');
                break;

            case 'complete':
                this.addLog('success', '完成', `研究完成，耗时: ${Math.round(data.duration / 1000)}秒`);
                this.updateProgress(100);
                this.markAllPhasesComplete();
                break;

            case 'error':
                this.addLog('error', '错误', data.error);
                break;

            default:
                this.addLog('info', type, JSON.stringify(data));
        }
    }

    /**
     * 更新阶段状态
     */
    updatePhase(phase, status = 'active') {
        // 更新当前阶段文本
        const phaseText = document.querySelector('.phase-text');
        const phaseNames = {
            'planning': '规划阶段',
            'searching': '检索阶段',
            'analyzing': '分析阶段',
            'synthesizing': '综合阶段',
            'evaluating': '评估阶段'
        };

        if (phaseText && phaseNames[phase]) {
            phaseText.textContent = phaseNames[phase];
        }

        // 更新阶段样式
        const phases = ['planning', 'searching', 'analyzing', 'synthesizing', 'evaluating'];
        phases.forEach((p, index) => {
            const phaseEl = document.getElementById(`phase-${p}`);
            if (!phaseEl) return;

            // 移除所有状态类
            phaseEl.classList.remove('active', 'completed');

            if (p === phase) {
                if (status === 'completed') {
                    phaseEl.classList.add('completed');
                } else if (status === 'active') {
                    phaseEl.classList.add('active');
                }
            } else if (phases.indexOf(p) < phases.indexOf(phase)) {
                phaseEl.classList.add('completed');
            }
        });

        // 更新进度条
        const progressMap = {
            'planning': 10,
            'searching': 30,
            'analyzing': 50,
            'synthesizing': 80,
            'evaluating': 95
        };

        if (progressMap[phase] && status === 'active') {
            this.updateProgress(progressMap[phase]);
        }
    }

    /**
     * 更新进度条
     */
    updateProgress(percent) {
        const progressBar = document.getElementById('overall-progress');
        const progressText = document.getElementById('progress-percent');

        if (progressBar) {
            progressBar.style.width = `${percent}%`;
        }

        if (progressText) {
            progressText.textContent = `${Math.round(percent)}%`;
        }
    }

    /**
     * 标记所有阶段为完成
     */
    markAllPhasesComplete() {
        const phases = ['planning', 'searching', 'analyzing', 'synthesizing', 'evaluating'];
        phases.forEach(p => {
            const phaseEl = document.getElementById(`phase-${p}`);
            if (phaseEl) {
                phaseEl.classList.remove('active');
                phaseEl.classList.add('completed');
            }
        });
    }

    /**
     * 添加日志
     */
    addLog(type, title, message) {
        const logContainer = document.getElementById('log-container');
        if (!logContainer) return;

        const time = new Date().toLocaleTimeString();
        const entry = document.createElement('div');
        entry.className = 'log-entry';

        const typeClass = {
            'info': 'info',
            'planner': 'planner',
            'searcher': 'searcher',
            'analyzer': 'analyzer',
            'synthesizer': 'synthesizer',
            'evaluator': 'evaluator',
            'success': 'success',
            'error': 'error'
        }[type] || 'info';

        entry.innerHTML = `
            <div class="log-time">${time}</div>
            <div class="log-content">
                <span class="log-type log-${typeClass}">[${title}]</span>
                <span class="log-message">${message}</span>
            </div>
        `;

        logContainer.appendChild(entry);
        logContainer.scrollTop = logContainer.scrollHeight;
    }

    /**
     * 清空日志
     */
    clearLogs() {
        const logContainer = document.getElementById('log-container');
        if (logContainer) {
            logContainer.innerHTML = '';
        }
    }

    /**
     * 显示研究结果
     */
    displayResults(research) {
        this.showSection('results-section');

        // 更新统计
        this.updateStats(research);

        // 更新摘要
        this.updateSummary(research);

        // 更新主要发现
        this.updateFindings(research);

        // 更新评估结果
        this.updateEvaluation(research.evaluation);

        // 更新完整报告
        this.updateFullReport(research.report);
    }

    /**
     * 更新统计信息
     */
    updateStats(research) {
        document.getElementById('stat-sources').textContent =
            research.sources?.length || research.metadata?.sourcesCount || 0;
        document.getElementById('stat-analyses').textContent =
            research.analyses?.length || 0;
        document.getElementById('stat-time').textContent =
            Math.round((research.metadata?.duration || 0) / 1000) + 's';
        document.getElementById('stat-score').textContent =
            research.evaluation?.overallScore?.toFixed(1) || 'N/A';

        const scoreBadge = document.getElementById('result-score');
        if (scoreBadge) {
            scoreBadge.textContent = `评分: ${research.evaluation?.overallScore?.toFixed(1) || 'N/A'}`;
        }
    }

    /**
     * 更新摘要
     */
    updateSummary(research) {
        const summaryEl = document.getElementById('result-summary');
        if (!summaryEl) return;

        // 从报告的摘要章节获取内容
        const abstractSection = research.report?.sections?.find(s => s.id === 'abstract');
        if (abstractSection) {
            summaryEl.textContent = abstractSection.content;
        } else {
            summaryEl.textContent = '摘要生成中...';
        }
    }

    /**
     * 更新主要发现
     */
    updateFindings(research) {
        const findingsList = document.getElementById('findings-list');
        if (!findingsList) return;

        findingsList.innerHTML = '';

        // 从对比结果获取共同观点
        const findings = research.comparison?.commonGround || [];

        if (findings.length > 0) {
            findings.slice(0, 5).forEach(finding => {
                const li = document.createElement('li');
                li.textContent = finding.point;
                findingsList.appendChild(li);
            });
        } else {
            findingsList.innerHTML = '<li>未找到明确的发现</li>';
        }
    }

    /**
     * 更新评估结果
     */
    updateEvaluation(evaluation) {
        const dimensionsEl = document.getElementById('evaluation-dimensions');
        const suggestionsList = document.getElementById('suggestions-list');

        if (dimensionsEl) {
            dimensionsEl.innerHTML = '';

            const dimensions = evaluation.dimensions || {};
            const dimensionLabels = {
                completeness: '完整性',
                accuracy: '准确性',
                timeliness: '时效性',
                reliability: '可靠性',
                readability: '可读性'
            };

            for (const [key, value] of Object.entries(dimensions)) {
                const score = value.score || 7;
                const comment = value.comment || '';

                const div = document.createElement('div');
                div.className = 'dimension-item';
                div.innerHTML = `
                    <div class="dimension-header">
                        <span class="dimension-name">${dimensionLabels[key] || key}</span>
                        <span class="dimension-score">${score.toFixed(1)}</span>
                    </div>
                    <div class="dimension-bar">
                        <div class="dimension-fill" style="width: ${score * 10}%"></div>
                    </div>
                    <div class="dimension-comment" style="font-size: 0.85rem; color: #7f8c8d; margin-top: 5px;">
                        ${comment}
                    </div>
                `;
                dimensionsEl.appendChild(div);
            }
        }

        if (suggestionsList) {
            suggestionsList.innerHTML = '';

            const suggestions = evaluation.suggestions || [];
            suggestions.slice(0, 5).forEach(suggestion => {
                const li = document.createElement('li');
                li.textContent = suggestion;
                suggestionsList.appendChild(li);
            });
        }
    }

    /**
     * 更新完整报告
     */
    updateFullReport(report) {
        const reportContent = document.getElementById('report-content');
        if (!reportContent) return;

        let html = `<h1>${report.title}</h1>`;
        html += `<p style="color: #7f8c8d; margin-bottom: 20px;">`;
        html += `生成时间: ${new Date(report.metadata.generatedAt).toLocaleString()} | `;
        html += `来源数量: ${report.metadata.sourcesCount} | `;
        html += `字数: ${report.metadata.wordCount}`;
        html += `</p>`;

        report.sections.forEach(section => {
            html += `<h2>${section.title}</h2>`;
            html += `<div>${this.formatContent(section.content)}</div>`;
        });

        reportContent.innerHTML = html;
    }

    /**
     * 格式化内容
     */
    formatContent(content) {
        if (typeof content !== 'string') {
            return JSON.stringify(content);
        }

        // 简单的Markdown转换
        return content
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
            .replace(/^/, '<p>')
            .replace(/$/, '</p>');
    }

    /**
     * 切换报告显示
     */
    toggleReport() {
        const reportContent = document.getElementById('report-content');
        const expandBtn = document.getElementById('expand-report');

        if (reportContent && expandBtn) {
            if (reportContent.style.display === 'none') {
                reportContent.style.display = 'block';
                expandBtn.textContent = '收起报告';
            } else {
                reportContent.style.display = 'none';
                expandBtn.textContent = '展开报告';
            }
        }
    }

    /**
     * 复制报告
     */
    async copyReport() {
        if (!this.currentResearch?.report) return;

        const synthesizer = this.orchestrator.synthesizer;
        const markdown = synthesizer.toMarkdown(this.currentResearch.report);

        try {
            await navigator.clipboard.writeText(markdown);
            this.showNotification('报告已复制到剪贴板');
        } catch (err) {
            this.showError('复制失败: ' + err.message);
        }
    }

    /**
     * 下载报告
     */
    downloadReport() {
        if (!this.currentResearch?.report) return;

        const synthesizer = this.orchestrator.synthesizer;
        const markdown = synthesizer.toMarkdown(this.currentResearch.report);

        const blob = new Blob([markdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `research-report-${Date.now()}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showNotification('报告已下载');
    }

    /**
     * 显示/隐藏区域
     */
    showSection(id) {
        const el = document.getElementById(id);
        if (el) el.style.display = 'block';
    }

    hideSection(id) {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    }

    /**
     * 更新UI状态
     */
    updateUIState(state) {
        const startBtn = document.getElementById('start-btn');
        const topicInput = document.getElementById('research-topic');

        if (state === 'running') {
            if (startBtn) {
                startBtn.disabled = true;
                startBtn.innerHTML = '<span class="btn-icon">⏳</span> 研究中...';
            }
            if (topicInput) topicInput.disabled = true;
        } else {
            if (startBtn) {
                startBtn.disabled = false;
                startBtn.innerHTML = '<span class="btn-icon">▶</span> 开始研究';
            }
            if (topicInput) topicInput.disabled = false;
        }
    }

    /**
     * 显示通知
     */
    showNotification(message) {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: #2ecc71;
            color: white;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    /**
     * 显示错误
     */
    showError(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: #e74c3c;
            color: white;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 10000;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => notification.remove(), 5000);
    }
}

// 添加动画样式
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }

    .log-planner { color: #3498db; }
    .log-searcher { color: #2ecc71; }
    .log-analyzer { color: #9b59b6; }
    .log-synthesizer { color: #e67e22; }
    .log-evaluator { color: #e74c3c; }
    .log-success { color: #27ae60; }
    .log-error { color: #c0392b; }
`;
document.head.appendChild(style);

// API配置相关函数
window.openApiModal = function() {
    const modal = document.getElementById('api-modal');
    if (modal) {
        modal.style.display = 'flex';
    }
};

window.closeApiModal = function() {
    const modal = document.getElementById('api-modal');
    if (modal) {
        modal.style.display = 'none';
    }
};

window.toggleApiInput = function(showApi) {
    const apiGroup = document.getElementById('api-input-group');
    const modelGroup = document.getElementById('model-group');
    if (apiGroup) apiGroup.style.display = showApi ? 'block' : 'none';
    if (modelGroup) modelGroup.style.display = showApi ? 'block' : 'none';
};

window.saveApiConfig = function() {
    const useApi = document.querySelector('input[name="llm-service"]:checked').value === 'huggingface';
    const apiToken = document.getElementById('api-token').value.trim();
    const modelId = document.getElementById('model-select').value;

    // 保存到localStorage
    const config = {
        useHuggingFace: useApi,
        apiToken: useApi ? apiToken : '',
        modelId: useApi ? modelId : ''
    };
    localStorage.setItem('research-agent-config', JSON.stringify(config));

    // 显示提示
    if (useApi && !apiToken) {
        alert('请输入HuggingFace API Token');
        return;
    }

    // 关闭模态框
    closeApiModal();

    // 显示保存成功提示
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed; top: 80px; right: 20px;
        background: #2ecc71; color: white; padding: 15px 20px;
        border-radius: 8px; box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 10001;
    `;
    notification.textContent = useApi ? '✅ 已配置HuggingFace API' : '✅ 已切换到智能模拟模式';
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);

    // 如果orchestrator已存在，标记需要重新创建
    if (window.app && window.app.orchestrator) {
        window.app.orchestrator = null;
    }
};

// 加载保存的配置
function loadApiConfig() {
    const saved = localStorage.getItem('research-agent-config');
    if (saved) {
        try {
            const config = JSON.parse(saved);
            if (config.useHuggingFace) {
                document.querySelector('input[name="llm-service"][value="huggingface"]').checked = true;
                document.getElementById('api-token').value = config.apiToken || '';
                document.getElementById('model-select').value = config.modelId || 'Qwen/Qwen2.5-7B-Instruct';
                window.toggleApiInput(true);
            }
        } catch (e) {
            console.error('加载配置失败:', e);
        }
    }
}

// 页面加载时加载配置
loadApiConfig();

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new ResearchAgentApp();
});
