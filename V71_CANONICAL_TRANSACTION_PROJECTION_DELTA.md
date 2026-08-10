# V71 — Canonical Transaction Projection

## Purpose

Preserve the universal customer boundary by treating Harmonic's returned `constitutional_transaction` and `unified_transaction` as canonical response artifacts.

## Change

The V3 Governance Compare adapter now:

1. Reads `params.unified.constitutional_transaction` directly.
2. Uses that object unchanged as the Engineering View transaction when present.
3. Reconstructs the older compatibility transaction only when the canonical object is absent.
4. Applies the same canonical-first rule to `unified_transaction`.
5. Makes no additional Harmonic API calls.
6. Does not alter request-side scenario/domain classification or Harmonic's governed decision jurisdiction.

## Why

The production Harmonic determination already preserved a non-null V3+ dependency manifest/root, but the harness rebuilt an older transaction projection and therefore displayed `Dependency root not returned`. V71 removes that projection loss without changing Harmonic or the one-call contract.

## Invariant

> One `/api/evaluate` call. Harmonic returns the constitutional transaction. The external customer consumes it; the customer does not reconstruct Harmonic's evidence model when the canonical transaction is present.
