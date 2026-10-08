const path = require('node:path');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const officialPath = path.join(root, 'node_modules/obsidian/obsidian.d.ts');
const localPath = path.join(root, 'src/lib/obsidian-api/index.ts');

const program = ts.createProgram([officialPath, localPath], {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  jsx: ts.JsxEmit.ReactJSX,
  allowSyntheticDefaultImports: true,
  esModuleInterop: true,
  skipLibCheck: true,
});
const checker = program.getTypeChecker();

function getModuleExports(filePath) {
  const sourceFile = program.getSourceFile(filePath);
  const moduleSymbol = checker.getSymbolAtLocation(sourceFile);
  return checker.getExportsOfModule(moduleSymbol);
}

function isRuntimeExport(symbol) {
  const declaration = symbol.declarations?.[0];
  return declaration
    && !ts.isInterfaceDeclaration(declaration)
    && !ts.isTypeAliasDeclaration(declaration);
}

const official = getModuleExports(officialPath)
  .filter(isRuntimeExport)
  .map((symbol) => symbol.name)
  .sort();
const local = new Set(
  getModuleExports(localPath)
    .filter(isRuntimeExport)
    .map((symbol) => symbol.name),
);
const missing = official.filter((name) => !local.has(name));

if (missing.length > 0) {
  console.error(`Missing ${missing.length} official Obsidian runtime exports:`);
  console.error(missing.join('\n'));
  process.exit(1);
}

console.log(`Obsidian API export audit passed: ${official.length}/${official.length} runtime exports.`);
