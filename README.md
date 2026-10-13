# HA Digital Agency Automation

A separate, free-first automation foundation for HA Digital Agency.

## Safety status
- Dedicated Cloudflare Worker: `ha-digital-agency-core`
- Dedicated Cloudflare D1 database: `ha-digital-agency-db`
- Facebook/Instagram publishing and outreach are not enabled by this starter.
- No WhatsApp outreach.
- Generated Reels must be 30 seconds or shorter.
- Never commit API tokens, OAuth tokens, or other secrets.

## Repository layout
- `src/index.js`: Worker API and health/status endpoints
- `migrations/0001_initial.sql`: D1 schema
- `test/`: local schema and Worker checks
- `wrangler.toml`: isolated Worker configuration
- `PROJECT_STATUS.md`: verified status and blockers
- `ARCHITECTURE.md`: boundaries and planned components

## Local checks
Requires Node.js 20+:
```sh
npm install
npm test
```

Deployment must target only `ha-digital-agency-core` and `ha-digital-agency-db`. Keep secrets in Cloudflare secret bindings, not Git. Publishing, OAuth, scheduled generation, and outbound lead contact remain disabled until separately configured and verified.