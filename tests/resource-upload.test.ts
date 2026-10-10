// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ResourceUpload } from "../src/components/layout/ResourceUpload";
const { upload } = vi.hoisted(() => ({ upload: vi.fn() }));
vi.mock("../src/utils/resource-import", () => ({ importResource: upload }));
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root;
let host: HTMLElement;
const refresh = vi.fn(), open = vi.fn();
beforeEach(() => { host = document.createElement("div"); document.body.append(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); document.body.replaceChildren(); vi.resetAllMocks(); });
function render(vaultPath: string | undefined = "/vault") { act(() => root.render(React.createElement(ResourceUpload, { vaultPath, onRefresh: refresh, onOpen: open }))); }
async function choose(names: string[]) {
  const picker = host.querySelector("input")!;
  Object.defineProperty(picker, "files", { configurable: true, value: names.map(name => new File(["Content"], name)) });
  await act(async () => picker.dispatchEvent(new Event("change", { bubbles: true })));
}
it("opens uploaded PDFs automatically in a document tab and refreshes the vault", async () => {
  upload.mockResolvedValue({ name: "lecture.pdf", originalPath: "Uploads/lecture.pdf", notePath: "Uploads/lecture.content.md", warnings: [] });
  render(); await choose(["lecture.pdf"]);
  expect(upload).toHaveBeenCalledWith(expect.objectContaining({ name: "lecture.pdf" }), "/vault", expect.any(AbortSignal));
  expect(refresh).toHaveBeenCalledOnce();
  expect(host.textContent).toContain("1 available as searchable notes");
  act(() => [...host.querySelectorAll("button")].find(button => button.textContent?.includes("Open PDF"))!.click());
  expect(open).toHaveBeenCalledWith("Uploads/lecture.pdf");
  expect(open).toHaveBeenCalledTimes(2);
});
it("allows later files to succeed after an individual extraction failure", async () => {
  upload.mockRejectedValueOnce(new Error("Encrypted PDF")).mockResolvedValueOnce({ name: "notes.txt", originalPath: "notes.txt", notePath: "notes.md", warnings: [] });
  render(); await choose(["locked.pdf", "notes.txt"]);
  expect(host.querySelector('[role="alert"]')?.textContent).toContain("locked.pdf: Encrypted PDF");
  expect(host.textContent).toContain("notes.txt — Open content");
});
it("cancels remaining uploads and ignores completion after a vault switch", async () => {
  let resolve!: (result: unknown) => void;
  upload.mockImplementation(() => new Promise(done => { resolve = done; }));
  render(); await choose(["one.txt", "two.txt"]);
  const signal: AbortSignal = upload.mock.calls[0][2];
  act(() => [...host.querySelectorAll("button")].find(button => button.textContent === "Cancel upload")!.click());
  expect(signal.aborted).toBe(true);
  render("/other");
  await act(async () => resolve({ name: "one.txt", originalPath: "one.txt", notePath: "one.md", warnings: [] }));
  expect(upload).toHaveBeenCalledOnce();
  expect(refresh).not.toHaveBeenCalled();
  expect(host.textContent).not.toContain("Open content");
});
it("requires an open vault and exposes unsupported-file warnings", async () => {
  render("");
  expect(host.querySelector("button")?.disabled).toBe(true);
  render(); upload.mockResolvedValue({ name: "image.png", originalPath: "image.png", notePath: null, warnings: ["OCR is required."] });
  await choose(["image.png"]);
  expect(host.textContent).toContain("0 available as searchable notes");
  expect(host.textContent).toContain("OCR is required");
});
