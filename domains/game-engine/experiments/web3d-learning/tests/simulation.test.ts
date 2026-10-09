import test from 'node:test';
import assert from 'node:assert/strict';
import { advance, createSimulation, FrameClock, simulateTwoSeconds, toDegrees } from '../src/simulation.ts';

const close = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} != ${expected}`);

test('45 度/秒在 30、60、120 步/秒下累计模拟 2 秒均为 90 度', () => {
  for (const fps of [30, 60, 120]) {
    const state = simulateTwoSeconds(45, fps);
    close(state.simulatedSeconds, 2);
    close(toDegrees(state.angleRadians), 90);
    assert.equal(state.paused, true);
  }
});

test('零速度保留角度，但模拟时间继续', () => {
  const state = createSimulation(0);
  advance(state, 0.1);
  assert.equal(state.angleRadians, 0);
  close(state.simulatedSeconds, 0.1);
});

test('暂停时改速度不改变状态，继续后按新速度更新', () => {
  const state = createSimulation();
  advance(state, 1);
  state.paused = true;
  state.speedDegrees = 90;
  assert.equal(advance(state, 2), 0);
  close(state.simulatedSeconds, 1);
  close(toDegrees(state.angleRadians), 45);
  state.paused = false;
  advance(state, 1);
  close(state.simulatedSeconds, 2);
  close(toDegrees(state.angleRadians), 135);
});

test('重建基准不补算暂停时间，正常后台长帧最多更新 0.1 秒', () => {
  const clock = new FrameClock();
  assert.deepEqual(clock.consume(1000), { actualSeconds: 0, boundedSeconds: 0 });
  close(clock.consume(1020).boundedSeconds, 0.02);
  const gap = clock.consume(6020);
  assert.equal(gap.actualSeconds, 5);
  assert.equal(gap.boundedSeconds, 0.1);
  clock.reset();
  assert.equal(clock.consume(10000).boundedSeconds, 0);
  close(clock.consume(10020).boundedSeconds, 0.02);
});

test('重置状态恢复默认速度、初始角度、时间与自动播放', () => {
  assert.deepEqual(createSimulation(), { speedDegrees: 45, simulatedSeconds: 0, angleRadians: 0, paused: false });
});

test('拒绝负数和非有限输入，避免污染状态', () => {
  const state = createSimulation();
  for (const seconds of [-1, NaN, Infinity]) assert.throws(() => advance(state, seconds), RangeError);
  for (const speed of [-1, 181, NaN, Infinity]) assert.throws(() => createSimulation(speed), RangeError);
  assert.throws(() => simulateTwoSeconds(45, 0), RangeError);
  close(state.simulatedSeconds, 0);
});
