import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateMindMap, initiallyCollapsed, layoutMindMap, linkMindMapSources, parseMindMap } from "../src/utils/forge-mind-map";
import { interpolateMindMapLayout } from "../src/hooks/useAnimatedMindMapLayout";

const { askAI, loadAIConfig, loadSettingsAsync } = vi.hoisted(() => ({
  askAI: vi.fn(), loadAIConfig: vi.fn(), loadSettingsAsync: vi.fn(),
}));
vi.mock("../src/utils/ai-core", () => ({ askAI }));
vi.mock("../src/utils/ai-settings", () => ({ loadAIConfig, loadSettingsAsync }));

const hierarchy = { label: "Image processing", children: [
  { label: "MATLAB basics", children: [{ label: "Data types" }, { label: "Operators" }] },
  { label: "Image toolbox", children: [{ label: "Filters" }] },
] };

beforeEach(() => {
  vi.clearAllMocks();
  loadAIConfig.mockReturnValue({ apiKey: "test" });
  loadSettingsAsync.mockResolvedValue({});
  askAI.mockResolvedValue(JSON.stringify(hierarchy));
});

describe("Forge topic hierarchy", () => {
  it("assigns app-owned IDs and discards model-supplied presentation", () => {
    const root = parseMindMap('```json\n' + JSON.stringify({ ...hierarchy, id: "ai-id", x: 400, html: "<script />" }) + '\n```');
    expect(root.id).toBe("root");
    expect(root.children[0].id).toBe("root.0");
    expect(root.children[0].children[0].children).toEqual([]);
    expect(root).not.toHaveProperty("html");
    expect(root).not.toHaveProperty("x");
  });

  it.each([{ label: "" }, { label: 5 }, { label: "Topic", children: {} }, { label: "a".repeat(241) }])("rejects invalid model topics %j", value => {
    expect(() => parseMindMap(JSON.stringify(value))).toThrow();
  });

  it("limits untrusted hierarchy depth and node count", () => {
    expect(() => parseMindMap(JSON.stringify({ label: "root", children: Array.from({ length: 301 }, () => ({ label: "child" })) }))).toThrow();
    let value: { label: string; children?: unknown[] } = { label: "leaf" };
    for (let i = 0; i < 10; i++) value = { label: "parent", children: [value] };
    expect(() => parseMindMap(JSON.stringify(value))).toThrow();
  });

  it("starts with major branches and reveals descendants with curved-edge endpoints", () => {
    const root = parseMindMap(JSON.stringify(hierarchy));
    const collapsed = initiallyCollapsed(root);
    const compact = layoutMindMap(root, collapsed);
    expect(compact.nodes).toHaveLength(3);
    collapsed.delete("root.0");
    const expanded = layoutMindMap(root, collapsed);
    expect(expanded.nodes).toHaveLength(5);
    for (const { from, to } of expanded.edges) expect(to.x).toBeGreaterThan(from.x + from.width);
    const leaves = expanded.nodes.filter(node => node.depth === 2);
    expect(Math.abs(leaves[0].y - leaves[1].y)).toBeGreaterThan(36);
    expect(compact.height).toBeLessThan(expanded.height);
  });
});

describe("Forge source analysis", () => {
  it("passes the chosen topic and exact source paths into analysis", async () => {
    const result = await generateMindMap([{ path: "notes/matlab.md", name: "MATLAB", content: "Data types and operators" }], vi.fn(), "  Data types  ");
    expect(JSON.parse(askAI.mock.calls[0][1])).toMatchObject({ path: "notes/matlab.md", requestedTopic: "Data types" });
    expect(result.root.children[0].children[0].sourcePaths).toEqual(["notes/matlab.md"]);
  });

  it("keeps citations to selected notes and matches legacy topic labels locally", () => {
    const root = parseMindMap(JSON.stringify({ label: "Processing", children: [
      { label: "MATLAB basics", sourcePaths: ["other-vault.md", "matlab.md"] },
      { label: "Filters", sourcePaths: ["invented.md"] },
    ] }));
    const linked = linkMindMapSources(root, [
      { path: "matlab.md", name: "MATLAB", content: "MATLAB basics and variables" },
      { path: "images.md", name: "Images", content: "Filters enhance images" },
    ]);
    expect(linked.children[0].sourcePaths).toEqual(["matlab.md"]);
    expect(linked.children[1].sourcePaths).toEqual(["images.md"]);
    expect(linked.sourcePaths).toEqual(["matlab.md", "images.md"]);
  });
  it("analyzes the whole source, including its last section, before merging", async () => {
    const content = "a".repeat(24000) + "FINAL CONCEPT";
    const result = await generateMindMap([{ path: "note.md", name: "Note", content }], vi.fn());
    expect(askAI).toHaveBeenCalledTimes(4);
    const analyzed = askAI.mock.calls.slice(0, 3).map(call => JSON.parse(call[1]).content).join("");
    expect(analyzed).toBe(content);
    expect(askAI.mock.calls[3][0]).toContain("Combine ALL");
    expect(result.sources).toEqual([{ path: "note.md", name: "Note" }]);
    expect(result.root.label).toBe("Image processing");
    expect(result).not.toHaveProperty("content");
  });

  it("includes every selected source in the final analysis", async () => {
    await generateMindMap([{ path: "a.md", name: "A", content: "First concept" }, { path: "b.md", name: "B", content: "Last concept" }], vi.fn());
    expect(askAI.mock.calls[0][1]).toContain("First concept");
    expect(askAI.mock.calls[1][1]).toContain("Last concept");
    expect(askAI).toHaveBeenCalledTimes(3);
  });

  it("fails clearly without a configured key or meaningful sources", async () => {
    loadAIConfig.mockReturnValue(null);
    await expect(generateMindMap([{ path: "a.md", name: "A", content: "Text" }], vi.fn())).rejects.toThrow("API key");
    await expect(generateMindMap([], vi.fn())).rejects.toThrow("Choose sources");
    expect(askAI).not.toHaveBeenCalled();
  });
});

it("animates revealed topics from their parent and retracts collapsed topics smoothly", () => {
  const root = parseMindMap(JSON.stringify(hierarchy));
  const compact = layoutMindMap(root, initiallyCollapsed(root));
  const expanded = layoutMindMap(root, new Set());
  const previous = { nodes: compact.nodes.map(node => ({ ...node, opacity: 1 })), edges: compact.edges.map(edge => ({ from: { ...edge.from, opacity: 1 }, to: { ...edge.to, opacity: 1 } })) };
  const first = interpolateMindMapLayout(previous, expanded, 0);
  const middle = interpolateMindMapLayout(previous, expanded, 0.5);
  const target = expanded.nodes.find(node => node.node.id === "root.0.0")!;
  const initial = first.nodes.find(node => node.node.id === target.node.id)!;
  const moving = middle.nodes.find(node => node.node.id === target.node.id)!;
  expect(initial.opacity).toBe(0);
  expect(moving.opacity).toBe(0.5);
  expect(moving.x).toBeGreaterThan(initial.x);
  expect(moving.x).toBeLessThan(target.x);
  const retracted = interpolateMindMapLayout(interpolateMindMapLayout(previous, expanded, 1), compact, 0.5);
  expect(retracted.nodes.find(node => node.node.id === target.node.id)!.opacity).toBe(0.5);
  expect(middle.edges.find(edge => edge.to.node.id === target.node.id)!.to).toEqual(moving);
});
