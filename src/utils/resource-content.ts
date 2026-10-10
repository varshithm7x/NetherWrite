import { isPowerPointResource } from "./resource-paths";

export interface ExtractedResource { text: string; warnings: string[] }
const MAX_TEXT_LENGTH = 2_000_000;
export const MAX_RESOURCE_BYTES = 50 * 1024 * 1024;

function checked(text: string, warnings: string[] = []): ExtractedResource {
  const clean = text.replace(/\u0000/g, "").trim();
  if (clean.length > MAX_TEXT_LENGTH) throw new Error("This resource contains too much text. Split it into smaller files before uploading.");
  if (!clean) return { text: "", warnings: [...warnings, "No readable text was found. Scanned pages and images require OCR before AI can use their content."] };
  return { text: clean, warnings };
}

/** Local extraction: originals are never sent to an AI provider during upload. */
export async function extractResourceContent(name: string, bytes: Uint8Array, signal?: AbortSignal): Promise<ExtractedResource> {
  signal?.throwIfAborted();
  if (isPowerPointResource(name)) throw new Error("PowerPoint uploads are not supported. Export the presentation as a PDF and upload that instead.");
  if (bytes.length > MAX_RESOURCE_BYTES) throw new Error("Each upload must be 50 MB or smaller.");
  const extension = name.split(".").pop()?.toLowerCase();
  if (extension === "pdf") {
    const [{ getDocument, GlobalWorkerOptions }, { default: worker }] = await Promise.all([
      import("pdfjs-dist/legacy/build/pdf.mjs"), import("pdfjs-dist/legacy/build/pdf.worker.mjs?url"),
    ]);
    GlobalWorkerOptions.workerSrc = worker;
    const base = `${import.meta.env.BASE_URL || "./"}pdfjs/`;
    const task = getDocument({ data: bytes.slice(), cMapPacked: true, cMapUrl: `${base}cmaps/`, standardFontDataUrl: `${base}standard_fonts/` });
    const abort = () => { void task.destroy().catch(() => {}); };
    signal?.addEventListener("abort", abort, { once: true });
    try {
      signal?.throwIfAborted();
      const pdf = await task.promise;
      if (pdf.numPages > 500) throw new Error("Upload PDFs with 500 pages or fewer. Split this document into smaller files.");
      const pages: string[] = [];
      const empty: number[] = [];
      let length = 0;
      for (let i = 1; i <= pdf.numPages; i++) {
        signal?.throwIfAborted();
        const page = await pdf.getPage(i);
        try {
          const content = await page.getTextContent();
          const text = content.items.map(item => "str" in item ? item.str + (item.hasEOL ? "\n" : " ") : "").join("").trim();
          if (!text) empty.push(i);
          else { pages.push(`## Page ${i}\n\n${text}`); length += text.length; }
          if (length > MAX_TEXT_LENGTH) throw new Error("This PDF contains too much text. Split it into smaller files.");
        } finally { page.cleanup(); }
      }
      return checked(pages.join("\n\n"), empty.length ? [`${empty.length} page(s) had no readable text; their scanned or image content is not included.`] : []);
    } finally {
      signal?.removeEventListener("abort", abort);
      await task.destroy();
    }
  }
  if (extension === "docx") {
    const { default: mammoth } = await import("mammoth/mammoth.browser.js");
    const result = await mammoth.extractRawText({ arrayBuffer: bytes.slice().buffer });
    signal?.throwIfAborted();
    return checked(result.value);
  }
  if (["xlsx", "xls", "ods"].includes(extension || "")) {
    const XLSX = await import("xlsx");
    signal?.throwIfAborted();
    const workbook = XLSX.read(bytes, { type: "array", cellFormula: false });
    return checked(workbook.SheetNames.map(name => `## Sheet: ${name}\n\n${XLSX.utils.sheet_to_csv(workbook.Sheets[name])}`).join("\n\n"));
  }
  if (["md", "txt", "csv", "tsv", "json", "xml", "yaml", "yml", "log", "html", "htm"].includes(extension || "")) {
    let text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    if (extension === "html" || extension === "htm") {
      const doc = new DOMParser().parseFromString(text, "text/html");
      doc.querySelectorAll("script,style,noscript").forEach(node => node.remove());
      doc.querySelectorAll("p,br,div,li,h1,h2,h3,tr").forEach(node => node.append("\n"));
      text = doc.body.textContent || "";
    }
    return checked(text);
  }
  return { text: "", warnings: ["Original file saved. Text extraction is not supported for this format; AI tools need a PDF, Word document, spreadsheet, or text version."] };
}
