const fs = require('fs');
const adapter = fs.readFileSync('lib/governance-adapter.ts', 'utf8');
function ok(cond, msg) { if (!cond) { console.error('FAIL:', msg); process.exit(1); } }

const start = adapter.indexOf('function evaluationFromUnifiedArtifact');
const end = adapter.indexOf('function evaluationFromV2Artifact');
ok(start >= 0 && end > start, 'unified artifact projection block missing');
const unifiedProjection = adapter.slice(start, end);

ok(unifiedProjection.includes('const returnedConstitutionalTransaction = asRecord(params.unified.constitutional_transaction);'),
  'V3 harness must read Harmonic canonical constitutional_transaction directly');
ok(unifiedProjection.includes('returnedConstitutionalTransaction || fallbackConstitutionalTransaction'),
  'canonical returned constitutional transaction must take precedence over compatibility reconstruction');
ok(unifiedProjection.includes('const returnedUnifiedTransaction = asRecord(params.unified.unified_transaction);'),
  'V3 harness must read Harmonic unified_transaction directly');
ok(unifiedProjection.includes('returnedUnifiedTransaction || {'),
  'canonical returned unified transaction must take precedence over compatibility reconstruction');
ok(unifiedProjection.includes('constitutional_transaction: constitutionalTransaction'),
  'raw Engineering View artifact must expose the canonical/fallback transaction');
ok(!unifiedProjection.includes('constitutionalTransaction = fallbackConstitutionalTransaction'),
  'fallback transaction must never unconditionally replace Harmonic canonical transaction');

console.log('PASS: V3 canonical transaction projection — Harmonic response preserved, fallback only for legacy compatibility');
