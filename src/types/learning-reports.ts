import type { QuizAnswerIndex } from "./comments";

export type LearningPriority = "Needs Attention" | "Keep Practicing" | "Strong" | "Unanswered";
export interface QuizResult {
  commentId: string;
  questionId: string;
  topic: string;
  question: string;
  options: [string, string, string, string];
  selectedIndex: QuizAnswerIndex | null;
  correctIndex: QuizAnswerIndex;
  explanation: string;
}
export interface PerformanceCounts {
  total: number;
  answered: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  accuracy: number | null;
}
export interface TopicPerformance extends PerformanceCounts {
  topic: string;
  priority: LearningPriority;
  limitedEvidence: boolean;
}
export interface QuizPerformance extends PerformanceCounts {
  notePath: string;
  questions: QuizResult[];
  topics: TopicPerformance[];
  skippedQuizzes: number;
}
export interface LearningAdvice {
  assessment: string;
  focus: { topic: string; reason: string; concepts: string[]; action: string; sourceExcerpt: string }[];
  strengths: { topic: string; advice: string; sourceExcerpt: string }[];
  studyPlan: { topic: string; action: string; sourceExcerpt: string }[];
}
export interface LearningVideo {
  id: string;
  title: string;
  url: string;
  thumbnail?: string;
  channel?: string;
  topic: string;
}
export interface LearningReport {
  id: string;
  type: "learning-report";
  title: string;
  vaultPath: string;
  sourceNotePath: string;
  sourceNoteTitle: string;
  createdAt: number;
  performance: QuizPerformance;
  advice: LearningAdvice | null;
  adviceStatus: "ready" | "unavailable";
  adviceMessage: string;
  evidenceTruncated: boolean;
  videos: LearningVideo[];
  videoStatus: "ready" | "unavailable" | "empty";
  videoMessage?: string;
}
