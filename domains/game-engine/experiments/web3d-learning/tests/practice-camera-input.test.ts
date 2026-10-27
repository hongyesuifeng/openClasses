import test from 'node:test';
import assert from 'node:assert/strict';
import { cameraPractice } from '../src/practice-camera.ts';
import { inputPractice } from '../src/practice-input.ts';
import { compileLearner, comparePracticeValues, wrapPracticeBody } from '../src/practice-runtime.ts';
import type { PracticeRecord, PracticeValue } from '../src/practice-types.ts';

function close(actual: PracticeValue, expected: PracticeValue) {
  const comparison = comparePracticeValues(expected, actual, 1e-9);
  assert.equal(comparison.equal, true, comparison.message);
}
for (const definition of [cameraPractice, inputPractice]) for (const task of definition.tasks) {
  test(`${definition.id}/${task.id} correct, starter and independent mistake across fixed variants`, () => {
    const solve = compileLearner(wrapPracticeBody(task.solutionCode));
    for (const source of [task.starterCode, task.solutionCode, task.brokenCode]) assert.ok(source.split('\n').length >= 10 && source.split('\n').length <= 30);
    for (const sample of task.cases) {
      const before = structuredClone(sample), expected = task.reference(sample.input, sample.params);
      const output = solve(sample.input, sample.params).output;
      task.validateOutput(output, sample.input); close(output, expected); assert.deepEqual(sample, before);
    }
    for (const source of [task.starterCode, task.brokenCode]) {
      const wrong = compileLearner(wrapPracticeBody(source));
      assert.ok(task.cases.some(sample => !comparePracticeValues(task.reference(sample.input, sample.params), wrong(sample.input, sample.params).output).equal));
    }
    assert.ok(task.guidance?.given && task.guidance.edit && task.guidance.observe);
  });
}
test('view literal coordinates, common translation invariance, quarter-turn and tilted camera', () => {
  const task = cameraPractice.tasks[0];
  const first = task.cases[0], shift = task.cases[1];
  close(task.reference(first.input, first.params), { cameraPoints: [[1, 0, -2], [0, 0, 0], [-1, 1, -4]] });
  close(task.reference(first.input, first.params), task.reference(shift.input, shift.params));
  close(task.reference(task.cases[2].input, task.cases[2].params), { cameraPoints: [[2, -1, -4], [0, 0, 0], [-1, 2, 2]] });
  close(task.reference(task.cases[3].input, task.cases[3].params), { cameraPoints: [[2, 4.8, 1.4], [0, 0, 0]] });
  assert.throws(() => task.reference(first.input, { ...first.params, up: [0, 0, -1] }), /垂直/);
});
test('GAMES101 projection literal goldens keep near +1 far -1, 2:1 size, and explicit undefined/behind/outside', () => {
  const task = cameraPractice.tasks[1], sample = task.cases[0];
  const result = task.reference(sample.input, sample.params) as PracticeRecord;
  close(result.projected, [
    { ndc: [0.5, 0, -1 / 9], w: -2, region: 'inside' },
    { ndc: [0.25, 0, -2 / 3], w: -4, region: 'inside' },
    { ndc: [0, 0, 1], w: -1, region: 'inside' },
    { ndc: [0, 0, -1], w: -10, region: 'inside' },
    { ndc: [-0.5, 0, -7 / 3], w: 2, region: 'behind' },
    { ndc: null, w: 0, region: 'undefined' },
    { ndc: [0, 0, 29 / 9], w: -0.5, region: 'outside' },
    { ndc: [0, 0, -101 / 99], w: -11, region: 'outside' },
    { ndc: [2.5, 0, -1 / 9], w: -2, region: 'outside' },
  ]);
  const orthographic = (task.reference(sample.input, { ...sample.params, mode: 'orthographic' }) as PracticeRecord).projected as PracticeRecord[];
  close((orthographic[0].ndc as number[])[0], 1); close((orthographic[1].ndc as number[])[0], 1);
  close((orthographic[2].ndc as number[])[2], 1); close((orthographic[3].ndc as number[])[2], -1);
  assert.equal(orthographic[5].region, 'behind');
  assert.throws(() => task.reference(sample.input, { ...sample.params, near: 1, far: 10 }), /far<near<0/);
  assert.throws(() => task.validateOutput({ projected: [{ ndc: [1, 2, 3], w: 0, region: 'inside' }] }, { points: [[1, 2, 0]] }), /w=0/);
});
test('asymmetric frustum checked independently from symmetric shortcut', () => {
  const task = cameraPractice.tasks[1], sample = task.cases[2];
  const output = task.reference(sample.input, sample.params) as PracticeRecord;
  close((output.projected as PracticeRecord[])[0], { ndc: [-1 / 3, -0.5, 1], w: -2, region: 'inside' });
  close((output.projected as PracticeRecord[])[1], { ndc: [1 / 3, 0, 1], w: -2, region: 'inside' });
  close((output.projected as PracticeRecord[])[2], { ndc: [1 / 3, 0, -1 / 3], w: -4, region: 'inside' });
});
test('driving literal amplitude and steering: no side translation, move before turn, dt preserved', () => {
  const task = inputPractice.tasks[0], sample = task.cases[0];
  close(task.reference(sample.input, sample.params), { frames: [0, 5, 25, 20, 0].map(z => ({ position: [0, 0, z], yaw: 0 })) });
  const turning = task.cases[1];
  close(task.reference(turning.input, turning.params), { frames: [
    { position: [0, 0, 0], yaw: 90 }, { position: [20, 0, 0], yaw: 90 },
    { position: [20, 0, 0], yaw: 67.5 }, { position: [20, 0, 0], yaw: 22.5 },
  ] });
  const timed = task.cases.find(item => item.id === 'time-and-origin')!;
  close(task.reference(timed.input, timed.params), { frames: [
    { position: [3, 2, -1], yaw: 180 }, { position: [3, 2, -3.5], yaw: 180 }, { position: [3, 2, 1.5], yaw: 180 },
  ] });
  assert.throws(() => task.reference({ ...sample.input, steps: [{ horizontal: 0, vertical: 0, dt: -1 }] }, sample.params), /不可为负/);
  const both = task.cases.find(item => item.id === 'move-and-turn')!;
  close(task.reference(both.input, both.params), { frames: [{ position: [0, 0, 20], yaw: 90 }, { position: [20, 0, 20], yaw: 180 }] });
  const rotateFirst = task.solutionCode.replace('  const angle = yaw', '  yaw += params.turnSpeed * step.horizontal * step.dt;\n  const angle = yaw').replace('  yaw += params.turnSpeed * step.horizontal * step.dt;\n  frames.push', '  frames.push');
  assert.equal(comparePracticeValues(task.reference(both.input, both.params), compileLearner(wrapPracticeBody(rotateFirst))(both.input, both.params).output).equal, false);
});
test('force commands golden 0/90/180, analog sign, no dt or integration', () => {
  const task = inputPractice.tasks[1], sample = task.cases[0];
  close(task.reference(sample.input, sample.params), { forces: [[0, 0, 2.5], [2.5, 0, 0], [0, 0, -2.5]] });
  close(task.reference(task.cases[1].input, sample.params), { forces: [[0, 0, 0], [2.5, 0, 0], [10, 0, 0], [-2.5, 0, 0], [-10, 0, 0]] });
  assert.throws(() => task.reference({ steps: [{ forward: [0, 0, 2], vertical: 1 }] }, sample.params), /单位方向/);
  assert.throws(() => task.reference({ steps: [{ forward: [0, 0, 1], vertical: 2 }] }, sample.params), /\[-1,1\]/);
});
