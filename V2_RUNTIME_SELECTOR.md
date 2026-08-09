# Frozen V2 Runtime Selector

The Governance Compare harness can now target either:

- **Current V3** — the normal unified `/api/evaluate` endpoint.
- **Frozen V2 · 6a3a89f** — the frozen deployment's local `/api/v2/evaluate` endpoint.

## Required Vercel environment variable

Set:

`HARMONIC_V2_API_BASE_URL=https://<deployment-built-from-6a3a89f>`

Do not include `/api/v2/evaluate`; the harness appends it.

Optional dedicated key:

`HARMONIC_V2_API_KEY=...`

If omitted, the harness falls back to `HARMONIC_GOVERNANCE_API_KEY`, then `HARMONIC_API_KEY`.

## Integrity behavior

When Frozen V2 is selected, the harness refuses to accept a response whose `api_version` is not exactly `v2`.

The V2 request uses the frozen enterprise contract and embeds the same governance packet as `metadata.legacy_packet`, allowing the frozen V2 runtime to evaluate the same scenario without substituting V3 semantics.

No change is made to the frozen V2 runtime.


## Protected Vercel preview support

If the frozen V2 deployment is protected by Vercel Authentication, configure:

`HARMONIC_V2_VERCEL_BYPASS_SECRET=...`

Frozen V2 requests will then include:

- `x-vercel-protection-bypass`
- `x-vercel-set-bypass-cookie: true`

The bypass header is sent only to the Frozen V2 target. Current V3 requests are unchanged.
