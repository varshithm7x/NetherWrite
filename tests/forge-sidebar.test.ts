// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { RightSidebar } from "../src/components/layout/RightSidebar";
import { TitleBar } from "../src/components/layout/TitleBar";
import type { Theme } from "../src/types";

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

it.each(["light", "dark"] as const)("renders six inert creation cards under the %s theme at narrow width", async theme => {
  const container = await renderSidebar(theme, 200);
  const grid = container.querySelector('[aria-label="Creation tools"]')!;
  const cards = [...grid.querySelectorAll<HTMLButtonElement>("button")];
  expect(cards.map(card => card.getAttribute("aria-label"))).toEqual([
    "Slides — Coming Soon", "Mind Map — Coming Soon", "Reports — Coming Soon",
    "Flashcards — Coming Soon", "Quizzes — Coming Soon", "Infographics — Coming Soon",
  ]);
  expect(grid.classList.contains("grid-cols-2")).toBe(true);
  expect(container.querySelector(".right-sidebar-panel")?.getAttribute("style")).toContain("200px");
  for (const card of cards) {
    expect(card.getAttribute("aria-disabled")).toBe("true");
    act(() => { card.focus(); card.click(); });
    expect(document.activeElement).toBe(card);
  }
  expect(container.querySelector('[role="dialog"]')).toBeNull();
  expect(container.textContent).toContain("Your generated content will appear here.");
  expect(container.querySelector("#forge-creations-title")?.parentElement?.parentElement?.classList.contains("overflow-y-auto")).toBe(true);
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
  act(() => container.querySelector<HTMLButtonElement>('[aria-label="Close Forge sidebar"]')!.click());
  expect(container.querySelector("#forge-title")).toBeNull();
  act(() => container.querySelector<HTMLButtonElement>('[data-tooltip="Open right sidebar"]')!.click());
  expect(container.querySelector("#forge-title")?.textContent).toContain("Forge");
});
