import type {
  GovernanceDecision,
  GovernanceEvaluation,
  GovernanceSignal,
  LaneName,
  PrimitiveAdmissibility,
  PrimitiveResult
} from "./types";

const DEFAULT_HARMONIC_ONLY_API_URL = "https://www.solace-harmonic.com/api/evaluate";
const DEFAULT_HARMONIC_GOVERNANCE_API_URL = "https://www.solace-harmonic.com/api/governance-pack";

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

function endpointForLane(lane: LaneName): { url?: string; key?: string } {
  if (lane === "harmonic") {
    return {
      url: process.env.HARMONIC_ONLY_API_URL || process.env.HARMONIC_API_URL || DEFAULT_HARMONIC_ONLY_API_URL,
      key: process.env.HARMONIC_ONLY_API_KEY || process.env.HARMONIC_API_KEY
    };
  }

  if (lane === "harmonic_governance") {
    return {
      url:
        process.env.HARMONIC_GOVERNANCE_API_URL ||
        process.env.GOVERNANCE_PACK_API_URL ||
        DEFAULT_HARMONIC_GOVERNANCE_API_URL,
      key: process.env.HARMONIC_GOVERNANCE_API_KEY || process.env.HARMONIC_API_KEY
    };
  }

  return {};
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
  const rank: Record<GovernanceDecision, number> = { UNKNOWN: 0, ALLOW: 1, CONSTRAIN: 2, ESCALATE: 3, BLOCK: 4 };
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

function buildGovernancePackPayload(params: {
  prompt: string;
  response: string;
  scenario: string;
}) {
  const now = new Date().toISOString();
  const context = classifyExecutionContext(params);
  const consequenceLevel = context.consequenceLevel;
  const actionType = context.surface;

  return {
    packet_id: `${params.scenario}-${crypto.randomUUID()}`,
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

export async function evaluateGovernance(params: {
  lane: LaneName;
  prompt: string;
  response: string;
  scenario: string;
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
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`
      },
      body: JSON.stringify(buildPayload(params))
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
      raw: json
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
