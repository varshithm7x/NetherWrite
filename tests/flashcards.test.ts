// @vitest-environment jsdom
import { TextEncoder } from "node:util";
import { beforeEach, expect, it, vi } from "vitest";
import { generateFlashcardDeck, parseGeneratedFlashcards } from "../src/utils/flashcard-generation";
import { deleteFlashcardDeck, loadFlashcardDecks, renameFlashcardSources, saveFlashcardDeck } from "../src/utils/flashcardsStore";
import { parseFlashcardDeck } from "../src/utils/flashcard-decks";
import { AIProviderRequestError } from "../src/utils/ai-core";
import type { FlashcardDeck } from "../src/types/flashcards";

const mocks = vi.hoisted(() => ({ vault: "/fixture-one", disk: new Map<string, string>(), ask: vi.fn(), config: vi.fn(), write: vi.fn(), read: vi.fn() }));
vi.mock("../src/utils/ai-core", () => ({ askAI: mocks.ask, AIProviderRequestError: class extends Error { constructor(message: string, public status: number, public kind = "other") { super(message); } } }));
vi.mock("../src/utils/ai-settings", () => ({ loadSettingsAsync: async () => ({}), loadAIConfig: mocks.config, getModelsForProvider: () => [{ id: "fixture-model" }] }));
vi.mock("../src/utils/api", () => ({ getAPI: () => ({ getVaultPath: async () => mocks.vault, dataRead: mocks.read, dataWrite: mocks.write,
  fileExists: async (path: string) => mocks.disk.has(`${mocks.vault}:${path.replace(/^\.netherwrite\//, "")}`),
}) }));
Object.defineProperty(globalThis, "TextEncoder", { value: TextEncoder, configurable: true });
const note = { name: "Memory Management", path: "Notes/Memory Management.md" };
const passage = "External fragmentation divides free memory into noncontiguous blocks. First Fit scans holes from the beginning and selects the first block large enough. A bitmap maps each bit to one fixed-size memory unit.";
const source = `---\ntitle: Memory\n---\n# Memory Management\n\n${passage}\n`;
function generated(count = 3) {
  return { cards: Array.from({ length: count }, (_, index) => ({ front: `What does concept ${index + 1} mean?`, back: `Definition for concept ${index + 1} from the selected note.`, sourceExcerpt: passage })) };
}
function request(count = 3) {
  return { vaultPath: mocks.vault, note, count, signal: new AbortController().signal, isSourceAvailable: vi.fn(() => true), readNote: vi.fn(async () => ({ content: source, revision: source })) };
}
function deck(id = "fixture-deck", count = 3): FlashcardDeck {
  return { id, type: "flashcards", title: "Memory Flashcards", vaultPath: mocks.vault, sourceNotePath: note.path, sourceNoteTitle: note.name, createdAt: 1, updatedAt: 1,
    cards: generated(count).cards.map((card, index) => ({ id: `card-${index}`, ...card })), sourceTruncated: false, requestedCount: count };
}
function key(file: string) { return `${mocks.vault}:${file}`; }
beforeEach(() => {
  mocks.vault = "/fixture-one"; mocks.disk.clear();
  mocks.config.mockReset().mockReturnValue({ apiKey: "test-only", provider: "openai", modelId: "fixture-model" });
  mocks.ask.mockReset().mockResolvedValue(JSON.stringify(generated()));
  mocks.read.mockReset().mockImplementation(async (file: string) => mocks.disk.get(key(file)) ?? null);
  mocks.write.mockReset().mockImplementation(async (file: string, content: string, options: { expectedVaultPath: string }) => {
    if (options.expectedVaultPath !== mocks.vault) throw new Error("Vault changed");
    mocks.disk.set(key(file), content);
  });
});

it.each([1, 10, 30])("validates variable generated card counts up to %i", count => {
  expect(parseGeneratedFlashcards(JSON.stringify(generated(count)), count)).toHaveLength(count);
});

it("generates a standalone, grounded deck and reloads the same stable IDs and order offline", async () => {
  const job = request();
  const saved = await generateFlashcardDeck(job);
  expect(saved.cards).toHaveLength(3);
  expect(new Set(saved.cards.map(card => card.id)).size).toBe(3);
  expect(saved.sourceNotePath).toBe(note.path);
  expect(saved.vaultPath).toBe(mocks.vault);
  expect(saved.title).toBe("Memory Management Flashcards");
  expect(saved.createdAt).toBe(saved.updatedAt);
  expect((await loadFlashcardDecks(mocks.vault)).decks).toEqual([saved]);
  expect((await loadFlashcardDecks(mocks.vault)).decks).toEqual([saved]);
  expect(mocks.ask).toHaveBeenCalledOnce();
  expect(mocks.write).toHaveBeenCalledWith("forge-flashcards.json", expect.any(String), { atomic: true, expectedVaultPath: mocks.vault });
  expect([...mocks.disk.keys()]).not.toContain(key("comments.json"));
  expect(job.readNote.mock.calls.every(([path]) => path === note.path)).toBe(true);
  const prompt = JSON.parse(mocks.ask.mock.calls[0][1]);
  expect(prompt.noteContent).not.toContain("title: Memory");
  expect(prompt.requestedCount).toBe(3);
  expect(JSON.stringify(saved)).not.toContain("test-only");
});

it("does not constrain saved decks to today's generation UI maximum", () => {
  expect(parseFlashcardDeck(deck("future-deck", 31))?.cards).toHaveLength(31);
});

it("keeps decks isolated by vault, including when note names are identical", async () => {
  const first = await saveFlashcardDeck(deck(), mocks.vault);
  mocks.vault = "/fixture-two";
  expect((await loadFlashcardDecks(mocks.vault)).decks).toEqual([]);
  const second = await saveFlashcardDeck(deck("second"), mocks.vault);
  expect((await loadFlashcardDecks(mocks.vault)).decks).toEqual([second]);
  await expect(saveFlashcardDeck(first, mocks.vault)).rejects.toThrow("Invalid");
  mocks.vault = "/fixture-one";
  expect((await loadFlashcardDecks(mocks.vault)).decks).toEqual([first]);
});

it("preserves existing decks and serializes simultaneous deck saves", async () => {
  await Promise.all([saveFlashcardDeck(deck("one"), mocks.vault), saveFlashcardDeck(deck("two"), mocks.vault)]);
  expect((await loadFlashcardDecks(mocks.vault)).decks.map(deck => deck.id)).toEqual(["one", "two"]);
  await expect(saveFlashcardDeck(deck("one"), mocks.vault)).rejects.toThrow("already exists");
  expect((await loadFlashcardDecks(mocks.vault)).decks).toHaveLength(2);
});

it("deletes persistently without reading or changing the source note", async () => {
  await saveFlashcardDeck(deck(), mocks.vault);
  await deleteFlashcardDeck(mocks.vault, "fixture-deck");
  expect((await loadFlashcardDecks(mocks.vault)).decks).toEqual([]);
  expect(mocks.read.mock.calls.every(([file]) => file === "forge-flashcards.json")).toBe(true);
  expect(mocks.write.mock.calls.every(([file]) => file === "forge-flashcards.json")).toBe(true);
});

it("updates app-renamed source references without changing deck/card identities, order or title", async () => {
  const saved = await saveFlashcardDeck(deck(), mocks.vault);
  await renameFlashcardSources(mocks.vault, "Notes", "Moved", true);
  const renamed = (await loadFlashcardDecks(mocks.vault)).decks[0];
  expect(renamed.sourceNotePath).toBe("Moved/Memory Management.md");
  expect(renamed.cards).toEqual(saved.cards);
  expect(renamed.id).toBe(saved.id);
  expect(renamed.title).toBe(saved.title);
  await renameFlashcardSources(mocks.vault, renamed.sourceNotePath, "Moved/Memory.md", false);
  expect((await loadFlashcardDecks(mocks.vault)).decks[0].sourceNoteTitle).toBe("Memory");
});

it("keeps saved decks readable when the source is deleted", async () => {
  const saved = await saveFlashcardDeck(deck(), mocks.vault);
  mocks.ask.mockRejectedValue(new Error("Offline"));
  expect((await loadFlashcardDecks(mocks.vault)).decks).toEqual([saved]);
  expect(mocks.ask).not.toHaveBeenCalled();
});

it.each([
  "not JSON", JSON.stringify({ cards: [] }), JSON.stringify({ cards: [{ front: "Q", back: "" }] }),
  JSON.stringify({ cards: [{ ...generated(1).cards[0], front: " " }] }),
  JSON.stringify({ cards: [{ ...generated(1).cards[0], back: "x".repeat(1201) }] }),
  JSON.stringify({ cards: [{ ...generated(1).cards[0], sourceExcerpt: "Absent" }] }),
  JSON.stringify({ cards: [generated(1).cards[0], generated(1).cards[0]] }),
  JSON.stringify({ cards: [generated(1).cards[0], { ...generated(1).cards[0], front: "Another question with the same answer?" }] }),
  JSON.stringify({ cards: [{ ...generated(1).cards[0], from: 12 }] }),
  JSON.stringify(generated(4)),
])("rejects malformed/duplicate AI cards before persistence: %s", async raw => {
  mocks.ask.mockResolvedValue(raw);
  await expect(generateFlashcardDeck(request())).rejects.toThrow();
  expect(mocks.write).not.toHaveBeenCalled();
});

it("rejects unsupported evidence without saving a partially valid deck", async () => {
  const output = generated();
  output.cards[2].sourceExcerpt = "This statement never appeared in the selected note.";
  mocks.ask.mockResolvedValue(JSON.stringify(output));
  await expect(generateFlashcardDeck(request())).rejects.toThrow(/supporting passage/);
  expect(mocks.write).not.toHaveBeenCalled();
});

it("reports actual counts and bounded partial-source coverage", async () => {
  const job = request(10);
  job.readNote.mockResolvedValue({ content: source + " Additional reference material.".repeat(1000), revision: source + " Additional reference material.".repeat(1000) });
  const saved = await generateFlashcardDeck(job);
  expect(saved.cards).toHaveLength(3);
  expect(saved.requestedCount).toBe(10);
  expect(saved.sourceTruncated).toBe(true);
});

it.each(["content", "revision"] as const)("rejects stale source %s during generation", async field => {
  const job = request();
  job.readNote.mockResolvedValueOnce({ content: source, revision: source }).mockResolvedValue({ content: source, revision: source, [field]: `${source}\nChanged` });
  await expect(generateFlashcardDeck(job)).rejects.toThrow(/changed during generation/);
  expect(mocks.write).not.toHaveBeenCalled();
});

it("accepts autosaving the unchanged captured buffer", async () => {
  const job = request();
  job.readNote.mockResolvedValueOnce({ content: source, revision: "Older saved note" }).mockResolvedValue({ content: source, revision: source });
  expect((await generateFlashcardDeck(job)).cards).toHaveLength(3);
});

it("handles missing configuration, insufficient content and missing notes", async () => {
  mocks.config.mockReturnValue(null);
  await expect(generateFlashcardDeck(request())).rejects.toThrow(/Configure/);
  mocks.config.mockReturnValue({ apiKey: "test-only", provider: "openai", modelId: "fixture-model" });
  const short = request(); short.readNote.mockResolvedValue({ content: "Hello", revision: "Hello" });
  await expect(generateFlashcardDeck(short)).rejects.toThrow(/too short/);
  const missing = request(); missing.readNote.mockRejectedValue(new Error("No file"));
  await expect(generateFlashcardDeck(missing)).rejects.toThrow(/unavailable/);
  expect(mocks.ask).not.toHaveBeenCalled();
});

it.each([401, 429, 503])("reports provider HTTP %i safely without saving", async status => {
  mocks.ask.mockRejectedValue(new AIProviderRequestError("private key / stack trace", status));
  await expect(generateFlashcardDeck(request())).rejects.not.toThrow(/private key|stack trace/);
  expect(mocks.write).not.toHaveBeenCalled();
});

it("handles provider network failures and cancellations without creating a deck", async () => {
  mocks.ask.mockRejectedValue(new TypeError("private network stack"));
  await expect(generateFlashcardDeck(request())).rejects.toThrow(/connection/);
  const controller = new AbortController(); controller.abort();
  await expect(generateFlashcardDeck({ ...request(), signal: controller.signal })).rejects.toThrow(/cancelled/);
  expect(mocks.write).not.toHaveBeenCalled();
});

it("rejects a vault/source switch during generation", async () => {
  const job = request();
  mocks.ask.mockImplementation(async () => { job.isSourceAvailable.mockReturnValue(false); return JSON.stringify(generated()); });
  await expect(generateFlashcardDeck(job)).rejects.toThrow(/source note or vault changed/);
  expect(mocks.write).not.toHaveBeenCalled();
});

it("does not report success or publish a partial deck after persistence failure", async () => {
  const existing = await saveFlashcardDeck(deck(), mocks.vault);
  const diskBefore = mocks.disk.get(key("forge-flashcards.json"));
  mocks.write.mockRejectedValueOnce(new Error("Disk full / private directory"));
  await expect(generateFlashcardDeck(request())).rejects.toThrow(/Could not save/);
  expect(mocks.disk.get(key("forge-flashcards.json"))).toBe(diskBefore);
  expect((await loadFlashcardDecks(mocks.vault)).decks).toEqual([existing]);
  mocks.write.mockRejectedValueOnce(new Error("Cannot delete"));
  await expect(deleteFlashcardDeck(mocks.vault, existing.id)).rejects.toThrow();
  expect((await loadFlashcardDecks(mocks.vault)).decks).toEqual([existing]);
});

it("skips malformed saved decks, preserves their records, and refuses corrupt/unsupported files", async () => {
  const valid = deck();
  const malformed = { ...valid, id: "bad", cards: [] };
  mocks.disk.set(key("forge-flashcards.json"), JSON.stringify({ version: 1, decks: [valid, malformed, valid] }));
  expect(await loadFlashcardDecks(mocks.vault)).toEqual({ decks: [valid], skipped: 2 });
  await saveFlashcardDeck(deck("second"), mocks.vault);
  expect(JSON.parse(mocks.disk.get(key("forge-flashcards.json"))!).decks[1]).toEqual(malformed);
  mocks.disk.set(key("forge-flashcards.json"), "{bad-json");
  await expect(loadFlashcardDecks(mocks.vault)).rejects.toThrow(/preserved/);
  await expect(saveFlashcardDeck(deck("third"), mocks.vault)).rejects.toThrow();
  expect(mocks.disk.get(key("forge-flashcards.json"))).toBe("{bad-json");
});

it("rejects malformed card IDs and unsafe source references before saving", async () => {
  const duplicate = deck(); duplicate.cards[1].id = duplicate.cards[0].id;
  expect(parseFlashcardDeck(duplicate)).toBeNull();
  expect(parseFlashcardDeck({ ...deck(), sourceNotePath: "../outside.md" })).toBeNull();
  await expect(saveFlashcardDeck({ ...deck(), cards: [] }, mocks.vault)).rejects.toThrow(/Invalid/);
  expect(mocks.write).not.toHaveBeenCalled();
});

it("refuses to overwrite an existing library when the native read bridge returns null", async () => {
  const saved = await saveFlashcardDeck(deck(), mocks.vault);
  const previous = mocks.disk.get(key("forge-flashcards.json"));
  mocks.read.mockResolvedValue(null);
  await expect(saveFlashcardDeck(deck("new"), mocks.vault)).rejects.toThrow(/preserved/);
  expect(mocks.disk.get(key("forge-flashcards.json"))).toBe(previous);
  mocks.read.mockImplementation(async file => mocks.disk.get(key(file)) ?? null);
  expect((await loadFlashcardDecks(mocks.vault)).decks).toEqual([saved]);
});
