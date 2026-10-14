# Architecture and boundaries

## Dedicated HA components

| Component | Responsibility | Current state |
|---|---|---|
| `ha-digital-agency-core` Cloudflare Worker | Small API surface, job orchestration, health/status, scheduled coordinator | Created and deployed; writes and scheduled processing intentionally disabled until runtime acceptance tests pass |
| `ha-digital-agency-db` Cloudflare D1 | Jobs, content assets, publishing attempts, research evidence, leads, proposal drafts, opt-outs, audit | Created fresh; live query verified all 11 expected application tables |
| `ha_digital_agency_automation` GitHub repository | Version-controlled Worker code, migrations, tests and later rendering automation | Seeded and committed; repository connection exists, but automatic Worker deployment still needs authorized build-token configuration |
| GitHub Actions | CI tests now; optional bounded media rendering later after quota/cost/licence review | Quality workflow exists; hosted CI passed on main (run #15; verify latest run before release) |
| Groq API | **Primary AI provider** for research summaries, content/caption drafts and proposal drafts | Architecture decision locked; API key/model configuration and a live non-production test are still required |
| Cloudflare Workers AI | Potential secondary fallback only after a separate model/limit test and approval | Not configured; do not silently fail over |
| Meta APIs | Official authorized Facebook/Instagram publishing | Not connected |

## AI provider decision

- Primary provider: Groq API using its OpenAI-compatible chat-completions interface.
- Keep the model ID configurable as `GROQ_MODEL`; verify the current active model list and free-tier limits before selecting a production default.
- Store `GROQ_API_KEY` only as a Cloudflare Worker secret; never place it in source, GitHub files, D1, logs, or screenshots.
- Do not enable a paid plan or billing. If the free-tier quota is exhausted or the API returns a rate-limit/error response, pause the affected job with a safe status and bounded retry; do not create a charge or switch providers silently.
- A secondary provider is not enabled until its licence, quota, privacy, cost and fallback behaviour are separately verified.
- Keep source URLs and retrieval timestamps with research-based claims; Groq generation alone is not evidence that a claim is true.

## Non-negotiable isolation

- Do not import, query, bind, call, or deploy to AI Tech Lab resources for HA features.
- The Worker settings must retain only the HA D1 binding unless a future, documented architecture decision is approved.
- The repository must be connected only to `ha-digital-agency-core`.
- No old content, leads, access tokens, database rows, secrets or account data are seeded into the new D1.

## Content pipeline boundaries

Research → source evidence → platform-specific draft → creative asset → quality gate → schedule → authorized Meta publish → verify provider ID/URL → report. Each stage should persist a job ID and idempotency key. A timeout with uncertain publish state must be checked against the provider before retrying.

Daily target calendar:
- Facebook: 2 feed posts + 1 Reel.
- Instagram: 2 feed posts + 1 Reel.
- **Reel duration: 30 seconds maximum**, checked by renderer and rechecked before publish.
- Common research can inspire both platforms, but do not blindly duplicate the same asset and caption across both accounts.

## Lead pipeline boundaries

Public business evidence → verify business and observable need → fit score → proposal draft → compliant channel draft → approval and opt-out tracking. There is no WhatsApp outreach channel in the schema. Avoid sensitive personal data and unsupported claims.

## Operational guardrails

- Idempotency keys prevent duplicate jobs and publishing attempts.
- Retry counts are bounded; repeated failures transition to held/failed state.
- Paid providers/billing remain off until the user explicitly approves.
- Heavy video rendering does not run inside a Worker request; a suitable runner must be selected and validated before enabling it.
- Do not enable Meta publishing until OAuth, permissions, token lifecycle, media requirements and a test publish have been verified.
