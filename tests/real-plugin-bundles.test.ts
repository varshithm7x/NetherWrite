// @vitest-environment jsdom

import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import 'fake-indexeddb/auto';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import * as obsidianApi from '../src/lib/obsidian-api';
import { OOApp } from '../src/lib/obsidian-api/app';

const nodeRequire = createRequire(import.meta.url);
const fixtureRoot = process.env.OO_PLUGIN_FIXTURE_DIR
  || path.join(os.tmpdir(), 'netherwrite-plugin-fixtures');
const bundlePaths = {
  dataview: path.join(fixtureRoot, 'dataview-main.js'),
  templater: path.join(fixtureRoot, 'templater-main.js'),
  git: path.join(fixtureRoot, 'git-main.js'),
  tasks: path.join(fixtureRoot, 'tasks-main.js'),
  calendar: path.join(fixtureRoot, 'calendar-main.js'),
  kanban: path.join(fixtureRoot, 'kanban-main.js'),
  'style-settings': path.join(fixtureRoot, 'style-settings-main.js'),
  'advanced-tables': path.join(fixtureRoot, 'advanced-tables-main.js'),
  quickadd: path.join(fixtureRoot, 'quickadd-main.js'),
};
const installedBundles = {
  excalidraw: path.join(fixtureRoot, 'excalidraw-main.js'),
  'better-export-pdf': path.join(fixtureRoot, 'better-export-pdf-main.js'),
  'enhancing-export': path.join(fixtureRoot, 'enhancing-export-main.js'),
  'reading-time': path.join(fixtureRoot, 'reading-time-main.js'),
};
const originalCwd = process.cwd();
const pluginTestCwd = path.join(os.tmpdir(), 'netherwrite-plugin-test-vault');

beforeAll(() => {
  fs.mkdirSync(path.join(pluginTestCwd, '.netherwrite/plugins/obsidian-git'), { recursive: true });
  process.chdir(pluginTestCwd);
});

afterAll(() => {
  process.chdir(originalCwd);
});

function requireForPlugin(id: string): any {
  if (id === 'obsidian') return obsidianApi;
  if (id === 'electron') {
    return {
      remote: {
        app: { getPath: () => pluginTestCwd },
        dialog: {
          showOpenDialog: vi.fn(async () => ({ canceled: true, filePaths: [] })),
          showSaveDialog: vi.fn(async () => ({ canceled: true, filePath: '' })),
        },
        shell: {
          openPath: vi.fn(async () => ''),
          showItemInFolder: vi.fn(),
        },
      },
    };
  }
  return nodeRequire(id);
}

function evaluatePluginBundle(file: string): any {
  const source = fs.readFileSync(file, 'utf8');
  const module = { exports: {} as any };
  const execute = new Function('require', 'module', 'exports', source);
  execute(requireForPlugin, module, module.exports);
  return module.exports.default || module.exports;
}

function createApp(): OOApp {
  const app = new OOApp();
  app.workspace.containerEl = document.body;
  // Community plugins normally load after Obsidian's workspace is ready.
  app.workspace.layoutReady = true;
  return app;
}

function createManifest(id: string, name = id, version = 'test') {
  return {
    id,
    dir: `.netherwrite/plugins/${id}`,
    name,
    version,
    minAppVersion: '1.0.0',
    description: '',
    author: 'community',
  };
}

beforeEach(() => {
  document.body.innerHTML = '<div class="app-container"></div>';
  document.body.className = 'app-container theme-dark';
  document.body.style.setProperty('--background-primary', '#0a0a0a');
  document.body.style.setProperty('--background-secondary', '#141414');
  document.body.style.setProperty('--text-normal', '#d2d2d2');
  document.body.style.setProperty('--text-muted', '#a0a0a0');
  document.body.style.setProperty('--interactive-accent', '#c6c6c6');
  (globalThis as any).activeDocument = document;
  (globalThis as any).activeWindow = window;
  URL.createObjectURL = vi.fn(() => 'blob:compat-worker');
  URL.revokeObjectURL = vi.fn();
  (globalThis as any).Worker = class {
    onmessage: ((event: MessageEvent) => void) | null = null;
    onerror: ((event: ErrorEvent) => void) | null = null;
    postMessage(): void {}
    terminate(): void {}
    addEventListener(): void {}
    removeEventListener(): void {}
  };
  (window as any).electronAPI = {
    getVaultPath: vi.fn(async () => '/vault'),
    getFileTree: vi.fn(async () => []),
    readFile: vi.fn(async () => ''),
    writeFile: vi.fn(async () => {}),
    readBinary: vi.fn(async () => new Uint8Array()),
    writeBinary: vi.fn(async () => {}),
    createFile: vi.fn(async () => {}),
    createDirectory: vi.fn(async () => {}),
    deleteFile: vi.fn(async () => {}),
    deleteDirectory: vi.fn(async () => {}),
    renameFile: vi.fn(async () => {}),
    dataRead: vi.fn(async () => null),
    dataWrite: vi.fn(async () => {}),
  };
});

describe('real community plugin bundles', () => {
  for (const [id, file] of Object.entries(bundlePaths)) {
    it(`evaluates and constructs ${id}`, () => {
      const PluginClass = evaluatePluginBundle(file);
      expect(PluginClass).toBeTypeOf('function');
      const instance = new PluginClass(createApp(), createManifest(id));
      expect(instance.app).toBeTruthy();
      expect(instance.manifest.id).toBe(id);
    });
  }

  it('loads and unloads Dataview against an empty vault', async () => {
    const PluginClass = evaluatePluginBundle(bundlePaths.dataview);
    const instance = new PluginClass(createApp(), createManifest('dataview', 'Dataview', '0.5.70'));
    await instance.load();
    instance.unload();
  });

  for (const [bundleId, pluginId, name, version] of [
    ['templater', 'templater', 'Templater', '2.22.1'],
    ['tasks', 'tasks', 'Tasks', '8.1.0'],
    ['calendar', 'calendar', 'Calendar', '2.0.0-beta.2'],
    ['kanban', 'kanban', 'Kanban', '2.0.51'],
    ['style-settings', 'style-settings', 'Style Settings', '1.0.9'],
    ['advanced-tables', 'advanced-tables', 'Advanced Tables', '0.23.2'],
    ['quickadd', 'quickadd', 'QuickAdd', '2.12.3'],
    ['git', 'obsidian-git', 'Obsidian Git', '2.38.3'],
  ]) {
    it(`loads and unloads ${name} against an empty vault`, async () => {
      const PluginClass = evaluatePluginBundle(bundlePaths[bundleId as keyof typeof bundlePaths]);
      const instance = new PluginClass(createApp(), createManifest(pluginId, name, version));
      await instance.load();
      instance.unload();
    });
  }
});

describe('reported installed plugin regressions', () => {
  for (const [bundleId, pluginId, name, version] of [
    ['excalidraw', 'obsidian-excalidraw-plugin', 'Excalidraw', '2.23.12'],
    ['better-export-pdf', 'better-export-pdf', 'Better Export PDF', '1.11.0'],
    ['enhancing-export', 'obsidian-enhancing-export', 'Enhancing Export', '1.11.1'],
    ['reading-time', 'obsidian-reading-time', 'Reading Time', '1.1.2'],
  ]) {
    it(`loads and unloads ${name}`, async () => {
      const PluginClass = evaluatePluginBundle(installedBundles[bundleId as keyof typeof installedBundles]);
      const instance = new PluginClass(createApp(), createManifest(pluginId, name, version));
      await instance.load();
      await new Promise((resolve) => setTimeout(resolve, 100));

      for (const settingTab of (instance as any)._settingTabs || []) {
        await Promise.resolve(settingTab.display());
        await new Promise((resolve) => setTimeout(resolve, 50));
        expect(settingTab.containerEl.childElementCount).toBeGreaterThan(0);
      }

      if (pluginId === 'obsidian-reading-time') {
        const markdownView = instance.app.workspace.activeLeaf.view;
        markdownView.setViewData('one two three four five', true);
        instance.app.workspace.trigger('layout-change');
        expect((instance as any).statusBar.textContent).toMatch(/read$/);
      }

      if (pluginId === 'obsidian-excalidraw-plugin') {
        const leaf = instance.app.workspace.getRightLeaf(false)!;
        leaf.side = 'right';
        await leaf.setViewState({ type: 'excalidraw-sidepanel', active: true });
        await new Promise((resolve) => setTimeout(resolve, 50));
        expect(leaf.view.getViewType()).toBe('excalidraw-sidepanel');
        expect(leaf.view.containerEl.childElementCount).toBeGreaterThan(0);
      }

      instance.unload();
    });
  }
});
