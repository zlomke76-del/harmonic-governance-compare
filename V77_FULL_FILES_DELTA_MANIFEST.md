# V77 Full Files Delta Manifest

## Purpose

Full-file delivery for the runtime disposition activation and Engineering View copy-data changes.

## Complete changed files

- `app/page.tsx`
- `app/styles.css`
- `V77_RUNTIME_DISPOSITION_ENGINEERING_COPY_DELTA.md`
- `V77_FULL_FILES_DELTA_MANIFEST.md`

## Behavioral delta

1. The four runtime disposition cards are explicitly presented as possible outcomes.
2. Only the disposition returned by the active evaluation illuminates; the other three remain muted.
3. `UNKNOWN` does not falsely illuminate any disposition.
4. Engineering View includes `Copy data`, copying a structured JSON artifact containing evaluation metadata, lane state, the engineering row projection, and the exact raw runtime response.
5. Copying does not alter or infer runtime data and does not add intelligence to the harness.

## Validation note

Source-level validation was completed. A local Next build could not be run in this sandbox because the supplied archive did not include `node_modules` and dependency installation did not complete within the sandbox time limit. No dependency or package-version changes were made.
