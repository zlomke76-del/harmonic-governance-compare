# V31 Governance Compare Experience Delta

## Changed files
- `app/page.tsx`
- `app/styles.css`

## Upgrade summary
- Rebuilt the comparison harness into a premium demo experience.
- Added a branded top bar and readiness state.
- Added an execution-path visualization: User Input → LLM Model → Raw / Harmonic / Harmonic + Governance lanes.
- Added scenario presets for clinical discharge, enterprise refund, and financial wire cases.
- Reworked results into side-by-side governance cards with:
  - likely behavior
  - governed outcome
  - risk level
  - rationale
  - flags
  - full output drawer
  - primitive result drawer
  - raw governance artifact drawer
- Added loading state for comparison runs.
- Added explanation bar for same prompt, visible differences, explainable results, and safe-by-design positioning.
- Added responsive layouts for desktop, tablet, and mobile.
- Added reduced-motion support.

## Validation
- `npm run build` completed successfully.
