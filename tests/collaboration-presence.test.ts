// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { collaborationEngine } from '../src/lib/collaborationEngine';

const mocks = vi.hoisted(() => ({ unlock: vi.fn(), channel: vi.fn() }));
vi.mock('../src/lib/supabase', () => ({ supabase: { removeChannel: vi.fn(), getChannels: () => [], channel: mocks.channel } }));
vi.mock('../src/lib/auth', () => ({ authManager: { getState: () => ({ session: null }), getUserId: () => 'me', getUser: () => ({ id: 'me', email: 'me@example.org' }) } }));
vi.mock('../src/lib/localdb', () => ({ localDB: { getClientId: async () => 'local-client' } }));
vi.mock('../src/lib/syncEngine', () => ({ normalizeSyncPath: (path: string) => path, hasYjsSnapshot: async () => false }));
vi.mock('../src/lib/yDocManager', () => ({ yDocManager: {} }));
vi.mock('../src/lib/privateCrypto', () => ({ privateCrypto: { ensureSpaceUnlocked: mocks.unlock }, isPrivateCloudSpace: () => false }));
vi.mock('../src/utils/api', () => ({ getAPI: () => ({}) }));

let channel: { track: ReturnType<typeof vi.fn>; untrack: ReturnType<typeof vi.fn> };
beforeEach(() => {
  collaborationEngine.clearActiveSpace();
  mocks.unlock.mockReset().mockResolvedValue(undefined);
  mocks.channel.mockReset().mockImplementation(() => {
    const result = { state: 'joining', track: vi.fn(), untrack: vi.fn(), on: vi.fn(() => result), subscribe: vi.fn(() => result) };
    return result;
  });
  channel = { track: vi.fn().mockResolvedValue('ok'), untrack: vi.fn() };
  Object.assign(collaborationEngine, { realtimeChannel: channel, _activeSpaceId: 'space', _collabPaused: false });
});
afterEach(() => collaborationEngine.clearActiveSpace());

it('sends only typing transitions rather than a presence update per keystroke', async () => {
  await collaborationEngine.updatePresenceNote('Note.md', false);
  await Promise.all(Array.from({ length: 100 }, () => collaborationEngine.updatePresenceNote('Note.md', true)));
  await collaborationEngine.updatePresenceNote('Note.md', false);
  await collaborationEngine.updatePresenceNote('Other.md', false);
  expect(channel.track.mock.calls.map(([payload]) => [payload.active_note_id, payload.is_typing])).toEqual([
    ['Note.md', false], ['Note.md', true], ['Note.md', false], ['Other.md', false],
  ]);
});

it('retries a failed presence update and sends unchanged state after reconnect', async () => {
  channel.track.mockRejectedValueOnce(new Error('Offline'));
  await collaborationEngine.updatePresenceNote('Note.md', true);
  await collaborationEngine.updatePresenceNote('Note.md', true);
  expect(channel.track).toHaveBeenCalledTimes(2);
  collaborationEngine.unsubscribeFromSpace();
  Object.assign(collaborationEngine, { realtimeChannel: channel });
  await collaborationEngine.updatePresenceNote('Note.md', true);
  expect(channel.track).toHaveBeenCalledTimes(3);
});

it('does not rerender the app when only presence timestamps or ordering change', () => {
  const listener = vi.fn();
  const unsubscribe = collaborationEngine.onActiveUsersChange(listener);
  const peer = { id: 'peer', name: 'Peer', email: 'peer@example.org', color: 'blue', isEditing: false, activeNoteId: 'Note.md' };
  const self = { ...peer, id: 'me' };
  const notify = (collaborationEngine as unknown as { notifyActiveUsers(users: typeof peer[]): void }).notifyActiveUsers.bind(collaborationEngine);
  notify([peer, self]);
  notify([{ ...self }, { ...peer }]);
  expect(listener).toHaveBeenCalledOnce();
  notify([{ ...peer, isEditing: true }, self]);
  expect(listener).toHaveBeenCalledTimes(2);
  unsubscribe();
});

it('cannot reconnect an old Space when an asynchronous unlock finishes late', async () => {
  collaborationEngine.clearActiveSpace();
  let finish!: () => void;
  mocks.unlock.mockImplementationOnce(() => new Promise<void>(resolve => { finish = resolve; }));
  const old = collaborationEngine.subscribeToSpace('old');
  await collaborationEngine.subscribeToSpace('new');
  finish(); await old;
  expect(mocks.channel.mock.calls.map(([topic]) => topic)).toEqual(['space:new']);
  expect(collaborationEngine.activeSpaceId).toBe('new');
});

it('does not recreate a channel after disconnecting during an asynchronous unlock', async () => {
  collaborationEngine.clearActiveSpace();
  let finish!: () => void;
  mocks.unlock.mockImplementationOnce(() => new Promise<void>(resolve => { finish = resolve; }));
  const pending = collaborationEngine.subscribeToSpace('space');
  collaborationEngine.clearActiveSpace();
  finish(); await pending;
  expect(mocks.channel).not.toHaveBeenCalled();
  expect(collaborationEngine.activeSpaceId).toBeNull();
});
