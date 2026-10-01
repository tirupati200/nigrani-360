-- ==============================================================================
-- NIGRANI 360 - BENEFICIARY REGISTRATION & 2-MEAL VERIFICATION MIGRATION
-- SIH26095: Smart Real-Time Monitoring & Inspection of Government Welfare Projects
-- Module: Beneficiary Enrollment, Daily Entitlement Engine & Immutable Audit Ledger
-- ==============================================================================

-- Ensure pgcrypto is enabled for gen_random_uuid(), digest(), encode()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. BENEFICIARIES TABLE
-- ==============================================================================
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

-- ==============================================================================
-- 2. MEAL TRANSACTIONS TABLE (IMMUTABLE AUDIT LEDGER)
-- ==============================================================================
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

-- ==============================================================================
-- 3. INDEXES & CONSTRAINTS
-- ==============================================================================

-- 3.1 Partial Unique Index: Database-engine guarantee of max 1 Meal #1 and max 1 Meal #2 per IST day
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_allowed_daily_meal
  ON public.meal_transactions (beneficiary_id, service_date, meal_sequence)
  WHERE status = 'ALLOWED';

-- 3.2 High-performance lookup indexes
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

-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.beneficiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_transactions ENABLE ROW LEVEL SECURITY;

-- 4.1 Beneficiaries Policies
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

-- 4.2 Meal Transactions Policies (Strict Append-Only: No UPDATE, No DELETE)
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

-- ==============================================================================
-- 5. UPDATED_AT AUDIT TRIGGER FOR BENEFICIARIES
-- ==============================================================================
DROP TRIGGER IF EXISTS trg_beneficiaries_updated_at ON public.beneficiaries;
CREATE TRIGGER trg_beneficiaries_updated_at
  BEFORE UPDATE ON public.beneficiaries
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 6. ATOMIC 2-MEAL VERIFICATION FUNCTION (SECURITY DEFINER)
-- ==============================================================================
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
