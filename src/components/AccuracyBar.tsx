interface AccuracyBarProps {
  ratio: number | null;
  seen: number;
  total: number;
}

function tone(ratio: number | null): string {
  if (ratio === null) return 'bg-ink-700';
  if (ratio < 0.6) return 'bg-bad';
  if (ratio < 0.8) return 'bg-warn';
  return 'bg-good';
}

export function AccuracyBar({ ratio, seen, total }: AccuracyBarProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 w-32 shrink-0 overflow-hidden rounded-full bg-ink-800">
        <div
          className={`h-full rounded-full ${tone(ratio)}`}
          style={{ width: `${(ratio ?? 0) * 100}%` }}
        />
      </div>
      <span className="w-28 shrink-0 text-right font-mono text-xs text-ink-400">
        {ratio === null ? 'not started' : `${Math.round(ratio * 100)}% · ${seen}/${total}`}
      </span>
    </div>
  );
}
