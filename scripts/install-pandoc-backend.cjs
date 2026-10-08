#!/usr/bin/env node

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const JSZip = require('jszip');

const PANDOC_VERSION = '3.10';
const PANDOC_URL = `https://github.com/jgm/pandoc/releases/download/${PANDOC_VERSION}/pandoc-${PANDOC_VERSION}.wasm.zip`;
const installDir = process.env.NETHERWRITE_PANDOC_DIR
  || path.join(os.homedir(), '.local', 'share', 'netherwrite', 'tools', 'pandoc');
const wasmPath = path.join(installDir, 'pandoc.wasm');
const runnerPath = path.join(installDir, process.platform === 'win32' ? 'pandoc.cjs' : 'pandoc');

function getDownloadUrl(targetPlatform, targetArch) {
  const version = '3.6.3';
  return `https://github.com/jgm/pandoc/releases/download/${version}/pandoc-${version}-${targetPlatform}-${targetArch}.tar.gz`;
}

async function downloadPandoc() {
  const archivePath = process.env.NETHERWRITE_PANDOC_ARCHIVE;
  if (archivePath) return fs.readFileSync(archivePath);

  const response = await fetch(PANDOC_URL, {
    headers: { 'user-agent': 'NetherWrite Pandoc backend installer' },
  });
  if (!response.ok) {
    throw new Error(`Failed to download Pandoc ${PANDOC_VERSION}: ${response.status} ${response.statusText}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function extractPandocWasm() {
  const archive = await JSZip.loadAsync(await downloadPandoc());
  const wasmEntry = archive.file('pandoc/pandoc.wasm');
  if (!wasmEntry) throw new Error('The Pandoc archive does not contain pandoc/pandoc.wasm');
  return Buffer.from(await wasmEntry.async('uint8array'));
}

async function main() {
  fs.mkdirSync(installDir, { recursive: true });

  if (!fs.existsSync(wasmPath) || fs.statSync(wasmPath).size === 0) {
    console.log(`Downloading Pandoc ${PANDOC_VERSION} WASM backend...`);
    const temporaryPath = `${wasmPath}.tmp`;
    fs.writeFileSync(temporaryPath, await extractPandocWasm());
    fs.renameSync(temporaryPath, wasmPath);
  }

  const sourceRunner = path.join(__dirname, 'pandoc-wasm-runner.cjs');
  fs.copyFileSync(sourceRunner, runnerPath);
  if (process.platform !== 'win32') fs.chmodSync(runnerPath, 0o755);

  if (process.platform !== 'win32') {
    const localBinDir = path.join(os.homedir(), '.local', 'bin');
    const localCommand = path.join(localBinDir, 'pandoc');
    fs.mkdirSync(localBinDir, { recursive: true });
    if (!fs.existsSync(localCommand) || fs.lstatSync(localCommand).isSymbolicLink()) {
      if (fs.existsSync(localCommand)) fs.unlinkSync(localCommand);
      fs.symlinkSync(runnerPath, localCommand);
    } else {
      console.warn(`Keeping existing non-symlink Pandoc command: ${localCommand}`);
    }
  }

  console.log(`Pandoc ${PANDOC_VERSION} backend installed at ${runnerPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
