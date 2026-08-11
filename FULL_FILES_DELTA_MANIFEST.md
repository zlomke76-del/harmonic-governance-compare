# V73 Full Files Delta Manifest

This package contains the complete replacement contents for every source file changed by V73.

## Full replacement files

- `app/page.tsx`
- `app/api/compare/route.ts`
- `lib/types.ts`
- `lib/governance-adapter.ts`
- `V73_CUSTOM_STRUCTURED_WITNESS_DELTA.md`

## Integration rule

Replace the corresponding files in the prior repository with these full files. No partial patch application is required.

## Runtime boundary

V73 changes only the governance-compare harness/request construction and typing path. The Harmonic runtime/API implementation itself is not modified.
