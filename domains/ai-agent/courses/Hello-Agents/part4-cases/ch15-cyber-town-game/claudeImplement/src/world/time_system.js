/**
 * 时间系统 - TimeSystem
 *
 * 管理游戏世界的时间流逝：
 * 1. 游戏时间与现实时间的映射
 * 2. 时段划分（早晨、白天、傍晚、夜晚）
 * 3. 日程调度
 *
 * 知识点映射：
 * - 第15章：虚拟世界时间系统
 */

/**
 * 时段定义
 */
const TimeOfDay = {
    DAWN: 'dawn',       // 黎明 (5:00-7:00)
    MORNING: 'morning', // 早晨 (7:00-12:00)
    AFTERNOON: 'afternoon', // 下午 (12:00-18:00)
    EVENING: 'evening', // 傍晚 (18:00-21:00)
    NIGHT: 'night',     // 夜晚 (21:00-5:00)
};

/**
 * 时段属性
 */
const TIME_PERIODS = {
    [TimeOfDay.DAWN]: {
        name: '黎明',
        icon: '🌅',
        startHour: 5,
        endHour: 7,
        activityMultiplier: 0.5,
        socialActivity: 0.3,
        workActivity: 0.2
    },
    [TimeOfDay.MORNING]: {
        name: '早晨',
        icon: '🌤️',
        startHour: 7,
        endHour: 12,
        activityMultiplier: 1.0,
        socialActivity: 0.6,
        workActivity: 0.9
    },
    [TimeOfDay.AFTERNOON]: {
        name: '下午',
        icon: '☀️',
        startHour: 12,
        endHour: 18,
        activityMultiplier: 1.0,
        socialActivity: 0.7,
        workActivity: 0.8
    },
    [TimeOfDay.EVENING]: {
        name: '傍晚',
        icon: '🌇',
        startHour: 18,
        endHour: 21,
        activityMultiplier: 0.8,
        socialActivity: 0.9,
        workActivity: 0.3
    },
    [TimeOfDay.NIGHT]: {
        name: '夜晚',
        icon: '🌙',
        startHour: 21,
        endHour: 5,
        activityMultiplier: 0.3,
        socialActivity: 0.4,
        workActivity: 0.1
    }
};

/**
 * 时间系统类
 */
class TimeSystem {
    constructor(config = {}) {
        // 游戏时间（分钟）
        this.gameTime = config.startTime || 8 * 60; // 默认早上8:00

        // 游戏天数
        this.day = config.startDay || 1;

        // 时间加速倍率（1 = 实时，60 = 1秒现实=1分钟游戏）
        this.timeScale = config.timeScale || 60;

        // 是否暂停
        this.paused = false;

        // 上次更新时间
        this.lastUpdate = Date.now();

        // 时间事件监听器
        this.listeners = new Map();

        // 日程表
        this.schedules = new Map();

        // 时间变化阈值（触发事件的最小时间变化）
        this.tickInterval = config.tickInterval || 1000; // 1秒

        // 每日小时数
        this.hoursPerDay = 24;

        // 每小时分钟数
        this.minutesPerHour = 60;
    }

    /**
     * 更新时间
     * @param {number} deltaTime - 现实时间差（毫秒）
     */
    update(deltaTime) {
        if (this.paused) return null;

        // 计算游戏时间流逝
        const gameMinutesPassed = (deltaTime / 1000) * (this.timeScale / 60);
        const previousHour = this.getCurrentHour();
        const previousDay = this.day;
        const previousTimeOfDay = this.getTimeOfDay();

        this.gameTime += gameMinutesPassed;

        // 检查日期变化
        if (this.gameTime >= this.hoursPerDay * this.minutesPerHour) {
            this.gameTime -= this.hoursPerDay * this.minutesPerHour;
            this.day++;
            this.emitEvent('dayChange', { day: this.day });
        }

        // 检查小时变化
        const currentHour = this.getCurrentHour();
        if (currentHour !== previousHour) {
            this.emitEvent('hourChange', {
                hour: currentHour,
                day: this.day
            });
        }

        // 检查时段变化
        const currentTimeOfDay = this.getTimeOfDay();
        if (currentTimeOfDay !== previousTimeOfDay) {
            this.emitEvent('timeOfDayChange', {
                timeOfDay: currentTimeOfDay,
                period: TIME_PERIODS[currentTimeOfDay]
            });
        }

        return {
            gameTime: this.gameTime,
            day: this.day,
            hour: currentHour,
            minute: this.getCurrentMinute(),
            timeOfDay: currentTimeOfDay
        };
    }

    /**
     * 获取当前小时
     */
    getCurrentHour() {
        return Math.floor(this.gameTime / this.minutesPerHour);
    }

    /**
     * 获取当前分钟
     */
    getCurrentMinute() {
        return Math.floor(this.gameTime % this.minutesPerHour);
    }

    /**
     * 获取当前时段
     */
    getTimeOfDay() {
        const hour = this.getCurrentHour();

        for (const [period, config] of Object.entries(TIME_PERIODS)) {
            if (config.startHour < config.endHour) {
                // 不跨越午夜的时段
                if (hour >= config.startHour && hour < config.endHour) {
                    return period;
                }
            } else {
                // 跨越午夜的时段（夜晚）
                if (hour >= config.startHour || hour < config.endHour) {
                    return period;
                }
            }
        }

        return TimeOfDay.MORNING;
    }

    /**
     * 获取时段信息
     */
    getTimePeriodInfo() {
        return TIME_PERIODS[this.getTimeOfDay()];
    }

    /**
     * 获取格式化的时间字符串
     */
    getFormattedTime() {
        const hour = this.getCurrentHour().toString().padStart(2, '0');
        const minute = this.getCurrentMinute().toString().padStart(2, '0');
        return `${hour}:${minute}`;
    }

    /**
     * 获取完整时间信息
     */
    getFullTimeInfo() {
        return {
            day: this.day,
            hour: this.getCurrentHour(),
            minute: this.getCurrentMinute(),
            formatted: this.getFormattedTime(),
            timeOfDay: this.getTimeOfDay(),
            periodInfo: this.getTimePeriodInfo(),
            totalMinutes: this.gameTime
        };
    }

    /**
     * 设置时间
     */
    setTime(hour, minute = 0) {
        this.gameTime = hour * this.minutesPerHour + minute;
    }

    /**
     * 设置天数
     */
    setDay(day) {
        this.day = day;
    }

    /**
     * 设置时间倍率
     */
    setTimeScale(scale) {
        this.timeScale = Math.max(1, Math.min(3600, scale));
    }

    /**
     * 暂停/继续
     */
    togglePause() {
        this.paused = !this.paused;
        this.emitEvent('pauseToggle', { paused: this.paused });
        return this.paused;
    }

    /**
     * 注册时间事件监听
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
    }

    /**
     * 移除监听
     */
    off(event, callback) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).delete(callback);
        }
    }

    /**
     * 触发事件
     */
    emitEvent(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in time event listener: ${error}`);
                }
            });
        }
    }

    /**
     * 添加日程
     */
    addSchedule(characterId, schedule) {
        if (!this.schedules.has(characterId)) {
            this.schedules.set(characterId, []);
        }
        this.schedules.get(characterId).push({
            ...schedule,
            id: 'sched_' + Date.now()
        });
    }

    /**
     * 获取当前时间应执行的日程
     */
    getCurrentSchedules(characterId = null) {
        const currentHour = this.getCurrentHour();
        const currentMinute = this.getCurrentMinute();
        const currentTime = currentHour * 60 + currentMinute;

        const result = [];

        const checkSchedules = (schedules, charId) => {
            schedules.forEach(s => {
                const scheduleTime = s.hour * 60 + s.minute;
                // 5分钟窗口内触发
                if (Math.abs(scheduleTime - currentTime) <= 5) {
                    result.push({ characterId: charId, schedule: s });
                }
            });
        };

        if (characterId) {
            const schedules = this.schedules.get(characterId) || [];
            checkSchedules(schedules, characterId);
        } else {
            this.schedules.forEach((schedules, charId) => {
                checkSchedules(schedules, charId);
            });
        }

        return result;
    }

    /**
     * 导出状态
     */
    export() {
        return {
            gameTime: this.gameTime,
            day: this.day,
            timeScale: this.timeScale,
            paused: this.paused
        };
    }

    /**
     * 导入状态
     */
    import(data) {
        if (data.gameTime !== undefined) this.gameTime = data.gameTime;
        if (data.day !== undefined) this.day = data.day;
        if (data.timeScale !== undefined) this.timeScale = data.timeScale;
        if (data.paused !== undefined) this.paused = data.paused;
    }
}

/**
 * 时间相关工具函数
 */

/**
 * 判断是否是工作时间
 */
function isWorkTime(timeSystem) {
    const hour = timeSystem.getCurrentHour();
    const timeOfDay = timeSystem.getTimeOfDay();
    return timeOfDay === TimeOfDay.MORNING || (timeOfDay === TimeOfDay.AFTERNOON && hour < 17);
}

/**
 * 判断是否是休息时间
 */
function isRestTime(timeSystem) {
    const timeOfDay = timeSystem.getTimeOfDay();
    return timeOfDay === TimeOfDay.NIGHT;
}

/**
 * 判断是否是用餐时间
 */
function isMealTime(timeSystem) {
    const hour = timeSystem.getCurrentHour();
    // 早餐7-9，午餐11-13，晚餐18-20
    return (hour >= 7 && hour <= 9) ||
           (hour >= 11 && hour <= 13) ||
           (hour >= 18 && hour <= 20);
}

export {
    TimeSystem,
    TimeOfDay,
    TIME_PERIODS,
    isWorkTime,
    isRestTime,
    isMealTime
};
