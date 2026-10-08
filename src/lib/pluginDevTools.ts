/**
 * Plugin Dev Tools
 *
 * Per-plugin logging, error tracking, and debug utilities.
 * Provides structured log capture for the debug panel.
 */

// ── Log Types ────────────────────────────────────────

export type PluginLogLevel = 'log' | 'warn' | 'error' | 'info' | 'debug';

export interface PluginLogEntry {
  pluginId: string;
  level: PluginLogLevel;
  message: string;
  args: any[];
  timestamp: number;
}

// ── Per-Plugin Logger ────────────────────────────────

const MAX_LOG_ENTRIES = 200;

class PluginLogStore {
  private _logs: Map<string, PluginLogEntry[]> = new Map();
  private _globalLogs: PluginLogEntry[] = [];
  private _listeners: Set<(entry: PluginLogEntry) => void> = new Set();

  push(entry: PluginLogEntry): void {
    // Per-plugin
    let pluginLogs = this._logs.get(entry.pluginId);
    if (!pluginLogs) {
      pluginLogs = [];
      this._logs.set(entry.pluginId, pluginLogs);
    }
    pluginLogs.push(entry);
    if (pluginLogs.length > MAX_LOG_ENTRIES) pluginLogs.shift();

    // Global
    this._globalLogs.push(entry);
    if (this._globalLogs.length > MAX_LOG_ENTRIES * 5) {
      this._globalLogs = this._globalLogs.slice(-MAX_LOG_ENTRIES * 3);
    }

    // Notify listeners
    for (const listener of this._listeners) {
      try { listener(entry); } catch { /* ignore */ }
    }
  }

  getPluginLogs(pluginId: string): PluginLogEntry[] {
    return [...(this._logs.get(pluginId) || [])];
  }

  getAllLogs(): PluginLogEntry[] {
    return [...this._globalLogs];
  }

  clearPlugin(pluginId: string): void {
    this._logs.delete(pluginId);
  }

  clearAll(): void {
    this._logs.clear();
    this._globalLogs = [];
  }

  subscribe(listener: (entry: PluginLogEntry) => void): () => void {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }
}

/** Singleton log store */
export const pluginLogStore = new PluginLogStore();

// ── Plugin Logger (injected into plugin scope) ───────

export class PluginLogger {
  private _pluginId: string;
  private _prefix: string;

  constructor(pluginId: string) {
    this._pluginId = pluginId;
    this._prefix = `[Plugin:${pluginId}]`;
  }

  private _emit(level: PluginLogLevel, args: any[]): void {
    const message = args
      .map(a => typeof a === 'string' ? a : JSON.stringify(a, null, 2))
      .join(' ');

    pluginLogStore.push({
      pluginId: this._pluginId,
      level,
      message,
      args,
      timestamp: Date.now(),
    });

    // Also emit to real console for dev visibility
    const consoleFn = level === 'error' ? console.error
      : level === 'warn' ? console.warn
      : level === 'info' ? console.info
      : level === 'debug' ? console.debug
      : console.log;
    consoleFn(this._prefix, ...args);
  }

  log(...args: any[]): void { this._emit('log', args); }
  info(...args: any[]): void { this._emit('info', args); }
  warn(...args: any[]): void { this._emit('warn', args); }
  error(...args: any[]): void { this._emit('error', args); }
  debug(...args: any[]): void { this._emit('debug', args); }
}

// ── Error Tracker ────────────────────────────────────

export interface PluginErrorRecord {
  pluginId: string;
  error: string;
  stack?: string;
  context: string;
  timestamp: number;
}

class PluginErrorTracker {
  private _errors: Map<string, PluginErrorRecord[]> = new Map();
  private _counts: Map<string, number> = new Map();
  private _listeners: Set<(record: PluginErrorRecord) => void> = new Set();

  record(pluginId: string, error: unknown, context: string): PluginErrorRecord {
    const record: PluginErrorRecord = {
      pluginId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      context,
      timestamp: Date.now(),
    };

    let errors = this._errors.get(pluginId);
    if (!errors) {
      errors = [];
      this._errors.set(pluginId, errors);
    }
    errors.push(record);
    if (errors.length > 50) errors.shift();

    this._counts.set(pluginId, (this._counts.get(pluginId) || 0) + 1);

    // Also log it
    pluginLogStore.push({
      pluginId,
      level: 'error',
      message: `[${context}] ${record.error}`,
      args: [error],
      timestamp: Date.now(),
    });

    for (const listener of this._listeners) {
      try { listener(record); } catch { /* ignore */ }
    }

    return record;
  }

  getErrors(pluginId: string): PluginErrorRecord[] {
    return [...(this._errors.get(pluginId) || [])];
  }

  getErrorCount(pluginId: string): number {
    return this._counts.get(pluginId) || 0;
  }

  resetCount(pluginId: string): void {
    this._counts.set(pluginId, 0);
  }

  clearPlugin(pluginId: string): void {
    this._errors.delete(pluginId);
    this._counts.delete(pluginId);
  }

  subscribe(listener: (record: PluginErrorRecord) => void): () => void {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }
}

/** Singleton error tracker */
export const pluginErrorTracker = new PluginErrorTracker();

// ── Safe Call Utility ────────────────────────────────

const MAX_CONSECUTIVE_ERRORS = 3;

/**
 * Wrap a plugin callback in crash isolation.
 * Returns undefined on failure and records the error.
 * Returns { shouldDisable: true } if plugin exceeded error threshold.
 */
export function safePluginCall<T>(
  pluginId: string,
  fn: () => T,
  context: string,
): { result?: T; error?: string; shouldDisable: boolean } {
  try {
    const result = fn();
    // Successful call → reset consecutive error counter
    pluginErrorTracker.resetCount(pluginId);
    return { result, shouldDisable: false };
  } catch (e) {
    pluginErrorTracker.record(pluginId, e, context);
    const count = pluginErrorTracker.getErrorCount(pluginId);
    return {
      error: e instanceof Error ? e.message : String(e),
      shouldDisable: count >= MAX_CONSECUTIVE_ERRORS,
    };
  }
}

/**
 * Wrap an async plugin callback in crash isolation.
 */
export async function safePluginCallAsync<T>(
  pluginId: string,
  fn: () => Promise<T>,
  context: string,
): Promise<{ result?: T; error?: string; shouldDisable: boolean }> {
  try {
    const result = await fn();
    pluginErrorTracker.resetCount(pluginId);
    return { result, shouldDisable: false };
  } catch (e) {
    pluginErrorTracker.record(pluginId, e, context);
    const count = pluginErrorTracker.getErrorCount(pluginId);
    return {
      error: e instanceof Error ? e.message : String(e),
      shouldDisable: count >= MAX_CONSECUTIVE_ERRORS,
    };
  }
}

// ── Version Utilities ────────────────────────────────

/**
 * Simple semver comparison: is `current` >= `required`?
 * Handles x.y.z format.
 */
export function isVersionCompatible(required: string, current: string): boolean {
  const parse = (v: string): number[] =>
    v.replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);

  const req = parse(required);
  const cur = parse(current);

  for (let i = 0; i < 3; i++) {
    const r = req[i] || 0;
    const c = cur[i] || 0;
    if (c > r) return true;
    if (c < r) return false;
  }
  return true; // equal
}
