import type { PracticeDefinition, PracticeRecord, PracticeTask } from './practice-types.ts';
import { dataArray, finiteNumber, vector3, vectorRows, dataObject, exactFields } from './practice-data.ts';

function camera(params: PracticeRecord) {
  const eye = vector3(params.eye, 'eye'), gaze = vector3(params.gaze, 'gaze'), up = vector3(params.up, 'up');
  if (Math.abs(Math.hypot(...gaze) - 1) > 1e-9 || Math.abs(Math.hypot(...up) - 1) > 1e-9 || Math.abs(gaze.reduce((sum, n, i) => sum + n * up[i], 0)) > 1e-9) throw new Error('本题 gaze 与 up 需要互相垂直且为单位方向');
  return { eye, gaze, up };
}
const viewSolution = `const { eye, gaze, up } = params;
// 相机右方为 gaze × up，相机看向自身 -Z。
const right = [gaze[1]*up[2] - gaze[2]*up[1],
  gaze[2]*up[0] - gaze[0]*up[2], gaze[0]*up[1] - gaze[1]*up[0]];
const dot = (a, b) => a.reduce((sum, n, i) => sum + n*b[i], 0);
const cameraPoints = input.points.map(point => {
  const delta = point.map((n, i) => n - eye[i]);
  return [dot(right, delta), dot(up, delta), -dot(gaze, delta)];
});
api.trace("相机坐标", cameraPoints);
return { cameraPoints };`;
// Cramer's rule solves worldDelta = right*x + up*y - gaze*z independently of learner dot-products.
function determinant(m: number[][]): number {
  return m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
}
const viewTask: PracticeTask = {
  id: 'view', title: '相机移动后，世界坐标怎样变成观察坐标？',
  question: '先减相机位置，再在相机的右、上、后方向上取分量。修正初始代码的相机平移符号。',
  guidance: { given: 'eye 是相机位置；gaze 是单位观察方向；up 是与它垂直的单位向上方向。平台给出世界中的点。', issue: '初始代码加上了 eye，相机平移时点的相对位置会朝错误方向改变。', edit: '在下方 delta 那一行修正相机平移；保留右、上与负观察方向的投影。', observe: 'eye=(1,2,3)、看向-Z时，点(2,2,1)应变成(1,0,-2)。相机和物体共同平移后画面坐标不变。', terms: '固定列向量；相机自身的前方是-Z，right=gaze×up。这里只求观察坐标，还没有投影。' },
  pseudocode: ['先把相机送到原点，对点减去 eye。', '在 right、up、-gaze 三个正交轴上求分量。', '换一个转向相机核对，不把世界坐标直接当观察坐标。'],
  starterCode: viewSolution.replace('const delta = point.map((n, i) => n - eye[i]);', 'const delta = point.map((n, i) => n + eye[i]); // TODO：修正平移符号。'),
  solutionCode: viewSolution,
  brokenCode: viewSolution.replace('-dot(gaze, delta)', 'dot(gaze, delta)'),
  cases: [
    { id: 'translated', label: '平移相机：看向-Z', input: { points: [[2, 2, 1], [1, 2, 3], [0, 3, -1]] }, params: { eye: [1, 2, 3], gaze: [0, 0, -1], up: [0, 1, 0] } },
    { id: 'common-shift', label: '相机与物体共同平移(5,-2,1)', input: { points: [[7, 0, 2], [6, 0, 4], [5, 1, 0]] }, params: { eye: [6, 0, 4], gaze: [0, 0, -1], up: [0, 1, 0] } },
    { id: 'turned', label: '转向：相机看向+X', input: { points: [[5, 1, 5], [1, 2, 3], [-1, 4, 2]] }, params: { eye: [1, 2, 3], gaze: [1, 0, 0], up: [0, 1, 0] } },
    { id: 'tilted', label: '倾斜正交相机基', input: { points: [[3, 5, 7], [1, 2, 3]] }, params: { eye: [1, 2, 3], gaze: [0, 0.6, -0.8], up: [0, 0.8, 0.6] } },
  ],
  reference(input, params) {
    const { eye, gaze: g, up: u } = camera(params);
    const r = [g[1] * u[2] - g[2] * u[1], g[2] * u[0] - g[0] * u[2], g[0] * u[1] - g[1] * u[0]];
    const basis = [0, 1, 2].map(i => [r[i], u[i], -g[i]]), det = determinant(basis);
    return { cameraPoints: dataArray(input.points, 'points').map(point => {
      const p = vector3(point, 'point').map((v, i) => v - eye[i]);
      return [0, 1, 2].map(column => determinant(basis.map((row, i) => row.map((v, j) => j === column ? p[i] : v))) / det);
    }) };
  },
  validateOutput(output, input) { vectorRows(output, 'cameraPoints', dataArray(input.points, 'points').length); }, tolerance: 1e-9,
  explanation: '视图变换使用相机框架的逆：先平移-eye，再将世界中的相对位置表达在相机轴上。gaze是前方，但相机坐标的前方是-Z，所以第三分量取负。共同平移不改变相对位置。',
  variation: '先比较共同平移前后，再预测看向+X时世界+Z处的点会落在相机哪侧。视图坐标的Z仍是深度，尚未被除掉。',
};

function frustum(params: PracticeRecord) {
  const l = finiteNumber(params.left, 'left'), r = finiteNumber(params.right, 'right'), b = finiteNumber(params.bottom, 'bottom'), t = finiteNumber(params.top, 'top');
  const n = finiteNumber(params.near, 'near'), f = finiteNumber(params.far, 'far');
  if (!(l < r && b < t && f < n && n < 0)) throw new Error('需要 left<right、bottom<top，且 far<near<0（原课坐标，不是正距离）');
  if (params.mode !== 'perspective' && params.mode !== 'orthographic') throw new Error('mode 只能为 perspective 或 orthographic');
  return { l, r, b, t, n, f };
}
const projectionSolution = `const { left:l, right:r, bottom:b, top:t, near:n, far:f, mode } = params;
const projected = input.points.map(([x, y, z]) => {
  const perspective = mode === "perspective";
  const w = perspective ? z : 1;
  if (w === 0) return { ndc: null, w, region: "undefined" };
  // 先写齐次结果，再统一除以 w；原课近面映到+1，远面映到-1。
  const hx = perspective ? 2*n*x/(r-l) - (r+l)*z/(r-l) : 2*x/(r-l) - (r+l)/(r-l);
  const hy = perspective ? 2*n*y/(t-b) - (t+b)*z/(t-b) : 2*y/(t-b) - (t+b)/(t-b);
  const hz = perspective ? (n+f)*z/(n-f) - 2*n*f/(n-f) : 2*z/(n-f) - (n+f)/(n-f);
  const ndc = [hx / w, hy / w, hz / w];
  const inside = ndc.every(v => Math.abs(v) <= 1 + 1e-9);
  const region = z >= 0 ? "behind" : inside ? "inside" : "outside";
  return { ndc, w, region };
});
api.trace("投影坐标与分类", projected);
return { projected };`;
const base = { left: -1, right: 1, bottom: -1, top: 1, near: -1, far: -10 };
const depthPoints = [[1, 0, -2], [1, 0, -4], [0, 0, -1], [0, 0, -10], [1, 0, 2], [1, 0, 0], [0, 0, -0.5], [0, 0, -11], [5, 0, -2]];
const projectionTask: PracticeTask = {
  id: 'projection', title: '远处为什么变小？齐次坐标在哪里做除法？',
  question: '补上齐次除法，比较正交与透视。近远面使用负Z坐标，保持GAMES101原课符号约定。',
  guidance: { given: '相机看向-Z，near=-1、far=-10。左右上下是近平面范围。相同x=1、z=-2/-4的点用于比较远近大小。', issue: '初始代码直接拿齐次分量当结果，透视少了除以w，远近缩小关系错误。', edit: '在下方 ndc 那一行，对hx、hy、hz分别除以w；保留w=0的显式分支。', observe: '透视时两个点的x分别为0.5和0.25；正交均为1。近面深度为+1，远面为-1。后方、范围外与无法除法分别标注。', terms: 'ndc 是规范坐标。透视按原课取w=z；w=0不能除。region只分类，不执行裁剪或光栅化。' },
  pseudocode: ['按模式构造齐次坐标和w。', '若w为零，返回null并说明无法定义；其余分量除以w。', '保留深度、后方和视域分类，比较两种模式。'],
  starterCode: projectionSolution.replace('const ndc = [hx / w, hy / w, hz / w];', 'const ndc = [hx, hy, hz]; // TODO：齐次结果要怎样恢复为普通坐标？'),
  solutionCode: projectionSolution,
  brokenCode: projectionSolution.replace('hz / w', '-hz / w'),
  cases: [
    { id: 'perspective', label: '透视：远近、边界、后方与w=0', input: { points: depthPoints }, params: { ...base, mode: 'perspective' } },
    { id: 'orthographic', label: '正交：相同横向位置不随深度缩小', input: { points: depthPoints }, params: { ...base, mode: 'orthographic' } },
    { id: 'off-center', label: '非对称近平面与不同近远范围', input: { points: [[0, 0, -2], [2, 1, -2], [4, 2, -4], [0, 0, -8], [-3, 0, -2]] }, params: { left: -2, right: 4, bottom: -1, top: 3, near: -2, far: -8, mode: 'perspective' } },
  ],
  reference(input, params) {
    const { l, r, b, t, n, f } = frustum(params), perspective = params.mode === 'perspective';
    return { projected: dataArray(input.points, 'points').map(point => {
      const [x, y, z] = vector3(point, 'point');
      if (perspective && z === 0) return { ndc: null, w: 0, region: 'undefined' };
      // Similar triangles and two endpoint constraints, followed by an affine box normalization.
      const box = perspective ? [n * x / z, n * y / z, n + f - n * f / z] : [x, y, z];
      const ndc = [(box[0] - l) * 2 / (r - l) - 1, (box[1] - b) * 2 / (t - b) - 1, (box[2] - f) * 2 / (n - f) - 1];
      const within = box[0] >= l - 1e-9 && box[0] <= r + 1e-9 && box[1] >= b - 1e-9 && box[1] <= t + 1e-9 && z >= f - 1e-9 && z <= n + 1e-9;
      return { ndc, w: perspective ? z : 1, region: z >= 0 ? 'behind' : within ? 'inside' : 'outside' };
    }) };
  },
  validateOutput(output, input) {
    const result = dataObject(output); exactFields(result, ['projected']); const rows = dataArray(result.projected, 'projected');
    if (rows.length !== dataArray(input.points, 'points').length) throw new Error('投影输出数量必须与输入相同');
    rows.forEach(value => {
      const row = dataObject(value); exactFields(row, ['ndc', 'w', 'region']); const w = finiteNumber(row.w, 'w');
      if (row.ndc === null) { if (w !== 0 || row.region !== 'undefined') throw new Error('null仅用于w=0且无法定义的结果'); }
      else { vector3(row.ndc, 'ndc'); if (w === 0) throw new Error('w=0时不得输出有限投影冒充结果'); }
      if (!['inside', 'outside', 'behind', 'undefined'].includes(String(row.region))) throw new Error('未知投影分类');
    });
  }, tolerance: 1e-9,
  explanation: '齐次分量除以w才是规范坐标。原课压缩使用w=z，横纵变为nx/z、ny/z，远处点变小；正交w=1不随深度改变横纵比例。原课near与far是负坐标，近面映到+1、远面映到-1，不照搬其他渲染库约定。',
  variation: '先检查两种模式的横向尺度，再检查近远端点和w=0。绿色只表示你的分类是inside；是否正确仍要看独立基准比较。',
};
export const cameraPractice: PracticeDefinition = {
  id: '03', title: '相机与投影', version: 1, renderer: 'spatial',
  summary: '先求相对于相机的坐标，再分别观察正交、透视与齐次除法；把空间深度和画面大小分开核对。',
  sources: [{ course: 'games101', chapter: '04', sectionIds: [5, 6, 7, 8, 9, 10, 11, 12, 13].map(n => `part-${n}`), label: 'GAMES101 第4讲 · 视图与投影' }],
  tasks: [viewTask, projectionTask],
  limitations: ['固定列向量、相机看向-Z；gaze与up必须单位且垂直。', '沿原课far<near<0约定，近深度+1、远深度-1，与部分图形API的规范深度不同。', '只运行CPU坐标子机制；分类不等于裁剪，不包含完整渲染管线或交互相机。'],
};
