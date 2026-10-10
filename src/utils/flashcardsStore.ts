import { getAPI } from "./api";
import { isFlashcardRecord, isFlashcardNotePath, parseFlashcardDeck } from "./flashcard-decks";
import type { FlashcardDeck } from "../types/flashcards";

export const FLASHCARDS_CHANGED_EVENT = "netherwrite:flashcards-changed";
const STORAGE_FILE = "forge-flashcards.json";
interface DeckFile { version: 1; decks: unknown[] }
export interface FlashcardLibrary { decks: FlashcardDeck[]; skipped: number }

// Serializing mutations preserves simultaneous saves/deletes/rename updates.
let mutationQueue: Promise<unknown> = Promise.resolve();
function enqueue<T>(operation: () => Promise<T>): Promise<T> {
  const next = mutationQueue.then(operation);
  mutationQueue = next.catch(() => {});
  return next;
}

async function readFile(vaultPath: string): Promise<DeckFile> {
  const api = getAPI();
  if (await api.getVaultPath() !== vaultPath) throw new Error("The flashcard vault is no longer open.");
  const raw = await api.dataRead(STORAGE_FILE);
  if (await api.getVaultPath() !== vaultPath) throw new Error("The flashcard vault is no longer open.");
  if (raw === null) {
    // The existing bridge returns null for both missing files and read errors.
    // Never replace a saved library just because its contents were unreadable.
    if (await api.fileExists(`.netherwrite/${STORAGE_FILE}`)) throw new Error("Saved flashcards could not be read. The existing file was preserved.");
    return { version: 1, decks: [] };
  }
  let data: unknown;
  try { data = JSON.parse(raw); } catch { throw new Error("Saved flashcards could not be read. The existing file was preserved."); }
  if (!isFlashcardRecord(data) || data.version !== 1 || !Array.isArray(data.decks)) throw new Error("Saved flashcards use an invalid or unsupported format. The existing file was preserved.");
  return { version: 1, decks: data.decks };
}

export async function loadFlashcardDecks(vaultPath: string): Promise<FlashcardLibrary> {
  const file = await readFile(vaultPath);
  const ids = new Set<string>();
  let skipped = 0;
  const decks = file.decks.flatMap(raw => {
    const deck = parseFlashcardDeck(raw);
    if (!deck || deck.vaultPath !== vaultPath || ids.has(deck.id)) { skipped++; return []; }
    ids.add(deck.id);
    return [deck];
  });
  decks.sort((a, b) => b.createdAt - a.createdAt || a.id.localeCompare(b.id));
  return { decks, skipped };
}

async function writeFile(vaultPath: string, file: DeckFile): Promise<void> {
  await getAPI().dataWrite(STORAGE_FILE, JSON.stringify(file), { atomic: true, expectedVaultPath: vaultPath });
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(FLASHCARDS_CHANGED_EVENT, { detail: { vaultPath } }));
}

export function saveFlashcardDeck(deckData: unknown, vaultPath: string, beforeSave: () => Promise<void> = async () => {}): Promise<FlashcardDeck> {
  return enqueue(async () => {
    const deck = parseFlashcardDeck(deckData);
    if (!deck || deck.vaultPath !== vaultPath) throw new Error("Invalid flashcard deck.");
    const file = await readFile(vaultPath);
    if (file.decks.some(raw => isFlashcardRecord(raw) && raw.id === deck.id)) throw new Error("This flashcard deck already exists.");
    await beforeSave();
    if (await getAPI().getVaultPath() !== vaultPath) throw new Error("The flashcard vault is no longer open.");
    await writeFile(vaultPath, { version: 1, decks: [...file.decks, deck] });
    return deck;
  });
}

export function deleteFlashcardDeck(vaultPath: string, deckId: string): Promise<void> {
  return enqueue(async () => {
    const file = await readFile(vaultPath);
    const decks = file.decks.filter(raw => !(isFlashcardRecord(raw) && raw.id === deckId));
    if (decks.length !== file.decks.length) await writeFile(vaultPath, { version: 1, decks });
  });
}

/** Use the same exact-path and directory-prefix rename convention as editor tabs. */
export function renameFlashcardSources(vaultPath: string, oldPath: string, newPath: string, isDirectory: boolean): Promise<void> {
  return enqueue(async () => {
    if (!isFlashcardNotePath(oldPath) || !isFlashcardNotePath(newPath) || oldPath === newPath) return;
    const file = await readFile(vaultPath);
    let changed = false;
    const decks = file.decks.map(raw => {
      const deck = parseFlashcardDeck(raw);
      if (!deck || deck.vaultPath !== vaultPath) return raw;
      const sourceNotePath = deck.sourceNotePath === oldPath ? newPath
        : isDirectory && deck.sourceNotePath.startsWith(`${oldPath}/`) ? `${newPath}/${deck.sourceNotePath.slice(oldPath.length + 1)}` : deck.sourceNotePath;
      if (sourceNotePath === deck.sourceNotePath) return raw;
      changed = true;
      return { ...deck, sourceNotePath, sourceNoteTitle: sourceNotePath.split("/").pop()!.replace(/\.md$/i, ""), updatedAt: Math.max(Date.now(), deck.updatedAt) };
    });
    if (changed) await writeFile(vaultPath, { version: 1, decks });
  });
}
