import { useRef } from 'react';
import { useProgress } from 'src/store/ProgressContext';

export function SettingsPage() {
  const { state, updateSettings, exportProgress, importProgress, clearAll } = useProgress();
  const fileInput = useRef<HTMLInputElement>(null);

  const handleImport = async (file: File) => {
    try {
      importProgress(await file.text());
    } catch (error) {
      alert(`Could not import that file: ${(error as Error).message}`);
    }
  };

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <section className="rounded-xl border border-ink-800 bg-ink-900 p-6">
        <h2 className="mb-4 font-semibold text-white">Mock exams</h2>
        <label className="flex items-center justify-between gap-4 text-sm">
          <span className="text-ink-200">Time limit (minutes)</span>
          <input
            type="number"
            min={5}
            max={240}
            value={state.settings.mockDurationMinutes}
            onChange={(event) =>
              updateSettings({ mockDurationMinutes: Number(event.target.value) || 90 })
            }
            className="w-24 rounded-lg border border-ink-800 bg-ink-950 px-3 py-2 text-right text-ink-200"
          />
        </label>
      </section>

      <section className="rounded-xl border border-ink-800 bg-ink-900 p-6">
        <h2 className="mb-4 font-semibold text-white">Drill</h2>
        {[
          { key: 'shuffleDrillQuestions' as const, label: 'Shuffle question order' },
          { key: 'shuffleDrillOptions' as const, label: 'Shuffle answer options' },
        ].map((option) => (
          <label key={option.key} className="flex items-center justify-between gap-4 py-2 text-sm">
            <span className="text-ink-200">{option.label}</span>
            <input
              type="checkbox"
              checked={state.settings[option.key]}
              onChange={(event) => updateSettings({ [option.key]: event.target.checked })}
              className="size-4 accent-[var(--color-aws)]"
            />
          </label>
        ))}
        <p className="mt-2 text-xs text-ink-400">
          Mock exams always use the authored order so an attempt is reproducible.
        </p>
      </section>

      <section className="rounded-xl border border-ink-800 bg-ink-900 p-6">
        <h2 className="mb-4 font-semibold text-white">Your data</h2>
        <p className="mb-4 text-sm text-ink-400">
          Progress lives in this browser's localStorage. Export it to move devices or keep a backup.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={exportProgress}
            className="rounded-lg border border-ink-700 px-4 py-2 text-sm text-ink-200 hover:border-aws"
          >
            Export progress
          </button>
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="rounded-lg border border-ink-700 px-4 py-2 text-sm text-ink-200 hover:border-aws"
          >
            Import progress
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleImport(file);
              event.target.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => {
              if (confirm('Delete all attempts, retries and answer-key overrides?')) clearAll();
            }}
            className="rounded-lg border border-ink-700 px-4 py-2 text-sm text-ink-400 hover:border-bad hover:text-bad"
          >
            Reset everything
          </button>
        </div>
        {Object.keys(state.overrides).length > 0 && (
          <p className="mt-4 text-xs text-ink-400">
            You have overridden {Object.keys(state.overrides).length} answer key(s).
          </p>
        )}
      </section>
    </div>
  );
}
