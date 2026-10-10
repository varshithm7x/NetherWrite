// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { ElectronAPI } from "../electron/preload";
import { getAPI } from "../src/utils/api";
const folder = "Uploads/12345678-1234-1234-1234-123456789abc";
const original = `${folder}/lecture.pdf`, note = `${folder}/lecture.content.md`;
const bytes = new Uint8Array([0, 42, 255]);
let legacy: ElectronAPI;
beforeEach(() => {
  legacy = {
    getVaultPath: vi.fn().mockResolvedValue("C:\\Vault"),
    fileExists: vi.fn().mockResolvedValue(false),
    createDirectory: vi.fn().mockResolvedValue(undefined),
    writeBinary: vi.fn().mockResolvedValue(undefined),
    createFile: vi.fn().mockResolvedValue(undefined),
    deleteFile: vi.fn().mockResolvedValue(undefined),
  } as unknown as ElectronAPI;
  window.electronAPI = legacy;
});
afterEach(() => { Reflect.deleteProperty(window, "electronAPI"); vi.restoreAllMocks(); });
it("uploads using the older bridge when importResource is absent, then emits relative note events", async () => {
  const event = vi.fn(); window.addEventListener("netherwrite:file-written", event);
  try {
    await getAPI().importResource("C:\\Vault", original, bytes, note, "# PDF evidence");
    expect(legacy.writeBinary).toHaveBeenCalledWith(`C:/Vault/${original}`, bytes);
    expect(legacy.createFile).toHaveBeenCalledWith(`C:/Vault/${note}`, "# PDF evidence");
    expect((event.mock.calls[0][0] as CustomEvent).detail).toEqual({ path: note, content: "# PDF evidence", created: true });
  } finally { window.removeEventListener("netherwrite:file-written", event); }
});
it("uses the native atomic import whenever the current bridge supports it", async () => {
  legacy.importResource = vi.fn().mockResolvedValue(undefined);
  await getAPI().importResource("C:\\Vault", original, bytes, note, "# Evidence");
  expect(legacy.importResource).toHaveBeenCalledWith("C:\\Vault", original, bytes, note, "# Evidence");
  expect(legacy.writeBinary).not.toHaveBeenCalled();
});
it("removes the original when creating its content note fails", async () => {
  vi.mocked(legacy.createFile).mockRejectedValue(new Error("Disk full"));
  await expect(getAPI().importResource("C:\\Vault", original, bytes, note, "text")).rejects.toThrow("Disk full");
  expect(legacy.deleteFile).toHaveBeenCalledWith(`C:/Vault/${original}`);
});
it("does not write a content note or delete files after switching vaults", async () => {
  vi.mocked(legacy.writeBinary).mockImplementation(async () => {
    vi.mocked(legacy.getVaultPath).mockResolvedValue("C:\\Other");
  });
  await expect(getAPI().importResource("C:\\Vault", original, bytes, note, "text")).rejects.toThrow("vault changed");
  expect(legacy.createFile).not.toHaveBeenCalled();
  expect(legacy.deleteFile).not.toHaveBeenCalled();
});
it("never overwrites an existing import directory", async () => {
  vi.mocked(legacy.fileExists).mockResolvedValue(true);
  await expect(getAPI().importResource("C:\\Vault", original, bytes, note, "text")).rejects.toThrow("already exists");
  expect(legacy.writeBinary).not.toHaveBeenCalled();
});
it("shows an actionable message if neither upload nor legacy file operations exist", async () => {
  Reflect.deleteProperty(legacy, "writeBinary");
  await expect(getAPI().importResource("C:\\Vault", original, bytes, note, "text")).rejects.toThrow("Restart NetherWrite");
});
