export type LaneName = "raw" | "harmonic" | "harmonic_governance";

export type GovernanceDecision = "ALLOW" | "CONSTRAIN" | "ESCALATE" | "BLOCK" | "UNKNOWN";

export interface GovernanceEvaluation {
  available: boolean;
  decision: GovernanceDecision;
  summary: string;
  flags: string[];
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
