import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

const rootDir = path.resolve(__dirname, '..');

function readSource(relativePath: string): string {
  return fs.readFileSync(path.join(rootDir, relativePath), 'utf8').replace(/\r\n/g, '\n');
}

/**
 * Regression test for issue #84: Ctrl+B was bound to both Bold (editor)
 * and Toggle Sidebar (menu + App handler + command list), so Bold felt
 * broken on macOS where the menu accelerator wins.
 *
 * The agreed mapping everywhere:
 *   Ctrl/Cmd+B        -> Bold
 *   Ctrl/Cmd+Shift+B  -> Toggle Sidebar
 */
describe('sidebar shortcut consistency (issue #84)', () => {
  it('binds the Electron View menu Toggle Sidebar item to CmdOrCtrl+Shift+B', () => {
    const source = readSource('electron/main.ts');
    const accelerator = /label:\s*'Toggle Sidebar',\s*\n\s*accelerator:\s*'([^']+)'/.exec(source);
    expect(accelerator, 'Toggle Sidebar menu item must declare an accelerator').not.toBeNull();
    expect(accelerator?.[1]).toBe('CmdOrCtrl+Shift+B');
  });

  it('keeps bold on Mod-b in the CodeMirror editor keymap', () => {
    const source = readSource('src/components/editor/Editor.tsx');
    expect(source).toContain('{ key: "Mod-b", run: toggleBold }');
  });

  it('toggles the sidebar from App only on Ctrl/Cmd+Shift+B', () => {
    const source = readSource('src/App.tsx');
    expect(source).toContain('ctrl && shift && e.key.toLowerCase() === "b"');
    // The old plain Ctrl+B sidebar binding must be gone.
    expect(source).not.toMatch(/ctrl && (?!.*&&)e\.key === "b"/);
  });

  it('labels the Toggle Sidebar command Ctrl+Shift+B in the command palette', () => {
    const source = readSource('src/hooks/useAppCommands.ts');
    const shortcut = /id:\s*"sidebar",\s*\n\s*label:\s*"Toggle Sidebar",\s*\n\s*shortcut:\s*"([^"]+)"/.exec(
      source,
    );
    expect(shortcut, 'sidebar command must declare a shortcut').not.toBeNull();
    expect(shortcut?.[1]).toBe('Ctrl+Shift+B');
  });

  it('documents both shortcuts in the welcome note shortcut table', () => {
    const raw = readSource('src/utils/mockAPI.ts');
    // Note bodies are template literals with escaped backticks; normalize them.
    const table = raw.replace(/[\\`]/g, '');
    expect(table).toContain('| Ctrl+B | Bold |');
    expect(table).toContain('| Ctrl+Shift+B | Toggle Sidebar |');
    expect(table).not.toContain('| Ctrl+B | Toggle Sidebar |');
  });

  it('documents both shortcuts on the website shortcuts list', () => {
    const source = readSource('website/src/data/facts.ts');
    expect(source).toMatch(/keys:\s*"Ctrl\/Cmd\+B",\s*action:\s*"Bold text"/);
    expect(source).toMatch(/keys:\s*"Ctrl\/Cmd\+Shift\+B",\s*action:\s*"Toggle sidebar"/);
    expect(source).not.toMatch(/keys:\s*"Ctrl\/Cmd\+B",\s*action:\s*"Toggle sidebar"/);
  });
});
