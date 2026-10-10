// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ForgeQuizForm } from "../src/components/panels/ForgeQuizForm";
import type { ForgeQuizContext } from "../src/components/panels/ForgeQuizForm";
import type { QuizGenerationRequest, QuizGenerationResult } from "../src/utils/quiz-generation";
import { QuizGenerationError } from "../src/utils/quiz-generation";
import { ForgeGenerationBoundary } from "../src/components/panels/ForgeGenerationBoundary";

const mocks = vi.hoisted(() => ({ generate: vi.fn(), exists: vi.fn(), read: vi.fn(), getVault: vi.fn() }));
vi.mock("../src/utils/quiz-generation", async importOriginal => {
  const actual = await importOriginal<typeof import("../src/utils/quiz-generation")>();
  return { ...actual, generateNoteQuiz: mocks.generate };
});
vi.mock("../src/utils/ai-core", () => ({ askAI: vi.fn(), AIProviderRequestError: class extends Error {} }));
vi.mock("../src/utils/ai-settings", () => ({ loadAIConfig: () => null, loadSettingsAsync: vi.fn(), getModelsForProvider: () => [] }));
vi.mock("../src/lib/auth", () => ({ authManager: { getUser: () => null } }));
vi.mock("../src/utils/disk-store", () => ({ readData: async () => null, writeData: vi.fn() }));
vi.mock("../src/utils/api", () => ({ getAPI: () => ({ fileExists: mocks.exists, readFile: mocks.read, getVaultPath: mocks.getVault }) }));

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root | null = null;
let container: HTMLDivElement;
const current = { name: "Current", path: "Current.md" };
const duplicateA = { name: "Operating Systems", path: "Advanced/Operating Systems.md" };
const duplicateB = { name: "Operating Systems", path: "Basics/Operating Systems.md" };
const notes = [current, duplicateA, duplicateB];
let props: ForgeQuizContext & { onBack: () => void };

function result(request: QuizGenerationRequest): QuizGenerationResult {
  return {
    note: request.note, comments: [{ id: "fixture-comment" }] as QuizGenerationResult["comments"],
    questionCount: request.count, requestedCount: request.count, truncated: false,
  };
}

beforeEach(() => {
  mocks.generate.mockReset().mockImplementation(async (request: QuizGenerationRequest) => result(request));
  mocks.exists.mockReset().mockResolvedValue(true);
  mocks.read.mockReset().mockResolvedValue("Persisted note content");
  mocks.getVault.mockReset().mockResolvedValue("/fixture-vault");
  props = { vaultPath: "/fixture-vault", activeNote: current, notes, onOpenNote: vi.fn(), onBack: vi.fn() };
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root?.unmount());
  root = null;
  document.body.replaceChildren();
});

async function render(patch: Partial<typeof props> = {}) {
  props = { ...props, ...patch };
  await act(async () => root!.render(React.createElement(ForgeGenerationBoundary, null, React.createElement(ForgeQuizForm, props))));
}
function input(label: string): HTMLInputElement { return container.querySelector(`[aria-label="${label}"]`)!; }
async function type(label: string, text: string) {
  await act(async () => {
    const target = input(label);
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(target, text);
    target.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
async function key(value: string) {
  await act(async () => input("Select source note").dispatchEvent(new KeyboardEvent("keydown", { key: value, bubbles: true })));
}
async function submit() {
  await act(async () => container.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
}

it("defaults to the current note and follows active-note switches before generation", async () => {
  await render();
  expect(container.textContent).toContain("Current.md");
  expect(input("Number of questions").value).toBe("8");
  await render({ activeNote: duplicateA });
  await submit();
  expect(mocks.generate.mock.calls[0][0]).toMatchObject({ note: duplicateA, count: 8 });
});

it("searches @ mentions with paths, supports keyboard selection, and pins the selected identity", async () => {
  await render();
  await type("Select source note", "@Operating Systems");
  expect(container.querySelectorAll('[role="option"]')).toHaveLength(2);
  expect(container.textContent).toContain(duplicateA.path);
  expect(container.textContent).toContain(duplicateB.path);
  await key("ArrowDown");
  await key("Enter");
  expect(input("Select source note").value).toBe(`@${duplicateB.path}`);
  await render({ activeNote: duplicateA });
  await submit();
  expect(mocks.generate.mock.calls[0][0].note).toEqual(duplicateB);
  expect(props.onOpenNote).not.toHaveBeenCalled();
  await act(async () => container.querySelector<HTMLButtonElement>("[type=button]:not([disabled])")?.focus());
});

it("dismisses suggestions with Escape, handles no matches, and never generates from an unselected mention", async () => {
  await render();
  await type("Select source note", "@Missing");
  expect(container.textContent).toContain("No matching notes");
  await key("Escape");
  expect(input("Select source note").getAttribute("aria-expanded")).toBe("false");
  await submit();
  expect(mocks.generate).not.toHaveBeenCalled();
  await act(async () => [...container.querySelectorAll<HTMLButtonElement>("button")].find(button => button.textContent === "Current Note")!.click());
  await submit();
  expect(mocks.generate).toHaveBeenCalledOnce();
});

it.each([1, 5, 13, 20])("passes a configurable total of %i questions", async count => {
  await render();
  await type("Number of questions", String(count));
  await submit();
  expect(mocks.generate.mock.calls[0][0].count).toBe(count);
});

it.each(["0", "21", "1.5", ""])("rejects invalid question count %s", async count => {
  await render();
  await type("Number of questions", count);
  await submit();
  expect(mocks.generate).not.toHaveBeenCalled();
});

it("prevents duplicate submissions and keeps the original source during a note switch", async () => {
  let finish!: (value: QuizGenerationResult) => void;
  mocks.generate.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  await render();
  await act(async () => {
    container.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    container.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
  expect(mocks.generate).toHaveBeenCalledOnce();
  expect(container.textContent).toContain("Generating…");
  expect(container.querySelector('[data-electric-active="true"]')).not.toBeNull();
  const beam = container.querySelector('[data-electric-active="true"]')!;
  expect(beam.querySelector("button[type=submit]")).not.toBeNull();
  expect(beam.querySelector("input")).toBeNull();
  expect(beam.querySelector("form")).toBeNull();
  await render({ activeNote: duplicateA });
  expect(container.textContent).toContain(current.path);
  const captured: QuizGenerationRequest = mocks.generate.mock.calls[0][0];
  expect(captured.note).toEqual(current);
  expect(captured.isSourceAvailable()).toBe(true);
  await act(async () => finish(result(captured)));
  expect(container.textContent).toContain("in Current.");
  expect(container.querySelector('[data-electric-active="false"][data-electric-fade="true"]')).not.toBeNull();
  await act(async () => [...container.querySelectorAll<HTMLButtonElement>("button")].find(button => button.textContent === "Open Note")!.click());
  expect(props.onOpenNote).toHaveBeenCalledWith(current.path);
});

it("uses the current unsaved buffer and also checks the persisted source revision", async () => {
  const readNoteContent = vi.fn(async () => "Latest unsaved content");
  mocks.generate.mockImplementation(async (request: QuizGenerationRequest) => {
    expect(await request.readNote(request.note.path)).toEqual({ content: "Latest unsaved content", revision: "Persisted note content" });
    return result(request);
  });
  await render({ readNoteContent });
  await submit();
  expect(readNoteContent).toHaveBeenCalledWith(current.path);
  expect(container.textContent).toContain("Quiz created");
});

it("reports an unavailable or renamed selected note and disables submission", async () => {
  await render();
  await type("Select source note", "@Advanced");
  await key("Enter");
  await render({ notes: [current, duplicateB] });
  expect(container.textContent).toContain("moved, renamed, or removed");
  await submit();
  expect(mocks.generate).not.toHaveBeenCalled();
});

it("handles no current note while allowing an explicit @ selection", async () => {
  await render({ activeNote: null });
  expect(container.textContent).toContain("No current Markdown note");
  await submit();
  expect(mocks.generate).not.toHaveBeenCalled();
  await type("Select source note", "@Basics");
  await key("Enter");
  await submit();
  expect(mocks.generate.mock.calls[0][0].note).toEqual(duplicateB);
});

it("shows controlled failures and clears them on a successful retry", async () => {
  mocks.generate.mockRejectedValueOnce(new QuizGenerationError("The source note changed. Please regenerate."));
  await render();
  await submit();
  expect(container.textContent).toContain("Please regenerate");
  expect(container.querySelector('[data-electric-active="false"][data-electric-fade="false"]')).not.toBeNull();
  await submit();
  expect(container.textContent).toContain("Quiz created");
  expect(container.textContent).not.toContain("Please regenerate");
});

it("stops electricity immediately on cancellation before the provider settles", async () => {
  let finish!: (value: QuizGenerationResult) => void;
  mocks.generate.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  await render();
  await submit();
  expect(container.querySelector('[data-electric-active="true"]')).not.toBeNull();
  const captured: QuizGenerationRequest = mocks.generate.mock.calls[0][0];
  await act(async () => [...container.querySelectorAll<HTMLButtonElement>("button")].find(button => button.textContent === "Cancel generation")!.click());
  expect(captured.signal.aborted).toBe(true);
  expect(container.querySelector('[data-electric-active="false"][data-electric-fade="false"]')).not.toBeNull();
  await act(async () => finish(result(captured)));
  expect(container.textContent).not.toContain("Quiz created");
  expect(container.querySelector('[data-electric-fade="true"]')).toBeNull();
});

it("cancels on unmount and on vault switches without applying a stale response", async () => {
  let finish!: (value: QuizGenerationResult) => void;
  mocks.generate.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  await render();
  await submit();
  const captured: QuizGenerationRequest = mocks.generate.mock.calls[0][0];
  await render({ vaultPath: "/other-vault" });
  expect(captured.signal.aborted).toBe(true);
  expect(container.querySelector('[data-electric-active="false"][data-electric-fade="false"]')).not.toBeNull();
  expect(captured.isSourceAvailable()).toBe(false);
  await act(async () => finish(result(captured)));
  expect(container.textContent).not.toContain("Quiz created");
  await submit();
  const next: QuizGenerationRequest = mocks.generate.mock.calls[1][0];
  act(() => root!.unmount());
  root = null;
  expect(next.signal.aborted).toBe(true);
  await act(async () => finish(result(next)));
});

it("accurately reports fewer questions and truncated coverage", async () => {
  mocks.generate.mockImplementation(async request => ({ ...result(request), questionCount: 3, truncated: true }));
  await render();
  await submit();
  expect(container.textContent).toContain("3 questions across 1 topic");
  expect(container.textContent).toContain("fewer than requested");
  expect(container.textContent).toContain("does not cover the complete note");
});
