/**
 * Heading Fold Extension for CodeMirror 6
 *
 * Allows folding/collapsing content under markdown headings.
 * Click the fold gutter to toggle, or use keyboard shortcuts.
 */

import {
  EditorView,
  Decoration,
  DecorationSet,
  gutter,
  GutterMarker,
  WidgetType,
} from "@codemirror/view";
import {
  StateField,
  StateEffect,
  RangeSetBuilder,
  EditorState,
} from "@codemirror/state";

// Effect to toggle fold at a position
const toggleFold = StateEffect.define<{ from: number; to: number }>();

// Track folded ranges
const foldedRanges = StateField.define<Set<string>>({
  create() {
    return new Set();
  },
  update(folded, tr) {
    let newFolded = folded;
    for (const effect of tr.effects) {
      if (effect.is(toggleFold)) {
        const key = `${effect.value.from}-${effect.value.to}`;
        newFolded = new Set(folded);
        if (newFolded.has(key)) {
          newFolded.delete(key);
        } else {
          newFolded.add(key);
        }
      }
    }
    return newFolded;
  },
});

// Find heading ranges in the document
function findHeadingRanges(
  state: EditorState,
): { level: number; from: number; to: number; foldFrom: number; lineFrom: number; lineTo: number }[] {
  const headings: {
    level: number;
    from: number;
    to: number;
    foldFrom: number;
    lineFrom: number;
    lineTo: number;
  }[] = [];
  const doc = state.doc;

  for (let i = 1; i <= doc.lines; i++) {
    const line = doc.line(i);
    const text = line.text;
    const match = text.match(/^(#{1,6})\s/);

    if (match) {
      const level = match[1].length;
      const from = line.from;

      // Find where this heading's content ends (next heading of same or higher level, or end of doc)
      let to = doc.length;
      for (let j = i + 1; j <= doc.lines; j++) {
        const nextLine = doc.line(j);
        const nextMatch = nextLine.text.match(/^(#{1,6})\s/);
        if (nextMatch && nextMatch[1].length <= level) {
          to = doc.line(j - 1).to;
          break;
        }
      }

      // Only add if there's content to fold
      if (to > line.to) {
        const foldFrom = Math.min(line.to + 1, doc.length);
        if (to >= foldFrom) {
          headings.push({ level, from, to, foldFrom, lineFrom: line.to, lineTo: line.to });
        }
      }
    }
  }

  return headings;
}

// Gutter marker for fold indicator
class FoldMarker extends GutterMarker {
  constructor(readonly folded: boolean) {
    super();
  }

  toDOM() {
    const span = document.createElement("span");
    span.className = `fold-marker ${this.folded ? "folded" : "open"}`;
    span.title = this.folded ? "Unfold" : "Fold";
    span.setAttribute("aria-label", this.folded ? "Unfold heading" : "Fold heading");
    span.innerHTML = [
      '<svg class="fold-marker-icon" viewBox="0 0 24 24" aria-hidden="true">',
      '<path d="m9 18 6-6-6-6" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"></path>',
      "</svg>",
    ].join("");
    return span;
  }
}

// Fold gutter
const foldGutter = gutter({
  class: "cm-foldGutter",
  markers: (view) => {
    const builder = new RangeSetBuilder<GutterMarker>();
    const folded = view.state.field(foldedRanges);
    const headings = findHeadingRanges(view.state);

    for (const heading of headings) {
      const key = `${heading.foldFrom}-${heading.to}`;
      const isFolded = folded.has(key);
      builder.add(heading.from, heading.from, new FoldMarker(isFolded));
    }

    return builder.finish();
  },
  domEventHandlers: {
    mousedown: (view, line, event) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest(".fold-marker")) return false;
      event.preventDefault();
      event.stopPropagation();
      const headings = findHeadingRanges(view.state);
      const heading = headings.find((h) => {
        const headingLine = view.state.doc.lineAt(h.from);
        return headingLine.from === line.from;
      });

      if (heading) {
        view.dispatch({
          effects: toggleFold.of({ from: heading.foldFrom, to: heading.to }),
        });
        view.focus();
        return true;
      }
      return false;
    },
  },
});

// Decoration for folded content
class FoldWidget extends WidgetType {
  toDOM() {
    const span = document.createElement("span");
    span.className = "fold-placeholder";
    span.textContent = "...";
    span.title = "Click to expand";
    return span;
  }
}

const foldDecoration = Decoration.replace({
  widget: new FoldWidget(),
});

function buildFoldDecorations(state: EditorState): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const folded = state.field(foldedRanges);

  const sortedFolds = Array.from(folded)
    .map((key) => {
      const [from, to] = key.split("-").map(Number);
      return { from, to };
    })
    .sort((a, b) => a.from - b.from);

  for (const { from, to } of sortedFolds) {
    if (from < to && from < state.doc.length) {
      builder.add(from, to, foldDecoration);
    }
  }

  return builder.finish();
}

const foldDecorations = StateField.define<DecorationSet>({
  create(state) {
    return buildFoldDecorations(state);
  },
  update(decorations, tr) {
    if (
      tr.docChanged ||
      tr.state.field(foldedRanges) !== tr.startState.field(foldedRanges)
    ) {
      return buildFoldDecorations(tr.state);
    }
    return decorations.map(tr.changes);
  },
  provide: (field) => EditorView.decorations.from(field),
});

// Theme for fold gutter and markers
export const foldTheme = EditorView.theme({
  ".cm-foldGutter": {
    width: "18px",
    cursor: "pointer",
    backgroundColor: "transparent",
    border: "none",
  },
  ".fold-marker": {
    color: "var(--text-muted)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "16px",
    height: "1.4em",
    borderRadius: "var(--radius-sm)",
    lineHeight: "1",
    opacity: "0",
    userSelect: "none",
    transition: "opacity 120ms ease, color 120ms ease, background-color 120ms ease",
  },
  ".fold-marker-icon": {
    width: "14px",
    height: "14px",
    flex: "0 0 auto",
    transform: "rotate(0deg)",
    transition: "transform 120ms ease",
  },
  ".fold-marker.open .fold-marker-icon": {
    transform: "rotate(90deg)",
  },
  ".fold-marker:hover": {
    color: "var(--text-primary)",
    backgroundColor: "var(--bg-hover)",
  },
  ".fold-marker.folded": {
    color: "var(--accent-primary)",
    opacity: "1",
  },
  ".cm-editor:hover .fold-marker, .cm-editor.cm-focused .fold-marker": {
    opacity: "1",
  },
  ".fold-placeholder": {
    background: "var(--bg-tertiary)",
    color: "var(--text-muted)",
    padding: "0 4px",
    borderRadius: "3px",
    fontSize: "12px",
    cursor: "pointer",
  },
  ".fold-placeholder:hover": {
    background: "var(--bg-hover)",
  },
});

// Keyboard shortcut to fold/unfold at cursor
export function foldAtCursor(view: EditorView): boolean {
  const pos = view.state.selection.main.head;
  const line = view.state.doc.lineAt(pos);
  const headings = findHeadingRanges(view.state);

  // Find heading that contains cursor
  const heading = headings.find((h) => {
    const headingLine = view.state.doc.lineAt(h.from);
    return line.from >= headingLine.from && line.from <= h.to;
  });

  if (heading) {
    view.dispatch({
      effects: toggleFold.of({ from: heading.foldFrom, to: heading.to }),
    });
    return true;
  }

  return false;
}

// Export the complete extension
export function headingFold() {
  return [foldedRanges, foldGutter, foldDecorations, foldTheme];
}
