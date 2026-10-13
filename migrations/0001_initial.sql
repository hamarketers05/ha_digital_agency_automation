-- HA Digital Agency only. Run only on its dedicated, empty D1 database.
CREATE TABLE IF NOT EXISTS agency_jobs (
 id TEXT PRIMARY KEY, job_type TEXT NOT NULL CHECK(job_type IN ('research','content_draft','graphic_render','video_render','publish','analytics','lead_research','proposal_draft','maintenance')),
 status TEXT NOT NULL DEFAULT 'queued' CHECK(status IN ('queued','running','succeeded','failed','held','cancelled')),
 idempotency_key TEXT NOT NULL UNIQUE, payload_json TEXT NOT NULL DEFAULT '{}',
 attempts INTEGER NOT NULL DEFAULT 0 CHECK(attempts >= 0), max_attempts INTEGER NOT NULL DEFAULT 3 CHECK(max_attempts BETWEEN 1 AND 5),
 run_after_ms INTEGER NOT NULL, last_error_code TEXT, last_error_summary TEXT,
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL, finished_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_agency_jobs_due ON agency_jobs(status, run_after_ms);
CREATE TABLE IF NOT EXISTS content_assets (
 id TEXT PRIMARY KEY, content_key TEXT NOT NULL UNIQUE, platform TEXT NOT NULL CHECK(platform IN ('facebook','instagram')),
 asset_type TEXT NOT NULL CHECK(asset_type IN ('feed_post','carousel','reel')), topic TEXT NOT NULL, hook TEXT,
 caption TEXT NOT NULL DEFAULT '', asset_url TEXT, asset_sha256 TEXT, duration_seconds REAL,
 source_urls_json TEXT NOT NULL DEFAULT '[]', qa_json TEXT NOT NULL DEFAULT '{}',
 status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','qa_pending','approved','scheduled','publishing','published','held','failed')),
 scheduled_at TEXT, published_at TEXT, platform_publish_id TEXT, published_url TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
 CHECK(asset_type <> 'reel' OR duration_seconds IS NULL OR (duration_seconds > 0 AND duration_seconds <= 30))
);
CREATE INDEX IF NOT EXISTS idx_content_schedule ON content_assets(platform, status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_content_hash ON content_assets(asset_sha256);
CREATE TABLE IF NOT EXISTS publish_attempts (
 id TEXT PRIMARY KEY, content_id TEXT NOT NULL REFERENCES content_assets(id) ON DELETE RESTRICT,
 platform TEXT NOT NULL CHECK(platform IN ('facebook','instagram')), attempt_number INTEGER NOT NULL CHECK(attempt_number BETWEEN 1 AND 5),
 idempotency_key TEXT NOT NULL UNIQUE, status TEXT NOT NULL CHECK(status IN ('started','succeeded','failed','unknown')),
 provider_code TEXT, safe_error_summary TEXT, provider_publish_id TEXT, published_url TEXT, created_at TEXT NOT NULL, finished_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_publish_content ON publish_attempts(content_id, created_at);
CREATE TABLE IF NOT EXISTS research_sources (
 id TEXT PRIMARY KEY, url TEXT NOT NULL UNIQUE, title TEXT, domain TEXT, evidence_summary TEXT NOT NULL,
 source_published_at TEXT, retrieved_at TEXT NOT NULL, reliability_score INTEGER CHECK(reliability_score BETWEEN 0 AND 100), created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS business_leads (
 id TEXT PRIMARY KEY, business_name TEXT NOT NULL, website_url TEXT, public_contact_url TEXT, country TEXT, region TEXT, industry TEXT,
 observed_need TEXT NOT NULL, fit_score INTEGER CHECK(fit_score BETWEEN 0 AND 100),
 status TEXT NOT NULL DEFAULT 'research_needed' CHECK(status IN ('research_needed','verified','proposal_draft','contacted','replied','not_fit','opted_out')),
 verified_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS lead_evidence (
 id TEXT PRIMARY KEY, lead_id TEXT NOT NULL REFERENCES business_leads(id) ON DELETE CASCADE, source_url TEXT NOT NULL,
 evidence_type TEXT NOT NULL, evidence_summary TEXT NOT NULL, observed_at TEXT NOT NULL, UNIQUE(lead_id, source_url, evidence_type)
);
CREATE TABLE IF NOT EXISTS proposal_drafts (
 id TEXT PRIMARY KEY, lead_id TEXT NOT NULL REFERENCES business_leads(id) ON DELETE CASCADE, service_fit TEXT NOT NULL,
 proposal_text TEXT NOT NULL, evidence_urls_json TEXT NOT NULL DEFAULT '[]',
 status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','reviewed','approved','archived')), created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS outreach_drafts (
 id TEXT PRIMARY KEY, lead_id TEXT NOT NULL REFERENCES business_leads(id) ON DELETE CASCADE,
 channel TEXT NOT NULL CHECK(channel IN ('email','facebook','instagram','web_contact')), draft_text TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','approved','sent','cancelled','blocked')), created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS opt_outs (
 id TEXT PRIMARY KEY, contact_hash TEXT NOT NULL, channel TEXT NOT NULL CHECK(channel IN ('email','facebook','instagram','web_contact')),
 reason TEXT, created_at TEXT NOT NULL, UNIQUE(contact_hash, channel)
);
CREATE TABLE IF NOT EXISTS audit_log (
 id TEXT PRIMARY KEY, event_type TEXT NOT NULL, entity_type TEXT, entity_id TEXT,
 outcome TEXT NOT NULL CHECK(outcome IN ('ok','blocked','warning','error')), safe_details_json TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);
CREATE TABLE IF NOT EXISTS app_settings (setting_key TEXT PRIMARY KEY, setting_json TEXT NOT NULL, updated_at TEXT NOT NULL);
INSERT OR IGNORE INTO app_settings(setting_key, setting_json, updated_at) VALUES
 ('reel_max_duration_seconds','30','2026-10-14T00:00:00.000Z'),
 ('daily_facebook_feed_posts','2','2026-10-14T00:00:00.000Z'),
 ('daily_instagram_feed_posts','2','2026-10-14T00:00:00.000Z'),
 ('daily_facebook_reels','1','2026-10-14T00:00:00.000Z'),
 ('daily_instagram_reels','1','2026-10-14T00:00:00.000Z'),
 ('timezone','"Asia/Karachi"','2026-10-14T00:00:00.000Z');
CREATE TRIGGER IF NOT EXISTS enforce_reel_duration_before_insert
BEFORE INSERT ON content_assets
WHEN NEW.asset_type='reel' AND NEW.status IN ('approved','scheduled','publishing','published')
 AND (NEW.duration_seconds IS NULL OR NEW.duration_seconds <= 0 OR NEW.duration_seconds > 30)
BEGIN SELECT RAISE(ABORT,'Reel duration must be verified at 30 seconds or less before approval or publishing'); END;
CREATE TRIGGER IF NOT EXISTS enforce_reel_duration_before_update
BEFORE UPDATE OF asset_type, duration_seconds, status ON content_assets
WHEN NEW.asset_type='reel' AND NEW.status IN ('approved','scheduled','publishing','published')
 AND (NEW.duration_seconds IS NULL OR NEW.duration_seconds <= 0 OR NEW.duration_seconds > 30)
BEGIN SELECT RAISE(ABORT,'Reel duration must be verified at 30 seconds or less before approval or publishing'); END;
