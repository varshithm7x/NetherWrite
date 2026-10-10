export interface Flashcard {
  id: string;
  front: string;
  back: string;
  sourceExcerpt?: string;
}

export interface FlashcardDeck {
  id: string;
  type: "flashcards";
  title: string;
  vaultPath: string;
  sourceNotePath: string;
  sourceNoteTitle: string;
  createdAt: number;
  updatedAt: number;
  cards: Flashcard[];
  sourceTruncated: boolean;
  requestedCount: number;
}
