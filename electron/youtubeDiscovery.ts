import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { BrowserWindow, IpcMain, IpcMainInvokeEvent } from 'electron';
import type { CredentialEncryption } from './googleDriveStore.js';

export interface YouTubeStatus { configured: boolean; secureStorage: boolean; sessionOnly?: boolean }
export interface YouTubeSearchResult {
  items: { id: { kind: 'youtube#video'; videoId: string }; snippet: {
    title: string; channelTitle?: string; thumbnails: Record<string, { url: string }>;
  } }[];
}
function record(value: unknown): value is Record<string, unknown> { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function validKey(value: unknown): value is string { return typeof value === 'string' && /^[A-Za-z0-9_-]{20,200}$/.test(value); }
export function validYouTubeQuery(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= 140 && !/[@/\\\r\n\x00-\x1f]/.test(value);
}
export class YouTubeDiscoveryError extends Error {}
/** Personal API keys stay in main; mirror Drive's encrypted storage convention. */
export class YouTubeDiscoveryService {
  private readonly file: string;
  private key: string | null = null;
  private sessionOnly = false;
  private loaded: Promise<void> | null = null;
  private mutations: Promise<unknown> = Promise.resolve();
  constructor(directory: string, private readonly encryption: CredentialEncryption, private readonly request: typeof fetch = fetch) {
    this.file = path.join(directory, 'youtube-discovery-key.enc');
  }
  private available(): boolean { return this.encryption.isEncryptionAvailable() && this.encryption.getSelectedStorageBackend?.() !== 'basic_text'; }
  private load(): Promise<void> {
    if (!this.loaded) this.loaded = (async () => {
      if (!this.available()) return;
      try {
        const key = this.encryption.decryptString(await fs.readFile(this.file));
        if (!validKey(key)) throw new Error('Invalid key');
        this.key = key;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw new YouTubeDiscoveryError('YouTube credentials could not be unlocked. Save your key again.');
      }
    })();
    return this.loaded;
  }
  async status(): Promise<YouTubeStatus> { await this.load(); return { configured: !!this.key, secureStorage: this.available(), ...(this.sessionOnly ? { sessionOnly: true } : {}) }; }
  useKeyForSession(value: unknown): Promise<YouTubeStatus> {
    const next = this.mutations.then(async () => {
      if (!validKey(value)) throw new YouTubeDiscoveryError('Enter a valid YouTube Data API key.');
      await this.load().catch(() => {});
      this.key = value; this.sessionOnly = true; this.loaded = Promise.resolve();
      return this.status();
    });
    this.mutations = next.catch(() => {});
    return next;
  }
  saveKey(value: unknown): Promise<YouTubeStatus> {
    const next = this.mutations.then(async () => {
      if (!validKey(value)) throw new YouTubeDiscoveryError('Enter a valid YouTube Data API key.');
      if (!this.available()) throw new YouTubeDiscoveryError('Secure system credential storage is unavailable. YouTube search remains disabled.');
      await this.load().catch(() => {});
      await fs.mkdir(path.dirname(this.file), { recursive: true, mode: 0o700 });
      const temporary = `${this.file}.${randomUUID()}.tmp`;
      try {
        await fs.writeFile(temporary, this.encryption.encryptString(value), { mode: 0o600, flag: 'wx' });
        await fs.rename(temporary, this.file);
      } catch { throw new YouTubeDiscoveryError('YouTube credentials could not be saved. Please retry.'); }
      finally { await fs.rm(temporary, { force: true }).catch(() => {}); }
      this.key = value; this.sessionOnly = false; this.loaded = Promise.resolve();
      return this.status();
    });
    this.mutations = next.catch(() => {});
    return next;
  }
  disconnect(): Promise<YouTubeStatus> {
    const next = this.mutations.then(async () => {
      await this.load().catch(() => {});
      try { await fs.rm(this.file, { force: true }); }
      catch { throw new YouTubeDiscoveryError('YouTube credentials could not be removed. Please retry.'); }
      this.key = null; this.sessionOnly = false; this.loaded = Promise.resolve();
      return this.status();
    });
    this.mutations = next.catch(() => {});
    return next;
  }
  async search(query: unknown, signal?: AbortSignal): Promise<YouTubeSearchResult> {
    if (!validYouTubeQuery(query)) throw new YouTubeDiscoveryError('Invalid YouTube topic query.');
    await this.mutations; await this.load();
    const key = this.key;
    if (!key || (!this.available() && !this.sessionOnly)) throw new YouTubeDiscoveryError('YouTube discovery is not connected. Save your Data API key first.');
    const controller = new AbortController();
    const abort = () => controller.abort();
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) controller.abort();
    const timeout = setTimeout(abort, 6500);
    try {
      const url = new URL('https://www.googleapis.com/youtube/v3/search');
      url.search = new URLSearchParams({ part: 'snippet', type: 'video', order: 'relevance', maxResults: '3', safeSearch: 'moderate', q: query, key }).toString();
      const response = await this.request(url, { signal: controller.signal, redirect: 'error' });
      if (!response.ok) throw new YouTubeDiscoveryError(response.status === 403 || response.status === 429
        ? 'YouTube rejected the request. Check API access, key restrictions and quota in Google Cloud.'
        : response.status === 400 || response.status === 401 ? 'YouTube rejected your API key. Check YouTube Data API v3 is enabled.' : 'YouTube search is unavailable. Please retry later.');
      if (Number(response.headers.get('content-length') || 0) > 100_000) throw new Error('Oversized response');
      const body = await response.text();
      if (body.length > 100_000 || controller.signal.aborted || this.key !== key) throw new Error('Invalid response');
      const raw: unknown = JSON.parse(body);
      if (!record(raw) || !Array.isArray(raw.items)) throw new Error('Invalid response');
      const items: YouTubeSearchResult['items'] = [];
      for (const item of raw.items.slice(0, 3)) {
        if (!record(item) || !record(item.id) || item.id.kind !== 'youtube#video' || typeof item.id.videoId !== 'string'
          || !/^[\w-]{11}$/.test(item.id.videoId) || !record(item.snippet) || typeof item.snippet.title !== 'string' || !item.snippet.title.trim() || item.snippet.title.length > 500 || item.snippet.title.includes(key)) continue;
        const snippet = item.snippet;
        const thumbnails: Record<string, { url: string }> = {};
        for (const size of ['high', 'medium', 'default']) {
          const candidate = record(snippet.thumbnails) ? snippet.thumbnails[size] : null;
          if (!record(candidate) || typeof candidate.url !== 'string') continue;
          try {
            const image = new URL(candidate.url);
            if (image.protocol === 'https:' && ['i.ytimg.com', 'img.youtube.com'].includes(image.hostname)
              && !image.username && !image.password && !image.port && !image.search && !image.hash
              && new RegExp(`^/vi(?:_webp)?/${item.id.videoId}/[a-zA-Z0-9_-]+\\.(?:jpg|webp)$`).test(image.pathname)) thumbnails[size] = { url: candidate.url };
          } catch { /* Invalid thumbnail falls back in the renderer. */ }
        }
        items.push({ id: { kind: 'youtube#video', videoId: item.id.videoId }, snippet: { title: snippet.title as string, thumbnails,
          ...(typeof snippet.channelTitle === 'string' && snippet.channelTitle.trim() && snippet.channelTitle.length <= 300 && !snippet.channelTitle.includes(key) ? { channelTitle: snippet.channelTitle } : {}) } });
      }
      return { items };
    } catch (error) {
      if (error instanceof YouTubeDiscoveryError) throw error;
      throw new YouTubeDiscoveryError(controller.signal.aborted ? 'YouTube search timed out or was cancelled. Your performance report remains available.' : 'YouTube search is unavailable. Check your connection and retry.');
    } finally { clearTimeout(timeout); signal?.removeEventListener('abort', abort); }
  }
}

export function registerYouTubeDiscoveryIpc(ipc: IpcMain, service: YouTubeDiscoveryService, mainWindow: () => BrowserWindow | null): void {
  const running = new Map<string, AbortController>();
  function owner(event: IpcMainInvokeEvent) {
    const window = mainWindow();
    if (!window || event.sender !== window.webContents || event.senderFrame !== event.sender.mainFrame) throw new YouTubeDiscoveryError('YouTube requests must originate in NetherWrite.');
  }
  const handle = (channel: string, operation: (event: IpcMainInvokeEvent, ...args: unknown[]) => unknown) => {
    ipc.handle(channel, async (event, ...args: unknown[]) => {
      try { owner(event); return await operation(event, ...args); }
      catch (error) { throw new Error(error instanceof YouTubeDiscoveryError ? error.message : 'YouTube could not complete this request. Please retry.'); }
    });
  };
  handle('youtube:status', () => service.status());
  handle('youtube:saveKey', (_event, key) => service.saveKey(typeof key === 'string' ? key.trim() : key));
  handle('youtube:useSessionKey', (_event, key) => service.useKeyForSession(typeof key === 'string' ? key.trim() : key));
  handle('youtube:disconnect', () => { for (const controller of running.values()) controller.abort(); return service.disconnect(); });
  handle('youtube:search', async (_event, query, requestId, consent) => {
    if (consent !== true || typeof requestId !== 'string' || !/^[a-f0-9-]{36}$/.test(requestId) || running.has(requestId) || running.size >= 3) throw new YouTubeDiscoveryError('Invalid YouTube search request.');
    const controller = new AbortController(); running.set(requestId, controller);
    try { return await service.search(query, controller.signal); }
    finally { running.delete(requestId); }
  });
  handle('youtube:cancel', (_event, requestId) => { if (typeof requestId === 'string') running.get(requestId)?.abort(); });
}
