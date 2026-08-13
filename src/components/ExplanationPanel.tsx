import { useState } from 'react';
import type { Question } from 'src/data/types';

interface ExplanationPanelProps {
  question: Question;
  answer: string[];
  onOverride?: (answer: string[] | null) => void;
  overridden?: boolean;
}

export function ExplanationPanel({
  question,
  answer,
  onOverride,
  overridden,
}: ExplanationPanelProps) {
  const [picking, setPicking] = useState(false);
  const [draft, setDraft] = useState<string[]>(answer);
  const explanation = question.explanation;

  const toggleDraft = (letter: string) =>
    setDraft((current) =>
      current.includes(letter) ? current.filter((item) => item !== letter) : [...current, letter],
    );

  return (
    <section className="mt-5 rounded-lg border border-ink-700 bg-ink-800/60 p-5 text-sm">
      {explanation ? (
        <>
          <p className="mb-3 text-xs uppercase tracking-wide text-aws">{explanation.concept}</p>
          <p className="mb-4 leading-relaxed text-ink-200">
            <span className="font-semibold text-good">{answer.join(', ')} — </span>
            {explanation.correct}
          </p>
          {Object.keys(explanation.distractors).length > 0 && (
            <ul className="flex flex-col gap-2 border-t border-ink-700 pt-4">
              {Object.entries(explanation.distractors).map(([letter, reason]) => (
                <li key={letter} className="flex gap-3 text-ink-400">
                  <span className="font-mono text-xs text-bad">{letter}</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <p className="text-ink-400">
          <span className="font-semibold text-good">Correct: {answer.join(', ')}</span>
          {' — '}
          explanation not written yet.
          {question.sourceExplanation && (
            <span className="mt-2 block whitespace-pre-line text-ink-400">
              {question.sourceExplanation}
            </span>
          )}
        </p>
      )}

      {question.references.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-3 border-t border-ink-700 pt-4 text-xs">
          {question.references.map((reference) => (
            <a
              key={reference}
              className="text-ink-400 underline hover:text-aws"
              href={reference}
              target="_blank"
              rel="noreferrer"
            >
              Reference
            </a>
          ))}
        </div>
      )}

      {onOverride && (
        <div className="mt-4 border-t border-ink-700 pt-4 text-xs">
          {picking ? (
            <div className="flex flex-wrap items-center gap-2">
              {Object.keys(question.options).sort().map((letter) => (
                <button
                  key={letter}
                  type="button"
                  onClick={() => toggleDraft(letter)}
                  className={`rounded border px-3 py-1 font-mono ${
                    draft.includes(letter) ? 'border-aws text-aws' : 'border-ink-700 text-ink-400'
                  }`}
                >
                  {letter}
                </button>
              ))}
              <button
                type="button"
                className="rounded bg-aws px-3 py-1 font-semibold text-ink-950"
                onClick={() => {
                  onOverride(draft.length ? [...draft].sort() : null);
                  setPicking(false);
                }}
              >
                Save key
              </button>
              <button
                type="button"
                className="text-ink-400 underline"
                onClick={() => setPicking(false)}
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="text-ink-400 underline hover:text-aws"
                onClick={() => {
                  setDraft(answer);
                  setPicking(true);
                }}
              >
                This key looks wrong — set my own
              </button>
              {overridden && (
                <button
                  type="button"
                  className="text-ink-400 underline hover:text-aws"
                  onClick={() => onOverride(null)}
                >
                  Revert to original key
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
