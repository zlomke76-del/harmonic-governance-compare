import type { GovernanceDecision, GovernanceEvaluation, LaneName } from "./types";

const DEFAULT_HARMONIC_GOVERNANCE_API_URL = "https://www.solace-harmonic.com/api/evaluate";
const DEFAULT_HARMONIC_ONLY_API_URL = "https://www.solace-harmonic.com/api/evaluate";

function normalizeDecision(value: unknown): GovernanceDecision {
  const normalized = String(value || "").toUpperCase();
  if (["ALLOW", "CONSTRAIN", "ESCALATE", "BLOCK"].includes(normalized)) {
    return normalized as GovernanceDecision;
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

function endpointForLane(lane: LaneName): { url?: string; key?: string } {
  if (lane === "harmonic") {
    return {
      url: process.env.HARMONIC_ONLY_API_URL || process.env.HARMONIC_API_URL || DEFAULT_HARMONIC_ONLY_API_URL,
      key: process.env.HARMONIC_ONLY_API_KEY || process.env.HARMONIC_API_KEY || process.env.HARMONIC_GOVERNANCE_API_KEY
    };
  }

  if (lane === "harmonic_governance") {
    return {
      url: process.env.HARMONIC_GOVERNANCE_API_URL || process.env.HARMONIC_API_URL || DEFAULT_HARMONIC_GOVERNANCE_API_URL,
      key: process.env.HARMONIC_GOVERNANCE_API_KEY || process.env.HARMONIC_API_KEY
    };
  }

  return {};
}

function buildGovernancePayload(params: {
  lane: LaneName;
  prompt: string;
  response: string;
  scenario: string;
}) {
  return {
    mode: params.lane,
    scenario: params.scenario,
    input: params.prompt,
    output: params.response,
    checks: [
      "truth",
      "compassion",
      "accountability",
      "reality_contact",
      "authority_continuity",
      "consequence_boundary",
      "runtime_admissibility"
    ],
    metadata: {
      client: "harmonic-governance-compare",
      version: "0.2.0"
    }
  };
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
      body: JSON.stringify(buildGovernancePayload(params))
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
        json.decision ||
          json.recommended_action ||
          json.recommendation ||
          json.status ||
          json.result ||
          json.outcome
      ),
      summary: getString(
        json.summary || json.reason || json.explanation || json.rationale,
        "External Harmonic governance evaluation completed."
      ),
      flags: getFlags(json.flags || json.warnings || json.findings || json.issues),
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
