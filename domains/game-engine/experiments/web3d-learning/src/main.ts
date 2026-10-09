import './style.css';
import { createCubeView, type CameraView } from './cube-view.ts';
import { advance, checkSpeed, createSimulation, FrameClock, simulateTwoSeconds, toDegrees } from './simulation.ts';

const app = document.querySelector<HTMLElement>('#app')!;
app.innerHTML = `
  <header class="page-header">
    <div class="brand"><span class="brand-mark">3D</span> openClasses <span class="separator">/</span> 实践学习</div>
    <span class="stage">阶段 0 · 实验 01</span>
  </header>
  <section class="intro">
    <p class="eyebrow">SCENE & TIME</p>
    <h1>让状态变成画面。</h1>
    <p class="lead">先预测一个变化，再动手验证。今天只研究：时间怎样改变立方体的角度？</p>
  </section>
  <section class="lab-layout" aria-label="立方体与帧循环实验">
    <div class="scene-card">
      <div class="scene-toolbar"><span><i class="live-dot"></i> 立方体 · 绕 Y 轴旋转</span>
        <label>观察视角 <select id="camera"><option value="diagonal">斜侧面</option><option value="front">正面</option><option value="side">侧面</option></select></label>
      </div>
      <div id="viewport"><div class="scene-badge" id="scene-status">模拟运行中</div><div class="axis-legend"><span class="axis-x">X</span><span class="axis-y">Y ↑</span><span class="axis-z">Z</span><span>坐标轴固定在世界空间</span></div></div>
      <div class="scene-footer"><span>对象保存状态 → 更新改变状态 → 渲染展示状态</span><button id="release" class="text-button">退出实验</button><button id="restart" class="text-button" hidden>重新进入</button></div>
    </div>
    <aside class="control-card">
      <div class="card-heading"><h2>改变一个参数</h2><span class="step-number">01</span></div>
      <label class="speed-label" for="speed">绕 Y 轴的角速度 <span>度／秒</span></label>
      <div class="speed-input"><input id="speed" type="number" min="0" max="180" step="1" value="45" /><span>° / s</span></div>
      <input id="speed-range" aria-label="角速度滑块" type="range" min="0" max="180" step="1" value="45" />
      <div class="range-labels"><span>0 · 静止</span><span>180</span></div>
      <div class="actions"><button id="pause" class="primary">暂停模拟</button><button id="reset">重置</button></div>
      <p class="hint">暂停后仍会绘制画面；修改速度会在继续时生效。</p>
      <div class="divider"></div>
      <h3>把时间固定，检查你的预测</h3>
      <p class="hint">从 0 开始，用固定步长累计模拟 2 秒，最后暂停。</p>
      <div class="fixed-controls"><label for="fps">每秒输入步数</label><select id="fps"><option>30</option><option selected>60</option><option>120</option></select></div>
      <button id="fixed" class="full-width">从零验证 2 秒</button>
      <p id="fixed-result" class="result" role="status">先计算：45 × 2 = ? 度</p>
      <p class="small-note">这是固定输入数值实验，所选步数不代表浏览器实际刷新率。</p>
    </aside>
  </section>
  <section class="metrics" aria-label="中间数据">
    <div><span>实际帧间隔</span><strong id="actual">0.00</strong><small>毫秒 · 浏览器时间</small></div>
    <div><span>模拟步长</span><strong id="step">0.00</strong><small>毫秒 · 上限 100，暂停为 0</small></div>
    <div><span>累计模拟时间</span><strong id="time">0.000</strong><small>秒 · 暂停时保持</small></div>
    <div><span>累计旋转角度</span><strong id="angle">0.000</strong><small>度 · 内部计算使用弧度</small></div>
  </section>
  <section class="practice">
    <div class="section-title"><div><p class="eyebrow">PREDICT → OBSERVE → EXPLAIN</p><h2>三轮练习，每轮只回答一个问题</h2></div><span>建议 30–45 分钟</span></div>
    <div class="practice-grid">
      <article><span class="task-index">01 / 时间与角度</span><h3>同样的时间，结果相同吗？</h3><p>设为 45 度／秒，先预测 2 秒后的角度。分别选 30、60、120 步／秒验证，记录时间和角度。</p><p class="question">如果每一步固定转 1 度，结果会怎样？</p></article>
      <article><span class="task-index">02 / 暂停与恢复</span><h3>零速度与暂停有何区别？</h3><p>重置后把速度设为 0，观察时间。再设为 90，暂停并等待；暂停时改为 30，再继续。</p><p class="question">哪种情况时间在增加？恢复时会补算等待吗？</p></article>
      <article><span class="task-index">03 / 状态与画面</span><h3>改相机，需要改对象吗？</h3><p>验证 2 秒后切换正面、侧面和斜侧面。观察画面与角度数值，再重置。最后退出并重新进入。</p><p class="question">为何画面变化，角度却没变化？退出清理了什么？</p></article>
    </div>
  </section>
  <section class="explanations">
    <details><summary>对照关键代码：模拟和绘制各做什么？</summary><div class="explanation-grid">
      <div><h3>1. 创建对象</h3><pre>const cube = new THREE.Mesh(geometry, material);
scene.add(cube);</pre><p>Geometry、Material、Mesh 和 Scene 的初始化见 src/cube-view.ts。</p></div>
      <div><h3>2. 改变状态</h3><pre>simulatedSeconds += seconds;
angleRadians += speedRadians * seconds;</pre><p>核心计算在 src/simulation.ts 的 advance。先解释单位，再尝试修改。</p></div>
      <div><h3>3. 展示状态</h3><pre>cube.rotation.y = angleRadians;
renderer.render(scene, camera);</pre><p>模拟暂停时状态不变，render 仍可继续运行。</p></div>
    </div></details>
    <details><summary>Cocos 对照与实验边界</summary><p>Node 保存变换；Component 的更新回调表达行为；ComponentScheduler 组织组件回调，Director 组织帧流程与绘制。浏览器帧回调由浏览器驱动，本实验单独管理可暂停的模拟时间。</p><p>后台返回或暂停恢复时重建时间基准；正常帧的模拟步长最多为 0.1 秒。角度面板保留累计值，立方体朝向按整圈重复；它的对称外形不能代替角度数值验证。</p><p>Three.js 负责几何体、矩阵与绘制等步骤；本实验实际检查的是对象职责、时间更新和生命周期。</p></details>
  </section>
  <footer>记录你的预测、观察值与解释，再进入空间数学。个人理解需单独验收。</footer>
`;

function element<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}
const host = element<HTMLDivElement>('viewport');
const speed = element<HTMLInputElement>('speed');
const range = element<HTMLInputElement>('speed-range');
const camera = element<HTMLSelectElement>('camera');
const pause = element<HTMLButtonElement>('pause');
const reset = element<HTMLButtonElement>('reset');
const fixed = element<HTMLButtonElement>('fixed');
const release = element<HTMLButtonElement>('release');
const restart = element<HTMLButtonElement>('restart');
const result = element<HTMLParagraphElement>('fixed-result');
const status = element<HTMLDivElement>('scene-status');
const actualOutput = element<HTMLElement>('actual');
const stepOutput = element<HTMLElement>('step');
const timeOutput = element<HTMLElement>('time');
const angleOutput = element<HTMLElement>('angle');
let simulation = createSimulation();
let stopLab: (() => void) | undefined;
const uiEvents = new AbortController();

function displayState(): void {
  timeOutput.textContent = simulation.simulatedSeconds.toFixed(3);
  angleOutput.textContent = toDegrees(simulation.angleRadians).toFixed(3);
  pause.textContent = simulation.paused ? '继续模拟' : '暂停模拟';
  status.textContent = simulation.paused ? '模拟已暂停 · 画面仍在绘制' : '模拟运行中';
}

function startLab(): void {
  let view: ReturnType<typeof createCubeView>;
  try {
    view = createCubeView(host);
  } catch (error) {
    status.textContent = '图形初始化失败';
    const errorPanel = document.createElement('div');
    errorPanel.className = 'error-panel';
    errorPanel.textContent = `${error instanceof Error ? error.message : '图形初始化失败。'} 请在桌面 Chrome／Edge 检查硬件加速与 WebGL2，或换浏览器后重试。下方原理与练习仍可阅读。`;
    host.append(errorPanel);
    for (const control of [speed, range, camera, pause, reset, fixed, release]) control.disabled = true;
    return;
  }
  const events = new AbortController();
  const clock = new FrameClock();
  const resizeObserver = new ResizeObserver(() => view.resize());
  resizeObserver.observe(host);
  let frameId = 0;
  let disposed = false;
  let lastPanelTime = -Infinity;
  simulation = createSimulation();
  camera.value = 'diagonal'; speed.value = range.value = '45';
  for (const control of [speed, range, camera, pause, reset, fixed]) control.disabled = false;
  restart.hidden = true; release.hidden = false;
  actualOutput.textContent = stepOutput.textContent = '0.00';
  result.textContent = '先计算：45 × 2 = ? 度';
  displayState();

  function tick(timestamp: number): void {
    if (disposed) return;
    const { actualSeconds, boundedSeconds } = clock.consume(timestamp);
    const simulationStep = document.hidden ? 0 : advance(simulation, boundedSeconds);
    if (document.hidden) clock.reset();
    view.render(simulation.angleRadians);
    if (timestamp - lastPanelTime >= 100) {
      actualOutput.textContent = (actualSeconds * 1000).toFixed(2);
      stepOutput.textContent = (simulationStep * 1000).toFixed(2);
      displayState();
      lastPanelTime = timestamp;
    }
    frameId = requestAnimationFrame(tick);
  }

  function changeSpeed(input: HTMLInputElement): void {
    if (input.value === '' || !input.validity.valid) return;
    const value = Number(input.value);
    checkSpeed(value);
    simulation.speedDegrees = value;
    speed.value = range.value = String(value);
    result.textContent = `先计算：${value} × 2 = ? 度`;
  }
  speed.addEventListener('input', () => changeSpeed(speed), { signal: events.signal });
  range.addEventListener('input', () => changeSpeed(range), { signal: events.signal });
  camera.addEventListener('change', () => view.setCamera(camera.value as CameraView), { signal: events.signal });
  pause.addEventListener('click', () => {
    simulation.paused = !simulation.paused;
    clock.reset();
    stepOutput.textContent = '0.00';
    displayState();
  }, { signal: events.signal });
  reset.addEventListener('click', () => {
    simulation = createSimulation();
    speed.value = range.value = '45'; camera.value = 'diagonal';
    view.setCamera('diagonal'); clock.reset();
    result.textContent = '已重置：时间 0、角度 0、速度 45、默认视角，自动播放。';
    actualOutput.textContent = stepOutput.textContent = '0.00';
    displayState(); view.render(0);
  }, { signal: events.signal });
  fixed.addEventListener('click', () => {
    const fps = Number(element<HTMLSelectElement>('fps').value);
    simulation = simulateTwoSeconds(simulation.speedDegrees, fps);
    clock.reset(); stepOutput.textContent = '0.00';
    result.textContent = `${fps} 步／秒 × 2 秒：${simulation.simulatedSeconds.toFixed(6)} 秒 → ${toDegrees(simulation.angleRadians).toFixed(6)} 度。已暂停。`;
    displayState(); view.render(simulation.angleRadians);
  }, { signal: events.signal });
  document.addEventListener('visibilitychange', () => clock.reset(), { signal: events.signal });
  view.canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    stopLab?.();
    status.textContent = '图形上下文丢失 · 请重新进入实验';
  }, { signal: events.signal });

  stopLab = () => {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frameId);
    events.abort(); resizeObserver.disconnect(); view.dispose(); clock.reset();
    for (const control of [speed, range, camera, pause, reset, fixed]) control.disabled = true;
    status.textContent = '实验已退出 · 帧任务、监听与图形资源已释放';
    release.hidden = true; restart.hidden = false;
    stepOutput.textContent = '0.00';
    stopLab = undefined;
  };
  frameId = requestAnimationFrame(tick);
}

release.addEventListener('click', () => stopLab?.(), { signal: uiEvents.signal });
restart.addEventListener('click', startLab, { signal: uiEvents.signal });
window.addEventListener('pagehide', () => stopLab?.(), { signal: uiEvents.signal });
window.addEventListener('pageshow', (event) => { if (event.persisted) startLab(); }, { signal: uiEvents.signal });
if (import.meta.hot) import.meta.hot.dispose(() => { stopLab?.(); uiEvents.abort(); });
startLab();
