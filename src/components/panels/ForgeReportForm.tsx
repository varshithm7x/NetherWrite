import { useEffect, useId, useRef, useState } from "react";
import { ChevronLeft, Loader2 } from "lucide-react";
import { ForgeNoteSource, useForgeNoteSource } from "./ForgeNoteSource";
import type { ForgeSourceContext, ForgeSourceNote } from "../../utils/forge-note-source";
import { readForgeSourceNote } from "../../utils/forge-note-source";
import { generateLearningReport, loadNoteQuizPerformance } from "../../utils/report-generation";
import { subscribeToComments } from "../../utils/commentsStore";
import { ForgeGenerationError } from "../../utils/forge-generation";
import { prioritizeForegroundGeneration } from "../../utils/background-priority";
import type { LearningReport, QuizPerformance } from "../../types/learning-reports";
import { YouTubeReportConnection } from "./YouTubeReportConnection";
import { learningVideoQueries, nativeYouTubeDiscovery } from "../../utils/learning-videos";
import { ForgeGenerationButton, useForgeGenerationFeedback } from "./ForgeGenerationBoundary";

interface ForgeReportFormProps extends ForgeSourceContext {
  initialSource?: ForgeSourceNote;
  onBack: () => void;
  onQuizzes: (note: ForgeSourceNote) => void;
  onCreated: (report: LearningReport) => void;
}
export const reportFocusClass = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--interactive-accent)";
export function ForgeReportForm(props: ForgeReportFormProps) {
  const beginFeedback = useForgeGenerationFeedback();
  const [title, setTitle] = useState("");
  const [generating, setGenerating] = useState(false);
  const [jobSource, setJobSource] = useState<ForgeSourceNote | null>(null);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<{ vaultPath: string; performance: QuizPerformance } | null>(null);
  const [checking, setChecking] = useState(false);
  const [readError, setReadError] = useState(false);
  const [includeVideos, setIncludeVideos] = useState(false);
  const sourceState = useForgeNoteSource(props, () => { setError(null); setTitle(""); });
  const live = useRef(props); live.current = props;
  const running = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  const releasePriority = useRef<(() => void) | null>(null);
  const titleId = useId();
  useEffect(() => {
    mounted.current = true;
    if (props.initialSource) sourceState.select(props.initialSource);
    return () => { mounted.current = false; running.current?.abort(); releasePriority.current?.(); };
  }, []);
  useEffect(() => { running.current?.abort(); releasePriority.current?.(); setError(null); setIncludeVideos(false); }, [props.vaultPath]);
  useEffect(() => {
    const notePath = sourceState.source?.path;
    const vaultPath = props.vaultPath;
    let cancelled = false;
    let version = 0;
    setResults(null); setReadError(false); setChecking(false);
    async function refresh() {
      if (!notePath || !vaultPath || !sourceState.available) return;
      const current = ++version;
      setChecking(true);
      try {
        if (!await readForgeSourceNote(notePath, vaultPath, () => live.current.readNoteContent)) return;
        const performance = await loadNoteQuizPerformance(vaultPath, notePath);
        if (!cancelled && current === version) { setResults({ vaultPath, performance }); setReadError(false); }
      } catch { if (!cancelled && current === version) { setResults(null); setReadError(true); } }
      finally { if (!cancelled && current === version) setChecking(false); }
    }
    void refresh();
    const unsubscribe = subscribeToComments(path => { if (path === notePath) void refresh(); });
    return () => { cancelled = true; unsubscribe(); };
  }, [props.vaultPath, sourceState.source?.path, sourceState.available]);
  const performance = results && results.vaultPath === props.vaultPath && results.performance.notePath === sourceState.source?.path ? results.performance : null;
  async function generate() {
    if (running.current || !performance?.answered || !sourceState.available || !sourceState.source || !props.vaultPath || sourceState.pendingSelection) return;
    const controller = new AbortController(); running.current = controller;
    const finishFeedback = beginFeedback();
    const stopFeedback = () => finishFeedback("cancelled");
    controller.signal.addEventListener("abort", stopFeedback, { once: true });
    const release = prioritizeForegroundGeneration(); releasePriority.current = release;
    const note = { ...sourceState.source }, vaultPath = props.vaultPath;
    setGenerating(true); setJobSource(note); setError(null); setProgress("Reading saved quiz results…");
    try {
      const report = await generateLearningReport({ note, vaultPath, title, signal: controller.signal,
        videoDiscovery: includeVideos ? nativeYouTubeDiscovery() : undefined,
        videoQueries: includeVideos ? learningVideoQueries(performance) : undefined,
        videosRequested: includeVideos,
        isSourceAvailable: () => mounted.current && live.current.vaultPath === vaultPath && (live.current.notes || []).some(item => item.path === note.path),
        readNote: path => readForgeSourceNote(path, vaultPath, () => live.current.readNoteContent),
        onProgress: message => { if (mounted.current && live.current.vaultPath === vaultPath) setProgress(message); } });
      if (mounted.current && !controller.signal.aborted && live.current.vaultPath === vaultPath) { finishFeedback("success"); live.current.onCreated(report); }
    } catch (failure) {
      finishFeedback(controller.signal.aborted ? "cancelled" : "error");
      if (mounted.current && live.current.vaultPath === vaultPath) setError(failure instanceof ForgeGenerationError ? failure.message : "Report generation failed. Please retry.");
    } finally {
      controller.signal.removeEventListener("abort", stopFeedback);
      finishFeedback("cancelled");
      release(); if (releasePriority.current === release) releasePriority.current = null;
      if (running.current === controller) running.current = null;
      if (mounted.current) { setGenerating(false); setJobSource(null); setProgress(""); }
    }
  }
  return <div className="min-w-0 text-xs">
    <button type="button" onClick={props.onBack} className={`mb-3 flex items-center gap-1 rounded text-(--text-muted) ${reportFocusClass}`}><ChevronLeft size={14} aria-hidden="true" />Creation tools</button>
    <h3 className="m-0 text-[13px] font-medium">Learning Reports</h3>
    <form className="mt-3 space-y-3" onSubmit={event => { event.preventDefault(); void generate(); }}>
      <ForgeNoteSource state={sourceState} disabled={generating} displayedSource={generating ? jobSource : sourceState.source} />
      <label htmlFor={titleId} className="block">Report title (optional)
        <input id={titleId} value={title} maxLength={300} disabled={generating} placeholder={`${sourceState.source?.name || "Note"} Learning Report`}
          onChange={event => setTitle(event.target.value)} className={`mt-1.5 w-full min-w-0 rounded-md border border-(--border-medium) bg-(--bg-secondary) px-2.5 py-2 ${reportFocusClass}`} />
      </label>
      <div role="status" aria-live="polite">
        {checking ? <p>Reading quiz results…</p> : readError ? <p className="text-(--text-error)">The source note or quiz results are unavailable. Re-select the note and retry.</p>
          : performance?.answered ? <><p>{performance.answered} answered questions across {performance.topics.filter(topic => topic.answered).length} topics</p>
            <p className="text-(--text-muted)">{performance.accuracy}% accuracy · {performance.correct} correct · {performance.incorrect} incorrect · {performance.unanswered} unanswered</p></>
          : sourceState.available ? <><p className="font-medium">No quiz results yet</p><p>Answer some quiz questions in this note to generate your learning report.</p>
            <button type="button" onClick={() => props.onQuizzes(sourceState.source!)} className={`rounded underline ${reportFocusClass}`}>Open Quizzes</button></> : null}
      </div>
      <p className="text-[10px] leading-relaxed text-(--text-muted)">Scores use your saved first selections. Only this note’s bounded content and quiz performance are sent to your configured AI provider for study advice. Reports also work when AI is unavailable.</p>
      <YouTubeReportConnection disabled={generating} enabled={includeVideos} queries={performance ? learningVideoQueries(performance) : []} onEnabledChange={setIncludeVideos} />
      <ForgeGenerationButton><button type="submit" disabled={generating || checking || !performance?.answered || !sourceState.available || sourceState.pendingSelection}
        className={`flex w-full items-center justify-center gap-2 rounded-md border border-(--border-medium) bg-(--bg-active) px-3 py-2 font-medium hover:bg-(--bg-hover) disabled:cursor-not-allowed disabled:opacity-50 ${reportFocusClass}`}>
        {generating && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}{generating ? "Generating…" : "Generate Learning Report"}
      </button></ForgeGenerationButton>
      {generating && <button type="button" onClick={() => running.current?.abort()} className={`rounded ${reportFocusClass}`}>Cancel generation</button>}
    </form>
    <div role="status" aria-live="polite" className="mt-3 leading-relaxed">{generating && <p>{progress}</p>}{error && <p className="text-(--text-error)">{error}</p>}</div>
  </div>;
}
