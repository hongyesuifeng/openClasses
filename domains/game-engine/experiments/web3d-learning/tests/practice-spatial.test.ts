import test from 'node:test';
import assert from 'node:assert/strict';
import { practiceDefinitions } from '../src/practice-catalogue.ts';
import { renderSpatialPractice, spatialStepCount } from '../src/practice-spatial.ts';
import { compileLearner, wrapPracticeBody } from '../src/practice-runtime.ts';
import type { PracticeRecord } from '../src/practice-types.ts';

test('all spatial cases draw validated learner output and every replay position without nonfinite SVG coordinates', () => {
  for (const definition of practiceDefinitions.filter(def => def.renderer === 'spatial')) for (const task of definition.tasks) {
    for (const source of [task.solutionCode, task.starterCode]) {
      const solve = compileLearner(wrapPracticeBody(source), task.helperSource);
      for (const sample of task.cases) {
        const output = solve(sample.input, sample.params).output;
        task.validateOutput(output, sample.input);
        const count = spatialStepCount(output as PracticeRecord);
        assert.ok(count >= 1);
        for (let cursor = 0; cursor < count; cursor++) {
          const html = renderSpatialPractice(definition.id, output as PracticeRecord, sample.input, cursor);
          assert.match(html, /<svg/); assert.match(html, /<table/);
          assert.doesNotMatch(html, /NaN|Infinity|undefined</);
        }
      }
    }
  }
});
test('wrong values come from actual output, and zero direction/null projection has an explicit label', () => {
  const fake = { displacement: [-3, -4, 0], length: 5, direction: [-0.6, -0.8, 0] };
  const html = renderSpatialPractice('01', fake, { a: [1, 2, 0], b: [4, 6, 0] }, 0);
  assert.match(html, /-3, -4, 0/); assert.match(html, /-0.6, -0.8, 0/);
  assert.doesNotMatch(html, /独立基准/);
  const nulls = renderSpatialPractice('01', { dot: 0, cosine: null, projection: null }, { a: [1, 2, 3], b: [0, 0, 0] }, 0);
  assert.match(nulls, /参考轴未定义/);
  assert.match(renderSpatialPractice('01', { displacement: [0, 0, 0], length: 0, direction: null }, { a: [0, 0, 0], b: [0, 0, 0] }, 0), /未定义（null）/);
});
test('projection keeps undefined/outside points in table and labels the actual classification', () => {
  const html = renderSpatialPractice('03', { projected: [{ ndc: null, w: 0, region: 'undefined' }, { ndc: [9, 0, 0], w: -1, region: 'outside' }] }, { points: [[1, 0, 0], [9, 0, -1]] }, 1);
  assert.match(html, /null：无法除法/); assert.match(html, /9, 0, 0/); assert.match(html, /视域外/);
  assert.doesNotMatch(html, /cx="1180"/);
});
