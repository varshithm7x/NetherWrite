import { syntaxTree } from '@codemirror/language';
import { Decoration, EditorView, ViewPlugin, WidgetType, type DecorationSet, type ViewUpdate } from '@codemirror/view';
import type { Range } from '@codemirror/state';
class LinkWidget extends WidgetType {
  constructor(readonly label: string, readonly target: string, readonly open: (target: string) => void) { super(); }
  eq(other: LinkWidget) { return other.label === this.label && other.target === this.target; }
  toDOM() { const link = document.createElement('a'); link.className = 'cm-live-link'; link.textContent = this.label; link.href = '#'; link.onclick = event => { event.preventDefault(); this.open(this.target); }; return link; }
  ignoreEvent() { return true; }
}
class BulletWidget extends WidgetType {
  toDOM() { const span = document.createElement('span'); span.className = 'cm-live-bullet'; span.textContent = '• '; return span; }
}
export function livePreview(open: (target: string) => void) {
  return ViewPlugin.fromClass(class {
    decorations: DecorationSet;
    constructor(view: EditorView) { this.decorations = this.build(view); }
    update(update: ViewUpdate) { if (update.docChanged || update.selectionSet || update.viewportChanged || update.focusChanged) this.decorations = this.build(update.view); }
    build(view: EditorView) {
      const ranges: Range<Decoration>[] = []; const doc = view.state.doc;
      const active = (from: number, to: number) => view.hasFocus && view.state.selection.ranges.some(selection => selection.from <= to && selection.to >= from);
      const hide = (from: number, to: number) => { if (to > from) ranges.push(Decoration.replace({}).range(from, to)); };
      for (const visible of view.visibleRanges) {
        for (let number = doc.lineAt(visible.from).number; number <= doc.lineAt(visible.to).number; number++) {
          const line = doc.line(number); const editing = active(line.from, line.to);
          const heading = /^(#{1,6})\s+/.exec(line.text);
          if (heading) { ranges.push(Decoration.line({ class: `cm-live-heading cm-live-h${heading[1].length}` }).range(line.from)); if (!editing) hide(line.from, line.from + heading[0].length); }
          const quote = /^(\s*>\s?)/.exec(line.text);
          if (quote) { ranges.push(Decoration.line({ class: 'cm-live-quote' }).range(line.from)); if (!editing) hide(line.from, line.from + quote[0].length); }
          const list = /^(\s*)([-+*])\s+/.exec(line.text);
          if (list && !editing) ranges.push(Decoration.replace({ widget: new BulletWidget() }).range(line.from + list[1].length, line.from + list[0].length));
          if (!editing) for (const match of line.text.matchAll(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g)) ranges.push(Decoration.replace({ widget: new LinkWidget(match[2] || match[1], match[1], open) }).range(line.from + match.index!, line.from + match.index! + match[0].length));
        }
        syntaxTree(view.state).iterate({ from: visible.from, to: visible.to, enter: node => {
          const line = doc.lineAt(node.from);
          if (active(line.from, line.to)) return;
          if (node.name === 'FencedCode' || node.name === 'CodeBlock') { for (let n = line.number; n <= doc.lineAt(node.to).number; n++) { const codeLine = doc.line(n); const fence = /^\s*(```|~~~)/.test(codeLine.text); ranges.push(Decoration.line({ class: fence ? 'cm-live-fence' : 'cm-live-codeblock' }).range(codeLine.from)); if (fence) hide(codeLine.from, codeLine.to); } return false; }
          if (node.name === 'Link') { const source = doc.sliceString(node.from, node.to); const match = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(source); if (match) { ranges.push(Decoration.replace({ widget: new LinkWidget(match[1], match[2], open) }).range(node.from, node.to)); return false; } }
          const styles: Record<string, string> = { StrongEmphasis: 'cm-live-strong', Emphasis: 'cm-live-emphasis', InlineCode: 'cm-live-code', Strikethrough: 'cm-live-strike' };
          if (styles[node.name]) ranges.push(Decoration.mark({ class: styles[node.name] }).range(node.from, node.to));
          if (['EmphasisMark', 'CodeMark', 'StrikethroughMark'].includes(node.name)) hide(node.from, node.to);
        } });
      }
      return Decoration.set(ranges, true);
    }
  }, { decorations: plugin => plugin.decorations });
}
