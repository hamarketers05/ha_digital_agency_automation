import test from "node:test";
import assert from "node:assert/strict";
import worker, { MAX_REEL_DURATION_SECONDS } from "../src/index.js";
const env = { DB: {} };

test("health is read-only and keeps publishing disabled", async () => {
 const response = await worker.fetch(new Request("https://example.test/health"), env);
 const body = await response.json();
 assert.equal(response.status, 200);
 assert.equal(body.ok, true);
 assert.equal(body.worker, "ha-digital-agency-core");
 assert.equal(body.publishing_enabled, false);
 assert.equal(body.outbound_outreach_enabled, false);
});
test("reel duration requirement is fixed at 30 seconds", () => assert.equal(MAX_REEL_DURATION_SECONDS, 30));
test("unknown paths return 404", async () => {
 const response = await worker.fetch(new Request("https://example.test/not-a-route"), env);
 assert.equal(response.status, 404);
});
test("write routes are disabled during foundation phase", async () => {
 const response = await worker.fetch(new Request("https://example.test/api/jobs", { method: "POST" }), env);
 assert.equal(response.status, 405);
});
test("status endpoint fails closed when database is not available", async () => {
 const broken = { DB: { prepare() { throw new Error("simulated failure"); } } };
 const response = await worker.fetch(new Request("https://example.test/api/status"), broken);
 const body = await response.json();
 assert.equal(response.status, 200);
 assert.equal(body.components.database.status, "temporarily_unverified");
 assert.equal(body.guardrails.reel_max_duration_seconds, 30);
});