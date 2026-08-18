# V78 Full Files Delta Manifest

Complete replacement files in this delta:

- `app/page.tsx`
  - Adds the four-card Possible Runtime Dispositions UI.
  - Keeps all four possible dispositions visible while only the returned runtime disposition receives the active visual state.
  - Leaves all cards dormant before a result exists.
  - Maps `EMERGENCY_CONTINUITY` to the constrained visual lane without changing runtime semantics.
  - Adds a visible `Copy data` control inside Engineering View.
  - Copy payload includes evaluation metadata, selected lane result, engineering record fields, and raw runtime payload.

- `app/styles.css`
  - Adds dormant/active disposition card styling.
  - Adds returned-disposition glow/border/background treatment.
  - Adds Engineering View copy toolbar styling and responsive behavior.

No API contract, runtime determination logic, or harness inference behavior was changed.
