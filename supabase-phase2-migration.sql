-- ============================================================
-- QMOS Phase 2 + Phase 3 Migration
-- Run this in: https://supabase.com/dashboard/project/fxetsrhxwcbryhelrqbf/sql
-- ============================================================

-- ── 1. company_users table ───────────────────────────────────
CREATE TABLE IF NOT EXISTS company_users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email           TEXT NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,
  name            TEXT NOT NULL,
  type            TEXT NOT NULL DEFAULT 'USER' CHECK (type IN ('ADMIN', 'USER')),
  role            TEXT NOT NULL DEFAULT 'QA Engineer',
  department      TEXT NOT NULL DEFAULT 'Quality',
  plant           TEXT NOT NULL DEFAULT 'Plant 1',
  allowed_routes  TEXT[] DEFAULT '{}',
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. activity_logs table ───────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_logs (
  id             BIGSERIAL PRIMARY KEY,
  process_id     TEXT NOT NULL,
  process_label  TEXT NOT NULL,
  activity_step  TEXT DEFAULT '',
  log_date       DATE,
  owner          TEXT DEFAULT '',
  status         TEXT DEFAULT 'Done',
  remarks        TEXT DEFAULT '',
  evidence       TEXT DEFAULT '',
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. process_documents table ───────────────────────────────
CREATE TABLE IF NOT EXISTS process_documents (
  id             BIGSERIAL PRIMARY KEY,
  process_id     TEXT NOT NULL,
  document_name  TEXT NOT NULL,
  file_name      TEXT DEFAULT '',
  uploaded_by    TEXT DEFAULT 'User',
  remarks        TEXT DEFAULT '',
  uploaded_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. why_analysis table (if not exists) ────────────────────
CREATE TABLE IF NOT EXISTS why_analysis (
  id             BIGSERIAL PRIMARY KEY,
  complaint_id   UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  why_number     INT NOT NULL,
  why_type       TEXT NOT NULL DEFAULT 'occurrence',
  why_question   TEXT DEFAULT '',
  why_answer     TEXT DEFAULT '',
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── Permissions ──────────────────────────────────────────────
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- ── Seed existing users ──────────────────────────────────────
INSERT INTO company_users (company_id, email, password_hash, name, type, role, department, plant)
VALUES
  ((SELECT id FROM companies WHERE code = 'BALESH001'), 'jatadhari705@gmail.com',        'Jatadhari@2024', 'Jatadhari Behera',   'ADMIN', 'Quality Head', 'Quality', 'Plant 1'),
  ((SELECT id FROM companies WHERE code = 'BALESH001'), 'jatadhari.behera@tmseating.com', 'Jatadhari@2024', 'Jatadhari Behera',   'ADMIN', 'Quality Head', 'Quality', 'Plant 1'),
  ((SELECT id FROM companies WHERE code = 'BALESH001'), 'balesh.murasiddhi@tmseating.com','Balesh@2024',    'Balesh Murasiddhi',  'USER',  'QA Engineer',  'Quality', 'Plant 1')
ON CONFLICT (email) DO NOTHING;

NOTIFY pgrst, 'reload schema';
