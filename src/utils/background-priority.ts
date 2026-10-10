// User-requested generation takes priority over queued note analysis. This
// changes scheduling only; jobs and embedding results are retained.
let foregroundCount = 0;
const waiters = new Set<() => void>();
let editingTimer: ReturnType<typeof setTimeout> | null = null;
let releaseEditing: (() => void) | null = null;

/** Pause analysis between model batches while either collaborator is editing. */
export function prioritizeEditing(): void {
  if (!releaseEditing) releaseEditing = prioritizeForegroundGeneration();
  if (editingTimer) clearTimeout(editingTimer);
  editingTimer = setTimeout(() => {
    editingTimer = null;
    releaseEditing?.();
    releaseEditing = null;
  }, 1500);
}

export function prioritizeForegroundGeneration(): () => void {
  foregroundCount++;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    foregroundCount--;
    if (foregroundCount === 0) {
      for (const resolve of waiters) resolve();
      waiters.clear();
    }
  };
}

export async function waitForForegroundGeneration(): Promise<void> {
  while (foregroundCount > 0) await new Promise<void>(resolve => waiters.add(resolve));
}
