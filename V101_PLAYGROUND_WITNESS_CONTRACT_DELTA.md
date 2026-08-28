# V101 Playground Witness Contract Delta

## Purpose
Correct the Playground/UI contract exposed by external QA testing: narrative prompt/scenario changes were visually presented as constitutional-state changes even when the v4.2 runtime correctly received no new structured witnesses.

## Changes
- Rename `Constitutional Pattern` to `Test Pattern`; the selector filters scenario families and does not modify the Harmonic constitution.
- Mark structured constitutional witnesses as required to establish constitutional facts in custom live evaluation.
- State explicitly that narrative text is context only and is not promoted into authority, reality, obligation, understanding, or provenance.
- Add `obligationWitness` to the page-level scenario type and forward it when a predefined scenario explicitly carries one.
- Refresh the stale V87 regression assertion to recognize the current V95 methodology version while preserving all V87 integrity assertions.

## Architectural invariant
No prose-to-witness promotion was added. Harmonic remains explicit-witness-first and fail-closed when required present-state facts are unestablished.

## QA provenance
This delta responds to the independent Harmonic Playground QA report received 2026-08-28. It fixes the harness semantics; it does not weaken or bypass the Harmonic runtime contract.
