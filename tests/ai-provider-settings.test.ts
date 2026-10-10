// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AIIntelligenceDashboard } from "../src/components/settings/components/AIIntelligenceDashboard";
import type { AISettings } from "../src/utils/ai-settings";

const mocks = vi.hoisted(() => ({ settings: {} as AISettings, save: vi.fn() }));
vi.mock("../src/utils/ai-settings", () => ({
  AI_SETTINGS_CHANGED_EVENT: "ai-settings-changed", DEFAULT_MODEL_ID: "openai/gpt-4o",
  AI_PROVIDER_PRESETS: [
    { id: "openrouter", label: "OpenRouter", baseUrl: "https://openrouter.ai/api/v1", keyUrl: "https://fixture.invalid", keyPlaceholder: "Fixture" },
    { id: "openai", label: "OpenAI", baseUrl: "https://api.openai.com/v1", keyUrl: "https://fixture.invalid", keyPlaceholder: "Fixture" },
  ],
  getModelsForProvider: (provider: string) => [{ id: provider === "openai" ? "gpt-4o" : "openai/gpt-4o", label: "Fixture model", description: "Fixture" }],
  loadSettings: () => mocks.settings,
  loadSettingsAsync: async () => mocks.settings,
  saveSettings: (settings: AISettings) => { mocks.settings = settings; mocks.save(settings); window.dispatchEvent(new Event("ai-settings-changed")); },
}));
vi.mock("../src/utils/embeddings", () => ({ loadStore: () => ({ entries: new Map() }), isModelLoaded: () => false }));
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root;
let container: HTMLDivElement;

beforeEach(() => {
  mocks.save.mockReset();
  mocks.settings = { apiKey: "openai-test-fixture", modelId: "gpt-4o", provider: "openai", customBaseUrl: "https://old-fixture.invalid/v1", webGrounding: false, providerKeys: { openrouter: "router-test-fixture" } };
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  act(() => root.render(React.createElement(AIIntelligenceDashboard)));
});
afterEach(() => { act(() => root.unmount()); document.body.replaceChildren(); });

function provider(label: string) {
  return [...container.querySelectorAll<HTMLButtonElement>("button")].find(button => button.textContent?.includes(label) && button.textContent?.includes("https://"))!;
}

it("keeps the saved key when clicking the already-active OpenAI provider", () => {
  act(() => provider("OpenAI").click());
  expect(mocks.save).not.toHaveBeenCalled();
  expect(container.querySelector<HTMLInputElement>('input[type="password"]')?.value).toBe("openai-test-fixture");
  expect(container.textContent).toContain("Key Saved");
  expect(container.textContent).not.toContain("Connected");
});

it("preserves provider-specific credentials while switching and clears an obsolete endpoint override", () => {
  act(() => provider("OpenRouter").click());
  expect(mocks.settings).toMatchObject({ apiKey: "router-test-fixture", modelId: "openai/gpt-4o", customBaseUrl: "" });
  act(() => provider("OpenAI").click());
  expect(mocks.settings).toMatchObject({ apiKey: "openai-test-fixture", modelId: "gpt-4o" });
});

it("updates the displayed credentials when asynchronous settings arrive", () => {
  act(() => {
    mocks.settings = { ...mocks.settings, apiKey: "loaded-test-fixture" };
    window.dispatchEvent(new Event("ai-settings-changed"));
  });
  expect(container.querySelector<HTMLInputElement>('input[type="password"]')?.value).toBe("loaded-test-fixture");
});
