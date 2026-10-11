import test from 'node:test';
import assert from 'node:assert/strict';
import {lessons,stages} from '../src/course-data.ts';
test('course covers seven lessons per stage with unique routable ids and complete explanations',()=>{
  assert.equal(lessons.length,28);assert.equal(new Set(lessons.map(l=>l.id)).size,28);
  for(const stage of stages){assert.equal(lessons.filter(l=>l.stage===stage.id).length,7);assert.ok(lessons.find(l=>l.id===stage.first));}
  for(const lesson of lessons){for(const field of ['question','why','formula','variables','boundary','observe','game','cocos'] as const)assert.ok(lesson[field].trim(),`${lesson.id}.${field}`);assert.equal(lesson.steps.length,3);assert.ok(lesson.sources.every(url=>new URL(url).protocol==='https:'));}
});
