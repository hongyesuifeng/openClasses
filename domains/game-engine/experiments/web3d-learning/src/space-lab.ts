import * as THREE from 'three';
import { inspectProjection, inspectTransform, inspectVectors, vector, type ProjectionInput, type SpaceMode, type TransformInput } from './space-math.ts';
import { arrow, COLORS, createSpaceView, pointMarker } from './space-view.ts';

document.title = '看动画懂空间 · openClasses';
const app = document.querySelector<HTMLElement>('#app')!;
app.innerHTML = `
  <header class="page-header"><div class="brand"><span class="brand-mark">3D</span> openClasses <span class="separator">/</span> 原理演示</div>
    <nav class="lab-navigation" aria-label="学习实验"><a href="?lab=time">0 场景与时间</a><a href="?lab=space" aria-current="page">1 空间数学</a><a href="?lab=motion">2 场景与运动</a></nav></header>
  <section class="intro demo-intro"><p class="eyebrow">看变化 · 懂原理</p><h1>让动画把空间讲清楚。</h1><p class="lead">点一个演示，看发生了什么，再看旁边的一句解释。</p></section>
  <nav class="lesson-tabs" aria-label="演示主题"><button data-topic="vectors" aria-pressed="true">点与箭头</button><button data-topic="transforms" aria-pressed="false">托盘与小球</button><button data-topic="projection" aria-pressed="false">相机与画面</button></nav>
  <section class="demo-layout"><div class="demo-card">
    <div class="demo-toolbar"><span id="demo-label"></span><button id="toggle-animation" class="text-button">暂停动画</button></div>
    <div id="diagram" class="principle-diagram"></div>
    <div class="demo-takeaway" id="takeaway" role="status"></div>
    <div class="demo-actions"><button id="action" class="primary"></button><button id="replay">再看一次</button></div>
  </div><aside class="demo-guide"><p class="eyebrow">一个演示，只讲一件事</p><h2 id="story-title"></h2><p id="story-explanation"></p><nav id="story-list" aria-label="选择一个原理"></nav></aside></section>
  <section class="demo-connection"><span>放进游戏里</span><p id="game-example"></p></section>
  <section class="explanations demo-details"><details id="spatial-view"><summary>想换个角度看：打开 3D 观察（可选）</summary><div id="viewport" class="space-viewport"><div class="scene-badge">拖动旋转 · 滚轮缩放</div></div><p class="hint">这是同一原理的空间示意；动画负责讲过程，3D 画面显示一种对应状态。</p></details>
    <details><summary>想深入时：公式、边界和 Cocos 对照（可选）</summary><div id="deeper"></div></details></section>
  <footer>跟着动画看即可；资料和公式需要时再展开。</footer>
`;

const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
interface Story { id: string; label: string; title: string; explanation: string; takeaway: string; action: string; changed: string; game: string }
const stories: Record<SpaceMode, Story[]> = {
  vectors: [
    { id: 'route', label: '点与箭头', title: '点是位置，箭头是路线。', explanation: '蓝点是出发点，橙点是目的地。连接它们的箭头，把“往哪走”和“走多远”放在一起。白色光点沿箭头移动，帮助你看清方向。', takeaway: '点告诉你在哪里；向量告诉你往哪走、走多远。', action: '把目的地拉远', changed: '目的地变远了，箭头变长了：需要走的距离增加。', game: '角色的位置是一个点；从角色指向目标的箭头，就是追踪目标的位移。' },
    { id: 'move', label: '一起搬走', title: '位置变了，路线可以不变。', explanation: '动画把两个点连同箭头一起搬走。两个点都换了位置，但箭头始终保持同一个方向和长度。', takeaway: '同时移动两个点，不会改变它们之间的位移。', action: '换一条路线', changed: '现在两点之间的路线换了；一起搬动时，新路线依然保持不变。', game: '把一组物体整体平移，它们彼此之间的距离和相对方向保持不变。' },
    { id: 'unit', label: '只保留方向', title: '把“方向”和“距离”分开。', explanation: '灰色长箭头是原来的路线。彩色箭头沿同一方向缩短到一个单位长，只留下“往哪走”，不再携带原来的距离。这叫归一化。', takeaway: '归一化保留方向，去掉原来的长度信息。', action: '反过来看看', changed: '换成反方向后，仍然只保留方向，彩色箭头最终一样长。', game: '知道方向以后，再乘上移动速度，就能控制角色每秒走多远。' },
    { id: 'dot', label: '比较朝向', title: '两条箭头，朝向一致吗？', explanation: '黄箭头依次转到同向、垂直和反向。点积把这个关系变成一个数：同向时为正，垂直时为零，反向时为负。这里保持两条箭头长度不变。', takeaway: '点积帮助判断方向关系；长度也会影响它的大小。', action: '切到反向起点', changed: '先从反向开始观察，再看它转回垂直、同向。', game: '判断敌人在角色前方还是后方，可以比较视线方向和目标方向。' },
    { id: 'cross', label: '得到垂直方向', title: '从两条箭头，得到第三个方向。', explanation: '蓝箭头向右，黄箭头向上。蓝叉黄得到垂直屏幕、朝向你的方向。交换顺序后，方向变成远离你。圆点表示朝向你，叉号表示远离你。', takeaway: '叉积给出垂直方向；交换顺序会把方向反过来。', action: '交换两条箭头的顺序', changed: '顺序已交换：垂直方向反过来，变成远离你。', game: '用两个不平行的方向，可以确定一个平面的朝向，例如地面的法线。' },
  ],
  transforms: [
    { id: 'carry', label: '跟着一起移动', title: '父物体像托盘，子物体像小球。', explanation: '托盘移动时，小球跟着走。小球在整个世界里的位置变了，但它在托盘里的位置一直没变。托盘的参考点用橙色标出。', takeaway: '局部位置：相对托盘；世界位置：相对整个场景。', action: '让托盘往另一边走', changed: '换了移动方向，小球还是待在托盘里的同一处。', game: '角色带着手里的武器移动；武器相对角色的位置可以保持不变。' },
    { id: 'rotate', label: '跟着一起转动', title: '父物体转动，也会带着子物体转。', explanation: '小球始终固定在托盘上。托盘绕自己的橙色参考点旋转，小球在世界中沿圆弧走，但它在托盘里的位置保持不变。', takeaway: '父变换会影响子物体在世界中的位置。', action: '换个旋转方向', changed: '换成反方向旋转，小球仍然跟着托盘一起转。', game: '角色转身时，手中的武器和身上的挂件会跟着转身。' },
    { id: 'order', label: '先后顺序', title: '先转再搬，和先搬再转，结果不同。', explanation: '从同一个蓝点出发，两条路径代表两种顺序。“转动”都绕世界原点，“搬动”都向右。改变先后顺序，最终落点就不同。白色光点展示过程。', takeaway: '变换顺序会改变结果，矩阵只是把这个过程记下来。', action: '突出另一条路径', changed: '另一条路径被突出：先向右移动，再绕原点转动。', game: '镜头先绕目标旋转再偏移，和先偏移再绕原点旋转，位置会不同。' },
  ],
  projection: [
    { id: 'perspective', label: '透视：近大远小', title: '一样大的物体，为什么看起来大小不同？', explanation: '左边是空间侧面示意：两个球一样大。右边是相机画面：近球看起来更大。动画让相机靠近、远离，你会看到这个大小关系继续变化。', takeaway: '透视把距离变成画面大小的差异：近大远小。', action: '换成正交投影', changed: '正交投影：一样大的两个球，在画面里一样大；距离不再造成缩放。', game: '普通 3D 视角常用透视；等距地图或编辑工具可以用正交视角。' },
    { id: 'behind', label: '相机的前方', title: '镜头有朝向，看不到身后的物体。', explanation: '绿色区域是镜头前方。蓝球移到相机身后时，右边画面里的球消失。球仍在世界里，只是镜头没有看向它。', takeaway: '物体存在于世界中，不代表它一定出现在相机画面里。', action: '把球留在镜头前方', changed: '球留在镜头前方，可以出现在相机画面里。', game: '调整镜头时，角色可能离开画面；这不代表角色被删除了。' },
  ],
};
let topic: SpaceMode = 'vectors';
let storyIndex = 0;
let changed = false;
let paused = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const events = new AbortController();
let view: ReturnType<typeof createSpaceView> | undefined;
let observer: ResizeObserver | undefined;
let viewEvents: AbortController | undefined;
const current = () => stories[topic][storyIndex];
const fmt = (n: number) => (Math.abs(n) < 0.0005 ? 0 : n).toFixed(3);
const xyz = (v: { x: number; y: number; z: number }) => `(${fmt(v.x)}, ${fmt(v.y)}, ${fmt(v.z)})`;
const px = (x: number) => 300 + x * 60;
const py = (y: number) => 250 - y * 60;
const colors = { blue: '#3184af', orange: '#ce852c', purple: '#8267bf', green: '#258c72', muted: '#acbbc3' };
const svgText = (x: number, y: number, text: string, color = '#506b7a', anchor = 'middle') => `<text x="${x}" y="${y}" fill="${color}" text-anchor="${anchor}">${text}</text>`;
const segment = (x1: number, y1: number, x2: number, y2: number, color: string, dashed = false) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="4" ${dashed ? 'stroke-dasharray="7 7"' : ''} marker-end="url(#${color === colors.orange ? 'orange' : color === colors.green ? 'green' : color === colors.muted ? 'muted' : 'blue'})"/>`;
const dot = (x: number, y: number, color: string, radius = 10) => `<circle cx="${x}" cy="${y}" r="${radius}" fill="${color}" stroke="white" stroke-width="3"/>`;
const motionDot = (path: string, seconds = 4) => `<circle r="6" fill="white" stroke="${colors.blue}" stroke-width="2"><animateMotion path="${path}" dur="${seconds}s" repeatCount="indefinite"/></circle>`;
const slide = (values: string, duration = 4) => `<animateTransform attributeName="transform" type="translate" values="${values}" dur="${duration}s" repeatCount="indefinite"/>`;
const svg = (body: string, caption: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 420" role="img" aria-label="${current().title}"><defs>${['blue', 'orange', 'green', 'muted'].map(name => `<marker id="${name}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="${colors[name as keyof typeof colors]}"/></marker>`).join('')}<pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M 30 0 L 0 0 0 30" fill="none" stroke="#e3edf0" stroke-width="1"/></pattern></defs><rect width="680" height="370" fill="url(#grid)"/><line x1="30" y1="370" x2="650" y2="370" stroke="#dce7ec"/>${body}${svgText(340, 402, caption, '#315566')}</svg>`;

function vectorDiagram(): string {
  const id = current().id;
  if (id === 'cross') {
    const sign = changed ? '⊗' : '⊙';
    return svg(segment(290, 220, 470, 220, changed ? colors.orange : colors.blue) + segment(290, 220, 290, 65, changed ? colors.blue : colors.orange)
      + `<circle cx="290" cy="220" r="25" fill="#eef8f4" stroke="${colors.green}" stroke-width="3"/><text x="290" y="233" text-anchor="middle" fill="${colors.green}" style="font-size:38px">${sign}</text><circle cx="290" cy="220" r="32" fill="none" stroke="${colors.green}" opacity=".5"><animate attributeName="r" values="28;42;28" dur="2s" repeatCount="indefinite"/></circle>`
      + svgText(486, 255, changed ? '第二条' : '第一条') + svgText(290, 48, changed ? '第一条' : '第二条') + svgText(455, 130, changed ? '远离你 ⊗' : '朝向你 ⊙', colors.green), '叉积方向垂直屏幕；交换顺序，方向反过来。');
  }
  if (id === 'dot') {
    const angles = changed ? '180;90;0;90;180' : '0;90;180;90;0';
    return svg(segment(240, 220, 440, 220, colors.blue) + `<g transform="translate(240 220)"><g>${segment(0, 0, 180, 0, colors.orange)}<animateTransform attributeName="transform" type="rotate" values="${angles}" dur="6s" repeatCount="indefinite"/></g></g>`
      + dot(240, 220, colors.blue) + svgText(450, 250, '蓝箭头固定', colors.blue) + svgText(250, 75, '黄箭头转动', colors.orange)
      + svgText(345, 318, '同向 → 垂直 → 反向'), '点积：同向为正，垂直为零，反向为负。');
  }
  const a = new THREE.Vector3(-2, -1, 0);
  const b = id === 'route' && changed ? new THREE.Vector3(3, 2, 0) : new THREE.Vector3(1, 1, 0);
  if (id === 'move' && changed) b.set(1, 2, 0);
  const d = b.clone().sub(a);
  let body = '';
  if (id === 'unit') {
    const sign = changed ? -1 : 1;
    const unit = d.clone().normalize().multiplyScalar(sign);
    const x = 300, y = 180, endX = x + unit.x * 60, endY = y - unit.y * 60;
    const originalX = x + d.x * sign * 60, originalY = y - d.y * sign * 60;
    body = segment(x, y, originalX, originalY, colors.muted, true) + `<line x1="${x}" y1="${y}" x2="${originalX}" y2="${originalY}" stroke="${colors.blue}" stroke-width="5" marker-end="url(#blue)"><animate attributeName="x2" values="${originalX};${endX};${endX};${originalX}" dur="5s" repeatCount="indefinite"/><animate attributeName="y2" values="${originalY};${endY};${endY};${originalY}" dur="5s" repeatCount="indefinite"/></line>` + dot(x, y, colors.blue)
      + svgText(420, 90, '灰色：原来的长度', '#899aa3') + svgText(420, 125, '彩色：缩成一个单位长', colors.blue);
  } else {
    body = segment(px(a.x), py(a.y), px(b.x), py(b.y), colors.blue) + dot(px(a.x), py(a.y), colors.blue) + dot(px(b.x), py(b.y), colors.orange)
      + svgText(px(a.x), py(a.y) + 32, '出发点 A', colors.blue) + svgText(px(b.x), py(b.y) - 23, '目的地 B', colors.orange);
    if (id === 'move') body = `<g>${body}${slide('0 0;130 -35;130 -35;0 0')}</g>`;
    else body += motionDot(`M ${px(a.x)} ${py(a.y)} L ${px(b.x)} ${py(b.y)}`);
  }
  return svg(body, id === 'move' ? '点的位置变了，箭头的方向和长度没变。' : id === 'unit' ? '方向保持不变，原来的距离信息被去掉。' : '箭头同时表达方向和距离，这就是位移向量。');
}

function transformDiagram(): string {
  const id = current().id;
  if (id === 'order') {
    const start = `${px(1.5)} ${py(0)}`;
    const first = `M ${start} A 90 90 0 0 0 ${px(0)} ${py(1.5)} L ${px(1.8)} ${py(1.5)}`;
    const second = `M ${start} L ${px(3.3)} ${py(0)} A 198 198 0 0 0 ${px(0)} ${py(3.3)}`;
    return svg(`<path d="${first}" fill="none" stroke="${colors.blue}" stroke-width="${changed ? 3 : 5}" opacity="${changed ? '.4' : '1'}"/><path d="${second}" fill="none" stroke="${colors.orange}" stroke-width="${changed ? 5 : 3}" opacity="${changed ? '1' : '.4'}"/>`
      + dot(px(1.5), py(0), colors.blue) + dot(px(1.8), py(1.5), colors.blue) + dot(px(0), py(3.3), colors.orange) + motionDot(changed ? second : first, 5)
      + svgText(px(0), py(0) + 32, '世界原点') + `<circle cx="${px(0)}" cy="${py(0)}" r="4" fill="#617c8b"/>`
      + svgText(505, 177, '先转，再向右搬', colors.blue) + svgText(300, 30, '先向右搬，再转', colors.orange), '同样的两件事，先后顺序不同，最后落点不同。');
  }
  const tray = `<rect x="-28" y="-50" width="180" height="100" rx="15" fill="#fff1dc" stroke="${colors.orange}" stroke-width="3"/>${dot(0, 0, colors.orange, 7)}${dot(90, 0, colors.blue, 16)}${segment(12, 0, 69, 0, colors.blue, true)}`;
  let moving = '';
  if (id === 'carry') moving = `<g>${tray}${slide(changed ? '0 0;-100 45;-100 45;0 0' : '0 0;120 -45;120 -45;0 0', 5)}</g>`;
  else moving = `<g>${tray}<animateTransform attributeName="transform" type="rotate" values="0;${changed ? '90' : '-90'};${changed ? '90' : '-90'};0" dur="5s" repeatCount="indefinite"/></g>`;
  return svg(`<path d="M 60 325 H 620" stroke="#cbdce3" stroke-width="2"/>${svgText(92, 348, '整个场景')}`
    + `<g transform="translate(280 210)">${moving}</g>` + svgText(145, 65, '橙色：托盘（父）', colors.orange) + svgText(145, 95, '蓝色：小球（子）', colors.blue)
    + svgText(390, 315, '小球一直待在托盘里的同一处'), id === 'carry' ? '世界位置在变，相对托盘的位置没变。' : '托盘转动，小球跟着转；相对托盘的位置没变。');
}

const projectionInput = (distance: number, kind: ProjectionInput['kind'], point: ProjectionInput['point']): ProjectionInput => ({ point, translation: [0, 0, 0], distance, kind, fov: 60, near: 1, far: 20, width: 250, height: 220 });
function projectionDiagram(): string {
  const behind = current().id === 'behind';
  const kind = changed && !behind ? 'orthographic' : 'perspective';
  const screenX = 395, screenY = 85;
  let body = svgText(160, 38, '空间中的侧面示意') + svgText(520, 38, '相机看到的画面')
    + `<path d="M 44 92 L 335 92 L 335 278 L 44 278" fill="#edf7f3"/><rect x="${screenX}" y="${screenY}" width="250" height="220" rx="12" fill="#f1f6f9" stroke="#cbdce3"/>`
    + `<g><path d="M 72 180 L 110 165 L 110 205 L 72 190 Z" fill="#506d7c"/><rect x="45" y="169" width="35" height="30" rx="6" fill="#506d7c"/>${svgText(77, 231, '相机')}${behind ? '' : slide('0 0;32 0;32 0;0 0', 5)}</g>`;
  if (behind) {
    body += `<circle cx="230" cy="145" r="17" fill="${colors.blue}">${changed ? '' : '<animate attributeName="cx" values="230;25;25;230" dur="5s" repeatCount="indefinite"/>'}</circle>${svgText(214, 320, '镜头朝右，绿色是前方')}`;
    const result = inspectProjection(projectionInput(8, 'perspective', [0, 0, changed ? 0 : 9]));
    body += `<circle cx="520" cy="195" r="23" fill="${colors.blue}" ${changed ? '' : 'opacity="1"'}>${changed ? '' : '<animate attributeName="opacity" values="1;0;0;1" dur="5s" repeatCount="indefinite"/>'}</circle>`;
    // 示意动画中的球穿过相机位置；数学边界在深入面板使用精确输入计算。
    el('deeper').innerHTML = `<p>镜头前方才可能进入画面，此外还要通过裁剪判断。固定输入对照：相机 z=8，球的 z=${changed ? 0 : 9}，结果是${result.status}。透视投影在相机平面上 w=0，不能进行透视除法。</p><p>Cocos Camera 的投影和 worldToScreen 也要结合相机朝向、视口与图形后端约定解释。</p>`;
  } else {
    body += dot(180, 165, colors.blue, 17) + dot(300, 218, colors.orange, 17) + svgText(180, 120, '近球', colors.blue) + svgText(300, 270, '远球', colors.orange)
      + `<line x1="116" y1="182" x2="173" y2="153" stroke="#aac2cc" stroke-width="2" stroke-dasharray="5 5"><animate attributeName="x1" values="116;148;148;116" dur="5s" repeatCount="indefinite"/></line><line x1="116" y1="182" x2="294" y2="230" stroke="#aac2cc" stroke-width="2" stroke-dasharray="5 5"><animate attributeName="x1" values="116;148;148;116" dur="5s" repeatCount="indefinite"/></line>${svgText(175, 330, '两个球，实际一样大')}`;
    const distances = [8, 6, 6, 8];
    for (const [point, color] of [[[-1, 0, 2], colors.blue], [[1, 0, -2], colors.orange]] as const) {
      const samples = distances.map(distance => {
        const center = inspectProjection(projectionInput(distance, kind, [...point]));
        const edge = inspectProjection(projectionInput(distance, kind, [point[0] + 0.85, point[1], point[2]]));
        return { x: screenX + center.screen!.x, radius: Math.abs(edge.screen!.x - center.screen!.x) };
      });
      body += `<circle cx="${samples[0].x}" cy="195" r="${samples[0].radius}" fill="${color}" stroke="white" stroke-width="3"><animate attributeName="cx" values="${samples.map(value => value.x).join(';')}" dur="5s" repeatCount="indefinite"/><animate attributeName="r" values="${samples.map(value => value.radius).join(';')}" dur="5s" repeatCount="indefinite"/></circle>`;
    }
    el('deeper').innerHTML = `<p>相机距离在 8 和 6 之间变化。两个球的中心分别取 (-1,0,2) 与 (1,0,-2)，示意半径都为 0.85；用中心和同深度边缘点的投影示意大小。透视里，偏移和大小会随深度缩放；正交里，两者不因距离缩放。</p><p>完整过程：局部坐标 → 世界坐标 → 观察坐标 → 裁剪坐标 → 除以 w → NDC → 屏幕。这里使用 WebGL，NDC 的三轴可见范围均为 −1 至 +1；屏幕 Y 向下。Cocos 的对应入口是 Camera 投影与 worldToScreen，迁移时核对图形后端约定。</p>`;
  }
  return svg(body, behind ? '球移到镜头身后，世界里还存在，画面里却看不到。' : kind === 'perspective' ? '透视：两个球实际一样大，近球看起来更大。' : '正交：一样大的两个球，不因距离改变画面大小。');
}

function update(): void {
  const story = current();
  el('demo-label').textContent = story.label;
  el('story-title').textContent = story.title;
  el('story-explanation').textContent = changed && story.id === 'perspective'
    ? '现在换成正交投影。两个球在画面里一样大，相机靠近、远离时也不因距离缩放。它适合需要稳定大小关系的画面。'
    : story.explanation;
  el('takeaway').textContent = changed ? story.changed : story.takeaway;
  el('game-example').textContent = story.game;
  el('action').textContent = changed ? '恢复原来的演示' : story.action;
  el('diagram').innerHTML = topic === 'vectors' ? vectorDiagram() : topic === 'transforms' ? transformDiagram() : projectionDiagram();
  if (topic === 'vectors') {
    const r = inspectVectors([-2, -1, 0], [1, 1, 0], [1, 0, 0]);
    el('deeper').innerHTML = `<p>两点相减得到位移 d=B−A，长度给出距离，d/|d| 给出单位方向。例如本页基本路线的 d=${xyz(r.displacement)}，距离 ${fmt(r.length)}。这组数值只供对照，理解动画即可。</p><p>零向量没有单位方向；点积与向量长度有关，除以两向量长度才是夹角余弦。叉积为零可能因为平行，也可能因为存在零输入。本页叉积示意约定 X 向右、Y 向上、+Z 朝向你。</p><p>Cocos 3.8.8 Vec3.subtract、len、normalize、dot、cross 对应这些运算；库返回零向量不等于获得了一个有效单位方向。</p>`;
  } else if (topic === 'transforms') {
    const input: TransformInput = { translation: [1.8, 0, 0], scale: [1, 1, 1], axis: 'z', degrees: 90, order: changed && story.id === 'order' ? 'RTS' : 'TRS', child: [1.5, 0, 0] };
    const r = inspectTransform(input);
    el('deeper').innerHTML = `<p>局部位置以父物体为参考，世界位置以整个场景为参考。父矩阵 × 子局部矩阵 = 子世界矩阵。使用列向量时，最右边的变换先作用。</p><p>顺序示例：两条路径分别得到世界位置 (1.8,1.5,0) 与 (0,3.3,0)。按所选乘法顺序，这组示例的结果是 ${xyz(r.world)}。零缩放会丢失一个维度，不能唯一恢复原位置。</p><p>Cocos Node.updateWorldTransform 组织父子变换；Quat 与 Mat4 记录旋转和变换，原理仍然是物体如何移动、转动、缩放。</p>`;
  }
  el('story-list').innerHTML = stories[topic].map((item, index) => `<button data-story="${index}" aria-pressed="${index === storyIndex}"><span>0${index + 1}</span>${item.label}</button>`).join('');
  for (const button of app.querySelectorAll<HTMLButtonElement>('[data-topic]')) button.setAttribute('aria-pressed', String(button.dataset.topic === topic));
  applyPause(); update3D();
}
function applyPause(): void {
  const diagram = el('diagram').querySelector('svg')!;
  if (paused) diagram.pauseAnimations(); else diagram.unpauseAnimations();
  el('toggle-animation').textContent = paused ? '播放动画' : '暂停动画';
}
function stop3D(): void { viewEvents?.abort(); observer?.disconnect(); view?.dispose(); view = undefined; }
function update3D(): void {
  if (!view) return;
  if (topic === 'vectors') {
    const a = vector([-2, -1, 0]), b = vector([1, 1, 0]);
    if (changed && current().id === 'route') b.set(3, 2, 0);
    if (current().id === 'move') { if (changed) b.set(1, 2, 0); a.x += 1.5; b.x += 1.5; }
    const d = b.clone().sub(a);
    if (current().id === 'unit') d.normalize().multiplyScalar(changed ? -1 : 1);
    const objects: THREE.Object3D[] = [pointMarker(a, COLORS.point), pointMarker(b, COLORS.destination), arrow(a, d, COLORS.point)];
    if (current().id === 'cross') { const u = new THREE.Vector3(changed ? 0 : 2, changed ? 2 : 0, 0), v = new THREE.Vector3(changed ? 2 : 0, changed ? 0 : 2, 0); objects.splice(0, objects.length, arrow(new THREE.Vector3(), u, COLORS.point), arrow(new THREE.Vector3(), v, COLORS.destination), arrow(new THREE.Vector3(), u.clone().cross(v), COLORS.cross)); }
    if (current().id === 'dot') objects.splice(0, objects.length, arrow(new THREE.Vector3(), new THREE.Vector3(2, 0, 0), COLORS.point), arrow(new THREE.Vector3(), new THREE.Vector3(changed ? -1.8 : 1.8, 0, 0), COLORS.destination));
    view.setObjects(objects, []);
  } else if (topic === 'transforms') {
    const id = current().id;
    const r = inspectTransform({ translation: [changed && id === 'carry' ? -1.8 : 1.8, 0, 0], scale: [1, 1, 1], axis: 'z', degrees: id === 'rotate' ? changed ? -90 : 90 : id === 'order' ? 90 : 0, order: changed && id === 'order' ? 'RTS' : 'TRS', child: [1.5, 0, 0] });
    const axes = new THREE.AxesHelper(2); axes.matrixAutoUpdate = false; axes.matrix.copy(r.parentMatrix);
    view.setObjects([axes, pointMarker(r.world, COLORS.point)], [{ text: '小球', position: r.world, color: '#79c9ff' }]);
  } else {
    const r = inspectProjection(projectionInput(8, changed && current().id !== 'behind' ? 'orthographic' : 'perspective', [0, 0, current().id === 'behind' && !changed ? 9 : 0]));
    if (current().id === 'behind') {
      const p = new THREE.Vector3(r.world.x, r.world.y, r.world.z);
      view.setObjects([new THREE.CameraHelper(r.camera), pointMarker(p, COLORS.point)], [{ text: '物体', position: p, color: '#79c9ff' }]);
    } else {
      const near = new THREE.Vector3(-1, 0, 2), far = new THREE.Vector3(1, 0, -2);
      view.setObjects([new THREE.CameraHelper(r.camera), pointMarker(near, COLORS.point), pointMarker(far, COLORS.destination)], [{ text: '近球', position: near, color: '#79c9ff' }, { text: '远球', position: far, color: '#ce852c' }]);
    }
  }
}
function start3D(): void {
  if (view) return;
  el('viewport').querySelector('.error-panel')?.remove();
  try { view = createSpaceView(el('viewport')); }
  catch { const panel = document.createElement('div'); panel.className = 'error-panel'; panel.textContent = '此浏览器无法打开 WebGL2。上面的原理动画仍然可以观看。'; el('viewport').append(panel); return; }
  viewEvents = new AbortController();
  view.canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); stop3D(); }, { signal: viewEvents.signal });
  observer = new ResizeObserver(() => view?.resize()); observer.observe(el('viewport')); update3D();
}
app.addEventListener('click', event => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button');
  if (!button) return;
  if (button.dataset.topic) { topic = button.dataset.topic as SpaceMode; storyIndex = 0; changed = false; }
  if (button.dataset.story) { storyIndex = Number(button.dataset.story); changed = false; }
  if (button.id === 'action') changed = !changed;
  if (button.id === 'toggle-animation') { paused = !paused; applyPause(); return; }
  if (button.id === 'replay') { el('diagram').querySelector('svg')!.setCurrentTime(0); return; }
  if (button.dataset.topic || button.dataset.story || button.id === 'action') update();
}, { signal: events.signal });
el('spatial-view').addEventListener('toggle', () => { if (el<HTMLDetailsElement>('spatial-view').open) start3D(); else stop3D(); }, { signal: events.signal });
window.addEventListener('pagehide', stop3D, { signal: events.signal });
window.addEventListener('pageshow', event => { if (event.persisted && el<HTMLDetailsElement>('spatial-view').open) start3D(); }, { signal: events.signal });
if (import.meta.hot) import.meta.hot.dispose(() => { stop3D(); events.abort(); });
update();
