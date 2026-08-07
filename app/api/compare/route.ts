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
  temperature: z.number().min(0).max(1).default(0.2),
  model: z.string().min(1).max(160).optional(),
  governanceFacts: z.object({
    life_safety_context: z.boolean().nullable().optional(),
    primary_authority_available: z.boolean().nullable().optional(),
    emergency_continuity_defined: z.boolean().nullable().optional(),
    explicit_emergency_activation: z.boolean().nullable().optional(),
    emergency_authority_available: z.boolean().nullable().optional(),
    emergency_authority: z.string().max(200).nullable().optional()
  }).optional()
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
  model?: string;
  governanceFacts?: import('../../../lib/types').GovernanceContinuityFacts;
}): Promise<LaneResult> {
  const started = Date.now();
  const config = laneConfig[params.lane];
  const response = await callSameLlm({
    system: config.system,
    user: params.prompt,
    temperature: params.temperature,
    model: params.model
  });
  const evaluation = await evaluateGovernance({
    lane: params.lane,
    prompt: params.prompt,
    response,
    scenario: params.scenario,
    governanceFacts: params.governanceFacts
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
          temperature: parsed.temperature,
          model: parsed.model,
          governanceFacts: parsed.governanceFacts
        })
      )
    );

    const payload: CompareResponse = {
      prompt: parsed.prompt,
      scenario: parsed.scenario,
      model: `${getProviderLabel(parsed.model)} · ${getModelName(parsed.model)}`,
      generatedAt: new Date().toISOString(),
      lanes: results
    };

    return NextResponse.json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
