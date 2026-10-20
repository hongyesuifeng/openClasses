import { courseDigests } from './principles-data.ts';
import type { CourseChapter, CourseDigest } from './course-types.ts';

export interface ChineseReadingSection {
  id: string;
  title: string;
  sourceLabel: string;
  sourcePages?: number[];
  sourceSections?: number[];
  paragraphs: string[];
  comparison?: ChineseReadingComparison;
}

export interface ChineseReadingComparison {
  title: string;
  rows: { label: string; steps: string[]; result: string }[];
  caption: string;
}

export interface ChineseReadingDocument {
  course: string;
  chapter: string;
  title: string;
  source: string;
  scope: string;
  sections: ChineseReadingSection[];
}

export function chineseReadingHref(course: CourseDigest, chapter: CourseChapter): string | null {
  const language = chapter.sourceLanguage ?? course.sourceLanguage;
  if (language !== 'en' && language !== 'mixed') return null;
  return `?lab=chinese-reading&course=${encodeURIComponent(course.id)}&chapter=${encodeURIComponent(chapter.id)}`;
}

export function findChineseReadingTarget(search: string): { course: CourseDigest; chapter: CourseChapter } | null {
  const query = new URLSearchParams(search);
  const course = courseDigests.find(item => item.id === query.get('course'));
  const chapter = course?.chapters.find(item => item.id === query.get('chapter'));
  return course && chapter && chineseReadingHref(course, chapter) ? { course, chapter } : null;
}

const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const nonempty = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const positiveIntegers = (value: unknown) => value === undefined || (Array.isArray(value) && value.every(item => Number.isSafeInteger(item) && item > 0));
const validComparison = (value: unknown) => value === undefined || (record(value) && nonempty(value.title) && nonempty(value.caption)
  && Array.isArray(value.rows) && value.rows.length >= 2 && value.rows.every(row => record(row)
    && nonempty(row.label) && nonempty(row.result) && Array.isArray(row.steps) && row.steps.length >= 2 && row.steps.every(nonempty)));

export function parseChineseReadingDocument(value: unknown, course: CourseDigest, chapter: CourseChapter): ChineseReadingDocument {
  if (!record(value) || value.course !== course.id || value.chapter !== chapter.id || value.source !== chapter.source
    || !nonempty(value.title) || !nonempty(value.scope) || !Array.isArray(value.sections) || value.sections.length === 0) {
    throw new Error('中文文档与当前课程不匹配');
  }
  const ids = new Set<string>();
  for (const section of value.sections) {
    if (!record(section) || !nonempty(section.id) || !/^[a-z][a-z0-9-]*$/.test(section.id) || ids.has(section.id)
      || !nonempty(section.title) || !nonempty(section.sourceLabel) || !Array.isArray(section.paragraphs)
      || !section.paragraphs.length || !section.paragraphs.every(nonempty)
      || !validComparison(section.comparison)
      || !positiveIntegers(section.sourcePages) || !positiveIntegers(section.sourceSections)
      || !((Array.isArray(section.sourcePages) && section.sourcePages.length) || (Array.isArray(section.sourceSections) && section.sourceSections.length))) {
      throw new Error('中文文档的小节内容不完整');
    }
    ids.add(section.id);
  }
  return value as unknown as ChineseReadingDocument;
}
