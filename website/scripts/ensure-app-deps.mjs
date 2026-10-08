/**
 * The marketing site embeds the real desktop Editor / graph.
 * Those modules live in ../src and resolve packages from the repo root.
 * Vercel Root Directory is `website/`, so that root install never runs
 * unless we do it here.
 */
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const websiteDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = resolve(websiteDir, "..");
const rootPkg = resolve(repoRoot, "package.json");
const marker = resolve(repoRoot, "node_modules", "@xenova", "transformers");

if (!existsSync(rootPkg)) {
  console.log("[website] no parent package.json — skip desktop dependency install");
  process.exit(0);
}

if (existsSync(marker)) {
  console.log("[website] desktop dependencies already present");
  process.exit(0);
}

console.log("[website] installing desktop production dependencies for the embedded editor");
const result = spawnSync("npm", ["install", "--omit=dev", "--ignore-scripts", "--no-fund", "--no-audit"], {
  cwd: repoRoot,
  stdio: "inherit",
  env: process.env,
});

if (result.status !== 0) {
  console.error("[website] failed to install desktop dependencies");
  process.exit(result.status ?? 1);
}

if (!existsSync(marker)) {
  console.error("[website] @xenova/transformers is still missing after install");
  process.exit(1);
}
