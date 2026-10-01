export type UserRole = 'GOVERNMENT_AUTHORITY' | 'NGO_HEAD' | 'FIELD_OFFICER';
export type NGOStatus = 'Active' | 'Under Review' | 'Suspended';
export type ServiceType = 'Subsidized Meals' | 'Shelter Nutrition' | 'Day Care Outreach';
export type CCTVStreamStatus = 'Active' | 'Intermittent' | 'Offline';
export type FinancialAuditStatus = 'Reconciled' | 'Under Review' | 'Audit Pending';

export type BeneficiaryStatus = 'Active' | 'Suspended' | 'Deceased';
export type MealTransactionStatus = 'ALLOWED' | 'DENIED';
export type VerificationMethod = 'QR_POS' | 'BIOMETRIC_POS' | 'MANUAL_OVERRIDE';

export type FieldInspectionStatus = 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'FLAGGED_DISCREPANCY';
export type GeofenceStatus = 'VERIFIED_INSIDE' | 'BREACH_OUTSIDE';

export interface InspectionChecklist {
  hygiene?: {
    rating?: string;
    cleanliness?: string;
    pest_control_valid?: boolean;
    notes?: string;
  };
  food_quality?: {
    rating?: string;
    sample_tested?: boolean;
    temperature_adequate?: boolean;
    notes?: string;
  };
  stock?: {
    stock_adequate?: boolean;
    registers_updated?: boolean;
    variance_detected?: boolean;
    notes?: string;
  };
  notice_board?: {
    menu_displayed?: boolean;
    toll_free_active?: boolean;
    entitlement_board_present?: boolean;
    notes?: string;
  };
  [key: string]: unknown;
}

export interface FieldInspectionResult {
  success: boolean;
  inspection_id: string;
  assignment_token: string;
  center_id: string;
  status: FieldInspectionStatus;
  geofence_status: GeofenceStatus;
  geofence_distance_meters: number;
  gps_captured_at: string;
  physical_headcount: number;
  pos_meal_count: number;
  discrepancy_delta: number;
  sha256_record_hash: string;
  completed_at: string;
  message: string;
}

export interface CreateFieldInspectionResult {
  success: boolean;
  inspection_id: string;
  assignment_token: string;
  center_id: string;
  project_id: string;
  ngo_id: string;
  inspector_user_id: string;
  inspector_name: string;
  scheduled_for: string;
  status: FieldInspectionStatus;
  message: string;
}

export interface MealVerificationResult {
  success: boolean;
  allowed: boolean;
  transaction_id: string;
  beneficiary_id: string;
  beneficiary_name: string;
  center_id: string;
  service_date: string;
  service_timestamp: string;
  meal_sequence: 1 | 2 | 3;
  meals_today: number;
  status: MealTransactionStatus;
  denial_reason: string | null;
  record_hash: string;
  message: string;
}

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string; // references auth.users.id
          email: string;
          name: string;
          role: UserRole;
          designation: string;
          department_or_ngo: string;
          assigned_ngo_id: string | null; // NULL for GOVERNMENT_AUTHORITY and FIELD_OFFICER, required for NGO_HEAD
          account_type: 'Pre-provisioned Government Authority' | 'Government-provisioned NGO Head' | 'Government-provisioned Field Officer';
          provisioned_by: string | null; // user_id of government authority who provisioned this account
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          role: UserRole;
          designation: string;
          department_or_ngo: string;
          assigned_ngo_id?: string | null;
          account_type: 'Pre-provisioned Government Authority' | 'Government-provisioned NGO Head' | 'Government-provisioned Field Officer';
          provisioned_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: UserRole;
          designation?: string;
          department_or_ngo?: string;
          assigned_ngo_id?: string | null;
          account_type?: 'Pre-provisioned Government Authority' | 'Government-provisioned NGO Head' | 'Government-provisioned Field Officer';
          updated_at?: string;
        };
        Relationships: [];
      };
      ngos: {
        Row: {
          id: string;
          name: string;
          darpan_reg_no: string;
          pan_number: string;
          nodal_name: string;
          nodal_designation: string;
          nodal_phone: string;
          nodal_email: string;
          status: NGOStatus;
          compliance_score: number;
          registered_since: string;
          registered_office: string;
          created_by: string | null; // government authority user_id
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          darpan_reg_no: string;
          pan_number: string;
          nodal_name: string;
          nodal_designation: string;
          nodal_phone: string;
          nodal_email: string;
          status?: NGOStatus;
          compliance_score?: number;
          registered_since?: string;
          registered_office: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          darpan_reg_no?: string;
          pan_number?: string;
          nodal_name?: string;
          nodal_designation?: string;
          nodal_phone?: string;
          nodal_email?: string;
          status?: NGOStatus;
          compliance_score?: number;
          registered_since?: string;
          registered_office?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      government_welfare_projects: {
        Row: {
          id: string;
          ngo_id: string;
          project_code: string;
          scheme_name: string;
          sanction_order_no: string;
          financial_year: string;
          service_type: ServiceType;
          target_daily_beneficiaries: number;
          sanctioned_budget: number;
          released_budget: number;
          spent_budget: number;
          financial_audit_status: FinancialAuditStatus;
          valid_from: string;
          valid_until: string;
          status: 'Operational' | 'Renewal Pending' | 'Suspended';
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          ngo_id: string;
          project_code: string;
          scheme_name: string;
          sanction_order_no: string;
          financial_year: string;
          service_type?: ServiceType;
          target_daily_beneficiaries: number;
          sanctioned_budget: number;
          released_budget: number;
          spent_budget: number;
          financial_audit_status?: FinancialAuditStatus;
          valid_from: string;
          valid_until: string;
          status?: 'Operational' | 'Renewal Pending' | 'Suspended';
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          ngo_id?: string;
          project_code?: string;
          scheme_name?: string;
          sanction_order_no?: string;
          financial_year?: string;
          service_type?: ServiceType;
          target_daily_beneficiaries?: number;
          sanctioned_budget?: number;
          released_budget?: number;
          spent_budget?: number;
          financial_audit_status?: FinancialAuditStatus;
          valid_from?: string;
          valid_until?: string;
          status?: 'Operational' | 'Renewal Pending' | 'Suspended';
          updated_at?: string;
        };
        Relationships: [];
      };
      welfare_centers: {
        Row: {
          id: string;
          project_id: string;
          ngo_id: string;
          code: string;
          name: string;
          district: string;
          state: string;
          address: string;
          latitude: number;
          longitude: number;
          geofence_radius_meters: number;
          beneficiary_capacity: number;
          cctv_camera_count: number;
          cctv_stream_status: CCTVStreamStatus;
          status: 'Operational' | 'Temporarily Closed' | 'Under Inspection';
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          ngo_id: string;
          code: string;
          name: string;
          district: string;
          state: string;
          address: string;
          latitude: number;
          longitude: number;
          geofence_radius_meters: number;
          beneficiary_capacity: number;
          cctv_camera_count?: number;
          cctv_stream_status?: CCTVStreamStatus;
          status?: 'Operational' | 'Temporarily Closed' | 'Under Inspection';
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          ngo_id?: string;
          code?: string;
          name?: string;
          district?: string;
          state?: string;
          address?: string;
          latitude?: number;
          longitude?: number;
          geofence_radius_meters?: number;
          beneficiary_capacity?: number;
          cctv_camera_count?: number;
          cctv_stream_status?: CCTVStreamStatus;
          status?: 'Operational' | 'Temporarily Closed' | 'Under Inspection';
          updated_at?: string;
        };
        Relationships: [];
      };
      beneficiaries: {
        Row: {
          id: string;
          full_name: string;
          identification_token: string;
          category: string;
          registered_center_id: string;
          project_id: string;
          ngo_id: string;
          status: BeneficiaryStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          identification_token: string;
          category?: string;
          registered_center_id: string;
          project_id: string;
          ngo_id: string;
          status?: BeneficiaryStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          identification_token?: string;
          category?: string;
          registered_center_id?: string;
          project_id?: string;
          ngo_id?: string;
          status?: BeneficiaryStatus;
          updated_at?: string;
        };
        Relationships: [];
      };
      meal_transactions: {
        Row: {
          id: string;
          beneficiary_id: string;
          center_id: string;
          project_id: string;
          ngo_id: string;
          service_date: string;
          service_timestamp: string;
          meal_sequence: 1 | 2 | 3;
          status: MealTransactionStatus;
          denial_reason: string | null;
          verification_method: VerificationMethod;
          terminal_id: string;
          dispensed_by: string | null;
          sha256_record_hash: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          beneficiary_id: string;
          center_id: string;
          project_id: string;
          ngo_id: string;
          service_date?: string;
          service_timestamp?: string;
          meal_sequence: 1 | 2 | 3;
          status: MealTransactionStatus;
          denial_reason?: string | null;
          verification_method?: VerificationMethod;
          terminal_id?: string;
          dispensed_by?: string | null;
          sha256_record_hash: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          beneficiary_id?: string;
          center_id?: string;
          project_id?: string;
          ngo_id?: string;
          service_date?: string;
          service_timestamp?: string;
          meal_sequence?: 1 | 2 | 3;
          status?: MealTransactionStatus;
          denial_reason?: string | null;
          verification_method?: VerificationMethod;
          terminal_id?: string;
          dispensed_by?: string | null;
          sha256_record_hash?: string;
        };
        Relationships: [];
      };
      field_inspections: {
        Row: {
          id: string;
          assignment_token: string;
          center_id: string;
          project_id: string;
          ngo_id: string;
          inspector_user_id: string;
          inspector_name: string;
          officer_badge_id: string | null;
          assigned_by: string | null;
          assigned_at: string;
          scheduled_for: string;
          started_at: string | null;
          completed_at: string | null;
          status: FieldInspectionStatus;
          gps_latitude: number | null;
          gps_longitude: number | null;
          gps_accuracy_meters: number | null;
          gps_captured_at: string | null;
          geofence_distance_meters: number | null;
          geofence_status: GeofenceStatus | null;
          physical_headcount: number | null;
          pos_meal_count: number | null;
          discrepancy_delta: number | null;
          checklist: InspectionChecklist;
          evidence_file_path: string | null;
          evidence_sha256: string | null;
          evidence_captured_at: string | null;
          notes: string | null;
          sha256_record_hash: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          assignment_token?: string;
          center_id: string;
          project_id: string;
          ngo_id: string;
          inspector_user_id: string;
          inspector_name?: string;
          officer_badge_id?: string | null;
          assigned_by?: string | null;
          assigned_at?: string;
          scheduled_for?: string;
          started_at?: string | null;
          completed_at?: string | null;
          status?: FieldInspectionStatus;
          gps_latitude?: number | null;
          gps_longitude?: number | null;
          gps_accuracy_meters?: number | null;
          gps_captured_at?: string | null;
          geofence_distance_meters?: number | null;
          geofence_status?: GeofenceStatus | null;
          physical_headcount?: number | null;
          pos_meal_count?: number | null;
          discrepancy_delta?: number | null;
          checklist?: InspectionChecklist;
          evidence_file_path?: string | null;
          evidence_sha256?: string | null;
          evidence_captured_at?: string | null;
          notes?: string | null;
          sha256_record_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          assignment_token?: string;
          center_id?: string;
          project_id?: string;
          ngo_id?: string;
          inspector_user_id?: string;
          inspector_name?: string;
          officer_badge_id?: string | null;
          assigned_by?: string | null;
          assigned_at?: string;
          scheduled_for?: string;
          started_at?: string | null;
          completed_at?: string | null;
          status?: FieldInspectionStatus;
          gps_latitude?: number | null;
          gps_longitude?: number | null;
          gps_accuracy_meters?: number | null;
          gps_captured_at?: string | null;
          geofence_distance_meters?: number | null;
          geofence_status?: GeofenceStatus | null;
          physical_headcount?: number | null;
          pos_meal_count?: number | null;
          discrepancy_delta?: number | null;
          checklist?: InspectionChecklist;
          evidence_file_path?: string | null;
          evidence_sha256?: string | null;
          evidence_captured_at?: string | null;
          notes?: string | null;
          sha256_record_hash?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      process_meal_verification: {
        Args: {
          p_beneficiary_id: string;
          p_center_id: string;
          p_verification_method: string;
          p_terminal_id: string;
        };
        Returns: MealVerificationResult;
      };
      create_field_inspection_assignment: {
        Args: {
          p_center_id: string;
          p_inspector_user_id: string;
          p_inspector_name?: string | null;
          p_officer_badge_id?: string | null;
          p_scheduled_for?: string;
        };
        Returns: CreateFieldInspectionResult;
      };
      submit_field_inspection: {
        Args: {
          p_inspection_id: string;
          p_gps_latitude: number;
          p_gps_longitude: number;
          p_gps_accuracy_meters?: number;
          p_gps_captured_at?: string | null;
          p_physical_headcount?: number;
          p_pos_meal_count?: number | null;
          p_checklist?: Record<string, unknown>;
          p_evidence_file_path?: string | null;
          p_evidence_sha256?: string | null;
          p_notes?: string | null;
        };
        Returns: FieldInspectionResult;
      };
      is_government_authority: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_field_officer: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      get_assigned_ngo_id: {
        Args: Record<string, never>;
        Returns: string | null;
      };
    };
  };
}
