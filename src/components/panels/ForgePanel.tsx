import { ArrowLeft, Blocks, ChartColumn, FileText, Layers, ListChecks, Network, PanelRightClose, Presentation } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ForgeQuizForm } from "./ForgeQuizForm";
import type { ForgeQuizContext } from "./ForgeQuizForm";
import { ForgeFlashcardForm } from "./ForgeFlashcardForm";
import { FlashcardStudy } from "./FlashcardStudy";
import { ForgeCreations } from "./ForgeCreations";
import { deleteFlashcardDeck, FLASHCARDS_CHANGED_EVENT, loadFlashcardDecks } from "../../utils/flashcardsStore";
import type { FlashcardDeck } from "../../types/flashcards";
import { ForgeReportForm } from "./ForgeReportForm";
import { LearningReportView } from "./LearningReportView";
import { deleteLearningReport, loadLearningReports, REPORTS_CHANGED_EVENT } from "../../utils/reportsStore";
import type { LearningReport } from "../../types/learning-reports";
import type { ForgeSourceNote } from "../../utils/forge-note-source";

import { ForgeMindMap, forgeButtonClass } from "./ForgeMindMap";
import { generateMindMap, linkMindMapSources, parseMindMap } from "../../utils/forge-mind-map";
import type { MindMapCreation, MindMapSource } from "../../utils/forge-mind-map";
import { getAPI } from "../../utils/api";

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
  currentContent?: string;
  activeFilePath?: string | null;
  activeFileName?: string;
  allNoteNames?: { name: string; path: string }[];
  vaultPath?: string | null;
  onOpenSource?: (path: string) => void;
}
type ForgeView = "tools" | "quiz" | "flashcards" | "reports" | `deck:${string}` | `report:${string}`;

export function ForgePanel({ onClose, currentContent = "", activeFilePath, activeFileName = "Current note", allNoteNames = [], onOpenSource, ...quizContext }: ForgePanelProps) {
  const vaultPath = quizContext.vaultPath;
  const [view, setView] = useState<ForgeView>("tools");
  const [reportLibrary, setReportLibrary] = useState<{ vaultPath: string | null; reports: LearningReport[]; skipped: number }>({ vaultPath: null, reports: [], skipped: 0 });
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportSource, setReportSource] = useState<ForgeSourceNote | undefined>();
  const reportVersion = useRef(0);
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
  const reports = reportLibrary.vaultPath === vaultPath ? reportLibrary.reports : [];
  const selectedReport = reports.find(report => `report:${report.id}` === view);
  async function reloadReports() {
    const scope = vaultRef.current;
    if (!scope) return;
    const version = ++reportVersion.current;
    try {
      const library = await loadLearningReports(scope);
      if (mounted.current && vaultRef.current === scope && version === reportVersion.current) { setReportLibrary({ vaultPath: scope, ...library }); setReportError(null); }
    } catch {
      if (mounted.current && vaultRef.current === scope && version === reportVersion.current) setReportError("Saved reports could not be loaded. Please retry.");
    }
  }
  useEffect(() => {
    setReportLibrary({ vaultPath: vaultPath || null, reports: [], skipped: 0 }); setReportError(null); setReportSource(undefined);
    void reloadReports();
    const changed = (event: Event) => { if ((event as CustomEvent<{ vaultPath: string }>).detail?.vaultPath === vaultRef.current) void reloadReports(); };
    window.addEventListener(REPORTS_CHANGED_EVENT, changed);
    return () => { reportVersion.current++; window.removeEventListener(REPORTS_CHANGED_EVENT, changed); };
  }, [vaultPath]);
  function reportCreated(report: LearningReport) {
    if (report.vaultPath !== vaultRef.current) return;
    setReportLibrary(current => ({ vaultPath: report.vaultPath, skipped: current.vaultPath === report.vaultPath ? current.skipped : 0,
      reports: [report, ...(current.vaultPath === report.vaultPath ? current.reports.filter(saved => saved.id !== report.id) : [])] }));
    setView(`report:${report.id}`);
  }
  async function removeReport(id: string) {
    const scope = vaultRef.current;
    if (!scope) throw new Error("No vault open");
    await deleteLearningReport(scope, id);
    if (!mounted.current || scope !== vaultRef.current) return;
    setReportLibrary(current => ({ ...current, reports: current.reports.filter(report => report.id !== id) }));
    if (view === `report:${id}`) setView("tools");
  }
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
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [topic, setTopic] = useState("");
  const [creations, setCreations] = useState<MindMapCreation[]>([]);
  const [opened, setOpened] = useState<MindMapCreation | null>(null);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const notes = allNoteNames.some(note => note.path === activeFilePath) || !activeFilePath ? allNoteNames : [{ path: activeFilePath, name: activeFileName }, ...allNoteNames];
  useEffect(() => {
    mounted.current = true;
    void (async () => {
      try {
        const raw = await getAPI().dataRead("forge-mind-maps.json");
        const saved: unknown = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(saved)) throw new Error("Invalid saved maps");
        const valid = saved.map((item): MindMapCreation => {
          if (!item || typeof item.id !== "string" || !Number.isFinite(item.createdAt) || !Array.isArray(item.sources) || !item.sources.every((source: { path: string; name: string }) => source && typeof source.path === "string" && typeof source.name === "string")) throw new Error("Invalid saved map");
          return { ...item, root: parseMindMap(JSON.stringify(item.root)) };
        });
        if (mounted.current) setCreations(valid);
      } catch {
        if (mounted.current) setError("Saved mind maps could not be loaded. Reopen Forge to try again.");
        return;
      }
      if (mounted.current) setLoaded(true);
    })();
    return () => { mounted.current = false; };
  }, []);
  useEffect(() => {
    if (!opened || opened.root.sourcePaths || opened.sources.length < 2) return;
    let cancelled = false;
    const creation = opened;
    void Promise.all(creation.sources.map(async source => ({ ...source, content: source.path === activeFilePath ? currentContent : await getAPI().readFile(source.path) }))).then(sources => {
      if (!cancelled) setOpened(previous => previous?.id === creation.id ? { ...previous, root: linkMindMapSources(previous.root, sources) } : previous);
    }).catch(() => {
      if (!cancelled) setError("Some source notes could not be read. Use View sources to open an available note.");
    });
    return () => { cancelled = true; };
  }, [opened?.id]);
  async function generate() {
    setBusy(true);
    setError("");
    try {
      const sources: MindMapSource[] = [];
      for (const path of selected) {
        sources.push({ path, name: notes.find(note => note.path === path)?.name || path, content: path === activeFilePath ? currentContent : await getAPI().readFile(path) });
      }
      const result = await generateMindMap(sources, message => { if (mounted.current) setProgress(message); }, topic.trim());
      if (!mounted.current) return;
      const next = [result, ...creations];
      try {
        await getAPI().dataWrite("forge-mind-maps.json", JSON.stringify(next));
      } catch {
        setError("Map created, but saving failed. Download it before closing Forge.");
      }
      if (!mounted.current) return;
      setCreations(next);
      setCreating(false);
      setOpened(result);
    } catch (err) {
      if (mounted.current) setError(err instanceof Error ? err.message : "Mind map generation failed. Please try again.");
    } finally {
      if (mounted.current) { setBusy(false); setProgress(""); }
    }
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

      {!creating && !opened && <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        {view === "quiz" ? <ForgeQuizForm {...quizContext} onBack={() => setView("tools")} />
          : view === "reports" ? <ForgeReportForm {...quizContext} initialSource={reportSource} onBack={() => setView("tools")} onCreated={reportCreated}
            onQuizzes={note => { void quizContext.onOpenNote?.(note.path); setView("quiz"); }} />
          : selectedReport ? <LearningReportView key={selectedReport.id} report={selectedReport} onBack={() => setView("tools")} onOpenNote={quizContext.onOpenNote}
            onRegenerate={() => { setReportSource({ path: selectedReport.sourceNotePath, name: selectedReport.sourceNoteTitle }); setView("reports"); }} />
          : view === "flashcards" ? <ForgeFlashcardForm {...quizContext} onBack={() => setView("tools")} onCreated={created} />
          : selectedDeck ? <FlashcardStudy key={selectedDeck.id} deck={selectedDeck} notice={notice} onBack={() => { setView("tools"); setNotice(null); }} onOpenNote={quizContext.onOpenNote} />
          : <div aria-label="Creation tools" className="grid grid-cols-2 gap-2">
          {FORGE_TOOLS.map(({ title, description, icon: Icon }) => (
            <button
              key={title}
              type="button"
              aria-disabled={title === "Mind Map" ? undefined : !["Quizzes", "Flashcards", "Reports"].includes(title)}
              aria-label={title === "Mind Map" ? "Create Mind Map" : ["Quizzes", "Flashcards", "Reports"].includes(title) ? title : `${title} — Coming Soon`}
              title={["Mind Map", "Quizzes", "Flashcards", "Reports"].includes(title) ? description : `${description} — Coming Soon`}
              onClick={title === "Mind Map" ? () => { setSelected(activeFilePath ? [activeFilePath] : []); setTopic(""); setCreating(true); } : title === "Quizzes" ? () => setView("quiz") : title === "Flashcards" ? () => setView("flashcards") : title === "Reports" ? () => { setReportSource(undefined); setView("reports"); } : undefined}
              className={`flex min-w-0 ${["Mind Map", "Quizzes", "Flashcards", "Reports"].includes(title) ? "cursor-pointer" : "cursor-default"} flex-col items-start gap-2 rounded-lg border border-transparent bg-(--bg-secondary) p-3 text-left transition-colors duration-150 hover:bg-(--bg-active) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--interactive-accent)`}
            >
              <Icon size={17} className="shrink-0 text-(--interactive-accent)" aria-hidden="true" />
              <span className="max-w-full break-words text-[13px] font-medium">{title}</span>
              <span className="text-[10px] text-(--text-muted)">{title === "Mind Map" ? "Create from sources" : title === "Reports" ? "Learn from quiz results" : title === "Quizzes" || title === "Flashcards" ? "Generate from a note" : "Coming Soon"}</span>
            </button>
          ))}
        </div>}

        <ForgeCreations key={quizContext.vaultPath || "no-vault"} decks={decks} loading={loading} error={loadError} skipped={library.vaultPath === quizContext.vaultPath ? library.skipped : 0}
          onRetry={() => void reload()} onOpen={openDeck} onDelete={removeDeck} hasOtherCreations={creations.length > 0}
          reports={reports} onOpenReport={report => setView(`report:${report.id}`)} onDeleteReport={removeReport}>
          {reportError && <p role="status" className="text-xs text-(--text-muted)">{reportError} <button type="button" onClick={() => void reloadReports()} className="rounded underline focus-visible:outline-2 focus-visible:outline-(--interactive-accent)">Retry Reports</button></p>}
          {reportLibrary.vaultPath === vaultPath && reportLibrary.skipped > 0 && <p className="text-xs text-(--text-muted)">Some invalid saved reports were skipped; their data was preserved.</p>}
          {error && <p role="alert" className="text-xs text-(--text-muted)">{error}</p>}
          {creations.length > 0 && <div className="mt-3 flex flex-col gap-2">{creations.map(creation => <button key={creation.id} className={`${forgeButtonClass} justify-start text-left`} onClick={() => setOpened(creation)}><Network size={16} className="shrink-0 text-(--interactive-accent)" /><span className="min-w-0"><span className="block break-words">{creation.root.label}</span><span className="text-[10px] text-(--text-muted)">Mind Map · {creation.sources.length} sources · {new Date(creation.createdAt).toLocaleDateString()}</span></span></button>)}</div>}
        </ForgeCreations>
      </div>}
      {creating && <section aria-label="Create a mind map" className="flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
          <button className={`${forgeButtonClass} self-start`} disabled={busy} aria-label="Back to Forge" onClick={() => setCreating(false)}><ArrowLeft size={14} />Back</button>
          <h3 className="m-0 text-sm font-medium">Create a mind map</h3>
          <label className="flex flex-col gap-2 text-xs">Which topic would you like to explore?
            <input autoFocus value={topic} disabled={busy} maxLength={240} onChange={event => setTopic(event.target.value)} placeholder="e.g. Digital image processing" className="w-full rounded-lg border border-(--border-subtle) bg-(--bg-secondary) px-3 py-2 text-sm outline-none focus:border-(--interactive-accent)" />
          </label>
          <p className="m-0 text-xs text-(--text-muted)">Choose notes to use for this topic.</p>
          {!vaultPath && <p className="text-sm text-(--text-muted)">Open a vault to create and save mind maps.</p>}
          <fieldset disabled={busy} className="min-h-0 overflow-auto rounded-lg border border-(--border-subtle) p-3">
            <legend className="px-2 text-sm">Sources</legend>
            {notes.length ? notes.map(note => <label key={note.path} className="flex cursor-pointer items-center gap-3 rounded px-2 py-2 text-sm hover:bg-(--bg-active)"><input type="checkbox" checked={selected.includes(note.path)} onChange={event => setSelected(old => event.target.checked ? [...old, note.path] : old.filter(path => path !== note.path))} /><span className="break-all">{note.name}{note.path === activeFilePath ? " (current note)" : ""}</span></label>) : <p className="text-xs text-(--text-muted)">Add or open a note first.</p>}
          </fieldset>
          {error && <p role="alert" className="text-sm text-(--text-muted)">{error}</p>}
          {busy && <p role="status" className="text-sm text-(--text-muted)">{progress || "Reading sources…"}</p>}
          <div className="mt-auto flex justify-end"><button className={forgeButtonClass} disabled={busy || !topic.trim() || !selected.length || !vaultPath || !loaded} onClick={() => void generate()}>{busy ? "Analyzing…" : "Generate mind map"}</button></div>
        </div>
      </section>}
      {opened && <section aria-label={`${opened.root.label} Mind Map`} className="flex min-h-0 flex-1 flex-col">
        <header className="flex items-start gap-2 px-4 pb-3"><button className={`${forgeButtonClass} shrink-0`} aria-label="Close mind map" onClick={() => setOpened(null)}><ArrowLeft size={14} /></button><h3 className="m-0 min-w-0 break-words text-sm font-medium">{opened.root.label} Mind Map</h3></header>
        {error && <p role="alert" className="px-4 text-xs text-(--text-muted)">{error}</p>}
        <ForgeMindMap key={opened.id} creation={opened} onOpenSource={path => onOpenSource?.(path)} />
      </section>}
    </section>
  );
}
