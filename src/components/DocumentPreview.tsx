import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, LoaderCircle, ZoomIn, ZoomOut } from 'lucide-react';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { getAPI } from '../utils/api';
import type { PDFDocumentProxy } from 'pdfjs-dist';
export function DocumentPreview({ path }: { path: string }) {
  const host = useRef<HTMLDivElement>(null); const canvas = useRef<HTMLCanvasElement>(null);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null); const [page, setPage] = useState(1); const [zoom, setZoom] = useState(1); const [error, setError] = useState(''); const [loading, setLoading] = useState(true);
  const isPdf = path.toLowerCase().endsWith('.pdf');
  useEffect(() => {
    let disposed = false; let cleanup: (() => void) | undefined; setLoading(true); setError(''); setPage(1); setPdf(null);
    void (async () => {
      const bytes = new Uint8Array(await getAPI().readBinary(path)); if (disposed) return;
      if (isPdf) {
        const module = await import('pdfjs-dist'); module.GlobalWorkerOptions.workerSrc = workerUrl;
        const task = module.getDocument({ data: bytes, useSystemFonts: true }); cleanup = () => { void task.destroy(); };
        const document = await task.promise; if (!disposed) setPdf(document);
      } else {
        const { renderAsync } = await import('docx-preview'); if (disposed || !host.current) return;
        host.current.replaceChildren();
        await renderAsync(bytes.buffer, host.current, undefined, { className: 'noteweave-docx', inWrapper: true, breakPages: true, ignoreLastRenderedPageBreak: false });
        if (!disposed) setLoading(false);
      }
    })().catch(err => { if (!disposed) { setError(err instanceof Error ? err.message : String(err)); setLoading(false); } });
    return () => { disposed = true; cleanup?.(); };
  }, [path, isPdf]);
  useEffect(() => {
    if (!pdf || !canvas.current || !host.current) return;
    let disposed = false; let generation = 0; let rendering: { cancel(): void } | undefined;
    const render = async () => {
      const attempt = ++generation; rendering?.cancel(); setLoading(true); setError(''); const current = await pdf.getPage(page); if (disposed || attempt !== generation || !canvas.current || !host.current) return;
      const base = current.getViewport({ scale: 1 }); const ratio = Math.min(devicePixelRatio || 1, 2);
      const scale = Math.min((host.current.clientWidth - 48) / base.width, 1.35) * zoom;
      const viewport = current.getViewport({ scale: Math.max(.2, scale) * ratio }); const element = canvas.current;
      element.width = Math.ceil(viewport.width); element.height = Math.ceil(viewport.height); element.style.width = `${viewport.width / ratio}px`; element.style.height = `${viewport.height / ratio}px`;
      const task = current.render({ canvas: element, viewport }); rendering = task; await task.promise; if (!disposed && attempt === generation) setLoading(false);
    };
    void render().catch(err => { if (!disposed && err.name !== 'RenderingCancelledException') { setError(String(err)); setLoading(false); } });
    const observer = new ResizeObserver(() => { void render().catch(() => {}); }); observer.observe(host.current);
    return () => { disposed = true; rendering?.cancel(); observer.disconnect(); };
  }, [pdf, page, zoom]);
  return <section className="document-preview" aria-label="Original document preview">{isPdf && <div className="pdf-controls"><button aria-label="Previous PDF page" disabled={!pdf || page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft size={15} /></button><span>Page {page} of {pdf?.numPages || '…'}</span><button aria-label="Next PDF page" disabled={!pdf || page >= pdf.numPages} onClick={() => setPage(page + 1)}><ChevronRight size={15} /></button><span className="pdf-control-divider" /><button aria-label="Zoom out" disabled={zoom <= .5} onClick={() => setZoom(Math.max(.5, zoom - .25))}><ZoomOut size={15} /></button><span>{Math.round(zoom * 100)}%</span><button aria-label="Zoom in" disabled={zoom >= 2} onClick={() => setZoom(Math.min(2, zoom + .25))}><ZoomIn size={15} /></button></div>}{loading && <div className="preview-loading"><LoaderCircle size={16} className="spin" /> Rendering document…</div>}{error && <p className="preview-error" role="alert">{error}</p>}<div className="document-pages" ref={host}>{isPdf && <canvas ref={canvas} aria-label={`PDF page ${page}`} />}</div></section>;
}
