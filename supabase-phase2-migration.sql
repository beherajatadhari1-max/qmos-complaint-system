-- ============================================================
-- QMOS Phase 2 Migration — company_users table
-- Run this in: https://supabase.com/dashboard/project/fxetsrhxwcbryhelrqbf/sql
-- ============================================================

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

GRANT ALL ON company_users TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;

-- Seed existing users
INSERT INTO company_users (company_id, email, password_hash, name, type, role, department, plant)
VALUES
  (
    (SELECT id FROM companies WHERE code = 'BALESH001'),
    'jatadhari705@gmail.com',
    'Jatadhari@2024',
    'Jatadhari Behera',
    'ADMIN',
    'Quality Head',
    'Quality',
    'Plant 1'
  ),
  (
    (SELECT id FROM companies WHERE code = 'BALESH001'),
    'jatadhari.behera@tmseating.com',
    'Jatadhari@2024',
    'Jatadhari Behera',
    'ADMIN',
    'Quality Head',
    'Quality',
    'Plant 1'
  ),
  (
    (SELECT id FROM companies WHERE code = 'BALESH001'),
    'balesh.murasiddhi@tmseating.com',
    'Balesh@2024',
    'Balesh Murasiddhi',
    'USER',
    'QA Engineer',
    'Quality',
    'Plant 1'
  )
ON CONFLICT (email) DO NOTHING;

NOTIFY pgrst, 'reload schema';
