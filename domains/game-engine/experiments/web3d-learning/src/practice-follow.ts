import type { PracticeCase, PracticeDefinition, PracticeRecord, PracticeTask, PracticeValue } from './practice-types.ts';

function triple(value: PracticeValue | undefined, name: string, maximum = 1e12): number[] {
  if (!Array.isArray(value) || value.length !== 3 || Array.from(value).some(v => typeof v !== 'number' || !Number.isFinite(v) || Math.abs(v) > maximum)) throw new Error(`${name} 必须是三个有限数值，分量绝对值不超过${maximum}`);
  return value as number[];
}
function timeline(input: PracticeRecord): number[][] {
  if (!Array.isArray(input.positions) || input.positions.length < 1 || input.positions.length > 200) throw new Error('positions 必须含1—200帧位置');
  triple(input.initialPlayer, 'initialPlayer'); triple(input.initialCamera, 'initialCamera');
  return Array.from(input.positions, (v, i) => triple(v, `positions[${i}]`));
}
function validateOutput(output: PracticeValue, input: PracticeRecord): void {
  const positions = timeline(input);
  if (!output || typeof output !== 'object' || Array.isArray(output) || Object.keys(output).join('|') !== 'cameraPositions' || !Array.isArray(output.cameraPositions)) {
    throw new Error('输出必须且仅包含 cameraPositions 数组');
  }
  if (output.cameraPositions.length !== positions.length) throw new Error('每个输入帧都应有一个相机位置');
  Array.from(output.cameraPositions, (v, i) => triple(v, `cameraPositions[${i}]`, 2e12));
}

const followCases: PracticeCase[] = [
  { id: 'course-offset', label: '原课偏移(0,5,-7)：移动与转向位置', input: { initialPlayer: [0, 0, 0], initialCamera: [0, 5, -7], positions: [[0, 0, 0], [0, 0, 2], [2, 0, 3]] }, params: { offset: [0, 5, -7] } },
  { id: 'nonzero-start', label: '变式：非零起点和改变高度', input: { initialPlayer: [10, 2, -4], initialCamera: [10, 7, -11], positions: [[10, 2, -3], [9, 3, -1], [9, 3, -1], [7, -2, 0]] }, params: { offset: [0, 5, -7] } },
  { id: 'different-offset', label: '变式：偏移可调整，相机起点不会累积', input: { initialPlayer: [-2, 0, 1], initialCamera: [30, -20, 10], positions: [[-1, 0, 1], [-1, 0, 1], [0, 2, -2]] }, params: { offset: [2, 3, -4] } },
  { id: 'reverse-zero', label: '变式：返回起点、停留和反向', input: { initialPlayer: [0, 0, 0], initialCamera: [0, 5, -7], positions: [[0, 0, 5], [0, 0, 0], [0, 0, 0], [-3, 0, -2]] }, params: { offset: [0, 5, -7] } },
];

// Trusted analytic reference reads the specified final player snapshot for each frame;
// it does not reuse the learner loop, state variable, or update-order scaffold.
function reference(input: PracticeRecord, params: PracticeRecord): PracticeValue {
  const positions = timeline(input), [dx, dy, dz] = triple(params.offset, 'offset');
  return { cameraPositions: positions.map(([x, y, z]) => [x + dx, y + dy, z + dz]) };
}

const offsetSolution = `let camera = api.clone(input.initialCamera);
const cameraPositions = [];
for (const [frame, player] of input.positions.entries()) {
  // 每帧重新由玩家位置确定相机位置，不在旧相机位置上累加。
  camera = player.map((value, axis) => value + params.offset[axis]);
  cameraPositions.push(api.clone(camera));
  api.trace("第" + (frame + 1) + "帧", { player, camera });
}
api.trace("固定偏移", params.offset);
return { cameraPositions };`;

const offsetTask: PracticeTask = {
  id: 'offset', title: '偏移应该加在玩家位置，还是相机旧位置上？',
  question: '修复相机位置赋值，让每帧相机与玩家保持同一观察偏移。',
  guidance: {
    given: 'positions 是逐帧玩家位置，offset 默认采用原课(0,5,-7)。位置时间线是本题固定验收输入。',
    issue: '初始代码每帧在旧相机位置上再加一次偏移，相机越走越远。',
    edit: '在 TODO 处改为“本帧玩家位置+offset”。保留每帧记录，不把固定偏移反复累加。',
    observe: '默认三帧相机应依次为(0,5,-7)、(0,5,-5)、(2,5,-4)。切到停留帧，玩家不动时相机也应不动。',
    terms: 'player=本帧玩家位置；camera=相机位置；offset=相机相对玩家的固定世界坐标偏移。',
  },
  pseudocode: ['读取当前帧玩家位置。', '相机位置=玩家位置+固定偏移。', '记录后进入下一帧，不在旧相机位置累加偏移。'],
  starterCode: offsetSolution.replace('camera = player.map', '// TODO：相机应该以谁的位置为基准？\n  camera = camera.map'),
  solutionCode: offsetSolution,
  brokenCode: offsetSolution.replace('value + params.offset[axis]', 'value - params.offset[axis]'),
  cases: followCases.map(item => structuredClone(item)), reference, validateOutput, tolerance: 1e-9,
  explanation: 'offset 描述相机与玩家之间的位置差。每帧从玩家新位置重新计算，就能保持固定关系；在相机旧位置上反复加偏移会把同一距离不断累积。这里沿原课使用固定世界坐标偏移，不实现旋转后的局部跟随。',
  variation: '切换非零起点、可调整偏移和停留帧，先预测位置差，再运行。说明为什么相机的任意旧位置不应影响本帧目标位置。',
};

const orderSolution = `let player = api.clone(input.initialPlayer);
const cameraPositions = [];
for (const [frame, currentPlayer] of input.positions.entries()) {
  // 先接收玩家本帧更新，再读取玩家位置进行跟随。
  player = api.clone(currentPlayer);
  const camera = player.map((value, axis) => value + params.offset[axis]);
  cameraPositions.push(api.clone(camera));
  api.trace("第" + (frame + 1) + "帧的顺序", { player, camera });
}
return { cameraPositions };`;

const orderTask: PracticeTask = {
  id: 'update-order', title: '相机跟随读到的是本帧，还是上一帧？',
  question: '只调整更新先后，让相机在每一帧都读取更新完成后的玩家位置。',
  guidance: {
    given: 'currentPlayer 是玩家完成本帧更新后的快照，player 起初保存上一帧位置；偏移公式已给出。',
    issue: '初始代码先计算相机，再更新 player，因此读取到上一帧的位置。',
    edit: '把 TODO 标记的 player 更新移到计算 camera 之前。这里只修改先后顺序，不添加平滑或额外时间。',
    observe: '转向、反向或第一次移动时，逐帧核对相机位置与本帧玩家位置之差；两者应始终等于 offset。',
    terms: 'currentPlayer=本帧更新完成的快照；player=跟随代码当前读到的位置。网页按固定帧序重放，不测量 Unity 实际抖动。',
  },
  pseudocode: ['完成玩家本帧位置更新。', '再从更新后的位置计算相机。', '记录当前帧，不使用上一帧快照。'],
  starterCode: orderSolution.replace('  player = api.clone(currentPlayer);\n', '').replace('  cameraPositions.push', '  // TODO：玩家位置更新放在这里，跟随读到哪一帧？\n  player = api.clone(currentPlayer);\n  cameraPositions.push'),
  solutionCode: orderSolution,
  brokenCode: orderSolution.replace('player = api.clone(currentPlayer);', 'player = api.clone(input.initialPlayer);'),
  cases: followCases.map(item => structuredClone(item)), reference, validateOutput, tolerance: 1e-9,
  explanation: '偏移公式正确仍不够，读取时机决定它使用本帧还是上一帧位置。原课把相机跟随放到 LateUpdate，在玩家 Update 更新之后读取。本题只离散验证这个先后关系，不能据此宣称测量或消除真实引擎的全部抖动。',
  variation: '切换首次立即移动和反向移动条件，预测错误版本落后一帧的位置，再修正顺序。说明固定偏移与平滑跟随的不同目标。',
};

export const followPractice: PracticeDefinition = {
  id: '06', title: '相机跟随与更新顺序', version: 1,
  summary: '沿 Unity 原课的固定偏移，分别修复相机位置基准和读取本帧位置的顺序。',
  sources: [{ course: 'unity', chapter: '1.3', sectionIds: ['part-3', 'part-4', 'part-5'], label: 'Unity 1.3 · 观察偏移、偏移变量与跟随时机' }],
  tasks: [offsetTask, orderTask], renderer: 'spatial',
  limitations: ['采用原课固定偏移(0,5,-7)，位置时间线与其他偏移是明确标注的验收变式。', '只核对离散帧的世界坐标关系与更新先后，不模拟 Unity 调度、真实帧率或抖动。', '不引入指数平滑、碰撞避让或随玩家旋转的相机控制器。'],
};
