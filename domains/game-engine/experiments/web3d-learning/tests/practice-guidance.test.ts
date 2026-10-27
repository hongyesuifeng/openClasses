import test from 'node:test';
import assert from 'node:assert/strict';
import { foundationalPractices } from '../src/practice-experiments.ts';
import { gamePractice } from '../src/practice-game.ts';
import { vectorPractice } from '../src/practice-vectors.ts';
import { cameraPractice } from '../src/practice-camera.ts';
import { inputPractice } from '../src/practice-input.ts';
import { followPractice } from '../src/practice-follow.ts';
import { explainPracticeDifference, practiceGuidanceRows } from '../src/practice-guidance.ts';
import { compileLearner, comparePracticeValues, wrapPracticeBody } from '../src/practice-runtime.ts';
import type { PracticeRecord } from '../src/practice-types.ts';

const definitions = [...foundationalPractices, gamePractice];

test('the five existing tasks explain givens, the initial mistake, the editable rule, and the observable result', () => {
  assert.equal(definitions.reduce((sum, definition) => sum + definition.tasks.length, 0), 5);
  for (const definition of definitions) for (const task of definition.tasks) {
    const rows = practiceGuidanceRows(task);
    assert.deepEqual(rows.slice(0, 4).map(row => row.label), ['给定条件', '初始错误', '你要修改', '运行后观察']);
    assert.ok(rows.every(row => row.text.length > 10));
    assert.ok(task.starterCode.includes('TODO'), `${definition.id}/${task.id}: locate editable rule`);
  }
});

test('each default starter mismatch gets a semantic label with actual and independent values', () => {
  const expectedLabels: Record<string, RegExp> = { composition: /第 \d+ 个点/, pivot: /第 \d+ 个点/, 'delta-time': /第 \d+ 步/, 'pixel-average': /像素 \d+/, 'game-flow': /第 \d+ 个事件/ };
  for (const definition of definitions) for (const task of definition.tasks) {
    const sample = task.cases[0];
    const expected = task.reference(sample.input, sample.params);
    const actual = compileLearner(wrapPracticeBody(task.starterCode), task.helperSource)(sample.input, sample.params).output;
    const comparison = comparePracticeValues(expected, actual, task.tolerance);
    assert.equal(comparison.equal, false, `${definition.id}/${task.id}`);
    const message = explainPracticeDifference(definition.id, comparison.message, expected, actual, sample.input);
    assert.match(message, expectedLabels[task.id]);
    assert.match(message, /你的结果/); assert.match(message, /独立基准/);
    assert.doesNotMatch(message, /output\./);
  }
});

test('direction, pause and sample index explanations retain each task indexing convention', () => {
  assert.match(explainPracticeDifference('02', 'output.points[1][0] 数值不同', { points: [[0, 0, 1], [0, 1, 0]] }, { points: [[0, 0, 1], [3, 1, 0]] }, { points: [[0, 0, 1], [1, 0, 0]] }), /第 2 个方向的 x存在差异：你的结果 3；独立基准 0/);
  assert.match(explainPracticeDifference('04', 'output.times[2] 数值不同', { times: [0, 0.5, 0.5] }, { times: [0, 0.5, 1] }, { paused: [false, true] }), /第 2 步（暂停）的有效模拟时间（秒）/);
  assert.match(explainPracticeDifference('09', 'output.sampleX[1][2] 数值不同', { sampleX: [[], [1, 2, 3]] }, { sampleX: [[], [1, 2, 4]] }, {}), /像素 1 的第 3 个采样位置/);
});

test('discrete state and list differences show event identity and both values rather than guessing a cause', () => {
  const input: PracticeRecord = { events: [{ id: 'ended-click', type: 'click' }] };
  const message = explainPracticeDifference('31', 'output.states[0].phase 的类型或取值不同', { states: [{ phase: 'ended' }] }, { states: [{ phase: 'playing' }] }, input);
  assert.match(message, /第 1 个事件「点击 · ended-click」后的阶段/);
  assert.match(message, /你的结果 "playing"；独立基准 "ended"/);
  const lists = explainPracticeDifference('31', 'output.states[0].targetIds 数组长度不同', { states: [{ targetIds: [] }] }, { states: [{ targetIds: ['old'] }] }, input);
  assert.match(lists, /场上目标标识列表长度或内容不同/);
  assert.match(lists, /你的结果 \["old"\]；独立基准 \[\]/);
});

test('unknown schemas retain their raw mismatch instead of claiming a misleading location', () => {
  const raw = 'output.objects 数组长度不同';
  assert.equal(explainPracticeDifference('99', raw, { objects: [] }, { objects: [1] }, {}), raw);
  assert.equal(explainPracticeDifference('02', '数据必须使用有限数值', {}, {}, {}), '数据必须使用有限数值');
});

test('new experiment starters locate vector fields, camera points, driving steps and follow frames', () => {
  const expectedLabels: Record<string, RegExp> = { direction: /从 A 到 B 的位移/, 'dot-projection': /夹角余弦/, cross: /a×b 叉积/, view: /第 \d+ 个点的相机/, projection: /第 \d+ 个点的规范/, driving: /第 \d+ 步驾驶后的位置/, 'view-force': /第 \d+ 步施力指令/, offset: /第 \d+ 帧相机位置/, 'update-order': /第 \d+ 帧相机位置/ };
  for (const definition of [vectorPractice, cameraPractice, inputPractice, followPractice]) for (const task of definition.tasks) {
    const sample = task.cases[0], expected = task.reference(sample.input, sample.params);
    const actual = compileLearner(wrapPracticeBody(task.starterCode), task.helperSource)(sample.input, sample.params).output;
    const comparison = comparePracticeValues(expected, actual, task.tolerance);
    assert.equal(comparison.equal, false, `${definition.id}/${task.id}`);
    const message = explainPracticeDifference(definition.id, comparison.message, expected, actual, sample.input);
    assert.match(message, expectedLabels[task.id]);
    assert.match(message, /你的结果/); assert.match(message, /独立基准/);
  }
});

test('undefined directions and projections and discrete frustum classification keep explicit values', () => {
  assert.match(explainPracticeDifference('01', 'output.direction 的类型或取值不同', { direction: null }, { direction: [0, 0, 0] }, {}), /单位方向存在差异：你的结果 \[0,0,0\]；独立基准 null/);
  assert.match(explainPracticeDifference('03', 'output.projected[0].ndc 的类型或取值不同', { projected: [{ ndc: null }] }, { projected: [{ ndc: [0, 0, 0] }] }, {}), /第 1 个点的规范坐标/);
  assert.match(explainPracticeDifference('03', 'output.projected[1].region 的类型或取值不同', { projected: [{}, { region: 'behind' }] }, { projected: [{}, { region: 'inside' }] }, {}), /第 2 个点的视域分类存在差异：你的结果 "inside"；独立基准 "behind"/);
  assert.match(explainPracticeDifference('05', 'output.frames[0].yaw 数值不同', { frames: [{ yaw: 90 }] }, { frames: [{ yaw: 0 }] }, {}), /第 1 步驾驶后的车头角度（度）/);
});
