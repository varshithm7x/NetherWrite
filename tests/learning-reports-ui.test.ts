// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { TextEncoder } from "node:util";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { ForgePanel } from "../src/components/panels/ForgePanel";
import { LearningReportView } from "../src/components/panels/LearningReportView";
import { saveLearningReport } from "../src/utils/reportsStore";
import { answerQuizQuestion, setCommentsVaultPath } from "../src/utils/commentsStore";
import type { ForgeSourceContext } from "../src/utils/forge-note-source";
import { reportFixture, reportQuiz, reportAdvice, REPORT_NOTE, REPORT_PASSAGE } from "./fixtures/learning-reports";

const mocks = vi.hoisted(() => ({ vault: "/report-fixture-vault", disk: new Map<string, string>(), ask: vi.fn(), write: vi.fn(), readNote: vi.fn(), external: vi.fn(), exists: vi.fn(),
  youtube: { status: vi.fn(), saveKey: vi.fn(), useSessionKey: vi.fn(), disconnect: vi.fn(), search: vi.fn(), cancel: vi.fn() } }));
vi.mock("../src/utils/ai-core", () => ({ askAI: mocks.ask, AIProviderRequestError: class extends Error {} }));
vi.mock("../src/utils/ai-settings", () => ({ loadSettingsAsync: async () => ({}), loadAIConfig: () => ({ provider: "openai", modelId: "fixture-model", apiKey: "test-only" }), getModelsForProvider: () => [{ id: "fixture-model" }] }));
vi.mock("../src/utils/api", () => ({ getAPI: () => ({
  getVaultPath: async () => mocks.vault, fileExists: mocks.exists, readFile: mocks.readNote, openExternal: mocks.external, youtube: mocks.youtube,
  dataRead: async (file: string) => mocks.disk.get(`${mocks.vault}:${file}`) ?? null, dataWrite: mocks.write,
}) }));
vi.mock("../src/utils/disk-store", () => ({
  readData: async (file: string) => JSON.parse(mocks.disk.get(`${mocks.vault}:${file}`) ?? "null"),
  writeData: async (file: string, value: unknown) => { mocks.disk.set(`${mocks.vault}:${file}`, JSON.stringify(value)); },
}));
vi.mock("../src/lib/auth", () => ({ authManager: { getUser: () => null } }));
Object.defineProperty(globalThis, "TextEncoder", { value: TextEncoder, configurable: true });
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const other = { name: "Operating Systems", path: "Other/OS.md" };
const notes = [REPORT_NOTE, other];
let root: Root;
let container: HTMLDivElement;
let context: ForgeSourceContext;
beforeEach(() => {
  mocks.vault = "/report-fixture-vault"; mocks.disk.clear(); localStorage.clear();
  setCommentsVaultPath(null); setCommentsVaultPath(mocks.vault);
  mocks.ask.mockReset().mockResolvedValue(JSON.stringify(reportAdvice()));
  mocks.readNote.mockReset().mockResolvedValue(REPORT_PASSAGE);
  mocks.external.mockReset().mockResolvedValue(undefined);
  mocks.youtube.status.mockReset().mockResolvedValue({ configured: false, secureStorage: true });
  mocks.youtube.saveKey.mockReset().mockImplementation(async () => {
    mocks.youtube.status.mockResolvedValue({ configured: true, secureStorage: true });
    return { configured: true, secureStorage: true };
  });
  mocks.youtube.useSessionKey.mockReset().mockImplementation(async () => {
    const status = { configured: true, secureStorage: false, sessionOnly: true };
    mocks.youtube.status.mockResolvedValue(status);
    return status;
  });
  mocks.youtube.disconnect.mockReset().mockImplementation(async () => {
    mocks.youtube.status.mockResolvedValue({ configured: false, secureStorage: true });
    return { configured: false, secureStorage: true };
  });
  mocks.youtube.search.mockReset().mockResolvedValue({ items: [] });
  mocks.youtube.cancel.mockReset().mockResolvedValue(undefined);
  mocks.exists.mockReset().mockImplementation(async (path: string) => path.startsWith(".netherwrite/") ? mocks.disk.has(`${mocks.vault}:${path.replace(/^\.netherwrite\//, "")}`) : true);
  mocks.write.mockReset().mockImplementation(async (file: string, data: string, options: { expectedVaultPath: string }) => {
    if (options.expectedVaultPath !== mocks.vault) throw new Error("Vault changed");
    mocks.disk.set(`${mocks.vault}:${file}`, data);
  });
  mocks.disk.set(`${mocks.vault}:comments.json`, JSON.stringify({ [REPORT_NOTE.path]: [reportQuiz(), reportQuiz("memory", "Memory", { q1: 0 })], [other.path]: [reportQuiz("other", "Other Topic", { q1: 0 }, other.path)] }));
  context = { vaultPath: mocks.vault, activeNote: REPORT_NOTE, notes, onOpenNote: vi.fn() };
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); document.body.replaceChildren(); });
async function renderForge(patch: Partial<ForgeSourceContext> = {}) {
  context = { ...context, ...patch };
  await act(async () => root.render(React.createElement(ForgePanel, context)));
}
function button(label: string) { return [...container.querySelectorAll<HTMLButtonElement>("button")].find(item => item.textContent?.trim() === label)!; }
async function click(item: HTMLElement) { await act(async () => item.click()); }
function input(value: string) {
  const field = container.querySelector<HTMLInputElement>('[aria-label="Select source note"]')!;
  act(() => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(field, value); field.dispatchEvent(new Event("input", { bubbles: true })); });
}
async function openReports() { await renderForge(); await click(container.querySelector<HTMLButtonElement>('[aria-label="Reports"]')!); }
async function generate() { await click(button("Generate Learning Report")); }
async function renderView(report = reportFixture()) {
  await act(async () => root.render(React.createElement(LearningReportView, { report, onBack: vi.fn(), onRegenerate: vi.fn(), onOpenNote: context.onOpenNote })));
}

it("opens Reports with the current note, persisted answer availability and preview counts", async () => {
  await openReports();
  expect(container.textContent).toContain(REPORT_NOTE.name); expect(container.textContent).toContain("2 answered questions across 2 topics");
  expect(container.textContent).toContain("50% accuracy · 1 correct · 1 incorrect · 2 unanswered");
  expect(button("Generate Learning Report").disabled).toBe(false); expect(mocks.ask).not.toHaveBeenCalled();
});
it("follows the active note until another source is explicitly selected", async () => {
  await openReports(); await renderForge({ activeNote: other });
  expect(container.textContent).toContain("1 answered questions across 1 topics");
  input("@Operating"); const field = container.querySelector<HTMLInputElement>('[aria-label="Select source note"]')!;
  await act(async () => field.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })));
  expect(container.textContent).toContain("2 answered questions across 2 topics");
  await renderForge({ activeNote: other }); expect(container.textContent).toContain("2 answered questions across 2 topics");
});
it("uses paths to distinguish duplicate filenames and supports Escape, arrows and Enter", async () => {
  await openReports(); input("@Operating");
  const options = [...container.querySelectorAll('[role="option"]')]; expect(options.map(item => item.textContent)).toEqual(expect.arrayContaining([expect.stringContaining(REPORT_NOTE.path), expect.stringContaining(other.path)]));
  const field = container.querySelector<HTMLInputElement>('[aria-label="Select source note"]')!;
  act(() => field.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
  expect(container.querySelector('[role="listbox"]')).toBeNull();
  input("@O"); input("@Operating");
  act(() => field.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true })));
  await act(async () => field.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })));
  expect(field.value).toBe(`@${other.path}`); expect(container.textContent).toContain("1 answered questions across 1 topics");
  expect(context.onOpenNote).not.toHaveBeenCalled(); expect(mocks.write).not.toHaveBeenCalled();
});
it("shows no-results state and disables generation without fabricating answers", async () => {
  mocks.disk.set(`${mocks.vault}:comments.json`, "{}");
  await openReports(); expect(button("Generate Learning Report").disabled).toBe(true);
  expect(container.textContent).toContain("No quiz results yet"); expect(container.textContent).toContain("Answer some quiz questions");
  await click(button("Open Quizzes")); expect(button("Generate Quiz")).toBeTruthy(); expect(mocks.ask).not.toHaveBeenCalled();
});
it("disables generation without a note or when the selected file is unavailable", async () => {
  await renderForge({ activeNote: null }); await click(container.querySelector<HTMLButtonElement>('[aria-label="Reports"]')!);
  expect(button("Generate Learning Report").disabled).toBe(true);
  mocks.exists.mockResolvedValue(false); await renderForge({ activeNote: REPORT_NOTE });
  expect(container.textContent).toContain("unavailable"); expect(button("Generate Learning Report").disabled).toBe(true);
});
it("updates available counts when an existing quiz answer is persisted", async () => {
  await openReports(); await act(async () => { await answerQuizQuestion(REPORT_NOTE.path, "deadlocks", "q2", 0); });
  expect(container.textContent).toContain("3 answered questions across 2 topics");
});
it("generates only the explicitly selected other note without opening or writing the current note", async () => {
  await openReports(); input("@Other/");
  await act(async () => container.querySelector<HTMLInputElement>('[aria-label="Select source note"]')!.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })));
  await generate();
  const saved = JSON.parse(mocks.disk.get(`${mocks.vault}:forge-reports.json`)!);
  expect(saved.reports[0].sourceNotePath).toBe(other.path);
  expect(saved.reports[0].performance).toMatchObject({ total: 2, correct: 1, answered: 1, accuracy: 100 });
  expect(saved.reports[0].performance.topics.map((topic: { topic: string }) => topic.topic)).toEqual(["Other Topic"]);
  expect(context.onOpenNote).not.toHaveBeenCalled();
  expect(mocks.write.mock.calls.every(call => call[0] === "forge-reports.json")).toBe(true);
});
it("generates, saves, opens and reopens a snapshot without another provider call", async () => {
  await openReports(); await generate();
  expect(container.querySelector('[aria-label="Learning Report"]')).not.toBeNull();
  expect(container.querySelector('[aria-label="Performance overview"]')?.textContent).toContain("50%");
  expect(container.querySelector('[aria-label="Topic Breakdown"]')?.textContent).toContain("Limited evidence");
  expect(container.querySelector('[aria-label="Question Results"]')?.textContent).toContain("Incorrect · Deadlocks");
  expect(container.querySelector('[aria-label="Recommended Videos"]')?.textContent).toContain("Video recommendations were not requested");
  await click(button("Creation tools")); expect(container.textContent).toContain("Learning Report · 50% accuracy");
  await click([...container.querySelectorAll<HTMLButtonElement>("button")].find(item => item.textContent?.includes("Learning Report · 50% accuracy"))!);
  expect(container.querySelector('[aria-label="Learning Report"]')).not.toBeNull(); expect(mocks.ask).toHaveBeenCalledTimes(1);
  act(() => root.unmount()); root = createRoot(container); await renderForge();
  await click([...container.querySelectorAll<HTMLButtonElement>("button")].find(item => item.textContent?.includes("Learning Report · 50% accuracy"))!);
  expect(mocks.ask).toHaveBeenCalledTimes(1);
});
it("renders deterministic focus and study plans when AI fails", async () => {
  mocks.ask.mockRejectedValue(new TypeError("private error")); await openReports(); await generate();
  expect(container.querySelector('[aria-label="Learning Report"]')).not.toBeNull();
  expect(container.textContent).toContain("50%"); expect(container.textContent).toContain("Review the saved incorrect questions");
  expect(container.textContent).not.toContain("private error"); expect(container.querySelector('[aria-label="Suggested Study Plan"]')?.textContent).toContain("Deadlocks");
});
it("prevents duplicate submissions and keeps the generation source visible while changing editor notes", async () => {
  let resolve!: (value: string) => void; mocks.ask.mockImplementation(() => new Promise(done => { resolve = done; }));
  await openReports(); await generate();
  const form = container.querySelector("form")!;
  await act(async () => { form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); });
  expect(mocks.ask).toHaveBeenCalledTimes(1); expect(container.querySelector<HTMLInputElement>('[aria-label="Select source note"]')!.disabled).toBe(true);
  await renderForge({ activeNote: other }); expect(container.textContent).toContain(REPORT_NOTE.path);
  await act(async () => resolve(JSON.stringify(reportAdvice())));
  expect(container.querySelector('[aria-label="Learning Report"]')?.textContent).toContain(REPORT_NOTE.name);
});
it("cancels pending generation on unmount without saving or publishing a late response", async () => {
  let resolve!: (value: string) => void; mocks.ask.mockImplementation(() => new Promise(done => { resolve = done; }));
  await openReports(); await generate(); const signal = mocks.ask.mock.calls[0][4] as AbortSignal;
  act(() => root.unmount()); root = createRoot(container); expect(signal.aborted).toBe(true);
  await act(async () => resolve(JSON.stringify(reportAdvice()))); expect(mocks.write).not.toHaveBeenCalled();
});
it("blocks stale quiz answers and does not claim persistence success", async () => {
  let resolve!: (value: string) => void; mocks.ask.mockImplementation(() => new Promise(done => { resolve = done; }));
  await openReports(); await generate(); await act(async () => { await answerQuizQuestion(REPORT_NOTE.path, "deadlocks", "q2", 0); });
  await act(async () => resolve(JSON.stringify(reportAdvice())));
  expect(container.textContent).toContain("quiz answers changed during generation"); expect(mocks.write).not.toHaveBeenCalled();
});
it("shows save failures and leaves the original quizzes available", async () => {
  mocks.write.mockRejectedValue(new Error("Disk full")); await openReports(); await generate();
  expect(container.textContent).toContain("could not be saved"); expect(container.querySelector('[aria-label="Learning Report"]')).toBeNull();
  expect(container.textContent).toContain("2 answered questions");
});
it("regenerates a new snapshot and keeps the earlier report unchanged", async () => {
  await openReports(); await generate();
  await act(async () => { await answerQuizQuestion(REPORT_NOTE.path, "deadlocks", "q2", 0); });
  expect(container.querySelector('[aria-label="Performance overview"]')?.textContent).toContain("50%");
  await click(button("Regenerate Report")); expect(container.textContent).toContain("3 answered questions"); await generate();
  expect(container.querySelector('[aria-label="Performance overview"]')?.textContent).toContain("67%");
  const saved = JSON.parse(mocks.disk.get(`${mocks.vault}:forge-reports.json`)!); expect(saved.reports).toHaveLength(2);
  expect(saved.reports.map((report: { performance: { accuracy: number } }) => report.performance.accuracy)).toEqual([50, 67]);
});
it("requires delete confirmation, supports Cancel and removes only the report", async () => {
  await saveLearningReport(reportFixture(), mocks.vault); await renderForge();
  const comments = mocks.disk.get(`${mocks.vault}:comments.json`);
  await click(container.querySelector<HTMLButtonElement>(`[aria-label="Actions for ${reportFixture().title}"]`)!); await click(button("Delete"));
  expect(container.querySelector('[role="alertdialog"]')).not.toBeNull(); await click(button("Cancel")); expect(container.textContent).toContain("Learning Report · 50% accuracy");
  await click(container.querySelector<HTMLButtonElement>(`[aria-label="Actions for ${reportFixture().title}"]`)!); await click(button("Delete")); await click(button("Delete report"));
  expect(container.textContent).not.toContain("Learning Report · 50% accuracy"); expect(mocks.disk.get(`${mocks.vault}:comments.json`)).toBe(comments);
  act(() => root.unmount()); root = createRoot(container); await renderForge(); expect(container.textContent).not.toContain("Learning Report · 50% accuracy");
});
it("keeps reports visible if deleting fails", async () => {
  await saveLearningReport(reportFixture(), mocks.vault); await renderForge(); mocks.write.mockRejectedValue(new Error("Disk error"));
  await click(container.querySelector<HTMLButtonElement>(`[aria-label="Actions for ${reportFixture().title}"]`)!); await click(button("Delete")); await click(button("Delete report"));
  expect(container.textContent).toContain("remains saved"); expect(container.textContent).toContain("Learning Report · 50% accuracy");
});
it("keeps saved reports readable without a source note and handles Open Source Note", async () => {
  mocks.exists.mockResolvedValue(false); await renderView(); await click(button("Open Source Note"));
  expect(container.textContent).toContain("source note is unavailable"); expect(container.textContent).toContain("50%"); expect(context.onOpenNote).not.toHaveBeenCalled();
});
it("isolates report libraries and stops generation when vault changes", async () => {
  await saveLearningReport(reportFixture(), mocks.vault); await openReports();
  let resolve!: (value: string) => void; mocks.ask.mockImplementation(() => new Promise(done => { resolve = done; })); await generate();
  const signal = mocks.ask.mock.calls[0][4] as AbortSignal;
  mocks.vault = "/another-vault"; act(() => setCommentsVaultPath(mocks.vault)); await renderForge({ vaultPath: mocks.vault });
  expect(signal.aborted).toBe(true); expect(container.textContent).not.toContain("Learning Report · 50% accuracy");
  await act(async () => resolve(JSON.stringify(reportAdvice()))); expect(mocks.disk.has(`${mocks.vault}:forge-reports.json`)).toBe(false);
});
it("safely displays verified video cards, lazy thumbnails, fallback and external opening", async () => {
  const report = reportFixture(); report.videoStatus = "ready";
  report.videos = [{ id: "abcdefghijk", title: "Fixture video title", url: "https://www.youtube.com/watch?v=abcdefghijk", topic: "Deadlocks", channel: "Fixture channel", thumbnail: "https://i.ytimg.com/vi/abcdefghijk/hqdefault.jpg" }];
  await renderView(report);
  const img = container.querySelector("img")!; expect(img.getAttribute("loading")).toBe("lazy"); expect(img.className).toContain("aspect-video");
  expect(container.textContent).toContain("Recommended for: Deadlocks");
  const video = [...container.querySelectorAll<HTMLButtonElement>("button")].find(item => item.textContent?.includes("Fixture video title"))!;
  await click(video); expect(mocks.external).toHaveBeenCalledWith(report.videos[0].url);
  act(() => img.dispatchEvent(new Event("error"))); expect(container.querySelector("img")).toBeNull(); expect(container.textContent).toContain("Thumbnail unavailable");
  expect(container.querySelector("iframe")).toBeNull();
});
it("renders all provider text as plain text and does not expose answers to unanswered questions", async () => {
  const report = reportFixture(); report.advice!.assessment = '<img src="x" onerror="alert(1)">';
  await renderView(report); expect(container.querySelector("img")).toBeNull(); expect(container.textContent).toContain('<img src="x"');
  const unanswered = [...container.querySelectorAll('[aria-label="Question Results"] details')].filter(item => item.textContent?.startsWith("Unanswered"));
  expect(unanswered).toHaveLength(2); expect(unanswered.every(item => !item.textContent?.includes("Correct answer:"))).toBe(true);
});
it.each(["light", "dark"])("uses theme tokens and wrapping at narrow width in %s without changing editor layout", async theme => {
  container.style.width = "200px"; container.setAttribute("data-theme", theme); await renderView();
  expect(container.querySelector("article")?.classList.contains("min-w-0")).toBe(true);
  expect(container.querySelector("article")?.classList.contains("break-words")).toBe(true);
  expect(container.querySelector('button')?.className).toContain("focus-visible:outline");
  expect(container.style.width).toBe("200px"); // DOM structure only; manual visual QA remains required.
});
it("saves a personal YouTube key, clears the input, and searches only after explicit opt-in", async () => {
  await openReports();
  const key = container.querySelector<HTMLInputElement>('[aria-label="YouTube Data API key"]')!;
  expect(key.type).toBe("password");
  act(() => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(key, "test-only-personal-key-123456789"); key.dispatchEvent(new Event("input", { bubbles: true })); });
  await click(button("Save YouTube Key"));
  expect(key.value).toBe(""); expect(mocks.youtube.saveKey).toHaveBeenCalledWith("test-only-personal-key-123456789");
  expect(mocks.youtube.search).not.toHaveBeenCalled();
  const include = container.querySelector<HTMLInputElement>('[aria-label="Include YouTube recommendations"]')!;
  expect(include.disabled).toBe(false); expect(include.checked).toBe(false);
  expect(container.querySelector('[aria-label="YouTube setup"]')?.textContent).toContain("Deadlocks tutorial");
  mocks.youtube.search.mockResolvedValue({ items: [{ id: { kind: "youtube#video", videoId: "abcdefghijk" }, snippet: { title: "Fixture tutorial", channelTitle: "Fixture channel", thumbnails: { high: { url: "https://i.ytimg.com/vi/abcdefghijk/hqdefault.jpg" } } } }] });
  await click(include); await generate();
  expect(mocks.youtube.search).toHaveBeenCalledWith("Deadlocks tutorial", expect.any(String), true);
  expect(container.querySelector('[aria-label="Recommended Videos"]')?.textContent).toContain("Fixture tutorial");
  const saved = mocks.disk.get(`${mocks.vault}:forge-reports.json`)!;
  expect(saved).not.toContain("test-only-personal-key");
  expect(JSON.parse(saved).reports[0].videos).toHaveLength(1);
  await click(button("Creation tools"));
  await click([...container.querySelectorAll<HTMLButtonElement>("button")].find(item => item.textContent?.includes("Learning Report · 50% accuracy"))!);
  expect(mocks.youtube.search).toHaveBeenCalledTimes(1);
});
it("does not search when video consent is off, even with a saved key", async () => {
  mocks.youtube.status.mockResolvedValue({ configured: true, secureStorage: true }); await openReports(); await generate();
  expect(mocks.youtube.search).not.toHaveBeenCalled(); expect(container.textContent).toContain("Video recommendations were not requested");
});
it("keeps performance reports usable and shows controlled YouTube failure messages", async () => {
  mocks.youtube.status.mockResolvedValue({ configured: true, secureStorage: true }); await openReports();
  await click(container.querySelector<HTMLInputElement>('[aria-label="Include YouTube recommendations"]')!);
  mocks.youtube.search.mockRejectedValue(new Error("YouTube rejected the request. Check API access, key restrictions and quota in Google Cloud."));
  await generate(); expect(container.textContent).toContain("50%"); expect(container.textContent).toContain("Check API access, key restrictions and quota");
});
it("removes a saved key and disables discovery without removing reports", async () => {
  mocks.youtube.status.mockResolvedValue({ configured: true, secureStorage: true }); await openReports();
  await click(container.querySelector<HTMLInputElement>('[aria-label="Include YouTube recommendations"]')!);
  await click(button("Remove YouTube Key"));
  expect(mocks.youtube.disconnect).toHaveBeenCalledTimes(1);
  expect(container.querySelector<HTMLInputElement>('[aria-label="Include YouTube recommendations"]')!.checked).toBe(false);
  expect(container.querySelector<HTMLInputElement>('[aria-label="Include YouTube recommendations"]')!.disabled).toBe(false);
  expect(container.textContent).toContain("Save your YouTube Data API key above");
  expect(mocks.write).not.toHaveBeenCalled();
});
it.each([false, true])("lets the user select recommendations but prevents search without secure saved credentials (configured=%s)", async configured => {
  mocks.youtube.status.mockResolvedValue({ configured, secureStorage: configured ? false : true });
  await openReports();
  const checkbox = container.querySelector<HTMLInputElement>('[aria-label="Include YouTube recommendations"]')!;
  expect(checkbox.disabled).toBe(false); await click(checkbox); expect(checkbox.checked).toBe(true);
  await generate();
  expect(mocks.youtube.search).not.toHaveBeenCalled();
  expect(container.querySelector('[aria-label="Learning Report"]')).not.toBeNull();
  expect(container.textContent).toContain("Save your Data API key first");
});
it("refuses insecure key storage and cancels native discovery on unmount", async () => {
  mocks.youtube.status.mockResolvedValue({ configured: false, secureStorage: false }); await openReports();
  expect(container.querySelector<HTMLInputElement>('[aria-label="YouTube Data API key"]')!.disabled).toBe(false);
  expect(button("Save YouTube Key").disabled).toBe(true);
  expect(container.textContent).toContain("Secure system credential storage is unavailable");
  act(() => root.unmount()); root = createRoot(container);
  mocks.youtube.status.mockResolvedValue({ configured: true, secureStorage: true }); await openReports();
  await click(container.querySelector<HTMLInputElement>('[aria-label="Include YouTube recommendations"]')!);
  mocks.youtube.search.mockImplementation(() => new Promise(() => {})); await generate();
  const id = mocks.youtube.search.mock.calls[0][1];
  act(() => root.unmount()); root = createRoot(container);
  expect(mocks.youtube.cancel).toHaveBeenCalledWith(id);
});
it("allows memory-only YouTube discovery when the user explicitly activates a session key", async () => {
  mocks.youtube.status.mockResolvedValue({ configured: false, secureStorage: false }); await openReports();
  const input = container.querySelector<HTMLInputElement>('[aria-label="YouTube Data API key"]')!;
  act(() => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, "test-only-personal-key-123456789"); input.dispatchEvent(new Event("input", { bubbles: true })); });
  await click(button("Use for this session"));
  await click(container.querySelector<HTMLInputElement>('[aria-label="Include YouTube recommendations"]')!); await generate();
  expect(mocks.youtube.search).toHaveBeenCalledWith("Deadlocks tutorial", expect.any(String), true);
  expect(mocks.youtube.saveKey).not.toHaveBeenCalled();
  expect(mocks.disk.get(`${mocks.vault}:forge-reports.json`)).not.toContain("test-only-personal-key");
});
