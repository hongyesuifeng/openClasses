/**
 * Game Dev Town - API 通信模块
 */

// 动态获取当前页面的主机和端口
const HOST = window.location.hostname || 'localhost';
const PORT = window.location.port || '8000';
const PROTOCOL = window.location.protocol === 'https:' ? 'https:' : 'http:';
const WS_PROTOCOL = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

const API_BASE = `${PROTOCOL}//${HOST}:${PORT}/api`;
const WS_URL = `${WS_PROTOCOL}//${HOST}:${PORT}/ws/meeting`;

class APIClient {
    constructor() {
        this.baseURL = API_BASE;
        this.ws = null;
        this.wsConnected = false;
        this.messageHandlers = new Map();
    }

    // REST API 方法
    async get(endpoint) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('GET request failed:', error);
            throw error;
        }
    }

    async post(endpoint, data) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('POST request failed:', error);
            throw error;
        }
    }

    // WebSocket 方法
    connectWebSocket(onMessage, onOpen, onClose) {
        if (this.ws) {
            this.ws.close();
        }

        this.ws = new WebSocket(WS_URL);

        this.ws.onopen = () => {
            console.log('WebSocket 连接成功');
            this.wsConnected = true;
            if (onOpen) onOpen();
        };

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('收到消息:', data);

            // 调用通用消息处理器
            if (onMessage) {
                onMessage(data);
            }

            // 调用特定类型的处理器
            const handler = this.messageHandlers.get(data.type);
            if (handler) {
                handler(data.data);
            }
        };

        this.ws.onclose = () => {
            console.log('WebSocket 连接关闭');
            this.wsConnected = false;
            if (onClose) onClose();

            // 自动重连
            setTimeout(() => {
                if (!this.wsConnected) {
                    console.log('尝试重新连接...');
                    this.connectWebSocket(onMessage, onOpen, onClose);
                }
            }, 3000);
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket 错误:', error);
        };
    }

    sendWebSocketMessage(type, data = {}) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type, data }));
        } else {
            console.warn('WebSocket 未连接');
        }
    }

    onMessageType(type, handler) {
        this.messageHandlers.set(type, handler);
    }

    disconnectWebSocket() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    // 业务 API 方法
    async getAgents() {
        return this.get('/agents');
    }

    async getAgent(roleId) {
        return this.get(`/agents/${roleId}`);
    }

    async getMeetingTemplates() {
        return this.get('/meetings/templates');
    }

    async getScenarios() {
        return this.get('/meetings/scenarios');
    }

    async getProjectInfo() {
        return this.get('/project/info');
    }

    async getProjectProgress() {
        return this.get('/project/progress');
    }

    // WebSocket 业务方法
    startMeeting(templateId, title, meetingType, agenda) {
        this.sendWebSocketMessage('start_meeting', {
            template_id: templateId,
            title,
            meeting_type: meetingType,
            agenda,
        });
    }

    runDiscussion(topic, rounds = 1) {
        this.sendWebSocketMessage('run_discussion', {
            topic,
            rounds,
        });
    }

    sendMessage(content) {
        this.sendWebSocketMessage('send_message', {
            content,
        });
    }

    endMeeting() {
        this.sendWebSocketMessage('end_meeting', {});
    }

    getStatus() {
        this.sendWebSocketMessage('get_status', {});
    }

    runScenario(scenarioId) {
        this.sendWebSocketMessage('run_scenario', {
            scenario_id: scenarioId,
        });
    }
}

// 导出单例
const api = new APIClient();
