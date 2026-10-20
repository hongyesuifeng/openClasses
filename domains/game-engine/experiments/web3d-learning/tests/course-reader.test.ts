import test from 'node:test';
import assert from 'node:assert/strict';
import { restoreCourseReading } from '../src/course-reader-model.ts';
import { courseDigests } from '../src/principles-data.ts';

test('original chapters have independent bookmarks and explicit links override saved reading', () => {
  const saved = JSON.stringify({ course: 'unity', chapters: { games101: '04', unity: '1.3', games104: '02' } });
  assert.deepEqual(restoreCourseReading(saved), { course: 'unity', chapters: { games101: '04', unity: '1.3', games104: '02' } });
  const linked = restoreCourseReading(saved, '?course=games101&chapter=05');
  assert.equal(linked.course, 'games101');
  assert.equal(linked.chapters.games101, '05');
  assert.equal(linked.chapters.unity, '1.3');
});

test('damaged, outdated and hostile bookmarks and links cannot select nonexistent chapters', () => {
  for (const saved of ['{broken', 'null', '[]', '{"course":"__proto__","chapters":{"games101":99,"unity":"99.9"}}']) {
    assert.deepEqual(restoreCourseReading(saved), restoreCourseReading(null));
  }
  assert.equal(restoreCourseReading(null, '?course=games104&chapter=999').chapters.games104, '01');
  assert.equal(restoreCourseReading(null, '?course=constructor').course, 'games101');
  assert.equal(restoreCourseReading(null, '?lesson=scene').course, 'unity');
  assert.equal(restoreCourseReading(null, '?lesson=__proto__').course, 'games101');
});

test('every expanded course chapter remains reachable by URL and independent bookmark', () => {
  for (const course of courseDigests) {
    for (const chapter of course.chapters) {
      const saved = JSON.stringify({ course: course.id, chapters: { [course.id]: chapter.id } });
      assert.equal(restoreCourseReading(saved).chapters[course.id], chapter.id);
      const linked = restoreCourseReading(null, `?course=${course.id}&chapter=${encodeURIComponent(chapter.id)}`);
      assert.equal(linked.course, course.id);
      assert.equal(linked.chapters[course.id], chapter.id);
    }
    assert.equal(restoreCourseReading(null).chapters[course.id], course.chapters[0].id);
  }
});

test('course chapters have unique IDs and every digest point has an official source locator', () => {
  for (const course of courseDigests) {
    const ids = course.chapters.map(chapter => chapter.id);
    assert.equal(new Set(ids).size, ids.length, `${course.id}: duplicate chapter IDs`);
    for (const chapter of course.chapters) {
      assert.ok(chapter.title.trim() && chapter.originalTitle.trim() && chapter.sourceLabel.trim());
      const source = new URL(chapter.source);
      const officialHost = course.id === 'unity' ? 'learn.unity.com'
        : course.id === 'games101' ? 'sites.cs.ucsb.edu'
        : 'games-1312234642.cos.ap-guangzhou.myqcloud.com';
      assert.equal(source.hostname, officialHost, `${course.id}/${chapter.id}: unexpected source`);
      assert.equal(source.protocol, 'https:');
      assert.ok(chapter.points.length > 0, `${course.id}/${chapter.id}: empty digest`);
      for (const point of chapter.points) assert.ok(point.title.trim() && point.text.trim() && point.source.trim());
    }
  }
});

test('published graphics lectures and all twenty Unity core lessons are present in original order', () => {
  const lectures = Array.from({ length: 22 }, (_, index) => String(index + 1).padStart(2, '0'));
  for (const id of ['games101', 'games104']) {
    assert.deepEqual(courseDigests.find(course => course.id === id)!.chapters.map(chapter => chapter.id), lectures);
  }
  const unity = courseDigests.find(course => course.id === 'unity')!;
  assert.equal(unity.chapters.length, 47);
  assert.deepEqual(unity.chapters.filter(chapter => /^[1-5]\.[1-4]$/.test(chapter.id)).map(chapter => chapter.id),
    Array.from({ length: 5 }, (_, unit) => Array.from({ length: 4 }, (_, lesson) => `${unit + 1}.${lesson + 1}`)).flat());
});
