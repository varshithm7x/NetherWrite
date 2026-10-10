import { afterEach, expect, it } from "vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { FileSystemManager } from "../electron/fileSystem";
const roots: string[] = [];
afterEach(async () => { for (const root of roots.splice(0)) await rm(root, { recursive: true, force: true }); });
async function manager() {
  const root = await mkdtemp(path.join(tmpdir(), "netherwrite-import-test-")); roots.push(root);
  const api = new FileSystemManager(); api.setVaultPath(root);
  return { root, api };
}
const folder = "Uploads/12345678-1234-1234-1234-123456789abc";
it("saves original binary bytes and readable content without overwriting prior imports", async () => {
  const { root, api } = await manager();
  const bytes = new Uint8Array([0, 255, 12, 42]);
  await api.importResource(root, `${folder}/lecture.pdf`, bytes, `${folder}/lecture.content.md`, "# Evidence");
  expect(new Uint8Array(await readFile(path.join(root, folder, "lecture.pdf")))).toEqual(bytes);
  expect(await api.readFile(`${folder}/lecture.content.md`)).toBe("# Evidence");
  await expect(api.importResource(root, `${folder}/lecture.pdf`, bytes, null, "")).rejects.toThrow();
  expect(await api.readFile(`${folder}/lecture.content.md`)).toBe("# Evidence");
});
it("rejects a changed vault and paths outside the import directory", async () => {
  const { root, api } = await manager();
  await expect(api.importResource("other", `${folder}/source.txt`, new Uint8Array(), null, "")).rejects.toThrow("vault changed");
  await expect(api.importResource(root, "../escape.txt", new Uint8Array(), null, "")).rejects.toThrow("Invalid upload path");
  await expect(api.importResource(root, `${folder}/source.txt`, new Uint8Array(), "other/content.md", "text")).rejects.toThrow("Invalid content path");
});
