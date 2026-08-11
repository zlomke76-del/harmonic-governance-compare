# V74 Explicit Constitutional Witness Delta

## Purpose
V74 closes the remaining custom-scenario witness gap exposed by the T0 continuity baseline qualification run.

## Defects corrected
1. The request witness previously reported `requested_action.supplied=true` even when the harness had silently generated the default requested action. V74 records whether the action witness was explicitly supplied by the operator.
2. Custom scenarios had no explicit structured obligation witness. V74 adds one and gives it precedence over bounded prompt-derived obligation hints.
3. Custom scenarios had no explicit present-state provenance witness. V74 adds a source-bounded provenance object and preserves whether it was explicitly supplied.
4. Consequence classification previously continued to use the generic inferred execution surface even when a structured requested action was supplied. V74 uses the structured requested-action type as the execution surface when available.
5. The T0 baseline template previously populated only a subset of the constitutional witness set and required a separate prompt paste. V74 makes the template one-click: scenario name, prompt, requested action, authority provenance, continuity, obligation, present-state provenance, and downstream accountability are loaded together.

## Claim boundary
- The harness does not infer authority, obligation, or present-state provenance from free text.
- `present_state_provenance` is passed explicitly to the external Harmonic API. Whether the remote runtime consumes that field into its canonical present-state binding remains an external-runtime behavior to observe, not a harness claim.
- The request witness distinguishes explicitly supplied fields from harness defaults.
- No Harmonic runtime logic was modified in this repo.

## Qualification expectation
After loading the complete T0 payment baseline and executing it, the Engineering View request witness should show explicit structured witnesses for requested action, authority provenance, obligation, state provenance, and downstream accountability. If the remote runtime still reports missing state provenance, preserve that result as a runtime-contract/evidence-surface limitation rather than fabricating a PASS.
