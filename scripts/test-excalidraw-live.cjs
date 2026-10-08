/*
 * Runs a disposable Electron smoke test against an installed Excalidraw plugin.
 * The drawing created by the command is deleted before the process exits.
 *
 * Usage:
 *   OO_EXCALIDRAW_VAULT=/path/to/vault node scripts/test-excalidraw-live.cjs
 */

const { spawn } = require('node:child_process');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const vault = process.env.OO_EXCALIDRAW_VAULT;
const vitePort = Number(process.env.OO_EXCALIDRAW_VITE_PORT || 5174);
const debugPort = Number(process.env.OO_EXCALIDRAW_DEBUG_PORT || 9225);

if (!vault) {
  throw new Error('Set OO_EXCALIDRAW_VAULT to a vault with Excalidraw enabled.');
}

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
        reject(new Error(
          message.result.exceptionDetails.exception?.description
          || message.result.exceptionDetails.text,
        ));
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
], {
  cwd: root,
  stdio: 'pipe',
});

let electron;
const childOutput = [];

function captureChildOutput(name, child) {
  const capture = (chunk) => {
    const text = chunk.toString();
    childOutput.push(...text.split(/\r?\n/).filter(Boolean).map((line) => `[${name}] ${line}`));
    if (childOutput.length > 300) childOutput.splice(0, childOutput.length - 300);
  };
  child.stdout?.on('data', capture);
  child.stderr?.on('data', capture);
}

captureChildOutput('vite', vite);

async function main() {
  await waitFor(async () => {
    const response = await fetch(`http://127.0.0.1:${vitePort}`);
    return response.ok;
  }, 'Vite');

  const electronEnv = {
    ...process.env,
    NODE_ENV: 'development',
    VITE_DEV_SERVER_URL: `http://127.0.0.1:${vitePort}`,
    NETHERWRITE_DEBUG_PORT: String(debugPort),
  };
  delete electronEnv.ELECTRON_RUN_AS_NODE;
  electron = spawn(require('electron'), ['.'], {
    cwd: root,
    stdio: 'pipe',
    env: electronEnv,
  });
  captureChildOutput('electron', electron);

  await waitFor(async () => {
    const targets = await fetch(`http://127.0.0.1:${debugPort}/json/list`).then((response) => response.json());
    return targets.some((entry) => entry.type === 'page' && entry.url.startsWith(`http://127.0.0.1:${vitePort}`));
  }, 'Electron debugger');

  await evaluate(`electronAPI.setVaultPath(${JSON.stringify(vault)}).then(() => location.reload())`);
  try {
    await waitFor(async () => {
      const plugins = await evaluate(`Object.keys(window.app?.plugins?.plugins || {})`);
      return plugins.includes('obsidian-excalidraw-plugin');
    }, 'Excalidraw plugin', 90_000);
  } catch (error) {
    const diagnostics = await evaluate(`JSON.stringify({
      loadedPlugins: Object.keys(window.app?.plugins?.plugins || {}),
      enabledPlugins: Array.from(window.app?.plugins?.enabledPlugins || []),
      manifests: Object.keys(window.app?.plugins?.manifests || {}),
      commands: Object.keys(window.app?.commands?.commands || {}).filter((id) => id.includes('excalidraw')),
    }, null, 2)`).catch((diagnosticError) => String(diagnosticError));
    console.error('--- renderer diagnostics ---');
    console.error(diagnostics);
    throw error;
  }
  await waitFor(
    async () => await evaluate(`Boolean(window.app?.commands?.commands?.['obsidian-excalidraw-plugin:excalidraw-autocreate-newtab'])`),
    'Excalidraw create command',
  );

  const result = await evaluate(`
    (async () => {
      const app = window.app;
      if (!app) throw new Error('NetherWrite app global is not ready.');
      const errors = [];
      const describeError = (error) => error?.stack || String(error);
      const describeConsoleArg = (arg) => {
        if (arg instanceof Error) return arg.stack || arg.message;
        if (typeof arg === 'string') return arg;
        try {
          return JSON.stringify(arg, (_key, value) => {
            if (value instanceof Error) {
              return {
                name: value.name,
                message: value.message,
                stack: value.stack,
              };
            }
            return value;
          });
        } catch { return String(arg); }
      };
      const onError = (event) => {
        errors.push(describeError(event.error || event.message));
        event.preventDefault();
      };
      const onRejection = (event) => {
        errors.push(describeError(event.reason));
        event.preventDefault();
      };
      const originalConsoleError = console.error;
      const originalConsoleWarn = console.warn;
      console.error = (...args) => {
        errors.push('[console.error] ' + args.map(describeConsoleArg).join(' '));
        originalConsoleError.apply(console, args);
      };
      console.warn = (...args) => {
        errors.push('[console.warn] ' + args.map(describeConsoleArg).join(' '));
        originalConsoleWarn.apply(console, args);
      };
      const themeProbe = document.createElement('div');
      themeProbe.className = 'theme-light';
      document.body.appendChild(themeProbe);
      const computedTheme = getComputedStyle(themeProbe);
      const themeVariables = {
        backgroundPrimary: computedTheme.getPropertyValue('--background-primary').trim(),
        textNormal: computedTheme.getPropertyValue('--text-normal').trim(),
      };
      themeProbe.remove();
      window.addEventListener('error', onError);
      window.addEventListener('unhandledrejection', onRejection);
      let createdPath = null;
      try {
        const before = new Set(app.vault.getFiles().map((file) => file.path));
        const commandId = 'obsidian-excalidraw-plugin:excalidraw-autocreate-newtab';
        if (!app.commands.executeCommandById(commandId)) throw new Error('Excalidraw create command did not execute.');

        await new Promise((resolve) => setTimeout(resolve, 9_000));
        const created = app.vault.getFiles().find((file) => !before.has(file.path) && file.path.endsWith('.excalidraw.md'));
        createdPath = created?.path || null;
        await window.__oo_open_file?.(createdPath);
        await new Promise((resolve) => setTimeout(resolve, 500));
        const view = app.workspace.activeLeaf?.view;
        const plugin = app.plugins.getPlugin('obsidian-excalidraw-plugin');
        const initialContent = created ? await app.vault.read(created) : '';
        const api = view?.excalidrawAPI;
        const ea = plugin?.ea;
        let testElementId = null;
        if (ea?.reset && ea?.setView && ea?.addRect && ea?.addElementsToView) {
          ea.reset();
          ea.setView(view);
          testElementId = ea.addRect(120, 90, 160, 96);
          await ea.addElementsToView(false, true, true);
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
        const sceneElementsAfterUpdate = api?.getSceneElements?.() || [];
        const sceneMutationApplied = Boolean(testElementId) && sceneElementsAfterUpdate.some((element) => element.id === testElementId);
        view?.requestSave?.();
        view?.forceSave?.();
        await new Promise((resolve) => setTimeout(resolve, 2_500));
        const savedContent = created ? await app.vault.read(created) : '';
        const savedContentChanged = Boolean(testElementId) && savedContent !== initialContent;
        const crashWarningVisible = document.body.textContent?.includes('Excalidraw ran into an unknown problem') || false;
        const toolbarButtonCount = document.querySelectorAll('.excalidraw button, .excalidraw .ToolIcon, .excalidraw [role="button"]').length;
        const insertFileCommandExecuted = app.commands.executeCommandById('obsidian-excalidraw-plugin:universal-add-file');
        await new Promise((resolve) => setTimeout(resolve, 300));
        const insertFileInput = document.querySelector('.excalidraw-modal input');
        if (insertFileInput) {
          insertFileInput.focus();
          insertFileInput.dispatchEvent(new Event('focus'));
          insertFileInput.value = 'Natural';
          insertFileInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
        const insertFileSuggestions = document.querySelectorAll('.suggestion-item').length;
        const insertFileSuggestionText = Array.from(document.querySelectorAll('.suggestion-container'))
          .map((element) => element.textContent || '')
          .join('\\n');
        const insertFileModal = document.querySelector('.excalidraw-modal .modal, .excalidraw-modal.oo-plugin-modal, .modal.oo-plugin-modal.excalidraw-modal');
        const insertFileSuggest = Array.from(document.querySelectorAll('.excalidraw-modal .suggestion-container, .excalidraw-modal .oo-modal-input-suggest, body > .suggestion-container'))
          .find((element) => {
            const rect = element.getBoundingClientRect?.();
            return rect && rect.width > 0 && rect.height > 0;
          });
        const insertFileModalRect = insertFileModal?.getBoundingClientRect?.();
        const insertFileSuggestRect = insertFileSuggest?.getBoundingClientRect?.();
        const insertFileSuggestWidthMatches = Boolean(
          insertFileModalRect &&
          insertFileSuggestRect &&
          insertFileSuggestRect.width >= insertFileModalRect.width - 80
        );
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        const result = {
          createdPath,
          errors,
          viewType: view?.getViewType?.(),
          routedViewType: app.workspace.activeLeaf?.view?.getViewType?.(),
          viewFile: view?.file?.path,
          hasContentEl: view?.contentEl instanceof HTMLElement,
          hasCanvasApi: typeof view?.excalidrawAPI?.getSceneElements === 'function',
          sceneMutationApplied,
          savedContentChanged,
          crashWarningVisible,
          toolbarButtonCount,
          activeViewMatches: plugin?.activeExcalidrawView === view,
          pluginReady: plugin?.isReady,
          pluginLoaded: plugin?._loaded,
          insertFileCommandExecuted,
          insertFileSuggestions,
          insertFileSuggestionText,
          hasInsertFileInput: !!insertFileInput,
          insertFileSuggestWidthMatches,
          insertFileModalWidth: insertFileModalRect?.width || 0,
          insertFileSuggestWidth: insertFileSuggestRect?.width || 0,
          themeVariables,
          registeredExtensions: app.workspace?._extensionViews
            ? Array.from(app.workspace._extensionViews.entries())
            : [],
          cachedFile: created ? app.metadataCache.getFileCache(created) : null,
          knownExcalidrawFiles: plugin?.fileManager?.getExcalidrawFiles
            ? Array.from(plugin.fileManager.getExcalidrawFiles()).map((file) => file.path)
            : [],
        };
        if (created) await app.vault.delete(created);
        return result;
      } finally {
        window.removeEventListener('error', onError);
        window.removeEventListener('unhandledrejection', onRejection);
        console.error = originalConsoleError;
        console.warn = originalConsoleWarn;
        if (createdPath) {
          const file = app.vault.getFileByPath(createdPath);
          if (file) await app.vault.delete(file);
        }
      }
    })()
  `);

  const failures = [
    !result.createdPath && 'drawing file was not created',
    result.viewType !== 'excalidraw' && `unexpected view type: ${result.viewType}`,
    result.routedViewType !== 'excalidraw' && `file-tree route opened ${result.routedViewType} instead of Excalidraw`,
    result.viewFile !== result.createdPath && 'view did not receive the drawing file',
    !result.hasContentEl && 'view has no content element',
    !result.hasCanvasApi && 'Excalidraw canvas API did not initialize',
    !result.sceneMutationApplied && 'Excalidraw scene mutation did not apply',
    !result.savedContentChanged && 'Excalidraw drawing did not save scene changes',
    result.crashWarningVisible && 'Excalidraw displayed its unknown-problem save warning',
    result.toolbarButtonCount < 5 && `Excalidraw toolbar controls did not render (${result.toolbarButtonCount})`,
    !result.themeVariables.backgroundPrimary && 'Tailwind theme did not expose --background-primary',
    !result.themeVariables.textNormal && 'Tailwind theme did not expose --text-normal',
    !result.activeViewMatches && 'plugin did not mark the drawing as active',
    !result.insertFileCommandExecuted && 'Excalidraw add-file command did not execute',
    !result.hasInsertFileInput && 'Excalidraw add-file dialog did not open',
    !result.insertFileSuggestWidthMatches && `Excalidraw add-file suggestions are too narrow (${result.insertFileSuggestWidth}/${result.insertFileModalWidth})`,
    result.errors.length > 0 && `renderer errors: ${result.errors.join('; ')}`,
  ].filter(Boolean);
  if (failures.length > 0) {
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
    if (childOutput.length > 0) {
      console.error('--- child output ---');
      console.error(childOutput.join('\n'));
    }
    process.exitCode = 1;
  });
