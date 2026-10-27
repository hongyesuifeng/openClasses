import test from 'node:test';
import assert from 'node:assert/strict';
import { followPractice } from '../src/practice-follow.ts';
import { comparePracticeValues, compileLearner, wrapPracticeBody } from '../src/practice-kernel.ts';
import type { PracticeCase, PracticeTask, PracticeValue } from '../src/practice-types.ts';

const [offset, order] = followPractice.tasks;
function run(task: PracticeTask, code: string, sample: PracticeCase) {
  return compileLearner(wrapPracticeBody(code), task.helperSource)(sample.input, sample.params);
}
function equal(actual: PracticeValue, expected: PracticeValue) {
  const result = comparePracticeValues(expected, actual, 1e-9); assert.ok(result.equal, result.message);
}

for (const task of followPractice.tasks) {
  test(`06/${task.id}：正确实现通过全部变式，起始与另一种错误都被识别`, () => {
    for (const sample of task.cases) {
      const before = structuredClone(sample), actual = run(task, task.solutionCode, sample);
      task.validateOutput(actual.output, sample.input);
      equal(actual.output, task.reference(sample.input, sample.params));
      assert.equal(actual.output && typeof actual.output === 'object' && !Array.isArray(actual.output) && (actual.output.cameraPositions as PracticeValue[]).length, (sample.input.positions as PracticeValue[]).length);
      assert.ok(actual.trace.length > 0); assert.deepEqual(sample, before);
    }
    for (const code of [task.starterCode, task.brokenCode]) assert.ok(task.cases.some(sample => !comparePracticeValues(task.reference(sample.input, sample.params), run(task, code, sample).output).equal));
    for (const code of [task.starterCode, task.solutionCode, task.brokenCode]) assert.ok(code.split('\n').length >= 10 && code.split('\n').length <= 30);
    assert.ok(task.guidance?.given && task.guidance.issue && task.guidance.edit && task.guidance.observe);
    assert.match(task.starterCode, /TODO/);
  });
}

test('06原课偏移的预核验收帧：固定位置时间线与逐帧相机金标准', () => {
  const sample = offset.cases[0];
  const expected = { cameraPositions: [[0, 5, -7], [0, 5, -5], [2, 5, -4]] };
  for (const task of followPractice.tasks) {
    equal(task.reference(sample.input, sample.params), expected);
    equal(run(task, task.solutionCode, sample).output, expected);
  }
  // These trajectory coordinates are verification fixtures; only offset comes from the original course.
  equal(run(offset, offset.starterCode, sample).output, { cameraPositions: [[0, 10, -14], [0, 15, -21], [0, 20, -28]] });
  equal(run(order, order.starterCode, sample).output, { cameraPositions: [[0, 5, -7], [0, 5, -7], [0, 5, -5]] });
});

test('06非零起点与可变偏移金标准：停留帧不漂移、相机旧位置不影响当前目标', () => {
  equal(offset.reference(offset.cases[1].input, offset.cases[1].params), { cameraPositions: [[10, 7, -10], [9, 8, -8], [9, 8, -8], [7, 3, -7]] });
  const sample = offset.cases[2];
  equal(offset.reference(sample.input, sample.params), { cameraPositions: [[1, 3, -3], [1, 3, -3], [2, 5, -6]] });
  const changed = structuredClone(sample); changed.input.initialCamera = [-100, 100, 300];
  equal(run(offset, offset.solutionCode, changed).output, run(offset, offset.solutionCode, sample).output);
});

test('06顺序变式让首帧移动、反向和重复位置可追踪，不声称真实引擎抖动', () => {
  const sample = order.cases[3];
  equal(order.reference(sample.input, sample.params), { cameraPositions: [[0, 5, -2], [0, 5, -7], [0, 5, -7], [-3, 5, -9]] });
  equal(run(order, order.starterCode, sample).output, { cameraPositions: [[0, 5, -7], [0, 5, -2], [0, 5, -7], [0, 5, -7]] });
  assert.ok(followPractice.limitations.some(text => text.includes('不模拟 Unity')));
  assert.ok(followPractice.limitations.some(text => text.includes('不引入指数平滑')));
});

test('06输出和时间线拒绝错误形状、漏帧、非有限值和额外字段', () => {
  const input = offset.cases[0].input;
  assert.throws(() => offset.validateOutput({ cameraPositions: [[0, 5, -7]] }, input));
  assert.throws(() => offset.validateOutput({ cameraPositions: [[0, 5, -7], [0, 5, NaN], [2, 5, -4]] }, input));
  assert.throws(() => offset.validateOutput({ cameraPositions: [[0, 5, -7], [0, 5, -5], [2, 5, -4]], extra: true }, input));
  assert.throws(() => offset.reference({ ...input, positions: [] }, { offset: [0, 5, -7] }));
  assert.throws(() => offset.reference({ ...input, positions: [[0, 0, 0], Array(3)] }, { offset: [0, 5, -7] }));
  assert.throws(() => offset.reference(input, { offset: [0, 5] }));
  const large = { initialPlayer: [0, 0, 0], initialCamera: [0, 0, 0], positions: [[1e12, 0, 0]] };
  offset.validateOutput(offset.reference(large, { offset: [1e12, 0, 0] }), large);
});
