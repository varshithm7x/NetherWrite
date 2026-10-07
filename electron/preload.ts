import { contextBridge, ipcRenderer } from 'electron';
const api = {
  openVaultDialog: (): Promise<string | null> => ipcRenderer.invoke('dialog:openDirectory'),
  setVaultPath: (path: string): Promise<boolean> => ipcRenderer.invoke('vault:setPath', path),
  getVaultPath: (): Promise<string | null> => ipcRenderer.invoke('vault:getPath'),
  getFileTree: (): Promise<import('./fileSystem.js').FileEntry[]> => ipcRenderer.invoke('fs:getFileTree'),
  readFile: (path: string): Promise<string | null> => ipcRenderer.invoke('fs:readFile', path),
  readBinary: (path: string): Promise<Uint8Array> => ipcRenderer.invoke('fs:readBinary', path),
  writeFile: (path: string, content: string): Promise<void> => ipcRenderer.invoke('fs:writeFile', path, content),
  writeBinary: (path: string, content: Uint8Array): Promise<void> => ipcRenderer.invoke('fs:writeBinary', path, content),
  createFile: (path: string, content = ''): Promise<void> => ipcRenderer.invoke('fs:createFile', path, content),
  createDirectory: (path: string): Promise<void> => ipcRenderer.invoke('fs:createDirectory', path),
  fileExists: (path: string): Promise<boolean> => ipcRenderer.invoke('fs:fileExists', path),
  getGraphData: (): Promise<{ nodes: any[]; edges: any[] }> => ipcRenderer.invoke('graph:getData'),
  dataRead: (path: string): Promise<string | null> => ipcRenderer.invoke('data:read', path),
  dataWrite: (path: string, content: string): Promise<void> => ipcRenderer.invoke('data:write', path, content),
  dataDelete: (path: string): Promise<void> => ipcRenderer.invoke('data:delete', path),
  dataList: (path: string): Promise<string[]> => ipcRenderer.invoke('data:list', path),
  openExternal: (url: string): Promise<void> => ipcRenderer.invoke('desktop:openExternal', url),
  openPath: (path: string): Promise<string> => ipcRenderer.invoke('desktop:openPath', path),
  extractDoc: (path: string): Promise<string> => ipcRenderer.invoke('document:extractDoc', path),
  importDocuments: (): Promise<string[]> => ipcRenderer.invoke('document:import'),
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),
};
contextBridge.exposeInMainWorld('electronAPI', api);
export type ElectronAPI = typeof api;
