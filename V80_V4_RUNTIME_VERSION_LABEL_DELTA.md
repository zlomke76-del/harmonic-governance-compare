# V80 — V4 runtime version label delta

## Modified full files
- `app/page.tsx`

## Change
Engineering View now distinguishes the platform runtime version from component build lineage:

- **Runtime Version** is sourced from `raw.runtime_version` (falling back to the V4 transaction model version).
- **Governance Pack** shows the component semver only (for example `1.9.0`).
- **Governance Pack Build** preserves the exact runtime-returned artifact identifier (for example `1.9.0-v3.9-artifact-coherence`).

The raw runtime payload is unchanged and remains copied verbatim in the structured engineering artifact. No runtime result, hash, primitive version, or constitutional evidence is rewritten by the UI.
