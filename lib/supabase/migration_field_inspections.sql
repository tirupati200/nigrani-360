-- ==============================================================================
-- NIGRANI 360 - FIELD INSPECTION WORKFLOW DATABASE FOUNDATION (AIRTIGHT SECURITY)
-- SIH26095: Smart Real-Time Monitoring & Inspection of Government Welfare Projects
-- Migration: Field Inspections, Zero-Direct-Update RLS, Immutable Sealing & RPC
-- ==============================================================================

-- 1. ENSURE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

-- ==============================================================================
-- 2. FIELD OFFICER ROLE INTEGRATION & AUTHENTICATION FOUNDATION
-- ==============================================================================

-- 2.1 Add 'FIELD_OFFICER' to user_role_type enum if not already present
DO $$ BEGIN
  ALTER TYPE user_role_type ADD VALUE IF NOT EXISTS 'FIELD_OFFICER';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2.2 Update user_profiles constraint for strict tenant isolation and role validation
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS chk_ngo_head_has_assigned_ngo;
ALTER TABLE public.user_profiles ADD CONSTRAINT chk_ngo_head_has_assigned_ngo CHECK (
  (role = 'NGO_HEAD' AND assigned_ngo_id IS NOT NULL) OR
  (role = 'GOVERNMENT_AUTHORITY' AND assigned_ngo_id IS NULL) OR
  (role = 'FIELD_OFFICER' AND assigned_ngo_id IS NULL)
);

-- 2.3 Update user_profiles account_type check
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_account_type_check;
ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_account_type_check CHECK (
  account_type IN (
    'Pre-provisioned Government Authority',
    'Government-provisioned NGO Head',
    'Government-provisioned Field Officer'
  )
);

-- 2.4 Helper function: Check if current caller is an authorized Field Officer
CREATE OR REPLACE FUNCTION public.is_field_officer()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'FIELD_OFFICER'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- 2.5 Ensure all authenticated users (including Field Officers) can read their own profile
DROP POLICY IF EXISTS "NGO Head can view only own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- ==============================================================================
-- 3. FIELD INSPECTIONS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.field_inspections (
  -- 3.1 Inspection Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_token TEXT NOT NULL UNIQUE DEFAULT (
    'DISP-' || to_char((CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::date, 'YYYYMMDD') || '-' || upper(substr(gen_random_uuid()::text, 1, 8))
  ),
  center_id TEXT NOT NULL REFERENCES public.welfare_centers(id) ON DELETE RESTRICT,
  project_id TEXT NOT NULL REFERENCES public.government_welfare_projects(id) ON DELETE RESTRICT,
  ngo_id TEXT NOT NULL REFERENCES public.ngos(id) ON DELETE RESTRICT,

  -- 3.2 Inspector Assignment (Mandatory Field Officer Link)
  inspector_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  inspector_name TEXT NOT NULL,
  officer_badge_id TEXT DEFAULT NULL,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scheduled_for DATE NOT NULL DEFAULT ((CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::date),

  -- 3.3 Inspection Execution
  started_at TIMESTAMPTZ DEFAULT NULL,
  completed_at TIMESTAMPTZ DEFAULT NULL,
  status TEXT NOT NULL DEFAULT 'ASSIGNED' CHECK (
    status IN ('ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'FLAGGED_DISCREPANCY')
  ),

  -- 3.4 GPS Proof & Geofence Telemetry
  gps_latitude DOUBLE PRECISION DEFAULT NULL,
  gps_longitude DOUBLE PRECISION DEFAULT NULL,
  gps_accuracy_meters NUMERIC(8, 2) DEFAULT NULL,
  gps_captured_at TIMESTAMPTZ DEFAULT NULL,
  geofence_distance_meters NUMERIC(8, 2) DEFAULT NULL,
  geofence_status TEXT DEFAULT NULL CHECK (
    geofence_status IS NULL OR geofence_status IN ('VERIFIED_INSIDE', 'BREACH_OUTSIDE')
  ),

  -- 3.5 Physical Verification & Reconciliation
  physical_headcount INTEGER DEFAULT NULL CHECK (physical_headcount IS NULL OR physical_headcount >= 0),
  pos_meal_count INTEGER DEFAULT NULL CHECK (pos_meal_count IS NULL OR pos_meal_count >= 0),
  discrepancy_delta INTEGER DEFAULT NULL,

  -- 3.6 Inspection Checklist (Structured JSONB)
  checklist JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- 3.7 Evidence Metadata (Photos / Proof-of-presence)
  evidence_file_path TEXT DEFAULT NULL,
  evidence_sha256 TEXT DEFAULT NULL,
  evidence_captured_at TIMESTAMPTZ DEFAULT NULL,
  notes TEXT DEFAULT NULL,

  -- 3.8 Cryptographic Integrity & Timestamps
  sha256_record_hash TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 4. INDEXES FOR AUDIT & QUERY PERFORMANCE
-- ==============================================================================
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

-- ==============================================================================
-- 5. AUDIT IMMUTABILITY & UPDATED_AT TRIGGERS
-- ==============================================================================

-- 5.1 Updated_at trigger
DROP TRIGGER IF EXISTS trg_field_inspections_updated_at ON public.field_inspections;
CREATE TRIGGER trg_field_inspections_updated_at
  BEFORE UPDATE ON public.field_inspections
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5.2 Cryptographic Seal & Immutability Trigger:
-- Strictly guards against tampering with finalized records, establishes hash validity rules,
-- and forbids any modification to core assignment identity.
CREATE OR REPLACE FUNCTION public.check_field_inspection_immutability()
RETURNS TRIGGER AS $$
BEGIN
  -- ON INSERT:
  IF TG_OP = 'INSERT' THEN
    -- Assignment cannot be created with a pre-set hash
    IF NEW.sha256_record_hash IS NOT NULL THEN
      RAISE EXCEPTION 'sha256_record_hash cannot be established upon assignment creation' USING ERRCODE = '23514';
    END IF;
    -- Assignment cannot be created directly in a finalized state
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

-- ==============================================================================
-- 6. AIRTIGHT ROW LEVEL SECURITY (RLS) POLICIES
-- ZERO DIRECT CLIENT UPDATE PATHS
-- ==============================================================================
ALTER TABLE public.field_inspections ENABLE ROW LEVEL SECURITY;

-- 6.1 Government Authority: Can view all inspections
DROP POLICY IF EXISTS "GovAuthority can view all inspections" ON public.field_inspections;
CREATE POLICY "GovAuthority can view all inspections"
  ON public.field_inspections
  FOR SELECT
  TO authenticated
  USING (public.is_government_authority());

-- 6.2 Field Officer: Can view ONLY inspections assigned to their auth.uid()
DROP POLICY IF EXISTS "Field Officer can view assigned inspections" ON public.field_inspections;
CREATE POLICY "Field Officer can view assigned inspections"
  ON public.field_inspections
  FOR SELECT
  TO authenticated
  USING (inspector_user_id = auth.uid());

-- 6.3 NGO Head: Can ONLY view inspections belonging to their assigned NGO
DROP POLICY IF EXISTS "NGO Head can view own NGO inspections" ON public.field_inspections;
CREATE POLICY "NGO Head can view own NGO inspections"
  ON public.field_inspections
  FOR SELECT
  TO authenticated
  USING (ngo_id = public.get_assigned_ngo_id());

-- ==============================================================================
-- STRICT AIRTIGHT RLS DEFENSE:
-- 1. DROP ALL DIRECT UPDATE POLICIES FOR ALL ROLES.
--    No browser/client can directly UPDATE public.field_inspections.
--    All updates must proceed through the verified SECURITY DEFINER submit RPC.
-- 2. DROP ALL DIRECT INSERT POLICIES FOR ALL ROLES.
--    No browser/client can directly INSERT into public.field_inspections.
--    All assignments must proceed through the verified SECURITY DEFINER create RPC.
-- 3. ZERO DELETE POLICIES FOR ALL ROLES.
--    No inspection can ever be deleted.
-- ==============================================================================
DROP POLICY IF EXISTS "GovAuthority can update inspections" ON public.field_inspections;
DROP POLICY IF EXISTS "Field Officer can update assigned inspections" ON public.field_inspections;
DROP POLICY IF EXISTS "GovAuthority can insert inspections" ON public.field_inspections;

-- ==============================================================================
-- 7. RPC: CREATE FIELD INSPECTION ASSIGNMENT (GOVERNMENT AUTHORITY)
-- ==============================================================================
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
  -- 1. Authentication check
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to create inspection assignment' USING ERRCODE = '42501';
  END IF;

  -- 2. Authorization check: Caller must be Government Authority
  IF NOT public.is_government_authority() THEN
    RAISE EXCEPTION 'Access denied: Only authorized Government Authority can assign field inspections' USING ERRCODE = '42501';
  END IF;

  -- 3. Center validation
  SELECT id, project_id, ngo_id, status
  INTO v_center
  FROM public.welfare_centers
  WHERE id = p_center_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Welfare center not found: %', p_center_id USING ERRCODE = 'P0002';
  END IF;

  -- 4. Field Officer validation: Must be an authorized user with role 'FIELD_OFFICER'
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

  -- 5. Generate unique assignment identifiers
  v_new_id := gen_random_uuid();
  v_token := 'DISP-' || to_char(p_scheduled_for, 'YYYYMMDD') || '-' || upper(substr(gen_random_uuid()::text, 1, 8));

  -- 6. Insert new assignment record (Executed via SECURITY DEFINER)
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

-- ==============================================================================
-- 8. RPC: SUBMIT FIELD INSPECTION (SECURE ATOMIC EXECUTION & SHA-256 SEALING)
-- ==============================================================================
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
