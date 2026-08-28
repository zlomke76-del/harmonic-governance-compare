const fs = require("fs");
const path = require("path");
function read(p){ return fs.readFileSync(path.join(process.cwd(),p),"utf8"); }
function assert(c,m){ if(!c) throw new Error(m); }

const adapter=read("lib/governance-adapter.ts");
const route=read("app/api/compare/route.ts");
const page=read("app/page.tsx");

assert(adapter.includes("realityWitness?: GovernanceRealityWitness"), "reality witness not wired");
assert(adapter.includes("consequenceProfile?: GovernanceConsequenceProfile"), "explicit consequence profile not wired");
assert(adapter.includes('source_class: realitySourceClass'), "fixture evidence not explicitly labeled");
assert(adapter.includes("allowHarnessInference && !params.consequenceProfile"), "explicit consequence profile does not disable inference");
assert(route.includes("governedDisplayResponse"), "governed lane does not project Harmonic governed_response");
assert(route.includes("response: governedDisplayResponse(unified.harmonic_governance, params.response)"), "governed lane still displays raw candidate");
assert(page.includes('fixture://emergency-continuity-life-safety/v1'), "emergency fixture lacks explicit synthetic evidence");
assert(page.includes('type: "life_safety_emergency_execution"'), "emergency requested action is not explicit");
assert(page.includes('level: "critical"'), "emergency consequence profile is not explicit/critical");
assert(page.includes("allowHarnessInference: false"), "primary Playground must not silently enable harness inference");

console.log("V89 explicit fixture evidence regression: PASS");
