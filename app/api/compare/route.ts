import { NextResponse } from "next/server";
import { z } from "zod";
import { evaluateGovernance, evaluateUnifiedGovernance } from "../../../lib/governance-adapter";
import { callSameLlm, getModelName, getProviderLabel } from "../../../lib/openai";
import {
  HARMONIC_ONLY_SYSTEM_PROMPT,
  RAW_SYSTEM_PROMPT
} from "../../../lib/prompts";
import type {
  CompareResponse,
  GovernanceAuthorityProvenance,
  GovernanceDownstreamAccountability,
  GovernanceRequestedAction,
  GovernanceRealityWitness,
  GovernanceConsequenceProfile,
  GovernanceObligationWitness,
  GovernanceStateProvenanceWitness,
  LaneName,
  LaneResult,
  RuntimeTarget
} from "../../../lib/types";

import { resolveFrozenScenarioFixture } from "../../../lib/scenario-fixtures";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RequestSchema = z.object({
  runtimeTarget: z.enum(["v4_1", "v4", "v2"]).default("v4_1"),
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
    emergency_authority: z.string().max(200).nullable().optional(),
    operator_review_confirmed: z.boolean().nullable().optional()
  }).optional(),
  authorityProvenance: z.record(z.string(), z.unknown()).optional(),
  requestedAction: z.object({
    type: z.string().min(1).max(200),
    scope: z.array(z.string().min(1).max(300)).min(1)
  }).optional(),
  realityWitness: z.record(z.string(), z.unknown()).optional(),
  consequenceProfile: z.record(z.string(), z.unknown()).optional(),
  downstreamAccountability: z.record(z.string(), z.unknown()).optional(),
  obligationWitness: z.record(z.string(), z.unknown()).optional(),
  stateProvenance: z.record(z.string(), z.unknown()).optional(),
  allowHarnessInference: z.boolean().default(false)
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

async function projectRawLane(params: {
  prompt: string;
  scenario: string;
  response: string;
}): Promise<LaneResult> {
  const started = Date.now();
  const evaluation = await evaluateGovernance({
    lane: "raw",
    prompt: params.prompt,
    response: params.response,
    scenario: params.scenario
  });

  return {
    lane: "raw",
    title: laneConfig.raw.title,
    response: params.response,
    evaluation,
    latencyMs: Date.now() - started
  };
}


function governedDisplayResponse(evaluation: import("../../../lib/types").GovernanceEvaluation, fallback: string): string {
  const raw = evaluation.raw && typeof evaluation.raw === "object"
    ? evaluation.raw as Record<string, unknown>
    : null;
  const governed = raw && typeof raw.governed_response === "string"
    ? raw.governed_response.trim()
    : "";
  return governed || fallback;
}

async function runUnifiedGovernedLanes(params: {
  runtimeTarget: RuntimeTarget;
  prompt: string;
  scenario: string;
  response: string;
  governanceFacts?: import("../../../lib/types").GovernanceContinuityFacts;
  authorityProvenance?: GovernanceAuthorityProvenance;
  requestedAction?: GovernanceRequestedAction;
  realityWitness?: GovernanceRealityWitness;
  consequenceProfile?: GovernanceConsequenceProfile;
  downstreamAccountability?: GovernanceDownstreamAccountability;
  obligationWitness?: GovernanceObligationWitness;
  stateProvenance?: GovernanceStateProvenanceWitness;
  allowHarnessInference?: boolean;
}): Promise<LaneResult[]> {
  const started = Date.now();

  // V86: Causal comparison uses one candidate response.
  // Raw, Harmonic, and Harmonic+ all display/evaluate the exact same candidate.
  const unified = await evaluateUnifiedGovernance({
    runtimeTarget: params.runtimeTarget,
    prompt: params.prompt,
    response: params.response,
    scenario: params.scenario,
    governanceFacts: params.governanceFacts,
    authorityProvenance: params.authorityProvenance,
    requestedAction: params.requestedAction,
    realityWitness: params.realityWitness,
    consequenceProfile: params.consequenceProfile,
    downstreamAccountability: params.downstreamAccountability,
    obligationWitness: params.obligationWitness,
    stateProvenance: params.stateProvenance,
    allowHarnessInference: params.allowHarnessInference
  });

  const latencyMs = Date.now() - started;
  return [
    {
      lane: "harmonic",
      title: laneConfig.harmonic.title,
      response: params.response,
      evaluation: unified.harmonic,
      latencyMs
    },
    {
      lane: "harmonic_governance",
      title: laneConfig.harmonic_governance.title,
      response: governedDisplayResponse(unified.harmonic_governance, params.response),
      evaluation: unified.harmonic_governance,
      latencyMs
    }
  ];
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = RequestSchema.parse(body);
    const frozenFixture = resolveFrozenScenarioFixture(parsed.scenario, parsed.prompt);

    // Generate exactly one candidate. Governance evaluates this candidate; it does
    // not trigger a second model generation that could confound the comparison.
    const candidate = await callSameLlm({
      system: RAW_SYSTEM_PROMPT,
      user: parsed.prompt,
      temperature: parsed.temperature,
      model: parsed.model
    });

    const [raw, governed] = await Promise.all([
      projectRawLane({
        prompt: parsed.prompt,
        scenario: parsed.scenario,
        response: candidate
      }),
      runUnifiedGovernedLanes({
        runtimeTarget: parsed.runtimeTarget,
        prompt: parsed.prompt,
        scenario: parsed.scenario,
        response: candidate,
        governanceFacts: parsed.governanceFacts || frozenFixture?.governanceFacts,
        authorityProvenance: (parsed.authorityProvenance as GovernanceAuthorityProvenance | undefined) || frozenFixture?.authorityProvenance,
        requestedAction: (parsed.requestedAction as GovernanceRequestedAction | undefined) || frozenFixture?.requestedAction,
        realityWitness: (parsed.realityWitness as GovernanceRealityWitness | undefined) || frozenFixture?.realityWitness,
        consequenceProfile: (parsed.consequenceProfile as GovernanceConsequenceProfile | undefined) || frozenFixture?.consequenceProfile,
        downstreamAccountability: parsed.downstreamAccountability as GovernanceDownstreamAccountability | undefined,
        obligationWitness: (parsed.obligationWitness as GovernanceObligationWitness | undefined) || frozenFixture?.obligationWitness,
        stateProvenance: (parsed.stateProvenance as GovernanceStateProvenanceWitness | undefined) || frozenFixture?.stateProvenance,
        allowHarnessInference: frozenFixture ? false : parsed.allowHarnessInference
      })
    ]);

    const results: LaneResult[] = parsed.includeHarmonicOnly
      ? [raw, ...governed]
      : [raw, governed[1]];

    const payload: CompareResponse = {
      runtimeTarget: parsed.runtimeTarget,
      runtimeLabel: parsed.runtimeTarget === "v2" ? "Frozen V2 · 6a3a89f" : parsed.runtimeTarget === "v4" ? "Runtime 4.0 · Legacy" : "Runtime 4.1 · Primary",
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
