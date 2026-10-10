import * as THREE from 'three';
import { inspectProjection, inspectTransform, inspectVectors, matrixRows, triple, vector, type ProjectionInput, type SpaceMode, type TransformInput, type Triple } from './space-math.ts';
import { arrow, COLORS, createSpaceView, pointMarker, type WorldLabel } from './space-view.ts';

document.title = '空间数学 · Web3D 实践学习';
const app = document.querySelector<HTMLElement>('#app')!;
app.innerHTML = `
  <header class="page-header">
    <div class="brand"><span class="brand-mark">3D</span> openClasses <span class="separator">/</span> 实践学习</div>
    <nav class="lab-navigation" aria-label="学习实验"><a href="?lab=time">0 场景与时间</a><a href="?lab=space" aria-current="page">1 空间数学</a></nav>
  </header>
  <section class="intro space-intro"><p class="eyebrow">SPACE · PREDICT → OBSERVE → EXPLAIN</p>
    <h1 id="lesson-title">从两个点，找到一个方向。</h1><p class="lead" id="lesson-lead"></p>
  </section>
  <nav class="lesson-tabs" aria-label="空间数学练习">
    <button data-mode="vectors" aria-pressed="true">01 点与向量</button>
    <button data-mode="transforms" aria-pressed="false">02 父子变换</button>
    <button data-mode="projection" aria-pressed="false">03 投影到屏幕</button>
  </nav>
  <section class="lab-layout space-layout" aria-label="空间数学实验">
    <div class="scene-card">
      <div class="scene-toolbar"><span><i class="live-dot"></i> 世界坐标 · XY 网格</span>
        <div><button id="front-view" class="text-button">正面观察</button><button id="orbit-view" class="text-button">斜侧观察</button></div>
      </div>
      <div id="viewport" class="space-viewport"><div class="scene-badge" id="scene-status">拖动旋转 · 滚轮缩放</div>
        <div class="axis-legend"><span class="axis-x">X</span><span class="axis-y">Y</span><span class="axis-z">Z</span><span id="legend"></span></div>
      </div>
      <div class="scene-footer"><span id="scene-caption"></span><button id="release" class="text-button">退出实验</button><button id="restart" class="text-button" hidden>重新进入</button></div>
      <div id="screen-section" hidden><div class="screen-heading">目标相机的屏幕 <span id="screen-size"></span></div><div id="screen-preview"><span class="screen-center">中心</span><span id="screen-point" hidden>P</span></div><p id="screen-status" class="hint screen-status" role="status"></p></div>
    </div>
    <aside class="control-card space-controls"><div class="card-heading"><h2>先改变一个条件</h2><span class="step-number" id="lesson-index">01</span></div>
      <div id="controls"></div><p id="input-error" class="input-error" role="alert" hidden></p>
      <button id="reset" class="full-width">重置本页参数</button><p class="hint">拖动观察视角只改变画面，不改变输入数据。</p>
    </aside>
  </section>
  <section class="practice space-practice"><div class="section-title"><div><p class="eyebrow">ONE CHANGE AT A TIME</p><h2>先手算，再用实验核对</h2></div><span>本次建议 30–45 分钟</span></div>
    <p id="challenge" class="challenge"></p><div id="presets" class="preset-buttons"></div>
    <div id="process" class="process-strip" aria-label="计算过程"></div>
  </section>
  <section class="explanations"><details id="calculation"><summary>展开计算过程，核对你的预测</summary><div id="results" class="math-results"></div></details>
    <details><summary>原理、边界与 Cocos 对照</summary><div id="principle"></div></details>
  </section>
  <section class="notebook"><div class="section-title"><div><p class="eyebrow">YOUR EVIDENCE</p><h2>留下自己的解释</h2></div><span id="save-status" role="status">每页各保存一份记录</span></div>
    <div class="note-grid"><label>1 操作前的预测<textarea id="prediction" placeholder="先写数值和理由，再展开计算。"></textarea></label>
      <label>2 观察结果与输入<textarea id="observation" placeholder="记录改了哪个参数，结果与预测是否相同。"></textarea></label>
      <label>3 原因与仍不确定的问题<textarea id="explanation" placeholder="合上计算过程，用自己的话解释。"></textarea></label></div>
    <div class="note-actions"><label>实际投入（分钟）<input id="minutes" type="number" min="0" max="1440" step="1" value="0"></label><button id="export-note">下载本页学习记录</button></div>
    <p class="small-note">记录自动保存到当前浏览器；需要带走时下载 Markdown。浏览器存储不可用时仍可下载。个人理解按自己的回答验收。</p>
  </section>
  <footer>阶段 1 已开始实践。阶段 0 的两项浏览器边界与个人自测仍待补齐；今天从点与向量开始，按理解情况进入后两页。</footer>
`;

const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const defaults = {
  vectors: () => ({ a: [1, 2, 0] as Triple, b: [4, 6, 0] as Triple, v: [1, 0, 0] as Triple }),
  transforms: (): TransformInput => ({ translation: [2, 0, 0], scale: [1, 1, 1], axis: 'z', degrees: 90, order: 'TRS', child: [1, 0, 0] }),
  projection: (): ProjectionInput => ({ point: [1, 1, 0], translation: [0, 0, 0], distance: 8, kind: 'perspective', fov: 60, near: 1, far: 20, width: 800, height: 400 }),
};
let mode: SpaceMode = 'vectors';
let vectors = defaults.vectors();
let transforms = defaults.transforms();
let projection = defaults.projection();
let view: ReturnType<typeof createSpaceView> | undefined;
let observer: ResizeObserver | undefined;
let viewEvents: AbortController | undefined;
const events = new AbortController();
let resultText = '';
const storageKey = 'openclasses-space-notes-v1';
interface Note { prediction: string; observation: string; explanation: string; minutes: string }
const blankNote = (): Note => ({ prediction: '', observation: '', explanation: '', minutes: '0' });
let notes: Record<SpaceMode, Note> = { vectors: blankNote(), transforms: blankNote(), projection: blankNote() };
try {
  const saved = JSON.parse(localStorage.getItem(storageKey) ?? 'null');
  for (const key of ['vectors', 'transforms', 'projection'] as const) {
    for (const field of ['prediction', 'observation', 'explanation', 'minutes'] as const) {
      if (typeof saved?.[key]?.[field] === 'string') notes[key][field] = saved[key][field];
    }
  }
} catch { el('save-status').textContent = '存储不可用，可下载记录'; }

const fmt = (value: number): string => (Math.abs(value) < 0.0005 ? 0 : value).toFixed(3);
const xyz = (v: { x: number; y: number; z: number }): string => `(${fmt(v.x)}, ${fmt(v.y)}, ${fmt(v.z)})`;
const xyzw = (v: { x: number; y: number; z: number; w: number }): string => `(${fmt(v.x)}, ${fmt(v.y)}, ${fmt(v.z)}, ${fmt(v.w)})`;
const coords = (id: string, label: string, values: Triple, min = -10, max = 10): string => `<fieldset class="coordinate-input"><legend>${label}</legend><div>${['x', 'y', 'z'].map((axis, i) => `<label>${axis.toUpperCase()}<input id="${id}-${axis}" aria-label="${label} ${axis.toUpperCase()}" type="number" min="${min}" max="${max}" step="0.1" value="${values[i]}"></label>`).join('')}</div></fieldset>`;
const numberInput = (id: string, label: string, value: number, min: number, max: number, step = 1): string => `<label class="number-row">${label}<input id="${id}" type="number" min="${min}" max="${max}" step="${step}" value="${value}"></label>`;
function options(id: string, label: string, values: string[][], selected: string): string {
  return `<label class="number-row">${label}<select id="${id}">${values.map(([value, text]) => `<option value="${value}" ${value === selected ? 'selected' : ''}>${text}</option>`).join('')}</select></label>`;
}
const readNumber = (id: string): number => Number(el<HTMLInputElement>(id).value);
const readCoords = (id: string): Triple => [readNumber(`${id}-x`), readNumber(`${id}-y`), readNumber(`${id}-z`)];
function matrixPanel(label: string, matrix: THREE.Matrix4): string {
  return `<div class="matrix-panel"><h3>${label}</h3><pre>${matrixRows(matrix).map(row => row.map(n => fmt(n).padStart(8)).join(' ')).join('\n')}</pre></div>`;
}

function renderControls(): void {
  el('input-error').hidden = true;
  if (mode === 'vectors') {
    el('controls').innerHTML = coords('a', '起点 A（世界位置）', vectors.a) + coords('b', '终点 B（世界位置）', vectors.b) + coords('v', '参考向量 v（世界空间）', vectors.v);
  } else if (mode === 'transforms') {
    el('controls').innerHTML = coords('t', '父变换的平移', transforms.translation) + coords('child', '子节点位置（父空间）', transforms.child) + coords('s', '父变换的缩放', transforms.scale, -3, 3)
      + options('axis', '旋转轴', [['x', 'X'], ['y', 'Y'], ['z', 'Z']], transforms.axis)
      + numberInput('degrees', '旋转角度（度）', transforms.degrees, -180, 180)
      + options('order', '父变换组合', [['TRS', 'T × R × S'], ['RTS', 'R × T × S']], transforms.order);
  } else {
    el('controls').innerHTML = coords('p', '点 P（模型局部位置）', projection.point) + coords('model', '模型平移（世界空间）', projection.translation)
      + options('kind', '投影方式', [['perspective', '透视'], ['orthographic', '正交']], projection.kind)
      + numberInput('distance', '相机 Z（朝向 −Z）', projection.distance, 1, 15)
      + numberInput('fov', '垂直 FOV（度，仅透视）', projection.fov, 20, 100)
      + numberInput('near', 'near（正距离）', projection.near, 0.1, 10, 0.1) + numberInput('far', 'far（正距离）', projection.far, 1, 100);
    el<HTMLInputElement>('fov').disabled = projection.kind === 'orthographic' || !view;
  }
  if (!view) for (const control of el('controls').querySelectorAll<HTMLInputElement | HTMLSelectElement>('input, select')) control.disabled = true;
}

function showRows(rows: string[][], extra = ''): void {
  el('results').innerHTML = `<table class="result-table"><thead><tr><th>步骤与含义</th><th>实际值</th></tr></thead><tbody>${rows.map(([label, value]) => `<tr><th scope="row">${label}</th><td>${value}</td></tr>`).join('')}</tbody></table>${extra}`;
  resultText = rows.map(([label, value]) => `${label}: ${value}`).join('\n');
  if (extra) resultText += '\n\n' + [...el('results').querySelectorAll('.matrix-panel')].map(panel => `${panel.querySelector('h3')?.textContent}\n${panel.querySelector('pre')?.textContent}`).join('\n\n');
}

function updateMath(): void {
  const labels: WorldLabel[] = [];
  const objects: THREE.Object3D[] = [];
  const origin = new THREE.Vector3();
  if (mode === 'vectors') {
    const { a, b, v } = vectors;
    const result = inspectVectors(a, b, v);
    const start = vector(a), end = vector(b);
    objects.push(pointMarker(start, COLORS.point), pointMarker(end, COLORS.destination), arrow(start, result.displacement, COLORS.point), arrow(start, vector(v), COLORS.destination), arrow(start, result.cross, COLORS.cross));
    if (result.unit) objects.push(arrow(start, result.unit, COLORS.direction));
    labels.push({ text: 'A', position: start, color: '#79c9ff' }, { text: 'B', position: end, color: '#ffc56b' });
    if (result.cross.length() > 1e-10) labels.push({ text: 'd × v', position: start.clone().add(result.cross), color: '#77e0ba' });
    showRows([
      ['位移 d = B − A（世界空间）', xyz(result.displacement)], ['距离 |d| = √(dx² + dy² + dz²)', fmt(result.length)],
      ['单位方向 n = d / |d|', result.unit ? xyz(result.unit) : '未定义：A 与 B 重合，零向量没有方向'],
      ['参考向量长度 |v|', fmt(result.referenceLength)], ['点积 d · v = dx·vx + dy·vy + dz·vz', fmt(result.dot)],
      ['cos θ = (d · v) / (|d|·|v|)', result.cosine === null ? '未定义：至少一个输入为零向量' : fmt(result.cosine)],
      ['夹角 θ（度）', result.angleDegrees === null ? '未定义' : fmt(result.angleDegrees)], ['叉积 d × v（世界空间）', xyz(result.cross)],
    ]);
    el('scene-caption').textContent = '参考向量与叉积也从 A 画起；移动箭头起点不改变向量。';
    el('legend').textContent = '蓝 d · 紫单位方向 · 黄 v · 绿叉积';
  } else if (mode === 'transforms') {
    const result = inspectTransform(transforms);
    const parentOrigin = new THREE.Vector3().setFromMatrixPosition(result.parentMatrix);
    const parentAxes = new THREE.AxesHelper(2); parentAxes.matrixAutoUpdate = false; parentAxes.matrix.copy(result.parentMatrix);
    objects.push(parentAxes, pointMarker(parentOrigin, COLORS.destination), pointMarker(result.world, COLORS.point), arrow(parentOrigin, result.world.clone().sub(parentOrigin), COLORS.point));
    labels.push({ text: '父原点', position: parentOrigin, color: '#ffc56b' }, { text: '子节点', position: result.world, color: '#79c9ff' });
    showRows([
      ['子节点局部位置（父空间）', xyz(vector(transforms.child))], ['父变换组合（最右侧先作用）', transforms.order === 'TRS' ? 'T × R × S：先缩放，再旋转，再平移' : 'R × T × S：先缩放，再平移，再旋转'],
      ['世界位置 = M父 × p局部（w=1）', xyz(result.world)], ['方向 (1,0,0,0) 经同一矩阵', xyzw(result.direction)],
      ['旋转四元数 (x,y,z,w)', xyzw(result.quaternion)], ['父矩阵行列式', fmt(result.determinant)],
      ['世界 → 局部 = inverse(M父) × p世界', result.recovered ? xyz(result.recovered) : '不可逆：零缩放使空间维度坍缩，无法唯一恢复'],
    ], `<div class="matrices">${matrixPanel('M父', result.parentMatrix)}${matrixPanel('M子局部（平移）', result.childMatrix)}${matrixPanel('M子世界 = M父 × M子局部', result.worldMatrix)}</div>`);
    el('scene-caption').textContent = '原点处是世界轴；父原点处的局部轴随父变换变化。';
    el('legend').textContent = '蓝子节点 · 黄父原点 · 局部轴随父变换';
  } else {
    const rect = el('viewport').getBoundingClientRect();
    projection.width = Math.max(1, Math.round(rect.width)); projection.height = Math.max(1, Math.round(rect.height));
    const result = inspectProjection(projection);
    const point = new THREE.Vector3(result.world.x, result.world.y, result.world.z);
    objects.push(pointMarker(point, COLORS.point), new THREE.CameraHelper(result.camera), pointMarker(result.camera.position, COLORS.destination), arrow(origin, point, COLORS.point));
    labels.push({ text: 'P世界', position: point, color: '#79c9ff' }, { text: '目标相机', position: result.camera.position.clone(), color: '#ffc56b' });
    showRows([
      ['1 局部坐标（w=1）', xyzw(result.local)], ['2 世界 = M模型 × 局部', xyzw(result.world)], ['3 观察 = V × 世界（相机前方 z<0）', xyzw(result.view)],
      ['4 裁剪 = P × 观察（保留 w）', xyzw(result.clip)], ['5 NDC = (clip.x, y, z) / clip.w', result.ndc ? xyz(result.ndc) : '未定义：|w| ≤ 1e-10'],
      ['6 屏幕 x=(NDC.x+1)W/2，y=(1−NDC.y)H/2', result.screen ? `(${fmt(result.screen.x)}, ${fmt(result.screen.y)}) CSS 像素` : '无屏幕坐标'],
      ['裁剪判断（WebGL NDC 三轴范围 −1 至 +1）', result.status], ['视口 W × H / aspect', `${projection.width} × ${projection.height} / ${fmt(projection.width / projection.height)}`],
    ], `<div class="matrices">${matrixPanel('模型矩阵 M', result.modelMatrix)}${matrixPanel('观察矩阵 V', result.camera.matrixWorldInverse)}${matrixPanel('投影矩阵 P', result.camera.projectionMatrix)}</div>`);
    const preview = el('screen-preview');
    preview.style.aspectRatio = `${projection.width} / ${projection.height}`;
    const marker = el('screen-point'); marker.hidden = !result.visible;
    if (result.screen) { marker.style.left = `${result.screen.x / projection.width * 100}%`; marker.style.top = `${result.screen.y / projection.height * 100}%`; }
    el('screen-size').textContent = `${projection.width} × ${projection.height} CSS 像素（预览按比例缩小）`;
    el('screen-status').textContent = `${result.status}。${projection.kind === 'orthographic' ? '正交上下界固定为 ±3，左右界由 aspect 决定。' : '透视除法保留深度条件，屏幕坐标有值也不一定可见。'}`;
    el('scene-caption').textContent = '上图为旁观视角，线框是目标相机；下图才是目标相机的屏幕。';
    el('legend').textContent = '蓝 P · 黄相机 · 线框为裁剪体';
  }
  view?.setObjects(objects, labels);
  // 图形初始化失败或实验已退出时，不保留刚创建的资源。
  if (!view) {
    const disposable = new THREE.Group(); disposable.add(...objects);
    disposable.traverse(object => {
      const mesh = object as THREE.Mesh;
      mesh.geometry?.dispose();
      if (mesh.material) for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) material.dispose();
    });
  }
}

function loadNote(): void {
  for (const field of ['prediction', 'observation', 'explanation', 'minutes'] as const) el<HTMLInputElement | HTMLTextAreaElement>(field).value = notes[mode][field];
}
function saveNote(): void {
  for (const field of ['prediction', 'observation', 'explanation', 'minutes'] as const) notes[mode][field] = el<HTMLInputElement | HTMLTextAreaElement>(field).value;
  try { localStorage.setItem(storageKey, JSON.stringify(notes)); el('save-status').textContent = '已保存到当前浏览器'; }
  catch { el('save-status').textContent = '存储不可用，请下载记录'; }
}

const lessons = {
  vectors: {
    title: '从两个点，找到一个方向。', lead: '先预测位移和距离，再观察方向。所有输入都在同一个世界坐标系中。',
    challenge: '第一轮：A=(1,2,0)，B=(4,6,0)。先写位移、距离和单位方向。第二轮：用垂直轴，交换叉积输入。第三轮：让 A 与 B 重合，哪些结果不再有定义？',
    presets: [['default', '3–4–5 位移'], ['axes', '垂直轴'], ['swap', '交换 d 与 v'], ['parallel', '同向'], ['opposite', '反向'], ['zero', '重合点']],
    process: ['位置 A、B → B − A', '位移 d → 长度与单位方向', 'd 与 v → 点积、夹角、叉积'],
    principle: '<p>点表示位置；向量表示方向与大小。同一坐标系中的两点相减得到位移。归一化只保留方向，原距离应另存。点积只有除以两向量长度才是余弦；叉积为零可能来自平行输入，也可能来自零输入。</p><p>Three.js Vector3 的 sub / length / normalize / dot / cross 对应仓库 Cocos 3.8.8 Vec3.subtract / len / normalize / dot / cross。Cocos 与 Three.js 的零向量归一化都可返回零值，但它不具备单位方向；本实验明确显示“未定义”。同样的三个分量可以用于点或向量，意义要由使用方式与坐标空间说明。</p><p>只读 <a href="https://www.scratchapixel.com/lessons/mathematics-physics-for-computer-graphics/geometry/points-vectors-and-normals.html" target="_blank" rel="noreferrer">Scratchapixel 的点、向量与长度</a>，遇到运算疑问再查 <a href="https://threejs.org/docs/pages/Vector3.html" target="_blank" rel="noreferrer">Vector3 官方文档</a>。</p>',
  },
  transforms: {
    title: '局部不变，世界位置为什么变了？', lead: '固定子节点局部位置，只改父变换。先预测，再比较世界坐标和矩阵。',
    challenge: '第一轮：子节点在父空间 (1,0,0)，父绕 Z 转 90°，再沿 X 平移 2。先画出世界位置。第二轮：交换 T 与 R 的组合。第三轮：把 X 缩放设为 0，还能唯一回到局部吗？',
    presets: [['default', '旋转后平移'], ['order', '交换组合顺序'], ['scale', '非均匀缩放'], ['singular', '零缩放']],
    process: ['子局部矩阵 M子', 'M父 × M子 → 子世界矩阵', 'inverse(M父) → 回到父空间'],
    principle: '<p>本页使用列向量，矩阵表达式的最右项先作用。M子世界 = M父世界 × M子局部；本实验的父节点直接放在世界中，子节点只使用局部平移。点用 w=1，方向用 w=0；平移改变点，不加到方向上。缩放仍会改变方向向量的长度。</p><p>Quaternion.setFromAxisAngle 的角度使用弧度；面板用度并显示 q 的四个分量。旋转四元数不能直接当作欧拉角；本页先观察单轴旋转。零缩放会使矩阵不可逆；绝对行列式 ≤ 1e-10 时实验停止逆变换。</p><p>Cocos 3.8.8 Node.updateWorldTransform 组合父子变换，Vec3.transformMat4 用于点，transformMat4Normal 使用无平移的方向变换。Three.js 的矩阵数组按列存储，面板转成按行显示。比较时先确认坐标空间与乘法约定。参考 <a href="https://threejs.org/docs/pages/Matrix4.html" target="_blank" rel="noreferrer">Matrix4 官方文档</a>。</p>',
  },
  projection: {
    title: '一个点怎样到达屏幕？', lead: '从局部坐标一路追到 CSS 像素，保留裁剪坐标的 w。目标相机固定朝 −Z，观察相机可自由拖动。',
    challenge: '第一轮：把 P 设为原点，预测屏幕位置。第二轮：使用偏离中心的点，改变相机距离，对比透视与正交。第三轮：把点放到相机平面、后方或近裁剪面之前，屏幕坐标有值就一定能看到吗？',
    presets: [['default', '偏离中心'], ['center', '原点'], ['plane', '相机平面 w=0'], ['behind', '相机后方'], ['near', '近裁剪面之前']],
    process: ['局部 → 模型矩阵 → 世界', '观察矩阵 → 投影矩阵 → 裁剪', '除以 w → NDC → 视口映射'],
    principle: '<p>模型矩阵把局部点放到世界中；观察矩阵是目标相机世界矩阵的逆；投影矩阵产生裁剪坐标。透视除法把 xyz 分别除以 w。本实验是 WebGL：NDC 的 x、y、z 可见范围均为 −1 到 +1，同时需要位于相机前方。</p><p>屏幕坐标以左上为原点，X 向右、Y 向下，单位为当前视口的 CSS 像素；渲染缓冲可因设备像素比更大。结果与下面的缩小屏幕预览一致。上方旁观相机只是辅助观察，不参与这些计算。</p><p>Cocos 3.8.8 Camera 提供投影与 worldToScreen 等转换；迁移到原生后端时需要核对深度范围、屏幕原点及视口约定。这里用 Vector4 保留裁剪 w；Vector3.applyMatrix4 会自动进行透视除法。参考 <a href="https://threejs.org/docs/pages/Vector4.html" target="_blank" rel="noreferrer">Vector4 官方文档</a>。</p>',
  },
};

function selectMode(next: SpaceMode): void {
  saveNote(); mode = next;
  const lesson = lessons[mode];
  el('lesson-title').textContent = lesson.title; el('lesson-lead').textContent = lesson.lead;
  el('lesson-index').textContent = mode === 'vectors' ? '01' : mode === 'transforms' ? '02' : '03';
  el('challenge').textContent = lesson.challenge; el('principle').innerHTML = lesson.principle;
  el('process').innerHTML = lesson.process.map((step, i) => `<div><span>0${i + 1}</span>${step}</div>`).join('');
  el('presets').innerHTML = lesson.presets.map(([id, title]) => `<button data-preset="${id}">${title}</button>`).join('');
  if (!view) for (const button of el('presets').querySelectorAll<HTMLButtonElement>('button')) button.disabled = true;
  el('screen-section').hidden = mode !== 'projection'; el<HTMLDetailsElement>('calculation').open = false;
  document.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mode === mode)));
  renderControls(); loadNote(); updateMath();
}

function preset(id: string): void {
  if (mode === 'vectors') {
    if (id === 'swap') { const d = vector(vectors.b).sub(vector(vectors.a)); vectors.b = triple(vector(vectors.a).add(vector(vectors.v))); vectors.v = triple(d); }
    else if (id === 'zero') vectors.b = [...vectors.a];
    else if (id === 'default') vectors = defaults.vectors();
    else vectors = { a: [0, 0, 0], b: [1, 0, 0], v: id === 'axes' ? [0, 1, 0] : id === 'parallel' ? [2, 0, 0] : [-1, 0, 0] };
  } else if (mode === 'transforms') {
    if (id === 'default') transforms = defaults.transforms();
    if (id === 'order') transforms.order = transforms.order === 'TRS' ? 'RTS' : 'TRS';
    if (id === 'scale') transforms = { ...defaults.transforms(), scale: [2, 3, 1], child: [1, 2, 0] };
    if (id === 'singular') transforms.scale = [0, 1, 1];
  } else {
    projection = defaults.projection();
    if (id === 'center') projection.point = [0, 0, 0];
    if (id === 'plane') projection.point = [0, 0, 8];
    if (id === 'behind') projection.point = [0, 0, 9];
    if (id === 'near') projection.point = [0, 0, 7.5];
  }
  renderControls(); updateMath();
}

function readControls(): void {
  const inputs = [...el('controls').querySelectorAll<HTMLInputElement>('input')];
  if (inputs.some(input => input.value === '' || !input.validity.valid)) {
    el('input-error').textContent = '请输入范围内的有效数值；画面保留上一次有效输入。'; el('input-error').hidden = false; return;
  }
  if (mode === 'vectors') vectors = { a: readCoords('a'), b: readCoords('b'), v: readCoords('v') };
  else if (mode === 'transforms') transforms = { translation: readCoords('t'), child: readCoords('child'), scale: readCoords('s'), axis: el<HTMLSelectElement>('axis').value as TransformInput['axis'], degrees: readNumber('degrees'), order: el<HTMLSelectElement>('order').value as TransformInput['order'] };
  else {
    if (readNumber('far') <= readNumber('near')) { el('input-error').textContent = 'far 必须大于 near；画面保留上一次有效输入。'; el('input-error').hidden = false; return; }
    projection = { ...projection, point: readCoords('p'), translation: readCoords('model'), distance: readNumber('distance'), kind: el<HTMLSelectElement>('kind').value as ProjectionInput['kind'], fov: readNumber('fov'), near: readNumber('near'), far: readNumber('far') };
    el<HTMLInputElement>('fov').disabled = projection.kind === 'orthographic';
  }
  el('input-error').hidden = true; updateMath();
}

function stopView(): void {
  viewEvents?.abort(); observer?.disconnect(); view?.dispose(); view = undefined;
  el('scene-status').textContent = '已退出：观察控制、监听与图形资源已释放';
  el('release').hidden = true; el('restart').hidden = false;
  for (const control of app.querySelectorAll<HTMLInputElement | HTMLButtonElement | HTMLSelectElement>('#controls input, #controls select, #presets button, #reset, #front-view, #orbit-view')) control.disabled = true;
}
function startView(): void {
  if (view) return;
  el('viewport').querySelector('.error-panel')?.remove();
  try { view = createSpaceView(el('viewport')); }
  catch (error) {
    const panel = document.createElement('div'); panel.className = 'error-panel';
    panel.textContent = `${error instanceof Error ? error.message : '图形初始化失败'} 请检查 WebGL2 或换桌面浏览器重试；下方原理和学习记录仍可使用。`;
    el('viewport').append(panel); stopView(); return;
  }
  viewEvents = new AbortController();
  view.canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); stopView(); el('scene-status').textContent = '图形上下文丢失，可重新进入'; }, { signal: viewEvents.signal });
  observer = new ResizeObserver(() => { view?.resize(); if (mode === 'projection' && view) updateMath(); }); observer.observe(el('viewport'));
  el('scene-status').textContent = '拖动旋转 · 滚轮缩放'; el('release').hidden = false; el('restart').hidden = true;
  for (const control of app.querySelectorAll<HTMLButtonElement>('#presets button, #reset, #front-view, #orbit-view')) control.disabled = false;
  renderControls(); updateMath();
}

app.addEventListener('click', event => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button');
  if (!button || button.disabled) return;
  if (button.dataset.mode) selectMode(button.dataset.mode as SpaceMode);
  if (button.dataset.preset) preset(button.dataset.preset);
}, { signal: events.signal });
el('controls').addEventListener('input', readControls, { signal: events.signal });
el('reset').addEventListener('click', () => { if (mode === 'vectors') vectors = defaults.vectors(); else if (mode === 'transforms') transforms = defaults.transforms(); else projection = defaults.projection(); view?.resetCamera(); renderControls(); updateMath(); }, { signal: events.signal });
el('front-view').addEventListener('click', () => view?.resetCamera(true), { signal: events.signal });
el('orbit-view').addEventListener('click', () => view?.resetCamera(), { signal: events.signal });
el('release').addEventListener('click', stopView, { signal: events.signal });
el('restart').addEventListener('click', startView, { signal: events.signal });
for (const field of ['prediction', 'observation', 'explanation', 'minutes']) el(field).addEventListener('input', saveNote, { signal: events.signal });
el('export-note').addEventListener('click', () => {
  saveNote(); const note = notes[mode];
  const input = mode === 'vectors' ? vectors : mode === 'transforms' ? transforms : projection;
  const recordedAt = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false });
  const content = `# 空间数学学习记录：${lessons[mode].title}\n\n记录时间（Asia/Shanghai）：${recordedAt}\n实际投入：${note.minutes} 分钟\n个人理解：待验收\n\n## 输入\n\n\`\`\`json\n${JSON.stringify(input, null, 2)}\n\`\`\`\n\n## 我的预测\n\n${note.prediction}\n\n## 我的观察\n\n${note.observation}\n\n## 我的解释与问题\n\n${note.explanation}\n\n## 实验计算快照\n\n\`\`\`text\n${resultText}\n\`\`\`\n`;
  const url = URL.createObjectURL(new Blob([content], { type: 'text/markdown;charset=utf-8' }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = `stage-01-${mode}-record.md`; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}, { signal: events.signal });
window.addEventListener('pagehide', stopView, { signal: events.signal });
window.addEventListener('pageshow', event => { if (event.persisted) startView(); }, { signal: events.signal });
if (import.meta.hot) import.meta.hot.dispose(() => { stopView(); events.abort(); });
// 先加载保存的记录，避免首次切页用空表单覆盖历史记录。
loadNote(); selectMode('vectors'); startView();
