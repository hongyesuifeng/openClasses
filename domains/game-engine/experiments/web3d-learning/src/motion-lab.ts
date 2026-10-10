import { Vector2 } from 'three';
import { cameraAt, cameraDirection, dampingAlpha, inspectPick, move, overlaps, pointerNdc, sweepBox, wallMove, type GroundPoint } from './motion-math.ts';

document.title = '场景与运动 · 原理演示';
const app = document.querySelector<HTMLElement>('#app')!;
app.classList.add('motion-page');
app.innerHTML = `
  <header class="page-header"><div class="brand"><span class="brand-mark">3D</span> openClasses <span class="separator">/</span> 原理演示</div>
    <nav class="lab-navigation" aria-label="学习实验"><a href="?lab=time">0 场景与时间</a><a href="?lab=space">1 空间数学</a><a href="?lab=motion" aria-current="page">2 场景与运动</a></nav></header>
  <section class="intro demo-intro"><p class="eyebrow">阶段 2 · 看过程，也看原因</p><h1>让输入变成运动，让运动受到约束。</h1><p class="lead">从方向与时间开始，再看镜头、拾取与碰撞。每个动画都有原理、公式和适用条件。</p></section>
  <nav class="lesson-tabs" aria-label="演示主题"><button data-topic="movement" aria-pressed="true">方向与时间</button><button data-topic="camera" aria-pressed="false">镜头与运动</button><button data-topic="picking" aria-pressed="false">点击与射线</button><button data-topic="collision" aria-pressed="false">碰撞与响应</button></nav>
  <section class="demo-layout"><div class="demo-card"><div class="demo-toolbar"><span id="demo-label"></span><button id="toggle-animation" class="text-button">暂停动画</button></div>
    <div id="diagram" class="principle-diagram"></div><p class="diagram-scroll-hint">左右滑动查看完整图示</p><p id="takeaway" class="demo-takeaway"></p>
    <div class="demo-actions"><button id="action" class="primary"></button><button id="step">逐步看</button><button id="replay">从头看</button></div>
    <p class="motion-time" id="playback-status"></p></div>
    <aside class="demo-guide"><p class="eyebrow">观察与解释</p><h2 id="story-title"></h2><p id="story-explanation"></p><nav id="story-list" aria-label="选择一个原理"></nav></aside></section>
  <section class="motion-theory" aria-labelledby="principle-title"><div><p class="eyebrow">为什么会这样</p><h2 id="principle-title"></h2><p id="why"></p><code id="formula"></code><p class="formula-note" id="variables"></p></div><ol id="mechanism"></ol>
    <p class="motion-boundary" id="boundary"></p></section>
  <section class="demo-connection"><span>放进游戏里</span><p id="game-example"></p></section>
  <section class="explanations demo-details"><details><summary>对应到 Cocos 与源码（按需）</summary><div id="engine-mapping"></div></details></section>
  <footer>图中距离使用世界单位，时间使用秒。按钮切换同一问题的对照情况；循环结束后重新开始。</footer>
`;
const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
type Topic = 'movement' | 'camera' | 'picking' | 'collision';
type StoryId = 'input' | 'timestep' | 'relative' | 'follow' | 'pick' | 'volume' | 'slide' | 'tunnel';
interface Story {
  id: StoryId; label: string; title: string; explanation: string; why: string; formula: string;
  variables: string; steps: string[]; boundary: string; game: string; states: string[]; actions: string[]; mapping: string;
}
const component = '<a href="https://github.com/cocos/cocos-engine/blob/v3.8.8/cocos/scene-graph/component.ts">Component.update / lateUpdate</a>';
const camera = '<a href="https://github.com/cocos/cocos-engine/blob/v3.8.8/cocos/misc/camera-component.ts">Camera.screenPointToRay</a>';
const physics = '<a href="https://github.com/cocos/cocos-engine/blob/v3.8.8/cocos/physics/framework/physics-system.ts">PhysicsSystem.raycastClosest</a>';
const stories: Record<Topic, Story[]> = {
  movement: [
    { id: 'input', label: '斜走为什么更快', title: '输入的长度，不应偷偷变成速度。', explanation: '同时按两个方向时，输入箭头变长了。左图直接拿输入乘速度，斜走更快；右图先把方向归一化，再乘速度。',
      why: '输入 (1,1) 的长度是 √2，而 (0,1) 的长度是 1。直接乘同一个速度，会把输入长度也算进去。归一化后，非零方向的长度统一为 1，速度才能由同一个参数控制。', formula: 'd = input / |input|；Δp = d × speed × Δt', variables: 'd 是单位方向，speed 是世界单位／秒，Δt 是秒。没有输入时 d=0，直接保持位置。',
      steps: ['方向键合成输入：斜向 (1,1)，直向 (0,1)，松开为 (0,0)。', '先分离方向与长度，再用 speed=2 控制移动速度。', '同样移动 2 秒，归一化后的直走和斜走都走 4 个单位。'], boundary: '本例是数字方向键。模拟摇杆通常只把长度大于 1 的输入压回 1，保留轻推时的较低速度；不能一律归一化。', game: '避免角色斜着跑更快；把方向、移动速度和摇杆力度分别处理。', states: ['两个方向同时按住', '只按前进', '方向键已松开'], actions: ['只按前进', '松开方向键', '同时按两个方向'], mapping: `${component} 的 dt 单位是秒；方向计算对应 Vec3.normalize，位置更新对应 Node.setPosition。` },
    { id: 'timestep', label: '帧数不是速度', title: '一秒多画几帧，不应该跑得更远。', explanation: '两行使用同一段 2 秒输入，分别每秒更新 30 次和 120 次。正确方式让每一步的距离随步长缩小；切换后看“每帧固定距离”怎样造成分叉。',
      why: '速度表示每秒移动的距离，帧数只决定这段距离分成多少步。每步走 speed×Δt，累加后就是 speed×总时间；如果每帧固定走 0.04，更新次数越多，累计距离越大。', formula: 'p_next = p + v × Δt；ΣΔp = v × ΣΔt', variables: '本例正确速度为 2 单位／秒。30 次更新的步长是 1/30 秒，120 次更新的步长是 1/120 秒。', steps: ['读取同一个恒定方向和速度。', '按各自步长更新，30 次是较大步，120 次是较小步。', '模拟时间同为 2 秒，正确终点均为 4；错误终点分别是 2.4 和 9.6。'], boundary: '这里比较模拟步数，不代表浏览器实际刷新率。乘 Δt 可统一恒速位移，但不能保证碰撞、加速度等离散模拟在所有步长下完全一致。', game: '低帧率设备和高帧率设备应具有相同移动速度；物理模拟还常需要固定步长。', states: ['按时间移动：两种步数终点相同', '每帧固定走 0.04：步数越多跑得越远'], actions: ['换成每帧固定距离', '恢复按时间移动'], mapping: `${component} 提供 dt；浏览器使用 requestAnimationFrame 的时间戳算间隔，不能直接把回调次数当作秒数。` },
  ],
  camera: [
    { id: 'relative', label: '跟随镜头的前进', title: '“前进”可以跟着镜头改变方向。', explanation: '灰色路线始终沿世界 +Z。蓝色路线把“前进”解释为镜头在地面上的前方。镜头转动后，同一个输入就能得到另一个世界方向。',
      why: '方向键先表达相对意图。把输入在镜头右方 R 和前方 F 上展开，就得到世界方向。这样镜头转了，角色仍按画面中的前进与左右移动。', formula: 'd_world = normalize(R × input.x + F × input.z)', variables: '本图为 XZ 地面俯视，+Z 向图上方；R、F 是地面上的单位基向量。两种路线的速度都为 2。', steps: ['取镜头的水平前方 F，再取与它垂直的右方 R。', '把前进／左右输入组合成世界方向，并处理非零方向的长度。', '最后用世界方向 × 速度 × 时间，更新角色位置。'], boundary: '真实 3D 镜头可能向下俯视，需要先去掉前方的竖直分量，再归一化。镜头几乎竖直时水平前方退化，要保留有效朝向或使用角色朝向。', game: '第三人称角色控制：镜头绕角色转动时，按前进仍朝镜头看向的地面方向走。', states: ['镜头朝向：45°', '镜头朝向：90°'], actions: ['把镜头转到 90°', '恢复 45° 朝向'], mapping: 'Cocos Camera 挂在 Node 上；从节点的世界旋转提取前方／右方，再与 Vec3 组合。注意引擎相机的局部前方约定与本俯视图不同。' },
    { id: 'follow', label: '平滑跟随与滞后', title: '平滑来自逐渐消除位置误差。', explanation: '目标先跳到 x=4，再回到 x=0。两个镜头都追向目标：每次消除一部分剩余差距。默认按时间计算比例；切换后可见“每帧固定 10%”的帧率差异。',
      why: '直接赋值会立刻到位；平滑跟随会保留一部分误差，因此产生滞后。每次剩余误差乘 e^(−λΔt)，相同总时间就有相同衰减；固定每帧比例则取决于更新了多少次。', formula: 'α = 1 − e^(−λΔt)；camera += (target − camera) × α', variables: '本例 λ=2／秒。λ 越大，误差消失越快。30 和 120 次更新各自使用不同 α，而不是硬编码同一个比例。', steps: ['先更新目标的世界位置，再取得镜头期望位置。', '计算当前镜头与期望位置的误差，并按时间消除一部分。', '目标静止时，同一总时间的误差相同；目标持续运动时通常仍存在跟随滞后。'], boundary: '这里是位置的指数平滑，不是弹簧物理；固定目标和对齐的阶跃输入可按时间等效。持续变化的目标仍受采样影响，镜头避障与旋转需要另处理。', game: '减少镜头突然跳动。角色在 update 中移动后，可在 lateUpdate 中跟随；顺序错误可能读取上一帧的位置。', states: ['按时间消除误差：两种步数的位置一致', '每帧消除 10%：120 次的镜头更快追上'], actions: ['换成每帧固定 10%', '恢复按时间平滑'], mapping: `${component} 的 lateUpdate 位于 update 之后，适合读取角色本帧位置；平滑计算可用 Vec3 插值。Three.js MathUtils.damp 使用时间相关的阻尼比例。` },
  ],
  picking: [
    { id: 'pick', label: '点击变成一条射线', title: '一个屏幕点，对应空间中的一条路径。', explanation: '右侧是相机画面，可以直接点击。左侧展示这次点击生成的世界射线。多个箱子在同一条射线上时，通常选最近的一次命中。',
      why: '屏幕点击只给出两个坐标，缺少深度，无法直接决定唯一世界位置。相机把这个屏幕点反投影成射线，再与物体表面求交；交点才提供位置和距离。', formula: 'NDC = (2u−1, 1−2v)；ray(t) = origin + direction × t', variables: 'u、v 是点击在实际画面矩形内的 0～1 比例；direction 长度为 1，所以 t 表示沿射线的世界距离。命中结果按距离排序。', steps: ['减去画面的左上偏移，再把画面内坐标变成 NDC；浏览器 Y 向下，要翻转。', '使用相机的世界变换和投影，生成世界射线。', 'Three.js Raycaster 求交；选最近命中，空白处返回无命中。'], boundary: '右图是投影包围矩形示意，查询依据真实 BoxGeometry 三角形。包围矩形里的空角可能没有命中；射线是否接受背面、层级和查询距离也要明确。白点只标示路径，查询不会等待白点移动。', game: '鼠标选中角色、点击地面得到落点；命中地面后仍需导航或碰撞检查才能安全移动。', states: ['点击画面中心', '点击右箱中心', '点击空白处'], actions: ['点右侧物体', '点空白处', '恢复画面中心'], mapping: `${camera} 的屏幕坐标以左下为原点；从浏览器事件迁移时要处理 Y 与视口。${physics} 查询物理碰撞体；Three.js Raycaster 这里查询渲染网格。` },
    { id: 'volume', label: '射线没有角色的体积', title: '中心线能通过，角色身体却可能撞墙。', explanation: '虚线是角色中心的射线路径；蓝框是角色真实占据的范围。默认路径从墙边经过，中心线没有命中，但角色下沿会撞到墙。',
      why: '一条射线只有方向和路径，没有宽度。角色有体积，因此要检查整个碰撞体沿路是否接触障碍。把障碍扩大角色的半宽，再检查中心路径，是轴对齐方块的一种等价方法。', formula: '障碍范围扩大 half；中心路径与扩大后的盒求交', variables: '角色半宽 half=0.3；路径 z=1.2，墙上沿 z=1。中心线在墙外，但角色下沿 z=0.9 已进入墙的范围。', steps: ['先用 half=0 的中心路径查询，默认不会碰到墙。', '再用 half=0.3 的角色碰撞盒扫过同一条路径。', '角色前沿到达接触位置时停下，不能用射线未命中证明角色可通过。'], boundary: '本例是固定朝向的轴对齐方块平移，不能把扩大矩形直接当作精确圆形／旋转盒扫掠。复杂角色常用胶囊体和物理引擎的形状查询。', game: '角色沿墙角走、窄门通行或镜头避障时，需要考虑自身尺寸。', states: ['中心线从墙边通过，角色仍会撞到', '中心线直接对准墙，两种查询都命中'], actions: ['让中心线对准墙', '恢复擦边路径'], mapping: `${physics} 只做射线查询；角色体积应交给 Collider / CharacterController 或所用物理后端的形状查询，不能把 Raycaster 当作完整角色控制器。` },
  ],
  collision: [
    { id: 'slide', label: '撞墙后沿墙滑动', title: '检测告诉你撞了；响应决定下一步怎么走。', explanation: '虚线表示角色原本想走的路线。蓝框到达墙的前沿后，朝墙里的运动被移除，沿墙的部分保留下来。切换按钮可比较直接停下的结果。',
      why: '接触法线 n 指向墙外。把剩余运动拆成法线方向和切线方向，移除向墙内的分量，就能沿墙滑动。碰撞检测本身不会自动选择“停止、滑动还是反弹”。', formula: 'r_slide = r − min(0, r·n) × n', variables: 'r 是首次接触后的剩余位移，n 是单位接触法线。本例墙外法线为 (−1,0)，只去掉向右的分量。', steps: ['先沿整段位移求首次接触，角色前沿停在墙边，而不是把中心放进墙里。', '把接触后的剩余位移按单位法线分解。', '滑动保留切向；停止则丢弃全部剩余位移。'], boundary: '本例只有一面静止墙、一个平移方块，不含重力、摩擦和反弹。多面墙与墙角要再次查询剩余运动，初始重叠需要单独处理。', game: '角色斜着走向墙时仍可沿墙移动；检测和响应分开，才能按玩法选择停止或滑动。', states: ['响应方式：沿墙滑动', '响应方式：接触即停止'], actions: ['改成接触就停止', '恢复沿墙滑动'], mapping: 'Cocos Collider 的接触事件或物理查询提供检测信息；具体响应取决于刚体、角色控制器或游戏自己的运动规则。本例是运动学响应，不模拟刚体求解器。' },
    { id: 'tunnel', label: '为什么会穿墙', title: '只检查新位置，会漏掉中途经过的墙。', explanation: '左行一次从墙左边跳到右边，前后两个位置都没与墙重叠；中途却经过了墙。右行检查整段路径，所以会在首次接触处停下。',
      why: '离散重叠检测只回答“这一刻是否相交”。高速物体一帧跨过薄墙，终点已在墙外，就会漏检。扫掠查询回答“这一段运动中何时首次接触”，能保留中途信息。', formula: 'p(τ) = p_start + Δp × τ，0≤τ≤1；取首次接触 τ', variables: '本例一步从 x=−2 到 x=2，角色半宽 0.3，墙左面 x=0。接触时中心 x=−0.3，对应 τ=0.425。', steps: ['离散方式只检查终点 x=2；结果是不重叠，因此发生穿墙。', '连续方式先把墙扩大半宽，再求中心线段的进入时间。', '在 τ=0.425 处接触；用这个时间截断本步运动。'], boundary: '动画慢放的是一个大步的起点、路径与终点；左行并没有在慢放中额外检测。固定步长可降低漏检概率，但速度足够高时仍需合适的连续检测。', game: '高速子弹、冲刺角色或长帧后的位移，容易跨过薄障碍；按模型选择扫掠或物理后端的 CCD。', states: ['大步：从 −2 到 2，终点漏检', '短步：从 −2 到 0.1，终点可发现重叠'], actions: ['缩短这一帧的位移', '恢复跨墙的大步'], mapping: 'Cocos PhysicsSystem 的查询与物理后端 CCD 能力取决于使用的后端与碰撞形状；本例实现的是二维平移 AABB 扫掠，不能视作全部后端都有相同接口。' },
  ],
};
let topic: Topic = 'movement', storyIndex = 0, variant = 0, time = 0;
let paused = matchMedia('(prefers-reduced-motion: reduce)').matches;
let frameId = 0, lastTimestamp: number | undefined, active = true;
const events = new AbortController();
const preference = matchMedia('(prefers-reduced-motion: reduce)');
let pickNdc = new Vector2(0, 0), pick = inspectPick(pickNdc), customPick = false;
const current = () => stories[topic][storyIndex];
const color = { blue: '#3184af', orange: '#ce852c', green: '#258c72', gray: '#93a7b0' };
const text = (x: number, y: number, value: string, fill = '#506b7a', size = 16, anchor = 'middle') => `<text x="${x}" y="${y}" fill="${fill}" text-anchor="${anchor}" font-size="${size}">${value}</text>`;
const line = (x1: number, y1: number, x2: number, y2: number, fill = color.gray, dashed = false) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${fill}" stroke-width="3" ${dashed ? 'stroke-dasharray="6 5"' : ''}/>`;
const arrow = (x1: number, y1: number, x2: number, y2: number, fill = color.blue) => line(x1, y1, x2, y2, fill) + `<path d="M -10 -6 L 0 0 L -10 6" fill="none" stroke="${fill}" stroke-width="3" transform="translate(${x2} ${y2}) rotate(${Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI})"/>`;
const actor = (x: number, y: number, fill: string, size = 24, id = '', position?: GroundPoint) => `<rect x="${x - size / 2}" y="${y - size / 2}" width="${size}" height="${size}" rx="4" fill="${fill}" stroke="white" stroke-width="2" ${id ? `data-actor="${id}"` : ''} ${position ? `data-x="${position.x}" data-z="${position.z}"` : ''}/>`;
const svg = (body: string, caption: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 440" role="img" aria-label="${current().title}"><defs><pattern id="grid" width="25" height="25" patternUnits="userSpaceOnUse"><path d="M 25 0 L 0 0 0 25" fill="none" stroke="#e3edf0"/></pattern><clipPath id="world-clip"><rect x="30" y="65" width="400" height="305"/></clipPath></defs><rect width="760" height="390" fill="url(#grid)"/>${body}<line x1="25" y1="390" x2="735" y2="390" stroke="#dce7ec"/>${text(380, 420, caption, '#315566', 16)}</svg>`;
const wall = { min: { x: 0, z: -3 }, max: { x: 0.4, z: 3 } };

function inputDiagram(): string {
  const input = variant === 0 ? { x: 1, z: 1 } : variant === 1 ? { x: 0, z: 1 } : { x: 0, z: 0 };
  const t = Math.min(time, 2), correct = move({ x: 0, z: 0 }, input, 2, t), raw = { x: input.x * 2 * t, z: input.z * 2 * t };
  let body = '';
  for (const [i, p, name, fill] of [[0, raw, 'raw', color.orange], [1, correct, 'correct', color.blue]] as const) {
    const x = 90 + i * 375, y = 300;
    const end = i === 0 ? { x: input.x * 4, z: input.z * 4 } : move({ x: 0, z: 0 }, input, 2, 2);
    body += text(x + 100, 45, i === 0 ? '直接使用输入' : '先归一化方向', fill) + line(x, y, x + 200, y) + line(x, y, x, y - 200)
      + text(x + 214, y + 5, '+X', undefined, 13) + text(x, y - 214, '+Z', undefined, 13)
      + line(x, y, x + end.x * 45, y - end.z * 45, fill, true) + actor(x + p.x * 45, y - p.z * 45, fill, 24, name, p)
      + text(x + 100, 355, `已走 ${Math.hypot(p.x, p.z).toFixed(2)} 单位`, fill);
  }
  return svg(body, variant === 2 ? '没有输入，方向为零，位置保持不动。' : '两个方向叠加会变长；单位方向让速度保持一致。');
}
function timestepDiagram(): string {
  const t = Math.min(time, 2);
  let body = '';
  for (const n of [0, 2, 4, 6, 8, 10]) body += line(90 + n * 58, 100, 90 + n * 58, 305, '#d6e2e7', true) + text(90 + n * 58, 335, String(n), undefined, 13);
  body += text(650, 365, '世界距离 →', undefined, 13);
  for (const [fps, y, fill] of [[30, 150, color.blue], [120, 265, color.orange]] as const) {
    const steps = Math.floor(t * fps + 1e-9), x = variant === 0 ? steps / fps * 2 : steps * 0.04;
    body += text(85, y - 35, `${fps} 步／秒`, fill, 15, 'start') + line(90, y, 670, y) + actor(90 + x * 58, y, fill, 25, `fps-${fps}`, { x, z: 0 }) + text(670, y - 35, `${x.toFixed(2)} 单位`, fill, 16, 'end');
  }
  body += text(380, 45, `同一模拟时间：${t.toFixed(2)} / 2 秒`);
  return svg(body, variant === 0 ? '速度乘步长：两行最终都走 4 单位。' : '每帧固定距离：更新越多，累计位移越大。');
}
function relativeDiagram(): string {
  const angle = variant === 0 ? Math.PI / 4 : Math.PI / 2;
  const d = cameraDirection({ x: 0, z: 1 }, angle), t = Math.min(time, 2);
  const start = { x: -2, z: -1 }, correct = move(start, d, 2, t), fixed = move(start, { x: 0, z: 1 }, 2, t);
  const X = (x: number) => 380 + x * 45, Y = (z: number) => 240 - z * 45;
  return svg(text(380, 42, 'XZ 地面俯视；两种路线速度相同') + arrow(X(-4), Y(-2), X(-3), Y(-2), color.gray) + arrow(X(-4), Y(-2), X(-4), Y(-1), color.gray)
    + text(X(-2.8), Y(-2) + 5, '+X', undefined, 13) + text(X(-4), Y(-0.6), '+Z', undefined, 13)
    + line(X(start.x), Y(start.z), X(start.x), Y(start.z + 4), color.gray, true) + line(X(start.x), Y(start.z), X(start.x + d.x * 4), Y(start.z + d.z * 4), color.blue, true)
    + actor(X(fixed.x), Y(fixed.z), color.gray) + actor(X(correct.x), Y(correct.z), color.blue, 25, 'relative', correct)
    + actor(520, 280, color.green, 25) + arrow(520, 280, 520 + d.x * 65, 280 - d.z * 65, color.green)
    + text(550, 330, '镜头的水平前方 F', color.green, 15) + text(380, 365, '灰色：世界 +Z　蓝色：镜头前方', undefined, 15), '输入先表达意图；镜头基向量把意图换成世界方向。');
}
function followDiagram(): string {
  const target = time < 1 ? 0 : time < 4 ? 4 : 0;
  let body = text(380, 45, '目标在第 1 秒跳到 4，第 4 秒回到 0');
  for (const [fps, y, fill] of [[30, 155, color.blue], [120, 280, color.orange]] as const) {
    const x = cameraAt(time, fps, variant === 0), px = 150 + x * 115, tx = 150 + target * 115;
    body += text(85, y - 45, `${fps} 步／秒`, fill, 15, 'start') + line(150, y, 610, y) + `<circle cx="${tx}" cy="${y}" r="18" fill="none" stroke="${color.gray}" stroke-width="3"/>` + line(px, y, tx, y, fill, true)
      + actor(px, y, fill, 25, `camera-${fps}`, { x, z: 0 }) + text(680, y - 35, `误差 ${Math.abs(target - x).toFixed(2)}`, fill, 15, 'end');
  }
  body += text(150, 345, '0', undefined, 13) + text(610, 345, '4', undefined, 13) + text(380, 370, variant === 0 ? `每步比例：30 步 ${(dampingAlpha(2, 1 / 30) * 100).toFixed(1)}%　120 步 ${(dampingAlpha(2, 1 / 120) * 100).toFixed(1)}%` : '每一步都用 10%，更多步数会更快消除误差', undefined, 14);
  return svg(body, variant === 0 ? '比例随步长调整，同一时间的误差衰减相同。' : '固定每帧比例，镜头响应随更新次数改变。');
}
const screen = { left: 475, top: 105, width: 245, height: 245 / 1.2 };
function pickDiagram(): string {
  const X = (x: number) => 225 + x * 36, Y = (z: number) => 285 - z * 24;
  const selected = pick.hits[0]?.name;
  let body = text(225, 37, '世界俯视（XZ，省略高度）', undefined, 15) + text(597, 37, '相机画面 · 可以点击', undefined, 15)
    + `<rect x="${screen.left}" y="${screen.top}" width="${screen.width}" height="${screen.height}" fill="#eff5f7" stroke="#c2d7e0" rx="8"/>`;
  for (const box of [...pick.boxes].sort((a, b) => a.center.z - b.center.z)) {
    const fill = box.name === selected ? color.green : box.name === '近箱' ? color.blue : color.orange;
    body += `<rect x="${X(box.center.x) - 27}" y="${Y(box.center.z) - 14.4}" width="54" height="28.8" fill="${fill}" opacity=".8"/>` + text(X(box.center.x) + 35, Y(box.center.z) + 5, box.name, fill, 13, 'start');
    const x = screen.left + (box.minX + 1) * screen.width / 2, y = screen.top + (1 - box.maxY) * screen.height / 2;
    body += `<rect x="${x}" y="${y}" width="${(box.maxX - box.minX) * screen.width / 2}" height="${(box.maxY - box.minY) * screen.height / 2}" fill="${fill}" stroke="white" stroke-width="2" opacity=".9"/>`;
  }
  const distance = pick.hits[0]?.distance ?? 13, end = pick.origin.clone().addScaledVector(pick.direction, distance);
  const progress = (time % 2) / 2, moving = pick.origin.clone().addScaledVector(pick.direction, distance * progress);
  body += `<g clip-path="url(#world-clip)">${arrow(X(pick.origin.x), Y(pick.origin.z), X(end.x), Y(end.z), color.green)}<circle cx="${X(moving.x)}" cy="${Y(moving.z)}" r="6" fill="white" stroke="${color.green}" stroke-width="2"/></g>`
    + actor(X(pick.origin.x), Y(pick.origin.z), '#506d7c', 25) + text(X(pick.origin.x), Y(pick.origin.z) - 24, '相机', undefined, 14)
    + `<circle cx="${screen.left + (pickNdc.x + 1) * screen.width / 2}" cy="${screen.top + (1 - pickNdc.y) * screen.height / 2}" r="9" fill="none" stroke="#203342" stroke-width="3"/>`
    + text(597, 348, selected ? `选中：${selected}` : '无命中：点击落在空白处', color.green, 15)
    + text(380, 372, pick.hits.map(hit => `${hit.name} ${hit.distance.toFixed(2)}`).join(' → ') || '射线存在，但没有与任何箱子表面相交', undefined, 14);
  return svg(body, selected ? '沿射线求交，按距离选择最近命中。' : '无命中是正常结果；不能凭点击直接得到世界落点。');
}
function volumeDiagram(): string {
  const obstacle = { min: { x: 0, z: -1 }, max: { x: 0.4, z: 1 } }, start = { x: -3, z: variant === 0 ? 1.2 : 0 }, delta = { x: 5 * Math.min(time / 2, 1), z: 0 };
  const result = wallMove(start, delta, 0.3, obstacle, false), centerHit = sweepBox(start, { x: 5, z: 0 }, 0, obstacle);
  const X = (x: number) => 410 + x * 70, Y = (z: number) => 245 - z * 70;
  return svg(text(380, 40, '虚线：中心路径；蓝框：有体积的角色') + `<rect x="${X(0)}" y="${Y(1)}" width="28" height="140" fill="#fff1dc" stroke="${color.orange}" stroke-width="3"/>`
    + line(X(-3), Y(start.z), X(2), Y(start.z), color.gray, true) + actor(X(result.position.x), Y(result.position.z), color.blue, 42, 'volume', result.position)
    + text(380, 95, `中心路径：${centerHit ? '命中墙' : '没有命中'}　角色扫掠：会接触墙`, undefined, 16)
    + text(X(0.6), Y(1) - 15, '墙上沿 z=1', color.orange, 14, 'start') + text(380, 358, variant === 0 ? '中心 z=1.2，但下沿 z=0.9，仍进入墙的范围。' : '中心直接对准墙；射线和角色体积都会接触。', undefined, 15), '射线没有宽度；通行检查必须考虑角色体积。');
}
function slideDiagram(): string {
  const start = { x: -3, z: -1.5 }, t = Math.min(time, 2), delta = { x: 2 * t, z: t };
  const result = wallMove(start, delta, 0.3, wall, variant === 0), desired = { x: start.x + delta.x, z: start.z + delta.z };
  const X = (x: number) => 445 + x * 70, Y = (z: number) => 225 - z * 48;
  let body = text(380, 40, 'XZ 俯视 · 碰撞体半宽 0.3') + `<rect x="${X(0)}" y="${Y(3)}" width="28" height="288" fill="#fff1dc" stroke="${color.orange}" stroke-width="3"/>`
    + line(X(start.x), Y(start.z), X(1), Y(0.5), color.gray, true) + `<rect x="${X(desired.x) - 21}" y="${Y(desired.z) - 14.4}" width="42" height="28.8" fill="none" stroke="${color.gray}" stroke-dasharray="5 5"/>`
    + `<rect x="${X(result.position.x) - 21}" y="${Y(result.position.z) - 14.4}" width="42" height="28.8" rx="3" fill="${color.blue}" stroke="white" stroke-width="2" data-actor="slide" data-x="${result.position.x}" data-z="${result.position.z}"/>`
    + text(205, 110, '灰框：想去的位置', undefined, 14) + text(205, 140, '蓝框：实际的位置', color.blue, 14);
  if (result.hit) body += arrow(X(-0.3), Y(-0.15), X(-1.3), Y(-0.15), color.green) + text(X(-1.35), Y(-0.15) - 20, '接触法线 n', color.green, 14);
  body += text(205, 365, result.hit ? variant === 0 ? '接触后，保留沿墙运动。' : '接触后，停止全部运动。' : '接触前，按原方向移动。', undefined, 15);
  return svg(body, '检测确定首次接触；响应选择停止或沿墙滑动。');
}
function tunnelDiagram(): string {
  const end = variant === 0 ? 2 : 0.1, start = { x: -2, z: 0 }, delta = { x: end + 2, z: 0 }, continuous = wallMove(start, delta, 0.3, wall, false);
  const endpointOverlap = overlaps({ x: end, z: 0 }, 0.3, wall), displayed = -2 + (end + 2) * Math.min(time / 2, 1), swept = Math.min(displayed, continuous.position.x);
  const X = (x: number) => 380 + x * 100;
  let body = text(380, 40, '慢放同一个模拟步；左行只在终点检查');
  for (const [y, x, label, fill, id] of [[155, displayed, '只看终点', color.orange, 'discrete'], [300, swept, '检查整段', color.blue, 'continuous']] as const) {
    body += text(85, y - 40, label, fill, 15, 'start') + `<rect x="${X(0)}" y="${y - 40}" width="40" height="80" fill="#fff1dc" stroke="${color.orange}" stroke-width="2"/>`
      + line(X(-2), y, X(end), y, color.gray, true) + actor(X(x), y, fill, 60, id, { x, z: 0 }) + text(680, y - 40, id === 'discrete' ? endpointOverlap ? '终点重叠：可发现' : '终点不重叠：漏检' : '首次接触：x=−0.3', fill, 14, 'end');
  }
  return svg(body, variant === 0 ? '前后都不重叠，不代表中途没有穿过障碍。' : '短步终点进入墙：可发现重叠，但还需要响应纠正位置。');
}
function renderFrame(): void {
  const diagrams: Record<StoryId, () => string> = { input: inputDiagram, timestep: timestepDiagram, relative: relativeDiagram, follow: followDiagram, pick: pickDiagram, volume: volumeDiagram, slide: slideDiagram, tunnel: tunnelDiagram };
  el('diagram').innerHTML = diagrams[current().id]();
  const hint = current().id === 'follow' ? '目标在第 1、4 秒改变位置。' : current().id === 'pick' ? '白点标示射线路径。' : '前 2 秒移动，随后保留结果。';
  el('playback-status').textContent = `${paused ? '已暂停' : '播放中'} · ${time.toFixed(2)} / 6.00 秒；${hint}`;
}
function update(): void {
  const story = current();
  el('demo-label').textContent = story.label; el('story-title').textContent = story.title; el('story-explanation').textContent = story.explanation;
  el('takeaway').textContent = story.id === 'pick' && customPick ? pick.hits.length ? `这次点击选中 ${pick.hits[0].name}` : '这次点击没有命中物体' : story.states[variant]; el('action').textContent = story.actions[variant];
  el('principle-title').textContent = story.label; el('why').textContent = story.why; el('formula').textContent = story.formula; el('variables').textContent = story.variables;
  el('mechanism').innerHTML = story.steps.map(step => `<li>${step}</li>`).join('');
  el('boundary').textContent = `本例条件：${story.boundary}`; el('game-example').textContent = story.game; el('engine-mapping').innerHTML = `<p>${story.mapping}</p>`;
  el('story-list').innerHTML = stories[topic].map((item, index) => `<button data-story="${index}" aria-pressed="${storyIndex === index}"><span>0${index + 1}</span>${item.label}</button>`).join('');
  for (const button of app.querySelectorAll<HTMLButtonElement>('[data-topic]')) button.setAttribute('aria-pressed', String(button.dataset.topic === topic));
  el('toggle-animation').textContent = paused ? '播放动画' : '暂停动画'; renderFrame();
}
function refreshPicking(): void {
  customPick = false;
  if (variant === 0) pickNdc = new Vector2(0, 0);
  if (variant === 1) { const side = inspectPick(new Vector2()).boxes.find(box => box.name === '右箱')!; pickNdc = new Vector2(side.ndc.x, side.ndc.y); }
  if (variant === 2) pickNdc = new Vector2(0.88, 0.8);
  pick = inspectPick(pickNdc);
}
function tick(timestamp: number): void {
  frameId = 0;
  if (!active || document.hidden) return;
  if (!paused && lastTimestamp !== undefined) { time = (time + Math.min((timestamp - lastTimestamp) / 1000, 0.1)) % 6; renderFrame(); }
  lastTimestamp = timestamp;
  if (!paused) frameId = requestAnimationFrame(tick);
}
function schedule(): void { lastTimestamp = undefined; if (active && !document.hidden && !paused && !frameId) frameId = requestAnimationFrame(tick); }
function cancel(): void { cancelAnimationFrame(frameId); frameId = 0; lastTimestamp = undefined; }
app.addEventListener('click', event => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button');
  if (button) {
    if (button.dataset.topic) { topic = button.dataset.topic as Topic; storyIndex = 0; variant = 0; time = 0; refreshPicking(); }
    if (button.dataset.story) { storyIndex = Number(button.dataset.story); variant = 0; time = 0; refreshPicking(); }
    if (button.id === 'action') { variant = (variant + 1) % current().states.length; time = 0; refreshPicking(); }
    if (button.id === 'toggle-animation') { paused = !paused; cancel(); }
    if (button.id === 'step') { paused = true; cancel(); time = Math.min(time + 0.25, 5.999); }
    if (button.id === 'replay') { time = 0; lastTimestamp = undefined; }
    update(); schedule(); return;
  }
  if (current().id !== 'pick' || !(event.target as Element).closest('#diagram')) return;
  const diagram = el('diagram').querySelector('svg')!, matrix = diagram.getScreenCTM();
  if (!matrix) return;
  const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
  if (point.x < screen.left || point.x > screen.left + screen.width || point.y < screen.top || point.y > screen.top + screen.height) return;
  pickNdc = pointerNdc(point.x, point.y, screen); pick = inspectPick(pickNdc); customPick = true; time = 0;
  el('takeaway').textContent = pick.hits.length ? `这次点击选中 ${pick.hits[0].name}` : '这次点击没有命中物体'; renderFrame();
}, { signal: events.signal });
document.addEventListener('visibilitychange', () => { cancel(); schedule(); }, { signal: events.signal });
window.addEventListener('pagehide', () => { active = false; cancel(); }, { signal: events.signal });
window.addEventListener('pageshow', () => { active = true; schedule(); }, { signal: events.signal });
preference.addEventListener('change', event => { if (event.matches) { paused = true; cancel(); update(); } }, { signal: events.signal });
// 开发环境逐帧捕获真实计算结果；生产页面只保留用户播放控制。
if (import.meta.env.DEV) document.addEventListener('motion-demo-seek', event => {
  const seconds = (event as CustomEvent<number>).detail;
  if (!Number.isFinite(seconds) || seconds < 0 || seconds >= 6) return;
  paused = true; cancel(); time = seconds; update();
}, { signal: events.signal });
if (import.meta.hot) import.meta.hot.dispose(() => { active = false; cancel(); events.abort(); });
update(); schedule();
