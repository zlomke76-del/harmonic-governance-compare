# V63 Continuity Visual Fix Delta

## Purpose
This delta makes the core Harmonic Governance Compare demo illustrate the real failure mode: the LLM recommendation can be correct at T0, but become stale before execution because continuity changes.

## Changed files

- `app/page.tsx`
- `app/styles.css`
- `V63_CONTINUITY_VISUAL_FIX_DELTA.md`

## What changed

### Continuity language
- Renamed the runtime concept from generic "Continuity collapsed" to **Execution Continuity Broken**.
- Added a top-level recommendation validity state:
  - `CURRENT`
  - `AT RISK`
  - `STALE`
  - `PENDING`

### Timeline behavior
The timeline now explicitly shows recommendation aging:

1. **T0 Recommendation created** — answer is current at creation time.
2. **T1 Continuity condition changed** — reality/evidence/authority/runtime condition changes.
3. **T2 Execution requested** — recommendation is now Current, At Risk, or Stale depending on runtime outcome.
4. **T3 Runtime decision** — constitutional runtime binds Continue, Constrain, Escalate, or Block.

### UI polish
- Added a **Recommendation Status** seal beside the continuity gap.
- Added timeline badges such as `🟢 Current`, `⚠ Reality changed`, `🔴 Stale`, and `Runtime: Block`.
- Added distinct visual treatment for stale timeline state.
- Elevated the thesis callout:

> The recommendation was not necessarily wrong. It became stale because continuity changed before execution.

### Engineering lineage
Updated artifact lineage to temporal form:

`T0 Recommendation Created → T1 Reality Changed → T2 Execution Requested → T3 Constitutional Runtime → T4 Execution Decision`

## Architectural note
This delta reinforces that Harmonic is not primarily correcting one-shot LLM answers. It is governing continuity across the transition from recommendation to execution.
