/**
 * Space — Core entity for NetherWrite knowledge spaces
 *
 * A Space is the unit of publishing, sharing, and forking.
 * It contains notes, relationships, embeddings, annotations, and attachments.
 *
 * Export/Import uses ZIP archives (.netherwrite.zip):
 *   space.netherwrite.zip/
 *   ├── space.json          — metadata, relationships, annotations, synthesis
 *   ├── notes/              — markdown files
 *   ├── attachments/        — images, files (no base64, no JSON embedding)
 *   └── embeddings/         — optional embedding data (JSON per note)
 */

import JSZip from "jszip";
import { saveAs } from "file-saver";
import { loadStore, type StoredEmbedding, type EmbeddingStore, saveStore } from "./embeddings";
import { getAPI } from "./api";
import { loadSuggestionHistory, type SuggestionRecord } from "./embeddings";

// ── Space model ──────────────────────────────────────────────────────────────

export interface SpaceMetadata {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  exportedAt: string;
  version: number;
  noteCount: number;
  attachmentCount: number;
}

export interface SpaceRelationship {
  source: string;     // note filename (relative)
  target: string;     // note filename (relative)
  type: "related" | "supports" | "contradicts" | "example_of";
  createdAt: string;
}

export interface SpaceAnnotation {
  noteId: string;     // note filename (relative)
  text: string;
  createdAt: string;
}

export interface SpaceSynthesis {
  id: string;
  noteIds: string[];
  insight: string;
  createdAt: string;
}

export interface SpaceManifest {
  metadata: SpaceMetadata;
  notes: { id: string; title: string; filename: string }[];
  relationships: SpaceRelationship[];
  annotations: SpaceAnnotation[];
  syntheses: SpaceSynthesis[];
  includesEmbeddings: boolean;
}

// ── Extract relationships from note content ──────────────────────────────────

function extractRelationships(
  noteName: string,
  content: string,
): SpaceRelationship[] {
  const relationships: SpaceRelationship[] = [];
  const wikiLinkRegex = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\](?:\s*%%(\w+)%%)?/g;
  let match;

  while ((match = wikiLinkRegex.exec(content)) !== null) {
    const target = match[1].trim();
    const typeStr = match[2]?.trim() || "related";
    const type = (["related", "supports", "contradicts", "example_of"].includes(typeStr)
      ? typeStr
      : "related") as SpaceRelationship["type"];

    relationships.push({
      source: noteName,
      target,
      type,
      createdAt: new Date().toISOString(),
    });
  }

  return relationships;
}

// ── Export ────────────────────────────────────────────────────────────────────

/**
 * Export the current vault as a .netherwrite.zip archive.
 * Includes notes, attachments, relationships, annotations, and optionally embeddings.
 */
export async function exportSpace(options: {
  title: string;
  description: string;
  includeEmbeddings?: boolean;
}): Promise<void> {
  const api = getAPI();
  const zip = new JSZip();
  const notesFolder = zip.folder("notes")!;
  const attachmentsFolder = zip.folder("attachments")!;

  // Collect all files from the vault
  const tree = await api.getFileTree();
  const allNotes: { id: string; title: string; filename: string; content: string }[] = [];
  const allRelationships: SpaceRelationship[] = [];
  const allAttachmentPaths: string[] = [];
  const attachmentNameMap = new Map<string, string>();

  // Recursive file collector with duplicate name handling
  async function collectFiles(entries: any[], prefix = ""): Promise<void> {
    for (const entry of entries) {
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;

      if (entry.isDirectory && entry.children) {
        await collectFiles(entry.children, relativePath);
        continue;
      }

      // Markdown notes
      if (entry.name.endsWith(".md")) {
        try {
          const content = await api.readFile(entry.path);
          const id = relativePath.replace(/\.md$/, "");
          const title = entry.name.replace(/\.md$/, "");

          allNotes.push({ id, title, filename: relativePath, content });

          // Extract relationships from content
          const rels = extractRelationships(title, content);
          allRelationships.push(...rels);

          // Store note in zip
          notesFolder.file(relativePath, content);
        } catch (err) {
          console.warn(`[Export] Failed to read ${entry.path}:`, err);
        }
        continue;
      }

      // Attachments (images, PDFs, etc.)
      const ext = entry.name.split(".").pop()?.toLowerCase() || "";
      const isAttachment = ["png", "jpg", "jpeg", "gif", "svg", "webp", "pdf", "mp3", "mp4", "wav"].includes(ext);

      if (isAttachment) {
        try {
          const data = await (api as any).readBinaryFile?.(entry.path);
          if (data) {
            // Handle duplicate names
            let safeName = entry.name;
            if (attachmentNameMap.has(entry.name)) {
              const baseName = entry.name.substring(0, entry.name.lastIndexOf("."));
              const extension = entry.name.substring(entry.name.lastIndexOf("."));
              safeName = `${baseName}_${Date.now()}${extension}`;
            }
            attachmentNameMap.set(entry.name, safeName);
            attachmentsFolder.file(safeName, data);
            allAttachmentPaths.push(safeName);
          }
        } catch {
          // Binary read not available — skip attachment
        }
      }
    }
  }

  await collectFiles(tree);

  // Load annotations from cache
  const annotations: SpaceAnnotation[] = [];
  try {
    const cacheRaw = localStorage.getItem("netherwrite-ai-cache-v2");
    if (cacheRaw) {
      const cache = JSON.parse(cacheRaw);
      for (const [noteId, data] of Object.entries(cache.annotations || {})) {
        const ann = data as any;
        annotations.push({
          noteId: noteId.split("/").pop()?.replace(/\.md$/, "") || noteId,
          text: ann.text,
          createdAt: new Date(ann.createdAt || Date.now()).toISOString(),
        });
      }
    }
  } catch { /* silent */ }

  // Load synthesis results from cache
  const syntheses: SpaceSynthesis[] = [];
  try {
    const synthRaw = localStorage.getItem("netherwrite-synthesis-cache-v1");
    if (synthRaw) {
      const synthCache = JSON.parse(synthRaw);
      let idx = 0;
      for (const [, entry] of Object.entries(synthCache)) {
        const e = entry as any;
        syntheses.push({
          id: `synth-${idx++}`,
          noteIds: e.noteKeys || [],
          insight: e.insight,
          createdAt: new Date(e.createdAt || Date.now()).toISOString(),
        });
      }
    }
  } catch { /* silent */ }

  // Optionally include embeddings
  if (options.includeEmbeddings) {
    const embFolder = zip.folder("embeddings")!;
    const store = loadStore();
    for (const [path, entry] of store.entries) {
      const name = path.replace(/\//g, "_").replace(/\.md$/, "") + ".json";
      embFolder.file(name, JSON.stringify({
        path: entry.path,
        hash: entry.hash,
        vector: entry.vector,
        updatedAt: entry.updatedAt,
      }));
    }
  }

  // Build manifest
  const manifest: SpaceManifest = {
    metadata: {
      id: `space-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: options.title,
      description: options.description,
      createdAt: new Date().toISOString(),
      exportedAt: new Date().toISOString(),
      version: 1,
      noteCount: allNotes.length,
      attachmentCount: allAttachmentPaths.length,
    },
    notes: allNotes.map((n) => ({ id: n.id, title: n.title, filename: n.filename })),
    relationships: allRelationships,
    annotations,
    syntheses,
    includesEmbeddings: !!options.includeEmbeddings,
  };

  zip.file("space.json", JSON.stringify(manifest, null, 2));

  // Generate and download
  const blob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  const safeName = options.title.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();
  saveAs(blob, `${safeName}.netherwrite.zip`);
}

// ── Import ───────────────────────────────────────────────────────────────────

export interface ImportResult {
  notesImported: number;
  attachmentsImported: number;
  relationshipsRestored: number;
  embeddingsRestored: number;
  errors: string[];
}

/**
 * Import a .netherwrite.zip archive into the vault.
 * Restores notes, attachments, and optionally embeddings.
 */
export async function importSpace(file: File): Promise<ImportResult> {
  const api = getAPI();
  const result: ImportResult = {
    notesImported: 0,
    attachmentsImported: 0,
    relationshipsRestored: 0,
    embeddingsRestored: 0,
    errors: [],
  };

  try {
    const zip = await JSZip.loadAsync(file);

    // Read manifest
    const manifestFile = zip.file("space.json");
    if (!manifestFile) {
      result.errors.push("Invalid archive: missing space.json");
      return result;
    }

    const manifest: SpaceManifest = JSON.parse(await manifestFile.async("text"));

    // Import notes
    const notesFolder = zip.folder("notes");
    if (notesFolder) {
      const noteFiles = notesFolder.filter((_, file) => !file.dir);
      for (const noteFile of noteFiles) {
        try {
          const content = await noteFile.async("text");
          const relativePath = noteFile.name.replace(/^notes\//, "");
          await api.createFile(relativePath, content);
          result.notesImported++;
        } catch (err: any) {
          // File might already exist
          if (err?.message?.includes("EEXIST") || err?.code === "EEXIST") {
            result.errors.push(`Skipped existing: ${noteFile.name}`);
          } else {
            result.errors.push(`Failed to import: ${noteFile.name}`);
          }
        }
      }
    }

    // Import attachments
    const attachFolder = zip.folder("attachments");
    if (attachFolder) {
      const attachFiles = attachFolder.filter((_, file) => !file.dir);
      for (const attachFile of attachFiles) {
        try {
          const data = await attachFile.async("uint8array");
          const relativePath = "attachments/" + attachFile.name.replace(/^attachments\//, "");
          await (api as any).writeBinaryFile?.(relativePath, data);
          result.attachmentsImported++;
        } catch {
          result.errors.push(`Failed to import attachment: ${attachFile.name}`);
        }
      }
    }

    // Restore embeddings if included
    if (manifest.includesEmbeddings) {
      const embFolder = zip.folder("embeddings");
      if (embFolder) {
        const store = loadStore();
        const embFiles = embFolder.filter((_, file) => !file.dir);
        for (const embFile of embFiles) {
          try {
            const data = JSON.parse(await embFile.async("text"));
            if (data.path && data.vector && data.hash) {
              store.entries.set(data.path, {
                path: data.path,
                hash: data.hash,
                vector: data.vector,
                updatedAt: data.updatedAt || Date.now(),
              });
              result.embeddingsRestored++;
            }
          } catch {
            // Skip invalid embedding files
          }
        }
        saveStore(store);
      }
    }

    // Restore annotations
    if (manifest.annotations.length > 0) {
      try {
        const cacheRaw = localStorage.getItem("netherwrite-ai-cache-v2");
        const cache = cacheRaw ? JSON.parse(cacheRaw) : { annotations: {}, syntheses: {} };
        for (const ann of manifest.annotations) {
          cache.annotations[ann.noteId] = {
            text: ann.text,
            hash: "",
            createdAt: new Date(ann.createdAt).getTime(),
          };
        }
        localStorage.setItem("netherwrite-ai-cache-v2", JSON.stringify(cache));
      } catch { /* silent */ }
    }

    // Restore synthesis insights
    if (manifest.syntheses.length > 0) {
      try {
        const synthRaw = localStorage.getItem("netherwrite-synthesis-cache-v1");
        const synthCache = synthRaw ? JSON.parse(synthRaw) : {};
        for (const synth of manifest.syntheses) {
          const key = synth.noteIds.sort().join("|");
          synthCache[key] = {
            noteKeys: synth.noteIds,
            insight: synth.insight,
            createdAt: new Date(synth.createdAt).getTime(),
          };
        }
        localStorage.setItem("netherwrite-synthesis-cache-v1", JSON.stringify(synthCache));
      } catch { /* silent */ }
    }

    result.relationshipsRestored = manifest.relationships.length;
  } catch (err) {
    result.errors.push(`Import failed: ${err instanceof Error ? err.message : "Unknown error"}`);
  }

  return result;
}
