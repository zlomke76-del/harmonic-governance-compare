const fs = require('fs');
const adapter = fs.readFileSync('lib/governance-adapter.ts', 'utf8');
const route = fs.readFileSync('app/api/compare/route.ts', 'utf8');
const page = fs.readFileSync('app/page.tsx', 'utf8');
function ok(cond, msg) { if (!cond) { console.error('FAIL:', msg); process.exit(1); } }
ok(adapter.includes('contract: "single_api_call"'), 'transaction must declare single-call contract');
ok(adapter.includes('constitutional_transaction: constitutionalTransaction'), 'same response must expose constitutional transaction');
ok(adapter.includes('"NOT_EXERCISED"'), 'explicit NOT_EXERCISED semantics required');
ok(!adapter.includes('/api/v3/replay?') && !adapter.includes('/api/v3/projections?') && !adapter.includes('/api/v3/determination-currency?'), 'initial V3 path must not orchestrate lifecycle endpoints');
ok((adapter.match(/await fetch\(url,/g) || []).length >= 1, 'unified runtime fetch missing');
ok(route.includes('evaluateUnifiedGovernance'), 'compare route must use unified evaluator');
ok(page.includes('Universal single call · /api/evaluate'), 'Engineering View must surface universal API contract');
ok(page.includes('Projection Integrity') && page.includes('Transaction Digest') && page.includes('Determination Currency'), 'Engineering View missing V3+ reconstruction surfaces');
console.log('PASS: V3 universal single-call harness contract');
