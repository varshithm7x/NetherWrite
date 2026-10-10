import type { Flashcard, FlashcardDeck } from "../types/flashcards";

export function isFlashcardRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isFlashcardText(value: unknown, limit: number): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= limit;
}

export function isFlashcardNotePath(value: unknown): value is string {
  return isFlashcardText(value, 4096) && !/^(?:[a-z]:|[/\\])/i.test(value)
    && !value.split(/[/\\]/).some(part => part === "." || part === "..");
}

/** Load only validated fields, never raw responses, credentials or HTML. */
export function parseFlashcardDeck(value: unknown): FlashcardDeck | null {
  if (!isFlashcardRecord(value) || value.type !== "flashcards" || !isFlashcardText(value.id, 128)
    || !isFlashcardText(value.title, 300) || !isFlashcardText(value.vaultPath, 4096)
    || !isFlashcardNotePath(value.sourceNotePath) || !isFlashcardText(value.sourceNoteTitle, 300)
    || typeof value.createdAt !== "number" || !Number.isFinite(value.createdAt) || value.createdAt < 0
    || typeof value.updatedAt !== "number" || !Number.isFinite(value.updatedAt) || value.updatedAt < value.createdAt
    || !Array.isArray(value.cards) || value.cards.length === 0
    || typeof value.sourceTruncated !== "boolean" || !Number.isSafeInteger(value.requestedCount) || (value.requestedCount as number) < 1) return null;
  const ids = new Set<string>();
  const cards: Flashcard[] = [];
  for (const card of value.cards) {
    if (!isFlashcardRecord(card) || !isFlashcardText(card.id, 128) || ids.has(card.id)
      || !isFlashcardText(card.front, 1000) || !isFlashcardText(card.back, 4000)
      || (card.sourceExcerpt !== undefined && !isFlashcardText(card.sourceExcerpt, 4000))) return null;
    ids.add(card.id);
    cards.push({ id: card.id, front: card.front, back: card.back, ...(card.sourceExcerpt === undefined ? {} : { sourceExcerpt: card.sourceExcerpt }) });
  }
  return {
    id: value.id, type: "flashcards", title: value.title, vaultPath: value.vaultPath,
    sourceNotePath: value.sourceNotePath, sourceNoteTitle: value.sourceNoteTitle,
    createdAt: value.createdAt, updatedAt: value.updatedAt, cards,
    sourceTruncated: value.sourceTruncated, requestedCount: value.requestedCount as number,
  };
}
