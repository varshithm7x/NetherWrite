#!/usr/bin/env -S node --no-warnings

const fs = require('node:fs');
const path = require('node:path');
const { WASI } = require('node:wasi');

const wasmPath = process.env.NETHERWRITE_PANDOC_WASM
  || path.join(path.dirname(fs.realpathSync(__filename)), 'pandoc.wasm');

if (!fs.existsSync(wasmPath)) {
  console.error(`Pandoc WASM runtime not found: ${wasmPath}`);
  process.exit(127);
}

const wasi = new WASI({
  version: 'preview1',
  args: ['pandoc', ...process.argv.slice(2)],
  env: process.env,
  returnOnExit: true,
  preopens: {
    '/': '/',
  },
});

async function main() {
  const module = await WebAssembly.compile(fs.readFileSync(wasmPath));
  const instance = await WebAssembly.instantiate(module, wasi.getImportObject());
  process.exitCode = wasi.start(instance);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
