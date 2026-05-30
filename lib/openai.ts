import OpenAI from "openai";

export function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required. Add it to .env.local.");
  }

  return new OpenAI({ apiKey });
}

export async function callSameLlm(params: {
  system: string;
  user: string;
  temperature?: number;
}): Promise<string> {
  const client = getOpenAIClient();
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

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
