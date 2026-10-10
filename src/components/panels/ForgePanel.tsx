import { ArrowLeft, Blocks, ChartColumn, FileText, GalleryVerticalEnd, Layers, ListChecks, Network, PanelRightClose, Presentation } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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

interface ForgePanelProps {
  onClose?: () => void;
  currentContent?: string;
  activeFilePath?: string | null;
  activeFileName?: string;
  allNoteNames?: { name: string; path: string }[];
  vaultPath?: string | null;
  onOpenSource?: (path: string) => void;
}

export function ForgePanel({ onClose, currentContent = "", activeFilePath, activeFileName = "Current note", allNoteNames = [], vaultPath, onOpenSource }: ForgePanelProps) {
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [topic, setTopic] = useState("");
  const [creations, setCreations] = useState<MindMapCreation[]>([]);
  const [opened, setOpened] = useState<MindMapCreation | null>(null);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const mounted = useRef(false);
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
        <div aria-label="Creation tools" className="grid grid-cols-2 gap-2">
          {FORGE_TOOLS.map(({ title, description, icon: Icon }) => (
            <button
              key={title}
              type="button"
              aria-disabled={title === "Mind Map" ? undefined : "true"}
              aria-label={title === "Mind Map" ? "Create Mind Map" : `${title} — Coming Soon`}
              title={title === "Mind Map" ? description : `${description} — Coming Soon`}
              onClick={title === "Mind Map" ? () => { setSelected(activeFilePath ? [activeFilePath] : []); setTopic(""); setCreating(true); } : undefined}
              className={`flex min-w-0 ${title === "Mind Map" ? "cursor-pointer" : "cursor-default"} flex-col items-start gap-2 rounded-lg border border-transparent bg-(--bg-secondary) p-3 text-left transition-colors duration-150 hover:bg-(--bg-active) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--interactive-accent)`}
            >
              <Icon size={17} className="shrink-0 text-(--interactive-accent)" aria-hidden="true" />
              <span className="max-w-full break-words text-[13px] font-medium">{title}</span>
              <span className="text-[10px] text-(--text-muted)">{title === "Mind Map" ? "Create from sources" : "Coming Soon"}</span>
            </button>
          ))}
        </div>

        <section aria-labelledby="forge-creations-title" className="mt-5 border-t border-(--border-subtle) pt-4">
          <h3 id="forge-creations-title" className="m-0 text-[13px] font-medium">Your Creations</h3>
          {error && !creating && <p role="alert" className="text-xs text-(--text-muted)">{error}</p>}
          {creations.length ? <div className="mt-3 flex flex-col gap-2">{creations.map(creation => <button key={creation.id} className={`${forgeButtonClass} justify-start text-left`} onClick={() => setOpened(creation)}><Network size={16} className="shrink-0 text-(--interactive-accent)" /><span className="min-w-0"><span className="block break-words">{creation.root.label}</span><span className="text-[10px] text-(--text-muted)">{creation.sources.length} sources · {new Date(creation.createdAt).toLocaleDateString()}</span></span></button>)}</div> : <div className="flex min-h-36 flex-col items-center justify-center gap-3 py-6 text-center text-(--text-muted)">
            <GalleryVerticalEnd size={24} aria-hidden="true" />
            <p className="m-0 text-xs leading-relaxed">Your generated content will appear here.</p>
          </div>}
        </section>
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
