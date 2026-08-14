# V75 Exact Packet Replay Delta

## Purpose

Add an intentionally non-intelligent evidence replay path to the Governance Compare harness so preserved `/api/evaluate` packets can be transmitted without scenario translation.

## Boundary

Exact Packet Replay does **not**:

- invoke an LLM to construct the packet;
- infer domain facts from narrative;
- construct authority, revocation, understanding, state, obligation, or consequence witnesses;
- rename, add, remove, normalize, or reinterpret constitutional fields;
- replace the existing scenario harness.

The operator supplies a complete JSON object with an explicit `packet_id`. The harness validates JSON syntax and the existence of `packet_id`, then forwards the original JSON text unchanged as the HTTP request body to the configured Harmonic `/api/evaluate` endpoint.

## Integrity witnesses

The replay route records:

- submitted `packet_id`;
- returned `packet_id` where present;
- packet-ID equality;
- SHA-256 of the exact outbound UTF-8 body;
- byte length of the exact outbound body;
- `semantic_translation_performed: false`;
- `llm_involved_in_packet_construction: false`.

If Harmonic returns a packet ID that differs from the submitted packet ID, the replay route stops with an integrity error rather than presenting the response as a successful replay.

## Files

- `app/api/replay-exact/route.ts`
- `app/page.tsx`
- `app/styles.css`
- `lib/governance-adapter.ts`
- `scripts/test-v75-exact-packet-replay.cjs`
- `package.json`

## Architectural intent

The scenario harness remains intentionally bounded and non-authoritative. Exact Packet Replay is even narrower: it is a transparent transport surface for already-structured constitutional facts. Domain intelligence remains outside Harmonic and outside the harness.
