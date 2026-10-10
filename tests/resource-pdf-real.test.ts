import { expect, it, vi } from "vitest";
import { extractResourceContent } from "../src/utils/resource-content";

vi.mock("pdfjs-dist/legacy/build/pdf.worker.mjs?url", async () => {
  const { pathToFileURL } = await import("node:url");
  const { resolve } = await import("node:path");
  return { default: pathToFileURL(resolve("node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs")).href };
});

it("reads real PDF bytes through PDF.js and its worker", async () => {
  const stream = "BT /F1 12 Tf 72 720 Td (Binary search halves the interval.) Tj ET";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];
  let source = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, i) => { offsets.push(source.length); source += `${i + 1} 0 obj\n${object}\nendobj\n`; });
  const start = source.length;
  source += `xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${start}\n%%EOF`;
  const result = await extractResourceContent("search.pdf", new TextEncoder().encode(source));
  expect(result.text).toContain("## Page 1");
  expect(result.text).toContain("Binary search halves the interval.");
  expect(result.warnings).toEqual([]);
});
