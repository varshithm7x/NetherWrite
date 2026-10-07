/**
 * Disk Store — Unified storage abstraction for .openonyx/ data
 *
 * In Electron: reads/writes files to .openonyx/ directory in vault
 * In Browser:  falls back to localStorage with matching API
 *
 * Used by: embeddings, annotations, synthesis, queue
 * All data is stored in JSON format, one file per logical unit.
 */

import { getAPI } from "./api";

const api = getAPI();

// ── Core Operations ──────────────────────────────────────────────────────────

/**
 * Read a JSON file from .openonyx/<relativePath>
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
 * Write a JSON file to .openonyx/<relativePath>
 */
export async function writeData<T>(relativePath: string, data: T): Promise<void> {
  try {
    await api.dataWrite(relativePath, JSON.stringify(data));
  } catch (err) {
    console.warn(`[DiskStore] Failed to write ${relativePath}:`, err);
  }
}

/**
 * Delete a file from .openonyx/<relativePath>
 */
export async function deleteData(relativePath: string): Promise<void> {
  try {
    await api.dataDelete(relativePath);
  } catch { /* silent */ }
}

/**
 * List files in .openonyx/<subDir>
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
export type DebouncedWriter = ((path: string, data: any) => void) & { flush: () => Promise<void> };

export function createDebouncedWriter(delayMs = 500): DebouncedWriter {
  const timers = new Map<string, ReturnType<typeof setTimeout>>();
  const pending = new Map<string, any>();
  const running = new Set<Promise<void>>();
  const persist = (path: string, data: any) => {
    const task = writeData(path, data); running.add(task);
    void task.finally(() => running.delete(task));
    return task;
  };
  const writer = ((path: string, data: any) => {
    const old = timers.get(path); if (old) clearTimeout(old);
    pending.set(path, data);
    timers.set(path, setTimeout(() => {
      const value = pending.get(path); pending.delete(path); timers.delete(path);
      void persist(path, value);
    }, delayMs));
  }) as DebouncedWriter;
  writer.flush = async () => {
    for (const timer of timers.values()) clearTimeout(timer);
    timers.clear();
    const values = [...pending]; pending.clear();
    await Promise.all([...running, ...values.map(([path, data]) => persist(path, data))]);
  };
  return writer;
}
