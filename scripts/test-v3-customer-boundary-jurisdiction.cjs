const fs = require('fs');
const adapter = fs.readFileSync('lib/governance-adapter.ts', 'utf8');
function ok(cond, msg) { if (!cond) { console.error('FAIL:', msg); process.exit(1); } }

const start = adapter.indexOf('function evaluationFromUnifiedArtifact');
const end = adapter.indexOf('function evaluationFromV2Artifact');
ok(start >= 0 && end > start, 'unified artifact projection block missing');
const unifiedProjection = adapter.slice(start, end);

ok(unifiedProjection.includes('const decision = decisionFromArtifact(layer);'),
  'universal V3 projection must use Harmonic artifact decision as sole governed result');
ok(!unifiedProjection.includes('mostRestrictiveDecision('),
  'universal V3 projection must not combine Harmonic with a local most-restrictive decision');
ok(!unifiedProjection.includes('decisionFromExecutionContext('),
  'universal V3 projection must not derive the governed decision from local scenario classification');
ok(!unifiedProjection.includes('decisionFromPrimitiveResults('),
  'universal V3 projection must not independently synthesize the governed decision from primitive results');

// Request-side classification remains allowed: the external customer still has to
// describe the consequence/context it wants Harmonic to govern.
ok(adapter.includes('const context = classifyExecutionContext(params);'),
  'request-side execution context classification should remain available');
ok(adapter.includes('DEFAULT_HARMONIC_API_URL = "https://www.solace-harmonic.com/api/evaluate"'),
  'customer-facing universal endpoint missing');

console.log('PASS: V3 customer-boundary jurisdiction — request facts local, governed decision Harmonic-only');
