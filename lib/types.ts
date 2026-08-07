export type GovernanceContinuityFacts = {
  life_safety_context?: boolean | null;
  primary_authority_available?: boolean | null;
  emergency_continuity_defined?: boolean | null;
  explicit_emergency_activation?: boolean | null;
  emergency_authority_available?: boolean | null;
  emergency_authority?: string | null;
};

export type LaneName = "raw" | "harmonic" | "harmonic_governance";

export type GovernanceDecision = "ALLOW" | "CONSTRAIN" | "ESCALATE" | "BLOCK" | "UNKNOWN";

export type PrimitiveAdmissibility = "PASS" | "FAIL" | "UNKNOWN";

export interface GovernanceSignal {
  code: string;
  severity: string;
  message: string;
  primitive?: string;
}

export interface PrimitiveResult {
  key: string;
  label: string;
  outcome: string;
  admissible: PrimitiveAdmissibility;
  action?: string;
  artifactHash?: string;
  failedPrimitives?: string[];
  signals: GovernanceSignal[];
  metadata: Array<{ label: string; value: string }>;
}

export interface GovernanceEvaluation {
  available: boolean;
  decision: GovernanceDecision;
  summary: string;
  flags: string[];
  primitiveResults?: PrimitiveResult[];
  raw?: unknown;
  error?: string;
}

export interface LaneResult {
  lane: LaneName;
  title: string;
  response: string;
  evaluation: GovernanceEvaluation;
  latencyMs: number;
}

export interface CompareResponse {
  prompt: string;
  scenario: string;
  model: string;
  generatedAt: string;
  lanes: LaneResult[];
}
