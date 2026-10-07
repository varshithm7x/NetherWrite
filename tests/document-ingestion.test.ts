// @vitest-environment jsdom
import fs from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import type { FileEntry } from '../src/types';
const mocks = vi.hoisted(() => ({ readFile: vi.fn(), readBinary: vi.fn(), extractDoc: vi.fn(), destroy: vi.fn(), pageItems: [{ str: 'PDF research evidence', hasEOL: true }] }));
vi.mock('../src/utils/api', () => ({ getAPI: () => mocks }));
vi.mock('pdfjs-dist', () => ({ GlobalWorkerOptions: {}, getDocument: () => ({ promise: Promise.resolve({ numPages: 1, getPage: async () => ({ getTextContent: async () => ({ items: mocks.pageItems }) }) }), destroy: mocks.destroy }) }));
import { collectDocuments, extractDocument } from '../src/utils/document-ingestion';
import { rankVaultPassages } from '../src/utils/vault-rag';
function file(path: string, size = 100): FileEntry { return { name: path.split('/').pop()!, path, absolutePath: path, isDirectory: false, extension: '.' + path.split('.').pop(), modifiedAt: 10, size }; }
describe('document ingestion and retrieval', () => {
  it('discovers notes, PDFs, and Word documents in nested folders', () => {
    const tree = [{ ...file('Research'), isDirectory: true, children: [file('Research/notes.md'), file('Research/paper.PDF'), file('Research/report.docx'), file('Research/image.png')] }];
    expect(collectDocuments(tree).map(item => item.path)).toEqual(['Research/notes.md', 'Research/paper.PDF', 'Research/report.docx']);
  });
  it('extracts an actual DOCX fixture and retrieves its original filename as a citation', async () => {
    mocks.readBinary.mockResolvedValue(new Uint8Array(fs.readFileSync('tests/fixtures/research.docx')));
    const document = await extractDocument(file('Research/research.docx'));
    expect(document.content).toContain('semantic embeddings connect related documents');
    const passages = rankVaultPassages('semantic embeddings related documents', [document], 5);
    expect(passages[0].path).toBe('Research/research.docx');
    expect(passages[0].excerpt).toContain('Research findings');
  });
  it('preserves PDF page markers and cleans up its worker', async () => {
    mocks.readBinary.mockResolvedValue(new Uint8Array([1, 2, 3]));
    const document = await extractDocument(file('paper.pdf'));
    expect(document.content).toContain('## Page 1'); expect(document.content).toContain('PDF research evidence'); expect(mocks.destroy).toHaveBeenCalled();
  });
  it('rejects oversized files before loading their bytes', async () => { await expect(extractDocument(file('large.pdf', 51 * 1024 * 1024))).rejects.toThrow('50 MB'); });
  it('preserves Markdown contents without converting them', async () => { mocks.readFile.mockResolvedValue('# My note\n\n[[Other note]]'); const document = await extractDocument(file('note.md')); expect(document.content).toBe('# My note\n\n[[Other note]]'); });
});
