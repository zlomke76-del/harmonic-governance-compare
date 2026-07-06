# V35 Model + Scenario Flexibility + Favicon Wiring Delta

## What changed

- Added an LLM model selector to the Scenario Configuration panel.
- Added model-agnostic positioning copy: “Harmonic governs execution independently of the underlying model.”
- Added a broader sample scenario library:
  - Clinical discharge
  - Enterprise refund
  - Financial wire
  - Security response
  - Legal filing
  - Industrial control
  - Build your own
- Added custom scenario name support.
- Added prompt placeholder guidance for custom scenarios.
- Updated the comparison API to accept a per-run `model` value.
- Updated OpenAI/Vercel AI Gateway adapter to support model overrides.
- Strengthened favicon serving:
  - `public/favicon.svg`
  - `app/favicon.svg`
  - `app/icon.svg`
  - metadata cache-busted with `/favicon.svg?v=35`
- Added `.env.example` guidance for cross-provider model routing through Vercel AI Gateway.

## Notes

For alternate providers such as Anthropic, Google, Meta/Llama, or other Gateway model IDs, run through Vercel AI Gateway. The direct OpenAI fallback supports OpenAI-compatible model names only.

## Build

A build could not be validated in this sandbox because dependencies were not installed (`next` unavailable). Apply the delta, run `npm install` if needed, then `npm run build`.
