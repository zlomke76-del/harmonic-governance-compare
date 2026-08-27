const fs=require("fs");
const source=fs.readFileSync("lib/governance-adapter.ts","utf8");
const page=fs.readFileSync("app/page.tsx","utf8");
const compare=fs.readFileSync("app/api/compare/route.ts","utf8");
function assert(v,m){if(!v)throw new Error(m);}
assert(source.includes("function v40Endpoint()"),"missing frozen v4 resolver");
assert(source.includes('params.runtimeTarget === "v4" ? v40Endpoint() : unifiedEndpoint()'),"runtime target does not control endpoint");
assert(source.includes("HARMONIC_V40_API_URL"),"explicit V4.0 endpoint EV missing");
assert(source.includes("frozen-v4-endpoint-not-configured"),"V4.0 fail-closed provenance missing");
assert(page.includes('{ id: "v4_1", label: "Runtime 4.1 · Primary"'),"V4.1 is not primary option");
assert(page.includes('useState<RuntimeTarget>("v4_1")'),"V4.1 is not default runtime");
assert(compare.includes('z.enum(["v4_1", "v4", "v2"]).default("v4_1")'),"API default is not V4.1");
console.log("V92 runtime routing regression: PASS");
