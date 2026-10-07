/// <reference types="vite/client" />

interface Window {
  electronAPI: import("../electron/preload").ElectronAPI;
}
