import { livePreview } from './livePreview';
import { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
const editorTheme = EditorView.theme({
  '&': { height: '100%', color: '#d4d7df', backgroundColor: 'transparent', fontSize: '13px' },
  '.cm-content': { fontFamily: 'Inter, sans-serif', padding: '8px 48px 40px', lineHeight: '1.95', caretColor: '#b7a1ff', maxWidth: 'none' },
  '.cm-scroller': { overflow: 'auto' }, '.cm-gutters': { background: 'transparent', color: '#474c59', border: 'none' },
  '.cm-lineNumbers .cm-gutterElement': { padding: '0 8px 0 14px' }, '.cm-activeLine': { background: '#ffffff03' },
  '&.cm-focused': { outline: 'none' }, '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': { background: '#a58bfa26' },
}, { dark: true });
export function MarkdownEditor({ content, onChange, onOpenLink = () => {} }: { content: string; onChange: (value: string) => void; onOpenLink?: (target: string) => void }) {
  const host = useRef<HTMLDivElement>(null); const view = useRef<EditorView | null>(null); const change = useRef(onChange); change.current = onChange; const openLink = useRef(onOpenLink); openLink.current = onOpenLink;
  useEffect(() => {
    if (!host.current) return;
    const editor = new EditorView({ parent: host.current, state: EditorState.create({ doc: content, extensions: [markdown(), history(), livePreview(target => openLink.current(target)), keymap.of([...defaultKeymap, ...historyKeymap]), syntaxHighlighting(defaultHighlightStyle), EditorView.lineWrapping, editorTheme, EditorView.updateListener.of(update => { if (update.docChanged) change.current(update.state.doc.toString()); })] }) });
    view.current = editor; return () => { editor.destroy(); view.current = null; };
  }, []);
  useEffect(() => { const editor = view.current; if (editor && content !== editor.state.doc.toString()) editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: content } }); }, [content]);
  return <div className="markdown-editor" ref={host} />;
}
