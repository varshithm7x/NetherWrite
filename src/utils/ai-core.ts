import { loadAIConfig, getBaseUrl, getProviderHeaders, parseProviderError } from "./ai-settings";

async function callLLM(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 300,
  temperature = 0.2,
): Promise<string> {
  const config = loadAIConfig();
  if (!config) throw new Error("No API key configured.");

  const baseUrl = getBaseUrl(config);
  const requestBody = JSON.stringify({
    model: config.modelId,
    max_tokens: maxTokens,
    temperature,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  // Some providers occasionally return a successful response with an empty
  // choices array while warming up or switching models. Retry those transient
  // responses instead of making the user click Ask repeatedly.
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: getProviderHeaders(config),
      body: requestBody,
    });

    if (!response.ok) {
      throw new Error(await parseProviderError(response));
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (typeof content === "string" && content.trim()) return content.trim();
    if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
  }

  throw new Error("The AI provider returned an empty response after several attempts. Please try again.");
}

export async function askAI(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 600,
  temperature = 0.3,
): Promise<string> {
  return callLLM(systemPrompt, userPrompt, maxTokens, temperature);
}


