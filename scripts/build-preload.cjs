const fs = require('node:fs');
const ts = require('typescript');
const source = fs.readFileSync('electron/preload.ts', 'utf8');
fs.writeFileSync('dist-electron/preload.cjs', ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText);
