const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const toolDir = process.env.NETHERWRITE_PANDOC_DIR
  || path.join(os.homedir(), '.local', 'share', 'netherwrite', 'tools', 'pandoc');
const executable = process.platform === 'win32'
  ? path.join(toolDir, 'pandoc.cjs')
  : path.join(toolDir, 'pandoc');
const outputPath = path.join(os.tmpdir(), 'netherwrite-pandoc-backend-test.html');

function runPandoc(args, input) {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args);
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(`Pandoc exited with code ${code}: ${stderr}`));
    });
    if (input) child.stdin.end(input);
    else child.stdin.end();
  });
}

async function main() {
  if (!fs.existsSync(executable)) {
    throw new Error(`Pandoc backend is not installed: ${executable}`);
  }

  const version = await runPandoc(['--version']);
  if (!version.startsWith('pandoc 3.10')) {
    throw new Error(`Unexpected Pandoc version output: ${version}`);
  }

  await runPandoc([
    '--from', 'markdown',
    '--to', 'html',
    '--output', outputPath,
  ], '# NetherWrite export\n\nPandoc backend is operational.\n');

  const result = fs.readFileSync(outputPath, 'utf8');
  if (!result.includes('<h1') || !result.includes('Pandoc backend is operational.')) {
    throw new Error(`Pandoc conversion produced unexpected output: ${result}`);
  }

  console.log(`Pandoc backend passed version and conversion checks: ${executable}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
