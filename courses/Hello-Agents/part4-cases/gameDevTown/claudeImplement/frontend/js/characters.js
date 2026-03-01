/**
 * Game Dev Town - 角色组件
 */

class CharactersManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.agents = {};
        this.currentSpeaker = null;
    }

    /**
     * 初始化角色列表
     */
    init(agentsData) {
        this.container.innerHTML = '';

        agentsData.forEach(agent => {
            this.agents[agent.role_id] = agent;
            this.renderCharacterCard(agent);
        });
    }

    /**
     * 渲染角色卡片
     */
    renderCharacterCard(agent) {
        const card = document.createElement('div');
        card.className = 'character-card';
        card.id = `character-${agent.role_id}`;
        card.style.borderLeftColor = agent.color;
        card.style.borderLeftWidth = '3px';
        card.style.borderLeftStyle = 'solid';

        card.innerHTML = `
            <div class="avatar">${agent.avatar}</div>
            <div class="name">${agent.name}</div>
            <div class="role">${agent.role}</div>
            <div class="status">
                <span class="status-dot ${agent.is_active !== false ? 'connected' : 'disconnected'}"></span>
                <span class="status-text">${agent.is_active !== false ? '在线' : '离线'}</span>
            </div>
        `;

        // 添加点击事件 - 显示 Agent 详情弹框
        card.addEventListener('click', () => {
            this.showAgentModal(agent);
        });

        // 添加鼠标悬停效果
        card.addEventListener('mouseenter', () => {
            this.showAgentDetails(agent);
        });

        this.container.appendChild(card);
    }

    /**
     * 更新角色状态
     */
    updateStatus(roleId, status) {
        const card = document.getElementById(`character-${roleId}`);
        if (!card) return;

        const agent = this.agents[roleId];
        if (!agent) return;

        // 更新数据
        Object.assign(agent, status);

        // 更新 UI
        const statusText = card.querySelector('.status-text');
        const statusDot = card.querySelector('.status-dot');

        if (status.is_speaking) {
            card.classList.add('speaking');
            if (statusText) statusText.textContent = '发言中...';
            if (statusDot) statusDot.classList.add('connected');
            this.currentSpeaker = roleId;
        } else {
            card.classList.remove('speaking');
            if (statusText) statusText.textContent = status.is_active !== false ? '在线' : '离线';
            if (statusDot) {
                statusDot.classList.toggle('connected', status.is_active !== false);
                statusDot.classList.toggle('disconnected', status.is_active === false);
            }
            if (this.currentSpeaker === roleId) {
                this.currentSpeaker = null;
            }
        }

        // 更新情绪显示
        if (status.mood) {
            this.updateMood(roleId, status.mood);
        }
    }

    /**
     * 更新情绪状态
     */
    updateMood(roleId, mood) {
        const card = document.getElementById(`character-${roleId}`);
        if (!card) return;

        // 移除旧的情绪类
        card.classList.remove('mood-happy', 'mood-concerned', 'mood-excited', 'mood-thinking');

        // 添加新的情绪类
        if (mood && mood !== 'neutral') {
            card.classList.add(`mood-${mood}`);
        }
    }

    /**
     * 设置角色正在发言
     */
    setSpeaking(roleId, isSpeaking) {
        this.updateStatus(roleId, { is_speaking: isSpeaking });

        // 更新底部状态栏
        const footerSpeaking = document.getElementById('agentSpeaking');
        if (footerSpeaking) {
            if (isSpeaking && this.agents[roleId]) {
                footerSpeaking.textContent = `${this.agents[roleId].name} 正在发言...`;
            } else {
                footerSpeaking.textContent = '-';
            }
        }
    }

    /**
     * 显示角色详情
     */
    showAgentDetails(agent) {
        // 可以扩展为显示更多信息
        console.log('Agent details:', agent);
    }

    /**
     * 显示 Agent 详情弹框
     */
    showAgentModal(agent) {
        // 移除已存在的弹框
        const existingModal = document.getElementById('agentModal');
        if (existingModal) {
                existingModal.remove();
            }

        // 创建弹框
        const modal = document.createElement('div');
        modal.id = 'agentModal';
        modal.className = 'agent-modal';
        modal.innerHTML = `
            <div class="agent-modal-content">
                <div class="agent-modal-header" style="border-bottom: 3px solid ${agent.color}">
                    <span class="agent-modal-avatar">${agent.avatar}</span>
                    <div class="agent-modal-title">
                        <h3>${agent.name}</h3>
                        <span class="agent-modal-role">${agent.role}</span>
                    </div>
                    <button class="agent-modal-close">&times;</button>
                </div>
                <div class="agent-modal-body">
                    <p class="agent-modal-desc">${agent.description || '暂无描述'}</p>
                    <div class="agent-modal-section">
                        <h4>专业技能</h4>
                        <ul class="agent-modal-list">
                            ${(agent.expertise || []).map(exp => `<li>${exp}</li>`).join('')}
                        </ul>
                    </div>
                    <div class="agent-modal-section">
                        <h4>性格特点</h4>
                        <p>${agent.personality || '暂无描述'}</p>
                    </div>
                </div>
            </div>
        `;

        // 添加到页面
        document.body.appendChild(modal);

        // 关闭按钮点击事件
        const closeBtn = modal.querySelector('.agent-modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeModal();
            });
        }

        // 点击弹框外部关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });

        // ESC 键关闭
        document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.closeModal();
                }
            }, { once: true });
    }

    /**
     * 关闭弹框
     */
    closeModal() {
        const modal = document.getElementById('agentModal');
        if (modal) {
                modal.remove();
            }
    }

    /**
     * 获取当前发言者
     */
    getCurrentSpeaker() {
        return this.currentSpeaker;
    }

    /**
     * 重置所有状态
     */
    reset() {
        Object.keys(this.agents).forEach(roleId => {
            this.updateStatus(roleId, {
                is_active: true,
                is_speaking: false,
                mood: 'neutral',
            });
        });
        this.currentSpeaker = null;
    }
}
