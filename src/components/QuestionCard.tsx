import type { Question } from 'src/data/types';
import { TASK_STATEMENTS, taskStatementUrl } from 'src/data/taxonomy';
import { ExplanationPanel } from './ExplanationPanel';

interface QuestionCardProps {
  question: Question;
  order: string[];
  selected: string[];
  answer: string[];
  revealed: boolean;
  onToggle: (letter: string) => void;
  onOverride?: (answer: string[] | null) => void;
  overridden?: boolean;
}

function letterClasses(
  letter: string,
  { selected, answer, revealed }: Pick<QuestionCardProps, 'selected' | 'answer' | 'revealed'>,
): string {
  const isSelected = selected.includes(letter);
  const isAnswer = answer.includes(letter);

  if (!revealed) {
    return isSelected
      ? 'border-aws bg-aws/10 text-ink-200'
      : 'border-ink-700 hover:border-ink-400 text-ink-200';
  }
  if (isAnswer) return 'border-good bg-good/10 text-ink-200';
  if (isSelected) return 'border-bad bg-bad/10 text-ink-200';
  return 'border-ink-800 text-ink-400';
}

export function QuestionCard({
  question,
  order,
  selected,
  answer,
  revealed,
  onToggle,
  onOverride,
  overridden,
}: QuestionCardProps) {
  const requiredCount = answer.length;

  return (
    <article className="rounded-xl border border-ink-800 bg-ink-900 p-6">
      {question.needsReview && (
        <p className="mb-4 rounded-lg border border-warn/40 bg-warn/10 px-4 py-3 text-sm text-warn">
          Answer key disputed: {question.needsReview}
        </p>
      )}
      {question.outdated && (
        <p className="mb-4 rounded-lg border border-ink-700 bg-ink-800 px-4 py-3 text-sm text-ink-400">
          May be out of scope for CLF-C02: {question.outdated}
        </p>
      )}

      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-ink-400">
        {question.taskStatement && (
          <a
            className="rounded-full border border-ink-700 px-3 py-1 hover:border-aws hover:text-aws"
            href={taskStatementUrl(question.taskStatement)}
            target="_blank"
            rel="noreferrer"
          >
            {question.taskStatement} · {TASK_STATEMENTS[question.taskStatement]}
          </a>
        )}
        {requiredCount > 1 && (
          <span className="rounded-full border border-ink-700 px-3 py-1">Choose {requiredCount}</span>
        )}
        {question.occurrences.length > 1 && (
          <span className="rounded-full border border-ink-700 px-3 py-1">
            Repeats in {question.occurrences.length} exams
          </span>
        )}
      </div>

      <h2 className="mb-5 text-lg leading-relaxed text-white">{question.stem}</h2>

      <ul className="flex flex-col gap-2">
        {order.map((letter) => (
          <li key={letter}>
            <button
              type="button"
              disabled={revealed}
              onClick={() => onToggle(letter)}
              className={`flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors disabled:cursor-default ${letterClasses(
                letter,
                { selected, answer, revealed },
              )}`}
            >
              <span className="font-mono text-xs opacity-70">{letter}</span>
              <span>{question.options[letter]}</span>
            </button>
          </li>
        ))}
      </ul>

      {revealed && (
        <ExplanationPanel
          question={question}
          answer={answer}
          onOverride={onOverride}
          overridden={overridden}
        />
      )}
    </article>
  );
}
