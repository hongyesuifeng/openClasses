import type { PracticeDefinition, PracticeRecord, PracticeTask, PracticeValue } from './practice-types.ts';

type Triple = [number, number, number];
function triple(value: PracticeValue | undefined, label: string): Triple {
  if (!Array.isArray(value) || value.length !== 3 || Array.from(value).some(v => typeof v !== 'number' || !Number.isFinite(v) || Math.abs(v) > 1e12)) {
    throw new Error(`${label} 必须是三个有限坐标，分量绝对值不超过 10^12`);
  }
  return value as Triple;
}
function pair(input: PracticeRecord): [Triple, Triple] { return [triple(input.a, 'a'), triple(input.b, 'b')]; }
function outputRecord(value: PracticeValue, fields: string[]): PracticeRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).sort().join('|') !== [...fields].sort().join('|')) {
    throw new Error(`结果必须包含且仅包含 ${fields.join('、')}`);
  }
  return value;
}
function scalar(value: PracticeValue | undefined, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`${label} 必须是有限数值`);
  return value;
}
function resultTriple(value: PracticeValue | undefined, label: string): void {
  if (!Array.isArray(value) || value.length !== 3) throw new Error(`${label} 必须是三个分量`);
  Array.from(value, (v, i) => scalar(v, `${label}[${i}]`));
}

const directionSolution = `const displacement = input.b.map((value, axis) => value - input.a[axis]);
const length = Math.hypot(...displacement);
// 位置相减得到位移；位移再除以自己的长度。
let direction = null;
if (length !== 0) {
  direction = displacement.map(value => value / length);
}
api.trace("从 A 指向 B 的位移", displacement);
api.trace("长度与单位方向", { length, direction });
return { displacement, length, direction };`;

const directionTask: PracticeTask = {
  id: 'direction', title: '两个点怎样得到方向，怎样去掉距离？',
  question: '先修正 A 到 B 的位移，再保留长度为零时没有单位方向的约定。',
  guidance: {
    given: 'a、b 是三维点。默认 a=(1,2,0)、b=(4,6,0)，箭头必须从 a 指向 b。',
    issue: '初始代码把相减次序写反，得到的是从 b 指向 a 的箭头。',
    edit: '在深色代码框的 TODO 处调整相减次序。非零位移除以其长度；两点重合时 direction 必须为 null。',
    observe: '默认位移应为(3,4,0)，长度5，单位方向(0.6,0.8,0)。切换共同平移和重合点条件，观察哪些结果改变。',
    terms: 'displacement=位移，length=长度，direction=单位方向；null 表示方向未定义，不表示零方向。',
  },
  pseudocode: ['位移=B−A。', '求位移长度；非零时逐分量除以长度。', '零位移没有单位方向，返回 null。'],
  starterCode: directionSolution.replace('const displacement =', '// TODO：箭头从 a 指向 b，检查相减次序。\nconst displacement =').replace('value - input.a[axis]', 'input.a[axis] - value'),
  solutionCode: directionSolution,
  brokenCode: directionSolution.replace('value / length', 'value'),
  cases: [
    { id: 'three-four', label: 'A(1,2,0) → B(4,6,0)', input: { a: [1, 2, 0], b: [4, 6, 0] }, params: {} },
    { id: 'translated', label: '变式：两个点共同平移', input: { a: [8, -1, 2], b: [11, 3, 2] }, params: {} },
    { id: 'reverse', label: '变式：交换起点与终点', input: { a: [4, 6, 0], b: [1, 2, 0] }, params: {} },
    { id: 'spatial', label: '变式：包含非零 Z 分量', input: { a: [-1, 2, -3], b: [1, -1, 3] }, params: {} },
    { id: 'coincident', label: '边界：两个点重合', input: { a: [2, -3, 4], b: [2, -3, 4] }, params: {} },
  ],
  reference(input) {
    const [[ax, ay, az], [bx, by, bz]] = pair(input);
    const x = bx - ax, y = by - ay, z = bz - az;
    const length = Math.sqrt(x * x + y * y + z * z);
    return { displacement: [x, y, z], length, direction: length === 0 ? null : [x / length, y / length, z / length] };
  },
  validateOutput(value, input) {
    const output = outputRecord(value, ['displacement', 'length', 'direction']);
    pair(input); resultTriple(output.displacement, 'displacement');
    if (scalar(output.length, 'length') < 0) throw new Error('length 不能为负');
    if (output.direction !== null) resultTriple(output.direction, 'direction');
  },
  tolerance: 1e-9,
  explanation: '点描述位置，两点之差描述从起点到终点的位移。共同平移两点会在相减时抵消。归一化只去掉长度，保留朝向；零位移没有朝向，必须明确返回 null。',
  variation: '先预测交换 A、B 后的长度和方向，再运行。两点重合时，说明为什么不能拿(0,0,0)冒充单位方向。',
};

const dotSolution = `const dot = input.a.reduce((sum, value, axis) => sum + value * input.b[axis], 0);
const lengthA = Math.hypot(...input.a), lengthB = Math.hypot(...input.b);
// 非单位向量的点积还包含两边的长度。
const cosine = lengthA === 0 || lengthB === 0
  ? null : dot / (lengthA * lengthB);
// 将 a 投影到 b 方向；参考轴 b 为零时投影未定义。
const projection = lengthB === 0 ? null
  : input.b.map(value => value * dot / (lengthB * lengthB));
api.trace("点积与夹角余弦", { dot, cosine });
api.trace("a 在 b 上的投影", projection);
return { dot, cosine, projection };`;

const dotTask: PracticeTask = {
  id: 'dot-projection', title: '点积能直接当夹角余弦吗？',
  question: '保持原始点积，修复非单位向量的夹角余弦，并核对 a 在 b 方向上的投影。',
  guidance: {
    given: 'a、b 是向量，默认 a=(3,4,0)、b=(2,0,0)。本题把 a 投影到 b，b 是参考方向。',
    issue: '初始代码直接把点积6当作夹角余弦，忽略了向量长度。',
    edit: '修改 TODO 处的 cosine，除去两边长度；保留零向量时返回 null 的条件。投影部分已给出，请通过变式检查。',
    observe: '默认点积6、余弦0.6，投影(3,0,0)。放大参考轴 b 后，点积变化，余弦与投影不随其长度改变。',
    terms: 'dot=点积，cosine=夹角余弦，projection=投影向量。零 b 没有投影轴；零 a 到非零 b 的投影仍为零向量。',
  },
  pseudocode: ['对应分量乘积求和，得到点积。', '两向量均非零时，点积除以两边长度得到余弦。', '投影=(a·b)/(b·b) × b；b为零时返回 null。'],
  starterCode: dotSolution.replace('const cosine =', '// TODO：非单位向量的点积还需要去掉什么？\nconst cosine =').replace('dot / (lengthA * lengthB)', 'dot'),
  solutionCode: dotSolution,
  brokenCode: dotSolution.replace('dot / (lengthB * lengthB)', 'dot / lengthB'),
  cases: [
    { id: 'non-unit', label: '非单位向量：a(3,4,0)、b(2,0,0)', input: { a: [3, 4, 0], b: [2, 0, 0] }, params: {} },
    { id: 'scaled-axis', label: '变式：参考轴放大为原来的3倍', input: { a: [3, 4, 0], b: [6, 0, 0] }, params: {} },
    { id: 'opposite', label: '变式：参考方向反向', input: { a: [3, 4, 0], b: [-2, 0, 0] }, params: {} },
    { id: 'spatial-dot', label: '变式：三维非轴向输入', input: { a: [1, 2, 3], b: [4, -1, 2] }, params: {} },
    { id: 'orthogonal', label: '变式：非零正交向量', input: { a: [0, 2, 0], b: [3, 0, 0] }, params: {} },
    { id: 'zero-a', label: '边界：被投影向量为零', input: { a: [0, 0, 0], b: [2, 0, 0] }, params: {} },
    { id: 'zero-b', label: '边界：参考轴为零', input: { a: [1, 2, 3], b: [0, 0, 0] }, params: {} },
  ],
  reference(input) {
    const [[ax, ay, az], [bx, by, bz]] = pair(input);
    // Independent analytic form: normalize the reference axis, then use a signed component.
    const squareA = ax * ax + ay * ay + az * az, squareB = bx * bx + by * by + bz * bz;
    const dot = ax * bx + ay * by + az * bz;
    if (squareB === 0) return { dot, cosine: null, projection: null };
    const normB = Math.sqrt(squareB), unitB = [bx / normB, by / normB, bz / normB];
    const component = ax * unitB[0] + ay * unitB[1] + az * unitB[2];
    return { dot, cosine: squareA === 0 ? null : component / Math.sqrt(squareA), projection: unitB.map(v => v * component) };
  },
  validateOutput(value, input) {
    pair(input); const output = outputRecord(value, ['dot', 'cosine', 'projection']); scalar(output.dot, 'dot');
    // A finite but mathematically wrong cosine is still drawable learner output.
    // The independent reference comparison explains the error (e.g. 6 versus 0.6).
    if (output.cosine !== null) scalar(output.cosine, 'cosine');
    if (output.projection !== null) resultTriple(output.projection, 'projection');
  },
  tolerance: 1e-9,
  explanation: '只有两向量都为单位长度，点积才直接等于夹角余弦。投影先求沿单位参考方向的带符号分量，再乘回该单位方向。参考轴放大或反向不会改变投影向量所落的直线分量；反向会改变余弦符号。',
  variation: '切换参考轴放大、反向与零向量条件，说明点积、余弦、投影各依赖什么；区分未定义的夹角与值为零的投影。',
};

const crossSolution = `const [ax, ay, az] = input.a;
const [bx, by, bz] = input.b;
// 右手系，次序固定为 a × b。
const cross = [
  ay * bz - az * by,
  az * bx - ax * bz,
  ax * by - ay * bx
];
const area = Math.hypot(...cross);
api.trace("a 叉乘 b", cross);
api.trace("平行四边形面积", area);
return { cross, area };`;

const crossTask: PracticeTask = {
  id: 'cross', title: '交换叉积次序，方向为什么反过来？',
  question: '修正叉积方向，分别观察右手定则的方向与平行四边形面积。',
  guidance: {
    given: '采用右手坐标系，返回 a×b；默认 a=(1,0,0)、b=(0,1,0)。',
    issue: '初始代码的每个分量相减次序都反了，算成 b×a。',
    edit: '修改 TODO 标记的三个叉积分量，按 a×b 的顺序写。不要通过取绝对值隐藏负号。',
    observe: '默认叉积应指向+Z。交换 a、b 后指向−Z，面积保持1；平行向量的叉积和面积都为零。',
    terms: 'cross=叉积向量；area=两向量张成的平行四边形面积。方向采用右手系，面积总是非负。',
  },
  pseudocode: ['按右手系计算 a×b 的三个分量。', '叉积长度等于平行四边形面积。', '交换输入时向量反号，长度保持；平行时结果为零。'],
  starterCode: crossSolution.replace('const cross =', '// TODO：检查三个分量的相减次序。\nconst cross =').replace('ay * bz - az * by', 'az * by - ay * bz').replace('az * bx - ax * bz', 'ax * bz - az * bx').replace('ax * by - ay * bx', 'ay * bx - ax * by'),
  solutionCode: crossSolution,
  brokenCode: crossSolution.replace('const area =', 'for (let i = 0; i < 3; i++) cross[i] = Math.abs(cross[i]);\nconst area ='),
  cases: [
    { id: 'xy', label: '右手系：X×Y', input: { a: [1, 0, 0], b: [0, 1, 0] }, params: {} },
    { id: 'yx', label: '变式：交换为Y×X', input: { a: [0, 1, 0], b: [1, 0, 0] }, params: {} },
    { id: 'yz', label: '变式：Y×Z', input: { a: [0, 2, 0], b: [0, 0, 3] }, params: {} },
    { id: 'spatial-cross', label: '变式：三维非轴向输入', input: { a: [1, 2, 3], b: [4, -1, 2] }, params: {} },
    { id: 'parallel', label: '边界：平行向量', input: { a: [1, -2, 3], b: [-2, 4, -6] }, params: {} },
    { id: 'zero', label: '边界：一个向量为零', input: { a: [0, 0, 0], b: [2, 3, 4] }, params: {} },
  ],
  reference(input) {
    const [[x, y, z], b] = pair(input);
    // Skew-symmetric matrix form, independent of the learner's component expression.
    const matrix = [[0, -z, y], [z, 0, -x], [-y, x, 0]];
    const cross = matrix.map(row => row.reduce((sum, coefficient, i) => sum + coefficient * b[i], 0));
    return { cross, area: Math.sqrt(cross.reduce((sum, v) => sum + v * v, 0)) };
  },
  validateOutput(value, input) {
    pair(input); const output = outputRecord(value, ['cross', 'area']); resultTriple(output.cross, 'cross');
    if (scalar(output.area, 'area') < 0) throw new Error('area 不能为负');
  },
  tolerance: 1e-9,
  explanation: '叉积同时包含垂直方向与大小；交换顺序使方向反转，不能把每个分量取绝对值。其长度为两向量张成的平行四边形面积，因此不随交换顺序改变。平行或零输入产生零叉积，不能据此取单位法线。',
  variation: '先预测 Y×X 和三维输入的正负号，再运行。指出零叉积为何没有可归一化的法线方向。',
};

export const vectorPractice: PracticeDefinition = {
  id: '01', title: '点与向量', version: 1,
  summary: '分三个短任务比较位置差、单位方向、点积投影和叉积朝向，明确零向量的边界。',
  sources: [{ course: 'games101', chapter: '02', sectionIds: [2, 3, 5, 6, 7, 8, 9, 10].map(n => `part-${n}`), label: 'GAMES101 第2讲 · 向量、点积、叉积与坐标基' }],
  tasks: [directionTask, dotTask, crossTask], renderer: 'spatial',
  limitations: ['使用三维普通数组与解析计算，非完整线性代数课程。', '零方向或零参考轴通过 null 明确未定义；不虚构零夹角。', '两幅坐标投影只用于查看真实输出；本实验不实现三角形内外测试或完整坐标基转换。'],
};
