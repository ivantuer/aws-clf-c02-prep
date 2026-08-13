import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useProgress } from 'src/store/ProgressContext';
import { QuestionCard } from 'src/components/QuestionCard';
import { optionOrder, questionsForExam, selectDrill, shuffle } from 'src/lib/session';
import { effectiveAnswer, isCorrect, makeAttempt } from 'src/store/progress';
import { clearSession, loadSession, saveSession } from 'src/store/session-store';
import type { DomainId, TaskStatementId } from 'src/data/taxonomy';
import type { Question } from 'src/data/types';

function useCountdown(deadlineAt: number | null, onExpire: () => void) {
  const [remaining, setRemaining] = useState(() =>
    deadlineAt === null ? 0 : deadlineAt - Date.now(),
  );
  const expired = useRef(false);
  const expire = useRef(onExpire);

  useEffect(() => {
    expire.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (deadlineAt === null) return;
    const tick = () => {
      const left = deadlineAt - Date.now();
      setRemaining(left);
      if (left <= 0 && !expired.current) {
        expired.current = true;
        expire.current();
      }
    };
    tick();
    const timer = setInterval(tick, 250);
    return () => clearInterval(timer);
  }, [deadlineAt]);

  return Math.max(0, remaining);
}

function formatClock(ms: number): string {
  const total = Math.floor(ms / 1000);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export function Session() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { questions, state, answerQuestion, finishExam, overrideAnswer } = useProgress();

  const mode = params.get('mode') === 'mock' ? 'mock' : 'drill';
  const exam = params.get('exam') ? Number(params.get('exam')) : undefined;
  const search = params.toString();
  const [restored] = useState(() => loadSession(search));
  const [seed] = useState(() => restored?.seed ?? Date.now());

  const pool = useMemo(() => {
    if (mode === 'mock' && exam) return questionsForExam(questions, exam);
    const selected = selectDrill(questions, state, {
      exam,
      registryOnly: params.get('registry') === '1',
      unseenOnly: params.get('unseen') === '1',
      domain: params.get('domain') ? (Number(params.get('domain')) as DomainId) : undefined,
      task: (params.get('task') as TaskStatementId) ?? undefined,
      ids: params.get('ids')?.split(',').filter(Boolean),
    });
    return state.settings.shuffleDrillQuestions ? shuffle(selected, seed) : selected;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, exam, params, questions, seed]);

  const [index, setIndex] = useState(restored?.index ?? 0);
  const [selected, setSelected] = useState<Record<string, string[]>>(restored?.selected ?? {});
  const [revealed, setRevealed] = useState<Record<string, boolean>>(restored?.revealed ?? {});
  const [startedAt] = useState(() => restored?.startedAt ?? Date.now());
  const [deadlineAt] = useState(() => {
    if (mode !== 'mock') return null;
    return restored?.deadlineAt ?? Date.now() + state.settings.mockDurationMinutes * 60_000;
  });

  useEffect(() => {
    if (pool.length > 0 && index > pool.length - 1) setIndex(pool.length - 1);
  }, [index, pool.length]);

  useEffect(() => {
    saveSession({
      version: 1,
      search,
      seed,
      index,
      selected,
      revealed,
      startedAt,
      deadlineAt,
    });
  }, [search, seed, index, selected, revealed, startedAt, deadlineAt]);

  const shuffleOptions = mode === 'drill' && state.settings.shuffleDrillOptions;
  const current: Question | undefined = pool[index];

  const submitMock = useMemo(
    () => () => {
      if (!exam) return;
      const missed: string[] = [];
      let score = 0;
      for (const question of pool) {
        const answer = effectiveAnswer(state, question.id, question.answer);
        const picks = selected[question.id] ?? [];
        const correct = isCorrect(picks, answer);
        if (correct) score += 1;
        else missed.push(question.id);
        answerQuestion(question.id, makeAttempt(picks, answer, 'mock', exam));
      }
      finishExam(exam, {
        at: Date.now(),
        score,
        total: pool.length,
        durationMs: Date.now() - startedAt,
        missed,
      });
      clearSession();
      navigate(`/recap/${exam}`);
    },
    [exam, pool, selected, state, answerQuestion, finishExam, navigate, startedAt],
  );

  const remaining = useCountdown(deadlineAt, submitMock);

  if (pool.length === 0) {
    return (
      <div className="rounded-xl border border-ink-800 bg-ink-900 p-8 text-center">
        <p className="text-ink-200">Nothing matches that filter.</p>
        <Link to="/" className="mt-3 inline-block text-sm text-aws underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  if (!current) return null;

  const answer = effectiveAnswer(state, current.id, current.answer);
  const picks = selected[current.id] ?? [];
  const isRevealed = mode === 'drill' && Boolean(revealed[current.id]);
  const order = optionOrder(current, shuffleOptions, seed + index);

  const toggle = (letter: string) => {
    if (isRevealed) return;
    setSelected((currentPicks) => {
      const existing = currentPicks[current.id] ?? [];
      if (answer.length === 1) return { ...currentPicks, [current.id]: [letter] };
      const next = existing.includes(letter)
        ? existing.filter((item) => item !== letter)
        : [...existing, letter];
      if (next.length > answer.length) return currentPicks;
      return { ...currentPicks, [current.id]: next };
    });
  };

  const submitDrill = () => {
    setRevealed((current_) => ({ ...current_, [current.id]: true }));
    answerQuestion(current.id, makeAttempt(picks, answer, 'drill', exam));
  };

  const answeredCount = pool.filter((question) => (selected[question.id] ?? []).length).length;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-800 bg-ink-900 px-5 py-3 text-sm">
        <div className="flex items-center gap-3">
          <span className="text-white">
            {mode === 'mock' ? `Mock exam ${exam}` : 'Drill'}
          </span>
          <span className="text-ink-400">
            Question {index + 1} of {pool.length}
          </span>
        </div>
        <div className="flex items-center gap-4">
          {mode === 'mock' && (
            <>
              <span className="text-ink-400">{answeredCount} answered</span>
              <span
                className={`font-mono ${remaining < 5 * 60_000 ? 'text-bad' : 'text-ink-200'}`}
              >
                {formatClock(remaining)}
              </span>
            </>
          )}
          <Link to="/" className="text-ink-400 underline hover:text-aws">
            Exit
          </Link>
        </div>
      </header>

      <QuestionCard
        question={current}
        order={order}
        selected={picks}
        answer={answer}
        revealed={isRevealed}
        onToggle={toggle}
        onOverride={isRevealed ? (value) => overrideAnswer(current.id, value) : undefined}
        overridden={Boolean(state.overrides[current.id])}
      />

      <footer className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          disabled={index === 0}
          onClick={() => setIndex((value) => value - 1)}
          className="rounded-lg border border-ink-700 px-4 py-2 text-sm text-ink-200 disabled:opacity-30"
        >
          Previous
        </button>

        <div className="flex items-center gap-3">
          {mode === 'drill' && !isRevealed && (
            <button
              type="button"
              disabled={picks.length !== answer.length}
              onClick={submitDrill}
              className="rounded-lg bg-aws px-4 py-2 text-sm font-semibold text-ink-950 disabled:opacity-30"
            >
              Check answer
            </button>
          )}
          {index < pool.length - 1 ? (
            <button
              type="button"
              onClick={() => setIndex((value) => value + 1)}
              className="rounded-lg border border-ink-700 px-4 py-2 text-sm text-ink-200"
            >
              Next
            </button>
          ) : (
            mode === 'mock' && (
              <button
                type="button"
                onClick={submitMock}
                className="rounded-lg bg-aws px-4 py-2 text-sm font-semibold text-ink-950"
              >
                Submit exam
              </button>
            )
          )}
        </div>
      </footer>
    </div>
  );
}
