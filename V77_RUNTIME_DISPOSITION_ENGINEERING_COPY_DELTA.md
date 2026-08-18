# V77 Runtime Disposition + Engineering Copy Delta

## Scope

This delta makes two presentation/usability changes without changing Harmonic decision logic, runtime contracts, or governance semantics.

### 1. Possible runtime dispositions are now explicitly inactive until returned

- Added a four-card `RuntimeDispositions` surface for `CONTINUE`, `CONSTRAIN`, `ESCALATE`, and `BLOCK`.
- The four cards are framed as the possible runtime dispositions, not four simultaneous results.
- Only the disposition corresponding to the current runtime decision illuminates.
- Non-returned dispositions remain visibly muted.
- Mapping remains presentation-only:
  - `ALLOW` → `CONTINUE`
  - `CONSTRAIN` → `CONSTRAIN`
  - `ESCALATE` / `EMERGENCY_CONTINUITY` → `ESCALATE`
  - `BLOCK` → `BLOCK`
  - `UNKNOWN` → no disposition illuminated

### 2. Engineering View can copy its complete data artifact

- Added a `Copy data` action directly in the Engineering View summary.
- The copied JSON includes evaluation identity/metadata, selected lane information, the rendered engineering key/value surface, and the complete raw runtime payload.
- Existing raw JSON rendering is preserved.

## Files changed

- `app/page.tsx`
- `app/styles.css`
- `V77_RUNTIME_DISPOSITION_ENGINEERING_COPY_DELTA.md`

## Non-goals

- No runtime intelligence added to the harness.
- No decision normalization beyond existing presentation mapping.
- No API schema changes.
- No changes to Harmonic constitutional determination behavior.
