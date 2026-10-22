import type { PracticeRecord, PracticeRunResult, PracticeTrace, PracticeValue } from './practice-types.ts';

export const PRACTICE_MAX_TRACE = 1000;
export const PRACTICE_MAX_BYTES = 1024 * 1024;
export const PRACTICE_MAX_CODE = 64 * 1024;
export type PracticeErrorCode = 'compile' | 'runtime' | 'timeout' | 'cancelled' | 'invalid' | 'worker' | 'messageerror' | 'limit';
export class PracticeError extends Error {
  readonly code: PracticeErrorCode;
  constructor(code: PracticeErrorCode, message: string) { super(message); this.name = 'PracticeError'; this.code = code; }
}
const encoder = new TextEncoder();
const messageOf = (error: unknown) => error instanceof Error ? error.message : String(error);
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
interface Budget { bytes: number; nodes: number }
const budget = (): Budget => ({ bytes: 0, nodes: 0 });
function count(state: Budget, bytes: number) {
  state.bytes += bytes;
  if (state.bytes > PRACTICE_MAX_BYTES || state.nodes > 50000) throw new PracticeError('limit', '结果与过程记录超过大小限制');
}
function copy(value: unknown, state: Budget, ancestors: Set<object>, depth = 0): PracticeValue {
  if (depth > 64) throw new PracticeError('limit', '数据嵌套过深');
  state.nodes++;
  if (value === null || typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string') {
    if (typeof value === 'number' && !Number.isFinite(value)) throw new PracticeError('invalid', '数据必须使用有限数值');
    if (typeof value === 'string' && value.length > PRACTICE_MAX_BYTES) throw new PracticeError('limit', '文本超过大小限制');
    count(state, encoder.encode(JSON.stringify(value)).length);
    return value;
  }
  if (!value || typeof value !== 'object') throw new PracticeError('invalid', '仅支持普通数据；不支持 undefined、函数、Promise 或类实例');
  if (ancestors.has(value)) throw new PracticeError('invalid', '数据不能包含循环引用');
  const array = Array.isArray(value);
  const prototype = Object.getPrototypeOf(value);
  if (!array && prototype !== Object.prototype && prototype !== null) throw new PracticeError('invalid', '仅支持普通对象，不支持 Promise、Map 或类实例');
  if (array && prototype !== Array.prototype) throw new PracticeError('invalid', '数组必须是普通数组');
  if (Object.getOwnPropertySymbols(value).length) throw new PracticeError('invalid', '数据不能包含 Symbol 字段');
  const properties = Object.getOwnPropertyDescriptors(value);
  ancestors.add(value);
  count(state, 2);
  let result: PracticeValue;
  if (array) {
    const length = value.length;
    if (length > 50000) throw new PracticeError('limit', '数组超过长度限制');
    if (Object.keys(properties).some(key => key !== 'length' && (!/^(0|[1-9]\d*)$/.test(key) || Number(key) >= length))) throw new PracticeError('invalid', '数组不能包含额外字段');
    const items: PracticeValue[] = [];
    for (let index = 0; index < length; index++) {
      const property = properties[String(index)];
      if (!property || !('value' in property) || !property.enumerable) throw new PracticeError('invalid', '数组不能有空项或访问器');
      if (index) count(state, 1);
      items.push(copy(property.value, state, ancestors, depth + 1));
    }
    result = items;
  } else {
    const items: { [key: string]: PracticeValue } = {};
    let index = 0;
    for (const [key, property] of Object.entries(properties)) {
      if (!('value' in property) || !property.enumerable) throw new PracticeError('invalid', '对象字段必须是可枚举的普通数据');
      count(state, encoder.encode(JSON.stringify(key)).length + 1 + (index++ ? 1 : 0));
      Object.defineProperty(items, key, { value: copy(property.value, state, ancestors, depth + 1), enumerable: true, writable: true, configurable: true });
    }
    result = items;
  }
  ancestors.delete(value);
  return result;
}
export function copyPlainData(value: unknown): PracticeValue { return copy(value, budget(), new Set()); }
export function validatePracticeValue(value: unknown): asserts value is PracticeValue { copyPlainData(value); }
export function copyRecord(value: unknown): PracticeRecord {
  const result = copyPlainData(value);
  if (!record(result)) throw new PracticeError('invalid', '输入和参数必须是普通对象');
  return result as PracticeRecord;
}
export function copyResult(value: unknown): PracticeRunResult {
  const result = copyPlainData(value);
  if (!record(result) || !Object.hasOwn(result, 'output') || !Array.isArray(result.trace)) throw new PracticeError('invalid', '运行结果缺少 output 或 trace');
  if (result.trace.length > PRACTICE_MAX_TRACE) throw new PracticeError('limit', '过程记录超过 1000 条');
  for (const item of result.trace) {
    if (!record(item) || typeof item.step !== 'string' || !item.step.trim() || item.step.length > 120 || !Object.hasOwn(item, 'value')) throw new PracticeError('invalid', '过程记录必须包含简短步骤名和普通数据');
  }
  return { output: result.output as PracticeValue, trace: result.trace as unknown as PracticeTrace[] };
}

/** The editor stores a function body; execution and integration tests use this same wrapper. */
export function wrapPracticeBody(body: string): string {
  if (typeof body !== 'string') throw new PracticeError('invalid', '代码正文必须是文本');
  const source = `function solve(input, params, api) {\n${body}\n}`;
  if (source.length > PRACTICE_MAX_CODE) throw new PracticeError('limit', '代码超过 64 KiB 字符限制');
  return source;
}

/** Compile once; each call receives fresh copies and a new trace buffer. Never call on the UI thread with learner code. */
export function compileLearner(code: string, helperSource?: string): (input: PracticeRecord, params: PracticeRecord) => PracticeRunResult {
  if (typeof code !== 'string' || (helperSource !== undefined && typeof helperSource !== 'string')) throw new PracticeError('invalid', '代码必须是文本');
  if (code.length > PRACTICE_MAX_CODE) throw new PracticeError('limit', '代码超过 64 KiB 字符限制');
  let factory: (api: Record<string, unknown>) => unknown;
  let helpers: ((api: Record<string, unknown>) => unknown) | undefined;
  try {
    factory = new Function('api', `"use strict";\n${code}\nreturn typeof solve === 'function' ? solve : null;`) as typeof factory;
    if (helperSource !== undefined) helpers = new Function('api', `"use strict";\n${helperSource}`) as typeof helpers;
  } catch (error) { throw new PracticeError('compile', messageOf(error)); }
  return (input, params) => {
    const data = copyRecord(input), options = copyRecord(params), trace: PracticeTrace[] = [];
    const traceBudget = budget();
    const baseApi = {
      clone: copyPlainData,
      trace(step: string, value: unknown) {
        if (typeof step !== 'string' || !step.trim() || step.length > 120) throw new PracticeError('invalid', '步骤名必须是 1—120 字符的文本');
        if (trace.length >= PRACTICE_MAX_TRACE) throw new PracticeError('limit', '过程记录超过 1000 条');
        const item = copy({ step, value }, traceBudget, new Set()) as unknown as PracticeTrace;
        trace.push(item);
      },
    };
    try {
      const extra = helpers?.(baseApi);
      if (extra !== undefined && !record(extra)) throw new PracticeError('runtime', '练习辅助接口配置无效');
      const api = Object.assign({}, extra, baseApi);
      const solve = factory(api);
      if (typeof solve !== 'function') throw new PracticeError('compile', '请定义 function solve(input, params)');
      const output: unknown = solve(data, options, api);
      if (output instanceof Promise) {
        void output.catch(() => {});
        throw new PracticeError('invalid', 'solve 必须同步返回普通数据，不支持 Promise');
      }
      return copyResult({ output, trace });
    } catch (error) { if (error instanceof PracticeError) throw error; throw new PracticeError('runtime', messageOf(error)); }
  };
}

export function comparePracticeValues(expected: unknown, actual: unknown, tolerance = 1e-8): { equal: boolean; message: string } {
  if (!Number.isFinite(tolerance) || tolerance < 0) return { equal: false, message: '比较容差无效' };
  let left: PracticeValue, right: PracticeValue;
  try { left = copyPlainData(expected); right = copyPlainData(actual); } catch (error) { return { equal: false, message: messageOf(error) }; }
  function difference(a: PracticeValue, b: PracticeValue, path: string): string {
    if (typeof a === 'number' && typeof b === 'number') return Math.abs(a - b) <= tolerance * Math.max(1, Math.abs(a), Math.abs(b)) ? '' : `${path} 数值不同：预期 ${a}，实际 ${b}`;
    if (a === b) return '';
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return `${path} 数组长度不同`;
      for (let index = 0; index < a.length; index++) { const result = difference(a[index], b[index], `${path}[${index}]`); if (result) return result; }
      return '';
    }
    if (record(a) && record(b)) {
      const keys = Object.keys(a);
      if (keys.length !== Object.keys(b).length || keys.some(key => !Object.hasOwn(b, key))) return `${path} 对象字段不同`;
      for (const key of keys) { const result = difference(a[key] as PracticeValue, b[key] as PracticeValue, `${path}.${key}`); if (result) return result; }
      return '';
    }
    return `${path} 的类型或取值不同`;
  }
  const message = difference(left, right, 'output');
  return { equal: !message, message: message || '与参考结果一致（在本实验容差内）' };
}
