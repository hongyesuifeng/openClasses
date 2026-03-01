/**
 * Game Dev Town - 聊天组件
 */

class ChatManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.messages = [];
    }

    /**
     * 添加消息到聊天区域
     */
    addMessage(data) {
        const {
            speaker,
            speaker_name,
            content,
            type = 'speech',
            timestamp,
        } = data;

        const message = {
            speaker,
            speaker_name,
            content,
            type,
            timestamp: timestamp || new Date().toISOString(),
        };

        this.messages.push(message);
        this.renderMessage(message);
        this.scrollToBottom();
    }

    /**
     * 渲染单条消息
     */
    renderMessage(message) {
        const { speaker, speaker_name, content, type } = message;

        // 获取角色信息
        const roleInfo = this.getRoleInfo(speaker);

        const messageEl = document.createElement('div');
        messageEl.className = `message ${speaker === 'user' ? 'user' : ''} ${type === 'system' ? 'system' : ''}`;

        // 时间格式化
        const time = new Date(message.timestamp);
        const timeStr = time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

        messageEl.innerHTML = `
            <div class="message-avatar" style="background: ${roleInfo.color}20">
                ${roleInfo.avatar}
            </div>
            <div class="message-content">
                <div class="message-header">
                    <span class="message-name" style="color: ${roleInfo.color}">${speaker_name || roleInfo.name}</span>
                    <span class="message-role" style="background: ${roleInfo.color}30; color: ${roleInfo.color}">${roleInfo.role}</span>
                    <span class="message-time">${timeStr}</span>
                </div>
                <div class="message-text">${this.formatContent(content)}</div>
            </div>
        `;

        this.container.appendChild(messageEl);
    }

    /**
     * 添加系统消息
     */
    addSystemMessage(content) {
        this.addMessage({
            speaker: 'system',
            speaker_name: '系统',
            content,
            type: 'system',
        });
    }

    /**
     * 添加打字指示器
     */
    addTypingIndicator(speaker, speakerName) {
        const roleInfo = this.getRoleInfo(speaker);

        const indicatorEl = document.createElement('div');
        indicatorEl.className = 'message typing-message';
        indicatorEl.id = `typing-${speaker}`;

        indicatorEl.innerHTML = `
            <div class="message-avatar" style="background: ${roleInfo.color}20">
                ${roleInfo.avatar}
            </div>
            <div class="message-content">
                <div class="message-header">
                    <span class="message-name" style="color: ${roleInfo.color}">${speakerName || roleInfo.name}</span>
                </div>
                <div class="message-text">
                    <div class="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
        `;

        this.container.appendChild(indicatorEl);
        this.scrollToBottom();
    }

    /**
     * 移除打字指示器
     */
    removeTypingIndicator(speaker) {
        const indicator = document.getElementById(`typing-${speaker}`);
        if (indicator) {
            indicator.remove();
        }
    }

    /**
     * 清空所有消息
     */
    clear() {
        this.messages = [];
        this.container.innerHTML = '';
    }

    /**
     * 显示欢迎消息
     */
    showWelcome() {
        this.container.innerHTML = `
            <div class="welcome-message">
                <h2>👋 欢迎来到游戏小镇！</h2>
                <p>这里是 AI Agent 协作开发游戏的演示平台。</p>
                <p>选择一个场景，点击"开始会议"，观看团队成员讨论吧！</p>
            </div>
        `;
    }

    /**
     * 滚动到底部 - 带平滑动画
     */
    scrollToBottom() {
        if (!this.container) {
            this.container = document.getElementById('messagesContainer');
        }
        if (this.container) {
            // 强制滚动到底部
            this.container.scrollTop = this.container.scrollHeight;
            // 额外调用确保滚动
            setTimeout(() => {
                if (this.container) {
                    this.container.scrollTop = this.container.scrollHeight;
                }
            }, 50);
        }
    }

    /**
     * 获取角色信息
     */
    getRoleInfo(roleId) {
        const roles = {
            producer: { name: '张制作', role: '制作人', color: '#FF6B6B', avatar: '🎯' },
            developer: { name: '李程序', role: '程序员', color: '#4ECDC4', avatar: '💻' },
            designer: { name: '王策划', role: '策划', color: '#FFE66D', avatar: '📋' },
            artist: { name: '陈美术', role: '美术', color: '#C44D58', avatar: '🎨' },
            user: { name: '用户', role: '参与者', color: '#667eea', avatar: '👤' },
            system: { name: '系统', role: '', color: '#666666', avatar: '⚙️' },
        };

        return roles[roleId] || roles.system;
    }

    /**
     * 格式化消息内容
     */
    formatContent(content) {
        // 转义 HTML
        let formatted = content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        // 处理换行
        formatted = formatted.replace(/\n/g, '<br>');

        return formatted;
    }
}
