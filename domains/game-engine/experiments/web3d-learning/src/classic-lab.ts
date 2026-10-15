import './classic.css';
import { classicLessons, courses, framePhases } from './classic-data.ts';
import { frameSnapshot, initialState, isLesson, projectPoint, restoreState, sceneSnapshot } from './classic-core.ts';
import type { ClassicLessonId } from './classic-core.ts';
import { escapeHtml as esc } from './workbench.ts';

const app = document.querySelector<HTMLElement>('#app')!;
const storageKey = 'openclasses-classic-study-v1';
let state = { ...initialState };
try { state = restoreState(localStorage.getItem(storageKey)); } catch { /* Browser storage is optional. */ }
const requested = new URLSearchParams(location.search).get('lesson');
if (requested !== null) state.lesson = isLesson(requested) ? requested : 'frame';
const abort = new AbortController();
app.classList.add('classic-page');
document.body.classList.add('classic-background');
app.innerHTML = `
  <header class="classic-header"><a class="classic-brand" href="?lab=classics"><span>oc</span> openClasses <small>经典课拆解</small></a><a href="#original-courses">三门原课程 ↗</a></header>
  <div class="classic-layout">
    <aside class="classic-sidebar"><p class="classic-kicker">当前问题 · 三个视角</p><nav aria-label="本次可学内容">${classicLessons.map((lesson, i) => `<button data-lesson="${lesson.id}"><span>0${i + 1}</span><div><small>${esc(lesson.course)}</small><strong>${esc(lesson.short)}</strong></div></button>`).join('')}</nav><p class="classic-bookmark" id="classic-bookmark"></p><p class="classic-side-note">沿原课学习，遇到疑问再回看对应机制。这里的顺序只连接当前三个问题。</p><a class="classic-archive" href="?lab=course&lesson=mesh">历史实验资料 →</a></aside>
    <article id="classic-main" aria-labelledby="classic-title">
      <div class="classic-lesson-heading"><p class="classic-kicker" id="classic-chapter"></p><h1 id="classic-title" tabindex="-1"></h1><p id="classic-question" class="classic-question"></p></div>
      <section class="classic-experiment" aria-label="交互学习实验">
        <div class="classic-experiment-head"><span><i></i> 同一个场景，两种观察</span><button id="classic-reset">恢复本节初始状态</button></div>
        <div class="classic-scenes">
          <figure><figcaption><strong>世界中的状态</strong><span id="world-caption"></span></figcaption><svg id="classic-world" role="img" aria-label="世界俯视图"></svg><p>俯视辅助图 · 绿色是车，橙色是固定障碍</p></figure>
          <figure><figcaption><strong>相机生成的画面</strong><span id="image-caption"></span></figcaption><svg id="classic-image" role="img" aria-label="相机透视画面"></svg><p id="camera-caption"></p></figure>
        </div>
        <div id="classic-controls" class="classic-controls"></div>
        <div class="classic-explanation" aria-live="polite" aria-atomic="true"><span id="classic-step-label"></span><p id="classic-step-explanation"></p></div>
      </section>
      <p class="classic-try" id="classic-try"></p>
      <section class="classic-takeaway"><span>记住这一点</span><h2 id="classic-takeaway"></h2></section>
      <div class="classic-details">
        <details><summary>再深入一点：中间计算与原因</summary><p id="classic-detail"></p><pre id="classic-formula"></pre></details>
        <details><summary>对应原课与适用条件</summary><div id="classic-sources"></div><p id="classic-condition"></p><p class="classic-model-note">本页图示与交互是依据原课制作的辅助解释，使用简化几何与软件投影；未运行原生 Unity 或 Piccolo，也未模拟完整 GPU 管线。</p></details>
      </div>
      <nav class="classic-bottom-nav" aria-label="问题接续"><button id="classic-prev">← 上一个问题</button><button id="classic-next" class="primary">下一个问题 →</button></nav>
      <p class="classic-next-source" id="classic-next-source"></p>
    </article>
  </div>
  <section class="classic-originals" id="original-courses"><p class="classic-kicker">学习依据</p><h2>三门课，保留各自的章节顺序。</h2><div>${courses.map(course => `<article><h3>${esc(course.name)}</h3><p>${esc(course.role)}</p><small>${esc(course.path)}</small><a href="${esc(course.url)}" target="_blank" rel="noopener noreferrer">打开原课程 ↗</a></article>`).join('')}</div></section>
  <footer class="classic-footer">阅读位置仅保存在当前浏览器，可直接收藏带 lesson 的网址。书签不代表已经学会。</footer>`;

const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
let storageAvailable = true;
function save() {
  try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch { storageAvailable = false; }
  el('classic-bookmark').textContent = storageAvailable ? '已记住本机阅读位置' : '本机书签不可用；可收藏当前网址';
}
function svgSize(id: string) {
  const svg = document.getElementById(id) as unknown as SVGSVGElement;
  const width = Math.max(250, svg.getBoundingClientRect().width);
  svg.setAttribute('viewBox', `0 0 ${width} 280`);
  return { svg, width, height: 280 };
}
function drawScene() {
  const data = state.lesson === 'frame' ? { ...frameSnapshot(state.phase), cameraZ: -8 }
    : state.lesson === 'scene' ? sceneSnapshot(state.sceneZ, state.follow)
      : { worldZ: state.projectionZ, imageZ: state.projectionZ, cameraZ: -8 };
  const fov = state.lesson === 'projection' ? state.fov : 50;
  const world = svgSize('classic-world'), image = svgSize('classic-image');
  const map = (x: number, z: number) => [world.width / 2 + x * 19, 260 - (z + 10) * 8];
  const [cx, cy] = map(0, data.worldZ), [cameraX, cameraY] = map(0, data.cameraZ);
  const [ox, oy] = map(0, 8);
  world.svg.setAttribute('aria-label', `世界俯视图：车 z=${data.worldZ} 米，相机 z=${data.cameraZ} 米，障碍 z=8 米`);
  world.svg.innerHTML = `<rect width="${world.width}" height="280" fill="#f4f7f6"/>
    <rect x="${world.width / 2 - 64}" y="12" width="128" height="256" rx="5" fill="#e3eae7"/>
    <path d="M${world.width / 2} 14V266" stroke="#becfc6" stroke-width="2" stroke-dasharray="9 10"/>
    <text x="18" y="30" fill="#638276">+Z ↑</text>
    ${[0, 4, 8, 12, 16].map(z => `<text x="${world.width / 2 + 76}" y="${map(0, z)[1] + 4}" fill="#789084">${z} m</text>`).join('')}
    <rect x="${ox - 20}" y="${oy - 9}" width="40" height="18" rx="3" fill="#c1844d"/>
    ${data.worldZ !== 0 ? `<rect x="${cx - 13}" y="${map(0, 0)[1] - 19}" width="26" height="38" rx="5" fill="none" stroke="#6c9f88" stroke-dasharray="3 3"/>` : ''}
    <rect x="${cx - 13}" y="${cy - 19}" width="26" height="38" rx="5" fill="#318368"/>
    <rect x="${cx - 9}" y="${cy - 12}" width="18" height="10" rx="2" fill="#b8e2cf"/>
    <path d="M${cx} ${cy - 17}l-4 5h8z" fill="#fff"/>
    <path d="M${cameraX} ${cameraY - 10}l-13 16h26z" fill="#4a6476"/>
    <text x="${cameraX + 20}" y="${cameraY + 7}" fill="#4a6476">相机</text>`;
  const project = (x: number, y: number, z: number) => projectPoint([x, y, z], data.cameraZ, fov, image.width, image.height)!;
  const points = (vertices: number[][]) => vertices.map(([x, y, z]) => { const p = project(x, y, z); return `${p.x},${p.y}`; }).join(' ');
  function box(z: number, w: number, length: number, h: number, color: string, top: string) {
    const near = z - length / 2, far = z + length / 2;
    return `<polygon points="${points([[-w / 2, 0, near], [w / 2, 0, near], [w / 2, h, near], [-w / 2, h, near]])}" fill="${color}"/>
      <polygon points="${points([[-w / 2, h, near], [w / 2, h, near], [w / 2, h, far], [-w / 2, h, far]])}" fill="${top}" stroke="${color}"/>`;
  }
  const waiting = state.lesson === 'frame' && state.phase >= 2 && state.phase < 4;
  image.svg.setAttribute('aria-label', `透视画面：采用车 z=${data.imageZ} 米的数据，视野 ${fov} 度${waiting ? '，保留旧画面' : ''}`);
  image.svg.innerHTML = `<rect width="${image.width}" height="280" fill="#eff5f5"/>
    <polygon points="${points([[-3, 0, -2], [3, 0, -2], [3, 0, 35], [-3, 0, 35]])}" fill="#dbe5e1"/>
    ${[-2, 2, 6, 10, 14, 18, 22, 30].map(z => `<polyline points="${points([[-3, 0, z], [3, 0, z]])}" fill="none" stroke="#bfd0c7"/>`).join('')}
    <polyline points="${points([[0, 0, -2], [0, 0, 35]])}" stroke="#b4c8be" stroke-dasharray="7 8"/>
    ${box(8, 2, 1, 1, '#af703d', '#dca16c')}
    ${box(data.imageZ, 1.5, 2.8, 0.8, '#26765b', '#55a789')}
    <polygon points="${points([[-0.6, 0.81, data.imageZ - 0.6], [0.6, 0.81, data.imageZ - 0.6], [0.6, 0.81, data.imageZ + 0.2], [-0.6, 0.81, data.imageZ + 0.2]])}" fill="#c5e6da"/>
    <text x="16" y="25" fill="#506f65">${waiting ? '旧画面 · 等待绘制' : '透视相机'}</text>`;
  el('world-caption').textContent = `车 z = ${data.worldZ.toFixed(1)} m`;
  el('image-caption').textContent = state.lesson === 'projection' ? `FOV ${fov}°` : `采用 z = ${data.imageZ.toFixed(1)} m`;
  el('camera-caption').textContent = `相机 z = ${data.cameraZ.toFixed(1)} m · ${fov}° 视野${state.lesson === 'scene' && state.follow ? ' · 保持跟随偏移' : ' · 固定朝向'}`;
}
function update() {
  if (state.lesson === 'frame') {
    const phase = framePhases[state.phase];
    el('classic-step-label').textContent = `${state.phase} / 4 · ${phase.title}`;
    el('classic-step-explanation').textContent = phase.text;
    document.querySelectorAll<HTMLButtonElement>('[data-phase]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.phase) === state.phase)));
    el<HTMLButtonElement>('frame-back').disabled = state.phase === 0;
    el('frame-forward').textContent = state.phase === 4 ? '重看这一帧 ↻' : '下一步 →';
  } else if (state.lesson === 'scene') {
    el('classic-step-label').textContent = state.follow ? '相机跟随' : '相机固定';
    el('classic-step-explanation').textContent = state.follow ? '车与相机一起前移，相对偏移不变：画面中的车保持大小，固定障碍物相对靠近。' : '只移动车，相机不动：车离相机更远，画面中的车逐渐变小。';
    el('scene-z-value').textContent = `${state.sceneZ.toFixed(1)} m`;
    el<HTMLInputElement>('scene-z').value = String(state.sceneZ);
    document.querySelectorAll<HTMLButtonElement>('[data-camera]').forEach(button => button.setAttribute('aria-pressed', String((button.dataset.camera === 'follow') === state.follow)));
  } else {
    el('classic-step-label').textContent = '模型尺寸始终不变';
    el('classic-step-explanation').textContent = `车长始终为 2.8 m。当前车 z = ${state.projectionZ.toFixed(1)} m，视野 ${state.fov}°；距离改变观察关系，FOV 改变投影。`;
    el('projection-z-value').textContent = `${state.projectionZ.toFixed(1)} m`;
    el('projection-fov-value').textContent = `${state.fov}°`;
    el<HTMLInputElement>('projection-z').value = String(state.projectionZ);
    el<HTMLInputElement>('projection-fov').value = String(state.fov);
  }
  drawScene();
  save();
}
function selectLesson(id: ClassicLessonId, focus = false) {
  state.lesson = id;
  const lesson = classicLessons.find(item => item.id === id)!;
  const index = classicLessons.indexOf(lesson);
  document.title = `${lesson.title} · 经典课拆解`;
  history.replaceState(null, '', `?lab=classics&lesson=${id}`);
  el('classic-chapter').textContent = `${lesson.course} / ${lesson.chapter}`;
  for (const [target, value] of Object.entries({ title: lesson.title, question: lesson.question, try: lesson.try, takeaway: lesson.takeaway, detail: lesson.detail, formula: lesson.formula, condition: lesson.condition })) el(`classic-${target}`).textContent = value;
  el('classic-next-source').textContent = `沿原课接续：${lesson.next}`;
  el('classic-sources').innerHTML = lesson.sources.map(source => `<article><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.label)} ↗</a><p>${esc(source.note)}</p></article>`).join('');
  document.querySelectorAll<HTMLButtonElement>('[data-lesson]').forEach(button => {
    if (button.dataset.lesson === id) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current');
  });
  el<HTMLButtonElement>('classic-prev').disabled = index === 0;
  el<HTMLButtonElement>('classic-next').disabled = index === classicLessons.length - 1;
  document.querySelectorAll<HTMLDetailsElement>('.classic-details details').forEach(details => { details.open = false; });
  el('classic-controls').innerHTML = id === 'frame' ? `<nav class="classic-phases" aria-label="一帧中的过程">${framePhases.map((phase, i) => `<button data-phase="${i}"><span>${i}</span>${phase.title}</button>`).join('')}</nav><div class="classic-playback"><button id="frame-back">← 上一步</button><span>手动走一帧 · 教学时间步 0.4 s</span><button id="frame-forward" class="primary">下一步 →</button></div>`
    : id === 'scene' ? `<div class="classic-slider"><label for="scene-z">车的位置 z <output id="scene-z-value"></output></label><input id="scene-z" type="range" min="0" max="4" step="0.1" value="${state.sceneZ}"></div><div class="classic-control-buttons"><button id="scene-move">车前移 2 米</button><div role="group" aria-label="相机模式"><button data-camera="fixed">固定相机</button><button data-camera="follow">跟随相机</button></div></div>`
      : `<div class="classic-sliders"><div class="classic-slider"><label for="projection-z">车的位置 z <output id="projection-z-value"></output></label><input id="projection-z" type="range" min="0" max="6" step="0.1" value="${state.projectionZ}"></div><div class="classic-slider"><label for="projection-fov">相机视野 FOV <output id="projection-fov-value"></output></label><input id="projection-fov" type="range" min="35" max="80" step="1" value="${state.fov}"></div></div><div class="classic-control-buttons"><button id="projection-far">只把车推远</button><button id="projection-wide">只扩大视野</button></div>`;
  update();
  if (focus) el('classic-title').focus();
}
app.addEventListener('click', event => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button');
  if (!button) return;
  if (isLesson(button.dataset.lesson)) { selectLesson(button.dataset.lesson, true); return; }
  if (button.dataset.phase !== undefined) state.phase = Number(button.dataset.phase);
  if (button.dataset.camera) state.follow = button.dataset.camera === 'follow';
  if (button.id === 'frame-back') state.phase = Math.max(0, state.phase - 1);
  if (button.id === 'frame-forward') state.phase = state.phase === 4 ? 0 : state.phase + 1;
  if (button.id === 'scene-move') state.sceneZ = Math.min(4, state.sceneZ + 2);
  if (button.id === 'projection-far') state.projectionZ = 4;
  if (button.id === 'projection-wide') state.fov = 80;
  if (button.id === 'classic-reset') {
    if (state.lesson === 'frame') state.phase = 0;
    if (state.lesson === 'scene') { state.sceneZ = 0; state.follow = false; }
    if (state.lesson === 'projection') { state.projectionZ = 0; state.fov = 50; }
  }
  if (button.id === 'classic-prev' || button.id === 'classic-next') {
    const index = classicLessons.findIndex(lesson => lesson.id === state.lesson) + (button.id === 'classic-next' ? 1 : -1);
    const lesson = classicLessons[index];
    if (lesson) selectLesson(lesson.id, true);
    return;
  }
  update();
}, { signal: abort.signal });
app.addEventListener('input', event => {
  const input = event.target as HTMLInputElement;
  if (input.id === 'scene-z') state.sceneZ = input.valueAsNumber;
  else if (input.id === 'projection-z') state.projectionZ = input.valueAsNumber;
  else if (input.id === 'projection-fov') state.fov = input.valueAsNumber;
  else return;
  update();
}, { signal: abort.signal });
const observer = new ResizeObserver(drawScene);
observer.observe(el('classic-controls'));
selectLesson(state.lesson);
function dispose() { abort.abort(); observer.disconnect(); }
// A cached page is frozen by the browser and needs its listeners when restored.
function onPageHide(event: PageTransitionEvent) { if (!event.persisted) dispose(); }
window.addEventListener('pagehide', onPageHide);
if (import.meta.hot) import.meta.hot.dispose(() => {
  dispose(); window.removeEventListener('pagehide', onPageHide);
  document.body.classList.remove('classic-background');
});
