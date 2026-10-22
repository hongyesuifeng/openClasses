import { readFileSync, writeFileSync } from 'node:fs';
import { practiceCoverage, practiceDefinitions } from '../src/practice-catalogue.ts';

const rows = practiceCoverage.map(item => {
  const locators = item.sources.flatMap(source => {
    const document = JSON.parse(readFileSync(new URL(`../public/translations/${source.course}/${source.chapter}.json`, import.meta.url), 'utf8'));
    return source.sectionIds.map(id => {
      const section = document.sections.find((entry: { id: string }) => entry.id === id);
      if (!section) throw new Error(`Unknown source: ${source.course}/${source.chapter}#${id}`);
      const original = document.source.endsWith('.pdf') && section.sourcePages?.length ? `${document.source}#page=${section.sourcePages[0]}` : document.source;
      return { course: source.course, chapter: source.chapter, section: id, title: section.title, sourceLabel: section.sourceLabel,
        sourcePages: section.sourcePages ?? [], sourceSections: section.sourceSections ?? [], original };
    });
  });
  return { ...item, locators, readyTaskIds: practiceDefinitions.find(definition => definition.id === item.id)?.tasks.map(task => task.id) ?? [], understanding: '未评定（不能由运行通过推断）' };
});
writeFileSync(new URL('../docs/practice-coverage.json', import.meta.url), JSON.stringify({ schema: 1, scope: '60个实践方向中的机制映射；并非全部原课内容的覆盖证明', runnableExperiments: practiceDefinitions.length,
  runnableTasks: practiceDefinitions.reduce((sum, item) => sum + item.tasks.length, 0), rows }, null, 2) + '\n');
const table = rows.map(item => `| ${item.id} | ${item.title} | ${item.status === 'ready' ? '可运行' : '计划中'} | ${item.tasks.join('；')} | ${item.locators.map(ref => `[${ref.course}/${ref.chapter} ${ref.title} · ${ref.sourceLabel}](${ref.original})`).join('<br>')} | ${item.computation}；${item.limitation} |`).join('\n');
writeFileSync(new URL('../docs/practice-coverage.md', import.meta.url), `# 核心知识实践覆盖清单\n\n首批 ${practiceDefinitions.length}/60 个实验、${practiceDefinitions.reduce((sum, item) => sum + item.tasks.length, 0)} 个独立任务可运行。其余仅登记，不显示空运行入口。可运行数量、知识范围与个人理解分别记录；表内“可运行”只表示指定任务就绪，不代表整讲、整课程或个人掌握。\n\n原课按原章节阅读；此表是旁挂实践的机制索引，不另编课程主线。详尽页码／原小节、就绪任务 ID 与限制见 [机器可查清单](practice-coverage.json)。\n\n| ID | 知识方向 | 状态 | 关联任务 | 可定位原课出处 | 计算方式与局限 |\n| --- | --- | --- | --- | --- | --- |\n${table}\n\n来源：仓库已核对的中文阅读文档及其原始出处。更新入口为 src/practice-catalogue.ts；修改后用 tools/build-practice-coverage.ts 重建此表与 JSON，并运行来源检查。个人理解保持未评定，不由系统自动更新。\n`);
