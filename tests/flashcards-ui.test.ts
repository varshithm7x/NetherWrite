// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { TextEncoder } from "node:util";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ForgeFlashcardForm } from "../src/components/panels/ForgeFlashcardForm";
import { FlashcardStudy } from "../src/components/panels/FlashcardStudy";
import { ForgePanel } from "../src/components/panels/ForgePanel";
import { saveFlashcardDeck } from "../src/utils/flashcardsStore";
import type { ForgeSourceContext } from "../src/utils/forge-note-source";
import type { FlashcardDeck } from "../src/types/flashcards";
import { ForgeGenerationBoundary } from "../src/components/panels/ForgeGenerationBoundary";

const mocks = vi.hoisted(() => ({
  vault: "/fixture-vault", ask: vi.fn(), exists: vi.fn(), readNote: vi.fn(), disk: new Map<string, string>(), write: vi.fn(),
}));
vi.mock("../src/utils/ai-core", () => ({ askAI: mocks.ask, AIProviderRequestError: class extends Error {} }));
vi.mock("../src/utils/ai-settings", () => ({ loadSettingsAsync: async () => ({}), loadAIConfig: () => ({ apiKey: "test-only", modelId: "fixture-model", provider: "openai" }), getModelsForProvider: () => [{ id: "fixture-model" }] }));
vi.mock("../src/utils/api", () => ({ getAPI: () => ({
  getVaultPath: async () => mocks.vault, fileExists: mocks.exists, readFile: mocks.readNote,
  dataRead: async (file: string) => mocks.disk.get(`${mocks.vault}:${file}`) ?? null, dataWrite: mocks.write,
}) }));
vi.mock("../src/lib/auth", () => ({ authManager: { getUser: () => null } }));
vi.mock("../src/utils/disk-store", () => ({ readData: async () => null, writeData: vi.fn() }));
Object.defineProperty(globalThis, "TextEncoder", { value: TextEncoder, configurable: true });
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root | null;
let container: HTMLDivElement;
const current = { name: "Memory", path: "Memory.md" };
const first = { name: "Systems", path: "Advanced/Systems.md" };
const second = { name: "Systems", path: "Basics/Systems.md" };
const notes = [current, first, second];
const passage = "Memory management tracks allocated and free memory. A bitmap associates each bit with a fixed-size memory unit. First Fit selects the first free block large enough for an allocation request.";
let props: ForgeSourceContext & { onBack: () => void; onCreated: (deck: FlashcardDeck) => void };

function deck(id = "saved-deck", count = 2): FlashcardDeck {
  return { id, type: "flashcards", title: "Memory Flashcards", vaultPath: mocks.vault, sourceNotePath: current.path, sourceNoteTitle: current.name,
    createdAt: 1, updatedAt: 1, sourceTruncated: false, requestedCount: count,
    cards: Array.from({ length: count }, (_, index) => ({ id: `card-${index}`, front: `Question ${index + 1}?`, back: `Answer ${index + 1}.` })) };
}

beforeEach(() => {
  mocks.vault = "/fixture-vault"; mocks.disk.clear();
  mocks.ask.mockReset().mockImplementation(async (_system: string, prompt: string) => {
    const count = JSON.parse(prompt).requestedCount;
    return JSON.stringify({ cards: Array.from({ length: count }, (_, index) => ({ front: `Recall question ${index + 1}?`, back: `Grounded answer ${index + 1}.`, sourceExcerpt: passage })) });
  });
  mocks.exists.mockReset().mockImplementation(async (path: string) => path.startsWith(".netherwrite/")
    ? mocks.disk.has(`${mocks.vault}:${path.replace(/^\.netherwrite\//, "")}`) : true);
  mocks.readNote.mockReset().mockResolvedValue(passage);
  mocks.write.mockReset().mockImplementation(async (file: string, data: string, options: { expectedVaultPath: string }) => {
    if (options.expectedVaultPath !== mocks.vault) throw new Error("Vault changed");
    mocks.disk.set(`${mocks.vault}:${file}`, data);
  });
  props = { vaultPath: mocks.vault, activeNote: current, notes, onOpenNote: vi.fn(), onBack: vi.fn(), onCreated: vi.fn() };
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
});
afterEach(() => { act(() => root?.unmount()); root = null; document.body.replaceChildren(); });
async function renderForm(patch: Partial<typeof props> = {}) {
  props = { ...props, ...patch };
  await act(async () => root!.render(React.createElement(ForgeGenerationBoundary, null, React.createElement(ForgeFlashcardForm, props))));
}
async function renderStudy(data = deck(), onOpenNote = props.onOpenNote) {
  await act(async () => root!.render(React.createElement(FlashcardStudy, { deck: data, onBack: props.onBack, onOpenNote })));
}
async function renderForge(patch: Partial<ForgeSourceContext> = {}) {
  props = { ...props, ...patch };
  await act(async () => root!.render(React.createElement(ForgePanel, props)));
}
function button(text: string) { return [...container.querySelectorAll<HTMLButtonElement>("button")].find(button => button.textContent?.trim() === text)!; }
function flipButton() { return container.querySelector<HTMLButtonElement>("[data-flashcard-flip]")!; }
async function click(target: HTMLButtonElement) { await act(async () => target.click()); }
async function type(label: string, value: string) {
  await act(async () => {
    const input = container.querySelector<HTMLInputElement>(`[aria-label="${label}"]`)!;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
async function key(target: HTMLElement, key: string) {
  await act(async () => { target.focus(); target.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true })); });
}
async function submit() { await act(async () => container.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))); }

it("defaults to ten cards from Current Note and follows active-note switches", async () => {
  await renderForm();
  expect(container.querySelector<HTMLInputElement>('[aria-label="Number of flashcards"]')!.value).toBe("10");
  await renderForm({ activeNote: first });
  expect(container.textContent).toContain(first.path);
  await submit();
  expect(props.onCreated).toHaveBeenCalledWith(expect.objectContaining({ sourceNotePath: first.path, cards: expect.any(Array) }));
});

it("reuses @ search, duplicate-path display and keyboard selection, independent of editor tab", async () => {
  await renderForm();
  await type("Select source note", "@Systems");
  expect(container.querySelectorAll('[role="option"]')).toHaveLength(2);
  expect(container.textContent).toContain(first.path);
  expect(container.textContent).toContain(second.path);
  const input = container.querySelector<HTMLElement>('[aria-label="Select source note"]')!;
  await key(input, "ArrowDown"); await key(input, "Enter");
  await renderForm({ activeNote: first });
  await submit();
  expect(props.onCreated).toHaveBeenCalledWith(expect.objectContaining({ sourceNotePath: second.path }));
  expect(props.onOpenNote).not.toHaveBeenCalled();
});

it("dismisses @ suggestions with Escape and blocks an unresolved mention", async () => {
  await renderForm(); await type("Select source note", "@Missing");
  await key(container.querySelector<HTMLElement>('[aria-label="Select source note"]')!, "Escape");
  expect(container.querySelector('[aria-label="Select source note"]')!.getAttribute("aria-expanded")).toBe("false");
  await submit(); expect(mocks.ask).not.toHaveBeenCalled();
  await click(button("Current Note")); await submit(); expect(mocks.ask).toHaveBeenCalledOnce();
});

it.each([1, 5, 30])("generates a variable count of %i cards", async count => {
  await renderForm(); await type("Number of flashcards", String(count)); await submit();
  expect(props.onCreated).toHaveBeenCalledWith(expect.objectContaining({ requestedCount: count, cards: expect.arrayContaining([expect.any(Object)]) }));
  expect((props.onCreated as ReturnType<typeof vi.fn>).mock.calls[0][0].cards).toHaveLength(count);
});

it.each(["0", "31", "1.5", ""])("blocks invalid count %s", async count => {
  await renderForm(); await type("Number of flashcards", count); await submit();
  expect(mocks.ask).not.toHaveBeenCalled();
});

it("blocks missing/deleted source notes and offers explicit @ selection without a current note", async () => {
  await renderForm({ activeNote: null }); await submit(); expect(mocks.ask).not.toHaveBeenCalled();
  await type("Select source note", "@Basics"); await key(container.querySelector<HTMLElement>('[aria-label="Select source note"]')!, "Enter");
  await renderForm({ notes: [current, first] });
  expect(container.textContent).toContain("moved, renamed, or removed");
  await submit(); expect(mocks.ask).not.toHaveBeenCalled();
});

it("prevents duplicate submissions and cancels safely on unmount", async () => {
  let resolve!: (value: string) => void;
  mocks.ask.mockImplementation(() => new Promise(done => { resolve = done; }));
  await renderForm();
  await act(async () => {
    const form = container.querySelector("form")!;
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
  expect(mocks.ask).toHaveBeenCalledOnce();
  expect(container.textContent).toContain("Generating…");
  expect(container.textContent).toContain("Generating flashcards…");
  expect(container.querySelector('[data-electric-active="true"]')).not.toBeNull();
  const signal: AbortSignal = mocks.ask.mock.calls[0][4];
  act(() => root!.unmount()); root = null;
  expect(signal.aborted).toBe(true);
  await act(async () => resolve(JSON.stringify({ cards: [{ front: "Question?", back: "Answer.", sourceExcerpt: passage }] })));
  expect(mocks.write).not.toHaveBeenCalled();
  expect(props.onCreated).not.toHaveBeenCalled();
});

it("flips between question and answer and resets to front on navigation", async () => {
  await renderStudy();
  expect(flipButton().textContent).toContain("Question 1?");
  expect(flipButton().textContent).not.toContain("Answer 1.");
  await click(flipButton()); expect(flipButton().textContent).toContain("Answer 1.");
  flipButton().scrollTop = 150;
  await click(container.querySelector<HTMLButtonElement>('[aria-label="Next flashcard"]')!);
  expect(flipButton().scrollTop).toBe(0);
  expect(flipButton().textContent).toContain("Question 2?");
  expect(container.textContent).toContain("2 / 2");
  await click(container.querySelector<HTMLButtonElement>('[aria-label="Previous flashcard"]')!);
  expect(flipButton().textContent).toContain("Question 1?");
});

it("disables arrows at real boundaries, including a one-card deck", async () => {
  await renderStudy(deck("single", 1));
  expect(container.querySelector<HTMLButtonElement>('[aria-label="Previous flashcard"]')!.disabled).toBe(true);
  expect(container.querySelector<HTMLButtonElement>('[aria-label="Next flashcard"]')!.disabled).toBe(true);
  expect(container.textContent).toContain("1 / 1");
});

it("supports focused Space/Enter flips and arrow navigation without hijacking the note editor", async () => {
  await renderStudy();
  await key(flipButton(), " "); expect(flipButton().textContent).toContain("Answer 1.");
  await key(flipButton(), "Enter"); expect(flipButton().textContent).toContain("Question 1?");
  await key(flipButton(), "ArrowRight"); expect(container.textContent).toContain("2 / 2");
  await key(flipButton(), "ArrowLeft"); expect(container.textContent).toContain("1 / 2");
  const editor = document.createElement("textarea"); document.body.append(editor);
  await key(editor, "ArrowRight"); await key(editor, " ");
  expect(container.textContent).toContain("1 / 2");
  expect(flipButton().textContent).toContain("Question 1?");
});

it("renders long answers safely with internal scrolling and native theme classes", async () => {
  const data = deck(); data.cards[0].back = '<img src="x" onerror="evil()"> ' + "Long answer ".repeat(220);
  await renderStudy(data); await click(flipButton());
  expect(container.querySelector("img,script")).toBeNull();
  expect(flipButton().textContent).toContain('<img src="x"');
  expect(flipButton().classList.contains("overflow-y-auto")).toBe(true);
  expect(flipButton().classList.contains("w-full")).toBe(true);
  expect(flipButton().className).toContain("bg-(--bg-secondary)");
  expect(flipButton().getAttribute("aria-describedby")).toBeTruthy();
});

it("keeps the study deck usable when its source note no longer exists", async () => {
  mocks.exists.mockResolvedValue(false);
  await renderStudy(); await click(button(`Source: ${current.path}`));
  expect(container.textContent).toContain("source note is unavailable");
  await click(flipButton()); expect(flipButton().textContent).toContain("Answer 1.");
  expect(props.onOpenNote).not.toHaveBeenCalled();
});

it("generates, persists, opens for study, and lists a real deck in Your Creations", async () => {
  await renderForge();
  expect(container.textContent).toContain("Your generated content will appear here.");
  await click(container.querySelector<HTMLButtonElement>('[aria-label="Flashcards"]')!);
  await type("Number of flashcards", "3"); await submit();
  expect(container.textContent).toContain("Created 3 flashcards from Memory.");
  expect(flipButton()).not.toBeNull();
  expect(container.textContent).toContain("Flashcards · 3 cards");
  await click(button("Back to Forge"));
  await click(button("Memory FlashcardsFlashcards · 3 cardsMemory.md"));
  expect(flipButton()).not.toBeNull();
  expect(mocks.ask).toHaveBeenCalledOnce();
});

it("reopens saved decks after Forge remount, offline, without another AI request", async () => {
  await saveFlashcardDeck(deck(), mocks.vault); await renderForge();
  const title = [...container.querySelectorAll<HTMLButtonElement>("button")].find(button => button.textContent?.startsWith("Memory FlashcardsFlashcards"))!;
  await click(title);
  act(() => root!.unmount()); root = createRoot(container);
  mocks.ask.mockRejectedValue(new Error("Offline"));
  await renderForge();
  const reopened = [...container.querySelectorAll<HTMLButtonElement>("button")].find(button => button.textContent?.startsWith("Memory FlashcardsFlashcards"))!;
  await click(reopened);
  expect(flipButton().textContent).toContain("Question 1?");
  expect(mocks.ask).not.toHaveBeenCalled();
});

it("opens overflow actions and requires confirmation before persistent deck deletion", async () => {
  await saveFlashcardDeck(deck(), mocks.vault); await renderForge();
  await click(container.querySelector<HTMLButtonElement>('[aria-label="Actions for Memory Flashcards"]')!);
  expect(container.querySelectorAll('[role="menuitem"]')).toHaveLength(2);
  await click(button("Delete"));
  expect(container.querySelector('[role="alertdialog"]')).not.toBeNull();
  await click(button("Cancel"));
  expect(container.textContent).toContain("Flashcards · 2 cards");
  await click(container.querySelector<HTMLButtonElement>('[aria-label="Actions for Memory Flashcards"]')!);
  await click(button("Delete")); await click(button("Delete deck"));
  expect(container.textContent).toContain("Your generated content will appear here.");
  act(() => root!.unmount()); root = createRoot(container); await renderForge();
  expect(container.textContent).not.toContain("Memory Flashcards");
});

it("keeps failed deletions visible and reports the failure", async () => {
  await saveFlashcardDeck(deck(), mocks.vault); await renderForge();
  mocks.write.mockRejectedValueOnce(new Error("Disk failure"));
  await click(container.querySelector<HTMLButtonElement>('[aria-label="Actions for Memory Flashcards"]')!);
  await click(button("Delete")); await click(button("Delete deck"));
  expect(container.textContent).toContain("remains saved");
  expect(container.textContent).toContain("Flashcards · 2 cards");
});

it("does not mix decks across vaults or crash on malformed storage", async () => {
  await saveFlashcardDeck(deck(), mocks.vault); await renderForge();
  expect(container.textContent).toContain("Flashcards · 2 cards");
  mocks.vault = "/different-vault";
  await renderForge({ vaultPath: mocks.vault });
  expect(container.textContent).not.toContain("Memory Flashcards");
  mocks.disk.set(`${mocks.vault}:forge-flashcards.json`, "{bad JSON");
  act(() => root!.unmount()); root = createRoot(container); await renderForge();
  expect(container.textContent).toContain("could not be loaded");
  expect(button("Retry")).not.toBeNull();
  expect(container.textContent).toContain("Your generated content will appear here.");
});

it("rejects an edited source while generation is pending", async () => {
  let resolve!: (value: string) => void;
  mocks.ask.mockImplementation(() => new Promise(done => { resolve = done; }));
  await renderForm({ readNoteContent: async () => passage }); await submit();
  await renderForm({ readNoteContent: async () => `${passage} Edited during generation.` });
  await act(async () => resolve(JSON.stringify({ cards: [{ front: "Question?", back: "Answer.", sourceExcerpt: passage }] })));
  expect(container.textContent).toContain("source note changed during generation");
  expect(container.querySelector('[data-electric-active="false"][data-electric-fade="false"]')).not.toBeNull();
  expect(props.onCreated).not.toHaveBeenCalled();
  expect(mocks.write).not.toHaveBeenCalled();
});

it("cancels on a vault change and never publishes the old source into the new vault", async () => {
  let resolve!: (value: string) => void;
  mocks.ask.mockImplementation(() => new Promise(done => { resolve = done; }));
  await renderForm(); await submit();
  const signal: AbortSignal = mocks.ask.mock.calls[0][4];
  mocks.vault = "/another-vault"; await renderForm({ vaultPath: mocks.vault });
  expect(signal.aborted).toBe(true);
  await act(async () => resolve(JSON.stringify({ cards: [{ front: "Question?", back: "Answer.", sourceExcerpt: passage }] })));
  expect(props.onCreated).not.toHaveBeenCalled();
  expect(mocks.write).not.toHaveBeenCalled();
});

it("never sends note content when the native vault changes during the source read", async () => {
  mocks.readNote.mockImplementationOnce(async () => { mocks.vault = "/changed-during-read"; return passage; });
  await renderForm(); await submit();
  expect(mocks.ask).not.toHaveBeenCalled();
  expect(mocks.write).not.toHaveBeenCalled();
  expect(container.textContent).toContain("selected note is unavailable");
});

it("reports generation failures without claiming success or adding creations", async () => {
  mocks.ask.mockRejectedValue(new TypeError("private provider failure"));
  await renderForge(); await click(container.querySelector<HTMLButtonElement>('[aria-label="Flashcards"]')!); await submit();
  expect(container.textContent).toContain("Check your connection");
  expect(container.textContent).not.toContain("private provider failure");
  expect(container.textContent).toContain("Your generated content will appear here.");
  expect(mocks.write).not.toHaveBeenCalled();
});

it("still opens Quizzes with its original question controls", async () => {
  await renderForge(); await click(container.querySelector<HTMLButtonElement>('[aria-label="Quizzes"]')!);
  expect(container.querySelector<HTMLInputElement>('[aria-label="Number of questions"]')!.value).toBe("8");
  expect(button("Generate Quiz")).not.toBeNull();
  expect(container.querySelector('[aria-label="Number of flashcards"]')).toBeNull();
});

it("shows saved flashcards and mind maps together and opens each tool independently", async () => {
  await saveFlashcardDeck(deck(), mocks.vault);
  mocks.disk.set(`${mocks.vault}:forge-mind-maps.json`, JSON.stringify([{
    id: "saved-map", createdAt: 1, sources: [{ path: current.path, name: current.name }],
    root: { id: "root", label: "Memory Concepts", children: [] },
  }]));
  await renderForge();
  expect(container.querySelectorAll("#forge-creations-title")).toHaveLength(1);
  expect(container.textContent).toContain("Flashcards · 2 cards");
  expect(container.textContent).toContain("Memory Concepts");
  expect(container.textContent).not.toContain("Your generated content will appear here.");
  await click([...container.querySelectorAll<HTMLButtonElement>("button")].find(item => item.textContent?.includes("Memory Concepts"))!);
  expect(container.querySelector('[aria-label="Interactive mind map"]')).not.toBeNull();
  await click(container.querySelector<HTMLButtonElement>('[aria-label="Close mind map"]')!);
  await click([...container.querySelectorAll<HTMLButtonElement>("button")].find(item => item.textContent?.includes("Memory Flashcards"))!);
  expect(container.textContent).toContain("Question 1?");
  expect(mocks.ask).not.toHaveBeenCalled();
});
