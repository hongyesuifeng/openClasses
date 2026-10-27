import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { practiceCoverage, practiceDefinitions, practicesForChapter, practiceHref } from '../src/practice-catalogue.ts';
import { parsePracticeContext } from '../src/practice-model.ts';
import { compileLearner, comparePracticeValues, wrapPracticeBody } from '../src/practice-runtime.ts';

test('60 stable experiments distinguish ready tasks from planned knowledge coverage', () => {
  assert.equal(practiceCoverage.length, 60);
  assert.equal(new Set(practiceCoverage.map(item => item.id)).size, 60);
  assert.deepEqual(practiceCoverage.filter(item => item.status === 'ready').map(item => item.id), ['01', '02', '03', '04', '05', '06', '09', '31']);
  assert.equal(new Set(practiceCoverage.map(item => item.group)).size, 20);
  for (const id of ['18', '30', '36', '60']) assert.ok(practiceCoverage.find(item => item.id === id)!.tasks.length >= 2);
  for (const item of practiceCoverage) {
    assert.ok(item.computation && item.limitation && item.tasks.length);
    for (const source of item.sources) {
      const document = JSON.parse(readFileSync(new URL(`../public/translations/${source.course}/${source.chapter}.json`, import.meta.url), 'utf8'));
      for (const id of source.sectionIds) assert.ok(document.sections.some((section: { id: string }) => section.id === id), `${item.id}: ${source.course}/${source.chapter}#${id}`);
      assert.ok(document.source.startsWith('https://'));
    }
  }
});

test('only ready source sections expose practice links and return to their registered reading location', () => {
  assert.deepEqual(practicesForChapter('games101', '03', 'part-11').map(item => item.id), ['02']);
  assert.deepEqual(practicesForChapter('games101', '03', 'part-1'), []);
  assert.deepEqual(practicesForChapter('games104', '22'), []);
  for (const definition of practiceDefinitions) for (const ref of definition.sources) for (const section of ref.sectionIds) {
    const href = practiceHref(definition.id, 'chinese-reading', ref.course, ref.chapter, section);
    assert.equal(parsePracticeContext(href, practiceDefinitions)?.backHref, `?lab=chinese-reading&course=${ref.course}&chapter=${ref.chapter}#${section}`);
  }
});

test('editor function bodies run with exactly the wrapper used by the UI for every ready case', () => {
  for (const definition of practiceDefinitions) for (const task of definition.tasks) {
    const solve = compileLearner(wrapPracticeBody(task.solutionCode), task.helperSource);
    const broken = compileLearner(wrapPracticeBody(task.brokenCode), task.helperSource);
    let detected = false;
    for (const item of task.cases) {
      const expected = task.reference(item.input, item.params);
      const actual = solve(item.input, item.params);
      task.validateOutput(actual.output, item.input);
      assert.equal(comparePracticeValues(expected, actual.output, task.tolerance).equal, true, `${definition.id}/${task.id}/${item.id}`);
      if (!comparePracticeValues(expected, broken(item.input, item.params).output, task.tolerance).equal) detected = true;
    }
    assert.equal(detected, true, `${definition.id}/${task.id} must detect its known mistake`);
  }
});
