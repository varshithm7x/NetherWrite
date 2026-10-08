/**
 * ThoughtModelPage - ML-powered vault analysis and semantic search
 *
 * Features:
 * - One-click "Build My Thought Model" with progress tracking
 * - Themes view showing clusters of related thoughts
 * - "Ask My Vault" semantic search interface
 *
 * Renders as a split pane (like GraphView) instead of full-screen overlay.
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Brain,
  Loader2,
  AlertCircle,
  CheckCircle,
  Search,
  Sparkles,
  FileText,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Zap,
  X,
  Maximize,
  Minimize,
} from "lucide-react";
import { getAPI } from "../../utils/api";
import type { ThoughtModelStatus, Theme } from "../../types";

const api = getAPI();

const tm = {
  header: "graph-header flex items-center justify-between",
  title: "m-0 flex items-center gap-2 text-[var(--text-base)] font-semibold",
  controls: "flex items-center gap-2",
  stats: "flex gap-3 text-xs text-(--text-muted) mr-3",
  content: "flex-1 overflow-auto bg-(--bg-secondary)",
  center: "flex flex-col items-center justify-center h-full p-8 gap-4 text-center [&_h3]:text-[var(--text-lg)] [&_h3]:font-semibold [&_h3]:m-0 [&_p]:max-w-[320px] [&_p]:leading-normal",
  icon: "text-(--accent-primary) opacity-80",
  iconError: "text-(--danger) opacity-100",
  spinner: "animate-spin text-(--text-muted)",
  progress: "w-[200px] h-1 bg-(--bg-tertiary) rounded-full overflow-hidden",
  progressBar: "h-full bg-(--accent-primary) transition-[width] duration-300",
  code: "bg-(--bg-tertiary) p-3 rounded-md font-mono text-xs my-2 [&_code]:text-(--text-secondary)",
  results: "h-full flex flex-col",
  tabs: "flex items-center gap-1 px-3 py-2 border-b border-(--border-subtle) bg-(--bg-tertiary)",
  tab: "flex items-center gap-2 px-3 py-2 bg-transparent border-none rounded text-[var(--text-sm)] text-(--text-muted) cursor-pointer transition-all duration-150 hover:text-(--text-secondary) hover:bg-(--bg-hover)",
  tabActive: "text-(--text-primary) bg-(--bg-active)",
  themes: "flex-1 overflow-auto p-3 flex flex-col gap-2",
  themeCard: "bg-(--bg-tertiary) border border-(--border-subtle) rounded-md overflow-hidden",
  themeHeader: "flex items-start w-full p-3 bg-transparent border-none cursor-pointer text-left text-(--text-primary) gap-2 hover:bg-(--bg-hover)",
  themeInfo: "flex-1 flex flex-col gap-2",
  keywords: "flex flex-wrap gap-1",
  keyword: "px-2 py-0.5 bg-(--bg-active) rounded text-xs text-(--text-secondary)",
  chunks: "px-3 pb-3 flex flex-col gap-2",
  chunk: "p-3 bg-(--bg-secondary) rounded cursor-pointer transition-colors duration-150 hover:bg-(--bg-hover)",
  chunkTitle: "flex items-center gap-2 text-[var(--text-sm)] font-medium mb-2 text-(--text-primary) [&_svg]:text-(--text-muted)",
  chunkText: "m-0 text-xs text-(--text-muted) leading-normal line-clamp-3",
  search: "flex-1 overflow-auto p-3 flex flex-col gap-3",
  searchBox: "flex items-center gap-2 px-3 py-2 bg-(--bg-tertiary) border border-(--border-subtle) rounded-md focus-within:border-(--border-medium)",
  searchIcon: "text-(--text-muted) shrink-0",
  searchInput: "flex-1 py-1 bg-transparent border-none outline-none text-[var(--text-sm)] text-(--text-primary) placeholder:text-(--text-muted)",
  searchResults: "flex flex-col gap-2",
  result: "p-3 bg-(--bg-tertiary) border border-(--border-subtle) rounded-md cursor-pointer transition-all duration-150 hover:bg-(--bg-hover) hover:border-(--border-medium)",
  resultHeader: "flex items-center justify-between mb-2",
  resultTitle: "flex items-center gap-2 text-[var(--text-sm)] font-medium text-(--text-primary) [&_svg]:text-(--text-muted)",
  score: "text-xs px-2 py-0.5 bg-(--bg-active) rounded text-(--text-secondary)",
  resultText: "mt-0 mb-2 text-xs text-(--text-muted) leading-normal",
  resultPath: "text-[10px] text-(--text-muted) opacity-70",
  noResults: "flex flex-col items-center justify-center p-8 text-(--text-muted) gap-2 [&_p]:m-0 [&_p]:text-[var(--text-sm)]",
};

const tmTabClass = (active: boolean) => `${tm.tab} ${active ? tm.tabActive : ""}`;
const panelBtnBaseClass =
  "inline-flex cursor-pointer items-center justify-center gap-[var(--space-2)] whitespace-nowrap rounded-[var(--radius-md)] border-0 px-[var(--space-5)] py-[var(--space-2)] font-sans text-[length:var(--text-sm)] font-medium transition-[var(--transition-fast)] disabled:cursor-not-allowed disabled:opacity-60";
const panelBtnPrimaryClass =
  `${panelBtnBaseClass} bg-[var(--accent-primary)] text-[var(--text-on-accent)] hover:opacity-90`;
const panelBtnSecondaryClass =
  `${panelBtnBaseClass} border border-[var(--border-medium)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]`;
const panelBtnGhostClass =
  `${panelBtnBaseClass} bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]`;
const panelBtnGhostSmClass = `${panelBtnGhostClass} px-2.5 py-1 text-[11px]`;
const panelBtnPrimarySmClass = `${panelBtnPrimaryClass} px-2.5 py-1 text-[11px]`;
const panelBtnPrimaryLgClass = `${panelBtnPrimaryClass} px-6 py-3 text-base`;

/**
 * Strip YAML frontmatter and metadata from text for display
 */
function cleanChunkText(text: string): string {
  if (!text) return "";

  // Remove YAML frontmatter block (---...---)
  let cleaned = text.replace(/^---[\s\S]*?---\s*/m, "");

  // Remove individual frontmatter-like lines at start
  const lines = cleaned.split("\n");
  while (
    lines.length > 0 &&
    /^\s*(title|tags|date|description|aliases|created|updated|category|type|status|author|draft|render):/i.test(
      lines[0],
    )
  ) {
    lines.shift();
  }
  cleaned = lines.join("\n").trim();

  // Remove any remaining standalone metadata patterns
  cleaned = cleaned.replace(
    /^(title|tags|date|description|aliases|created|updated):\s*.*$/gim,
    "",
  );

  // Clean up multiple newlines
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n").trim();

  return cleaned;
}

interface ThoughtModelPageProps {
  vaultPath: string | null;
  theme: Theme;
  onOpenNote: (path: string) => void;
  onClose: () => void;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
}

interface ThemeData {
  cluster_id: number;
  keywords: string[];
  representative_chunks: {
    chunk_id: string;
    note_id: string;
    note_path: string;
    note_title: string;
    chunk_text: string;
  }[];
  note_count: number;
}

interface QueryResult {
  score: number;
  note_title: string;
  note_path: string;
  chunk_text: string;
  cluster_id: number;
}

export function ThoughtModelPage({
  vaultPath,
  theme,
  onOpenNote,
  onClose,
  isFullScreen,
  onToggleFullScreen,
}: ThoughtModelPageProps) {
  // Build state
  const [status, setStatus] = useState<ThoughtModelStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [serviceHealthy, setServiceHealthy] = useState<boolean | null>(null);

  // Data state
  const [themes, setThemes] = useState<ThemeData[]>([]);
  const [totalNotes, setTotalNotes] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);

  // Query state
  const [query, setQuery] = useState("");
  const [queryResults, setQueryResults] = useState<QueryResult[]>([]);
  const [isQuerying, setIsQuerying] = useState(false);
  const [activeTab, setActiveTab] = useState<"themes" | "search">("themes");

  // Theme expansion state
  const [expandedThemes, setExpandedThemes] = useState<Set<number>>(new Set());

  // Refs
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const queryInputRef = useRef<HTMLInputElement>(null);

  // Check service health on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const healthy = await api.thoughtModel.health();
        setServiceHealthy(healthy);
      } catch {
        setServiceHealthy(false);
      }
    };
    checkHealth();
  }, []);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // Start building the thought model
  const handleBuild = useCallback(async () => {
    if (!vaultPath) {
      setError("No vault selected");
      return;
    }

    setStatus("indexing");
    setProgress(0);
    setMessage("Starting...");
    setError(null);

    try {
      const response = await api.thoughtModel.build(vaultPath);
      const newJobId = response.job_id;
      setJobId(newJobId);

      // Poll for status
      pollIntervalRef.current = setInterval(async () => {
        try {
          const statusResponse = await api.thoughtModel.status(newJobId);
          setProgress(statusResponse.progress ?? 0);
          setMessage(statusResponse.message ?? "");

          if (statusResponse.status === "done") {
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
            }
            setStatus("done");
            setTotalNotes(statusResponse.total_notes ?? 0);
            setTotalChunks(statusResponse.total_chunks ?? 0);

            // Load themes
            const themesResponse = await api.thoughtModel.themes(newJobId);
            setThemes(themesResponse.themes);
          } else if (statusResponse.status === "failed") {
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
            }
            setStatus("failed");
            setError(statusResponse.message ?? "Unknown error");
          }
        } catch (err) {
          console.error("Status poll failed:", err);
        }
      }, 500);
    } catch (err) {
      setStatus("failed");
      const errorMsg =
        err instanceof Error ? err.message : "Failed to start build";
      setError(errorMsg);
    }
  }, [vaultPath]);

  // Handle query
  const handleQuery = useCallback(async () => {
    if (!query.trim() || !jobId) return;

    setIsQuerying(true);
    try {
      const response = await api.thoughtModel.query(jobId, query, 10);
      setQueryResults(response.results);
    } catch (err) {
      console.error("Query failed:", err);
    } finally {
      setIsQuerying(false);
    }
  }, [query, jobId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleQuery();
    }
  };

  // Rebuild
  const handleRebuild = async () => {
    if (jobId) {
      try {
        await api.thoughtModel.clear(jobId);
      } catch {
        // ignore
      }
    }
    handleBuild();
  };

  // Toggle theme expansion
  const toggleTheme = (clusterId: number) => {
    setExpandedThemes((prev) => {
      const next = new Set(prev);
      if (next.has(clusterId)) {
        next.delete(clusterId);
      } else {
        next.add(clusterId);
      }
      return next;
    });
  };

  // Render service not running message
  if (serviceHealthy === false) {
    return (
      <>
        <div className={tm.header}>
          <h2 className={tm.title}>
            <Brain size={20} strokeWidth={1.5} style={{ opacity: 0.6 }} />
            Thought Model
          </h2>
          <div className={tm.controls}>
            {onToggleFullScreen && (
              <button
                className={panelBtnGhostClass}
                onClick={onToggleFullScreen}
                title={isFullScreen ? "Exit fullscreen" : "Fullscreen"}
              >
                {isFullScreen ? <Minimize size={16} /> : <Maximize size={16} />}
              </button>
            )}
            <button className={panelBtnGhostClass} onClick={onClose} title="Close">
              <X size={16} />
            </button>
          </div>
        </div>
        <div className={tm.content}>
          <div className={tm.center}>
            <AlertCircle size={40} className={tm.iconError} />
            <h3>Service Not Running</h3>
            <p className="text-muted">
              Start the Python ML service in a terminal:
            </p>
            <div className={tm.code}>
              <code>
                cd thought_model && pip install -r requirements.txt && python
                main.py
              </code>
            </div>
            <button
              className={panelBtnPrimaryClass}
              onClick={() => window.location.reload()}
            >
              <RefreshCw size={14} />
              Retry
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className={tm.header}>
        <h2 className={tm.title}>
          <Brain size={20} strokeWidth={1.5} style={{ opacity: 0.6 }} />
          Thought Model
        </h2>
        <div className={tm.controls}>
          {status === "done" && (
            <div className={tm.stats}>
              <span>{totalNotes} notes</span>
              <span>{totalChunks} chunks</span>
              <span>{themes.length} themes</span>
            </div>
          )}
          {onToggleFullScreen && (
            <button
              className={panelBtnGhostClass}
              onClick={onToggleFullScreen}
              title={isFullScreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullScreen ? <Minimize size={16} /> : <Maximize size={16} />}
            </button>
          )}
          <button className={panelBtnGhostClass} onClick={onClose} title="Close">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className={tm.content}>
        {/* Status: Idle - Show build button */}
        {status === "idle" && (
          <div className={tm.center}>
            <Brain size={48} className={tm.icon} />
            <h3>Build Your Thought Model</h3>
            <p className="text-muted">
              Analyze your vault using ML to discover themes and enable semantic
              search.
            </p>
            <button
              className={panelBtnPrimaryLgClass}
              onClick={handleBuild}
              disabled={!vaultPath}
            >
              <Zap size={18} />
              Build Model
            </button>
            {!vaultPath && (
              <p className="text-muted text-sm">Open a vault first</p>
            )}
          </div>
        )}

        {/* Status: Indexing - Show progress */}
        {status === "indexing" && (
          <div className={tm.center}>
            <Loader2 size={40} className={tm.spinner} />
            <h3>Building...</h3>
            <p className="text-muted">{message}</p>
            <div className={tm.progress}>
              <div
                className={tm.progressBar}
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-muted text-sm">{Math.round(progress)}%</span>
          </div>
        )}

        {/* Status: Failed - Show error */}
        {status === "failed" && (
          <div className={tm.center}>
            <AlertCircle size={40} className={tm.iconError} />
            <h3>Build Failed</h3>
            <p className="text-muted">{error}</p>
            <button className={panelBtnSecondaryClass} onClick={handleBuild}>
              <RefreshCw size={14} />
              Try Again
            </button>
          </div>
        )}

        {/* Status: Done - Show themes and search */}
        {status === "done" && (
          <div className={tm.results}>
            {/* Tab switcher */}
            <div className={tm.tabs}>
              <button
                className={tmTabClass(activeTab === "themes")}
                onClick={() => setActiveTab("themes")}
              >
                <Sparkles size={14} />
                Themes
              </button>
              <button
                className={tmTabClass(activeTab === "search")}
                onClick={() => setActiveTab("search")}
              >
                <Search size={14} />
                Search
              </button>
              <div style={{ flex: 1 }} />
              <button
                className={panelBtnGhostSmClass}
                onClick={handleRebuild}
                title="Rebuild"
              >
                <RefreshCw size={12} />
              </button>
            </div>

            {/* Themes Tab */}
            {activeTab === "themes" && (
              <div className={tm.themes}>
                {themes.map((themeData) => (
                  <div
                    key={themeData.cluster_id}
                    className={tm.themeCard}
                  >
                    <button
                      className={tm.themeHeader}
                      onClick={() => toggleTheme(themeData.cluster_id)}
                    >
                      {expandedThemes.has(themeData.cluster_id) ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                      <div className={tm.themeInfo}>
                        <div className={tm.keywords}>
                          {themeData.keywords.slice(0, 5).map((kw, i) => (
                            <span key={i} className={tm.keyword}>
                              {kw}
                            </span>
                          ))}
                        </div>
                        <span className="text-muted text-sm">
                          {themeData.note_count} notes •{" "}
                          {themeData.representative_chunks.length} passages
                        </span>
                      </div>
                    </button>

                    {expandedThemes.has(themeData.cluster_id) && (
                      <div className={tm.chunks}>
                        {themeData.representative_chunks.map((chunk) => (
                          <div
                            key={chunk.chunk_id}
                            className={tm.chunk}
                            onClick={() => onOpenNote(chunk.note_path)}
                          >
                            <div className={tm.chunkTitle}>
                              <FileText size={12} />
                              <span>{chunk.note_title}</span>
                            </div>
                            <p className={tm.chunkText}>
                              {cleanChunkText(chunk.chunk_text)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Search Tab */}
            {activeTab === "search" && (
              <div className={tm.search}>
                <div className={tm.searchBox}>
                  <Search size={16} className={tm.searchIcon} />
                  <input
                    ref={queryInputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask a question about your notes..."
                    className={tm.searchInput}
                  />
                  {query && (
                    <button
                      className={panelBtnGhostSmClass}
                      onClick={() => setQuery("")}
                    >
                      <X size={14} />
                    </button>
                  )}
                  <button
                    className={panelBtnPrimarySmClass}
                    onClick={handleQuery}
                    disabled={!query.trim() || isQuerying}
                  >
                    {isQuerying ? (
                      <Loader2 size={14} className={tm.spinner} />
                    ) : (
                      <Search size={14} />
                    )}
                  </button>
                </div>

                {/* Results */}
                {queryResults.length > 0 && (
                  <div className={tm.searchResults}>
                    <p className="text-muted text-sm">
                      {queryResults.length} results
                    </p>
                    {queryResults.map((result, index) => (
                      <div
                        key={index}
                        className={tm.result}
                        onClick={() => onOpenNote(result.note_path)}
                      >
                        <div className={tm.resultHeader}>
                          <div className={tm.resultTitle}>
                            <FileText size={12} />
                            <span>{result.note_title}</span>
                          </div>
                          <span className={tm.score}>
                            {(result.score * 100).toFixed(0)}%
                          </span>
                        </div>
                        <p className={tm.resultText}>
                          {(() => {
                            const cleaned = cleanChunkText(result.chunk_text);
                            return cleaned.length > 200
                              ? cleaned.slice(0, 200) + "..."
                              : cleaned;
                          })()}
                        </p>
                        <span className={tm.resultPath}>
                          {result.note_path}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {queryResults.length === 0 && query && !isQuerying && (
                  <div className={tm.noResults}>
                    <Search size={24} style={{ opacity: 0.3 }} />
                    <p>No results for "{query}"</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default ThoughtModelPage;
