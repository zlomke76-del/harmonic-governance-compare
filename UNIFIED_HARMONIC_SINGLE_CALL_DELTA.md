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
