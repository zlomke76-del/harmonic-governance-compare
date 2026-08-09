# Harmonic Governance Compare — Frozen V2 Vercel Bypass

Base: harness with Frozen V2 runtime selector.

## Fix

When `HARMONIC_V2_VERCEL_BYPASS_SECRET` is configured, Frozen V2 requests send:

- `x-vercel-protection-bypass`
- `x-vercel-set-bypass-cookie: true`

The bypass is applied only to Frozen V2 calls. Current V3 behavior is unchanged.

Required Vercel env on the compare harness:
`HARMONIC_V2_VERCEL_BYPASS_SECRET=...`

Regression:
`npm run test:v2-runtime-selector`
