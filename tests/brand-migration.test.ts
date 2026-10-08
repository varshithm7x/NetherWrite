import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { openDB } from 'idb';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import * as Y from 'yjs';
import { migrateBrowserStorage, migrateLocalDatabase } from '../src/utils/brandMigration';
import { migrateDesktopProfile } from '../electron/brandMigration';
import { FileSystemManager } from '../electron/fileSystem';
import { getYDocContent, populateYDocFromCanvasJSON } from '../src/utils/collabDocument';

const temporaryDirectories: string[] = [];
function temporaryDirectory(): string {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'netherwrite-migration-'));
  temporaryDirectories.push(directory);
  return directory;
}

afterEach(() => {
  vi.unstubAllGlobals();
  for (const directory of temporaryDirectories.splice(0)) fs.rmSync(directory, { recursive: true, force: true });
});

describe('NetherWrite migration', () => {
  it('preserves old browser preferences and gives existing new preferences priority', () => {
    const values = new Map<string, string>([
      ['openonyx-settings', JSON.stringify({ theme: 'openonyx', overrideConfigFolder: '.openonyx', fontSize: 19 })],
      ['openonyx-bookmarks:notes', '["saved.md"]'],
      ['openobsidian-data:queue.json', '[1]'],
      ['openonyx-data:queue.json', '[2]'],
      ['openonyx-ftux', 'old'],
      ['netherwrite-ftux', 'new'],
    ]);
    const storage = {
      get length() { return values.size; },
      key: (index: number) => Array.from(values.keys())[index] ?? null,
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value); },
    } as Storage;
    migrateBrowserStorage(storage);
    expect(JSON.parse(storage.getItem('netherwrite-settings')!)).toEqual({
      theme: 'netherwrite', overrideConfigFolder: '.netherwrite', fontSize: 19,
    });
    expect(storage.getItem('netherwrite-bookmarks:notes')).toBe('["saved.md"]');
    expect(storage.getItem('netherwrite-data:queue.json')).toBe('[2]');
    expect(storage.getItem('netherwrite-ftux')).toBe('new');
    expect(storage.getItem('openonyx-ftux')).toBe('old');
  });

  it('copies offline data and indexes and can safely run again', async () => {
    const factory = new IDBFactory();
    vi.stubGlobal('indexedDB', factory);
    vi.stubGlobal('IDBKeyRange', IDBKeyRange);
    const legacy = await openDB('openonyx-local', 5, {
      upgrade(db) {
        db.createObjectStore('metadata');
        db.createObjectStore('notes', { keyPath: 'id' }).createIndex('by-space', 'space_id');
      },
    });
    await legacy.put('metadata', 'client-123', 'client_id');
    await legacy.put('notes', { id: 'note-1', space_id: 'space-1', content: 'Unsynced writing' });
    legacy.close();
    await migrateLocalDatabase(factory);
    await migrateLocalDatabase(factory);
    const current = await openDB('netherwrite-local');
    expect(await current.get('metadata', 'client_id')).toBe('client-123');
    expect(await current.getAllFromIndex('notes', 'by-space', 'space-1')).toEqual([
      { id: 'note-1', space_id: 'space-1', content: 'Unsynced writing' },
    ]);
    current.close();
  });

  it('preserves newer destination records during offline migration', async () => {
    const factory = new IDBFactory();
    vi.stubGlobal('indexedDB', factory);
    vi.stubGlobal('IDBKeyRange', IDBKeyRange);
    for (const [name, content] of [['openonyx-local', 'old'], ['netherwrite-local', 'new']]) {
      const db = await openDB(name, 5, {
        upgrade(database) {
          database.createObjectStore('metadata');
          database.createObjectStore('notes', { keyPath: 'id' });
        },
      });
      await db.put('notes', { id: 'same-note', content });
      db.close();
    }
    await migrateLocalDatabase(factory);
    const current = await openDB('netherwrite-local');
    expect((await current.get('notes', 'same-note')).content).toBe('new');
    current.close();
  });

  it('creates the desktop profile directory for a fresh installation', () => {
    const destination = migrateDesktopProfile(temporaryDirectory());
    expect(fs.statSync(destination).isDirectory()).toBe(true);
  });

  it('copies the desktop profile without overwriting a new profile', () => {
    const root = temporaryDirectory();
    fs.mkdirSync(path.join(root, 'OpenOnyx'));
    fs.writeFileSync(path.join(root, 'OpenOnyx', 'vault-history.json'), 'old history');
    const destination = migrateDesktopProfile(root);
    expect(fs.readFileSync(path.join(destination, 'vault-history.json'), 'utf8')).toBe('old history');
    fs.writeFileSync(path.join(destination, 'vault-history.json'), 'new history');
    migrateDesktopProfile(root);
    expect(fs.readFileSync(path.join(destination, 'vault-history.json'), 'utf8')).toBe('new history');
    expect(fs.existsSync(path.join(root, 'OpenOnyx', 'vault-history.json'))).toBe(true);
  });

  it.each(['.openonyx', '.openobsidian'])('migrates %s vault data to the new directory', async (legacyName) => {
    const root = temporaryDirectory();
    fs.mkdirSync(path.join(root, legacyName));
    fs.writeFileSync(path.join(root, legacyName, 'ai-settings.json'), '{"configured":true}');
    const manager = new FileSystemManager();
    expect(manager.setVaultPath(root)).toBe(true);
    expect(await manager.readDataFile('ai-settings.json')).toBe('{"configured":true}');
    expect(fs.existsSync(path.join(root, '.netherwrite', 'ai-settings.json'))).toBe(true);
  });

  it('loads legacy canvas drawings and styling and serializes with the new metadata keys', () => {
    const doc = new Y.Doc();
    populateYDocFromCanvasJSON(doc, JSON.stringify({
      nodes: [], edges: [],
      openonyxScribblesV1: [{ id: 'stroke-1', points: [{ x: 1, y: 2 }] }],
      openonyxCanvasCustomizationV1: { backgroundColor: '#123456' },
      openonyxCanvasViewportV1: { x: 10, y: 20, zoom: 2 },
    }));
    const result = JSON.parse(getYDocContent(doc, true));
    expect(result.scribbles[0].id).toBe('stroke-1');
    expect(result.netherwriteCanvasCustomizationV1).toEqual({ backgroundColor: '#123456' });
    expect(result.openonyxCanvasCustomizationV1).toBeUndefined();
    doc.destroy();
  });
});
