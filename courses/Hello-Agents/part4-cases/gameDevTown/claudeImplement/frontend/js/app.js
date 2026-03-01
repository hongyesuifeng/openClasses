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
