// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { getAPI } from '../src/utils/api';

afterEach(() => { delete (window as unknown as { electronAPI?: unknown }).electronAPI; });

it.each([true, false])('refreshes directory structure only when createDirectory actually creates a directory (exists=%s)', async exists => {
  const createDirectory = vi.fn().mockResolvedValue(undefined);
  Object.assign(window, { electronAPI: { fileExists: async () => exists, createDirectory } });
  const listener = vi.fn(); window.addEventListener('netherwrite:directory-created', listener);
  try {
    await getAPI().createDirectory('Folder');
    expect(createDirectory).toHaveBeenCalledWith('Folder');
    expect(listener).toHaveBeenCalledTimes(exists ? 0 : 1);
  } finally { window.removeEventListener('netherwrite:directory-created', listener); }
});
