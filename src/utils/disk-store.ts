/**
 * Disk Store — Unified storage abstraction for .netherwrite/ data
 *
 * In Electron: reads/writes files to .netherwrite/ directory in vault
 * In Browser:  falls back to localStorage with matching API
 *
 * Used by: embeddings, annotations, synthesis, queue
 * All data is stored in JSON format, one file per logical unit.
 */

import { getAPI } from "./api";

const api = getAPI();

// ── Core Operations ──────────────────────────────────────────────────────────

/**
 * Read a JSON file from .netherwrite/<relativePath>
 */
export async function readData<T>(relativePath: string): Promise<T | null> {
  try {
    const raw = await api.dataRead(relativePath);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Write a JSON file to .netherwrite/<relativePath>
 */
export async function writeData<T>(relativePath: string, data: T): Promise<void> {
  try {
    await api.dataWrite(relativePath, JSON.stringify(data));
  } catch (err) {
    console.warn(`[DiskStore] Failed to write ${relativePath}:`, err);
  }
}

/**
 * Delete a file from .netherwrite/<relativePath>
 */
export async function deleteData(relativePath: string): Promise<void> {
  try {
    await api.dataDelete(relativePath);
  } catch { /* silent */ }
}

/**
 * List files in .netherwrite/<subDir>
 */
export async function listData(subDir: string): Promise<string[]> {
  try {
    return await api.dataList(subDir);
  } catch {
    return [];
  }
}

// ── Convenience Wrappers ─────────────────────────────────────────────────────

/**
 * Read a data file with a fallback value if not found.
 */
export async function readDataOr<T>(relativePath: string, fallback: T): Promise<T> {
  const data = await readData<T>(relativePath);
  return data ?? fallback;
}

/**
 * Debounced writer — batches writes to reduce I/O.
 * Returns a function that writes after a delay, coalescing multiple calls.
 */
export function createDebouncedWriter(delayMs = 500): (path: string, data: any) => void {
  const timers = new Map<string, ReturnType<typeof setTimeout>>();

  return (path: string, data: any) => {
    const existing = timers.get(path);
    if (existing) clearTimeout(existing);

    timers.set(
      path,
      setTimeout(() => {
        writeData(path, data);
        timers.delete(path);
      }, delayMs),
    );
  };
}
