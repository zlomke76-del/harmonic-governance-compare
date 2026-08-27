const fs = require('fs');
const source = fs.readFileSync('app/page.tsx', 'utf8');

if (!source.includes('label: "Consequence Level / Reversibility"')) throw new Error('missing consequence engineering-record row');
if (!source.includes(': "Not established"')) throw new Error('unestablished consequence surface must not display topology risk as established');
if (!source.includes('label: "Harness Advisory Classification"')) throw new Error('missing separate advisory classification row');
if (!source.includes('classifier.epistemic_status !== "INFERRED_ADVISORY_ONLY"')) throw new Error('advisory row must be provenance-gated');
if (!source.includes('classifier.governance_material !== false')) throw new Error('advisory row must require non-governance-material classification');
console.log('V99 consequence engineering-record visibility: PASS');
