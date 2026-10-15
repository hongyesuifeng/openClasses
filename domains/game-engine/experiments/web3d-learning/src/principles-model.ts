export type CourseId = 'games101' | 'unity' | 'games104';
export const courseIds: CourseId[] = ['games101', 'unity', 'games104'];
export function isCourse(value: unknown): value is CourseId { return courseIds.some(id => id === value); }

export interface EngineSnapshot { version: number; z: number }
export interface EngineCase {
  world: EngineSnapshot;
  pending: EngineSnapshot | null;
  image: EngineSnapshot;
  dirty: boolean;
  message: string;
}
export function newEngineCase(): EngineCase {
  return { world: { version: 0, z: 0 }, pending: null, image: { version: 0, z: 0 }, dirty: false, message: '先推进世界，再试着直接生成画面。看看缺少了什么。' };
}
export function engineAction(state: EngineCase, action: 'advance' | 'publish' | 'render'): EngineCase {
  if (action === 'advance') return {
    ...state, world: { version: state.world.version + 1, z: state.world.z + 2 }, dirty: true,
    message: '玩法世界已前进；交接包和画面仍保留各自的数据。世界变化不会自动传播到所有系统。',
  };
  if (action === 'publish') {
    if (state.pending) return { ...state, message: '渲染侧还有未处理的包，先生成画面消费它。新变化仍留在玩法侧，不能把接收方手上的包直接覆盖。' };
    if (!state.dirty) return { ...state, message: '没有新的世界变化需要交接。你可以先推进世界。' };
    return { ...state, pending: { ...state.world }, dirty: false, message: '交接包记录了这一刻的变化。它还没有变成图像；接着推进世界，可以看见“包的版本”和“最新世界”分开。' };
  }
  if (!state.pending) return { ...state, message: state.world.version === state.image.version ? '画面已经使用当前数据；没有新包需要消费。' : '没有收到新包，渲染仍使用旧数据。位置更新正确，也可能因为交接缺失而显示旧画面。' };
  return { ...state, image: { ...state.pending }, pending: null, message: state.pending.version === state.world.version ? '渲染消费了交接包，示意画面采用对应版本。接收方处理完后，才能继续接下一包。' : '画面采用收到的版本，不会越过交接边界偷读最新世界。再交接剩余变化，才能追上最新版本。' };
}

export interface GameCase { ended: boolean; targets: number; score: number }
export function newGameCase(): GameCase { return { ended: false, targets: 1, score: 0 }; }
export function gameAction(state: GameCase, action: 'end' | 'spawn' | 'score', enforceRules: boolean): GameCase {
  if (action === 'end') return { ...state, ended: true };
  if (enforceRules && state.ended) return { ...state };
  if (action === 'spawn') return { ...state, targets: state.targets + 1 };
  return state.targets ? { ...state, targets: state.targets - 1, score: state.score + 10 } : { ...state };
}

// A flat strip occupies one quarter of a pixel's width. Test coverage only;
// this is not a complete color reconstruction or general antialiasing method.
export function stripCoverage(column: number, offset: number, samplesPerAxis: number): number {
  const left = 5 + offset, right = left + 0.25;
  let hits = 0;
  for (let y = 0; y < samplesPerAxis; y++) for (let x = 0; x < samplesPerAxis; x++) {
    const sampleX = column + (x + 0.5) / samplesPerAxis;
    if (sampleX >= left && sampleX < right) hits++;
  }
  return hits / (samplesPerAxis * samplesPerAxis);
}

export interface ReadingPosition { version: 2; course: CourseId; topics: Record<CourseId, number> }
export function restoreReading(raw: string | null): ReadingPosition {
  const fallback: ReadingPosition = { version: 2, course: 'games101', topics: { games101: 1, unity: 4, games104: 0 } };
  try {
    const parsed: unknown = JSON.parse(raw || 'null');
    if (!parsed || typeof parsed !== 'object' || !('version' in parsed) || parsed.version !== 2) return fallback;
    const value = parsed as Record<string, unknown>;
    if (isCourse(value.course)) fallback.course = value.course;
    if (value.topics && typeof value.topics === 'object') for (const id of courseIds) {
      const n = (value.topics as Record<string, unknown>)[id];
      const max = id === 'unity' ? 4 : 5;
      if (typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= max) fallback.topics[id] = n;
    }
  } catch { /* A missing or damaged bookmark starts at the concept overview. */ }
  return fallback;
}
