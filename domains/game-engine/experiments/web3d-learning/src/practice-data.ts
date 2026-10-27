import type { PracticeRecord, PracticeValue } from './practice-types.ts';

export function finiteNumber(value: PracticeValue | undefined, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`${label} 必须是有限数值`);
  return value;
}
export function dataObject(value: PracticeValue | undefined, label = '结果'): PracticeRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} 必须是对象`);
  return value;
}
export function dataArray(value: PracticeValue | undefined, label: string): PracticeValue[] {
  if (!Array.isArray(value) || !value.length || value.length > 500) throw new Error(`${label} 需要 1—500 项数组`);
  return value;
}
export function vector3(value: PracticeValue | undefined, label: string): number[] {
  if (!Array.isArray(value) || value.length !== 3) throw new Error(`${label} 需要三个分量`);
  return value.map((part, i) => finiteNumber(part, `${label}[${i}]`));
}
export function exactFields(value: PracticeRecord, fields: string[]): void {
  if (Object.keys(value).sort().join('|') !== [...fields].sort().join('|')) throw new Error(`结果字段应为 ${fields.join('、')}`);
}
export function vectorRows(output: PracticeValue, field: string, count: number): void {
  const result = dataObject(output); exactFields(result, [field]);
  const rows = dataArray(result[field], field);
  if (rows.length !== count) throw new Error(`${field} 数量必须与输入一致`);
  rows.forEach((row, i) => vector3(row, `${field}[${i}]`));
}
