import { getAPI } from "./api";
import { extractResourceContent, MAX_RESOURCE_BYTES } from "./resource-content";
import { isPowerPointResource, resourceContentPath } from "./resource-paths";

export interface ImportedResource { name: string; originalPath: string; notePath: string | null; warnings: string[] }

export async function importResource(file: File, vaultPath: string, signal?: AbortSignal): Promise<ImportedResource> {
  if (isPowerPointResource(file.name)) throw new Error("PowerPoint uploads are not supported. Export the presentation as a PDF and upload that instead.");
  if (file.size > MAX_RESOURCE_BYTES) throw new Error("Each upload must be 50 MB or smaller.");
  const api = getAPI();
  async function ensureVault() {
    signal?.throwIfAborted();
    if (await api.getVaultPath() !== vaultPath) throw new Error("The vault changed. Upload the resource again in the intended vault.");
    signal?.throwIfAborted();
  }
  await ensureVault();
  const cleaned = file.name.replace(/[<>:"/\\|?*\x00-\x1f]/g, "_").replace(/[. ]+$/g, "").slice(0, 180) || "resource";
  const name = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)/i.test(cleaned) ? `_${cleaned}` : cleaned;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const extracted = await extractResourceContent(name, bytes, signal);
  // Separate import directories preserve originals and prevent same-name uploads overwriting notes.
  const folder = `Uploads/${crypto.randomUUID()}`;
  const originalPath = `${folder}/${name}`;
  const notePath = extracted.text ? resourceContentPath(originalPath) : null;
  await ensureVault();
  let content = "";
  if (notePath) {
    const title = name.replace(/[\r\n\[\]#]/g, " ");
    const sourceLink = originalPath.split("/").map(encodeURIComponent).join("/");
    content = `---\nresource_source: ${JSON.stringify(originalPath)}\nresource_name: ${JSON.stringify(name)}\n---\n\n# ${title}\n\n[Open original resource](</${sourceLink}>)\n\n${extracted.warnings.map(warning => `> ${warning}\n\n`).join("")}${extracted.text}\n`;
  }
  await api.importResource(vaultPath, originalPath, bytes, notePath, content);
  return { name, originalPath, notePath, warnings: extracted.warnings };
}
