import { getAPI } from "./api";

export interface ForgeSourceNote { name: string; path: string }
export interface ForgeSourceContext {
  vaultPath?: string | null;
  activeNote?: ForgeSourceNote | null;
  notes?: ForgeSourceNote[];
  readNoteContent?: (path: string) => Promise<string>;
  onOpenNote?: (path: string) => void | Promise<void>;
}

export function searchForgeNotes(notes: ForgeSourceNote[], query: string): ForgeSourceNote[] {
  const term = query.replace(/^@/, "").trim().toLowerCase();
  return notes.filter(note => /\.md$/i.test(note.path) && (note.name.toLowerCase().includes(term) || note.path.toLowerCase().includes(term)))
    .sort((a, b) => Number(b.name.toLowerCase().startsWith(term)) - Number(a.name.toLowerCase().startsWith(term)) || a.path.localeCompare(b.path))
    .slice(0, 12);
}

export async function readForgeSourceNote(path: string, vaultPath: string, bufferedReader: () => ForgeSourceContext["readNoteContent"]) {
  const api = getAPI();
  if (await api.getVaultPath() !== vaultPath || !await api.fileExists(path)) throw new Error("Unavailable source");
  const persisted = await api.readFile(path);
  const readBuffered = bufferedReader();
  const content = readBuffered ? await readBuffered(path) : persisted;
  if (await api.getVaultPath() !== vaultPath) throw new Error("Unavailable source");
  return { content, revision: persisted };
}
