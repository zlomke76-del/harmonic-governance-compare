const fs = require('fs');
const path = require('path');
const assert = require('assert');

const source = fs.readFileSync(path.join(__dirname, '..', 'lib', 'governance-adapter.ts'), 'utf8');

assert(source.includes('function deriveObligationHints(prompt: string)'), 'bounded obligation translator missing');
assert(source.includes('bounded_custom_scenario_translation'), 'bounded translation provenance missing');
assert(source.includes('[HARMONIC HARNESS OBLIGATION WITNESS]'), 'canonical obligation witness not appended to scenario_prompt');
assert(source.includes('The mandatory requirement has not been satisfied.'), 'unsatisfied canonical witness missing');
assert(source.includes('No waiver or exception is active.'), 'waiver/exception witness missing');
assert(source.includes('obligation_witness: obligationHint'), 'structured obligation request witness missing');
assert(source.includes('adapter_build: "v72-bounded-obligation-witness-2026-08-10"'), 'adapter build witness not updated');

console.log('V72 bounded obligation witness regression PASS');
