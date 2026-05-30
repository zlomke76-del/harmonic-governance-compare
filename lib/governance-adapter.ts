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

  if (["ALLOW", "ALLOWED", "PASS", "PASSED", "APPROVE", "APPROVED", "CONTACT_CONFIRMED", "AUTHORITY_CONTINUOUS"].includes(normalized)) {
    return "ALLOW";
  }

  if (["CONSTRAIN", "CONSTRAINED", "LIMIT", "LIMITED"].includes(normalized)) {
    return "CONSTRAIN";
  }

  if (["ESCALATE", "ESCALATED", "REVIEW", "HUMAN_REVIEW", "REQUIRES_REVIEW"].includes(normalized)) {
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

function consequenceLevelForScenario(scenario: string): "low" | "medium" | "high" {
  const value = scenario.toLowerCase();
  if (
    value.includes("clinical") ||
    value.includes("health") ||
    value.includes("medical") ||
    value.includes("discharge") ||
    value.includes("icu") ||
    value.includes("legal") ||
    value.includes("finance") ||
    value.includes("defense")
  ) {
    return "high";
  }
  return "medium";
}

function actionTypeForScenario(scenario: string): string {
  const value = scenario.toLowerCase();
  if (value.includes("clinical") || value.includes("discharge") || value.includes("icu")) {
    return "clinical_order";
  }
  if (value.includes("legal")) return "legal_recommendation";
  if (value.includes("finance")) return "financial_action";
  return "ai_continuation";
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

  const parsed = keys
    .map((key) => {
      const primitive = asRecord(primitiveSource[key]);
      if (!primitive) return null;

      const boundarySignals = normalizeSignals(primitive.boundary_signals);
      const driftSignals = normalizeSignals(primitive.drift_signals);
      const authoritySignals = normalizeSignals(primitive.authority_signals);
      const admissibilitySignals = normalizeSignals(primitive.admissibility_signals);

      return {
        key,
        label: primitiveLabel(key),
        outcome: getString(primitive.outcome, "UNKNOWN"),
        admissible: normalizeAdmissible(primitive.admissible),
        action: typeof primitive.action === "string" ? primitive.action : undefined,
        artifactHash: typeof primitive.artifact_hash === "string" ? primitive.artifact_hash : undefined,
        failedPrimitives: asArray(primitive.failed_primitives).map(String),
        signals: [...driftSignals, ...authoritySignals, ...boundarySignals, ...admissibilitySignals],
        metadata: metadataFromPrimitive(key, primitive)
      } satisfies PrimitiveResult;
    })
    .filter((item): item is PrimitiveResult => Boolean(item));

  return parsed.length ? parsed : undefined;
}

function buildHarmonicOnlyPayload(params: { response: string; scenario: string }) {
  return {
    response: params.response,
    consequence_level: consequenceLevelForScenario(params.scenario)
  };
}

function buildGovernancePackPayload(params: {
  prompt: string;
  response: string;
  scenario: string;
}) {
  const now = new Date().toISOString();
  const consequenceLevel = consequenceLevelForScenario(params.scenario);
  const actionType = actionTypeForScenario(params.scenario);

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
      reversibility: consequenceLevel === "high" ? "partially_reversible" : "reversible",
      execution_surface: actionType
    },
    safeguards: {
      operator_review_confirmed: false
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

    return {
      available: true,
      decision: normalizeDecision(
        firstPresent(
          json.decision,
          json.recommended_action,
          json.recommendation,
          json.package_outcome,
          json.status,
          json.result,
          json.outcome,
          asRecord(json.runtime_admissibility)?.action
        )
      ),
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
