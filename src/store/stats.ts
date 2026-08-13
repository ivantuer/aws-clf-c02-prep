import type { ProgressState, Question, QuestionProgress } from 'src/data/types';
import { DOMAINS, TASK_STATEMENTS, domainOf } from 'src/data/taxonomy';
import type { DomainId, TaskStatementId } from 'src/data/taxonomy';

export interface Accuracy {
  seen: number;
  correct: number;
  total: number;
  ratio: number | null;
}

export interface TaskAccuracy extends Accuracy {
  task: TaskStatementId;
  label: string;
  domain: DomainId;
}

export interface DomainAccuracy extends Accuracy {
  domain: DomainId;
  label: string;
  weight: number;
}

function lastAttempt(progress: QuestionProgress | undefined) {
  return progress?.attempts.at(-1);
}

function tally(questions: Question[], state: ProgressState): Accuracy {
  let seen = 0;
  let correct = 0;
  for (const question of questions) {
    const attempt = lastAttempt(state.questions[question.id]);
    if (!attempt) continue;
    seen += 1;
    if (attempt.correct) correct += 1;
  }
  return { seen, correct, total: questions.length, ratio: seen ? correct / seen : null };
}

export function taskAccuracy(questions: Question[], state: ProgressState): TaskAccuracy[] {
  const buckets = new Map<TaskStatementId, Question[]>();
  for (const question of questions) {
    if (!question.taskStatement) continue;
    const list = buckets.get(question.taskStatement) ?? [];
    list.push(question);
    buckets.set(question.taskStatement, list);
  }

  return [...buckets.entries()]
    .map(([task, group]) => ({
      task,
      label: TASK_STATEMENTS[task],
      domain: domainOf(task),
      ...tally(group, state),
    }))
    .sort((a, b) => {
      if (a.ratio === null) return 1;
      if (b.ratio === null) return -1;
      return a.ratio - b.ratio || b.seen - a.seen;
    });
}

export function domainAccuracy(questions: Question[], state: ProgressState): DomainAccuracy[] {
  return (Object.values(DOMAINS) as { id: DomainId; name: string; weight: number }[]).map(
    (domain) => ({
      domain: domain.id,
      label: domain.name,
      weight: domain.weight,
      ...tally(
        questions.filter((question) => question.taskStatement && domainOf(question.taskStatement) === domain.id),
        state,
      ),
    }),
  );
}

export function registryIds(state: ProgressState): string[] {
  return Object.entries(state.questions)
    .filter(([, progress]) => progress.inRegistry)
    .map(([id]) => id);
}

export function overallProgress(questions: Question[], state: ProgressState): Accuracy {
  return tally(questions, state);
}
