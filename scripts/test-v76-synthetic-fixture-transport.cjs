const fs = require('fs');
const path = require('path');
const assert = require('assert');

const source = fs.readFileSync(path.join(__dirname, '..', 'lib', 'governance-adapter.ts'), 'utf8');

assert(source.includes('function deriveSyntheticFixtureWitness(prompt: string, scenario: string)'), 'synthetic fixture translator missing');
assert(source.includes('synthetic_test_fixture'), 'fixture provenance classification missing');
assert(source.includes('STIPULATED_SYNTHETIC_FIXTURE'), 'synthetic epistemic status missing');
assert(source.includes('bounded_operator_prompt_fixture_translation'), 'bounded fixture derivation marker missing');
assert(source.includes('synthetic_fixture_translated: Boolean(fixtureWitness)'), 'fixture transport witness missing');
assert(source.includes('const effectiveRequestedAction = params.requestedAction || fixtureWitness?.requestedAction'), 'explicit requested action precedence missing');
assert(source.includes('const effectiveAuthorityProvenance = params.authorityProvenance || fixtureWitness?.authorityProvenance'), 'explicit authority provenance precedence missing');
assert(source.includes('const effectiveStateProvenance = params.stateProvenance || fixtureWitness?.stateProvenance'), 'explicit state provenance precedence missing');
assert(source.includes('synthetic-fixture-transport'), 'synthetic fixture adapter build witness missing');

console.log('V76 synthetic fixture transport regression PASS');
