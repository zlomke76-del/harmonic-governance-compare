# V32 AI Execution Debugger Delta

This delta upgrades the Governance Compare harness from a form/results comparison into a live AI execution governance debugger.

## Changed files

- `app/page.tsx`
- `app/styles.css`

## Key upgrades

- Renames the results area from **Comparison Results** to **Live Evaluation**.
- Changes CTA from **Run comparison** to **Run live evaluation**.
- Adds a live governance decision scan panel / “AI execution MRI”.
- Adds animated execution path state while lanes are running.
- Adds progressive lane activation for User Input → LLM Model → Raw → Harmonic → Governance → Outcome.
- Reframes lane labels:
  - Without Governance
  - With Stabilization
  - With Constitutional Governance
- Adds outcome ribbons on each result card.
- Adds color language for Allow / Constrain / Escalate / Block / Unknown.
- Preserves collapsible full output, primitive results, and raw governance artifacts.
- Maintains reduced-motion accessibility behavior.

## Build validation

`npm run build` completed successfully.
