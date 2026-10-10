// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AIPage } from "../src/components/ai/AIPage";
import type { FileEntry } from "../src/types";

const mocks = vi.hoisted(() => ({
  readFile: vi.fn(), openExternal: vi.fn().mockResolvedValue(undefined), answerLocal: vi.fn(), answerWeb: vi.fn(),
  settings: { apiKey: "fixture", provider: "openrouter", modelId: "test-model", customBaseUrl: "" },
}));
vi.mock("../src/utils/api", () => ({ getAPI: () => ({ readFile: mocks.readFile, openExternal: mocks.openExternal }) }));
vi.mock("../src/utils/ai-settings", () => ({
  loadSettings: () => mocks.settings, loadSettingsAsync: async () => mocks.settings,
  getModelsForProvider: () => [], AI_SETTINGS_CHANGED_EVENT: "test:settings",
}));
vi.mock("../src/utils/embeddings", () => ({
  loadStore: () => ({ entries: new Map() }), loadStoreAsync: async () => ({ entries: new Map() }),
  searchByQuery: async () => [], isModelLoaded: () => false, isLexicalFallbackActive: () => false,
  setProgressCallback: vi.fn(), getLoadProgress: () => 0, findSimilar: () => [],
  applyHistoryWeighting: (value: unknown) => value, recordSuggestion: vi.fn(), EMBEDDING_UPDATED_EVENT: "test:embeddings",
}));
vi.mock("../src/utils/synthesis", () => ({}));
vi.mock("../src/utils/suggestion-enrichment", () => ({}));
vi.mock("../src/utils/vault-rag", async original => ({
  ...await original<typeof import("../src/utils/vault-rag")>(), answerVaultQuestion: mocks.answerLocal,
}));
vi.mock("../src/utils/ai-web-search", () => ({ answerWebQuestion: mocks.answerWeb }));
vi.mock("../src/utils/ai-core", () => ({ askAI: vi.fn() }));

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root;
let container: HTMLDivElement;
const note = { name: "Lecture.content.md", path: "Uploads/Lecture.content.md", extension: ".md", isDirectory: false } as FileEntry;
beforeEach(() => {
  vi.clearAllMocks();
  mocks.readFile.mockResolvedValue("## Binary search\n\nBinary search halves the interval.");
  mocks.answerLocal.mockResolvedValue({ answer: "Binary search halves the interval. [1]", citations: [] });
  mocks.answerWeb.mockResolvedValue({ answer: "More about binary search.", sources: [{ url: "https://example.org/lesson", title: "Binary search lesson" }] });
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); document.body.replaceChildren(); });

async function render(theme: "light" | "dark" = "dark", notes = [note]) {
  await act(async () => root.render(React.createElement(AIPage, { vaultPath: "/vault", theme, fileTree: notes, activeNotePath: null, onOpenNote: vi.fn() })));
  const input = container.querySelector("textarea")!;
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(input, "Explain binary search");
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
async function submit() {
  await act(async () => container.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
}
function toggle() { act(() => container.querySelector<HTMLButtonElement>('[role="switch"][aria-label="Web search"]')!.click()); }

it.each(["light", "dark"] as const)("defaults to local uploaded content and makes no web request in %s theme", async theme => {
  await render(theme); await submit();
  expect(container.querySelector('[role="switch"]')?.getAttribute("aria-checked")).toBe("false");
  expect(mocks.answerWeb).not.toHaveBeenCalled();
  expect(mocks.answerLocal.mock.calls[0][1][0]).toMatchObject({ path: note.path, excerpt: "Binary search halves the interval." });
});

it("adds web information and real resource links, and turning off clears web results", async () => {
  await render(); toggle(); await submit();
  expect(mocks.answerWeb).toHaveBeenCalledWith("Explain binary search", expect.any(AbortSignal));
  expect(mocks.answerLocal).toHaveBeenCalledOnce();
  expect(container.querySelector('[aria-label="Web resources"] a')?.getAttribute("href")).toBe("https://example.org/lesson");
  await act(async () => container.querySelector<HTMLAnchorElement>('[aria-label="Web resources"] a')!.click());
  expect(mocks.openExternal).toHaveBeenCalledWith("https://example.org/lesson");
  toggle();
  expect(container.querySelector('[aria-label="Web information and resources"]')).toBeNull();
  await submit();
  expect(mocks.answerWeb).toHaveBeenCalledOnce();
});

it("searches the web even when there is no matching local passage", async () => {
  await render("dark", []); toggle(); await submit();
  expect(mocks.answerLocal).not.toHaveBeenCalled();
  expect(mocks.answerWeb).toHaveBeenCalledOnce();
  expect(container.textContent).toContain("More about binary search.");
});

it("preserves the local answer and reports a web failure", async () => {
  mocks.answerWeb.mockRejectedValue(new Error("Search unavailable"));
  await render(); toggle(); await submit();
  expect(container.textContent).toContain("Binary search halves the interval.");
  expect(container.querySelector('[role="alert"]')?.textContent).toBe("Search unavailable");
  expect(container.querySelector<HTMLButtonElement>('[type="submit"]')?.disabled).toBe(false);
});

it("can still return web resources when local answer generation fails", async () => {
  mocks.answerLocal.mockRejectedValue(new Error("Local answer unavailable"));
  await render(); toggle(); await submit();
  expect(container.textContent).toContain("Local answer unavailable");
  expect(container.textContent).toContain("More about binary search.");
});

it("aborts pending web search when the panel unmounts", async () => {
  mocks.answerWeb.mockImplementation((_question, signal: AbortSignal) => new Promise((_resolve, reject) => signal.addEventListener("abort", () => reject(new Error("Cancelled")), { once: true })));
  await render(); toggle(); await submit();
  await act(async () => root.unmount());
  expect(mocks.answerWeb.mock.calls[0][1].aborted).toBe(true);
});

it("locks the toggle while searching and cancels the active web request", async () => {
  mocks.answerWeb.mockImplementation((_question, signal: AbortSignal) => new Promise((_resolve, reject) => signal.addEventListener("abort", () => reject(new Error("Cancelled")), { once: true })));
  await render(); toggle(); await submit();
  expect(container.querySelector<HTMLButtonElement>('[role="switch"]')?.disabled).toBe(true);
  await act(async () => [...container.querySelectorAll("button")].find(button => button.textContent === "Cancel")!.click());
  expect(mocks.answerWeb.mock.calls[0][1].aborted).toBe(true);
  expect(container.querySelector('[role="alert"]')).toBeNull();
  expect(container.querySelector<HTMLButtonElement>('[type="submit"]')?.disabled).toBe(false);
});
