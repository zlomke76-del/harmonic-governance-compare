# V59 Provider Model IDs Fix

## Goal
Keep the demo genuinely model-agnostic while ensuring every visible provider option routes through a valid Vercel AI Gateway model ID.

## Changes
- Google dropdown option changed from `google/gemini-3.1-flash` to `google/gemini-3.5-flash`.
- Mistral dropdown option changed from `mistral/mistral-large-latest` to `mistral/mistral-large-3`.
- Added compatibility aliases so old localStorage values still route correctly.
- Added same-provider fallback mapping for provider model lookup failures.
- Fallbacks remain within the selected provider family; they do not silently collapse to OpenAI.

## Provider fallbacks
- OpenAI -> `openai/gpt-4.1-mini`
- Anthropic -> `anthropic/claude-sonnet-5`
- Google -> `google/gemini-3.5-flash`
- xAI -> `xai/grok-4.3`
- Meta -> `meta/llama-4-maverick`
- Mistral -> `mistral/mistral-large-3`

## Files changed
- `app/page.tsx`
- `lib/openai.ts`
- `.env.example`
