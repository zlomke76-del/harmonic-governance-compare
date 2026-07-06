import OpenAI from "openai";

function getGatewayConfig(): { apiKey: string; baseURL?: string; model: string; providerLabel: string } {
  const vercelGatewayKey = process.env.VERCEL_AI_GATEWAY_API_KEY;
  if (vercelGatewayKey) {
    return {
      apiKey: vercelGatewayKey,
      baseURL: process.env.VERCEL_AI_GATEWAY_BASE_URL || "https://ai-gateway.vercel.sh/v1",
      model: process.env.VERCEL_AI_GATEWAY_MODEL || process.env.OPENAI_MODEL || "openai/gpt-4.1-mini",
      providerLabel: "Vercel AI Gateway"
    };
  }

  const openAiKey = process.env.OPENAI_API_KEY;
  if (!openAiKey) {
    throw new Error("Add VERCEL_AI_GATEWAY_API_KEY or OPENAI_API_KEY to your environment variables.");
  }

  return {
    apiKey: openAiKey,
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    providerLabel: "OpenAI"
  };
}

export function getModelName(modelOverride?: string): string {
  return modelOverride?.trim() || getGatewayConfig().model;
}

export function getProviderLabel(): string {
  return getGatewayConfig().providerLabel;
}

export function getOpenAIClient(): OpenAI {
  const config = getGatewayConfig();
  return new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL
  });
}

export async function callSameLlm(params: {
  system: string;
  user: string;
  temperature?: number;
  model?: string;
}): Promise<string> {
  const client = getOpenAIClient();
  const model = getModelName(params.model);

  const completion = await client.chat.completions.create({
    model,
    temperature: params.temperature ?? 0.2,
    messages: [
      { role: "system", content: params.system },
      { role: "user", content: params.user }
    ]
  });

  return completion.choices[0]?.message?.content?.trim() || "";
}
