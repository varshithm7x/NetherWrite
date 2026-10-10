import { Blocks, ChartColumn, FileText, Layers, ListChecks, Network, PanelRightClose, Presentation } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ForgeQuizForm } from "./ForgeQuizForm";
import type { ForgeQuizContext } from "./ForgeQuizForm";
import { ForgeFlashcardForm } from "./ForgeFlashcardForm";
import { FlashcardStudy } from "./FlashcardStudy";
import { ForgeCreations } from "./ForgeCreations";
import { deleteFlashcardDeck, FLASHCARDS_CHANGED_EVENT, loadFlashcardDecks } from "../../utils/flashcardsStore";
import type { FlashcardDeck } from "../../types/flashcards";

const FORGE_TOOLS = [
  { title: "Slides", description: "Presentation generation", icon: Presentation },
  { title: "Mind Map", description: "Visual knowledge mapping", icon: Network },
  { title: "Reports", description: "Structured document generation", icon: FileText },
  { title: "Flashcards", description: "Learning and revision cards", icon: Layers },
  { title: "Quizzes", description: "Knowledge assessment", icon: ListChecks },
  { title: "Infographics", description: "Visual information summaries", icon: ChartColumn },
];

interface ForgePanelProps extends ForgeQuizContext {
  onClose?: () => void;
}
type ForgeView = "tools" | "quiz" | "flashcards" | `deck:${string}`;

export function ForgePanel({ onClose, ...quizContext }: ForgePanelProps) {
  const [view, setView] = useState<ForgeView>("tools");
  const [library, setLibrary] = useState<{ vaultPath: string | null; decks: FlashcardDeck[]; skipped: number }>({ vaultPath: null, decks: [], skipped: 0 });
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const vaultRef = useRef(quizContext.vaultPath);
  vaultRef.current = quizContext.vaultPath;
  const loadVersion = useRef(0);
  const mounted = useRef(true);
  const decks = library.vaultPath === quizContext.vaultPath ? library.decks : [];
  const selectedDeck = decks.find(deck => `deck:${deck.id}` === view);
  async function reload() {
    const vaultPath = vaultRef.current;
    if (!vaultPath) return;
    const version = ++loadVersion.current;
    setLoading(true); setLoadError(null);
    try {
      const loaded = await loadFlashcardDecks(vaultPath);
      if (mounted.current && vaultRef.current === vaultPath && version === loadVersion.current) setLibrary({ vaultPath, ...loaded });
    } catch {
      if (mounted.current && vaultRef.current === vaultPath && version === loadVersion.current) setLoadError("Saved flashcards could not be loaded. Please retry.");
    } finally {
      if (mounted.current && vaultRef.current === vaultPath && version === loadVersion.current) setLoading(false);
    }
  }
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; loadVersion.current++; };
  }, []);
  useEffect(() => {
    loadVersion.current++;
    setView(current => current === "quiz" ? current : "tools"); setNotice(null); setLoadError(null); setLoading(false);
    setLibrary({ vaultPath: quizContext.vaultPath || null, decks: [], skipped: 0 });
    void reload();
    const changed = (event: Event) => {
      if ((event as CustomEvent<{ vaultPath: string }>).detail?.vaultPath === vaultRef.current) void reload();
    };
    window.addEventListener(FLASHCARDS_CHANGED_EVENT, changed);
    return () => window.removeEventListener(FLASHCARDS_CHANGED_EVENT, changed);
  }, [quizContext.vaultPath]);
  function openDeck(deck: FlashcardDeck) { setNotice(null); setView(`deck:${deck.id}`); }
  function created(deck: FlashcardDeck) {
    if (deck.vaultPath !== vaultRef.current) return;
    setLibrary(current => ({ vaultPath: deck.vaultPath, skipped: current.vaultPath === deck.vaultPath ? current.skipped : 0,
      decks: [deck, ...(current.vaultPath === deck.vaultPath ? current.decks.filter(saved => saved.id !== deck.id) : [])] }));
    setNotice(`Created ${deck.cards.length} ${deck.cards.length === 1 ? "flashcard" : "flashcards"} from ${deck.sourceNoteTitle}.`);
    setView(`deck:${deck.id}`);
  }
  async function removeDeck(id: string) {
    const vaultPath = vaultRef.current;
    if (!vaultPath) throw new Error("No vault open");
    await deleteFlashcardDeck(vaultPath, id);
    if (!mounted.current || vaultRef.current !== vaultPath) return;
    setLibrary(current => ({ ...current, decks: current.decks.filter(deck => deck.id !== id) }));
    if (view === `deck:${id}`) { setView("tools"); setNotice(null); }
  }
  return (
    <section aria-labelledby="forge-title" className="flex h-full min-h-0 min-w-0 flex-col bg-(--bg-primary) text-(--text-primary)">
      <header className="shrink-0 px-4 pb-3 pt-4">
        <div className="flex items-center justify-between gap-2">
          <h2 id="forge-title" className="m-0 flex items-center gap-2 text-[15px] font-semibold tracking-[-0.015em]">
            <Blocks size={18} className="text-(--interactive-accent)" aria-hidden="true" />
            Forge
          </h2>
          <button
            type="button"
            aria-label="Close Forge sidebar"
            onClick={onClose}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[5px] text-(--text-muted) transition-colors duration-150 hover:bg-(--bg-active) hover:text-(--text-primary) focus-visible:outline-2 focus-visible:outline-(--interactive-accent)"
          >
            <PanelRightClose size={16} aria-hidden="true" />
          </button>
        </div>
        <p className="mb-0 mt-3 text-xs text-(--text-muted)">Create from your knowledge</p>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        {view === "quiz" ? <ForgeQuizForm {...quizContext} onBack={() => setView("tools")} />
          : view === "flashcards" ? <ForgeFlashcardForm {...quizContext} onBack={() => setView("tools")} onCreated={created} />
          : selectedDeck ? <FlashcardStudy key={selectedDeck.id} deck={selectedDeck} notice={notice} onBack={() => { setView("tools"); setNotice(null); }} onOpenNote={quizContext.onOpenNote} />
          : <div aria-label="Creation tools" className="grid grid-cols-2 gap-2">
          {FORGE_TOOLS.map(({ title, description, icon: Icon }) => (
            <button
              key={title}
              type="button"
              aria-disabled={title !== "Quizzes" && title !== "Flashcards"}
              aria-label={title === "Quizzes" || title === "Flashcards" ? title : `${title} — Coming Soon`}
              title={title === "Quizzes" || title === "Flashcards" ? description : `${description} — Coming Soon`}
              onClick={title === "Quizzes" ? () => setView("quiz") : title === "Flashcards" ? () => setView("flashcards") : undefined}
              className={`flex min-w-0 ${title === "Quizzes" || title === "Flashcards" ? "cursor-pointer" : "cursor-default"} flex-col items-start gap-2 rounded-lg border border-transparent bg-(--bg-secondary) p-3 text-left transition-colors duration-150 hover:bg-(--bg-active) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--interactive-accent)`}
            >
              <Icon size={17} className="shrink-0 text-(--interactive-accent)" aria-hidden="true" />
              <span className="max-w-full break-words text-[13px] font-medium">{title}</span>
              <span className="text-[10px] text-(--text-muted)">{title === "Quizzes" || title === "Flashcards" ? "Generate from a note" : "Coming Soon"}</span>
            </button>
          ))}
        </div>}

        <ForgeCreations key={quizContext.vaultPath || "no-vault"} decks={decks} loading={loading} error={loadError} skipped={library.vaultPath === quizContext.vaultPath ? library.skipped : 0}
          onRetry={() => void reload()} onOpen={openDeck} onDelete={removeDeck} />
      </div>
    </section>
  );
}
