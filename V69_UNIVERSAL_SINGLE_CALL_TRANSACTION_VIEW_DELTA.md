# V69 — Universal Single-Call Constitutional Transaction View

## Invariant
The harness remains a consumer of one universal governed runtime call: `POST /api/evaluate`.
It MUST NOT call replay, projection, receipt, or determination-currency lifecycle endpoints to assemble the initial determination.

## Change
The existing unified response is projected into a self-describing `constitutional_transaction` for both governed comparison lanes. The Engineering View now surfaces present-state provenance, epistemic status, semantic determination + identity, dependency root, determination currency, execution status, receipt identity, replay status/range identity, transaction digest, and projection integrity when returned by the runtime.

Missing optional evidence is rendered explicitly (`NOT_PROVIDED`, `NOT_EXERCISED`, or `Not returned`) rather than silently promoted to PASS.

## Boundary
Lifecycle operations after the initial determination may still use dedicated APIs. They are not part of the initial harness evaluation path.
