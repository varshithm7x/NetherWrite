import { createMockAPI } from './mockAPI';
import type { ElectronAPI } from '../../electron/preload';
let browserAPI: ElectronAPI | undefined;
export function getAPI(): ElectronAPI {
  if (window.electronAPI) return window.electronAPI;
  return browserAPI ||= createMockAPI();
}
