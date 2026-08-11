# V73 Custom Structured Witness Delta

## Purpose

Fix the custom-scenario harness boundary so operator-authored narrative is not silently substituted for structured constitutional evidence.

## Defect exposed

The custom scenario path previously forced `governanceFacts`, `authorityProvenance`, and `downstreamAccountability` to `undefined`. The governance packet therefore could contain prose asserting valid authority while the authoritative structured witness remained absent. The default requested-action scope was also derived from the scenario label, making isolated scope tests unreliable.

## Changes

- Added explicit custom-scenario JSON inputs for:
  - requested action witness;
  - authority provenance witness;
  - continuity facts witness;
  - downstream accountability witness.
- Added a T0 payment witness template to support the bounded continuity experiment without inferring authority from prose.
- Added `GovernanceRequestedAction` to the typed request contract and API validation.
- The governance adapter now uses the explicit requested action when supplied instead of forcing `scope: [scenario]`.
- The harness request witness now reports whether requested-action structure was supplied, including type and scope.
- Adapter build witness advanced to `v73-custom-structured-witness-2026-08-10`.

## Boundary preserved

- Harmonic runtime/API implementation is unchanged.
- The harness does not infer authority, provenance, or accountability from natural language.
- Present-state source provenance is not invented by the harness. If the current runtime contract does not receive or return sufficient provenance, that epistemic limitation remains visible in the resulting transaction.
- Blank custom witness fields remain omitted rather than synthesized.

## Validation note

Static source-path review confirms the structured values propagate:

`Custom UI -> /api/compare -> evaluateUnifiedGovernance -> buildGovernancePackPayload -> requested_action / authority_provenance / continuity / downstream_accountability -> harness_request_witness`

A local Next.js build could not be completed in the isolated container because project dependencies were not present and package installation did not complete within the environment timeout. Deployment CI should run the normal production build before promotion.
