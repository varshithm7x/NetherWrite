import { createRequire } from 'node:module';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';

const { loadNativeAppEnv, nativeAppArgs } = createRequire(import.meta.url)('../scripts/dev/native-app-env.cjs');

it('loads only native OAuth settings and preserves explicit environment overrides', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'netherwrite-native-env-'));
  try {
    await writeFile(join(directory, '.env.local'), 'NETHERWRITE_GOOGLE_CLIENT_ID=local.apps.googleusercontent.com\nNETHERWRITE_GOOGLE_CLIENT_SECRET="local value"\nUNRELATED_SECRET=private\n');
    expect(loadNativeAppEnv({}, directory)).toEqual({ NETHERWRITE_GOOGLE_CLIENT_ID: 'local.apps.googleusercontent.com' });
    expect(loadNativeAppEnv({ NETHERWRITE_GOOGLE_CLIENT_ID: 'override' }, directory).NETHERWRITE_GOOGLE_CLIENT_ID).toBe('override');
    expect(loadNativeAppEnv({}, join(directory, 'missing'))).toEqual({});
  } finally { await rm(directory, { recursive: true, force: true }); }
});

it('supports an explicit Linux system keyring without permitting plaintext fallback', () => {
  expect(nativeAppArgs('linux', { NETHERWRITE_PASSWORD_STORE: 'gnome-libsecret' })).toEqual(['.', '--password-store=gnome-libsecret']);
  expect(nativeAppArgs('linux', {})).toEqual(['.']);
  expect(nativeAppArgs('darwin', { NETHERWRITE_PASSWORD_STORE: 'gnome-libsecret' })).toEqual(['.']);
  expect(() => nativeAppArgs('linux', { NETHERWRITE_PASSWORD_STORE: 'basic' })).toThrow('secure system keyring');
});
