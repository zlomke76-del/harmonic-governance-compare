# V107 — Playground Witness Integrity Delta

Date: 2026-08-28

This delta fixes the QA seams exposed by independent Playground falsification testing without weakening Harmonic's explicit-witness execution boundary.

## Runtime behavior preserved

Harmonic remains the disposition authority. Narrative text is context only on the primary Playground path and is not promoted into present authority, reality, obligation, understanding, or consequence evidence.

## Changes

1. Custom explicit reality witnesses are labeled `explicit_structured_witness`; frozen fixture reality is labeled `frozen_structured_fixture`.
2. `understandingWitness` participates in explicit-structured methodology classification and is disclosed in witness metadata.
3. Editing a predefined frozen prompt visibly detaches the frozen structured fixture and warns the tester before execution.
4. The primary Playground no longer silently enables natural-language constitutional inference for legacy predefined scenarios.
5. Consequence data mechanically projected from `requested_action` is labeled as a derived projection, not as a supplied consequence witness.
6. Canonical primary runtime target is `v4_2`; `v4_1` remains accepted only as a compatibility alias at the API/type boundary.
7. Exact packet replay now fails closed if Harmonic omits a verifiable returned `packet_id`, as well as when the returned ID mismatches.
8. Regression assertions were updated where they referenced superseded methodology/version labels.

## Validation

`test:v107-witness-integrity` passes, together with the current V87, V89, V92, V94, V95b, V100 and exact-replay regression checks.

Some much older archival regression scripts in the repository still encode superseded pre-hardening behavior (for example narrative obligation translation and synthetic prompt-derived fixtures). Those were not used as the correctness standard for V107 because restoring those behaviors would contradict the current explicit-witness contract.
