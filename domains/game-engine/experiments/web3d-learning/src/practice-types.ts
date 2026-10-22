import type { CourseId } from './course-types.ts';

export type PracticeValue = null | boolean | number | string | PracticeValue[] | { [key: string]: PracticeValue };
export type PracticeRecord = { [key: string]: PracticeValue };
export interface PracticeSource { course: CourseId; chapter: string; sectionIds: string[]; label: string }
export interface PracticeCase { id: string; label: string; input: PracticeRecord; params: PracticeRecord }
export interface PracticeTrace { step: string; value: PracticeValue }
export interface PracticeTask {
  id: string; title: string; question: string; pseudocode: string[];
  starterCode: string; solutionCode: string; brokenCode: string;
  /** Trusted scaffold. Function body returning extra api methods, evaluated only in the learner worker. */
  helperSource?: string;
  cases: PracticeCase[];
  reference: (input: PracticeRecord, params: PracticeRecord) => PracticeValue;
  validateOutput: (output: PracticeValue, input: PracticeRecord) => void;
  tolerance?: number;
  explanation: string; variation: string;
}
export interface PracticeDefinition {
  id: string; title: string; version: number; summary: string;
  sources: PracticeSource[]; tasks: PracticeTask[];
  renderer: 'transform' | 'time' | 'sampling' | 'game'; limitations: string[];
}
export interface PracticeCatalogueItem { id: string; title: string; group: string; status: 'ready' | 'planned' }
export interface PracticeRunResult { output: PracticeValue; trace: PracticeTrace[] }
