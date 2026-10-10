// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { afterEach, expect, it, vi } from "vitest";
import * as XLSX from "xlsx";
import { extractResourceContent, MAX_RESOURCE_BYTES } from "../src/utils/resource-content";
import { importResource } from "../src/utils/resource-import";
import { searchForgeNotes } from "../src/utils/forge-note-source";

const mocks = vi.hoisted(() => ({ save: vi.fn(), vault: vi.fn(), destroy: vi.fn(), cleanup: vi.fn(), pages: ["First page evidence", "Second page evidence"] }));
vi.mock("../src/utils/api", () => ({ getAPI: () => ({ getVaultPath: mocks.vault, importResource: mocks.save }) }));
vi.mock("pdfjs-dist/legacy/build/pdf.mjs", () => ({ GlobalWorkerOptions: {}, getDocument: () => ({ destroy: mocks.destroy, promise: Promise.resolve({ numPages: mocks.pages.length, getPage: async (index: number) => ({ cleanup: mocks.cleanup, getTextContent: async () => ({ items: [{ str: mocks.pages[index - 1], hasEOL: true }] }) }) }) }) }));
afterEach(() => { vi.clearAllMocks(); mocks.vault.mockResolvedValue("/vault"); mocks.destroy.mockResolvedValue(undefined); mocks.pages = ["First page evidence", "Second page evidence"]; });
mocks.vault.mockResolvedValue("/vault"); mocks.destroy.mockResolvedValue(undefined);
const bytes = (text: string) => new TextEncoder().encode(text);
const file = (name: string, text: string): File => ({ name, size: bytes(text).length, arrayBuffer: async () => bytes(text).buffer } as File);

it("extracts all PDF pages with traceable headings and disposes the worker", async () => {
  const result = await extractResourceContent("lecture.pdf", bytes("pdf"));
  expect(result.text).toContain("## Page 1\n\nFirst page evidence");
  expect(result.text).toContain("## Page 2\n\nSecond page evidence");
  expect(mocks.cleanup).toHaveBeenCalledTimes(2);
  expect(mocks.destroy).toHaveBeenCalledOnce();
});
it("reports missing scanned-page content without fabricating it", async () => {
  mocks.pages = ["", "Second page evidence"];
  const result = await extractResourceContent("scan.pdf", bytes("pdf"));
  expect(result.text).not.toContain("## Page 1");
  expect(result.warnings[0]).toContain("1 page(s)");
  mocks.pages = [""];
  const empty = await extractResourceContent("scan.pdf", bytes("pdf"));
  expect(empty.text).toBe("");
  expect(empty.warnings.join(" ")).toContain("OCR");
});
it("extracts real DOCX text using the browser extractor", async () => {
  const result = await extractResourceContent("table.docx", new Uint8Array(readFileSync("node_modules/mammoth/test/test-data/tables.docx")));
  expect(result.text.length).toBeGreaterThan(10);
});
it("extracts every spreadsheet sheet and its displayed data", async () => {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([["Algorithm", "Cost"], ["Search", 42]]), "Complexity");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([["Another source"]]), "Second");
  const result = await extractResourceContent("data.xlsx", XLSX.write(workbook, { type: "array", bookType: "xlsx" }));
  expect(result.text).toContain("## Sheet: Complexity");
  expect(result.text).toContain("Search,42");
  expect(result.text).toContain("Another source");
});
it.each(["lecture.ppt", "lecture.PPTX", "lecture.ppsx"])("rejects PowerPoint upload %s before reading or saving it", async name => {
  const source = file(name, "Presentation");
  const read = vi.spyOn(source, "arrayBuffer");
  await expect(importResource(source, "/vault")).rejects.toThrow("PowerPoint uploads are not supported");
  await expect(extractResourceContent(name, bytes("presentation"))).rejects.toThrow("PowerPoint uploads are not supported");
  expect(read).not.toHaveBeenCalled();
  expect(mocks.save).not.toHaveBeenCalled();
});
it("extracts safe HTML text and preserves paragraph boundaries", async () => {
  const result = await extractResourceContent("page.html", bytes('<script>hidden()</script><p>First</p><p>Second &amp; third</p>'));
  expect(result.text).toContain("First\nSecond & third");
  expect(result.text).not.toContain("hidden");
});
it("does not pretend unsupported binary formats contain searchable text", async () => {
  const result = await extractResourceContent("photo.png", bytes("binary"));
  expect(result.text).toBe("");
  expect(result.warnings[0]).toContain("not supported");
});
it("rejects oversized resources and cancelled extraction", async () => {
  await expect(importResource({ name: "huge.pdf", size: MAX_RESOURCE_BYTES + 1 } as File, "/vault")).rejects.toThrow("50 MB");
  const controller = new AbortController(); controller.abort();
  await expect(extractResourceContent("note.txt", bytes("evidence"), controller.signal)).rejects.toThrow();
  expect(mocks.save).not.toHaveBeenCalled();
});
it("imports original bytes and a persistent Forge-selectable content note with provenance", async () => {
  const result = await importResource(file("algorithm.txt", "Binary search halves the interval."), "/vault");
  const [vault, original, savedBytes, note, content] = mocks.save.mock.calls[0];
  expect([vault, original, note]).toEqual(["/vault", result.originalPath, result.notePath]);
  expect(Array.from(savedBytes)).toEqual(Array.from(bytes("Binary search halves the interval.")));
  expect(content).toContain("Binary search halves the interval.");
  expect(mocks.save.mock.calls[0][4]).toContain(`resource_source: "${result.originalPath}"`);
  expect(searchForgeNotes([{ name: "algorithm.content", path: result.notePath! }], "algorithm")).toHaveLength(1);
});
it("keeps duplicate imports separate and handles Windows reserved filenames", async () => {
  const a = await importResource(file("CON.txt", "Evidence"), "/vault");
  const b = await importResource(file("CON.txt", "Different evidence"), "/vault");
  expect(a.originalPath).not.toBe(b.originalPath);
  expect(a.originalPath).toMatch(/\/_CON.txt$/);
});
it("rejects stale vault requests before any resource is written", async () => {
  mocks.vault.mockResolvedValue("/different");
  await expect(importResource(file("source.txt", "Content"), "/vault")).rejects.toThrow("vault changed");
  expect(mocks.save).not.toHaveBeenCalled();
});
