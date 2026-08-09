# Frozen V2 protected-deployment fetch fix

This patch changes only the Governance Compare harness. Frozen V2 source remains untouched.

## Vercel protection handshake

Frozen V2 requests send the automation-bypass value as both:

- `x-vercel-protection-bypass` header
- `x-vercel-protection-bypass` query parameter

The first protected request may legitimately return `307` to the same route with a
`Set-Cookie` header. Browser clients handle that automatically; Node's server-side
`fetch` does not maintain a cookie jar.

The harness now:

1. Sends the original POST with the bypass header/query parameter.
2. If Vercel returns `307` plus `Set-Cookie`, captures only the cookie pair.
3. Replays the exact same POST once to the returned location with that cookie.
4. Refuses any unresolved additional redirect.
5. Preserves detailed pre-response network diagnostics.

No Case 003 inputs or frozen V2 implementation code are modified.
