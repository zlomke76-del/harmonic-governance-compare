# V33 Favicon + Metadata Delta

## Changes

- Added `app/favicon.svg` so Next.js App Router can discover and serve the favicon automatically.
- Updated `app/layout.tsx` metadata to reference the SVG favicon directly.
- Removed references to unavailable `/favicon.ico`, `/apple-touch-icon.png`, and `/og-image.png` assets to avoid broken browser/social preview requests.
- Restored the page-specific title: `Harmonic Governance Compare`.
- Added `viewport.themeColor` for a more polished browser/mobile chrome color.

## Files changed

- `app/layout.tsx`
- `app/favicon.svg`

## Validation

Attempted `npm run build`, but the uploaded ZIP does not include installed dependencies and the sandbox returned `next: not found`. The TypeScript/Next metadata changes are syntactically aligned with Next.js App Router conventions.
