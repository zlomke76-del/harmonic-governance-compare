# Unified Harmonic / Harmonic+ Single-Call Harness

The comparison harness now uses one Harmonic runtime transaction for both governed panels.

- Raw lane: separate model response, no Harmonic runtime call.
- Governed candidate: one model response.
- Runtime: one POST to `/api/evaluate`.
- Harmonic panel: projected from the returned `harmonic` layer.
- Harmonic+ panel: projected from the returned `governance` layer.
- Both governed panels therefore describe the same candidate response and the same attributable transaction.

Canonical environment:
- `HARMONIC_API_URL=https://www.solace-harmonic.com/api/evaluate`
- `HARMONIC_API_KEY=...`

Legacy Harmonic-specific URL/key environment variables remain fallback-compatible. No database migration is required.


## Governance-entitled credential precedence

The unified comparison now prefers `HARMONIC_GOVERNANCE_API_KEY` over the base
`HARMONIC_API_KEY`.

This matters when both credentials are configured: the single `/api/evaluate`
request must authenticate with the Harmonic+ entitlement in order to activate
the constitutional layer and persist the determination and receipt.

The request still uses only `/api/evaluate`; the retired direct
`/api/governance-pack` route is not used by the comparison harness.
