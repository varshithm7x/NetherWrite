import * as fs from 'fs';
import * as path from 'path';

/** Copy the previous desktop profile; keep the original available for rollback. */
export function migrateDesktopProfile(appDataPath: string): string {
  const destination = path.join(appDataPath, 'NetherWrite');
  if (!fs.existsSync(destination)) {
    for (const name of ['OpenOnyx', 'openonyx']) {
      const source = path.join(appDataPath, name);
      if (!fs.existsSync(source)) continue;
      const temporary = `${destination}.migration`;
      fs.cpSync(source, temporary, { recursive: true });
      fs.renameSync(temporary, destination);
      break;
    }
  }
  fs.mkdirSync(destination, { recursive: true });
  return destination;
}
