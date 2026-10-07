import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { FileSystemManager } from './fileSystem.js';
import { resolveInsideRoot } from './pathSafety.js';

const directory = path.dirname(fileURLToPath(import.meta.url));
const files = new FileSystemManager();
let window: BrowserWindow | null = null;

function registerHandlers() {
  ipcMain.handle('dialog:openDirectory', async () => {
    const result = await dialog.showOpenDialog(window!, { properties: ['openDirectory', 'createDirectory'] });
    return result.canceled ? null : result.filePaths[0];
  });
  ipcMain.handle('vault:setPath', async (_event, folder: string) => {
    const info = await fs.stat(folder);
    if (!info.isDirectory()) throw new Error('Choose a folder.');
    return files.setVaultPath(folder);
  });
  ipcMain.handle('vault:getPath', () => files.getVaultPath());
  ipcMain.handle('fs:getFileTree', () => files.getFileTree());
  ipcMain.handle('fs:readFile', (_event, file: string) => files.readFile(file));
  ipcMain.handle('fs:readBinary', (_event, file: string) => files.readBinary(file));
  ipcMain.handle('fs:writeFile', (_event, file: string, content: string) => files.writeFile(file, content));
  ipcMain.handle('fs:writeBinary', (_event, file: string, content: Uint8Array) => files.writeBinary(file, content));
  ipcMain.handle('fs:createFile', async (_event, file: string, content: string) => {
    if (await files.fileExists(file)) throw new Error('A file with that name already exists.');
    return files.createFile(file, content);
  });
  ipcMain.handle('fs:createDirectory', (_event, folder: string) => files.createDirectory(folder));
  ipcMain.handle('fs:fileExists', (_event, file: string) => files.fileExists(file));
  ipcMain.handle('graph:getData', () => files.buildGraph());
  ipcMain.handle('data:read', (_event, file: string) => files.readDataFile(file));
  ipcMain.handle('data:write', (_event, file: string, content: string) => files.writeDataFile(file, content));
  ipcMain.handle('data:delete', (_event, file: string) => files.deleteDataFile(file));
  ipcMain.handle('data:list', (_event, folder: string) => files.listDataDir(folder));
  ipcMain.handle('desktop:openExternal', (_event, url: string) => { const parsed = new URL(url); if (!['https:', 'http:'].includes(parsed.protocol)) throw new Error('Only web links can be opened.'); return shell.openExternal(parsed.href); });
  ipcMain.handle('desktop:openPath', (_event, file: string) => shell.openPath(resolveInsideRoot(files.getVaultPath()!, file)));
  ipcMain.handle('document:extractDoc', () => { throw new Error('Legacy .doc files must be saved as .docx before importing.'); });
  ipcMain.handle('document:import', async () => {
    const result = await dialog.showOpenDialog(window!, { properties: ['openFile', 'multiSelections'], filters: [{ name: 'Notes and documents', extensions: ['md', 'pdf', 'docx', 'txt'] }] });
    if (result.canceled) return [];
    const imported: string[] = [];
    for (const source of result.filePaths) {
      const extension = path.extname(source); const base = path.basename(source, extension);
      let target = `Documents/${base}${extension}`; let suffix = 1;
      while (await files.fileExists(target)) target = `Documents/${base} (${suffix++})${extension}`;
      await files.writeBinary(target, new Uint8Array(await fs.readFile(source)));
      imported.push(target);
    }
    return imported;
  });
  ipcMain.on('window:minimize', () => window?.minimize());
  ipcMain.on('window:maximize', () => window?.isMaximized() ? window.unmaximize() : window?.maximize());
  ipcMain.on('window:close', () => window?.close());
}

async function createWindow() {
  window = new BrowserWindow({ width: 1440, height: 920, minWidth: 960, minHeight: 640, title: 'NoteWeave', backgroundColor: '#111318', frame: false, webPreferences: { preload: path.join(directory, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true } });
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  const developmentUrl = process.env.VITE_DEV_SERVER_URL;
  if (developmentUrl) await window.loadURL(developmentUrl);
  else await window.loadFile(path.join(directory, '../dist/index.html'));
}
app.whenReady().then(async () => { registerHandlers(); await createWindow(); app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) void createWindow(); }); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
