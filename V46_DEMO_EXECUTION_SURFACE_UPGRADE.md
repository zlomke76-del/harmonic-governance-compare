# V46 Demo Execution Surface Upgrade

## Purpose
Upgrade the Governance Compare demo to align with the V45 Harmonic Core primitive execution-surface upgrade.

## Changes
- Added execution-surface classification in the demo adapter payload builder.
- Added `autonomous_navigation` / autonomous mobility surface detection.
- Bridge closure / route update scenarios now send critical autonomous navigation context to Governance Pack instead of generic `ai_continuation` context.
- Added scenario samples:
  - Mobility · Autonomous navigation
  - Healthcare · Medication allergy update
  - Enterprise IT · Production database delete
- Governance Pack decision parsing now prefers synthesized final decisions, response-binding decisions, execution boundary fields, and primitive-derived outcomes before falling back to top-level artifact labels.
- Added primitive-derived fallback decisions:
  - `AUTHORITY_LOST` / `INADMISSIBLE` -> `BLOCK`
  - `ESCALATION_REQUIRED` / `BOUNDARY_CRITICAL` -> `ESCALATE`
  - `CONDITIONALLY_ADMISSIBLE` / `BOUNDARY_ELEVATED` -> `CONSTRAIN`
- Demo now labels result cards as `Execution decision` instead of `Governed outcome`.

## Expected behavior
- Legal filing -> Harmonic `CONSTRAIN`; Governance `CONSTRAIN`
- Industrial vibration -> Harmonic `CONSTRAIN`; Governance `ESCALATE`
- Clinical discharge / allergy updates -> Harmonic `CONSTRAIN`; Governance `ESCALATE`
- Financial wire with revoked authority -> Governance `BLOCK`
- Autonomous navigation with bridge closure -> Harmonic `CONSTRAIN`; Governance non-allowing, typically `ESCALATE`

## Validation
Dependencies were not installed in the uploaded ZIP, so a Next build could not be executed in the sandbox. The patch is source-only and should build once dependencies are installed.
