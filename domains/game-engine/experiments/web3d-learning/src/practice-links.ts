import { practicesForChapter, practiceHref } from './practice-catalogue.ts';
import { escapeHtml } from './workbench.ts';

export function practiceLinks(course: string, chapter: string, from: 'classics' | 'chinese-reading', section?: string): string {
  const items = practicesForChapter(course, chapter, section);
  if (!items.length) return '';
  return `<nav class="practice-entry" aria-label="本课代码实践">${items.map(item => {
    const ref = item.sources.find(source => source.course === course && source.chapter === chapter)!;
    const href = practiceHref(item.id, from, course, chapter, section ?? ref.sectionIds[0]);
    return `<a href="${escapeHtml(href)}">代码实践 ${item.id} · ${escapeHtml(item.title)} →</a>`;
  }).join('')}</nav>`;
}
