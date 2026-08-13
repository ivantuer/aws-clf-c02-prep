import type { TaskStatementId } from './taxonomy';

export interface Occurrence {
  exam: number;
  number: number;
}

export interface Explanation {
  concept: string;
  correct: string;
  distractors: Record<string, string>;
}

export interface Question {
  id: string;
  stem: string;
  options: Record<string, string>;
  answer: string[];
  multiSelect: boolean;
  occurrences: Occurrence[];
  references: string[];
  sourceExplanation: string;
  taskStatement?: TaskStatementId;
  secondaryTaskStatement?: TaskStatementId;
  explanation?: Explanation;
  needsReview?: string;
  outdated?: string;
}

export interface Bank {
  generatedAt: string;
  source: string;
  examCount: number;
  totalOccurrences: number;
  questions: Question[];
}

export type Mode = 'mock' | 'drill';

export interface Attempt {
  at: number;
  correct: boolean;
  selected: string[];
  mode: Mode;
  exam?: number;
}

export interface QuestionProgress {
  attempts: Attempt[];
  streak: number;
  inRegistry: boolean;
}

export interface ExamResult {
  at: number;
  score: number;
  total: number;
  durationMs: number;
  missed: string[];
}

export interface Settings {
  mockDurationMinutes: number;
  shuffleDrillQuestions: boolean;
  shuffleDrillOptions: boolean;
}

export interface ProgressState {
  version: 1;
  questions: Record<string, QuestionProgress>;
  examResults: Record<number, ExamResult[]>;
  overrides: Record<string, string[]>;
  settings: Settings;
}
