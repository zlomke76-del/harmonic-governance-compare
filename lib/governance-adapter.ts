import type { GovernanceDecision, GovernanceEvaluation, LaneName } from "./types";

const DEFAULT_HARMONIC_ONLY_API_URL = "https://www.solace-harmonic.com/api/evaluate";
const DEFAULT_HARMONIC_GOVERNANCE_API_URL = "https://www.solace-harmonic.com/api/governance-pack";

function normalizeDecision(value: unknown): GovernanceDecision {
  const normalized = String(value || "").trim().toUpperCase();

  if (["ALLOW", "ALLOWED", "PASS", "PASSED", "APPROVE", "APPROVED"].includes(normalized)) {
    return "ALLOW";
  }

  if (["CONSTRAIN", "CONSTRAINED", "LIMIT", "LIMITED"].includes(normalized)) {
    return "CONSTRAIN";
  }

  if (["ESCALATE", "ESCALATED", "REVIEW", "HUMAN_REVIEW", "REQUIRES_REVIEW"].includes(normalized)) {
    return "ESCALATE";
  }

  if (["BLOCK", "BLOCKED", "DENY", "DENIED", "REFUSE", "REFUSED", "FAIL", "FAILED"].includes(normalized)) {
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
  const primitiveResults = json.primitive_results;
  const primitiveSummary =
    primitiveResults && typeof primitiveResults === "object"
      ? ` Primitive results: ${Object.entries(primitiveResults as Record<string, unknown>)
          .map(([key, value]) => `${key}=${typeof value === "object" ? JSON.stringify(value) : String(value)}`)
          .join("; ")}`
      : "";

  return `${getString(
    firstPresent(json.summary, json.reason, json.explanation, json.rationale, json.message),
    fallback
  )}${primitiveSummary}`;
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
          json.outcome
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
