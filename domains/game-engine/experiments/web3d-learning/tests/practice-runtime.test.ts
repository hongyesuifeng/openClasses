import test from 'node:test';
import assert from 'node:assert/strict';
import { Worker as NodeWorker } from 'node:worker_threads';
import { compileLearner, wrapPracticeBody, comparePracticeValues, copyPlainData, validatePracticeValue, PracticeError, PracticeRunner, PRACTICE_MAX_BYTES } from '../src/practice-runtime.ts';
import type { PracticeWorkerLike } from '../src/practice-runtime.ts';

const codeIs = (code: string) => (error: unknown) => error instanceof PracticeError && error.code === code;
class FakeWorker implements PracticeWorkerLike {
  onmessage: PracticeWorkerLike['onmessage'] = null;
  onerror: PracticeWorkerLike['onerror'] = null;
  onmessageerror: PracticeWorkerLike['onmessageerror'] = null;
  sent: Record<string, unknown>[] = [];
  terminated = 0;
  postMessage(value: unknown) { this.sent.push(value as Record<string, unknown>); }
  terminate() { this.terminated++; }
  result(output: unknown, trace: unknown[] = []) { this.onmessage?.({ data: { type: 'result', runId: this.sent[0].runId, nonce: this.sent[0].nonce, result: { output, trace } } }); }
}
const request = { code: 'function solve(input) { return input.x; }', input: { x: 2 }, params: {} };

test('editor body wrapper shares the real solve contract and classifies syntax errors', () => {
  const run = compileLearner(wrapPracticeBody('api.trace("sum", input.x + params.y); return { sum: input.x + params.y };'));
  assert.deepEqual(run({ x: 2 }, { y: 3 }), { output: { sum: 5 }, trace: [{ step: 'sum', value: 5 }] });
  assert.throws(() => compileLearner(wrapPracticeBody('return { broken: ;')), codeIs('compile'));
});

test('compiled learner snapshots trace immediately, isolates caller data and exposes trusted helper API', () => {
  const learner = compileLearner(`function solve(input, params) {
    const state = { values: [input.x] };
    api.trace('before', state);
    const snapshot = api.clone(state);
    state.values[0] = api.twice(params.factor);
    input.x = 99;
    api.trace('after', state);
    return { snapshot, state };
  }`, 'return { twice(value) { return value * 2; } };');
  const input = { x: 3 }, params = { factor: 4 };
  const result = learner(input, params);
  assert.deepEqual(result.trace, [{ step: 'before', value: { values: [3] } }, { step: 'after', value: { values: [8] } }]);
  assert.deepEqual(result.output, { snapshot: { values: [3] }, state: { values: [8] } });
  assert.deepEqual(input, { x: 3 });
  assert.equal(learner(input, params).trace.length, 2);
});

test('learner distinguishes syntax, missing solve, thrown runtime and invalid asynchronous output', () => {
  assert.throws(() => compileLearner('function solve('), codeIs('compile'));
  assert.throws(() => compileLearner('const x = 1;')({}, {}), codeIs('compile'));
  assert.throws(() => compileLearner('function solve() { throw new Error("bad branch"); }')({}, {}), error => codeIs('runtime')(error) && (error as Error).message === 'bad branch');
  assert.throws(() => compileLearner('async function solve() { throw new Error("async"); }')({}, {}), codeIs('invalid'));
  assert.throws(() => compileLearner('function solve() { return NaN; }')({}, {}), codeIs('invalid'));
});

test('plain data rejects cycles, sparse arrays, accessors and class instances without running getters', () => {
  const cycle: unknown[] = []; cycle.push(cycle);
  let accessed = false;
  const getter = { get x() { accessed = true; return 1; } };
  for (const value of [NaN, Infinity, undefined, () => 1, new Date(), new Map(), Promise.resolve(1), cycle, new Array(2), getter]) {
    assert.throws(() => validatePracticeValue(value), codeIs('invalid'));
  }
  assert.equal(accessed, false);
  const shared = { x: 1 };
  assert.deepEqual(copyPlainData([shared, shared]), [{ x: 1 }, { x: 1 }]);
  const hostile = JSON.parse('{"__proto__":{"polluted":true}}');
  const copied = copyPlainData(hostile) as Record<string, unknown>;
  assert.equal(Object.getPrototypeOf(copied), Object.prototype);
  assert.equal(Object.hasOwn(copied, '__proto__'), true);
  assert.equal(({} as Record<string, unknown>).polluted, undefined);
});

test('trace count and combined UTF-8 result/trace budget are enforced', () => {
  assert.throws(() => compileLearner('function solve() { for (let i=0;i<1001;i++) api.trace("tick", i); return 0; }')({}, {}), codeIs('limit'));
  assert.throws(() => copyPlainData('中'.repeat(Math.ceil(PRACTICE_MAX_BYTES / 3))), codeIs('limit'));
  assert.throws(() => compileLearner('function solve() { api.trace("state", "a".repeat(600000)); return "b".repeat(500000); }')({}, {}), codeIs('limit'));
  assert.throws(() => compileLearner('function solve() { api.trace("", 1); return 0; }')({}, {}), codeIs('invalid'));
});

test('comparison tolerates small numeric differences, ignores object field order and reports structural failures', () => {
  assert.equal(comparePracticeValues({ a: [1, 100000], b: null }, { b: null, a: [1 + 1e-9, 100000.0001] }).equal, true);
  for (const [expected, actual] of [[1, '1'], [{ x: 1 }, { x: 1, y: 2 }], [[1], [1, 2]], ['Idle', 'Dead'], [null, false]]) assert.equal(comparePracticeValues(expected, actual).equal, false);
  assert.match(comparePracticeValues({ x: [1] }, { x: [2] }).message, /output\.x\[0\]/);
  assert.equal(comparePracticeValues(NaN, NaN).equal, false);
  assert.equal(comparePracticeValues(1, 1, -1).equal, false);
});

test('runner uses a fresh worker, copies inputs and releases worker/listeners after success', async () => {
  const workers: FakeWorker[] = [];
  const runner = new PracticeRunner({ workerFactory: () => { const worker = new FakeWorker(); workers.push(worker); return worker; } });
  const input = { x: 2 };
  const first = runner.run({ ...request, input });
  input.x = 9;
  assert.deepEqual(workers[0].sent[0].input, { x: 2 });
  workers[0].result(2);
  assert.deepEqual(await first, { output: 2, trace: [] });
  assert.equal(workers[0].terminated, 1);
  assert.equal(workers[0].onmessage, null);
  const second = runner.run(request);
  assert.equal(workers.length, 2);
  workers[1].result(2);
  await second;
});

test('new run cancels old run and ignores late or mismatched messages', async () => {
  const workers: FakeWorker[] = [];
  const runner = new PracticeRunner({ workerFactory: () => { const worker = new FakeWorker(); workers.push(worker); return worker; } });
  const first = runner.run(request);
  const firstFailure = assert.rejects(first, codeIs('cancelled'));
  const late = workers[0].onmessage!;
  const second = runner.run(request);
  await firstFailure;
  late({ data: { type: 'result', runId: workers[0].sent[0].runId, nonce: workers[0].sent[0].nonce, result: { output: 99, trace: [] } } });
  workers[1].onmessage?.({ data: { type: 'result', runId: -1, nonce: workers[1].sent[0].nonce, result: { output: 99, trace: [] } } });
  workers[1].onmessage?.({ data: { type: 'result', runId: workers[1].sent[0].runId, nonce: 'guessed', result: { output: 99, trace: [] } } });
  assert.notEqual(workers[0].sent[0].nonce, workers[1].sent[0].nonce);
  workers[1].result(2);
  assert.equal((await second).output, 2);
  assert.equal(workers[0].terminated, 1);
  const cancelled = runner.run(request);
  const failure = assert.rejects(cancelled, codeIs('cancelled'));
  runner.cancel(); runner.cancel();
  await failure;
  assert.equal(workers[2].terminated, 1);
});

test('timeout stops worker and next run can succeed', async () => {
  const workers: FakeWorker[] = [];
  const runner = new PracticeRunner({ timeoutMs: 10, workerFactory: () => { const worker = new FakeWorker(); workers.push(worker); return worker; } });
  await assert.rejects(runner.run(request), codeIs('timeout'));
  assert.equal(workers[0].terminated, 1);
  const next = runner.run(request); workers[1].result(2);
  assert.equal((await next).output, 2);
});

test('runner classifies worker failures, unreadable messages and invalid returned data', async () => {
  for (const code of ['worker', 'messageerror', 'invalid', 'compile', 'limit']) {
    const worker = new FakeWorker(), runner = new PracticeRunner({ workerFactory: () => worker });
    const running = runner.run(request);
    const failure = assert.rejects(running, codeIs(code));
    if (code === 'worker') worker.onerror?.({ message: 'worker failed' });
    else if (code === 'messageerror') worker.onmessageerror?.({});
    else if (code === 'invalid') worker.result({ value: Infinity });
    else worker.onmessage?.({ data: { type: 'error', runId: worker.sent[0].runId, nonce: worker.sent[0].nonce, error: { code, message: 'reported error' } } });
    await failure;
    assert.equal(worker.terminated, 1);
  }
  const unavailable = new PracticeRunner({ workerFactory: () => { throw new Error('unsupported'); } });
  await assert.rejects(unavailable.run(request), codeIs('worker'));
  const invalid = new PracticeRunner({ workerFactory: () => { throw new Error('must not create'); } });
  await assert.rejects(invalid.run({ ...request, input: { x: Infinity } }), codeIs('invalid'));
});

/** Bridge only the browser Worker transport; load the actual production Worker module in a real thread. */
class NodeWorkerAdapter implements PracticeWorkerLike {
  onmessage: PracticeWorkerLike['onmessage'] = null;
  onerror: PracticeWorkerLike['onerror'] = null;
  onmessageerror: PracticeWorkerLike['onmessageerror'] = null;
  private ready = false;
  private pending: unknown[] = [];
  private readonly worker: NodeWorker;
  closed: Promise<number> | undefined;
  constructor() {
    const url = new URL('../src/practice-worker.ts', import.meta.url).href;
    this.worker = new NodeWorker(`
      const { parentPort } = require('node:worker_threads');
      globalThis.postMessage = value => parentPort.postMessage(value);
      import(${JSON.stringify(url)}).then(() => {
        parentPort.on('message', data => globalThis.onmessage({ data }));
        parentPort.postMessage({ transportReady: true });
      }).catch(error => { throw error; });
    `, { eval: true });
    this.worker.on('message', data => {
      if (data?.transportReady) { this.ready = true; for (const message of this.pending) this.worker.postMessage(message); this.pending = []; }
      else this.onmessage?.({ data });
    });
    this.worker.on('error', error => this.onerror?.({ message: error.message }));
    this.worker.on('messageerror', error => this.onmessageerror?.(error));
  }
  postMessage(value: unknown) { if (this.ready) this.worker.postMessage(value); else this.pending.push(value); }
  terminate() { this.closed ??= this.worker.terminate(); }
}

test('real worker ignores forged protocol results and retains its native sender after global replacement', async () => {
  const workers: NodeWorkerAdapter[] = [];
  const runner = new PracticeRunner({ workerFactory: () => { const worker = new NodeWorkerAdapter(); workers.push(worker); return worker; } });
  try {
    const result = await runner.run({
      code: wrapPracticeBody(`
        postMessage({type:'result',runId:1,nonce:'guess',result:{output:99,trace:[]}});
        globalThis.postMessage = () => { throw new Error('replacement must not intercept the real result'); };
        api.trace('real', 7);
        return 7;
      `), input: {}, params: {},
    });
    assert.deepEqual(result, { output: 7, trace: [{ step: 'real', value: 7 }] });
    await workers[0].closed;
    const failure = runner.run({ code: wrapPracticeBody(`globalThis.postMessage = () => {}; throw new Error('real failure');`), input: {}, params: {} });
    await assert.rejects(failure, error => codeIs('runtime')(error) && (error as Error).message === 'real failure');
    await workers[1].closed;
  } finally { runner.cancel(); await Promise.all(workers.map(worker => worker.closed)); }
});

test('real worker executes every registered editor answer, terminates a loop, cancels and can run again', async () => {
  const { practiceDefinitions } = await import('../src/practice-catalogue.ts');
  const workers: NodeWorkerAdapter[] = [];
  const runner = new PracticeRunner({ timeoutMs: 1000, workerFactory: () => { const worker = new NodeWorkerAdapter(); workers.push(worker); return worker; } });
  try {
    for (const definition of practiceDefinitions) for (const task of definition.tasks) {
      const sample = task.cases[0];
      const result = await runner.run({ code: wrapPracticeBody(task.solutionCode), helperSource: task.helperSource, input: sample.input, params: sample.params });
      task.validateOutput(result.output, sample.input);
      assert.equal(comparePracticeValues(task.reference(sample.input, sample.params), result.output, task.tolerance).equal, true, `${definition.id}/${task.id}`);
    }
    await assert.rejects(runner.run({ code: wrapPracticeBody('while (true) {}'), input: {}, params: {} }), codeIs('timeout'));
    const pending = runner.run({ code: wrapPracticeBody('while (true) {}'), input: {}, params: {} });
    const cancelled = assert.rejects(pending, codeIs('cancelled')); runner.cancel(); await cancelled;
    assert.deepEqual((await runner.run({ code: wrapPracticeBody('return { value: 42 };'), input: {}, params: {} })).output, { value: 42 });
  } finally { runner.cancel(); await Promise.all(workers.map(worker => worker.closed)); }
});
