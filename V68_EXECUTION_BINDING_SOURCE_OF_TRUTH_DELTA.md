# V68 Execution Binding Source of Truth Delta

Purpose: remove UI/runtime divergence where the page could display `BLOCK` while the governance artifact's governed execution binding says `ESCALATE`.

## Core fix

`lib/governance-adapter.ts` now treats `response_binding` as the authoritative execution decision for the Governance Pack lane.

Decision precedence for `harmonic_governance` is now:

1. `response_binding.final_decision`
2. `response_binding.decision_label`
3. `response_binding.mode`
4. `response_binding.runtime_action` / `execution_action`
5. `execution_boundary` booleans
6. fallback package/direct outcome fields

Once an authoritative binding is present, local primitive severity heuristics no longer upgrade `ESCALATE` to `BLOCK`.

## Why this matters

The runtime may determine that a critical consequence requires `ESCALATE` rather than `BLOCK` when reality and authority remain intact but continuation authority must transfer before action. The UI must project that binding exactly.

## Included files

- `lib/governance-adapter.ts`
- `app/page.tsx`
- `app/styles.css`

The app files are included to preserve the current execution-console UI in case the uploaded repo contains placeholder page/style files.
