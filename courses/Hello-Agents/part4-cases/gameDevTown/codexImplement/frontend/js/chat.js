export function appendMessage(container, msg) {
  const div = document.createElement('div');
  div.className = 'msg';
  div.innerHTML = `
    <div class="meta">[${msg.timestamp || '--:--'}] ${msg.icon || '💬'} ${msg.speaker || msg.role}</div>
    <div>${msg.content || ''}</div>
  `;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}
