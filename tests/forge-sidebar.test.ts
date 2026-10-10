// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { RightSidebar } from "../src/components/layout/RightSidebar";
import { TitleBar } from "../src/components/layout/TitleBar";
import type { Theme } from "../src/types";
import { ForgePanel } from "../src/components/panels/ForgePanel";

const { dataRead, dataWrite, readFile, generateMindMap } = vi.hoisted(() => ({
  dataRead: vi.fn().mockResolvedValue(null), dataWrite: vi.fn().mockResolvedValue(undefined),
  readFile: vi.fn().mockResolvedValue("Saved source"), generateMindMap: vi.fn(),
}));
vi.mock("../src/utils/api", () => ({ getAPI: () => ({ dataRead, dataWrite, readFile, getVaultPath: async () => "/vault", fileExists: async () => false }) }));
vi.mock("../src/utils/forge-mind-map", async importOriginal => ({
  ...await importOriginal<typeof import("../src/utils/forge-mind-map")>(), generateMindMap,
}));
vi.mock("../src/utils/ai-core", () => ({ askAI: vi.fn() }));

vi.mock("../src/components/panels/BacklinksPanel", () => ({ BacklinksPanel: () => null }));
vi.mock("../src/components/panels/OutgoingLinksPanel", () => ({ OutgoingLinksPanel: () => null }));
vi.mock("../src/components/panels/OutlinePane", () => ({ OutlinePane: () => null }));
vi.mock("../src/components/panels/UnlinkedMentionsPanel", () => ({ UnlinkedMentionsPanel: () => null }));
vi.mock("../src/lib/obsidian-api/utils", () => ({ setIcon: vi.fn() }));
vi.mock("../src/components/ai/AIPage", () => ({
  AIPage: ({ activeNotePath }: { activeNotePath: string }) => {
    const [query, setQuery] = React.useState("");
    return React.createElement("input", {
      "aria-label": "Intelligence query",
      "data-note": activeNotePath,
      value: query,
      onChange: (event: React.ChangeEvent<HTMLInputElement>) => setQuery(event.target.value),
    });
  },
}));

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root;

afterEach(() => {
  act(() => root?.unmount());
  document.body.replaceChildren();
  vi.clearAllMocks();
  dataRead.mockResolvedValue(null);
  readFile.mockResolvedValue("Saved source");
});

it("uses the active PDF's extracted note for Intelligence, quizzes, and mind maps", async () => {
  const pdf = "Uploads/import/Lecture.pdf", contentPath = "Uploads/import/Lecture.content.md";
  const pdfText = "## Page 1\n\nBinary search halves the search interval.";
  readFile.mockResolvedValue(pdfText);
  const container = document.createElement("div"); document.body.append(container); root = createRoot(container);
  const open = vi.fn();
  const props = {
    currentContent: "", allNoteNames: [{ name: "Lecture.content", path: contentPath }],
    handleLinkClick: vi.fn(), backlinks: [], openFile: open, activeFilePath: pdf, activeFileName: "Lecture.pdf",
    width: 300, vaultPath: "/vault", theme: "dark" as const,
  };
  await act(async () => root.render(React.createElement(RightSidebar, { ...props, activeTab: "ai" })));
  expect(container.querySelector('[aria-label="Intelligence query"]')?.getAttribute("data-note")).toBe(contentPath);
  await act(async () => root.render(React.createElement(RightSidebar, { ...props, activeTab: "forge" })));
  await act(async () => container.querySelector<HTMLButtonElement>('[aria-label="Quizzes"]')!.click());
  expect(container.textContent).toContain("Lecture.pdf");
  expect(container.textContent).toContain(contentPath);
  expect([...container.querySelectorAll<HTMLButtonElement>("button")].find(button => button.textContent === "Generate Quiz")?.disabled).toBe(false);
  await act(async () => [...container.querySelectorAll<HTMLButtonElement>("button")].find(button => button.textContent?.includes("Creation tools"))!.click());
  await act(async () => container.querySelector<HTMLButtonElement>('[aria-label="Create Mind Map"]')!.click());
  const topic = container.querySelector<HTMLInputElement>('input:not([type])')!;
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(topic, "Binary search");
    topic.dispatchEvent(new Event("input", { bubbles: true }));
  });
  const creation = { id: "pdf-map", createdAt: 1, sources: [{ path: contentPath, name: "Lecture.pdf" }], root: { id: "root", label: "Binary search", sourcePaths: [contentPath], children: [] } };
  generateMindMap.mockResolvedValue(creation);
  await act(async () => [...container.querySelectorAll<HTMLButtonElement>("button")].find(button => button.textContent === "Generate mind map")!.click());
  expect(generateMindMap).toHaveBeenCalledWith([{ path: contentPath, name: "Lecture.pdf", content: pdfText }], expect.any(Function), "Binary search");
  await act(async () => container.querySelector('[role="button"][aria-label="Binary search"]')!.dispatchEvent(new MouseEvent("click", { bubbles: true })));
  expect(open).toHaveBeenCalledWith(pdf);
  expect(readFile.mock.calls.every(([path]) => path !== pdf)).toBe(true);
});

function SidebarHarness({ theme, width }: { theme: Theme; width: number }) {
  const [activeTab, setActiveTab] = React.useState("forge");
  const [open, setOpen] = React.useState(true);
  return React.createElement("div", { "data-theme": theme },
    React.createElement(TitleBar, {
      theme,
      showRightSidebar: open,
      onToggleRightSidebar: () => setOpen(value => !value),
      activeRightTab: activeTab,
      setActiveRightTab: tab => { setOpen(true); setActiveTab(tab); },
      rightSidebarWidth: width,
    }),
    open && React.createElement(RightSidebar, {
      activeTab,
      currentContent: "Current note",
      allNoteNames: [],
      handleLinkClick: vi.fn(),
      backlinks: [],
      openFile: vi.fn(),
      activeFilePath: "Notes/Current.md",
      activeFileName: "Current",
      width,
      vaultPath: "/test-vault",
      theme,
      onClose: () => setOpen(false),
    }),
  );
}

async function renderSidebar(theme: Theme = "dark", width = 300) {
  const container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => root.render(React.createElement(SidebarHarness, { theme, width })));
  return container;
}

it.each(["light", "dark"] as const)("renders the four remaining Forge tools under the %s theme at narrow width", async theme => {

  const container = await renderSidebar(theme, 200);
  const grid = container.querySelector('[aria-label="Creation tools"]')!;
  const cards = [...grid.querySelectorAll<HTMLButtonElement>("button")];
  expect(cards.map(card => card.getAttribute("aria-label"))).toEqual([
    "Create Mind Map", "Reports — Coming Soon", "Flashcards", "Quizzes",

  ]);
  expect(grid.classList.contains("grid-cols-2")).toBe(true);
  expect(container.querySelector(".right-sidebar-panel")?.getAttribute("style")).toContain("200px");
  for (const card of cards) {
    const active = ["Quizzes", "Flashcards", "Create Mind Map"].includes(card.getAttribute("aria-label") || "");
    expect(card.getAttribute("aria-disabled")).toBe(card.getAttribute("aria-label") === "Create Mind Map" ? null : active ? "false" : "true");
    act(() => { card.focus(); if (!active) card.click(); });

    expect(document.activeElement).toBe(card);
  }
  expect(container.querySelector('[role="dialog"]')).toBeNull();
  expect(container.textContent).toContain("Your generated content will appear here.");
  expect(container.querySelector("#forge-creations-title")?.parentElement?.parentElement?.classList.contains("overflow-y-auto")).toBe(true);
  act(() => cards.find(card => card.getAttribute("aria-label") === "Quizzes")!.click());
  expect(container.querySelector('[aria-label="Select source note"]')).not.toBeNull();
});

it("creates from the current editor content, saves locally, and expands branches without AI", async () => {
  const creation = { id: "map-1", createdAt: 1, sources: [{ path: "current.md", name: "Current" }], root: {
    id: "root", label: "Knowledge", children: [{ id: "root.0", label: "Basics", children: [{ id: "root.0.0", label: "Details", children: [] }] }],
  } };
  let finish!: (value: typeof creation) => void;
  generateMindMap.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  const container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => root.render(React.createElement(ForgePanel, {
    vaultPath: "/vault", activeFilePath: "current.md", activeFileName: "Current", currentContent: "Unsaved editor content",
  })));
  await act(async () => container.querySelector<HTMLButtonElement>('[aria-label="Create Mind Map"]')!.click());
  expect(document.querySelector('[role="dialog"]')).toBeNull();
  expect(container.querySelector('[aria-label="Create a mind map"]')?.textContent).toContain("Current (current note)");
  const generate = [...document.querySelectorAll<HTMLButtonElement>("button")].find(button => button.textContent === "Generate mind map")!;
  expect(generate.disabled).toBe(true);
  const topic = container.querySelector<HTMLInputElement>('input[type="text"], input:not([type])')!;
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(topic, "Image processing");
    topic.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await act(async () => generate.click());
  expect(container.querySelector('[data-electric-active="true"]')).not.toBeNull();
  await act(async () => finish(creation));
  expect(container.querySelector('[data-electric-active="true"]')).toBeNull();
  expect(generateMindMap).toHaveBeenCalledWith([{ path: "current.md", name: "Current", content: "Unsaved editor content" }], expect.any(Function), "Image processing");
  expect(dataWrite).toHaveBeenCalledWith("forge-mind-maps.json", JSON.stringify([creation]));
  expect(document.querySelector('[aria-label="Interactive mind map"]')?.textContent).not.toContain("Details");
  expect(container.querySelector('[aria-label="Interactive mind map"]')).not.toBeNull();
  const branch = document.querySelector('[role="button"][aria-label="Expand Basics branch"]')!;
  act(() => branch.dispatchEvent(new MouseEvent("click", { bubbles: true })));
  expect(document.querySelector('[aria-label="Interactive mind map"]')?.textContent).toContain("Details");
  expect(generateMindMap).toHaveBeenCalledTimes(1);
  act(() => document.querySelector<HTMLButtonElement>('[aria-label="Close mind map"]')!.click());
  expect(container.textContent).toContain("Knowledge");
  act(() => root.unmount());
  dataRead.mockImplementation(async (file: string) => file === "forge-mind-maps.json" ? JSON.stringify([creation]) : null);
  root = createRoot(container);
  await act(async () => root.render(React.createElement(ForgePanel, { vaultPath: "/vault" })));
  const saved = [...container.querySelectorAll<HTMLButtonElement>("button")].find(button => button.textContent?.includes("Knowledge"))!;
  act(() => saved.click());
  expect(document.querySelector('[aria-label="Interactive mind map"]')).not.toBeNull();
  expect(generateMindMap).toHaveBeenCalledTimes(1);
});

it("opens the topic's cited note without closing Forge or expanding its branch", async () => {
  const creation = { id: "linked-map", createdAt: 1, sources: [{ path: "matlab.md", name: "MATLAB" }, { path: "filters.md", name: "Filters" }], root: {
    id: "root", label: "Processing", sourcePaths: ["matlab.md", "filters.md"], children: [
      { id: "root.0", label: "MATLAB basics", sourcePaths: ["matlab.md"], children: [{ id: "root.0.0", label: "Data types", sourcePaths: ["matlab.md"], children: [] }] },
      { id: "root.1", label: "Filters", sourcePaths: ["filters.md"], children: [] },
    ],
  } };
  dataRead.mockImplementation(async (file: string) => file === "forge-mind-maps.json" ? JSON.stringify([creation]) : null);
  const openSource = vi.fn();
  const container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => root.render(React.createElement(ForgePanel, { vaultPath: "/vault", onOpenSource: openSource })));
  act(() => [...container.querySelectorAll<HTMLButtonElement>("button")].find(button => button.textContent?.includes("Processing"))!.click());
  act(() => container.querySelector('[role="button"][aria-label="Filters"]')!.dispatchEvent(new MouseEvent("click", { bubbles: true })));
  expect(openSource).toHaveBeenLastCalledWith("filters.md");
  expect(container.querySelector('[aria-label="Interactive mind map"]')).not.toBeNull();
  act(() => container.querySelector('[role="button"][aria-label="Expand MATLAB basics branch"]')!.dispatchEvent(new MouseEvent("click", { bubbles: true })));
  expect(openSource).toHaveBeenCalledTimes(1);
  act(() => container.querySelector('[role="button"][aria-label="Data types"]')!.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })));
  expect(openSource).toHaveBeenLastCalledWith("matlab.md");
  expect(generateMindMap).not.toHaveBeenCalled();
});

it("stops the mind map border immediately and retains the error when generation fails", async () => {
  let fail!: (error: Error) => void;
  generateMindMap.mockImplementation(() => new Promise((_resolve, reject) => { fail = reject; }));
  const container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => root.render(React.createElement(ForgePanel, {
    vaultPath: "/vault", activeFilePath: "current.md", activeFileName: "Current", currentContent: "Source content",
  })));
  await act(async () => container.querySelector<HTMLButtonElement>('[aria-label="Create Mind Map"]')!.click());
  const topic = container.querySelector<HTMLInputElement>('input:not([type])')!;
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(topic, "Processing");
    topic.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await act(async () => [...container.querySelectorAll<HTMLButtonElement>("button")].find(button => button.textContent === "Generate mind map")!.click());
  expect(container.querySelector('[data-electric-active="true"]')).not.toBeNull();
  await act(async () => fail(new Error("Generation failed")));
  expect(container.querySelector('[data-electric-active="false"][data-electric-fade="false"]')).not.toBeNull();
  expect(container.querySelector('[role="alert"]')?.textContent).toBe("Generation failed");
});

it("switches views without losing the Intelligence query or current note", async () => {
  const container = await renderSidebar();
  await act(async () => container.querySelector<HTMLButtonElement>('[aria-label="Vault Intelligence"]')!.click());
  const input = container.querySelector<HTMLInputElement>('[aria-label="Intelligence query"]')!;
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, "Explain my notes");
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  expect(input.value).toBe("Explain my notes");
  await act(async () => container.querySelector<HTMLButtonElement>('[aria-label="Forge"]')!.click());
  expect(input.closest("[hidden]")?.hasAttribute("inert")).toBe(true);
  expect(container.querySelector('[aria-label="Forge"]')?.getAttribute("aria-pressed")).toBe("true");
  await act(async () => container.querySelector<HTMLButtonElement>('[aria-label="Vault Intelligence"]')!.click());
  expect(container.querySelector('[aria-label="Intelligence query"]')).toBe(input);
  expect(input.value).toBe("Explain my notes");
  expect(input.dataset.note).toBe("Notes/Current.md");
  expect(input.closest("[hidden]")).toBeNull();
});

it("closes Forge and reopens the selected view through the existing sidebar toggle", async () => {
  const container = await renderSidebar();
  await act(async () => container.querySelector<HTMLButtonElement>('[aria-label="Close Forge sidebar"]')!.click());
  expect(container.querySelector("#forge-title")).toBeNull();
  await act(async () => container.querySelector<HTMLButtonElement>('[data-tooltip="Open right sidebar"]')!.click());
  expect(container.querySelector("#forge-title")?.textContent).toContain("Forge");
});
