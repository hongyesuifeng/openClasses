/**
 * Game Dev Town - 主应用
 */

// 全局组件实例
let chatManager;
let charactersManager;
let dashboardManager;

// 应用状态
const appState = {
    connected: false,
    meetingActive: false,
    currentScenario: null,
};

/**
 * 初始化应用
 */
async function initApp() {
    console.log('🎮 Game Dev Town 初始化...');

    // 初始化组件
    chatManager = new ChatManager('messagesContainer');
    charactersManager = new CharactersManager('charactersList');
    dashboardManager = new DashboardManager();

    // 初始化仪表盘
    dashboardManager.init();

    // 绑定事件
    bindEvents();

    // 连接 WebSocket
    connectWebSocket();

    // 加载初始数据
    await loadInitialData();
}

/**
 * 绑定 UI 事件
 */
function bindEvents() {
    // 开始会议按钮
    const startBtn = document.getElementById('startMeetingBtn');
    if (startBtn) {
        startBtn.addEventListener('click', startMeeting);
    }

    // 结束会议按钮
    const endBtn = document.getElementById('endMeetingBtn');
    if (endBtn) {
        endBtn.addEventListener('click', endMeeting);
    }

    // 发送按钮
    const sendBtn = document.getElementById('sendBtn');
    if (sendBtn) {
        sendBtn.addEventListener('click', sendUserMessage);
    }

    // 输入框回车
    const inputField = document.getElementById('userInput');
    if (inputField) {
        inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendUserMessage();
            }
        });
    }
}

/**
 * 连接 WebSocket
 */
function connectWebSocket() {
    api.connectWebSocket(
        // 消息处理器
        handleWebSocketMessage,
        // 连接成功
        () => {
            appState.connected = true;
            updateConnectionStatus(true);
            dashboardManager.addActivity('已连接到服务器');
        },
        // 连接断开
        () => {
            appState.connected = false;
            updateConnectionStatus(false);
            dashboardManager.addActivity('与服务器断开连接');
        }
    );
}

/**
 * 处理 WebSocket 消息
 */
function handleWebSocketMessage(data) {
    console.log('处理消息:', data.type);

    switch (data.type) {
        case 'connected':
            handleConnected(data.data);
            break;
        case 'meeting_started':
            handleMeetingStarted(data.data);
            break;
        case 'new_message':
            handleNewMessage(data.data);
            break;
        case 'agent_status':
            handleAgentStatus(data.data);
            break;
        case 'meeting_ended':
            handleMeetingEnded(data.data);
            break;
        case 'status_update':
            handleStatusUpdate(data.data);
            break;
        case 'error':
            handleError(data.data);
            break;
    }
}

/**
 * 处理连接成功
 */
function handleConnected(data) {
    console.log('已连接，收到初始数据');

    // 初始化角色
    if (data.agents) {
        charactersManager.init(data.agents);
    }
}

/**
 * 处理会议开始
 */
function handleMeetingStarted(data) {
    console.log('会议已开始:', data);

    appState.meetingActive = true;

    // 更新 UI
    document.getElementById('startMeetingBtn').disabled = true;
    document.getElementById('endMeetingBtn').disabled = false;
    document.getElementById('inputArea').style.display = 'flex';

    const meetingHeader = document.getElementById('meetingHeader');
    meetingHeader.style.display = 'flex';
    document.getElementById('meetingTitle').textContent = data.title || '会议进行中';

    // 清空聊天区域
    chatManager.clear();
    chatManager.addSystemMessage(`📢 会议开始: ${data.title}`);

    // 更新状态栏
    document.getElementById('meetingStatus').textContent = '会议进行中';

    dashboardManager.addActivity(`会议开始: ${data.title}`);
}

/**
 * 处理新消息
 */
function handleNewMessage(data) {
    console.log('收到新消息:', data);

    // 移除打字指示器
    if (data.speaker && data.speaker !== 'user') {
        charactersManager.setSpeaking(data.speaker, false);
        chatManager.removeTypingIndicator(data.speaker);
    }

    // 添加消息
    chatManager.addMessage(data);

    // 确保滚动到底部
    setTimeout(() => {
        chatManager.scrollToBottom();
    }, 100);
}

/**
 * 处理 Agent 状态更新
 */
function handleAgentStatus(data) {
    console.log('Agent 状态更新:', data);

    if (data.role_id) {
        charactersManager.updateStatus(data.role_id, data);

        if (data.is_speaking) {
            // 显示打字指示器
            chatManager.addTypingIndicator(data.role_id, data.name);
        }
    }
}

/**
 * 处理会议结束
 */
function handleMeetingEnded(data) {
    console.log('会议已结束:', data);

    appState.meetingActive = false;

    // 更新 UI
    document.getElementById('startMeetingBtn').disabled = false;
    document.getElementById('endMeetingBtn').disabled = true;
    document.getElementById('inputArea').style.display = 'none';

    const meetingHeader = document.getElementById('meetingHeader');
    meetingHeader.style.display = 'none';

    // 显示总结
    if (data.conclusions && data.conclusions.length > 0) {
        chatManager.addSystemMessage('📝 会议结论:');
        data.conclusions.forEach(conclusion => {
            chatManager.addSystemMessage(`• ${conclusion}`);
        });
    }

    chatManager.addSystemMessage('📢 会议结束');

    // 更新状态
    document.getElementById('meetingStatus').textContent = '就绪';
    charactersManager.reset();

    // 更新任务统计和进度
    if (data.task_stats) {
        dashboardManager.updateFromServerData({ progress: data.task_stats });
    } else if (data.action_items) {
        dashboardManager.updateStats({
            total: data.action_items.length,
        });
    }

    // 更新进度条
    if (data.message_count) {
        // 每次会议增加一些进度
        const currentProgress = parseFloat(dashboardManager.stats.progress) || 0;
        dashboardManager.updateProgress(Math.min(100, currentProgress + 5));
    }

    dashboardManager.addActivity('会议结束');

    // 显示会议总结弹框
    if (data.summary_document) {
        showMeetingSummaryModal(data.summary_document);
    }
}

/**
 * 显示会议总结弹框
 */
function showMeetingSummaryModal(document) {
    // 移除已存在的弹框
    const existingModal = document.querySelector('.summary-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // 创建弹框
    const modal = document.createElement('div');
    modal.className = 'summary-modal';

    // 生成关键要点HTML
    let keyPointsHtml = '';
    if (document.key_points && document.key_points.length > 0) {
        document.key_points.forEach(point => {
            keyPointsHtml += `
                <li>
                    <div class="speaker">${point.speaker}</div>
                    <div class="point">${point.point}</div>
                </li>
            `;
        });
    } else {
        keyPointsHtml = '<li><div class="point">暂无关键讨论点</div></li>';
    }

    // 生成结论HTML
    let conclusionsHtml = '';
    if (document.conclusions && document.conclusions.length > 0) {
        document.conclusions.forEach(conclusion => {
            conclusionsHtml += `<li>✓ ${conclusion}</li>`;
        });
    } else {
        conclusionsHtml = '<li>暂无明确结论</li>';
    }

    // 生成行动项HTML
    let actionItemsHtml = '';
    if (document.action_items && document.action_items.length > 0) {
        document.action_items.forEach((item, index) => {
            actionItemsHtml += `
                <li>
                    <span class="action-number">${index + 1}</span>
                    <div class="action-content">
                        <div class="action-task">${item.task}</div>
                        <div class="action-assignee">负责人：${item.assignee}</div>
                    </div>
                </li>
            `;
        });
    } else {
        actionItemsHtml = '<li><div class="action-content"><div class="action-task">暂无行动项</div></div></li>';
    }

    // 生成排期HTML
    let scheduleHtml = '';
    if (document.schedule && document.schedule.length > 0) {
        document.schedule.forEach(item => {
            scheduleHtml += `
                <tr>
                    <td>${item.task}</td>
                    <td>${item.assignee}</td>
                    <td>${item.start_date} ~ ${item.end_date}</td>
                    <td><span class="schedule-status">${item.status}</span></td>
                </tr>
            `;
        });
    } else {
        scheduleHtml = '<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">暂无排期安排</td></tr>';
    }

    modal.innerHTML = `
        <div class="summary-modal-content">
            <div class="summary-modal-header">
                <h2>📋 ${document.title}</h2>
                <button class="summary-modal-close" onclick="closeSummaryModal()">×</button>
            </div>
            <div class="summary-modal-body">
                <!-- 会议基本信息 -->
                <div class="summary-meta">
                    <div class="summary-meta-item">
                        <div class="label">会议时长</div>
                        <div class="value">${document.meeting_info.duration}</div>
                    </div>
                    <div class="summary-meta-item">
                        <div class="label">参与人数</div>
                        <div class="value">${document.meeting_info.participants.length} 人</div>
                    </div>
                    <div class="summary-meta-item">
                        <div class="label">发言次数</div>
                        <div class="value">${document.meeting_info.message_count} 条</div>
                    </div>
                </div>

                <!-- 会议概述 -->
                <div class="summary-section">
                    <h3>📊 会议概述</h3>
                    <div class="summary-text">
                        ${document.summary}
                    </div>
                </div>

                <!-- 关键讨论点 -->
                <div class="summary-section">
                    <h3>💬 关键讨论点</h3>
                    <ul class="summary-points-list">
                        ${keyPointsHtml}
                    </ul>
                </div>

                <!-- 会议结论 -->
                <div class="summary-section">
                    <h3>✅ 会议结论</h3>
                    <ul class="summary-conclusions">
                        ${conclusionsHtml}
                    </ul>
                </div>

                <!-- 行动项 -->
                <div class="summary-section">
                    <h3>🎯 行动项</h3>
                    <ul class="action-items-list">
                        ${actionItemsHtml}
                    </ul>
                </div>

                <!-- 开发排期 -->
                <div class="summary-section">
                    <h3>📅 开发排期</h3>
                    <table class="schedule-table">
                        <thead>
                            <tr>
                                <th>任务</th>
                                <th>负责人</th>
                                <th>时间</th>
                                <th>状态</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${scheduleHtml}
                        </tbody>
                    </table>
                </div>

                <!-- 确认按钮 -->
                <button class="summary-confirm-btn" onclick="closeSummaryModal()">
                    我已阅读，关闭总结
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // 阻止点击内容区域关闭
    modal.querySelector('.summary-modal-content').addEventListener('click', (e) => {
        e.stopPropagation();
    });
}

/**
 * 关闭会议总结弹框
 */
function closeSummaryModal() {
    const modal = document.querySelector('.summary-modal');
    if (modal) {
        modal.remove();
    }
}

/**
 * 处理状态更新
 */
function handleStatusUpdate(data) {
    if (data.progress) {
        dashboardManager.updateFromServerData({ progress: data.progress });
    }
}

/**
 * 处理错误
 */
function handleError(data) {
    console.error('错误:', data);
    chatManager.addSystemMessage(`❌ 错误: ${data.message}`);
}

/**
 * 开始会议
 */
async function startMeeting() {
    const scenarioSelect = document.getElementById('scenarioSelect');
    const scenarioId = scenarioSelect.value;

    console.log('开始场景:', scenarioId);
    appState.currentScenario = scenarioId;

    // 通过 WebSocket 运行场景
    api.runScenario(scenarioId);
}

/**
 * 结束会议
 */
function endMeeting() {
    api.endMeeting();
}

/**
 * 发送用户消息
 */
function sendUserMessage() {
    const inputField = document.getElementById('userInput');
    const content = inputField.value.trim();

    if (!content) return;
    if (!appState.meetingActive) {
        alert('请先开始会议');
        return;
    }

    // 添加用户消息到聊天区域
    chatManager.addMessage({
        speaker: 'user',
        speaker_name: '用户',
        content: content,
    });

    // 发送到服务器
    api.sendMessage(content);

    // 清空输入框
    inputField.value = '';
}

/**
 * 更新连接状态
 */
function updateConnectionStatus(connected) {
    const statusEl = document.getElementById('connectionStatus');
    const dot = statusEl.querySelector('.status-dot');
    const text = statusEl.querySelector('.status-text');

    if (connected) {
        dot.classList.remove('disconnected');
        dot.classList.add('connected');
        text.textContent = '已连接';
    } else {
        dot.classList.remove('connected');
        dot.classList.add('disconnected');
        text.textContent = '未连接';
    }
}

/**
 * 加载初始数据
 */
async function loadInitialData() {
    try {
        // 获取项目信息
        const projectInfo = await api.getProjectInfo();
        console.log('项目信息:', projectInfo);

        if (projectInfo.phases) {
            const currentPhase = projectInfo.phases.find(p => p.id === projectInfo.current_phase);
            if (currentPhase) {
                dashboardManager.updatePhase(currentPhase.name, currentPhase.description);
            }
        }
    } catch (error) {
        console.warn('加载初始数据失败:', error);
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initApp);

// 导出供全局使用
window.appState = appState;
window.chatManager = chatManager;
window.charactersManager = charactersManager;
window.dashboardManager = dashboardManager;
