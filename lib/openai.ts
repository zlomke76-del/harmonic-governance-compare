import OpenAI from "openai";

type ProviderRuntime = "vercel-ai-gateway" | "openai-direct";

type GatewayConfig = {
  apiKey: string;
  baseURL?: string;
  defaultModel: string;
  providerLabel: string;
  runtime: ProviderRuntime;
};

const MODEL_ALIASES: Record<string, string> = {
  // V58 compatibility aliases. These keep older dropdown/localStorage values working
  // while routing to model IDs that are currently exposed by Vercel AI Gateway.
  "google/gemini-3.1-flash": "google/gemini-3.5-flash",
  "mistral/mistral-large-latest": "mistral/mistral-large-3",
  "mistral/mistral-large": "mistral/mistral-large-3"
};

const PROVIDER_FALLBACKS: Record<string, string> = {
  openai: "openai/gpt-4.1-mini",
  anthropic: "anthropic/claude-sonnet-5",
  google: "google/gemini-3.5-flash",
  xai: "xai/grok-4.3",
  meta: "meta/llama-4-maverick",
  mistral: "mistral/mistral-large-3"
};

function applyModelAlias(model: string): string {
  return MODEL_ALIASES[model] || model;
}

function providerFromModel(model: string): string | null {
  return model.includes("/") ? model.split("/")[0] || null : null;
}

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
  const requested = applyModelAlias(model.trim());

  if (!requested) return applyModelAlias(config.defaultModel);

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
  const requested = applyModelAlias(modelOverride?.trim() || config.defaultModel);
  return normalizeModelForRuntime(requested, config);
}

export function getProviderLabel(modelOverride?: string): string {
  const config = getGatewayConfig();
  const model = applyModelAlias(modelOverride?.trim() || config.defaultModel);

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

  const requestCompletion = async (modelId: string) => {
    const completion = await client.chat.completions.create({
      model: modelId,
      temperature: params.temperature ?? 0.2,
      messages: [
        { role: "system", content: params.system },
        { role: "user", content: params.user }
      ]
    });

    return completion.choices[0]?.message?.content?.trim() || "";
  };

  try {
    return await requestCompletion(model);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown model error.";
    const config = getGatewayConfig();
    const provider = providerFromModel(model);
    const fallback = provider ? PROVIDER_FALLBACKS[provider] : undefined;
    const isModelLookupFailure = /model .*not found|404|not found/i.test(message);

    // No shortcut: keep the provider selected and retry with a currently valid model
    // in the same provider family when an older provider model ID disappears from
    // the Gateway catalog. This preserves model-agnostic behavior without silently
    // collapsing everything back to OpenAI.
    if (config.runtime === "vercel-ai-gateway" && fallback && fallback !== model && isModelLookupFailure) {
      try {
        return await requestCompletion(fallback);
      } catch (fallbackErr) {
        const fallbackMessage = fallbackErr instanceof Error ? fallbackErr.message : "Unknown fallback model error.";
        throw new Error(
          `LLM request failed for model "${model}" and same-provider fallback "${fallback}" through ${getProviderLabel(params.model)}. ${fallbackMessage}`
        );
      }
    }

    throw new Error(
      `LLM request failed for model "${model}" through ${getProviderLabel(params.model)}. Verify that this provider is enabled in your Vercel AI Gateway project. ${message}`
    );
  }
}
