import type { ElectronAPI } from '../../electron/preload';
import type { FileEntry } from '../types';
const initialFiles: Record<string, string> = {
  'Welcome.md': '# A little space for big ideas\n\nWelcome to **NoteWeave** — your notes, documents, and a thinking partner, together in one workspace.\n\n## Make connections\n\nIdeas become more useful when you connect them. Link a note with [[Research/Connected thinking]] and explore the relationship in the graph.\n\n## Bring your research\n\nOpen a local folder containing Markdown notes, PDFs, and Word documents. NoteWeave extracts the text and makes it available to your AI chat.\n\n## Think with your notes\n\nAsk the assistant to find a connection, summarize your research, or explain a topic. Answers cite the files they came from.\n\n> Your files stay yours. Your next idea is closer than you think.\n\n#knowledge #getting-started',
  'Research/Connected thinking.md': '# Connected thinking\n\nA knowledge graph connects individual notes into a larger network. Wiki links make the relationships explicit.\n\nSemantic embeddings uncover related ideas even when the notes use different words. [[Research/Semantic search]] explains how these vectors work.\n\nConnections help us notice patterns, find missing questions, and synthesize new ideas.\n\n[[Welcome]] #research',
  'Research/Semantic search.md': '# Semantic search\n\nSemantic search represents text as numerical vectors called embeddings. Related meanings produce similar vectors.\n\nNoteWeave uses the all-MiniLM-L6-v2 model locally to discover related notes. Cosine similarity measures how closely two vectors align.\n\nRetrieval augmented generation combines search results with a language model. The answer is grounded in retrieved passages, with citations for verification.\n\n[[Research/Connected thinking]] #ai #research',
  'Projects/Hackathon plan.md': '# Hackathon plan\n\n## The idea\n\nBuild a focused knowledge workspace that helps people think across notes and documents.\n\n## Demo flow\n\n- [ ] Open a research folder\n- [ ] Import a PDF or Word document\n- [ ] Ask a question and inspect its sources\n- [ ] Explore related suggestions\n- [ ] Show the D3 knowledge graph\n\n## Principles\n\nKeep the interface calm and focused. Use local embeddings for discovery. Preserve Markdown portability.\n\n[[Research/Semantic search]] #project',
};
export function createMockAPI(): ElectronAPI {
  const storageKey = 'noteweave-demo-files';
  let files = { ...initialFiles };
  try { files = { ...files, ...JSON.parse(localStorage.getItem(storageKey) || '{}') }; } catch {}
  const persist = () => localStorage.setItem(storageKey, JSON.stringify(files));
  const tree = (): FileEntry[] => {
    const root: FileEntry[] = [];
    for (const [path, content] of Object.entries(files)) {
      let children = root; const parts = path.split('/');
      parts.forEach((name, index) => {
        const relative = parts.slice(0, index + 1).join('/'); const folder = index < parts.length - 1;
        let entry = children.find(item => item.path === relative);
        if (!entry) { entry = { name, path: relative, absolutePath: relative, isDirectory: folder, extension: folder ? '' : '.' + name.split('.').pop(), modifiedAt: 1, size: content.length, ...(folder ? { children: [] } : {}) }; children.push(entry); }
        if (folder) children = entry.children!;
      });
    }
    return root;
  };
  return {
    openVaultDialog: async () => 'Demo workspace', setVaultPath: async () => true, getVaultPath: async () => 'Demo workspace', getFileTree: async () => tree(),
    readFile: async path => files[path] ?? null, readBinary: async path => new TextEncoder().encode(files[path] || ''),
    writeFile: async (path, content) => { files[path] = content; persist(); }, writeBinary: async () => { throw new Error('Document imports are available in the desktop app.'); },
    createFile: async (path, content = '') => { if (path in files) throw new Error('A file with that name already exists.'); files[path] = content; persist(); }, createDirectory: async () => {}, fileExists: async path => path in files,
    getGraphData: async () => {
      const nodes = Object.keys(files).filter(path => path.endsWith('.md')).map(path => ({ id: path.slice(0, -3), name: path.split('/').pop()!.slice(0, -3), path, connections: 0 }));
      const edges: { source: string; target: string }[] = [];
      for (const node of nodes) for (const match of files[node.path].matchAll(/\[\[([^\]|#]+)(?:[^\]]*)\]\]/g)) { const target = nodes.find(item => item.id === match[1] || item.name === match[1]); if (target) { edges.push({ source: node.id, target: target.id }); node.connections++; target.connections++; } }
      return { nodes, edges };
    },
    dataRead: async path => localStorage.getItem('noteweave-data:' + path), dataWrite: async (path, content) => { localStorage.setItem('noteweave-data:' + path, content); }, dataDelete: async path => { localStorage.removeItem('noteweave-data:' + path); }, dataList: async path => Object.keys(localStorage).filter(key => key.startsWith('noteweave-data:' + path + '/')).map(key => key.split('/').pop()!),
    openExternal: async url => { if (/^https?:\/\//.test(url)) window.open(url, '_blank', 'noopener,noreferrer'); },
    openPath: async () => 'Open original files in the desktop app.', extractDoc: async () => { throw new Error('Word documents require the desktop app.'); }, importDocuments: async () => { throw new Error('Use the desktop app to import documents, or open a folder containing them.'); }, minimizeWindow: () => {}, maximizeWindow: () => {}, closeWindow: () => {},
  };
}
