import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FileSystemManager } from "../electron/fileSystem";

describe("filesystem jail", () => {
  const dirs: string[] = [];

  afterEach(() => {
    vi.restoreAllMocks();
    for (const dir of dirs.splice(0)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  function makeVault(): { vault: string; manager: FileSystemManager } {
    const vault = fs.mkdtempSync(path.join(os.tmpdir(), "oo-vault-"));
    dirs.push(vault);
    const manager = new FileSystemManager();
    manager.setVaultPath(vault);
    return { vault, manager };
  }

  it("refuses to read absolute paths outside the vault", async () => {
    const { vault, manager } = makeVault();
    const outside = path.join(os.tmpdir(), `oo-secret-${Date.now()}.txt`);
    fs.writeFileSync(outside, "secret");
    dirs.push(outside);
    await expect(manager.readBinary(outside)).rejects.toThrow("Path traversal detected");
  });

  it("refuses attachment names that escape the attachments folder", async () => {
    const { vault, manager } = makeVault();
    const relative = await manager.saveImage("photo.png", "aaaa");
    expect(relative).toBe("attachments/photo.png");
    expect(fs.existsSync(path.join(vault, "attachments", "photo.png"))).toBe(true);
    await expect(manager.saveImage("../escape.png", "aaaa")).resolves.toBe("attachments/escape.png");
    expect(fs.existsSync(path.join(vault, "escape.png"))).toBe(false);
  });

  it("atomically replaces a quiz comment set in its expected vault", async () => {
    const { vault, manager } = makeVault();
    await manager.writeDataFile("comments.json", '{"old":[]}');
    await manager.writeDataFile("comments.json", '{"new":[]}', { atomic: true, expectedVaultPath: vault });
    expect(await manager.readDataFile("comments.json")).toBe('{"new":[]}');
    expect(fs.readdirSync(path.join(vault, ".netherwrite")).filter(name => name.endsWith(".tmp"))).toEqual([]);
  });

  it("persists flashcard decks atomically without touching note or comment files", async () => {
    const { vault, manager } = makeVault();
    await manager.writeFile("Source.md", "Source remains unchanged");
    await manager.writeDataFile("comments.json", '{"Source.md":[]}');
    await manager.writeDataFile("forge-flashcards.json", '{"version":1,"decks":[]}', { atomic: true, expectedVaultPath: vault });
    expect(await manager.readDataFile("forge-flashcards.json")).toBe('{"version":1,"decks":[]}');
    expect(await manager.readFile("Source.md")).toBe("Source remains unchanged");
    expect(await manager.readDataFile("comments.json")).toBe('{"Source.md":[]}');
  });

  it("preserves existing comments after a failed atomic quiz write", async () => {
    const { vault, manager } = makeVault();
    await manager.writeDataFile("comments.json", '{"old":[]}');
    vi.spyOn(fs.promises, "rename").mockRejectedValueOnce(new Error("Disk failure"));
    await expect(manager.writeDataFile("comments.json", '{"new":[]}', { atomic: true, expectedVaultPath: vault })).rejects.toThrow("Disk failure");
    expect(await manager.readDataFile("comments.json")).toBe('{"old":[]}');
    expect(fs.readdirSync(path.join(vault, ".netherwrite")).filter(name => name.endsWith(".tmp"))).toEqual([]);
  });

  it("rejects an atomic write when the expected source vault is no longer open", async () => {
    const { vault, manager } = makeVault();
    await manager.writeDataFile("comments.json", '{"old":[]}');
    const other = makeVault();
    manager.setVaultPath(other.vault);
    await expect(manager.writeDataFile("comments.json", '{"new":[]}', { atomic: true, expectedVaultPath: vault })).rejects.toThrow("source vault changed");
    expect(fs.readFileSync(path.join(vault, ".netherwrite/comments.json"), "utf8")).toBe('{"old":[]}');
    expect(await manager.readDataFile("comments.json")).toBeNull();
  });
});
