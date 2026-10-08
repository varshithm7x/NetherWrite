import React, { useState, useEffect } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { getNoteName } from "../../utils/helpers";
import { getAPI } from "../../utils/api";

const api = getAPI();

interface BacklinkMatch {
  line: number;
  context: string;
}

interface BacklinkGroup {
  path: string;
  name: string;
  matches: BacklinkMatch[];
}

interface BacklinksPanelProps {
  backlinks: string[];
  currentNoteName: string;
  onBacklinkClick: (path: string, line?: number) => void;
}

export function BacklinksPanel({
  backlinks,
  currentNoteName,
  onBacklinkClick,
}: BacklinksPanelProps) {
  const [panelExpanded, setPanelExpanded] = useState(true);
  const [groups, setGroups] = useState<BacklinkGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Load and parse content for backlinks
  useEffect(() => {
    if (!backlinks || backlinks.length === 0 || !currentNoteName) {
      setGroups([]);
      return;
    }

    let active = true;
    const loadContexts = async () => {
      setLoading(true);
      const newGroups: BacklinkGroup[] = [];

      for (const path of backlinks) {
        try {
          const content = await api.readFile(path);
          if (!active) return;

          const lines = content.split("\n");
          const matches: BacklinkMatch[] = [];

          // Escape note name for regex
          const escapedName = currentNoteName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const pattern = new RegExp(
            `\\[\\[${escapedName}(?:#[^\\]|]*)?(?:\\|[^\\]]*)?\\]\\]`,
            "i"
          );

          lines.forEach((lineText, index) => {
            if (pattern.test(lineText)) {
              matches.push({
                line: index + 1,
                context: lineText.trim(),
              });
            }
          });

          // Fallback if no exact link matches found (e.g. non-markdown or manual links)
          if (matches.length === 0) {
            matches.push({
              line: 1,
              context: getNoteName(path),
            });
          }

          newGroups.push({
            path,
            name: getNoteName(path),
            matches,
          });
        } catch (err) {
          console.error("Error reading backlink content:", err);
          newGroups.push({
            path,
            name: getNoteName(path),
            matches: [{ line: 1, context: getNoteName(path) }],
          });
        }
      }

      if (active) {
        setGroups(newGroups);
        // Expand all groups by default
        setExpandedGroups(new Set(newGroups.map((g) => g.path)));
        setLoading(false);
      }
    };

    void loadContexts();

    return () => {
      active = false;
    };
  }, [backlinks, currentNoteName]);

  const toggleGroup = (path: string) => {
    const next = new Set(expandedGroups);
    if (next.has(path)) {
      next.delete(path);
    } else {
      next.add(path);
    }
    setExpandedGroups(next);
  };

  return (
    <div className="flex flex-col bg-(--bg-secondary) select-none">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-(--bg-hover) transition-colors duration-100"
        onClick={() => setPanelExpanded(!panelExpanded)}
      >
        <span className="flex items-center gap-1.5 text-[13px] font-medium text-(--text-primary)">
          {panelExpanded ? (
            <ChevronDown size={14} className="text-(--text-muted) shrink-0" />
          ) : (
            <ChevronRight size={14} className="text-(--text-muted) shrink-0" />
          )}
          Linked mentions
        </span>
        <span className="text-[12px] text-(--text-muted)">{backlinks.length}</span>
      </div>

      {/* Collapsible Content */}
      {panelExpanded && (
        <div className="flex flex-col pb-2">
          {loading ? (
            <div className="px-8 py-3 text-xs text-(--text-muted) italic">Loading mentions...</div>
          ) : groups.length === 0 ? (
            <div className="px-8 py-3 text-xs text-(--text-muted) italic">No linked mentions</div>
          ) : (
            groups.map((group) => {
              const isExpanded = expandedGroups.has(group.path);
              return (
                <div key={group.path} className="flex flex-col">
                  {/* File group row */}
                  <div
                    className="flex items-center justify-between px-6 py-1.5 cursor-pointer hover:bg-(--bg-hover) transition-colors duration-100"
                    onClick={() => toggleGroup(group.path)}
                  >
                    <span className="flex items-center gap-1 text-[12.5px] font-medium text-(--text-primary) truncate">
                      {isExpanded ? (
                        <ChevronDown size={12} className="text-(--text-muted) shrink-0" />
                      ) : (
                        <ChevronRight size={12} className="text-(--text-muted) shrink-0" />
                      )}
                      {group.name}
                    </span>
                    <span className="text-[11px] text-(--text-muted)">
                      {group.matches.length}
                    </span>
                  </div>

                  {/* Snippets list */}
                  {isExpanded && (
                    <div className="flex flex-col pl-10 pr-4 pb-1">
                      {group.matches.map((match, i) => (
                        <button
                          key={i}
                          className="w-full text-[11px] text-(--text-muted) hover:text-(--text-primary) leading-normal py-0.5 border-none bg-transparent text-left cursor-pointer select-text truncate hover:bg-(--bg-hover) rounded px-1.5 transition-colors duration-100"
                          onClick={() => onBacklinkClick(group.path, match.line)}
                          title={`Line ${match.line}: ${match.context}`}
                        >
                          {match.context}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
