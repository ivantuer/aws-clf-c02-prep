import { Link } from 'react-router-dom';
import { useProgress } from 'src/store/ProgressContext';
import { domainAccuracy, overallProgress, registryIds, taskAccuracy } from 'src/store/stats';
import { AccuracyBar } from 'src/components/AccuracyBar';
import { questionsForExam } from 'src/lib/session';

export function Dashboard() {
  const { questions, state, examCount } = useProgress();

  const overall = overallProgress(questions, state);
  const domains = domainAccuracy(questions, state);
  const tasks = taskAccuracy(questions, state).filter((task) => task.seen > 0);
  const registry = registryIds(state);
  const annotated = questions.filter((question) => question.explanation).length;

  return (
    <div className="flex flex-col gap-8">
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Questions seen', value: `${overall.seen}/${overall.total}` },
          {
            label: 'Accuracy',
            value: overall.ratio === null ? '—' : `${Math.round(overall.ratio * 100)}%`,
          },
          { label: 'To retry', value: String(registry.length) },
          { label: 'Explained', value: `${annotated}/${questions.length}` },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-ink-800 bg-ink-900 p-4">
            <p className="text-xs text-ink-400">{stat.label}</p>
            <p className="mt-1 text-2xl font-semibold text-white">{stat.value}</p>
          </div>
        ))}
      </section>

      {registry.length > 0 && (
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-aws/40 bg-aws/5 p-5">
          <div>
            <p className="font-semibold text-white">{registry.length} questions need another look</p>
            <p className="text-sm text-ink-400">
              Each one clears after 2 correct answers in a row.
            </p>
          </div>
          <Link
            to="/session?mode=drill&registry=1"
            className="rounded-lg bg-aws px-4 py-2 text-sm font-semibold text-ink-950"
          >
            Drill these now
          </Link>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-400">
          Weakest task statements
        </h2>
        {tasks.length === 0 ? (
          <p className="rounded-xl border border-ink-800 bg-ink-900 p-5 text-sm text-ink-400">
            Answer some questions and your weak areas will surface here, weakest first.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-ink-800 overflow-hidden rounded-xl border border-ink-800 bg-ink-900">
            {tasks.slice(0, 8).map((task) => (
              <li key={task.task} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <Link
                  to={`/session?mode=drill&task=${task.task}`}
                  className="text-sm text-ink-200 hover:text-aws"
                >
                  <span className="font-mono text-xs text-ink-400">{task.task}</span> {task.label}
                </Link>
                <AccuracyBar ratio={task.ratio} seen={task.seen} total={task.total} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-400">
          Domains
        </h2>
        <ul className="flex flex-col divide-y divide-ink-800 overflow-hidden rounded-xl border border-ink-800 bg-ink-900">
          {domains.map((domain) => (
            <li key={domain.domain} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <Link
                to={`/session?mode=drill&domain=${domain.domain}`}
                className="text-sm text-ink-200 hover:text-aws"
              >
                {domain.label}{' '}
                <span className="text-xs text-ink-400">({domain.weight}% of exam)</span>
              </Link>
              <AccuracyBar ratio={domain.ratio} seen={domain.seen} total={domain.total} />
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-400">
          Practice exams
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: examCount }, (_, index) => index + 1).map((exam) => {
            const examQuestions = questionsForExam(questions, exam);
            const seen = examQuestions.filter((question) => state.questions[question.id]?.attempts.length).length;
            const results = state.examResults[exam] ?? [];
            const last = results.at(-1);

            return (
              <li
                key={exam}
                className="flex items-center justify-between gap-3 rounded-xl border border-ink-800 bg-ink-900 p-4"
              >
                <div>
                  <Link to={`/exam/${exam}`} className="font-semibold text-white hover:text-aws">
                    Exam {exam}
                  </Link>
                  <p className="text-xs text-ink-400">
                    {seen}/{examQuestions.length} seen
                    {last && ` · last score ${Math.round((last.score / last.total) * 100)}%`}
                  </p>
                </div>
                <Link
                  to={`/session?mode=mock&exam=${exam}`}
                  className="rounded-lg border border-ink-700 px-3 py-1.5 text-xs text-ink-200 hover:border-aws hover:text-aws"
                >
                  Start mock
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
