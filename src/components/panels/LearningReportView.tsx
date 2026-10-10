import { useState } from "react";
import { ChevronLeft, ExternalLink, Video } from "lucide-react";
import type { LearningReport, LearningVideo } from "../../types/learning-reports";
import { focusTopics } from "../../utils/learning-performance";
import { validYouTubeUrl, VIDEO_UNAVAILABLE_MESSAGE } from "../../utils/learning-videos";
import { getAPI } from "../../utils/api";
import { reportFocusClass } from "./ForgeReportForm";

function ReportVideo({ video }: { video: LearningVideo }) {
  const [failed, setFailed] = useState(false);
  const [openError, setOpenError] = useState(false);
  return <div className="min-w-0">
    <button type="button" onClick={() => {
      if (validYouTubeUrl(video.url, video.id)) void getAPI().openExternal(video.url).catch(() => setOpenError(true));
    }} className={`w-full min-w-0 overflow-hidden rounded-lg border border-(--border-subtle) bg-(--bg-secondary) text-left hover:bg-(--bg-hover) ${reportFocusClass}`}>
      {video.thumbnail && !failed ? <img src={video.thumbnail} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} className="aspect-video w-full object-cover" />
        : <div className="flex aspect-video w-full items-center justify-center bg-(--bg-active) text-(--text-muted)"><Video size={24} aria-hidden="true" /><span className="sr-only">Thumbnail unavailable</span></div>}
      <span className="block space-y-1 p-3"><span className="flex items-start gap-2"><span className="min-w-0 flex-1 break-words font-medium">{video.title}</span><ExternalLink size={13} className="shrink-0" aria-hidden="true" /></span>
        {video.channel && <span className="block break-words text-(--text-muted)">{video.channel}</span>}<span className="block break-words text-[10px] text-(--text-muted)">Recommended for: {video.topic}</span></span>
    </button>
    {openError && <p role="status">The video could not be opened. Please retry.</p>}
  </div>;
}
export function LearningReportView({ report, onBack, onRegenerate, onOpenNote }: {
  report: LearningReport; onBack: () => void; onRegenerate: () => void; onOpenNote?: (path: string) => void | Promise<void>;
}) {
  const [sourceError, setSourceError] = useState(false);
  const performance = report.performance;
  const focus = focusTopics(performance);
  const strengths = performance.topics.filter(topic => topic.priority === "Strong");
  async function openSource() {
    try {
      if (await getAPI().getVaultPath() !== report.vaultPath || !await getAPI().fileExists(report.sourceNotePath)
        || await getAPI().getVaultPath() !== report.vaultPath) throw new Error("Missing source");
      await onOpenNote?.(report.sourceNotePath);
    } catch { setSourceError(true); }
  }
  return <article aria-label="Learning Report" className="min-w-0 space-y-5 break-words text-xs leading-relaxed">
    <header>
      <button type="button" onClick={onBack} className={`mb-3 flex items-center gap-1 rounded text-(--text-muted) ${reportFocusClass}`}><ChevronLeft size={14} aria-hidden="true" />Creation tools</button>
      <h3 className="m-0 text-sm font-semibold">{report.title}</h3>
      <p className="mb-0 mt-1 text-(--text-muted)">{report.sourceNoteTitle} · {new Date(report.createdAt).toLocaleString()}</p>
      <p className="text-[10px] text-(--text-muted)">Learning Report · Saved snapshot of first answers, not progress history.</p>
      <div className="flex flex-wrap gap-3">{onOpenNote && <button type="button" onClick={() => void openSource()} className={`rounded underline ${reportFocusClass}`}>Open Source Note</button>}
        <button type="button" onClick={onRegenerate} className={`rounded underline ${reportFocusClass}`}>Regenerate Report</button></div>
      {sourceError && <p role="status">The source note is unavailable. This saved report remains readable.</p>}
    </header>
    <section aria-label="Performance overview" className="rounded-lg border border-(--border-subtle) bg-(--bg-secondary) p-3">
      <p className="m-0 text-2xl font-semibold">{performance.accuracy}% <span className="text-xs font-normal">Accuracy</span></p>
      <progress aria-label="Quiz accuracy" max={100} value={performance.accuracy || 0} className="my-2 h-1.5 w-full accent-(--interactive-accent)" />
      <p className="m-0">{performance.correct} correct · {performance.incorrect} incorrect · {performance.unanswered} unanswered</p>
      <p className="mb-0 mt-1 text-(--text-muted)">{performance.answered} answered / {performance.total} available questions. Accuracy uses answered questions only.</p>
      {performance.skippedQuizzes > 0 && <p className="text-(--text-muted)">Some invalid quiz records were excluded.</p>}
    </section>
    <section aria-label="Topic Breakdown"><h4 className="mb-2 text-[13px] font-medium">Topic Breakdown</h4><div className="space-y-2">
      {performance.topics.map(topic => <div key={topic.topic} className="rounded-lg border border-(--border-subtle) p-2.5">
        <p className="m-0 font-medium">{topic.topic}</p><p className="mb-0 mt-1">{topic.accuracy === null ? "No answers yet" : `${topic.accuracy}% · ${topic.correct}/${topic.answered} correct`}</p>
        <p className={`mb-0 mt-1 text-[10px] ${topic.priority === "Strong" ? "text-(--interactive-accent)" : "text-(--text-muted)"}`}>{topic.priority}</p>
        {topic.limitedEvidence && topic.answered > 0 && <p className="mb-0 mt-1 text-[10px] text-(--text-muted)">Limited evidence: only {topic.answered} answered {topic.answered === 1 ? "question" : "questions"}. This is not a mastery assessment.</p>}
      </div>)}
    </div></section>
    <section aria-label="Where to Focus"><h4 className="mb-2 text-[13px] font-medium">Where to Focus</h4>
      {focus.length ? focus.map(topic => { const advice = report.advice?.focus.find(item => item.topic === topic.topic); return <div key={topic.topic} className="mb-3 rounded-lg border border-(--border-subtle) p-2.5">
        <p className="m-0 font-medium">{topic.topic} — {topic.priority}</p><p className="mb-0 mt-1">{topic.correct} of {topic.answered} correct{topic.limitedEvidence ? " · limited evidence" : ""}</p>
        <p>{advice?.reason || "Review the saved incorrect questions and their correct-answer explanations."}</p>
        {advice && <><ul className="my-2 list-disc space-y-1 pl-4">{advice.concepts.map((concept, index) => <li key={index}>{concept}</li>)}</ul><p>{advice.action}</p><details><summary className={`cursor-pointer rounded text-(--text-muted) ${reportFocusClass}`}>Supporting note passage</summary><p className="whitespace-pre-wrap">{advice.sourceExcerpt}</p></details></>}
      </div>; }) : <p>No weaker topics among the answered questions. Answer remaining questions for more evidence.</p>}
    </section>
    <section aria-label="Study Advice"><h4 className="mb-2 text-[13px] font-medium">Study Advice</h4><p>{report.advice?.assessment || "Use the topic breakdown and recorded errors to guide your next review."}</p>
      <p className="text-[10px] text-(--text-muted)">{report.adviceMessage}</p>
      {report.evidenceTruncated && <p className="text-[10px] text-(--text-muted)">AI advice used a bounded portion of the note and quiz evidence. The statistics include all valid saved questions.</p>}
    </section>
    <section aria-label="Recommended Videos"><h4 className="mb-2 text-[13px] font-medium">Recommended Videos</h4>
      {report.videos.length ? <div className="space-y-3">{report.videos.map(video => <ReportVideo key={video.id} video={video} />)}</div>
        : <p className="text-(--text-muted)">{report.videoMessage || (report.videoStatus === "unavailable" ? VIDEO_UNAVAILABLE_MESSAGE : "No relevant videos were found for the priority topics.")}</p>}
    </section>
    <section aria-label="Strengths"><h4 className="mb-2 text-[13px] font-medium">Strengths</h4>{strengths.length ? strengths.map(topic => <div key={topic.topic} className="mb-2">
      <p className="mb-0 font-medium">{topic.topic} · {topic.accuracy}%</p><p className="mt-1">{report.advice?.strengths.find(item => item.topic === topic.topic)?.advice || "Strong performance on the answered questions. Continue reviewing to build evidence."}{topic.limitedEvidence ? " Evidence is limited by the small sample." : ""}</p>
    </div>) : <p>Keep practicing the focus topics; there is not yet enough performance evidence for a Strong topic.</p>}</section>
    <section aria-label="Suggested Study Plan"><h4 className="mb-2 text-[13px] font-medium">Suggested Study Plan</h4><ol className="list-decimal space-y-2 pl-5">
      {report.advice ? report.advice.studyPlan.map((item, index) => <li key={index}><span className="font-medium">{item.topic}:</span> {item.action}</li>)
        : (focus.length ? focus : strengths).map(topic => <li key={topic.topic}>Review {topic.topic} in the source note and check the saved question explanations.</li>)}
      <li>Answer remaining unanswered questions, then create a new report snapshot.</li>
    </ol></section>
    <section aria-label="Question Results"><h4 className="mb-2 text-[13px] font-medium">Question Results</h4>
      {performance.questions.map(question => <details key={JSON.stringify([question.commentId, question.questionId])} className="mb-2 rounded-lg border border-(--border-subtle) p-2.5">
        <summary className={`cursor-pointer rounded ${reportFocusClass}`}>{question.selectedIndex === null ? "Unanswered" : question.selectedIndex === question.correctIndex ? "Correct" : "Incorrect"} · {question.topic} · {question.question}</summary>
        {question.selectedIndex === null ? <p>Answer this question in the source note to see its feedback.</p> : <><p>Your answer: {question.options[question.selectedIndex]}</p><p>Correct answer: {question.options[question.correctIndex]}</p>
        {question.explanation && <p>{question.explanation}</p>}</>}
      </details>)}
    </section>
  </article>;
}
