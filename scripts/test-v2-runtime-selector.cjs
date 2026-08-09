const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..');
const adapter=fs.readFileSync(path.join(root,'lib/governance-adapter.ts'),'utf8');
const route=fs.readFileSync(path.join(root,'app/api/compare/route.ts'),'utf8');
const page=fs.readFileSync(path.join(root,'app/page.tsx'),'utf8');

function must(t,n){if(!t.includes(n))throw new Error('missing '+n)}
must(adapter,'function v2Endpoint()');
must(adapter,'HARMONIC_V2_API_BASE_URL');
must(adapter,'/api/v2/evaluate');
must(adapter,'function buildV2EnterprisePacket');
must(adapter,'metadata: {');
must(adapter,'legacy_packet: legacyPacket');
must(adapter,'if (params.runtimeTarget === "v2") return evaluateFrozenV2(params)');
must(adapter,'unexpected api_version');
must(adapter,'frozen_v2_transaction');

must(adapter,'HARMONIC_V2_VERCEL_BYPASS_SECRET');
must(adapter,'"x-vercel-protection-bypass": bypassSecret');
must(adapter,'"x-vercel-set-bypass-cookie": "true"');

must(route,'runtimeTarget: z.enum(["v3", "v2"]).default("v3")');
must(route,'Frozen V2 · 6a3a89f');
must(page,'Runtime under examination');
must(page,'setRuntimeTarget');
must(page,'runtimeTarget,');
console.log('Frozen V2 runtime selector regression: PASS');
