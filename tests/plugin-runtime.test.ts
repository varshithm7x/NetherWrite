// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import JSZip from 'jszip';
import {
  AbstractInputSuggest,
  ButtonComponent,
  ConfirmationModal,
  Editor,
  ItemView,
  MarkdownRenderer,
  Modal,
  Notice,
  Plugin,
  Setting,
  SettingGroup,
  TextComponent,
  TextFileView,
  WorkspaceLeaf,
} from '../src/lib/obsidian-api';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { Component } from '../src/lib/obsidian-api/components';
import { OOApp } from '../src/lib/obsidian-api/app';
import { getMarkdownProcessorCounts, runMarkdownPostProcessors } from '../src/lib/obsidian-api/markdown';
import { TFile } from '../src/lib/obsidian-api/files';
import { extractPluginBundleFromZip } from '../src/lib/pluginManager';
import { PluginManager } from '../src/lib/pluginManager';
import { injectPluginStyles, removePluginStyles, rewritePluginCssUrls } from '../src/lib/pluginStyles';
import { addIcon, setIcon } from '../src/lib/obsidian-api/utils';

const manifest = {
  id: 'compat-fixture',
  name: 'Compatibility Fixture',
  version: '1.0.0',
  minAppVersion: '1.0.0',
  description: '',
  author: 'test',
};

beforeEach(() => {
  document.body.innerHTML = '';
  (window as any).__oo_active_file = 'fixture.md';
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
    openPath: vi.fn(async () => ''),
    openExternal: vi.fn(async () => {}),
    showItemInFolder: vi.fn(async () => {}),
    writeClipboardText: vi.fn(async () => {}),
    readClipboardText: vi.fn(async () => ''),
    dataRead: vi.fn(async () => null),
    dataWrite: vi.fn(async () => {}),
    dataDelete: vi.fn(async () => {}),
    dataList: vi.fn(async () => []),
    listFiles: vi.fn(async () => []),
    fileExists: vi.fn(async () => false),
    trashFile: vi.fn(async () => {}),
  };
});

describe('plugin runtime compatibility', () => {
  it('exposes the Obsidian ButtonComponent loading state used by settings plugins', () => {
    const button = new ButtonComponent(document.body);

    button.setLoading(true);
    expect(button.buttonEl.classList.contains('is-loading')).toBe(true);
    expect(button.buttonEl.getAttribute('aria-busy')).toBe('true');

    button.setLoading(false);
    expect(button.buttonEl.classList.contains('is-loading')).toBe(false);
    expect(button.buttonEl.getAttribute('aria-busy')).toBe('false');
  });

  it('renders plugin-registered SVG ribbon icons from their icon ID', () => {
    addIcon('compat-fixture-ribbon-icon', '<svg data-plugin-icon="fixture"><path d="M1 1h22v22H1z" /></svg>');
    const target = document.createElement('span');

    setIcon(target, 'compat-fixture-ribbon-icon');

    expect(target.querySelector('[data-plugin-icon="fixture"]')).not.toBeNull();
  });

  it('renders the built-in open-vault icon used by navigation plugins', () => {
    const target = document.createElement('span');
    setIcon(target, 'open-vault');
    expect(target.querySelector('svg')).not.toBeNull();
  });

  it('injects plugin CSS with Obsidian document-level selectors intact', () => {
    injectPluginStyles('plain-plugin', `
.plain-plugin-button { color: red; }
.workspace-leaf .plain-plugin-button { background-image: url("./icons/action.svg#mark"); }
body.theme-dark .plain-plugin-button { border-color: blue; }
`);

    const style = document.querySelector<HTMLStyleElement>('style[data-plugin-id="plain-plugin"]');

    expect(style?.textContent).toContain('.plain-plugin-button { color: red; }');
    expect(style?.textContent).toContain('body.theme-dark .plain-plugin-button');
    expect(style?.textContent).not.toContain('oo-plugin-scope-plain-plugin .plain-plugin-button');
    expect(style?.textContent).toContain('vault://local/.netherwrite/plugins/plain-plugin/icons/action.svg#mark');

    removePluginStyles('plain-plugin');
  });

  it('leaves absolute plugin CSS URLs untouched while rewriting relative imports', () => {
    const css = rewritePluginCssUrls('asset-plugin', `
@import "./base.css";
.remote { background: url("https://example.com/remote.svg"); }
.local { background: url(assets/icon file.svg?version=1); }
`);

    expect(css).toContain('@import "vault://local/.netherwrite/plugins/asset-plugin/base.css"');
    expect(css).toContain('url("https://example.com/remote.svg")');
    expect(css).toContain('vault://local/.netherwrite/plugins/asset-plugin/assets/icon%20file.svg?version=1');
  });

  it('provides the legacy global Electron remote contract to plugins', () => {
    const app = new OOApp();
    new PluginManager(app, {
      onCommandsChanged: vi.fn(),
      onRibbonChanged: vi.fn(),
      onStatusBarChanged: vi.fn(),
      onSettingTabsChanged: vi.fn(),
      onPluginsChanged: vi.fn(),
    });

    expect((window as any).electron.remote.getCurrentWindow().isMaximized()).toBe(false);
    expect((window as any).electron.remote.getCurrentWebContents().getZoomFactor()).toBe(1);
    expect((window as any).require('electron').shell.openPath).toBeTypeOf('function');
    expect((window as any).require('electron').shell.openExternal).toBeTypeOf('function');
    expect((window as any).require('electron').shell.showItemInFolder).toBeTypeOf('function');
    expect((window as any).activeWindow).toBe(window);
    expect((window as any).activeDocument).toBe(document);
  });

  it('supports Notebook Navigator desktop file menu dependencies', async () => {
    const app = new OOApp();
    new PluginManager(app, {
      onCommandsChanged: vi.fn(),
      onRibbonChanged: vi.fn(),
      onStatusBarChanged: vi.fn(),
      onSettingTabsChanged: vi.fn(),
      onPluginsChanged: vi.fn(),
    });
    await app.initialize('/vault');

    const obsidian = (window as any).require('obsidian');
    expect(app.vault.adapter instanceof obsidian.FileSystemAdapter).toBe(true);

    await app.showInFolder('Folder/Note.md');
    expect((window as any).electronAPI.showItemInFolder).toHaveBeenCalledWith('/vault/Folder/Note.md');

    const shell = (window as any).require('electron').shell;
    await shell.openPath('/vault/Folder/Note.md');
    expect((window as any).electronAPI.openPath).toHaveBeenCalledWith('/vault/Folder/Note.md');

    await shell.openExternal('https://github.com/varshithm7x/NetherWrite');
    expect((window as any).electronAPI.openExternal).toHaveBeenCalledWith(
      'https://github.com/varshithm7x/NetherWrite',
    );
    expect((window as any).electronAPI.openPath).not.toHaveBeenCalledWith(
      'https://github.com/varshithm7x/NetherWrite',
    );
  });

  it('exposes Lezer LR parser APIs required by Excalidraw', () => {
    const app = new OOApp();
    new PluginManager(app, {
      onCommandsChanged: vi.fn(),
      onRibbonChanged: vi.fn(),
      onStatusBarChanged: vi.fn(),
      onSettingTabsChanged: vi.fn(),
      onPluginsChanged: vi.fn(),
    });

    const lezerLr = (window as any).require('@lezer/lr');
    expect(lezerLr.LRParser).toBeTypeOf('function');
    expect(lezerLr.LRParser.deserialize).toBeTypeOf('function');
  });

  it('implements the suggestion methods proxied by Iconic', () => {
    const input = document.createElement('input');
    const suggest = new (AbstractInputSuggest as any)(new OOApp(), input);
    suggest.showSuggestions(['first']);

    expect(suggest._suggestions).toEqual(['first']);
    expect(suggest.suggestEl.querySelectorAll('.suggestion-item')).toHaveLength(1);
    suggest._cleanup();
  });

  it('keeps modal input suggestions attached to the modal content', () => {
    const modal = new (Modal as any)(new OOApp());
    const input = document.createElement('input');
    modal.contentEl.appendChild(input);
    const suggest = new (AbstractInputSuggest as any)(new OOApp(), input);

    suggest.showSuggestions(['vault/file.md']);

    expect(suggest.suggestEl.parentElement).toBe(modal.contentEl);
    expect(suggest.suggestEl.classList.contains('oo-modal-input-suggest')).toBe(true);
    expect(suggest.suggestEl.style.position).toBe('static');
    expect(suggest.suggestEl.style.width).toBe('100%');
    suggest._cleanup();
  });

  it('notifies plugin text components when their value is committed programmatically', () => {
    const input = new TextComponent(document.body);
    const changed = vi.fn();
    input.onChange(changed).setValue('vault-file.png').onChanged();
    expect(changed).toHaveBeenCalledWith('vault-file.png');
  });

  it('supports Setting visibility toggles used by Excalidraw export controls', () => {
    const item = new (Setting as any)(document.body).setName('Export');

    item.setVisibility(false);
    expect(item.settingEl.hasAttribute('hidden')).toBe(true);
    expect(item.settingEl.classList.contains('is-hidden')).toBe(true);

    item.setVisibility(true);
    expect(item.settingEl.hasAttribute('hidden')).toBe(false);
    expect(item.settingEl.classList.contains('is-hidden')).toBe(false);
  });

  it('deduplicates plugin notices and dismisses them on schedule', () => {
    vi.useFakeTimers();
    try {
      new (Notice as any)('Repeated plugin failure', 1000);
      new (Notice as any)('Repeated plugin failure', 1000);
      new (Notice as any)('Another plugin failure', 1000);

      expect(document.querySelectorAll('.oo-notice')).toHaveLength(2);
      vi.advanceTimersByTime(1000);
      expect(document.querySelectorAll('.oo-notice')).toHaveLength(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('automatically dismisses persistent and long plugin notices', () => {
    vi.useFakeTimers();
    try {
      new (Notice as any)('Persistent plugin failure', 0);
      new (Notice as any)('Long plugin failure', 60_000);

      vi.advanceTimersByTime(10_000);
      expect(document.querySelectorAll('.oo-notice')).toHaveLength(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('keeps a modal input focused while its suggestion list is clicked', () => {
    const modal = new (Modal as any)();
    const suggestion = document.createElement('div');
    suggestion.className = 'suggestion-container';
    const item = document.createElement('div');
    item.className = 'suggestion-item';
    suggestion.appendChild(item);
    modal.containerEl.appendChild(suggestion);

    const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    item.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });

  it('stamps plugin modals with the active plugin scope and close button', () => {
    (window as any).__oo_active_plugin_id = 'notebook-navigator';
    const modal = new (Modal as any)();
    delete (window as any).__oo_active_plugin_id;

    expect(modal.containerEl.classList.contains('oo-plugin-scope-notebook-navigator')).toBe(true);
    expect(modal.modalEl.querySelector('.modal-close-button')).toBe(modal.closeButtonEl);

    modal.open();
    modal.closeButtonEl.click();
    expect(document.body.contains(modal.containerEl)).toBe(false);
  });

  it('infers plugin modal scope from plugin blob stacks', () => {
    const pluginBlobUrls = new Map<string, string>([
      ['blob:http://localhost:5173/notebook-navigator-test', 'notebook-navigator'],
    ]);
    (window as any).__oo_plugin_blob_urls = pluginBlobUrls;
    const OriginalError = globalThis.Error;
    class StackError extends OriginalError {
      stack = 'Error\n    at open (blob:http://localhost:5173/notebook-navigator-test:1:1)';
    }
    (globalThis as any).Error = StackError;

    try {
      const modal = new (Modal as any)();
      expect(modal.containerEl.classList.contains('oo-plugin-scope-notebook-navigator')).toBe(true);
    } finally {
      delete (window as any).__oo_plugin_blob_urls;
      (globalThis as any).Error = OriginalError;
    }
  });

  it('extends SVG elements with Obsidian class helpers', () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as any;
    svg.addClass('is-dirty');
    expect(svg.hasClass('is-dirty')).toBe(true);
    svg.removeClass('is-dirty');
    expect(svg.hasClass('is-dirty')).toBe(false);
  });

  it('provides event document and window helpers used by plugin editors', () => {
    const target = document.createElement('input');
    document.body.appendChild(target);
    let received: Event | null = null;
    target.addEventListener('focus', (event) => { received = event; });
    target.dispatchEvent(new Event('focus'));

    expect((received as any).doc).toBe(document);
    expect((received as any).win).toBe(window);
  });

  it('uses string createDiv and createSpan arguments as Obsidian CSS classes', () => {
    const div = document.body.createDiv('suggestion-item');
    const span = document.body.createSpan('suggestion-title');
    const fragment = document.createDocumentFragment();
    const fragmentDiv = (fragment as any).createDiv('suggestion-content');

    expect(div.classList.contains('suggestion-item')).toBe(true);
    expect(div.textContent).toBe('');
    expect(span.classList.contains('suggestion-title')).toBe(true);
    expect(fragmentDiv.classList.contains('suggestion-content')).toBe(true);
  });

  it('provides Kanban with a CodeMirror-backed MarkdownEditor', () => {
    const app = new OOApp();
    const host = document.createElement('div');
    const embed = app.embedRegistry.embedByExtension.md({}, null, '');
    const MarkdownEditor = Object.getPrototypeOf(Object.getPrototypeOf(embed.editMode)).constructor;
    const editor = new MarkdownEditor(app, host, {});

    expect(editor.cm.dispatch).toBeTypeOf('function');
    editor.set('Kanban card');
    expect(editor.get()).toBe('Kanban card');
    editor.unload();
  });

  it('exposes the native plugin-manager and core-plugin contracts to integrations', async () => {
    const app = new OOApp();
    new PluginManager(app, {
      onCommandsChanged: vi.fn(),
      onRibbonChanged: vi.fn(),
      onStatusBarChanged: vi.fn(),
      onSettingTabsChanged: vi.fn(),
      onPluginsChanged: vi.fn(),
    });

    expect(app.plugins.getPlugin).toBeTypeOf('function');
    expect(app.plugins.getPluginFolder({ id: 'fixture' })).toContain('fixture');
    expect(app.plugins.enablePluginAndSave).toBeTypeOf('function');
    expect(app.plugins.disablePluginAndSave).toBeTypeOf('function');
    expect(app.customCss.snippets).toEqual([]);
    expect(app.customCss.enabledSnippets).toBeInstanceOf(Set);
    expect(app.customCss.requestLoadSnippets).toBeTypeOf('function');
    const rootScope = app.keymap.getRootScope();
    const binding = rootScope.register(['Mod'], 'k', vi.fn());
    expect(rootScope.keys).toContain(binding);
    rootScope.unregister(binding);
    expect(rootScope.keys).not.toContain(binding);

    const canvas = app.internalPlugins.plugins.canvas;
    await canvas.load();
    const node = canvas.views.canvas(app.workspace.getLeaf(true)).canvas.createFileNode({
      file: await app.vault.create('Embedded.md', 'content'),
    });
    expect(canvas._loaded).toBe(true);
    expect(node.child.editor.containerEl).toBeInstanceOf(HTMLElement);
    expect(node.isEditable()).toBe(true);
  });

  it('provides the core Templates insertTemplate API used by Kanban', async () => {
    const app = new OOApp();
    const template = await app.vault.create('templates/Card.md', '## {{title}}\n{{date:YYYY}}\n{{time:HH}}');
    const note = await app.vault.create('Board.md', '# Board\n');
    (window as any).__oo_active_file = note.path;
    (window as any).electronAPI.readFile = vi.fn(async (path: string) => {
      if (path === template.path) return '## {{title}}\n{{date:YYYY}}\n{{time:HH}}';
      if (path === note.path) return '# Board\n';
      return '';
    });
    const replaceSelection = vi.fn();
    app.workspace.activeEditor = {
      editor: {
        replaceSelection,
        focus: vi.fn(),
      },
    };

    await app.internalPlugins.plugins.templates.instance.insertTemplate(template);

    expect(replaceSelection).toHaveBeenCalledWith(expect.stringContaining('## Board'));
    expect(replaceSelection).toHaveBeenCalledWith(expect.not.stringContaining('{{date'));
  });

  it('removes a plugin bundle, persisted enablement, and registry entry', async () => {
    const app = new OOApp();
    const manager = new PluginManager(app, {
      onCommandsChanged: vi.fn(),
      onRibbonChanged: vi.fn(),
      onStatusBarChanged: vi.fn(),
      onSettingTabsChanged: vi.fn(),
      onPluginsChanged: vi.fn(),
    });
    (manager as any)._plugins.set('remove-fixture', {
      manifest: { ...manifest, id: 'remove-fixture' },
      state: 'disabled',
    });
    app.plugins.manifests['remove-fixture'] = { ...manifest, id: 'remove-fixture' };

    await expect(manager.uninstallPlugin('remove-fixture')).resolves.toBe(true);
    expect((window as any).electronAPI.deleteDirectory).toHaveBeenCalledWith('.netherwrite/plugins/remove-fixture');
    expect(manager.getPlugin('remove-fixture')).toBeUndefined();
    expect(app.plugins.manifests['remove-fixture']).toBeUndefined();
  });

  it('provides collision-safe vault paths and file-manager creation methods', async () => {
    const app = new OOApp();
    await app.vault.create('Note.md', 'first');

    expect(app.vault.getAbstractFileByPathInsensitive('note.md')?.path).toBe('Note.md');
    expect(app.vault.getAvailablePath('note.md')).toBe('note 1.md');

    const created = await app.fileManager.createNewMarkdownFile(app.vault.getRoot(), 'Note', 'second');
    expect(created.path).toBe('Note 1.md');
    expect(app.fileManager.createNewFile).toBeTypeOf('function');
    expect(app.fileManager.promptForFileRename).toBeTypeOf('function');
  });

  it('updates metadata and exposes workspace integration helpers', async () => {
    const app = new OOApp();
    const file = await app.vault.create('Source.md', '# Heading\n[[Target]]');
    (window as any).electronAPI.readFile = vi.fn(async () => '# Heading\n[[Target]]');
    await app.metadataCache.updateFileCache(file);

    expect(app.metadataCache.getFileCache(file)?.headings?.[0].heading).toBe('Heading');
    expect(app.metadataCache.getBacklinksForFile(file).data).toBeInstanceOf(Map);

    const suggestion = {};
    app.workspace.editorSuggest.add(suggestion);
    expect(app.workspace.editorSuggest.suggests).toContain(suggestion);
    app.workspace.editorSuggest.remove(suggestion);
    expect(app.workspace.editorSuggest.suggests).not.toContain(suggestion);
    expect(app.workspace.getLayout().main.type).toBe('split');
  });

  it('extracts nested release ZIP bundles used by marketplace plugins', async () => {
    const zip = new JSZip();
    zip.file('plugin-release/manifest.json', JSON.stringify({
      id: 'zip-plugin',
      name: 'ZIP Plugin',
      version: '1.0.0',
    }));
    zip.file('plugin-release/main.js', 'module.exports = class ZipPlugin {};');
    zip.file('plugin-release/styles.css', '.zip-plugin { display: block; }');

    const bundle = await extractPluginBundleFromZip(
      await zip.generateAsync({ type: 'arraybuffer' }),
    );

    expect(JSON.parse(bundle.manifestText).id).toBe('zip-plugin');
    expect(bundle.mainText).toContain('ZipPlugin');
    expect(bundle.stylesText).toContain('.zip-plugin');
  });

  it('runs registered cleanup callbacks when a component unloads', () => {
    const component = new (Component as any)();
    const cleanup = vi.fn();
    component.register(cleanup);
    component.load();
    component.unload();
    expect(cleanup).toHaveBeenCalledOnce();
  });

  it('renders and cleans up Markdown code block processors', async () => {
    const app = new OOApp();
    const plugin = new (Plugin as any)(app, manifest);
    plugin.registerMarkdownCodeBlockProcessor('fixture', (source: string, el: HTMLElement, ctx: any) => {
      el.textContent = `${ctx.sourcePath}:${source.trim()}`;
      ctx.addChild({ load: vi.fn(), unload: vi.fn() });
    });
    plugin.load();

    const container = document.createElement('div');
    container.innerHTML = '<pre><code class="language-fixture">hello</code></pre>';
    const cleanup = await runMarkdownPostProcessors(container, 'fixture.md');

    expect(container.querySelector('.block-language-fixture')?.textContent).toBe('fixture.md:hello');
    expect(getMarkdownProcessorCounts().codeBlockProcessors).toBe(1);
    cleanup();
    plugin.unload();
    expect(getMarkdownProcessorCounts().codeBlockProcessors).toBe(0);
  });

  it('supports export-plugin Markdown capture and post-process children', async () => {
    const captured: { children?: HTMLCollection } = {};
    await MarkdownRenderer.render(
      new OOApp(),
      '# Export\n\nRendered content',
      {
        appendChild(element: HTMLElement) {
          captured.children = element.children;
        },
      },
      'fixture.md',
      null,
    );

    expect(Array.from(captured.children ?? [])).toHaveLength(2);
    expect(captured.children?.[0].tagName).toBe('H1');

    let child: any;
    await MarkdownRenderer.postProcess(new OOApp(), {
      containerEl: document.createElement('div'),
      addChild(value: any) {
        child = value;
        value.load();
      },
    });
    expect(child.load).toBeTypeOf('function');
    expect(child.unload).toBeTypeOf('function');
  });

  it('creates modern confirmation controls', () => {
    const app = new OOApp();
    const modal = new ConfirmationModal(app);
    const clicked = vi.fn();
    modal
      .setTitle('Dangerous action')
      .addCheckbox('I understand', clicked)
      .addButton((button) => button.setButtonText('Continue').setInitialFocus())
      .addCancelButton();
    modal.open();

    expect(modal.titleEl.textContent).toBe('Dangerous action');
    expect(modal.buttonContainerEl.querySelectorAll('button')).toHaveLength(2);
    const checkbox = modal.contentEl.querySelector<HTMLInputElement>('input[type="checkbox"]')!;
    checkbox.click();
    expect(clicked).toHaveBeenCalledWith(true);
    modal.close();
  });

  it('builds setting groups and custom workspace views', async () => {
    const app = new OOApp();
    const group = new SettingGroup(document.body)
      .setHeading('Group')
      .addSetting((setting) => setting.setName('Entry'));
    expect(group.listEl.textContent).toContain('Entry');

    class FixtureView extends (ItemView as any) {
      getViewType() { return 'fixture-view'; }
      getDisplayText() { return 'Fixture View'; }
      async onOpen() { this.contentEl.setText('ready'); }
    }

    app.workspace.registerViewCreator('fixture-view', (leaf: WorkspaceLeaf) => new FixtureView(leaf));
    const leaf = app.workspace.getRightLeaf(false)!;
    await leaf.setViewState({ type: 'fixture-view', active: true });
    expect(app.workspace.getLeavesOfType('fixture-view')).toHaveLength(1);
    expect(leaf.view.containerEl).toBe(leaf.containerEl);
    expect(leaf.containerEl.dataset.type).toBe('fixture-view');
    expect(leaf.containerEl.firstElementChild?.classList.contains('view-header')).toBe(true);
    expect(leaf.containerEl.lastElementChild?.classList.contains('view-content')).toBe(true);
    expect(leaf.view.containerEl.textContent).toContain('ready');
    leaf.detach();
    expect(app.workspace.getLeavesOfType('fixture-view')).toHaveLength(0);
  });

  it('gives sidebar plugins a stateful dock and revealed workspace leaf', async () => {
    const app = new OOApp();
    class NavigatorView extends (ItemView as any) {
      getViewType() { return 'notebook-navigator'; }
      getDisplayText() { return 'Notebook Navigator'; }
      async onOpen() { this.contentEl.setText('navigator ready'); }
    }

    app.workspace.registerViewCreator('notebook-navigator', (leaf: WorkspaceLeaf) => new NavigatorView(leaf));
    const leaf = app.workspace.getLeftLeaf(false)!;
    await leaf.setViewState({ type: 'notebook-navigator' });
    await app.workspace.revealLeaf(leaf);

    expect(app.workspace.getActivePluginViews()[0]).toMatchObject({
      viewType: 'notebook-navigator',
      side: 'left',
      visible: true,
    });
    expect(leaf.view.containerEl.textContent).toContain('navigator ready');
    expect(leaf.parent.getRoot()).toBe(app.workspace.rootSplit);
    expect(leaf.getContainer().win).toBe(window);

    const sidebarChanges: Array<{ side: string; collapsed: boolean }> = [];
    app.workspace.on('sidebar-change', (state: { side: string; collapsed: boolean }) => sidebarChanges.push(state));
    app.workspace.leftSplit.expand();
    expect(sidebarChanges.at(-1)).toEqual({ side: 'left', collapsed: false });

    app.workspace.leftSplit.collapse();
    expect(app.workspace.leftSplit.collapsed).toBe(true);
    app.workspace.leftSplit.expand();
    expect(app.workspace.leftSplit.collapsed).toBe(false);

    app.workspace.revealDefaultView('left');
    expect(app.workspace.getActivePluginViews()[0]).toMatchObject({
      viewType: 'notebook-navigator',
      visible: false,
    });
  });

  it('exposes item view actions for titlebar hosts', async () => {
    const app = new OOApp();
    const clicked = vi.fn();
    class ActionView extends (ItemView as any) {
      getViewType() { return 'action-view'; }
      getDisplayText() { return 'Action View'; }
      async onOpen() {
        this.addAction('folder', 'Open folder', clicked);
      }
    }

    app.workspace.registerViewCreator('action-view', (leaf: WorkspaceLeaf) => new ActionView(leaf));
    const leaf = app.workspace.getLeftLeaf(false)!;
    await leaf.setViewState({ type: 'action-view' });
    await app.workspace.revealLeaf(leaf);

    const view = app.workspace.getActivePluginViews()[0];
    expect(view.actions).toHaveLength(1);
    expect(view.actions?.[0]).toMatchObject({ icon: 'folder', title: 'Open folder' });
    view.actions?.[0].el.click();
    expect(clicked).toHaveBeenCalledTimes(1);
  });

  it('creates distinct workspace leaves for tab, split, and window contexts', () => {
    const app = new OOApp();
    const tab = app.workspace.getLeaf('tab');
    const split = app.workspace.getLeaf('split');
    const windowLeaf = app.workspace.getLeaf('window');

    expect(new Set([tab.id, split.id, windowLeaf.id]).size).toBe(3);
  });

  it('recursively copies folders for Notebook Navigator folder duplication', async () => {
    const files = new Map<string, Uint8Array>([
      ['Projects/notes.md', new TextEncoder().encode('# Notes')],
      ['Projects/assets/image.bin', new Uint8Array([1, 2, 3])],
    ]);
    const directories = new Set(['Projects', 'Projects/assets']);
    const fileTree = () => [
      {
        isDirectory: true,
        path: 'Projects',
        children: [
          { isDirectory: false, path: 'Projects/notes.md', modifiedAt: 0, size: 7 },
          {
            isDirectory: true,
            path: 'Projects/assets',
            children: [{ isDirectory: false, path: 'Projects/assets/image.bin', modifiedAt: 0, size: 3 }],
          },
        ],
      },
      ...(directories.has('Projects copy') ? [{
        isDirectory: true,
        path: 'Projects copy',
        children: [
          { isDirectory: false, path: 'Projects copy/notes.md', modifiedAt: 0, size: 7 },
          {
            isDirectory: true,
            path: 'Projects copy/assets',
            children: [{ isDirectory: false, path: 'Projects copy/assets/image.bin', modifiedAt: 0, size: 3 }],
          },
        ],
      }] : []),
    ];
    (window as any).electronAPI = {
      ...(window as any).electronAPI,
      getFileTree: vi.fn(async () => fileTree()),
      createDirectory: vi.fn(async (path: string) => { directories.add(path); }),
      readBinary: vi.fn(async (path: string) => files.get(path) || new Uint8Array()),
      writeBinary: vi.fn(async (path: string, data: Uint8Array) => { files.set(path, new Uint8Array(data)); }),
    };

    const app = new OOApp();
    await app.vault.refreshFiles();
    const source = app.vault.getFolderByPath('Projects')!;
    const copied = await app.vault.copy(source, 'Projects copy');

    expect(copied.path).toBe('Projects copy');
    expect(Array.from(files.get('Projects copy/notes.md') || [])).toEqual(Array.from(files.get('Projects/notes.md') || []));
    expect(Array.from(files.get('Projects copy/assets/image.bin') || [])).toEqual([1, 2, 3]);
  });

  it('renames folders through the vault without leaving stale child paths', async () => {
    const app = new OOApp();
    await app.vault.createFolder('Old');
    await app.vault.create('Old/Note.md', '# Note');
    const folder = app.vault.getFolderByPath('Old');
    const renamed = vi.fn();
    window.addEventListener('netherwrite:file-renamed', renamed);

    await app.vault.rename(folder!, 'New');

    expect((window as any).electronAPI.renameFile).toHaveBeenCalledWith('Old', 'New');
    expect(app.vault.getFolderByPath('Old')).toBeNull();
    expect(app.vault.getFileByPath('Old/Note.md')).toBeNull();
    expect(app.vault.getFolderByPath('New')).not.toBeNull();
    expect(app.vault.getFileByPath('New/Note.md')).not.toBeNull();
    expect(renamed).toHaveBeenCalledTimes(1);
    expect((renamed.mock.calls[0][0] as CustomEvent).detail).toMatchObject({
      oldPath: 'Old',
      newPath: 'New',
      isDirectory: true,
    });

    window.removeEventListener('netherwrite:file-renamed', renamed);
  });

  it('opens registered file extensions in their plugin view with file state', async () => {
    const app = new OOApp();
    class DrawingView extends (TextFileView as any) {
      state: any = null;
      loadedData = '';
      getViewType() { return 'drawing-view'; }
      async setState(state: any) {
        this.state = state;
        await super.setState(state);
      }
      async onLoadFile(file: TFile) {
        await super.onLoadFile(file);
        this.loadedData = this.data;
      }
    }

    app.workspace.registerViewCreator('drawing-view', (leaf: WorkspaceLeaf) => new DrawingView(leaf));
    app.workspace.registerExtensions(['drawing'], 'drawing-view');
    const file = await app.vault.create('Canvas.drawing', 'scene');
    (window as any).electronAPI.readFile.mockResolvedValue('scene');
    const leaf = app.workspace.getLeaf(true);

    await leaf.openFile(file);

    expect(leaf.view.getViewType()).toBe('drawing-view');
    expect((leaf.view as any).file).toBe(file);
    expect((leaf.view as any).state).toEqual({ file: 'Canvas.drawing' });
    expect((leaf.view as any).loadedData).toBe('scene');
    expect((leaf.view as any).contentEl).toBeInstanceOf(HTMLElement);
    expect((leaf.view as any).addAction).toBeTypeOf('function');
    expect(app.workspace.activeLeaf).toBe(leaf);
  });

  it('preserves binary vault data without base64 text conversion', async () => {
    const app = new OOApp();
    const bytes = new Uint8Array([0, 1, 127, 128, 255]);
    const file = await app.vault.createBinary('asset.bin', bytes.buffer);
    expect((window as any).electronAPI.writeBinary).toHaveBeenCalledWith(
      'asset.bin',
      expect.objectContaining({ 0: 0, 4: 255 }),
    );
    (window as any).electronAPI.readBinary.mockResolvedValue(bytes);
    expect(Array.from(new Uint8Array(await app.vault.readBinary(file)))).toEqual(Array.from(bytes));

    await app.vault.adapter.writeBinary('plugin-resource.bin', bytes);
    expect((window as any).electronAPI.writeBinary).toHaveBeenCalledWith(
      'plugin-resource.bin',
      expect.objectContaining({ 0: 0, 4: 255 }),
    );
  });

  it('enumerates metadata cache files and exposes the active file view', async () => {
    const app = new OOApp();
    (app.metadataCache as any)._cache.set('drawing.excalidraw.md', { frontmatter: { 'excalidraw-plugin': 'parsed' } });
    expect(app.metadataCache.getCachedFiles()).toEqual(['drawing.excalidraw.md']);
    expect(app.workspace.getActiveFileView()).toBe(app.workspace.activeLeaf.view);
  });

  it('executes registered commands through the app command registry', () => {
    const app = new OOApp();
    const callback = vi.fn();
    (app as any).commands.addCommand({ id: 'fixture:run', callback });

    expect((app as any).commands.executeCommandById('fixture:run')).toBe(true);
    expect(callback).toHaveBeenCalledOnce();
    expect((app as any).commands.listCommands()).toHaveLength(1);

    (app as any).commands.removeCommand('fixture:run');
    expect((app as any).commands.executeCommandById('fixture:run')).toBe(false);
  });

  it('provides aggregate links, tags, suggestions, and parsed block cache', async () => {
    const app = new OOApp();
    const file = new TFile('fixture.md');
    file.vault = app.vault;
    (app.vault as any)._files.set(file.path, file);
    (window as any).electronAPI.readFile.mockResolvedValue(
      '---\ntags: alpha, beta\n---\n# Heading\nParagraph ^block-id\n[[Other]] #inline',
    );

    await app.metadataCache.buildCache(app.vault);

    expect(app.metadataCache.getLinks()['fixture.md']?.[0].link).toBe('Other');
    expect(app.metadataCache.getTags()).toMatchObject({ '#alpha': 1, '#beta': 1, '#inline': 1 });
    expect(app.metadataCache.getLinkSuggestions()[0]).toMatchObject({ path: 'fixture.md', file });
    expect(app.metadataCache.blockCache.getForFile(null, file).blocks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ display: 'Heading', node: expect.objectContaining({ type: 'heading', level: 1 }) }),
        expect.objectContaining({ display: 'Paragraph', node: expect.objectContaining({ id: 'block-id' }) }),
      ]),
    );
  });

  it('adapts CodeMirror 6 to the Obsidian Editor contract', () => {
    const host = document.createElement('div');
    document.body.append(host);
    const view = new EditorView({
      parent: host,
      state: EditorState.create({ doc: 'alpha\nbeta' }),
    });
    const editor = new Editor(view);

    editor.setSelection({ line: 0, ch: 1 }, { line: 0, ch: 5 });
    expect(editor.getSelection()).toBe('lpha');
    editor.replaceSelection('ONE');
    editor.replaceRange('two', { line: 1, ch: 0 }, { line: 1, ch: 4 });
    editor.transaction({
      changes: [
        { from: { line: 0, ch: 0 }, to: { line: 0, ch: 1 }, text: 'A' },
        { from: { line: 1, ch: 0 }, to: { line: 1, ch: 3 }, text: 'TWO' },
      ],
      selection: { from: { line: 1, ch: 3 } },
    });

    expect(editor.getValue()).toBe('AONE\nTWO');
    expect(editor.getCursor()).toEqual({ line: 1, ch: 3 });
    expect(editor.posToOffset({ line: 1, ch: 2 })).toBe(7);
    expect(editor.offsetToPos(7)).toEqual({ line: 1, ch: 2 });

    view.destroy();
  });
});

describe('plugin vault adapter compatibility', () => {
  beforeEach(() => {
    localStorage.removeItem('netherwrite-settings');
    delete (window as any).__oo_vault_path;
  });

  function installMapFs(initial: Record<string, string> = {}) {
    const files = new Map<string, string>(Object.entries(initial));
    const api = (window as any).electronAPI;
    const hasPrefix = (path: string) => {
      const prefix = path.endsWith('/') ? path : `${path}/`;
      for (const key of files.keys()) {
        if (key.startsWith(prefix)) return true;
      }
      return false;
    };
    api.readFile = vi.fn(async (path: string) => (files.has(path) ? files.get(path)! : null));
    api.writeFile = vi.fn(async (path: string, content: string) => {
      files.set(path, content);
    });
    api.createFile = vi.fn(async (path: string, content?: string) => {
      if (!files.has(path)) files.set(path, content || '');
    });
    api.createDirectory = vi.fn(async () => {});
    api.deleteFile = vi.fn(async (path: string) => {
      files.delete(path);
    });
    api.deleteDirectory = vi.fn(async (dirPath: string) => {
      const prefix = dirPath.endsWith('/') ? dirPath : `${dirPath}/`;
      for (const key of Array.from(files.keys())) {
        if (key === dirPath || key.startsWith(prefix)) files.delete(key);
      }
    });
    api.fileExists = vi.fn(async (path: string) => files.has(path) || hasPrefix(path));
    api.renameFile = vi.fn(async (oldPath: string, newPath: string) => {
      if (files.has(oldPath)) {
        files.set(newPath, files.get(oldPath)!);
        files.delete(oldPath);
        return;
      }
      const prefix = oldPath.endsWith('/') ? oldPath : `${oldPath}/`;
      const nextPrefix = newPath.endsWith('/') ? newPath : `${newPath}/`;
      for (const key of Array.from(files.keys())) {
        if (key.startsWith(prefix)) {
          files.set(nextPrefix + key.slice(prefix.length), files.get(key)!);
          files.delete(key);
        }
      }
    });
    api.listFiles = vi.fn(async (dirPath?: string) => {
      const target = dirPath || '';
      if (target && files.has(target) && !hasPrefix(target)) {
        throw new Error('ENOTDIR');
      }
      const prefix = target ? `${target.replace(/\/$/, '')}/` : '';
      const names = new Map<string, { name: string; path: string; isDirectory: boolean }>();
      for (const key of files.keys()) {
        if (prefix && !key.startsWith(prefix)) continue;
        const rest = prefix ? key.slice(prefix.length) : key;
        const [name, ...more] = rest.split('/');
        if (!name) continue;
        const isDirectory = more.length > 0;
        const path = prefix ? `${prefix.replace(/\/$/, '')}/${name}` : name;
        if (!names.has(name) || isDirectory) {
          names.set(name, { name, path, isDirectory });
        }
      }
      return Array.from(names.values());
    });
    api.trashFile = vi.fn(async (path: string) => {
      files.set(`__system_trash__/${path}`, files.get(path) || '');
      files.delete(path);
    });
    return files;
  }

  it('lets plugins read, list, and stat hidden config folders through the adapter', async () => {
    const files = installMapFs({
      '.obsidian/snippets/wide.css': 'body { max-width: none; }',
      '.netherwrite/plugins/demo/data.json': '{"ok":true}',
    });
    const app = new OOApp();

    expect(await app.vault.adapter.exists('.obsidian/snippets/wide.css')).toBe(true);
    expect(await app.vault.adapter.read('.obsidian/snippets/wide.css')).toContain('max-width');
    const listing = await app.vault.adapter.list('.obsidian/snippets');
    expect(listing.files.some((path: string) => path.endsWith('wide.css'))).toBe(true);
    const stat = await app.vault.adapter.stat('.netherwrite/plugins/demo/data.json');
    expect(stat?.type).toBe('file');
    expect(files.has('.netherwrite/plugins/demo/data.json')).toBe(true);
  });

  it('moves notes to .trash instead of deleting them when plugins call vault.trash(file, false)', async () => {
    const files = installMapFs({ 'Keep.md': 'safe' });
    const app = new OOApp();
    const note = await app.vault.create('Keep.md', 'safe');
    files.set('Keep.md', 'safe');

    await app.vault.trash(note, false);

    expect(files.has('Keep.md')).toBe(false);
    expect(files.get('.trash/Keep.md')).toBe('safe');
    expect(app.vault.getAbstractFileByPath('Keep.md')).toBeNull();
  });

  it('uses the system trash API when plugins call vault.trash(file, true)', async () => {
    const files = installMapFs({ 'Gone.md': 'bye' });
    const app = new OOApp();
    const note = await app.vault.create('Gone.md', 'bye');
    files.set('Gone.md', 'bye');

    await app.vault.trash(note, true);

    expect(files.has('Gone.md')).toBe(false);
    expect(files.get('__system_trash__/Gone.md')).toBe('bye');
    expect((window as any).electronAPI.trashFile).toHaveBeenCalledWith('Gone.md');
  });

  it('stats a hidden config directory as a folder, not a file', async () => {
    installMapFs({
      '.obsidian/snippets/wide.css': 'body {}',
      '.obsidian/appearance.json': '{}',
    });
    const app = new OOApp();

    const stat = await app.vault.adapter.stat('.obsidian');
    expect(stat?.type).toBe('folder');
  });

  it('resolves adapter.fs exists() for absolute Unix vault paths', async () => {
    (window as any).__oo_vault_path = '/Users/me/vault';
    const files = installMapFs({ 'Note.md': 'hello' });
    const app = new OOApp();
    await app.vault.create('Note.md', 'hello');
    files.set('Note.md', 'hello');

    await new Promise<void>((resolve, reject) => {
      app.vault.adapter.fs.exists('/Users/me/vault/Note.md', (exists: boolean) => {
        try {
          expect(exists).toBe(true);
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  });

  it('moves a folder and its children into .trash when plugins trash a directory', async () => {
    const files = installMapFs({
      'Notes/A.md': 'a',
      'Notes/B.md': 'b',
    });
    const app = new OOApp();
    await app.vault.createFolder('Notes');
    const folder = app.vault.getAbstractFileByPath('Notes');
    await app.vault.create('Notes/A.md', 'a');
    await app.vault.create('Notes/B.md', 'b');
    files.set('Notes/A.md', 'a');
    files.set('Notes/B.md', 'b');

    await app.vault.trash(folder!, false);

    expect(files.has('Notes/A.md')).toBe(false);
    expect(files.has('Notes/B.md')).toBe(false);
    expect(files.get('.trash/Notes/A.md')).toBe('a');
    expect(files.get('.trash/Notes/B.md')).toBe('b');
  });

  it('copies a folder into .trash when renameFile fails', async () => {
    const files = installMapFs({
      'Inbox/One.md': 'one',
    });
    const app = new OOApp();
    await app.vault.createFolder('Inbox');
    const folder = app.vault.getAbstractFileByPath('Inbox');
    await app.vault.create('Inbox/One.md', 'one');
    files.set('Inbox/One.md', 'one');

    let renameCalls = 0;
    (window as any).electronAPI.renameFile = vi.fn(async (oldPath: string, newPath: string) => {
      renameCalls += 1;
      if (oldPath === 'Inbox') throw new Error('EXDEV');
      files.set(newPath, files.get(oldPath)!);
      files.delete(oldPath);
    });

    await app.vault.trash(folder!, false);

    expect(renameCalls).toBeGreaterThan(0);
    expect(files.has('Inbox/One.md')).toBe(false);
    expect(files.get('.trash/Inbox/One.md')).toBe('one');
  });

  it('honors permanent delete in FileManager.trashFile', async () => {
    const files = installMapFs({ 'Temp.md': 'x' });
    localStorage.setItem('netherwrite-settings', JSON.stringify({ deletedFilesMode: 'permanent' }));
    const app = new OOApp();
    const note = await app.vault.create('Temp.md', 'x');
    files.set('Temp.md', 'x');

    await app.fileManager.trashFile(note);

    expect(files.has('Temp.md')).toBe(false);
    expect(files.has('.trash/Temp.md')).toBe(false);
    expect(files.has('__system_trash__/Temp.md')).toBe(false);
  });
});
