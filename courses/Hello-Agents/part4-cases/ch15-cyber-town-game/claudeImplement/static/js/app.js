/**
 * 赛博小镇 - 前端应用
 *
 * 连接游戏编排器与UI
 * 处理用户交互和渲染
 */

// ===== 游戏状态 =====
let game = null;
let selectedCharacter = null;
let isPaused = false;

// ===== DOM 元素引用 =====
const elements = {
    loadingOverlay: document.getElementById('loading-overlay'),
    gameTime: document.getElementById('game-time'),
    eventLog: document.getElementById('event-log'),
    charactersList: document.getElementById('characters-list'),
    characterInfo: document.getElementById('character-info'),
    mapCanvas: document.getElementById('map-canvas'),
    graphCanvas: document.getElementById('graph-canvas'),
    btnPause: document.getElementById('btn-pause'),
    timeSpeed: document.getElementById('time-speed'),
    btnSettings: document.getElementById('btn-settings'),
    settingsModal: document.getElementById('settings-modal'),
    characterModal: document.getElementById('character-modal'),
    btnClearLog: document.getElementById('btn-clear-log')
};

// ===== 地图渲染器 =====
class MapRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.locations = [];
        this.connections = [];
        this.characters = [];
        this.scale = 1;

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = 400;
        this.render();
    }

    setData(data) {
        this.locations = data.nodes || [];
        this.connections = data.edges || [];
        this.render();
    }

    updateCharacters(characters) {
        this.characters = characters;
        this.render();
    }

    render() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;

        // 清空画布
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, width, height);

        // 绘制网格
        this.drawGrid(ctx, width, height);

        // 绘制连接线
        this.connections.forEach(conn => {
            const from = this.locations.find(l => l.id === conn.from);
            const to = this.locations.find(l => l.id === conn.to);
            if (from && to) {
                this.drawConnection(ctx, from, to);
            }
        });

        // 绘制地点
        this.locations.forEach(loc => {
            this.drawLocation(ctx, loc);
        });

        // 绘制角色
        this.characters.forEach(char => {
            this.drawCharacter(ctx, char);
        });
    }

    drawGrid(ctx, width, height) {
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.1)';
        ctx.lineWidth = 1;

        const gridSize = 50;
        for (let x = 0; x < width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        for (let y = 0; y < height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
    }

    drawConnection(ctx, from, to) {
        const fromPos = this.getScaledPosition(from.position);
        const toPos = this.getScaledPosition(to.position);

        ctx.beginPath();
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.moveTo(fromPos.x, fromPos.y);
        ctx.lineTo(toPos.x, toPos.y);
        ctx.stroke();
    }

    drawLocation(ctx, location) {
        const pos = this.getScaledPosition(location.position);

        // 地点背景
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 25, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(15, 52, 96, 0.8)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 地点图标
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(location.icon || '📍', pos.x, pos.y);

        // 地点名称
        ctx.font = '12px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(location.name, pos.x, pos.y + 35);

        // 角色数量指示
        if (location.characterCount > 0) {
            ctx.beginPath();
            ctx.arc(pos.x + 20, pos.y - 20, 10, 0, Math.PI * 2);
            ctx.fillStyle = '#ff6b6b';
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.font = '10px Arial';
            ctx.fillText(location.characterCount, pos.x + 20, pos.y - 20);
        }
    }

    drawCharacter(ctx, character) {
        const location = this.locations.find(l => l.id === character.location);
        if (!location) return;

        const pos = this.getScaledPosition(location.position);

        // 偏移避免重叠
        const offset = this.getCharacterOffset(character.id);
        const charX = pos.x + offset.x;
        const charY = pos.y + offset.y - 10;

        // 角色圆点
        ctx.beginPath();
        ctx.arc(charX, charY, 8, 0, Math.PI * 2);

        // 根据心情选择颜色
        const mood = character.state?.mood || 0;
        if (mood > 0.3) {
            ctx.fillStyle = '#4ade80';
        } else if (mood < -0.3) {
            ctx.fillStyle = '#ef4444';
        } else {
            ctx.fillStyle = '#fbbf24';
        }
        ctx.fill();

        // 选中效果
        if (selectedCharacter && selectedCharacter.id === character.id) {
            ctx.strokeStyle = '#00d4ff';
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        // 角色名
        ctx.font = '10px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(character.name, charX, charY - 15);
    }

    getScaledPosition(pos) {
        const scaleX = this.canvas.width / 600;
        const scaleY = this.canvas.height / 400;
        return {
            x: pos.x * scaleX,
            y: pos.y * scaleY
        };
    }

    getCharacterOffset(charId) {
        const index = this.characters.findIndex(c => c.id === charId);
        const angle = (index / this.characters.length) * Math.PI * 2;
        return {
            x: Math.cos(angle) * 15,
            y: Math.sin(angle) * 15
        };
    }

    getLocationAtPosition(x, y) {
        for (const loc of this.locations) {
            const pos = this.getScaledPosition(loc.position);
            const distance = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2));
            if (distance < 30) {
                return loc;
            }
        }
        return null;
    }
}

// ===== 关系图谱渲染器 =====
class GraphRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.nodes = [];
        this.links = [];

        this.resize();
    }

    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = 200;
    }

    setData(data) {
        this.nodes = data.nodes || [];
        this.links = data.links || [];
        this.calculatePositions();
        this.render();
    }

    calculatePositions() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 30;

        this.nodes.forEach((node, i) => {
            const angle = (i / this.nodes.length) * Math.PI * 2 - Math.PI / 2;
            node.x = centerX + Math.cos(angle) * radius;
            node.y = centerY + Math.sin(angle) * radius;
        });
    }

    render() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;

        // 清空画布
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, width, height);

        // 绘制连接线
        this.links.forEach(link => {
            const source = this.nodes.find(n => n.id === link.source);
            const target = this.nodes.find(n => n.id === link.target);
            if (source && target) {
                ctx.beginPath();
                ctx.moveTo(source.x, source.y);
                ctx.lineTo(target.x, target.y);

                // 根据关系值设置颜色
                if (link.value > 0) {
                    ctx.strokeStyle = `rgba(74, 222, 128, ${Math.abs(link.value)})`;
                } else {
                    ctx.strokeStyle = `rgba(239, 68, 68, ${Math.abs(link.value)})`;
                }
                ctx.lineWidth = Math.abs(link.value) * 3 + 1;
                ctx.stroke();
            }
        });

        // 绘制节点
        this.nodes.forEach(node => {
            ctx.beginPath();
            ctx.arc(node.x, node.y, 15, 0, Math.PI * 2);
            ctx.fillStyle = '#0f3460';
            ctx.fill();
            ctx.strokeStyle = '#00d4ff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // 节点名称
            ctx.font = '10px Arial';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(node.name, node.x, node.y);
        });
    }
}

// ===== 对话生成器（支持 MiniMax API） =====
class ConversationGenerator {
    constructor() {
        this.apiKey = null;
        this.isEnabled = false;
    }

    configure(apiKey) {
        this.apiKey = apiKey;
        this.isEnabled = !!apiKey;
        if (this.isEnabled) {
            console.log('✅ MiniMax API 已启用，将生成智能对话');
        }
    }

    /**
     * 生成对话内容
     */
    async generate(char1, char2, location, relationship) {
        if (!this.isEnabled) {
            return this.generateTemplate(char1, char2, location, relationship);
        }

        try {
            return await this.callMiniMaxAPI(char1, char2, location, relationship);
        } catch (error) {
            console.error('MiniMax API 调用失败，使用模板生成:', error);
            return this.generateTemplate(char1, char2, location, relationship);
        }
    }

    /**
     * 调用 MiniMax API 生成智能对话
     */
    async callMiniMaxAPI(char1, char2, location, relationship) {
        const personalityDesc = this.describePersonality(char1.personality);
        const moodDesc = this.describeMood(char1.state.mood);
        const relDesc = relationship > 0.3 ? '朋友' : (relationship < -0.2 ? '有些矛盾' : '普通认识');

        const prompt = `你是一个名为"${char1.name}"的角色。
性格特点：${personalityDesc}
当前职业：${char1.occupation}
当前心情：${moodDesc}
你正在${location}和${char2.name}（${relDesc}）聊天。

请生成一句简短的对话（1-2句话），要求：
1. 符合角色性格和当前心情
2. 自然、口语化
3. 不要带引号和角色名

直接输出对话内容：`;

        const response = await fetch('https://api.minimax.chat/v1/text/chatcompletion_v2', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: 'MiniMax-Text-01',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.9,
                max_tokens: 80
            })
        });

        const data = await response.json();

        if (data.choices && data.choices[0]) {
            return {
                speaker: char1.name,
                content: data.choices[0].message.content.trim(),
                isAI: true
            };
        }

        throw new Error('Invalid response from MiniMax API');
    }

    /**
     * 模板生成（备用方案）
     */
    generateTemplate(char1, char2, location, relationship) {
        const templates = {
            friendly: [
                { speaker: char1.name, content: `嘿 ${char2.name}！真巧啊，你也在这儿！` },
                { speaker: char1.name, content: `${char2.name}，最近怎么样？好久没见了！` },
                { speaker: char1.name, content: `太好了，碰到你了！我有件事想和你说。` }
            ],
            neutral: [
                { speaker: char1.name, content: `哦，${char2.name}，你好。` },
                { speaker: char1.name, content: `今天天气不错。` },
                { speaker: char1.name, content: `你也来这儿了啊。` }
            ],
            cold: [
                { speaker: char1.name, content: `...` },
                { speaker: char1.name, content: `嗯。` },
                { speaker: char1.name, content: `有事吗？` }
            ]
        };

        let category = 'neutral';
        if (relationship > 0.3) category = 'friendly';
        else if (relationship < -0.2) category = 'cold';

        const options = templates[category];
        const template = options[Math.floor(Math.random() * options.length)];

        return { ...template, isAI: false };
    }

    describePersonality(personality) {
        const traits = [];
        if (personality.extraversion > 0.7) traits.push('外向开朗');
        if (personality.extraversion < 0.3) traits.push('内向安静');
        if (personality.agreeableness > 0.7) traits.push('友善随和');
        if (personality.conscientiousness > 0.7) traits.push('认真负责');
        if (personality.openness > 0.7) traits.push('好奇有创意');
        return traits.join('、') || '普通';
    }

    describeMood(mood) {
        if (mood > 0.5) return '心情很好';
        if (mood < -0.3) return '心情不太好';
        return '心情一般';
    }
}

// ===== 游戏模拟器（纯前端版本） =====
class GameSimulator {
    constructor() {
        this.time = { day: 1, hour: 8, minute: 0 };
        this.timeScale = 60;
        this.isPaused = false;
        this.characters = new Map();
        this.locations = [];
        this.events = [];
        this.relationships = new Map();

        this.lastUpdate = Date.now();
        this.onTickCallbacks = [];
        this.onEventCallbacks = [];

        // 对话生成器
        this.conversationGenerator = new ConversationGenerator();
    }

    async initialize() {
        // 加载数据
        await this.loadData();

        // 初始化角色
        this.initCharacters();

        // 初始化关系
        this.initRelationships();

        return true;
    }

    async loadData() {
        try {
            const [charRes, locRes] = await Promise.all([
                fetch('../data/characters.json'),
                fetch('../data/locations.json')
            ]);

            const charData = await charRes.json();
            const locData = await locRes.json();

            this.locations = locData;

            charData.forEach(char => {
                this.characters.set(char.id, {
                    ...char,
                    state: { ...char.state },
                    goals: [],
                    currentActivity: null
                });
            });

        } catch (error) {
            console.error('Failed to load data:', error);
            // 使用默认数据
            this.initDefaultData();
        }
    }

    initDefaultData() {
        this.locations = [
            { id: 'home', name: '家', icon: '🏠', position: { x: 100, y: 150 } },
            { id: 'office', name: '办公室', icon: '🏢', position: { x: 300, y: 100 } },
            { id: 'park', name: '公园', icon: '🌳', position: { x: 500, y: 200 } },
            { id: 'restaurant', name: '餐厅', icon: '🍽️', position: { x: 200, y: 250 } },
            { id: 'tavern', name: '酒馆', icon: '🍺', position: { x: 400, y: 300 } },
            { id: 'square', name: '广场', icon: '🏛️', position: { x: 350, y: 200 } },
            { id: 'cafe', name: '咖啡馆', icon: '☕', position: { x: 150, y: 300 } },
            { id: 'shop', name: '商店', icon: '🛒', position: { x: 250, y: 180 } }
        ];

        const defaultChars = [
            { id: 'alice', name: '艾丽丝', age: 25, occupation: '程序员', location: 'home',
              personality: { extraversion: 0.85 }, state: { mood: 0.6, energy: 0.8, hunger: 0.2, social: 0.5 } },
            { id: 'bob', name: '鲍勃', age: 32, occupation: '厨师', location: 'restaurant',
              personality: { extraversion: 0.7 }, state: { mood: 0.7, energy: 0.7, hunger: 0.1, social: 0.4 } },
            { id: 'charlie', name: '查理', age: 28, occupation: '设计师', location: 'office',
              personality: { extraversion: 0.55 }, state: { mood: 0.5, energy: 0.6, hunger: 0.4, social: 0.6 } },
            { id: 'diana', name: '戴安娜', age: 35, occupation: '教师', location: 'park',
              personality: { extraversion: 0.35 }, state: { mood: 0.5, energy: 0.5, hunger: 0.3, social: 0.7 } },
            { id: 'eve', name: '伊芙', age: 22, occupation: '学生', location: 'cafe',
              personality: { extraversion: 0.75 }, state: { mood: 0.4, energy: 0.7, hunger: 0.5, social: 0.8 } }
        ];

        defaultChars.forEach(char => {
            this.characters.set(char.id, {
                ...char,
                state: { ...char.state },
                goals: [],
                currentActivity: null
            });
        });
    }

    initCharacters() {
        console.log(`Initialized ${this.characters.size} characters`);
    }

    initRelationships() {
        const charArray = Array.from(this.characters.values());
        for (let i = 0; i < charArray.length; i++) {
            for (let j = i + 1; j < charArray.length; j++) {
                const key = `${charArray[i].id}-${charArray[j].id}`;
                const value = (Math.random() - 0.3) * 0.6;
                this.relationships.set(key, value);
            }
        }
    }

    start() {
        this.lastUpdate = Date.now();
        this.gameLoop();
    }

    pause() {
        this.isPaused = true;
    }

    resume() {
        this.isPaused = false;
        this.lastUpdate = Date.now();
    }

    setTimeScale(scale) {
        this.timeScale = scale;
    }

    gameLoop() {
        const now = Date.now();
        const deltaTime = now - this.lastUpdate;
        this.lastUpdate = now;

        if (!this.isPaused) {
            this.update(deltaTime);
        }

        setTimeout(() => this.gameLoop(), 1000);
    }

    update(deltaTime) {
        // 更新时间
        const minutesPassed = (deltaTime / 1000) * (this.timeScale / 60);
        this.time.minute += minutesPassed;

        if (this.time.minute >= 60) {
            this.time.minute = 0;
            this.time.hour++;
            if (this.time.hour >= 24) {
                this.time.hour = 0;
                this.time.day++;
            }
        }

        // 更新角色状态
        this.characters.forEach(char => {
            this.updateCharacter(char, deltaTime);
        });

        // 处理角色行为
        this.processActions();

        // 检查社交互动
        this.checkInteractions();

        // 触发回调
        this.onTickCallbacks.forEach(cb => cb(this.getState()));
    }

    updateCharacter(char, deltaTime) {
        const dt = deltaTime / 1000;

        // 状态自然变化
        char.state.energy = Math.max(0, char.state.energy - 0.01 * dt);
        char.state.hunger = Math.min(1, char.state.hunger + 0.02 * dt);
        char.state.social = Math.max(0, char.state.social - 0.005 * dt);

        // 根据需求调整心情
        if (char.state.hunger > 0.7) char.state.mood -= 0.05 * dt;
        if (char.state.energy < 0.3) char.state.mood -= 0.03 * dt;
        char.state.mood = Math.max(-1, Math.min(1, char.state.mood));
    }

    processActions() {
        this.characters.forEach(char => {
            const needs = this.getNeeds(char);

            if (needs.length > 0) {
                const topNeed = needs[0];

                switch (topNeed.type) {
                    case 'hunger':
                        if (char.location !== 'restaurant' && char.location !== 'home') {
                            this.moveCharacter(char, 'restaurant');
                            this.addEvent('movement', `${char.name}前往餐厅`);
                        } else if (char.location === 'restaurant') {
                            char.state.hunger = Math.max(0, char.state.hunger - 0.3);
                            char.state.mood = Math.min(1, char.state.mood + 0.1);
                            this.addEvent('action', `${char.name}吃了一顿美味的餐点`);
                        }
                        break;

                    case 'energy':
                        if (char.location !== 'home') {
                            this.moveCharacter(char, 'home');
                            this.addEvent('movement', `${char.name}回家休息`);
                        } else {
                            char.state.energy = Math.min(1, char.state.energy + 0.2);
                            char.state.mood = Math.min(1, char.state.mood + 0.05);
                            this.addEvent('action', `${char.name}休息了一会`);
                        }
                        break;

                    case 'social':
                        const socialPlaces = ['park', 'tavern', 'square'];
                        if (!socialPlaces.includes(char.location)) {
                            const place = socialPlaces[Math.floor(Math.random() * socialPlaces.length)];
                            this.moveCharacter(char, place);
                            this.addEvent('movement', `${char.name}前往${this.getLocationName(place)}`);
                        }
                        break;
                }
            } else {
                // 没有紧急需求，随机行动
                if (Math.random() < 0.02) {
                    const randomLoc = this.locations[Math.floor(Math.random() * this.locations.length)];
                    this.moveCharacter(char, randomLoc.id);
                    this.addEvent('movement', `${char.name}前往${randomLoc.name}`);
                }
            }
        });
    }

    async checkInteractions() {
        // 按地点分组角色
        const locationGroups = new Map();
        this.characters.forEach(char => {
            if (!locationGroups.has(char.location)) {
                locationGroups.set(char.location, []);
            }
            locationGroups.get(char.location).push(char);
        });

        // 检查同地点角色的互动
        for (const [location, chars] of locationGroups) {
            if (chars.length >= 2 && Math.random() < 0.08) {
                const char1 = chars[0];
                const char2 = chars[1];

                // 获取关系值
                const key = [char1.id, char2.id].sort().join('-');
                const currentRel = this.relationships.get(key) || 0;

                // 生成对话内容
                const locationName = this.getLocationName(location);
                const dialog = await this.conversationGenerator.generate(char1, char2, locationName, currentRel);

                // 更新关系
                this.relationships.set(key, currentRel + 0.05);

                // 更新社交需求
                char1.state.social = Math.max(0, char1.state.social - 0.2);
                char2.state.social = Math.max(0, char2.state.social - 0.2);

                // 添加带对话内容的事件
                const aiTag = dialog.isAI ? '🤖' : '';
                this.addEvent('conversation', `${char1.name} → ${char2.name}：${dialog.content} ${aiTag}`);
            }
        }
    }

    getNeeds(char) {
        const needs = [];

        if (char.state.hunger > 0.6) {
            needs.push({ type: 'hunger', urgency: char.state.hunger });
        }
        if (char.state.energy < 0.4) {
            needs.push({ type: 'energy', urgency: 1 - char.state.energy });
        }
        if (char.state.social > 0.6) {
            needs.push({ type: 'social', urgency: char.state.social });
        }

        needs.sort((a, b) => b.urgency - a.urgency);
        return needs;
    }

    moveCharacter(char, locationId) {
        char.location = locationId;
    }

    getLocationName(locationId) {
        const loc = this.locations.find(l => l.id === locationId);
        return loc ? loc.name : locationId;
    }

    addEvent(type, description) {
        const event = {
            type,
            description,
            time: `${String(this.time.hour).padStart(2, '0')}:${String(Math.floor(this.time.minute)).padStart(2, '0')}`,
            timestamp: Date.now()
        };

        this.events.push(event);
        if (this.events.length > 100) {
            this.events.shift();
        }

        this.onEventCallbacks.forEach(cb => cb(event));
    }

    getState() {
        return {
            time: {
                day: this.time.day,
                hour: this.time.hour,
                minute: Math.floor(this.time.minute),
                formatted: `${String(this.time.hour).padStart(2, '0')}:${String(Math.floor(this.time.minute)).padStart(2, '0')}`
            },
            characters: Array.from(this.characters.values()),
            events: this.events.slice(-20),
            relationships: this.getRelationshipData()
        };
    }

    getMapData() {
        const nodes = this.locations.map(loc => {
            const charsHere = Array.from(this.characters.values()).filter(c => c.location === loc.id);
            return {
                ...loc,
                characterCount: charsHere.length
            };
        });

        const edges = [
            { from: 'home', to: 'shop' },
            { from: 'shop', to: 'park' },
            { from: 'shop', to: 'office' },
            { from: 'office', to: 'tavern' },
            { from: 'tavern', to: 'square' },
            { from: 'park', to: 'square' },
            { from: 'home', to: 'cafe' },
            { from: 'cafe', to: 'restaurant' },
            { from: 'restaurant', to: 'square' }
        ];

        return { nodes, edges };
    }

    getRelationshipData() {
        const nodes = Array.from(this.characters.values()).map(c => ({
            id: c.id,
            name: c.name
        }));

        const links = [];
        this.relationships.forEach((value, key) => {
            const [source, target] = key.split('-');
            if (Math.abs(value) > 0.1) {
                links.push({ source, target, value });
            }
        });

        return { nodes, links };
    }

    getCharacter(id) {
        return this.characters.get(id);
    }

    onTick(callback) {
        this.onTickCallbacks.push(callback);
    }

    onEvent(callback) {
        this.onEventCallbacks.push(callback);
    }
}

// ===== UI 更新函数 =====
function updateTimeDisplay(time) {
    const periodNames = {
        dawn: '黎明',
        morning: '早晨',
        afternoon: '下午',
        evening: '傍晚',
        night: '夜晚'
    };

    let period = 'morning';
    if (time.hour >= 5 && time.hour < 7) period = 'dawn';
    else if (time.hour >= 7 && time.hour < 12) period = 'morning';
    else if (time.hour >= 12 && time.hour < 18) period = 'afternoon';
    else if (time.hour >= 18 && time.hour < 21) period = 'evening';
    else period = 'night';

    elements.gameTime.innerHTML = `
        <span class="day">第 ${time.day} 天</span>
        <span class="time">${time.formatted}</span>
        <span class="period">${periodNames[period]}</span>
    `;
}

function updateCharactersList(characters) {
    elements.charactersList.innerHTML = characters.map(char => {
        const moodEmoji = char.state.mood > 0.3 ? '😊' : (char.state.mood < -0.3 ? '😢' : '😐');
        const isSelected = selectedCharacter && selectedCharacter.id === char.id;

        return `
            <div class="character-item ${isSelected ? 'selected' : ''}" data-char-id="${char.id}">
                <div class="character-item-icon">👤</div>
                <div class="character-item-info">
                    <div class="character-item-name">${char.name}</div>
                    <div class="character-item-location">${game.getLocationName(char.location)}</div>
                </div>
                <div class="character-item-mood">${moodEmoji}</div>
            </div>
        `;
    }).join('');

    // 绑定点击事件
    document.querySelectorAll('.character-item').forEach(item => {
        item.addEventListener('click', () => {
            const charId = item.dataset.charId;
            selectCharacter(charId);
        });
    });
}

function updateCharacterInfo(char) {
    if (!char) {
        elements.characterInfo.innerHTML = '<p class="placeholder">点击地图上的角色查看详情</p>';
        return;
    }

    const moodText = char.state.mood > 0.3 ? '良好' : (char.state.mood < -0.3 ? '不佳' : '一般');
    const energyPercent = Math.round(char.state.energy * 100);
    const hungerPercent = Math.round(char.state.hunger * 100);
    const socialPercent = Math.round(char.state.social * 100);

    elements.characterInfo.innerHTML = `
        <div class="character-avatar">👤</div>
        <div class="character-name">${char.name}</div>
        <div class="character-occupation">${char.occupation} · ${char.age}岁</div>

        <div class="character-stats">
            <div class="stat-item">
                <span class="stat-label">心情</span>
                <span class="stat-value">${moodText}</span>
                <div class="stat-bar">
                    <div class="stat-bar-fill ${char.state.mood > 0 ? 'positive' : 'negative'}"
                         style="width: ${(char.state.mood + 1) * 50}%"></div>
                </div>
            </div>
            <div class="stat-item">
                <span class="stat-label">能量</span>
                <span class="stat-value">${energyPercent}%</span>
                <div class="stat-bar">
                    <div class="stat-bar-fill ${energyPercent > 30 ? 'positive' : 'negative'}"
                         style="width: ${energyPercent}%"></div>
                </div>
            </div>
            <div class="stat-item">
                <span class="stat-label">饥饿</span>
                <span class="stat-value">${hungerPercent}%</span>
                <div class="stat-bar">
                    <div class="stat-bar-fill ${hungerPercent < 70 ? 'positive' : 'neutral'}"
                         style="width: ${hungerPercent}%"></div>
                </div>
            </div>
            <div class="stat-item">
                <span class="stat-label">社交需求</span>
                <span class="stat-value">${socialPercent}%</span>
                <div class="stat-bar">
                    <div class="stat-bar-fill ${socialPercent < 70 ? 'positive' : 'neutral'}"
                         style="width: ${socialPercent}%"></div>
                </div>
            </div>
        </div>

        <div style="margin-top: 15px; font-size: 0.9rem;">
            <span style="color: var(--text-secondary);">当前位置：</span>
            <span style="color: var(--primary-color);">${game.getLocationName(char.location)}</span>
        </div>
    `;
}

function addEventToLog(event) {
    // 移除占位符
    const placeholder = elements.eventLog.querySelector('.placeholder');
    if (placeholder) {
        placeholder.remove();
    }

    const eventItem = document.createElement('div');
    eventItem.className = `event-item ${event.type}`;
    eventItem.innerHTML = `
        <span class="event-time">[${event.time}]</span>
        ${event.description}
    `;

    elements.eventLog.insertBefore(eventItem, elements.eventLog.firstChild);

    // 限制日志数量
    while (elements.eventLog.children.length > 50) {
        elements.eventLog.removeChild(elements.eventLog.lastChild);
    }
}

function selectCharacter(charId) {
    const char = game.getCharacter(charId);
    if (char) {
        selectedCharacter = char;
        updateCharacterInfo(char);
        updateCharactersList(Array.from(game.characters.values()));
    }
}

// ===== 事件绑定 =====
function bindEvents() {
    // 暂停/继续按钮
    elements.btnPause.addEventListener('click', () => {
        isPaused = !isPaused;
        if (isPaused) {
            game.pause();
            elements.btnPause.textContent = '▶️ 继续';
        } else {
            game.resume();
            elements.btnPause.textContent = '⏸️ 暂停';
        }
    });

    // 时间速度
    elements.timeSpeed.addEventListener('change', (e) => {
        const scale = parseInt(e.target.value);
        game.setTimeScale(scale);
    });

    // 设置按钮
    elements.btnSettings.addEventListener('click', () => {
        elements.settingsModal.classList.remove('hidden');
    });

    // 清空日志
    elements.btnClearLog.addEventListener('click', () => {
        elements.eventLog.innerHTML = '<p class="placeholder">游戏事件将显示在这里...</p>';
        game.events = [];
    });

    // 关闭弹窗
    document.querySelectorAll('.btn-close, .btn-cancel').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.classList.add('hidden');
            });
        });
    });

    // 保存设置
    document.getElementById('btn-save-settings').addEventListener('click', () => {
        const apiKey = document.getElementById('minimax-api-key').value;
        if (apiKey) {
            localStorage.setItem('minimax_api_key', apiKey);
            // 立即配置对话生成器
            game.conversationGenerator.configure(apiKey);
            console.log('✅ MiniMax API Key 已保存并启用');
        }
        elements.settingsModal.classList.add('hidden');
    });

    // 地图点击
    mapRenderer.canvas.addEventListener('click', (e) => {
        const rect = mapRenderer.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const loc = mapRenderer.getLocationAtPosition(x, y);
        if (loc) {
            console.log('Clicked location:', loc.name);
        }
    });

    // 知识点卡片点击
    document.querySelectorAll('.knowledge-card').forEach(card => {
        card.addEventListener('click', () => {
            const topic = card.dataset.topic;
            showKnowledgeDetail(topic);
        });
    });
}

function showKnowledgeDetail(topic) {
    const details = {
        react: {
            title: 'ReAct范式',
            content: 'ReAct（Reasoning + Acting）是一种结合推理和行动的Agent范式。\n\n' +
                     '核心流程：\n1. Thought（思考）：分析当前状态\n' +
                     '2. Action（行动）：选择并执行动作\n' +
                     '3. Observation（观察）：观察结果\n' +
                     '4. 循环迭代直到目标达成\n\n' +
                     '在赛博小镇中，每个NPC都使用ReAct范式进行决策。'
        },
        memory: {
            title: '记忆系统',
            content: 'Agent的记忆系统模拟人类的记忆机制：\n\n' +
                     '1. 短期记忆：存储最近发生的事件\n' +
                     '2. 长期记忆：存储重要经历和知识\n' +
                     '3. 记忆衰减：importance(t) = importance₀ × e^(-decay_rate × t)\n\n' +
                     'NPC会根据记忆来调整自己的行为决策。'
        },
        ocean: {
            title: 'OCEAN性格模型',
            content: '五因素人格模型（Big Five）：\n\n' +
                     'O - Openness（开放性）\n' +
                     'C - Conscientiousness（尽责性）\n' +
                     'E - Extraversion（外向性）\n' +
                     'A - Agreeableness（宜人性）\n' +
                     'N - Neuroticism（神经质）\n\n' +
                     '这些性格特质影响NPC的行为偏好和决策。'
        },
        social: {
            title: '社交网络',
            content: 'NPC之间形成复杂的社交网络：\n\n' +
                     '1. 关系值：-1（敌对）到 1（亲密）\n' +
                     '2. 关系类型：朋友、熟人、陌生人、敌人等\n' +
                     '3. 社交影响力：基于连接数量和质量计算\n\n' +
                     '观察关系图谱可以看到小镇的社交结构。'
        }
    };

    const detail = details[topic];
    if (detail) {
        alert(`${detail.title}\n\n${detail.content}`);
    }
}

// ===== 初始化 =====
let mapRenderer;
let graphRenderer;

async function init() {
    console.log('🎮 Initializing Cyber Town...');

    // 初始化渲染器
    mapRenderer = new MapRenderer(elements.mapCanvas);
    graphRenderer = new GraphRenderer(elements.graphCanvas);

    // 创建游戏实例
    game = new GameSimulator();

    // 绑定事件
    game.onTick((state) => {
        updateTimeDisplay(state.time);
        updateCharactersList(state.characters);
        mapRenderer.setData(game.getMapData());
        mapRenderer.updateCharacters(state.characters);
        graphRenderer.setData(state.relationships);

        if (selectedCharacter) {
            const updatedChar = game.getCharacter(selectedCharacter.id);
            if (updatedChar) {
                selectedCharacter = updatedChar;
                updateCharacterInfo(updatedChar);
            }
        }
    });

    game.onEvent((event) => {
        addEventToLog(event);
    });

    // 初始化游戏
    await game.initialize();

    // 读取并配置 MiniMax API Key
    const savedApiKey = localStorage.getItem('minimax_api_key');
    if (savedApiKey) {
        game.conversationGenerator.configure(savedApiKey);
        // 填充输入框
        document.getElementById('minimax-api-key').value = '••••••••••••••••';
        document.getElementById('minimax-api-key').placeholder = '已保存（重新输入可更新）';
        console.log('✅ 已加载保存的 MiniMax API Key');
    }

    // 绑定UI事件
    bindEvents();

    // 启动游戏
    game.start();

    // 隐藏加载界面
    setTimeout(() => {
        elements.loadingOverlay.classList.add('hidden');
    }, 500);

    console.log('✅ Game initialized successfully');
}

// 启动
init().catch(error => {
    console.error('Failed to initialize game:', error);
    elements.loadingOverlay.innerHTML = `
        <div class="loading-content">
            <p style="color: #ef4444;">游戏初始化失败</p>
            <p style="color: #b0b0b0;">${error.message}</p>
        </div>
    `;
});
