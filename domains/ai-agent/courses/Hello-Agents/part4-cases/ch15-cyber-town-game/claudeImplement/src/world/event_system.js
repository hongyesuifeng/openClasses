/**
 * 事件系统 - EventSystem
 *
 * 管理游戏世界中发生的事件：
 * 1. 事件的创建、触发、记录
 * 2. 事件广播
 * 3. 事件历史
 *
 * 知识点映射：
 * - 第15章：虚拟世界事件管理
 */

/**
 * 事件类型
 */
const EventType = {
    MOVEMENT: 'movement',       // 移动事件
    SOCIAL: 'social',           // 社交事件
    ACTION: 'action',           // 行为事件
    WORLD: 'world',             // 世界事件
    SYSTEM: 'system',           // 系统事件
    RANDOM: 'random'            // 随机事件
};

/**
 * 事件优先级
 */
const EventPriority = {
    LOW: 0,
    NORMAL: 1,
    HIGH: 2,
    CRITICAL: 3
};

/**
 * 游戏事件类
 */
class GameEvent {
    constructor(config) {
        this.id = config.id || 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        this.type = config.type || EventType.ACTION;
        this.name = config.name || '未知事件';
        this.description = config.description || '';

        // 涉及的角色
        this.characters = config.characters || [];

        // 事件地点
        this.location = config.location || null;

        // 事件时间
        this.timestamp = Date.now();
        this.gameTime = config.gameTime || null;

        // 事件数据
        this.data = config.data || {};

        // 优先级
        this.priority = config.priority || EventPriority.NORMAL;

        // 是否已处理
        this.processed = false;
    }

    /**
     * 标记为已处理
     */
    markProcessed() {
        this.processed = true;
    }

    /**
     * 格式化为显示文本
     */
    toDisplayText() {
        const time = this.gameTime ?
            `游戏时间 ${this.gameTime}` :
            new Date(this.timestamp).toLocaleTimeString();

        let text = `[${time}] `;

        if (this.characters.length > 0) {
            text += this.characters.join('、') + ' ';
        }

        text += this.description;

        return text;
    }
}

/**
 * 事件系统
 */
class EventSystem {
    constructor(config = {}) {
        // 事件监听器
        this.listeners = new Map();

        // 事件历史
        this.eventHistory = [];
        this.maxHistory = config.maxHistory || 500;

        // 待处理事件队列
        this.eventQueue = [];

        // 随机事件概率
        this.randomEventChance = config.randomEventChance || 0.05;

        // 预定义的随机事件
        this.randomEvents = this.initRandomEvents();
    }

    /**
     * 初始化随机事件
     */
    initRandomEvents() {
        return [
            {
                name: '天气变化',
                description: '天气突然变化了',
                type: EventType.WORLD,
                priority: EventPriority.LOW
            },
            {
                name: '偶遇',
                description: '在街上偶遇了熟人',
                type: EventType.RANDOM,
                priority: EventPriority.NORMAL
            },
            {
                name: '发现物品',
                description: '发现了一个有趣的物品',
                type: EventType.RANDOM,
                priority: EventPriority.LOW
            },
            {
                name: '小镇公告',
                description: '小镇发布了新公告',
                type: EventType.WORLD,
                priority: EventPriority.HIGH
            }
        ];
    }

    /**
     * 创建事件
     */
    createEvent(config) {
        return new GameEvent(config);
    }

    /**
     * 触发事件
     */
    emitEvent(event) {
        // 添加到历史
        this.eventHistory.push(event);
        if (this.eventHistory.length > this.maxHistory) {
            this.eventHistory.shift();
        }

        // 通知监听器
        const typeListeners = this.listeners.get(event.type) || new Set();
        const allListeners = this.listeners.get('*') || new Set();

        [...typeListeners, ...allListeners].forEach(listener => {
            try {
                listener(event);
            } catch (error) {
                console.error('Error in event listener:', error);
            }
        });

        return event;
    }

    /**
     * 快捷方法：创建并触发事件
     */
    fireEvent(type, name, description, options = {}) {
        const event = this.createEvent({
            type,
            name,
            description,
            ...options
        });
        return this.emitEvent(event);
    }

    /**
     * 监听事件
     */
    on(eventType, callback) {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, new Set());
        }
        this.listeners.get(eventType).add(callback);
    }

    /**
     * 移除监听
     */
    off(eventType, callback) {
        if (this.listeners.has(eventType)) {
            this.listeners.get(eventType).delete(callback);
        }
    }

    /**
     * 获取事件历史
     */
    getHistory(options = {}) {
        let history = [...this.eventHistory];

        // 按类型筛选
        if (options.type) {
            history = history.filter(e => e.type === options.type);
        }

        // 按角色筛选
        if (options.character) {
            history = history.filter(e => e.characters.includes(options.character));
        }

        // 按地点筛选
        if (options.location) {
            history = history.filter(e => e.location === options.location);
        }

        // 限制数量
        const limit = options.limit || 50;
        return history.slice(-limit);
    }

    /**
     * 获取角色相关事件
     */
    getCharacterEvents(characterName, limit = 20) {
        return this.getHistory({ character: characterName, limit });
    }

    /**
     * 检查并触发随机事件
     */
    checkRandomEvent(worldState) {
        if (Math.random() > this.randomEventChance) {
            return null;
        }

        const randomEvent = this.randomEvents[
            Math.floor(Math.random() * this.randomEvents.length)
        ];

        return this.fireEvent(
            randomEvent.type,
            randomEvent.name,
            randomEvent.description,
            {
                priority: randomEvent.priority,
                gameTime: worldState.time?.formatted
            }
        );
    }

    /**
     * 创建移动事件
     */
    emitMovementEvent(character, from, to) {
        return this.fireEvent(
            EventType.MOVEMENT,
            '移动',
            `${character.name}从${from}来到了${to}`,
            {
                characters: [character.name],
                location: to,
                data: { from, to }
            }
        );
    }

    /**
     * 创建社交事件
     */
    emitSocialEvent(characters, interaction, location) {
        return this.fireEvent(
            EventType.SOCIAL,
            '社交互动',
            `${characters.join('和')}在${location}进行了${interaction}`,
            {
                characters,
                location,
                data: { interaction }
            }
        );
    }

    /**
     * 创建行为事件
     */
    emitActionEvent(character, action, location, result) {
        return this.fireEvent(
            EventType.ACTION,
            '行为',
            `${character.name}在${location}${action}`,
            {
                characters: [character.name],
                location,
                data: { action, result }
            }
        );
    }

    /**
     * 获取事件统计
     */
    getStatistics() {
        const stats = {
            total: this.eventHistory.length,
            byType: {},
            byCharacter: {},
            recentActivity: []
        };

        this.eventHistory.forEach(event => {
            // 按类型统计
            stats.byType[event.type] = (stats.byType[event.type] || 0) + 1;

            // 按角色统计
            event.characters.forEach(char => {
                stats.byCharacter[char] = (stats.byCharacter[char] || 0) + 1;
            });
        });

        // 最近活动
        stats.recentActivity = this.eventHistory.slice(-10).map(e => e.toDisplayText());

        return stats;
    }

    /**
     * 清空历史
     */
    clearHistory() {
        this.eventHistory = [];
    }

    /**
     * 导出事件
     */
    export() {
        return {
            history: this.eventHistory.map(e => ({
                id: e.id,
                type: e.type,
                name: e.name,
                description: e.description,
                characters: e.characters,
                location: e.location,
                timestamp: e.timestamp,
                gameTime: e.gameTime,
                data: e.data
            }))
        };
    }
}

export {
    EventSystem,
    GameEvent,
    EventType,
    EventPriority
};
