# Harmonic Governance Compare — Governance Key Precedence Fix

Base: `harmonic-governance-compare-main (13).zip`

## Fix

The unified single-call harness now:

- calls only `/api/evaluate`
- prefers `HARMONIC_GOVERNANCE_API_KEY`
- falls back to `HARMONIC_API_KEY`
- never falls back to `HARMONIC_GOVERNANCE_API_URL`

This ensures that when both base Harmonic and Harmonic+ credentials are configured,
the single transaction authenticates with the governance-entitled credential and
can persist the constitutional determination and receipt.

No SQL migration required.

Regression:
`npm run test:unified-harmonic`
