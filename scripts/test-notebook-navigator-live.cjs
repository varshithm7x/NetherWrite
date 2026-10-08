/*
 * Runs a smoke test against an installed Notebook Navigator plugin.
 *
 * Usage:
 *   OO_NOTEBOOK_NAVIGATOR_VAULT=/path/to/vault node scripts/test-notebook-navigator-live.cjs
 */

const { spawn } = require('node:child_process');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const vault = process.env.OO_NOTEBOOK_NAVIGATOR_VAULT;
const vitePort = Number(process.env.OO_NOTEBOOK_NAVIGATOR_VITE_PORT || 5178);
const debugPort = Number(process.env.OO_NOTEBOOK_NAVIGATOR_DEBUG_PORT || 9228);

if (!vault) throw new Error('Set OO_NOTEBOOK_NAVIGATOR_VAULT to a vault with Notebook Navigator enabled.');

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
    socket.addEventListener('open', () => socket.send(JSON.stringify({
      id: 1,
      method: 'Runtime.evaluate',
      params: { expression, awaitPromise: true, returnByValue: true },
    })));
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (message.id !== 1) return;
      clearTimeout(timeout);
      socket.close();
      if (message.result.exceptionDetails) {
        reject(new Error(message.result.exceptionDetails.exception?.description || message.result.exceptionDetails.text));
      } else {
        resolve(message.result.result.value);
      }
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
  await waitFor(async () => (await fetch(`http://127.0.0.1:${vitePort}`)).ok, 'Vite');
  const electronEnv = {
    ...process.env,
    NODE_ENV: 'development',
    VITE_DEV_SERVER_URL: `http://127.0.0.1:${vitePort}`,
    NETHERWRITE_DEBUG_PORT: String(debugPort),
  };
  delete electronEnv.ELECTRON_RUN_AS_NODE;
  electron = spawn(require('electron'), ['.'], { cwd: root, stdio: 'pipe', env: electronEnv });

  await waitFor(async () => {
    const targets = await fetch(`http://127.0.0.1:${debugPort}/json/list`).then((response) => response.json());
    return targets.some((entry) => entry.type === 'page' && entry.url.startsWith(`http://127.0.0.1:${vitePort}`));
  }, 'Electron debugger');

  await evaluate(`electronAPI.setVaultPath(${JSON.stringify(vault)}).then(() => location.reload())`);
  await waitFor(
    async () => (await evaluate(`Object.keys(app?.plugins?.plugins || {})`)).includes('notebook-navigator'),
    'Notebook Navigator plugin',
  );

  const result = await evaluate(`
    (async () => {
      const errors = [];
      const capture = (event) => errors.push(event.error?.stack || event.reason?.stack || String(event.error || event.reason || event.message));
      window.addEventListener('error', capture);
      window.addEventListener('unhandledrejection', capture);
      try {
        const plugin = app.plugins.getPlugin('notebook-navigator');
        await plugin.activateView();
        for (let attempt = 0; attempt < 60; attempt++) {
          const leaf = app.workspace.getLeavesOfType('notebook-navigator')[0];
          if (leaf?.view?.containerEl?.isConnected && leaf.view.contentEl?.childElementCount) break;
          await new Promise((resolve) => setTimeout(resolve, 250));
        }
        const leaf = app.workspace.getLeavesOfType('notebook-navigator')[0];
        const view = leaf?.view;
        if (leaf) {
          await app.workspace.revealLeaf(leaf);
          await new Promise((resolve) => setTimeout(resolve, 500));
          document.querySelector('[title="Notebook Navigator"]')?.dispatchEvent(new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window,
          }));
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
        const activeView = app.workspace.getActivePluginViews().find((entry) => entry.viewType === 'notebook-navigator');
        const navigatorRoot = activeView?.containerEl || view?.contentEl || view?.containerEl || document.body;
        const firstPath = 'Notebook Navigator first tab smoke test.md';
        const secondPath = 'Notebook Navigator second tab smoke test.md';
        const renameOldPath = 'Notebook Navigator rename smoke old.md';
        const renameNewPath = 'Notebook Navigator rename smoke new.md';
        for (const path of [firstPath, secondPath]) {
          const existing = app.vault.getFileByPath(path);
          if (existing) await app.vault.delete(existing);
          await app.vault.create(path, '# Navigator tab smoke test');
        }
        for (const path of [renameOldPath, renameNewPath]) {
          const existing = app.vault.getFileByPath(path);
          if (existing) await app.vault.delete(existing);
        }
        const renameFile = await app.vault.create(renameOldPath, '# Rename smoke test');
        await app.vault.rename(renameFile, renameNewPath);
        await new Promise((resolve) => setTimeout(resolve, 250));
        const renameMoved = !app.vault.getFileByPath(renameOldPath)
          && Boolean(app.vault.getFileByPath(renameNewPath))
          && await electronAPI.readFile(renameOldPath) === null
          && await electronAPI.readFile(renameNewPath) === '# Rename smoke test';
        const firstOpenResult = await app.workspace.getLeaf('tab').openFile(app.vault.getFileByPath(firstPath), { active: true });
        const secondOpenResult = await app.workspace.getLeaf('tab').openFile(app.vault.getFileByPath(secondPath), { active: true });
        await new Promise((resolve) => setTimeout(resolve, 1_000));
        const tabText = Array.from(document.querySelectorAll('.titlebar-tab')).map((element) => element.textContent || '');
        const mountedBeforeExplorer = Boolean(navigatorRoot?.isConnected);
        const extraHostChromeAbsent = !Array.from(document.querySelectorAll('.plugin-view-panel > div')).some(
          (element) => (element.textContent || '').trim() === 'Notebook Navigator×',
        );
        const fileExplorerHtml = document.querySelector('[title="File Explorer"]')?.outerHTML || 'not found';
        document.querySelector('[title="File Explorer"]')?.click();
        await new Promise((resolve) => setTimeout(resolve, 250));
        const explorerRestored = Boolean(document.querySelector('.file-explorer'));
        const navigatorVisibleAfterExplorer = app.workspace.getActivePluginViews()
          .find((entry) => entry.viewType === 'notebook-navigator')?.visible;
        for (const path of [firstPath, secondPath, renameOldPath, renameNewPath]) {
          const file = app.vault.getFileByPath(path);
          if (file) await app.vault.delete(file);
        }
        return {
          errors,
          pluginLoaded: plugin?._loaded,
          leafExists: Boolean(leaf),
          side: leaf?.side,
          viewType: view?.getViewType?.(),
          fileExplorerHtml,
          rendered: Boolean(navigatorRoot?.childElementCount || view?.contentEl?.childElementCount),
          mounted: mountedBeforeExplorer,
          activeSidebarView: activeView?.side,
          activeSidebarVisible: activeView?.visible,
          sidebarExpanded: app.workspace.leftSplit?.collapsed === false,
          hasDistinctTabs: tabText.some((text) => text.includes('first tab smoke test'))
            && tabText.some((text) => text.includes('second tab smoke test')),
          renameMoved,
          extraHostChromeAbsent,
          explorerRestored,
          navigatorVisibleAfterExplorer,
          firstOpenResult,
          secondOpenResult,
          tabText,
        };
      } finally {
        window.removeEventListener('error', capture);
        window.removeEventListener('unhandledrejection', capture);
      }
    })()
  `);

  const failures = [
    !result.pluginLoaded && 'Notebook Navigator did not load',
    !result.leafExists && 'Notebook Navigator did not create a workspace leaf',
    result.side !== 'left' && `Navigator opened in ${result.side} instead of the left sidebar`,
    result.viewType !== 'notebook-navigator' && `unexpected view type: ${result.viewType}`,
    !result.rendered && 'Notebook Navigator did not render its navigation UI',
    !result.mounted && 'Notebook Navigator was not mounted in the application sidebar',
    result.activeSidebarView !== 'left' && 'Workspace did not expose Notebook Navigator as the active left view',
    !result.sidebarExpanded && 'Notebook Navigator did not expand the left sidebar',
    !result.hasDistinctTabs && 'workspace tab contexts did not create distinct app tabs',
    !result.renameMoved && 'vault rename left the old path, missed the new path, or changed file content',
    !result.extraHostChromeAbsent && 'Notebook Navigator still shows the extra host tab chrome',
    !result.explorerRestored && 'titlebar File Explorer button did not restore the default explorer',
    result.navigatorVisibleAfterExplorer !== false && 'Workspace did not mark Navigator hidden after restoring Explorer',
    result.errors.length > 0 && `renderer errors: ${result.errors.join('; ')}`,
  ].filter(Boolean);
  if (failures.length) {
    console.error(JSON.stringify(result, null, 2));
    throw new Error(failures.join('\n'));
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
