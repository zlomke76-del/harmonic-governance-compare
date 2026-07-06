# V34 Favicon Serving Delta

Fixes favicon serving for `https://studio.solace-harmonic.com`.

## What changed

- Adds `public/favicon.svg` so `/favicon.svg` is actually served by Next.js.
- Updates `app/layout.tsx` metadata to reference only the real SVG favicon.
- Removes references to missing assets:
  - `/favicon.ico`
  - `/apple-touch-icon.png`
  - `/og-image.png`

## Why

The previous repo had `favicon.svg` at the project root. Next.js does not serve arbitrary root files as public assets. Because the metadata referenced `/favicon.svg`, the browser requested `https://studio.solace-harmonic.com/favicon.svg`, but that file was not available unless it lived in `public/favicon.svg`.

## Deploy note

After deploying, test directly:

`https://studio.solace-harmonic.com/favicon.svg`

If that URL loads the SVG, the favicon is wired correctly. Browser tabs may still cache old favicons, so test in an incognito window or hard refresh.
