import { openDB } from 'idb';

/** Copy legacy preferences without overwriting settings already saved by NetherWrite. */
export function migrateBrowserStorage(storage: Storage): void {
  const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index));
  // The most recent legacy brand wins when both generations have cached data.
  keys.sort((a, b) => Number(!a?.startsWith('openonyx')) - Number(!b?.startsWith('openonyx')));
  for (const key of keys) {
    if (!key || !/^(openonyx|openobsidian)[-:]/.test(key)) continue;
    const nextKey = key.replace(/^(openonyx|openobsidian)/, 'netherwrite');
    if (storage.getItem(nextKey) !== null) continue;
    let value = storage.getItem(key);
    if (value === null) continue;
    if (nextKey === 'netherwrite-settings') {
      try {
        const settings = JSON.parse(value);
        if (settings.theme === 'openonyx') settings.theme = 'netherwrite';
        if (settings.overrideConfigFolder === '.openonyx') settings.overrideConfigFolder = '.netherwrite';
        value = JSON.stringify(settings);
      } catch { /* Preserve malformed preferences for the existing settings fallback. */ }
    }
    storage.setItem(nextKey, value);
  }
}

/** Preserve offline notes and pending sync changes when the database name changes. */
export async function migrateLocalDatabase(factory: IDBFactory): Promise<void> {
  const databases = await factory.databases();
  if (!databases.some((db) => db.name === 'openonyx-local')) return;
  const source = await openDB('openonyx-local');
  try {
    const stores = Array.from(source.objectStoreNames);
    const target = await openDB('netherwrite-local', Math.max(source.version, databases.find((db) => db.name === 'netherwrite-local')?.version || 0), {
      upgrade(db) {
        for (const name of stores) {
          const original = source.transaction(name).store;
          const store = db.createObjectStore(name, {
            keyPath: original.keyPath,
            autoIncrement: original.autoIncrement,
          });
          for (const indexName of original.indexNames) {
            const index = original.index(indexName);
            store.createIndex(indexName, index.keyPath, { unique: index.unique, multiEntry: index.multiEntry });
          }
        }
      },
    });
    try {
      // The marker and all records commit together, allowing failed copies to retry.
      if (await target.get('metadata', 'netherwrite-brand-migrated')) return;
      const records = await Promise.all(stores.map(async (name) => ({
        name,
        values: await source.getAll(name),
        keys: await source.getAllKeys(name),
      })));
      const transaction = target.transaction(stores, 'readwrite');
      const writes: Promise<unknown>[] = [];
      for (const { name, values, keys } of records) {
        const store = transaction.objectStore(name);
        for (let index = 0; index < values.length; index++) {
          // add() preserves any newer records in the destination.
          if (await store.get(keys[index]) !== undefined) continue;
          writes.push(store.keyPath === null ? store.put(values[index], keys[index]) : store.put(values[index]));
        }
      }
      writes.push(transaction.objectStore('metadata').put(true, 'netherwrite-brand-migrated'));
      await Promise.all(writes);
      await transaction.done;
    } finally {
      target.close();
    }
  } finally {
    source.close();
  }
}
