/**
 * Game Dev Town - 项目看板组件
 */

class DashboardManager {
    constructor() {
        this.stats = {
            total: 0,
            completed: 0,
            inProgress: 0,
            blocked: 0,
            progress: 0,
        };
        this.activities = [];
    }

    /**
     * 初始化看板
     */
    init() {
        this.updateProgress(0);
        this.updateStats(this.stats);
        this.addActivity('系统初始化完成');
    }

    /**
     * 更新进度条
     */
    updateProgress(percent) {
        const progressBar = document.getElementById('overallProgress');
        const progressText = document.getElementById('progressText');

        if (progressBar) {
            progressBar.style.width = `${percent}%`;
        }
        if (progressText) {
            progressText.textContent = `${Math.round(percent)}%`;
        }

        this.stats.progress = percent;
    }

    /**
     * 更新统计数据
     */
    updateStats(stats) {
        const totalEl = document.getElementById('totalTasks');
        const completedEl = document.getElementById('completedTasks');
        const inProgressEl = document.getElementById('inProgressTasks');
        const blockedEl = document.getElementById('blockedTasks');

        if (totalEl) totalEl.textContent = stats.total || 0;
        if (completedEl) completedEl.textContent = stats.completed || 0;
        if (inProgressEl) inProgressEl.textContent = stats.in_progress || stats.inProgress || 0;
        if (blockedEl) blockedEl.textContent = stats.blocked || 0;

        this.stats = { ...this.stats, ...stats };
    }

    /**
     * 更新当前阶段
     */
    updatePhase(phaseName, phaseDesc) {
        const phaseEl = document.getElementById('currentPhase');

        if (phaseEl) {
            phaseEl.innerHTML = `
                <span class="phase-name">${phaseName}</span>
                <span class="phase-desc">${phaseDesc}</span>
            `;
        }
    }

    /**
     * 添加活动记录
     */
    addActivity(activity) {
        const activityList = document.getElementById('activityList');

        if (activityList) {
            const time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
            const li = document.createElement('li');
            li.textContent = `[${time}] ${activity}`;

            // 插入到顶部
            activityList.insertBefore(li, activityList.firstChild);

            // 限制显示数量
            while (activityList.children.length > 10) {
                activityList.removeChild(activityList.lastChild);
            }
        }

        this.activities.unshift({
            time: new Date(),
            content: activity,
        });
    }

    /**
     * 从服务器数据更新
     */
    updateFromServerData(data) {
        if (data.progress) {
            this.updateProgress(data.progress.completion_rate || 0);
            this.updateStats({
                total: data.progress.total || 0,
                completed: data.progress.completed || 0,
                in_progress: data.progress.in_progress || 0,
                blocked: data.progress.blocked || 0,
            });
        }
    }

    /**
     * 重置看板
     */
    reset() {
        this.stats = {
            total: 0,
            completed: 0,
            inProgress: 0,
            blocked: 0,
            progress: 0,
        };
        this.activities = [];
        this.updateProgress(0);
        this.updateStats(this.stats);
    }
}
