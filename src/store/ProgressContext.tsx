import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Attempt, ExamResult, ProgressState, Question, Settings } from 'src/data/types';
import bankJson from 'src/data/bank.json';
import {
  loadProgress,
  recordAttempt,
  recordExamResult,
  resetAll,
  resetExam,
  saveProgress,
  setOverride,
} from './progress';

const bank = bankJson as unknown as { questions: Question[]; examCount: number };

interface ProgressContextValue {
  questions: Question[];
  byId: Map<string, Question>;
  examCount: number;
  state: ProgressState;
  answerQuestion: (questionId: string, attempt: Attempt) => void;
  finishExam: (exam: number, result: ExamResult) => void;
  overrideAnswer: (questionId: string, answer: string[] | null) => void;
  updateSettings: (settings: Partial<Settings>) => void;
  clearExam: (exam: number) => void;
  clearAll: () => void;
  exportProgress: () => void;
  importProgress: (raw: string) => void;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProgressState>(() => loadProgress());

  useEffect(() => {
    saveProgress(state);
  }, [state]);

  const value = useMemo<ProgressContextValue>(() => {
    const byId = new Map(bank.questions.map((question) => [question.id, question]));

    const questionsOnlyInExam = (exam: number) =>
      bank.questions
        .filter((question) => question.occurrences.every((occurrence) => occurrence.exam === exam))
        .map((question) => question.id);

    return {
      questions: bank.questions,
      byId,
      examCount: bank.examCount,
      state,
      answerQuestion: (questionId, attempt) =>
        setState((current) => recordAttempt(current, questionId, attempt)),
      finishExam: (exam, result) => setState((current) => recordExamResult(current, exam, result)),
      overrideAnswer: (questionId, answer) =>
        setState((current) => setOverride(current, questionId, answer)),
      updateSettings: (settings) =>
        setState((current) => ({ ...current, settings: { ...current.settings, ...settings } })),
      clearExam: (exam) => setState((current) => resetExam(current, exam, questionsOnlyInExam(exam))),
      clearAll: () => setState((current) => resetAll(current)),
      exportProgress: () => {
        const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `aws-quiz-progress-${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        URL.revokeObjectURL(url);
      },
      importProgress: (raw) => {
        const parsed = JSON.parse(raw) as ProgressState;
        if (parsed.version !== 1) throw new Error('Unsupported progress file version');
        setState(parsed);
      },
    };
  }, [state]);

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const value = useContext(ProgressContext);
  if (!value) throw new Error('useProgress must be used inside ProgressProvider');
  return value;
}
