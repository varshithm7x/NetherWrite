import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { getAPI } from './api';
import type { FileEntry } from '../types';

export interface IndexedDocument { path: string; content: string; kind: string; modifiedAt: number; size: number; }
export const SUPPORTED_EXTENSIONS = new Set(['.md', '.txt', '.pdf', '.docx', '.doc']);
export function collectDocuments(tree: FileEntry[]): FileEntry[] {
  return tree.flatMap(entry => entry.isDirectory ? collectDocuments(entry.children || []) : SUPPORTED_EXTENSIONS.has(entry.extension.toLowerCase()) ? [entry] : []);
}
export async function extractDocument(entry: FileEntry): Promise<IndexedDocument> {
  const api = getAPI(); const kind = entry.extension.toLowerCase();
  if (entry.size > 50 * 1024 * 1024) throw new Error('File exceeds the 50 MB document limit.');
  let content = '';
  if (kind === '.md' || kind === '.txt') content = await api.readFile(entry.path) || '';
  else if (kind === '.doc') content = await api.extractDoc(entry.path);
  else if (kind === '.docx') {
    const mammoth = await import('mammoth/mammoth.browser.js');
    const bytes = await api.readBinary(entry.path);
    const result = await mammoth.extractRawText({ arrayBuffer: new Uint8Array(bytes).buffer });
    content = result.value;
  } else if (kind === '.pdf') {
    const pdfjs = await import('pdfjs-dist');
    pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
    const task = pdfjs.getDocument({ data: new Uint8Array(await api.readBinary(entry.path)), useSystemFonts: true });
    const pdf = await task.promise;
    try {
      const pages: string[] = [];
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const page = await pdf.getPage(pageNumber);
        const text = await page.getTextContent();
        let paragraph = '';
        for (const item of text.items) if ('str' in item) paragraph += item.str + (item.hasEOL ? '\n' : ' ');
        pages.push(`## Page ${pageNumber}\n\n${paragraph.trim()}`);
      }
      content = pages.join('\n\n');
    } finally { await task.destroy(); }
    if (!content.replace(/## Page \d+/g, '').trim()) throw new Error('This PDF has no selectable text. Scan OCR is not included.');
  } else throw new Error('Unsupported document format.');
  return { path: entry.path, content, kind, modifiedAt: entry.modifiedAt, size: entry.size };
}
