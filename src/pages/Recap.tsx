import { Link, useParams } from 'react-router-dom';
import { useProgress } from 'src/store/ProgressContext';
import { DOMAINS, TASK_STATEMENTS, domainOf, taskStatementUrl } from 'src/data/taxonomy';
import type { DomainId, TaskStatementId } from 'src/data/taxonomy';
import type { Question } from 'src/data/types';
import { effectiveAnswer } from 'src/store/progress';

const UNTAGGED = 'untagged';

export function Recap() {
  const { exam: examParam } = useParams();
  const exam = Number(examParam);
  const { byId, state } = useProgress();

  const result = (state.examResults[exam] ?? []).at(-1);
  if (!result) {
    return (
      <div className="rounded-xl border border-ink-800 bg-ink-900 p-8 text-center text-ink-400">
        No results for exam {exam} yet.{' '}
        <Link to="/" className="text-aws underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const percent = Math.round((result.score / result.total) * 100);
  const missed = result.missed
    .map((id) => byId.get(id))
    .filter((question): question is Question => Boolean(question));

  const groups = new Map<string, Question[]>();
  for (const question of missed) {
    const key = question.taskStatement ?? UNTAGGED;
    groups.set(key, [...(groups.get(key) ?? []), question]);
  }
  const ordered = [...groups.entries()].sort((a, b) => b[1].length - a[1].length);

  const domainTally = (Object.values(DOMAINS) as { id: DomainId; name: string; weight: number }[]).map(
    (domain) => {
      const missedHere = missed.filter(
        (question) => question.taskStatement && domainOf(question.taskStatement) === domain.id,
      ).length;
      return { ...domain, missed: missedHere };
    },
  );

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-xl border border-ink-800 bg-ink-900 p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-ink-400">Exam {exam} recap</p>
            <p className="text-4xl font-semibold text-white">{percent}%</p>
            <p className="text-sm text-ink-400">
              {result.score} of {result.total} correct · {Math.round(result.durationMs / 60_000)} min
            </p>
          </div>
          <p
            className={`rounded-lg px-4 py-2 text-sm ${
              percent >= 70 ? 'bg-good/10 text-good' : 'bg-bad/10 text-bad'
            }`}
          >
            {percent >= 70 ? 'Above' : 'Below'} the ~70% approximate pass mark
          </p>
        </div>

        <ul className="mt-5 grid gap-2 border-t border-ink-800 pt-5 sm:grid-cols-2">
          {domainTally.map((domain) => (
            <li key={domain.id} className="flex justify-between text-sm">
              <span className="text-ink-400">
                {domain.name} <span className="text-xs">({domain.weight}%)</span>
              </span>
              <span className={domain.missed ? 'text-bad' : 'text-good'}>
                {domain.missed} missed
              </span>
            </li>
          ))}
        </ul>
      </section>

      {missed.length === 0 ? (
        <p className="rounded-xl border border-good/40 bg-good/5 p-6 text-center text-good">
          Clean sweep — nothing missed on this attempt.
        </p>
      ) : (
        <section className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-400">
              What to study next
            </h2>
            <Link
              to={`/session?mode=drill&ids=${result.missed.join(',')}`}
              className="rounded-lg bg-aws px-4 py-2 text-sm font-semibold text-ink-950"
            >
              Drill these {missed.length}
            </Link>
          </div>

          {ordered.map(([key, group]) => (
            <article key={key} className="rounded-xl border border-ink-800 bg-ink-900 p-6">
              <header className="mb-4 border-b border-ink-800 pb-4">
                {key === UNTAGGED ? (
                  <p className="font-semibold text-white">Not yet categorised</p>
                ) : (
                  <a
                    href={taskStatementUrl(key as TaskStatementId)}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-white hover:text-aws"
                  >
                    <span className="font-mono text-sm text-ink-400">{key}</span>{' '}
                    {TASK_STATEMENTS[key as TaskStatementId]}
                  </a>
                )}
                <p className="mt-1 text-sm text-ink-400">
                  {group.length} missed — read this section of the exam guide.
                </p>
              </header>

              <ul className="flex flex-col gap-5">
                {group.map((question) => {
                  const answer = effectiveAnswer(state, question.id, question.answer);
                  const attempt = state.questions[question.id]?.attempts.at(-1);
                  const picked = attempt?.selected ?? [];

                  return (
                    <li key={question.id} className="text-sm">
                      <p className="mb-2 text-ink-200">{question.stem}</p>
                      <p className="text-bad">
                        You chose {picked.length ? picked.join(', ') : '—'}
                        {picked.map((letter) => ` · ${question.options[letter]}`).join('')}
                      </p>
                      <p className="text-good">
                        Correct {answer.join(', ')}
                        {answer.map((letter) => ` · ${question.options[letter]}`).join('')}
                      </p>
                      {question.explanation ? (
                        <div className="mt-2 rounded-lg border border-ink-700 bg-ink-800/60 p-4">
                          <p className="mb-2 text-xs uppercase tracking-wide text-aws">
                            {question.explanation.concept}
                          </p>
                          <p className="text-ink-200">{question.explanation.correct}</p>
                          {picked.map((letter) =>
                            question.explanation?.distractors[letter] ? (
                              <p key={letter} className="mt-2 text-ink-400">
                                <span className="font-mono text-xs text-bad">{letter}</span>{' '}
                                {question.explanation.distractors[letter]}
                              </p>
                            ) : null,
                          )}
                        </div>
                      ) : (
                        <p className="mt-2 text-xs text-ink-400">Explanation not written yet.</p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
