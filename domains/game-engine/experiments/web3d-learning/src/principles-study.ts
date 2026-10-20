import './principles.css';
import { courseDigests } from './principles-data.ts';
import { restoreCourseReading } from './course-reader-model.ts';
import { chineseReadingHref } from './chinese-reading-model.ts';
import { escapeHtml as esc } from './workbench.ts';

const storageKey = 'openclasses-original-course-reading-v1';
let serialized: string | null = null;
try { serialized = localStorage.getItem(storageKey); } catch { /* Reading works without storage. */ }
const reading = restoreCourseReading(serialized, location.search);
const course = courseDigests.find(item => item.id === reading.course)!;
const index = course.chapters.findIndex(chapter => chapter.id === reading.chapters[course.id]);
const chapter = course.chapters[index];
const href = (courseId: string, chapterId: string) => `?lab=classics&course=${encodeURIComponent(courseId)}&chapter=${encodeURIComponent(chapterId)}`;
const external = 'target="_blank" rel="noopener noreferrer"';
const previous = course.chapters[index - 1];
const next = course.chapters[index + 1];
const chineseReading = chineseReadingHref(course, chapter);
document.body.classList.add('course-notes-background');
document.title = `${course.name} · ${chapter.number} ${chapter.title} | openClasses`;
const app = document.querySelector<HTMLElement>('#app')!;
app.classList.add('course-notes-page');
app.innerHTML = `
  <header class="notes-header"><a class="notes-brand" href="?lab=classics"><span>oc</span>openClasses</a><span>原课重点摘记</span></header>
  <nav class="notes-courses" aria-label="课程">${courseDigests.map(item => `<a href="${href(item.id, reading.chapters[item.id])}" ${item.id === course.id ? 'aria-current="page"' : ''}><strong>${esc(item.name)}</strong><span>${esc(item.scope)}</span></a>`).join('')}</nav>
  <section class="notes-course-intro"><div><p>${esc(course.name)}</p><h2>${esc(course.title)}</h2></div><a href="${esc(course.url)}" ${external}>官方课程目录 ↗</a></section>
  ${course.note ? `<p class="notes-course-note">${esc(course.note)}</p>` : ''}
  <div class="notes-layout">
    <aside class="notes-sidebar"><h2>原课章节 <span>${course.chapters.length} 篇</span></h2><label class="notes-chapter-picker" for="notes-chapter-select">跳转原课章节<select id="notes-chapter-select" aria-label="跳转原课章节">${course.chapters.map(item => `<option value="${esc(item.id)}" ${item.id === chapter.id ? 'selected' : ''}>${esc(item.number)} · ${esc(item.title)}</option>`).join('')}</select></label><nav aria-label="章节">${course.chapters.map(item => `<a href="${href(course.id, item.id)}" ${item.id === chapter.id ? 'aria-current="page"' : ''}><span>${esc(item.number)}</span><strong>${esc(item.title)}</strong></a>`).join('')}</nav><p>${esc(course.scope)}。摘记范围与个人学习进度分别记录。</p></aside>
    <main class="notes-content" aria-labelledby="notes-title">
      <header class="notes-chapter-header"><p>${esc(chapter.number)} <span>／ 按原课顺序提炼</span></p><h1 id="notes-title">${esc(chapter.title)}</h1><p class="notes-original-title">${esc(chapter.originalTitle)}</p><div class="notes-source-links"><a href="${esc(chapter.source)}" ${external}>${esc(chapter.sourceLabel)} ↗</a>${chineseReading ? `<a class="notes-chinese-link" href="${esc(chineseReading)}" hreflang="zh-CN" ${external}>中文阅读文档 ↗</a>` : ''}</div></header>
      ${chapter.note ? `<p class="notes-source-note">${esc(chapter.note)}</p>` : ''}
      <section aria-labelledby="notes-points-title"><h2 id="notes-points-title">本讲重点</h2><ol class="notes-points">${chapter.points.map(point => {
        const page = point.source.match(/\d+/)?.[0];
        const url = `${chapter.source}${chapter.source.endsWith('.pdf') && page ? `#page=${page}` : ''}`;
        return `<li><h3>${esc(point.title)}</h3><p>${esc(point.text)}</p><a href="${esc(url)}" ${external}>原课 ${esc(point.source)} ↗</a></li>`;
      }).join('')}</ol></section>
      <nav class="notes-pagination" aria-label="逐讲阅读">${previous ? `<a href="${href(course.id, previous.id)}">← 上一讲<span>${esc(previous.title)}</span></a>` : '<span></span>'}<span>${index + 1} / ${course.chapters.length}</span>${next ? `<a href="${href(course.id, next.id)}">下一讲 →<span>${esc(next.title)}</span></a>` : '<span>已到本课程摘记末篇</span>'}</nav>
      <footer class="notes-footer"><p>依据原课课件或官方教程精简整理。页码为 PDF 页码；Unity 使用 6.0 版本。</p><p id="notes-bookmark"></p></footer>
    </main>
  </div>`;
document.querySelector<HTMLSelectElement>('#notes-chapter-select')!.addEventListener('change', event => {
  const id = (event.currentTarget as HTMLSelectElement).value;
  if (course.chapters.some(item => item.id === id)) location.assign(href(course.id, id));
});
const chapterNav = document.querySelector<HTMLElement>('.notes-sidebar nav')!;
const activeChapter = chapterNav.querySelector<HTMLElement>('[aria-current]')!;
const positionActiveChapter = () => {
  if (chapterNav.clientHeight > 0) chapterNav.scrollTop = Math.max(0, activeChapter.offsetTop - 8);
};
positionActiveChapter();
window.addEventListener('resize', positionActiveChapter);
try {
  localStorage.setItem(storageKey, JSON.stringify(reading));
  document.getElementById('notes-bookmark')!.textContent = '已保存本机阅读位置';
} catch { document.getElementById('notes-bookmark')!.textContent = '可收藏当前网址保存阅读位置'; }
