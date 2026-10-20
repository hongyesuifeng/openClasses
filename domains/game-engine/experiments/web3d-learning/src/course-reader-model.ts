import { courseDigests } from './principles-data.ts';
import type { CourseId } from './principles-data.ts';

export interface ReadingPosition { course: CourseId; chapters: Record<CourseId, string> }
export function restoreCourseReading(serialized: string | null, search = ''): ReadingPosition {
  const reading: ReadingPosition = {
    course: 'games101',
    chapters: Object.fromEntries(courseDigests.map(course => [course.id, course.chapters[0].id])) as Record<CourseId, string>,
  };
  const validCourse = (value: unknown): value is CourseId => courseDigests.some(course => course.id === value);
  try {
    const saved: unknown = JSON.parse(serialized ?? 'null');
    if (saved && typeof saved === 'object' && 'course' in saved && 'chapters' in saved) {
      if (validCourse(saved.course)) reading.course = saved.course;
      const chapters = saved.chapters;
      if (chapters && typeof chapters === 'object') {
        for (const course of courseDigests) {
          const id = Object.getOwnPropertyDescriptor(chapters, course.id)?.value;
          if (course.chapters.some(chapter => chapter.id === id)) reading.chapters[course.id] = id;
        }
      }
    }
  } catch { /* A missing or damaged bookmark starts at the first original chapter. */ }
  const query = new URLSearchParams(search);
  const requested = query.get('course');
  if (requested !== null) reading.course = validCourse(requested) ? requested : 'games101';
  else {
    const previousLinks: Record<string, CourseId> = { frame: 'games104', scene: 'unity', projection: 'games101' };
    const lesson = query.get('lesson');
    if (lesson && Object.hasOwn(previousLinks, lesson)) reading.course = previousLinks[lesson];
  }
  const chapter = query.get('chapter');
  if (chapter !== null) {
    const course = courseDigests.find(course => course.id === reading.course)!;
    reading.chapters[course.id] = course.chapters.some(item => item.id === chapter) ? chapter : course.chapters[0].id;
  }
  return reading;
}
