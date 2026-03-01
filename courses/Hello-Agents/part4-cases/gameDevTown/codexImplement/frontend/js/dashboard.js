export function renderSummary(container, summary) {
  container.innerHTML = '';
  ['pending', 'in_progress', 'done'].forEach((k) => {
    const span = document.createElement('span');
    span.className = 'badge';
    span.textContent = `${k}: ${summary?.[k] ?? 0}`;
    container.appendChild(span);
  });
}

export function renderTasks(container, tasks) {
  container.innerHTML = '';
  tasks.forEach((t) => {
    const li = document.createElement('li');
    li.textContent = `[${t.status}] ${t.title} -> ${t.assignee}`;
    container.appendChild(li);
  });
}
