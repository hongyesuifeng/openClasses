const characterMeta = [
  { role: 'producer', name: 'Alex', icon: '🎬' },
  { role: 'developer', name: 'Cody', icon: '💻' },
  { role: 'designer', name: 'Diana', icon: '📝' },
  { role: 'artist', name: 'Arty', icon: '🎨' },
];

export function renderCharacters(container, stateMap = {}) {
  container.innerHTML = '';
  characterMeta.forEach((c) => {
    const div = document.createElement('div');
    div.className = 'character';
    const state = stateMap[c.role] || '待命';
    div.innerHTML = `<span>${c.icon} ${c.name}</span><span class="state">${state}</span>`;
    container.appendChild(div);
  });
}
