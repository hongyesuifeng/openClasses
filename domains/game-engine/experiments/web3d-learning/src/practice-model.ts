import type { PracticeDefinition, PracticeRecord, PracticeSource, PracticeTask } from './practice-types.ts';
import { copyPlainData, PRACTICE_MAX_BYTES, PRACTICE_MAX_CODE, PracticeError } from './practice-kernel.ts';

export const PRACTICE_DRAFT_PREFIX = 'openclasses-practice-draft-v1';
export interface PracticeDraft {
  experimentId: string; taskId: string; version: number; caseId: string;
  code: string; input: PracticeRecord; params: PracticeRecord;
  paramsText?: string;
}
export interface PracticeContext {
  definition: PracticeDefinition; source: PracticeSource; from: 'classics' | 'chinese-reading';
  sectionId?: string; backHref: string;
}
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const identifier = (value: unknown): value is string => typeof value === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,79}$/.test(value);
export function practiceDraftKey(experimentId: string, taskId: string, version = 1): string {
  if (!identifier(experimentId) || !identifier(taskId) || !Number.isSafeInteger(version) || version < 1) throw new PracticeError('invalid', '草稿编号或版本无效');
  return `${PRACTICE_DRAFT_PREFIX}:${experimentId}:${taskId}:v${version}`;
}
function parseDraft(value: unknown): PracticeDraft {
  const data = copyPlainData(value);
  if (!record(data) || !identifier(data.experimentId) || !identifier(data.taskId) || !identifier(data.caseId)
    || !Number.isSafeInteger(data.version) || Number(data.version) < 1 || typeof data.code !== 'string'
    || data.code.length > PRACTICE_MAX_CODE || !record(data.input) || !record(data.params)) throw new PracticeError('invalid', '草稿内容不完整');
  if (data.paramsText !== undefined && (typeof data.paramsText !== 'string' || data.paramsText.length > PRACTICE_MAX_CODE)) throw new PracticeError('invalid', '参数草稿文本过长');
  return { experimentId: data.experimentId, taskId: data.taskId, version: Number(data.version), caseId: data.caseId,
    code: data.code, input: data.input as PracticeRecord, params: data.params as PracticeRecord,
    ...(typeof data.paramsText === 'string' ? { paramsText: data.paramsText } : {}) };
}
export function serializePracticeDraft(draft: PracticeDraft): string { return JSON.stringify(parseDraft(draft)); }
export function restorePracticeDraft(serialized: string | null, definition: PracticeDefinition, task: PracticeTask): PracticeDraft | null {
  if (!serialized || serialized.length > PRACTICE_MAX_BYTES) return null;
  try {
    const draft = parseDraft(JSON.parse(serialized));
    if (draft.experimentId !== definition.id || draft.taskId !== task.id || !definition.tasks.some(item => item.id === task.id)) return null;
    if (draft.version === definition.version && !task.cases.some(item => item.id === draft.caseId)) return null;
    return draft;
  } catch { return null; }
}

/** Only registered source references can become a return URL. No arbitrary returnUrl is accepted. */
export function parsePracticeContext(search: string, registry: readonly PracticeDefinition[]): PracticeContext | null {
  const query = new URLSearchParams(search);
  const experiment = query.get('experiment');
  const definition = experiment === null ? registry[0] : registry.find(item => item.id === experiment);
  if (!definition || !definition.sources.length) return null;
  const requestedSource = definition.sources.find(source => source.course === query.get('course') && source.chapter === query.get('chapter'));
  const source = requestedSource ?? definition.sources[0];
  const from = requestedSource && query.get('from') === 'classics' ? 'classics' : 'chinese-reading';
  const requestedSection = query.get('section');
  const sectionId = requestedSource && requestedSection && source.sectionIds.includes(requestedSection) && /^[a-z][a-z0-9-]*$/.test(requestedSection) ? requestedSection : undefined;
  const backHref = `?lab=${from}&course=${encodeURIComponent(source.course)}&chapter=${encodeURIComponent(source.chapter)}${from === 'chinese-reading' && sectionId ? `#${encodeURIComponent(sectionId)}` : ''}`;
  return { definition, source, from, ...(sectionId ? { sectionId } : {}), backHref };
}
