import type {
  GovernanceDecision,
  GovernanceEvaluation,
  GovernanceSignal,
  GovernanceAuthorityProvenance,
  GovernanceContinuityFacts,
  GovernanceDownstreamAccountability,
  GovernanceRequestedAction,
  GovernanceObligationWitness,
  GovernanceStateProvenanceWitness,
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
    harness_methodology: {
      mode: "exploratory_natural_language",
      classifier_role: "transport_annotation_only",
      disposition_authority: "harmonic",
      non_claim: "Harness classification is not a governance determination."
    }
  };
}



type SyntheticFixtureWitness = {
  requestedAction?: GovernanceRequestedAction;
  authorityProvenance?: GovernanceAuthorityProvenance;
  stateProvenance?: GovernanceStateProvenanceWitness;
  fixtureSource: string;
  translatedFields: string[];
};

function deriveSyntheticFixtureWitness(prompt: string, scenario: string): SyntheticFixtureWitness | undefined {
  const original = String(prompt || "").trim();
  if (!original) return undefined;

  // Bounded synthetic-fixture translation only. This does not infer external truth.
  // It preserves facts explicitly stipulated by the operator-authored test prompt
  // as examiner-supplied fixture state so the runtime receives the same H / ΔN / A
  // object that the synthetic test asks it to evaluate. Explicit structured witnesses
  // supplied by the operator always take precedence over this translation.
  //
  // Translation is intentionally conservative: we require all three legs of the
  // synthetic examination object in the operator-authored prompt itself:
  //   H   = a T0 historical authority state,
  //   ΔN  = a later material authority change for the same authority id, and
  //   A   = a specific consequential action.
  // We accept either "AUTH-9173 is valid" or "valid authority AUTH-9173" phrasing,
  // and likewise either "AUTH-9173 is revoked" or "revocation of AUTH-9173".
  const text = original
    .replace(/\u2010|\u2011|\u2012|\u2013|\u2014/g, "-")
    .replace(/Tₒ/g, "T₀");

  const sliceFromAnchor = (anchor: RegExp, length = 520): string => {
    const match = anchor.exec(text);
    if (!match || match.index == null) return "";
    return text.slice(match.index, match.index + length);
  };

  const historicalWindow = sliceFromAnchor(/(?:At\s+T[₀0]|T[₀0]\s*[:=]|Historical\s+Validity(?:\s+H)?\s*[:=]?|\bH\s*[:=])/i);
  const deltaWindow = sliceFromAnchor(/(?:At\s+Δ\s*N|Δ\s*N\s*[:=]|Delta\s*N\s*[:=]?|Material\s+Change(?:\s+Δ\s*N)?\s*[:=]?)/i);

  if (!historicalWindow || !deltaWindow) return undefined;

  const authorityIdIn = (window: string): string | undefined => window.match(/\b(AUTH-[A-Za-z0-9_-]+)\b/i)?.[1];
  const hasHistoricalStatus = (window: string): boolean =>
    /\b(valid|active|authorized|authorised)\b/i.test(window)
    || /\b(validity|authorization|authorisation)\b[\s\S]{0,100}\b(established|exists|in force)\b/i.test(window);
  const hasDeltaStatus = (window: string): string | undefined => {
    const direct = window.match(/\b(revoked|expired|suspended|withdrawn|invalidated|extinguished)\b/i)?.[1];
    if (direct) return direct.toLowerCase();
    const nominal = window.match(/\b(revocation|expiration|expiry|suspension|withdrawal|invalidation|extinguishment)\b/i)?.[1]?.toLowerCase();
    if (!nominal) return undefined;
    return ({
      revocation: "revoked",
      expiration: "expired",
      expiry: "expired",
      suspension: "suspended",
      withdrawal: "withdrawn",
      invalidation: "invalidated",
      extinguishment: "extinguished"
    } as Record<string, string>)[nominal];
  };

  const historicalAuthorityId = authorityIdIn(historicalWindow);
  const deltaAuthorityId = authorityIdIn(deltaWindow);
  const deltaStatus = hasDeltaStatus(deltaWindow);

  if (!historicalAuthorityId || !deltaAuthorityId || !hasHistoricalStatus(historicalWindow) || !deltaStatus) return undefined;
  if (historicalAuthorityId.toLowerCase() !== deltaAuthorityId.toLowerCase()) return undefined;

  const authorityId = historicalAuthorityId;

  const actionIdMatch = text.match(/\b(PAY-[A-Za-z0-9_-]+)\b/i);
  const accountMatch = text.match(/\b(ACCT-[A-Za-z0-9_-]+)\b/i);
  const amountMatch = text.match(/\$\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/);
  const actionLanguagePresent = /\b(execute|execution|release|transfer|pay|payment|disburse|authorize\s+payment|authorise\s+payment)\b/i.test(text)
    || /(?:\bA\s*[:=]|Consequential\s+Action\s+A)/i.test(text);

  // Avoid inventing a consequence from a generic governance discussion. A synthetic
  // fixture is translated only when the prompt identifies at least one concrete
  // action object/value (PAY id, account id, or amount) in addition to action language.
  if (!actionLanguagePresent || (!actionIdMatch && !accountMatch && !amountMatch)) return undefined;

  const actionId = actionIdMatch?.[1] || "ACTION-A";

  const extractAnchorTime = (anchor: RegExp): string | undefined => {
    const match = anchor.exec(text);
    if (!match || match.index == null) return undefined;
    const window = text.slice(match.index, match.index + 220);
    return window.match(/\(([^)]+)\)/)?.[1]
      || window.match(/\b(20\d{2}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z)\b/)?.[1];
  };

  const t0 = extractAnchorTime(/(?:At\s+T[₀0]|T[₀0]\s*[:=]|Historical\s+Validity(?:\s+H)?)/i) || "T0";
  const deltaTime = extractAnchorTime(/(?:At\s+Δ\s*N|Δ\s*N\s*[:=]|Delta\s*N|Material\s+Change)/i) || "DELTA_N";
  // Execution time must never alias T₀ or ΔN. Prefer an explicit Tₙ/Tn anchor,
  // then a plain `At T (...)` execution anchor, and only then an execution-request
  // phrase. The previous optional-suffix pattern could match the `T` prefix inside
  // `T₀`, which contaminated the fixture chronology.
  const executionTime =
    extractAnchorTime(/(?:At\s+T(?:ₙ|n)\s*|\bT(?:ₙ|n)\s*[:=])/i)
    || extractAnchorTime(/At\s+T(?![₀0ₙn])\s*(?=\(|[:=])/i)
    || extractAnchorTime(/(?:execution\s+time|execution\s+request(?:ed)?|request\s+to\s+execute)/i);

  const fixtureSource = `fixture://operator-authored/${encodeURIComponent(scenario || "custom-scenario")}`;
  const historicalRef = `${fixtureSource}#historical-authority`;
  const changeRef = `${fixtureSource}#material-change`;
  const actionRef = `${fixtureSource}#requested-action`;
  const stateRef = `${fixtureSource}#present-state`;

  const scope = [actionId, authorityId];
  if (accountMatch?.[1]) scope.push(accountMatch[1]);
  if (amountMatch?.[1]) scope.push(`${amountMatch[1].replace(/,/g, "")}_USD`);
  if (executionTime) scope.push(`EXECUTION_AT_${executionTime}`);

  const requestedAction: GovernanceRequestedAction = {
    type: accountMatch || amountMatch || /\b(payment|release|transfer|disburse)\b/i.test(text)
      ? "financial_execution"
      : "consequential_execution",
    scope
  };

  const fixtureActor = {
    id: "examiner-supplied-fixture",
    name: "Operator-authored synthetic test fixture",
    role: "Test fixture source",
    institution: "Synthetic examination object"
  };

  const authorityProvenance: GovernanceAuthorityProvenance = {
    authority_history: [
      {
        event_id: `${authorityId}-T0`,
        event_type: "authority_stipulated_valid",
        effective_at: t0,
        actor: fixtureActor,
        source_ref: historicalRef,
        evidence_refs: [historicalRef]
      },
      {
        event_id: `${authorityId}-DELTA-N`,
        event_type: `authority_${deltaStatus}`,
        effective_at: deltaTime,
        actor: fixtureActor,
        source_ref: changeRef,
        evidence_refs: [changeRef]
      }
    ],
    original_authority: {
      actor: fixtureActor,
      authority_source_type: "synthetic_test_fixture",
      authority_source_ref: historicalRef,
      delegation_ref: historicalRef,
      scope,
      effective_at: t0,
      evidence_refs: [historicalRef]
    },
    authority_change: {
      change_type: deltaStatus,
      changed_at: deltaTime,
      changed_by: fixtureActor,
      change_source_ref: changeRef,
      reason: `Operator-authored synthetic fixture stipulates ${authorityId} became ${deltaStatus} before ${actionId}.`,
      evidence_refs: [changeRef]
    },
    current_authority: {
      status: deltaStatus,
      actor: fixtureActor,
      authority_source_ref: changeRef,
      scope,
      evidence_refs: [changeRef]
    }
  };

  const stateProvenance: GovernanceStateProvenanceWitness = {
    attributable_source: fixtureSource,
    // Within a synthetic examination object, the operator-authored fixture is the
    // attributable source that establishes the stipulated state for the test. This
    // is not a claim of external-world truth; that boundary remains explicit in the
    // fixture URI and derivation method.
    epistemic_status: "ESTABLISHED",
    source_evidence_refs: [historicalRef, changeRef, actionRef, stateRef],
    derivation_ref: fixtureSource,
    derivation_method: "bounded_operator_prompt_fixture_translation"
  };

  return {
    requestedAction,
    authorityProvenance,
    stateProvenance,
    fixtureSource,
    translatedFields: [
      "historical_authority",
      "material_authority_change",
      "requested_action",
      ...(executionTime ? ["execution_time"] : [])
    ]
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



type ObligationHint = {
  detected: true;
  kind: "prohibition" | "prerequisite";
  status: "unsatisfied" | "satisfied" | "unresolved";
  waiver_or_exception_active: boolean;
  source: "bounded_custom_scenario_translation";
  canonical_text: string;
};

function deriveObligationHints(prompt: string): ObligationHint | undefined {
  const original = String(prompt || "").trim();
  const text = original.toLowerCase();
  if (!text) return undefined;

  // This is intentionally bounded. The harness does not infer arbitrary policy,
  // legal meaning, or domain obligations from general prose. It only promotes
  // an obligation when the operator has explicitly declared the obligation and
  // its present status in the custom scenario.
  const explicitProhibition = [
    /\b(?:currently\s+)?applicable\s+(?:constitutional\s+)?obligation\b[\s\S]{0,220}\b(?:prohibits?|forbids?|must\s+not)\b/,
    /\b(?:requirement|obligation|prohibition)\s*:\s*[^\n]{0,220}\bmust\s+not\b/,
    /\bthe\s+proposed\s+action\s+must\s+not\s+be\s+(?:executed|performed|continued|allowed)\b/,
    /\bexplicit(?:ly)?\s+(?:prohibition|prohibits?|forbids?)\b/,
  ].some((pattern) => pattern.test(text));

  const explicitPrerequisite = [
    /\bmandatory\s+(?:pre[- ]?execution\s+)?(?:obligation|requirement|prerequisite)\b/,
    /\b(?:must|required to|requires?)\b[\s\S]{0,160}\bbefore\b/,
    /\bcondition\s+precedent\b/,
  ].some((pattern) => pattern.test(text));

  if (!explicitProhibition && !explicitPrerequisite) return undefined;

  const noWaiverOrException = [
    /\bno\s+(?:applicable\s+)?waiver\b/,
    /\bno\s+(?:applicable\s+)?exception\b/,
    /\bwaiver\s*:\s*(?:none|no|false)\b/,
    /\bexception\s*:\s*(?:none|no|false)\b/,
    /\bunwaived\b/,
  ].some((pattern) => pattern.test(text));

  const activeWaiverOrException = !noWaiverOrException && [
    /\bwaiver\b[\s\S]{0,80}\b(?:active|approved|granted|applies|in effect)\b/,
    /\bexception\b[\s\S]{0,80}\b(?:active|approved|granted|applies|in effect)\b/,
  ].some((pattern) => pattern.test(text));

  const explicitUnsatisfied = [
    /\b(?:requirement|obligation)\s+status\s*:\s*unsatisfied\b/,
    /\bstatus\s*:\s*unsatisfied\b/,
    /\b(?:obligation|requirement|prerequisite)\b[\s\S]{0,120}\b(?:unsatisfied|unfulfilled|not\s+satisfied|not\s+fulfilled|not\s+met)\b/,
    /\bprohibition\b[\s\S]{0,160}\b(?:valid|current|active|applies|applicable)\b/,
    /\b(?:valid|current|active|applicable)\b[\s\S]{0,160}\bprohibition\b/,
  ].some((pattern) => pattern.test(text));

  const explicitSatisfied = [
    /\b(?:requirement|obligation)\s+status\s*:\s*satisfied\b/,
    /\bstatus\s*:\s*satisfied\b/,
    /\b(?:obligation|requirement|prerequisite)\b[\s\S]{0,120}\b(?:has been|is)\s+(?:satisfied|fulfilled|met|completed)\b/,
  ].some((pattern) => pattern.test(text));

  let status: ObligationHint["status"] = "unresolved";
  if (activeWaiverOrException || explicitSatisfied) status = "satisfied";
  else if (explicitUnsatisfied || (explicitProhibition && noWaiverOrException)) status = "unsatisfied";

  const kind: ObligationHint["kind"] = explicitProhibition ? "prohibition" : "prerequisite";

  // The V3 obligation primitive intentionally derives constitutional effect from
  // caller-supplied request text. Emit a narrow canonical witness using vocabulary
  // already frozen by that primitive instead of teaching the harness to decide.
  let canonicalText: string;
  if (status === "unsatisfied") {
    canonicalText = kind === "prohibition"
      ? "Institution policy requires that execution remain prohibited before the binding prohibition is satisfied, waived, or an applicable exception is established. The mandatory requirement has not been satisfied. No waiver or exception is active."
      : "Institution policy requires that the mandatory prerequisite be satisfied before execution. The mandatory requirement has not been satisfied. No waiver or exception is active.";
  } else if (status === "satisfied") {
    canonicalText = "Institution policy requires that the mandatory prerequisite be satisfied before execution. The mandatory requirement has been satisfied or an applicable waiver or exception is active.";
  } else {
    canonicalText = "Institution policy requires that the mandatory prerequisite be satisfied before execution. The supplied scenario does not establish whether the mandatory requirement is satisfied, waived, or excepted.";
  }

  return {
    detected: true,
    kind,
    status,
    waiver_or_exception_active: activeWaiverOrException,
    source: "bounded_custom_scenario_translation",
    canonical_text: canonicalText,
  };
}
function buildGovernancePackPayload(params: {
  prompt: string;
  response: string;
  scenario: string;
  governanceFacts?: GovernanceContinuityFacts;
  authorityProvenance?: GovernanceAuthorityProvenance;
  requestedAction?: GovernanceRequestedAction;
  downstreamAccountability?: GovernanceDownstreamAccountability;
  obligationWitness?: GovernanceObligationWitness;
  stateProvenance?: GovernanceStateProvenanceWitness;
  outboundContinuity?: ReturnType<typeof deriveContinuityHints>;
}) {
  const fixtureWitness = deriveSyntheticFixtureWitness(params.prompt, params.scenario);
  const effectiveRequestedAction = params.requestedAction || fixtureWitness?.requestedAction;
  const effectiveAuthorityProvenance = params.authorityProvenance || fixtureWitness?.authorityProvenance;
  const effectiveStateProvenance = params.stateProvenance || fixtureWitness?.stateProvenance;

  // V86 methodology hardening:
  // The candidate response is a proposed consequence/output. It is never evidence
  // about external reality merely because a model generated it. All harness-side
  // semantic classification is therefore computed from the operator-authored
  // scenario only, never from params.response.
  const context = classifyExecutionContext({
    prompt: params.prompt,
    scenario: params.scenario,
    response: ""
  });

  const requestedAction = effectiveRequestedAction || {
    type: context.surface,
    scope: [params.scenario]
  };

  const consequenceLevel =
    requestedAction.type === "financial_execution" ? "critical" : context.consequenceLevel;

  const explicitStructuredInput =
    Boolean(params.governanceFacts) ||
    Boolean(params.authorityProvenance) ||
    Boolean(params.requestedAction) ||
    Boolean(params.downstreamAccountability) ||
    Boolean(params.obligationWitness) ||
    Boolean(params.stateProvenance);

  const methodologyMode = fixtureWitness
    ? "structured_fixture"
    : explicitStructuredInput
      ? "explicit_structured"
      : "exploratory_natural_language";

  const derivedFields: string[] = [];
  if (!effectiveRequestedAction) derivedFields.push("requested_action");
  if (!params.requestedAction && !fixtureWitness?.requestedAction) derivedFields.push("consequence_profile");
  if (fixtureWitness) derivedFields.push(...fixtureWitness.translatedFields);

  const packet: Record<string, unknown> = {
    packet_id: `${params.scenario}-${crypto.randomUUID()}`,

    // Preserve the operator-authored scenario as narrative context, not as a
    // fabricated current-state observation.
    prompt: params.prompt,
    scenario_prompt: params.prompt,
    scenario_label: params.scenario,

    // Bind the exact candidate being governed. This is deliberately separate
    // from declared_reality / observed_reality.
    response: params.response,

    harness_witness_meta: {
      adapter_build: "v86-methodology-hardening-2026-08-26",
      methodology_mode: methodologyMode,
      disposition_authority: "harmonic",
      model_response_role: "proposed_response_only",
      model_response_used_as_observed_reality: false,
      requested_action_explicit: Boolean(params.requestedAction),
      authority_provenance_explicit: Boolean(params.authorityProvenance),
      obligation_witness_explicit: Boolean(params.obligationWitness),
      downstream_accountability_explicit: Boolean(params.downstreamAccountability),
      state_provenance_explicit: Boolean(params.stateProvenance),
      synthetic_fixture_translated: Boolean(fixtureWitness),
      synthetic_fixture_source: fixtureWitness?.fixtureSource || null,
      synthetic_fixture_fields: fixtureWitness?.translatedFields || [],
      harness_derived_fields: derivedFields,
      freshness_stamped_by_harness: false,
      whole_prompt_promoted_to_current_reality: false
    },

    requested_action: requestedAction,

    consequence_profile: {
      level: consequenceLevel,
      reversibility:
        requestedAction.type === "financial_execution"
          ? "difficult_to_reverse"
          : context.reversibility,
      execution_surface: requestedAction.type,
      execution_surface_reason: context.reason,
      requires_operator_review:
        requestedAction.type === "financial_execution"
          ? true
          : context.requiresOperatorReview,
      should_block_execution: context.shouldBlockExecution,
      should_escalate: context.shouldEscalate,
      source_class:
        effectiveRequestedAction
          ? "structured_requested_action"
          : "harness_exploratory_classification"
    },

    safeguards: {
      execution_surface_classifier: {
        ...context,
        source_class: "harness_exploratory_classification",
        model_response_consulted: false
      },
      ...(fixtureWitness
        ? {
            synthetic_fixture_control: {
              mode: "AUTHORITY_CONTINUITY_ISOLATION",
              operator_review_stipulated_satisfied: true,
              source: fixtureWitness.fixtureSource,
              test_intervention: true
            },
            operator_review_confirmed: true
          }
        : {})
    }
  };

  // Only explicit or frozen fixture state enters structured governance fields.
  // Absence remains absence; the harness does not manufacture reality,
  // freshness, authority checks, revocation checks, or obligation status.
  if (params.governanceFacts) packet.continuity = { ...params.governanceFacts };
  if (effectiveAuthorityProvenance) packet.authority_provenance = effectiveAuthorityProvenance;
  if (params.obligationWitness) packet.obligation_witness = params.obligationWitness;
  if (effectiveStateProvenance) packet.present_state_provenance = effectiveStateProvenance;
  if (params.downstreamAccountability) packet.downstream_accountability = params.downstreamAccountability;

  return packet;
}

function buildPayload(params: {
  lane: LaneName;
  prompt: string;
  response: string;
  scenario: string;
  governanceFacts?: GovernanceContinuityFacts;
  authorityProvenance?: GovernanceAuthorityProvenance;
  requestedAction?: GovernanceRequestedAction;
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
  const requestedAction = asRecord(packet.requested_action);
  const downstreamAccountability = asRecord(packet.downstream_accountability);
  const obligationWitness = asRecord(packet.obligation_witness);
  const stateProvenance = asRecord(packet.present_state_provenance);
  const witnessMeta = asRecord(packet.harness_witness_meta) || {};

  return {
    adapter_build: "v86-methodology-hardening-2026-08-26",
    packet_id: typeof packet.packet_id === "string" ? packet.packet_id : null,
    prompt_present: typeof packet.prompt === "string" && packet.prompt.trim().length > 0,
    scenario_prompt_present: typeof packet.scenario_prompt === "string" && packet.scenario_prompt.trim().length > 0,
    scenario_label: typeof packet.scenario_label === "string" ? packet.scenario_label : null,
    methodology: {
      mode: typeof witnessMeta.methodology_mode === "string" ? witnessMeta.methodology_mode : "unknown",
      disposition_authority: typeof witnessMeta.disposition_authority === "string" ? witnessMeta.disposition_authority : "harmonic",
      harness_derived_fields: Array.isArray(witnessMeta.harness_derived_fields) ? witnessMeta.harness_derived_fields : [],
      freshness_stamped_by_harness: witnessMeta.freshness_stamped_by_harness === true,
      whole_prompt_promoted_to_current_reality: witnessMeta.whole_prompt_promoted_to_current_reality === true
    },
    model_response_binding: {
      role: typeof witnessMeta.model_response_role === "string" ? witnessMeta.model_response_role : null,
      used_as_observed_reality: witnessMeta.model_response_used_as_observed_reality === true,
      response_supplied: typeof packet.response === "string" && packet.response.trim().length > 0
    },
    synthetic_fixture: {
      translated: witnessMeta.synthetic_fixture_translated === true,
      source: typeof witnessMeta.synthetic_fixture_source === "string" ? witnessMeta.synthetic_fixture_source : null,
      fields: Array.isArray(witnessMeta.synthetic_fixture_fields) ? witnessMeta.synthetic_fixture_fields : []
    },
    requested_action: {
      supplied: Boolean(requestedAction),
      source: witnessMeta.requested_action_explicit === true
        ? "explicit_structured_witness"
        : witnessMeta.synthetic_fixture_translated === true
          ? "synthetic_fixture_translation"
          : Boolean(requestedAction)
            ? "derived_runtime_context"
            : "not_supplied",
      type: typeof requestedAction?.type === "string" ? requestedAction.type : null,
      scope: Array.isArray(requestedAction?.scope) ? requestedAction.scope : []
    },
    authority_provenance: {
      supplied: Boolean(authorityProvenance),
      source: witnessMeta.authority_provenance_explicit === true
        ? "explicit_structured_witness"
        : witnessMeta.synthetic_fixture_translated === true
          ? "synthetic_fixture_translation"
          : "not_supplied",
      authority_history_event_count: Array.isArray(authorityProvenance?.authority_history) ? authorityProvenance.authority_history.length : 0,
      original_authority_supplied: Boolean(asRecord(authorityProvenance?.original_authority)),
      authority_change_supplied: Boolean(asRecord(authorityProvenance?.authority_change)),
      current_authority_supplied: Boolean(asRecord(authorityProvenance?.current_authority))
    },
    obligation: {
      supplied: witnessMeta.obligation_witness_explicit === true,
      kind: typeof obligationWitness?.kind === "string" ? obligationWitness.kind : null,
      status: typeof obligationWitness?.status === "string" ? obligationWitness.status : null,
      waiver_or_exception_active: typeof obligationWitness?.waiver_or_exception_active === "boolean" ? obligationWitness.waiver_or_exception_active : null,
      source: typeof obligationWitness?.source === "string" ? obligationWitness.source : null
    },
    state_provenance: {
      supplied: Boolean(stateProvenance),
      source: witnessMeta.state_provenance_explicit === true
        ? "explicit_structured_witness"
        : witnessMeta.synthetic_fixture_translated === true
          ? "synthetic_fixture_translation"
          : "not_supplied",
      attributable_source: typeof stateProvenance?.attributable_source === "string" ? stateProvenance.attributable_source : null,
      epistemic_status: typeof stateProvenance?.epistemic_status === "string" ? stateProvenance.epistemic_status : null,
      evidence_ref_count: Array.isArray(stateProvenance?.source_evidence_refs) ? stateProvenance.source_evidence_refs.length : 0
    },
    downstream_accountability: {
      supplied: witnessMeta.downstream_accountability_explicit === true,
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

  // V70: customer-boundary jurisdiction. The universal /api/evaluate response is
  // the sole source of the governed execution disposition. Local scenario/context
  // classification may shape the request we send Harmonic, but it must never
  // independently upgrade, downgrade, or otherwise synthesize the returned decision.
  const decision = decisionFromArtifact(layer);

  const assurance = asRecord(params.unified.assurance);
  const constitutionalDetermination =
    asRecord(params.unified.constitutional_determination) ||
    asRecord(assurance?.constitutional_determination) ||
    asRecord(assurance?.determination);
  const constitutionalReceipt =
    asRecord(params.unified.constitutional_receipt) ||
    asRecord(assurance?.constitutional_receipt) ||
    asRecord(assurance?.receipt);
  const determinationBody = asRecord(constitutionalDetermination?.determination_body) || constitutionalDetermination;
  const receiptBody = asRecord(constitutionalReceipt?.receipt_body) || constitutionalReceipt;
  const responseBinding = asRecord(layer.response_binding);
  const dependencyManifest =
    asRecord(determinationBody?.dependency_manifest) ||
    asRecord(receiptBody?.dependency_manifest) ||
    asRecord(assurance?.dependency_manifest);
  const presentStateBinding =
    asRecord(determinationBody?.present_state_binding) ||
    asRecord(receiptBody?.present_state_binding) ||
    asRecord(assurance?.present_state_binding);
  const currency =
    asRecord(determinationBody?.currency_at_creation) ||
    asRecord(assurance?.determination_currency);
  const replay = asRecord(assurance?.replay) || asRecord(params.unified.replay);
  const projection = asRecord(assurance?.projection) || asRecord(params.unified.projection);
  const returnedConstitutionalTransaction = asRecord(params.unified.constitutional_transaction);
  const returnedUnifiedTransaction = asRecord(params.unified.unified_transaction);

  // V71: canonical customer response preservation. Harmonic's returned
  // constitutional_transaction is the source of truth for the universal V3
  // customer boundary. The compatibility projection below exists only for
  // older responses that predate the canonical transaction object. The harness
  // must not reinterpret or reconstruct a newer canonical transaction.
  const fallbackConstitutionalTransaction = {
    contract: "single_api_call",
    api_version: params.unified.api_version || assurance?.api_version || null,
    packet_id: params.unified.packet_id || layer.packet_id || null,
    evidence_bearing: assurance?.evidence_bearing ?? Boolean(constitutionalDetermination || constitutionalReceipt),
    present_state: {
      binding: presentStateBinding || null,
      state_hash: presentStateBinding?.state_hash || determinationBody?.runtime_input_snapshot_hash || assurance?.present_state_hash || null,
      provenance: presentStateBinding?.provenance || presentStateBinding?.present_state_provenance || assurance?.present_state_provenance || null,
      epistemic_status: presentStateBinding?.epistemic_status || assurance?.epistemic_status || "NOT_PROVIDED"
    },
    determination: {
      outcome: firstPresent(layer.outcome, layer.decision, determinationBody?.outcome) || null,
      admissible: firstPresent(layer.admissible, determinationBody?.admissible) ?? null,
      action: firstPresent(layer.action, determinationBody?.action) || null,
      reason: firstPresent(layer.decision_reason, determinationBody?.decision_reason, responseBinding?.binding_instruction) || null,
      determination_id: assurance?.determination_id || determinationBody?.determination_id || null,
      determination_hash: assurance?.determination_hash || determinationBody?.determination_hash || null
    },
    dependencies: {
      manifest: dependencyManifest || null,
      dependency_root: determinationBody?.dependency_root || dependencyManifest?.dependency_root || assurance?.dependency_root || null
    },
    currency: currency || { status: "CURRENT_AT_CREATION" },
    execution: {
      boundary: layer.execution_boundary || determinationBody?.execution_boundary || null,
      status: responseBinding?.execution_status || assurance?.execution_status || "NOT_EXECUTED_BY_HARMONIC"
    },
    receipt: {
      receipt_id: assurance?.receipt_id || receiptBody?.receipt_id || null,
      receipt_hash: assurance?.receipt_hash || receiptBody?.receipt_hash || null
    },
    replay: {
      status: replay?.status || assurance?.replay_status || "NOT_EXERCISED",
      range_binding: replay?.range_binding || assurance?.evidence_range || null
    },
    integrity: {
      transaction_digest: determinationBody?.transaction_digest || receiptBody?.transaction_digest || assurance?.transaction_digest || null,
      projection_digest: projection?.projection_digest || assurance?.projection_digest || null,
      projection_integrity: projection?.integrity_status || assurance?.projection_integrity || "NOT_EXERCISED"
    }
  };

  const constitutionalTransaction =
    returnedConstitutionalTransaction || fallbackConstitutionalTransaction;

  const unifiedTransaction =
    returnedUnifiedTransaction || {
      api_version: params.unified.api_version || assurance?.api_version || null,
      packet_id: params.unified.packet_id || null,
      evidence_bearing: assurance?.evidence_bearing ?? false,
      determination_id: assurance?.determination_id || null,
      determination_hash: assurance?.determination_hash || null,
      receipt_id: assurance?.receipt_id || null,
      receipt_hash: assurance?.receipt_hash || null
    };

  const runtimeFlags = getFlags(
    firstPresent(layer.flags, layer.warnings, layer.findings, layer.issues, layer.violations)
  );
  const methodologyFlags: string[] = [];
  if (params.requestWitness.methodology.mode === "exploratory_natural_language") {
    methodologyFlags.push("HARNESS_MODE: exploratory natural-language classification; not a clean primitive falsification fixture.");
  }
  if (params.requestWitness.synthetic_fixture.translated) {
    methodologyFlags.push("TEST_INTERVENTION: synthetic fixture translation/control is active and preserved in the witness.");
  }

  return {
    available: true,
    decision,
    summary: summarizeResponse(
      layer,
      params.lane === "harmonic"
        ? "Harmonic stabilization result from the unified transaction."
        : "Harmonic+ constitutional result from the unified transaction."
    ),
    flags: [...runtimeFlags, ...methodologyFlags],
    primitiveResults,
    raw: {
      ...layer,
      unified_transaction: unifiedTransaction,
      constitutional_transaction: constitutionalTransaction,
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
  // V86: The harness never synthesizes or upgrades a runtime disposition.
  // If the runtime artifact does not carry a determination, preserve UNKNOWN.
  const decision = artifactDecision;

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
    flags: [
      ...getFlags(firstPresent(layer.flags, layer.warnings, layer.findings, layer.issues, layer.violations)),
      ...(params.requestWitness.methodology.mode === "exploratory_natural_language"
        ? ["HARNESS_MODE: exploratory natural-language classification; not a clean primitive falsification fixture."]
        : []),
      ...(params.requestWitness.synthetic_fixture.translated
        ? ["TEST_INTERVENTION: synthetic fixture translation/control is active and preserved in the witness."]
        : [])
    ],
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
  requestedAction?: GovernanceRequestedAction;
  downstreamAccountability?: GovernanceDownstreamAccountability;
  obligationWitness?: GovernanceObligationWitness;
  stateProvenance?: GovernanceStateProvenanceWitness;
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

  const requestUrl = new URL(url);
  if (bypassSecret) {
    requestUrl.searchParams.set("x-vercel-protection-bypass", bypassSecret);
    requestUrl.searchParams.set("x-vercel-set-bypass-cookie", "true");
  }

  const requestBody = JSON.stringify({ packet: enterprisePacket });

  const v2Headers = (cookie?: string): Record<string, string> => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${key}`,
    "X-Harmonic-Harness-Build": "frozen-v2-selector-2026-08-09",
    ...(bypassSecret
      ? {
          "x-vercel-protection-bypass": bypassSecret,
          "x-vercel-set-bypass-cookie": "true"
        }
      : {}),
    ...(cookie ? { Cookie: cookie } : {})
  });

  const doV2Fetch = async (target: string, cookie?: string): Promise<Response> => {
    try {
      return await fetch(target, {
        method: "POST",
        redirect: "manual",
        headers: v2Headers(cookie),
        body: requestBody
      });
    } catch (error) {
      const err = error as Error & { cause?: unknown };
      const cause =
        err?.cause && typeof err.cause === "object"
          ? JSON.stringify(err.cause)
          : err?.cause
            ? String(err.cause)
            : null;

      throw new Error(
        [
          "Frozen V2 fetch failed before an HTTP response was received.",
          `target=${new URL(target).origin}${new URL(target).pathname}`,
          `bypass_configured=${Boolean(bypassSecret)}`,
          `error=${err?.message || String(error)}`,
          cause ? `cause=${cause}` : null
        ].filter(Boolean).join(" | ")
      );
    }
  };

  let res = await doV2Fetch(requestUrl.toString());

  // Vercel Protection Bypass for Automation can answer the first request with
  // a 307 to the same route while setting a bypass cookie. Node fetch does not
  // retain cookies across redirects, so complete that handshake explicitly.
  if (res.status === 307 && bypassSecret) {
    const location = res.headers.get("location");
    const setCookie = res.headers.get("set-cookie");

    if (location && setCookie) {
      const cookie = setCookie.split(";")[0]?.trim();
      const redirectUrl = new URL(location, requestUrl.origin);

      if (!cookie) {
        throw new Error("Frozen V2 protection redirect did not contain a usable bypass cookie.");
      }

      res = await doV2Fetch(redirectUrl.toString(), cookie);
    }
  }

  if (res.status >= 300 && res.status < 400) {
    const location = res.headers.get("location");
    throw new Error(
      `Frozen V2 returned unresolved redirect HTTP ${res.status}` +
      (location ? ` to ${location}` : "") +
      `. The Vercel protection bypass was ${bypassSecret ? "configured" : "not configured"}.`
    );
  }

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
  requestedAction?: GovernanceRequestedAction;
  downstreamAccountability?: GovernanceDownstreamAccountability;
  obligationWitness?: GovernanceObligationWitness;
  stateProvenance?: GovernanceStateProvenanceWitness;
}): Promise<{ harmonic: GovernanceEvaluation; harmonic_governance: GovernanceEvaluation }> {
  if (params.runtimeTarget === "v2") return evaluateFrozenV2(params);

  const { url, key } = unifiedEndpoint();
  if (!url || !key) {
    const unavailable: GovernanceEvaluation = {
      available: false,
      decision: "UNKNOWN",
      summary: "NOT_EVALUATED: no unified Harmonic API key is configured.",
      flags: ["not-evaluated", "endpoint-not-configured"]
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
      "X-Harmonic-Harness-Build": "v86-methodology-hardening-2026-08-26"
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
      available: false, decision: "UNKNOWN", summary: `TRANSPORT_FAILURE: ${message}`, flags: ["transport-failure"], raw: json
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


export function projectExactPacketReplay(params: {
  unified: Record<string, unknown>;
  packet: Record<string, unknown>;
  outboundSha256: string;
  outboundBytes: number;
}): { harmonic: GovernanceEvaluation; harmonic_governance: GovernanceEvaluation } {
  const packetId = typeof params.packet.packet_id === "string" ? params.packet.packet_id : null;
  const requestedAction = asRecord(params.packet.requested_action);
  const authorityProvenance = asRecord(params.packet.authority_provenance);
  const obligationWitness = asRecord(params.packet.obligation_witness);
  const stateProvenance = asRecord(params.packet.present_state_provenance);
  const downstreamAccountability = asRecord(params.packet.downstream_accountability);
  const continuity = asRecord(params.packet.continuity) || {};

  // This mirrors the normal witness shape for UI compatibility, but is descriptive only.
  // It does not create or transform any field in the outbound replay packet.
  const requestWitness = {
    adapter_build: "v75-exact-packet-replay-2026-08-14",
    packet_id: packetId,
    prompt_present: typeof params.packet.prompt === "string" && params.packet.prompt.trim().length > 0,
    scenario_prompt_present: typeof params.packet.scenario_prompt === "string" && params.packet.scenario_prompt.trim().length > 0,
    scenario_label: typeof params.packet.scenario_label === "string" ? params.packet.scenario_label : null,
    methodology: {
      mode: "exact_packet_replay",
      disposition_authority: "harmonic",
      harness_derived_fields: [],
      freshness_stamped_by_harness: false,
      whole_prompt_promoted_to_current_reality: false
    },
    model_response_binding: {
      role: "exact_packet_replay",
      used_as_observed_reality: false,
      response_supplied: typeof params.packet.response === "string" && params.packet.response.trim().length > 0
    },
    synthetic_fixture: {
      translated: false,
      source: null,
      fields: []
    },
    requested_action: {
      supplied: Boolean(requestedAction),
      source: Boolean(requestedAction) ? "exact_packet_replay" : "not_supplied",
      type: typeof requestedAction?.type === "string" ? requestedAction.type : null,
      scope: Array.isArray(requestedAction?.scope) ? requestedAction.scope : []
    },
    authority_provenance: {
      supplied: Boolean(authorityProvenance),
      source: Boolean(authorityProvenance) ? "exact_packet_replay" : "not_supplied",
      authority_history_event_count: Array.isArray(authorityProvenance?.authority_history) ? authorityProvenance.authority_history.length : 0,
      original_authority_supplied: Boolean(asRecord(authorityProvenance?.original_authority)),
      authority_change_supplied: Boolean(asRecord(authorityProvenance?.authority_change)),
      current_authority_supplied: Boolean(asRecord(authorityProvenance?.current_authority))
    },
    obligation: {
      supplied: Boolean(obligationWitness),
      kind: typeof obligationWitness?.kind === "string" ? obligationWitness.kind : null,
      status: typeof obligationWitness?.status === "string" ? obligationWitness.status : null,
      waiver_or_exception_active: typeof obligationWitness?.waiver_or_exception_active === "boolean" ? obligationWitness.waiver_or_exception_active : null,
      source: typeof obligationWitness?.source === "string" ? obligationWitness.source : null
    },
    state_provenance: {
      supplied: Boolean(stateProvenance),
      source: Boolean(stateProvenance) ? "exact_packet_replay" : "not_supplied",
      attributable_source: typeof stateProvenance?.attributable_source === "string" ? stateProvenance.attributable_source : null,
      epistemic_status: typeof stateProvenance?.epistemic_status === "string" ? stateProvenance.epistemic_status : null,
      evidence_ref_count: Array.isArray(stateProvenance?.source_evidence_refs)
        ? stateProvenance.source_evidence_refs.length
        : Array.isArray(stateProvenance?.evidence_refs) ? stateProvenance.evidence_refs.length : 0
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
    },
    mode: "exact_packet_replay",
    exact_packet_replay: true,
    semantic_translation_performed: false,
    llm_involved_in_packet_construction: false,
    outbound_sha256: params.outboundSha256,
    outbound_bytes: params.outboundBytes,
    transport_rule: "The operator-supplied JSON body was forwarded to /api/evaluate without semantic translation."
  };

  const prompt = "Exact packet replay; no model inference or harness semantic translation.";
  const response = typeof params.packet.response === "string" ? params.packet.response : "";
  const scenario = packetId || "Exact packet replay";

  return {
    harmonic: evaluationFromUnifiedArtifact({
      lane: "harmonic", unified: params.unified, prompt, response, scenario, requestWitness
    }),
    harmonic_governance: evaluationFromUnifiedArtifact({
      lane: "harmonic_governance", unified: params.unified, prompt, response, scenario, requestWitness
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
        summary: `TRANSPORT_FAILURE: ${message}`,
        flags: ["transport-failure"],
        raw: json
      };
    }

    const primitiveResults = parsePrimitiveResults(json);
    const artifactDecision = decisionFromArtifact(json);
    // V86: preserve the runtime disposition exactly. Local primitive parsing and
    // execution-context heuristics are explanatory only and cannot create a decision.
    const decision = artifactDecision;

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
