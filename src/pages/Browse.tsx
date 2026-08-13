import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useProgress } from 'src/store/ProgressContext';
import { TASK_STATEMENTS, TASK_STATEMENT_IDS } from 'src/data/taxonomy';
import type { TaskStatementId } from 'src/data/taxonomy';

type Status = 'all' | 'unseen' | 'wrong' | 'registry' | 'flagged';

export function Browse() {
  const { questions, state } = useProgress();
  const [query, setQuery] = useState('');
  const [task, setTask] = useState<TaskStatementId | 'all'>('all');
  const [status, setStatus] = useState<Status>('all');

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return questions.filter((question) => {
      const progress = state.questions[question.id];
      const last = progress?.attempts.at(-1);

      if (needle && !question.stem.toLowerCase().includes(needle)) return false;
      if (task !== 'all' && question.taskStatement !== task && question.secondaryTaskStatement !== task)
        return false;
      if (status === 'unseen' && progress?.attempts.length) return false;
      if (status === 'wrong' && (!last || last.correct)) return false;
      if (status === 'registry' && !progress?.inRegistry) return false;
      if (status === 'flagged' && !question.needsReview && !question.outdated) return false;
      return true;
    });
  }, [questions, state, query, task, status]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search all 963 questions…"
          className="min-w-60 flex-1 rounded-lg border border-ink-800 bg-ink-900 px-4 py-2 text-sm text-ink-200 outline-none focus:border-aws"
        />
        <select
          value={task}
          onChange={(event) => setTask(event.target.value as TaskStatementId | 'all')}
          className="rounded-lg border border-ink-800 bg-ink-900 px-3 py-2 text-sm text-ink-200"
        >
          <option value="all">All task statements</option>
          {TASK_STATEMENT_IDS.map((id) => (
            <option key={id} value={id}>
              {id} · {TASK_STATEMENTS[id]}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as Status)}
          className="rounded-lg border border-ink-800 bg-ink-900 px-3 py-2 text-sm text-ink-200"
        >
          <option value="all">Any status</option>
          <option value="unseen">Unseen</option>
          <option value="wrong">Last answer wrong</option>
          <option value="registry">In retry registry</option>
          <option value="flagged">Flagged (key or scope)</option>
        </select>
      </div>

      <div className="flex items-center justify-between text-sm text-ink-400">
        <span>{results.length} questions</span>
        {results.length > 0 && results.length <= 200 && (
          <Link
            to={`/session?mode=drill&ids=${results.map((question) => question.id).join(',')}`}
            className="rounded-lg bg-aws px-4 py-2 text-xs font-semibold text-ink-950"
          >
            Drill these
          </Link>
        )}
      </div>

      <ul className="flex flex-col divide-y divide-ink-800 overflow-hidden rounded-xl border border-ink-800 bg-ink-900">
        {results.slice(0, 100).map((question) => {
          const progress = state.questions[question.id];
          const last = progress?.attempts.at(-1);

          return (
            <li key={question.id} className="p-4">
              <Link
                to={`/session?mode=drill&ids=${question.id}`}
                className="text-sm text-ink-200 hover:text-aws"
              >
                {question.stem}
              </Link>
              <p className="mt-1 flex flex-wrap gap-3 text-xs text-ink-400">
                <span>Exams {question.occurrences.map((entry) => entry.exam).join(', ')}</span>
                {question.taskStatement && <span>{question.taskStatement}</span>}
                {last && (
                  <span className={last.correct ? 'text-good' : 'text-bad'}>
                    last {last.correct ? 'correct' : 'wrong'}
                  </span>
                )}
                {progress?.inRegistry && <span className="text-warn">retry {progress.streak}/2</span>}
              </p>
            </li>
          );
        })}
      </ul>
      {results.length > 100 && (
        <p className="text-center text-xs text-ink-400">Showing first 100 — narrow the filters.</p>
      )}
    </div>
  );
}
