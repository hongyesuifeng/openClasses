import './principles.css';
import { principleCourses } from './principles-data.ts';
import { engineAction, gameAction, isCourse, newEngineCase, newGameCase, restoreReading, stripCoverage } from './principles-model.ts';
import type { CourseId } from './principles-model.ts';
import { escapeHtml as esc } from './workbench.ts';

const app = document.querySelector<HTMLElement>('#app')!;
const storageKey = 'openclasses-course-principles-v2';
let reading = restoreReading(null);
try { reading = restoreReading(localStorage.getItem(storageKey)); } catch { /* Optional local bookmark. */ }
const query = new URLSearchParams(location.search);
const requested = query.get('course');
if (requested !== null) reading.course = isCourse(requested) ? requested : 'games101';
else {
  const previousLinks: Record<string, CourseId> = { frame: 'games104', scene: 'unity', projection: 'games101' };
  const lesson = query.get('lesson');
  if (lesson && Object.hasOwn(previousLinks, lesson)) reading.course = previousLinks[lesson];
}
let engine = newEngineCase(), displayOnlyGame = newGameCase(), ruleGame = newGameCase(), offset = 0.1;
const abort = new AbortController();
app.classList.add('principles-page');
document.body.classList.add('principles-background');
app.innerHTML = `
  <header class="principles-header"><a class="principles-brand" href="?lab=classics"><span>oc</span> openClasses <small>经典课 · 主线与精华</small></a><span id="reading-bookmark"></span></header>
  <nav class="principles-courses" aria-label="三门课程">${principleCourses.map((course, index) => `<button data-course="${course.id}"><span>0${index + 1}</span><div><strong>${esc(course.name)}</strong><small>${esc(course.role)}</small></div><b aria-hidden="true">↗</b></button>`).join('')}</nav>
  <article aria-labelledby="principle-title">
    <header class="principles-intro"><p class="principles-eyebrow" id="principle-course"></p><h1 id="principle-title" tabindex="-1"></h1><p class="principles-thesis" id="principle-thesis"></p><p class="principles-tension" id="principle-tension"></p></header>
    <section class="principles-map-section" aria-labelledby="course-map-title"><div class="principles-section-heading"><div><p class="principles-eyebrow">01 / 先知道每一段为什么存在</p><h2 id="course-map-title">整门课的问题地图</h2></div><span>按原课顺序 · 点击展开关系</span></div><nav class="principles-map" id="course-map" aria-label="原课问题地图"></nav><section class="principles-chapter" aria-labelledby="chapter-question"><p id="chapter-range" class="principles-eyebrow"></p><h3 id="chapter-question" tabindex="-1"></h3><div><section><h4>为什么需要它</h4><p id="chapter-why"></p></section><section><h4>核心思路</h4><p id="chapter-idea"></p></section><section><h4>放回整门课</h4><p id="chapter-connection"></p></section></div></section><p class="principles-map-note">这张图表示原课程的学习顺序，具体讲次中的主题会互相联系；它不是每帧执行顺序，也不记录掌握程度。</p></section>
    <section class="principles-case" aria-labelledby="case-title"><div class="principles-section-heading"><div><p class="principles-eyebrow">02 / 用结果差异看见问题</p><h2 id="case-title"></h2></div><button id="locate-case">定位原课章节 ↑</button></div><p class="principles-case-place" id="case-place"></p><p class="principles-observe" id="case-observation"></p><div id="principle-workbench"></div><div class="principles-conclusion"><span>这个对照说明了什么</span><p id="case-conclusion"></p></div></section>
    <section class="principles-reasoning"><p class="principles-eyebrow">03 / 从这个案例带走什么</p><div id="principle-reasoning"></div></section>
    <section class="principles-connection"><h2>同一个游戏，三门课分别在追问什么？</h2><p>从玩家尝试点击一个目标，到看见结果：</p><ol class="principles-bridge"><li><strong>点击目标</strong><span>玩家发出请求</span></li><li><strong>判断是否有效</strong><span>规则结合当前状态</span></li><li><strong>改变世界状态</strong><span>目标消失、分数增加</span></li><li><strong>把变化交给相关系统</strong><span>让不同职责形成协作</span></li><li><strong>生成可见反馈</strong><span>图像、界面和效果</span></li></ol><p class="principles-loop">↶ 玩家读到反馈，再决定下一次操作。这是连接知识的职责示意，各引擎的具体调度顺序需分别理解。</p><div>${principleCourses.map(course => `<article><strong>${esc(course.name)}</strong><p>${course.id === 'games101' ? '目标与特效怎样成为像素，颜色、光和采样怎样影响可信度？' : course.id === 'unity' ? '这一击是否有效，怎样改变分数和游戏状态，玩家怎样得到反馈？' : '对象、资源、玩法与渲染系统怎样交换变化，持续支撑这些行为？'}</p></article>`).join('')}</div></section>
    <details class="principles-sources"><summary>原课出处、提炼方式与示意边界</summary><p>问题地图与因果解释是对原材料的归纳；对照案例由本页制作，原课提供的机制与补充示意分别说明。</p><div id="principle-sources"></div><p id="principle-limit"></p></details>
    <p id="principle-next" class="principles-next"></p>
  </article><footer class="principles-footer">本轮是三门课的主线导读与核心案例；后续按原章节深化。本机书签只保存阅读位置。</footer>`;
const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
function currentCourse() { return principleCourses.find(course => course.id === reading.course)!; }
function saveReading() {
  try { localStorage.setItem(storageKey, JSON.stringify(reading)); el('reading-bookmark').textContent = '已保存本机阅读位置'; }
  catch { el('reading-bookmark').textContent = '可收藏当前网址'; }
}
function chooseChapter(index: number, focus = false) {
  const course = currentCourse(), chapter = course.chapters[index];
  if (!chapter) return;
  reading.topics[course.id] = index;
  el('chapter-range').textContent = `${chapter.range} / ${chapter.title}`;
  el('chapter-question').textContent = chapter.question;
  el('chapter-why').textContent = chapter.why;
  el('chapter-idea').textContent = chapter.idea;
  el('chapter-connection').textContent = chapter.consequence;
  document.querySelectorAll<HTMLButtonElement>('[data-chapter]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.chapter) === index)));
  saveReading();
  if (focus) el('chapter-question').focus();
}
function renderSampling() {
  const width = 294, height = 216, cell = 21, x0 = 21, y0 = 20;
  const svg = (mode: 'shape' | 'center' | 'coverage') => {
    let cells = '';
    for (let y = 0; y < 8; y++) for (let x = 0; x < 12; x++) {
      const coverage = mode === 'shape' ? 0 : stripCoverage(x, offset, mode === 'center' ? 1 : 4);
      cells += `<rect x="${x0 + x * cell}" y="${y0 + y * cell}" width="${cell}" height="${cell}" fill="${coverage ? `rgba(38,115,83,${coverage})` : '#fff'}" stroke="#dbe5df" stroke-width=".7"/>`;
    }
    if (mode === 'shape') {
      cells += `<rect x="${x0 + (5 + offset) * cell}" y="${y0}" width="${cell * 0.25}" height="${cell * 8}" fill="#277b59"/>`;
      for (let y = 0; y < 8; y++) for (let x = 0; x < 12; x++) cells += `<circle cx="${x0 + (x + 0.5) * cell}" cy="${y0 + (y + 0.5) * cell}" r="1.4" fill="#b47743"/>`;
    }
    const label = mode === 'shape' ? '连续细线与像素中心点' : mode === 'center' ? '每像素一个中心采样的结果' : '每像素十六个覆盖采样的近似结果';
    return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${label}">${cells}</svg>`;
  };
  const center = stripCoverage(5, offset, 1), coverage = stripCoverage(5, offset, 4);
  el('sampling-shape').innerHTML = svg('shape'); el('sampling-center').innerHTML = svg('center'); el('sampling-coverage').innerHTML = svg('coverage');
  el('sampling-center-result').textContent = center ? '中心被覆盖：整格填满' : '中心未覆盖：整格漏掉';
  el('sampling-coverage-result').textContent = `估计部分覆盖：${Math.round(coverage * 100)}%`;
  el('sampling-message').textContent = center ? '细线穿过采样中心，单点结果把这一列视为全部覆盖；细线的实际宽度没有变。多点覆盖保留了“只覆盖一部分”的信息。' : '细线从采样中心旁边经过，单点结果把这一列视为没有覆盖。几何仍然存在，只是在这次采样中被漏掉。';
  el<HTMLInputElement>('sampling-offset').value = String(offset);
}
function renderGameCase() {
  const view = (id: string, game: typeof ruleGame) => {
    el(`${id}-state`).textContent = game.ended ? 'Game Over' : '游戏进行中';
    el(`${id}-targets`).textContent = String(game.targets);
    el(`${id}-score`).textContent = String(game.score);
    el(`${id}-objects`).innerHTML = Array.from({ length: Math.min(12, game.targets) }, (_, i) => `<span class="principles-target" aria-hidden="true" style="--target-turn:${i * 17}deg"></span>`).join('') + (game.targets > 12 ? `<small>另有 ${game.targets - 12} 个</small>` : '');
    el(`${id}-state`).classList.toggle('is-ended', game.ended);
  };
  view('display-only', displayOnlyGame); view('state-rule', ruleGame);
  el('game-message').textContent = ruleGame.ended ? '两侧界面都已显示结束。继续发出相同请求：左边仍允许生成与计分，右边由游戏状态阻止这些行为。已有目标不必消失，关键是之后还允许做什么。' : '当前两侧都处于游戏中，生成与计分都会工作。先结束游戏，再继续相同操作，才能看见状态约束的作用。';
}
function renderEngineCase() {
  el('engine-world-version').textContent = `版本 ${engine.world.version}`;
  el('engine-world-value').textContent = `车已前移 ${engine.world.z} m`;
  el('engine-packet-version').textContent = engine.pending ? `版本 ${engine.pending.version}` : '空';
  el('engine-packet-value').textContent = engine.pending ? `记录前移 ${engine.pending.z} m` : '没有待消费的变化';
  el('engine-image-version').textContent = `版本 ${engine.image.version}`;
  el('engine-image-value').textContent = `仍采用前移 ${engine.image.z} m`;
  el('engine-dirty').textContent = engine.dirty ? '有尚未交接的变化' : '暂无待交接变化';
  el('engine-message').textContent = engine.message;
  el('engine-image-card').classList.toggle('is-stale', engine.world.version !== engine.image.version);
  const end = Math.max(10, engine.world.z + 2);
  for (const [id, z] of [['world', engine.world.z], ['packet', engine.pending?.z ?? null], ['image', engine.image.z]] as const) {
    const marker = el(`engine-${id}-marker`); marker.hidden = z === null;
    if (z !== null) marker.style.left = `${8 + z / end * 80}%`;
  }
}
function setupWorkbench() {
  const course = currentCourse();
  if (course.id === 'games101') {
    offset = 0.1;
    el('principle-workbench').innerHTML = `<div class="principles-sampling-panels"><figure><figcaption>原来的连续形状<small>橙点是每格的中心</small></figcaption><div id="sampling-shape"></div><p>形状始终保持同样宽度</p></figure><figure><figcaption>只看中心点<small>每格只作一次覆盖判断</small></figcaption><div id="sampling-center"></div><p id="sampling-center-result"></p></figure><figure><figcaption>在格子里多看几个点<small>每格 16 个覆盖样本</small></figcaption><div id="sampling-coverage"></div><p id="sampling-coverage-result"></p></figure></div><div class="principles-case-controls"><label for="sampling-offset">让细线在一个像素内轻微移动</label><input id="sampling-offset" type="range" min="0" max="0.75" step="0.01" value="0.1"><div><button data-sample="0.1">漏过中心</button><button data-sample="0.4">穿过中心</button><button data-reset-case>恢复对照</button></div></div><p id="sampling-message" class="principles-live-message" aria-live="polite"></p>`;
    renderSampling();
  } else if (course.id === 'unity') {
    displayOnlyGame = newGameCase(); ruleGame = newGameCase();
    const board = (id: string, title: string, description: string) => `<section><h3>${title}</h3><p>${description}</p><div class="principles-game-screen"><strong id="${id}-state"></strong><div id="${id}-objects" class="principles-game-objects"></div></div><dl><div><dt>现有目标</dt><dd id="${id}-targets"></dd></div><div><dt>分数</dt><dd id="${id}-score"></dd></div></dl></section>`;
    el('principle-workbench').innerHTML = `<div class="principles-game-panels">${board('display-only', '只让界面显示结束', '规则仍然接受生成与计分请求。')}${board('state-rule', '规则也服从结束状态', '同一个状态约束生成与计分。')}</div><div class="principles-case-controls"><span>对两边执行同一操作</span><div><button data-game="end" class="primary">让游戏结束</button><button data-game="spawn">生成下一个目标</button><button data-game="score">点击目标计分</button><button data-reset-case>重新开始</button></div></div><p id="game-message" class="principles-live-message" aria-live="polite"></p>`;
    renderGameCase();
  } else {
    engine = newEngineCase();
    const card = (id: string, title: string, subtitle: string, action: string, label: string) => `<section id="engine-${id}-card"><span class="principles-engine-role">${title}</span><strong id="engine-${id}-version"></strong><p id="engine-${id}-value"></p><div class="principles-engine-track"><i id="engine-${id}-marker" aria-hidden="true"></i></div><small>${subtitle}</small><button data-engine="${action}">${label}</button></section>`;
    el('principle-workbench').innerHTML = `<div class="principles-engine-panels">${card('world', '玩法世界 · 生产变化', '决定车发生了什么变化', 'advance', '① 只推进世界')}${card('packet', '交接包 · 传递变化', '接收方先处理手上的包', 'publish', '② 交接变化')}${card('image', '渲染侧 · 消费变化', '采用收到的数据生成示意画面', 'render', '③ 生成画面')}</div><div class="principles-case-controls"><span id="engine-dirty"></span><button data-reset-case>恢复起点</button></div><p id="engine-message" class="principles-live-message" aria-live="polite"></p>`;
    renderEngineCase();
  }
}
function chooseCourse(id: CourseId, focus = false) {
  reading.course = id;
  const course = currentCourse();
  history.replaceState(null, '', `?lab=classics&course=${id}`);
  document.title = `${course.name} · 主线与精华 · openClasses`;
  el('principle-course').textContent = `${course.name} / 主线导读与核心案例`;
  for (const [target, text] of Object.entries({ title: course.title, thesis: course.thesis, tension: course.tension })) el(`principle-${target}`).textContent = text;
  for (const [target, text] of Object.entries({ title: course.caseTitle, place: course.casePlace, observation: course.observation, conclusion: course.conclusion })) el(`case-${target}`).textContent = text;
  el('principle-reasoning').innerHTML = course.reasoning.map(item => `<section><h3>${esc(item.title)}</h3><p>${esc(item.text)}</p></section>`).join('');
  el('principle-sources').innerHTML = course.sources.map(source => `<article><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)} ↗</a><p>${esc(source.scope)}</p></article>`).join('');
  el('principle-limit').textContent = course.limit;
  el('principle-next').textContent = `沿原课继续：${course.next}`;
  document.querySelectorAll<HTMLButtonElement>('[data-course]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.course === id)));
  el('course-map').innerHTML = course.chapters.map((chapter, index) => `<button data-chapter="${index}"><span>0${index + 1}</span><strong>${esc(chapter.title)}</strong><small>${esc(chapter.range)}</small></button>`).join('');
  chooseChapter(reading.topics[id]);
  setupWorkbench();
  document.querySelector<HTMLDetailsElement>('.principles-sources')!.open = false;
  if (focus) el('principle-title').focus();
}
app.addEventListener('click', event => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button');
  if (!button) return;
  if (isCourse(button.dataset.course)) { chooseCourse(button.dataset.course, true); return; }
  if (button.dataset.chapter !== undefined) { chooseChapter(Number(button.dataset.chapter)); return; }
  if (button.id === 'locate-case') { chooseChapter(currentCourse().caseTopic, true); return; }
  if ('resetCase' in button.dataset) { setupWorkbench(); return; }
  if (button.dataset.sample !== undefined) { offset = Number(button.dataset.sample); renderSampling(); }
  const action = button.dataset.engine;
  if (action === 'advance' || action === 'publish' || action === 'render') { engine = engineAction(engine, action); renderEngineCase(); }
  const game = button.dataset.game;
  if (game === 'end' || game === 'spawn' || game === 'score') {
    displayOnlyGame = gameAction(displayOnlyGame, game, false); ruleGame = gameAction(ruleGame, game, true); renderGameCase();
  }
}, { signal: abort.signal });
app.addEventListener('input', event => {
  const input = event.target as HTMLInputElement;
  if (input.id === 'sampling-offset') { offset = input.valueAsNumber; renderSampling(); }
}, { signal: abort.signal });
chooseCourse(reading.course);
function onHide(event: PageTransitionEvent) { if (!event.persisted) abort.abort(); }
window.addEventListener('pagehide', onHide);
if (import.meta.hot) import.meta.hot.dispose(() => { abort.abort(); window.removeEventListener('pagehide', onHide); document.body.classList.remove('principles-background'); });
