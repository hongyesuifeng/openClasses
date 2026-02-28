/**
 * API 客户端
 */

const API_BASE = 'http://localhost:9091';

const API = {
    async request(endpoint, options = {}) {
        try {
            const response = await fetch(`${API_BASE}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },
    
    getConfig() {
        return this.request('/api/config');
    },
    
    setConfig(config) {
        return this.request('/api/config', {
            method: 'POST',
            body: JSON.stringify(config)
        });
    },
    
    testConnection() {
        return this.request('/api/test-connection');
    },
    
    getWorld() {
        return this.request('/api/world');
    },
    
    getCharacters() {
        return this.request('/api/characters');
    },
    
    getCharacter(id) {
        return this.request(`/api/character/${id}`);
    },
    
    getLocations() {
        return this.request('/api/locations');
    },
    
    getEvents() {
        return this.request('/api/events');
    },
    
    tick() {
        return this.request('/api/tick', {
            method: 'POST'
        });
    },
    
    start() {
        return this.request('/api/start', {
            method: 'POST'
        });
    },
    
    stop() {
        return this.request('/api/stop', {
            method: 'POST'
        });
    },
    
    chat(characterId, message) {
        return this.request('/api/chat', {
            method: 'POST',
            body: JSON.stringify({
                character_id: characterId,
                message: message
            })
        });
    },
    
    getSocial(characterId) {
        return this.request(`/api/social/${characterId}`);
    }
};

window.API = API;
