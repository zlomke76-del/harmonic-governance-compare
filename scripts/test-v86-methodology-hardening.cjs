const fs = require("fs");
const path = require("path");
const assert = require("assert");

const root = path.join(__dirname, "..");
const adapter = fs.readFileSync(path.join(root, "lib", "governance-adapter.ts"), "utf8");
const compare = fs.readFileSync(path.join(root, "app", "api", "compare", "route.ts"), "utf8");

function between(text, startMarker, endMarker) {
  const start = text.indexOf(startMarker);
  assert(start >= 0, `Missing start marker: ${startMarker}`);
  const end = text.indexOf(endMarker, start);
  assert(end > start, `Missing end marker: ${endMarker}`);
  return text.slice(start, end);
}

const payloadBuilder = between(
  adapter,
  "function buildGovernancePackPayload",
  "function buildGovernanceRequestWitness"
);

assert(
  payloadBuilder.includes("response: params.response"),
  "Candidate response must be bound as the top-level proposed response."
);
assert(
  !payloadBuilder.includes("\n    observed_reality:"),
  "Harness must not manufacture observed_reality from model output."
);
assert(
  !payloadBuilder.includes("current_state_claims: [params.prompt]"),
  "Whole prompt must not be promoted to current-state claims."
);
assert(
  !payloadBuilder.includes("last_verified_at: now"),
  "Packet construction time must not masquerade as evidence verification time."
);
assert(
  payloadBuilder.includes('response: ""'),
  "Execution-context classification must exclude model response wording."
);
assert(
  payloadBuilder.includes('model_response_used_as_observed_reality: false'),
  "Witness must explicitly prove model-response isolation."
);
assert(
  payloadBuilder.includes('freshness_stamped_by_harness: false'),
  "Witness must explicitly prove freshness was not manufactured."
);
assert(
  payloadBuilder.includes('whole_prompt_promoted_to_current_reality: false'),
  "Witness must explicitly prove prompt narrative was not promoted to present reality."
);

const v2Projection = between(
  adapter,
  "function evaluationFromV2Artifact",
  "async function evaluateFrozenV2"
);
assert(
  v2Projection.includes("const decision = artifactDecision;"),
  "Frozen V2 projection must preserve the runtime disposition."
);
assert(
  !v2Projection.includes("mostRestrictiveDecision("),
  "Frozen V2 projection must not synthesize a local disposition."
);

const legacyEvaluation = adapter.slice(adapter.indexOf("export async function evaluateGovernance"));
assert(
  legacyEvaluation.includes("const decision = artifactDecision;"),
  "Legacy external evaluation must preserve the runtime disposition."
);
assert(
  !legacyEvaluation.includes("mostRestrictiveDecision("),
  "Legacy external evaluation must not synthesize a local disposition."
);

const modelCalls = (compare.match(/callSameLlm\(/g) || []).length;
assert.strictEqual(
  modelCalls,
  1,
  "Compare route must generate one candidate response, not separate raw/governed candidates."
);
assert(
  compare.includes("response: candidate"),
  "The same generated candidate must be projected into raw and governed lanes."
);

console.log("PASS v86 methodology hardening");
console.log(" - one candidate across raw/governed lanes");
console.log(" - model response isolated from governance evidence");
console.log(" - no harness freshness fabrication");
console.log(" - prompt narrative not promoted to present reality");
console.log(" - runtime disposition preserved without local fallback synthesis");
