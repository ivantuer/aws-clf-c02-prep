import type { ProgressState, Question } from 'src/data/types';
import type { TaskStatementId, DomainId } from 'src/data/taxonomy';
import { domainOf } from 'src/data/taxonomy';

export interface DrillFilters {
  exam?: number;
  registryOnly?: boolean;
  unseenOnly?: boolean;
  domain?: DomainId;
  task?: TaskStatementId;
  limit?: number;
  ids?: string[];
}

export function shuffle<T>(items: T[], seed = Date.now()): T[] {
  const result = [...items];
  let state = seed >>> 0 || 1;
  for (let index = result.length - 1; index > 0; index -= 1) {
    state = (state * 1664525 + 1013904223) >>> 0;
    const swap = state % (index + 1);
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

export function questionsForExam(questions: Question[], exam: number): Question[] {
  return questions
    .filter((question) => question.occurrences.some((occurrence) => occurrence.exam === exam))
    .sort((a, b) => positionIn(a, exam) - positionIn(b, exam));
}

export function positionIn(question: Question, exam: number): number {
  return question.occurrences.find((occurrence) => occurrence.exam === exam)?.number ?? 0;
}

export function selectDrill(
  questions: Question[],
  state: ProgressState,
  filters: DrillFilters,
): Question[] {
  let pool = questions;

  if (filters.ids) {
    const wanted = new Set(filters.ids);
    pool = pool.filter((question) => wanted.has(question.id));
  }
  if (filters.exam !== undefined) pool = questionsForExam(pool, filters.exam);
  if (filters.registryOnly) pool = pool.filter((question) => state.questions[question.id]?.inRegistry);
  if (filters.unseenOnly) pool = pool.filter((question) => !state.questions[question.id]?.attempts.length);
  if (filters.domain !== undefined) {
    pool = pool.filter(
      (question) => question.taskStatement && domainOf(question.taskStatement) === filters.domain,
    );
  }
  if (filters.task) {
    pool = pool.filter(
      (question) =>
        question.taskStatement === filters.task || question.secondaryTaskStatement === filters.task,
    );
  }
  return filters.limit ? pool.slice(0, filters.limit) : pool;
}

export function optionOrder(question: Question, shuffled: boolean, seed: number): string[] {
  const letters = Object.keys(question.options).sort();
  return shuffled ? shuffle(letters, seed) : letters;
}
