import test from 'node:test';
import assert from 'node:assert/strict';
import { engineAction, gameAction, newEngineCase, newGameCase, restoreReading, stripCoverage } from '../src/principles-model.ts';

test('world changes cannot reach the image before publishing and consuming them', () => {
  const initial = newEngineCase();
  const moved = engineAction(initial, 'advance');
  const skipped = engineAction(moved, 'render');
  assert.equal(skipped.world.version, 1);
  assert.equal(skipped.image.version, 0);
  const published = engineAction(skipped, 'publish');
  assert.equal(published.pending?.version, 1);
  assert.equal(published.image.version, 0);
  const drawn = engineAction(published, 'render');
  assert.deepEqual(drawn.image, moved.world);
  assert.equal(drawn.pending, null);
  assert.deepEqual(initial.world, { version: 0, z: 0 });
});

test('an unconsumed packet is protected and later world updates remain available', () => {
  const first = engineAction(engineAction(newEngineCase(), 'advance'), 'publish');
  const newer = engineAction(first, 'advance');
  const blocked = engineAction(newer, 'publish');
  assert.equal(blocked.pending?.version, 1);
  assert.equal(blocked.world.version, 2);
  assert.equal(blocked.dirty, true);
  const firstImage = engineAction(blocked, 'render');
  assert.equal(firstImage.image.version, 1);
  assert.equal(firstImage.dirty, true);
  const secondImage = engineAction(engineAction(firstImage, 'publish'), 'render');
  assert.equal(secondImage.image.version, 2);
  assert.equal(secondImage.dirty, false);
});

test('ending the game only stops spawning and scoring when its rules consult the state', () => {
  const over = gameAction(newGameCase(), 'end', true);
  const guarded = gameAction(gameAction(over, 'spawn', true), 'score', true);
  assert.deepEqual(guarded, over);
  const displayOnly = gameAction(gameAction(over, 'spawn', false), 'score', false);
  assert.equal(displayOnly.ended, true);
  assert.equal(displayOnly.targets, 1);
  assert.equal(displayOnly.score, 10);
  const played = gameAction(newGameCase(), 'score', true);
  assert.equal(played.targets, 0);
  assert.equal(gameAction(played, 'score', true).score, 10, 'an absent target cannot be scored twice');
  assert.deepEqual(newGameCase(), { ended: false, targets: 1, score: 0 });
});

test('small translations lose a thin strip at a center sample while multi-point coverage stays partial', () => {
  assert.equal(stripCoverage(5, 0.1, 1), 0);
  assert.equal(stripCoverage(5, 0.4, 1), 1);
  for (const offset of [0, 0.1, 0.25, 0.4, 0.5, 0.75]) {
    assert.equal(stripCoverage(5, offset, 4), 0.25);
    assert.equal(stripCoverage(4, offset, 4), 0);
    assert.equal(stripCoverage(6, offset, 4), 0);
  }
});

test('reading bookmarks restore valid topics and recover from damaged or future data', () => {
  const saved = { version: 2, course: 'unity', topics: { games101: 5, unity: 3, games104: 1 } };
  assert.deepEqual(restoreReading(JSON.stringify(saved)), saved);
  const recovered = restoreReading('{"version":2,"course":"<bad>","topics":{"games101":99,"unity":-1,"games104":0.5}}');
  assert.deepEqual(recovered, restoreReading(null));
  for (const raw of ['broken', 'null', '{"version":99}']) assert.deepEqual(restoreReading(raw), restoreReading(null));
});
