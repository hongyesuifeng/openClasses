import test from 'node:test';
import assert from 'node:assert/strict';
import { gamePractice } from '../src/practice-game.ts';
import type { PracticeCase, PracticeRecord, PracticeRunResult, PracticeValue } from '../src/practice-types.ts';

const task = gamePractice.tasks[0];
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

function run(code: string, scenario: PracticeCase): PracticeRunResult {
  const trace: PracticeRunResult['trace'] = [];
  const helper = new Function(task.helperSource || 'return {};')() as Record<string, unknown>;
  const api = {
    ...helper,
    clone: copy,
    trace(step: string, value: PracticeValue) { trace.push({ step, value: copy(value) }); },
  };
  const output = new Function('input', 'params', 'api', code)(copy(scenario.input), copy(scenario.params), api) as PracticeValue;
  return { output, trace };
}

function states(output: PracticeValue): PracticeRecord[] {
  return (output as PracticeRecord).states as PracticeRecord[];
}

test('31 correct solution matches independent tables for all event sequences', () => {
  assert.equal(gamePractice.id, '31');
  assert.ok(task.solutionCode.split('\n').length >= 10 && task.solutionCode.split('\n').length <= 30);
  for (const scenario of task.cases) {
    const result = run(task.solutionCode, scenario);
    task.validateOutput(result.output, scenario.input);
    assert.deepEqual(result.output, task.reference(scenario.input, scenario.params), scenario.id);
    assert.equal(result.trace.length, (scenario.input.events as PracticeValue[]).length);
    assert.deepEqual(result.trace.map(item => item.value), states(result.output));
  }
});

test('31 ended-event broken implementation is detected in every sequence', () => {
  for (const scenario of task.cases) {
    const result = run(task.brokenCode, scenario);
    task.validateOutput(result.output, scenario.input);
    assert.notDeepEqual(result.output, task.reference(scenario.input, scenario.params), scenario.id);
  }
  const output = states(run(task.brokenCode, task.cases[0]).output);
  const before = output.find(item => item.id === 'miss-good')!;
  const after = output.find(item => item.id === 'ended-click')!;
  assert.equal(before.score, 5);
  assert.equal(after.score, 12, 'the broken rule actually scores after game over');
});

test('31 fixtures expose missing session gates and cumulative difficulty', () => {
  const scenario = task.cases.find(item => item.id === 'restart-and-stale')!;
  const withoutSession = task.solutionCode.replace(' && event.session === game.session', '');
  const cumulative = task.solutionCode.replace('params.baseInterval / event.difficulty', 'game.interval / event.difficulty');
  const expected = task.reference(scenario.input, scenario.params);
  assert.notDeepEqual(run(withoutSession, scenario).output, expected);
  assert.notDeepEqual(run(cumulative, scenario).output, expected);
  const output = states(run(task.solutionCode, scenario).output);
  assert.equal(output.find(item => item.id === 'start-medium-again')!.interval, 3);
  assert.equal(output.find(item => item.id === 'old-session-click')!.score, 0);
  assert.equal(output.find(item => item.id === 'new-session-click')!.score, 20);
});

test('31 restart clears live targets, score and outstanding callbacks', () => {
  const scenario = task.cases.find(item => item.id === 'restart-and-stale')!;
  const output = states(run(task.solutionCode, scenario).output);
  const pending = output.find(item => item.id === 'callback-after-end')!;
  assert.deepEqual(pending.pendingIds, ['after-restart']);
  assert.deepEqual(pending.targetIds, ['bad-live']);
  const reset = output.find(item => item.id === 'restart-first')!;
  assert.deepEqual([reset.phase, reset.score, reset.targets, reset.pending], ['title', 0, 0, 0]);
  assert.equal(reset.session, 1);
  const late = output.find(item => item.id === 'callback-after-restart')!;
  assert.equal(late.targets, 0);
});

test('31 preserves same-time array order and permits negative totals', () => {
  const scenario = task.cases.find(item => item.id === 'same-time-order')!;
  const output = states(run(task.solutionCode, scenario).output);
  assert.deepEqual(output.map(item => item.id), (scenario.input.events as PracticeRecord[]).map(event => event.id));
  assert.equal(output.find(item => item.id === 'click-after-same-time-end')!.score, 4);
  assert.equal(output.find(item => item.id === 'negative-score')!.score, -3);
  assert.equal(output.find(item => item.id === 'old-end')!.phase, 'playing');
  assert.equal(output.find(item => item.id === 'old-miss')!.targets, 1);
});

test('31 independent tables are stable and reject unsupported input edits', () => {
  const scenario = task.cases[0];
  const first = task.reference(scenario.input, scenario.params);
  states(first)[0].score = 999;
  assert.equal(states(task.reference(scenario.input, scenario.params))[0].score, 0);
  const input = copy(scenario.input);
  (input.events as PracticeRecord[])[0].type = 'click';
  assert.throws(() => task.reference(input, scenario.params), /独立期望表/);
  assert.throws(() => task.reference(scenario.input, { baseInterval: 12 }), /独立期望表/);
});

test('31 output validation rejects missing, reordered and malformed snapshots', () => {
  const scenario = task.cases[0];
  const output = task.reference(scenario.input, scenario.params);
  assert.throws(() => task.validateOutput({ states: [] }, scenario.input), /快照/);
  const reordered = copy(output);
  states(reordered).reverse();
  assert.throws(() => task.validateOutput(reordered, scenario.input), /顺序/);
  const badCount = copy(output);
  states(badCount)[0].targets = 1;
  assert.throws(() => task.validateOutput(badCount, scenario.input), /targetIds/);
  const nan = copy(output);
  states(nan)[0].interval = NaN;
  assert.throws(() => task.validateOutput(nan, scenario.input), /interval/);
});
