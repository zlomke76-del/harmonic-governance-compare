# V71 Canonical Transaction Projection — Full Files Delta

Complete replacement/new files, with repository-relative paths preserved:

- `lib/governance-adapter.ts`
- `scripts/test-v3-canonical-transaction-projection.cjs`
- `package.json`
- `V71_CANONICAL_TRANSACTION_PROJECTION_DELTA.md`

## Deployment

Overlay these files onto the current Governance Compare `main` branch. No database migration is required.

## Contract preserved

- One customer-facing `POST /api/evaluate` call.
- Harmonic is sole source of the V3 governed execution disposition.
- Harmonic's returned `constitutional_transaction` is canonical when present.
- Legacy compatibility reconstruction is fallback-only.
- Frozen V2 path is unchanged.
