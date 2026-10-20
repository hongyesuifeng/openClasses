import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { courseDigests } from '../src/principles-data.ts';
import { chineseReadingHref, findChineseReadingTarget, parseChineseReadingDocument } from '../src/chinese-reading-model.ts';

test('English sources have Chinese reading links while Chinese sources do not', () => {
  const course = courseDigests[0];
  const chapter = course.chapters[4];
  assert.equal(chineseReadingHref(course, chapter), '?lab=chinese-reading&course=games101&chapter=05');
  assert.equal(chineseReadingHref({ ...course, sourceLanguage: 'zh' }, chapter), null);
  assert.equal(chineseReadingHref(course, { ...chapter, sourceLanguage: 'zh' }), null);
  assert.ok(chineseReadingHref({ ...course, sourceLanguage: 'mixed' }, chapter));
  assert.equal(chineseReadingHref({ ...course, sourceLanguage: undefined }, chapter), null);
});

test('Chinese documents only resolve registered courses and chapter IDs', () => {
  assert.equal(findChineseReadingTarget('?course=games101&chapter=05')?.chapter.id, '05');
  for (const query of ['', '?course=__proto__&chapter=01', '?course=games101&chapter=../secret', '?course=unity&chapter=99.9']) {
    assert.equal(findChineseReadingTarget(query), null);
  }
});

test('mismatched or malformed documents cannot replace the requested reading', () => {
  const course = courseDigests[0];
  const chapter = course.chapters[0];
  const valid = { course: course.id, chapter: chapter.id, title: '概述', source: chapter.source, scope: '中文学习整理，非全文翻译。',
    sections: [{ id: 'part-1', title: '图形学', sourceLabel: 'PDF 第 9 页', sourcePages: [9], paragraphs: ['课程内容。'] }] };
  assert.equal(parseChineseReadingDocument(valid, course, chapter).chapter, '01');
  const comparison = { title: '次序', caption: '原课例子', rows: [
    { label: '先平移', steps: ['原位置', '平移', '旋转'], result: '结果一' },
    { label: '先旋转', steps: ['原位置', '旋转', '平移'], result: '结果二' },
  ] };
  const withComparison = { ...valid, sections: [{ ...valid.sections[0], comparison }] };
  assert.deepEqual(parseChineseReadingDocument(withComparison, course, chapter).sections[0].comparison, comparison);
  for (const invalid of [null, [], { ...valid, chapter: '02' }, { ...valid, source: 'https://example.com' },
    { ...valid, sections: [] }, { ...valid, sections: [valid.sections[0], valid.sections[0]] },
    { ...valid, sections: [{ ...valid.sections[0], sourcePages: [0] }] },
    { ...valid, sections: [{ ...valid.sections[0], paragraphs: [''] }] },
    { ...valid, sections: [{ ...valid.sections[0], sourcePages: undefined }] },
    { ...valid, sections: [{ ...valid.sections[0], comparison: null }] },
    { ...valid, sections: [{ ...valid.sections[0], comparison: { ...comparison, rows: [] } }] },
    { ...valid, sections: [{ ...valid.sections[0], comparison: { ...comparison, rows: [{ ...comparison.rows[0], steps: [''] }, comparison.rows[1]] } }] }]) {
    assert.throws(() => parseChineseReadingDocument(invalid, course, chapter));
  }
});

test('all 91 readings exist, match their original sources and contain located Chinese sections', () => {
  const evidence = JSON.parse(readFileSync(new URL('../docs/evidence/classic-courses-2026-10-20.json', import.meta.url), 'utf8'));
  let documents = 0;
  for (const course of courseDigests) {
    const folder = new URL(`../public/translations/${course.id}/`, import.meta.url);
    assert.deepEqual(readdirSync(folder).filter(name => name.endsWith('.json')).sort(), course.chapters.map(chapter => `${chapter.id}.json`).sort());
    for (const chapter of course.chapters) {
      const raw = JSON.parse(readFileSync(new URL(`${encodeURIComponent(chapter.id)}.json`, folder), 'utf8'));
      const document = parseChineseReadingDocument(raw, course, chapter);
      assert.match(document.title, /[\u4e00-\u9fff]/);
      assert.match(document.scope, /[\u4e00-\u9fff]/);
      assert.match(document.scope, /非全文翻译|不是全文翻译|并非全文翻译/);
      const pages = evidence.pdf_sources.find((source: { course: string; chapter: string }) => source.course === course.id && source.chapter === chapter.id)?.pages;
      for (const section of document.sections) {
        assert.match(section.title, /[\u4e00-\u9fff]/);
        assert.ok(section.paragraphs.some(paragraph => /[\u4e00-\u9fff]/.test(paragraph)));
        if (pages) {
          assert.ok(section.sourcePages?.length, `${course.id}/${chapter.id}/${section.id}: missing page locator`);
          for (const page of section.sourcePages!) assert.ok(page <= pages, `${course.id}/${chapter.id}: page ${page} exceeds PDF`);
        } else assert.ok(section.sourceSections?.length, `unity/${chapter.id}/${section.id}: missing section locator`);
      }
      const link = chineseReadingHref(course, chapter)!;
      assert.equal(findChineseReadingTarget(link)?.chapter.id, chapter.id);
      documents++;
    }
  }
  assert.equal(documents, 91);
});
