import OpenAI from "openai";

type ProviderRuntime = "vercel-ai-gateway" | "openai-direct";

type GatewayConfig = {
  apiKey: string;
  baseURL?: string;
  defaultModel: string;
  providerLabel: string;
  runtime: ProviderRuntime;
};

function getGatewayConfig(): GatewayConfig {
  const gatewayKey = process.env.VERCEL_AI_GATEWAY_API_KEY || process.env.AI_GATEWAY_API_KEY;

  if (gatewayKey) {
    return {
      apiKey: gatewayKey,
      baseURL: process.env.VERCEL_AI_GATEWAY_BASE_URL || process.env.AI_GATEWAY_BASE_URL || "https://ai-gateway.vercel.sh/v1",
      defaultModel:
        process.env.VERCEL_AI_GATEWAY_MODEL ||
        process.env.AI_GATEWAY_MODEL ||
        process.env.OPENAI_MODEL ||
        "openai/gpt-4.1-mini",
      providerLabel: "Vercel AI Gateway",
      runtime: "vercel-ai-gateway"
    };
  }

  const openAiKey = process.env.OPENAI_API_KEY;
  if (!openAiKey) {
    throw new Error("Add VERCEL_AI_GATEWAY_API_KEY, AI_GATEWAY_API_KEY, or OPENAI_API_KEY to your environment variables.");
  }

  return {
    apiKey: openAiKey,
    defaultModel: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    providerLabel: "OpenAI direct",
    runtime: "openai-direct"
  };
}

function normalizeModelForRuntime(model: string, config: GatewayConfig): string {
  const requested = model.trim();

  if (!requested) return config.defaultModel;

  // Vercel AI Gateway is intentionally model/provider agnostic. It expects
  // provider-prefixed model IDs such as openai/..., anthropic/..., google/..., xai/..., etc.
  if (config.runtime === "vercel-ai-gateway") {
    return requested;
  }

  // Direct OpenAI fallback can only execute OpenAI models. Strip the OpenAI prefix
  // because OpenAI's native API expects model names like gpt-4.1-mini, not openai/gpt-4.1-mini.
  if (requested.startsWith("openai/")) {
    return requested.replace(/^openai\//, "");
  }

  if (requested.includes("/")) {
    throw new Error(
      `Model "${requested}" requires Vercel AI Gateway. Add VERCEL_AI_GATEWAY_API_KEY or AI_GATEWAY_API_KEY to run non-OpenAI models while keeping Harmonic model-agnostic.`
    );
  }

  return requested;
}

export function getModelName(modelOverride?: string): string {
  const config = getGatewayConfig();
  const requested = modelOverride?.trim() || config.defaultModel;
  return normalizeModelForRuntime(requested, config);
}

export function getProviderLabel(modelOverride?: string): string {
  const config = getGatewayConfig();
  const model = modelOverride?.trim() || config.defaultModel;

  if (config.runtime === "vercel-ai-gateway") {
    const providerPrefix = model.includes("/") ? model.split("/")[0] : "gateway";
    return `Vercel AI Gateway · ${providerPrefix}`;
  }

  return config.providerLabel;
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

  try {
    const completion = await client.chat.completions.create({
      model,
      temperature: params.temperature ?? 0.2,
      messages: [
        { role: "system", content: params.system },
        { role: "user", content: params.user }
      ]
    });

    return completion.choices[0]?.message?.content?.trim() || "";
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown model error.";
    throw new Error(
      `LLM request failed for model "${model}" through ${getProviderLabel(params.model)}. Verify that this model is enabled in your Vercel AI Gateway model list, or choose another provider-prefixed model ID. ${message}`
    );
  }
}
