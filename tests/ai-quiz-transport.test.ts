// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { askAI, AIProviderRequestError } from "../src/utils/ai-core";
const config = vi.hoisted(() => vi.fn());

vi.mock("../src/utils/ai-settings", () => ({
  loadAIConfig: config,
  getBaseUrl: () => "https://fixture.invalid/v1",
  getProviderHeaders: () => ({ "Content-Type": "application/json", Authorization: "Bearer test-fixture" }),
  readProviderError: async (response: Response) => ({ message: "Controlled provider error", status: response.status, kind: "other" }),
}));
vi.mock("../src/utils/disk-store", () => ({ readData: vi.fn(), writeData: vi.fn(), createDebouncedWriter: () => vi.fn() }));
vi.mock("../src/utils/spaces-rag", () => ({ MERMAID_FORMATTING_RULES: "" }));
let fetcher: ReturnType<typeof vi.fn>;
beforeEach(() => {
  config.mockReturnValue({ modelId: "configured-fixture-model", provider: "openai" });
  fetcher = vi.fn(async () => ({ ok: true, json: async () => ({ choices: [{ message: { content: "fixture response" } }] }) }));
  vi.stubGlobal("fetch", fetcher);
});
afterEach(() => vi.unstubAllGlobals());

it("uses the configured provider and model and forwards the cancellation signal", async () => {
  const controller = new AbortController();
  expect(await askAI("Trusted system", "Untrusted note data", 1200, 0.2, controller.signal)).toBe("fixture response");
  const [url, options] = fetcher.mock.calls[0];
  expect(url).toBe("https://fixture.invalid/v1/chat/completions");
  expect(options.signal).toBe(controller.signal);
  expect(JSON.parse(options.body)).toMatchObject({ model: "configured-fixture-model", max_completion_tokens: 1200, temperature: 0.2 });
});

it("retains existing callers that do not provide a cancellation signal", async () => {
  expect(await askAI("System", "Data")).toBe("fixture response");
});

it("uses supported completion parameters for OpenAI o4-mini", async () => {
  config.mockReturnValue({ modelId: "o4-mini", provider: "openai" });
  await askAI("System", "Data", 1800, 0.2);
  const body = JSON.parse(fetcher.mock.calls[0][1].body);
  expect(body.max_completion_tokens).toBe(1800);
  expect(body).not.toHaveProperty("max_tokens");
  expect(body).not.toHaveProperty("temperature");
});

it("preserves OpenRouter's existing request parameters", async () => {
  config.mockReturnValue({ modelId: "openai/gpt-4o", provider: "openrouter" });
  await askAI("System", "Data", 900, 0.2);
  const body = JSON.parse(fetcher.mock.calls[0][1].body);
  expect(body).toMatchObject({ model: "openai/gpt-4o", max_tokens: 900, temperature: 0.2 });
  expect(body).not.toHaveProperty("max_completion_tokens");
});

it("exposes status for controlled quiz errors while preserving provider error messages for existing callers", async () => {
  fetcher.mockResolvedValueOnce({ ok: false, status: 429 });
  await expect(askAI("System", "Data")).rejects.toMatchObject({ message: "Controlled provider error", status: 429 });
  fetcher.mockResolvedValueOnce({ ok: false, status: 401 });
  await expect(askAI("System", "Data")).rejects.toBeInstanceOf(AIProviderRequestError);
});
