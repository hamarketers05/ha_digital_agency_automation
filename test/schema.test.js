import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const sql = await readFile(new URL("../migrations/0001_initial.sql", import.meta.url), "utf8");

test("initial migration defines all expected isolated tables", () => {
  for (const name of ["agency_jobs","content_assets","publish_attempts","research_sources","business_leads","lead_evidence","proposal_drafts","outreach_drafts","opt_outs","audit_log","app_settings"]) {
    assert.match(sql, new RegExp(`CREATE TABLE IF NOT EXISTS ${name}\\b`));
  }
});
test("migration enforces the 30-second maximum for Reels", () => assert.match(sql, /duration_seconds\s*<=\s*30/i));
test("outreach channels do not include WhatsApp", () => {
  assert.match(sql, /channel IN \('email','facebook','instagram','web_contact'\)/);
  assert.doesNotMatch(sql, /channel IN \([^)]*whatsapp/i);
});
test("jobs have idempotency and bounded retry constraints", () => {
  assert.match(sql, /idempotency_key TEXT NOT NULL UNIQUE/i);
  assert.match(sql, /max_attempts BETWEEN 1 AND 5/i);
});