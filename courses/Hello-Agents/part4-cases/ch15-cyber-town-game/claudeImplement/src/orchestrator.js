/**
 * 游戏编排器 - GameOrchestrator
 *
 * 协调所有游戏系统，管理游戏循环：
 * 1. 初始化游戏系统
 * 2. 游戏主循环
 * 3. 状态管理
 * 4. 事件广播
 *
 * 知识点映射：
 * - 第7章：多Agent协作
 * - 第15章：虚拟世界编排
 */

import { MessageBus, MemorySystem } from './framework/agent_framework.js';
import { CharacterAgent, PERSONALITY_TEMPLATES } from './core/character.js';
import { GameMemory } from './core/memory.js';
import { GoalSystem } from './core/goal.js';
import { BehaviorSystem } from './core/behavior.js';
import { TimeSystem, TimeOfDay, isWorkTime, isMealTime } from './world/time_system.js';
import { LocationSystem, LocationType } from './world/location.js';
import { EventSystem, EventType } from './world/event_system.js';
import { RelationshipSystem } from './social/relationship.js';
import { ConversationSystem } from './social/conversation.js';
import { SocialNetwork } from './social/social_network.js';

/**
 * 游戏配置
 */
const DEFAULT_CONFIG = {
    timeScale: 60,          // 1秒现实 = 1分钟游戏
    tickInterval: 1000,     // 每秒更新一次
    autoStart: true,
    maxCharacters: 8,
    miniMaxApiKey: null     // MiniMax API密钥
};

/**
 * 游戏编排器
 * 知识点：多Agent协作的核心协调器
 */
class GameOrchestrator {
    constructor(config = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };

        // 核心系统
        this.messageBus = new MessageBus();
        this.timeSystem = new TimeSystem({
            timeScale: this.config.timeScale
        });
        this.locationSystem = new LocationSystem();
        this.eventSystem = new EventSystem();
        this.relationshipSystem = new RelationshipSystem();
        this.conversationSystem = new ConversationSystem({
            minimaxConfig: {
                apiKey: this.config.miniMaxApiKey,
                model: 'MiniMax-Text-01'
            }
        });
        this.socialNetwork = new SocialNetwork({
            relationshipSystem: this.relationshipSystem
        });
        this.behaviorSystem = new BehaviorSystem();

        // 角色管理
        this.characters = new Map();

        // 游戏状态
        this.isRunning = false;
        this.isPaused = false;
        this.lastTick = Date.now();
        this.tickCount = 0;

        // 事件回调
        this.onTickCallbacks = [];
        this.onEventCallbacks = [];

        // 绑定系统事件
        this.bindSystemEvents();
    }

    /**
     * 绑定系统事件
     */
    bindSystemEvents() {
        // 时间变化事件
        this.timeSystem.on('hourChange', (data) => {
            this.handleHourChange(data);
        });

        this.timeSystem.on('timeOfDayChange', (data) => {
            this.handleTimeOfDayChange(data);
        });

        // 游戏事件
        this.eventSystem.on('*', (event) => {
            this.broadcastEvent(event);
        });
    }

    /**
     * 初始化游戏
     */
    async initialize(characterConfigs = []) {
        console.log('🎮 Initializing Cyber Town...');

        // 创建角色
        characterConfigs.forEach(config => {
            this.createCharacter(config);
        });

        // 如果没有配置，使用默认角色
        if (this.characters.size === 0) {
            this.createDefaultCharacters();
        }

        // 初始化社交网络
        this.characters.forEach(char => {
            this.socialNetwork.addNode(char);
        });

        // 建立初始关系
        this.initializeRelationships();

        console.log(`✅ Game initialized with ${this.characters.size} characters`);

        return {
            success: true,
            characterCount: this.characters.size,
            locations: this.locationSystem.getAllLocations().length
        };
    }

    /**
     * 创建默认角色
     */
    createDefaultCharacters() {
        const defaultCharacters = [
            {
                id: 'alice',
                name: '艾丽丝',
                age: 25,
                occupation: '程序员',
                personality: PERSONALITY_TEMPLATES.social,
                location: 'home'
            },
            {
                id: 'bob',
                name: '鲍勃',
                age: 30,
                occupation: '厨师',
                personality: PERSONALITY_TEMPLATES.helper,
                location: 'restaurant'
            },
            {
                id: 'charlie',
                name: '查理',
                age: 28,
                occupation: '设计师',
                personality: PERSONALITY_TEMPLATES.creative,
                location: 'office'
            },
            {
                id: 'diana',
                name: '戴安娜',
                age: 35,
                occupation: '教师',
                personality: PERSONALITY_TEMPLATES.introvert,
                location: 'park'
            },
            {
                id: 'eve',
                name: '伊芙',
                age: 22,
                occupation: '学生',
                personality: { ...PERSONALITY_TEMPLATES.social, neuroticism: 0.6 },
                location: 'cafe'
            }
        ];

        defaultCharacters.forEach(config => {
            this.createCharacter(config);
        });
    }

    /**
     * 创建角色
     */
    createCharacter(config) {
        const character = new CharacterAgent({
            ...config,
            messageBus: this.messageBus,
            memory: new GameMemory()
        });

        // 添加到管理器
        this.characters.set(character.id, character);

        // 设置初始位置
        if (config.location) {
            this.locationSystem.moveCharacter(character.id, config.location);
        }

        // 添加日程
        this.setupCharacterSchedule(character);

        return character;
    }

    /**
     * 设置角色日程
     */
    setupCharacterSchedule(character) {
        // 工作日日程
        this.timeSystem.addSchedule(character.id, {
            hour: 8,
            minute: 0,
            action: 'start_work',
            location: 'office'
        });

        // 午餐时间
        this.timeSystem.addSchedule(character.id, {
            hour: 12,
            minute: 0,
            action: 'lunch',
            location: 'restaurant'
        });

        // 下班
        this.timeSystem.addSchedule(character.id, {
            hour: 18,
            minute: 0,
            action: 'end_work',
            location: 'home'
        });
    }

    /**
     * 初始化关系
     */
    initializeRelationships() {
        const charArray = Array.from(this.characters.values());

        // 为每对角色建立初始关系
        for (let i = 0; i < charArray.length; i++) {
            for (let j = i + 1; j < charArray.length; j++) {
                const char1 = charArray[i];
                const char2 = charArray[j];

                // 随机初始关系值
                const initialValue = (Math.random() - 0.3) * 0.5;

                this.relationshipSystem.updateRelationship(
                    char1.name,
                    char2.name,
                    initialValue
                );

                char1.setRelationship(char2.name, initialValue);
                char2.setRelationship(char1.name, initialValue);
            }
        }
    }

    /**
     * 启动游戏循环
     */
    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.isPaused = false;
        this.lastTick = Date.now();

        console.log('🚀 Game started');
        this.gameLoop();
    }

    /**
     * 暂停游戏
     */
    pause() {
        this.isPaused = true;
        this.timeSystem.paused = true;
    }

    /**
     * 继续游戏
     */
    resume() {
        this.isPaused = false;
        this.timeSystem.paused = false;
        this.lastTick = Date.now();
    }

    /**
     * 停止游戏
     */
    stop() {
        this.isRunning = false;
        console.log('🛑 Game stopped');
    }

    /**
     * 游戏主循环
     * 知识点：多Agent协作的核心调度
     */
    gameLoop() {
        if (!this.isRunning) return;

        const now = Date.now();
        const deltaTime = now - this.lastTick;
        this.lastTick = now;

        if (!this.isPaused) {
            // 更新时间系统
            const timeInfo = this.timeSystem.update(deltaTime);

            // 更新所有角色
            this.updateCharacters(deltaTime);

            // 处理角色决策和行动
            this.processCharacterActions();

            // 检查社交互动
            this.checkSocialInteractions();

            // 检查随机事件
            this.checkRandomEvents();

            this.tickCount++;

            // 触发tick回调
            this.onTickCallbacks.forEach(cb => {
                try {
                    cb({
                        tick: this.tickCount,
                        time: timeInfo,
                        characters: this.getCharactersState()
                    });
                } catch (error) {
                    console.error('Tick callback error:', error);
                }
            });
        }

        // 继续循环
        setTimeout(() => this.gameLoop(), this.config.tickInterval);
    }

    /**
     * 更新所有角色状态
     */
    updateCharacters(deltaTime) {
        this.characters.forEach(character => {
            // 更新状态（饥饿、能量等）
            character.updateState(deltaTime / 1000);

            // 更新位置信息
            const location = this.locationSystem.getCharacterLocation(character.id);
            if (location) {
                character.location = location.id;
            }
        });
    }

    /**
     * 处理角色决策和行动
     * 知识点：ReAct范式在游戏中的应用
     */
    async processCharacterActions() {
        const worldState = this.getWorldState();

        for (const [id, character] of this.characters) {
            try {
                // 使用ReAct决策
                const decision = await this.behaviorSystem.decide(character, worldState);

                // 执行决策
                const result = await this.executeCharacterAction(character, decision);

                // 存储记忆
                if (result.success) {
                    character.characterMemory.addEventMemory(
                        `${decision.behavior}: ${decision.reason}`,
                        0.5,
                        { type: decision.behavior, location: character.location }
                    );
                }

            } catch (error) {
                console.error(`Error processing action for ${character.name}:`, error);
            }
        }
    }

    /**
     * 执行角色行动
     */
    async executeCharacterAction(character, decision) {
        switch (decision.behavior) {
            case 'move':
                return this.executeMove(character, decision.target);

            case 'eat':
                return this.executeEat(character);

            case 'rest':
                return this.executeRest(character);

            case 'socialize':
                return this.executeSocialize(character, decision.target);

            case 'work':
                return this.executeWork(character);

            default:
                return this.executeIdle(character);
        }
    }

    /**
     * 执行移动
     */
    executeMove(character, targetLocation) {
        const result = this.locationSystem.moveCharacter(character.id, targetLocation);

        if (result.success) {
            character.setLocation(targetLocation);

            // 触发移动事件
            this.eventSystem.emitMovementEvent(
                character,
                result.from,
                result.to
            );
        }

        return result;
    }

    /**
     * 执行进食
     */
    executeEat(character) {
        // 检查是否在合适的地点
        const validLocations = ['restaurant', 'home', 'cafe'];
        if (!validLocations.includes(character.location)) {
            // 需要先移动
            return this.executeMove(character, 'restaurant');
        }

        // 更新状态
        character.state.hunger = Math.max(0, character.state.hunger - 0.5);
        character.state.energy = Math.min(1, character.state.energy + 0.1);
        character.state.mood = Math.min(1, character.state.mood + 0.1);

        // 触发事件
        this.eventSystem.emitActionEvent(
            character,
            '吃了一顿美味的餐点',
            character.location,
            { hungerReduction: 0.5 }
        );

        return { success: true };
    }

    /**
     * 执行休息
     */
    executeRest(character) {
        if (character.location !== 'home' && character.location !== 'park') {
            return this.executeMove(character, 'home');
        }

        character.state.energy = Math.min(1, character.state.energy + 0.3);
        character.state.mood = Math.min(1, character.state.mood + 0.1);

        this.eventSystem.emitActionEvent(
            character,
            '休息了一会',
            character.location,
            { energyGain: 0.3 }
        );

        return { success: true };
    }

    /**
     * 执行社交
     */
    async executeSocialize(character, target) {
        // 如果target是地点，移动到那里
        const socialLocations = ['park', 'tavern', 'square', 'cafe'];
        if (socialLocations.includes(target)) {
            // 检查该地点是否有其他角色
            const charactersAtLocation = this.locationSystem.getCharactersAt(target)
                .filter(id => id !== character.id);

            if (charactersAtLocation.length > 0) {
                // 移动到该地点
                await this.executeMove(character, target);

                // 与那里的角色互动
                const targetCharId = charactersAtLocation[0];
                const targetChar = this.characters.get(targetCharId);

                if (targetChar) {
                    return this.startConversation(character, targetChar);
                }
            } else {
                // 没人，还是移动过去
                return this.executeMove(character, target);
            }
        }

        // 如果target是角色名
        const targetChar = Array.from(this.characters.values())
            .find(c => c.name === target);

        if (targetChar) {
            // 移动到目标角色所在位置
            if (targetChar.location !== character.location) {
                await this.executeMove(character, targetChar.location);
            }

            return this.startConversation(character, targetChar);
        }

        return { success: false, error: 'No one to socialize with' };
    }

    /**
     * 开始对话
     */
    async startConversation(char1, char2) {
        const conversation = this.conversationSystem.startConversation(
            char1,
            char2,
            char1.location
        );

        // 继续对话几轮
        const rounds = 2 + Math.floor(Math.random() * 3);
        let currentSpeaker = char2;

        for (let i = 0; i < rounds; i++) {
            const targetSpeaker = currentSpeaker === char1 ? char2 : char1;
            await this.conversationSystem.continueConversation(
                conversation,
                currentSpeaker,
                targetSpeaker
            );
            currentSpeaker = targetSpeaker;
        }

        // 结束对话
        this.conversationSystem.endConversation(char1.location);

        // 更新关系
        const sentiment = conversation.sentiment;
        this.relationshipSystem.recordInteraction(
            char1.name,
            char2.name,
            conversation.messages.map(m => m.content).join(' | '),
            sentiment
        );

        // 更新社交需求
        char1.state.social = Math.max(0, char1.state.social - 0.3);
        char2.state.social = Math.max(0, char2.state.social - 0.3);

        // 更新心情
        if (sentiment > 0) {
            char1.state.mood = Math.min(1, char1.state.mood + 0.1);
            char2.state.mood = Math.min(1, char2.state.mood + 0.1);
        }

        // 触发社交事件
        this.eventSystem.emitSocialEvent(
            [char1.name, char2.name],
            '聊天',
            char1.location
        );

        return { success: true, conversation };
    }

    /**
     * 执行工作
     */
    executeWork(character) {
        if (character.location !== 'office') {
            return this.executeMove(character, 'office');
        }

        character.state.energy = Math.max(0, character.state.energy - 0.15);
        character.state.mood = Math.max(-1, character.state.mood - 0.05);

        // 检查是否有工作目标
        const workGoal = character.goals.find(g =>
            g.type === 'work' && g.status === 'active'
        );

        if (workGoal) {
            workGoal.updateProgress(0.1);
        }

        this.eventSystem.emitActionEvent(
            character,
            '认真工作',
            character.location,
            {}
        );

        return { success: true };
    }

    /**
     * 执行空闲
     */
    executeIdle(character) {
        character.startActivity('idle');
        return { success: true };
    }

    /**
     * 检查社交互动
     */
    checkSocialInteractions() {
        // 检查同地点的角色是否可能互动
        this.locationSystem.getAllLocations().forEach(location => {
            const charactersHere = location.getCharacters();
            if (charactersHere.length >= 2) {
                // 随机决定是否发生互动
                if (Math.random() < 0.1) {
                    const char1 = this.characters.get(charactersHere[0]);
                    const char2 = this.characters.get(charactersHere[1]);

                    if (char1 && char2 &&
                        char1.state.social > 0.5 &&
                        char2.state.social > 0.5) {
                        this.startConversation(char1, char2);
                    }
                }
            }
        });
    }

    /**
     * 检查随机事件
     */
    checkRandomEvents() {
        const event = this.eventSystem.checkRandomEvent(this.getWorldState());
        if (event) {
            console.log(`🎲 Random event: ${event.name}`);
        }
    }

    /**
     * 处理小时变化
     */
    handleHourChange(data) {
        console.log(`⏰ Hour changed: ${data.hour}:00 (Day ${data.day})`);
    }

    /**
     * 处理时段变化
     */
    handleTimeOfDayChange(data) {
        console.log(`🌅 Time of day changed: ${data.period.name}`);
    }

    /**
     * 获取世界状态
     */
    getWorldState() {
        return {
            time: this.timeSystem.getFullTimeInfo(),
            locations: this.locationSystem.getAllLocations(),
            characters: Array.from(this.characters.values()).map(c => ({
                id: c.id,
                name: c.name,
                location: c.location,
                state: c.state
            })),
            events: this.eventSystem.getHistory({ limit: 10 })
        };
    }

    /**
     * 获取所有角色状态
     */
    getCharactersState() {
        const states = {};
        this.characters.forEach((char, id) => {
            states[id] = char.getFullState();
        });
        return states;
    }

    /**
     * 获取事件历史
     */
    getEventHistory(options = {}) {
        return this.eventSystem.getHistory(options);
    }

    /**
     * 获取社交网络数据
     */
    getSocialNetworkData() {
        return this.socialNetwork.getVisualizationData();
    }

    /**
     * 获取地图数据
     */
    getMapData() {
        return this.locationSystem.getMapData();
    }

    /**
     * 注册tick回调
     */
    onTick(callback) {
        this.onTickCallbacks.push(callback);
    }

    /**
     * 注册事件回调
     */
    onGameEvent(callback) {
        this.onEventCallbacks.push(callback);
    }

    /**
     * 广播事件
     */
    broadcastEvent(event) {
        this.onEventCallbacks.forEach(cb => {
            try {
                cb(event);
            } catch (error) {
                console.error('Event callback error:', error);
            }
        });
    }

    /**
     * 设置时间倍率
     */
    setTimeScale(scale) {
        this.timeSystem.setTimeScale(scale);
    }

    /**
     * 保存游戏
     */
    saveGame() {
        return {
            version: '1.0',
            timestamp: Date.now(),
            time: this.timeSystem.export(),
            characters: Array.from(this.characters.entries()).map(([id, char]) => ({
                id,
                data: char.export()
            })),
            relationships: this.relationshipSystem.export(),
            events: this.eventSystem.export()
        };
    }

    /**
     * 加载游戏
     */
    loadGame(saveData) {
        if (!saveData) return false;

        try {
            if (saveData.time) {
                this.timeSystem.import(saveData.time);
            }

            if (saveData.characters) {
                saveData.characters.forEach(({ id, data }) => {
                    const char = this.characters.get(id);
                    if (char) {
                        char.import(data);
                    }
                });
            }

            if (saveData.relationships) {
                this.relationshipSystem.import(saveData.relationships);
            }

            return true;
        } catch (error) {
            console.error('Failed to load game:', error);
            return false;
        }
    }
}

// 导出
export {
    GameOrchestrator,
    DEFAULT_CONFIG
};

// 也导出所有子系统，方便外部使用
export {
    CharacterAgent,
    PERSONALITY_TEMPLATES
} from './core/character.js';

export {
    GameMemory
} from './core/memory.js';

export {
    GoalSystem
} from './core/goal.js';

export {
    BehaviorSystem
} from './core/behavior.js';

export {
    TimeSystem,
    TimeOfDay
} from './world/time_system.js';

export {
    LocationSystem,
    LocationType
} from './world/location.js';

export {
    EventSystem,
    EventType
} from './world/event_system.js';

export {
    RelationshipSystem
} from './social/relationship.js';

export {
    ConversationSystem
} from './social/conversation.js';

export {
    SocialNetwork
} from './social/social_network.js';
