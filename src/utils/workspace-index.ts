import { getAPI } from './api';
import { collectDocuments, extractDocument, type IndexedDocument } from './document-ingestion';
import { embedNote, flushEmbeddings, isLexicalFallbackActive, pruneMissingEmbeddings, refreshEmbeddingMetadataIfUnchanged, restoreCachedEmbeddingMode, type EmbeddingStore } from './embeddings';
import type { FileEntry } from '../types';
const CACHE_FILE = 'workspace-documents.json';
interface DocumentCache { version: 1; documents: IndexedDocument[]; embeddingMode?: 'semantic' | 'lexical'; }
export interface WorkspaceDocuments { documents: Map<string, IndexedDocument>; errors: string[]; reused: number; embeddingMode?: 'semantic' | 'lexical'; }
export async function loadWorkspaceDocuments(tree: FileEntry[], progress: (text: string) => void): Promise<WorkspaceDocuments> {
  const api = getAPI(); let cache: DocumentCache | null = null;
  try { const raw = await api.dataRead(CACHE_FILE); if (raw) { const parsed = JSON.parse(raw); if (parsed.version === 1 && Array.isArray(parsed.documents)) cache = parsed; } } catch {}
  const previous = new Map<string, IndexedDocument>((cache?.documents || []).filter(doc => typeof doc?.path === 'string' && typeof doc.content === 'string').map(doc => [doc.path, doc]));
  const files = collectDocuments(tree); const documents = new Map<string, IndexedDocument>(); const errors: string[] = []; let reused = 0;
  for (let index = 0; index < files.length; index++) {
    const entry = files[index]; const old = previous.get(entry.path);
    if (old && old.modifiedAt === entry.modifiedAt && old.size === entry.size && old.kind === entry.extension.toLowerCase()) { documents.set(entry.path, old); reused++; continue; }
    progress(`Reading ${index + 1}/${files.length}: ${entry.name}`);
    try { documents.set(entry.path, await extractDocument(entry)); } catch (error) { errors.push(`${entry.name}: ${error instanceof Error ? error.message : String(error)}`); }
  }
  return { documents, errors, reused, embeddingMode: cache?.embeddingMode };
}
export async function updateWorkspaceIndex(store: EmbeddingStore, snapshot: WorkspaceDocuments, progress: (text: string) => void): Promise<{ reused: number; updated: number }> {
  restoreCachedEmbeddingMode(snapshot.embeddingMode);
  pruneMissingEmbeddings(store, [...snapshot.documents.keys()]);
  let reused = 0; let updated = 0;
  for (const document of snapshot.documents.values()) {
    const entry = store.entries.get(document.path);
    const validVector = entry?.vector?.some(value => Number.isFinite(value) && Math.abs(value) > 1e-8);
    if ((validVector || document.content.trim().length < 5) && refreshEmbeddingMetadataIfUnchanged(store, document.path, document.content, document.modifiedAt, document.size)) { reused++; continue; }
    progress(`Embedding ${reused + updated + 1}/${snapshot.documents.size}: ${document.path.split('/').pop()}`);
    if (await embedNote(store, document.path, document.content, document.modifiedAt, document.size)) updated++; else reused++;
  }
  await flushEmbeddings();
  const embeddingMode = updated ? (isLexicalFallbackActive() ? 'lexical' : 'semantic') : snapshot.embeddingMode;
  const cache: DocumentCache = { version: 1, documents: [...snapshot.documents.values()], ...(embeddingMode ? { embeddingMode } : {}) };
  await getAPI().dataWrite(CACHE_FILE, JSON.stringify(cache));
  return { reused, updated };
}
