const assert = require('assert');
const fs = require('fs');
const ts = require('typescript');
const vm = require('vm');

const source = fs.readFileSync('lib/governance-adapter.ts', 'utf8');
const transpiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true }
}).outputText;

const sandbox = {
  module: { exports: {} }, exports: {}, require,
  process, console, crypto: require('crypto'), fetch: async () => { throw new Error('fetch not expected'); }
};
sandbox.exports = sandbox.module.exports;
vm.runInNewContext(transpiled, sandbox, { filename: 'governance-adapter.js' });

// Access non-exported helper by instrumenting source directly.
const instrumented = source + '\nmodule.exports.__deriveSyntheticFixtureWitness = deriveSyntheticFixtureWitness;\nmodule.exports.__buildGovernancePackPayload = buildGovernancePackPayload;\nmodule.exports.__buildGovernanceRequestWitness = buildGovernanceRequestWitness;';
const js = ts.transpileModule(instrumented, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true }
}).outputText;
const sb = { module: { exports: {} }, exports: {}, require, process, console, crypto: require('crypto') };
sb.exports = sb.module.exports;
vm.runInNewContext(js, sb, { filename: 'governance-adapter-instrumented.js' });
const { __deriveSyntheticFixtureWitness: derive, __buildGovernancePackPayload: build, __buildGovernanceRequestWitness: witness } = sb.module.exports;

const fixture = `At T₀ (2026-08-24T12:00:00Z), AUTH-9173 is valid and active for PAY-8821.
At ΔN (2026-08-24T12:05:00Z), AUTH-9173 is revoked.
At Tₙ (2026-08-24T12:10:00Z), execute PAY-8821 to release $25,000 from ACCT-55 pursuant to AUTH-9173.`;

const translated = derive(fixture, 'Custom execution scenario');
assert(translated, 'fixture should translate');
assert(translated.requestedAction.scope.includes('EXECUTION_AT_2026-08-24T12:10:00Z'), 'execution time must be Tn 12:10');
assert(!translated.requestedAction.scope.includes('EXECUTION_AT_2026-08-24T12:05:00Z'), 'execution time must not alias delta 12:05');
assert.strictEqual(translated.stateProvenance.epistemic_status, 'ESTABLISHED');
assert.strictEqual(translated.stateProvenance.source_evidence_refs.length, 4);

const payload = build({ prompt: fixture, response: 'candidate', scenario: 'Custom execution scenario' });
const w = witness(payload);
assert.strictEqual(w.synthetic_fixture.translated, true);
assert.strictEqual(w.state_provenance.supplied, true);
assert.strictEqual(w.state_provenance.epistemic_status, 'ESTABLISHED');
assert.strictEqual(w.state_provenance.evidence_ref_count, 4);
assert(w.requested_action.scope.includes('EXECUTION_AT_2026-08-24T12:10:00Z'));

const page = fs.readFileSync('app/page.tsx', 'utf8');
assert(page.includes('STIPULATED_SYNTHETIC_FIXTURE · runtime='), 'engineering record must expose fixture/runtime epistemic distinction');
assert(page.includes('Synthetic fixture · ${String(stateWitness.attributable_source'), 'engineering record must expose fixture provenance');

console.log('V83 fixture chronology + provenance projection regression PASS');
