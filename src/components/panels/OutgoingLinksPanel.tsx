import React, { useMemo, useState } from "react";
import { Link as LinkIcon, ChevronRight, ChevronDown } from "lucide-react";

interface OutgoingLinksPanelProps {
  content: string;
  allNoteNames: { name: string; path: string }[];
  activeFileName: string;
  onLinkClick: (linkName: string) => void;
  visible: boolean;
}

export function OutgoingLinksPanel({
  content,
  allNoteNames,
  activeFileName,
  onLinkClick,
  visible,
}: OutgoingLinksPanelProps) {
  const [linksExpanded, setLinksExpanded] = useState(true);
  const [unlinkedExpanded, setUnlinkedExpanded] = useState(false);

  // Extract wiki-links from content
  const links = useMemo(() => {
    if (!content) return [];

    const linkRegex = /\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g;
    const found = new Set<string>();
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      found.add(match[1].trim());
    }

    // Convert to array with existence check and parent folder lookup
    const existingNotesMap = new Map<string, string>();
    allNoteNames.forEach((n) => {
      const cleanName = n.name.replace(/\.md$/, "");
      existingNotesMap.set(cleanName.toLowerCase(), n.path);
    });

    return Array.from(found)
      .map((name) => {
        const cleanName = name.toLowerCase();
        const path = existingNotesMap.get(cleanName);
        const exists = !!path;

        let parentFolder = "";
        if (path) {
          const parts = path.split("/");
          parts.pop(); // Remove note name
          parentFolder = parts.join("/");
        }

        return {
          name,
          exists,
          parentFolder,
        };
      })
      .sort((a, b) => {
        if (a.exists !== b.exists) return a.exists ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
  }, [content, allNoteNames]);

  // Find unlinked outgoing mentions
  const unlinkedMentions = useMemo(() => {
    if (!content || !allNoteNames || !activeFileName) return [];

    const found = new Map<string, { name: string; parentFolder: string }>();
    const currentCleanName = activeFileName.replace(/\.md$/, "").toLowerCase();

    allNoteNames.forEach((note) => {
      const cleanName = note.name.replace(/\.md$/, "");
      if (cleanName.toLowerCase() === currentCleanName) return; // Skip current note
      if (cleanName.length < 2) return; // Skip tiny names

      // Escape regex special chars
      const escapedName = cleanName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      // Check if note name appears as a word boundary and is NOT inside [[...]]
      const pattern = new RegExp(
        `(?<!\\[\\[)\\b${escapedName}\\b(?!\\]\\])`,
        "gi"
      );

      if (pattern.test(content)) {
        const parts = note.path.split("/");
        parts.pop();
        found.set(cleanName.toLowerCase(), {
          name: cleanName,
          parentFolder: parts.join("/"),
        });
      }
    });

    return Array.from(found.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [content, allNoteNames, activeFileName]);

  if (!visible) return null;

  return (
    <div className="flex flex-col h-full bg-(--bg-secondary) select-none overflow-y-auto">
      {/* Links Section */}
      <div className="flex flex-col shrink-0">
        <div
          className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-(--bg-hover) transition-colors duration-100"
          onClick={() => setLinksExpanded(!linksExpanded)}
        >
          <span className="flex items-center gap-1.5 text-[13px] font-medium text-(--text-primary)">
            {linksExpanded ? (
              <ChevronDown size={14} className="text-(--text-muted) shrink-0" />
            ) : (
              <ChevronRight size={14} className="text-(--text-muted) shrink-0" />
            )}
            Links
          </span>
          <span className="text-[12px] text-(--text-muted)">{links.length}</span>
        </div>

        {linksExpanded && (
          <div className="flex flex-col pb-2">
            {links.length === 0 ? (
              <div className="px-8 py-3 text-xs text-(--text-muted) italic">No outgoing links</div>
            ) : (
              links.map((link) => (
                <button
                  key={link.name}
                  className="w-full flex items-start gap-2.5 px-6 py-2 bg-transparent border-none text-left cursor-pointer transition-colors duration-100 hover:bg-(--bg-hover)"
                  onClick={() => onLinkClick(link.name)}
                >
                  <LinkIcon size={14} className="text-(--text-muted) mt-1 shrink-0" />
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span
                      className={`text-[12.5px] font-medium truncate ${
                        link.exists ? "text-(--text-primary)" : "text-(--text-muted) italic"
                      }`}
                    >
                      {link.name}
                    </span>
                    {link.parentFolder && (
                      <span className="text-[11px] text-(--text-muted) truncate">
                        {link.parentFolder}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Unlinked Outgoing Mentions Section */}
      <div className="flex flex-col border-t border-(--border-subtle) shrink-0">
        <div
          className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-(--bg-hover) transition-colors duration-100"
          onClick={() => setUnlinkedExpanded(!unlinkedExpanded)}
        >
          <span className="flex items-center gap-1.5 text-[13px] font-medium text-(--text-primary)">
            {unlinkedExpanded ? (
              <ChevronDown size={14} className="text-(--text-muted) shrink-0" />
            ) : (
              <ChevronRight size={14} className="text-(--text-muted) shrink-0" />
            )}
            Unlinked mentions
          </span>
          <span className="text-[12px] text-(--text-muted)">{unlinkedMentions.length}</span>
        </div>

        {unlinkedExpanded && (
          <div className="flex flex-col pb-2">
            {unlinkedMentions.length === 0 ? (
              <div className="px-8 py-3 text-xs text-(--text-muted) italic">No unlinked mentions</div>
            ) : (
              unlinkedMentions.map((mention) => (
                <button
                  key={mention.name}
                  className="w-full flex items-start gap-2.5 px-6 py-2 bg-transparent border-none text-left cursor-pointer transition-colors duration-100 hover:bg-(--bg-hover)"
                  onClick={() => onLinkClick(mention.name)}
                >
                  <LinkIcon size={14} className="text-(--text-muted) mt-1 shrink-0" />
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-[12.5px] font-medium text-(--text-primary) truncate">
                      {mention.name}
                    </span>
                    {mention.parentFolder && (
                      <span className="text-[11px] text-(--text-muted) truncate">
                        {mention.parentFolder}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
