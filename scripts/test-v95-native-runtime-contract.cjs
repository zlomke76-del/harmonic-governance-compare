const fs=require("fs");
const src=fs.readFileSync("lib/governance-adapter.ts","utf8");
const fixture=fs.readFileSync("lib/scenario-fixtures.ts","utf8");
const assert=(v,m)=>{if(!v)throw new Error(m);};

assert(src.includes("function buildNativeAuthorityContract"),"native authority projection missing");
assert(src.includes("authority_chain:"),"authority_chain not emitted");
assert(src.includes("revocation_state:"),"revocation_state not emitted");
assert(src.includes("subject: currentActor"),"authority subject missing");
assert(src.includes("issuer: issuerActor"),"authority issuer missing");
assert(src.includes("scope: grantedScope"),"authority scope missing");
assert(src.includes('last_verified_at: "TN_FIXTURE"'),"authority verification witness missing");
assert(src.includes('last_revocation_check_at: "TN_FIXTURE"'),"revocation witness missing");
assert(src.includes("function nativeObligationRequest"),"native obligation projection missing");
assert(src.includes("The mandatory requirement has not been satisfied."),"unsatisfied obligation grammar missing");
assert(src.includes('...(nativeObligation ? { request: nativeObligation } : {})'),"obligation request not serialized");
assert(src.includes("function buildNativeStateProvenance"),"state provenance projection missing");
assert(src.includes("evidence_refs: witness.source_evidence_refs"),"native evidence refs missing");
assert(src.includes("fixture_epistemic_status: witness.epistemic_status"),"fixture status not preserved");
assert(src.includes("v95-native-runtime-contract-normalization-2026-08-27"),"methodology version missing");
assert(src.includes("model_response_used_as_observed_reality: false"),"model output isolation regressed");
assert(fixture.includes('"industrial-safety-interlock-change": fixture('),"industrial fixture missing");
assert(fixture.includes('"aviation-weather-minimums-change": fixture('),"aviation fixture missing");

console.log("V95 native runtime contract normalization: PASS");
