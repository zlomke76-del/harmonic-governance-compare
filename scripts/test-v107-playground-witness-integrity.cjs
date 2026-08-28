const fs = require("fs");
const path = require("path");
const read = (p) => fs.readFileSync(path.join(process.cwd(), p), "utf8");
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const adapter = read("lib/governance-adapter.ts");
const page = read("app/page.tsx");
const compare = read("app/api/compare/route.ts");
const replay = read("app/api/replay-exact/route.ts");
const types = read("lib/types.ts");

assert(adapter.includes('HARNESS_METHODOLOGY_VERSION = "v107-playground-witness-integrity-2026-08-28"'), "V107 methodology version missing");
assert(adapter.includes('understanding_witness_explicit: Boolean(params.understandingWitness)'), "understanding witness provenance missing");
assert(adapter.includes('Boolean(params.understandingWitness);'), "understanding witness omitted from explicit structured input classification");
assert(adapter.includes('"frozen_structured_fixture"') && adapter.includes('"explicit_structured_witness"'), "reality provenance classes are not separated");
assert(adapter.includes('source_class: "derived_projection_not_consequence_witness"'), "derived consequence projection remains mislabeled as witness evidence");
assert(adapter.includes('epistemic_status: "DERIVED_FROM_REQUESTED_ACTION"'), "derived consequence epistemic status missing");
assert(page.includes('allowHarnessInference: false'), "primary Playground still permits silent narrative inference");
assert(page.includes('Frozen fixture detached:'), "edited frozen prompt warning missing");
assert(page.includes('{ id: "v4_2", label: "Harmonic v4.2.0 · Frozen Primary"'), "v4.2 canonical UI target missing");
assert(types.includes('export type RuntimeTarget = "v4_2" | "v4_1" | "v4" | "v2";'), "v4.2 canonical runtime target / v4.1 compatibility alias missing");
assert(compare.includes('z.enum(["v4_2", "v4_1", "v4", "v2"]).default("v4_2")'), "v4.2 API default missing");
assert(replay.includes('Harmonic did not return a verifiable packet_id'), "exact replay does not fail when packet identity is unverifiable");
assert(replay.includes('if (observedPacketId !== packetId)'), "exact replay mismatch check missing");
assert(replay.includes('packet_id_match: true'), "exact replay verified identity witness missing");

console.log("V107 Playground witness-integrity regression: PASS");
