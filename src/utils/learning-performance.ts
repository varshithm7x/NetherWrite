import { parseQuizComment } from "./quiz-comments";
import type { LearningPriority, PerformanceCounts, QuizPerformance, QuizResult } from "../types/learning-reports";

export const LEARNING_THRESHOLDS = { needsAttention: 50, strong: 80, minimumEvidence: 3 } as const;

export function performanceCounts(questions: QuizResult[]): PerformanceCounts {
  const answered = questions.filter(question => question.selectedIndex !== null);
  const correct = answered.filter(question => question.selectedIndex === question.correctIndex).length;
  return { total: questions.length, answered: answered.length, correct, incorrect: answered.length - correct,
    unanswered: questions.length - answered.length, accuracy: answered.length ? Math.round(correct / answered.length * 100) : null };
}

export function learningPriority(counts: PerformanceCounts): LearningPriority {
  if (!counts.answered) return "Unanswered";
  // Classify using the exact ratio, not the rounded display percentage.
  const accuracy = counts.correct / counts.answered * 100;
  return accuracy < LEARNING_THRESHOLDS.needsAttention ? "Needs Attention" : accuracy < LEARNING_THRESHOLDS.strong ? "Keep Practicing" : "Strong";
}

export function summarizeQuizResults(notePath: string, questions: QuizResult[], skippedQuizzes = 0): QuizPerformance {
  const grouped = new Map<string, QuizResult[]>();
  for (const question of questions) {
    const group = grouped.get(question.topic);
    if (group) group.push(question); else grouped.set(question.topic, [question]);
  }
  return { notePath, questions, skippedQuizzes, ...performanceCounts(questions), topics: [...grouped].map(([topic, results]) => {
    const counts = performanceCounts(results);
    return { topic, ...counts, priority: learningPriority(counts), limitedEvidence: counts.answered < LEARNING_THRESHOLDS.minimumEvidence };
  }) };
}

/** Locked saved selections are the only attempts. Ordinary comments never count. */
export function analyzeQuizPerformance(records: unknown[], notePath: string): QuizPerformance {
  const questions: QuizResult[] = [];
  const seen = new Set<string>();
  let skipped = 0;
  for (const record of records) {
    if (!record || typeof record !== "object" || !("type" in record) || record.type !== "quiz") continue;
    const comment = parseQuizComment(record);
    if (!comment || seen.has(comment.id)) { skipped++; continue; }
    if (comment.notePath !== notePath) continue;
    seen.add(comment.id);
    if (comment.quiz.topic.length > 240 || comment.quiz.questions.length > 5000 || comment.quiz.questions.some(question =>
      question.question.length > 4000 || question.explanation.length > 8000 || question.options.some(option => option.length > 2000))) { skipped++; continue; }
    for (const question of comment.quiz.questions) questions.push({
      commentId: comment.id, questionId: question.id, topic: comment.quiz.topic,
      question: question.question, options: [...question.options], correctIndex: question.correctIndex,
      explanation: question.explanation, selectedIndex: Object.hasOwn(comment.quiz.answers, question.id) ? comment.quiz.answers[question.id] : null,
    });
  }
  return summarizeQuizResults(notePath, questions, skipped);
}

export function focusTopics(performance: QuizPerformance) {
  return performance.topics.filter(topic => topic.answered && topic.priority !== "Strong")
    .sort((a, b) => a.correct / a.answered - b.correct / b.answered || b.answered - a.answered || a.topic.localeCompare(b.topic));
}
