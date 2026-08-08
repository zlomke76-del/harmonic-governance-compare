import { NextResponse } from "next/server";
import { z } from "zod";
import { evaluateGovernance, evaluateUnifiedGovernance } from "../../../lib/governance-adapter";
import { callSameLlm, getModelName, getProviderLabel } from "../../../lib/openai";
import {
  HARMONIC_ONLY_SYSTEM_PROMPT,
  RAW_SYSTEM_PROMPT
} from "../../../lib/prompts";
import type { CompareResponse, GovernanceAuthorityProvenance, GovernanceDownstreamAccountability, LaneName, LaneResult } from "../../../lib/types";

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
  }).optional(),
  authorityProvenance: z.record(z.string(), z.unknown()).optional(),
  downstreamAccountability: z.record(z.string(), z.unknown()).optional()
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
    system: HARMONIC_ONLY_SYSTEM_PROMPT
  }
};

async function runRawLane(params: {
  prompt: string;
  scenario: string;
  temperature: number;
  model?: string;
}): Promise<LaneResult> {
  const started = Date.now();
  const response = await callSameLlm({
    system: laneConfig.raw.system,
    user: params.prompt,
    temperature: params.temperature,
    model: params.model
  });
  const evaluation = await evaluateGovernance({
    lane: "raw",
    prompt: params.prompt,
    response,
    scenario: params.scenario
  });
  return { lane: "raw", title: laneConfig.raw.title, response, evaluation, latencyMs: Date.now() - started };
}

async function runUnifiedGovernedLanes(params: {
  prompt: string;
  scenario: string;
  temperature: number;
  model?: string;
  governanceFacts?: import('../../../lib/types').GovernanceContinuityFacts;
  authorityProvenance?: GovernanceAuthorityProvenance;
  downstreamAccountability?: GovernanceDownstreamAccountability;
}): Promise<LaneResult[]> {
  const started = Date.now();

  // One candidate model response is evaluated once by Harmonic.
  // Both comparison panels are projections of the same runtime transaction:
  // Harmonic = stabilization layer; Harmonic+ = constitutional layer.
  const response = await callSameLlm({
    system: HARMONIC_ONLY_SYSTEM_PROMPT,
    user: params.prompt,
    temperature: params.temperature,
    model: params.model
  });

  const unified = await evaluateUnifiedGovernance({
    prompt: params.prompt,
    response,
    scenario: params.scenario,
    governanceFacts: params.governanceFacts,
    authorityProvenance: params.authorityProvenance,
    downstreamAccountability: params.downstreamAccountability
  });

  const latencyMs = Date.now() - started;
  return [
    {
      lane: "harmonic",
      title: laneConfig.harmonic.title,
      response,
      evaluation: unified.harmonic,
      latencyMs
    },
    {
      lane: "harmonic_governance",
      title: laneConfig.harmonic_governance.title,
      response,
      evaluation: unified.harmonic_governance,
      latencyMs
    }
  ];
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = RequestSchema.parse(body);
    const [raw, governed] = await Promise.all([
      runRawLane({
        prompt: parsed.prompt,
        scenario: parsed.scenario,
        temperature: parsed.temperature,
        model: parsed.model
      }),
      runUnifiedGovernedLanes({
        prompt: parsed.prompt,
        scenario: parsed.scenario,
        temperature: parsed.temperature,
        model: parsed.model,
        governanceFacts: parsed.governanceFacts,
        authorityProvenance: parsed.authorityProvenance as GovernanceAuthorityProvenance | undefined,
        downstreamAccountability: parsed.downstreamAccountability as GovernanceDownstreamAccountability | undefined
      })
    ]);

    const results: LaneResult[] = parsed.includeHarmonicOnly
      ? [raw, ...governed]
      : [raw, governed[1]];

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
