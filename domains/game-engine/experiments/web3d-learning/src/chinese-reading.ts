import './chinese-reading.css';
import './practice.css';
import { practiceLinks } from './practice-links.ts';
import { escapeHtml as esc } from './workbench.ts';
import { findChineseReadingTarget, parseChineseReadingDocument } from './chinese-reading-model.ts';
import type { ChineseReadingComparison } from './chinese-reading-model.ts';

const comparisonHtml = (comparison: ChineseReadingComparison | undefined) => comparison
  ? `<figure class="reading-comparison"><figcaption>${esc(comparison.title)}</figcaption>${comparison.rows.map(row => `<div class="reading-flow-row"><p class="reading-flow-label">${esc(row.label)}</p><ol class="reading-flow-steps" aria-label="${esc(row.label)}">${row.steps.map((step, index) => `<li>${index ? '<span class="reading-flow-arrow" aria-hidden="true"></span>' : ''}<span class="reading-flow-step">${esc(step)}</span></li>`).join('')}</ol><p class="reading-flow-result">${esc(row.result)}</p></div>`).join('')}<p class="reading-flow-caption">${esc(comparison.caption)}</p></figure>` : '';

const app = document.querySelector<HTMLElement>('#app')!;
document.body.classList.add('chinese-reading-background');
app.classList.add('chinese-reading-page');
const target = findChineseReadingTarget(location.search);
const back = target ? `?lab=classics&course=${encodeURIComponent(target.course.id)}&chapter=${encodeURIComponent(target.chapter.id)}` : '?lab=classics';
const header = `<header class="reading-toolbar"><a href="${back}">← 返回课程摘记</a><span>中文阅读文档</span></header>`;
app.innerHTML = `${header}<main class="reading-document"><p role="status">正在打开中文内容…</p></main>`;

try {
  if (!target) throw new Error('未找到对应课程');
  const { course, chapter } = target;
  const url = new URL(`translations/${course.id}/${encodeURIComponent(chapter.id)}.json`, document.baseURI);
  const response = await fetch(url);
  if (!response.ok) throw new Error('文档暂不可用');
  const documentData = parseChineseReadingDocument(await response.json(), course, chapter);
  document.title = `${documentData.title} · 中文阅读 | openClasses`;
  const anchors = new Set<string>();
  const sections = documentData.sections.map(section => {
    const sourceAnchors = [
      ...(section.sourcePages ?? []).map(page => `page-${page}`),
      ...(section.sourceSections ?? []).map(index => `section-${index}`),
    ].filter(anchor => {
      if (anchors.has(anchor)) return false;
      anchors.add(anchor);
      return true;
    });
    const source = chapter.source.endsWith('.pdf') && section.sourcePages?.length
      ? `${chapter.source}#page=${section.sourcePages[0]}` : chapter.source;
    return `<section class="reading-section" id="${esc(section.id)}">${sourceAnchors.map(anchor => `<span class="reading-anchor" id="${anchor}"></span>`).join('')}<h2>${esc(section.title)}</h2><a class="reading-source" href="${esc(source)}" target="_blank" rel="noopener noreferrer">${esc(section.sourceLabel)} ↗</a>${section.paragraphs.map(paragraph => `<p>${esc(paragraph)}</p>`).join('')}${comparisonHtml(section.comparison)}${practiceLinks(course.id, chapter.id, 'chinese-reading', section.id)}</section>`;
  }).join('');
  app.innerHTML = `${header}<main class="reading-document"><header class="reading-heading"><p>${esc(course.name)} · ${esc(chapter.number)}</p><h1>${esc(documentData.title)}</h1><p class="reading-kind">原课重点 · 中文提炼</p><details class="reading-scope"><summary>内容与来源说明</summary><p>${esc(documentData.scope)}</p></details><a class="reading-original" href="${esc(chapter.source)}" target="_blank" rel="noopener noreferrer">对照原始资料 ↗</a></header><details class="reading-outline"><summary>本篇目录 · ${documentData.sections.length} 节</summary><nav aria-label="中文文档目录">${documentData.sections.map(section => `<a href="#${esc(section.id)}">${esc(section.title)}</a>`).join('')}</nav></details>${sections}<footer class="reading-footer"><a href="${back}">← 返回 ${esc(chapter.number)} 的课程摘记</a></footer></main>`;
  if (/^#(?:page-\d+|section-\d+|[a-z][a-z0-9-]*)$/.test(location.hash)) {
    document.getElementById(location.hash.slice(1))?.scrollIntoView();
  }
} catch {
  document.title = '中文文档暂不可用 | openClasses';
  app.innerHTML = `${header}<main class="reading-document"><h1>中文文档暂不可用</h1><p>请返回课程检查章节，或稍后重新打开。</p><a href="${back}">返回课程摘记</a></main>`;
}
