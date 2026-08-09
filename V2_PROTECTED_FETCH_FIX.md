# Frozen V2 protected-deployment fetch fix

This patch changes only the Governance Compare harness.

For Frozen V2 calls, the Vercel automation bypass is now sent in both forms supported by the deployment-protection boundary:

- `x-vercel-protection-bypass` request header
- `x-vercel-protection-bypass` query parameter

The bypass-cookie directive is also sent as both header/query metadata.

Redirects are not followed automatically. A 3xx response is surfaced explicitly so the harness cannot silently leave the frozen V2 target.

If Node fetch fails before any HTTP response is received, the harness now reports:
- the target origin/path
- whether a bypass secret was configured
- the actual fetch error
- the underlying cause, when available

No frozen V2 source code is modified.
