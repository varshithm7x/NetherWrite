import React from "react";
import { BacklinksPanel } from "../panels/BacklinksPanel";
import { OutgoingLinksPanel } from "../panels/OutgoingLinksPanel";
import { OutlinePane } from "../panels/OutlinePane";
import { UnlinkedMentionsPanel } from "../panels/UnlinkedMentionsPanel";
import { ForgePanel } from "../panels/ForgePanel";
import { getPluginScopeClass } from "../../lib/pluginStyles";
import type { Theme, FileEntry } from "../../types";

const AIPage = React.lazy(() => import("../ai/AIPage").then(m => ({ default: m.AIPage })));

export type RightSidebarTabType = "backlinks" | "outgoing" | "outline" | "ai" | "forge" | string;

interface PluginViewHostProps {
  view: { containerEl: HTMLElement; pluginId?: string };
}

function PluginViewHost({ view }: PluginViewHostProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container || !view) return;

    // Clear previous content
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    // Apply plugin CSS scope class
    if (view.pluginId) {
      const scopeClass = getPluginScopeClass(view.pluginId);
      view.containerEl.classList.add(scopeClass);
    }

    // Mount the plugin's DOM element
    container.appendChild(view.containerEl);

    // Notify the view of resize so canvas-based plugins initialize properly
    const notifyResize = () => {
      (view as any).onResize?.();
    };
    const resizeTimer = setTimeout(notifyResize, 50);

    return () => {
      clearTimeout(resizeTimer);
      // Don't destroy the element on unmount — just detach it
      if (view.containerEl.parentNode === container) {
        container.removeChild(view.containerEl);
      }
    };
  }, [view]);

  return <div ref={containerRef} className="h-full w-full overflow-auto" />;
}

interface RightSidebarProps {
  activeTab: RightSidebarTabType;
  currentContent: string;
  allNoteNames: { name: string; path: string }[];
  handleLinkClick: (name: string, heading?: string) => void;
  backlinks: string[];
  openFile: (path: string, mode?: any) => void | Promise<void>;
  activeFilePath: string | null;
  activeFileName: string;
  showUnlinkedMentions?: boolean;
  width: number;
  vaultPath?: string | null;
  theme?: Theme;
  fileTree?: FileEntry[];
  onClose?: () => void;
  readNoteContent?: (path: string) => Promise<string>;
  rightPluginViews?: Array<{
    viewType: string;
    displayText: string;
    icon: string;
    containerEl: HTMLElement;
    side: "left" | "right" | "main";
    pluginId?: string;
  }>;
  onClosePluginView?: (viewType: string) => void;
}

export function RightSidebar({
  activeTab,
  currentContent,
  allNoteNames,
  handleLinkClick,
  backlinks,
  openFile,
  activeFilePath,
  activeFileName,
  showUnlinkedMentions = true,
  width,
  vaultPath,
  theme,
  fileTree = [],
  onClose,
  readNoteContent,
  rightPluginViews = [],
  onClosePluginView,
}: RightSidebarProps) {
  const activePluginView = rightPluginViews.find((v) => v.viewType === activeTab);
  const [keepIntelligenceMounted, setKeepIntelligenceMounted] = React.useState(activeTab === "ai");
  const [keepForgeMounted, setKeepForgeMounted] = React.useState(activeTab === "forge");

  React.useEffect(() => {
    if (activeTab === "forge") setKeepForgeMounted(true);
  }, [activeTab]);

  React.useEffect(() => {
    if (activeTab === "ai") setKeepIntelligenceMounted(true);
    else if (activeTab !== "forge") setKeepIntelligenceMounted(false);
  }, [activeTab]);

  return (
    <div
      className="right-sidebar-panel flex flex-col h-full bg-[var(--bg-tree,var(--bg-secondary))] select-none overflow-hidden"
      style={{ width: `${width}px` }}
    >
      {/* Active Tab Panel Body */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === "outline" && (
          <div className="right-sidebar-view h-full">
            <OutlinePane
              content={currentContent}
              onHeadingClick={(line) => {
                document.dispatchEvent(
                  new CustomEvent("editor:goto-line", { detail: line })
                );
              }}
              visible={true}
            />
          </div>
        )}

        {activeTab === "outgoing" && (
          <div className="right-sidebar-view h-full">
            <OutgoingLinksPanel
              content={currentContent}
              allNoteNames={allNoteNames}
              activeFileName={activeFileName}
              onLinkClick={handleLinkClick}
              visible={true}
            />
          </div>
        )}

        {activeTab === "backlinks" && (
          <div className="right-sidebar-view flex flex-col h-full overflow-y-auto">
            {/* Linked Mentions */}
            <div className="shrink-0">
              <BacklinksPanel
                backlinks={backlinks}
                currentNoteName={activeFileName}
                onBacklinkClick={async (path, line) => {
                  await openFile(path);
                  if (line) {
                    setTimeout(() => {
                      document.dispatchEvent(
                        new CustomEvent("editor:goto-line", { detail: line })
                      );
                    }, 150);
                  }
                }}
              />
            </div>
            {showUnlinkedMentions && (
              <div className="flex-1 border-t border-(--border-subtle)">
                <UnlinkedMentionsPanel
                  currentNotePath={activeFilePath}
                  currentNoteName={activeFileName}
                  visible={true}
                  onNavigate={async (path, line) => {
                    await openFile(path);
                    if (line) {
                      setTimeout(() => {
                        document.dispatchEvent(
                          new CustomEvent("editor:goto-line", { detail: line })
                        );
                      }, 150);
                    }
                  }}
                />
              </div>
            )}
          </div>
        )}

        {(activeTab === "forge" || keepForgeMounted) && <div hidden={activeTab !== "forge"} inert={activeTab !== "forge"} className={`right-sidebar-view h-full ${activeTab !== "forge" ? "hidden" : ""}`}>
            <ForgePanel key={vaultPath || "no-vault"} onClose={onClose} vaultPath={vaultPath}
              currentContent={currentContent} activeFilePath={activeFilePath} activeFileName={activeFileName}
              allNoteNames={allNoteNames} onOpenSource={path => { void openFile(path); }}
              activeNote={activeFilePath ? { name: activeFileName, path: activeFilePath } : null}
              notes={allNoteNames.filter(note => /\.md$/i.test(note.path))}
              readNoteContent={readNoteContent} onOpenNote={path => openFile(path)} />
          </div>}

        {/* Retain Intelligence's local state when switching to Forge. */}
        {(activeTab === "ai" || (activeTab === "forge" && keepIntelligenceMounted)) && vaultPath && (
          <div hidden={activeTab !== "ai"} inert={activeTab !== "ai"} className={`right-sidebar-view h-full overflow-hidden ${activeTab === "ai" ? "flex flex-col" : "hidden"}`}>
            <React.Suspense fallback={<div className="flex h-full items-center justify-center text-xs text-[var(--text-muted)]">Loading AI...</div>}>
              <AIPage
                vaultPath={vaultPath}
                theme={theme || "dark"}
                fileTree={fileTree}
                activeNotePath={activeFilePath}
                onOpenNote={(path) => {
                  void openFile(path);
                }}
                onClose={() => onClose?.()}
                isFullScreen={false}
                onToggleFullScreen={() => {}}
              />
            </React.Suspense>
          </div>
        )}

        {activePluginView && (
          <div className="right-sidebar-plugin-view flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-hidden">
              <PluginViewHost view={activePluginView} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
