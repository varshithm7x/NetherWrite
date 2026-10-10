import { v4 as uuidv4 } from "uuid";
import { readData, writeData } from "./disk-store";
import { authManager } from "../lib/auth";
import type { NoteComment, CommentAuthor, CommentReply, QuizComment } from "../types/comments";
import { deserializeComments, isQuizAnswerIndex, parseQuizComment, parseQuizData } from "./quiz-comments";
import { mergeQuizCommentAnchors } from "./comment-anchors";
import { getAPI } from "./api";

const STORAGE_FILE = "comments.json";
const LOCAL_STORAGE_PREFIX = "netherwrite:comments:";
const COMMENTS_EVENT = "netherwrite:comments-changed";
const COMMENTS_VAULT_EVENT = "netherwrite:comments-vault-changed";

// In-memory cache: notePath -> NoteComment[]
const commentsCache = new Map<string, NoteComment[]>();
let isDiskLoaded = false;
let allDiskComments: Record<string, NoteComment[]> = {};
let commentsVaultPath: string | null = null;
let vaultVersion = 0;

/** Relative note names must never share cached comments across vaults. */
export function setCommentsVaultPath(vaultPath: string | null): void {
  if (commentsVaultPath === vaultPath) return;
  commentsVaultPath = vaultPath;
  vaultVersion++;
  commentsCache.clear();
  allDiskComments = {};
  isDiskLoaded = false;
  if (typeof window !== "undefined") window.dispatchEvent(new Event(COMMENTS_VAULT_EVENT));
}

function localCommentsKey(notePath: string): string {
  return commentsVaultPath
    ? `${LOCAL_STORAGE_PREFIX}${encodeURIComponent(commentsVaultPath)}:${notePath}`
    : LOCAL_STORAGE_PREFIX + notePath;
}

export function getCurrentUser(): CommentAuthor {
  if (typeof window !== "undefined") {
    const customName = localStorage.getItem("netherwrite:user_name");
    const customAvatar = localStorage.getItem("netherwrite:user_avatar");
    if (customName) {
      return {
        name: customName,
        avatar: customAvatar || "/default-avatar.png",
      };
    }
  }

  const authUser = authManager.getUser();
  if (authUser) {
    const meta = authUser.user_metadata;
    const name =
      meta?.full_name ||
      meta?.name ||
      authUser.email?.split("@")[0] ||
      "Varshith Programmer";
    const avatar = meta?.avatar_url || "/default-avatar.png";
    return { name, avatar };
  }

  return {
    name: "Varshith Programmer",
    avatar: "/default-avatar.png",
  };
}

export function formatRelativeTime(timestamp: number): string {
  const diffSec = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSec < 45) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d`;
  return new Date(timestamp).toLocaleDateString();
}

/**
 * Synchronously get comments for a note from in-memory cache or localStorage.
 * Used for zero-delay initial rendering.
 */
export function getCommentsSync(notePath: string): NoteComment[] {
  if (!notePath) return [];
  if (commentsCache.has(notePath)) {
    return commentsCache.get(notePath)!;
  }
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(localCommentsKey(notePath));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const comments = deserializeComments(parsed, notePath);
          commentsCache.set(notePath, comments);
          return comments;
        }
      }
    } catch {
      // ignore
    }
  }
  return [];
}

/**
 * Asynchronously load comments for a note from diskStore or localStorage.
 */
export async function loadComments(notePath: string): Promise<NoteComment[]> {
  if (!notePath) return [];
  const version = vaultVersion;

  if (!isDiskLoaded) {
    try {
      const diskData = await readData<Record<string, NoteComment[]>>(STORAGE_FILE);
      if (version !== vaultVersion) throw new Error("Comments vault changed during loading");
      if (diskData && typeof diskData === "object") {
        allDiskComments = diskData;
        for (const [path, list] of Object.entries(diskData)) {
          if (Array.isArray(list)) {
            commentsCache.set(path, deserializeComments(list, path));
          }
        }
      }
    } catch (e) {
      if (version !== vaultVersion) throw e;
      console.warn("[CommentsStore] Error reading comments from disk:", e);
    }
    if (version !== vaultVersion) throw new Error("Comments vault changed during loading");
    isDiskLoaded = true;
  }

  if (commentsCache.has(notePath)) {
    return commentsCache.get(notePath)!;
  }

  return getCommentsSync(notePath);
}

/**
 * Save comments for a note to in-memory cache, localStorage, and diskStore.
 */
export async function saveComments(
  notePath: string,
  comments: NoteComment[]
): Promise<void> {
  if (!notePath) return;
  const version = vaultVersion;

  // Reject invalid writes before changing any cache or existing saved comments.
  comments = comments.map((comment) => {
    if (comment.type !== "quiz") return comment;
    const parsed = parseQuizComment(comment);
    if (!parsed || parsed.notePath !== notePath) throw new Error("Invalid quiz comment");
    return parsed;
  });

  commentsCache.set(notePath, comments);
  allDiskComments[notePath] = comments;

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(
        localCommentsKey(notePath),
        JSON.stringify(comments)
      );
    } catch {
      // ignore
    }
  }

  try {
    await writeData(STORAGE_FILE, allDiskComments);
  } catch (e) {
    console.warn("[CommentsStore] Error writing comments to disk:", e);
  }

  if (version !== vaultVersion) return;
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(COMMENTS_EVENT, {
        detail: { notePath, comments },
      })
    );
  }
}

/**
 * Add a new comment to a note.
 */
export async function addComment(
  notePath: string,
  data: {
    from: number;
    to: number;
    selectedText: string;
    content: string;
    image?: string;
  }
): Promise<NoteComment> {
  return enqueueCommentMutation(async () => {
    const current = await loadComments(notePath);
    const newComment: NoteComment = {
      id: uuidv4(),
      notePath,
      from: data.from,
      to: data.to,
      selectedText: data.selectedText,
      content: data.content,
      image: data.image,
      author: getCurrentUser(),
      createdAt: Date.now(),
      resolved: false,
      replies: [],
    };

    const next = [...current, newComment];
    await saveComments(notePath, next);
    return newComment;
  });
}

// Serialize comment mutations so a generated quiz batch and ordinary edits
// preserve one another, and rapid answers cannot replace a locked selection.
let commentMutationQueue: Promise<unknown> = Promise.resolve();
function enqueueCommentMutation<T>(operation: () => Promise<T>): Promise<T> {
  const version = vaultVersion;
  const result = commentMutationQueue.then(() => {
    if (version !== vaultVersion) throw new Error("The comment's vault is no longer open");
    return operation();
  });
  commentMutationQueue = result.catch(() => {});
  return result;
}

/** Future generators can create one anchored topic using this existing store. */
export function addQuizComment(
  notePath: string,
  anchor: Pick<NoteComment, "from" | "to" | "selectedText">,
  quizData: unknown,
): Promise<QuizComment> {
  return enqueueCommentMutation(async () => {
    const quiz = parseQuizData(quizData);
    const comment = parseQuizComment({
      ...anchor,
      id: uuidv4(), notePath, type: "quiz", quiz,
      content: "", author: getCurrentUser(), createdAt: Date.now(), resolved: false, replies: [],
    });
    if (!comment || !comment.selectedText.trim() || comment.from === comment.to) throw new Error("Invalid quiz comment");
    const current = await loadComments(notePath);
    await saveComments(notePath, [...current, comment]);
    return comment;
  });
}

export interface QuizCommentDraft {
  anchor: Pick<NoteComment, "from" | "to" | "selectedText">;
  quiz: unknown;
}

/** Validate the entire set, then persist once before publishing any new cards. */
export function addQuizComments(
  notePath: string,
  drafts: QuizCommentDraft[],
  expectedVaultPath: string,
  beforeSave: () => Promise<void>,
): Promise<QuizComment[]> {
  return enqueueCommentMutation(async () => {
    const version = vaultVersion;
    if (commentsVaultPath !== expectedVaultPath || drafts.length === 0) throw new Error("Invalid quiz source vault");
    const comments = drafts.map(draft => {
      const comment = parseQuizComment({
        ...draft.anchor, id: uuidv4(), notePath, type: "quiz", quiz: parseQuizData(draft.quiz),
        content: "", author: getCurrentUser(), createdAt: Date.now(), resolved: false, replies: [],
      });
      if (!comment || comment.from === comment.to || !comment.selectedText.trim()) throw new Error("Invalid quiz comment");
      return comment;
    });
    await loadComments(notePath);
    const raw = await getAPI().dataRead(STORAGE_FILE);
    const persisted: unknown = raw === null ? {} : JSON.parse(raw);
    if (!persisted || typeof persisted !== "object" || Array.isArray(persisted)) throw new Error("Invalid comments file");
    const diskComments = persisted as Record<string, NoteComment[]>;
    if (diskComments[notePath] !== undefined && !Array.isArray(diskComments[notePath])) throw new Error("Invalid comments file");
    await beforeSave();
    if (version !== vaultVersion) throw new Error("The source vault changed");
    const next = [...(diskComments[notePath] || []), ...comments];
    const snapshot = { ...diskComments, [notePath]: next };
    // Unlike legacy best-effort saves, generation must observe disk failures.
    await getAPI().dataWrite(STORAGE_FILE, JSON.stringify(snapshot), { atomic: true, expectedVaultPath });
    if (version !== vaultVersion) throw new Error("The source vault changed");
    allDiskComments = snapshot;
    const visible = deserializeComments(next, notePath);
    commentsCache.set(notePath, visible);
    try { localStorage.setItem(localCommentsKey(notePath), JSON.stringify(next)); } catch { /* disk is authoritative */ }
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(COMMENTS_EVENT, { detail: { notePath, comments: visible } }));
    return comments;
  });
}

export function answerQuizQuestion(
  notePath: string,
  commentId: string,
  questionId: string,
  answerIndex: number,
): Promise<QuizComment | null> {
  return enqueueCommentMutation(async () => {
    if (!isQuizAnswerIndex(answerIndex)) throw new Error("Invalid quiz answer");
    const current = await loadComments(notePath);
    const comment = parseQuizComment(current.find(c => c.id === commentId));
    if (!comment || !comment.quiz.questions.some(question => question.id === questionId)) return null;
    if (Object.prototype.hasOwnProperty.call(comment.quiz.answers, questionId)) return comment;
    const updated: QuizComment = {
      ...comment,
      quiz: { ...comment.quiz, answers: { ...comment.quiz.answers, [questionId]: answerIndex } },
    };
    await saveComments(notePath, current.map(c => c.id === commentId ? updated : c));
    return updated;
  });
}

/** Merge mapped quiz anchors with the latest saved answers, never stale payloads. */
export function updateQuizCommentAnchors(notePath: string, mappedComments: NoteComment[]): Promise<void> {
  const anchors = mappedComments.filter(c => c.type === "quiz" && c.notePath === notePath);
  if (anchors.length === 0) return Promise.resolve();
  return enqueueCommentMutation(async () => {
    const current = await loadComments(notePath);
    const next = mergeQuizCommentAnchors(current, anchors);
    if (next.some((comment, index) => comment !== current[index])) await saveComments(notePath, next);
  });
}

/**
 * Delete a comment by ID.
 */
export async function deleteComment(
  notePath: string,
  commentId: string
): Promise<void> {
  return enqueueCommentMutation(async () => {
    const current = await loadComments(notePath);
    const next = current.filter((c) => c.id !== commentId);
    await saveComments(notePath, next);
  });
}

/**
 * Update the text/image payload for an existing comment.
 */
export async function updateComment(
  notePath: string,
  commentId: string,
  content: string,
  image?: string
): Promise<NoteComment | null> {
  return enqueueCommentMutation(async () => {
    const current = await loadComments(notePath);
    let updatedComment: NoteComment | null = null;
    const next = current.map((c) => {
      if (c.id !== commentId) return c;
      updatedComment = {
        ...c,
        content,
        image,
        editedAt: Date.now(),
      };
      return updatedComment;
    });

    if (updatedComment) {
      await saveComments(notePath, next);
    }
    return updatedComment;
  });
}

/**
 * Resolve or toggle resolution for a comment.
 */
export async function resolveComment(
  notePath: string,
  commentId: string
): Promise<void> {
  return enqueueCommentMutation(async () => {
    const current = await loadComments(notePath);
    const next = current.map((c) =>
      c.id === commentId ? { ...c, resolved: !c.resolved } : c
    );
    await saveComments(notePath, next);
  });
}

/**
 * Add a reply to a comment.
 */
export async function addReply(
  notePath: string,
  commentId: string,
  content: string,
  image?: string
): Promise<NoteComment | null> {
  return enqueueCommentMutation(async () => {
    const current = await loadComments(notePath);
    const reply: CommentReply = {
      id: uuidv4(),
      author: getCurrentUser(),
      content,
      image,
      createdAt: Date.now(),
    };

    let updatedComment: NoteComment | null = null;
    const next = current.map((c) => {
      if (c.id === commentId) {
        updatedComment = {
          ...c,
          replies: [...(c.replies || []), reply],
        };
        return updatedComment;
      }
      return c;
    });

    if (updatedComment) {
      await saveComments(notePath, next);
    }
    return updatedComment;
  });
}

/**
 * Subscribe to comments updates.
 */
export function subscribeToComments(
  callback: (notePath: string, comments: NoteComment[]) => void,
  onVaultChange?: () => void,
): () => void {
  if (typeof window === "undefined") return () => {};

  const handler = (e: Event) => {
    const custom = e as CustomEvent<{ notePath: string; comments: NoteComment[] }>;
    if (custom.detail) {
      callback(custom.detail.notePath, custom.detail.comments);
    }
  };

  window.addEventListener(COMMENTS_EVENT, handler);
  if (onVaultChange) window.addEventListener(COMMENTS_VAULT_EVENT, onVaultChange);
  return () => {
    window.removeEventListener(COMMENTS_EVENT, handler);
    if (onVaultChange) window.removeEventListener(COMMENTS_VAULT_EVENT, onVaultChange);
  };
}
