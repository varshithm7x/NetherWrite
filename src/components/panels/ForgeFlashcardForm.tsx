import { useEffect, useId, useRef, useState } from "react";
import { ChevronLeft, Loader2 } from "lucide-react";
import { ForgeNoteSource, useForgeNoteSource } from "./ForgeNoteSource";
import { readForgeSourceNote } from "../../utils/forge-note-source";
import type { ForgeSourceContext, ForgeSourceNote } from "../../utils/forge-note-source";
import { DEFAULT_FLASHCARD_COUNT, MIN_FLASHCARD_COUNT, MAX_FLASHCARD_COUNT, generateFlashcardDeck } from "../../utils/flashcard-generation";
import { ForgeGenerationError } from "../../utils/forge-generation";
import type { FlashcardDeck } from "../../types/flashcards";
import { prioritizeForegroundGeneration } from "../../utils/background-priority";
import { ForgeGenerationButton, useForgeGenerationFeedback } from "./ForgeGenerationBoundary";

interface ForgeFlashcardFormProps extends ForgeSourceContext {
  onBack: () => void;
  onCreated: (deck: FlashcardDeck) => void;
}
const focusClass = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--interactive-accent)";

export function ForgeFlashcardForm(props: ForgeFlashcardFormProps) {
  const beginFeedback = useForgeGenerationFeedback();
  const [count, setCount] = useState(String(DEFAULT_FLASHCARD_COUNT));
  const [generating, setGenerating] = useState(false);
  const [jobSource, setJobSource] = useState<ForgeSourceNote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState("");
  const sourceState = useForgeNoteSource(props, () => setError(null));
  const propsRef = useRef(props);
  propsRef.current = props;
  const running = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  const releasePriority = useRef<(() => void) | null>(null);
  const countId = useId();
  const validCount = Number.isInteger(Number(count)) && Number(count) >= MIN_FLASHCARD_COUNT && Number(count) <= MAX_FLASHCARD_COUNT;
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; running.current?.abort(); releasePriority.current?.(); };
  }, []);
  useEffect(() => { running.current?.abort(); releasePriority.current?.(); setError(null); }, [props.vaultPath]);

  async function generate() {
    if (running.current || !sourceState.source || !sourceState.available || !props.vaultPath || !validCount || sourceState.pendingSelection) return;
    const controller = new AbortController();
    running.current = controller;
    const finishFeedback = beginFeedback();
    const stopFeedback = () => finishFeedback("cancelled");
    controller.signal.addEventListener("abort", stopFeedback, { once: true });
    const release = prioritizeForegroundGeneration();
    releasePriority.current = release;
    const note = { ...sourceState.source };
    const vaultPath = props.vaultPath;
    setGenerating(true); setJobSource(note); setError(null); setProgress("Reading selected note…");
    let timedOut = false;
    const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, 180_000);
    try {
      const deck = await generateFlashcardDeck({
        note, vaultPath, count: Number(count), signal: controller.signal,
        isSourceAvailable: () => mounted.current && propsRef.current.vaultPath === vaultPath
          && (propsRef.current.notes || []).some(candidate => candidate.path === note.path),
        readNote: path => readForgeSourceNote(path, vaultPath, () => propsRef.current.readNoteContent),
        onProgress: message => { if (mounted.current && propsRef.current.vaultPath === vaultPath) setProgress(message); },
      });
      if (mounted.current && !controller.signal.aborted && propsRef.current.vaultPath === vaultPath) {
        finishFeedback("success");
        propsRef.current.onCreated(deck);
      }
    } catch (failure) {
      finishFeedback(controller.signal.aborted ? "cancelled" : "error");
      if (mounted.current && propsRef.current.vaultPath === vaultPath) setError(timedOut ? "Flashcard generation timed out. Please retry."
        : failure instanceof ForgeGenerationError ? failure.message : "Flashcard generation failed. Please retry or check AI Settings.");
    } finally {
      clearTimeout(timeout);
      controller.signal.removeEventListener("abort", stopFeedback);
      finishFeedback("cancelled");
      release();
      if (releasePriority.current === release) releasePriority.current = null;
      if (running.current === controller) running.current = null;
      if (mounted.current) { setGenerating(false); setJobSource(null); setProgress(""); }
    }
  }

  return (
    <div className="min-w-0 text-xs">
      <button type="button" onClick={props.onBack} className={`mb-3 flex items-center gap-1 rounded text-(--text-muted) hover:text-(--text-primary) ${focusClass}`}><ChevronLeft size={14} aria-hidden="true" /> Creation tools</button>
      <h3 className="m-0 text-[13px] font-medium">Flashcards</h3>
      <form className="mt-3 space-y-3" onSubmit={event => { event.preventDefault(); void generate(); }}>
        <ForgeNoteSource state={sourceState} disabled={generating} displayedSource={generating ? jobSource : sourceState.source} />
        <div>
          <label htmlFor={countId} className="mb-1.5 block font-medium">Number of flashcards</label>
          <input id={countId} aria-label="Number of flashcards" type="number" min={MIN_FLASHCARD_COUNT} max={MAX_FLASHCARD_COUNT} step={1} value={count} disabled={generating}
            onChange={event => setCount(event.target.value)} className={`w-full min-w-0 rounded-md border border-(--border-medium) bg-(--bg-secondary) px-2.5 py-2 text-xs text-(--text-primary) ${focusClass}`} />
          <p className="mb-0 mt-1.5 text-[10px] leading-relaxed text-(--text-muted)">Up to {MAX_FLASHCARD_COUNT} cards. Fewer may be created when evidence is limited.</p>
        </div>
        <p className="m-0 text-[10px] leading-relaxed text-(--text-muted)">Only this note is sent to your configured AI provider. Long notes may use only their beginning; coverage is reported with the saved deck.</p>
        <ForgeGenerationButton><button type="submit" disabled={generating || !sourceState.available || !props.vaultPath || !validCount || sourceState.pendingSelection}
          className={`flex w-full items-center justify-center gap-2 rounded-md border border-(--border-medium) bg-(--bg-active) px-3 py-2 font-medium hover:bg-(--bg-hover) disabled:cursor-not-allowed disabled:opacity-50 ${focusClass}`}>
          {generating && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}{generating ? "Generating…" : "Generate Flashcards"}
        </button></ForgeGenerationButton>
        {generating && <button type="button" onClick={() => running.current?.abort()} className={`rounded text-(--text-muted) ${focusClass}`}>Cancel generation</button>}
      </form>
      <div role="status" aria-live="polite" className="mt-3 text-xs leading-relaxed">
        {generating && <p className="m-0 text-(--text-muted)">{progress}</p>}
        {error && <p className="m-0 text-(--text-error)">{error}</p>}
      </div>
    </div>
  );
}
