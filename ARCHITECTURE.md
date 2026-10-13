# Architecture and boundaries

## Dedicated HA components

| Component | Responsibility | Current state |
|---|---|---|
| `ha-digital-agency-core` Cloudflare Worker | Small API surface, job orchestration, health/status, scheduled coordinator | Created; writes and scheduled processing disabled |
| `ha-digital-agency-db` Cloudflare D1 | Jobs, content assets, publishing attempts, research evidence, leads, proposal drafts, opt-outs, audit | Created fresh; runtime SQL probe pending quota reset |
| `ha_digital_agency_automation` GitHub repository | Version-controlled Worker code, migrations, tests and later rendering automation | Public repository exists; files are being seeded; Cloudflare build connection not yet verified |
| GitHub Actions | CI tests now; optional bounded media rendering later after quota/cost/licence review | Quality workflow included; rendering not enabled |
| Meta APIs | Official authorized Facebook/Instagram publishing | Not connected |

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
