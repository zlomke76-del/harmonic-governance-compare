# Harmonic Governance Compare — V3 Authority History Harness Full-Files Delta

Base: `harmonic-governance-compare-main (11).zip`
Date: 2026-08-08

## Purpose

Wire the Governance Compare harness to transmit V3 institutional authority chronology and downstream-accountability evidence to Harmonic instead of testing the V3 scenario through the legacy prompt-only/V2 witness path.

## Complete replacement files

1. `lib/types.ts`
   - Adds typed V3 authority actors, authority-history events, authority provenance, and downstream-accountability structures.

2. `app/api/compare/route.ts`
   - Accepts optional `authorityProvenance` and `downstreamAccountability` request objects.
   - Passes them through unchanged to the governance adapter.

3. `lib/governance-adapter.ts`
   - Sends the supplied structures to Governance Pack as `authority_provenance` and `downstream_accountability`.
   - Upgrades the harness witness identifier to `v3-authority-history-witness-2026-08-08`.
   - Records whether authority history, original authority, authority change, current authority, enforcement layer, next decision owner, and consequence owner were actually transmitted.
   - Does not infer or manufacture missing institutional history.

4. `app/page.tsx`
   - Adds a built-in `V3 NDA Authority History` pressure scenario using the same institutional chronology as the V3 core pressure test.
   - Sends the scenario's structured authority provenance and downstream accountability with the compare request.

## Deliberately not changed

- Authority primitive semantics (`AUTHORITY_LOST` vs `AUTHORITY_TRANSFER_REQUIRED`).
- NDA/legal consequence-topology classification.
- V2 emergency-continuity evidence-chain logic.

Those remain separate findings so the V3 rerun changes only the missing structured-history input path.

## Validation note

A dependency-complete Next.js build could not be run in this isolated environment because the uploaded archive did not include `node_modules` or a lockfile and the configured package mirror did not provide the required dependencies. Static TypeScript parsing was run; no new non-environment TypeScript errors were surfaced in the changed API/adapter/type files. Existing page-level type diagnostics remain tied to absent React/Next type packages in the isolated environment.
