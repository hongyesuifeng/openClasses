import type { PracticeRecord, PracticeRunResult } from './practice-types.ts';
import { copyRecord, copyResult, PRACTICE_MAX_CODE, PracticeError } from './practice-kernel.ts';
import type { PracticeErrorCode } from './practice-kernel.ts';
export { compileLearner, wrapPracticeBody, comparePracticeValues, copyPlainData, validatePracticeValue, PRACTICE_MAX_TRACE, PRACTICE_MAX_BYTES, PRACTICE_MAX_CODE, PracticeError } from './practice-kernel.ts';
export type { PracticeErrorCode } from './practice-kernel.ts';
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const messageOf = (error: unknown) => error instanceof Error ? error.message : String(error);
const errorCodes = new Set<PracticeErrorCode>(['compile', 'runtime', 'timeout', 'cancelled', 'invalid', 'worker', 'messageerror', 'limit']);
function createNonce(): string {
  const cryptography = globalThis.crypto;
  if (cryptography?.randomUUID) return cryptography.randomUUID();
  if (cryptography?.getRandomValues) return Array.from(cryptography.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, '0')).join('');
  throw new PracticeError('worker', '当前环境缺少运行消息校验所需的随机数功能');
}

export interface PracticeWorkerLike {
  onmessage: ((event: { data: unknown }) => void) | null;
  onerror: ((event: { message?: string; preventDefault?: () => void }) => void) | null;
  onmessageerror: ((event: unknown) => void) | null;
  postMessage(value: unknown): void;
  terminate(): void;
}
export interface PracticeRunRequest { code: string; helperSource?: string; input: PracticeRecord; params: PracticeRecord }
export interface PracticeRunnerOptions { workerFactory?: () => PracticeWorkerLike; timeoutMs?: number }
export class PracticeRunner {
  private readonly workerFactory: () => PracticeWorkerLike;
  private readonly timeoutMs: number;
  private nextId = 0;
  private active: { runId: number; cancel: () => void } | undefined;
  constructor(options: PracticeRunnerOptions = {}) {
    this.workerFactory = options.workerFactory ?? (() => new Worker(new URL('./practice-worker.ts', import.meta.url), { type: 'module' }) as unknown as PracticeWorkerLike);
    this.timeoutMs = options.timeoutMs ?? 3000;
    if (!Number.isFinite(this.timeoutMs) || this.timeoutMs <= 0) throw new PracticeError('invalid', '运行时限必须是正数');
  }
  cancel(): void { this.active?.cancel(); }
  run(request: PracticeRunRequest): Promise<PracticeRunResult> {
    this.cancel();
    const runId = ++this.nextId;
    return new Promise((resolve, reject) => {
      let worker: PracticeWorkerLike | undefined;
      let timer: ReturnType<typeof setTimeout> | undefined;
      let settled = false;
      const finish = (error?: PracticeError, result?: PracticeRunResult) => {
        if (settled) return;
        settled = true;
        if (timer !== undefined) clearTimeout(timer);
        if (worker) { worker.onmessage = null; worker.onerror = null; worker.onmessageerror = null; try { worker.terminate(); } catch { /* Already terminated. */ } }
        if (this.active?.runId === runId) this.active = undefined;
        if (error) reject(error); else resolve(result!);
      };
      let input: PracticeRecord, params: PracticeRecord, nonce: string;
      try {
        if (!request || typeof request.code !== 'string' || (request.helperSource !== undefined && typeof request.helperSource !== 'string')) throw new PracticeError('invalid', '代码必须是文本');
        if (request.code.length > PRACTICE_MAX_CODE) throw new PracticeError('limit', '代码超过 64 KiB 字符限制');
        input = copyRecord(request.input); params = copyRecord(request.params); nonce = createNonce();
      } catch (error) { finish(error instanceof PracticeError ? error : new PracticeError('invalid', messageOf(error))); return; }
      try { worker = this.workerFactory(); } catch (error) { finish(new PracticeError('worker', `无法启动运行线程：${messageOf(error)}`)); return; }
      this.active = { runId, cancel: () => finish(new PracticeError('cancelled', '已取消本次运行')) };
      worker.onmessage = event => {
        if (settled || this.active?.runId !== runId) return;
        const response = event.data;
        if (!record(response) || response.runId !== runId || response.nonce !== nonce) return;
        try {
          if (response.type === 'result') finish(undefined, copyResult(response.result));
          else if (response.type === 'error' && record(response.error) && typeof response.error.code === 'string' && errorCodes.has(response.error.code as PracticeErrorCode) && typeof response.error.message === 'string' && response.error.message.length <= 4000) finish(new PracticeError(response.error.code as PracticeErrorCode, response.error.message));
          else finish(new PracticeError('invalid', '运行线程返回了无效消息'));
        } catch (error) { finish(error instanceof PracticeError ? error : new PracticeError('invalid', messageOf(error))); }
      };
      worker.onerror = event => { event.preventDefault?.(); finish(new PracticeError('worker', event.message || '运行线程发生错误')); };
      worker.onmessageerror = () => finish(new PracticeError('messageerror', '运行线程消息无法读取'));
      timer = setTimeout(() => finish(new PracticeError('timeout', '运行超过 3 秒，已停止线程')), this.timeoutMs);
      try { worker.postMessage({ type: 'run', runId, nonce, code: request.code, helperSource: request.helperSource, input, params }); }
      catch (error) { finish(new PracticeError('worker', `无法发送运行数据：${messageOf(error)}`)); }
    });
  }
}
