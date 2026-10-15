import test from 'node:test';
import assert from 'node:assert/strict';
import { restoreCourseReading } from '../src/course-reader-model.ts';

test('original chapters have independent bookmarks and explicit links override saved reading', () => {
  const saved = JSON.stringify({ course: 'unity', chapters: { games101: '04', unity: '1.3', games104: '02' } });
  assert.deepEqual(restoreCourseReading(saved), { course: 'unity', chapters: { games101: '04', unity: '1.3', games104: '02' } });
  const linked = restoreCourseReading(saved, '?course=games101&chapter=05');
  assert.equal(linked.course, 'games101');
  assert.equal(linked.chapters.games101, '05');
  assert.equal(linked.chapters.unity, '1.3');
});

test('damaged, outdated and hostile bookmarks and links cannot select nonexistent chapters', () => {
  for (const saved of ['{broken', 'null', '[]', '{"course":"__proto__","chapters":{"games101":99,"unity":"5.3"}}']) {
    assert.deepEqual(restoreCourseReading(saved), restoreCourseReading(null));
  }
  assert.equal(restoreCourseReading(null, '?course=games104&chapter=999').chapters.games104, '01');
  assert.equal(restoreCourseReading(null, '?course=constructor').course, 'games101');
  assert.equal(restoreCourseReading(null, '?lesson=scene').course, 'unity');
  assert.equal(restoreCourseReading(null, '?lesson=__proto__').course, 'games101');
});
