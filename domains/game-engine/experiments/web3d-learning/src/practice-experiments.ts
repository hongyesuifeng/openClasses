import type { PracticeCase, PracticeDefinition, PracticeRecord, PracticeTask, PracticeValue } from './practice-types.ts';

function finite(value: PracticeValue | undefined, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`${label} 必须是有限数值`);
  return value;
}
function numbers(value: PracticeValue | undefined, label: string): number[] {
  if (!Array.isArray(value)) throw new Error(`${label} 必须是数值数组`);
  return Array.from(value, (item, i) => finite(item, `${label}[${i}]`));
}
function record(value: PracticeValue): PracticeRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('结果必须是对象');
  return value;
}
function keys(value: PracticeRecord, expected: string[]): void {
  if (Object.keys(value).sort().join('|') !== [...expected].sort().join('|')) throw new Error(`结果字段应为 ${expected.join('、')}`);
}
function points(input: PracticeRecord): number[][] {
  if (!Array.isArray(input.points)) throw new Error('input.points 必须是齐次坐标数组');
  return Array.from(input.points, (point, i) => {
    const result = numbers(point, `points[${i}]`);
    if (result.length !== 3) throw new Error('每个二维齐次坐标必须包含 x、y、w');
    return result;
  });
}
function validatePoints(output: PracticeValue, input: PracticeRecord): void {
  const result = record(output); keys(result, ['points']);
  const actual = points(result);
  const initial = points(input);
  if (actual.length !== initial.length) throw new Error('输出坐标数量必须与输入相同');
  if (actual.some((point, index) => point[2] !== initial[index][2])) throw new Error('仿射变换必须精确保留点与方向的 w');
}

// Trusted arithmetic scaffold; the learner chooses the affine matrices and their order.
const matrixHelper = `return {
  multiply3(a, b) {
    return a.map((row) => b[0].map((_, j) =>
      row.reduce((sum, item, k) => sum + item * b[k][j], 0)));
  },
  apply3(matrix, point) {
    return matrix.map((row) => row.reduce((sum, item, i) => sum + item * point[i], 0));
  }
};`;

const compositionSolution = `const angle = params.degrees * Math.PI / 180;
const c = Math.cos(angle), s = Math.sin(angle);
const R = [[c, -s, 0], [s, c, 0], [0, 0, 1]];
const T = [[1, 0, params.tx], [0, 1, params.ty], [0, 0, 1]];
// 列向量：乘积最右侧的矩阵先作用。
const M = params.order === "R*T"
  ? api.multiply3(R, T)
  : api.multiply3(T, R);
api.trace("组合矩阵", M);
const points = input.points.map((point) => api.apply3(M, point));
api.trace("变换后坐标", points);
return { points };`;

const compositionTask: PracticeTask = {
  id: 'composition', title: '矩阵写在左边，就一定先执行吗？',
  question: '修正组合顺序，让 R*T 表示先平移再旋转。观察同一数组里 w=1 的点与 w=0 的方向。',
  pseudocode: ['按角度建立旋转矩阵 R，按偏移建立平移矩阵 T。', '按题目要求组成 R*T 或 T*R；对列向量，右侧先作用。', '把组合矩阵应用到每个齐次坐标，保留 w。'],
  starterCode: compositionSolution.replace('api.multiply3(R, T)\n  : api.multiply3(T, R)', 'api.multiply3(T, R)\n  : api.multiply3(R, T)'),
  solutionCode: compositionSolution,
  brokenCode: compositionSolution.replace('api.apply3(M, point)', 'api.apply3(M, [point[0], point[1], 1])'),
  helperSource: matrixHelper,
  cases: [
    { id: 'original-rt', label: '原课次序：R45*T(1,0)', input: { points: [[0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 0, 0]] }, params: { degrees: 45, tx: 1, ty: 0, order: 'R*T' } },
    { id: 'original-tr', label: '对照：T(1,0)*R45', input: { points: [[0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 0, 0]] }, params: { degrees: 45, tx: 1, ty: 0, order: 'T*R' } },
    { id: 'quarter-turn', label: '变式：90°与非零双轴偏移', input: { points: [[2, -1, 1], [-1, 3, 1], [2, -1, 0]] }, params: { degrees: 90, tx: 2, ty: -1, order: 'R*T' } },
    { id: 'negative-turn', label: '变式：反向旋转后平移', input: { points: [[-2, 1, 1], [0, 0, 1], [-2, 1, 0]] }, params: { degrees: -90, tx: -3, ty: 2, order: 'T*R' } },
  ],
  reference(input, params) {
    const angle = finite(params.degrees, 'degrees') * Math.PI / 180;
    const c = Math.cos(angle), s = Math.sin(angle);
    const tx = finite(params.tx, 'tx'), ty = finite(params.ty, 'ty');
    if (params.order !== 'R*T' && params.order !== 'T*R') throw new Error('未知矩阵次序');
    // Closed affine expressions, independent of the learner's matrix multiplication scaffold.
    return { points: points(input).map(([x, y, w]) => params.order === 'R*T'
      ? [c * x - s * y + (c * tx - s * ty) * w, s * x + c * y + (s * tx + c * ty) * w, w]
      : [c * x - s * y + tx * w, s * x + c * y + ty * w, w]) };
  },
  validateOutput: validatePoints, tolerance: 1e-9,
  explanation: 'R*T 把平移后的坐标一起旋转，T*R 则在旋转后沿原坐标轴平移。平移列乘的是 w，所以方向不会获得位置偏移。矩阵乘法由脚手架完成，本题检查组合含义。',
  variation: '先预测90°变式，再运行。指出哪个输出是方向，为什么改变 tx、ty 不应改变它的旋转结果。',
};

const pivotSolution = `const angle = params.degrees * Math.PI / 180;
const c = Math.cos(angle), s = Math.sin(angle);
const cx = params.pivotX, cy = params.pivotY;
const toOrigin = [[1, 0, -cx], [0, 1, -cy], [0, 0, 1]];
const R = [[c, -s, 0], [s, c, 0], [0, 0, 1]];
const back = [[1, 0, cx], [0, 1, cy], [0, 0, 1]];
// 先把中心移到原点，旋转后再移回。
const M = api.multiply3(back, api.multiply3(R, toOrigin));
api.trace("绕指定点的矩阵", M);
const points = input.points.map((point) => api.apply3(M, point));
api.trace("中心与其他坐标", points);
return { points };`;

const pivotTask: PracticeTask = {
  id: 'pivot', title: '绕指定中心旋转，中心为什么不动？',
  question: '起始代码漏掉了把中心移到原点的一步。修复组合，让中心保持原位置，并让方向只旋转。',
  pseudocode: ['平移 −c，使指定中心位于原点。', '绕原点旋转，再平移 c；组合为 T(c)*R*T(−c)。', '对所有点和方向使用同一个齐次变换。'],
  starterCode: pivotSolution.replace('api.multiply3(back, api.multiply3(R, toOrigin))', 'api.multiply3(back, R)'),
  solutionCode: pivotSolution,
  brokenCode: pivotSolution.replace('api.multiply3(back, api.multiply3(R, toOrigin))', 'api.multiply3(toOrigin, api.multiply3(R, back))'),
  helperSource: matrixHelper,
  cases: [
    { id: 'pivot-45', label: '绕(1,1)旋转45°', input: { points: [[1, 1, 1], [2, 1, 1], [1, 2, 1], [1, 0, 0]] }, params: { degrees: 45, pivotX: 1, pivotY: 1 } },
    { id: 'pivot-90', label: '变式：绕(2,-1)旋转90°', input: { points: [[2, -1, 1], [3, -1, 1], [2, 0, 1], [1, 0, 0]] }, params: { degrees: 90, pivotX: 2, pivotY: -1 } },
    { id: 'pivot-negative', label: '变式：负中心与反向旋转', input: { points: [[-2, 3, 1], [-1, 3, 1], [-2, 4, 1], [0, 1, 0]] }, params: { degrees: -90, pivotX: -2, pivotY: 3 } },
  ],
  reference(input, params) {
    const angle = finite(params.degrees, 'degrees') * Math.PI / 180;
    const c = Math.cos(angle), s = Math.sin(angle);
    const cx = finite(params.pivotX, 'pivotX'), cy = finite(params.pivotY, 'pivotY');
    return { points: points(input).map(([x, y, w]) => [
      c * x - s * y + ((1 - c) * cx + s * cy) * w,
      s * x + c * y + (-s * cx + (1 - c) * cy) * w, w,
    ]) };
  },
  validateOutput: validatePoints, tolerance: 1e-9,
  explanation: '指定中心在中间的旋转阶段位于原点，因此最后回到自身。方向的 w=0，两次平移都不增加偏移；它仍受旋转矩阵影响。',
  variation: '在90°变式中，先预测中心、中心右侧的点与方向各落在哪里，再运行检查。',
};

const timeSolution = `const positions = [input.initialPosition];
const times = [0];
let position = input.initialPosition;
let time = 0;
for (const [index, dt] of input.dts.entries()) {
  // 暂停步骤保留记录，但不推进模拟时间或位置。
  if (!input.paused[index]) {
    position += params.speed * dt;
    time += dt;
  }
  positions.push(position);
  times.push(time);
}
api.trace("总时间与终点", { time, position });
return { positions, times };`;

const timeCases: PracticeCase[] = [30, 60, 120].map((rate) => ({
  id: `rate-${rate}`, label: `${rate}次更新/模拟秒，累计2秒`,
  input: { initialPosition: 0, dts: Array.from({ length: rate * 2 }, () => 1 / rate), paused: Array.from({ length: rate * 2 }, () => false) }, params: { speed: 20 },
}));
timeCases.push(
  { id: 'uneven', label: '变式：不均匀步长，累计2秒', input: { initialPosition: 0, dts: [0.1, 0.3, 0.05, 0.55, 0.2, 0.8], paused: [false, false, false, false, false, false] }, params: { speed: 20 } },
  { id: 'zero-step', label: '变式：含零步长与非零起点', input: { initialPosition: 7, dts: [0, 0.5, 1.5], paused: [false, false, false] }, params: { speed: 20 } },
  { id: 'paused-steps', label: '变式：经过4秒，暂停占2秒，模拟2秒', input: { initialPosition: 0, dts: [0.5, 0.75, 0.5, 1, 1.25], paused: [false, true, false, false, true] }, params: { speed: 20 } },
);

function effectiveTimeSteps(input: PracticeRecord): number[] {
  const dts = numbers(input.dts, 'dts');
  if (dts.some((dt) => dt < 0)) throw new Error('步长不能为负');
  if (!Array.isArray(input.paused) || input.paused.length !== dts.length) throw new Error('paused 需与步长逐项对应');
  const paused = Array.from(input.paused);
  if (paused.some((value) => typeof value !== 'boolean')) throw new Error('paused 每项必须是布尔值');
  return dts.map((dt, i) => paused[i] ? 0 : dt);
}

const timeTask: PracticeTask = {
  id: 'delta-time', title: '每次加20，还是每秒前进20？',
  question: '起始代码按更新次数累计位移，还把暂停条件写反。修正这两处，使未暂停时按秒运动、暂停时保留模拟时间与位置。',
  pseudocode: ['保存初始时间0和初始位置。', '未暂停时用 speed*dt 累计位置、用 dt 累计模拟时间；暂停时保留状态。', '每个输入步骤都记录时间与位置，不截断题目提供的步长。'],
  starterCode: timeSolution.replace('position += params.speed * dt;', 'position += params.speed;').replace('if (!input.paused[index]) {', 'if (input.paused[index]) {'),
  solutionCode: timeSolution,
  brokenCode: timeSolution.replace('if (!input.paused[index]) {', 'if (true) {'),
  cases: timeCases,
  reference(input, params) {
    const initial = finite(input.initialPosition, 'initialPosition'), speed = finite(params.speed, 'speed');
    const dts = effectiveTimeSteps(input);
    // Evaluate x(t)=x0+v*t at independently computed prefix times, rather than integrate positions.
    const times = Array.from({ length: dts.length + 1 }, (_, i) => dts.slice(0, i).reduce((sum, dt) => sum + dt, 0));
    return { times, positions: times.map((time) => initial + speed * time) };
  },
  validateOutput(output, input) {
    const result = record(output); keys(result, ['positions', 'times']);
    const expectedLength = effectiveTimeSteps(input).length + 1;
    for (const key of ['positions', 'times']) if (numbers(result[key], key).length !== expectedLength) throw new Error(`${key} 要包含初始值与每一步结果`);
  },
  tolerance: 1e-9,
  explanation: '速度20表示每有效模拟秒前进20，累计2秒的位移应为40；非零起点还需加回初始位置。paused=true 即使伴随非零dt也不推进模拟，仍保留本步记录；暂停经过时间不在恢复时补算。题目步长不使用页面帧循环的长帧截断。',
  variation: '30、60、120是模拟更新次数，不是实测帧率。先预测不均匀、零步长与暂停案例的终点和平台段；恒速结果不推出所有物理积分都与步长无关。',
};

const samplingSolution = `const coverage = [], sampleX = [], hits = [];
const count = params.samples;
const left = input.left + params.offset;
const right = input.right + params.offset;
for (let pixel = 0; pixel < input.pixelCount; pixel++) {
  const positions = [];
  let hitCount = 0;
  for (let j = 0; j < count; j++) {
    const x = pixel + (j + 0.5) / count;
    positions.push(x);
    if (x >= left && x < right) hitCount++;
  }
  sampleX.push(positions);
  hits.push(hitCount);
  coverage.push(hitCount / count);
}
api.trace("窄带与命中数", { left, right, hits });
return { coverage, sampleX, hits };`;

const samplingCases: PracticeCase[] = [1, 4, 16].flatMap((samples) => [0, 0.375, 0.875, 0.9].map((offset) => ({
  id: `samples-${samples}-offset-${String(offset).replace('.', '-')}`,
  label: `${samples}子样本，窄带偏移${offset}`,
  input: { pixelCount: 4, left: 1, right: 1.25 }, params: { samples, offset },
})));
// Start with a case where both repeated-center sampling and a closed right boundary are observable.
samplingCases.unshift(...samplingCases.splice(samplingCases.findIndex((item) => item.params.samples === 4 && item.params.offset === 0.375), 1));

const samplingTask: PracticeTask = {
  id: 'pixel-average', title: '中心漏掉窄带，多点平均能看到什么？',
  question: '起始代码重复读取像素中心。把各次查询放到像素内不同子区间的中心，再平均二值覆盖；带边界约定为[left,right)。',
  pseudocode: ['像素i对应区间[i,i+1)，均匀分成N个子区间。', '在每个子区间中心取样；满足left≤x<right时记一次命中。', '命中数除以N得到采样覆盖，不要求它与解析覆盖完全相等。'],
  starterCode: samplingSolution.replace('pixel + (j + 0.5) / count', 'pixel + 0.5'),
  solutionCode: samplingSolution,
  brokenCode: samplingSolution.replace('x >= left && x < right', 'x >= left && x <= right'),
  cases: samplingCases,
  reference(input, params) {
    const pixelCount = finite(input.pixelCount, 'pixelCount'), count = finite(params.samples, 'samples');
    if (!Number.isInteger(pixelCount) || pixelCount < 1 || pixelCount > 256 || !Number.isInteger(count) || count < 1 || count > 64) throw new Error('像素数或采样数超出练习范围');
    const offset = finite(params.offset, 'offset');
    const left = finite(input.left, 'left') + offset, right = finite(input.right, 'right') + offset;
    if (right < left) throw new Error('窄带区间方向错误');
    // Count integer j in [N*(left-i)-1/2, N*(right-i)-1/2), independently of pointwise hit testing.
    const hits = Array.from({ length: pixelCount }, (_, i) => Math.max(0,
      Math.min(count, Math.ceil(count * (right - i) - 0.5)) - Math.max(0, Math.ceil(count * (left - i) - 0.5))));
    const sampleX = Array.from({ length: pixelCount }, (_, i) => Array.from({ length: count }, (_, j) => i + (j + 0.5) / count));
    return { coverage: hits.map((hitCount) => hitCount / count), hits, sampleX };
  },
  validateOutput(output, input) {
    const result = record(output); keys(result, ['coverage', 'sampleX', 'hits']);
    const pixelCount = finite(input.pixelCount, 'pixelCount');
    const coverage = numbers(result.coverage, 'coverage'), hits = numbers(result.hits, 'hits');
    if (!Array.isArray(result.sampleX) || coverage.length !== pixelCount || hits.length !== pixelCount || result.sampleX.length !== pixelCount) throw new Error('每个像素都需返回覆盖、位置列表和命中数');
    const rows = Array.from(result.sampleX, (row, i) => numbers(row, `sampleX[${i}]`));
    const count = rows[0]?.length ?? 0;
    if (count < 1 || count > 64 || rows.some((row) => row.length !== count)) throw new Error('各像素采样数须相同且在1—64内');
    if (coverage.some((value) => value < 0 || value > 1) || hits.some((value) => !Number.isInteger(value) || value < 0 || value > count)) throw new Error('覆盖或命中数超出范围');
  },
  tolerance: 1e-9,
  explanation: '每个样本查询的是二值函数，多点平均近似像素内的盒式预滤波。解析覆盖另由像素区间与窄带交集的长度给出；它用于解释误差，不是有限采样的判题答案。一维窄带是第6讲像素面积平均的降维模型。',
  variation: '对照N=1、4、16及四个偏移。特别看右边界上的样本为何不命中，以及offset=0.875时窄带跨像素后的面积分配；不要求逐像素误差随N单调下降。',
};

export const foundationalPractices: PracticeDefinition[] = [
  {
    id: '02', title: '矩阵次序与齐次坐标', version: 1, renderer: 'transform',
    summary: '修改短代码，比较列向量的组合次序、点与方向，以及绕指定中心旋转。',
    sources: [{ course: 'games101', chapter: '03', sectionIds: ['part-7', 'part-8', 'part-9', 'part-11', 'part-12', 'part-13'], label: 'GAMES101 第3讲 · 齐次坐标、组合次序与指定中心' }],
    tasks: [compositionTask, pivotTask],
    limitations: ['使用二维3×3仿射矩阵、列向量、逆时针正角；不含相机投影。', '矩阵乘法是已提供的算术脚手架，任务验收组合含义，不验收库或语言操作。'],
  },
  {
    id: '04', title: '经过时间与恒速运动', version: 1, renderer: 'time',
    summary: '让速度按模拟秒计量，比较均匀、不均匀和零步长的累积结果。',
    sources: [{ course: 'unity', chapter: '1.2', sectionIds: ['part-3', 'part-5'], label: 'Unity 1.2 · 车辆前移与速度控制' }],
    tasks: [timeTask],
    limitations: ['一维恒速运动，不处理刚体、碰撞、加速度或数值积分稳定性。', '更新频率是题目生成的模拟条件；累计时间不代表浏览器帧率或后台墙钟。'],
  },
  {
    id: '09', title: '窄带采样与像素平均', version: 1, renderer: 'sampling',
    summary: '把重复中心查询改成像素内多点平均，观察窄带的遗漏、边界和有限采样误差。',
    sources: [{ course: 'games101', chapter: '06', sectionIds: ['part-3', 'part-13', 'part-14'], label: 'GAMES101 第6讲 · 预滤波、像素范围平均与多点近似' }],
    tasks: [samplingTask],
    limitations: ['一维覆盖信号的盒式平均模型，不声称完整实现GPU MSAA或二维纹理过滤。', '正确答案是指定位置的有限采样结果；解析区间长度只作独立误差参照，不承诺误差单调下降。'],
  },
];
