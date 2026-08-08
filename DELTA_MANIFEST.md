# Harmonic Governance Compare — Unified Single-Call Delta

Base: `harmonic-governance-compare-main (12).zip`

The harness now demonstrates Harmonic vs Harmonic+ from one Harmonic API transaction.

- Raw lane: separate model response, no Harmonic runtime call.
- Governed candidate: one model response.
- One POST to `/api/evaluate`.
- Harmonic panel: returned `harmonic` layer.
- Harmonic+ panel: returned `governance` layer.
- Both governed panels use the same candidate response and same attributable runtime transaction.

Canonical environment:
- `HARMONIC_API_URL=https://www.solace-harmonic.com/api/evaluate`
- `HARMONIC_API_KEY=...`

Legacy Harmonic-specific URL/key variables remain fallback-compatible.
No SQL migration required.

Regression: `npm run test:unified-harmonic`
