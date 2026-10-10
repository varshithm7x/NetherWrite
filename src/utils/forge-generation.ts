import { AIProviderRequestError } from "./ai-core";
import { getModelsForProvider } from "./ai-settings";
import { getCommentDisplayText } from "./comment-anchors";

export class ForgeGenerationError extends Error {}

/** Use a conservative request budget, smaller for models outside our catalog.
 * UTF-8 bytes bound source tokens conservatively, including non-Latin notes. */
export function prepareForgeSource(source: string, count: number, modelId: string, provider: "openai" | "openrouter", tool: "quiz" | "flashcards") {
  const knownModel = getModelsForProvider(provider).some(model => model.id === modelId);
  const contextBudget = knownModel ? 8192 : 4096;
  const outputTokens = Math.min(knownModel ? 4500 : 2000, 500 + count * 220);
  const sourceBytes = contextBudget - outputTokens - 1400;
  const frontmatter = /^(?:\uFEFF)?---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/.exec(source);
  const body = source.slice(frontmatter?.[0].length || 0);
  const encoder = new TextEncoder();
  let end = body.length;
  if (encoder.encode(body).length > sourceBytes) {
    let low = 0;
    let high = body.length;
    while (low < high) {
      const middle = Math.ceil((low + high) / 2);
      if (encoder.encode(body.slice(0, middle)).length <= sourceBytes) low = middle;
      else high = middle - 1;
    }
    end = low;
    if (end > 0 && /[\uD800-\uDBFF]/.test(body[end - 1])) end--;
  }
  const content = body.slice(0, end);
  if (getCommentDisplayText(content).replace(/\s/g, "").length < 120) {
    throw new ForgeGenerationError(`This note is too short for ${tool === "quiz" ? "a reliable quiz" : "reliable flashcards"}. Add more meaningful content first.`);
  }
  return { content, sourceOffset: frontmatter?.[0].length || 0, truncated: end < body.length, outputTokens };
}


export function describeForgeProviderFailure(error: unknown, provider: "openai" | "openrouter", tool: "quiz" | "flashcards"): string {
  if (error instanceof AIProviderRequestError) {
    if (error.kind === "quota") return provider === "openai"
      ? "OpenAI API credits, quota, or billing limit reached. Check your API billing and project limits. ChatGPT Plus does not include API-key usage."
      : "The AI provider's credits, quota, or billing limit was reached. Check its billing and account limits before retrying.";
    const messages: Record<number, string> = {
      401: "The AI provider rejected your credentials. Check AI Settings.",
      402: "The AI provider has insufficient credits. Check AI Settings.",
      403: "The AI provider could not process this note. Check its settings and try again.",
      404: "The selected AI model is unavailable. Choose another model in Settings.",
      429: "The AI provider is rate-limiting requests. Please retry later.",
    };
    return messages[error.status] || `The AI provider could not generate the ${tool}. Please try again or check AI Settings.`;
  }
  return "Could not reach the AI provider or receive a usable response. Check your connection and AI Settings.";
}
