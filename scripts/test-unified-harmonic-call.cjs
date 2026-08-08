const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..');
const adapter=fs.readFileSync(path.join(root,'lib/governance-adapter.ts'),'utf8');
const route=fs.readFileSync(path.join(root,'app/api/compare/route.ts'),'utf8');
function must(text,needle,msg){if(!text.includes(needle))throw new Error(msg+': '+needle)}
function mustNot(text,needle,msg){if(text.includes(needle))throw new Error(msg+': '+needle)}
must(adapter,'DEFAULT_HARMONIC_API_URL = "https://www.solace-harmonic.com/api/evaluate"','unified endpoint missing');
mustNot(adapter,'DEFAULT_HARMONIC_GOVERNANCE_API_URL = "https://www.solace-harmonic.com/api/governance-pack"','direct Governance Pack endpoint must be retired from harness');
must(adapter,'export async function evaluateUnifiedGovernance','unified projection function missing');
must(adapter,'asRecord(params.unified.harmonic)','Harmonic layer not projected from unified response');
must(adapter,'asRecord(params.unified.governance)','Harmonic+ layer not projected from unified response');
must(adapter,'v3.5-unified-single-call-2026-08-08','single-call witness missing');
must(route,'runUnifiedGovernedLanes','unified lane runner missing');
must(route,'const unified = await evaluateUnifiedGovernance','route does not make unified governance call');
mustNot(route,'lanes.map((lane)','old per-lane governance fanout still present');
if((route.match(/evaluateUnifiedGovernance\(/g)||[]).length!==1)throw new Error('compare route must invoke unified Harmonic evaluation exactly once');
console.log('Unified Harmonic/Harmonic+ single-call harness regression: PASS');
