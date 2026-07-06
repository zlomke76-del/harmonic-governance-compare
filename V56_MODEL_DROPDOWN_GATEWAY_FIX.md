# V56 Model Dropdown / Gateway Safety Fix

## Problem
The demo listed cross-provider LLM routes in the dropdown even when the deployed project was not configured to use those routes successfully. Selecting Claude/Gemini/Meta could fail while the OpenAI route worked.

## Fix
- Default dropdown now shows OpenAI-safe model routes only.
- Cross-provider models are gated behind:
  - `NEXT_PUBLIC_ENABLE_CROSS_PROVIDER_MODELS=true`
- Updated cross-provider model IDs to current Vercel AI Gateway-style routes.
- Added UI guidance under the model selector.
- Added server-side model normalization so OpenAI fallback does not receive `openai/...` prefixed model IDs.
- Added clearer LLM error messages when a selected route is not enabled in Vercel AI Gateway.

## Deployment
In Vercel, keep the flag unset/false for the stable demo.
Only set `NEXT_PUBLIC_ENABLE_CROSS_PROVIDER_MODELS=true` after confirming Claude/Gemini/Meta routes work in Vercel AI Gateway.
