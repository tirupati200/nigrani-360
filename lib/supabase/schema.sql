-- ==============================================================================
-- NIGRANI 360 - SUPABASE PRODUCTION DATABASE SCHEMA & ROW LEVEL SECURITY (RLS)
-- SIH26095: Smart Real-Time Monitoring & Inspection of Government Welfare Projects
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. CUSTOM TYPES
DO $$ BEGIN
  CREATE TYPE user_role_type AS ENUM ('GOVERNMENT_AUTHORITY', 'NGO_HEAD', 'FIELD_OFFICER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE ngo_status_type AS ENUM ('Active', 'Under Review', 'Suspended');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE service_type_enum AS ENUM ('Subsidized Meals', 'Shelter Nutrition', 'Day Care Outreach');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE cctv_status_enum AS ENUM ('Active', 'Intermittent', 'Offline');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE audit_status_enum AS ENUM ('Reconciled', 'Under Review', 'Audit Pending');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- 3. TABLES DEFINITION
-- ==============================================================================

-- 3.1 NGOS TABLE
CREATE TABLE IF NOT EXISTS public.ngos (
  id TEXT PRIMARY KEY DEFAULT ('ngo-' || substr(gen_random_uuid()::text, 1, 8)),
  name TEXT NOT NULL,
  darpan_reg_no TEXT NOT NULL UNIQUE,
  pan_number TEXT NOT NULL,
  nodal_name TEXT NOT NULL,
  nodal_designation TEXT NOT NULL DEFAULT 'Honorary Secretary',
  nodal_phone TEXT NOT NULL,
  nodal_email TEXT NOT NULL,
  status ngo_status_type NOT NULL DEFAULT 'Active',
  compliance_score INTEGER NOT NULL DEFAULT 100 CHECK (compliance_score >= 0 AND compliance_score <= 100),
  registered_since DATE NOT NULL DEFAULT CURRENT_DATE,
  registered_office TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.2 USER PROFILES TABLE (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role user_role_type NOT NULL,
  designation TEXT NOT NULL,
  department_or_ngo TEXT NOT NULL,
  assigned_ngo_id TEXT REFERENCES public.ngos(id) ON DELETE SET NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('Pre-provisioned Government Authority', 'Government-provisioned NGO Head', 'Government-provisioned Field Officer')),
  provisioned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_ngo_head_has_assigned_ngo CHECK (
    (role = 'NGO_HEAD' AND assigned_ngo_id IS NOT NULL) OR
    (role = 'GOVERNMENT_AUTHORITY' AND assigned_ngo_id IS NULL) OR
    (role = 'FIELD_OFFICER' AND assigned_ngo_id IS NULL)
  )
);

-- 3.3 GOVERNMENT WELFARE PROJECTS TABLE
CREATE TABLE IF NOT EXISTS public.government_welfare_projects (
  id TEXT PRIMARY KEY DEFAULT ('prj-scheme-' || substr(gen_random_uuid()::text, 1, 8)),
  ngo_id TEXT NOT NULL REFERENCES public.ngos(id) ON DELETE CASCADE,
  project_code TEXT NOT NULL UNIQUE,
  scheme_name TEXT NOT NULL,
  sanction_order_no TEXT NOT NULL UNIQUE,
  financial_year TEXT NOT NULL DEFAULT '2025-26',
  service_type service_type_enum NOT NULL DEFAULT 'Subsidized Meals',
  target_daily_beneficiaries INTEGER NOT NULL DEFAULT 1000 CHECK (target_daily_beneficiaries > 0),
  sanctioned_budget NUMERIC(15, 2) NOT NULL CHECK (sanctioned_budget >= 0),
  released_budget NUMERIC(15, 2) NOT NULL CHECK (released_budget >= 0),
  spent_budget NUMERIC(15, 2) NOT NULL CHECK (spent_budget >= 0),
  financial_audit_status audit_status_enum NOT NULL DEFAULT 'Reconciled',
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '1 year'),
  status TEXT NOT NULL DEFAULT 'Operational' CHECK (status IN ('Operational', 'Renewal Pending', 'Suspended')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_budget_consistency CHECK (
    spent_budget <= released_budget AND released_budget <= sanctioned_budget
  )
);

-- 3.4 WELFARE CENTERS TABLE
CREATE TABLE IF NOT EXISTS public.welfare_centers (
  id TEXT PRIMARY KEY DEFAULT ('cnt-' || substr(gen_random_uuid()::text, 1, 8)),
  project_id TEXT NOT NULL REFERENCES public.government_welfare_projects(id) ON DELETE CASCADE,
  ngo_id TEXT NOT NULL REFERENCES public.ngos(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  district TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'NCT of Delhi',
  address TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  geofence_radius_meters INTEGER NOT NULL DEFAULT 75 CHECK (geofence_radius_meters > 0),
  beneficiary_capacity INTEGER NOT NULL DEFAULT 500 CHECK (beneficiary_capacity > 0),
  cctv_camera_count INTEGER NOT NULL DEFAULT 2 CHECK (cctv_camera_count >= 0),
  cctv_stream_status cctv_status_enum NOT NULL DEFAULT 'Active',
  status TEXT NOT NULL DEFAULT 'Operational' CHECK (status IN ('Operational', 'Temporarily Closed', 'Under Inspection')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 4. HELPER FUNCTIONS FOR SECURITY (SECURITY DEFINER)
-- ==============================================================================

-- 4.1 Check if current caller is an authorized Government Authority
CREATE OR REPLACE FUNCTION public.is_government_authority()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'GOVERNMENT_AUTHORITY'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- 4.2 Get assigned NGO ID for the current caller
CREATE OR REPLACE FUNCTION public.get_assigned_ngo_id()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT assigned_ngo_id FROM public.user_profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- 4.3 Check if current caller is an authorized Field Officer
CREATE OR REPLACE FUNCTION public.is_field_officer()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'FIELD_OFFICER'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ngos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.government_welfare_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.welfare_centers ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 5.1 RLS POLICIES FOR user_profiles
-- ------------------------------------------------------------------------------
-- Government Authority: Can view all user profiles
DROP POLICY IF EXISTS "GovAuthority can view all user profiles" ON public.user_profiles;
CREATE POLICY "GovAuthority can view all user profiles"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (public.is_government_authority());

-- Government Authority: Can insert/provision new NGO Head accounts
DROP POLICY IF EXISTS "GovAuthority can insert user profiles" ON public.user_profiles;
CREATE POLICY "GovAuthority can insert user profiles"
  ON public.user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_government_authority());

-- Government Authority: Can update user profiles
DROP POLICY IF EXISTS "GovAuthority can update user profiles" ON public.user_profiles;
CREATE POLICY "GovAuthority can update user profiles"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (public.is_government_authority())
  WITH CHECK (public.is_government_authority());

-- Authenticated Users: Can view ONLY their own profile (Strict Tenant Isolation)
DROP POLICY IF EXISTS "NGO Head can view only own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- ------------------------------------------------------------------------------
-- 5.2 RLS POLICIES FOR ngos
-- ------------------------------------------------------------------------------
-- Government Authority: Full read access to all NGOs
DROP POLICY IF EXISTS "GovAuthority can view all NGOs" ON public.ngos;
CREATE POLICY "GovAuthority can view all NGOs"
  ON public.ngos
  FOR SELECT
  TO authenticated
  USING (public.is_government_authority());

-- Government Authority: Can register new NGOs
DROP POLICY IF EXISTS "GovAuthority can insert NGOs" ON public.ngos;
CREATE POLICY "GovAuthority can insert NGOs"
  ON public.ngos
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_government_authority());

-- Government Authority: Can update NGO records and status
DROP POLICY IF EXISTS "GovAuthority can update NGOs" ON public.ngos;
CREATE POLICY "GovAuthority can update NGOs"
  ON public.ngos
  FOR UPDATE
  TO authenticated
  USING (public.is_government_authority())
  WITH CHECK (public.is_government_authority());

-- NGO Head: Can view ONLY their assigned NGO record
DROP POLICY IF EXISTS "NGO Head can view only assigned NGO" ON public.ngos;
CREATE POLICY "NGO Head can view only assigned NGO"
  ON public.ngos
  FOR SELECT
  TO authenticated
  USING (id = public.get_assigned_ngo_id());

-- ------------------------------------------------------------------------------
-- 5.3 RLS POLICIES FOR government_welfare_projects
-- ------------------------------------------------------------------------------
-- Government Authority: Full read access to all projects and financial budgets
DROP POLICY IF EXISTS "GovAuthority can view all projects" ON public.government_welfare_projects;
CREATE POLICY "GovAuthority can view all projects"
  ON public.government_welfare_projects
  FOR SELECT
  TO authenticated
  USING (public.is_government_authority());

-- Government Authority: Can sanction new projects and set budgets
DROP POLICY IF EXISTS "GovAuthority can insert projects" ON public.government_welfare_projects;
CREATE POLICY "GovAuthority can insert projects"
  ON public.government_welfare_projects
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_government_authority());

-- Government Authority: Can update project details and audit status
DROP POLICY IF EXISTS "GovAuthority can update projects" ON public.government_welfare_projects;
CREATE POLICY "GovAuthority can update projects"
  ON public.government_welfare_projects
  FOR UPDATE
  TO authenticated
  USING (public.is_government_authority())
  WITH CHECK (public.is_government_authority());

-- NGO Head: Can view ONLY projects belonging to their assigned NGO
DROP POLICY IF EXISTS "NGO Head can view only own NGO projects" ON public.government_welfare_projects;
CREATE POLICY "NGO Head can view only own NGO projects"
  ON public.government_welfare_projects
  FOR SELECT
  TO authenticated
  USING (ngo_id = public.get_assigned_ngo_id());

-- ------------------------------------------------------------------------------
-- 5.4 RLS POLICIES FOR welfare_centers
-- ------------------------------------------------------------------------------
-- Government Authority: Full read access to all welfare centers
DROP POLICY IF EXISTS "GovAuthority can view all centers" ON public.welfare_centers;
CREATE POLICY "GovAuthority can view all centers"
  ON public.welfare_centers
  FOR SELECT
  TO authenticated
  USING (public.is_government_authority());

-- Government Authority: Can register and configure new centers
DROP POLICY IF EXISTS "GovAuthority can insert centers" ON public.welfare_centers;
CREATE POLICY "GovAuthority can insert centers"
  ON public.welfare_centers
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_government_authority());

-- Government Authority: Can update centers
DROP POLICY IF EXISTS "GovAuthority can update centers" ON public.welfare_centers;
CREATE POLICY "GovAuthority can update centers"
  ON public.welfare_centers
  FOR UPDATE
  TO authenticated
  USING (public.is_government_authority())
  WITH CHECK (public.is_government_authority());

-- NGO Head: Can view ONLY centers belonging to their assigned NGO
DROP POLICY IF EXISTS "NGO Head can view only own NGO centers" ON public.welfare_centers;
CREATE POLICY "NGO Head can view only own NGO centers"
  ON public.welfare_centers
  FOR SELECT
  TO authenticated
  USING (ngo_id = public.get_assigned_ngo_id());

-- ==============================================================================
-- 6. AUDIT TRIGGER FOR UPDATED_AT
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_ngos_updated_at ON public.ngos;
CREATE TRIGGER trg_ngos_updated_at
  BEFORE UPDATE ON public.ngos
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_projects_updated_at ON public.government_welfare_projects;
CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON public.government_welfare_projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_centers_updated_at ON public.welfare_centers;
CREATE TRIGGER trg_centers_updated_at
  BEFORE UPDATE ON public.welfare_centers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 7. BENEFICIARIES & 2-MEAL VERIFICATION LEDGER
-- ==============================================================================

-- 7.1 BENEFICIARIES TABLE
CREATE TABLE IF NOT EXISTS public.beneficiaries (
  id TEXT PRIMARY KEY DEFAULT ('ben-' || substr(gen_random_uuid()::text, 1, 8)),
  full_name TEXT NOT NULL,
  identification_token TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'General Beneficiary',
  registered_center_id TEXT NOT NULL REFERENCES public.welfare_centers(id) ON DELETE RESTRICT,
  project_id TEXT NOT NULL REFERENCES public.government_welfare_projects(id) ON DELETE RESTRICT,
  ngo_id TEXT NOT NULL REFERENCES public.ngos(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Suspended', 'Deceased')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7.2 MEAL TRANSACTIONS TABLE (IMMUTABLE AUDIT LEDGER)
CREATE TABLE IF NOT EXISTS public.meal_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  beneficiary_id TEXT NOT NULL REFERENCES public.beneficiaries(id) ON DELETE RESTRICT,
  center_id TEXT NOT NULL REFERENCES public.welfare_centers(id) ON DELETE RESTRICT,
  project_id TEXT NOT NULL REFERENCES public.government_welfare_projects(id) ON DELETE RESTRICT,
  ngo_id TEXT NOT NULL REFERENCES public.ngos(id) ON DELETE RESTRICT,
  service_date DATE NOT NULL DEFAULT ((CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::date),
  service_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  meal_sequence INTEGER NOT NULL CHECK (meal_sequence IN (1, 2, 3)),
  status TEXT NOT NULL CHECK (status IN ('ALLOWED', 'DENIED')),
  denial_reason TEXT DEFAULT NULL,
  verification_method TEXT NOT NULL DEFAULT 'QR_POS' CHECK (verification_method IN ('QR_POS', 'BIOMETRIC_POS', 'MANUAL_OVERRIDE')),
  terminal_id TEXT NOT NULL DEFAULT 'POS-TERM-01',
  dispensed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sha256_record_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7.3 INDEXES & ENGINE-LEVEL CONSTRAINTS
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_allowed_daily_meal
  ON public.meal_transactions (beneficiary_id, service_date, meal_sequence)
  WHERE status = 'ALLOWED';

CREATE INDEX IF NOT EXISTS idx_meal_tx_beneficiary_lookup
  ON public.meal_transactions (beneficiary_id, service_date, status);

CREATE INDEX IF NOT EXISTS idx_meal_tx_center_date
  ON public.meal_transactions (center_id, service_date);

CREATE INDEX IF NOT EXISTS idx_meal_tx_ngo_date
  ON public.meal_transactions (ngo_id, service_date);

CREATE INDEX IF NOT EXISTS idx_meal_tx_timestamp
  ON public.meal_transactions (service_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_beneficiaries_center
  ON public.beneficiaries (registered_center_id);

CREATE INDEX IF NOT EXISTS idx_beneficiaries_ngo
  ON public.beneficiaries (ngo_id);

CREATE INDEX IF NOT EXISTS idx_beneficiaries_token
  ON public.beneficiaries (identification_token);

-- 7.4 ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.beneficiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_transactions ENABLE ROW LEVEL SECURITY;

-- Beneficiaries RLS
DROP POLICY IF EXISTS "GovAuthority can view all beneficiaries" ON public.beneficiaries;
CREATE POLICY "GovAuthority can view all beneficiaries"
  ON public.beneficiaries
  FOR SELECT
  TO authenticated
  USING (public.is_government_authority());

DROP POLICY IF EXISTS "GovAuthority can insert beneficiaries" ON public.beneficiaries;
CREATE POLICY "GovAuthority can insert beneficiaries"
  ON public.beneficiaries
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_government_authority());

DROP POLICY IF EXISTS "GovAuthority can update beneficiaries" ON public.beneficiaries;
CREATE POLICY "GovAuthority can update beneficiaries"
  ON public.beneficiaries
  FOR UPDATE
  TO authenticated
  USING (public.is_government_authority())
  WITH CHECK (public.is_government_authority());

DROP POLICY IF EXISTS "NGO Head can view only own NGO beneficiaries" ON public.beneficiaries;
CREATE POLICY "NGO Head can view only own NGO beneficiaries"
  ON public.beneficiaries
  FOR SELECT
  TO authenticated
  USING (ngo_id = public.get_assigned_ngo_id());

DROP POLICY IF EXISTS "NGO Head can insert own NGO beneficiaries" ON public.beneficiaries;
CREATE POLICY "NGO Head can insert own NGO beneficiaries"
  ON public.beneficiaries
  FOR INSERT
  TO authenticated
  WITH CHECK (ngo_id = public.get_assigned_ngo_id());

DROP POLICY IF EXISTS "NGO Head can update own NGO beneficiaries" ON public.beneficiaries;
CREATE POLICY "NGO Head can update own NGO beneficiaries"
  ON public.beneficiaries
  FOR UPDATE
  TO authenticated
  USING (ngo_id = public.get_assigned_ngo_id())
  WITH CHECK (ngo_id = public.get_assigned_ngo_id());

-- Meal Transactions RLS (Strict Append-Only: No UPDATE, No DELETE)
DROP POLICY IF EXISTS "GovAuthority can view all meal transactions" ON public.meal_transactions;
CREATE POLICY "GovAuthority can view all meal transactions"
  ON public.meal_transactions
  FOR SELECT
  TO authenticated
  USING (public.is_government_authority());

DROP POLICY IF EXISTS "NGO Head can view only own NGO meal transactions" ON public.meal_transactions;
CREATE POLICY "NGO Head can view only own NGO meal transactions"
  ON public.meal_transactions
  FOR SELECT
  TO authenticated
  USING (ngo_id = public.get_assigned_ngo_id());

DROP POLICY IF EXISTS "Authorized users can insert meal transactions" ON public.meal_transactions;
CREATE POLICY "Authorized users can insert meal transactions"
  ON public.meal_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_government_authority() OR
    ngo_id = public.get_assigned_ngo_id()
  );

-- 7.5 TRIGGER FOR BENEFICIARIES UPDATED_AT
DROP TRIGGER IF EXISTS trg_beneficiaries_updated_at ON public.beneficiaries;
CREATE TRIGGER trg_beneficiaries_updated_at
  BEFORE UPDATE ON public.beneficiaries
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 7.6 ATOMIC 2-MEAL VERIFICATION RPC FUNCTION
CREATE OR REPLACE FUNCTION public.process_meal_verification(
  p_beneficiary_id TEXT,
  p_center_id TEXT,
  p_verification_method TEXT DEFAULT 'QR_POS',
  p_terminal_id TEXT DEFAULT 'POS-TERM-01'
)
RETURNS JSONB AS $$
DECLARE
  v_caller_id UUID;
  v_beneficiary RECORD;
  v_center RECORD;
  v_service_date DATE;
  v_service_timestamp TIMESTAMPTZ;
  v_allowed_count INTEGER;
  v_sequence INTEGER;
  v_status TEXT;
  v_denial_reason TEXT;
  v_new_tx_id UUID;
  v_record_hash TEXT;
  v_raw_hash_input TEXT;
BEGIN
  -- 1. Authentication check
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to verify and dispense meals' USING ERRCODE = '42501';
  END IF;

  -- 2. Center validation
  SELECT id, project_id, ngo_id, status
  INTO v_center
  FROM public.welfare_centers
  WHERE id = p_center_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Welfare center not found: %', p_center_id USING ERRCODE = 'P0002';
  END IF;

  IF v_center.status != 'Operational' THEN
    RAISE EXCEPTION 'Welfare center % is not operational (current status: %)', p_center_id, v_center.status USING ERRCODE = 'P0001';
  END IF;

  -- 3. Authorization check: Caller must be Government Authority or NGO Head of this center's NGO
  IF NOT (public.is_government_authority() OR public.get_assigned_ngo_id() = v_center.ngo_id) THEN
    RAISE EXCEPTION 'Access denied: Caller not authorized to issue meals for NGO % at center %', v_center.ngo_id, p_center_id USING ERRCODE = '42501';
  END IF;

  -- 4. Lock and validate Beneficiary record (SELECT ... FOR UPDATE prevents race conditions)
  SELECT id, full_name, identification_token, category, registered_center_id, project_id, ngo_id, status
  INTO v_beneficiary
  FROM public.beneficiaries
  WHERE id = p_beneficiary_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Beneficiary not found: %', p_beneficiary_id USING ERRCODE = 'P0002';
  END IF;

  IF v_beneficiary.status != 'Active' THEN
    RAISE EXCEPTION 'Beneficiary % is not active (current status: %)', p_beneficiary_id, v_beneficiary.status USING ERRCODE = 'P0001';
  END IF;

  IF v_beneficiary.registered_center_id != p_center_id THEN
    RAISE EXCEPTION 'Beneficiary % is registered at center %, not center %', p_beneficiary_id, v_beneficiary.registered_center_id, p_center_id USING ERRCODE = 'P0001';
  END IF;

  IF v_beneficiary.project_id != v_center.project_id OR v_beneficiary.ngo_id != v_center.ngo_id THEN
    RAISE EXCEPTION 'Beneficiary registration does not match center project or NGO hierarchy' USING ERRCODE = 'P0001';
  END IF;

  -- 5. Calculate service date strictly in Asia/Kolkata (IST) timezone
  v_service_date := (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::date;
  v_service_timestamp := clock_timestamp();

  -- 6. Count ALLOWED meals for today across ALL centers (Global 2-meal limit per IST day)
  SELECT COUNT(*)
  INTO v_allowed_count
  FROM public.meal_transactions
  WHERE beneficiary_id = p_beneficiary_id
    AND service_date = v_service_date
    AND status = 'ALLOWED';

  -- 7. Apply core entitlement logic (Max 2 meals per day)
  IF v_allowed_count = 0 THEN
    v_sequence := 1;
    v_status := 'ALLOWED';
    v_denial_reason := NULL;
  ELSIF v_allowed_count = 1 THEN
    v_sequence := 2;
    v_status := 'ALLOWED';
    v_denial_reason := NULL;
  ELSE
    -- Third visit or beyond: DENIED and recorded
    v_sequence := 3;
    v_status := 'DENIED';
    v_denial_reason := 'DAILY_QUOTA_EXCEEDED_2_MEAL_POLICY';
  END IF;

  -- 8. Generate unique transaction UUID
  v_new_tx_id := gen_random_uuid();

  -- 9. Compute tamper-evident SHA-256 digital fingerprint
  v_raw_hash_input := v_new_tx_id::text || '|' ||
                      p_beneficiary_id || '|' ||
                      p_center_id || '|' ||
                      v_service_date::text || '|' ||
                      v_service_timestamp::text || '|' ||
                      v_sequence::text || '|' ||
                      v_status || '|' ||
                      COALESCE(v_denial_reason, 'NONE');

  v_record_hash := encode(extensions.digest(v_raw_hash_input, 'sha256'), 'hex');

  -- 10. Atomically insert the audit record
  INSERT INTO public.meal_transactions (
    id,
    beneficiary_id,
    center_id,
    project_id,
    ngo_id,
    service_date,
    service_timestamp,
    meal_sequence,
    status,
    denial_reason,
    verification_method,
    terminal_id,
    dispensed_by,
    sha256_record_hash
  ) VALUES (
    v_new_tx_id,
    p_beneficiary_id,
    p_center_id,
    v_beneficiary.project_id,
    v_beneficiary.ngo_id,
    v_service_date,
    v_service_timestamp,
    v_sequence,
    v_status,
    v_denial_reason,
    p_verification_method,
    p_terminal_id,
    v_caller_id,
    v_record_hash
  );

  -- 11. Return detailed JSON result
  RETURN jsonb_build_object(
    'success', true,
    'allowed', (v_status = 'ALLOWED'),
    'transaction_id', v_new_tx_id,
    'beneficiary_id', p_beneficiary_id,
    'beneficiary_name', v_beneficiary.full_name,
    'center_id', p_center_id,
    'service_date', v_service_date,
    'service_timestamp', v_service_timestamp,
    'meal_sequence', v_sequence,
    'meals_today', CASE WHEN v_status = 'ALLOWED' THEN v_allowed_count + 1 ELSE v_allowed_count END,
    'status', v_status,
    'denial_reason', v_denial_reason,
    'record_hash', v_record_hash,
    'message', CASE
      WHEN v_status = 'ALLOWED' AND v_sequence = 1 THEN 'Meal 1 of 2 authorized and recorded.'
      WHEN v_status = 'ALLOWED' AND v_sequence = 2 THEN 'Meal 2 of 2 authorized and recorded.'
      ELSE 'Daily meal entitlement exhausted (2 meals per day policy). Third visit blocked and recorded.'
    END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ==============================================================================
-- 8. FIELD INSPECTIONS WORKFLOW & CRYPTOGRAPHIC AUDITING (HARDENED)
-- ==============================================================================

-- 8.1 FIELD INSPECTIONS TABLE
CREATE TABLE IF NOT EXISTS public.field_inspections (
  -- Inspection Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_token TEXT NOT NULL UNIQUE DEFAULT (
    'DISP-' || to_char((CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::date, 'YYYYMMDD') || '-' || upper(substr(gen_random_uuid()::text, 1, 8))
  ),
  center_id TEXT NOT NULL REFERENCES public.welfare_centers(id) ON DELETE RESTRICT,
  project_id TEXT NOT NULL REFERENCES public.government_welfare_projects(id) ON DELETE RESTRICT,
  ngo_id TEXT NOT NULL REFERENCES public.ngos(id) ON DELETE RESTRICT,

  -- Inspector Assignment (Mandatory Field Officer Link)
  inspector_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  inspector_name TEXT NOT NULL,
  officer_badge_id TEXT DEFAULT NULL,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scheduled_for DATE NOT NULL DEFAULT ((CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::date),

  -- Inspection Execution
  started_at TIMESTAMPTZ DEFAULT NULL,
  completed_at TIMESTAMPTZ DEFAULT NULL,
  status TEXT NOT NULL DEFAULT 'ASSIGNED' CHECK (
    status IN ('ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'FLAGGED_DISCREPANCY')
  ),

  -- GPS Proof & Geofence Telemetry
  gps_latitude DOUBLE PRECISION DEFAULT NULL,
  gps_longitude DOUBLE PRECISION DEFAULT NULL,
  gps_accuracy_meters NUMERIC(8, 2) DEFAULT NULL,
  gps_captured_at TIMESTAMPTZ DEFAULT NULL,
  geofence_distance_meters NUMERIC(8, 2) DEFAULT NULL,
  geofence_status TEXT DEFAULT NULL CHECK (
    geofence_status IS NULL OR geofence_status IN ('VERIFIED_INSIDE', 'BREACH_OUTSIDE')
  ),

  -- Physical Verification & Reconciliation
  physical_headcount INTEGER DEFAULT NULL CHECK (physical_headcount IS NULL OR physical_headcount >= 0),
  pos_meal_count INTEGER DEFAULT NULL CHECK (pos_meal_count IS NULL OR pos_meal_count >= 0),
  discrepancy_delta INTEGER DEFAULT NULL,

  -- Inspection Checklist (Structured JSONB)
  checklist JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Evidence Metadata (Photos / Proof-of-presence)
  evidence_file_path TEXT DEFAULT NULL,
  evidence_sha256 TEXT DEFAULT NULL,
  evidence_captured_at TIMESTAMPTZ DEFAULT NULL,
  notes TEXT DEFAULT NULL,

  -- Cryptographic Integrity & Timestamps
  sha256_record_hash TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8.2 INDEXES FOR AUDIT & QUERY PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_field_inspections_center
  ON public.field_inspections (center_id);

CREATE INDEX IF NOT EXISTS idx_field_inspections_ngo
  ON public.field_inspections (ngo_id);

CREATE INDEX IF NOT EXISTS idx_field_inspections_project
  ON public.field_inspections (project_id);

CREATE INDEX IF NOT EXISTS idx_field_inspections_inspector
  ON public.field_inspections (inspector_user_id);

CREATE INDEX IF NOT EXISTS idx_field_inspections_status
  ON public.field_inspections (status);

CREATE INDEX IF NOT EXISTS idx_field_inspections_scheduled
  ON public.field_inspections (scheduled_for);

CREATE INDEX IF NOT EXISTS idx_field_inspections_token
  ON public.field_inspections (assignment_token);

CREATE INDEX IF NOT EXISTS idx_field_inspections_created
  ON public.field_inspections (created_at DESC);

-- 8.3 UPDATED_AT TRIGGER
DROP TRIGGER IF EXISTS trg_field_inspections_updated_at ON public.field_inspections;
CREATE TRIGGER trg_field_inspections_updated_at
  BEFORE UPDATE ON public.field_inspections
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 8.4 CRYPTOGRAPHIC SEAL & IMMUTABILITY TRIGGER
-- Strictly guards against tampering with finalized records, establishes hash validity rules,
-- and forbids any modification to core assignment identity.
CREATE OR REPLACE FUNCTION public.check_field_inspection_immutability()
RETURNS TRIGGER AS $$
BEGIN
  -- ON INSERT:
  IF TG_OP = 'INSERT' THEN
    IF NEW.sha256_record_hash IS NOT NULL THEN
      RAISE EXCEPTION 'sha256_record_hash cannot be established upon assignment creation' USING ERRCODE = '23514';
    END IF;
    IF NEW.status IN ('COMPLETED', 'FLAGGED_DISCREPANCY') THEN
      RAISE EXCEPTION 'Inspections cannot be created directly in a finalized state' USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
  END IF;

  -- ON UPDATE:
  -- 1. If inspection was already finalized, block ALL modifications (airtight seal)
  IF OLD.status IN ('COMPLETED', 'FLAGGED_DISCREPANCY') THEN
    RAISE EXCEPTION 'Cryptographic seal violation: Finalized inspection records are completely immutable' USING ERRCODE = '23514';
  END IF;

  -- 2. Hash transition integrity:
  -- sha256_record_hash can ONLY be established when transitioning to COMPLETED or FLAGGED_DISCREPANCY
  IF NEW.status IN ('COMPLETED', 'FLAGGED_DISCREPANCY') THEN
    IF NEW.sha256_record_hash IS NULL OR length(NEW.sha256_record_hash) != 64 THEN
      RAISE EXCEPTION 'Finalized inspection must contain a valid 64-character SHA-256 record hash' USING ERRCODE = '23514';
    END IF;
    IF NEW.completed_at IS NULL THEN
      RAISE EXCEPTION 'Finalized inspection must record completed_at timestamp' USING ERRCODE = '23514';
    END IF;
    IF NEW.gps_latitude IS NULL OR NEW.gps_longitude IS NULL THEN
      RAISE EXCEPTION 'Finalized inspection must record GPS proof-of-presence coordinates' USING ERRCODE = '23514';
    END IF;
    IF NEW.geofence_status IS NULL THEN
      RAISE EXCEPTION 'Finalized inspection must record geofence verification status' USING ERRCODE = '23514';
    END IF;
  ELSE
    -- An unfinalized record (ASSIGNED or IN_PROGRESS) cannot have a sha256_record_hash
    IF NEW.sha256_record_hash IS NOT NULL THEN
      RAISE EXCEPTION 'sha256_record_hash can only be established upon finalization via submit_field_inspection()' USING ERRCODE = '23514';
    END IF;
  END IF;

  -- 3. Invariant check: assignment identity cannot be altered during execution
  IF (NEW.id IS DISTINCT FROM OLD.id) OR
     (NEW.assignment_token IS DISTINCT FROM OLD.assignment_token) OR
     (NEW.center_id IS DISTINCT FROM OLD.center_id) OR
     (NEW.project_id IS DISTINCT FROM OLD.project_id) OR
     (NEW.ngo_id IS DISTINCT FROM OLD.ngo_id) OR
     (NEW.assigned_by IS DISTINCT FROM OLD.assigned_by) OR
     (NEW.assigned_at IS DISTINCT FROM OLD.assigned_at) THEN
    RAISE EXCEPTION 'Core assignment identity fields are immutable' USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_field_inspections_immutability ON public.field_inspections;
CREATE TRIGGER trg_field_inspections_immutability
  BEFORE INSERT OR UPDATE ON public.field_inspections
  FOR EACH ROW EXECUTE FUNCTION public.check_field_inspection_immutability();

-- 8.5 AIRTIGHT ROW LEVEL SECURITY (RLS) POLICIES
-- ZERO DIRECT CLIENT UPDATE PATHS
ALTER TABLE public.field_inspections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "GovAuthority can view all inspections" ON public.field_inspections;
CREATE POLICY "GovAuthority can view all inspections"
  ON public.field_inspections
  FOR SELECT
  TO authenticated
  USING (public.is_government_authority());

DROP POLICY IF EXISTS "Field Officer can view assigned inspections" ON public.field_inspections;
CREATE POLICY "Field Officer can view assigned inspections"
  ON public.field_inspections
  FOR SELECT
  TO authenticated
  USING (inspector_user_id = auth.uid());

DROP POLICY IF EXISTS "NGO Head can view own NGO inspections" ON public.field_inspections;
CREATE POLICY "NGO Head can view own NGO inspections"
  ON public.field_inspections
  FOR SELECT
  TO authenticated
  USING (ngo_id = public.get_assigned_ngo_id());

-- STRICT AIRTIGHT RLS DEFENSE:
-- 1. DROP ALL DIRECT UPDATE POLICIES FOR ALL ROLES.
--    No browser/client can directly UPDATE public.field_inspections.
--    All updates must proceed through the verified SECURITY DEFINER submit RPC.
-- 2. DROP ALL DIRECT INSERT POLICIES FOR ALL ROLES.
--    No browser/client can directly INSERT into public.field_inspections.
--    All assignments must proceed through the verified SECURITY DEFINER create RPC.
-- 3. ZERO DELETE POLICIES FOR ALL ROLES.
--    No inspection can ever be deleted.
DROP POLICY IF EXISTS "GovAuthority can update inspections" ON public.field_inspections;
DROP POLICY IF EXISTS "Field Officer can update assigned inspections" ON public.field_inspections;
DROP POLICY IF EXISTS "GovAuthority can insert inspections" ON public.field_inspections;

-- 8.6 RPC: CREATE FIELD INSPECTION ASSIGNMENT (GOVERNMENT AUTHORITY)
CREATE OR REPLACE FUNCTION public.create_field_inspection_assignment(
  p_center_id TEXT,
  p_inspector_user_id UUID,
  p_inspector_name TEXT DEFAULT NULL,
  p_officer_badge_id TEXT DEFAULT NULL,
  p_scheduled_for DATE DEFAULT ((CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::date)
)
RETURNS JSONB AS $$
DECLARE
  v_caller_id UUID;
  v_center RECORD;
  v_inspector RECORD;
  v_inspector_name TEXT;
  v_new_id UUID;
  v_token TEXT;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to create inspection assignment' USING ERRCODE = '42501';
  END IF;

  IF NOT public.is_government_authority() THEN
    RAISE EXCEPTION 'Access denied: Only authorized Government Authority can assign field inspections' USING ERRCODE = '42501';
  END IF;

  SELECT id, project_id, ngo_id, status
  INTO v_center
  FROM public.welfare_centers
  WHERE id = p_center_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Welfare center not found: %', p_center_id USING ERRCODE = 'P0002';
  END IF;

  IF p_inspector_user_id IS NULL THEN
    RAISE EXCEPTION 'inspector_user_id is required. Inspections must be assigned to a designated Field Officer' USING ERRCODE = '22023';
  END IF;

  SELECT id, name, role, designation
  INTO v_inspector
  FROM public.user_profiles
  WHERE id = p_inspector_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Inspector user profile % not found in public.user_profiles', p_inspector_user_id USING ERRCODE = 'P0002';
  END IF;

  IF v_inspector.role != 'FIELD_OFFICER' THEN
    RAISE EXCEPTION 'Assignment rejected: User % has role %, but inspections may only be assigned to users with role FIELD_OFFICER',
      p_inspector_user_id, v_inspector.role USING ERRCODE = '42501';
  END IF;

  v_inspector_name := COALESCE(NULLIF(p_inspector_name, ''), v_inspector.name);

  v_new_id := gen_random_uuid();
  v_token := 'DISP-' || to_char(p_scheduled_for, 'YYYYMMDD') || '-' || upper(substr(gen_random_uuid()::text, 1, 8));

  INSERT INTO public.field_inspections (
    id,
    assignment_token,
    center_id,
    project_id,
    ngo_id,
    inspector_user_id,
    inspector_name,
    officer_badge_id,
    assigned_by,
    assigned_at,
    scheduled_for,
    status
  ) VALUES (
    v_new_id,
    v_token,
    p_center_id,
    v_center.project_id,
    v_center.ngo_id,
    p_inspector_user_id,
    v_inspector_name,
    p_officer_badge_id,
    v_caller_id,
    NOW(),
    p_scheduled_for,
    'ASSIGNED'
  );

  RETURN jsonb_build_object(
    'success', true,
    'inspection_id', v_new_id,
    'assignment_token', v_token,
    'center_id', p_center_id,
    'project_id', v_center.project_id,
    'ngo_id', v_center.ngo_id,
    'inspector_user_id', p_inspector_user_id,
    'inspector_name', v_inspector_name,
    'scheduled_for', p_scheduled_for,
    'status', 'ASSIGNED',
    'message', 'Inspection successfully assigned to Field Officer.'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 8.7 RPC: SUBMIT FIELD INSPECTION (SECURE ATOMIC EXECUTION & SHA-256 SEALING)
CREATE OR REPLACE FUNCTION public.submit_field_inspection(
  p_inspection_id UUID,
  p_gps_latitude DOUBLE PRECISION,
  p_gps_longitude DOUBLE PRECISION,
  p_gps_accuracy_meters NUMERIC DEFAULT 10.0,
  p_gps_captured_at TIMESTAMPTZ DEFAULT NULL,
  p_physical_headcount INTEGER DEFAULT 0,
  p_pos_meal_count INTEGER DEFAULT NULL,
  p_checklist JSONB DEFAULT '{}'::jsonb,
  p_evidence_file_path TEXT DEFAULT NULL,
  p_evidence_sha256 TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_caller_id UUID;
  v_inspection RECORD;
  v_center RECORD;
  v_dlat DOUBLE PRECISION;
  v_dlng DOUBLE PRECISION;
  v_a DOUBLE PRECISION;
  v_c DOUBLE PRECISION;
  v_calculated_distance NUMERIC;
  v_geofence_status TEXT;
  v_pos_meal_count INTEGER;
  v_discrepancy_delta INTEGER;
  v_status TEXT;
  v_completed_at TIMESTAMPTZ;
  v_gps_captured_at TIMESTAMPTZ;
  v_raw_hash_input TEXT;
  v_record_hash TEXT;
BEGIN
  -- 1. Authentication check
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to submit field inspection' USING ERRCODE = '42501';
  END IF;

  -- 2. Validate required GPS fields
  IF p_gps_latitude IS NULL OR p_gps_longitude IS NULL THEN
    RAISE EXCEPTION 'Valid GPS latitude and longitude are mandatory for physical inspection proof-of-presence' USING ERRCODE = '22023';
  END IF;

  IF p_gps_latitude < -90 OR p_gps_latitude > 90 OR p_gps_longitude < -180 OR p_gps_longitude > 180 THEN
    RAISE EXCEPTION 'GPS coordinates out of valid range (lat: %, lng: %)', p_gps_latitude, p_gps_longitude USING ERRCODE = '22023';
  END IF;

  -- 3. Validate GPS device capture timestamp
  v_completed_at := clock_timestamp();
  v_gps_captured_at := COALESCE(p_gps_captured_at, v_completed_at);

  IF v_gps_captured_at > (v_completed_at + INTERVAL '2 minutes') THEN
    RAISE EXCEPTION 'GPS timestamp cannot be in the future (captured_at: %, server_now: %)', v_gps_captured_at, v_completed_at USING ERRCODE = '22023';
  END IF;

  IF v_gps_captured_at < (v_completed_at - INTERVAL '30 minutes') THEN
    RAISE EXCEPTION 'Stale GPS fix: GPS coordinates were captured more than 30 minutes ago (captured_at: %, server_now: %)', v_gps_captured_at, v_completed_at USING ERRCODE = '22023';
  END IF;

  -- 4. Lock and verify inspection record
  SELECT *
  INTO v_inspection
  FROM public.field_inspections
  WHERE id = p_inspection_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Inspection record % not found', p_inspection_id USING ERRCODE = 'P0002';
  END IF;

  -- 5. Verify inspector authorization: Must be the assigned officer (or Government Authority supervisor)
  IF NOT (
    v_inspection.inspector_user_id = v_caller_id OR
    public.is_government_authority()
  ) THEN
    RAISE EXCEPTION 'Access denied: Caller % is not authorized to submit inspection % (Assigned officer: %)', 
      v_caller_id, p_inspection_id, v_inspection.inspector_user_id USING ERRCODE = '42501';
  END IF;

  -- Prevent re-submitting or tampering with finalized inspections
  IF v_inspection.status IN ('COMPLETED', 'FLAGGED_DISCREPANCY') THEN
    RAISE EXCEPTION 'Inspection % has already been finalized (% status) and cannot be modified or re-submitted', 
      p_inspection_id, v_inspection.status USING ERRCODE = 'P0001';
  END IF;

  -- 6. Verify center/project/NGO hierarchy
  SELECT id, project_id, ngo_id, latitude, longitude, geofence_radius_meters, status
  INTO v_center
  FROM public.welfare_centers
  WHERE id = v_inspection.center_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Welfare center % linked to inspection not found', v_inspection.center_id USING ERRCODE = 'P0002';
  END IF;

  IF v_center.project_id != v_inspection.project_id OR v_center.ngo_id != v_inspection.ngo_id THEN
    RAISE EXCEPTION 'Hierarchy mismatch: Center % does not match inspection project/NGO hierarchy', v_inspection.center_id USING ERRCODE = 'P0001';
  END IF;

  -- 7. Calculate Haversine geodesic distance in meters and determine geofence status
  v_dlat := radians(p_gps_latitude - v_center.latitude);
  v_dlng := radians(p_gps_longitude - v_center.longitude);
  v_a := sin(v_dlat / 2.0)^2 + cos(radians(v_center.latitude)) * cos(radians(p_gps_latitude)) * sin(v_dlng / 2.0)^2;
  v_c := 2.0 * atan2(sqrt(v_a), sqrt(1.0 - v_a));
  v_calculated_distance := round((6371000.0 * v_c)::numeric, 2);

  IF v_calculated_distance <= v_center.geofence_radius_meters THEN
    v_geofence_status := 'VERIFIED_INSIDE';
  ELSE
    v_geofence_status := 'BREACH_OUTSIDE';
  END IF;

  -- 8. Validate physical verification headcount and determine POS meal count
  IF p_physical_headcount < 0 THEN
    RAISE EXCEPTION 'Physical headcount cannot be negative: %', p_physical_headcount USING ERRCODE = '22023';
  END IF;

  IF p_pos_meal_count IS NOT NULL THEN
    v_pos_meal_count := p_pos_meal_count;
  ELSE
    SELECT COUNT(*)
    INTO v_pos_meal_count
    FROM public.meal_transactions
    WHERE center_id = v_inspection.center_id
      AND service_date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::date
      AND status = 'ALLOWED';
  END IF;

  v_discrepancy_delta := p_physical_headcount - v_pos_meal_count;

  -- 9. Determine final inspection status
  IF v_geofence_status = 'BREACH_OUTSIDE' OR abs(v_discrepancy_delta) > GREATEST(10, (v_pos_meal_count * 0.15)::integer) THEN
    v_status := 'FLAGGED_DISCREPANCY';
  ELSE
    v_status := 'COMPLETED';
  END IF;

  -- 10. Compute tamper-evident SHA-256 digital fingerprint using extensions.digest
  v_raw_hash_input := v_inspection.id::text || '|' ||
                      v_inspection.assignment_token || '|' ||
                      v_inspection.center_id || '|' ||
                      v_inspection.project_id || '|' ||
                      v_inspection.ngo_id || '|' ||
                      COALESCE(v_inspection.inspector_user_id::text, v_caller_id::text) || '|' ||
                      p_gps_latitude::text || '|' ||
                      p_gps_longitude::text || '|' ||
                      v_gps_captured_at::text || '|' ||
                      v_calculated_distance::text || '|' ||
                      v_geofence_status || '|' ||
                      p_physical_headcount::text || '|' ||
                      v_pos_meal_count::text || '|' ||
                      v_discrepancy_delta::text || '|' ||
                      v_status || '|' ||
                      COALESCE(p_evidence_sha256, 'NO_EVIDENCE') || '|' ||
                      v_completed_at::text;

  v_record_hash := encode(extensions.digest(v_raw_hash_input, 'sha256'), 'hex');

  -- 11. Atomically update the inspection record (Executed via SECURITY DEFINER)
  UPDATE public.field_inspections
  SET
    started_at = COALESCE(started_at, v_completed_at),
    completed_at = v_completed_at,
    status = v_status,
    gps_latitude = p_gps_latitude,
    gps_longitude = p_gps_longitude,
    gps_accuracy_meters = p_gps_accuracy_meters,
    gps_captured_at = v_gps_captured_at,
    geofence_distance_meters = v_calculated_distance,
    geofence_status = v_geofence_status,
    physical_headcount = p_physical_headcount,
    pos_meal_count = v_pos_meal_count,
    discrepancy_delta = v_discrepancy_delta,
    checklist = COALESCE(p_checklist, '{}'::jsonb),
    evidence_file_path = p_evidence_file_path,
    evidence_sha256 = p_evidence_sha256,
    evidence_captured_at = CASE WHEN p_evidence_file_path IS NOT NULL THEN v_gps_captured_at ELSE NULL END,
    notes = p_notes,
    sha256_record_hash = v_record_hash,
    updated_at = v_completed_at
  WHERE id = p_inspection_id;

  -- 12. Return structured JSONB summary
  RETURN jsonb_build_object(
    'success', true,
    'inspection_id', p_inspection_id,
    'assignment_token', v_inspection.assignment_token,
    'center_id', v_inspection.center_id,
    'status', v_status,
    'geofence_status', v_geofence_status,
    'geofence_distance_meters', v_calculated_distance,
    'gps_captured_at', v_gps_captured_at,
    'physical_headcount', p_physical_headcount,
    'pos_meal_count', v_pos_meal_count,
    'discrepancy_delta', v_discrepancy_delta,
    'sha256_record_hash', v_record_hash,
    'completed_at', v_completed_at,
    'message', CASE
      WHEN v_status = 'COMPLETED' THEN 'Field inspection successfully verified and sealed with SHA-256 record hash.'
      ELSE 'Field inspection completed with FLAGGED DISCREPANCY: Geofence breach or headcount divergence recorded.'
    END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

