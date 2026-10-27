import type { PracticeDefinition, PracticeRecord, PracticeTask, PracticeValue } from './practice-types.ts';
import { dataArray, dataObject, exactFields, finiteNumber, vector3, vectorRows } from './practice-data.ts';

function control(value: PracticeValue | undefined, label: string): number {
  const result = finiteNumber(value, label);
  if (Math.abs(result) > 1) throw new Error(`${label} 应在 [-1,1] 内`);
  return result;
}
function drivingInput(input: PracticeRecord) {
  const position = vector3(input.position, 'position'), yaw = finiteNumber(input.yaw, 'yaw');
  const steps = dataArray(input.steps, 'steps').map((value, i) => {
    const row = dataObject(value, `steps[${i}]`), dt = finiteNumber(row.dt, 'dt');
    if (dt < 0) throw new Error('dt 不可为负');
    return { horizontal: control(row.horizontal, 'horizontal'), vertical: control(row.vertical, 'vertical'), dt };
  });
  return { position, yaw, steps };
}
const drivingSolution = `let position = [...input.position];
let yaw = input.yaw;
const frames = [];
for (const step of input.steps) {
  const angle = yaw * Math.PI / 180;
  // 先沿本帧开始时车头方向前进，再按水平输入转向。
  const distance = params.speed * step.vertical * step.dt;
  position = [position[0] + Math.sin(angle) * distance,
    position[1], position[2] + Math.cos(angle) * distance];
  yaw += params.turnSpeed * step.horizontal * step.dt;
  frames.push({ position: [...position], yaw });
}
api.trace("逐步运动与朝向", frames);
return { frames };`;
const drivingTask: PracticeTask = {
  id: 'driving', title: '轻推、松手与转向，代码应读取哪个输入？',
  question: '修正前进距离与转向角的输入倍率。水平输入控制绕 Y 转向，纵向输入控制沿车头前后移动。',
  guidance: { given: '固定输入含 horizontal、vertical 与 dt。初始速度 20 单位/秒、转向速度 90 度/秒；+Z 是初始车头方向。', issue: '初始代码忽略两项输入，松手也会继续移动与转向。', edit: '在下方代码中给 distance 和 yaw 两行分别乘上对应输入，保留 dt。', observe: '输入为 0 时不产生对应变化；0.25 只产生满幅的四分之一。左右只转车头，不直接侧移。', terms: 'yaw 为绕 Y 的角度（度）；本练习明确先移动后转向，下一步才沿新朝向前进。' },
  pseudocode: ['读取每一步的输入与经过时间。', '按当前车头方向计算前后位移，再计算本步转角。', '记录位置与朝向，比较零输入、轻推与反向。'],
  starterCode: drivingSolution.replace('// 先沿本帧开始时车头方向前进，再按水平输入转向。', '// TODO：前进与转向各自乘上对应的输入幅度。').replace('params.speed * step.vertical * step.dt', 'params.speed * step.dt').replace('params.turnSpeed * step.horizontal * step.dt', 'params.turnSpeed * step.dt'),
  solutionCode: drivingSolution,
  brokenCode: drivingSolution.replace('step.vertical * step.dt', 'Math.sign(step.vertical) * step.dt').replace('step.horizontal * step.dt', 'Math.sign(step.horizontal) * step.dt'),
  cases: [
    { id: 'amplitude', label: '松手、轻推、满推、反向', input: { position: [0, 0, 0], yaw: 0, steps: [0, 0.25, 1, -0.25, -1].map(vertical => ({ horizontal: 0, vertical, dt: 1 })) }, params: { speed: 20, turnSpeed: 90 } },
    { id: 'steering', label: '右转90°后前进，再轻推反向转向', input: { position: [0, 0, 0], yaw: 0, steps: [{ horizontal: 1, vertical: 0, dt: 1 }, { horizontal: 0, vertical: 1, dt: 1 }, { horizontal: -0.25, vertical: 0, dt: 1 }, { horizontal: -1, vertical: 0, dt: 0.5 }] }, params: { speed: 20, turnSpeed: 90 } },
    { id: 'move-and-turn', label: '同时前进与转向：本步先移动，下一步沿新方向', input: { position: [0, 0, 0], yaw: 0, steps: [{ horizontal: 1, vertical: 1, dt: 1 }, { horizontal: 1, vertical: 1, dt: 1 }] }, params: { speed: 20, turnSpeed: 90 } },
    { id: 'time-and-origin', label: '非零起点、反向车头、零步长', input: { position: [3, 2, -1], yaw: 180, steps: [{ horizontal: 0.25, vertical: 1, dt: 0 }, { horizontal: 0, vertical: 0.25, dt: 0.5 }, { horizontal: 0, vertical: -1, dt: 0.25 }] }, params: { speed: 20, turnSpeed: 90 } },
  ],
  reference(input, params) {
    const { position, yaw, steps } = drivingInput(input);
    const speed = finiteNumber(params.speed, 'speed'), turn = finiteNumber(params.turnSpeed, 'turnSpeed');
    // Independent prefix-angle and displacement sums; no learner helper or mutable integration state.
    const frames = steps.map((_, end) => {
      const p = [...position];
      for (let i = 0; i <= end; i++) {
        const before = yaw + turn * steps.slice(0, i).reduce((sum, step) => sum + step.horizontal * step.dt, 0);
        p[0] += speed * steps[i].vertical * steps[i].dt * Math.sin(before * Math.PI / 180);
        p[2] += speed * steps[i].vertical * steps[i].dt * Math.cos(before * Math.PI / 180);
      }
      return { position: p, yaw: yaw + turn * steps.slice(0, end + 1).reduce((sum, step) => sum + step.horizontal * step.dt, 0) };
    });
    return { frames };
  },
  validateOutput(output, input) {
    const result = dataObject(output); exactFields(result, ['frames']);
    const frames = dataArray(result.frames, 'frames');
    if (frames.length !== drivingInput(input).steps.length) throw new Error('每步输入需要一帧输出');
    frames.forEach(frame => { const row = dataObject(frame); exactFields(row, ['position', 'yaw']); vector3(row.position, 'position'); finiteNumber(row.yaw, 'yaw'); });
  }, tolerance: 1e-9,
  explanation: '前进距离=速度×纵向输入×时间，转角=转向速度×水平输入×时间。连续输入幅度属于控制意图；把0.25归一化成1，会丢掉轻推的意义。固定先移动后旋转使每步含义可复现。',
  variation: '先预测输入0、0.25、-1的位移。右转90°之后，下一步前进会沿哪条世界轴？本题没有侧向平移或轮胎动力学。',
};

const forceSolution = `const forces = [];
for (const step of input.steps) {
  // forward 是平台提供的焦点本帧朝向，不是球体滚动朝向。
  const forward = step.forward;
  const amount = step.vertical * params.strength;
  const force = forward.map(component => component * amount);
  forces.push(force);
}
api.trace("提交给刚体的施力指令", forces);
return { forces };`;
const forceTask: PracticeTask = {
  id: 'view-force', title: '视角转了，前进力为什么还沿世界 Z？',
  question: '把固定世界 forward 换成每步给定的焦点 forward，保留纵向输入的正负和幅度。',
  guidance: { given: '平台给出焦点转向后的单位 forward。0°为(0,0,1)，90°为(1,0,0)，180°为(0,0,-1)。', issue: '初始代码始终沿世界(0,0,1)施力，转动视角后控制方向脱节。', edit: '只修改 forward 的来源；amount 仍保留输入幅度和施力强度。', observe: '同样输入0.25，在0°与90°视角应分别产生(0,0,2.5)和(2.5,0,0)的力指令。', terms: '本题输出的是 AddForce 的参数向量，没有模拟位移、速度或积分；因此不再乘 dt。' },
  pseudocode: ['读取焦点方向快照。', '方向乘纵向输入与施力强度。', '只记录力指令，物理响应不在本题运行。'],
  starterCode: forceSolution.replace('const forward = step.forward;', 'const forward = [0, 0, 1]; // TODO：改成焦点本帧朝向。'),
  solutionCode: forceSolution,
  brokenCode: forceSolution.replace('step.vertical * params.strength', 'Math.sign(step.vertical) * params.strength'),
  cases: [
    { id: 'turn-view', label: '视角0°／90°／180°，相同轻推', input: { steps: [[0, 0, 1], [1, 0, 0], [0, 0, -1]].map(forward => ({ forward, vertical: 0.25 })) }, params: { strength: 10 } },
    { id: 'force-amplitude', label: '同一朝向松手、前后轻推和满推', input: { steps: [0, 0.25, 1, -0.25, -1].map(vertical => ({ forward: [1, 0, 0], vertical })) }, params: { strength: 10 } },
    { id: 'oblique', label: '斜向单位朝向与反向请求', input: { steps: [{ forward: [0.6, 0, 0.8], vertical: 1 }, { forward: [0.6, 0, 0.8], vertical: -0.25 }] }, params: { strength: 10 } },
  ],
  reference(input, params) {
    const strength = finiteNumber(params.strength, 'strength');
    return { forces: dataArray(input.steps, 'steps').map(step => {
      const row = dataObject(step), forward = vector3(row.forward, 'forward'), v = control(row.vertical, 'vertical');
      if (Math.abs(Math.hypot(...forward) - 1) > 1e-9) throw new Error('焦点 forward 必须是单位方向');
      return [strength * v * forward[0], strength * v * forward[1], strength * v * forward[2]];
    }) };
  },
  validateOutput(output, input) { vectorRows(output, 'forces', dataArray(input.steps, 'steps').length); }, tolerance: 1e-9,
  explanation: '原课让输入读取 Focal Point 的 forward。焦点随水平输入转动，其 forward 决定前后施力轴；球体自身的滚转和固定世界 Z 不能代替这个方向。力的大小还受模拟输入幅度影响。',
  variation: '比较视角0°与90°的相同轻推，再比较-0.25。输出是力指令；只看它无法推断实际滚动速度。',
};
export const inputPractice: PracticeDefinition = {
  id: '05', title: '输入与方向转换', version: 1, renderer: 'spatial',
  summary: '保留控制输入的幅度，区分前进、转向与随观察方向施力。按固定步骤检查指令，不依赖引擎操作。',
  sources: [{ course: 'unity', chapter: '1.4', sectionIds: [3, 4, 5, 6, 7].map(n => `part-${n}`), label: 'Unity 1.4 · 输入与驾驶' }, { course: 'unity', chapter: '4.1', sectionIds: [8, 10, 11].map(n => `part-${n}`), label: 'Unity 4.1 · 随视角施力' }],
  tasks: [drivingTask, forceTask],
  limitations: ['输入是固定快照；没有实现 Input System 或读取真实设备。', '驾驶使用离散的先平移后旋转约定，不含车轮和碰撞物理。', '施力任务只计算请求向量，不把力当成恒速位移，也不模拟 Rigidbody 响应。'],
};
