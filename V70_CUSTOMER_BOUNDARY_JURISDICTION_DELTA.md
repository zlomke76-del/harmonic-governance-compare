# V70 Customer Boundary Jurisdiction Delta

## Purpose

Make Governance Compare a clean reference external integration of Harmonic.

The harness may classify scenario/domain/consequence facts in order to construct the request sent to Harmonic. It must not independently determine the governed execution disposition after the universal API response is returned.

## Invariant

For the current universal V3 path:

```text
Harness/domain system
  -> constructs attributable request facts
  -> POST /api/evaluate
  -> Harmonic returns governed execution disposition
  -> harness obeys/renders that returned disposition
```

The harness does not combine Harmonic's result with a local `mostRestrictiveDecision`, local execution-context decision, or locally synthesized primitive decision.

## Changed files

- `lib/governance-adapter.ts`
- `scripts/test-v3-customer-boundary-jurisdiction.cjs`
- `package.json`

## Scope

This delta changes the current universal V3 projection path only. Frozen V2 behavior remains preserved for historical comparison.
