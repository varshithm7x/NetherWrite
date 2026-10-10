// User-requested generation takes priority over queued note analysis. This
// changes scheduling only; jobs and embedding results are retained.
let foregroundCount = 0;
const waiters = new Set<() => void>();

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
