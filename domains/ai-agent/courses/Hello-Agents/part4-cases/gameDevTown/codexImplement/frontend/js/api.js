const BASE_URL = 'http://localhost:5052';

export async function startProject() {
  const res = await fetch(`${BASE_URL}/api/project/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: '王者之路', type: 'first-person-rpg', timeline: '6-months' }),
  });
  return res.json();
}

export async function startMeeting(type = 'design-review', topic = '战斗系统设计', proposer = 'designer') {
  const res = await fetch(`${BASE_URL}/api/meeting/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, topic, proposer }),
  });
  return res.json();
}

export async function getStatus() {
  const res = await fetch(`${BASE_URL}/api/project/status`);
  return res.json();
}

export function connectWs(onMessage) {
  const ws = new WebSocket('ws://localhost:5052/ws');
  ws.onmessage = (event) => {
    try {
      onMessage(JSON.parse(event.data));
    } catch {
      // ignore invalid payload
    }
  };
  return ws;
}
