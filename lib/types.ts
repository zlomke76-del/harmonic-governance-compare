export type GovernanceContinuityFacts = {
  life_safety_context?: boolean | null;
  primary_authority_available?: boolean | null;
  emergency_continuity_defined?: boolean | null;
  explicit_emergency_activation?: boolean | null;
  emergency_authority_available?: boolean | null;
  emergency_authority?: string | null;
};


export type AuthorityActor = {
  id: string;
  name?: string;
  role?: string;
  institution?: string;
};

export type AuthorityHistoryEvent = {
  event_id: string;
  event_type: string;
  effective_at: string;
  actor: AuthorityActor;
  source_ref?: string;
  evidence_refs?: string[];
};

export type GovernanceAuthorityProvenance = {
  authority_history?: AuthorityHistoryEvent[];
  original_authority?: {
    actor: AuthorityActor;
    authority_source_type?: string;
    authority_source_ref?: string;
    delegation_ref?: string;
    scope?: string[];
    effective_at?: string;
    evidence_refs?: string[];
  };
  authority_change?: {
    change_type: string;
    changed_at: string;
    changed_by: AuthorityActor;
    change_source_ref?: string;
    reason?: string;
    evidence_refs?: string[];
  };
  current_authority?: {
    status: string;
    actor?: AuthorityActor;
    authority_source_ref?: string;
    scope?: string[];
    evidence_refs?: string[];
  };
};

export type GovernanceDownstreamAccountability = {
  enforcement_layer?: {
    system: string;
    component?: string;
    owner?: AuthorityActor;
    mode?: string;
    enforcement_witness_ref?: string;
  };
  next_decision_owner?: {
    actor: AuthorityActor;
    authority_ref?: string;
  };
  consequence_owner?: {
    actor: AuthorityActor;
    responsibility_ref?: string;
  };
};

export type RuntimeTarget = "v3" | "v2";

export type LaneName = "raw" | "harmonic" | "harmonic_governance";

export type GovernanceDecision = "ALLOW" | "CONSTRAIN" | "ESCALATE" | "EMERGENCY_CONTINUITY" | "BLOCK" | "UNKNOWN";

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
  runtimeTarget?: RuntimeTarget;
  runtimeLabel?: string;
  prompt: string;
  scenario: string;
  model: string;
  generatedAt: string;
  lanes: LaneResult[];
}
