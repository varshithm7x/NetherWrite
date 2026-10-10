import { access, mkdir, mkdtemp, rm } from "node:fs/promises";
import * as fsPromises from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const fsMock = vi.hoisted(() => ({ forceCrossDeviceError: false }));

vi.mock("node:fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs/promises")>();
  return {
    ...actual,
    rename: vi.fn(async (...args: Parameters<typeof actual.rename>) => {
      if (fsMock.forceCrossDeviceError) {
        throw Object.assign(new Error("cross-device move"), { code: "EXDEV" });
      }
      return actual.rename(...args);
    }),
  };
});

const electronMocks = vi.hoisted(() => ({
  openExternal: vi.fn(async () => {}),
}));

vi.mock("electron", () => ({
  app: { getPath: vi.fn() },
  BrowserWindow: class {},
  clipboard: { readText: vi.fn(), writeText: vi.fn() },
  dialog: { showOpenDialog: vi.fn(), showSaveDialog: vi.fn() },
  shell: {
    openExternal: electronMocks.openExternal,
    openPath: vi.fn(),
    showItemInFolder: vi.fn(),
    trashItem: vi.fn(),
  },
}));

import { registerIpcHandlers } from "../electron/ipc";

type Handler = (...args: any[]) => any;

function registeredHandlers(
  fsManager: object = {},
  renameVaultPath?: (oldPath: string, newPath: string) => string[],
): Map<string, Handler> {
  const handlers = new Map<string, Handler>();
  const ipcMain = {
    handle: vi.fn((channel: string, handler: Handler) => {
      handlers.set(channel, handler);
    }),
    on: vi.fn(),
  };

  registerIpcHandlers(
    ipcMain as any,
    fsManager as any,
    {} as any,
    () => null,
    undefined,
    undefined,
    undefined,
    renameVaultPath,
  );
  return handlers;
}

describe("learning report storage IPC", () => {
  it("accepts atomic report saves through the actual registered handler", async () => {
    const writeDataFile = vi.fn().mockResolvedValue(undefined);
    const handler = registeredHandlers({ writeDataFile }).get("data:write")!;
    const options = { atomic: true, expectedVaultPath: "/isolated-test-vault" };
    await handler({}, "forge-reports.json", '{"version":1,"reports":[]}', options);
    expect(writeDataFile).toHaveBeenCalledWith("forge-reports.json", '{"version":1,"reports":[]}', options);
  });
  it("still rejects unapproved atomic paths and malformed save options", async () => {
    const writeDataFile = vi.fn();
    const handler = registeredHandlers({ writeDataFile }).get("data:write")!;
    await expect(handler({}, "unapproved.json", "{}", { atomic: true, expectedVaultPath: "/isolated-test-vault" })).rejects.toThrow("write options");
    await expect(handler({}, "forge-reports.json", "{}", { atomic: false, expectedVaultPath: "/isolated-test-vault" })).rejects.toThrow("write options");
    expect(writeDataFile).not.toHaveBeenCalled();
  });
});

describe("desktop:openExternal IPC", () => {
  beforeEach(() => {
    electronMocks.openExternal.mockClear();
  });

  it("opens validated web URLs with the external shell", async () => {
    const handler = registeredHandlers().get("desktop:openExternal");

    await handler?.({}, "https://example.com/docs");

    expect(electronMocks.openExternal).toHaveBeenCalledWith(
      "https://example.com/docs",
    );
  });

  it("rejects local paths before invoking the external shell", async () => {
    const handler = registeredHandlers().get("desktop:openExternal");

    await expect(handler?.({}, "file:///tmp/private.txt")).rejects.toThrow(
      "protocol is not allowed",
    );
    expect(electronMocks.openExternal).not.toHaveBeenCalled();
  });
});

describe("desktop:renamePath IPC", () => {
  it("registers the handler and renames an approved vault", async () => {
    const parentPath = await mkdtemp(join(tmpdir(), "netherwrite-ipc-"));
    const sourcePath = join(parentPath, "source-vault");
    const destinationPath = join(parentPath, "renamed-vault");
    const renamedPaths: string[][] = [];
    let activePath = sourcePath;
    const fsManager = {
      getVaultPath: () => activePath,
      setVaultPath: (path: string) => {
        activePath = path;
        return true;
      },
    };

    await mkdir(sourcePath);

    try {
      const handler = registeredHandlers(fsManager, (oldPath, newPath) => {
        renamedPaths.push([oldPath, newPath]);
        return [newPath];
      }).get("desktop:renamePath");

      expect(handler).toBeDefined();
      await expect(handler?.({}, sourcePath, destinationPath)).resolves.toEqual({
        success: true,
      });

      await expect(access(destinationPath)).resolves.toBeUndefined();
      await expect(access(sourcePath)).rejects.toThrow();
      expect(renamedPaths).toEqual([[sourcePath, destinationPath]]);
    } finally {
      await rm(parentPath, { recursive: true, force: true });
    }
  });

  it("reports success when updating vault history fails after the move", async () => {
    const parentPath = await mkdtemp(join(tmpdir(), "netherwrite-ipc-"));
    const sourcePath = join(parentPath, "source-vault");
    const destinationPath = join(parentPath, "renamed-vault");
    let activePath = sourcePath;
    const fsManager = {
      getVaultPath: () => activePath,
      setVaultPath: (path: string) => {
        activePath = path;
        return true;
      },
    };

    await mkdir(sourcePath);

    try {
      const handler = registeredHandlers(fsManager, () => {
        throw new Error("history unavailable");
      }).get("desktop:renamePath");

      await expect(handler?.({}, sourcePath, destinationPath)).resolves.toEqual({
        success: true,
      });
      await expect(access(destinationPath)).resolves.toBeUndefined();
    } finally {
      await rm(parentPath, { recursive: true, force: true });
    }
  });

  it("falls back to copy and remove for cross-device moves", async () => {
    const parentPath = await mkdtemp(join(tmpdir(), "netherwrite-ipc-"));
    const sourcePath = join(parentPath, "source-vault");
    const destinationPath = join(parentPath, "renamed-vault");
    const sourceFile = join(sourcePath, "note.md");
    let activePath = sourcePath;
    const fsManager = {
      getVaultPath: () => activePath,
      setVaultPath: (path: string) => {
        activePath = path;
        return true;
      },
    };

    await mkdir(sourcePath);
    await fsPromises.writeFile(sourceFile, "# Note", "utf8");

    try {
      fsMock.forceCrossDeviceError = true;
      const handler = registeredHandlers(fsManager).get("desktop:renamePath");

      await expect(handler?.({}, sourcePath, destinationPath)).resolves.toEqual({
        success: true,
      });
      await expect(access(join(destinationPath, "note.md"))).resolves.toBeUndefined();
      await expect(access(sourcePath)).rejects.toThrow();
    } finally {
      fsMock.forceCrossDeviceError = false;
      await rm(parentPath, { recursive: true, force: true });
    }
  });

  it("moves the process CWD with an active vault", async () => {
    const parentPath = await mkdtemp(join(tmpdir(), "netherwrite-ipc-"));
    const sourcePath = join(parentPath, "source-vault");
    const destinationPath = join(parentPath, "renamed-vault");
    const originalCwd = process.cwd();
    let activePath = sourcePath;
    const fsManager = {
      getVaultPath: () => activePath,
      setVaultPath: (path: string) => {
        activePath = path;
        return true;
      },
    };

    await mkdir(sourcePath);

    try {
      process.chdir(sourcePath);
      const handler = registeredHandlers(fsManager).get("desktop:renamePath");

      await expect(handler?.({}, sourcePath, destinationPath)).resolves.toEqual({
        success: true,
      });
      expect(process.cwd()).toBe(destinationPath);
    } finally {
      process.chdir(originalCwd);
      await rm(parentPath, { recursive: true, force: true });
    }
  });
});
