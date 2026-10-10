import { afterEach, expect, it, vi } from 'vitest';
import { mkdtemp, readFile, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { YouTubeDiscoveryService, registerYouTubeDiscoveryIpc, validYouTubeQuery } from '../electron/youtubeDiscovery';

const directories: string[] = [];
afterEach(async () => { vi.useRealTimers(); for (const directory of directories.splice(0)) await rm(directory, { recursive: true, force: true }); });
const PERSONAL_KEY = 'test-only-personal-key-123456789';
const item = { id: { kind: 'youtube#video', videoId: 'abcdefghijk' }, snippet: { title: 'Fixture tutorial', channelTitle: 'Fixture channel', thumbnails: { high: { url: 'https://i.ytimg.com/vi/abcdefghijk/hqdefault.jpg' } } } };
async function setup() {
  const directory = await mkdtemp(join(tmpdir(), 'netherwrite-youtube-test-')); directories.push(directory);
  const key = randomBytes(32);
  const encryption = {
    isEncryptionAvailable: () => true, getSelectedStorageBackend: () => 'gnome_libsecret',
    encryptString: (value: string) => { const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', key, iv); return Buffer.concat([iv, cipher.update(value, 'utf8'), cipher.final(), cipher.getAuthTag()]); },
    decryptString: (value: Buffer) => { const cipher = createDecipheriv('aes-256-gcm', key, value.subarray(0, 12)); cipher.setAuthTag(value.subarray(-16)); return Buffer.concat([cipher.update(value.subarray(12, -16)), cipher.final()]).toString('utf8'); },
  };
  const request = vi.fn().mockResolvedValue(new Response(JSON.stringify({ items: [item] }), { status: 200 }));
  const service = new YouTubeDiscoveryService(directory, encryption, request);
  return { directory, encryption, request, service };
}
it('encrypts a personal key, exposes only status and reopens it after restart', async () => {
  const { directory, service, encryption, request } = await setup();
  expect(await service.status()).toEqual({ configured: false, secureStorage: true });
  expect(await service.saveKey(PERSONAL_KEY)).toEqual({ configured: true, secureStorage: true });
  expect((await readFile(join(directory, 'youtube-discovery-key.enc'))).includes(Buffer.from(PERSONAL_KEY))).toBe(false);
  expect(await new YouTubeDiscoveryService(directory, encryption, request).status()).toEqual({ configured: true, secureStorage: true });
  expect(request).not.toHaveBeenCalled();
});
it('refuses plaintext fallback and invalid credentials', async () => {
  const { directory, encryption, request } = await setup();
  const service = new YouTubeDiscoveryService(directory, { ...encryption, getSelectedStorageBackend: () => 'basic_text' }, request);
  await expect(service.saveKey(PERSONAL_KEY)).rejects.toThrow('Secure system');
  expect(await readdir(directory)).toEqual([]);
  await expect(service.saveKey('bad key\n')).rejects.toThrow('valid YouTube');
  expect(request).not.toHaveBeenCalled();
});
it('supports explicit session credentials without writing any key to disk or retaining it after restart', async () => {
  const { directory, encryption, request } = await setup();
  const unavailable = { ...encryption, getSelectedStorageBackend: () => 'basic_text' };
  const service = new YouTubeDiscoveryService(directory, unavailable, request);
  expect(await service.useKeyForSession(PERSONAL_KEY)).toEqual({ configured: true, secureStorage: false, sessionOnly: true });
  expect(await readdir(directory)).toEqual([]);
  expect((await service.search('Deadlocks tutorial')).items).toHaveLength(1);
  const restarted = new YouTubeDiscoveryService(directory, unavailable, request);
  expect(await restarted.status()).toEqual({ configured: false, secureStorage: false });
  await service.disconnect(); expect(await service.status()).toEqual({ configured: false, secureStorage: false });
  expect(await readdir(directory)).toEqual([]);
});
it('disconnects permanently without touching saved artifacts', async () => {
  const { service, directory, encryption, request } = await setup();
  await service.saveKey(PERSONAL_KEY); await service.disconnect();
  expect(await new YouTubeDiscoveryService(directory, encryption, request).status()).toEqual({ configured: false, secureStorage: true });
  expect(await readdir(directory)).toEqual([]);
});
it('searches the fixed supported API with bounded video-only parameters and returns sanitized metadata', async () => {
  const { service, request } = await setup(); await service.saveKey(PERSONAL_KEY);
  request.mockResolvedValue(new Response(JSON.stringify({ key: PERSONAL_KEY, privateResponse: 'discard', items: [{ ...item, extra: PERSONAL_KEY, snippet: { ...item.snippet, description: PERSONAL_KEY } }] })));
  const result = await service.search('Deadlocks tutorial');
  const url = new URL(request.mock.calls[0][0]);
  expect(url.origin + url.pathname).toBe('https://www.googleapis.com/youtube/v3/search');
  expect(Object.fromEntries(url.searchParams)).toMatchObject({ q: 'Deadlocks tutorial', key: PERSONAL_KEY, part: 'snippet', type: 'video', maxResults: '3' });
  expect(request.mock.calls[0][1].redirect).toBe('error');
  expect(result).toEqual({ items: [item] }); expect(JSON.stringify(result)).not.toContain(PERSONAL_KEY);
});
it.each(['', '@private/person', '../note.md', 'https://private.test', 'mail@example.test', 'query\nprivate', 'x'.repeat(141)])('rejects unsafe or oversized query %j without a network call', async query => {
  const { service, request } = await setup(); expect(validYouTubeQuery(query)).toBe(false);
  await expect(service.search(query)).rejects.toThrow('Invalid'); expect(request).not.toHaveBeenCalled();
});
it('does not make requests without a configured key', async () => {
  const { service, request } = await setup(); await expect(service.search('Deadlocks tutorial')).rejects.toThrow('not connected'); expect(request).not.toHaveBeenCalled();
});
it.each([400, 401, 403, 429, 500])('sanitizes YouTube error responses for status %i', async status => {
  const { service, request } = await setup(); await service.saveKey(PERSONAL_KEY);
  request.mockResolvedValue(new Response(PERSONAL_KEY, { status }));
  try { await service.search('Deadlocks tutorial'); expect.fail('Expected error'); }
  catch (error) { expect((error as Error).message).not.toContain(PERSONAL_KEY); expect((error as Error).message).toContain('YouTube'); }
});
it('sanitizes network errors that might contain the request URL and key', async () => {
  const { service, request } = await setup(); await service.saveKey(PERSONAL_KEY);
  request.mockRejectedValue(new Error(`fetch failed?key=${PERSONAL_KEY}`));
  await expect(service.search('Deadlocks tutorial')).rejects.toThrow('Check your connection');
});
it('drops malformed IDs and unsafe thumbnails without synthesizing image URLs', async () => {
  const { service, request } = await setup(); await service.saveKey(PERSONAL_KEY);
  request.mockResolvedValue(new Response(JSON.stringify({ items: [{ ...item, id: { videoId: 'invalid' } }, { ...item, snippet: { ...item.snippet, thumbnails: { high: { url: 'https://evil.test/private.jpg' } } } }] })));
  const result = await service.search('Deadlocks tutorial'); expect(result.items).toHaveLength(1); expect(result.items[0].snippet.thumbnails).toEqual({});
});
it('does not expose credentials even if unexpected provider metadata echoes them', async () => {
  const { service, request } = await setup(); await service.saveKey(PERSONAL_KEY);
  request.mockResolvedValue(new Response(JSON.stringify({ items: [
    { ...item, snippet: { ...item.snippet, title: PERSONAL_KEY } },
    { ...item, snippet: { ...item.snippet, channelTitle: PERSONAL_KEY } },
  ] })));
  const result = await service.search('Deadlocks tutorial');
  expect(result.items).toHaveLength(1); expect(JSON.stringify(result)).not.toContain(PERSONAL_KEY);
});
it('bounds response size and handles invalid JSON', async () => {
  const { service, request } = await setup(); await service.saveKey(PERSONAL_KEY);
  request.mockResolvedValueOnce(new Response('x'.repeat(100001))).mockResolvedValueOnce(new Response('invalid json'));
  await expect(service.search('Deadlocks tutorial')).rejects.toThrow('unavailable');
  await expect(service.search('Deadlocks tutorial')).rejects.toThrow('unavailable');
});
it('cancels searches and bounds native timeouts', async () => {
  const { service, request } = await setup(); await service.saveKey(PERSONAL_KEY);
  request.mockImplementation((_url, options) => new Promise((_resolve, reject) => { options.signal.addEventListener('abort', () => reject(new Error('Cancelled'))); }));
  vi.useFakeTimers(); const pending = service.search('Deadlocks tutorial');
  const checked = expect(pending).rejects.toThrow('timed out or was cancelled');
  await vi.advanceTimersByTimeAsync(6501); await checked;
});
function ipcSetup() {
  const handlers = new Map<string, (...args: any[]) => Promise<any>>();
  const frame = {}, sender = { mainFrame: frame }, event = { sender, senderFrame: frame };
  const service = { status: vi.fn(async () => ({ configured: true, secureStorage: true })), saveKey: vi.fn(), disconnect: vi.fn(), search: vi.fn(async () => ({ items: [] })) };
  registerYouTubeDiscoveryIpc({ handle: (channel: string, handler: any) => handlers.set(channel, handler) } as any, service as unknown as YouTubeDiscoveryService, () => ({ webContents: sender }) as any);
  return { handlers, event, service };
}
it('requires the owning main frame, explicit search consent and safe request identities', async () => {
  const { handlers, event, service } = ipcSetup(); const id = '12345678-1234-1234-1234-123456789abc';
  await expect(handlers.get('youtube:status')!({ ...event, senderFrame: {} })).rejects.toThrow('must originate');
  await expect(handlers.get('youtube:search')!(event, 'Deadlocks tutorial', id, false)).rejects.toThrow('Invalid');
  await expect(handlers.get('youtube:search')!(event, 'Deadlocks tutorial', '../id', true)).rejects.toThrow('Invalid');
  expect(service.search).not.toHaveBeenCalled();
  await handlers.get('youtube:search')!(event, 'Deadlocks tutorial', id, true);
  expect(service.search).toHaveBeenCalledWith('Deadlocks tutorial', expect.any(AbortSignal));
});
it('cancels an IPC search and does not expose arbitrary provider exceptions', async () => {
  const { handlers, event, service } = ipcSetup(); const id = '12345678-1234-1234-1234-123456789abc';
  service.search.mockImplementation((_query, signal) => new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new Error(PERSONAL_KEY)))));
  const pending = handlers.get('youtube:search')!(event, 'Deadlocks tutorial', id, true);
  const checked = expect(pending).rejects.toThrow('YouTube could not complete');
  await handlers.get('youtube:cancel')!(event, id); await checked;
});
