import type { Attempt, ExamResult, Mode, ProgressState, Settings } from 'src/data/types';

const STORAGE_KEY = 'aws-quiz.progress.v1';
export const MASTERY_STREAK = 2;

export const DEFAULT_SETTINGS: Settings = {
  mockDurationMinutes: 90,
  shuffleDrillQuestions: true,
  shuffleDrillOptions: true,
};

function emptyState(): ProgressState {
  return {
    version: 1,
    questions: {},
    examResults: {},
    overrides: {},
    settings: { ...DEFAULT_SETTINGS },
  };
}

export function loadProgress(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as ProgressState;
    if (parsed.version !== 1) return emptyState();
    return {
      ...emptyState(),
      ...parsed,
      settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
    };
  } catch {
    return emptyState();
  }
}

export function saveProgress(state: ProgressState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function recordAttempt(
  state: ProgressState,
  questionId: string,
  attempt: Attempt,
): ProgressState {
  const previous = state.questions[questionId] ?? { attempts: [], streak: 0, inRegistry: false };
  const streak = attempt.correct ? previous.streak + 1 : 0;
  const mastered = streak >= MASTERY_STREAK;

  return {
    ...state,
    questions: {
      ...state.questions,
      [questionId]: {
        attempts: [...previous.attempts, attempt],
        streak,
        inRegistry: attempt.correct ? previous.inRegistry && !mastered : true,
      },
    },
  };
}

export function recordExamResult(
  state: ProgressState,
  exam: number,
  result: ExamResult,
): ProgressState {
  return {
    ...state,
    examResults: {
      ...state.examResults,
      [exam]: [...(state.examResults[exam] ?? []), result],
    },
  };
}

export function setOverride(
  state: ProgressState,
  questionId: string,
  answer: string[] | null,
): ProgressState {
  const overrides = { ...state.overrides };
  if (answer === null) delete overrides[questionId];
  else overrides[questionId] = [...answer].sort();
  return { ...state, overrides };
}

export function resetExam(state: ProgressState, exam: number, questionIds: string[]): ProgressState {
  const questions = { ...state.questions };
  for (const id of questionIds) delete questions[id];
  const examResults = { ...state.examResults };
  delete examResults[exam];
  return { ...state, questions, examResults };
}

export function resetAll(state: ProgressState): ProgressState {
  return { ...emptyState(), settings: state.settings };
}

export function isCorrect(selected: string[], answer: string[]): boolean {
  if (selected.length !== answer.length) return false;
  const sorted = [...selected].sort();
  return answer.every((letter, index) => sorted[index] === letter);
}

export function effectiveAnswer(
  state: ProgressState,
  questionId: string,
  answer: string[],
): string[] {
  return state.overrides[questionId] ?? answer;
}

export function makeAttempt(
  selected: string[],
  answer: string[],
  mode: Mode,
  exam?: number,
): Attempt {
  return { at: Date.now(), correct: isCorrect(selected, answer), selected, mode, exam };
}
