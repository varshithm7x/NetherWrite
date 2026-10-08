#!/usr/bin/env node

const fs = require('node:fs');

const port = process.env.OBSIDIAN_DEBUG_PORT || '9223';
const outputPath = process.env.OBSIDIAN_PROBE_OUTPUT || '/tmp/obsidian-runtime-shape.json';
const targetUrl = process.env.OBSIDIAN_TARGET_URL || 'app://obsidian.md/index.html';

function evaluate(webSocketUrl, expression) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(webSocketUrl);
    const id = 1;
    socket.addEventListener('open', () => {
      socket.send(JSON.stringify({
        id,
        method: 'Runtime.evaluate',
        params: {
          expression,
          returnByValue: true,
          awaitPromise: true,
        },
      }));
    });
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(String(event.data));
      if (message.id !== id) return;
      socket.close();
      if (message.error) reject(new Error(message.error.message));
      else if (message.result?.exceptionDetails) {
        reject(new Error(message.result.exceptionDetails.text));
      } else {
        resolve(message.result?.result?.value);
      }
    });
    socket.addEventListener('error', () => reject(new Error('Obsidian debug WebSocket failed')));
  });
}

async function main() {
  const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then((response) => response.json());
  const page = targets.find((target) => target.type === 'page' && target.url.startsWith(targetUrl));
  if (!page) throw new Error(`No Obsidian renderer found on debugging port ${port}`);

  const result = await evaluate(page.webSocketDebuggerUrl, `(() => {
    const describe = (value) => {
      if (value == null) return null;
      const own = Object.getOwnPropertyNames(value).sort();
      const prototypes = [];
      let current = Object.getPrototypeOf(value);
      let depth = 0;
      while (current && depth < 8) {
        prototypes.push({
          name: current.constructor?.name || '',
          properties: Object.getOwnPropertyNames(current).sort(),
        });
        current = Object.getPrototypeOf(current);
        depth++;
      }
      return {
        constructor: value.constructor?.name || '',
        own,
        prototypes,
      };
    };

    const leaf = app.workspace?.activeLeaf;
    const view = leaf?.view;
    const editor = view?.editor;
    const targets = {
      app,
      workspace: app.workspace,
      vault: app.vault,
      adapter: app.vault?.adapter,
      metadataCache: app.metadataCache,
      fileManager: app.fileManager,
      commands: app.commands,
      plugins: app.plugins,
      internalPlugins: app.internalPlugins,
      keymap: app.keymap,
      scope: app.scope,
      setting: app.setting,
      activeLeaf: leaf,
      activeView: view,
      activeEditor: editor,
    };
    return {
      appVersion: app.getVersion?.(),
      platform: window.Platform ? { ...window.Platform } : null,
      targets: Object.fromEntries(
        Object.entries(targets).map(([name, value]) => [name, describe(value)]),
      ),
    };
  })()`);

  fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
  console.log(`Obsidian runtime shape written to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
