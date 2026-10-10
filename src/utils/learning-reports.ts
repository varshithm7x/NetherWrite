import type { LearningAdvice, LearningReport, QuizPerformance, QuizResult } from "../types/learning-reports";
import { isFlashcardRecord as isRecord, isFlashcardText as text, isFlashcardNotePath } from "./flashcard-decks";
import { parseQuizData, isQuizAnswerIndex } from "./quiz-comments";
import { summarizeQuizResults } from "./learning-performance";
import { MAX_LEARNING_VIDEOS, parseLearningVideo } from "./learning-videos";

function keys(value: Record<string, unknown>, allowed: string[]) { return Object.keys(value).every(key => allowed.includes(key)); }
export function parseLearningAdvice(value: unknown, performance: QuizPerformance, source?: string): LearningAdvice | null {
  if (!isRecord(value) || !keys(value, ["assessment", "focus", "strengths", "studyPlan"]) || !text(value.assessment, 700)
    || /\d|%|\bmaster(?:ed|y)\b/i.test(value.assessment)
    || !Array.isArray(value.focus) || value.focus.length > 8 || !Array.isArray(value.strengths) || value.strengths.length > 8
    || !Array.isArray(value.studyPlan) || !value.studyPlan.length || value.studyPlan.length > 8) return null;
  const topics = new Map(performance.topics.map(topic => [topic.topic, topic]));
  const grounded = (item: Record<string, unknown>) => text(item.topic, 240) && topics.get(item.topic)?.answered
    && text(item.sourceExcerpt, 1200) && item.sourceExcerpt.trim().length >= 12
    && (source === undefined || source.includes(item.sourceExcerpt));
  const focus: LearningAdvice["focus"] = [];
  const strengths: LearningAdvice["strengths"] = [];
  const studyPlan: LearningAdvice["studyPlan"] = [];
  const focusSeen = new Set<string>();
  const strongSeen = new Set<string>();
  for (const item of value.focus) {
    if (!isRecord(item) || !keys(item, ["topic", "reason", "concepts", "action", "sourceExcerpt"]) || !grounded(item)
      || topics.get(String(item.topic))?.priority === "Strong" || !text(item.reason, 600) || !text(item.action, 600)
      || !Array.isArray(item.concepts) || !item.concepts.length || item.concepts.length > 5 || !item.concepts.every(concept => text(concept, 120))
      || focusSeen.has(String(item.topic))) return null;
    focusSeen.add(String(item.topic));
    focus.push({ topic: item.topic as string, reason: item.reason, concepts: item.concepts as string[], action: item.action, sourceExcerpt: item.sourceExcerpt as string });
  }
  for (const item of value.strengths) {
    if (!isRecord(item) || !keys(item, ["topic", "advice", "sourceExcerpt"]) || !grounded(item)
      || topics.get(String(item.topic))?.priority !== "Strong" || !text(item.advice, 600) || strongSeen.has(String(item.topic))) return null;
    strongSeen.add(String(item.topic));
    strengths.push({ topic: item.topic as string, advice: item.advice, sourceExcerpt: item.sourceExcerpt as string });
  }
  for (const item of value.studyPlan) {
    if (!isRecord(item) || !keys(item, ["topic", "action", "sourceExcerpt"]) || !grounded(item) || !text(item.action, 600)) return null;
    studyPlan.push({ topic: item.topic as string, action: item.action, sourceExcerpt: item.sourceExcerpt as string });
  }
  return { assessment: value.assessment, focus, strengths, studyPlan };
}

/** Recalculate saved statistics; reject inconsistent or malformed snapshots. */
export function parseLearningReport(value: unknown): LearningReport | null {
  if (!isRecord(value) || value.type !== "learning-report" || !text(value.id, 128) || !text(value.title, 300)
    || !text(value.vaultPath, 4096) || !isFlashcardNotePath(value.sourceNotePath) || !text(value.sourceNoteTitle, 300)
    || typeof value.createdAt !== "number" || !Number.isFinite(value.createdAt) || value.createdAt < 0
    || !isRecord(value.performance) || value.performance.notePath !== value.sourceNotePath
    || !Array.isArray(value.performance.questions) || !value.performance.questions.length || value.performance.questions.length > 10_000
    || !Number.isSafeInteger(value.performance.skippedQuizzes) || (value.performance.skippedQuizzes as number) < 0
    || typeof value.evidenceTruncated !== "boolean" || !text(value.adviceMessage, 1000)
    || !["ready", "unavailable"].includes(String(value.adviceStatus)) || !["ready", "unavailable", "empty"].includes(String(value.videoStatus))
    || (value.videoMessage !== undefined && !text(value.videoMessage, 500))
    || !Array.isArray(value.videos) || value.videos.length > MAX_LEARNING_VIDEOS) return null;
  const questions: QuizResult[] = [];
  const seen = new Map<string, Set<string>>();
  const commentTopics = new Map<string, string>();
  for (const question of value.performance.questions) {
    if (!isRecord(question) || !text(question.commentId, 128) || !text(question.questionId, 128) || !text(question.topic, 240)
      || !text(question.question, 4000) || typeof question.explanation !== "string" || question.explanation.length > 8000
      || (question.selectedIndex !== null && !isQuizAnswerIndex(question.selectedIndex))) return null;
    const data = parseQuizData({ topic: question.topic, questions: [{ ...question, id: question.questionId }], answers: {} });
    if (!data || data.questions[0].options.some(option => option.length > 2000)) return null;
    const ids = seen.get(question.commentId) || new Set<string>();
    if (ids.has(question.questionId) || (commentTopics.has(question.commentId) && commentTopics.get(question.commentId) !== question.topic)) return null;
    ids.add(question.questionId); seen.set(question.commentId, ids); commentTopics.set(question.commentId, question.topic);
    questions.push({ commentId: question.commentId, questionId: question.questionId, topic: question.topic,
      question: question.question, options: data.questions[0].options, correctIndex: data.questions[0].correctIndex,
      explanation: question.explanation, selectedIndex: question.selectedIndex as QuizResult["selectedIndex"] });
  }
  const performance = summarizeQuizResults(value.sourceNotePath, questions, value.performance.skippedQuizzes as number);
  if (!performance.answered || performance.topics.length > 500) return null;
  for (const key of ["total", "answered", "correct", "incorrect", "unanswered", "accuracy"] as const) if (value.performance[key] !== performance[key]) return null;
  if (JSON.stringify(value.performance.topics) !== JSON.stringify(performance.topics)) return null;
  const advice = value.advice === null ? null : parseLearningAdvice(value.advice, performance);
  if ((value.adviceStatus === "ready") !== (advice !== null) || (value.advice !== null && !advice)) return null;
  const allowedTopics = new Set(performance.topics.filter(topic => topic.answered && topic.priority !== "Strong").map(topic => topic.topic));
  const videos = value.videos.map(video => parseLearningVideo(video, allowedTopics));
  if (videos.some(video => !video) || new Set(videos.map(video => video!.id)).size !== videos.length
    || (value.videoStatus === "ready") !== (videos.length > 0)) return null;
  return { id: value.id, type: "learning-report", title: value.title, vaultPath: value.vaultPath,
    sourceNotePath: value.sourceNotePath, sourceNoteTitle: value.sourceNoteTitle, createdAt: value.createdAt,
    performance, advice, adviceStatus: value.adviceStatus as LearningReport["adviceStatus"], adviceMessage: value.adviceMessage,
    evidenceTruncated: value.evidenceTruncated, videos: videos as LearningReport["videos"], videoStatus: value.videoStatus as LearningReport["videoStatus"],
    ...(typeof value.videoMessage === "string" ? { videoMessage: value.videoMessage } : {}) };
}
