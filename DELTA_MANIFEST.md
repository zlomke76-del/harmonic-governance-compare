# Harmonic Governance Compare — Frozen V2 Runtime Selector

Base: `harmonic-governance-compare-main (14).zip`

## Change

The harness can now explicitly target:
- Current V3
- Frozen V2 · 6a3a89f

Frozen V2 mode sends the governed candidate once to:
`HARMONIC_V2_API_BASE_URL + /api/v2/evaluate`

The V2 response must identify `api_version: v2`; otherwise the harness refuses it.

The same comparison UI projects Harmonic and Harmonic+ from that single frozen V2 transaction.

No changes are made to frozen V2 itself.

## Vercel environment

Required:
`HARMONIC_V2_API_BASE_URL=https://<6a3a89f-deployment>`

Optional:
`HARMONIC_V2_API_KEY=...`

If the dedicated V2 key is omitted, credential fallback is:
`HARMONIC_GOVERNANCE_API_KEY` → `HARMONIC_API_KEY` → `HARMONIC_ONLY_API_KEY`.

Regression:
`npm run test:v2-runtime-selector`
