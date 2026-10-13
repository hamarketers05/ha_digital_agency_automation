const VERSION = "0.1.0-foundation";
const SERVICE = "HA Digital Agency Automation";
const WORKER_NAME = "ha-digital-agency-core";
export const MAX_REEL_DURATION_SECONDS = 30;

const EXPECTED_TABLES = [
  "agency_jobs", "content_assets", "publish_attempts", "research_sources",
  "business_leads", "lead_evidence", "proposal_drafts", "outreach_drafts",
  "opt_outs", "audit_log", "app_settings",
];

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store, max-age=0",
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
      "x-frame-options": "DENY",
      "content-security-policy": "default-src 'none'; frame-ancestors 'none'",
    },
  });
}

async function inspectDatabase(db) {
  if (!db) return { configured: false, status: "binding_missing", verified_tables: 0 };
  try {
    const placeholders = EXPECTED_TABLES.map(() => "?").join(",");
    const result = await db.prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name IN (${placeholders})`).bind(...EXPECTED_TABLES).all();
    const names = new Set((result.results || []).map((row) => row.name));
    const missing = EXPECTED_TABLES.filter((name) => !names.has(name));
    return { configured: true, status: missing.length === 0 ? "ready" : "schema_incomplete", expected_tables: EXPECTED_TABLES.length, verified_tables: names.size, missing_tables: missing };
  } catch {
    return { configured: true, status: "temporarily_unverified", expected_tables: EXPECTED_TABLES.length, verified_tables: null, note: "A D1 query could not complete. Check account quota and retry after it resets." };
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { allow: "GET, HEAD, OPTIONS", "cache-control": "no-store", "x-content-type-options": "nosniff" } });
    if (request.method !== "GET" && request.method !== "HEAD") return json({ ok: false, error: "method_not_allowed", message: "Write and execution endpoints are intentionally disabled in the foundation phase." }, 405);

    if (url.pathname === "/" || url.pathname === "/health") return json({
      ok: true, service: SERVICE, worker: WORKER_NAME, version: VERSION, mode: "foundation",
      database_binding_configured: Boolean(env.DB), schema_status: "created_pending_runtime_probe",
      publishing_enabled: false, outbound_outreach_enabled: false,
      reel_max_duration_seconds: MAX_REEL_DURATION_SECONDS, timezone: "Asia/Karachi",
      note: "New isolated HA project. Publishing remains disabled until schema, auth, and platform permissions are verified.",
    });

    if (url.pathname === "/api/status") return json({
      ok: true, service: SERVICE, version: VERSION,
      components: { worker: "online", database: await inspectDatabase(env.DB), scheduled_content_generation: "not_enabled", media_rendering: "not_enabled", meta_authorization: "not_connected", publishing: "disabled_by_default", lead_outreach: "draft_only_not_enabled" },
      guardrails: { reel_max_duration_seconds: MAX_REEL_DURATION_SECONDS, idempotent_jobs_required: true, retries_bounded: true, whatsapp_outreach: "prohibited", paid_billing: "requires_user_approval" },
      timestamp: new Date().toISOString(),
    });
    return json({ ok: false, error: "not_found" }, 404);
  },
  async scheduled(controller) {
    console.log(JSON.stringify({ event: "scheduled_tick_held", service: SERVICE, version: VERSION, scheduled_time: new Date(controller.scheduledTime).toISOString(), reason: "foundation_guardrail_not_enabled" }));
  },
};