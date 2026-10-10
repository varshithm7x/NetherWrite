export interface CommentAuthor {
  name: string;
  avatar?: string;
}

export interface CommentReply {
  id: string;
  author: CommentAuthor;
  content: string;
  image?: string;
  createdAt: number;
}

export interface NoteComment {
  id: string;
  notePath: string;
  from: number;
  to: number;
  selectedText: string;
  content: string;
  image?: string;
  author: CommentAuthor;
  createdAt: number;
  editedAt?: number;
  resolved?: boolean;
  replies?: CommentReply[];
  type?: "quiz";
  quiz?: QuizData;
}

export type QuizAnswerIndex = 0 | 1 | 2 | 3;

export interface QuizQuestion {
  id: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: QuizAnswerIndex;
  explanation: string;
}

export interface QuizData {
  topic: string;
  questions: QuizQuestion[];
  /** Answers are keyed by stable question identity, independent of pagination. */
  answers: Record<string, QuizAnswerIndex>;
}

export interface QuizComment extends NoteComment {
  type: "quiz";
  quiz: QuizData;
}

export interface PendingComment {
  id: string;
  from: number;
  to: number;
  selectedText: string;
  targetTop: number;
  image?: string;
}
