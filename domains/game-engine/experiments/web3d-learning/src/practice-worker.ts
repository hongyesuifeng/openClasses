import { compileLearner, PracticeError } from './practice-kernel.ts';
import type { PracticeRunRequest } from './practice-runtime.ts';

const scope = globalThis as unknown as { onmessage: ((event: MessageEvent) => void) | null; postMessage(value: unknown): void };
// Capture before evaluating learner code. Its global postMessage replacement cannot change this sender.
const send = scope.postMessage.bind(globalThis);
scope.onmessage = event => {
  const request = event.data as PracticeRunRequest & { type?: unknown; runId?: unknown; nonce?: unknown };
  if (!request || request.type !== 'run' || !Number.isSafeInteger(request.runId) || Number(request.runId) <= 0
    || typeof request.nonce !== 'string' || request.nonce.length < 32 || request.nonce.length > 128) return;
  const { runId, nonce } = request;
  try {
    const result = compileLearner(request.code, request.helperSource)(request.input, request.params);
    send({ type: 'result', runId, nonce, result });
  } catch (error) {
    const failure = error instanceof PracticeError ? error : new PracticeError('runtime', error instanceof Error ? error.message : String(error));
    send({ type: 'error', runId, nonce, error: { code: failure.code, message: failure.message.slice(0, 4000) } });
  }
};
