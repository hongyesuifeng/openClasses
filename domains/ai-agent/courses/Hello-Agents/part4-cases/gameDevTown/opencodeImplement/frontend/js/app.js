const roleIcons = {
    '制作人': '🎬',
    '程序员': '💻',
    '游戏策划': '📝',
    '美术设计师': '🎨'
};

const statusText = {
    'idle': '待机',
    'thinking': '思考中',
    'speaking': '发言中',
    'listening': '倾听中',
    'waiting': '等待'
};

let isMeetingActive = false;
let lastMessageCount = 0;

document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    startPolling();
});

function initEventListeners() {
    document.getElementById('start-meeting-btn').addEventListener('click', startMeeting);
}

async function startMeeting() {
    const meetingType = document.getElementById('meeting-type-select').value;
    const topic = getTopicForMeetingType(meetingType);
    
    const btn = document.getElementById('start-meeting-btn');
    btn.disabled = true;
    btn.textContent = '会议进行中...';
    
    try {
        const result = await api.startMeeting(meetingType, topic, 3);
        
        if (result.success) {
            isMeetingActive = true;
            updateMeetingInfo(result.meeting);
            
            if (result.responses && result.responses.length > 0) {
                await showResponsesOneByOne(result.responses);
            }
            
            if (result.meeting_status === 'completed') {
                isMeetingActive = false;
                addMessage({
                    speaker: 'System',
                    speaker_role: 'system',
                    content: '会议已结束',
                    emotion: 'neutral'
                });
                btn.disabled = false;
                btn.textContent = '▶ 开始会议';
            } else {
                setTimeout(() => {
                    continueMeeting(result.meeting);
                }, 2000);
            }
        } else {
            alert('会议启动失败: ' + (result.error || '未知错误'));
            btn.disabled = false;
            btn.textContent = '▶ 开始会议';
        }
    } catch (err) {
        alert('连接失败: ' + err.message);
        btn.disabled = false;
        btn.textContent = '▶ 开始会议';
    }
}

async function showResponsesOneByOne(responses, delay = 500) {
    for (const response of responses) {
        addMessage(response);
        await sleep(delay);
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function continueMeeting(meetingInfo) {
    if (!isMeetingActive) return;
    
    try {
        const result = await api.nextRound();
        
        if (result.success) {
            if (result.responses && result.responses.length > 0) {
                await showResponsesOneByOne(result.responses, 500);
            }
            
            if (result.meeting_status === 'completed') {
                isMeetingActive = false;
                addMessage({
                    speaker: 'System',
                    speaker_role: 'system',
                    content: '会议已结束',
                    emotion: 'neutral'
                });
                const btn = document.getElementById('start-meeting-btn');
                btn.disabled = false;
                btn.textContent = '▶ 开始会议';
            } else {
                updateMeetingInfo(result.meeting);
                setTimeout(() => continueMeeting(result.meeting), 1000);
            }
        }
    } catch (err) {
        console.error('获取对话失败:', err);
    }
}

async function nextRound() {
    const btn = document.getElementById('next-round-btn');
    btn.disabled = true;
    btn.textContent = '处理中...';
    
    try {
        const result = await api.nextRound();
        
        if (result.success) {
            if (result.responses && result.responses.length > 0) {
                for (const response of result.responses) {
                    addMessage(response);
                }
            }
            
            if (result.meeting_status === 'completed') {
                isMeetingActive = false;
                disableNextRound();
                addMessage({
                    speaker: 'System',
                    speaker_role: 'system',
                    content: '会议已结束',
                    emotion: 'neutral'
                });
            }
            
            updateMeetingInfo(result.meeting);
        }
    } catch (err) {
        console.error('获取对话失败:', err);
    } finally {
        btn.disabled = !isMeetingActive;
        btn.textContent = '下一轮';
    }
}

function getTopicForMeetingType(type) {
    const topics = {
        'daily_standup': '日常进度同步',
        'design_review': '战斗系统设计',
        'technical_review': '技术方案评审',
        'art_review': '美术风格确认',
        'milestone': '阶段里程碑回顾'
    };
    return topics[type] || '讨论议题';
}

function updateMeetingInfo(meeting) {
    if (!meeting) return;
    
    const meetingDiv = document.getElementById('current-meeting');
    const typeNames = {
        'daily_standup': '每日站会',
        'design_review': '设计评审',
        'technical_review': '技术评审',
        'art_review': '美术评审',
        'milestone': '里程碑会议'
    };
    
    meetingDiv.innerHTML = `
        <div class="meeting-type">${typeNames[meeting.meeting_type] || meeting.meeting_type}</div>
        <div class="meeting-topic">${meeting.topic || ''}</div>
        <div class="meeting-round">轮次: ${meeting.round || 0}</div>
    `;
}

function enableNextRound() {
    const btn = document.getElementById('next-round-btn');
    btn.disabled = false;
}

function disableNextRound() {
    const btn = document.getElementById('next-round-btn');
    btn.disabled = true;
}

function addMessage(msg) {
    const container = document.getElementById('chat-messages');
    
    // 深度清理：移除所有思考过程相关内容
    let content = msg.content;
    
    // 检测是否包含思考标记，如果是则只取第一句话
    const hasThinkTag = /(\(.*?think.*?\)|\[.*?think.*?\]|think[ing]|thought)/i.test(content) ||
                        content.includes('思考') || content.includes('推理') || content.includes('分析');
    
    if (hasThinkTag) {
        // 只取第一句完整的话
        const firstSentence = content.split(/[。！？\n]/)[0];
        if (firstSentence && firstSentence.length > 3) {
            content = firstSentence + '。';
        } else {
            return; // 内容太短就跳过
        }
    }
    
    content = content.trim();
    if (!content) return;
    
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${msg.speaker_role === 'system' ? 'system' : 'speaking'}`;
    
    const icon = roleIcons[msg.speaker_role] || '👤';
    const time = formatTime(msg.timestamp);
    
    msgDiv.innerHTML = `
        <div class="message-header">
            <span class="speaker-icon">${icon}</span>
            <span class="speaker-name">${msg.speaker}</span>
            <span class="speaker-role">${msg.speaker_role}</span>
            <span class="timestamp">${time}</span>
        </div>
        <div class="message-content">${escapeHtml(content)}</div>
    `;
    
    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
    
    updateCharacterStatus(msg.speaker_role, msg.emotion);
}

function updateCharacterStatus(role, emotion) {
    const statusEl = document.getElementById(`status-${getRoleKey(role)}`);
    if (statusEl) {
        const status = emotion === 'thinking' ? '思考中' : 
                      emotion === 'excited' ? '积极发言' : '发言中';
        statusEl.textContent = status;
        
        const charEl = statusEl.parentElement;
        charEl.classList.add('speaking');
        
        setTimeout(() => {
            charEl.classList.remove('speaking');
            statusEl.textContent = '待机';
        }, 3000);
    }
}

function getRoleKey(role) {
    const map = {
        '制作人': 'producer',
        '程序员': 'developer',
        '游戏策划': 'designer',
        '美术设计师': 'artist'
    };
    return map[role] || role;
}

function formatTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function startPolling() {
    setInterval(async () => {
        try {
            const messages = await api.getMessages(20);
            
            if (messages.length > lastMessageCount) {
                const newMessages = messages.slice(lastMessageCount);
                
                for (const msg of newMessages) {
                    if (msg.speaker_role !== 'system') {
                        addMessage(msg);
                    }
                }
                
                lastMessageCount = messages.length;
            }
            
            const tasks = await api.getTasks();
            updateTaskBoard(tasks);
            
        } catch (err) {
            console.log('Polling error:', err.message);
        }
    }, 3000);
}

function updateTaskBoard(tasks) {
    document.getElementById('task-pending').textContent = tasks.pending || 0;
    document.getElementById('task-in-progress').textContent = tasks.in_progress || 0;
    document.getElementById('task-completed').textContent = tasks.completed || 0;
}
