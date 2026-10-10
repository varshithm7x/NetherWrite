import { Blocks, ChartColumn, FileText, GalleryVerticalEnd, Layers, ListChecks, Network, PanelRightClose, Presentation } from "lucide-react";

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
}

export function ForgePanel({ onClose }: ForgePanelProps) {
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
        <div aria-label="Creation tools" className="grid grid-cols-2 gap-2">
          {FORGE_TOOLS.map(({ title, description, icon: Icon }) => (
            <button
              key={title}
              type="button"
              aria-disabled="true"
              aria-label={`${title} — Coming Soon`}
              title={`${description} — Coming Soon`}
              className="flex min-w-0 cursor-default flex-col items-start gap-2 rounded-lg border border-transparent bg-(--bg-secondary) p-3 text-left transition-colors duration-150 hover:bg-(--bg-active) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--interactive-accent)"
            >
              <Icon size={17} className="shrink-0 text-(--interactive-accent)" aria-hidden="true" />
              <span className="max-w-full break-words text-[13px] font-medium">{title}</span>
              <span className="text-[10px] text-(--text-muted)">Coming Soon</span>
            </button>
          ))}
        </div>

        <section aria-labelledby="forge-creations-title" className="mt-5 border-t border-(--border-subtle) pt-4">
          <h3 id="forge-creations-title" className="m-0 text-[13px] font-medium">Your Creations</h3>
          <div className="flex min-h-36 flex-col items-center justify-center gap-3 py-6 text-center text-(--text-muted)">
            <GalleryVerticalEnd size={24} aria-hidden="true" />
            <p className="m-0 text-xs leading-relaxed">Your generated content will appear here.</p>
          </div>
        </section>
      </div>
    </section>
  );
}
