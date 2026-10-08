export interface FTUXState {
  notesCount: number;
}

const FTUX_STORAGE_KEY = "netherwrite-ftux";

const DEFAULT_FTUX_STATE: FTUXState = {
  notesCount: 0,
};

export function loadFTUXState(): FTUXState {
  try {
    const raw = localStorage.getItem(FTUX_STORAGE_KEY);
    if (!raw) return DEFAULT_FTUX_STATE;
    const parsed = JSON.parse(raw) as Partial<FTUXState>;
    return {
      notesCount: Number.isFinite(parsed.notesCount)
        ? Math.max(0, parsed.notesCount || 0)
        : 0,
    };
  } catch {
    return DEFAULT_FTUX_STATE;
  }
}

export function saveFTUXState(state: FTUXState): void {
  localStorage.setItem(FTUX_STORAGE_KEY, JSON.stringify(state));
}
