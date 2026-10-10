// @vitest-environment jsdom
import { TextEncoder } from "node:util";
import { beforeEach, expect, it, vi } from "vitest";
import { generateNoteQuiz, parseGeneratedQuiz, prepareQuizPassages, prepareQuizSource, resolveQuizExcerpt, searchQuizNotes } from "../src/utils/quiz-generation";
import { addComment, addQuizComment, getCommentsSync, loadComments, setCommentsVaultPath } from "../src/utils/commentsStore";
import { AIProviderRequestError } from "../src/utils/ai-core";

const mocks = vi.hoisted(() => ({
  disk: new Map<string, string>(), ask: vi.fn(), config: vi.fn(), loadSettings: vi.fn(), dataWrite: vi.fn(), dataRead: vi.fn(),
}));
vi.mock("../src/utils/ai-core", () => ({
  askAI: mocks.ask,
  AIProviderRequestError: class extends Error { constructor(message: string, public status: number, public kind = "other") { super(message); } },
}));
vi.mock("../src/utils/ai-settings", () => ({
  loadAIConfig: mocks.config, loadSettingsAsync: mocks.loadSettings,
  getModelsForProvider: () => [{ id: "fixture-model", label: "Fixture" }],
}));
vi.mock("../src/lib/auth", () => ({ authManager: { getUser: () => null } }));
vi.mock("../src/utils/disk-store", () => ({
  readData: async (key: string) => mocks.disk.has(key) ? JSON.parse(mocks.disk.get(key)!) : null,
  writeData: async (key: string, value: unknown) => { mocks.disk.set(key, JSON.stringify(value)); },
}));
vi.mock("../src/utils/api", () => ({ getAPI: () => ({ dataRead: mocks.dataRead, dataWrite: mocks.dataWrite }) }));
Object.defineProperty(globalThis, "TextEncoder", { value: TextEncoder, configurable: true });

const vaultPath = "/isolated-fixture";
const note = { name: "Operating Systems", path: "Notes/Operating Systems.md" };
const firstPassage = "A **deadlock** occurs when processes cannot proceed because each waits for a resource held by another process. Mutual exclusion restricts a resource to one holder at a time.";
const secondPassage = "A scheduler chooses a runnable process for CPU time. Round robin gives each process a time slice before returning it to the runnable queue if it still needs CPU time.";
const source = `---\ntitle: Operating Systems\n---\n# Operating Systems\n\n${firstPassage}\n\n${secondPassage}\n`;
function question(number: number) {
  return { question: `Which statement explains condition ${number} in this passage?`, options: ["One resource has one holder", "Resources always have unlimited holders", "No process uses resources", "All resources are removed"], correctIndex: 0, explanation: "The passage explains that mutual exclusion restricts a resource to one holder at a time." };
}
function output(count = 3) {
  return { topics: [
    { topic: "Deadlocks", sourceExcerpt: firstPassage, questions: Array.from({ length: Math.max(1, count - 1) }, (_, index) => question(index + 1)) },
    ...(count > 1 ? [{ topic: "Scheduling", sourceExcerpt: secondPassage, questions: [question(count)] }] : []),
  ] };
}
function request(count = 3) {
  return { vaultPath, note, count, signal: new AbortController().signal, readNote: vi.fn(async () => ({ content: source, revision: source })), isSourceAvailable: vi.fn(() => true) };
}

beforeEach(() => {
  mocks.disk.clear();
  localStorage.clear();
  setCommentsVaultPath(null);
  setCommentsVaultPath(vaultPath);
  mocks.ask.mockReset().mockResolvedValue(JSON.stringify(output()));
  mocks.config.mockReset().mockReturnValue({ apiKey: "test-only-key", modelId: "fixture-model", provider: "openai" });
  mocks.loadSettings.mockReset().mockResolvedValue({});
  mocks.dataRead.mockReset().mockImplementation(async (key: string) => mocks.disk.get(key) ?? null);
  mocks.dataWrite.mockReset().mockImplementation(async (key: string, value: string) => { mocks.disk.set(key, value); });
});

it.each([1, 3, 7, 20])("accepts %i requested questions with variable topic distribution", count => {
  const topics = parseGeneratedQuiz(JSON.stringify(output(count)), count);
  expect(topics.reduce((sum, topic) => sum + topic.quiz.questions.length, 0)).toBe(count);
  expect(topics).toHaveLength(count === 1 ? 1 : 2);
  expect(topics[0].quiz.answers).toEqual({});
});

it("generates a complete topic set through the real comments store without altering existing comments", async () => {
  const ordinary = await addComment(note.path, { from: 0, to: 1, selectedText: "-", content: "Existing regular comment" });
  const oldQuiz = await addQuizComment(note.path, { from: source.indexOf(firstPassage), to: source.indexOf(firstPassage) + firstPassage.length, selectedText: firstPassage }, parseGeneratedQuiz(JSON.stringify(output(1)), 1)[0].quiz);
  const job = request();
  const result = await generateNoteQuiz(job);
  expect(result.questionCount).toBe(3);
  expect(result.comments).toHaveLength(2);
  expect(result.comments.map(comment => comment.quiz.questions.length)).toEqual([2, 1]);
  for (const comment of result.comments) {
    expect(comment.notePath).toBe(note.path);
    expect(source.slice(comment.from, comment.to)).toBe(comment.selectedText);
    expect(comment.quiz.answers).toEqual({});
  }
  expect((await loadComments(note.path)).slice(0, 2)).toEqual([ordinary, oldQuiz]);
  expect(mocks.dataWrite).toHaveBeenCalledOnce();
  expect(mocks.dataWrite.mock.calls[0][2]).toEqual({ atomic: true, expectedVaultPath: vaultPath });
  const prompt = JSON.parse(mocks.ask.mock.calls[0][1]);
  expect(prompt.requestedTotal).toBe(3);
  expect(prompt.sourcePassages.map((passage: { text: string }) => passage.text).join("\n")).not.toContain("title: Operating Systems");
  expect(job.readNote.mock.calls.every(([path]) => path === note.path)).toBe(true);
});

it("preserves concurrent regular comments while publishing a generated set", async () => {
  const job = request();
  const generation = generateNoteQuiz(job);
  const ordinary = await addComment(note.path, { from: 0, to: 1, selectedText: "-", content: "Concurrent regular comment" });
  await generation;
  expect((await loadComments(note.path)).find(comment => comment.id === ordinary.id)?.content).toBe("Concurrent regular comment");
  expect(await loadComments(note.path)).toHaveLength(3);
});

it("supports another note while keeping the source identity and existing current-note comments", async () => {
  await addComment("Current.md", { from: 0, to: 1, selectedText: "A", content: "Untouched" });
  const result = await generateNoteQuiz(request());
  expect(result.comments.every(comment => comment.notePath === note.path)).toBe(true);
  expect((await loadComments("Current.md"))[0].content).toBe("Untouched");
});

it.each([
  "not JSON", JSON.stringify({ topics: [] }),
  JSON.stringify({ topics: [{ ...output().topics[0], from: 123 }] }),
  JSON.stringify({ topics: [{ ...output().topics[0], questions: [] }] }),
  JSON.stringify({ topics: [{ ...output().topics[0], questions: [{ ...question(1), correctIndex: 4 }] }] }),
  JSON.stringify({ topics: [{ ...output().topics[0], questions: [{ ...question(1), correctIndex: 0.5 }] }] }),
  JSON.stringify({ topics: [{ ...output().topics[0], questions: [{ ...question(1), options: ["A", "B", "C"] }] }] }),
  JSON.stringify({ topics: [{ ...output().topics[0], questions: [{ ...question(1), explanation: "" }] }] }),
  JSON.stringify({ topics: [{ ...output().topics[0], questions: [question(1), question(1)] }] }),
  JSON.stringify({ topics: [{ ...output().topics[0], questions: [{ ...question(1), options: ["A", "A", "C", "D"] }] }] }),
  JSON.stringify(output(4)),
])("rejects invalid output before writing any new comments: %s", async raw => {
  mocks.ask.mockResolvedValue(raw);
  await expect(generateNoteQuiz(request())).rejects.toThrow();
  expect(mocks.dataWrite).not.toHaveBeenCalled();
  expect(getCommentsSync(note.path)).toEqual([]);
});

it("rejects oversized text and duplicate questions across topics", () => {
  const data = output();
  data.topics[1].questions[0] = question(1);
  expect(() => parseGeneratedQuiz(JSON.stringify(data), 3)).toThrow(/duplicate/);
  data.topics[1].questions[0] = { ...question(3), explanation: "x".repeat(1201) };
  expect(() => parseGeneratedQuiz(JSON.stringify(data), 3)).toThrow(/invalid/);
});

it("resolves formatted Markdown exactly and refuses missing or ambiguous passages", () => {
  const anchor = resolveQuizExcerpt(source, firstPassage);
  expect(source.slice(anchor.from, anchor.to)).toBe(firstPassage);
  expect(() => resolveQuizExcerpt(`${source}\n${firstPassage}`, firstPassage)).toThrow(/more than once/);
  expect(() => resolveQuizExcerpt(source, firstPassage.replace("**", ""))).toThrow(/could not be found/);
});

it("does not partially create topics when the final topic has an unresolved excerpt", async () => {
  const data = output();
  data.topics[1].sourceExcerpt = "A completely missing supporting passage.";
  mocks.ask.mockResolvedValue(JSON.stringify(data));
  await expect(generateNoteQuiz(request())).rejects.toThrow(/could not be found/);
  expect(mocks.dataWrite).not.toHaveBeenCalled();
});

it.each(["content", "revision"] as const)("rejects stale source %s and preserves all existing comments", async field => {
  const job = request();
  job.readNote.mockResolvedValueOnce({ content: source, revision: source }).mockResolvedValue({ content: source, revision: source, [field]: `${source}\nChanged` });
  await expect(generateNoteQuiz(job)).rejects.toThrow(/changed during generation/);
  expect(mocks.dataWrite).not.toHaveBeenCalled();
});

it("allows autosaving the same source buffer captured at generation time", async () => {
  const job = request();
  job.readNote.mockResolvedValueOnce({ content: source, revision: "Older saved content" }).mockResolvedValue({ content: source, revision: source });
  expect((await generateNoteQuiz(job)).comments).toHaveLength(2);
});

it("uses CodeMirror-compatible coordinates for notes with CRLF line endings", async () => {
  const job = request();
  job.readNote.mockResolvedValue({ content: source.replace(/\n/g, "\r\n"), revision: source.replace(/\n/g, "\r\n") });
  const result = await generateNoteQuiz(job);
  expect(result.comments[0].from).toBe(source.indexOf(firstPassage));
  expect(JSON.parse(mocks.ask.mock.calls[0][1]).sourcePassages.map((passage: { text: string }) => passage.text).join("\n")).not.toContain("\r");
});

it("rejects deleted notes, moved sources, and cancellations without writing", async () => {
  const job = request();
  mocks.ask.mockImplementation(async () => { job.isSourceAvailable.mockReturnValue(false); return JSON.stringify(output()); });
  await expect(generateNoteQuiz(job)).rejects.toThrow(/source note or vault changed/);
  expect(mocks.dataWrite).not.toHaveBeenCalled();
  const cancelled = new AbortController();
  cancelled.abort();
  await expect(generateNoteQuiz({ ...request(), signal: cancelled.signal })).rejects.toThrow(/cancelled/);
});

it("reports missing configuration and insufficient content without requesting the provider", async () => {
  mocks.config.mockReturnValue(null);
  await expect(generateNoteQuiz(request())).rejects.toThrow(/Configure an AI provider/);
  mocks.config.mockReturnValue({ modelId: "fixture-model", provider: "openai" });
  const job = request();
  job.readNote.mockResolvedValue({ content: "Hello", revision: "Hello" });
  await expect(generateNoteQuiz(job)).rejects.toThrow(/too short/);
  expect(mocks.ask).not.toHaveBeenCalled();
});

it.each([401, 429, 503])("handles provider HTTP %i without exposing raw messages or keys", async status => {
  mocks.ask.mockRejectedValue(new AIProviderRequestError("private-provider-stack test-only-key", status));
  await expect(generateNoteQuiz(request())).rejects.not.toThrow(/private-provider-stack|test-only-key/);
  expect(mocks.dataWrite).not.toHaveBeenCalled();
});

it("distinguishes OpenAI billing quota from temporary rate limits and explains API-key billing", async () => {
  mocks.ask.mockRejectedValue(new AIProviderRequestError("private-billing-error", 429, "quota"));
  await expect(generateNoteQuiz(request())).rejects.toThrow(/ChatGPT Plus does not include API-key usage/);
  expect(mocks.dataWrite).not.toHaveBeenCalled();
});

it("handles network errors without exposing raw diagnostics", async () => {
  mocks.ask.mockRejectedValue(new TypeError("internal-network-stack"));
  await expect(generateNoteQuiz(request())).rejects.toThrow(/connection/);
});

it("does not publish or cache a partial set after a persistence failure", async () => {
  const original = await addComment(note.path, { from: 0, to: 1, selectedText: "-", content: "Keep me" });
  const savedDisk = mocks.disk.get("comments.json");
  mocks.dataWrite.mockRejectedValueOnce(new Error("Disk full with private file path"));
  await expect(generateNoteQuiz(request())).rejects.toThrow(/Could not save/);
  expect(mocks.disk.get("comments.json")).toBe(savedDisk);
  expect(getCommentsSync(note.path)).toEqual([original]);
});

it("refuses to overwrite malformed existing storage", async () => {
  mocks.disk.set("comments.json", "{not valid JSON");
  await expect(generateNoteQuiz(request())).rejects.toThrow(/Could not save/);
  expect(mocks.dataWrite).not.toHaveBeenCalled();
  expect(mocks.disk.get("comments.json")).toBe("{not valid JSON");
});

it("accepts fewer grounded questions and reports bounded partial-note coverage", async () => {
  const job = request(8);
  job.readNote.mockResolvedValue({ content: source.repeat(50), revision: source.repeat(50) });
  // Unique excerpts are required, so test coverage with a unique prefix followed by long filler.
  const large = source + " Additional supporting context.".repeat(1000);
  job.readNote.mockResolvedValue({ content: large, revision: large });
  const result = await generateNoteQuiz(job);
  expect(result.truncated).toBe(true);
  expect(result.questionCount).toBe(3);
  expect(result.requestedCount).toBe(8);
  expect(JSON.parse(mocks.ask.mock.calls[0][1]).partialNote).toBe(true);
  const custom = prepareQuizSource(large, 8, "custom-model", "openai");
  const known = prepareQuizSource(large, 8, "fixture-model", "openai");
  expect(custom.content.length).toBeLessThan(known.content.length);
});

it("searches titles and paths and distinguishes duplicate filenames", () => {
  const notes = [{ name: "OS", path: "Beginner/OS.md" }, { name: "OS", path: "Advanced/OS.md" }, { name: "Board", path: "Board.canvas" }];
  expect(searchQuizNotes(notes, "@OS").map(note => note.path)).toEqual(["Advanced/OS.md", "Beginner/OS.md"]);
  expect(searchQuizNotes(notes, "@Beginner")).toEqual([notes[0]]);
});

it("anchors quizzes by app-owned passage IDs without requiring the AI to copy Markdown", async () => {
  mocks.ask.mockImplementation(async (_system: string, user: string) => {
    const prompt = JSON.parse(user);
    return JSON.stringify({ topics: [
      { topic: "Deadlocks", sourcePassageId: prompt.sourcePassages.find((passage: { text: string }) => passage.text.includes(firstPassage)).id, questions: [question(1), question(2)] },
      { topic: "Scheduling", sourcePassageId: prompt.sourcePassages.find((passage: { text: string }) => passage.text.includes(secondPassage)).id, questions: [question(3)] },
    ] });
  });
  const job = request();
  job.readNote.mockResolvedValue({ content: source.replace(/\n/g, "\r\n"), revision: source.replace(/\n/g, "\r\n") });
  const result = await generateNoteQuiz(job);
  expect(result.comments.map(comment => comment.selectedText)).toEqual([firstPassage, secondPassage]);
  for (const comment of result.comments) expect(source.slice(comment.from, comment.to)).toBe(comment.selectedText);
  expect(mocks.ask.mock.calls[0][0]).toContain("Do not copy, rewrite, or return source excerpts");
  expect(mocks.dataWrite).toHaveBeenCalledOnce();
});

it("distinguishes repeated passages by their actual positions in the note", async () => {
  const repeated = `${source}\n${firstPassage}\n`;
  const job = request(1);
  job.readNote.mockResolvedValue({ content: repeated, revision: repeated });
  mocks.ask.mockImplementation(async (_system: string, user: string) => {
    const passages = JSON.parse(user).sourcePassages;
    return JSON.stringify({ topics: [{ topic: "Deadlocks", sourcePassageId: passages[passages.length - 1].id, questions: [question(1)] }] });
  });
  const result = await generateNoteQuiz(job);
  expect(result.comments[0].from).toBe(repeated.lastIndexOf(firstPassage));
  expect(result.comments[0].selectedText).toBe(firstPassage);
});

it("rejects unknown passage IDs before saving any topics", async () => {
  mocks.ask.mockResolvedValue(JSON.stringify({ topics: [
    { topic: "Deadlocks", sourcePassageId: "passage-1", questions: [question(1)] },
    { topic: "Scheduling", sourcePassageId: "passage-invented", questions: [question(2)] },
  ] }));
  await expect(generateNoteQuiz(request())).rejects.toThrow(/unknown supporting passage/);
  expect(mocks.dataWrite).not.toHaveBeenCalled();
});

it("preserves source offsets when splitting long passages and skips surrogate-pair boundaries", () => {
  const content = "a".repeat(3999) + "😀" + "b".repeat(3000);
  const passages = prepareQuizPassages(content, 45);
  expect(passages.map(passage => passage.text).join("")).toBe(content);
  expect(passages[0].text.length).toBe(3999);
  for (const passage of passages) {
    expect(passage.text.length).toBeLessThanOrEqual(4000);
    expect(content.slice(passage.from - 45, passage.to - 45)).toBe(passage.text);
  }
});

it("keeps short bullet passages and the final characters of a split paragraph", () => {
  const bullets = "- RAM is volatile\n\n- ROM is nonvolatile\n";
  expect(prepareQuizPassages(bullets).map(passage => passage.text)).toEqual(["- RAM is volatile", "- ROM is nonvolatile"]);
  const long = "a".repeat(4000) + "END";
  expect(prepareQuizPassages(long).map(passage => passage.text).join("")).toBe(long);
});
