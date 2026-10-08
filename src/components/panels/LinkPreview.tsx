/**
 * Link Preview Component
 *
 * Shows a tooltip preview when hovering over wiki-links in preview mode.
 * Displays the first few lines of the linked note's content.
 */

import React, { useState, useEffect, useRef } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";

interface LinkPreviewProps {
  noteName: string;
  content: string | null;
  position: { x: number; y: number };
  onClose: () => void;
}

const linkPreviewClass = "bg-(--bg-elevated) border border-(--border-medium) rounded-lg shadow-none max-w-[400px] max-h-[300px] overflow-hidden flex flex-col animate-fade-in";
const linkPreviewHeaderClass = "px-3 py-2 border-b border-(--border-subtle) bg-(--bg-secondary)";
const linkPreviewTitleClass = "font-semibold text-[var(--text-sm)] text-(--text-link)";
const linkPreviewContentClass = "p-3 overflow-auto text-[var(--text-sm)] leading-normal text-(--text-secondary) [&_p]:mt-0 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_.preview-empty]:text-(--text-muted) [&_.preview-empty]:italic [&_h1]:text-[var(--text-base)] [&_h1]:mt-0 [&_h1]:mb-2 [&_h2]:text-[var(--text-base)] [&_h2]:mt-0 [&_h2]:mb-2 [&_h3]:text-[var(--text-base)] [&_h3]:mt-0 [&_h3]:mb-2 [&_code]:bg-(--bg-code) [&_code]:px-1 [&_code]:py-px [&_code]:rounded-[3px] [&_code]:text-[0.9em] markdown-rendered";

export function LinkPreview({
  noteName,
  content,
  position,
  onClose,
}: LinkPreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null);

  // Render first ~200 chars of content as preview
  const previewContent = React.useMemo(() => {
    if (!content) return '<p class="preview-empty">Note not found</p>';

    // Remove frontmatter
    let text = content.replace(/^---[\s\S]*?---\s*/m, "");

    // Truncate to ~500 chars for preview
    if (text.length > 500) {
      text = text.slice(0, 500) + "...";
    }

    // Render markdown
    const html = marked.parse(text, { async: false, breaks: true }) as string;
    return DOMPurify.sanitize(html);
  }, [content]);

  // Position adjustment to keep within viewport
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  useEffect(() => {
    if (previewRef.current) {
      const rect = previewRef.current.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      let x = position.x;
      let y = position.y;

      // Adjust horizontal
      if (x + rect.width > vw - 20) {
        x = Math.max(20, vw - rect.width - 20);
      }

      // Adjust vertical
      if (y + rect.height > vh - 20) {
        y = Math.max(20, position.y - rect.height - 10);
      }

      setAdjustedPosition({ x, y });
    }
  }, [position]);

  return (
    <div
      ref={previewRef}
      className={linkPreviewClass}
      style={{
        position: "fixed",
        left: adjustedPosition.x,
        top: adjustedPosition.y,
        zIndex: 10000,
      }}
      onMouseLeave={onClose}
    >
      <div className={linkPreviewHeaderClass}>
        <span className={linkPreviewTitleClass}>{noteName}</span>
      </div>
      <div
        className={linkPreviewContentClass}
        dangerouslySetInnerHTML={{ __html: previewContent }}
      />
    </div>
  );
}
