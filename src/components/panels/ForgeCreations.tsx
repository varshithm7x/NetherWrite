import type { ReactNode } from "react";
import { useEffect, useId, useRef, useState } from "react";
import { FileText, GalleryVerticalEnd, Layers, MoreHorizontal } from "lucide-react";
import type { LearningReport } from "../../types/learning-reports";
import type { FlashcardDeck } from "../../types/flashcards";

interface ForgeCreationsProps {
  children?: ReactNode;
  hasOtherCreations?: boolean;
  decks: FlashcardDeck[];
  reports?: LearningReport[];
  onOpenReport?: (report: LearningReport) => void;
  onDeleteReport?: (id: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  skipped: number;
  onRetry: () => void;
  onOpen: (deck: FlashcardDeck) => void;
  onDelete: (deckId: string) => Promise<void>;
}
const focusClass = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--interactive-accent)";

export function ForgeCreations({ decks, loading, error, skipped, onRetry, onOpen, onDelete, children, hasOtherCreations, reports = [], onOpenReport, onDeleteReport }: ForgeCreationsProps) {
  const entries: (FlashcardDeck | LearningReport)[] = [...decks, ...reports].sort((a, b) => b.createdAt - a.createdAt);
  function open(entry: FlashcardDeck | LearningReport) { if (entry.type === "flashcards") onOpen(entry); else onOpenReport?.(entry); }
  const [menu, setMenu] = useState<string | null>(null);
  const [pending, setPending] = useState<FlashcardDeck | LearningReport | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const busy = useRef(false);
  const menuRoot = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const cancelButton = useRef<HTMLButtonElement>(null);
  const confirmId = useId();
  useEffect(() => {
    if (!menu) return;
    menuRoot.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus();
    const close = (event: PointerEvent) => { if (!menuRoot.current?.contains(event.target as Node) && !trigger.current?.contains(event.target as Node)) setMenu(null); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [menu]);
  useEffect(() => { if (pending) cancelButton.current?.focus(); }, [pending]);
  async function remove() {
    if (!pending || busy.current) return;
    busy.current = true; setDeleting(true); setDeleteError(null);
    try { if (pending.type === "flashcards") await onDelete(pending.id); else if (onDeleteReport) await onDeleteReport(pending.id); else throw new Error("Missing delete action"); setPending(null); }
    catch { setDeleteError("Could not delete this creation. It remains saved; please retry."); }
    finally { busy.current = false; setDeleting(false); }
  }
  return (
    <section aria-labelledby="forge-creations-title" className="mt-5 min-w-0 border-t border-(--border-subtle) pt-4">
      <h3 id="forge-creations-title" className="m-0 text-[13px] font-medium">Your Creations</h3>
      {loading && <p role="status" className="mb-0 mt-2 text-xs text-(--text-muted)">Loading saved decks…</p>}
      {error && <div role="status" className="mt-2 text-xs text-(--text-muted)"><p className="m-0">{error}</p><button type="button" onClick={onRetry} className={`mt-1 rounded underline ${focusClass}`}>Retry</button></div>}
      {skipped > 0 && <p role="status" className="mb-0 mt-2 text-xs text-(--text-muted)">Some saved decks could not be loaded. Their stored data was preserved.</p>}
      {entries.length ? (
        <ul className="m-0 mt-2 list-none space-y-2 p-0">
          {entries.map(deck => (
            <li key={`${deck.type}:${deck.id}`} className="min-w-0 rounded-lg border border-(--border-subtle) bg-(--bg-secondary) p-2">
              <div className="flex min-w-0 items-start gap-2">
                <button type="button" onClick={() => open(deck)} className={`flex min-w-0 flex-1 items-start gap-2 rounded text-left hover:text-(--text-primary) ${focusClass}`}>
                  <span className="mt-0.5 shrink-0">{deck.type === "flashcards" ? <Layers size={16} className="text-(--interactive-accent)" aria-hidden="true" /> : <FileText size={16} className="text-(--interactive-accent)" aria-hidden="true" />}</span>
                  <span className="min-w-0"><span className="block break-words text-xs font-medium">{deck.title}</span>
                    <span className="mt-1 block text-[10px] text-(--text-muted)">{deck.type === "flashcards" ? `Flashcards · ${deck.cards.length} ${deck.cards.length === 1 ? "card" : "cards"}` : `Learning Report · ${deck.performance.accuracy}% accuracy`}</span>
                    <span className="mt-0.5 block break-all text-[10px] text-(--text-muted)">{deck.sourceNotePath}</span>
                  </span>
                </button>
                <button type="button" aria-label={`Actions for ${deck.title}`} aria-haspopup="menu" aria-expanded={menu === `${deck.type}:${deck.id}`}
                  onClick={event => { trigger.current = event.currentTarget; setMenu(current => current === `${deck.type}:${deck.id}` ? null : `${deck.type}:${deck.id}`); }}
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded text-(--text-muted) hover:bg-(--bg-hover) ${focusClass}`}><MoreHorizontal size={15} aria-hidden="true" /></button>
              </div>
              {menu === `${deck.type}:${deck.id}` && <div ref={menuRoot} role="menu" aria-label={`${deck.type === "flashcards" ? "Deck" : "Report"} actions for ${deck.title}`} className="mt-2 flex gap-2 border-t border-(--border-subtle) pt-2"
                onKeyDown={event => {
                  if (event.key === "Escape") { event.preventDefault(); setMenu(null); trigger.current?.focus(); }
                  else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                    event.preventDefault(); const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')];
                    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
                    buttons[(index + (event.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length]?.focus();
                  }
                }}>
                <button type="button" role="menuitem" onClick={() => { setMenu(null); open(deck); }} className={`rounded px-2 py-1 text-xs hover:bg-(--bg-hover) ${focusClass}`}>Open</button>
                <button type="button" role="menuitem" onClick={() => { setMenu(null); setPending(deck); setDeleteError(null); }} className={`rounded px-2 py-1 text-xs text-(--text-error) hover:bg-(--bg-hover) ${focusClass}`}>Delete</button>
              </div>}
            </li>
          ))}
        </ul>
      ) : !loading && !hasOtherCreations && <div className="flex min-h-36 flex-col items-center justify-center gap-3 py-6 text-center text-(--text-muted)"><GalleryVerticalEnd size={24} aria-hidden="true" /><p className="m-0 text-xs leading-relaxed">Your generated content will appear here.</p></div>}
      {children}
      {pending && <div role="alertdialog" aria-labelledby={confirmId} className="mt-3 rounded-lg border border-(--border-medium) bg-(--bg-secondary) p-3 text-xs"
        onKeyDown={event => { if (event.key === "Escape" && !deleting) { event.preventDefault(); event.stopPropagation(); setPending(null); trigger.current?.focus(); } }}>
        <p id={confirmId} className="m-0 break-words font-medium">Delete “{pending.title}”?</p>
        <p className="mb-0 mt-1 text-(--text-muted)">This removes the saved {pending.type === "flashcards" ? "deck" : "report"}. Its source note and quiz answers are kept.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button ref={cancelButton} type="button" disabled={deleting} onClick={() => { setPending(null); trigger.current?.focus(); }} className={`rounded border border-(--border-medium) px-2 py-1 ${focusClass}`}>Cancel</button>
          <button type="button" disabled={deleting} onClick={() => void remove()} className={`rounded border border-(--border-medium) px-2 py-1 text-(--text-error) disabled:opacity-50 ${focusClass}`}>{deleting ? "Deleting…" : pending.type === "flashcards" ? "Delete deck" : "Delete report"}</button>
        </div>
        {deleteError && <p role="status" className="mb-0 mt-2 text-(--text-error)">{deleteError}</p>}
      </div>}
    </section>
  );
}
