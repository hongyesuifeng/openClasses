import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePracticeContext, practiceDraftKey, restorePracticeDraft, serializePracticeDraft } from '../src/practice-model.ts';
import type { PracticeDraft } from '../src/practice-model.ts';
import type { PracticeDefinition, PracticeTask } from '../src/practice-types.ts';

const task: PracticeTask = {
  id: 'order', title: '', question: '', pseudocode: [], starterCode: '', solutionCode: '', brokenCode: '',
  cases: [{ id: 'basic', label: '', input: {}, params: {} }], reference: () => null,
  validateOutput: () => {}, explanation: '', variation: '',
};
const definition: PracticeDefinition = {
  id: '02', title: '', version: 2, summary: '', renderer: 'transform', limitations: [], tasks: [task],
  sources: [
    { course: 'games101', chapter: '03', sectionIds: ['part-1', 'part-2'], label: '' },
    { course: 'games104', chapter: '08', sectionIds: ['part-4'], label: '' },
  ],
};
const draft: PracticeDraft = { experimentId: '02', taskId: 'order', version: 2, caseId: 'basic', code: 'function solve() { return 1; }', input: { point: [1, 2, 3] }, params: { degrees: 90 } };

test('draft is isolated by experiment/task and restores only bounded plain serialized data', () => {
  assert.equal(practiceDraftKey('02', 'order'), 'openclasses-practice-draft-v1:02:order:v1');
  assert.notEqual(practiceDraftKey('02', 'order'), practiceDraftKey('04', 'order'));
  assert.notEqual(practiceDraftKey('02', 'order', 1), practiceDraftKey('02', 'order', 2));
  assert.deepEqual(restorePracticeDraft(serializePracticeDraft(draft), definition, task), draft);
  assert.throws(() => practiceDraftKey('../02', 'order'));
  for (const serialized of ['{broken', 'null', '[]', JSON.stringify({ ...draft, code: 1 }), JSON.stringify({ ...draft, experimentId: '04' }), JSON.stringify({ ...draft, taskId: 'unknown' }), JSON.stringify({ ...draft, caseId: 'removed' }), JSON.stringify({ ...draft, params: [] })]) assert.equal(restorePracticeDraft(serialized, definition, task), null);
  assert.throws(() => serializePracticeDraft({ ...draft, input: { x: NaN } }));
});

test('older draft version and unfinished code survive without execution or silent template replacement', () => {
  const old = { ...draft, version: 1, caseId: 'removed', code: 'function solve(' };
  assert.deepEqual(restorePracticeDraft(serializePracticeDraft(old), definition, task), old);
  assert.equal(restorePracticeDraft(serializePracticeDraft({ ...draft, code: '' }), definition, task)?.code, '');
});

test('unfinished parameter text survives alongside code without becoming executable input', () => {
  const incomplete = { ...draft, code: 'const position =', paramsText: '{"speed":' };
  const restored = restorePracticeDraft(serializePracticeDraft(incomplete), definition, task)!;
  assert.equal(restored.paramsText, '{"speed":');
  assert.equal(restored.code, 'const position =');
  assert.deepEqual(restored.params, draft.params);
  assert.throws(() => serializePracticeDraft({ ...draft, paramsText: 'x'.repeat(65537) }));
});

test('direct practice link defaults to first registered Chinese source and never arbitrary return URL', () => {
  const context = parsePracticeContext('?experiment=02&returnUrl=https://evil.test/', [definition]);
  assert.equal(context?.backHref, '?lab=chinese-reading&course=games101&chapter=03');
  assert.equal(context?.source, definition.sources[0]);
  assert.equal(parsePracticeContext('?experiment=99', [definition]), null);
  assert.equal(parsePracticeContext('?experiment=__proto__', [definition]), null);
  assert.equal(parsePracticeContext('', []) , null);
});

test('registered return contexts preserve source and validate section against that source', () => {
  assert.equal(parsePracticeContext('?experiment=02&from=chinese-reading&course=games104&chapter=08&section=part-4', [definition])?.backHref, '?lab=chinese-reading&course=games104&chapter=08#part-4');
  assert.equal(parsePracticeContext('?experiment=02&from=classics&course=games104&chapter=08&section=part-4', [definition])?.backHref, '?lab=classics&course=games104&chapter=08');
  const invalidSection = parsePracticeContext('?experiment=02&from=chinese-reading&course=games104&chapter=08&section=part-1', [definition]);
  assert.equal(invalidSection?.sectionId, undefined);
  assert.equal(invalidSection?.source.course, 'games104');
  for (const search of ['?experiment=02&from=https://evil.test&course=games104&chapter=08&section=%22%3E', '?experiment=02&from=classics&course=games104&chapter=999&section=part-4', '?experiment=02&from=classics&course=__proto__&chapter=08']) {
    const href = parsePracticeContext(search, [definition])!.backHref;
    assert.match(href, /^\?lab=chinese-reading&course=games(?:101|104)&chapter=/);
    assert.equal(href.includes('evil'), false);
  }
});
