const API_BASE = 'http://localhost:5052/api';

const api = {
    async startMeeting(meetingType, topic, autoRounds = 3) {
        const response = await fetch(`${API_BASE}/meeting/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ meeting_type: meetingType, topic, auto_rounds: autoRounds })
        });
        return response.json();
    },

    async nextRound() {
        const response = await fetch(`${API_BASE}/meeting/next`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        return response.json();
    },

    async getStatus() {
        const response = await fetch(`${API_BASE}/status`);
        return response.json();
    },

    async getMessages(limit = 20) {
        const response = await fetch(`${API_BASE}/messages?limit=${limit}`);
        return response.json();
    },

    async getTasks() {
        const response = await fetch(`${API_BASE}/tasks`);
        return response.json();
    },

    async endMeeting() {
        const response = await fetch(`${API_BASE}/meeting/end`, {
            method: 'POST'
        });
        return response.json();
    }
};
