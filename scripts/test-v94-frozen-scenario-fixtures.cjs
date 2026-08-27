const fs=require("fs");
const fixtures=fs.readFileSync("lib/scenario-fixtures.ts","utf8");
const route=fs.readFileSync("app/api/compare/route.ts","utf8");
const adapter=fs.readFileSync("lib/governance-adapter.ts","utf8");
const assert=(v,m)=>{if(!v)throw new Error(m);};

const required=[
  "aviation-weather-minimums-change",
  "clinical-medication-order-discontinued",
  "clinical-consent-withdrawn",
  "pharmacy-formulary-recall",
  "finance-sanctions-list-update",
  "industrial-safety-interlock-change",
  "energy-lockout-tagout-update",
  "cyber-privileged-session-revoked",
  "autonomous-pedestrian-detected",
  "crane-wind-envelope",
  "production-database-target-drift"
];
for(const id of required) assert(fixtures.includes(`"${id}": fixture(`),`missing frozen fixture ${id}`);
assert(fixtures.includes("resolveFrozenScenarioFixture"),"fixture resolver missing");
assert(fixtures.includes("exact dropdown"),"freeze-integrity exact-prompt control missing");
assert(route.includes("const frozenFixture = resolveFrozenScenarioFixture"),"compare route does not resolve fixture");
assert(route.includes("allowHarnessInference: frozenFixture ? false"),"frozen fixture still permits exploratory inference");
assert(route.includes("frozenFixture?.realityWitness"),"reality witness not bound");
assert(route.includes("frozenFixture?.consequenceProfile"),"consequence profile not bound");
assert(route.includes("frozenFixture?.authorityProvenance"),"authority provenance not bound");
assert(route.includes("frozenFixture?.obligationWitness"),"obligation witness not bound");
assert(adapter.includes("v95-native-runtime-contract-normalization-2026-08-27"),"methodology version not advanced");
assert(!fixtures.includes("model_response"),"fixture definitions must not depend on model output");
console.log("V94 frozen structured scenario fixtures: PASS");
