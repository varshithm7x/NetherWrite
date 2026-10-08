const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const fixtureDir = process.env.OO_PLUGIN_FIXTURE_DIR
  || path.join(os.tmpdir(), 'netherwrite-plugin-fixtures');

const fixtures = {
  'dataview-main.js': 'https://github.com/blacksmithgu/obsidian-dataview/releases/download/0.5.70/main.js',
  'templater-main.js': 'https://github.com/silentvoid13/Templater/releases/download/2.22.1/main.js',
  'git-main.js': 'https://github.com/vinzent03/obsidian-git/releases/download/2.38.3/main.js',
  'tasks-main.js': 'https://github.com/obsidian-tasks-group/obsidian-tasks/releases/download/8.1.0/main.js',
  'calendar-main.js': 'https://github.com/liamcain/obsidian-calendar-plugin/releases/download/2.0.0-beta.2/main.js',
  'kanban-main.js': 'https://github.com/obsidian-community/obsidian-kanban/releases/download/2.0.51/main.js',
  'style-settings-main.js': 'https://github.com/obsidian-community/obsidian-style-settings/releases/download/1.0.9/main.js',
  'advanced-tables-main.js': 'https://github.com/tgrosinger/advanced-tables-obsidian/releases/download/0.23.2/main.js',
  'quickadd-main.js': 'https://github.com/chhoumann/quickadd/releases/download/2.12.3/main.js',
  'excalidraw-main.js': 'https://github.com/zsviczian/obsidian-excalidraw-plugin/releases/download/2.23.12/main.js',
  'better-export-pdf-main.js': 'https://github.com/l1xnan/obsidian-better-export-pdf/releases/download/1.11.0/main.js',
  'enhancing-export-main.js': 'https://github.com/mokeyish/obsidian-enhancing-export/releases/download/1.11.1/main.js',
  'reading-time-main.js': 'https://github.com/avr/obsidian-reading-time/releases/download/1.1.2/main.js',
};

async function download(name, url) {
  const target = path.join(fixtureDir, name);
  if (fs.existsSync(target) && fs.statSync(target).size > 0) return;

  const response = await fetch(url, {
    headers: { 'user-agent': 'NetherWrite compatibility tests' },
  });
  if (!response.ok) {
    throw new Error(`Failed to download ${name}: ${response.status} ${response.statusText}`);
  }

  const temporary = `${target}.tmp`;
  fs.writeFileSync(temporary, Buffer.from(await response.arrayBuffer()));
  fs.renameSync(temporary, target);
  console.log(`Downloaded plugin fixture: ${name}`);
}

async function main() {
  fs.mkdirSync(fixtureDir, { recursive: true });
  await Promise.all(Object.entries(fixtures).map(([name, url]) => download(name, url)));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
