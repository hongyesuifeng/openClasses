/**
 * 赛博小镇 - 游戏主逻辑
 */

class CyberTownGame {
    constructor() {
        this.isRunning = false;
        this.selectedCharacterId = null;
        this.tickInterval = null;
        this.characters = {};
        this.locations = {};
        
        this.init();
    }
    
    async init() {
        this.bindEvents();
        await this.loadInitialData();
        this.startAutoRefresh();
    }
    
    bindEvents() {
        document.getElementById('startBtn').addEventListener('click', () => this.toggleGame());
        document.getElementById('tickBtn').addEventListener('click', () => this.tick());
        document.getElementById('configBtn').addEventListener('click', () => this.showConfigModal());
        
        const modal = document.getElementById('configModal');
        const closeBtn = modal.querySelector('.close');
        closeBtn.addEventListener('click', () => this.hideConfigModal());
        
        document.getElementById('configForm').addEventListener('submit', (e) => this.saveConfig(e));
        document.getElementById('testConnection').addEventListener('click', () => this.testConnection());
        
        const providerSelect = document.getElementById('provider');
        providerSelect.addEventListener('change', () => this.updateModelOptions());
    }
    
    updateModelOptions() {
        const provider = document.getElementById('provider').value;
        const modelSelect = document.getElementById('model');
        
        const models = {
            minimax: ['MiniMax-M2.5', 'MiniMax-M2.5-highspeed', 'MiniMax-M2.1'],
            openai: ['gpt-3.5-turbo', 'gpt-4'],
            zhipu: ['glm-3-turbo', 'glm-4']
        };
        
        modelSelect.innerHTML = '';
        (models[provider] || []).forEach(model => {
            const option = document.createElement('option');
            option.value = model;
            option.textContent = model;
            modelSelect.appendChild(option);
        });
    }
    
    async loadInitialData() {
        try {
            const [worldData, charactersData, locationsData, eventsData] = await Promise.all([
                API.getWorld(),
                API.getCharacters(),
                API.getLocations(),
                API.getEvents()
            ]);
            
            this.characters = charactersData.characters;
            this.locations = locationsData.locations;
            
            this.renderTime(worldData.world.time);
            this.renderLocations(this.locations);
            this.renderCharacters(this.characters);
            this.renderEvents(eventsData.events);
            
        } catch (error) {
            console.error('加载初始数据失败:', error);
        }
    }
    
    startAutoRefresh() {
        setInterval(() => {
            if (this.isRunning) {
                this.tick();
            }
        }, 3000);
    }
    
    async tick() {
        try {
            const data = await API.tick();
            
            this.characters = data.characters;
            this.locations = data.world.locations;
            
            this.renderTime(data.world.time);
            this.renderLocations(this.locations);
            this.renderCharacters(this.characters);
            this.renderEvents(data.world.events.events);
            
            if (this.selectedCharacterId) {
                await this.renderCharacterDetail(this.selectedCharacterId);
            }
            
        } catch (error) {
            console.error('Tick失败:', error);
        }
    }
    
    async toggleGame() {
        const btn = document.getElementById('startBtn');
        
        try {
            if (this.isRunning) {
                await API.stop();
                this.isRunning = false;
                btn.textContent = '▶ 开始';
                btn.classList.remove('running');
            } else {
                await API.start();
                this.isRunning = true;
                btn.textContent = '⏸ 暂停';
                btn.classList.add('running');
            }
        } catch (error) {
            console.error('切换游戏状态失败:', error);
        }
    }
    
    renderTime(timeData) {
        document.getElementById('timeDisplay').textContent = timeData.current_time;
        
        const timeOfDayMap = {
            'morning': '早上好',
            'afternoon': '下午好',
            'evening': '晚上好',
            'night': '夜深了'
        };
        document.getElementById('timeOfDay').textContent = timeOfDayMap[timeData.time_of_day] || '';
    }
    
    renderLocations(locations) {
        const locationElements = document.querySelectorAll('.location');
        
        locationElements.forEach(el => {
            const name = el.dataset.name;
            const location = locations[name];
            
            if (location) {
                const visitorsDiv = el.querySelector('.visitors');
                visitorsDiv.innerHTML = '';
                
                for (let i = 0; i < Math.min(location.visitor_count, 5); i++) {
                    const dot = document.createElement('span');
                    dot.className = 'visitor-dot';
                    visitorsDiv.appendChild(dot);
                }
                
                if (location.visitor_count > 5) {
                    const more = document.createElement('span');
                    more.textContent = `+${location.visitor_count - 5}`;
                    more.style.fontSize = '10px';
                    visitorsDiv.appendChild(more);
                }
            }
        });
    }
    
    renderCharacters(characters) {
        const grid = document.getElementById('charactersGrid');
        grid.innerHTML = '';
        
        Object.values(characters).forEach(char => {
            const card = this.createCharacterCard(char);
            grid.appendChild(card);
        });
    }
    
    createCharacterCard(char) {
        const card = document.createElement('div');
        card.className = 'character-card';
        if (char.id === this.selectedCharacterId) {
            card.classList.add('selected');
        }
        
        card.innerHTML = `
            <h3>${char.mood_emoji} ${char.name}</h3>
            <div class="character-status">
                <div class="status-bar">
                    <span class="status-label">能量</span>
                    <div class="bar"><div class="bar-fill energy" style="width: ${char.energy * 100}%"></div></div>
                </div>
                <div class="status-bar">
                    <span class="status-label">饥饿</span>
                    <div class="bar"><div class="bar-fill hunger" style="width: ${char.hunger * 100}%"></div></div>
                </div>
                <div class="status-bar">
                    <span class="status-label">社交</span>
                    <div class="bar"><div class="bar-fill social" style="width: ${char.social * 100}%"></div></div>
                </div>
                <div style="margin-top: 8px; font-size: 11px; color: #888;">
                    📍 ${char.current_location}
                </div>
            </div>
        `;
        
        card.addEventListener('click', () => this.selectCharacter(char.id));
        
        return card;
    }
    
    async selectCharacter(characterId) {
        this.selectedCharacterId = characterId;
        
        document.querySelectorAll('.character-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        const cards = document.querySelectorAll('.character-card');
        cards.forEach(card => {
            if (card.querySelector('h3').textContent.includes(this.characters[characterId].name)) {
                card.classList.add('selected');
            }
        });
        
        await this.renderCharacterDetail(characterId);
    }
    
    async renderCharacterDetail(characterId) {
        const char = this.characters[characterId];
        if (!char) return;
        
        const detail = document.getElementById('characterDetail');
        
        const personalityDesc = Object.entries(char.personality)
            .filter(([_, v]) => v > 0.6)
            .map(([k, _]) => k)
            .join('、') || '普通';
        
        detail.innerHTML = `
            <div class="detail-row">
                <span class="detail-label">姓名</span>
                <span class="detail-value">${char.name}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">年龄</span>
                <span class="detail-value">${char.age}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">职业</span>
                <span class="detail-value">${char.occupation}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">性格</span>
                <span class="detail-value">${personalityDesc}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">位置</span>
                <span class="detail-value">${char.current_location}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">状态</span>
                <span class="detail-value">${char.current_action || '待机中'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">目标</span>
                <span class="detail-value">${char.goals.length > 0 ? char.goals[0].description : '无'}</span>
            </div>
        `;
    }
    
    renderEvents(events) {
        const log = document.getElementById('eventsLog');
        
        events.forEach(event => {
            const item = document.createElement('div');
            item.className = 'event-item';
            item.innerHTML = `
                <span class="event-time">${event.timestamp}</span>
                ${event.description}
            `;
            log.insertBefore(item, log.firstChild);
        });
        
        while (log.children.length > 50) {
            log.removeChild(log.lastChild);
        }
    }
    
    showConfigModal() {
        const modal = document.getElementById('configModal');
        modal.style.display = 'block';
        
        API.getConfig().then(config => {
            document.getElementById('provider').value = config.provider;
            document.getElementById('model').value = config.model;
            this.updateModelOptions();
        });
    }
    
    hideConfigModal() {
        const modal = document.getElementById('configModal');
        modal.style.display = 'none';
    }
    
    async saveConfig(e) {
        e.preventDefault();
        
        const config = {
            provider: document.getElementById('provider').value,
            api_key: document.getElementById('apiKey').value,
            model: document.getElementById('model').value
        };
        
        if (!config.api_key) {
            alert('请输入 API Key');
            return;
        }
        
        try {
            await API.setConfig(config);
            this.hideConfigModal();
            alert('配置已保存');
        } catch (error) {
            alert('保存配置失败: ' + error.message);
        }
    }
    
    async testConnection() {
        const resultDiv = document.getElementById('testResult');
        resultDiv.textContent = '测试中...';
        resultDiv.className = 'test-result';
        
        const config = {
            provider: document.getElementById('provider').value,
            api_key: document.getElementById('apiKey').value,
            model: document.getElementById('model').value
        };
        
        if (!config.api_key) {
            resultDiv.textContent = '请输入 API Key';
            resultDiv.className = 'test-result error';
            return;
        }
        
        try {
            await API.setConfig(config);
            const result = await API.testConnection();
            
            if (result.success) {
                resultDiv.textContent = '✓ 连接成功！' + (result.response ? ' Response: ' + result.response.substring(0, 50) : '');
                resultDiv.className = 'test-result success';
            } else {
                resultDiv.textContent = '✗ ' + result.message;
                resultDiv.className = 'test-result error';
            }
        } catch (error) {
            resultDiv.textContent = '✗ 连接失败: ' + error.message;
            resultDiv.className = 'test-result error';
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.game = new CyberTownGame();
});
