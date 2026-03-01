import { connectWs, getStatus, startMeeting, startProject } from './api.js';
import { appendMessage } from './chat.js';
import { renderSummary, renderTasks } from './dashboard.js';
import { renderCharacters } from './characters.js';

const chatEl = document.getElementById('chatMessages');
const summaryEl = document.getElementById('summary');
const taskListEl = document.getElementById('taskList');
const charsEl = document.getElementById('characters');
const btnProject = document.getElementById('btnStartProject');
const btnMeeting = document.getElementById('btnMeeting');

renderCharacters(charsEl);

async function refreshStatus() {
  const status = await getStatus();
  renderSummary(summaryEl, status.task_summary);
  renderTasks(taskListEl, status.tasks || []);
}

btnProject.addEventListener('click', async () => {
  await startProject();
  await refreshStatus();
  appendMessage(chatEl, { timestamp: 'SYSTEM', speaker: 'System', content: '项目已启动。' });
});

btnMeeting.addEventListener('click', async () => {
  const result = await startMeeting('design-review', '战斗系统设计', 'designer');
  (result.dialogue || []).forEach((d) => appendMessage(chatEl, d));
  appendMessage(chatEl, {
    timestamp: 'SYSTEM',
    speaker: 'Minutes',
    content: result.minutes?.summary || '会议结束',
  });
  await refreshStatus();
});

connectWs((data) => {
  if (data.type === 'agent_message') {
    appendMessage(chatEl, data);
  }
  if (data.type === 'meeting_update' || data.type === 'task_update' || data.type === 'project_update') {
    refreshStatus();
  }
});

refreshStatus();
