import type { QuizComment } from "../../src/types/comments";
import type { LearningAdvice, LearningReport } from "../../src/types/learning-reports";
import { analyzeQuizPerformance } from "../../src/utils/learning-performance";

export const REPORT_NOTE = { path: "OS.md", name: "Operating Systems" };
export const REPORT_PASSAGE = "Deadlocks occur when processes wait for resources held by one another. Memory allocation tracks available and allocated blocks. Review the necessary deadlock conditions before comparing allocation strategies.";
export function reportQuiz(id = "deadlocks", topic = "Deadlocks", answers: Record<string, 0 | 1 | 2 | 3> = { q1: 1 }, notePath = REPORT_NOTE.path): QuizComment {
  return { id, type: "quiz", notePath, from: 1, to: 20, selectedText: "Deadlocks occur", content: "", createdAt: 1, author: { name: "Fixture" },
    quiz: { topic, questions: [1, 2].map(index => ({ id: `q${index}`, question: `Question ${index} on ${topic}?`, options: ["Correct", "Wrong", "Other", "Alternative"], correctIndex: 0, explanation: `${topic} explanation.` })), answers } };
}
export function reportAdvice(): LearningAdvice {
  return { assessment: "Review resource waiting and compare allocation concepts using the source note.",
    focus: [{ topic: "Deadlocks", reason: "Review why resource waiting matters.", concepts: ["Resource waiting"], action: "Read the deadlock passage and explain it in your own words.", sourceExcerpt: "Deadlocks occur when processes wait for resources held by one another." }],
    strengths: [{ topic: "Memory", advice: "The answered allocation question was correct, with limited evidence.", sourceExcerpt: "Memory allocation tracks available and allocated blocks." }],
    studyPlan: [{ topic: "Deadlocks", action: "Review the resource-waiting explanation.", sourceExcerpt: "Deadlocks occur when processes wait for resources held by one another." }] };
}
export function reportFixture(id = "report-fixture", vaultPath = "/report-fixture-vault"): LearningReport {
  return { id, type: "learning-report", title: "Operating Systems Learning Report", sourceNoteTitle: REPORT_NOTE.name,
    vaultPath, sourceNotePath: REPORT_NOTE.path, createdAt: 1,
    performance: analyzeQuizPerformance([reportQuiz(), reportQuiz("memory", "Memory", { q1: 0 })], REPORT_NOTE.path),
    advice: reportAdvice(), adviceStatus: "ready", adviceMessage: "Advice uses source passages.", evidenceTruncated: false, videos: [], videoStatus: "unavailable" };
}
