const STORAGE_KEY = 'aws-quiz.session.v1';

export interface SavedSession {
  version: 1;
  search: string;
  seed: number;
  index: number;
  selected: Record<string, string[]>;
  revealed: Record<string, boolean>;
  startedAt: number;
  deadlineAt: number | null;
}

export function loadSession(search: string): SavedSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedSession;
    if (parsed.version !== 1 || parsed.search !== search) return null;
    if (parsed.deadlineAt !== null && parsed.deadlineAt <= Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveSession(session: SavedSession): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    return;
  }
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function answeredCountIn(session: SavedSession): number {
  return Object.values(session.selected).filter((picks) => picks.length > 0).length;
}
