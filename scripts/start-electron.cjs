const { spawn } = require('node:child_process');
const environment = { ...process.env };
delete environment.ELECTRON_RUN_AS_NODE;
if (!process.argv.includes('--production')) environment.VITE_DEV_SERVER_URL ||= 'http://localhost:5173';
const child = spawn(require('electron'), ['.'], { stdio: 'inherit', env: environment });
child.on('exit', code => process.exit(code ?? 0));
