/**
 * remoteCursorsPlugin.ts -- CodeMirror 6 plugin that renders remote
 * collaborator cursors and selections as decorations.
 *
 * Each remote user gets:
 *  - A colored vertical caret (WidgetType decoration)
 *  - A colored selection highlight (mark decoration)
 *  - A floating name label above the caret
 *
 * Positions are clamped to the current document length to avoid
 * out-of-range errors when documents diverge.
 */

import {
  StateField,
  StateEffect,
  type Extension,
} from '@codemirror/state';
import {
  EditorView,
  Decoration,
  DecorationSet,
  WidgetType,
} from '@codemirror/view';
import type { CursorPresence } from './collabOperations';

// ── State Effects ───────────────────────────────────────────────────────────

/** Replace the entire set of remote cursors. */
export const setCursorsEffect = StateEffect.define<CursorPresence[]>();

/** Remove a single user's cursor by user_id. */
export const removeCursorEffect = StateEffect.define<string>();

function cursorPresenceKey(presence: CursorPresence): string {
  return presence.client_id || presence.user_id;
}

// ── Cursor Caret Widget ─────────────────────────────────────────────────────

class CursorCaretWidget extends WidgetType {
  constructor(
    private readonly color: string,
    private readonly name: string,
  ) {
    super();
  }

  toDOM(): HTMLElement {
    const wrapper = document.createElement('span');
    wrapper.className = 'cm-collab-cursor-wrapper';

    // The caret line
    const caret = document.createElement('span');
    caret.className = 'cm-collab-cursor';
    caret.style.borderLeftColor = this.color;

    // The name label
    const label = document.createElement('span');
    label.className = 'cm-collab-cursor-label';
    label.style.backgroundColor = this.color;
    label.textContent = this.name;

    wrapper.appendChild(label);
    wrapper.appendChild(caret);

    return wrapper;
  }

  eq(other: CursorCaretWidget): boolean {
    return this.color === other.color && this.name === other.name;
  }

  get estimatedHeight(): number {
    return -1; // inline widget
  }

  ignoreEvent(): boolean {
    return true;
  }
}

// ── StateField: stores current remote cursors ───────────────────────────────

function buildDecorations(
  cursors: Map<string, CursorPresence>,
  docLength: number,
): DecorationSet {
  const decorations: { from: number; to: number; value: Decoration }[] = [];

  for (const [, presence] of cursors) {
    const from = Math.max(0, Math.min(presence.cursor.from, docLength));
    const to = Math.max(0, Math.min(presence.cursor.to, docLength));

    // Cursor caret widget at the `from` position
    decorations.push({
      from,
      to: from,
      value: Decoration.widget({
        widget: new CursorCaretWidget(presence.color, presence.name),
        side: 1,
      }),
    });

    // Selection highlight if there is a range
    if (from !== to) {
      const selFrom = Math.min(from, to);
      const selTo = Math.max(from, to);

      decorations.push({
        from: selFrom,
        to: selTo,
        value: Decoration.mark({
          class: 'cm-collab-selection',
          attributes: {
            style: `background-color: ${presence.color}33`, // 20% opacity via hex alpha
          },
        }),
      });
    }
  }

  // Decorations must be sorted by `from` position
  decorations.sort((a, b) => a.from - b.from || a.to - b.to);

  return Decoration.set(
    decorations.map(d => d.value.range(d.from, d.to)),
  );
}

export const remoteCursorsField = StateField.define<Map<string, CursorPresence>>({
  create() {
    return new Map();
  },

  update(cursors, tr) {
    let changed = false;
    let next = cursors;

    for (const effect of tr.effects) {
      if (effect.is(setCursorsEffect)) {
        next = new Map();
        for (const p of effect.value) {
          next.set(cursorPresenceKey(p), p);
        }
        changed = true;
      } else if (effect.is(removeCursorEffect)) {
        if (cursors.has(effect.value)) {
          next = new Map(cursors);
          next.delete(effect.value);
          changed = true;
        }
      }
    }

    // If the document changed, we need to rebuild decorations even if
    // the cursor map itself didn't change (positions may need re-clamping).
    if (tr.docChanged && !changed) {
      // Map cursor positions through the changes
      const mapped = new Map<string, CursorPresence>();
      // The changeset is the authoritative source snapshot. During rapid
      // file/tab activation the startState can briefly be stale.
      const startLen = tr.changes.length;
      for (const [id, p] of (next === cursors ? cursors : next)) {
        const safeFrom = Math.max(0, Math.min(p.cursor.from, startLen));
        const safeTo = Math.max(0, Math.min(p.cursor.to, startLen));
        const newFrom = tr.changes.mapPos(safeFrom, 1);
        const newTo = tr.changes.mapPos(safeTo, 1);
        mapped.set(id, {
          ...p,
          cursor: { from: newFrom, to: newTo },
        });
      }
      return mapped;
    }

    return changed ? next : cursors;
  },
});

/** DecorationSet derived from the remoteCursorsField. */
const remoteCursorsDecorations = EditorView.decorations.compute(
  [remoteCursorsField],
  (state) => {
    const cursors = state.field(remoteCursorsField);
    return buildDecorations(cursors, state.doc.length);
  },
);

// ── Public Extension ────────────────────────────────────────────────────────

/**
 * Returns the CodeMirror extension array for remote cursor rendering.
 * Add this to your EditorState extensions.
 */
export function remoteCursorsExtension(): Extension {
  return [
    remoteCursorsField,
    remoteCursorsDecorations,
  ];
}
