import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUp, BookOpen, Check, ChevronDown, ChevronRight, FileText, Folder, FolderOpen, GitBranch, Globe, Link2, LoaderCircle, MessageSquare, Minus, PanelRightClose, Plus, RefreshCw, Search, Settings2, Sparkles, Square, Upload, X } from 'lucide-react';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { GraphView } from './components/graph/GraphView';
import { DocumentPreview } from './components/DocumentPreview';
import { answerChat, wantsNote, noteFilename, type WebSource } from './utils/ai-chat';
import { MarkdownEditor } from './components/MarkdownEditor';
import { CitedMarkdownAnswer } from './components/ai/CitedMarkdownAnswer';
import { getAPI } from './utils/api';
import { loadWorkspaceDocuments, updateWorkspaceIndex } from './utils/workspace-index';
import { collectDocuments, type IndexedDocument } from './utils/document-ingestion';
import { embedNote, loadStoreAsync, findSimilar, resetEmbeddingsStore, seedLexicalEmbeddings, searchByQuery, isLexicalFallbackActive, flushEmbeddings, type EmbeddingStore } from './utils/embeddings';
import { enrichSuggestions } from './utils/suggestion-enrichment';
import { answerVaultQuestion, rankVaultPassages, type VaultCitation } from './utils/vault-rag';
import { loadSettingsAsync, saveSettings, getModelsForProvider, DEFAULT_MODEL_ID, _resetSettingsCache, type AISettings } from './utils/ai-settings';
import type { FileEntry } from './types';

const api = getAPI();
const titleOf = (path: string) => path.split('/').pop()?.replace(/\.(md|pdf|docx?|txt)$/i, '') || path;
const html = (content: string) => DOMPurify.sanitize(marked.parse(content, { async: false, breaks: true }) as string);
type Message = { id: number; role: 'user' | 'assistant'; content: string; citations?: VaultCitation[]; webSources?: WebSource[]; notePath?: string };

function FileTree({ entries, active, query, onOpen, level = 0 }: { entries: FileEntry[]; active: string | null; query: string; onOpen: (path: string) => void; level?: number }) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  return <>{entries.map(entry => {
    if (entry.isDirectory) {
      if (query && !collectDocuments([entry]).some(file => file.path.toLowerCase().includes(query))) return null;
      const expanded = !!query || expandedFolders.has(entry.path);
      return <div key={entry.path}><button className="tree-row folder-row" style={{ paddingLeft: 14 + level * 15 }} onClick={() => setExpandedFolders(old => { const next = new Set(old); next.has(entry.path) ? next.delete(entry.path) : next.add(entry.path); return next; })}>{expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}<Folder size={14} /><span>{entry.name}</span></button>{expanded && <FileTree entries={entry.children || []} active={active} query={query} onOpen={onOpen} level={level + 1} />}</div>;
    }
    if (!collectDocuments([entry]).length || (query && !entry.path.toLowerCase().includes(query))) return null;
    return <button key={entry.path} className={`tree-row ${active === entry.path ? 'selected' : ''}`} style={{ paddingLeft: 28 + level * 15 }} onClick={() => onOpen(entry.path)} title={entry.path}><FileText size={14} /><span>{entry.name}</span>{entry.extension !== '.md' && <small>{entry.extension.slice(1)}</small>}</button>;
  })}</>;
}

export default function App() {
  const [vault, setVault] = useState<string | null>(null); const [tree, setTree] = useState<FileEntry[]>([]);
  const [documents, setDocuments] = useState<Map<string, IndexedDocument>>(new Map()); const docsRef = useRef(documents); docsRef.current = documents;
  const [active, setActive] = useState<string | null>(null); const [content, setContent] = useState(''); const [dirty, setDirty] = useState(false); const activeRef = useRef(active); activeRef.current = active; const contentRef = useRef(content); contentRef.current = content; const dirtyRef = useRef(dirty); dirtyRef.current = dirty;
  const [view, setView] = useState<'write' | 'read' | 'graph'>('read'); const [tabs, setTabs] = useState<string[]>([]);
  const [query, setQuery] = useState(''); const [indexing, setIndexing] = useState(false); const [status, setStatus] = useState('Ready'); const [error, setError] = useState('');
  const [indexVersion, setIndexVersion] = useState(0); const store = useRef<EmbeddingStore | null>(null); const indexLock = useRef(false);
  const [aiTab, setAiTab] = useState<'chat' | 'related'>('chat'); const [showAI, setShowAI] = useState(true); const [messages, setMessages] = useState<Message[]>([]); const [question, setQuestion] = useState(''); const [asking, setAsking] = useState(false); const [askStatus, setAskStatus] = useState(''); const [scope, setScope] = useState<'folder' | 'file'>('folder'); const chatEnd = useRef<HTMLDivElement>(null);
  const [webEnabled, setWebEnabled] = useState(false);
  const [settings, setSettings] = useState<AISettings | null>(null); const [showSettings, setShowSettings] = useState(false); const [newNote, setNewNote] = useState(false); const [newName, setNewName] = useState('');
  const isMarkdown = active?.toLowerCase().endsWith('.md'); const hasKey = Boolean(settings?.apiKey.trim());

  const saveActive = useCallback(async () => {
    if (!activeRef.current || !dirtyRef.current) return;
    const path = activeRef.current; const value = contentRef.current;
    await api.writeFile(path, value);
    const old = docsRef.current.get(path); const updated = { ...(old || { path, kind: '.md', modifiedAt: Date.now(), size: value.length }), content: value, modifiedAt: Date.now() };
    const next = new Map(docsRef.current); next.set(path, updated); docsRef.current = next; setDocuments(next);
    if (activeRef.current === path && contentRef.current === value) { dirtyRef.current = false; setDirty(false); }
    setStatus('All changes saved');
    if (store.current && !indexLock.current) { void embedNote(store.current, path, value).then(() => setIndexVersion(value => value + 1)).catch(err => setError(String(err))); }
  }, []);
  useEffect(() => { if (!dirty) return; const timer = setTimeout(() => { void saveActive().catch(err => setError(String(err))); }, 800); return () => clearTimeout(timer); }, [content, dirty, saveActive]);
  useEffect(() => { const beforeUnload = (event: BeforeUnloadEvent) => { if (dirtyRef.current) { event.preventDefault(); event.returnValue = ''; } }; window.addEventListener('beforeunload', beforeUnload); return () => window.removeEventListener('beforeunload', beforeUnload); }, []);

  const openFile = useCallback(async (path: string) => {
    try {
      await saveActive(); const document = docsRef.current.get(path);
      if (!document) { setError('This document is not ready yet. Wait for indexing or refresh the folder.'); return; }
      setActive(path); activeRef.current = path; setContent(document.content); contentRef.current = document.content; setDirty(false); dirtyRef.current = false; setView('read'); setTabs(old => old.includes(path) ? old : [...old, path]);
    } catch (err) { setError(err instanceof Error ? err.message : String(err)); }
  }, [saveActive]);

  const indexFolder = useCallback(async (folder: string, switchFolder = false) => {
    if (indexLock.current) return; indexLock.current = true; setIndexing(true); setView('read'); setError('');
    try {
      await saveActive();
      if (switchFolder) { await flushEmbeddings(); resetEmbeddingsStore(); if (!(await api.setVaultPath(folder))) throw new Error('Could not open this folder.'); localStorage.setItem('noteweave:last-vault', folder); _resetSettingsCache(); setVault(folder); setMessages([]); setActive(null); activeRef.current = null; setTabs([]); setContent(''); }
      const entries = await api.getFileTree(); setTree(entries); const files = collectDocuments(entries);
      const snapshot = await loadWorkspaceDocuments(entries, setStatus); const indexed = snapshot.documents;
      docsRef.current = indexed; setDocuments(indexed); store.current = await loadStoreAsync();
      if (!window.electronAPI) { seedLexicalEmbeddings(Object.fromEntries([...indexed].map(([path, doc]) => [path, doc.content]))); store.current = await loadStoreAsync(); }
      setIndexVersion(value => value + 1);
      const first = activeRef.current && indexed.has(activeRef.current) ? activeRef.current : files.find(file => indexed.has(file.path) && file.extension === '.md')?.path || [...indexed.keys()][0];
      if (first) { setActive(first); activeRef.current = first; setContent(indexed.get(first)!.content); setTabs(old => old.includes(first) ? old : [first]); } else { setActive(null); activeRef.current = null; setContent(''); setTabs([]); }
      const result = await updateWorkspaceIndex(store.current, snapshot, setStatus); setIndexVersion(value => value + 1);
      setStatus(`${indexed.size} files ready · ${result.reused} cached, ${result.updated} updated${isLexicalFallbackActive() ? ' · keyword fallback' : ''}`);
      if (snapshot.errors.length) setError(snapshot.errors.join('\n'));
    } catch (err) { setError(err instanceof Error ? err.message : String(err)); setStatus('Indexing failed'); }
    finally { indexLock.current = false; setIndexing(false); }
  }, [saveActive]);

  useEffect(() => {
    const previousFolder = localStorage.getItem('noteweave:last-vault');
    if (window.electronAPI) {
      void api.getVaultPath().then(currentFolder => {
        const folder = currentFolder || previousFolder;
        if (folder) void indexFolder(folder, true);
      }).catch(err => setError(String(err)));
    }
    else void indexFolder('Demo workspace', true);
  }, [indexFolder]);
  useEffect(() => { if (vault) void loadSettingsAsync().then(setSettings); }, [vault]);
  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, asking, askStatus]);
  const suggestions = useMemo(() => {
    if (!active || !store.current) return [];
    const linked = new Set([...content.matchAll(/\[\[([^\]|#]+)(?:[^\]]*)\]\]/g)].map(match => match[1].replace(/\.md$/i, '').toLowerCase()));
    return enrichSuggestions(content, findSimilar(store.current, active, .35, 6).filter(item => documents.has(item.path)).map(item => ({ ...item, title: titleOf(item.path) })), new Map([...documents].map(([path, doc]) => [path, doc.content]))).map(item => ({ ...item, isLinked: item.isLinked || linked.has(item.path.replace(/\.md$/i, '').toLowerCase()) || linked.has(item.title.toLowerCase()) }));
  }, [active, content, documents, indexVersion]);

  const chooseFolder = async () => { try { const folder = await api.openVaultDialog(); if (folder) await indexFolder(folder, true); } catch (err) { setError(String(err)); } };
  const importFiles = async () => { try { await saveActive(); const paths = await api.importDocuments(); if (paths.length && vault) await indexFolder(vault); } catch (err) { setError(err instanceof Error ? err.message : String(err)); } };
  const createNote = async () => {
    try { const name = newName.trim(); if (!name || name.includes('..') || /^[\\/]/.test(name) || /[<>:"|?*]/.test(name)) throw new Error('Enter a valid relative note name.');
      const path = name.endsWith('.md') ? name : name + '.md'; await saveActive(); await api.createFile(path, `# ${titleOf(path)}\n\n`); setNewNote(false); setNewName('');
      const document = { path, content: `# ${titleOf(path)}\n\n`, kind: '.md', modifiedAt: Date.now(), size: 0 }; const next = new Map(docsRef.current); next.set(path, document); docsRef.current = next; setDocuments(next); setTree(await api.getFileTree()); await openFile(path); setView('write');
    } catch (err) { setError(err instanceof Error ? err.message : String(err)); }
  };
  const saveGeneratedNote = async (markdown: string, citations: VaultCitation[] = [], webSources: WebSource[] = []) => {
    const name = noteFilename(markdown); let path = `AI Notes/${name}.md`; let number = 1;
    while (await api.fileExists(path)) path = `AI Notes/${name} (${number++}).md`;
    let note = markdown.replace(/^```(?:markdown|md)?\s*\n([\s\S]*?)\n```\s*$/, '$1');
    if (!/^#\s/m.test(note)) note = `# ${name}\n\n${note}`;
    note = note.replace(/\[(\d+)\]/g, (match, id) => { const source = citations.find(item => item.id === Number(id)); return source ? `[[${source.path.replace(/\.md$/i, '')}|${source.title}]]` : match; });
    if (citations.length || webSources.length) note += '\n\n## Sources\n\n' + [...citations.map(item => `- [[${item.path.replace(/\.md$/i, '')}|${item.title}]]`), ...webSources.map(item => `- [${item.title.replace(/[\[\]]/g, '')}](${item.url})`)].join('\n');
    await api.createFile(path, note + '\n');
    const document = { path, content: note, kind: '.md', modifiedAt: Date.now(), size: note.length }; const next = new Map(docsRef.current); next.set(path, document); docsRef.current = next; setDocuments(next); setTree(await api.getFileTree());
    if (store.current) { void embedNote(store.current, path, note).then(() => setIndexVersion(value => value + 1)).catch(err => setError(String(err))); }
    return path;
  };
  const insertSuggestedLink = async (path: string) => {
    if (!activeRef.current?.endsWith('.md')) return;
    try { await saveActive(); const link = `[[${path.replace(/\.md$/i, '')}]]`; const next = contentRef.current.trimEnd() + '\n\n' + link + '\n'; contentRef.current = next; dirtyRef.current = true; setContent(next); setDirty(true); await saveActive(); } catch (err) { setError(String(err)); }
  };
  const ask = async (prompt = question) => {
    if (!prompt.trim() || asking) return;
    if (!hasKey) { setShowSettings(true); return; }
    setQuestion(''); setAsking(true); setError(''); setAskStatus('Finding relevant passages…');
    const previous = messages.slice(-4); setMessages(old => [...old, { id: Date.now(), role: 'user', content: prompt }]);
    try {
      await saveActive();
      const relevant = store.current ? await searchByQuery(store.current, prompt, 20) : []; const scores = new Map(relevant.map(item => [item.path, item.similarity]));
      const available = [...docsRef.current.values()].filter(doc => scope === 'folder' || doc.path === activeRef.current);
      const passages = rankVaultPassages(prompt, available.map(doc => ({ path: doc.path, content: doc.content, semanticScore: scores.get(doc.path) || 0 })), 14, /summari|overview/i.test(prompt));
      const context = previous.map(message => `${message.role}: ${message.content.slice(0, 600)}`).join('\n');
      const generate = wantsNote(prompt);
      const web = webEnabled || /\b(internet|web|online|latest|external|references|resources)\b/i.test(prompt);
      if (generate || web) {
        setAskStatus(web ? 'Searching the web and writing…' : 'Writing your note…');
        const result = await answerChat(prompt, passages, context, web, generate);
        const notePath = generate ? await saveGeneratedNote(result.answer, passages, result.webSources) : undefined;
        setMessages(old => [...old, { id: Date.now(), role: 'assistant', content: result.answer, citations: passages, webSources: result.webSources, notePath }]);
        if (notePath) await openFile(notePath);
        return;
      }
      const result = await answerVaultQuestion(context ? `Previous conversation (for interpreting the question only):\n${context}\n\nCurrent question: ${prompt}` : prompt, passages, setAskStatus);
      setMessages(old => [...old, { id: Date.now(), role: 'assistant', content: result.answer, citations: result.citations }]);
    } catch (err) { setMessages(old => [...old, { id: Date.now(), role: 'assistant', content: `Unable to answer: ${err instanceof Error ? err.message : String(err)}` }]); }
    finally { setAsking(false); setAskStatus(''); }
  };
  useEffect(() => { const handle = (event: KeyboardEvent) => { if (!(event.ctrlKey || event.metaKey)) return; if (event.key === 's') { event.preventDefault(); void saveActive().catch(err => setError(String(err))); } if (event.key === 'n') { event.preventDefault(); if (vault) setNewNote(true); } if (event.key === 'g') { event.preventDefault(); if (vault) setView('graph'); } }; window.addEventListener('keydown', handle); return () => window.removeEventListener('keydown', handle); }, [saveActive, vault]);

  return <div className="app-shell">
    <header className="titlebar"><div className="brand"><span className="brand-mark"><GitBranch size={18} /></span>noteweave<span className="brand-beta">LOCAL WORKSPACE</span></div><div className="titlebar-center">A space to connect your thinking</div><div className="window-controls"><button title="Minimize" onClick={() => api.minimizeWindow()}><Minus size={13} /></button><button title="Maximize" onClick={() => api.maximizeWindow()}><Square size={11} /></button><button title="Close" onClick={async () => { try { await saveActive(); api.closeWindow(); } catch (err) { setError(String(err)); } }}><X size={15} /></button></div></header>
    {!vault ? <main className="welcome"><div className="welcome-art"><GitBranch size={42} /></div><span className="eyebrow">YOUR IDEAS, CONNECTED</span><h1>Make room for<br />your next idea.</h1><p>A calm home for your notes and documents.<br />Find connections. Ask better questions. Think with AI.</p><button className="primary-button" onClick={chooseFolder}><FolderOpen size={17} /> Open a folder <ChevronRight size={16} /></button><div className="welcome-formats">Markdown <span>·</span> PDF <span>·</span> Word <span>·</span> Plain text</div><div className="welcome-features"><span><Link2 size={15} /> Local embeddings</span><span><GitBranch size={15} /> Knowledge graph</span><span><Sparkles size={15} /> Cited AI answers</span></div></main> : <div className="workspace">
      <aside className="left-panel"><button className="vault-switch" title={vault} disabled={indexing || asking} onClick={chooseFolder}><span className="vault-icon"><FolderOpen size={17} /></span><span><strong>{vault.split(/[\\/]/).pop()}</strong><small>{window.electronAPI ? 'Local folder' : 'Browser demo'}</small></span><ChevronDown size={14} /></button><div className="sidebar-actions"><button disabled={indexing} onClick={() => setNewNote(true)}><Plus size={15} /> New note</button><button title="Import documents" disabled={indexing || asking} onClick={importFiles}><Upload size={15} /></button></div><div className="search-input"><Search size={14} /><input aria-label="Search files" placeholder="Find a file…" value={query} onChange={event => setQuery(event.target.value.toLowerCase())} /><kbd>⌕</kbd></div><div className="section-label">WORKSPACE<button disabled={indexing || asking} title="Refresh files and index" onClick={() => void indexFolder(vault)}><RefreshCw size={12} className={indexing ? 'spin' : ''} /></button></div><div className="file-tree"><FileTree entries={tree} active={active} query={query} onOpen={path => void openFile(path)} />{!collectDocuments(tree).length && <p className="empty-files">Add a note or import your first document.</p>}</div><button className={`graph-nav ${view === 'graph' ? 'active' : ''}`} onClick={async () => { try { await saveActive(); setView('graph'); } catch (err) { setError(String(err)); } }}><GitBranch size={16} /><span>Knowledge graph</span><kbd>⌘ G</kbd></button><div className="sidebar-footer"><span className="local-dot" /> Your files. Your workspace.<button title="AI settings" onClick={() => setShowSettings(true)}><Settings2 size={16} /></button></div></aside>
      <main className="center-panel"><div className="tabbar">{tabs.map(path => <button key={path} className={`file-tab ${active === path && view !== 'graph' ? 'active' : ''}`} onClick={() => void openFile(path)}><FileText size={13} /><span>{titleOf(path)}</span>{active === path && dirty ? <span className="unsaved-dot" /> : null}</button>)}{view === 'graph' && <button className="file-tab active"><GitBranch size={13} /> Graph</button>}<button className="new-tab" title="New note" disabled={indexing} onClick={() => setNewNote(true)}><Plus size={16} /></button><button className="toggle-ai" title="Toggle AI panel" onClick={() => setShowAI(!showAI)}><PanelRightClose size={16} /></button></div>
        {view === 'graph' ? <div className="graph-host"><GraphView vaultPath={vault} theme="dark" onClose={() => setView('read')} onNodeClick={(name, _heading, path) => { const target = path || [...documents.keys()].find(file => titleOf(file) === name); if (target) void openFile(target); else setError(`No file exists for the linked note “${name}”.`); }} /></div> : active ? <><div className="document-toolbar"><div className="breadcrumbs"><Folder size={13} /><span>{active.includes('/') ? active.substring(0, active.lastIndexOf('/')) : 'Workspace'}</span><ChevronRight size={12} /><strong>{active.split('/').pop()}</strong></div><div className="editor-modes">{isMarkdown && <><button disabled={indexing} className={view === 'write' ? 'active' : ''} onClick={() => setView('write')}>Write</button><button className={view === 'read' ? 'active' : ''} onClick={() => setView('read')}>Read</button></>}{!isMarkdown && <button onClick={() => void api.openPath(active).then(message => { if (message) setError(message); })}>Open original</button>}</div></div><div className="document-header"><span className="eyebrow">{isMarkdown ? 'YOUR NOTES' : 'DOCUMENT PREVIEW'}</span><h1>{titleOf(active)}</h1><div className="document-meta"><span><FileText size={12} />{isMarkdown ? 'Markdown' : active.split('.').pop()?.toUpperCase()}</span><span><Link2 size={12} />{suggestions.length} connections</span><span className="saved-indicator">{dirty ? 'Saving…' : <><Check size={12} /> Saved locally</>}</span></div></div>{view === 'write' && isMarkdown ? <MarkdownEditor key={active} content={content} onOpenLink={target => { if (/^https?:\/\//i.test(target)) void api.openExternal(target); else { const path = [...documents.keys()].find(path => path === target || path.replace(/\.md$/i, '') === target || titleOf(path) === target); if (path) void openFile(path); } }} onChange={value => { contentRef.current = value; dirtyRef.current = true; setContent(value); setDirty(true); }} /> : /\.(pdf|docx)$/i.test(active) ? <DocumentPreview key={active} path={active} /> : <article className="reading-view" onClick={event => { const link = (event.target as HTMLElement).closest('a'); if (link) { event.preventDefault(); const target = decodeURI(link.getAttribute('href') || ''); if (/^https?:\/\//i.test(target)) { void api.openExternal(target); return; } const found = [...documents.keys()].find(path => path === target || path.replace(/\.md$/i, '') === target || titleOf(path) === target); if (found) void openFile(found); } }} dangerouslySetInnerHTML={{ __html: html(content.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_match, target, label) => `[${label || target}](${encodeURI(target)})`)) }} />}<section className="note-suggestions" aria-label="Suggested links"><div className="suggestion-strip-heading"><span><Link2 size={13} /> Suggested connections</span><button onClick={() => { setShowAI(true); setAiTab('related'); }}>See all <ChevronRight size={12} /></button></div>{suggestions.length ? <div className="suggestion-strip-cards">{suggestions.slice(0, 3).map(item => <div className="note-link-card" key={item.path}><button onClick={() => void openFile(item.path)} title={item.reason}><FileText size={12} /><span>{item.title}</span><small>{Math.round(item.similarity * 100)}%</small></button>{isMarkdown && <button className="add-note-link" disabled={item.isLinked} title={item.isLinked ? 'Already linked' : 'Insert wiki link'} onClick={() => void insertSuggestedLink(item.path)}>{item.isLinked ? <Check size={13} /> : <Plus size={13} />}</button>}</div>)}</div> : <p>{indexing ? 'Finding connections as your files are indexed…' : 'No close matches yet. Add related content to discover links.'}</p>}</section></> : <div className="center-empty"><BookOpen size={36} /><h2>Start with a thought.</h2><p>Create a note or select a document from your folder.</p><button className="primary-button" onClick={() => setNewNote(true)}><Plus size={15} /> Create a note</button></div>}
      </main>
      {showAI && <aside className="ai-panel"><div className="ai-header"><span className="ai-icon"><Sparkles size={17} /></span><div><strong>Thinking partner</strong><small>Grounded in your workspace</small></div><button title="AI settings" onClick={() => setShowSettings(true)}><Settings2 size={16} /></button></div><div className="ai-tabs"><button className={aiTab === 'chat' ? 'active' : ''} onClick={() => setAiTab('chat')}><MessageSquare size={13} /> Chat</button><button className={aiTab === 'related' ? 'active' : ''} onClick={() => setAiTab('related')}><Link2 size={13} /> Related <span>{suggestions.length}</span></button></div>
        {aiTab === 'chat' ? <><div className="chat-scroll">{!messages.length ? <div className="chat-welcome"><span className="chat-sparkle"><Sparkles size={25} /></span><h2>A new perspective<br />is a question away.</h2><p>Explore ideas across your notes and documents. Every answer connects back to its sources.</p><div className="prompt-cards">{[{ title: 'See the bigger picture', detail: 'Summarize ideas across this folder', prompt: 'Summarize the main ideas across this folder.' }, { title: 'Connect the dots', detail: 'Find relationships in my research', prompt: 'What connections exist between the ideas in my notes and documents?' }, { title: 'Go a little deeper', detail: 'Explain the document I’m reading', prompt: `Explain the key ideas in ${active ? titleOf(active) : 'my documents'}.` }].map(item => <button disabled={indexing || asking} key={item.title} onClick={() => void ask(item.prompt)}><span><strong>{item.title}</strong><small>{item.detail}</small></span><ChevronRight size={14} /></button>)}</div><div className="chat-quick-actions"><button disabled={indexing || asking} onClick={() => void ask(`Find useful internet references about ${active ? titleOf(active) : 'the ideas in my documents'}.`)}><Globe size={12} /> Web references</button><button disabled={indexing || asking} onClick={() => void ask(`Create a Markdown note summarizing ${active ? titleOf(active) : 'my research documents'}.`)}><Plus size={12} /> Create a note</button></div>{!hasKey && <button className="connect-ai" onClick={() => setShowSettings(true)}><Settings2 size={13} /> Connect your AI provider</button>}</div> : messages.map(message => <div key={message.id} className={`chat-message ${message.role}`}><div className="message-role">{message.role === 'assistant' ? <><Sparkles size={12} /> NOTEWEAVE</> : 'YOU'}</div>{message.role === 'user' ? <p>{message.content}</p> : <><div onClick={event => { const anchor = (event.target as HTMLElement).closest('a'); if (anchor && /^https?:\/\//i.test(anchor.href)) { event.preventDefault(); void api.openExternal(anchor.href); } }}><CitedMarkdownAnswer answer={message.content} citations={message.citations || []} className="answer-markdown" citationClassName="citation-chip" onOpenNote={path => void openFile(path)} /></div>{!!message.webSources?.length && <div className="web-source-list"><span>WEB REFERENCES</span>{message.webSources.map(source => <button key={source.url} onClick={() => void api.openExternal(source.url)}><Globe size={11} />{source.title}</button>)}</div>}{message.notePath ? <button className="save-answer-note" onClick={() => void openFile(message.notePath!)}><Check size={13} /> Open created note</button> : <button className="save-answer-note" disabled={asking || indexing} onClick={() => { void saveGeneratedNote(message.content, message.citations, message.webSources).then(path => { setMessages(old => old.map(item => item.id === message.id ? { ...item, notePath: path } : item)); return openFile(path); }).catch(err => setError(String(err))); }}><Plus size={13} /> Save as note</button>}</>}</div>)}{asking && <div className="thinking-status"><LoaderCircle size={14} className="spin" />{askStatus}</div>}<div ref={chatEnd} /></div><div className="chat-composer"><div className="scope-row"><span><span className="local-dot" />{documents.size} indexed files</span><button type="button" className={`web-toggle ${webEnabled ? 'active' : ''}`} aria-pressed={webEnabled} title="Search the internet for cited references" onClick={() => setWebEnabled(!webEnabled)}><Globe size={11} />Web {webEnabled ? 'on' : 'off'}</button><select aria-label="AI context" value={scope} onChange={event => setScope(event.target.value as 'folder' | 'file')}><option value="folder">Entire folder</option><option value="file">Current file</option></select></div><form onSubmit={event => { event.preventDefault(); void ask(); }}><textarea aria-label="Ask your documents" placeholder="Ask your notes and documents…" value={question} onChange={event => setQuestion(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void ask(); } }} /><div className="composer-bottom"><span><Sparkles size={12} />{hasKey ? settings?.modelId.split('/').pop() : 'Connect AI to begin'}</span><button aria-label="Send question" disabled={!question.trim() || asking || indexing}><ArrowUp size={16} /></button></div></form><p>AI can make mistakes. Follow the sources.</p></div></> : <div className="related-panel"><span className="eyebrow">DISCOVER CONNECTIONS</span><h2>Ideas worth connecting.</h2><p className="related-description">Found with the same local embedding engine as your reference app.</p>{suggestions.map(item => <button className="suggestion-card" key={item.path} onClick={() => void openFile(item.path)}><div><FileText size={14} /><strong>{item.title}</strong><span>{Math.round(item.similarity * 100)}%</span></div><p>{item.reason}</p><small>{item.typeLabel}{item.isLinked ? ' · Already linked' : ' · Explore connection'}</small></button>)}{!suggestions.length && <p className="empty-files">{indexing ? 'Connections appear as your files are indexed.' : 'Select a file to discover related ideas. Add more notes and documents to build connections.'}</p>}<div className="related-footer"><span className="local-dot" /> Computed on your device</div></div>}
      </aside>}
    </div>}
    {error && <div className="error-banner" role="alert"><span>{error}</span><button title="Dismiss error" onClick={() => setError('')}><X size={15} /></button></div>}
    <footer className="statusbar"><span>{indexing ? <LoaderCircle size={11} className="spin" /> : <span className="local-dot" />}{status}</span><span>{active ? `${content.trim().split(/\s+/).filter(Boolean).length} words` : 'Local-first'}<span className="status-divider">|</span>Markdown + documents<span className="status-divider">|</span>NoteWeave</span></footer>
    {newNote && <div className="modal-backdrop" onClick={() => setNewNote(false)}><form className="settings-modal" onClick={event => event.stopPropagation()} onSubmit={event => { event.preventDefault(); void createNote(); }}><div className="modal-heading"><h2>A fresh page.</h2><button type="button" onClick={() => setNewNote(false)}><X size={18} /></button></div><p>Name your note. Use a folder path to organize it.</p><label>Note name<input autoFocus placeholder="Research/My next idea" value={newName} onChange={event => setNewName(event.target.value)} /></label><button className="primary-button" disabled={!newName.trim()}><Plus size={15} /> Create note</button></form></div>}
    {showSettings && <div className="modal-backdrop" onClick={() => setShowSettings(false)}><form className="settings-modal" onClick={event => event.stopPropagation()} onSubmit={event => { event.preventDefault(); if (settings) { saveSettings({ ...settings, apiKey: settings.apiKey.trim(), modelId: settings.modelId.trim() }); setShowSettings(false); } }}><div className="modal-heading"><h2>Connect your thinking partner.</h2><button type="button" onClick={() => setShowSettings(false)}><X size={18} /></button></div><p>Your notes and local search work without an account. Add a provider key for cited AI answers.</p>{settings && <><label>Provider<select value={settings.provider} onChange={event => { const provider = event.target.value as AISettings['provider']; setSettings({ ...settings, provider, apiKey: settings.providerKeys?.[provider] || '', providerKeys: { ...settings.providerKeys, [settings.provider]: settings.apiKey }, modelId: provider === 'openrouter' ? DEFAULT_MODEL_ID : getModelsForProvider(provider)[0].id }); }}><option value="openrouter">OpenRouter</option><option value="openai">OpenAI</option></select></label><label>API key<input type="password" autoComplete="off" placeholder="Your provider API key" value={settings.apiKey} onChange={event => setSettings({ ...settings, apiKey: event.target.value })} /></label><label>Model<select aria-label="AI model" value={getModelsForProvider(settings.provider).some(model => model.id === settings.modelId) ? settings.modelId : "custom"} onChange={event => setSettings({ ...settings, modelId: event.target.value === "custom" ? "" : event.target.value })}>{getModelsForProvider(settings.provider).map(model => <option key={model.id} value={model.id}>{model.label}</option>)}<option value="custom">Custom model ID…</option></select></label>{!getModelsForProvider(settings.provider).some(model => model.id === settings.modelId) && <label>Custom model ID<input aria-label="Custom model ID" placeholder="provider/model-name" value={settings.modelId} onChange={event => setSettings({ ...settings, modelId: event.target.value })} /></label>}<label>Compatible API base URL <small>(optional)</small><input placeholder="Use provider default" value={settings.customBaseUrl} onChange={event => setSettings({ ...settings, customBaseUrl: event.target.value })} /></label><div className="settings-note"><Folder size={14} /> Credentials are saved locally. Relevant passages are sent to your chosen provider when you ask a question.</div><button className="primary-button" disabled={!settings.modelId.trim()}><Check size={15} /> Save settings</button></>}</form></div>}
  </div>;
}
