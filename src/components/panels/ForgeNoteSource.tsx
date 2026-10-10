import { useEffect, useId, useMemo, useState } from "react";
import type { KeyboardEvent } from "react";
import { searchForgeNotes } from "../../utils/forge-note-source";
import type { ForgeSourceContext, ForgeSourceNote } from "../../utils/forge-note-source";

export function useForgeNoteSource(context: ForgeSourceContext, onSelectionChange: () => void) {
  const { activeNote, notes = [], vaultPath } = context;
  const [selected, setSelected] = useState<ForgeSourceNote | null>(null);
  const [query, setQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const source = selected ? notes.find(note => note.path === selected.path) || selected : activeNote;
  const available = !!source && /\.md$/i.test(source.path) && notes.some(note => note.path === source.path);
  const matches = useMemo(() => dropdownOpen ? searchForgeNotes(notes, query) : [], [dropdownOpen, notes, query]);
  const pendingSelection = query.length > 0 && query !== (selected ? `@${selected.path}` : "");
  useEffect(() => { setSelected(null); setQuery(""); setDropdownOpen(false); }, [vaultPath]);
  function select(note: ForgeSourceNote) {
    setSelected(note); setQuery(`@${note.path}`); setDropdownOpen(false); onSelectionChange();
  }
  function reset() { setSelected(null); setQuery(""); setDropdownOpen(false); onSelectionChange(); }
  function change(value: string) { setQuery(value); setDropdownOpen(value.startsWith("@")); setHighlighted(0); }
  function keyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!dropdownOpen) return;
    if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); setDropdownOpen(false); }
    else if (matches.length && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      event.preventDefault(); setHighlighted(index => (index + (event.key === "ArrowDown" ? 1 : -1) + matches.length) % matches.length);
    } else if (event.key === "Enter") { event.preventDefault(); if (matches.length) select(matches[Math.min(highlighted, matches.length - 1)]); }
  }
  return { selected, query, dropdownOpen, highlighted, source, available, matches, pendingSelection, select, reset, change, keyDown };
}

const focusClass = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--interactive-accent)";
interface ForgeNoteSourceProps {
  state: ReturnType<typeof useForgeNoteSource>;
  disabled: boolean;
  displayedSource?: ForgeSourceNote | null;
}

export function ForgeNoteSource({ state, disabled, displayedSource = state.source }: ForgeNoteSourceProps) {
  const listId = useId();
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label htmlFor={`${listId}-input`} className="font-medium">Source note</label>
        <button type="button" disabled={disabled} onClick={state.reset} className={`rounded text-(--text-muted) hover:text-(--text-primary) disabled:opacity-50 ${focusClass}`}>Current Note</button>
      </div>
      <div className="mb-2 rounded-md border border-(--border-subtle) p-2">
        <p className="m-0 break-words font-medium">{displayedSource?.name || "No current Markdown note"}</p>
        {displayedSource && <p className="mb-0 mt-1 break-all text-[10px] text-(--text-muted)">{displayedSource.path}</p>}
        {!state.selected && !disabled && <span className="mt-1 block text-[10px] text-(--text-muted)">Current Note</span>}
      </div>
      <input id={`${listId}-input`} role="combobox" aria-label="Select source note" aria-autocomplete="list" aria-expanded={state.dropdownOpen} aria-controls={listId}
        aria-activedescendant={state.dropdownOpen && state.matches.length ? `${listId}-${Math.min(state.highlighted, state.matches.length - 1)}` : undefined}
        value={state.query} disabled={disabled} autoComplete="off" placeholder="Type @ to select another note"
        className={`w-full min-w-0 rounded-md border border-(--border-medium) bg-(--bg-secondary) px-2.5 py-2 text-xs text-(--text-primary) ${focusClass}`}
        onChange={event => state.change(event.target.value)} onKeyDown={state.keyDown} />
      {state.dropdownOpen && (
        <div id={listId} role="listbox" aria-label="Vault notes" className="mt-1 max-h-48 overflow-y-auto rounded-md border border-(--border-medium) bg-(--bg-secondary)">
          {state.matches.length ? state.matches.map((note, index) => (
            <div id={`${listId}-${index}`} key={note.path} role="option" aria-selected={index === state.highlighted} onMouseDown={event => event.preventDefault()} onClick={() => state.select(note)}
              className={`cursor-pointer px-2.5 py-2 hover:bg-(--bg-hover) ${index === state.highlighted ? "bg-(--bg-active)" : ""}`}>
              <span className="block break-words">{note.name}</span><span className="mt-0.5 block break-all text-[10px] text-(--text-muted)">{note.path}</span>
            </div>
          )) : <p className="m-0 p-2 text-(--text-muted)">No matching notes</p>}
        </div>
      )}
      {!state.available && <p className="mb-0 mt-2 text-(--text-muted)">{state.source ? "This source was moved, renamed, or removed. Select it again." : "Open a Markdown note or select one with @."}</p>}
    </div>
  );
}
