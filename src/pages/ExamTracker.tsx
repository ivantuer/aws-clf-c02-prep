import { Link, useParams } from 'react-router-dom';
import { useProgress } from 'src/store/ProgressContext';
import { questionsForExam, positionIn } from 'src/lib/session';
import { TASK_STATEMENTS } from 'src/data/taxonomy';
import type { TaskStatementId } from 'src/data/taxonomy';

export function ExamTracker() {
  const { exam: examParam } = useParams();
  const exam = Number(examParam);
  const { questions, state, clearExam } = useProgress();

  const examQuestions = questionsForExam(questions, exam);
  const results = state.examResults[exam] ?? [];

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">Exam {exam}</h1>
          <p className="text-sm text-ink-400">
            {examQuestions.length} questions
            {results.length > 0 &&
              ` · ${results.length} attempt${results.length > 1 ? 's' : ''} · best ${Math.max(
                ...results.map((result) => Math.round((result.score / result.total) * 100)),
              )}%`}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/session?mode=mock&exam=${exam}`}
            className="rounded-lg bg-aws px-4 py-2 text-sm font-semibold text-ink-950"
          >
            Start mock
          </Link>
          <Link
            to={`/session?mode=drill&exam=${exam}`}
            className="rounded-lg border border-ink-700 px-4 py-2 text-sm text-ink-200 hover:border-aws"
          >
            Drill
          </Link>
          {results.length > 0 && (
            <Link
              to={`/recap/${exam}`}
              className="rounded-lg border border-ink-700 px-4 py-2 text-sm text-ink-200 hover:border-aws"
            >
              Last recap
            </Link>
          )}
          <button
            type="button"
            onClick={() => {
              if (
                confirm(
                  `Reset exam ${exam}? Questions shared with other exams keep their history.`,
                )
              )
                clearExam(exam);
            }}
            className="rounded-lg border border-ink-700 px-4 py-2 text-sm text-ink-400 hover:border-bad hover:text-bad"
          >
            Reset
          </button>
        </div>
      </header>

      <div className="overflow-x-auto rounded-xl border border-ink-800 bg-ink-900">
        <table className="w-full min-w-[46rem] text-left text-sm">
          <thead className="border-b border-ink-800 text-xs uppercase tracking-wide text-ink-400">
            <tr>
              <th className="p-3">#</th>
              <th className="p-3">Question</th>
              <th className="p-3">Task</th>
              <th className="p-3">Last</th>
              <th className="p-3">Tries</th>
              <th className="p-3">Retry</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-800">
            {examQuestions.map((question) => {
              const progress = state.questions[question.id];
              const last = progress?.attempts.at(-1);
              const repeated = question.occurrences.length > 1;

              return (
                <tr key={question.id} className="align-top">
                  <td className="p-3 font-mono text-xs text-ink-400">
                    {positionIn(question, exam)}
                  </td>
                  <td className="p-3">
                    <Link
                      to={`/session?mode=drill&ids=${question.id}`}
                      className="text-ink-200 hover:text-aws"
                    >
                      {question.stem.slice(0, 90)}
                      {question.stem.length > 90 && '…'}
                    </Link>
                    <span className="mt-1 flex gap-2 text-xs text-ink-400">
                      {repeated && <span>also in {question.occurrences.length - 1} other exam(s)</span>}
                      {question.needsReview && <span className="text-warn">key disputed</span>}
                      {question.outdated && <span>possibly out of scope</span>}
                      {!question.explanation && <span>explanation pending</span>}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-ink-400">
                    {question.taskStatement
                      ? `${question.taskStatement} ${TASK_STATEMENTS[question.taskStatement as TaskStatementId]}`
                      : '—'}
                  </td>
                  <td className="p-3">
                    {!last ? (
                      <span className="text-ink-400">unseen</span>
                    ) : (
                      <span className={last.correct ? 'text-good' : 'text-bad'}>
                        {last.correct ? 'correct' : 'wrong'}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-ink-400">{progress?.attempts.length ?? 0}</td>
                  <td className="p-3">
                    {progress?.inRegistry ? (
                      <span className="text-warn">yes ({progress.streak}/2)</span>
                    ) : (
                      <span className="text-ink-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
