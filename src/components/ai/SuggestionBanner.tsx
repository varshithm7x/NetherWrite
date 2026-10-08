/**
 * SuggestionBanner -- Context-aware inline suggestions
 *
 * Features:
 *  - Grouped display: Strong Matches vs Broader Connections
 *  - Type labels: Related, Expands, Contradicts, Example
 *  - Contextual reasoning: explains WHY each suggestion is relevant
 *  - Confidence-based visibility: highlight/normal/collapsed
 *  - "Not linked" indicator
 *  - Typed link creation with accept/reject
 *
 * Never auto-applies. All link creation requires explicit user action.
 */

import React, { useState, useCallback } from "react";
import {
  Link,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  LinkIcon,
  Sparkles,
  Eye,
} from "lucide-react";
import type { EnrichedSuggestion } from "../../utils/suggestion-enrichment";

// ── Link types ───────────────────────────────────────────────────────────────

export type LinkType = "related" | "supports" | "contradicts" | "example_of";

export const LINK_TYPES: { id: LinkType; label: string; symbol: string }[] = [
  { id: "related", label: "Related", symbol: "\u2194" },
  { id: "supports", label: "Supports", symbol: "\u2192" },
  { id: "contradicts", label: "Contradicts", symbol: "\u21C4" },
  { id: "example_of", label: "Example of", symbol: "\u2208" },
];

// ── Props ────────────────────────────────────────────────────────────────────

export interface Suggestion {
  path: string;
  title: string;
  similarity: number;
}

interface SuggestionBannerProps {
  suggestions: EnrichedSuggestion[];
  onAccept: (path: string, linkType: LinkType) => void;
  onReject: (path: string) => void;
  onDismissAll: () => void;
  onOpenNote?: (path: string) => void;
}

// ── Type badge colors ────────────────────────────────────────────────────────

function getTypeBadgeClasses(type: string): string {
  switch (type) {
    case "expands": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    case "contradicts": return "bg-red-500/10 text-red-400 border-red-500/20";
    case "example": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    default: return "bg-(--bg-active) text-(--text-secondary) border-(--border-subtle)";
  }
}

function getConfidenceBorder(similarity: number): string {
  if (similarity >= 0.7) return "border-l-emerald-500/60";
  if (similarity >= 0.5) return "border-l-(--border-strong)";
  return "border-l-(--border-subtle)";
}

// ── Component ────────────────────────────────────────────────────────────────

export function SuggestionBanner({
  suggestions,
  onAccept,
  onReject,
  onDismissAll,
  onOpenNote,
}: SuggestionBannerProps) {
  const [expanded, setExpanded] = useState(false);
  const [activeLinkSelector, setActiveLinkSelector] = useState<string | null>(null);
  const [showBroader, setShowBroader] = useState(false);

  if (suggestions.length === 0) return null;

  // Group suggestions
  const strongMatches = suggestions.filter((s) => s.group === "strong");
  const broaderConnections = suggestions.filter((s) => s.group === "broader");

  // Only show top 2 strong matches initially
  const visibleStrong = expanded ? strongMatches : strongMatches.slice(0, 2);
  const hasMore = strongMatches.length > 2;

  const renderSuggestionItem = (s: EnrichedSuggestion) => (
    <div
      key={s.path}
      className={`flex items-start justify-between gap-3 px-3 py-2 border-l-2 ${getConfidenceBorder(s.similarity)} ${s.isLinked ? "opacity-50" : ""} transition-colors duration-150 hover:bg-(--bg-hover)`}
    >
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Type badge */}
          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border ${getTypeBadgeClasses(s.type)}`}>
            <span className="text-[9px]">{s.typeSymbol}</span>
            {s.typeLabel}
          </span>

          {/* Title */}
          <button
            className="bg-transparent border-none text-[12px] font-medium text-(--text-primary) cursor-pointer p-0 hover:underline hover:underline-offset-2 truncate max-w-[180px]"
            onClick={() => onOpenNote?.(s.path)}
            title={`Open ${s.title}`}
          >
            {s.title}
          </button>

          {/* Score */}
          <span className="text-[10px] text-(--text-muted) font-medium ml-auto shrink-0">
            {Math.round(s.similarity * 100)}%
          </span>

          {/* Not linked indicator */}
          {!s.isLinked && (
            <span className="text-(--text-muted) opacity-50" title="Not yet linked">
              <LinkIcon size={10} />
            </span>
          )}
        </div>

        {/* Contextual reason */}
        <div className="flex items-start gap-1.5 text-[11px] text-(--text-muted) leading-relaxed">
          <Sparkles size={10} className="shrink-0 mt-0.5 opacity-60" />
          <span>{s.reason}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {activeLinkSelector === s.path ? (
          <div className="flex items-center gap-0.5 flex-wrap">
            {LINK_TYPES.map((lt) => (
              <button
                key={lt.id}
                className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-(--bg-active) text-(--text-secondary) border-none cursor-pointer transition-colors duration-150 hover:bg-(--bg-hover) hover:text-(--text-primary)"
                onClick={() => {
                  onAccept(s.path, lt.id);
                  setActiveLinkSelector(null);
                }}
                title={lt.label}
              >
                <span className="text-[9px]">{lt.symbol}</span>
                <span>{lt.label}</span>
              </button>
            ))}
            <button
              className="bg-transparent border-none text-(--text-muted) cursor-pointer p-0.5 rounded hover:bg-(--bg-hover)"
              onClick={() => setActiveLinkSelector(null)}
            >
              <X size={10} />
            </button>
          </div>
        ) : (
          <>
            <button
              className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border-none cursor-pointer transition-colors duration-150 hover:bg-emerald-500/20"
              onClick={() => setActiveLinkSelector(s.path)}
              title="Create link"
            >
              <Check size={12} />
              Link
            </button>
            <button
              className="bg-transparent border-none text-(--text-muted) cursor-pointer p-1 rounded transition-colors duration-150 hover:bg-red-500/10 hover:text-red-400"
              onClick={() => onReject(s.path)}
              title="Dismiss"
            >
              <X size={12} />
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="border border-(--border-subtle) rounded-lg bg-(--bg-secondary) overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-(--border-subtle)">
        <div className="flex items-center gap-2 text-[11px] text-(--text-muted) font-medium">
          <Sparkles size={12} className="text-(--accent-primary)" />
          <span>
            {suggestions.length} connection{suggestions.length !== 1 ? "s" : ""} found
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {hasMore && (
            <button
              className="text-[11px] text-(--text-muted) bg-transparent border-none cursor-pointer px-2 py-0.5 rounded hover:bg-(--bg-hover) hover:text-(--text-primary) transition-colors duration-150"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? "Show less" : `+${strongMatches.length - 2} more`}
            </button>
          )}
          <button
            className="bg-transparent border-none text-(--text-muted) cursor-pointer p-1 rounded hover:bg-(--bg-hover) hover:text-(--text-primary) transition-colors duration-150"
            onClick={onDismissAll}
            title="Dismiss all"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Strong Matches */}
      {visibleStrong.length > 0 && (
        <div>
          <div className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-(--text-muted)">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Strong Matches
          </div>
          <div className="flex flex-col">
            {visibleStrong.map(renderSuggestionItem)}
          </div>
        </div>
      )}

      {/* Broader Connections (collapsed by default) */}
      {broaderConnections.length > 0 && (
        <div>
          <button
            className="flex items-center gap-2 w-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-(--text-muted) bg-transparent border-none cursor-pointer hover:bg-(--bg-hover) transition-colors duration-150"
            onClick={() => setShowBroader(!showBroader)}
          >
            {showBroader ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            <span className="w-1.5 h-1.5 rounded-full bg-(--text-muted) opacity-50" />
            Broader Connections
            <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-(--bg-active) text-(--text-secondary) normal-case tracking-normal">{broaderConnections.length}</span>
          </button>
          {showBroader && (
            <div className="flex flex-col">
              {broaderConnections.map(renderSuggestionItem)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
