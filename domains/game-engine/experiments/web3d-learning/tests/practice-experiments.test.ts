import test from 'node:test';
import assert from 'node:assert/strict';
import { foundationalPractices } from '../src/practice-experiments.ts';
import type { PracticeCase, PracticeRecord, PracticeRunResult, PracticeTask, PracticeValue } from '../src/practice-types.ts';

function run(task: PracticeTask, code: string, item: PracticeCase): PracticeRunResult {
  const trace: PracticeRunResult['trace'] = [];
  const helpers = task.helperSource ? new Function(task.helperSource)() : {};
  const api = { ...helpers, clone: structuredClone, trace(step: string, value: PracticeValue) { trace.push({ step, value: structuredClone(value) }); } };
  // Only repository-owned fixtures run here; the application executes learner input in its worker.
  const output = new Function('input', 'params', 'api', code)(structuredClone(item.input), structuredClone(item.params), api) as PracticeValue;
  return { output, trace };
}
function close(actual: PracticeValue, expected: PracticeValue, tolerance = 1e-9): void {
  if (typeof expected === 'number') {
    assert.equal(typeof actual, 'number');
    assert.ok(Number.isFinite(actual) && Math.abs((actual as number) - expected) <= tolerance, `${String(actual)} != ${expected}`);
  } else if (Array.isArray(expected)) {
    assert.ok(Array.isArray(actual)); assert.equal(actual.length, expected.length);
    expected.forEach((value, i) => close(actual[i], value, tolerance));
  } else if (expected && typeof expected === 'object') {
    assert.ok(actual && typeof actual === 'object' && !Array.isArray(actual));
    assert.deepEqual(Object.keys(actual).sort(), Object.keys(expected).sort());
    for (const key of Object.keys(expected)) close((actual as PracticeRecord)[key], expected[key], tolerance);
  } else assert.equal(actual, expected);
}
const practice = (id: string) => foundationalPractices.find((item) => item.id === id)!;
const task = (id: string, index = 0) => practice(id).tasks[index];

test('02/04/09提供有原课小节的定义，所有源码是10—30行函数体', () => {
  assert.deepEqual(foundationalPractices.map((item) => item.id), ['02', '04', '09']);
  for (const definition of foundationalPractices) {
    assert.ok(definition.sources.every((source) => source.sectionIds.length > 0));
    for (const item of definition.tasks) {
      for (const code of [item.starterCode, item.solutionCode, item.brokenCode]) assert.ok(code.split('\n').length >= 10 && code.split('\n').length <= 30);
      assert.ok(item.cases.length >= 3);
    }
  }
});

for (const definition of foundationalPractices) for (const item of definition.tasks) {
  test(`${definition.id}/${item.id}：正确实现通过全部独立参考，且不修改题目输入`, () => {
    for (const sample of item.cases) {
      const before = structuredClone(sample);
      const result = run(item, item.solutionCode, sample);
      item.validateOutput(result.output, sample.input);
      close(result.output, item.reference(sample.input, sample.params), item.tolerance);
      assert.deepEqual(sample, before); assert.ok(result.trace.length > 0);
    }
  });
  test(`${definition.id}/${item.id}：起始错误及另一种错误均可被变式识别`, () => {
    for (const code of [item.starterCode, item.brokenCode]) {
      assert.ok(item.cases.some((sample) => {
        try { close(run(item, code, sample).output, item.reference(sample.input, sample.params), item.tolerance); return false; }
        catch { return true; }
      }), '错误程序不应通过整组案例');
    }
  });
}

test('变换参考的90°金标准：次序不同，方向不受平移，指定中心固定', () => {
  const input: PracticeRecord = { points: [[1, 0, 1], [1, 0, 0]] };
  close(task('02').reference(input, { degrees: 90, tx: 2, ty: 0, order: 'R*T' }), { points: [[0, 3, 1], [0, 1, 0]] });
  close(task('02').reference(input, { degrees: 90, tx: 2, ty: 0, order: 'T*R' }), { points: [[2, 1, 1], [0, 1, 0]] });
  close(task('02', 1).reference({ points: [[2, -1, 1], [3, -1, 1], [1, 0, 0]] }, { degrees: 90, pivotX: 2, pivotY: -1 }), { points: [[2, -1, 1], [2, 0, 1], [0, 1, 0]] });
});

test('恒速2秒=40，零步长保留状态，截断长步长不能冒充全部模拟时间', () => {
  const item = task('04');
  for (const sample of item.cases.slice(0, 4)) {
    const result = item.reference(sample.input, sample.params) as PracticeRecord;
    close((result.times as number[]).at(-1)!, 2); close((result.positions as number[]).at(-1)!, 40);
  }
  close(item.reference({ initialPosition: 7, dts: [0, 0.5, 1.5], paused: [false, false, false] }, { speed: 20 }), { times: [0, 0, 0.5, 2], positions: [7, 7, 17, 47] });
  const sample = item.cases.find((value) => value.id === 'uneven')!;
  const truncated = item.solutionCode.replace('position += params.speed * dt;', 'position += params.speed * Math.min(dt, 0.1);');
  const wrong = run(item, truncated, sample).output as PracticeRecord;
  assert.notEqual((wrong.positions as number[]).at(-1), 40);
});

test('非零dt的暂停步骤不推进模拟，漏暂停条件会多走40', () => {
  const item = task('04'), sample = item.cases.find((value) => value.id === 'paused-steps')!;
  const expected = { times: [0, 0.5, 0.5, 1, 2, 2], positions: [0, 10, 10, 20, 40, 40] };
  close(item.reference(sample.input, sample.params), expected);
  close(run(item, item.solutionCode, sample).output, expected);
  const wrong = run(item, item.brokenCode, sample).output as PracticeRecord;
  close((wrong.times as number[]).at(-1)!, 4);
  close((wrong.positions as number[]).at(-1)!, 80);
});

test('采样参考的预核结果：N=1可漏掉窄带，N=4按左闭右开计数', () => {
  const item = task('09'), input: PracticeRecord = { pixelCount: 4, left: 1, right: 1.25 };
  const expected = [
    [1, 0, [0, 0, 0, 0]], [1, 0.375, [0, 1, 0, 0]], [1, 0.875, [0, 0, 0, 0]],
    [4, 0, [0, 0.25, 0, 0]], [4, 0.375, [0, 0.25, 0, 0]], [4, 0.875, [0, 0.25, 0, 0]],
    [4, 0.9, [0, 0, 0.25, 0]], [16, 0.875, [0, 0.125, 0.125, 0]], [16, 0.9, [0, 0.125, 0.125, 0]],
  ] as const;
  for (const [samples, offset, coverage] of expected) close((item.reference(input, { samples, offset }) as PracticeRecord).coverage, [...coverage]);
  close(item.reference({ pixelCount: 1, left: 0.125, right: 0.375 }, { samples: 4, offset: 0 }), { coverage: [0.25], hits: [1], sampleX: [[0.125, 0.375, 0.625, 0.875]] });
});

test('判题比较有限采样而非解析覆盖，且不假定每像素误差单调下降', () => {
  const item = task('09');
  const sample = item.cases.find((value) => value.params.samples === 1 && value.params.offset === 0.375)!;
  const result = run(item, item.solutionCode, sample).output as PracticeRecord;
  close(result.coverage, [0, 1, 0, 0]); // Exact area is 0.25, deliberately not the grading target.
  item.validateOutput(result, sample.input);
  close(result, item.reference(sample.input, sample.params));
  assert.notEqual((result.coverage as number[])[1], 0.25);
});

test('输出schema拒绝漏字段、错误长度、非有限坐标和不合法命中数', () => {
  assert.throws(() => task('02').validateOutput({ points: [[0, Number.NaN, 1]] }, { points: [[0, 0, 1]] }));
  assert.throws(() => task('02').validateOutput({ points: [[0, 1, 1e-12]] }, { points: [[0, 0, 0]] }));
  assert.throws(() => task('02').validateOutput({ points: [[0, 1, 1]], extra: 1 }, { points: [[0, 0, 1]] }));
  assert.throws(() => task('04').validateOutput({ positions: [0], times: [0] }, { dts: [0.5], paused: [false] }));
  assert.throws(() => task('04').validateOutput({ positions: [0, Infinity], times: [0, 1] }, { dts: [1], paused: [false] }));
  assert.throws(() => task('04').reference({ initialPosition: 0, dts: [1], paused: [] }, { speed: 20 }));
  assert.throws(() => task('09').validateOutput({ coverage: [0], sampleX: [[0.5]], hits: [2] }, { pixelCount: 1 }));
  assert.throws(() => task('09').validateOutput({ coverage: [0], sampleX: [], hits: [0] }, { pixelCount: 1 }));
  assert.throws(() => task('09').validateOutput({ coverage: [0], sampleX: [Array(4)], hits: [0] }, { pixelCount: 1 }));
});
