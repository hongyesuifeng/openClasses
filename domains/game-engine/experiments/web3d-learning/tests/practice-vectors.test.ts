import test from 'node:test';
import assert from 'node:assert/strict';
import { vectorPractice } from '../src/practice-vectors.ts';
import { comparePracticeValues, compileLearner, wrapPracticeBody } from '../src/practice-kernel.ts';
import type { PracticeCase, PracticeTask, PracticeValue } from '../src/practice-types.ts';

const [direction, dot, cross] = vectorPractice.tasks;
function run(task: PracticeTask, code: string, sample: PracticeCase) {
  return compileLearner(wrapPracticeBody(code), task.helperSource)(sample.input, sample.params);
}
function equal(actual: PracticeValue, expected: PracticeValue) {
  const result = comparePracticeValues(expected, actual, 1e-9); assert.ok(result.equal, result.message);
}

for (const task of vectorPractice.tasks) {
  test(`01/${task.id}：所有变式真实解答通过独立基准，起始及另一个错误会失败`, () => {
    for (const sample of task.cases) {
      const before = structuredClone(sample), actual = run(task, task.solutionCode, sample);
      task.validateOutput(actual.output, sample.input);
      equal(actual.output, task.reference(sample.input, sample.params));
      assert.ok(actual.trace.length > 0); assert.deepEqual(sample, before);
    }
    for (const code of [task.starterCode, task.brokenCode]) {
      assert.ok(task.cases.some(sample => {
        try { return !comparePracticeValues(task.reference(sample.input, sample.params), run(task, code, sample).output).equal; }
        catch { return true; }
      }), '已知错误不应通过全部条件');
    }
    for (const code of [task.starterCode, task.solutionCode, task.brokenCode]) assert.ok(code.split('\n').length >= 10 && code.split('\n').length <= 30);
    assert.ok(task.guidance?.given && task.guidance.issue && task.guidance.edit && task.guidance.observe);
    assert.match(task.starterCode, /TODO/);
  });
}

test('01方向金标准：长度5、共同平移不变、交换方向反号、非零Z以及重合点', () => {
  equal(direction.reference({ a: [1, 2, 0], b: [4, 6, 0] }, {}), { displacement: [3, 4, 0], length: 5, direction: [0.6, 0.8, 0] });
  equal(direction.reference({ a: [8, -1, 2], b: [11, 3, 2] }, {}), { displacement: [3, 4, 0], length: 5, direction: [0.6, 0.8, 0] });
  equal(direction.reference({ a: [4, 6, 0], b: [1, 2, 0] }, {}), { displacement: [-3, -4, 0], length: 5, direction: [-0.6, -0.8, 0] });
  equal(direction.reference({ a: [-1, 2, -3], b: [1, -1, 3] }, {}), { displacement: [2, -3, 6], length: 7, direction: [2 / 7, -3 / 7, 6 / 7] });
  equal(direction.reference({ a: [2, -3, 4], b: [2, -3, 4] }, {}), { displacement: [0, 0, 0], length: 0, direction: null });
});

test('01点积投影金标准：缩放参考轴、反向、三维以及零向量的两种不同含义', () => {
  equal(dot.reference({ a: [3, 4, 0], b: [2, 0, 0] }, {}), { dot: 6, cosine: 0.6, projection: [3, 0, 0] });
  equal(dot.reference({ a: [3, 4, 0], b: [6, 0, 0] }, {}), { dot: 18, cosine: 0.6, projection: [3, 0, 0] });
  equal(dot.reference({ a: [3, 4, 0], b: [-2, 0, 0] }, {}), { dot: -6, cosine: -0.6, projection: [3, 0, 0] });
  equal(dot.reference({ a: [1, 2, 3], b: [4, -1, 2] }, {}), { dot: 8, cosine: 8 / Math.sqrt(294), projection: [32 / 21, -8 / 21, 16 / 21] });
  equal(dot.reference({ a: [0, 0, 0], b: [2, 0, 0] }, {}), { dot: 0, cosine: null, projection: [0, 0, 0] });
  equal(dot.reference({ a: [1, 2, 3], b: [0, 0, 0] }, {}), { dot: 0, cosine: null, projection: null });
});

test('01初始错误余弦6保留为真实结果，通过比较显示其与0.6的差异', () => {
  const sample = dot.cases[0], result = run(dot, dot.starterCode, sample).output;
  assert.doesNotThrow(() => dot.validateOutput(result, sample.input));
  equal(result, { dot: 6, cosine: 6, projection: [3, 0, 0] });
  const difference = comparePracticeValues(dot.reference(sample.input, sample.params), result);
  assert.equal(difference.equal, false);
  assert.match(difference.message, /output\.cosine.*0\.6.*6/);
});

test('01叉积金标准：右手方向、交换反号、非轴向分量和零面积', () => {
  equal(cross.reference({ a: [1, 0, 0], b: [0, 1, 0] }, {}), { cross: [0, 0, 1], area: 1 });
  equal(cross.reference({ a: [0, 1, 0], b: [1, 0, 0] }, {}), { cross: [0, 0, -1], area: 1 });
  equal(cross.reference({ a: [0, 2, 0], b: [0, 0, 3] }, {}), { cross: [6, 0, 0], area: 6 });
  equal(cross.reference({ a: [1, 2, 3], b: [4, -1, 2] }, {}), { cross: [7, 10, -9], area: Math.sqrt(230) });
  equal(cross.reference({ a: [1, -2, 3], b: [-2, 4, -6] }, {}), { cross: [0, 0, 0], area: 0 });
});

test('01边界变式识别未处理零长度、错误固定余弦和忽略Z分量', () => {
  const zero = direction.cases.find(sample => sample.id === 'coincident')!;
  assert.throws(() => run(direction, direction.solutionCode.replace('if (length !== 0)', 'if (true)'), zero), /有限/);
  const zeroAxis = dot.cases.find(sample => sample.id === 'zero-b')!;
  const wrongZero = dot.solutionCode.replace('? null : dot /', '? 0 : dot /');
  assert.equal(comparePracticeValues(dot.reference(zeroAxis.input, {}), run(dot, wrongZero, zeroAxis).output).equal, false);
  const spatial = dot.cases.find(sample => sample.id === 'spatial-dot')!;
  const missingZ = dot.solutionCode.replace('sum + value * input.b[axis]', 'sum + (axis === 2 ? 0 : value * input.b[axis])');
  assert.equal(comparePracticeValues(dot.reference(spatial.input, {}), run(dot, missingZ, spatial).output).equal, false);
});

test('01拒绝损坏输入和输出，不将无效数值伪装成几何结果', () => {
  for (const task of vectorPractice.tasks) {
    assert.throws(() => task.reference({ a: [1, 2], b: [1, 2, 3] }, {}));
    assert.throws(() => task.reference({ a: [1, Infinity, 0], b: [1, 2, 3] }, {}));
    assert.throws(() => task.reference({ a: Array(3), b: [1, 2, 3] }, {}));
    assert.throws(() => task.validateOutput({}, task.cases[0].input));
  }
  assert.throws(() => direction.validateOutput({ displacement: [0, NaN, 0], length: 0, direction: null }, direction.cases[0].input));
  assert.throws(() => dot.validateOutput({ dot: 6, cosine: NaN, projection: [3, 0, 0] }, dot.cases[0].input));
  assert.throws(() => cross.validateOutput({ cross: [0, 0, 1], area: -1 }, cross.cases[0].input));
});
