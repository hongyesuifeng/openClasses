import test from 'node:test';
import assert from 'node:assert/strict';
import { frameSnapshot, initialState, projectPoint, restoreState, sceneSnapshot } from '../src/classic-core.ts';

test('input, world updates and rendered snapshots change at their respective phases', () => {
  assert.deepEqual(frameSnapshot(0), { input: 0, worldZ: 0, imageZ: 0 });
  assert.deepEqual(frameSnapshot(1), { input: 1, worldZ: 0, imageZ: 0 });
  for (const phase of [2, 3]) assert.deepEqual(frameSnapshot(phase), { input: 1, worldZ: 2, imageZ: 0 });
  assert.deepEqual(frameSnapshot(4), { input: 1, worldZ: 2, imageZ: 2 });
  assert.equal(frameSnapshot(4, 0).worldZ, 0);
  assert.equal(frameSnapshot(4, 1, 5, 1 / 60).worldZ, 5 / 60);
});

test('a following camera preserves the car projection while the fixed obstacle changes', () => {
  const before = sceneSnapshot(0, true), after = sceneSnapshot(4, true);
  const carBefore = projectPoint([0, 0.8, before.worldZ], before.cameraZ, 50, 400, 280)!;
  const carAfter = projectPoint([0, 0.8, after.worldZ], after.cameraZ, 50, 400, 280)!;
  assert.deepEqual(carBefore, carAfter);
  const obstacleBefore = projectPoint([0, 1, 8], before.cameraZ, 50, 400, 280)!;
  const obstacleAfter = projectPoint([0, 1, 8], after.cameraZ, 50, 400, 280)!;
  assert.notEqual(obstacleBefore.y, obstacleAfter.y);
  assert.equal(sceneSnapshot(4, false).cameraZ, -8);
});

test('distance and wider FOV independently shrink projected width without changing geometry', () => {
  const width = (z: number, fov: number) => {
    const left = projectPoint([-0.75, 0.8, z], -8, fov, 400, 280)!;
    const right = projectPoint([0.75, 0.8, z], -8, fov, 400, 280)!;
    return right.x - left.x;
  };
  assert.ok(width(4, 50) < width(0, 50));
  assert.ok(width(0, 80) < width(0, 50));
  assert.equal(projectPoint([0, 4, -9], -8, 50, 400, 280), null);
});

test('bookmarks round trip and recover safely from stale, malformed or out-of-range data', () => {
  const saved = { ...initialState, lesson: 'scene' as const, sceneZ: 2, follow: true, phase: 3 };
  assert.deepEqual(restoreState(JSON.stringify(saved)), saved);
  for (const raw of [null, 'broken', 'null', '[]', '{"version":2}']) assert.deepEqual(restoreState(raw), initialState);
  const recovered = restoreState('{"version":1,"lesson":"bad","phase":88,"sceneZ":-5,"follow":"false","fov":999,"projectionZ":"NaN"}');
  assert.deepEqual(recovered, { ...initialState, phase: 4, fov: 80 });
});
