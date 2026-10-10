// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { EditorState, Transaction } from "@codemirror/state";
import { CommentCard } from "../src/components/editor/CommentComponents";
import { commentExtension, commentStateField, setCommentsEffect } from "../src/components/editor/commentExtension";
import { applyCommentHighlightsToHtml } from "../src/components/editor/MarkdownPreview";
import { deserializeComments, parseQuizData } from "../src/utils/quiz-comments";
import { mergeQuizCommentAnchors, normalizeCommentAnchors } from "../src/utils/comment-anchors";
import type { NoteComment, QuizData } from "../src/types/comments";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";

const disk = vi.hoisted(() => new Map<string, string>());
vi.mock("../src/utils/disk-store", () => ({
  readData: vi.fn(async (key: string) => disk.has(key) ? JSON.parse(disk.get(key)!) : null),
  writeData: vi.fn(async (key: string, value: unknown) => { disk.set(key, JSON.stringify(value)); }),
}));
vi.mock("../src/lib/auth", () => ({ authManager: { getUser: () => null } }));

let store: typeof import("../src/utils/commentsStore");
let root: Root | null = null;
let unsubscribe: (() => void) | undefined;
const notePath = "fixture/Quiz.md";
const anchor = { from: 8, to: 16, selectedText: "deadlock" };
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function quizData(count = 2): QuizData {
  return {
    topic: "Deadlocks",
    questions: Array.from({ length: count }, (_, index) => ({
      id: `question-${index}`,
      question: `Question ${index + 1}: Which condition is necessary?`,
      options: ["Mutual exclusion", "Unlimited memory", "Single task", "No resources"],
      correctIndex: 0,
      explanation: `Explanation ${index + 1}: Resources can be held exclusively.`,
    })),
    answers: {},
  };
}

it("creates QA fixtures with the vault-relative note identity used by the editor", async () => {
  const vault = execFileSync(process.execPath, ["tests/fixtures/create-quiz-qa-vault.mjs"], { encoding: "utf8" }).trim();
  const serialized = await readFile(path.join(vault, ".netherwrite", "comments.json"), "utf8");
  const data = JSON.parse(serialized);
  expect(Object.keys(data)).toEqual(["Quiz QA.md"]);
  disk.set("comments.json", serialized);
  const comments = await store.loadComments("Quiz QA.md");
  expect(comments).toHaveLength(4);
  const markdown = await readFile(path.join(vault, "Quiz QA.md"), "utf8");
  for (const comment of comments) {
    expect(comment.notePath).toBe("Quiz QA.md");
    expect(markdown.slice(comment.from, comment.to)).toBe(comment.selectedText);
  }
  expect(comments.filter(comment => comment.type === "quiz").map(comment => comment.quiz?.questions.length)).toEqual([1, 5, 2]);
});

beforeEach(async () => {
  disk.clear();
  localStorage.clear();
  vi.resetModules();
  store = await import("../src/utils/commentsStore");
});

afterEach(() => {
  unsubscribe?.();
  unsubscribe = undefined;
  act(() => root?.unmount());
  root = null;
  document.body.replaceChildren();
});

it.each([1, 2, 5, 7])("serializes %i questions as one topic comment and reloads answers from disk", async count => {
  const comment = await store.addQuizComment(notePath, anchor, quizData(count));
  await store.answerQuizQuestion(notePath, comment.id, "question-0", 2);
  const serialized = JSON.parse(disk.get("comments.json")!)[notePath];
  expect(serialized).toHaveLength(1);
  expect(serialized[0]).toMatchObject({ type: "quiz", notePath, ...anchor, quiz: { topic: "Deadlocks", answers: { "question-0": 2 } } });
  expect(serialized[0].quiz.questions).toHaveLength(count);
  // Simulate a fresh renderer process, with no memory or localStorage cache.
  vi.resetModules();
  localStorage.clear();
  const reloadedStore = await import("../src/utils/commentsStore");
  const reloaded = await reloadedStore.loadComments(notePath);
  expect(reloaded).toEqual(serialized);
  expect(reloaded[0].quiz?.answers["question-0"]).toBe(2);
});

it("locks the first answer even when multiple selections arrive concurrently", async () => {
  const comment = await store.addQuizComment(notePath, anchor, quizData());
  await Promise.all([
    store.answerQuizQuestion(notePath, comment.id, "question-0", 3),
    store.answerQuizQuestion(notePath, comment.id, "question-0", 0),
    store.answerQuizQuestion(notePath, comment.id, "question-1", 1),
  ]);
  expect((await store.loadComments(notePath))[0].quiz?.answers).toEqual({ "question-0": 3, "question-1": 1 });
});

it("does not change regular comment serialization or convert regular comments", async () => {
  const regular = await store.addComment(notePath, { ...anchor, content: "Ordinary comment" });
  const quiz = await store.addQuizComment(notePath, anchor, quizData());
  await store.answerQuizQuestion(notePath, quiz.id, "question-0", 0);
  await store.addReply(notePath, quiz.id, "Discuss this topic");
  expect(JSON.parse(disk.get("comments.json")!)[notePath][0]).toEqual(JSON.parse(JSON.stringify(regular)));
  expect(regular).not.toHaveProperty("type");
  expect(regular).not.toHaveProperty("quiz");
  expect(await store.answerQuizQuestion(notePath, regular.id, "question-0", 0)).toBeNull();
  await store.deleteComment(notePath, quiz.id);
  expect(await store.loadComments(notePath)).toEqual([regular]);
});

it("isolates notes, rejects unknown questions and invalid answers, and supports localStorage reload", async () => {
  const comment = await store.addQuizComment(notePath, anchor, quizData());
  expect(await store.answerQuizQuestion("other.md", comment.id, "question-0", 0)).toBeNull();
  expect(await store.answerQuizQuestion(notePath, comment.id, "unknown", 0)).toBeNull();
  await expect(store.answerQuizQuestion(notePath, comment.id, "question-0", 4)).rejects.toThrow("Invalid quiz answer");
  await store.answerQuizQuestion(notePath, comment.id, "question-0", 1);
  const saved = await store.loadComments(notePath);
  disk.clear();
  vi.resetModules();
  const reloaded = await import("../src/utils/commentsStore");
  expect(reloaded.getCommentsSync(notePath)).toEqual(saved);
});

it("reloads same-named notes on vault switches without reusing another vault's comments or answers", async () => {
  store.setCommentsVaultPath("/tmp/qa-vault-one");
  const first = await store.addQuizComment(notePath, anchor, quizData(1));
  await store.answerQuizQuestion(notePath, first.id, "question-0", 0);
  const firstDisk = disk.get("comments.json")!;
  const onVaultChange = vi.fn();
  const stop = store.subscribeToComments(vi.fn(), onVaultChange);
  disk.clear();
  store.setCommentsVaultPath("/tmp/qa-vault-two");
  expect(onVaultChange).toHaveBeenCalledOnce();
  expect(store.getCommentsSync(notePath)).toEqual([]);
  expect(await store.loadComments(notePath)).toEqual([]);
  const second = await store.addQuizComment(notePath, anchor, quizData(5));
  expect(second.quiz.answers).toEqual({});
  expect((await store.loadComments(notePath))[0].quiz?.questions).toHaveLength(5);
  disk.set("comments.json", firstDisk);
  store.setCommentsVaultPath("/tmp/qa-vault-one");
  expect((await store.loadComments(notePath))[0]).toMatchObject({ id: first.id, quiz: { answers: { "question-0": 0 } } });
  stop();
});

it("rejects a pending comment load after a vault switch so stale results cannot replace the new note's comments", async () => {
  const { readData } = await import("../src/utils/disk-store");
  let finishRead!: (value: unknown) => void;
  vi.mocked(readData).mockImplementationOnce(() => new Promise(resolve => { finishRead = resolve; }));
  store.setCommentsVaultPath("/tmp/old-qa-vault");
  const stale = store.loadComments(notePath);
  const rejected = expect(stale).rejects.toThrow("Comments vault changed during loading");
  store.setCommentsVaultPath("/tmp/new-qa-vault");
  const current = await store.addQuizComment(notePath, anchor, quizData(2));
  finishRead({ [notePath]: [] });
  await rejected;
  expect(await store.loadComments(notePath)).toEqual([current]);
});

it.each([
  { questions: [] },
  { questions: [{ ...quizData(1).questions[0], options: ["A", "B", "C"] }] },
  { questions: [{ ...quizData(1).questions[0], options: ["A", "B", "C", " "] }] },
  { questions: [{ ...quizData(1).questions[0], correctIndex: 1.5 }] },
  { questions: [{ ...quizData(1).questions[0], correctIndex: -1 }] },
  { questions: [{ ...quizData(1).questions[0], correctIndex: 4 }] },
  { questions: [quizData(1).questions[0], quizData(1).questions[0]] },
  { answers: { "question-0": 5 } },
  { answers: { "question-0": "0" } },
  { answers: { unknown: 0 } },
  { answers: [] },
  { topic: " " },
])("rejects malformed data without changing existing comments: %j", async patch => {
  const regular = await store.addComment(notePath, { ...anchor, content: "Keep me" });
  const originalDisk = disk.get("comments.json");
  await expect(store.addQuizComment(notePath, anchor, { ...quizData(), ...patch })).rejects.toThrow("Invalid quiz comment");
  expect(disk.get("comments.json")).toBe(originalDisk);
  expect(await store.loadComments(notePath)).toEqual([regular]);
});

it("skips malformed quiz records on load and rejects malformed direct saves atomically", async () => {
  const regular = await store.addComment(notePath, { ...anchor, content: "Keep me" });
  const invalid = { ...regular, id: "broken", type: "quiz", quiz: { topic: "Broken", questions: [] } };
  const serializedRegular = JSON.parse(JSON.stringify(regular));
  expect(deserializeComments([serializedRegular, invalid, null], notePath)).toEqual([serializedRegular]);
  await expect(store.saveComments(notePath, [regular, invalid as NoteComment])).rejects.toThrow("Invalid quiz comment");
  expect(await store.loadComments(notePath)).toEqual([regular]);
  disk.set("comments.json", JSON.stringify({ [notePath]: [serializedRegular, invalid] }));
  vi.resetModules();
  const reloaded = await import("../src/utils/commentsStore");
  expect(await reloaded.loadComments(notePath)).toEqual([serializedRegular]);
});

it("normalizes missing and malformed explanations without revealing or executing HTML", () => {
  const data = quizData(1);
  expect(parseQuizData({ ...data, questions: [{ ...data.questions[0], explanation: null }] })?.questions[0].explanation).toBe("");
  expect(parseQuizData({ ...data, questions: [{ ...data.questions[0], explanation: undefined }] })?.questions[0].explanation).toBe("");
});

async function mountQuiz(count = 2, data = quizData(count)) {
  const comment = await store.addQuizComment(notePath, anchor, data);
  const container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  const onSelect = vi.fn();
  const render = (current: NoteComment) => root!.render(React.createElement(CommentCard, {
    comment: current,
    onSelect,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onAnswerQuiz: async (id, index) => { await store.answerQuizQuestion(notePath, comment.id, id, index); },
  }));
  unsubscribe = store.subscribeToComments((path, comments) => {
    if (path === notePath) render(comments.find(c => c.id === comment.id)!);
  });
  await act(async () => render(comment));
  return { container, comment, onSelect };
}

function options(container: HTMLElement) {
  return [...container.querySelectorAll<HTMLButtonElement>('[aria-pressed]')];
}

async function click(button: HTMLButtonElement) {
  await act(async () => { button.click(); });
}

it.each([0, 2])("gives correct/incorrect feedback for selection %i, locks, and keeps answers across navigation", async selected => {
  const { container, comment, onSelect } = await mountQuiz();
  expect(container.textContent).not.toContain("Explanation 1");
  expect(container.querySelector('[title="Edit comment"]')).toBeNull();
  expect(options(container)).toHaveLength(4);
  expect(options(container)[0].parentElement?.classList.contains("grid-cols-2")).toBe(true);
  await click(options(container)[selected]);
  expect(container.textContent).toContain(selected === 0 ? "Correct!" : "Not quite");
  expect(container.textContent).toContain("Explanation 1");
  expect(options(container)[0].textContent).toContain("Correct answer");
  if (selected !== 0) expect(options(container)[selected].textContent).toContain("Incorrect answer");
  expect(options(container).every(button => button.getAttribute("aria-disabled") === "true")).toBe(true);
  await click(options(container)[1]);
  expect((await store.loadComments(notePath))[0].quiz?.answers["question-0"]).toBe(selected);
  await click(container.querySelector('[aria-label="Next question"]')!);
  expect(container.textContent).toContain("2 / 2");
  expect(container.textContent).not.toContain("Explanation 1");
  await click(options(container)[1]);
  await click(container.querySelector('[aria-label="Previous question"]')!);
  expect(options(container)[selected].getAttribute("aria-pressed")).toBe("true");
  expect(container.textContent).toContain("Explanation 1");
  expect(onSelect).not.toHaveBeenCalled();
  expect((await store.loadComments(notePath))[0].id).toBe(comment.id);
});

it.each([1, 5])("disables navigation at boundaries for %i questions", async count => {
  const { container } = await mountQuiz(count);
  const previous = container.querySelector<HTMLButtonElement>('[aria-label="Previous question"]')!;
  const next = container.querySelector<HTMLButtonElement>('[aria-label="Next question"]')!;
  expect(previous.disabled).toBe(true);
  for (let page = 1; page < count; page++) await click(next);
  expect(next.disabled).toBe(true);
  expect(container.textContent).toContain(`${count} / ${count}`);
  await click(next);
  expect(container.textContent).toContain(`${count} / ${count}`);
  act(() => options(container)[0].focus());
  expect(document.activeElement).toBe(options(container)[0]);
});

it("renders quiz text safely and restores answered feedback after card unmount", async () => {
  const data = quizData(1);
  data.questions[0].question = '<img src=x onerror="alert(1)">';
  data.questions[0].explanation = "<script>unsafe()</script>";
  const { container, comment } = await mountQuiz(1, data);
  expect(container.querySelector("img, script")).toBeNull();
  await click(options(container)[0]);
  unsubscribe?.();
  act(() => root!.unmount());
  root = createRoot(container);
  const reloaded = (await store.loadComments(notePath)).find(c => c.id === comment.id)!;
  act(() => root!.render(React.createElement(CommentCard, { comment: reloaded })));
  expect(container.textContent).toContain("Correct!");
  expect(container.textContent).toContain("<script>unsafe()</script>");
  expect(container.querySelector("img, script")).toBeNull();
});

it("renders a safe unavailable state for a malformed quiz payload", async () => {
  const quiz = await store.addQuizComment(notePath, anchor, quizData());
  const container = document.createElement("div");
  root = createRoot(container);
  act(() => root!.render(React.createElement(CommentCard, { comment: { ...quiz, quiz: undefined } })));
  expect(container.textContent).toContain("This quiz could not be loaded.");
  expect(options(container)).toHaveLength(0);
});

it("uses precise existing anchors and maps edits without changing quiz data or Markdown", async () => {
  const comment = await store.addQuizComment(notePath, { from: 12, to: 20, selectedText: "deadlock" }, quizData());
  const doc = "deadlock -- deadlock!";
  const state = EditorState.create({ doc, extensions: [commentExtension()] });
  const anchored = state.update({ effects: setCommentsEffect.of([comment]) }).state;
  expect(anchored.doc.toString()).toBe(doc);
  expect(anchored.field(commentStateField).comments[0].from).toBe(12);
  const edited = anchored.update({ changes: { from: 0, insert: "Prefix " } }).state;
  expect(edited.field(commentStateField).comments[0]).toMatchObject({ from: 19, to: 27, quiz: comment.quiz });
  await store.answerQuizQuestion(notePath, comment.id, "question-0", 0);
  await store.updateQuizCommentAnchors(notePath, edited.field(commentStateField).comments);
  const saved = (await store.loadComments(notePath))[0];
  expect(saved).toMatchObject({ from: 19, to: 27, quiz: { answers: { "question-0": 0 } } });
  expect(normalizeCommentAnchors([saved], edited.doc.toString())[0].from).toBe(19);
  const removed = edited.update({ changes: { from: 19, to: 27, insert: "" } }).state;
  expect(removed.field(commentStateField).decorations.size).toBe(0);
  expect(removed.field(commentStateField).comments[0].quiz).toEqual(comment.quiz);
  await store.updateQuizCommentAnchors(notePath, removed.field(commentStateField).comments);
  vi.resetModules();
  localStorage.clear();
  const reloadedStore = await import("../src/utils/commentsStore");
  const reloaded = normalizeCommentAnchors(await reloadedStore.loadComments(notePath), removed.doc.toString());
  expect(reloaded[0]).toMatchObject({ from: 19, to: 19, selectedText: "", quiz: { answers: { "question-0": 0 } } });
  const refreshed = removed.update({ effects: setCommentsEffect.of(reloaded) }).state;
  expect(refreshed.field(commentStateField).decorations.size).toBe(0);
});

it("preserves quiz anchors when comments arrive before their note content loads", async () => {
  const comment = await store.addQuizComment(notePath, anchor, quizData());
  const empty = EditorState.create({ doc: "", extensions: [commentExtension()] });
  const pending = empty.update({ effects: setCommentsEffect.of([comment]) }).state;
  expect(pending.field(commentStateField).comments[0]).toEqual(comment);
  expect(pending.field(commentStateField).decorations.size).toBe(0);
  const loaded = pending.update({ changes: { from: 0, insert: "Heading deadlock is a topic." } }).state;
  expect(loaded.field(commentStateField).comments[0]).toEqual(comment);
  expect(loaded.field(commentStateField).decorations.size).toBe(1);
});

it("preserves anchors across programmatic full-document synchronization and subsequent real edits", async () => {
  const comment = await store.addQuizComment(notePath, anchor, quizData());
  const source = "Heading deadlock is a topic.";
  const state = EditorState.create({ doc: source, extensions: [commentExtension()] });
  const anchored = state.update({ effects: setCommentsEffect.of([comment]) }).state;
  const replaced = anchored.update({
    changes: { from: 0, to: source.length, insert: source },
    annotations: Transaction.userEvent.of("setContent"),
  }).state;
  expect(replaced.field(commentStateField).comments[0]).toEqual(comment);
  expect(replaced.field(commentStateField).decorations.size).toBe(1);
  const edited = replaced.update({ changes: { from: 0, insert: "Prefix " } }).state;
  await store.updateQuizCommentAnchors(notePath, edited.field(commentStateField).comments);
  expect((await store.loadComments(notePath))[0]).toMatchObject({ from: 15, to: 23, selectedText: "deadlock" });
});

it("does not relocate a quiz when its saved passage no longer matches", async () => {
  const comment = await store.addQuizComment(notePath, { from: 12, to: 20, selectedText: "deadlock" }, quizData());
  const normalized = normalizeCommentAnchors([comment], "deadlock -- other text");
  expect(normalized[0]).toMatchObject({ from: 12, to: 12 });
  expect(normalized[0].quiz).toEqual(comment.quiz);
});

it("merges live anchors with saved answers without applying stale coordinates or crossing notes", async () => {
  const comment = await store.addQuizComment(notePath, anchor, quizData());
  const regular = await store.addComment(notePath, { ...anchor, content: "Regular" });
  await store.answerQuizQuestion(notePath, comment.id, "question-0", 0);
  const saved = await store.loadComments(notePath);
  const live = { ...comment, from: 15, to: 23 };
  const merged = mergeQuizCommentAnchors(saved, [live, { ...regular, from: 100, to: 108 }]);
  expect(merged[0]).toMatchObject({ from: 15, to: 23, quiz: { answers: { "question-0": 0 } } });
  expect(merged[1]).toBe(regular);
  expect(mergeQuizCommentAnchors(saved, [{ ...live, notePath: "other.md" }])[0]).toBe(saved[0]);
});

it("highlights only the anchored occurrence in reading mode and skips a removed passage", async () => {
  const source = "deadlock -- deadlock";
  const comment = await store.addQuizComment(notePath, { from: 12, to: 20, selectedText: "deadlock" }, quizData());
  const highlighted = applyCommentHighlightsToHtml(`<p>${source}</p>`, source, [comment]);
  expect(highlighted).toContain("<p>deadlock -- <mark");
  expect(highlighted.match(/data-comment-id=/g)).toHaveLength(1);
  const edited = "deadlock -- other text -- deadlock";
  const unavailable = normalizeCommentAnchors([comment], edited);
  expect(applyCommentHighlightsToHtml(`<p>${edited}</p>`, edited, unavailable)).toBe(`<p>${edited}</p>`);
});

it("renders saved quiz replies through the existing comment thread", async () => {
  const { container, comment } = await mountQuiz();
  await act(async () => { await store.addReply(notePath, comment.id, "Discuss this question"); });
  expect(container.textContent).toContain("Discuss this question");
  expect(options(container)).toHaveLength(4);
});

it("answers through the real compact comment layer without selecting the note and fits its container", async () => {
  const { EditorCommentsLayer } = await import("../src/components/editor/EditorCommentsLayer");
  const comment = await store.addQuizComment(notePath, anchor, quizData());
  const container = document.createElement("div");
  const scrollEl = document.createElement("div");
  container.append(scrollEl);
  document.body.append(container);
  Object.defineProperty(scrollEl, "clientWidth", { value: 200 });
  root = createRoot(container);
  const onSelectComment = vi.fn();
  const render = (comments: NoteComment[]) => root!.render(React.createElement(EditorCommentsLayer, {
    view: null, containerEl: scrollEl, isReadMode: true, comments,
    pendingComment: null, activeCommentId: comment.id,
    onSaveComment: vi.fn(), onCancelPending: vi.fn(), onSelectComment,
    onDeleteComment: vi.fn(), onEditComment: vi.fn(), onReplyComment: vi.fn(),
  }));
  unsubscribe = store.subscribeToComments((path, comments) => {
    if (path === notePath) render(comments);
  });
  await act(async () => render([comment]));
  expect(scrollEl.querySelector<HTMLElement>(".cm-comment-popover")?.style.width).toBe("172px");
  expect(options(scrollEl)).toHaveLength(4);
  await click(options(scrollEl)[0]);
  expect(scrollEl.textContent).toContain("Correct!");
  await click(scrollEl.querySelector('[aria-label="Next question"]')!);
  expect(scrollEl.textContent).toContain("2 / 2");
  expect(onSelectComment).not.toHaveBeenCalled();
  expect((await store.loadComments(notePath))[0].quiz?.answers).toEqual({ "question-0": 0 });
});
