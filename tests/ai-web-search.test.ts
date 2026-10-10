import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { answerWebQuestion, parseWebAnswer } from "../src/utils/ai-web-search";

const config = vi.hoisted(() => vi.fn());
vi.mock("../src/utils/ai-settings", () => ({
  loadAIConfig: config,
  getBaseUrl: () => "https://fixture.invalid/v1",
  getProviderHeaders: () => ({ Authorization: "Bearer fixture" }),
  parseProviderError: async () => "Search provider unavailable",
}));
const citation = { type: "url_citation", url_citation: { url: "https://example.org/lesson", title: "Lesson" } };
const searchData = { choices: [{ message: { content: "A sourced explanation.", annotations: [citation] } }] };
let fetcher: ReturnType<typeof vi.fn>;
beforeEach(() => {
  config.mockReturnValue({ provider: "openrouter", modelId: "configured-model:free" });
  fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => searchData });
  vi.stubGlobal("fetch", fetcher);
});
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

it("enables real web search for OpenRouter including free models, sending only the question", async () => {
  expect((await answerWebQuestion("Explain binary search")).sources).toEqual([{ url: "https://example.org/lesson", title: "Lesson" }]);
  const [url, options] = fetcher.mock.calls[0];
  expect(url).toBe("https://fixture.invalid/v1/chat/completions");
  expect(JSON.parse(options.body)).toMatchObject({ model: "configured-model:free", plugins: [{ id: "web", engine: "exa", max_results: 5 }] });
  expect(JSON.parse(options.body).messages[1]).toEqual({ role: "user", content: "Explain binary search" });
});

it("uses OpenAI Responses with required web search and preserves a compatible selected model", async () => {
  config.mockReturnValue({ provider: "openai", modelId: "gpt-4.1" });
  fetcher.mockResolvedValue({ ok: true, json: async () => ({ output: [{ type: "web_search_call" }, { type: "message", content: [{ type: "output_text", text: "Search result", annotations: [{ type: "url_citation", url: "https://example.org/lesson", title: "Lesson" }] }] }] }) });
  await answerWebQuestion("A topic");
  expect(fetcher.mock.calls[0][0]).toBe("https://fixture.invalid/v1/responses");
  expect(JSON.parse(fetcher.mock.calls[0][1].body)).toMatchObject({ model: "gpt-4.1", tools: [{ type: "web_search" }], tool_choice: "required", store: false });
});

it("uses a dedicated supported search model for older GPT-4o configurations", async () => {
  config.mockReturnValue({ provider: "openai", modelId: "gpt-4o-mini" });
  await answerWebQuestion("A topic");
  expect(JSON.parse(fetcher.mock.calls[0][1].body).model).toBe("gpt-4.1-mini");
});

it("makes inline annotation markers clickable and deduplicates sources", () => {
  const annotation = { ...citation, url_citation: { ...citation.url_citation, start_index: 6, end_index: 9 } };
  expect(parseWebAnswer({ choices: [{ message: { content: "Fact. [1]", annotations: [annotation, annotation] } }] })).toEqual({ answer: "Fact. [Lesson](https://example.org/lesson)", sources: [{ url: "https://example.org/lesson", title: "Lesson" }] });
});

it.each(["javascript:alert(1)", "file:///private", "https://user:secret@example.org/"])("rejects unsafe source URL %s", url => {
  expect(() => parseWebAnswer({ choices: [{ message: { content: "An answer", annotations: [{ type: "url_citation", url_citation: { url } }] } }] })).toThrow("no cited results");
});

it("does not invent resources from plain model text or accept empty answers", () => {
  expect(() => parseWebAnswer({ choices: [{ message: { content: "https://invented.invalid" } }] })).toThrow("no cited results");
  expect(() => parseWebAnswer({ choices: [{ message: { content: "", annotations: [citation] } }] })).toThrow("no cited results");
});

it("reports provider failures and missing configuration", async () => {
  config.mockReturnValue(null);
  await expect(answerWebQuestion("A topic")).rejects.toThrow("Configure an AI provider");
  expect(fetcher).not.toHaveBeenCalled();
  config.mockReturnValue({ provider: "openrouter", modelId: "test" });
  fetcher.mockResolvedValue({ ok: false });
  await expect(answerWebQuestion("A topic")).rejects.toThrow("Search provider unavailable");
});

it("terminates a pending request on cancellation and cleans up its timeout", async () => {
  vi.useFakeTimers();
  const controller = new AbortController();
  fetcher.mockImplementation((_url, options) => new Promise((_resolve, reject) => options.signal.addEventListener("abort", () => reject(new Error("Cancelled")), { once: true })));
  const pending = answerWebQuestion("A topic", controller.signal);
  controller.abort();
  await expect(pending).rejects.toThrow("Cancelled");
  expect(vi.getTimerCount()).toBe(0);
});

it("terminates a stalled request after its deadline", async () => {
  vi.useFakeTimers();
  fetcher.mockImplementation((_url, options) => new Promise((_resolve, reject) => options.signal.addEventListener("abort", () => reject(options.signal.reason), { once: true })));
  const pending = answerWebQuestion("A topic");
  const rejected = expect(pending).rejects.toThrow("timed out");
  await vi.advanceTimersByTimeAsync(60000);
  await rejected;
  expect(vi.getTimerCount()).toBe(0);
});
