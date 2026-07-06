# V57 Provider Adapter True Source Delta

This source delta restores the model-agnostic demo behavior.

## Changed files
- `app/page.tsx`
- `lib/openai.ts`
- `app/api/compare/route.ts`
- `.env.example`

## What changed
- All model providers remain visible in the dropdown.
- Removed the `NEXT_PUBLIC_ENABLE_CROSS_PROVIDER_MODELS` gate.
- Added Gateway-first runtime normalization.
- Supports both `VERCEL_AI_GATEWAY_API_KEY` and `AI_GATEWAY_API_KEY`.
- Uses Vercel AI Gateway OpenAI-compatible `/v1/chat/completions` routing for provider-prefixed model IDs.
- Keeps OpenAI direct fallback for OpenAI-only local/dev execution.
- Improves error copy so failures point to Gateway model enablement instead of telling users to select OpenAI.

## Important
Cross-provider models require Vercel AI Gateway access to the selected model route. Harmonic's constitutional evaluation remains unchanged regardless of the selected LLM.
