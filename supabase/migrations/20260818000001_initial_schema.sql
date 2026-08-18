-- ============================================================
-- stash-ai initial schema
-- ============================================================

-- jobs table: mirrors linkedin-applied-jobs.json
CREATE TABLE IF NOT EXISTS jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id          TEXT UNIQUE,
  title           TEXT NOT NULL,
  company         TEXT NOT NULL,
  url             TEXT,
  applied_at      TIMESTAMPTZ DEFAULT NOW(),
  method          TEXT DEFAULT 'Headhunter Web App',
  status          TEXT DEFAULT 'applied',
  salary          TEXT,
  min_salary      INTEGER,
  max_salary      INTEGER,
  location        TEXT DEFAULT 'Remote, US',
  notes           TEXT,
  logo_url        TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- emails table: mirrors emails_cache.json
CREATE TABLE IF NOT EXISTS emails (
  id              TEXT PRIMARY KEY,
  from_address    TEXT,
  subject         TEXT,
  date            TEXT,
  classification  TEXT,
  job_title       TEXT,
  company         TEXT,
  full_body       TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- settings table: single-row config, mirrors linkedin-apply-config.json
CREATE TABLE IF NOT EXISTS settings (
  id                        INTEGER PRIMARY KEY DEFAULT 1,
  full_name                 TEXT DEFAULT 'Richard Anderson',
  email                     TEXT DEFAULT 'Richard.torieal@gmail.com',
  job_titles                JSONB DEFAULT '[]',
  search_queries            JSONB DEFAULT '[]',
  min_salary                INTEGER DEFAULT 175000,
  resume_tailoring_enabled  BOOLEAN DEFAULT TRUE,
  workplace_types           JSONB DEFAULT '[]',
  blacklisted_keywords      JSONB DEFAULT '[]',
  preferred_keywords        JSONB DEFAULT '[]',
  default_answers           JSONB DEFAULT '{}',
  updated_at                TIMESTAMPTZ DEFAULT NOW()
);

-- Seed a default settings row (id=1, upsert-safe)
INSERT INTO settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Auto-update updated_at on jobs
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
