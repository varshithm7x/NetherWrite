// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  setVaultPath: vi.fn(async () => true),
  getVaultPath: vi.fn(async (): Promise<string | null> => null),
  openVaultDialog: vi.fn(async () => '/tmp/research-folder'),
  getFileTree: vi.fn(async () => [{ name: 'Research.md', path: 'Research.md', extension: '.md', modifiedAt: 1, size: 10, absolutePath: '/tmp/research-folder/Research.md', isDirectory: false }]),
  readFile: vi.fn(async () => '# Research\n\nRelated ideas.'),
  minimizeWindow: vi.fn(), maximizeWindow: vi.fn(), closeWindow: vi.fn(),
}));
vi.mock('../src/utils/api', () => ({ getAPI: () => mocks }));
vi.mock('../src/components/graph/GraphView', () => ({ GraphView: () => null }));
vi.mock('../src/components/MarkdownEditor', () => ({ MarkdownEditor: () => null }));
vi.mock('../src/components/ai/CitedMarkdownAnswer', () => ({ CitedMarkdownAnswer: () => null }));
vi.mock('../src/utils/embeddings', () => ({ embedNote: vi.fn(async () => true), loadStoreAsync: async () => ({ entries: new Map() }), findSimilar: () => [], resetEmbeddingsStore: vi.fn(), seedLexicalEmbeddings: vi.fn(), searchByQuery: async () => [], isLexicalFallbackActive: () => false, pruneMissingEmbeddings: vi.fn() }));
import App from '../src/App';
beforeEach(() => {
  localStorage.clear(); vi.clearAllMocks(); mocks.getVaultPath.mockResolvedValue(null);
  (window as any).electronAPI = mocks;
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  HTMLElement.prototype.scrollIntoView = vi.fn();
});
describe('workspace persistence', () => {
  it('keeps the selected workspace after indexing and restores it after a renderer reload', async () => {
    const host = document.createElement('div'); document.body.append(host);
    const first = createRoot(host);
    await act(async () => { first.render(<App />); });
    expect(host.textContent).toContain('Make room for');
    await act(async () => { (host.querySelector('.welcome .primary-button') as HTMLButtonElement).click(); });
    expect(host.querySelector('.workspace')).not.toBeNull();
    expect(host.querySelector('.welcome')).toBeNull();
    expect(localStorage.getItem('noteweave:last-vault')).toBe('/tmp/research-folder');
    await act(async () => { first.unmount(); });
    const restored = createRoot(host);
    await act(async () => { restored.render(<App />); });
    expect(mocks.setVaultPath).toHaveBeenLastCalledWith('/tmp/research-folder');
    expect(host.querySelector('.workspace')).not.toBeNull();
    expect(host.querySelector('.welcome')).toBeNull();
    expect(host.textContent).toContain('Research');
    await act(async () => { restored.unmount(); }); host.remove();
  });
  it('recovers the active desktop folder even when no last-folder preference exists', async () => {
    mocks.getVaultPath.mockResolvedValue('/tmp/existing-folder');
    const host = document.createElement('div'); document.body.append(host); const root = createRoot(host);
    await act(async () => { root.render(<App />); });
    expect(mocks.setVaultPath).toHaveBeenLastCalledWith('/tmp/existing-folder');
    expect(host.querySelector('.workspace')).not.toBeNull();
    expect(host.querySelector('.welcome')).toBeNull();
    await act(async () => { root.unmount(); }); host.remove();
  });

});
