// Render the real border component in an isolated headless browser, without starting NetherWrite.
const { build } = require('esbuild');
const { existsSync } = require('node:fs');
const { mkdtemp, writeFile } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { spawn } = require('node:child_process');

async function main() {
  const root = path.resolve(__dirname, '..');
  const browser = process.env.FORGE_PREVIEW_BROWSER || [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  ].find(existsSync);
  if (!browser) throw new Error('Set FORGE_PREVIEW_BROWSER to an installed Chromium browser executable.');
  const directory = await mkdtemp(path.join(tmpdir(), 'netherwrite-electric-preview-'));
  const result = await build({
    stdin: {
      resolveDir: root, loader: 'tsx', contents: `
        import React from 'react';
        import { createRoot } from 'react-dom/client';
        import { ElectricBorderBeam } from './src/components/ui/ElectricBorderBeam';
        const examples = [
          {name:'Dark · narrow', width:230, height:370, radius:14, theme:'dark'},
          {name:'Light · wide', width:360, height:450, radius:24, theme:'light'},
          {name:'Dark · large corners', width:230, height:340, radius:42, theme:'dark'},
          {name:'Reduced motion', width:210, height:290, radius:16, theme:'dark', reduced:true},
        ];
        createRoot(document.getElementById('root')!).render(<>
          {examples.map(example => <article key={example.name}>
            <h2>{example.name}</h2>
            <div className={'example ' + example.theme} style={{width:example.width,height:example.height}}>
              <ElectricBorderBeam active borderRadius={example.radius} reducedMotion={example.reduced}>
                <section><span className="tag">FORGE</span><div className="copy"><h3>Creating knowledge</h3><p>Analyzing your selected notes…</p><button>Cancel generation</button></div></section>
              </ElectricBorderBeam>
            </div>
          </article>)}
        </>);
      `,
    },
    outfile: path.join(directory, 'preview.js'), bundle: true, write: false, jsx: 'automatic',
    define: { 'process.env.NODE_ENV': '"production"' },
  });
  for (const file of result.outputFiles) await writeFile(file.path, file.contents);
  const html = `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="preview.css"><style>
    *{box-sizing:border-box}body{margin:0;padding:30px;background:#141416;color:#e6e6e8;font:13px system-ui}#root{display:flex;gap:24px;align-items:start}
    article h2{font-size:12px;font-weight:500;margin:0 0 16px;color:#b8b8bc}.example{border-radius:12px}.dark{background:#1d1e21;color:#ededee}.light{background:#f4f4f5;color:#242428}
    .electric-border-beam{height:100%;width:100%}section{height:100%;padding:28px;display:flex;flex-direction:column;justify-content:space-between}.tag{font-size:10px;border:1px solid #8885;border-radius:20px;padding:4px 9px;align-self:start;letter-spacing:.08em}
    h3{font-size:20px;font-weight:500;line-height:1.3;margin:0 0 14px}.copy p{font-size:12px;opacity:.55;line-height:1.5}.copy button{background:transparent;border:1px solid #8885;border-radius:6px;padding:7px 10px;color:inherit;font:11px system-ui}
  </style></head><body><div id="root"></div><script src="preview.js"></script></body></html>`;
  const page = path.join(directory, 'preview.html');
  const screenshot = path.join(directory, 'preview.png');
  await writeFile(page, html);
  await new Promise((resolve, reject) => {
    const child = spawn(browser, ['--headless', '--no-first-run', '--disable-background-networking', '--hide-scrollbars',
      `--user-data-dir=${path.join(directory, 'browser-profile')}`, '--window-size=1200,620', '--virtual-time-budget=2200',
      `--screenshot=${screenshot}`, pathToFileURL(page).href], { windowsHide: true, stdio: 'ignore' });
    child.on('error', reject);
    child.on('close', code => code === 0 ? resolve() : reject(new Error(`Preview browser exited ${code}`)));
  });
  if (!existsSync(screenshot)) throw new Error('The preview browser did not write a screenshot.');
  console.log(screenshot);
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
