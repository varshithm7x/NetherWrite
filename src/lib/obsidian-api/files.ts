/**
 * Obsidian API Compatibility — File Abstractions
 *
 * Implements TAbstractFile, TFile, TFolder to match
 * Obsidian's file system abstraction layer.
 */

export interface FileStats {
  ctime: number;
  mtime: number;
  size: number;
}

export class TAbstractFile {
  vault: any;
  path: string;
  name: string;
  parent: TFolder | null;

  constructor(path: string, name?: string) {
    this.path = path;
    this.name = name || path.split('/').pop() || path;
    this.parent = null;
    this.vault = null;
  }
}

export class TFile extends TAbstractFile {
  stat: FileStats;
  basename: string;
  extension: string;

  constructor(path: string, stat?: Partial<FileStats>) {
    const name = path.split('/').pop() || path;
    super(path, name);
    const dotIndex = name.lastIndexOf('.');
    this.basename = dotIndex > 0 ? name.substring(0, dotIndex) : name;
    this.extension = dotIndex > 0 ? name.substring(dotIndex + 1) : '';
    this.stat = {
      ctime: stat?.ctime || Date.now(),
      mtime: stat?.mtime || Date.now(),
      size: stat?.size || 0,
    };
  }
}

export class TFolder extends TAbstractFile {
  children: TAbstractFile[];

  constructor(path: string) {
    const name = path.split('/').pop() || path;
    super(path, name || '/');
    this.children = [];
  }

  isRoot(): boolean {
    return this.path === '' || this.path === '/';
  }
}
