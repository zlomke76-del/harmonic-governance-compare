const fs = require("fs");
const path = require("path");

const adapter = fs.readFileSync(path.join(process.cwd(), "lib/governance-adapter.ts"), "utf8");
const route = fs.readFileSync(path.join(process.cwd(), "app/api/compare/route.ts"), "utf8");
const page = fs.readFileSync(path.join(process.cwd(), "app/page.tsx"), "utf8");

function assert(cond, msg) { if (!cond) throw new Error(msg); }

assert(adapter.includes('HARNESS_METHODOLOGY_VERSION = "v107-playground-witness-integrity-2026-08-28"'), "current methodology version missing");
assert(adapter.includes("HARNESS_METHODOLOGY_HASH"), "methodology hash missing");
assert(adapter.includes("canonical_packet:"), "canonical packet witness missing");
assert(adapter.includes("sha256Canonical(packet)"), "canonical packet SHA-256 missing");
assert(adapter.includes("export: packet"), "canonical packet export missing");
assert(!adapter.includes("function decisionFromExecutionContext("), "obsolete local disposition helper remains");
assert(!adapter.includes("function mostRestrictiveDecision("), "obsolete local disposition helper remains");
assert(!adapter.includes("function decisionFromPrimitiveResults("), "obsolete local disposition helper remains");
assert(adapter.includes("allowHarnessInference = params.allowHarnessInference === true"), "inference is not opt-in");
assert(adapter.includes("allow_harness_inference: allowHarnessInference"), "inference provenance missing");
assert(adapter.includes("freshness_stamped_by_harness: false"), "freshness invariant missing");
assert(adapter.includes("whole_prompt_promoted_to_current_reality: false"), "prompt/reality invariant missing");
assert(adapter.includes("used_as_observed_reality: false"), "model-response isolation missing");
assert(route.includes("allowHarnessInference: z.boolean().default(false)"), "API default must be explicit-witness-first");
assert(page.includes("allowHarnessInference: false"), "primary Playground must disable silent natural-language inference");

console.log("V87 falsification integrity regression: PASS");
