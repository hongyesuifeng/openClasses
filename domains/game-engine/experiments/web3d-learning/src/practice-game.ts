import type { PracticeCase, PracticeDefinition, PracticeRecord, PracticeValue } from './practice-types.ts';

type Phase = 'title' | 'playing' | 'ended';
type ExpectedRow = readonly [Phase, number, number, number, readonly string[], readonly string[]];
interface GameFixture {
  practiceCase: PracticeCase;
  rows: readonly ExpectedRow[];
}

const action = (id: string, type: string, data: PracticeRecord = {}): PracticeRecord => ({ id, type, ...data });
const queue = (id: string, ticket: string, target: string, pointValue: number, good: boolean, session = 1): PracticeRecord =>
  action(id, 'schedule', { session, ticket, target: { id: target, pointValue, good } });
const fire = (id: string, ticket: string, session = 1): PracticeRecord => action(id, 'spawn', { session, ticket });
const targetEvent = (id: string, type: 'click' | 'miss', targetId: string, session = 1): PracticeRecord =>
  action(id, type, { session, targetId });

function fixture(id: string, label: string, baseInterval: number, steps: readonly (readonly [PracticeRecord, ExpectedRow])[]): GameFixture {
  return {
    practiceCase: {
      id, label,
      input: { scenario: id, events: steps.map(([event], i) => ({ step: i + 1, at: i, ...event })) },
      params: { baseInterval },
    },
    rows: steps.map(([, expected]) => expected),
  };
}

// These rows are an independent event specification, not a replay of the learner scaffold.
// Row: phase, score, session, interval, live target IDs, outstanding spawn tickets.
const fixtures: readonly GameFixture[] = [
  fixture('flow-and-score', '标题门禁、正负计分与漏接结果', 6, [
    [queue('title-queue', 'pre', 'pre', 50, true, 0), ['title', 0, 0, 6, [], []]],
    [targetEvent('title-click', 'click', 'pre', 0), ['title', 0, 0, 6, [], []]],
    [action('start-medium', 'start', { difficulty: 2 }), ['playing', 0, 1, 3, [], []]],
    [action('ignore-second-start', 'start', { difficulty: 3 }), ['playing', 0, 1, 3, [], []]],
    [action('ignore-playing-restart', 'restart'), ['playing', 0, 1, 3, [], []]],
    [queue('queue-apple', 'a', 'apple', 10, true), ['playing', 0, 1, 3, [], ['a']]],
    [fire('spawn-apple', 'a'), ['playing', 0, 1, 3, ['apple'], []]],
    [targetEvent('click-apple', 'click', 'apple'), ['playing', 10, 1, 3, [], []]],
    [targetEvent('duplicate-click', 'click', 'apple'), ['playing', 10, 1, 3, [], []]],
    [queue('queue-bad', 'b', 'bad', -5, false), ['playing', 10, 1, 3, [], ['b']]],
    [fire('spawn-bad', 'b'), ['playing', 10, 1, 3, ['bad'], []]],
    [targetEvent('click-bad', 'click', 'bad'), ['playing', 5, 1, 3, [], []]],
    [queue('queue-missed-bad', 'c', 'missed-bad', -5, false), ['playing', 5, 1, 3, [], ['c']]],
    [fire('spawn-missed-bad', 'c'), ['playing', 5, 1, 3, ['missed-bad'], []]],
    [targetEvent('miss-bad', 'miss', 'missed-bad'), ['playing', 5, 1, 3, [], []]],
    [queue('queue-spare', 'd', 'spare', 7, true), ['playing', 5, 1, 3, [], ['d']]],
    [fire('spawn-spare', 'd'), ['playing', 5, 1, 3, ['spare'], []]],
    [queue('queue-missed-good', 'e', 'missed-good', 25, true), ['playing', 5, 1, 3, ['spare'], ['e']]],
    [fire('spawn-missed-good', 'e'), ['playing', 5, 1, 3, ['spare', 'missed-good'], []]],
    [targetEvent('miss-good', 'miss', 'missed-good'), ['ended', 5, 1, 3, ['spare'], []]],
    [targetEvent('ended-click', 'click', 'spare'), ['ended', 5, 1, 3, ['spare'], []]],
    [queue('ended-queue', 'blocked', 'blocked', 99, true), ['ended', 5, 1, 3, ['spare'], []]],
  ]),
  fixture('restart-and-stale', '重玩清理、旧局事件与难度重算', 6, [
    [action('start-hard', 'start', { difficulty: 3 }), ['playing', 0, 1, 2, [], []]],
    [queue('queue-before-end', 'before-end', 'before-end', 30, true), ['playing', 0, 1, 2, [], ['before-end']]],
    [queue('queue-after-restart', 'after-restart', 'after-restart', 40, true), ['playing', 0, 1, 2, [], ['before-end', 'after-restart']]],
    [queue('queue-first', 'first', 'shared', 12, true), ['playing', 0, 1, 2, [], ['before-end', 'after-restart', 'first']]],
    [fire('spawn-first', 'first'), ['playing', 0, 1, 2, ['shared'], ['before-end', 'after-restart']]],
    [targetEvent('score-first', 'click', 'shared'), ['playing', 12, 1, 2, [], ['before-end', 'after-restart']]],
    [queue('queue-bad-live', 'bad-live', 'bad-live', -8, false), ['playing', 12, 1, 2, [], ['before-end', 'after-restart', 'bad-live']]],
    [fire('spawn-bad-live', 'bad-live'), ['playing', 12, 1, 2, ['bad-live'], ['before-end', 'after-restart']]],
    [action('end-first', 'end', { session: 1 }), ['ended', 12, 1, 2, ['bad-live'], ['before-end', 'after-restart']]],
    [targetEvent('blocked-bad-click', 'click', 'bad-live'), ['ended', 12, 1, 2, ['bad-live'], ['before-end', 'after-restart']]],
    [fire('callback-after-end', 'before-end'), ['ended', 12, 1, 2, ['bad-live'], ['after-restart']]],
    [action('restart-first', 'restart'), ['title', 0, 1, 2, [], []]],
    [fire('callback-after-restart', 'after-restart'), ['title', 0, 1, 2, [], []]],
    [targetEvent('title-old-click', 'click', 'bad-live'), ['title', 0, 1, 2, [], []]],
    [action('start-medium-again', 'start', { difficulty: 2 }), ['playing', 0, 2, 3, [], []]],
    [queue('queue-new-shared', 'new-shared', 'shared', 20, true, 2), ['playing', 0, 2, 3, [], ['new-shared']]],
    [fire('spawn-new-shared', 'new-shared', 2), ['playing', 0, 2, 3, ['shared'], []]],
    [targetEvent('old-session-click', 'click', 'shared', 1), ['playing', 0, 2, 3, ['shared'], []]],
    [queue('old-session-queue', 'old-late', 'old-late', 99, true, 1), ['playing', 0, 2, 3, ['shared'], []]],
    [targetEvent('new-session-click', 'click', 'shared', 2), ['playing', 20, 2, 3, [], []]],
    [action('ignore-live-difficulty', 'start', { difficulty: 3 }), ['playing', 20, 2, 3, [], []]],
    [action('end-second', 'end', { session: 2 }), ['ended', 20, 2, 3, [], []]],
    [action('restart-second', 'restart'), ['title', 0, 2, 3, [], []]],
    [action('start-hard-again', 'start', { difficulty: 3 }), ['playing', 0, 3, 2, [], []]],
  ]),
  fixture('same-time-order', '同一时刻按数组顺序处理，分数可为负', 4, [
    [queue('before-start', 'early', 'early', 9, true, 0), ['title', 0, 0, 4, [], []]],
    [action('ordered-start', 'start', { difficulty: 1, at: 0 }), ['playing', 0, 1, 4, [], []]],
    [{ ...queue('ordered-queue', 'one', 'same', 4, true), at: 0 }, ['playing', 0, 1, 4, [], ['one']]],
    [{ ...fire('ordered-spawn', 'one'), at: 0 }, ['playing', 0, 1, 4, ['same'], []]],
    [{ ...targetEvent('ordered-click', 'click', 'same'), at: 0 }, ['playing', 4, 1, 4, [], []]],
    [{ ...queue('queue-two', 'two', 'two', 6, true), at: 1 }, ['playing', 4, 1, 4, [], ['two']]],
    [{ ...fire('spawn-two', 'two'), at: 1 }, ['playing', 4, 1, 4, ['two'], []]],
    [action('ordered-end', 'end', { session: 1, at: 1 }), ['ended', 4, 1, 4, ['two'], []]],
    [{ ...targetEvent('click-after-same-time-end', 'click', 'two'), at: 1 }, ['ended', 4, 1, 4, ['two'], []]],
    [action('ordered-restart', 'restart', { at: 1 }), ['title', 0, 1, 4, [], []]],
    [action('ordered-new-start', 'start', { difficulty: 2, at: 1 }), ['playing', 0, 2, 2, [], []]],
    [{ ...queue('queue-negative', 'negative', 'same', -3, false, 2), at: 1 }, ['playing', 0, 2, 2, [], ['negative']]],
    [{ ...fire('spawn-negative', 'negative', 2), at: 1 }, ['playing', 0, 2, 2, ['same'], []]],
    [action('old-end', 'end', { session: 1, at: 1 }), ['playing', 0, 2, 2, ['same'], []]],
    [{ ...targetEvent('old-miss', 'miss', 'same', 1), at: 1 }, ['playing', 0, 2, 2, ['same'], []]],
    [{ ...targetEvent('negative-score', 'click', 'same', 2), at: 1 }, ['playing', -3, 2, 2, [], []]],
    [{ ...targetEvent('unknown-miss', 'miss', 'unknown', 2), at: 1 }, ['playing', -3, 2, 2, [], []]],
    [action('last-end', 'end', { session: 2, at: 1 }), ['ended', -3, 2, 2, [], []]],
    [action('last-restart', 'restart', { at: 1 }), ['title', 0, 2, 2, [], []]],
  ]),
];

const helperSource = String.raw`
const copy = value => JSON.parse(JSON.stringify(value));
return {
  createGame(params) {
    return { phase: "title", score: 0, session: 0, interval: params.baseInterval,
      baseInterval: params.baseInterval, targets: [], pending: [] };
  },
  deliver(state, raw) {
    const event = copy(raw);
    if (event.type === "spawn") {
      const index = state.pending.findIndex(job => job.ticket === event.ticket);
      event.ready = index >= 0;
      if (event.ready) event.target = state.pending.splice(index, 1)[0].target;
    }
    return event;
  },
  schedule(state, event) {
    if (state.pending.some(job => job.ticket === event.ticket)) return;
    state.pending.push({ ticket: event.ticket, target: copy(event.target) });
  },
  spawn(state, event) {
    if (event.ready && !state.targets.some(target => target.id === event.target.id)) {
      state.targets.push(copy(event.target));
    }
  },
  click(state, event) {
    const index = state.targets.findIndex(target => target.id === event.targetId);
    if (index < 0) return;
    state.score += state.targets.splice(index, 1)[0].pointValue;
  },
  miss(state, event) {
    const index = state.targets.findIndex(target => target.id === event.targetId);
    return index < 0 ? false : state.targets.splice(index, 1)[0].good;
  },
  restart(state) {
    state.phase = "title"; state.score = 0; state.targets = []; state.pending = [];
  },
  snapshot(state, event) {
    return { step: event.step, id: event.id, event: event.type, phase: state.phase,
      score: state.score, targets: state.targets.length, targetIds: state.targets.map(target => target.id),
      session: state.session, interval: state.interval, baseInterval: state.baseInterval,
      pending: state.pending.length, pendingIds: state.pending.map(job => job.ticket) };
  }
};`;

const solutionCode = `const game = api.createGame(params);
const states = [];
for (const raw of input.events) {
  const event = api.deliver(game, raw);
  if (event.type === "start" && game.phase === "title") {
    game.phase = "playing";
    game.session += 1;
    game.interval = params.baseInterval / event.difficulty;
  } else if (event.type === "restart" && game.phase === "ended") {
    api.restart(game);
  } else if (game.phase === "playing" && event.session === game.session) {
    if (event.type === "schedule") api.schedule(game, event);
    if (event.type === "spawn") api.spawn(game, event);
    if (event.type === "click") api.click(game, event);
    if (event.type === "miss" && api.miss(game, event)) game.phase = "ended";
    if (event.type === "end") game.phase = "ended";
  }
  const snapshot = api.snapshot(game, event);
  states.push(snapshot);
  api.trace(event.id, snapshot);
}
return { states };`;

const starterCode = solutionCode
  .replace('event.type === "start" && game.phase === "title"', 'event.type === "start" /* TODO：什么阶段允许开始？ */')
  .replace('params.baseInterval / event.difficulty', 'game.interval / event.difficulty /* TODO：间隔应从哪个基值计算？ */')
  .replace('game.phase === "playing" && event.session === game.session', 'true /* TODO：哪些状态、哪一局的事件可执行？ */');

const brokenCode = solutionCode.replace(
  'game.phase === "playing" && event.session === game.session',
  '(game.phase === "playing" || game.phase === "ended") && event.session === game.session',
);

function stableValue(value: PracticeValue): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(stableValue).join(',') + ']';
  return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + stableValue(value[key])).join(',') + '}';
}

function reference(input: PracticeRecord, params: PracticeRecord): PracticeValue {
  const known = fixtures.find(item => item.practiceCase.id === input.scenario);
  if (!known || stableValue(input) !== stableValue(known.practiceCase.input)
    || stableValue(params) !== stableValue(known.practiceCase.params)) {
    throw new Error('该事件序列没有独立期望表，请选择本题提供的变式。');
  }
  const events = known.practiceCase.input.events as PracticeRecord[];
  return {
    states: known.rows.map(([phase, score, session, interval, targetIds, pendingIds], i) => ({
      step: events[i].step, id: events[i].id, event: events[i].type,
      phase, score, targets: targetIds.length, targetIds: [...targetIds], session,
      interval, baseInterval: known.practiceCase.params.baseInterval,
      pending: pendingIds.length, pendingIds: [...pendingIds],
    })),
  };
}

function record(value: PracticeValue): value is PracticeRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validateOutput(output: PracticeValue, input: PracticeRecord): void {
  if (!record(output) || !Array.isArray(output.states) || !Array.isArray(input.events)
    || output.states.length !== input.events.length) throw new Error('每个输入事件都应对应一个 states 快照。');
  const events = input.events;
  output.states.forEach((value, i) => {
    const event = events[i];
    if (!record(value) || !record(event) || value.step !== event.step || value.id !== event.id || value.event !== event.type) {
      throw new Error('快照应保留原数组顺序及每个事件的 step、id、event。');
    }
    if (!['title', 'playing', 'ended'].includes(String(value.phase))) throw new Error('phase 只能是 title、playing 或 ended。');
    for (const key of ['score', 'session', 'targets', 'pending']) {
      if (typeof value[key] !== 'number' || !Number.isSafeInteger(value[key])) throw new Error(key + ' 应是有限整数。');
    }
    if ((value.session as number) < 0 || (value.targets as number) < 0 || (value.pending as number) < 0) {
      throw new Error('会话与对象数量不能为负。');
    }
    for (const key of ['interval', 'baseInterval']) {
      if (typeof value[key] !== 'number' || !Number.isFinite(value[key]) || value[key] <= 0) throw new Error(key + ' 应是正数。');
    }
    for (const [idsKey, countKey] of [['targetIds', 'targets'], ['pendingIds', 'pending']] as const) {
      const ids = value[idsKey];
      if (!Array.isArray(ids) || ids.length !== value[countKey] || ids.some(id => typeof id !== 'string') || new Set(ids).size !== ids.length) {
        throw new Error(idsKey + ' 应列出对应数量且不重复的标识。');
      }
    }
  });
}

export const gamePractice: PracticeDefinition = {
  id: '31', title: '开始、计分、结束与重玩', version: 1, renderer: 'game',
  summary: '沿 Unity 点击目标原型，给事件加上游玩状态与会话条件；看清一次点击何时有效、结束后什么应停止，以及重玩如何重新开始。',
  sources: [
    { course: 'unity', chapter: '5.2', sectionIds: ['part-4', 'part-5', 'part-6'], label: '5.2：累计计分、跨脚本调用与目标分值' },
    { course: 'unity', chapter: '5.3', sectionIds: ['part-3', 'part-4', 'part-6', 'part-7'], label: '5.3：漏接、活动状态与重玩' },
    { course: 'unity', chapter: '5.4', sectionIds: ['part-4', 'part-5', 'part-6'], label: '5.4：标题入口、开始与难度参数' },
  ],
  tasks: [{
    id: 'game-flow', title: '让同一组事件遵守游戏流程',
    question: '只在正确阶段、正确一局处理生成与计分，怎样让结束与重玩同时影响实际结果？',
    guidance: {
      given: '平台提供依次到达的开始、登记生成、回调、点击、漏接、结束和重玩事件；每次处理后都保存一行状态。',
      issue: '初始代码允许重复开始，难度计算沿用上局间隔，游玩事件又缺少阶段和本局判断；标题时或结束后的事件仍可能改变数据。',
      edit: '修正三个 TODO：开始仅接受 title；间隔从 baseInterval 计算；游玩事件同时检查 playing 和 session。重玩条件和数据操作已提供。',
      observe: '标题不生成或计分；结束后也不接受生成或点击；重玩回标题并清空分数、目标和调度。用状态表找到第一次出现差异的事件。',
      terms: 'phase 是 title/playing/ended；session 标记第几局，用于拒绝旧局回调。两项条件分别防止错误阶段和错误一局；session 是本练习的显式辅助标识。',
    },
    pseudocode: [
      '仅在 title 接受 start，开始新 session，并从 baseInterval 与 difficulty 计算生成间隔。',
      '仅在 ended 接受 restart；脚手架会清分数、场上目标与未执行的生成请求，回到 title。',
      '游玩事件必须同时属于 playing 与当前 session，再交给生成、点击或漏接操作。',
      '漏接好目标或收到本局 end 时进入 ended；每个事件处理后记录快照，保持原数组顺序。',
    ],
    starterCode, solutionCode, brokenCode, helperSource,
    cases: fixtures.map(item => JSON.parse(JSON.stringify(item.practiceCase)) as PracticeCase), reference, validateOutput, tolerance: 1e-10,
    explanation: '编辑的是同步函数体。api.deliver 只交付已到达的生成票据，不会创建目标；schedule 登记请求，spawn 执行已交付的请求。click 移除仍在场的目标并累计其正负 pointValue，所以重复点击无对象可结算；miss 移除目标并返回它是否为好目标。上述辅助操作不判断游戏阶段或事件所属局，这些门禁由你编写。restart 清空玩法数据，但保留上一局 interval 供对照；标题阶段不生成，新 start 必须从 baseInterval 重算。api.trace 与 api.clone 可用于检查数据。',
    variation: '先看标题/计分序列，再切换重玩与同时间变式：结束后的存量点击、等待中的生成回调、复用目标 ID 的旧局事件，以及第二次难度选择都应符合相同规则。',
  }],
  limitations: [
    '这是原课游戏流程的事件模型，不模拟目标抛射、物理触发或实际 Unity UI/SceneManager；重玩回标题对应完成 5.4 后的开场流程。',
    'schedule 与 spawn 表示登记请求和回调到达，ticket 在内置序列中全局唯一；到达可消费票据，但是否生成仍由状态门禁决定。',
    'session 是此练习为辨认旧局回调增加的显式标识，不声称原课已有这一字段。相同 at 的事件仍严格按数组次序处理。',
    '只提供内置序列的独立期望表；新增事件或改写输入需要另加经核对的期望表，不以同一脚手架生成参考结果。',
  ],
};
