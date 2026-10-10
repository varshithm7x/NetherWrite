import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { prioritizeForegroundGeneration, waitForForegroundGeneration } from "../src/utils/background-priority";
import { enqueueJob, getQueueLength, initializeVault, resetQueueState, startProcessing } from "../src/utils/background-queue";

const mocks = vi.hoisted(() => ({ embed: vi.fn(), annotation: vi.fn(), store: { entries: new Map() }, write: vi.fn() }));
vi.mock("../src/utils/embeddings", () => ({
  areEmbeddingsAvailable: () => true, EMBEDDING_SCHEMA_VERSION: 1,
  loadStoreAsync: async () => mocks.store, embedNote: mocks.embed,
  pruneMissingEmbeddings: vi.fn(), refreshEmbeddingMetadataIfUnchanged: () => false,
}));
vi.mock("../src/utils/ai-core", () => ({ getAnnotation: mocks.annotation }));
vi.mock("../src/utils/disk-store", () => ({ readData: async () => null, writeData: mocks.write }));
const releases: Array<() => void> = [];
function foreground() { const release = prioritizeForegroundGeneration(); releases.push(release); return release; }
beforeEach(() => { resetQueueState(); mocks.embed.mockReset().mockResolvedValue(true); mocks.annotation.mockReset().mockResolvedValue(null); mocks.write.mockReset().mockResolvedValue(undefined); mocks.store.entries.clear(); });
afterEach(() => { resetQueueState(); releases.splice(0).forEach(release => release()); vi.useRealTimers(); });

it("yields background analysis until foreground generation finishes, with idempotent release", async () => {
  const first = foreground(); const second = foreground();
  const resumed = vi.fn(); const waiting = waitForForegroundGeneration().then(resumed);
  await Promise.resolve(); expect(resumed).not.toHaveBeenCalled();
  first(); first(); await Promise.resolve(); expect(resumed).not.toHaveBeenCalled();
  second(); await waiting; expect(resumed).toHaveBeenCalledOnce();
});

it("holds queued note/annotation work and resumes without losing jobs", async () => {
  vi.useFakeTimers(); const release = foreground();
  enqueueJob({ id: "note", type: "embed", path: "Note.md", content: "Note body", priority: 0, enqueuedAt: 1 });
  enqueueJob({ id: "annotation", type: "annotate", path: "Other.md", content: "Other body", priority: 1, enqueuedAt: 1 });
  const processing = startProcessing(); await vi.advanceTimersByTimeAsync(1);
  expect(mocks.embed).not.toHaveBeenCalled(); expect(mocks.annotation).not.toHaveBeenCalled();
  release(); await vi.runAllTimersAsync(); await processing;
  expect(mocks.embed).toHaveBeenCalledOnce(); expect(mocks.annotation).toHaveBeenCalledOnce();
});

it("initializes a large vault in yielding batches without starting model work during generation", async () => {
  vi.useFakeTimers(); const release = foreground();
  const notes = Array.from({ length: 1500 }, (_, index) => ({ path: `Note-${index}.md`, modifiedAt: 1, size: 40 }));
  const loading = initializeVault(notes, "Note-700.md", [], { readFile: vi.fn(async () => "Note body") });
  await vi.runAllTimersAsync();
  expect(await loading).toEqual({ enqueued: 1500, alreadyIndexed: 0 });
  expect(getQueueLength()).toBe(1497); // First batch is held at the foreground gate.
  expect(mocks.embed).not.toHaveBeenCalled();
  resetQueueState(); release(); await vi.runAllTimersAsync();
  expect(mocks.embed).not.toHaveBeenCalled();
});

it("preserves active/recent note ordering when merging initialization jobs once", async () => {
  vi.useFakeTimers(); const release = foreground();
  const notes = ["Other.md", "Recent.md", "Active.md"].map(path => ({ path, size: 30, modifiedAt: 1 }));
  await initializeVault(notes, "Active.md", ["Recent.md"], { readFile: async () => "Note body" });
  await vi.advanceTimersByTimeAsync(1); release(); await vi.runAllTimersAsync();
  expect(mocks.embed.mock.calls.map(call => call[1])).toEqual(["Active.md", "Recent.md", "Other.md"]);
});
