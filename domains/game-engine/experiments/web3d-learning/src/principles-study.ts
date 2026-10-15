import './principles.css';
import { courseDigests } from './principles-data.ts';
import { restoreCourseReading } from './course-reader-model.ts';
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
document.body.classList.add('course-notes-background');
document.title = `${course.name} · ${chapter.number} ${chapter.title} | openClasses`;
const app = document.querySelector<HTMLElement>('#app')!;
app.classList.add('course-notes-page');
app.innerHTML = `
  <header class="notes-header"><a class="notes-brand" href="?lab=classics"><span>oc</span>openClasses</a><span>原课重点摘记</span></header>
  <nav class="notes-courses" aria-label="课程">${courseDigests.map(item => `<a href="${href(item.id, reading.chapters[item.id])}" ${item.id === course.id ? 'aria-current="page"' : ''}><strong>${esc(item.name)}</strong><span>${esc(item.scope)}</span></a>`).join('')}</nav>
  <section class="notes-course-intro"><div><p>${esc(course.name)}</p><h2>${esc(course.title)}</h2></div><a href="${esc(course.url)}" ${external}>官方课程目录 ↗</a></section>
  <div class="notes-layout">
    <aside class="notes-sidebar"><h2>原课章节</h2><nav aria-label="章节">${course.chapters.map(item => `<a href="${href(course.id, item.id)}" ${item.id === chapter.id ? 'aria-current="page"' : ''}><span>${esc(item.number)}</span><strong>${esc(item.title)}</strong></a>`).join('')}</nav><p>${esc(course.scope)}。后续章节请查看官方课程目录。</p></aside>
    <main class="notes-content" aria-labelledby="notes-title">
      <header class="notes-chapter-header"><p>${esc(chapter.number)} <span>／ 按原课顺序提炼</span></p><h1 id="notes-title">${esc(chapter.title)}</h1><p class="notes-original-title">${esc(chapter.originalTitle)}</p><a href="${esc(chapter.source)}" ${external}>${esc(chapter.sourceLabel)} ↗</a></header>
      ${chapter.note ? `<p class="notes-source-note">${esc(chapter.note)}</p>` : ''}
      <section aria-labelledby="notes-points-title"><h2 id="notes-points-title">本讲重点</h2><ol class="notes-points">${chapter.points.map(point => {
        const page = point.source.match(/\d+/)?.[0];
        const url = `${chapter.source}${chapter.source.endsWith('.pdf') && page ? `#page=${page}` : ''}`;
        return `<li><h3>${esc(point.title)}</h3><p>${esc(point.text)}</p><a href="${esc(url)}" ${external}>原课 ${esc(point.source)} ↗</a></li>`;
      }).join('')}</ol></section>
      <nav class="notes-pagination" aria-label="逐讲阅读">${previous ? `<a href="${href(course.id, previous.id)}">← 上一讲<span>${esc(previous.title)}</span></a>` : '<span></span>'}<span>${index + 1} / ${course.chapters.length}</span>${next ? `<a href="${href(course.id, next.id)}">下一讲 →<span>${esc(next.title)}</span></a>` : '<span>本批摘记结束</span>'}</nav>
      <footer class="notes-footer"><p>依据原课课件或官方教程精简整理。页码为 PDF 页码；Unity 使用 6.0 版本。</p><p id="notes-bookmark"></p></footer>
    </main>
  </div>`;
try {
  localStorage.setItem(storageKey, JSON.stringify(reading));
  document.getElementById('notes-bookmark')!.textContent = '已保存本机阅读位置';
} catch { document.getElementById('notes-bookmark')!.textContent = '可收藏当前网址保存阅读位置'; }
