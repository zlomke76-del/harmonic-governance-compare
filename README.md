# Harmonic Governance Compare

Internal demo harness for comparing the same LLM across three lanes:

1. **Raw LLM** — no governance constraints.
2. **Harmonic Only** — model output is evaluated by Harmonic `/api/evaluate`.
3. **Harmonic + Governance** — model output is evaluated by Governance Pack `/api/governance-pack`.

The goal is to show the geometry:

> Same model. Same prompt. Different bindings. Different execution behavior.

## Required Vercel environment variables

In Vercel Project Settings → Environment Variables, add:

```bash
VERCEL_AI_GATEWAY_API_KEY=your_vercel_ai_gateway_key
VERCEL_AI_GATEWAY_MODEL=openai/gpt-4.1-mini
HARMONIC_API_KEY=your_hs_live_key
HARMONIC_API_URL=https://www.solace-harmonic.com/api/evaluate
HARMONIC_GOVERNANCE_API_URL=https://www.solace-harmonic.com/api/governance-pack
```

The minimum required Harmonic variable is usually:

```bash
HARMONIC_API_KEY=your_hs_live_key
```

The code defaults are:

```bash
HARMONIC_API_URL=https://www.solace-harmonic.com/api/evaluate
HARMONIC_GOVERNANCE_API_URL=https://www.solace-harmonic.com/api/governance-pack
```

## API packet shapes

### Harmonic-only lane

Sends exactly:

```json
{
  "response": "model output",
  "consequence_level": "high"
}
```

### Harmonic + Governance lane

Sends a Governance Pack packet:

```json
{
  "packet_id": "clinical-discharge-uuid",
  "requested_action": { "type": "clinical_order", "scope": ["clinical-discharge"] },
  "declared_reality": {
    "current_state_claims": ["original prompt"],
    "last_verified_at": "ISO timestamp"
  },
  "observed_reality": {
    "signals": [{ "statement": "model output" }]
  },
  "authority_chain": {
    "subject": "llm-agent-1",
    "issuer": "harmonic-governance-compare",
    "scope": ["clinical-discharge"],
    "last_verified_at": "ISO timestamp",
    "chain": [
      { "actor": "llm-agent-1", "status": "active" },
      { "actor": "harmonic-governance-compare", "status": "active" }
    ]
  },
  "revocation_state": { "last_revocation_check_at": "ISO timestamp" },
  "consequence_profile": {
    "level": "high",
    "reversibility": "partially_reversible",
    "execution_surface": "clinical_order"
  },
  "safeguards": { "operator_review_confirmed": false }
}
```

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Security note

Do not commit live `hs_live_*` keys. Use `.env.local` locally and Vercel Environment Variables in production. If a live key has been pasted into chat, treat it as exposed and rotate it after testing.

## Endpoint adapter

The external Harmonic/Governance Pack endpoint contract is isolated in:

```text
lib/governance-adapter.ts
```

If the live Governance Pack endpoint returns additional fields, they are preserved under each lane's `evaluation.raw` value in the API response.
