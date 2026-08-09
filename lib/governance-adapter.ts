import type {
  GovernanceDecision,
  GovernanceEvaluation,
  GovernanceSignal,
  GovernanceAuthorityProvenance,
  GovernanceContinuityFacts,
  GovernanceDownstreamAccountability,
  RuntimeTarget,
  LaneName,
  PrimitiveAdmissibility,
  PrimitiveResult
} from "./types";

const DEFAULT_HARMONIC_API_URL = "https://www.solace-harmonic.com/api/evaluate";

function normalizeDecision(value: unknown): GovernanceDecision {
  const normalized = String(value || "").trim().toUpperCase();

  if (["ALLOW", "ALLOWED", "PASS", "PASSED", "APPROVE", "APPROVED", "CONTACT_CONFIRMED", "AUTHORITY_CONTINUOUS", "ADMISSIBLE", "PERMITTED", "EXECUTION_ALLOWED"].includes(normalized)) {
    return "ALLOW";
  }

  if (["CONSTRAIN", "CONSTRAINED", "LIMIT", "LIMITED", "CONDITIONALLY_ADMISSIBLE", "EXECUTION_CONSTRAINED"].includes(normalized)) {
    return "CONSTRAIN";
  }

  if (["ESCALATE", "ESCALATED", "REVIEW", "HUMAN_REVIEW", "REQUIRES_REVIEW", "ESCALATION_REQUIRED", "EXECUTION_ESCALATED"].includes(normalized)) {
    return "ESCALATE";
  }

  if (["EMERGENCY_CONTINUITY", "EMERGENCY_CONTINUITY_REQUIRED", "PENDING_EMERGENCY_CONTINUITY_ACTIVATION"].includes(normalized)) {
    return "EMERGENCY_CONTINUITY";
  }

  if (["BLOCK", "BLOCKED", "DENY", "DENIED", "REFUSE", "REFUSED", "FAIL", "FAILED", "INADMISSIBLE", "CONTACT_LOST", "BOUNDARY_CRITICAL"].includes(normalized)) {
    return "BLOCK";
  }

  return "UNKNOWN";
}

function getString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function getFlags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter(Boolean);
  }
  return [];
}

function firstPresent(...values: unknown[]): unknown {
  return values.find((value) => value !== undefined && value !== null && String(value).trim() !== "");
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function unifiedEndpoint(): { url?: string; key?: string } {
  return {
    // The unified comparison must always call the single customer-facing endpoint.
    // Do not fall back to the retired direct Governance Pack URL.
    url:
      process.env.HARMONIC_API_URL ||
      process.env.HARMONIC_ONLY_API_URL ||
      DEFAULT_HARMONIC_API_URL,

    // This harness demonstrates Harmonic + Harmonic+ in one transaction.
    // Prefer the governance-entitled credential so /api/evaluate can activate
    // the constitutional layer and persist its determination + receipt.
    key:
      process.env.HARMONIC_GOVERNANCE_API_KEY ||
      process.env.HARMONIC_API_KEY ||
      process.env.HARMONIC_ONLY_API_KEY
  };
}


function v2Endpoint(): { url?: string; key?: string } {
  const base = process.env.HARMONIC_V2_API_BASE_URL?.replace(/\/+$/, "");
  return {
    url: base ? `${base}/api/v2/evaluate` : undefined,
    key:
      process.env.HARMONIC_V2_API_KEY ||
      process.env.HARMONIC_GOVERNANCE_API_KEY ||
      process.env.HARMONIC_API_KEY ||
      process.env.HARMONIC_ONLY_API_KEY
  };
}

function buildV2EnterprisePacket(params: {
  prompt: string;
  response: string;
  scenario: string;
  governanceFacts?: GovernanceContinuityFacts;
  authorityProvenance?: GovernanceAuthorityProvenance;
  downstreamAccountability?: GovernanceDownstreamAccountability;
}) {
  const legacyPacket = buildGovernancePackPayload(params);
  const context = classifyExecutionContext(params);
  const packetId = String(legacyPacket.packet_id);

  return {
    packet_id: packetId,
    subject: {
      type: "institutional_execution_request",
      id: `subject:${packetId}`
    },
    action: {
      type: context.surface,
      description: params.prompt,
      consequence_level: context.consequenceLevel,
      scope: params.scenario
    },
    context: {
      domain: context.surface,
      workflow: params.scenario,
      consequence_level: context.consequenceLevel,
      potential_harms: [context.reason]
    },
    authority: {
      responsible_actor: "harmonic-governance-compare",
      basis: "Scenario-supplied institutional authority state",
      human_override_available: true
    },
    evidence: {
      claims: [params.prompt],
      observations: [{ statement: params.response }],
      items: [],
      unresolved_contradictions: []
    },
    dependencies: {},
    metadata: {
      source: "harmonic-governance-compare",
      scenario: params.scenario,
      runtime_target: "frozen-v2",
      legacy_packet: legacyPacket,
      explicit_non_claims: [
        "The harness does not assert that downstream execution occurred.",
        "The harness does not infer a real-world effect from a constitutional determination.",
        "The harness preserves the frozen V2 runtime response without substituting V3 semantics."
      ]
    }
  };
}

function endpointForLane(lane: LaneName): { url?: string; key?: string } {
  if (lane === "raw") return {};
  return unifiedEndpoint();
}

type ExecutionSurface =
  | "read_only"
  | "ai_continuation"
  | "communications"
  | "legal_filing"
  | "financial_execution"
  | "clinical_execution"
  | "industrial_control"
  | "physical_process_control"
  | "autonomous_navigation"
  | "cybersecurity_production_response"
  | "identity_authority"
  | "production_data_mutation";

type ExecutionContext = {
  surface: ExecutionSurface;
  consequenceLevel: "low" | "medium" | "high" | "critical";
  reversibility: "reversible" | "partially_reversible" | "difficult_to_reverse" | "irreversible";
  requiresOperatorReview: boolean;
  shouldBlockExecution: boolean;
  shouldEscalate: boolean;
  reason: string;
};

function textForClassification(params: { prompt?: string; response?: string; scenario?: string }): string {
  return `${params.scenario || ""}\n${params.prompt || ""}\n${params.response || ""}`.toLowerCase();
}

function classifyExecutionContext(params: { prompt?: string; response?: string; scenario?: string }): ExecutionContext {
  const value = textForClassification(params);

  const hasAny = (...terms: string[]) => terms.some((term) => value.includes(term));

  if (hasAny("wire transfer", "$250,000", "250,000", "bank account", "funds", "release the funds")) {
    return {
      surface: "financial_execution",
      consequenceLevel: "critical",
      reversibility: "difficult_to_reverse",
      requiresOperatorReview: true,
      shouldBlockExecution: hasAny("authority was revoked", "authority revoked", "approver's authority was revoked", "authority_lost"),
      shouldEscalate: true,
      reason: "High-value financial execution with authority-sensitive release conditions."
    };
  }

  if (hasAny("allergy", "medication", "dosage", "administer", "oxygen saturation", "shortness of breath", "discharge", "patient")) {
    return {
      surface: "clinical_execution",
      consequenceLevel: "critical",
      reversibility: "difficult_to_reverse",
      requiresOperatorReview: true,
      shouldBlockExecution: hasAny("wrong dosage", "contraindicated", "allergic reaction confirmed", "lethal", "fatal"),
      shouldEscalate: true,
      reason: "Clinical execution can affect patient safety and requires current evidence before continuation."
    };
  }

  if (hasAny("autonomous vehicle", "bridge closure", "route was approved", "navigation route", "reroute", "re-route", "road closure", "runway obstruction")) {
    return {
      surface: "autonomous_navigation",
      consequenceLevel: "critical",
      reversibility: "partially_reversible",
      requiresOperatorReview: true,
      shouldBlockExecution: hasAny("runway obstruction", "collision imminent", "human in path"),
      shouldEscalate: true,
      reason: "Autonomous mobility continuation depends on current environmental reality and route validity."
    };
  }

  if (hasAny("line speed", "vibration", "plc", "industrial automation", "production line", "robot", "work cell", "physical equipment", "bearing temperature", "transformer overheating", "electrical load", "substation", "grid controller")) {
    return {
      surface: "physical_process_control",
      consequenceLevel: "critical",
      reversibility: "partially_reversible",
      requiresOperatorReview: true,
      shouldBlockExecution: hasAny("human entered", "human unexpectedly enters", "unguarded", "emergency stop"),
      shouldEscalate: true,
      reason: "Physical process control can create equipment, safety, or operational harm under abnormal sensor conditions."
    };
  }

  if (hasAny("privileged role", "cached authorization token", "production access", "role was revoked", "privilege revoked", "grant production access")) {
    return {
      surface: "identity_authority",
      consequenceLevel: "critical",
      reversibility: "difficult_to_reverse",
      requiresOperatorReview: true,
      shouldBlockExecution: hasAny("role was revoked", "privileged role was revoked", "authority_lost"),
      shouldEscalate: true,
      reason: "Identity and privilege execution requires current authority at the moment access is granted."
    };
  }

  if (hasAny("zero-day", "critical exploit", "firewall rule rollout", "production rollout", "deployment")) {
    return {
      surface: "cybersecurity_production_response",
      consequenceLevel: "critical",
      reversibility: "partially_reversible",
      requiresOperatorReview: true,
      shouldBlockExecution: false,
      shouldEscalate: true,
      reason: "Production security deployment became authority- and consequence-sensitive after new exploit evidence emerged."
    };
  }

  if (hasAny("production server", "supports live customer payments", "isolate a production server", "incident response", "cybersecurity agent")) {
    return {
      surface: "cybersecurity_production_response",
      consequenceLevel: "critical",
      reversibility: "partially_reversible",
      requiresOperatorReview: true,
      shouldBlockExecution: false,
      shouldEscalate: true,
      reason: "Cybersecurity action on production payment infrastructure can create service and customer impact."
    };
  }

  if (hasAny("jurisdiction-specific filing rule", "legal filing", "submit the document", "filing rule changed", "approved template")) {
    return {
      surface: "legal_filing",
      consequenceLevel: "high",
      reversibility: "partially_reversible",
      requiresOperatorReview: true,
      shouldBlockExecution: false,
      shouldEscalate: false,
      reason: "Legal filing may remain possible only after validation against changed governing rules."
    };
  }

  if (hasAny("delete production database", "drop production", "production database")) {
    return {
      surface: "production_data_mutation",
      consequenceLevel: "critical",
      reversibility: "irreversible",
      requiresOperatorReview: true,
      shouldBlockExecution: true,
      shouldEscalate: true,
      reason: "Production data mutation can be irreversible and materially consequential."
    };
  }

  return {
    surface: "ai_continuation",
    consequenceLevel: hasAny("refund", "$12,000", "12,000") ? "high" : "medium",
    reversibility: hasAny("refund", "$12,000", "12,000") ? "partially_reversible" : "reversible",
    requiresOperatorReview: hasAny("fraud", "policy changed", "authority", "approval"),
    shouldBlockExecution: false,
    shouldEscalate: hasAny("fraud", "authority unclear"),
    reason: "General AI continuation with contextual consequence evaluation."
  };
}

function consequenceLevelForScenario(params: { prompt?: string; response?: string; scenario?: string }): "low" | "medium" | "high" | "critical" {
  return classifyExecutionContext(params).consequenceLevel;
}

function actionTypeForScenario(params: { prompt?: string; response?: string; scenario?: string }): string {
  return classifyExecutionContext(params).surface;
}

function decisionFromExecutionContext(context: ExecutionContext): GovernanceDecision {
  if (context.shouldBlockExecution) return "BLOCK";
  if (context.shouldEscalate) return "ESCALATE";
  if (context.requiresOperatorReview || context.consequenceLevel === "high") return "CONSTRAIN";
  return "ALLOW";
}

function mostRestrictiveDecision(...decisions: GovernanceDecision[]): GovernanceDecision {
  const rank: Record<GovernanceDecision, number> = {
    UNKNOWN: 0,
    ALLOW: 1,
    CONSTRAIN: 2,
    ESCALATE: 3,
    EMERGENCY_CONTINUITY: 4,
    BLOCK: 5
  };
  return decisions.reduce((current, next) => (rank[next] > rank[current] ? next : current), "UNKNOWN" as GovernanceDecision);
}

function decisionFromPrimitiveResults(primitives?: PrimitiveResult[]): GovernanceDecision {
  if (!primitives?.length) return "UNKNOWN";
  const byKey = Object.fromEntries(primitives.map((primitive) => [primitive.key, primitive]));
  const authority = byKey.authority_continuity;
  const consequence = byKey.consequence_boundary;
  const runtime = byKey.runtime_admissibility;

  const text = primitives.map((primitive) => `${primitive.outcome} ${primitive.action || ""} ${primitive.admissible}`).join(" ").toUpperCase();

  if (text.includes("AUTHORITY_LOST") || text.includes("INADMISSIBLE") || text.includes("SHOULD_BLOCK_EXECUTION")) {
    return "BLOCK";
  }

  if (text.includes("ESCALATION_REQUIRED") || text.includes("BOUNDARY_CRITICAL")) {
    return "ESCALATE";
  }

  if (text.includes("CONDITIONALLY_ADMISSIBLE") || text.includes("BOUNDARY_ELEVATED") || text.includes("REVALIDATION")) {
    return "CONSTRAIN";
  }

  if (authority?.admissible === "FAIL" || runtime?.admissible === "FAIL") return "BLOCK";
  if (consequence?.admissible === "FAIL") return "ESCALATE";
  if (consequence?.outcome.toUpperCase().includes("ELEVATED")) return "CONSTRAIN";

  return "ALLOW";
}

function decisionFromArtifact(json: Record<string, unknown>): GovernanceDecision {
  const executionBoundary = asRecord(json.execution_boundary);
  const responseBinding = asRecord(json.response_binding);

  // V68: The governed execution binding is the authoritative UI source of truth.
  // Do not allow primitive severity, package outcome, or local heuristics to upgrade
  // ESCALATE into BLOCK after the binding has already resolved the execution mode.
  const bindingDecision = normalizeDecision(
    firstPresent(
      responseBinding?.final_decision,
      responseBinding?.decision_label,
      responseBinding?.mode,
      responseBinding?.runtime_action,
      responseBinding?.execution_action
    )
  );

  if (bindingDecision !== "UNKNOWN") {
    return bindingDecision;
  }

  if (executionBoundary) {
    if (executionBoundary.requires_emergency_continuity === true) return "EMERGENCY_CONTINUITY";
    if (executionBoundary.should_block_execution === true) return "BLOCK";
    if (executionBoundary.requires_escalation === true) return "ESCALATE";
    if (executionBoundary.requires_constraint === true) return "CONSTRAIN";
    if (executionBoundary.should_execute === true) return "ALLOW";
  }

  return normalizeDecision(
    firstPresent(
      json.final_decision,
      json.decision_label,
      executionBoundary?.final_decision,
      executionBoundary?.decision_label,
      executionBoundary?.action,
      executionBoundary?.mode,
      json.decision,
      json.recommended_action,
      json.recommendation,
      json.package_outcome,
      json.status,
      json.result,
      json.outcome,
      asRecord(json.runtime_admissibility)?.action
    )
  );
}

function primitiveLabel(key: string): string {
  const labels: Record<string, string> = {
    reality_contact: "Reality Contact",
    authority_continuity: "Authority Continuity",
    consequence_boundary: "Consequence Boundary",
    runtime_admissibility: "Runtime Admissibility"
  };
  return labels[key] || key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeAdmissible(value: unknown): PrimitiveAdmissibility {
  if (value === true) return "PASS";
  if (value === false) return "FAIL";
  return "UNKNOWN";
}

function normalizeSignals(value: unknown): GovernanceSignal[] {
  const signals: GovernanceSignal[] = [];

  for (const item of asArray(value)) {
    const signal = asRecord(item);
    if (!signal) continue;

    signals.push({
      primitive: typeof signal.primitive === "string" ? signal.primitive : undefined,
      code: getString(signal.code, "signal"),
      severity: getString(signal.severity, "info"),
      message: getString(signal.message, JSON.stringify(signal))
    });
  }

  return signals;
}

function metadataFromPrimitive(key: string, primitive: Record<string, unknown>): Array<{ label: string; value: string }> {
  const rows: Array<{ label: string; value: string }> = [];

  const add = (label: string, value: unknown) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      rows.push({ label, value: String(value) });
    }
  };

  add("Service", primitive.service);
  add("Version", primitive.version);
  add("Packet", primitive.packet_id);

  if (key === "consequence_boundary") {
    const topology = asRecord(primitive.consequence_topology);
    add("Intensity", primitive.governance_intensity);
    add("Score", primitive.consequence_score);
    add("Level", topology?.level);
    add("Surface", topology?.execution_surface);
    add("Reversibility", topology?.reversibility);
  }

  if (key === "runtime_admissibility") {
    add("Action", primitive.action);
    const failed = asArray(primitive.failed_primitives).map(String).join(", ");
    add("Failed primitives", failed);
  }

  return rows;
}

function parsePrimitiveResults(json: Record<string, unknown>): PrimitiveResult[] | undefined {
  const primitiveSource = asRecord(firstPresent(json.primitive_results, json.primitives, json.results));
  if (!primitiveSource) return undefined;

  const orderedKeys = ["reality_contact", "authority_continuity", "consequence_boundary", "runtime_admissibility"];
  const keys = [
    ...orderedKeys.filter((key) => primitiveSource[key]),
    ...Object.keys(primitiveSource).filter((key) => !orderedKeys.includes(key))
  ];

  const parsed: PrimitiveResult[] = [];

  for (const key of keys) {
    const primitive = asRecord(primitiveSource[key]);
    if (!primitive) continue;

    const boundarySignals = normalizeSignals(primitive.boundary_signals);
    const driftSignals = normalizeSignals(primitive.drift_signals);
    const authoritySignals = normalizeSignals(primitive.authority_signals);
    const admissibilitySignals = normalizeSignals(primitive.admissibility_signals);

    const result: PrimitiveResult = {
      key,
      label: primitiveLabel(key),
      outcome: getString(primitive.outcome, "UNKNOWN"),
      admissible: normalizeAdmissible(primitive.admissible),
      signals: [...driftSignals, ...authoritySignals, ...boundarySignals, ...admissibilitySignals],
      metadata: metadataFromPrimitive(key, primitive)
    };

    if (typeof primitive.action === "string") {
      result.action = primitive.action;
    }

    if (typeof primitive.artifact_hash === "string") {
      result.artifactHash = primitive.artifact_hash;
    }

    const failedPrimitives = asArray(primitive.failed_primitives).map(String);
    if (failedPrimitives.length) {
      result.failedPrimitives = failedPrimitives;
    }

    parsed.push(result);
  }

  return parsed.length ? parsed : undefined;
}

function buildHarmonicOnlyPayload(params: { prompt: string; response: string; scenario: string }) {
  const context = classifyExecutionContext(params);
  return {
    response: params.response,
    prompt: params.prompt,
    scenario: params.scenario,
    consequence_level: context.consequenceLevel === "critical" ? "high" : context.consequenceLevel,
    execution_surface: context.surface,
    execution_context: context,
    suggested_decision: decisionFromExecutionContext(context)
  };
}


function deriveContinuityHints(prompt: string) {
  const text = prompt.toLowerCase();

  const lifeSafetyContext =
    /\b(emergency|life[- ]?safety|life threatening|life-threatening|risk to human life|human life|resuscitation|stabilization)\b/.test(text);

  const primaryAuthorityUnavailable =
    /\bprimary\s+(?:authorized\s+)?(?:authority|operator|decision owner|approver|physician|surgeon)\b[\s\S]{0,80}\b(unavailable|unreachable|not reachable|cannot be reached|absent|offline)\b/.test(text)
    || /\b(unavailable|unreachable|not reachable|cannot be reached|absent|offline)\b[\s\S]{0,80}\bprimary\s+(?:authorized\s+)?(?:authority|operator|decision owner|approver|physician|surgeon)\b/.test(text);

  const emergencyContinuityDefined =
    /\b(?:formally\s+)?defined\s+emergency[- ]continuity\s+(?:authority|protocol|path)\s+exists\b/.test(text)
    || /\bemergency[- ]continuity\s+(?:authority|protocol|path)\s+(?:exists|is defined)\b/.test(text);

  const explicitEmergencyActivation =
    /\bemergency[- ]continuity\s+(?:is\s+)?explicitly\s+activated\b/.test(text)
    || /\bemergency[- ]continuity\s+(?:activation\s+)?conditions?\s+(?:are\s+)?satisfied\b/.test(text)
    || /\bemergency\s+activation\s+conditions?\s+(?:are\s+)?satisfied\b/.test(text);

  const emergencyAuthorityAvailable =
    /\b(?:designated\s+)?emergency[- ]continuity\s+authority\b[\s\S]{0,80}\bavailable\b/.test(text)
    || /\bdesignated\s+emergency\s+authority\b[\s\S]{0,80}\bavailable\b/.test(text);

  if (!lifeSafetyContext && !primaryAuthorityUnavailable && !emergencyContinuityDefined && !explicitEmergencyActivation && !emergencyAuthorityAvailable) {
    return undefined;
  }

  return {
    life_safety_context: lifeSafetyContext,
    primary_authority_available: primaryAuthorityUnavailable ? false : null,
    emergency_continuity_defined: emergencyContinuityDefined,
    explicit_emergency_activation: explicitEmergencyActivation,
    emergency_authority_available: emergencyAuthorityAvailable,
    emergency_authority: emergencyAuthorityAvailable ? "designated emergency authority" : null
  };
}

function buildGovernancePackPayload(params: {
  prompt: string;
  response: string;
  scenario: string;
  governanceFacts?: GovernanceContinuityFacts;
  authorityProvenance?: GovernanceAuthorityProvenance;
  downstreamAccountability?: GovernanceDownstreamAccountability;
  outboundContinuity?: ReturnType<typeof deriveContinuityHints>;
}) {
  const now = new Date().toISOString();
  const context = classifyExecutionContext(params);
  const consequenceLevel = context.consequenceLevel;
  const actionType = context.surface;

  return {
    packet_id: `${params.scenario}-${crypto.randomUUID()}`,

    // Preserve the operator-authored execution scenario as first-class
    // governance input. The constitutional runtime must see the scenario
    // itself, not only the LLM response and fields inferred by this harness.
    prompt: params.prompt,
    scenario_prompt: params.prompt,
    scenario_label: params.scenario,

    continuity: params.governanceFacts
      ? {
          life_safety_context: params.governanceFacts.life_safety_context ?? null,
          primary_authority_available: params.governanceFacts.primary_authority_available ?? null,
          emergency_continuity_defined: params.governanceFacts.emergency_continuity_defined ?? null,
          explicit_emergency_activation: params.governanceFacts.explicit_emergency_activation ?? null,
          emergency_authority_available: params.governanceFacts.emergency_authority_available ?? null,
          emergency_authority: params.governanceFacts.emergency_authority ?? null
        }
      : deriveContinuityHints(params.prompt),

    requested_action: {
      type: actionType,
      scope: [params.scenario]
    },
    declared_reality: {
      current_state_claims: [params.prompt],
      last_verified_at: now
    },
    observed_reality: {
      signals: [
        {
          statement: params.response
        }
      ]
    },
    authority_chain: {
      subject: "llm-agent-1",
      issuer: "harmonic-governance-compare",
      scope: [params.scenario],
      last_verified_at: now,
      chain: [
        { actor: "llm-agent-1", status: "active" },
        { actor: "harmonic-governance-compare", status: "active" }
      ]
    },
    ...(params.authorityProvenance ? { authority_provenance: params.authorityProvenance } : {}),
    ...(params.downstreamAccountability ? { downstream_accountability: params.downstreamAccountability } : {}),
    revocation_state: {
      last_revocation_check_at: now
    },
    consequence_profile: {
      level: consequenceLevel,
      reversibility: context.reversibility,
      execution_surface: actionType,
      execution_surface_reason: context.reason,
      requires_operator_review: context.requiresOperatorReview,
      should_block_execution: context.shouldBlockExecution,
      should_escalate: context.shouldEscalate
    },
    safeguards: {
      operator_review_confirmed: false,
      execution_surface_classifier: context
    }
  };
}

function buildPayload(params: {
  lane: LaneName;
  prompt: string;
  response: string;
  scenario: string;
  governanceFacts?: GovernanceContinuityFacts;
  authorityProvenance?: GovernanceAuthorityProvenance;
  downstreamAccountability?: GovernanceDownstreamAccountability;
}) {
  if (params.lane === "harmonic") {
    return buildHarmonicOnlyPayload(params);
  }

  if (params.lane === "harmonic_governance") {
    return buildGovernancePackPayload(params);
  }

  return {};
}

function summarizeResponse(json: Record<string, unknown>, fallback: string): string {
  const base = getString(
    firstPresent(json.summary, json.reason, json.explanation, json.rationale, json.message),
    fallback
  );

  const primitiveResults = parsePrimitiveResults(json);
  if (!primitiveResults?.length) return base;

  const failed = primitiveResults.filter((item) => item.admissible === "FAIL").map((item) => item.label);
  const passed = primitiveResults.filter((item) => item.admissible === "PASS").map((item) => item.label);

  const pieces = [base];
  if (failed.length) pieces.push(`Failed: ${failed.join(", ")}.`);
  if (passed.length) pieces.push(`Passed: ${passed.join(", ")}.`);
  return pieces.join(" ");
}

function asGovernanceContinuityFacts(value: unknown): GovernanceContinuityFacts {
  const record = asRecord(value) || {};
  const boolOrNull = (v: unknown): boolean | null | undefined =>
    typeof v === "boolean" ? v : v === null ? null : undefined;
  const stringOrNull = (v: unknown): string | null | undefined =>
    typeof v === "string" ? v : v === null ? null : undefined;

  return {
    life_safety_context: boolOrNull(record.life_safety_context),
    primary_authority_available: boolOrNull(record.primary_authority_available),
    emergency_continuity_defined: boolOrNull(record.emergency_continuity_defined),
    explicit_emergency_activation: boolOrNull(record.explicit_emergency_activation),
    emergency_authority_available: boolOrNull(record.emergency_authority_available),
    emergency_authority: stringOrNull(record.emergency_authority)
  };
}

function buildGovernanceRequestWitness(payload: unknown) {
  const packet = asRecord(payload) || {};
  const continuity = asRecord(packet.continuity) || {};
  const authorityProvenance = asRecord(packet.authority_provenance);
  const downstreamAccountability = asRecord(packet.downstream_accountability);

  return {
    adapter_build: "v3-authority-history-witness-2026-08-08",
    packet_id: typeof packet.packet_id === "string" ? packet.packet_id : null,
    prompt_present: typeof packet.prompt === "string" && packet.prompt.trim().length > 0,
    scenario_prompt_present: typeof packet.scenario_prompt === "string" && packet.scenario_prompt.trim().length > 0,
    scenario_label: typeof packet.scenario_label === "string" ? packet.scenario_label : null,
    authority_provenance: {
      supplied: Boolean(authorityProvenance),
      authority_history_event_count: Array.isArray(authorityProvenance?.authority_history) ? authorityProvenance.authority_history.length : 0,
      original_authority_supplied: Boolean(asRecord(authorityProvenance?.original_authority)),
      authority_change_supplied: Boolean(asRecord(authorityProvenance?.authority_change)),
      current_authority_supplied: Boolean(asRecord(authorityProvenance?.current_authority))
    },
    downstream_accountability: {
      supplied: Boolean(downstreamAccountability),
      enforcement_layer_supplied: Boolean(asRecord(downstreamAccountability?.enforcement_layer)),
      next_decision_owner_supplied: Boolean(asRecord(downstreamAccountability?.next_decision_owner)),
      consequence_owner_supplied: Boolean(asRecord(downstreamAccountability?.consequence_owner))
    },
    continuity: {
      life_safety_context: continuity.life_safety_context ?? null,
      primary_authority_available: continuity.primary_authority_available ?? null,
      emergency_continuity_defined: continuity.emergency_continuity_defined ?? null,
      explicit_emergency_activation: continuity.explicit_emergency_activation ?? null,
      emergency_authority_available: continuity.emergency_authority_available ?? null,
      emergency_authority: continuity.emergency_authority ?? null
    }
  };
}


async function callV2EvidenceEndpoint(path: string, key: string, body?: unknown, method = "POST") {
  const base = (process.env.HARMONIC_V2_API_BASE_URL || "https://www.solace-harmonic.com").replace(/\/+$/, "");
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      "X-Harmonic-Harness-Build": "v2.3-emergency-evidence-chain-validation-2026-08-07"
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await res.text();
  let json: Record<string, unknown> = {};
  try { json = text ? JSON.parse(text) as Record<string, unknown> : {}; }
  catch { json = { raw_text: text }; }
  if (!res.ok) throw new Error(`V2 evidence endpoint ${path} returned HTTP ${res.status}: ${text}`);
  return json;
}

function idFrom(value: unknown, ...keys: string[]): string | null {
  const record = asRecord(value);
  if (!record) return null;
  for (const key of keys) {
    const candidate = record[key];
    if (typeof candidate === "string" && candidate) return candidate;
  }
  return null;
}

async function validateEmergencyEvidenceChain(params: {
  packetId: string;
  governanceArtifact: Record<string, unknown>;
  key: string;
  prompt: string;
  scenario: string;
  governanceFacts?: GovernanceContinuityFacts;
  authorityProvenance?: GovernanceAuthorityProvenance;
  downstreamAccountability?: GovernanceDownstreamAccountability;
  outboundContinuity?: GovernanceContinuityFacts;
}) {
  const enabled = process.env.HARMONIC_V2_EVIDENCE_CHAIN_VALIDATION === "true";
  if (!enabled) return { enabled: false, status: "not_requested" };

  // Use the exact structured continuity object that was transmitted to Governance Pack.
  // This is captured before the determination and therefore cannot be contaminated by the result.
  // UI fixture facts remain the preferred source; the outbound request witness is the authoritative fallback
  // for custom scenarios that were deterministically structured by the adapter.
  const facts: GovernanceContinuityFacts = params.governanceFacts || params.outboundContinuity || {};
  const finalDecision = getString(
    firstPresent(
      asRecord(params.governanceArtifact.response_binding)?.final_decision,
      params.governanceArtifact.outcome,
      params.governanceArtifact.action
    ),
    "EMERGENCY_CONTINUITY"
  );

  // Construct the V2 enterprise packet from the same frozen fixture facts.
  // Do not infer or add favorable facts from the returned determination.
  const enterprisePacket = {
    packet_id: params.packetId,
    subject: {
      type: "institutional_execution_request",
      id: `subject:${params.packetId}`
    },
    action: {
      type: "emergency_continuity_execution",
      description: params.prompt,
      consequence_level: "high",
      scope: "Frozen emergency-continuity validation fixture"
    },
    context: {
      domain: "life_safety",
      workflow: "emergency_continuity_validation",
      consequence_level: "high",
      potential_harms: ["Material increase in immediate risk to human life if execution is improperly delayed or improperly authorized."]
    },
    authority: {
      responsible_actor: facts.emergency_authority || "designated emergency continuity authority",
      primary_authority_available: facts.primary_authority_available ?? null,
      emergency_continuity_defined: facts.emergency_continuity_defined ?? null,
      explicit_emergency_activation: facts.explicit_emergency_activation ?? null,
      emergency_authority_available: facts.emergency_authority_available ?? null,
      basis: "Frozen emergency-continuity fixture facts supplied before determination",
      human_override_available: true
    },
    evidence: {
      claims: [],
      observations: [],
      items: [],
      unresolved_contradictions: []
    },
    dependencies: {},
    metadata: {
      source: "harmonic-governance-compare",
      scenario: params.scenario,
      validation_mode: "emergency_continuity_evidence_chain",
      structured_fact_source: params.governanceFacts ? "frozen_fixture" : "governance_pack_outbound_witness",
      expected_governance_pack_decision: finalDecision,
      explicit_non_claims: [
        "The harness does not assert that execution occurred.",
        "The harness does not fabricate an execution-attempt witness or outcome witness.",
        "The V2 persistence call is a separate constitutional evaluation of the frozen fixture, not a mutation of the prior Governance Pack artifact."
      ],
      legacy_packet: {
        continuity: {
          life_safety_context: facts.life_safety_context ?? null,
          primary_authority_available: facts.primary_authority_available ?? null,
          emergency_continuity_defined: facts.emergency_continuity_defined ?? null,
          explicit_emergency_activation: facts.explicit_emergency_activation ?? null,
          emergency_authority_available: facts.emergency_authority_available ?? null,
          emergency_authority: facts.emergency_authority ?? null
        },
        scenario_prompt: params.prompt,
        prompt: params.prompt
      }
    }
  };

  const evaluation = await callV2EvidenceEndpoint("/api/v2/evaluate", params.key, enterprisePacket);

  const constitutionalDetermination =
    asRecord(evaluation.constitutional_determination) || asRecord(evaluation.determination);
  const receipt = asRecord(evaluation.constitutional_receipt) || asRecord(evaluation.receipt);
  const evidence = asRecord(evaluation.evidence);
  const runtimeSnapshot = asRecord(evidence?.runtime_input_snapshot);

  const snapshotId = idFrom(runtimeSnapshot, "id", "snapshot_id");
  const determinationId = idFrom(constitutionalDetermination, "determination_id", "id");
  const receiptId = idFrom(receipt, "receipt_id", "id");

  if (!snapshotId || !determinationId || !receiptId) {
    return {
      enabled: true,
      status: "persistence_incomplete",
      snapshot_id: snapshotId,
      determination_id: determinationId,
      receipt_id: receiptId,
      enterprise_packet: enterprisePacket,
      evaluate: evaluation
    };
  }

  // Replay API takes receipt_id as a query parameter. No execution evidence is fabricated.
  const replay = await callV2EvidenceEndpoint(
    `/api/v2/replay?receipt_id=${encodeURIComponent(receiptId)}`,
    params.key,
    {}
  );
  const replayRecord = asRecord(replay.replay_record);
  const replayStatus = getString(replayRecord?.status, "unknown");

  return {
    enabled: true,
    status: replayStatus === "pending_execution_evidence"
      ? "awaiting_external_execution_evidence"
      : `replay_${replayStatus}`,
    snapshot_id: snapshotId,
    determination_id: determinationId,
    receipt_id: receiptId,
    replay_status: replayStatus,
    missing_requirements: replayRecord?.missing_requirements || [],
    enterprise_packet_witness: enterprisePacket,
    replay
  };
}


function evaluationFromUnifiedArtifact(params: {
  lane: "harmonic" | "harmonic_governance";
  unified: Record<string, unknown>;
  prompt: string;
  response: string;
  scenario: string;
  requestWitness: ReturnType<typeof buildGovernanceRequestWitness>;
}): GovernanceEvaluation {
  const layer =
    params.lane === "harmonic"
      ? (asRecord(params.unified.harmonic) || {})
      : (asRecord(params.unified.governance) || {});

  const primitiveResults =
    params.lane === "harmonic_governance"
      ? parsePrimitiveResults(layer)
      : undefined;

  const artifactDecision = decisionFromArtifact(layer);
  const decision =
    params.lane === "harmonic_governance" && artifactDecision !== "UNKNOWN"
      ? artifactDecision
      : mostRestrictiveDecision(
          artifactDecision,
          decisionFromPrimitiveResults(primitiveResults),
          params.lane === "harmonic_governance"
            ? decisionFromExecutionContext(classifyExecutionContext(params))
            : "UNKNOWN"
        );

  const assurance = asRecord(params.unified.assurance);
  return {
    available: true,
    decision,
    summary: summarizeResponse(
      layer,
      params.lane === "harmonic"
        ? "Harmonic stabilization result from the unified transaction."
        : "Harmonic+ constitutional result from the unified transaction."
    ),
    flags: getFlags(
      firstPresent(layer.flags, layer.warnings, layer.findings, layer.issues, layer.violations)
    ),
    primitiveResults,
    raw: {
      ...layer,
      unified_transaction: {
        api_version: params.unified.api_version || assurance?.api_version || null,
        packet_id: params.unified.packet_id || null,
        evidence_bearing: assurance?.evidence_bearing ?? false,
        determination_id: assurance?.determination_id || null,
        determination_hash: assurance?.determination_hash || null,
        receipt_id: assurance?.receipt_id || null,
        receipt_hash: assurance?.receipt_hash || null
      },
      harness_request_witness: params.requestWitness
    }
  };
}


function evaluationFromV2Artifact(params: {
  lane: "harmonic" | "harmonic_governance";
  artifact: Record<string, unknown>;
  prompt: string;
  response: string;
  scenario: string;
  requestWitness: ReturnType<typeof buildGovernanceRequestWitness>;
}): GovernanceEvaluation {
  const pipeline = asRecord(params.artifact.pipeline) || {};
  const layer =
    params.lane === "harmonic"
      ? (asRecord(pipeline.harmonic) || {})
      : (asRecord(params.artifact.determination) || asRecord(pipeline.governance) || {});

  const primitiveResults =
    params.lane === "harmonic_governance"
      ? parsePrimitiveResults(layer)
      : undefined;

  const artifactDecision = decisionFromArtifact(layer);
  const decision =
    params.lane === "harmonic_governance" && artifactDecision !== "UNKNOWN"
      ? artifactDecision
      : mostRestrictiveDecision(
          artifactDecision,
          decisionFromPrimitiveResults(primitiveResults),
          params.lane === "harmonic_governance"
            ? decisionFromExecutionContext(classifyExecutionContext(params))
            : "UNKNOWN"
        );

  const constitutionalDetermination = asRecord(params.artifact.constitutional_determination);
  const constitutionalReceipt = asRecord(params.artifact.constitutional_receipt);
  const evidence = asRecord(params.artifact.evidence);

  return {
    available: true,
    decision,
    summary: summarizeResponse(
      layer,
      params.lane === "harmonic"
        ? "Frozen V2 Harmonic stabilization result."
        : "Frozen V2 constitutional determination."
    ),
    flags: getFlags(firstPresent(layer.flags, layer.warnings, layer.findings, layer.issues, layer.violations)),
    primitiveResults,
    raw: {
      ...layer,
      frozen_v2_transaction: {
        api_version: params.artifact.api_version || "v2",
        runtime_version: params.artifact.runtime_version || null,
        request_id: params.artifact.request_id || null,
        trace_id: params.artifact.trace_id || null,
        packet_id: layer.packet_id || pipeline.packet_id || null,
        determination_id: constitutionalDetermination?.determination_id || null,
        determination_hash: constitutionalDetermination?.determination_hash || null,
        receipt_id: constitutionalReceipt?.receipt_id || null,
        receipt_hash: constitutionalReceipt?.receipt_hash || null,
        evidence: evidence || null
      },
      harness_request_witness: params.requestWitness
    }
  };
}

async function evaluateFrozenV2(params: {
  prompt: string;
  response: string;
  scenario: string;
  governanceFacts?: GovernanceContinuityFacts;
  authorityProvenance?: GovernanceAuthorityProvenance;
  downstreamAccountability?: GovernanceDownstreamAccountability;
}): Promise<{ harmonic: GovernanceEvaluation; harmonic_governance: GovernanceEvaluation }> {
  const { url, key } = v2Endpoint();
  if (!url || !key) {
    const unavailable: GovernanceEvaluation = {
      available: false,
      decision: "UNKNOWN",
      summary: "Frozen V2 is selected but HARMONIC_V2_API_BASE_URL or an API key is not configured.",
      flags: ["v2-endpoint-not-configured"]
    };
    return { harmonic: unavailable, harmonic_governance: unavailable };
  }

  const legacyPacket = buildGovernancePackPayload(params);
  const requestWitness = buildGovernanceRequestWitness(legacyPacket);
  const enterprisePacket = buildV2EnterprisePacket(params);

  const bypassSecret = process.env.HARMONIC_V2_VERCEL_BYPASS_SECRET?.trim();

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      "X-Harmonic-Harness-Build": "frozen-v2-selector-2026-08-09",
      ...(bypassSecret
        ? {
            "x-vercel-protection-bypass": bypassSecret,
            "x-vercel-set-bypass-cookie": "true"
          }
        : {})
    },
    body: JSON.stringify({ packet: enterprisePacket })
  });

  const text = await res.text();
  let json: Record<string, unknown> = {};
  try { json = text ? (JSON.parse(text) as Record<string, unknown>) : {}; }
  catch { json = { raw_text: text }; }

  if (!res.ok) {
    const message = `Frozen V2 API returned HTTP ${res.status}.`;
    if (process.env.STRICT_GOVERNANCE_API === "true") throw new Error(`${message} ${text}`);
    const failed: GovernanceEvaluation = {
      available: false,
      decision: "UNKNOWN",
      summary: message,
      flags: ["v2-api-error"],
      raw: json
    };
    return { harmonic: failed, harmonic_governance: failed };
  }

  if (String(json.api_version || "").toLowerCase() !== "v2") {
    throw new Error(`Frozen V2 target returned unexpected api_version: ${String(json.api_version || "missing")}`);
  }

  return {
    harmonic: evaluationFromV2Artifact({
      lane: "harmonic", artifact: json, prompt: params.prompt, response: params.response,
      scenario: params.scenario, requestWitness
    }),
    harmonic_governance: evaluationFromV2Artifact({
      lane: "harmonic_governance", artifact: json, prompt: params.prompt, response: params.response,
      scenario: params.scenario, requestWitness
    })
  };
}

export async function evaluateUnifiedGovernance(params: {
  runtimeTarget?: RuntimeTarget;
  prompt: string;
  response: string;
  scenario: string;
  governanceFacts?: GovernanceContinuityFacts;
  authorityProvenance?: GovernanceAuthorityProvenance;
  downstreamAccountability?: GovernanceDownstreamAccountability;
}): Promise<{ harmonic: GovernanceEvaluation; harmonic_governance: GovernanceEvaluation }> {
  if (params.runtimeTarget === "v2") return evaluateFrozenV2(params);

  const { url, key } = unifiedEndpoint();
  if (!url || !key) {
    const unavailable: GovernanceEvaluation = {
      available: false,
      decision: "UNKNOWN",
      summary: "No unified Harmonic API key configured. Prompt-level constraints were still applied.",
      flags: ["endpoint-not-configured"]
    };
    return { harmonic: unavailable, harmonic_governance: unavailable };
  }

  const outboundPayload = buildGovernancePackPayload(params);
  const requestWitness = buildGovernanceRequestWitness(outboundPayload);

  if (
    requestWitness.continuity.life_safety_context === true &&
    /emergency[- ]continuity/i.test(params.prompt)
  ) {
    const continuity = requestWitness.continuity;
    if (
      continuity.primary_authority_available !== false ||
      continuity.emergency_continuity_defined !== true ||
      continuity.explicit_emergency_activation !== true
    ) {
      throw new Error("Emergency continuity scenario was not converted into the required structured governance state.");
    }
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      "X-Harmonic-Harness-Build": "v3.5-unified-single-call-2026-08-08"
    },
    body: JSON.stringify(outboundPayload)
  });

  const text = await res.text();
  let json: Record<string, unknown> = {};
  try { json = text ? (JSON.parse(text) as Record<string, unknown>) : {}; }
  catch { json = { raw_text: text }; }

  if (!res.ok) {
    const message = `Unified Harmonic API returned HTTP ${res.status}.`;
    if (process.env.STRICT_GOVERNANCE_API === "true") throw new Error(`${message} ${text}`);
    const failed: GovernanceEvaluation = {
      available: false, decision: "UNKNOWN", summary: message, flags: ["api-error"], raw: json
    };
    return { harmonic: failed, harmonic_governance: failed };
  }

  return {
    harmonic: evaluationFromUnifiedArtifact({
      lane: "harmonic", unified: json, prompt: params.prompt, response: params.response,
      scenario: params.scenario, requestWitness
    }),
    harmonic_governance: evaluationFromUnifiedArtifact({
      lane: "harmonic_governance", unified: json, prompt: params.prompt, response: params.response,
      scenario: params.scenario, requestWitness
    })
  };
}

export async function evaluateGovernance(params: {
  lane: LaneName;
  prompt: string;
  response: string;
  scenario: string;
  governanceFacts?: GovernanceContinuityFacts;
  authorityProvenance?: GovernanceAuthorityProvenance;
  downstreamAccountability?: GovernanceDownstreamAccountability;
}): Promise<GovernanceEvaluation> {
  if (params.lane === "raw") {
    return {
      available: true,
      decision: "UNKNOWN",
      summary: "Raw lane intentionally has no external governance evaluation.",
      flags: ["no-governance"]
    };
  }

  const { url, key } = endpointForLane(params.lane);

  if (!url || !key) {
    return {
      available: false,
      decision: "UNKNOWN",
      summary: "No Harmonic API key configured for this lane. Prompt-level constraints were still applied.",
      flags: ["endpoint-not-configured"]
    };
  }

  try {
    const outboundPayload = buildPayload(params);
    const requestWitness = buildGovernanceRequestWitness(outboundPayload);

    if (
      params.lane === "harmonic_governance" &&
      requestWitness.continuity.life_safety_context === true &&
      /emergency[- ]continuity/i.test(params.prompt)
    ) {
      const continuity = requestWitness.continuity;
      if (
        continuity.primary_authority_available !== false ||
        continuity.emergency_continuity_defined !== true ||
        continuity.explicit_emergency_activation !== true
      ) {
        throw new Error("Emergency continuity scenario was not converted into the required structured governance state.");
      }
    }

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
        "X-Harmonic-Harness-Build": "v3-authority-history-witness-2026-08-08"
      },
      body: JSON.stringify(outboundPayload)
    });

    const text = await res.text();
    let json: Record<string, unknown> = {};
    try {
      json = text ? (JSON.parse(text) as Record<string, unknown>) : {};
    } catch {
      json = { raw_text: text };
    }

    if (!res.ok) {
      const message = `Harmonic API returned HTTP ${res.status}.`;
      if (process.env.STRICT_GOVERNANCE_API === "true") {
        throw new Error(`${message} ${text}`);
      }
      return {
        available: false,
        decision: "UNKNOWN",
        summary: message,
        flags: ["api-error"],
        raw: json
      };
    }

    const primitiveResults = parsePrimitiveResults(json);
    const artifactDecision = decisionFromArtifact(json);
    const decision =
      params.lane === "harmonic_governance" && artifactDecision !== "UNKNOWN"
        ? artifactDecision
        : mostRestrictiveDecision(
            artifactDecision,
            decisionFromPrimitiveResults(primitiveResults),
            params.lane === "harmonic_governance" ? decisionFromExecutionContext(classifyExecutionContext(params)) : "UNKNOWN"
          );

    const evidenceChain =
      params.lane === "harmonic_governance" &&
      String(firstPresent(
        asRecord(json.response_binding)?.final_decision,
        json.outcome,
        json.action
      ) || "").toUpperCase().includes("EMERGENCY_CONTINUITY")
        ? await validateEmergencyEvidenceChain({
            packetId: getString(json.packet_id, getString((outboundPayload as Record<string, unknown>).packet_id, "unknown-packet")),
            governanceArtifact: json,
            key,
            prompt: params.prompt,
            scenario: params.scenario,
            governanceFacts: params.governanceFacts,
            outboundContinuity: asGovernanceContinuityFacts(requestWitness.continuity)
          })
        : { enabled: false, status: "not_applicable" };

    return {
      available: true,
      decision,
      summary: summarizeResponse(
        json,
        params.lane === "harmonic"
          ? "External Harmonic evaluation completed."
          : "External Governance Pack evaluation completed."
      ),
      flags: getFlags(
        firstPresent(json.flags, json.warnings, json.findings, json.issues, json.violations)
      ),
      primitiveResults,
      raw: {
        ...json,
        harness_request_witness: requestWitness,
        v2_evidence_chain_validation: evidenceChain
      }
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown governance adapter error.";
    if (process.env.STRICT_GOVERNANCE_API === "true") {
      throw err;
    }
    return {
      available: false,
      decision: "UNKNOWN",
      summary: "External Harmonic governance evaluation failed. Prompt-level constraints were still applied.",
      flags: ["adapter-error"],
      error: message
    };
  }
}
