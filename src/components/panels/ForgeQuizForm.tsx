import { useEffect, useId, useRef, useState } from "react";
import { ChevronLeft, Loader2 } from "lucide-react";
import { getAPI } from "../../utils/api";
import { DEFAULT_QUIZ_QUESTIONS, MAX_QUIZ_QUESTIONS, MIN_QUIZ_QUESTIONS, generateNoteQuiz, QuizGenerationError } from "../../utils/quiz-generation";
import type { QuizGenerationResult, QuizSourceNote } from "../../utils/quiz-generation";
import { readForgeSourceNote } from "../../utils/forge-note-source";
import type { ForgeSourceContext } from "../../utils/forge-note-source";
import { ForgeNoteSource, useForgeNoteSource } from "./ForgeNoteSource";
import { ForgeGenerationButton, useForgeGenerationFeedback } from "./ForgeGenerationBoundary";

export type ForgeQuizContext = ForgeSourceContext;

interface ForgeQuizFormProps extends ForgeQuizContext {
  onBack: () => void;
}

const focusClass = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--interactive-accent)";
const inputClass = `w-full min-w-0 rounded-md border border-(--border-medium) bg-(--bg-secondary) px-2.5 py-2 text-xs text-(--text-primary) ${focusClass}`;

export function ForgeQuizForm(props: ForgeQuizFormProps) {
  const { notes = [], vaultPath } = props;
  const beginFeedback = useForgeGenerationFeedback();
  const [count, setCount] = useState(String(DEFAULT_QUIZ_QUESTIONS));
  const [generating, setGenerating] = useState(false);
  const [jobSource, setJobSource] = useState<QuizSourceNote | null>(null);
  const [result, setResult] = useState<QuizGenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);
  const propsRef = useRef(props);
  propsRef.current = props;
  const running = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  const listId = useId();
  const sourceState = useForgeNoteSource(props, () => { setResult(null); setError(null); });
  const { source, available, pendingSelection } = sourceState;
  const validCount = Number.isInteger(Number(count)) && Number(count) >= MIN_QUIZ_QUESTIONS && Number(count) <= MAX_QUIZ_QUESTIONS;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      running.current?.abort();
    };
  }, []);

  useEffect(() => {
    running.current?.abort();
    setResult(null);
    setError(null);
  }, [vaultPath]);

  async function generate() {
    if (running.current || !source || !available || !vaultPath || !validCount || pendingSelection) return;
    const controller = new AbortController();
    running.current = controller;
    const finishFeedback = beginFeedback();
    const stopFeedback = () => finishFeedback("cancelled");
    controller.signal.addEventListener("abort", stopFeedback, { once: true });
    setGenerating(true);
    setJobSource(source);
    setResult(null);
    setError(null);
    const note = { ...source };
    const sourceVault = vaultPath;
    const timeout = setTimeout(() => controller.abort(), 180_000);
    try {
      const generated = await generateNoteQuiz({
        vaultPath: sourceVault, note, count: Number(count), signal: controller.signal,
        isSourceAvailable: () => mounted.current && propsRef.current.vaultPath === sourceVault
          && (propsRef.current.notes || []).some(candidate => candidate.path === note.path),
        readNote: path => readForgeSourceNote(path, sourceVault, () => propsRef.current.readNoteContent),
      });
      if (mounted.current && !controller.signal.aborted && propsRef.current.vaultPath === sourceVault) {
        finishFeedback("success");
        setResult(generated);
      }
    } catch (failure) {
      finishFeedback(controller.signal.aborted ? "cancelled" : "error");
      if (mounted.current && propsRef.current.vaultPath === sourceVault) {
        setError(failure instanceof QuizGenerationError ? failure.message : "Quiz generation failed. Please retry or check AI Settings.");
      }
    } finally {
      clearTimeout(timeout);
      controller.signal.removeEventListener("abort", stopFeedback);
      finishFeedback("cancelled");
      if (running.current === controller) running.current = null;
      if (mounted.current) { setGenerating(false); setJobSource(null); }
    }
  }

  async function openSource() {
    if (!result || !props.onOpenNote || opening) return;
    setOpening(true);
    try {
      if (!notes.some(note => note.path === result.note.path) || !await getAPI().fileExists(result.note.path)) throw new Error("Unavailable note");
      await props.onOpenNote(result.note.path);
    } catch { setError("The source note is no longer available. Locate it in your vault."); }
    finally { if (mounted.current) setOpening(false); }
  }

  const displayedSource = generating ? jobSource : source;
  return (
    <div className="min-w-0 text-xs">
      <button type="button" onClick={props.onBack} className={`mb-3 flex items-center gap-1 rounded text-(--text-muted) hover:text-(--text-primary) ${focusClass}`}>
        <ChevronLeft size={14} aria-hidden="true" /> Creation tools
      </button>
      <h3 className="m-0 text-[13px] font-medium">Quizzes</h3>
      <form className="mt-3 space-y-3" onSubmit={event => { event.preventDefault(); void generate(); }}>
        <ForgeNoteSource state={sourceState} disabled={generating} displayedSource={displayedSource} />
        <div>
          <label htmlFor={`${listId}-count`} className="mb-1.5 block font-medium">Number of questions</label>
          <input id={`${listId}-count`} aria-label="Number of questions" type="number" min={MIN_QUIZ_QUESTIONS} max={MAX_QUIZ_QUESTIONS} step={1} value={count} disabled={generating} onChange={event => setCount(event.target.value)} className={inputClass} />
          <p className="mb-0 mt-1.5 text-[10px] leading-relaxed text-(--text-muted)">Total across all topics, up to {MAX_QUIZ_QUESTIONS}. Fewer may be created when evidence is limited.</p>
        </div>
        <p className="m-0 text-[10px] leading-relaxed text-(--text-muted)">Only this note is sent to your configured AI provider. Long notes may use only their beginning; coverage is reported after generation.</p>
        <ForgeGenerationButton><button type="submit" disabled={generating || !available || !vaultPath || !validCount || pendingSelection} className={`flex w-full items-center justify-center gap-2 rounded-md border border-(--border-medium) bg-(--bg-active) px-3 py-2 font-medium hover:bg-(--bg-hover) disabled:cursor-not-allowed disabled:opacity-50 ${focusClass}`}>
          {generating && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}{generating ? "Generating…" : "Generate Quiz"}
        </button></ForgeGenerationButton>
        {generating && <button type="button" onClick={() => running.current?.abort()} className={`rounded text-(--text-muted) ${focusClass}`}>Cancel generation</button>}
      </form>
      <div role="status" aria-live="polite" className="mt-3 text-xs leading-relaxed">
        {error && <p className="m-0 text-(--text-error)">{error}</p>}
        {result && <>
          <p className="m-0 font-medium">Quiz created</p>
          <p className="mb-0 mt-1">{result.questionCount} questions across {result.comments.length} {result.comments.length === 1 ? "topic" : "topics"} in {result.note.name}.</p>
          {result.questionCount < result.requestedCount && <p className="mb-0 mt-1 text-(--text-muted)">Created fewer than requested to avoid unsupported questions.</p>}
          {result.truncated && <p className="mb-0 mt-1 text-(--text-muted)">Used only the beginning of the note within the model request budget. This quiz does not cover the complete note.</p>}
          {props.onOpenNote && <button type="button" disabled={opening} onClick={() => void openSource()} className={`mt-2 rounded border border-(--border-medium) px-2.5 py-1.5 hover:bg-(--bg-hover) ${focusClass}`}>Open Note</button>}
        </>}
      </div>
    </div>
  );
}
