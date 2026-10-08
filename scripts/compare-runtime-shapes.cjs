#!/usr/bin/env node

const fs = require('node:fs');

const nativePath = process.argv[2] || '/tmp/obsidian-runtime-shape.json';
const compatiblePath = process.argv[3] || '/tmp/netherwrite-runtime-shape.json';
const nativeShape = JSON.parse(fs.readFileSync(nativePath, 'utf8'));
const compatibleShape = JSON.parse(fs.readFileSync(compatiblePath, 'utf8'));

function properties(target) {
  return new Set([
    ...(target?.own || []),
    ...(target?.prototypes || []).flatMap((prototype) =>
      prototype.name === 'Object' ? [] : prototype.properties,
    ),
  ]);
}

let missingCount = 0;
for (const [name, nativeTarget] of Object.entries(nativeShape.targets || {})) {
  const nativeProperties = properties(nativeTarget);
  const compatibleProperties = properties(compatibleShape.targets?.[name]);
  const missing = [...nativeProperties].filter((property) => !compatibleProperties.has(property)).sort();
  if (missing.length === 0) continue;
  missingCount += missing.length;
  console.log(`${name}: ${missing.join(' ')}`);
}

console.log(`Missing runtime properties: ${missingCount}`);
process.exitCode = missingCount > 0 ? 1 : 0;
