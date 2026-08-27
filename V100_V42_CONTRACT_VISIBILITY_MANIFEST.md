# V100 — Harmonic v4.2.0 Contract Visibility

## Purpose
Bind harness-visible evaluation records to the frozen Harmonic v4.2.0 release without changing runtime routing or governance behavior.

## Full replacement files
- `app/page.tsx`
- `app/api/compare/route.ts`
- `lib/types.ts`
- `scripts/test-v92-runtime-routing.cjs`
- `scripts/test-v93-fresh-primary-runtime.cjs`
- `scripts/test-v100-v42-contract.cjs`
- `package.json`

## Visible contract
- Harmonic Release: `v4.2.0`
- Governance Contract: `4.2`
- Visibility Schema: `4.2`
- Release Classification: `GOVERNANCE_VISIBILITY_UPGRADE`

## Compatibility note
The internal runtime selector ID remains `v4_1` intentionally so this visibility upgrade does not alter the existing live endpoint routing contract. The user-facing frozen release identity is v4.2.0.

## Behavioral scope
No governance semantics, packet construction, evidence promotion, or execution-boundary behavior is changed by this delta.
