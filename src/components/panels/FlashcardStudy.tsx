import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getAPI } from "../../utils/api";
import type { FlashcardDeck } from "../../types/flashcards";

interface FlashcardStudyProps {
  deck: FlashcardDeck;
  onBack: () => void;
  onOpenNote?: (path: string) => void | Promise<void>;
  notice?: string | null;
}
const focusClass = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--interactive-accent)";

export function FlashcardStudy({ deck, onBack, onOpenNote, notice }: FlashcardStudyProps) {
  const [page, setPage] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [sourceError, setSourceError] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);
  const titleId = useId();
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const index = Math.min(page, deck.cards.length - 1);
  const card = deck.cards[index];
  const cardButton = useRef<HTMLButtonElement>(null);
  useLayoutEffect(() => { if (cardButton.current) cardButton.current.scrollTop = 0; }, [index, flipped]);
  function navigate(next: number) {
    if (next < 0 || next >= deck.cards.length || next === index) return;
    setPage(next); setFlipped(false);
  }
  async function openSource() {
    if (!onOpenNote || opening) return;
    setOpening(true);
    try {
      const api = getAPI();
      if (await api.getVaultPath() !== deck.vaultPath || !await api.fileExists(deck.sourceNotePath)) throw new Error("Missing source");
      if (!mounted.current || await api.getVaultPath() !== deck.vaultPath) return;
      await onOpenNote(deck.sourceNotePath);
      if (mounted.current) setSourceError(null);
    } catch { if (mounted.current) setSourceError("The source note is unavailable. You can still study this saved deck."); }
    finally { if (mounted.current) setOpening(false); }
  }

  return (
    <section tabIndex={0} aria-labelledby={titleId} className={`min-w-0 rounded text-xs ${focusClass}`}
      onKeyDown={event => {
        if (!event.currentTarget.contains(document.activeElement)) return;
        const target = event.target as HTMLElement;
        if (target.closest("input,textarea,[contenteditable=true]")) return;
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault(); event.stopPropagation(); navigate(index + (event.key === "ArrowLeft" ? -1 : 1));
        } else if ((event.key === " " || event.key === "Enter") && (target === event.currentTarget || target.closest("[data-flashcard-flip]"))) {
          event.preventDefault(); event.stopPropagation(); setFlipped(value => !value);
        }
      }}>
      <button type="button" onClick={onBack} className={`mb-3 flex items-center gap-1 rounded text-(--text-muted) hover:text-(--text-primary) ${focusClass}`}><ChevronLeft size={14} aria-hidden="true" /> Back to Forge</button>
      <h3 id={titleId} className="m-0 break-words text-[13px] font-medium">{deck.title}</h3>
      <p className="mb-0 mt-1 text-[10px] text-(--text-muted)">{deck.cards.length} {deck.cards.length === 1 ? "card" : "cards"}</p>
      {onOpenNote ? <button type="button" disabled={opening} onClick={() => void openSource()} className={`mt-1 max-w-full break-all rounded text-left text-[10px] text-(--text-muted) hover:text-(--text-primary) ${focusClass}`}>Source: {deck.sourceNotePath}</button>
        : <p className="mb-0 mt-1 break-all text-[10px] text-(--text-muted)">Source: {deck.sourceNotePath}</p>}
      {notice && <p role="status" className="mb-0 mt-2 text-xs text-(--text-secondary)">{notice}</p>}
      {deck.cards.length < deck.requestedCount && <p className="mb-0 mt-1 text-[10px] text-(--text-muted)">Created {deck.cards.length} of {deck.requestedCount} requested cards.</p>}
      {deck.sourceTruncated && <p className="mb-0 mt-1 text-[10px] leading-relaxed text-(--text-muted)">This deck uses only the beginning of its source note, within the model request budget.</p>}
      <button ref={cardButton} type="button" data-flashcard-flip aria-describedby={`${titleId}-content`} aria-label={flipped ? "Flashcard answer; click to return to question" : "Flashcard question; click to reveal answer"} aria-pressed={flipped}
        onClick={() => setFlipped(value => !value)} className={`mt-4 block max-h-[min(60vh,440px)] min-h-56 w-full min-w-0 overflow-y-auto rounded-xl border border-(--border-medium) bg-(--bg-secondary) px-4 py-5 text-center transition-colors duration-150 hover:border-(--border-strong) ${focusClass}`}>
        <span className="flex min-h-44 flex-col items-center justify-center gap-4">
          <span className="text-[10px] font-medium text-(--text-muted)">{flipped ? "Answer" : "Question"}</span>
          <span id={`${titleId}-content`} className="w-full break-words whitespace-pre-wrap text-[13px] leading-relaxed text-(--text-primary) [overflow-wrap:anywhere]">{flipped ? card.back : card.front}</span>
          <span className="text-[10px] text-(--text-muted)">{flipped ? "Click to return to question" : "Click to reveal answer"}</span>
        </span>
      </button>
      <div className="mt-3 flex items-center justify-between text-xs text-(--text-muted)">
        <button type="button" aria-label="Previous flashcard" disabled={index === 0} onClick={() => navigate(index - 1)} className={`flex h-7 w-7 items-center justify-center rounded hover:bg-(--bg-hover) disabled:opacity-40 ${focusClass}`}><ChevronLeft size={16} aria-hidden="true" /></button>
        <span aria-label="Flashcard pagination" aria-live="polite">{index + 1} / {deck.cards.length}</span>
        <button type="button" aria-label="Next flashcard" disabled={index === deck.cards.length - 1} onClick={() => navigate(index + 1)} className={`flex h-7 w-7 items-center justify-center rounded hover:bg-(--bg-hover) disabled:opacity-40 ${focusClass}`}><ChevronRight size={16} aria-hidden="true" /></button>
      </div>
      {sourceError && <p role="status" className="mb-0 mt-2 text-xs text-(--text-muted)">{sourceError}</p>}
    </section>
  );
}
