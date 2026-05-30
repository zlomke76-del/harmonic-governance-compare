import { NextResponse } from "next/server";
import { z } from "zod";
import { evaluateGovernance } from "../../../lib/governance-adapter";
import { callSameLlm, getModelName, getProviderLabel } from "../../../lib/openai";
import {
  HARMONIC_GOVERNANCE_SYSTEM_PROMPT,
  HARMONIC_ONLY_SYSTEM_PROMPT,
  RAW_SYSTEM_PROMPT
} from "../../../lib/prompts";
import type { CompareResponse, LaneName, LaneResult } from "../../../lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RequestSchema = z.object({
  prompt: z.string().min(1).max(12000),
  scenario: z.string().min(1).max(200).default("general"),
  includeHarmonicOnly: z.boolean().default(true),
  temperature: z.number().min(0).max(1).default(0.2)
});

const laneConfig: Record<LaneName, { title: string; system: string }> = {
  raw: {
    title: "Raw LLM",
    system: RAW_SYSTEM_PROMPT
  },
  harmonic: {
    title: "Harmonic Only",
    system: HARMONIC_ONLY_SYSTEM_PROMPT
  },
  harmonic_governance: {
    title: "Harmonic + Governance",
    system: HARMONIC_GOVERNANCE_SYSTEM_PROMPT
  }
};

async function runLane(params: {
  lane: LaneName;
  prompt: string;
  scenario: string;
  temperature: number;
}): Promise<LaneResult> {
  const started = Date.now();
  const config = laneConfig[params.lane];
  const response = await callSameLlm({
    system: config.system,
    user: params.prompt,
    temperature: params.temperature
  });
  const evaluation = await evaluateGovernance({
    lane: params.lane,
    prompt: params.prompt,
    response,
    scenario: params.scenario
  });

  return {
    lane: params.lane,
    title: config.title,
    response,
    evaluation,
    latencyMs: Date.now() - started
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = RequestSchema.parse(body);
    const lanes: LaneName[] = parsed.includeHarmonicOnly
      ? ["raw", "harmonic", "harmonic_governance"]
      : ["raw", "harmonic_governance"];

    const results = await Promise.all(
      lanes.map((lane) =>
        runLane({
          lane,
          prompt: parsed.prompt,
          scenario: parsed.scenario,
          temperature: parsed.temperature
        })
      )
    );

    const payload: CompareResponse = {
      prompt: parsed.prompt,
      scenario: parsed.scenario,
      model: `${getProviderLabel()} · ${getModelName()}`,
      generatedAt: new Date().toISOString(),
      lanes: results
    };

    return NextResponse.json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
