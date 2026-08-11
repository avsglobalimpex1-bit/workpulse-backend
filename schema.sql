-- ============================================================
-- WorkPulse OS -- Database Schema (run this once on Neon)
-- ============================================================

CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  company_name TEXT NOT NULL,
  owner_name TEXT,
  phone TEXT,
  email TEXT,
  id_prefix TEXT DEFAULT 'ID-',
  currency TEXT DEFAULT 'USD',
  language_preference TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS global_staff_registry (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  email TEXT,
  global_status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tenant_staff_map (
  id TEXT PRIMARY KEY,
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
  global_staff_id TEXT REFERENCES global_staff_registry(id) ON DELETE CASCADE,
  tenant_staff_serial_id TEXT NOT NULL,
  department TEXT,
  role TEXT,
  base_salary NUMERIC DEFAULT 0,
  allowances NUMERIC DEFAULT 0,
  bank_details_json TEXT DEFAULT '{}',
  emergency_contact_json TEXT DEFAULT '{}',
  employment_status TEXT DEFAULT 'Active',
  joined_date TIMESTAMPTZ DEFAULT now(),
  relieved_date TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY,
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
  tenant_staff_id TEXT REFERENCES tenant_staff_map(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT now(),
  gps_lat NUMERIC,
  gps_lng NUMERIC,
  mode TEXT DEFAULT 'Office'
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
  tenant_staff_id TEXT REFERENCES tenant_staff_map(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'General',
  frequency TEXT DEFAULT 'One-time',
  priority TEXT DEFAULT 'Normal',
  progress_percentage INTEGER DEFAULT 0,
  status TEXT DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS advance_ledger (
  id TEXT PRIMARY KEY,
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
  tenant_staff_id TEXT REFERENCES tenant_staff_map(id) ON DELETE CASCADE,
  amount NUMERIC DEFAULT 0,
  type TEXT DEFAULT 'Cash',
  deducted_status BOOLEAN DEFAULT false,
  date TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS travel_expenses (
  id TEXT PRIMARY KEY,
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
  tenant_staff_id TEXT REFERENCES tenant_staff_map(id) ON DELETE CASCADE,
  itinerary TEXT,
  amount_claimed NUMERIC DEFAULT 0,
  receipt_image_url TEXT,
  approval_status TEXT DEFAULT 'Pending',
  date TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  company_id TEXT,
  action_type TEXT,
  performed_by TEXT,
  details TEXT,
  meta TEXT,
  timestamp TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tenant_map_company ON tenant_staff_map(company_id);
CREATE INDEX IF NOT EXISTS idx_tenant_map_serial ON tenant_staff_map(tenant_staff_serial_id);
CREATE INDEX IF NOT EXISTS idx_attendance_staff ON attendance(tenant_staff_id);
CREATE INDEX IF NOT EXISTS idx_tasks_staff ON tasks(tenant_staff_id);
CREATE INDEX IF NOT EXISTS idx_travel_staff ON travel_expenses(tenant_staff_id);
CREATE INDEX IF NOT EXISTS idx_advances_staff ON advance_ledger(tenant_staff_id);
