// @vitest-environment jsdom
import * as Y from 'yjs';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { applyAwarenessUpdate, encodeAwarenessUpdate } from 'y-protocols/awareness';
import { SupabaseProvider } from '../src/lib/supabaseProvider';
import { sha256Hex } from '../src/utils/collabDocument';

const mocks = vi.hoisted(() => ({ channels: new Map<string, any>(), files: new Map<string, string>(), read: vi.fn(), write: vi.fn(), putNote: vi.fn(), getNote: vi.fn(), getSpace: vi.fn() }));
vi.mock('../src/lib/supabase', () => ({ isSupabaseConfigured: true, supabase: {
  channel: (name: string) => {
    // Match the installed client's topic reuse behavior.
    if (mocks.channels.has(name)) return mocks.channels.get(name);
    const channel = { name, handlers: new Map(), on: vi.fn(function (_type, filter, callback) { channel.handlers.set(filter.event, callback); return channel; }), subscribe: vi.fn(callback => { callback('SUBSCRIBED'); return channel; }), send: vi.fn().mockResolvedValue('ok') };
    mocks.channels.set(name, channel); return channel;
  }, removeChannel: vi.fn(channel => mocks.channels.delete(channel.name)),
} }));
vi.mock('../src/lib/auth', () => ({ authManager: {} }));
vi.mock('../src/lib/localdb', () => ({ localDB: { getSpace: mocks.getSpace, getNoteByPath: mocks.getNote, putNote: mocks.putNote } }));
vi.mock('../src/lib/privateCrypto', () => ({ isPrivateCloudSpace: () => false, privateCrypto: {} }));
vi.mock('../src/lib/syncEngine', () => ({ normalizeSyncPath: (path: string) => path }));
vi.mock('../src/utils/api', () => ({ getAPI: () => ({ readFile: mocks.read, writeFile: mocks.write, createDirectory: async () => {} }) }));
const providers: SupabaseProvider[] = [];
const docs: Y.Doc[] = [];
function provider(path: string, client = `client-${providers.length}`) {
  const doc = new Y.Doc(); docs.push(doc);
  const result = new SupabaseProvider(doc, { spaceId: 'space', notePath: path, clientId: client, user: { id: client, email: '', name: client, color: 'blue' } });
  providers.push(result); return result;
}
beforeEach(() => {
  vi.useFakeTimers(); mocks.channels.clear(); mocks.files.clear();
  mocks.read.mockReset().mockImplementation(async path => { if (!mocks.files.has(path)) throw new Error('Missing'); return mocks.files.get(path); });
  mocks.write.mockReset().mockImplementation(async (path, content) => { mocks.files.set(path, content); });
  mocks.putNote.mockReset().mockResolvedValue(undefined); mocks.getNote.mockReset().mockResolvedValue(null);
  mocks.getSpace.mockReset().mockResolvedValue(null);
});
afterEach(() => { providers.splice(0).forEach(item => { item.disconnect(); item.awareness.destroy(); }); docs.splice(0).forEach(doc => doc.destroy()); vi.useRealTimers(); });

it('keeps note channels independent when multiple notes are open in a cloud Space', async () => {
  const first = provider('Folder/One.md'), second = provider('Folder/Two.md');
  await first.connect(); await second.connect();
  expect(mocks.channels.size).toBe(2);
  expect(first.isConnected && second.isConnected).toBe(true);
  first.disconnect();
  expect(mocks.channels.size).toBe(1);
  expect(second.isConnected).toBe(true);
});

it('updates remote cursor state without rebroadcasting it back to the other user', async () => {
  const first = provider('Note.md'), second = provider('Note.md');
  await first.connect(); await second.connect();
  const channel = [...mocks.channels.values()][0]; channel.send.mockClear();
  const remote = encodeAwarenessUpdate(second.awareness, [second.doc.clientID]);
  applyAwarenessUpdate(first.awareness, remote, 'remote');
  await vi.advanceTimersByTimeAsync(200);
  expect(first.awareness.getStates().has(second.doc.clientID)).toBe(true);
  expect(channel.send).not.toHaveBeenCalled();
  first.awareness.setLocalStateField('cursor', { anchor: 2 });
  await vi.advanceTimersByTimeAsync(200);
  expect(channel.send.mock.calls.map(([message]) => message.event)).toEqual(['yjs-awareness']);
});

it('persists genuine remote text edits once and ignores duplicate Yjs updates', async () => {
  const receiver = provider('Note.md'); await receiver.connect();
  const channel = [...mocks.channels.values()][0]; channel.send.mockClear();
  const remote = new Y.Doc(); docs.push(remote);
  remote.getText('content').insert(0, 'Peer edit');
  const bytes = Y.encodeStateAsUpdate(remote);
  const update = btoa(String.fromCharCode(...bytes));
  const receive = channel.handlers.get('yjs-update');
  receive({ payload: { client_id: 'peer', note_path: 'Note.md', update } });
  await vi.advanceTimersByTimeAsync(3100);
  expect(receiver.doc.getText('content').toString()).toBe('Peer edit');
  expect(mocks.write).toHaveBeenCalledOnce();
  await vi.waitFor(() => expect(mocks.putNote).toHaveBeenCalledOnce());
  const writes = mocks.write.mock.calls.length, snapshots = mocks.putNote.mock.calls.length;
  receive({ payload: { client_id: 'peer', note_path: 'Note.md', update } });
  await vi.advanceTimersByTimeAsync(3100);
  expect(mocks.write).toHaveBeenCalledTimes(writes);
  expect(mocks.putNote).toHaveBeenCalledTimes(snapshots);
  expect(channel.send).not.toHaveBeenCalled();
});

it('skips filesystem writes when the document content already matches disk', async () => {
  const item = provider('Note.md');
  mocks.files.set('Note.md', 'Existing');
  item.doc.getText('content').insert(0, 'Existing');
  await vi.advanceTimersByTimeAsync(600);
  expect(mocks.write).not.toHaveBeenCalled();
});

it('does not bump snapshot versions or write IndexedDB when content is unchanged', async () => {
  const item = provider('Note.md');
  item.doc.getText('content').insert(0, 'Existing');
  const note = { version: 7, content: 'Existing', content_hash: await sha256Hex('Existing'), deleted: false };
  mocks.getNote.mockResolvedValue(note);
  await (item as unknown as { _persistSnapshot(): Promise<void> })._persistSnapshot();
  expect(note.version).toBe(7);
  expect(mocks.putNote).not.toHaveBeenCalled();
});

it('does not create a zombie note channel when closed while checking encryption', async () => {
  let finish!: (space: null) => void;
  mocks.getSpace.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  const item = provider('Note.md');
  const connecting = item.connect();
  item.disconnect();
  finish(null); await connecting;
  expect(mocks.channels.size).toBe(0);
});
