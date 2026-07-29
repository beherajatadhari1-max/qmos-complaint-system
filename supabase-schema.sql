-- ================================================================
-- QMOS DATABASE SCHEMA
-- Two-Layer Architecture: Common Content + Company Data
-- Run this in Supabase SQL Editor
-- ================================================================

-- ────────────────────────────────────────────────────────────────
-- LAYER 1: COMPANY MANAGEMENT (Super Admin)
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,           -- short code e.g. 'TMSEATING'
  industry TEXT DEFAULT 'Automotive',
  plan TEXT DEFAULT 'basic',           -- basic | professional | enterprise
  logo_url TEXT,
  address TEXT,
  country TEXT DEFAULT 'India',
  contact_email TEXT,
  contact_phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ────────────────────────────────────────────────────────────────
-- LAYER 1: USERS (linked to company)
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS company_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  type TEXT DEFAULT 'USER',            -- ADMIN | USER | SUPER_ADMIN
  role TEXT DEFAULT 'QA Engineer',
  department TEXT DEFAULT 'Quality',
  plant TEXT DEFAULT 'Plant 1',
  allowed_routes TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, email)
);

-- ────────────────────────────────────────────────────────────────
-- LAYER 1: COMPLAINTS (company-wise)
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  complaint_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  -- Customer info
  customer TEXT,
  customer_name TEXT DEFAULT '',       -- SQLite-compat alias
  customer_contact TEXT DEFAULT '',
  customer_ref TEXT DEFAULT '',
  -- Complaint classification
  complaint_source TEXT DEFAULT 'Email',
  source TEXT DEFAULT 'Customer',      -- alias for complaint_source
  complaint_type TEXT DEFAULT 'Customer Complaint',
  defect_category TEXT DEFAULT 'General',
  -- Part info
  part_number TEXT DEFAULT '',
  part_name TEXT DEFAULT '',
  defect_description TEXT DEFAULT '',  -- alias for description
  -- Quantities
  quantity_affected INTEGER DEFAULT 0,
  total_supplied INTEGER DEFAULT 0,
  batch_number TEXT DEFAULT '',
  -- Status / severity
  defect_type TEXT,
  status TEXT DEFAULT 'Open',          -- Open | Under Investigation | CAPA In Progress | Closed
  severity TEXT DEFAULT 'Medium',      -- Minor | Major | Critical | Catastrophic
  priority TEXT DEFAULT 'Medium',      -- alias for severity
  -- Assignment
  plant TEXT,
  department TEXT,
  reported_by TEXT,
  assigned_to TEXT DEFAULT '',
  remarks TEXT DEFAULT '',
  -- Dates
  target_date DATE,
  target_response_date DATE,
  closed_date DATE,
  response_deadline TEXT DEFAULT '',
  -- Automotive / warranty fields
  vehicle_number TEXT DEFAULT '',
  warranty_claim_no TEXT DEFAULT '',
  prr_number TEXT DEFAULT '',
  rejection_stage TEXT DEFAULT '',
  -- 8D fields
  d1_team_formed BOOLEAN DEFAULT false,
  d2_problem_description TEXT,
  d3_containment_actions TEXT,
  d4_why_made TEXT,
  d4_why_shipped TEXT,
  d5_root_cause TEXT,
  d6_corrective_actions TEXT,
  d7_preventive_actions TEXT,
  d8_closure_notes TEXT,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS containment_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  responsible TEXT,
  target_date DATE,
  status TEXT DEFAULT 'Open',
  completed_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS capa_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'Corrective',      -- Corrective | Preventive
  action TEXT NOT NULL,
  root_cause TEXT,
  responsible TEXT,
  target_date DATE,
  status TEXT DEFAULT 'Open',
  effectiveness TEXT,
  verified_by TEXT,
  verified_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS why_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  level INTEGER NOT NULL,              -- 1 to 5
  why TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT,
  department TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS complaint_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  performed_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ────────────────────────────────────────────────────────────────
-- LAYER 1: ACTIVITY LOGS (audit trail per company)
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,                -- e.g. 'Created complaint #123'
  module TEXT NOT NULL,                -- e.g. 'Complaints', 'CAPA', 'Users'
  record_id TEXT,                      -- ID of the affected record
  old_value JSONB,
  new_value JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ────────────────────────────────────────────────────────────────
-- LAYER 2: COMMON CONTENT (shared across all companies)
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS training_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,              -- IATF | Core Tools | Problem Solving | etc.
  content JSONB NOT NULL DEFAULT '{}',
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS interview_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT NOT NULL,              -- IATF | FMEA | SPC | MSA | etc.
  difficulty TEXT DEFAULT 'Medium',    -- Easy | Medium | Hard
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term TEXT NOT NULL,
  definition TEXT NOT NULL,
  category TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS standard_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,                  -- PFMEA | Control Plan | 8D | APQP | etc.
  content JSONB NOT NULL DEFAULT '{}',
  file_url TEXT,
  version TEXT DEFAULT '1.0',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS qms_clauses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  standard TEXT NOT NULL,              -- IATF 16949 | ISO 9001 | VDA
  clause_number TEXT NOT NULL,
  clause_title TEXT NOT NULL,
  requirement TEXT,
  intent TEXT,
  audit_questions JSONB DEFAULT '[]',
  common_findings JSONB DEFAULT '[]',
  best_practices JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ────────────────────────────────────────────────────────────────
-- SUPER ADMIN TABLE (you — Jatadhari Behera)
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS super_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert your super admin account
INSERT INTO super_admins (email, name) VALUES
  ('jatadhari705@gmail.com', 'Jatadhari Behera'),
  ('jatadhari.behera@tmseating.com', 'Jatadhari Behera')
ON CONFLICT (email) DO NOTHING;

-- ────────────────────────────────────────────────────────────────
-- INDEXES for performance
-- ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_complaints_company ON complaints(company_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_company_users_company ON company_users(company_id);
CREATE INDEX IF NOT EXISTS idx_company_users_email ON company_users(email);
CREATE INDEX IF NOT EXISTS idx_activity_logs_company ON activity_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_capa_complaint ON capa_actions(complaint_id);
CREATE INDEX IF NOT EXISTS idx_why_complaint ON why_analysis(complaint_id);

-- ────────────────────────────────────────────────────────────────
-- PERMISSIONS (REQUIRED — raw SQL doesn't auto-grant like the UI)
-- ────────────────────────────────────────────────────────────────

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;

-- ────────────────────────────────────────────────────────────────
-- SEED: Balesh's company (Phase 1 — hardcoded in API)
-- ────────────────────────────────────────────────────────────────

INSERT INTO companies (name, code, industry, plan, contact_email, country)
VALUES ('Balesh Industries', 'BALESH001', 'Automotive', 'professional', 'balesh@company.com', 'India')
ON CONFLICT (code) DO NOTHING;

-- ────────────────────────────────────────────────────────────────
-- DONE
-- ────────────────────────────────────────────────────────────────
