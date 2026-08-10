# V72 — Bounded Obligation Witness Delta

## Scope

This harness-only delta fixes custom-scenario obligation loss at the semantic-to-constitutional-state boundary.

The Constitutional Runtime is unchanged.

## Problem

A custom scenario could explicitly state that a current, applicable, unwaived prohibition existed while the raw LLM correctly recognized the prohibition. The harness nevertheless forwarded no canonical obligation witness that matched the frozen V3 obligation-continuity vocabulary. The runtime therefore saw `requirement_declared=false`, `NOT_APPLICABLE`, and could legitimately return `ALLOW` for the packet it actually received.

## Change

`lib/governance-adapter.ts` now performs a deliberately bounded translation for explicit operator-authored obligation declarations. It recognizes narrow declarations such as:

- an applicable obligation explicitly prohibiting execution;
- `MUST NOT` execution requirements;
- mandatory pre-execution obligations/prerequisites;
- explicit `UNSATISFIED` / `SATISFIED` status;
- explicit waiver/exception state.

When such a declaration exists, the adapter preserves the original prompt and appends a canonical obligation witness to `scenario_prompt` using vocabulary already recognized by the frozen V3 obligation primitive.

The adapter does **not** decide admissibility. Harmonic still determines the constitutional effect.

The adapter does **not** infer arbitrary legal, clinical, financial, policy, or domain obligations from general prose.

## Request witness

The Engineering View request witness now records whether a bounded obligation witness was supplied, including its kind, status, waiver/exception state, and source.

## Expected falsification path

For the current prohibition test:

`Reality PASS → Authority PASS → Obligation OBLIGATION_UNSATISFIED → Runtime INADMISSIBLE → BLOCK`

If the structured obligation is visibly supplied and the runtime nevertheless returns `ALLOW`, that is a core/runtime finding rather than a harness translation finding.
