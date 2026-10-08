/*
 * Runs a disposable Electron smoke test against an installed Kanban plugin.
 * The board created by the command is deleted before the process exits.
 *
 * Usage:
 *   OO_KANBAN_VAULT=/path/to/vault node scripts/test-kanban-live.cjs
 */

const { spawn } = require('node:child_process');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const vault = process.env.OO_KANBAN_VAULT;
const vitePort = Number(process.env.OO_KANBAN_VITE_PORT || 5176);
const debugPort = Number(process.env.OO_KANBAN_DEBUG_PORT || 9227);

if (!vault) throw new Error('Set OO_KANBAN_VAULT to a vault with Kanban enabled.');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitFor(check, label, timeoutMs = 30_000) {
  const started = Date.now();
  let lastError;
  while (Date.now() - started < timeoutMs) {
    try {
      const value = await check();
      if (value) return value;
    } catch (error) {
      lastError = error;
    }
    await delay(250);
  }
  throw new Error(`${label} did not become ready${lastError ? `: ${lastError.message}` : ''}`);
}

async function evaluate(expression) {
  const targets = await fetch(`http://127.0.0.1:${debugPort}/json/list`).then((response) => response.json());
  const target = targets.find((entry) => entry.type === 'page' && entry.url.startsWith(`http://127.0.0.1:${vitePort}`));
  if (!target) throw new Error('NetherWrite renderer target was not found.');

  return new Promise((resolve, reject) => {
    const socket = new WebSocket(target.webSocketDebuggerUrl);
    const timeout = setTimeout(() => {
      socket.close();
      reject(new Error('Timed out evaluating renderer expression.'));
    }, 30_000);
    socket.addEventListener('open', () => {
      socket.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: { expression, awaitPromise: true, returnByValue: true },
      }));
    });
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (message.id !== 1) return;
      clearTimeout(timeout);
      socket.close();
      if (message.result.exceptionDetails) {
        reject(new Error(message.result.exceptionDetails.text));
        return;
      }
      resolve(message.result.result.value);
    });
    socket.addEventListener('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

const vite = spawn(process.execPath, [
  path.join(root, 'node_modules/vite/bin/vite.js'),
  '--host', '127.0.0.1',
  '--port', String(vitePort),
  '--strictPort',
], { cwd: root, stdio: 'pipe' });

let electron;

async function main() {
  console.log('Waiting for Vite...');
  await waitFor(async () => (await fetch(`http://127.0.0.1:${vitePort}`)).ok, 'Vite');
  const electronEnv = {
    ...process.env,
    NODE_ENV: 'development',
    VITE_DEV_SERVER_URL: `http://127.0.0.1:${vitePort}`,
    NETHERWRITE_DEBUG_PORT: String(debugPort),
  };
  delete electronEnv.ELECTRON_RUN_AS_NODE;
  electron = spawn(require('electron'), ['.'], { cwd: root, stdio: 'pipe', env: electronEnv });

  console.log('Waiting for Electron...');
  await waitFor(async () => {
    const targets = await fetch(`http://127.0.0.1:${debugPort}/json/list`).then((response) => response.json());
    return targets.some((entry) => entry.type === 'page' && entry.url.startsWith(`http://127.0.0.1:${vitePort}`));
  }, 'Electron debugger');

  console.log('Loading test vault...');
  await evaluate(`electronAPI.setVaultPath(${JSON.stringify(vault)}).then(() => location.reload())`);
  console.log('Waiting for Kanban plugin...');
  await waitFor(async () => (await evaluate(`Object.keys(app?.plugins?.plugins || {})`)).includes('obsidian-kanban'), 'Kanban plugin');

  console.log('Opening disposable Kanban board...');
  const result = await evaluate(`
    (async () => {
      const errors = [];
      const describeError = (error) => error?.stack || String(error);
      const onError = (event) => errors.push(describeError(event.error || event.message));
      const onRejection = (event) => errors.push(describeError(event.reason));
      const originalConsoleError = console.error;
      console.error = (...args) => {
        errors.push(args.map(describeError).join(' '));
        originalConsoleError(...args);
      };
      const boardPath = 'Kanban live smoke test.md';
      const editorPath = 'Plugin editor compatibility smoke test.md';
      const source = ['---', 'kanban-plugin: board', '---', '', '## Todo', '- [ ] Render a Kanban card', '', '## Done', '- Completed card', ''].join('\\n');
      window.addEventListener('error', onError);
      window.addEventListener('unhandledrejection', onRejection);
      try {
        const existing = app.vault.getFileByPath(boardPath);
        if (existing) await app.vault.delete(existing);
        const existingEditorFile = app.vault.getFileByPath(editorPath);
        if (existingEditorFile) await app.vault.delete(existingEditorFile);
        await app.vault.create(editorPath, '# Plugin editor compatibility\\n\\n[[Kanban live smoke test]]');
        await window.__oo_open_file?.(editorPath, 'editor');
        for (let attempt = 0; attempt < 20 && !document.querySelector('.cm-editor'); attempt++) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        const hostEditorReady = Boolean(document.querySelector('.cm-editor'));
        const hostEditorDiagnostics = {
          leafHosts: document.querySelectorAll('.leaf-editor-host').length,
          editorContainers: document.querySelectorAll('.editor-container').length,
          activeFile: window.__oo_active_file,
          activeViewType: app.workspace.activeLeaf?.view?.getViewType?.(),
        };
        const file = await app.vault.create(boardPath, source);
        await app.metadataCache.updateFileCache(file);
        await window.__oo_open_file?.(boardPath);
        await new Promise((resolve) => setTimeout(resolve, 500));
        const routedViewType = app.workspace.activeLeaf?.view?.getViewType?.();
        const leaf = app.workspace.activeLeaf;
        for (let attempt = 0; attempt < 30 && !leaf.view?.contentEl?.querySelector?.('.kanban-plugin'); attempt++) {
          await new Promise((resolve) => setTimeout(resolve, 250));
        }
        const view = leaf.view;
        const plugin = app.plugins.getPlugin('obsidian-kanban');
        const board = view?.getBoard?.();
        const pointerTarget = (element) => {
          if (!element) return { receivesPointer: false, reason: 'missing element' };
          const rect = element.getBoundingClientRect();
          if (!rect.width || !rect.height) return { receivesPointer: false, rect: rect.toJSON(), reason: 'zero-size element' };
          const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
          return {
            receivesPointer: Boolean(hit && (hit === element || element.contains(hit))),
            rect: rect.toJSON(),
            hitTag: hit?.tagName,
          hitClass: typeof hit?.className === 'string' ? hit.className : '',
        };
        };
        const addCardButton = view?.contentEl?.querySelector?.('.kanban-plugin__new-item-button');
        const addCardHitTarget = pointerTarget(addCardButton);
        addCardButton?.click();
        await new Promise((resolve) => setTimeout(resolve, 150));
        const cardEditorEl = view?.contentEl?.querySelector?.('.cm-content');
        const editorRoot = cardEditorEl?.closest?.('.cm-editor');
        const inlineEditorReady = typeof editorRoot?.__oo_editor_view?.dispatch === 'function';
        const inlineEditorHitTarget = pointerTarget(cardEditorEl);
        // The initial board form is the interaction that users see when
        // creating a new Kanban board. Exercise its physical hit targets,
        // toggle, and Add list action rather than only invoking callbacks.
        view?.emitter?.emit?.('showLaneForm');
        await new Promise((resolve) => setTimeout(resolve, 100));
        const laneForm = view?.contentEl?.querySelector?.('.kanban-plugin__lane-form-wrapper');
        const laneInput = laneForm?.querySelector?.('.cm-content');
        const laneToggle = laneForm?.querySelector?.('.checkbox-container');
        const addListButton = laneForm?.querySelector?.('.kanban-plugin__lane-action-add');
        const lanesBeforeAdd = view?.contentEl?.querySelectorAll?.('.kanban-plugin__lane').length || 0;
        const laneFormHitTargets = {
          input: pointerTarget(laneInput),
          toggle: pointerTarget(laneToggle),
          addList: pointerTarget(addListButton),
        };
        laneToggle?.click();
        await new Promise((resolve) => setTimeout(resolve, 50));
        const toggleWorked = laneToggle?.classList.contains('is-enabled') || false;
        addListButton?.click();
        await new Promise((resolve) => setTimeout(resolve, 150));
        const lanesAfterAdd = view?.contentEl?.querySelectorAll?.('.kanban-plugin__lane').length || 0;
        const interactiveHitTargets = {
          addCard: addCardHitTarget,
          editor: inlineEditorHitTarget,
          laneForm: laneFormHitTargets,
        };
        const renderedCards = view?.contentEl?.querySelectorAll?.('.kanban-plugin__item').length || 0;
        const persistedSource = source + '\\n## Later\\n- Persisted card\\n';
        view?.requestSaveToDisk?.(persistedSource);
        await new Promise((resolve) => setTimeout(resolve, 2_500));
        const persisted = await app.vault.read(file);
        const result = {
          errors,
          viewType: view?.getViewType?.(),
          routedViewType,
          viewFile: view?.file?.path,
          pluginLoaded: plugin?._loaded,
          hasBoardState: Array.isArray(board?.children) && board.children.length === 2,
          hasRenderedBoard: !!view?.contentEl?.querySelector?.('.kanban-plugin'),
          hasRenderedLanes: view?.contentEl?.querySelectorAll?.('.kanban-plugin__lane').length || 0,
          hasRenderedCards: renderedCards,
          inlineEditorReady,
          interactiveHitTargets,
          toggleWorked,
          addedList: lanesAfterAdd === lanesBeforeAdd + 1,
          hostEditorReady,
          hostEditorDiagnostics,
          pluginBlobUrls: Array.from(window.__oo_plugin_blob_urls || []),
          persisted: persisted.includes('Persisted card'),
        };
        await leaf.setViewState({ type: 'empty', state: {} });
        await app.vault.delete(file);
        return result;
      } finally {
        const file = app.vault.getFileByPath(boardPath);
        if (file) await app.vault.delete(file);
        const editorFile = app.vault.getFileByPath(editorPath);
        if (editorFile) await app.vault.delete(editorFile);
        window.removeEventListener('error', onError);
        window.removeEventListener('unhandledrejection', onRejection);
        console.error = originalConsoleError;
      }
    })()
  `);

  const failures = [
    result.viewType !== 'kanban' && `unexpected view type: ${result.viewType}`,
    result.routedViewType !== 'kanban' && `file-tree route opened ${result.routedViewType} instead of Kanban`,
    result.viewFile !== 'Kanban live smoke test.md' && 'view did not receive the board file',
    !result.pluginLoaded && 'Kanban plugin did not load',
    !result.hasBoardState && 'Kanban board state did not parse its lanes',
    !result.hasRenderedBoard && 'Kanban board did not render',
    result.hasRenderedLanes < 2 && 'Kanban lanes did not render',
    result.hasRenderedCards < 2 && 'Kanban cards did not render',
    !result.inlineEditorReady && 'Kanban inline card editor did not initialize',
    !result.interactiveHitTargets?.laneForm?.input?.receivesPointer && 'Kanban list-title editor is not the pointer hit target',
    !result.interactiveHitTargets?.laneForm?.toggle?.receivesPointer && 'Kanban list-complete toggle is not the pointer hit target',
    !result.interactiveHitTargets?.laneForm?.addList?.receivesPointer && 'Kanban Add list control is not the pointer hit target',
    !result.toggleWorked && 'Kanban list-complete toggle did not respond',
    !result.addedList && 'Kanban Add list control did not add a lane',
    !result.hostEditorReady && 'host Markdown editor did not initialize with installed plugin extensions',
    !result.persisted && 'Kanban board data was not saved to the vault',
    result.errors.length > 0 && `renderer errors: ${result.errors.join('; ')}`,
  ].filter(Boolean);
  if (failures.length) {
    console.error(JSON.stringify(result, null, 2));
    throw new Error(failures.join('\\n'));
  }
  console.log(JSON.stringify(result, null, 2));
}

main()
  .finally(() => {
    electron?.kill('SIGTERM');
    vite.kill('SIGTERM');
  })
  .catch((error) => {
    console.error(error.stack || error);
    process.exitCode = 1;
  });
