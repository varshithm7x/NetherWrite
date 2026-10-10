import type { NoteComment, QuizAnswerIndex, QuizComment, QuizData, QuizQuestion } from "../types/comments";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonemptyText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isQuizAnswerIndex(value: unknown): value is QuizAnswerIndex {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 3;
}

/** Validate at both the storage and UI boundaries. Text remains plain text. */
export function parseQuizData(value: unknown): QuizData | null {
  if (!isRecord(value) || !isNonemptyText(value.topic) || !Array.isArray(value.questions) || value.questions.length === 0) return null;
  const ids = new Set<string>();
  const questions: QuizQuestion[] = [];
  for (const question of value.questions) {
    if (!isRecord(question) || !isNonemptyText(question.id) || ids.has(question.id)
      || !isNonemptyText(question.question) || !Array.isArray(question.options)
      || question.options.length !== 4 || !question.options.every(isNonemptyText)
      || !isQuizAnswerIndex(question.correctIndex)) return null;
    ids.add(question.id);
    questions.push({
      id: question.id,
      question: question.question,
      options: [...question.options] as QuizQuestion["options"],
      correctIndex: question.correctIndex,
      explanation: typeof question.explanation === "string" ? question.explanation : "",
    });
  }
  if (value.answers !== undefined && !isRecord(value.answers)) return null;
  const answers: QuizData["answers"] = {};
  for (const [id, index] of Object.entries(value.answers ?? {})) {
    if (!ids.has(id) || !isQuizAnswerIndex(index)) return null;
    Object.defineProperty(answers, id, { value: index, enumerable: true, writable: true, configurable: true });
  }
  return { topic: value.topic, questions, answers };
}

export function parseQuizComment(value: unknown): QuizComment | null {
  if (!isRecord(value) || value.type !== "quiz" || !isNonemptyText(value.id)
    || !isNonemptyText(value.notePath) || !Number.isSafeInteger(value.from) || !Number.isSafeInteger(value.to)
    || (value.from as number) < 0 || (value.to as number) < (value.from as number)
    || typeof value.selectedText !== "string" || typeof value.content !== "string"
    || !isRecord(value.author) || !isNonemptyText(value.author.name)
    || typeof value.createdAt !== "number" || !Number.isFinite(value.createdAt)) return null;
  if (value.replies !== undefined && (!Array.isArray(value.replies) || !value.replies.every(reply =>
    isRecord(reply) && isNonemptyText(reply.id) && typeof reply.content === "string"
    && isRecord(reply.author) && isNonemptyText(reply.author.name)
    && typeof reply.createdAt === "number" && Number.isFinite(reply.createdAt)))) return null;
  const quiz = parseQuizData(value.quiz);
  return quiz ? { ...value as unknown as NoteComment, type: "quiz", quiz } : null;
}

/** Keep legacy comment records unchanged; ignore only invalid quiz records. */
export function deserializeComments(value: unknown, notePath: string): NoteComment[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((comment) => {
    if (!isRecord(comment)) return [];
    if (comment.type !== "quiz") return [comment as unknown as NoteComment];
    const parsed = parseQuizComment(comment);
    return parsed && parsed.notePath === notePath ? [parsed] : [];
  });
}
