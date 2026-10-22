import './practice.css';
import { escapeHtml as esc } from './workbench.ts';
import { practiceCoverage, practiceDefinitions, practiceHref, practiceStatistics } from './practice-catalogue.ts';
import { parsePracticeContext, practiceDraftKey, restorePracticeDraft, serializePracticeDraft } from './practice-model.ts';
import { copyPlainData, comparePracticeValues, PracticeError, PracticeRunner, wrapPracticeBody } from './practice-runtime.ts';
import type { PracticeRecord, PracticeRunResult, PracticeValue } from './practice-types.ts';

const app = document.querySelector<HTMLElement>('#app')!;
document.body.classList.add('practice-background');
app.classList.add('practice-page');
const context = parsePracticeContext(location.search, practiceDefinitions);
const json = (value: unknown) => JSON.stringify(value, null, 2);
const fmt = (n: number) => Number.isFinite(n) ? Number(n.toPrecision(5)).toString() : '超出显示范围';
const object = (value: PracticeValue): PracticeRecord => value as PracticeRecord;
const numberArray = (value: PracticeValue) => value as number[];

if (!context) {
  document.title = '练习尚未就绪 | openClasses';
  app.innerHTML = '<main class="practice-card"><h1>这个练习尚未就绪</h1><p>首批开放 02、04、09、31。</p><a href="?lab=practice&experiment=02">进入变换练习</a> · <a href="?lab=classics">返回原课</a></main>';
} else {
  const { definition, source, backHref } = context;
  let taskIndex = 0;
  let task = definition.tasks[taskIndex];
  let currentCase = task.cases[0];
  let result: PracticeRunResult | null = null;
  let expected: PracticeValue | null = null;
  let runInput: PracticeRecord = currentCase.input;
  let runParams: PracticeRecord = currentCase.params;
  let cursor = 0;
  let generation = 0;
  let playing: number | undefined;
  let saveTimer: number | undefined;
  let undoCode: string | null = null;
  let savingAllowed = true;
  const runner = new PracticeRunner();
  document.title = `${definition.id} ${definition.title} · 代码实践 | openClasses`;
  const sourceLinks = definition.sources.map(ref => `<a href="?lab=chinese-reading&course=${ref.course}&chapter=${encodeURIComponent(ref.chapter)}#${ref.sectionIds[0]}">${esc(ref.label)} ↗</a>`).join('');
  app.innerHTML = `
    <header class="practice-header"><a href="${esc(backHref)}">← 返回${context.from === 'classics' ? '课程摘记' : '原课中文阅读'}</a><span>openClasses / 代码实践</span></header>
    <nav class="practice-tabs" aria-label="可用实验">${practiceDefinitions.map(def => `<a href="${esc(practiceHref(def.id, 'chinese-reading', def.sources[0].course, def.sources[0].chapter, def.sources[0].sectionIds[0]))}" ${def.id === definition.id ? 'aria-current="page"' : ''}><span>${def.id}</span>${esc(def.title)}</a>`).join('')}</nav>
    <section class="practice-intro"><p class="eyebrow">${esc(source.label)} · 实践 ${definition.id}</p><h1>${esc(definition.title)}</h1><p>${esc(definition.summary)}</p><div class="practice-sources">${sourceLinks}</div></section>
    <p class="practice-small">可运行：${practiceStatistics.runnableExperiments} 个实验／${practiceStatistics.runnableTasks} 个任务 · 知识映射：${practiceStatistics.mappedSourceSections} 个原课小节中的指定机制 · 个人理解：单独记录，未自动评定</p>
    <div class="practice-path" aria-label="学习方式"><span>01 修改核心规则</span><b>→</b><span>02 运行看差异</span><b>→</b><span>03 换条件验证</span><b>→</b><span>04 解释原因与范围</span></div>
    <section class="practice-card practice-task"><label>任务<select id="practice-task" aria-label="选择实践任务">${definition.tasks.map((item, i) => `<option value="${i}">${i + 1}. ${esc(item.title)}</option>`).join('')}</select></label><p id="practice-question"></p><details><summary>思路与已提供的工具</summary><ol id="practice-pseudocode"></ol><p id="practice-contract"></p><pre id="practice-helper"></pre></details></section>
    <div class="practice-workspace">
      <section class="practice-card practice-editor"><header><h2>修改规则</h2><span>同步 JavaScript · 函数正文</span></header><p class="practice-signature">solve(input, params, api) {</p><textarea id="practice-code" aria-label="学习者代码" spellcheck="false" autocapitalize="off" autocomplete="off"></textarea><p class="practice-signature">}</p><p id="practice-save" role="status"></p><div class="practice-buttons"><button id="practice-run" class="primary">运行当前条件</button><button id="practice-cancel" disabled>取消运行</button><button id="practice-all">检查全部变式</button></div><div class="practice-buttons practice-secondary"><button id="practice-reset">重置场景</button><button id="practice-starter">恢复初始代码</button><button id="practice-undo" disabled>撤销恢复</button></div><details class="practice-answer"><summary>参考实现与原因（按需查看）</summary><p id="practice-explanation"></p><pre id="practice-solution"></pre><button id="practice-use-solution">将参考实现放入编辑区</button><p>替换后不会自动运行，也不会登记为已经掌握。</p></details></section>
      <section class="practice-card practice-results"><header><h2>运行与对照</h2><span>画面来自你的返回值</span></header><label>输入条件<select id="practice-case" aria-label="选择输入条件"></select></label><details class="practice-input"><summary>固定输入与可修改参数</summary><label>参数 JSON<textarea id="practice-params" aria-label="实验参数" spellcheck="false"></textarea></label><p>输入时间线与事件由平台给定；参数仅在点击运行后生效。</p><pre id="practice-input"></pre></details><p id="practice-status" class="practice-status" role="status" aria-live="polite">尚未运行。先读任务，修改代码后运行。</p><p id="practice-displayed-case" class="practice-small"></p><div id="practice-visual" class="practice-visual"><p>运行后在这里查看你的结果。</p></div><div class="practice-playback"><button id="practice-play" disabled>播放记录</button><button id="practice-step" disabled>单步</button><label>回放位置<input id="practice-cursor" aria-label="回放位置" type="range" min="0" max="0" value="0" disabled></label><span id="practice-step-label">没有记录</span></div><p class="practice-small">播放／暂停只回放已生成的数据，不重新执行代码，也不改变模拟时间。</p><details><summary>你的输出与中间记录</summary><pre id="practice-output">尚无结果</pre><pre id="practice-trace"></pre></details><details><summary>独立基准与比较规则</summary><p>连续数值使用任务容差（${task.tolerance ?? 1e-8}），离散状态精确比较。基准与学习者代码分离；基准异常会单独报告。</p><pre id="practice-expected">运行成功后显示基准；图示始终使用你的输出。</pre></details></section>
    </div>
    <section class="practice-card practice-reflect"><h2>换条件后，说清发生了什么</h2><p id="practice-variation"></p><label>给自己留一句解释（可选）<textarea id="practice-understanding" aria-label="个人理解" placeholder="我修改了什么？为什么有效？在哪些条件下成立？"></textarea></label><p id="practice-understanding-status" class="practice-small">个人理解独立记录；运行通过不会自动标记掌握。</p></section>
    <details class="practice-card practice-boundary"><summary>本实验的范围与运行约定</summary><ul>${definition.limitations.map(text => `<li>${esc(text)}</li>`).join('')}</ul><p>每次运行使用新的执行线程、固定输入快照，3 秒超时；更改代码或条件会取消旧运行。最多记录 1000 条，输出与记录合计上限 1 MiB。适用于本机自行编辑的练习，Worker 不等于任意陌生脚本的安全沙箱。</p></details>
    <details class="practice-card practice-catalogue"><summary>全量实践清单 · 4 / 60 可运行 · 知识覆盖与个人理解分别记录</summary><p>首批只覆盖所列原课小节中的指定任务。其余条目为开发计划，宽主题将分任务验收；所有可运行实验通过也不代表整门课程已经掌握。</p><div>${practiceCoverage.map(item => `<article><span>${item.id} · ${esc(item.group)}</span><h3>${esc(item.title)}</h3><p>${item.status === 'ready' ? '已就绪' : '计划中'} · ${esc(item.tasks.join('；'))}</p><small>${esc(item.computation)}。${esc(item.limitation)}</small></article>`).join('')}</div></details>
    <footer>原课 → 短代码实践 → 结果与变式 → 返回原课。Unity 可作为后续真实引擎对照环境。</footer>`;
  const get = <T extends HTMLElement>(id: string) => document.getElementById(`practice-${id}`)! as T;
  const code = get<HTMLTextAreaElement>('code');
  const params = get<HTMLTextAreaElement>('params');
  const caseSelect = get<HTMLSelectElement>('case');
  const status = (message: string, kind = 'neutral') => { get('status').textContent = message; get('status').dataset.kind = kind; };
  const stopPlayback = () => { window.clearInterval(playing); playing = undefined; get('play').textContent = '播放记录'; };
  const clearResult = () => {
    result = null; expected = null; cursor = 0; stopPlayback();
    get('visual').innerHTML = '<p>运行后在这里查看你的结果。</p>';
    get('output').textContent = '尚无结果'; get('trace').textContent = ''; get('displayed-case').textContent = '';
    get('expected').textContent = '尚无基准对照';
    for (const id of ['play', 'step', 'cursor']) get<HTMLButtonElement>(id).disabled = true;
    get('step-label').textContent = '没有记录';
  };
  const invalidate = () => {
    generation++; runner.cancel(); clearResult();
    get<HTMLButtonElement>('cancel').disabled = true;
    get<HTMLButtonElement>('run').disabled = false;
    get<HTMLButtonElement>('all').disabled = false;
  };
  const collectDraft = (strict = true) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(params.value);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('参数需要 JSON 对象');
      parsed = copyPlainData(parsed);
    } catch (error) { if (strict) throw error; parsed = currentCase.params; }
    return { experimentId: definition.id, taskId: task.id, version: definition.version, caseId: currentCase.id,
      code: code.value, input: currentCase.input, params: parsed as PracticeRecord, paramsText: params.value };
  };
  const save = () => {
    window.clearTimeout(saveTimer);
    if (!savingAllowed) { get('save').textContent = '原草稿无法读取，已保留且不覆盖；本次编辑未保存。'; return; }
    try {
      localStorage.setItem(practiceDraftKey(definition.id, task.id, definition.version), serializePracticeDraft(collectDraft(false)));
      let valid = true;
      try { collectDraft(); } catch { valid = false; }
      get('save').textContent = valid ? '本机草稿已保存 · 不含回放记录' : '代码与未完成的参数文本已保存；参数修正前无法运行。';
    } catch { get('save').textContent = '草稿未保存：存储不可用或参数 JSON 无效；仍可继续练习。'; }
  };
  const scheduleSave = () => { if (!savingAllowed) { save(); return; } get('save').textContent = '正在保存草稿…'; window.clearTimeout(saveTimer); saveTimer = window.setTimeout(save, 300); };
  const showCase = () => {
    caseSelect.value = currentCase.id; params.value = json(currentCase.params);
    get('input').textContent = json(currentCase.input);
  };
  const loadTask = () => {
    task = definition.tasks[taskIndex]; currentCase = task.cases[0];
    code.value = task.starterCode;
    caseSelect.innerHTML = task.cases.map(item => `<option value="${esc(item.id)}">${esc(item.label)}</option>`).join('');
    showCase(); undoCode = null; get<HTMLButtonElement>('undo').disabled = true; savingAllowed = true;
    get('question').textContent = task.question;
    get('pseudocode').innerHTML = task.pseudocode.map(text => `<li>${esc(text)}</li>`).join('');
    get('contract').textContent = 'input 为固定输入，params 为所选参数。api.trace(名称, 普通数据) 保存中间快照，api.clone(数据) 复制普通数据。必须同步 return 任务规定的对象。';
    get('helper').textContent = task.helperSource ?? '本题不需要额外工具；只使用普通 JavaScript 数组、数字与对象。';
    get('solution').textContent = task.solutionCode; get('explanation').textContent = task.explanation;
    get('variation').textContent = task.variation;
    get('save').textContent = '从初始代码开始；运行不会自动保存为“掌握”。';
    try {
      const key = practiceDraftKey(definition.id, task.id, definition.version);
      const serialized = localStorage.getItem(key);
      const draft = restorePracticeDraft(serialized, definition, task);
      if (draft && draft.version === definition.version) {
        currentCase = task.cases.find(item => item.id === draft.caseId)!;
        showCase(); code.value = draft.code; params.value = draft.paramsText ?? json(draft.params);
        get('save').textContent = '已恢复本机草稿；尚未运行。';
      } else if (serialized) {
        savingAllowed = false; get('save').textContent = '该草稿无法读取，原数据已保留；本次编辑暂不覆盖它。';
      } else {
        const prefix = key.replace(/:v\d+$/, ':v');
        if (Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i)).some(item => item?.startsWith(prefix) && item !== key && /:v\d+$/.test(item)))
          get('save').textContent = '检测到其他模板版本的草稿，已原样保留；当前使用新版初始代码。';
      }
    } catch { get('save').textContent = '本机存储不可用；可练习，但草稿未保存。'; }
    const understandingKey = `${practiceDraftKey(definition.id, task.id, definition.version)}:understanding`;
    try { get<HTMLTextAreaElement>('understanding').value = localStorage.getItem(understandingKey) ?? ''; }
    catch { get<HTMLTextAreaElement>('understanding').value = ''; }
    clearResult(); status('尚未运行。先读任务，修改代码后运行。');
  };
  const stepCount = () => {
    if (!result) return 0;
    const output = object(result.output);
    const values = output.states ?? output.positions ?? output.coverage ?? output.points;
    return Array.isArray(values) ? values.length : 1;
  };
  const svg = (body: string, title: string) => `<svg viewBox="0 0 600 300" role="img" aria-label="${esc(title)}">${body}</svg>`;
  const display = () => {
    if (!result) return;
    const output = object(result.output), count = stepCount();
    cursor = Math.max(0, Math.min(cursor, count - 1));
    const slider = get<HTMLInputElement>('cursor'); slider.max = String(count - 1); slider.value = String(cursor);
    get('step-label').textContent = `${cursor + 1} / ${count}`;
    let html = '';
    if (definition.renderer === 'transform') {
      const points = output.points as number[][], original = runInput.points as number[][];
      const max = Math.max(1, ...points.flatMap(p => p.slice(0, 2).map(Math.abs)), ...original.flatMap(p => p.slice(0, 2).map(Math.abs)));
      const scale = 110 / max;
      html = svg(`<path d="M20 150H580M300 20V280" stroke="#c8d9db"/>${original.map((p, i) => `<circle cx="${300 + p[0] * scale}" cy="${150 - p[1] * scale}" r="5" fill="#b8c9cf"/><line x1="${300 + p[0] * scale}" y1="${150 - p[1] * scale}" x2="${300 + points[i][0] * scale}" y2="${150 - points[i][1] * scale}" stroke="#b8c9cf" stroke-dasharray="4 4"/>`).join('')}${points.map((p, i) => `<circle cx="${300 + p[0] * scale}" cy="${150 - p[1] * scale}" r="${i === cursor ? 9 : 5}" fill="${p[2] === 0 ? '#c17536' : '#20846c'}"/><text x="${306 + p[0] * scale}" y="${140 - p[1] * scale}" font-size="13">${i + 1}${p[2] === 0 ? ' 方向' : ''}</text>`).join('')}`, '灰色输入坐标，绿色输出点，橙色输出方向分量') + `<p>灰色：输入 · 绿色：点 · 橙色：方向分量（w=0）</p><p>第${cursor + 1}项：${esc(points[cursor].map(fmt).join(', '))}</p>`;
    } else if (definition.renderer === 'time') {
      const positions = numberArray(output.positions), times = numberArray(output.times);
      const dts = numberArray(runInput.dts);
      const elapsed = [0]; for (const dt of dts) elapsed.push(elapsed[elapsed.length - 1] + dt);
      const tMax = Math.max(1, ...elapsed.map(Math.abs)), pMax = Math.max(1, ...positions.map(Math.abs));
      const x = (i: number) => 40 + (elapsed[i] / tMax) * 510;
      const y = (i: number) => 150 - (positions[i] / pMax) * 115;
      html = svg(`<path d="M40 15V265H570M40 150H570" stroke="#c8d9db" fill="none"/><polyline points="${positions.slice(0, cursor + 1).map((_, i) => `${x(i)},${y(i)}`).join(' ')}" fill="none" stroke="#20846c" stroke-width="3"/><circle cx="${x(cursor)}" cy="${y(cursor)}" r="7" fill="#c17536"/><text x="360" y="290" font-size="13">输入经过时间 / 秒</text>`, '输入经过时间和位置；暂停形成平台段') + `<p>输入经过 ${fmt(elapsed[cursor])} 秒 · 有效模拟时间 <strong>${fmt(times[cursor])} 秒</strong> · 位置 <strong>${fmt(positions[cursor])}</strong></p><p>第${cursor}步${cursor ? ` · dt=${fmt(dts[cursor - 1])} · 暂停=${String((runInput.paused as boolean[])[cursor - 1])}` : ' · 初始状态'}。暂停步保留输入时间，不推进有效模拟。</p>`;
    } else if (definition.renderer === 'sampling') {
      const coverage = numberArray(output.coverage), hits = numberArray(output.hits), sampleX = output.sampleX as number[][];
      const left = Number(runInput.left) + Number(runParams.offset), right = Number(runInput.right) + Number(runParams.offset);
      const area = coverage.map((_, i) => Math.max(0, Math.min(i + 1, right) - Math.max(i, left)));
      const scale = 520 / coverage.length;
      html = svg(`<rect x="40" y="40" width="520" height="50" fill="#edf2f3"/><rect x="${40 + Math.max(0, Math.min(coverage.length, left)) * scale}" y="40" width="${Math.max(0, Math.min(coverage.length, right) - Math.max(0, left)) * scale}" height="50" fill="#20846c"/>${coverage.map((v, i) => `<rect x="${40 + i * scale}" y="120" width="${scale}" height="65" fill="#20846c" fill-opacity="${v}" stroke="${cursor === i ? '#c17536' : '#b8c9cf'}" stroke-width="2"/>${sampleX[i].map(point => `<circle cx="${40 + point * scale}" cy="65" r="3" fill="#b3682e"/>`).join('')}<text x="${45 + i * scale}" y="215" font-size="13">像素${i}</text><text x="${45 + i * scale}" y="240" font-size="13">${fmt(v)}</text>`).join('')}`, '上方解析窄带与真实采样点，下方你的采样覆盖') + `<p>像素${cursor} · 命中 ${hits[cursor]} / ${sampleX[cursor].length} · 采样 ${fmt(coverage[cursor])} · 解析 ${fmt(area[cursor])}</p><p>橙点来自你的 sampleX；下方颜色来自你的 coverage。解析面积单独计算，有限采样不要求等于面积。</p>`;
    } else {
      const states = output.states as PracticeRecord[], state = states[cursor];
      const events = runInput.events as PracticeRecord[];
      const phase = { title: '标题', playing: '游玩', ended: '结束' }[String(state.phase)] ?? String(state.phase);
      html = `<div class="practice-game-flow">${['title', 'playing', 'ended'].map((name, i) => `<span ${state.phase === name ? 'aria-current="step"' : ''}>${['标题', '游玩', '结束'][i]}</span>${i < 2 ? '<b>→</b>' : ''}`).join('')}</div><div class="practice-game-metrics"><div><span>当前阶段</span><strong>${esc(phase)}</strong></div><div><span>分数</span><strong>${esc(String(state.score))}</strong></div><div><span>活动目标</span><strong>${esc(String(state.targets))}</strong></div><div><span>待执行生成</span><strong>${esc(String(state.pending))}</strong></div></div><p>步骤 ${esc(String(state.step))} · 输入时刻 ${esc(String(events[cursor].at))} · ${esc(String(state.event))} · 事件 ${esc(String(state.id))}</p><p>局次 ${esc(String(state.session))} · ${state.phase === 'title' ? '上局／初始间隔（当前未运行）' : '生成间隔'} ${esc(String(state.interval))} 秒</p><pre>${esc(json(state))}</pre><details><summary>逐事件状态表（你的结果）</summary><div class="practice-table-scroll"><table><thead><tr><th>步骤／时刻</th><th>事件</th><th>阶段</th><th>分数</th><th>目标／调度</th></tr></thead><tbody>${states.map((row, i) => `<tr ${i === cursor ? 'aria-current="step"' : ''}><td>${i + 1} / ${esc(String(events[i].at))}</td><td>${esc(String(row.id))}</td><td>${esc(String(row.phase))}</td><td>${esc(String(row.score))}</td><td>${esc(String(row.targets))} / ${esc(String(row.pending))}</td></tr>`).join('')}</tbody></table></div></details><p>同一时刻按输入数组顺序处理；重玩应回标题、清除目标与旧调度。</p>`;
    }
    get('visual').innerHTML = html;
  };
  const showResult = (value: PracticeRunResult, reference: PracticeValue, input: PracticeRecord, parameters: PracticeRecord) => {
    result = value; expected = reference; runInput = input; runParams = parameters; cursor = stepCount() - 1;
    get('output').textContent = json(result.output); get('trace').textContent = json(result.trace);
    get('expected').textContent = json(expected);
    for (const id of ['play', 'step', 'cursor']) get<HTMLButtonElement>(id).disabled = false;
    display();
  };
  const run = async (all: boolean) => {
    invalidate(); const token = generation;
    let draft;
    try { draft = collectDraft(); } catch (error) { status(`参数无效：${error instanceof Error ? error.message : String(error)}`, 'error'); return; }
    save();
    get<HTMLButtonElement>('run').disabled = true; get<HTMLButtonElement>('all').disabled = true; get<HTMLButtonElement>('cancel').disabled = false;
    const cases = all ? task.cases : [{ ...currentCase, params: draft.params }];
    let passed = 0;
    try {
      for (const item of cases) {
        if (token !== generation) return;
        status(`正在运行 ${item.label}${all ? `（${passed + 1}/${cases.length}）` : ''}…`);
        const input = copyPlainData(item.input) as PracticeRecord, parameters = copyPlainData(item.params) as PracticeRecord;
        let reference: PracticeValue;
        try { reference = copyPlainData(task.reference(copyPlainData(input) as PracticeRecord, copyPlainData(parameters) as PracticeRecord)); task.validateOutput(reference, copyPlainData(input) as PracticeRecord); }
        catch (error) { throw new Error(`独立基准失败：${error instanceof Error ? error.message : String(error)}`); }
        const value = await runner.run({ code: wrapPracticeBody(draft.code), helperSource: task.helperSource, input, params: parameters });
        if (token !== generation) return;
        try { task.validateOutput(value.output, input); }
        catch (error) { throw new PracticeError('invalid', error instanceof Error ? error.message : String(error)); }
        const comparison = comparePracticeValues(reference, value.output, task.tolerance);
        showResult(value, reference, input, parameters);
        get('displayed-case').textContent = `本次显示：${item.label}${all ? '（全部变式验证中的实际案例；上方选择器保留你的练习条件）' : ''}。参数快照：${JSON.stringify(parameters)}`;
        if (!comparison.equal) { status(`${item.label}：存在差异。${comparison.message}`, 'difference'); return; }
        passed++;
      }
      status(all ? `全部 ${passed} 个固定变式通过。运行通过与个人理解分别记录。` : '当前条件通过。再换一个条件，验证你的解释。', 'success');
    } catch (error) {
      if (token !== generation) return;
      clearResult();
      const labels: Record<string, string> = { compile: '代码语法错误', runtime: '运行异常', timeout: '运行超过3秒，已终止', cancelled: '已取消', invalid: '返回值无效', limit: '输出或记录超限', worker: '执行线程失败', messageerror: '结果传输失败' };
      status(error instanceof PracticeError ? `${labels[error.code] ?? '运行失败'}：${error.message}` : String(error instanceof Error ? error.message : error), 'error');
    } finally {
      if (token === generation) { get<HTMLButtonElement>('run').disabled = false; get<HTMLButtonElement>('all').disabled = false; get<HTMLButtonElement>('cancel').disabled = true; }
    }
  };
  get('run').addEventListener('click', () => void run(false));
  get('all').addEventListener('click', () => void run(true));
  get('cancel').addEventListener('click', () => { invalidate(); status('已取消运行。可以修改后再次运行。'); });
  code.addEventListener('input', () => { invalidate(); status('代码已修改；请重新运行。'); scheduleSave(); });
  code.addEventListener('keydown', event => {
    if (event.key === 'Tab') { event.preventDefault(); code.setRangeText('  ', code.selectionStart, code.selectionEnd, 'end'); code.dispatchEvent(new Event('input')); }
  });
  params.addEventListener('input', () => { invalidate(); status('参数已修改；请重新运行。'); scheduleSave(); });
  caseSelect.addEventListener('change', () => { invalidate(); currentCase = task.cases.find(item => item.id === caseSelect.value)!; showCase(); status('条件已切换；代码保留。请重新运行。'); scheduleSave(); });
  get('task').addEventListener('change', event => { save(); invalidate(); taskIndex = Number((event.target as HTMLSelectElement).value); loadTask(); });
  get('reset').addEventListener('click', () => { invalidate(); currentCase = task.cases[0]; showCase(); status('场景与条件已重置；代码保留。'); scheduleSave(); });
  const replaceCode = (value: string) => { invalidate(); undoCode = code.value; code.value = value; get<HTMLButtonElement>('undo').disabled = false; scheduleSave(); status('代码已替换；可撤销，尚未运行。'); };
  get('starter').addEventListener('click', () => replaceCode(task.starterCode));
  get('use-solution').addEventListener('click', () => replaceCode(task.solutionCode));
  get('undo').addEventListener('click', () => { if (undoCode !== null) { invalidate(); code.value = undoCode; undoCode = null; get<HTMLButtonElement>('undo').disabled = true; scheduleSave(); status('已撤销代码替换；请重新运行。'); } });
  get('play').addEventListener('click', () => {
    if (playing !== undefined) { stopPlayback(); return; }
    if (cursor >= stepCount() - 1) cursor = 0;
    display(); get('play').textContent = '暂停回放';
    playing = window.setInterval(() => { cursor++; display(); if (cursor >= stepCount() - 1) stopPlayback(); }, 350);
  });
  get('step').addEventListener('click', () => { stopPlayback(); cursor = (cursor + 1) % stepCount(); display(); });
  get('cursor').addEventListener('input', event => { stopPlayback(); cursor = Number((event.target as HTMLInputElement).value); display(); });
  get('understanding').addEventListener('input', () => {
    try { localStorage.setItem(`${practiceDraftKey(definition.id, task.id, definition.version)}:understanding`, get<HTMLTextAreaElement>('understanding').value); get('understanding-status').textContent = '个人解释已单独保存；没有自动评定掌握程度。'; }
    catch { get('understanding-status').textContent = '个人解释未保存：本机存储不可用。'; }
  });
  window.addEventListener('pagehide', () => { save(); invalidate(); });
  loadTask();
}
