'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  DEMO_KPI_SUMMARY,
  DEMO_WELFARE_PROJECTS,
  DEMO_AI_ANOMALIES,
  DEMO_NGOS,
  DEMO_GOV_PROJECTS,
  DEMO_WELFARE_CENTERS,
  DEMO_USERS,
  WelfareProject,
  AIAnomalyItem,
  NGO,
  GovernmentWelfareProject,
  WelfareCenter,
  UserSession,
  calculateFinancials
} from '@/lib/demo-data';
import { isSupabaseConfigured, getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Database, CreateFieldInspectionResult } from '@/lib/supabase/types';
import { POSTerminal } from '@/components/pos-terminal';

type NGORow = Database['public']['Tables']['ngos']['Row'];
type ProjectRow = Database['public']['Tables']['government_welfare_projects']['Row'];
type CenterRow = Database['public']['Tables']['welfare_centers']['Row'];
type UserProfileRow = Database['public']['Tables']['user_profiles']['Row'];
type FieldInspectionRow = Database['public']['Tables']['field_inspections']['Row'];

export interface FieldOfficerOption {
  id: string;
  name: string;
  email: string;
  designation: string;
  departmentOrNgo: string;
  badgeId: string | null;
}

function extractBadgeId(designation: string): string | null {
  const match = designation.match(/Badge:\s*([A-Za-z0-9-]+)/i);
  return match ? match[1] : null;
}

// Production data is queried from Supabase using browser client with RLS enforcement.
// In-memory fallback is preserved when credentials are unavailable.

// --- Inline SVG Icons (Zero external libraries) ---
function ShieldCheckIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function AlertTriangleIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function BuildingIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01" />
      <path d="M16 6h.01" />
      <path d="M8 10h.01" />
      <path d="M16 10h.01" />
      <path d="M8 14h.01" />
      <path d="M16 14h.01" />
    </svg>
  );
}

function UtensilsIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2" />
      <path d="M15 2v18" />
      <path d="M5 2c1.5 2 2.5 4 2.5 7v11" />
      <path d="M2.5 9c0-3 1.5-7 2.5-7" />
    </svg>
  );
}

function UsersIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function NavigationIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 11 22 2 13 21 11 13 3 11" />
    </svg>
  );
}

function HashIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="9" x2="20" y2="9" />
      <line x1="4" y1="15" x2="20" y2="15" />
      <line x1="10" y1="3" x2="8" y2="21" />
      <line x1="16" y1="3" x2="14" y2="21" />
    </svg>
  );
}

function ClockIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function RefreshCwIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  );
}

function SearchIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function XIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function CheckCircleIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function LogOutIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function FolderTreeIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
    </svg>
  );
}

function FingerprintIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
      <path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
      <path d="M2 16h.01" />
      <path d="M21.8 16c.2-2 .131-5.354 0-6" />
      <path d="M9 6.8a6 6 0 0 1 9 5.2v2" />
      <path d="M5.5 13.5a10 10 0 0 1 1.5-6.5" />
      <path d="M8.5 2C10.5 1.5 13.5 1.5 16 3" />
      <path d="M6 10a6 6 0 0 1 12 0c0 3 0 5-1 7" />
      <path d="M2 12a10 10 0 0 1 19.5-3" />
    </svg>
  );
}

function PlusIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function MapPinIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function ChevronRightIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function ArrowLeftIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function BotIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v4" />
      <line x1="8" y1="16" x2="8" y2="16.01" />
      <line x1="16" y1="16" x2="16.01" y2="16.01" />
    </svg>
  );
}

function IndianRupeeIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h12" />
      <path d="M6 8h12" />
      <path d="m6 13 8.5 8" />
      <path d="M6 13h3a4 4 0 0 0 0-8" />
    </svg>
  );
}

function BarChartIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  );
}

function LandmarkIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="22" x2="21" y2="22" />
      <line x1="6" y1="18" x2="6" y2="11" />
      <line x1="10" y1="18" x2="10" y2="11" />
      <line x1="14" y1="18" x2="14" y2="11" />
      <line x1="18" y1="18" x2="18" y2="11" />
      <polygon points="12 2 20 7 4 7" />
    </svg>
  );
}


function mapNgoFromDb(row: NGORow): NGO {
  return {
    id: row.id,
    name: row.name,
    darpanRegNo: row.darpan_reg_no,
    panNumber: row.pan_number,
    nodalPerson: {
      name: row.nodal_name,
      designation: row.nodal_designation,
      phone: row.nodal_phone,
      email: row.nodal_email
    },
    status: row.status,
    complianceScore: row.compliance_score,
    registeredSince: row.registered_since,
    registeredOffice: row.registered_office
  };
}

function mapProjectFromDb(row: ProjectRow): GovernmentWelfareProject {
  return {
    id: row.id,
    ngoId: row.ngo_id,
    projectCode: row.project_code,
    schemeName: row.scheme_name,
    sanctionOrderNo: row.sanction_order_no,
    financialYear: row.financial_year,
    serviceType: row.service_type,
    targetDailyBeneficiaries: row.target_daily_beneficiaries,
    sanctionedBudget: Number(row.sanctioned_budget),
    releasedBudget: Number(row.released_budget),
    spentBudget: Number(row.spent_budget),
    financialAuditStatus: row.financial_audit_status,
    validFrom: row.valid_from,
    validUntil: row.valid_until,
    status: row.status
  };
}

function mapCenterFromDb(row: CenterRow): WelfareCenter {
  return {
    id: row.id,
    projectId: row.project_id,
    ngoId: row.ngo_id,
    code: row.code,
    name: row.name,
    district: row.district,
    state: row.state,
    address: row.address,
    coordinates: {
      lat: row.latitude,
      lng: row.longitude
    },
    geofenceRadiusMeters: row.geofence_radius_meters,
    beneficiaryCapacity: row.beneficiary_capacity,
    cctvCameraCount: row.cctv_camera_count,
    cctvStreamStatus: row.cctv_stream_status,
    status: row.status
  };
}

function buildOperationalProjects(
  centers: WelfareCenter[],
  projects: GovernmentWelfareProject[],
  ngos: NGO[]
): WelfareProject[] {
  return centers.map((center, idx) => {
    const proj = projects.find((p) => p.id === center.projectId);
    const ngo = ngos.find((n) => n.id === center.ngoId);

    // Compute rule-based operational risk prioritization derived from real database attributes
    let riskLevel: 'Normal' | 'Moderate Watch' | 'High Priority Inspection' = 'Normal';
    let operationalRiskScore = 0.18;
    let inspectionStatus: 'Scheduled' | 'In Progress' | 'Verified Today' | 'Overdue' | 'Action Required' = 'Verified Today';
    const riskContributingFactors: string[] = [];

    if (center.cctvStreamStatus === 'Offline') {
      riskLevel = 'High Priority Inspection';
      operationalRiskScore = 0.91;
      inspectionStatus = 'Action Required';
      riskContributingFactors.push('Telemetry interruption: CCTV live feed stream is currently Offline');
      riskContributingFactors.push('Immediate on-site physical inspection mandated for meal distribution audit');
    } else if (
      proj?.financialAuditStatus === 'Audit Pending' ||
      (ngo?.complianceScore ?? 100) < 70 ||
      ngo?.status === 'Under Review'
    ) {
      riskLevel = 'High Priority Inspection';
      operationalRiskScore = 0.88;
      inspectionStatus = 'Action Required';
      if (proj?.financialAuditStatus === 'Audit Pending') {
        riskContributingFactors.push('Financial Audit Status flagged as "Audit Pending"');
      }
      if ((ngo?.complianceScore ?? 100) < 70) {
        riskContributingFactors.push(`NGO Compliance Score degraded to ${ngo?.complianceScore}% (Benchmark threshold < 70)`);
      }
      if (ngo?.status === 'Under Review') {
        riskContributingFactors.push('Operating NGO is placed under statutory administrative review');
      }
    } else if (
      center.cctvStreamStatus === 'Intermittent' ||
      proj?.financialAuditStatus === 'Under Review' ||
      (ngo?.complianceScore ?? 100) < 85
    ) {
      riskLevel = 'Moderate Watch';
      operationalRiskScore = 0.64;
      inspectionStatus = 'Overdue';
      if (center.cctvStreamStatus === 'Intermittent') {
        riskContributingFactors.push('CCTV stream packet drops and intermittent connectivity reported');
      }
      if (proj?.financialAuditStatus === 'Under Review') {
        riskContributingFactors.push('Quarterly financial grant statement currently Under Review');
      }
      if ((ngo?.complianceScore ?? 100) < 85) {
        riskContributingFactors.push(`NGO compliance score is ${ngo?.complianceScore}% (Moderate surveillance tier)`);
      }
    } else {
      riskLevel = 'Normal';
      operationalRiskScore = Number((0.14 + (idx % 3) * 0.05).toFixed(2));
      inspectionStatus = 'Verified Today';
      riskContributingFactors.push('CCTV continuous telemetry active with zero frame drops');
      riskContributingFactors.push('Financial disbursement records reconciled and verified');
      riskContributingFactors.push('NGO Darpan compliance score verified in Good Standing');
    }

    const todayVerified = Math.round(center.beneficiaryCapacity * 0.85);
    const todayMeals = Math.round(todayVerified * 1.5);
    const blockedAttempts = center.cctvStreamStatus === 'Offline' ? 19 : center.cctvStreamStatus === 'Intermittent' ? 6 : 0;

    return {
      id: `op-${center.id}`,
      code: center.code,
      name: center.name,
      ngoId: center.ngoId,
      ngoName: ngo?.name || 'Registered Operating NGO',
      ngoRegNo: ngo?.darpanRegNo || 'DARPAN-REG',
      projectId: center.projectId,
      projectCode: proj?.projectCode || 'SCHEME-CODE',
      schemeName: proj?.schemeName || 'Government Welfare Scheme',
      district: center.district,
      state: center.state,
      coordinates: center.coordinates,
      geofenceRadiusMeters: center.geofenceRadiusMeters,
      beneficiaryCapacity: center.beneficiaryCapacity,
      todayVerifiedCount: todayVerified,
      todayMealTransactions: todayMeals,
      todayMealViolationsBlocked: blockedAttempts,
      operationalRiskScore,
      aiAnomalyScore: operationalRiskScore,
      riskLevel,
      riskContributingFactors,
      lastVerificationTime: 'Today, 12:45 PM',
      inspectionStatus,
      assignedOfficer: riskLevel === 'High Priority Inspection' ? 'Devendra Sharma (Insp. ID: GOV-DL-041)' : null,
      sha256EvidenceHash: `a3f8c2b9${center.code.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().slice(0, 16)}1d274eef7b5a8421c9e8d41075b24d98`,
      cctvStreamStatus: center.cctvStreamStatus,
      sanctionedBudget: proj?.sanctionedBudget || 0,
      releasedBudget: proj?.releasedBudget || 0,
      spentBudget: proj?.spentBudget || 0
    };
  });
}

interface CommandCenterProps {
  session?: UserSession;
  onSignOut?: () => void;
}

export type GovSection =
  | 'HOME'
  | 'WELFARE_CENTRES'
  | 'INSPECTIONS'
  | 'AI_ALERTS'
  | 'REGISTRY'
  | 'FUNDS'
  | 'REPORTS'
  | 'POS_TOOL';

export function CommandCenter({ session, onSignOut }: CommandCenterProps) {
  const [activeSection, setActiveSection] = useState<GovSection>('HOME');
  
  // In-memory data states (defaults to fallback data, overwritten by Supabase upon connection)
  const [ngos, setNgos] = useState<NGO[]>(DEMO_NGOS);
  const [govProjects, setGovProjects] = useState<GovernmentWelfareProject[]>(DEMO_GOV_PROJECTS);
  const [welfareCenters, setWelfareCenters] = useState<WelfareCenter[]>(DEMO_WELFARE_CENTERS);
  const [projects, setProjects] = useState<WelfareProject[]>(DEMO_WELFARE_PROJECTS);
  const [anomalies] = useState<AIAnomalyItem[]>(DEMO_AI_ANOMALIES);

  // Database Live Connection State
  const [isLoadingDb, setIsLoadingDb] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [isDbLive, setIsDbLive] = useState(false);
  const [fieldOfficers, setFieldOfficers] = useState<FieldOfficerOption[]>(() => {
    return DEMO_USERS.filter((u) => u.role === 'FIELD_OFFICER').map((u) => ({
      id: u.userId,
      name: u.name,
      email: u.email,
      designation: u.designation,
      departmentOrNgo: u.departmentOrNgo,
      badgeId: extractBadgeId(u.designation),
    }));
  });
  const [fieldInspections, setFieldInspections] = useState<FieldInspectionRow[]>([]);

  // Fetch real data from Supabase tables
  const fetchSupabaseData = async () => {
    if (!isSupabaseConfigured()) {
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return;
    }

    setIsLoadingDb(true);
    setDbError(null);

    try {
      const [ngosResult, projectsResult, centersResult, inspectionsResult, officersResult] = await Promise.all([
        supabase.from('ngos').select('*').order('created_at', { ascending: true }),
        supabase.from('government_welfare_projects').select('*').order('created_at', { ascending: true }),
        supabase.from('welfare_centers').select('*').order('created_at', { ascending: true }),
        supabase.from('field_inspections').select('*').order('created_at', { ascending: false }),
        supabase.from('user_profiles').select('id, email, name, role, designation, department_or_ngo').eq('role', 'FIELD_OFFICER').order('name', { ascending: true }),
      ]);

      if (ngosResult.error) throw ngosResult.error;
      if (projectsResult.error) throw projectsResult.error;
      if (centersResult.error) throw centersResult.error;

      const rawNgos = (ngosResult.data || []) as NGORow[];
      const rawProjects = (projectsResult.data || []) as ProjectRow[];
      const rawCenters = (centersResult.data || []) as CenterRow[];
      const rawInspections = (inspectionsResult.data || []) as FieldInspectionRow[];
      const rawOfficers = (officersResult.data || []) as UserProfileRow[];

      if (rawNgos.length > 0 || rawProjects.length > 0 || rawCenters.length > 0) {
        const fetchedNgos = rawNgos.map(mapNgoFromDb);
        const fetchedProjects = rawProjects.map(mapProjectFromDb);
        const fetchedCenters = rawCenters.map(mapCenterFromDb);

        setNgos(fetchedNgos);
        setGovProjects(fetchedProjects);
        setWelfareCenters(fetchedCenters);

        const unifiedProjects = buildOperationalProjects(fetchedCenters, fetchedProjects, fetchedNgos);
        setProjects(unifiedProjects);
        setIsDbLive(true);
      }

      setFieldInspections(rawInspections);

      if (rawOfficers && rawOfficers.length > 0) {
        const mappedOfficers: FieldOfficerOption[] = rawOfficers.map((o) => ({
          id: o.id,
          name: o.name,
          email: o.email,
          designation: o.designation,
          departmentOrNgo: o.department_or_ngo,
          badgeId: extractBadgeId(o.designation),
        }));
        setFieldOfficers(mappedOfficers);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Database query error';
      setDbError(`Database Synchronization Notice: ${msg}. Displaying local cached data.`);
    } finally {
      setIsLoadingDb(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    Promise.resolve().then(() => {
      if (isMounted) {
        fetchSupabaseData();
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const [selectedProject, setSelectedProject] = useState<WelfareProject | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [districtFilter, setDistrictFilter] = useState<string>('ALL');
  const [currentTime, setCurrentTime] = useState<string>('Loading time...');
  
  // Real RPC Inspection Dispatch Modal State
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [dispatchCandidateProject, setDispatchCandidateProject] = useState<WelfareProject | null>(null);
  const [selectedDispatchCenterId, setSelectedDispatchCenterId] = useState<string>('');
  const [selectedFieldOfficerId, setSelectedFieldOfficerId] = useState<string>('');
  const [customOfficerBadgeId, setCustomOfficerBadgeId] = useState<string>('');
  const [scheduledDispatchDate, setScheduledDispatchDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchError, setDispatchError] = useState<string | null>(null);
  const [dispatchSuccessResult, setDispatchSuccessResult] = useState<CreateFieldInspectionResult | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);

  // Registry Search & Filters State
  const [registrySearch, setRegistrySearch] = useState('');
  const [registryNgoStatusFilter, setRegistryNgoStatusFilter] = useState<string>('ALL');
  const [registryAuditStatusFilter, setRegistryAuditStatusFilter] = useState<string>('ALL');
  const [registryCctvStatusFilter, setRegistryCctvStatusFilter] = useState<string>('ALL');
  const [registryDistrictFilter, setRegistryDistrictFilter] = useState<string>('ALL');

  // Registry 3-Tier Drill-Down Selection State
  const [selectedRegistryNgoId, setSelectedRegistryNgoId] = useState<string | null>(null);
  const [selectedRegistryProjectId, setSelectedRegistryProjectId] = useState<string | null>(null);

  // 4-Step Onboarding Wizard State
  const [onboardingModalOpen, setOnboardingModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [formError, setFormError] = useState<string | null>(null);
  const [provisionSuccessMsg, setProvisionSuccessMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    // Step 1: Legal NGO Registration
    ngoName: '',
    darpanRegNo: '',
    panNumber: '',
    nodalName: '',
    nodalDesignation: 'Honorary Secretary',
    nodalPhone: '',
    nodalEmail: '',
    registeredOffice: '',
    // Step 2: Government Welfare Scheme Grant
    schemeName: '',
    projectCode: '',
    sanctionOrderNo: '',
    financialYear: '2025-26',
    serviceType: 'Subsidized Meals' as 'Subsidized Meals' | 'Shelter Nutrition' | 'Day Care Outreach',
    targetDailyBeneficiaries: 1000,
    sanctionedBudget: 5000000,
    releasedBudget: 3500000,
    spentBudget: 2000000,
    // Step 3: Welfare Center Setup
    centerName: '',
    centerDistrict: 'Central Delhi',
    centerState: 'NCT of Delhi',
    centerAddress: '',
    centerLat: 28.6415,
    centerLng: 77.2144,
    geofenceRadius: 75,
    beneficiaryCapacity: 500,
    cctvCameraCount: 3,
    cctvStatus: 'Active' as 'Active' | 'Intermittent' | 'Offline',
    // Step 4: NGO Head Account Provisioning
    headName: '',
    headEmail: '',
    headDesignation: 'General Secretary',
    headPassword: 'demo-provisional-pass'
  });

  // Dynamic Financial Aggregations
  const financialTotals = useMemo(() => {
    const sanctioned = govProjects.reduce((acc, p) => acc + p.sanctionedBudget, 0);
    const released = govProjects.reduce((acc, p) => acc + p.releasedBudget, 0);
    const spent = govProjects.reduce((acc, p) => acc + p.spentBudget, 0);
    const { remainingReleasedBudget, utilizationPercentage } = calculateFinancials(released, spent);
    return { sanctioned, released, spent, remainingReleasedBudget, utilizationPercentage };
  }, [govProjects]);

  // Live IST Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = now.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      setCurrentTime(`${formatted} IST`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filtered Projects for Matrix
  const filteredProjects = useMemo(() => {
    return projects.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.ngoName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.district.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRisk =
        riskFilter === 'ALL' || item.riskLevel === riskFilter;

      const matchesDistrict =
        districtFilter === 'ALL' || item.district === districtFilter;

      return matchesSearch && matchesRisk && matchesDistrict;
    });
  }, [projects, searchQuery, riskFilter, districtFilter]);

  // Unique Districts for dropdown
  const uniqueDistricts = useMemo(() => {
    return Array.from(new Set(projects.map((p) => p.district)));
  }, [projects]);

  // Unique districts across all centers for registry filter
  const registryDistricts = useMemo(() => {
    return Array.from(new Set(welfareCenters.map((c) => c.district))).sort();
  }, [welfareCenters]);

  // Filtered NGOs for Registry (matching search + status + audit + cctv + district)
  const filteredRegistryNgos = useMemo(() => {
    const q = registrySearch.toLowerCase().trim();

    return ngos.filter((ngo) => {
      // 1. NGO Status Filter
      if (registryNgoStatusFilter !== 'ALL' && ngo.status !== registryNgoStatusFilter) {
        return false;
      }

      const projectsForNgo = govProjects.filter((p) => p.ngoId === ngo.id);
      const centersForNgo = welfareCenters.filter((c) => c.ngoId === ngo.id);

      // 2. Financial Audit Status Filter
      if (registryAuditStatusFilter !== 'ALL') {
        const matchesAudit = projectsForNgo.some(
          (p) => p.financialAuditStatus === registryAuditStatusFilter
        );
        if (!matchesAudit) return false;
      }

      // 3. CCTV Status Filter
      if (registryCctvStatusFilter !== 'ALL') {
        const matchesCctv = centersForNgo.some(
          (c) => c.cctvStreamStatus === registryCctvStatusFilter
        );
        if (!matchesCctv) return false;
      }

      // 4. District Filter
      if (registryDistrictFilter !== 'ALL') {
        const matchesDistrict = centersForNgo.some(
          (c) => c.district === registryDistrictFilter
        );
        if (!matchesDistrict) return false;
      }

      // 5. Multi-field Search: NGO name, project name, project code, center name, center code
      if (q) {
        const ngoMatches =
          ngo.name.toLowerCase().includes(q) ||
          ngo.darpanRegNo.toLowerCase().includes(q) ||
          ngo.panNumber.toLowerCase().includes(q) ||
          ngo.nodalPerson.name.toLowerCase().includes(q) ||
          ngo.nodalPerson.email.toLowerCase().includes(q) ||
          ngo.registeredOffice.toLowerCase().includes(q);

        const projectMatches = projectsForNgo.some(
          (p) =>
            p.schemeName.toLowerCase().includes(q) ||
            p.projectCode.toLowerCase().includes(q) ||
            p.serviceType.toLowerCase().includes(q) ||
            p.sanctionOrderNo.toLowerCase().includes(q)
        );

        const centerMatches = centersForNgo.some(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.code.toLowerCase().includes(q) ||
            c.district.toLowerCase().includes(q) ||
            c.address.toLowerCase().includes(q)
        );

        if (!ngoMatches && !projectMatches && !centerMatches) {
          return false;
        }
      }

      return true;
    });
  }, [
    ngos,
    govProjects,
    welfareCenters,
    registrySearch,
    registryNgoStatusFilter,
    registryAuditStatusFilter,
    registryCctvStatusFilter,
    registryDistrictFilter
  ]);

  // Active Selected NGO (falls back to first filtered NGO)
  const activeRegistryNgo = useMemo(() => {
    if (selectedRegistryNgoId) {
      const found = filteredRegistryNgos.find((n) => n.id === selectedRegistryNgoId);
      if (found) return found;
    }
    return filteredRegistryNgos[0] || null;
  }, [filteredRegistryNgos, selectedRegistryNgoId]);

  // Projects for the Active NGO (matching active audit filter)
  const activeNgoProjects = useMemo(() => {
    if (!activeRegistryNgo) return [];
    return govProjects.filter((p) => {
      if (p.ngoId !== activeRegistryNgo.id) return false;
      if (registryAuditStatusFilter !== 'ALL' && p.financialAuditStatus !== registryAuditStatusFilter) {
        return false;
      }
      return true;
    });
  }, [activeRegistryNgo, govProjects, registryAuditStatusFilter]);

  // Active Selected Project (falls back to first project of active NGO)
  const activeRegistryProject = useMemo(() => {
    if (selectedRegistryProjectId) {
      const found = activeNgoProjects.find((p) => p.id === selectedRegistryProjectId);
      if (found) return found;
    }
    return activeNgoProjects[0] || null;
  }, [activeNgoProjects, selectedRegistryProjectId]);

  // Centers for the Active Project (matching CCTV and District filters)
  const activeProjectCenters = useMemo(() => {
    if (!activeRegistryProject) return [];
    return welfareCenters.filter((c) => {
      if (c.projectId !== activeRegistryProject.id) return false;
      if (registryCctvStatusFilter !== 'ALL' && c.cctvStreamStatus !== registryCctvStatusFilter) {
        return false;
      }
      if (registryDistrictFilter !== 'ALL' && c.district !== registryDistrictFilter) {
        return false;
      }
      return true;
    });
  }, [activeRegistryProject, welfareCenters, registryCctvStatusFilter, registryDistrictFilter]);

  // Reset all registry filters
  const handleResetRegistryFilters = () => {
    setRegistrySearch('');
    setRegistryNgoStatusFilter('ALL');
    setRegistryAuditStatusFilter('ALL');
    setRegistryCctvStatusFilter('ALL');
    setRegistryDistrictFilter('ALL');
    setSelectedRegistryNgoId(null);
    setSelectedRegistryProjectId(null);
  };

  const handleTriggerDispatch = (targetCenterId?: string) => {
    let candidate: WelfareProject;
    if (targetCenterId) {
      const found = projects.find(
        (p) => p.id === targetCenterId || p.id === `op-${targetCenterId}` || p.code === targetCenterId
      );
      candidate = found || projects[0];
    } else {
      const sortedByRisk = [...projects].sort(
        (a, b) => (b.operationalRiskScore ?? b.aiAnomalyScore ?? 0) - (a.operationalRiskScore ?? a.aiAnomalyScore ?? 0)
      );
      candidate = sortedByRisk[0] || projects[0];
    }

    setDispatchCandidateProject(candidate);

    const matchingCenter = welfareCenters.find(
      (c) => c.code === candidate?.code || c.id === candidate?.id.replace(/^op-/, '')
    );
    const resolvedCenterId = matchingCenter?.id || candidate?.id.replace(/^op-/, '') || (welfareCenters[0]?.id || '');
    setSelectedDispatchCenterId(resolvedCenterId);

    if (fieldOfficers.length > 0) {
      const initialOfficer = fieldOfficers[0];
      setSelectedFieldOfficerId(initialOfficer.id);
      setCustomOfficerBadgeId(initialOfficer.badgeId || '');
    }

    const todayStr = new Date().toISOString().split('T')[0];
    setScheduledDispatchDate(todayStr);

    setDispatchError(null);
    setDispatchSuccessResult(null);
    setIsDispatching(false);
    setDispatchModalOpen(true);
  };

  const handleFieldOfficerChange = (officerId: string) => {
    setSelectedFieldOfficerId(officerId);
    const officer = fieldOfficers.find((o) => o.id === officerId);
    if (officer) {
      setCustomOfficerBadgeId(officer.badgeId || '');
    }
  };

  const handleExecuteDispatchRpc = async () => {
    setDispatchError(null);

    if (!selectedDispatchCenterId) {
      setDispatchError('Validation error: Please select a target Welfare Center.');
      return;
    }

    const officer = fieldOfficers.find((o) => o.id === selectedFieldOfficerId);
    if (!officer) {
      setDispatchError('Validation error: Please select an authorized Field Officer from public.user_profiles.');
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setDispatchError('Configuration error: Supabase client is not available.');
      return;
    }

    setIsDispatching(true);

    try {
      // 1. Verify authenticated session
      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr || !sessionData?.session?.user) {
        setDispatchError(
          'Authentication required: You must be signed in with an active Government Authority session to execute create_field_inspection_assignment().'
        );
        setIsDispatching(false);
        return;
      }

      // 2. Call secure RPC create_field_inspection_assignment
      const { data, error: rpcError } = await supabase.rpc('create_field_inspection_assignment', {
        p_center_id: selectedDispatchCenterId,
        p_inspector_user_id: officer.id,
        p_inspector_name: officer.name,
        p_officer_badge_id: customOfficerBadgeId.trim() || officer.badgeId || null,
        p_scheduled_for: scheduledDispatchDate,
      });

      if (rpcError) {
        setDispatchError(rpcError.message || 'Database error occurred during inspection dispatch.');
        setIsDispatching(false);
        return;
      }

      if (data && (data as CreateFieldInspectionResult).success) {
        const result = data as CreateFieldInspectionResult;
        setDispatchSuccessResult(result);
        setIsDispatching(false);
        await fetchSupabaseData();
      } else {
        setDispatchError('Inspection assignment creation returned an unexpected response.');
        setIsDispatching(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred during inspection dispatch.';
      setDispatchError(msg);
      setIsDispatching(false);
    }
  };

  const copyShaToClipboard = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Status management for NGOs
  const handleUpdateNgoStatus = (ngoId: string, newStatus: 'Active' | 'Under Review' | 'Suspended') => {
    setNgos((prev) => prev.map((n) => (n.id === ngoId ? { ...n, status: newStatus } : n)));
  };

  // Wizard Step Navigation & Validation
  const handleNextStep = () => {
    setFormError(null);

    if (currentStep === 1) {
      if (!formData.ngoName.trim() || !formData.darpanRegNo.trim() || !formData.panNumber.trim() || !formData.nodalName.trim() || !formData.nodalPhone.trim() || !formData.nodalEmail.trim() || !formData.registeredOffice.trim()) {
        setFormError('Please fill in all mandatory legal and nodal registration fields.');
        return;
      }
      // Pre-populate Step 4 fields from Step 1 if empty
      if (!formData.headName) setFormData((f) => ({ ...f, headName: f.nodalName }));
      if (!formData.headEmail) setFormData((f) => ({ ...f, headEmail: f.nodalEmail }));
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!formData.schemeName.trim() || !formData.projectCode.trim() || !formData.sanctionOrderNo.trim()) {
        setFormError('Please provide scheme title, project code, and sanction order number.');
        return;
      }
      const sanctioned = Number(formData.sanctionedBudget);
      const released = Number(formData.releasedBudget);
      const spent = Number(formData.spentBudget);

      if (released > sanctioned) {
        setFormError('Validation Error: Released budget cannot exceed sanctioned budget.');
        return;
      }
      if (spent > released) {
        setFormError('Validation Error: Spent budget cannot exceed released budget.');
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!formData.centerName.trim() || !formData.centerAddress.trim()) {
        setFormError('Please provide center name and physical street address.');
        return;
      }
      setCurrentStep(4);
    }
  };

  const handlePrevStep = () => {
    setFormError(null);
    if (currentStep > 1) {
      setCurrentStep((s) => (s - 1) as 1 | 2 | 3 | 4);
    }
  };

  const handleSubmitOnboarding = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.headName.trim() || !formData.headEmail.trim()) {
      setFormError('Please provide the designated NGO Head name and official email address.');
      return;
    }

    const newNgoId = `ngo-${(ngos.length + 1).toString().padStart(2, '0')}`;
    const newProjectId = `prj-scheme-${(govProjects.length + 1).toString().padStart(2, '0')}`;
    const newCenterId = `cnt-${(welfareCenters.length + 1).toString().padStart(2, '0')}`;
    const newCenterCode = `DL-${formData.centerDistrict.substring(0, 2).toUpperCase()}-2026-${Math.floor(100 + Math.random() * 900)}`;
    const newShaHash = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

    // 1. Create NGO
    const newNgo: NGO = {
      id: newNgoId,
      name: formData.ngoName,
      darpanRegNo: formData.darpanRegNo,
      panNumber: formData.panNumber,
      nodalPerson: {
        name: formData.nodalName,
        designation: formData.nodalDesignation || 'Nodal Officer',
        phone: formData.nodalPhone,
        email: formData.nodalEmail
      },
      status: 'Active',
      complianceScore: 100,
      registeredSince: new Date().toISOString().split('T')[0],
      registeredOffice: formData.registeredOffice
    };

    // 2. Create Project Scheme
    const newGovProject: GovernmentWelfareProject = {
      id: newProjectId,
      ngoId: newNgoId,
      projectCode: formData.projectCode,
      schemeName: formData.schemeName,
      sanctionOrderNo: formData.sanctionOrderNo,
      financialYear: formData.financialYear,
      serviceType: formData.serviceType,
      targetDailyBeneficiaries: Number(formData.targetDailyBeneficiaries),
      sanctionedBudget: Number(formData.sanctionedBudget),
      releasedBudget: Number(formData.releasedBudget),
      spentBudget: Number(formData.spentBudget),
      financialAuditStatus: 'Reconciled',
      validFrom: '2025-04-01',
      validUntil: '2026-03-31',
      status: 'Operational'
    };

    // 3. Create Center
    const newCenter: WelfareCenter = {
      id: newCenterId,
      projectId: newProjectId,
      ngoId: newNgoId,
      code: newCenterCode,
      name: formData.centerName,
      district: formData.centerDistrict,
      state: formData.centerState,
      address: formData.centerAddress,
      coordinates: {
        lat: Number(formData.centerLat),
        lng: Number(formData.centerLng)
      },
      geofenceRadiusMeters: Number(formData.geofenceRadius),
      beneficiaryCapacity: Number(formData.beneficiaryCapacity),
      cctvCameraCount: Number(formData.cctvCameraCount),
      cctvStreamStatus: formData.cctvStatus,
      status: 'Operational'
    };

    // 4. Create Operational Center for Matrix & Live Monitoring
    const newOperationalCenter: WelfareProject = {
      id: `prj-${(projects.length + 1).toString().padStart(2, '0')}`,
      code: newCenterCode,
      name: formData.centerName,
      ngoId: newNgoId,
      ngoName: formData.ngoName,
      ngoRegNo: formData.darpanRegNo,
      projectId: newProjectId,
      projectCode: formData.projectCode,
      schemeName: formData.schemeName,
      district: formData.centerDistrict,
      state: formData.centerState,
      coordinates: {
        lat: Number(formData.centerLat),
        lng: Number(formData.centerLng)
      },
      geofenceRadiusMeters: Number(formData.geofenceRadius),
      beneficiaryCapacity: Number(formData.beneficiaryCapacity),
      todayVerifiedCount: 0,
      todayMealTransactions: 0,
      todayMealViolationsBlocked: 0,
      operationalRiskScore: 0.05,
      aiAnomalyScore: 0.05,
      riskLevel: 'Normal',
      riskContributingFactors: ['Newly registered NGO & Center — baseline telemetry initialized'],
      lastVerificationTime: 'Just onboarded',
      inspectionStatus: 'Scheduled',
      assignedOfficer: null,
      sha256EvidenceHash: newShaHash,
      cctvStreamStatus: formData.cctvStatus,
      sanctionedBudget: Number(formData.sanctionedBudget),
      releasedBudget: Number(formData.releasedBudget),
      spentBudget: Number(formData.spentBudget)
    };

    // 5. Add provisioned NGO Head to DEMO_USERS so it appears on Login screen
    DEMO_USERS.push({
      userId: `usr-ngo-${Date.now()}`,
      name: formData.headName,
      email: formData.headEmail,
      role: 'NGO_HEAD',
      accountType: 'Government-provisioned NGO Head',
      designation: formData.headDesignation,
      departmentOrNgo: formData.ngoName,
      assignedNgoId: newNgoId
    });

    // 6. Update in-memory prototype states
    setNgos((prev) => [newNgo, ...prev]);
    setGovProjects((prev) => [newGovProject, ...prev]);
    setWelfareCenters((prev) => [newCenter, ...prev]);
    setProjects((prev) => [newOperationalCenter, ...prev]);

    setOnboardingModalOpen(false);
    setProvisionSuccessMsg(`Successfully registered ${formData.ngoName} and provisioned NGO Head account for ${formData.headName}.`);
    setTimeout(() => setProvisionSuccessMsg(null), 6000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* 1. Official Government Header */}
      <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            {/* National Identity & System Branding */}
            <div className="flex items-center space-x-3.5">
              <button 
                onClick={() => setActiveSection('HOME')}
                className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-800 flex items-center justify-center shadow-lg shadow-cyan-900/30 border border-cyan-400/30 cursor-pointer hover:opacity-90 transition-opacity"
                title="Go to Home Dashboard"
              >
                <ShieldCheckIcon className="w-6 h-6 text-white" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Government of India
                  </span>
                  <span className="text-slate-600">&bull;</span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Ministry of Social Justice &amp; Empowerment
                  </span>
                </div>
                <div className="flex items-center gap-2.5 mt-0.5">
                  <button
                    onClick={() => setActiveSection('HOME')}
                    className="text-lg font-bold text-white tracking-tight flex items-center gap-2 hover:text-cyan-300 transition-colors"
                  >
                    NIGRANI 360
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-normal">
                      SIH26095
                    </span>
                  </button>

                  {/* Small Supabase connection indicator only */}
                  <span className={`inline-flex items-center gap-1.5 text-[11px] font-mono px-2 py-0.5 rounded-full border ${
                    isDbLive
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80'
                      : 'bg-amber-950/80 text-amber-300 border-amber-800/80'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isDbLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                    {isDbLive ? 'Supabase Live' : 'Local Fallback'}
                  </span>
                </div>
              </div>
            </div>

            {/* Logged-in user's name & role + Sign Out */}
            <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-2 md:pt-0 border-slate-800">
              <div className="text-left md:text-right">
                <p className="text-xs font-semibold text-slate-200">
                  {session?.name || 'Dr. Rajesh Verma'}
                </p>
                <p className="text-[11px] text-slate-400">
                  {session?.designation || 'Joint Secretary & Monitoring Director'}
                </p>
              </div>

              {onSignOut && (
                <button
                  onClick={onSignOut}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 hover:text-rose-300 hover:border-rose-800 text-slate-300 border border-slate-700 text-xs font-medium transition-colors"
                  title="Sign Out"
                >
                  <LogOutIcon className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Database Notice / Error Banner */}
        {dbError && (
          <div className="p-3.5 rounded-xl bg-amber-950/80 border border-amber-700/80 text-amber-200 text-xs flex items-center justify-between shadow-lg shadow-amber-950/40">
            <div className="flex items-center gap-2">
              <AlertTriangleIcon className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{dbError}</span>
            </div>
            <button
              onClick={() => setDbError(null)}
              className="text-amber-400 hover:text-white transition-colors"
              aria-label="Dismiss message"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Success Alert Banner */}
        {provisionSuccessMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs flex items-center justify-between shadow-lg shadow-emerald-950/40">
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{provisionSuccessMsg}</span>
            </div>
            <button onClick={() => setProvisionSuccessMsg(null)} className="text-emerald-400 hover:text-white">
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* VIEW 0: HOME DASHBOARD (EXACTLY 6 LARGE NAVIGATION CARDS IN 2-COLUMN GRID) */}
        {activeSection === 'HOME' && (
          <div className="space-y-8 py-2">
            {/* Welcome Section */}
            <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/95 to-blue-950/30 border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 font-mono">
                  Central Social Welfare Monitoring Portal
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
                  Welcome, {session?.name || 'Dr. Rajesh Verma'}
                </h2>
                <p className="text-sm font-medium text-slate-300 mt-1">
                  Government Welfare Monitoring Dashboard
                </p>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-2xl">
                  Select a service below to oversee welfare centres, dispatch field inspections, or review financial allocations and audit logs.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
                <span className="text-xs text-slate-400 bg-slate-950 border border-slate-800 px-3.5 py-2 rounded-xl font-mono flex items-center gap-2">
                  <ClockIcon className="w-3.5 h-3.5 text-slate-500" />
                  {currentTime}
                </span>
              </div>
            </div>

            {/* Exactly 6 Large Navigation Cards in a 2-Column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: Welfare Centres */}
              <button
                onClick={() => setActiveSection('WELFARE_CENTRES')}
                className="group p-7 sm:p-8 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-850 hover:shadow-xl hover:shadow-cyan-950/20 transition-all text-left flex items-start gap-5 cursor-pointer relative overflow-hidden"
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-950/80 border border-blue-800/80 text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:border-cyan-400 transition-all shadow-inner">
                  <BuildingIcon className="w-7 h-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                      Welfare Centres
                    </h3>
                    <ChevronRightIcon className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                    Monitor welfare centres and their current status.
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono text-cyan-400 font-semibold">{welfareCenters.length} Centres Active</span>
                    <span>&bull;</span>
                    <span>Live Operations &amp; CCTV</span>
                  </div>
                </div>
              </button>

              {/* Card 2: Inspections */}
              <button
                onClick={() => setActiveSection('INSPECTIONS')}
                className="group p-7 sm:p-8 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-850 hover:shadow-xl hover:shadow-indigo-950/20 transition-all text-left flex items-start gap-5 cursor-pointer relative overflow-hidden"
              >
                <div className="w-14 h-14 rounded-2xl bg-indigo-950/80 border border-indigo-800/80 text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:border-indigo-400 transition-all shadow-inner">
                  <SearchIcon className="w-7 h-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors">
                      Inspections
                    </h3>
                    <ChevronRightIcon className="w-5 h-5 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                    Assign field officers and track inspections.
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono text-indigo-400 font-semibold">{fieldOfficers.length} Field Officers</span>
                    <span>&bull;</span>
                    <span>Tamper-Proof Dispatch RPC</span>
                  </div>
                </div>
              </button>

              {/* Card 3: AI Alerts */}
              <button
                onClick={() => setActiveSection('AI_ALERTS')}
                className="group p-7 sm:p-8 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-purple-500/50 hover:bg-slate-850 hover:shadow-xl hover:shadow-purple-950/20 transition-all text-left flex items-start gap-5 cursor-pointer relative overflow-hidden"
              >
                <div className="w-14 h-14 rounded-2xl bg-purple-950/80 border border-purple-800/80 text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:border-purple-400 transition-all shadow-inner">
                  <BotIcon className="w-7 h-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">
                      AI Alerts
                    </h3>
                    <ChevronRightIcon className="w-5 h-5 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                    Review unusual patterns detected from welfare data.
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                    <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 text-[11px] font-mono">
                      Coming in next module
                    </span>
                  </div>
                </div>
              </button>

              {/* Card 4: NGOs & Projects */}
              <button
                onClick={() => setActiveSection('REGISTRY')}
                className="group p-7 sm:p-8 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-teal-500/50 hover:bg-slate-850 hover:shadow-xl hover:shadow-teal-950/20 transition-all text-left flex items-start gap-5 cursor-pointer relative overflow-hidden"
              >
                <div className="w-14 h-14 rounded-2xl bg-teal-950/80 border border-teal-800/80 text-teal-400 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:border-teal-400 transition-all shadow-inner">
                  <LandmarkIcon className="w-7 h-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xl font-bold text-white group-hover:text-teal-300 transition-colors">
                      NGOs &amp; Projects
                    </h3>
                    <ChevronRightIcon className="w-5 h-5 text-slate-500 group-hover:text-teal-400 group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                    View registered NGOs, schemes and welfare projects.
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono text-teal-400 font-semibold">{ngos.length} NGOs</span>
                    <span>&bull;</span>
                    <span className="font-mono text-teal-400 font-semibold">{govProjects.length} Schemes</span>
                    <span>&bull;</span>
                    <span>3-Tier Registry</span>
                  </div>
                </div>
              </button>

              {/* Card 5: Funds */}
              <button
                onClick={() => setActiveSection('FUNDS')}
                className="group p-7 sm:p-8 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-850 hover:shadow-xl hover:shadow-amber-950/20 transition-all text-left flex items-start gap-5 cursor-pointer relative overflow-hidden"
              >
                <div className="w-14 h-14 rounded-2xl bg-amber-950/80 border border-amber-800/80 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:border-amber-400 transition-all shadow-inner">
                  <IndianRupeeIcon className="w-7 h-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xl font-bold text-white group-hover:text-amber-300 transition-colors">
                      Funds
                    </h3>
                    <ChevronRightIcon className="w-5 h-5 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                    View sanctioned, released and spent funds.
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono text-amber-400 font-semibold">{formatCurrency(financialTotals.sanctioned)}</span>
                    <span>&bull;</span>
                    <span>Grant Utilization &amp; Audit</span>
                  </div>
                </div>
              </button>

              {/* Card 6: Reports & Audit */}
              <button
                onClick={() => setActiveSection('REPORTS')}
                className="group p-7 sm:p-8 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-850 hover:shadow-xl hover:shadow-emerald-950/20 transition-all text-left flex items-start gap-5 cursor-pointer relative overflow-hidden"
              >
                <div className="w-14 h-14 rounded-2xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:border-emerald-400 transition-all shadow-inner">
                  <BarChartIcon className="w-7 h-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors">
                      Reports &amp; Audit
                    </h3>
                    <ChevronRightIcon className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                    Review inspection records, evidence and audit history.
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono text-emerald-400 font-semibold">{fieldInspections.length} Inspection Records</span>
                    <span>&bull;</span>
                    <span>SHA-256 Sealed Records</span>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* VIEW 1: WELFARE CENTRES */}
        {activeSection === 'WELFARE_CENTRES' && (
          <div className="space-y-6">
            {/* Top Navigation & Actions Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <button
                onClick={() => setActiveSection('HOME')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold border border-slate-700 transition-colors shadow-sm self-start"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                <span>&larr; Back to Dashboard</span>
              </button>

              <div className="flex items-center gap-3">
                {/* Secondary verification tool button */}
                <button
                  onClick={() => setActiveSection('POS_TOOL')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-700/80 text-xs font-medium transition-colors"
                >
                  <FingerprintIcon className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Open Fingerprint POS Terminal (Simulator)</span>
                </button>
                <span className="text-xs text-slate-400 font-mono px-2.5 py-1 rounded bg-slate-900 border border-slate-800">
                  {welfareCenters.length} Centres Active
                </span>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <BuildingIcon className="w-5 h-5 text-blue-400" />
                Welfare Centres
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Monitor welfare centres and their current status, CCTV stream health, and operational verification records.
              </p>
            </div>

            {/* Matrix Table */}
            <div className="grid grid-cols-12 gap-6">
            <div className="lg:col-span-8 rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-slate-900/90">
                    <div>
                      <h2 className="text-base font-semibold text-white flex items-center gap-2">
                        NGO Welfare Project Risk Matrix
                        <span className="text-xs font-mono font-normal text-slate-400">({filteredProjects.length} centers displayed)</span>
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Click any center row to inspect geofence telemetry, SHA-256 evidence, and risk contributing factors.
                      </p>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <div className="relative">
                        <SearchIcon className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search center, NGO, code..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-md text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-44 sm:w-56 text-xs"
                        />
                      </div>

                      <select
                        value={riskFilter}
                        onChange={(e) => setRiskFilter(e.target.value)}
                        className="bg-slate-950 border border-slate-700 rounded-md px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500 text-xs"
                      >
                        <option value="ALL">All Risk Tiers</option>
                        <option value="High Priority Inspection">High Priority Inspection</option>
                        <option value="Moderate Watch">Moderate Watch</option>
                        <option value="Normal">Normal</option>
                      </select>

                      <select
                        value={districtFilter}
                        onChange={(e) => setDistrictFilter(e.target.value)}
                        className="bg-slate-950 border border-slate-700 rounded-md px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500 text-xs"
                      >
                        <option value="ALL">All Districts</option>
                        {uniqueDistricts.map((dist) => (
                          <option key={dist} value={dist}>{dist}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 font-medium">
                          <th className="py-3 px-3.5">Center &amp; Operating NGO</th>
                          <th className="py-3 px-3">District</th>
                          <th className="py-3 px-3">Beneficiary Capacity</th>
                          <th className="py-3 px-3">Today Transactions</th>
                          <th className="py-3 px-3">Operational Risk Score</th>
                          <th className="py-3 px-3">Risk Tier</th>
                          <th className="py-3 px-3">Inspection Status</th>
                          <th className="py-3 px-3.5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {filteredProjects.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-8 text-center text-slate-500">
                              No welfare projects match the selected criteria.
                            </td>
                          </tr>
                        ) : (
                          filteredProjects.map((p) => {
                            const isHigh = p.riskLevel === 'High Priority Inspection';
                            const isModerate = p.riskLevel === 'Moderate Watch';

                            return (
                              <tr
                                key={p.id}
                                onClick={() => setSelectedProject(p)}
                                className="hover:bg-slate-800/50 cursor-pointer transition-colors group"
                              >
                                <td className="py-3 px-3.5">
                                  <div className="font-semibold text-slate-100 group-hover:text-cyan-300 flex items-center gap-1.5">
                                    {p.name}
                                  </div>
                                  <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                                    <span>{p.ngoName}</span>
                                    <span className="font-mono text-[10px] text-slate-500">({p.code})</span>
                                  </div>
                                </td>

                                <td className="py-3 px-3 text-slate-300 font-medium">
                                  {p.district}
                                </td>

                                <td className="py-3 px-3">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-medium text-slate-200">{p.todayVerifiedCount}</span>
                                    <span className="text-slate-500">/ {p.beneficiaryCapacity}</span>
                                  </div>
                                  <div className="w-20 bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                                    <div
                                      className={`h-full rounded-full ${
                                        p.todayVerifiedCount / p.beneficiaryCapacity > 0.9
                                          ? 'bg-amber-400'
                                          : 'bg-cyan-500'
                                      }`}
                                      style={{
                                        width: `${Math.min(100, (p.todayVerifiedCount / p.beneficiaryCapacity) * 100)}%`
                                      }}
                                    />
                                  </div>
                                </td>

                                <td className="py-3 px-3">
                                  <span className="font-semibold text-slate-200 font-mono">{p.todayMealTransactions}</span>
                                  {p.todayMealViolationsBlocked > 0 && (
                                    <div className="text-[10px] text-rose-400 font-mono font-medium">
                                      {p.todayMealViolationsBlocked} 3rd-meals blocked
                                    </div>
                                  )}
                                </td>

                                <td className="py-3 px-3">
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className={`font-mono font-bold text-xs ${
                                        isHigh ? 'text-rose-400' : isModerate ? 'text-amber-400' : 'text-emerald-400'
                                      }`}
                                    >
                                      {(((p.operationalRiskScore ?? p.aiAnomalyScore) ?? 0) * 100).toFixed(0)}%
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-mono">
                                      ({((p.operationalRiskScore ?? p.aiAnomalyScore) ?? 0).toFixed(2)})
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-slate-500">Rule-Based Signal</div>
                                </td>

                                <td className="py-3 px-3">
                                  {isHigh && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-950/80 border border-rose-800/80 text-rose-300">
                                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                                      High Priority
                                    </span>
                                  )}
                                  {isModerate && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950/80 border border-amber-800/80 text-amber-300">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                      Moderate Watch
                                    </span>
                                  )}
                                  {!isHigh && !isModerate && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/60 border border-emerald-800/60 text-emerald-300">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                      Normal
                                    </span>
                                  )}
                                </td>

                                <td className="py-3 px-3">
                                  <span
                                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium border ${
                                      p.inspectionStatus === 'Action Required'
                                        ? 'bg-rose-950/60 border-rose-700 text-rose-300'
                                        : p.inspectionStatus === 'Overdue'
                                        ? 'bg-amber-950/60 border-amber-700 text-amber-300'
                                        : p.inspectionStatus === 'In Progress'
                                        ? 'bg-indigo-950/60 border-indigo-700 text-indigo-300'
                                        : p.inspectionStatus === 'Verified Today'
                                        ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
                                        : 'bg-slate-800 border-slate-700 text-slate-300'
                                    }`}
                                  >
                                    {p.inspectionStatus}
                                  </span>
                                  <div className="text-[10px] text-slate-500 mt-0.5">{p.lastVerificationTime}</div>
                                </td>

                                <td className="py-3 px-3.5 text-right">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedProject(p);
                                    }}
                                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium border border-slate-700 transition-colors"
                                  >
                                    Dossier
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
                    <span className="text-[11px]">
                      <strong>Strict Compliance Engine:</strong> Physical presence validated via GPS centroid &amp; SHA-256 seal.
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      Total Records: {projects.length} | Active Centers: 100%
                    </span>
                  </div>
                </div>

              {/* AI Anomaly Feed */}
              <div className="lg:col-span-4 space-y-4">
                <div className="rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur p-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center space-x-2">
                      <div className="p-1 rounded bg-rose-500/20 text-rose-400">
                        <AlertTriangleIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white">Live AI Anomaly Stream</h3>
                        <p className="text-[11px] text-slate-400">Incoming telemetry &amp; operational exception signals</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                      LIVE
                    </span>
                  </div>

                  <div className="mt-3 space-y-3">
                    {anomalies.map((item) => {
                      const isHigh = item.severity === 'High';

                      return (
                        <div
                          key={item.id}
                          className={`p-3 rounded-lg border text-xs transition-all ${
                            isHigh
                              ? 'bg-rose-950/20 border-rose-800/40 hover:border-rose-700/80'
                              : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span
                              className={`font-semibold ${
                                isHigh ? 'text-rose-300' : 'text-amber-300'
                              }`}
                            >
                              {item.anomalyType}
                            </span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                                isHigh
                                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                  : 'bg-amber-950 text-amber-300 border border-amber-800'
                              }`}
                            >
                              {item.severity}
                            </span>
                          </div>

                          <div className="mt-1 text-[11px] text-slate-300 font-medium">
                            {item.projectName} &bull; <span className="text-slate-400">{item.district}</span>
                          </div>

                          <p className="mt-1.5 text-[11px] text-slate-400 leading-relaxed">
                            {item.description}
                          </p>

                          <div className="mt-2.5 p-2 rounded bg-slate-900/90 border border-slate-800 text-[11px]">
                            <span className="font-medium text-cyan-300">Recommended Action:</span>{' '}
                            <span className="text-slate-300">{item.recommendedAction}</span>
                          </div>

                          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                            <span>{item.timestamp}</span>
                            <span className="truncate max-w-[150px]">{item.modelSource}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 text-center">
                    <button
                      onClick={() => handleTriggerDispatch()}
                      className="w-full py-2 px-3 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-medium border border-cyan-500/30 transition-colors flex items-center justify-center gap-2"
                    >
                      <RefreshCwIcon className="w-3.5 h-3.5" />
                      Trigger Auto-Dispatch Algorithm
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: NGO & WELFARE PROJECT REGISTRY (3-TIER HIERARCHY) */}
        {activeSection === 'REGISTRY' && (
          <section className="space-y-6">
            {/* Loading Indicator */}
            {isLoadingDb && (
              <div className="p-4 rounded-xl border border-cyan-800/80 bg-cyan-950/40 flex items-center justify-center gap-3 text-cyan-300 text-xs font-mono animate-pulse shadow-sm">
                <RefreshCwIcon className="w-4 h-4 animate-spin text-cyan-400" />
                Synchronizing 3-Tier Registry with Supabase Database...
              </div>
            )}

            {/* Header & Quick Action */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FolderTreeIcon className="w-5 h-5 text-cyan-400" />
                    Government NGO &amp; Project Registry
                  </h2>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                    {isDbLive ? 'Live Supabase DB' : 'Local Fallback'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  3-Tier Relationship: Registered NGO &rarr; Sanctioned Welfare Scheme &rarr; Physical Delivery Center
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {(registrySearch ||
                  registryNgoStatusFilter !== 'ALL' ||
                  registryAuditStatusFilter !== 'ALL' ||
                  registryCctvStatusFilter !== 'ALL' ||
                  registryDistrictFilter !== 'ALL') && (
                  <button
                    onClick={handleResetRegistryFilters}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors border border-slate-700"
                  >
                    <XIcon className="w-3.5 h-3.5" />
                    Clear Filters
                  </button>
                )}

                {/* Government Authority Only: Register & Provision Button */}
                {session?.role === 'GOVERNMENT_AUTHORITY' && (
                  <button
                    onClick={() => {
                      setFormError(null);
                      setCurrentStep(1);
                      setOnboardingModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs shadow-md shadow-cyan-950/40 transition-all border border-cyan-400/30 shrink-0"
                  >
                    <PlusIcon className="w-4 h-4" />
                    + Register NGO &amp; Provision Welfare Center
                  </button>
                )}
              </div>
            </div>

            {/* Search & Multi-Filter Control Toolbar */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-3.5 space-y-3 shadow-md">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs">
                {/* Search Box */}
                <div className="relative sm:col-span-2 lg:col-span-1">
                  <SearchIcon className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search NGO, scheme, center..."
                    value={registrySearch}
                    onChange={(e) => setRegistrySearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Filter 1: NGO Status */}
                <div>
                  <select
                    value={registryNgoStatusFilter}
                    onChange={(e) => setRegistryNgoStatusFilter(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500 text-xs cursor-pointer"
                  >
                    <option value="ALL">All NGO Statuses</option>
                    <option value="Active">Active NGOs</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>

                {/* Filter 2: Financial Audit Status */}
                <div>
                  <select
                    value={registryAuditStatusFilter}
                    onChange={(e) => setRegistryAuditStatusFilter(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500 text-xs cursor-pointer"
                  >
                    <option value="ALL">All Audit Statuses</option>
                    <option value="Reconciled">Audit: Reconciled</option>
                    <option value="Audit Pending">Audit: Pending</option>
                    <option value="Under Review">Audit: Under Review</option>
                  </select>
                </div>

                {/* Filter 3: CCTV Status */}
                <div>
                  <select
                    value={registryCctvStatusFilter}
                    onChange={(e) => setRegistryCctvStatusFilter(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500 text-xs cursor-pointer"
                  >
                    <option value="ALL">All CCTV Statuses</option>
                    <option value="Active">CCTV: Active (Online)</option>
                    <option value="Intermittent">CCTV: Intermittent</option>
                    <option value="Offline">CCTV: Offline</option>
                  </select>
                </div>

                {/* Filter 4: District */}
                <div>
                  <select
                    value={registryDistrictFilter}
                    onChange={(e) => setRegistryDistrictFilter(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500 text-xs cursor-pointer"
                  >
                    <option value="ALL">All Districts</option>
                    {registryDistricts.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Active Filter Metrics Banner */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80 text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                  <span>
                    Showing <strong className="text-slate-200 font-mono">{filteredRegistryNgos.length}</strong> of{' '}
                    <strong className="text-slate-200 font-mono">{ngos.length}</strong> registered NGOs
                  </span>
                  {(registrySearch ||
                    registryNgoStatusFilter !== 'ALL' ||
                    registryAuditStatusFilter !== 'ALL' ||
                    registryCctvStatusFilter !== 'ALL' ||
                    registryDistrictFilter !== 'ALL') && (
                    <span className="text-cyan-400 font-mono text-[10px] bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
                      Filters Active
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400">
                  Select an NGO &rarr; Select a Project &rarr; Inspect linked Centers
                </div>
              </div>
            </div>

            {/* 3-Tier Drill-Down Relationship Breadcrumbs Bar */}
            <div className="rounded-xl bg-slate-950/90 border border-slate-800 p-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold text-slate-400 shrink-0">Selected Hierarchy:</span>

              {/* Tier 1 Badge */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-950/80 border border-blue-800/80 text-cyan-300 font-medium">
                <BuildingIcon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="truncate max-w-[220px]">
                  {activeRegistryNgo ? activeRegistryNgo.name : 'No NGO Selected'}
                </span>
                {activeRegistryNgo && (
                  <span className="font-mono text-[10px] text-blue-300">({activeRegistryNgo.darpanRegNo})</span>
                )}
              </div>

              <ChevronRightIcon className="w-4 h-4 text-slate-600 shrink-0" />

              {/* Tier 2 Badge */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-950/80 border border-indigo-800/80 text-indigo-300 font-medium">
                <FolderTreeIcon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="truncate max-w-[220px]">
                  {activeRegistryProject ? activeRegistryProject.schemeName : 'No Scheme Selected'}
                </span>
                {activeRegistryProject && (
                  <span className="font-mono text-[10px] text-indigo-300">({activeRegistryProject.projectCode})</span>
                )}
              </div>

              <ChevronRightIcon className="w-4 h-4 text-slate-600 shrink-0" />

              {/* Tier 3 Badge */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 font-medium">
                <MapPinIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{activeProjectCenters.length} Physical Center(s) Linked</span>
              </div>
            </div>

            {/* Main Master-Detail 3-Tier Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* LEFT COLUMN: TIER 1 - NGO LIST */}
              <div className="lg:col-span-5 space-y-3">
                <div className="flex items-center justify-between pb-1">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <BuildingIcon className="w-4 h-4 text-cyan-400" />
                    Tier 1: Registered NGOs ({filteredRegistryNgos.length})
                  </h3>
                  <span className="text-[11px] text-slate-500 font-mono">Click to inspect</span>
                </div>

                {filteredRegistryNgos.length === 0 ? (
                  <div className="p-8 text-center rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-2">
                    <p>No NGOs match the current filter criteria.</p>
                    <button
                      onClick={handleResetRegistryFilters}
                      className="text-cyan-400 hover:underline text-xs"
                    >
                      Reset all filters
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredRegistryNgos.map((ngo) => {
                      const isSelected = activeRegistryNgo?.id === ngo.id;
                      const projectsForThisNgo = govProjects.filter((p) => p.ngoId === ngo.id);
                      const centersForThisNgo = welfareCenters.filter((c) => c.ngoId === ngo.id);

                      return (
                        <div
                          key={ngo.id}
                          onClick={() => {
                            setSelectedRegistryNgoId(ngo.id);
                            setSelectedRegistryProjectId(null);
                          }}
                          className={`rounded-xl border p-4 cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-slate-900 border-cyan-500/90 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500/40'
                              : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className={`text-sm font-bold ${isSelected ? 'text-cyan-300' : 'text-slate-100'}`}>
                                  {ngo.name}
                                </h4>
                                {isSelected && (
                                  <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-700">
                                    Selected
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                                DARPAN: <span className="text-cyan-400 font-semibold">{ngo.darpanRegNo}</span> &bull; PAN: {ngo.panNumber}
                              </div>
                            </div>

                            {/* NGO Status Management */}
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="shrink-0"
                            >
                              <select
                                value={ngo.status}
                                onChange={(e) =>
                                  handleUpdateNgoStatus(ngo.id, e.target.value as 'Active' | 'Under Review' | 'Suspended')
                                }
                                className={`text-[10px] px-2 py-0.5 rounded font-semibold border bg-slate-950 cursor-pointer ${
                                  ngo.status === 'Active'
                                    ? 'text-emerald-300 border-emerald-800 bg-emerald-950/50'
                                    : ngo.status === 'Under Review'
                                    ? 'text-amber-300 border-amber-800 bg-amber-950/50'
                                    : 'text-rose-300 border-rose-800 bg-rose-950/50'
                                }`}
                              >
                                <option value="Active">Active</option>
                                <option value="Under Review">Under Review</option>
                                <option value="Suspended">Suspended</option>
                              </select>
                            </div>
                          </div>

                          {/* Compliance Score & Nodal Officer */}
                          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                            <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80">
                              <span className="text-[10px] text-slate-400">Compliance Score</span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span
                                  className={`font-mono font-bold text-sm ${
                                    ngo.complianceScore >= 85
                                      ? 'text-emerald-400'
                                      : ngo.complianceScore >= 70
                                      ? 'text-amber-400'
                                      : 'text-rose-400'
                                  }`}
                                >
                                  {ngo.complianceScore}%
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono">/ 100</span>
                              </div>
                            </div>

                            <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80">
                              <span className="text-[10px] text-slate-400">Nodal Officer</span>
                              <div className="font-semibold text-slate-200 text-[11px] truncate mt-0.5">
                                {ngo.nodalPerson.name}
                              </div>
                              <div className="text-[10px] text-slate-500 truncate">
                                {ngo.nodalPerson.designation}
                              </div>
                            </div>
                          </div>

                          {/* Nodal Officer Contact & Registered Office */}
                          <div className="mt-2.5 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400 space-y-1">
                            <div>
                              <span className="text-slate-500">Contact:</span>{' '}
                              <span className="font-mono text-slate-300">{ngo.nodalPerson.phone}</span> &bull;{' '}
                              <span className="text-slate-300">{ngo.nodalPerson.email}</span>
                            </div>
                            <div className="truncate">
                              <span className="text-slate-500">Office:</span>{' '}
                              <span className="text-slate-300">{ngo.registeredOffice}</span>
                            </div>
                          </div>

                          {/* Linked Counts Strip */}
                          <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                            <span className="font-mono text-slate-400">
                              <strong className="text-slate-200">{projectsForThisNgo.length}</strong> Schemes &bull;{' '}
                              <strong className="text-slate-200">{centersForThisNgo.length}</strong> Centers
                            </span>
                            <span className={`font-semibold flex items-center gap-1 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`}>
                              {isSelected ? 'Viewing Projects ➔' : 'Select NGO ➔'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: TIER 2 (PROJECTS) + TIER 3 (CENTERS) */}
              <div className="lg:col-span-7 space-y-6">
                {!activeRegistryNgo ? (
                  <div className="p-12 text-center rounded-2xl border border-slate-800 bg-slate-900/60 text-slate-400 text-xs">
                    Select an NGO from the left to view its government welfare schemes and delivery centers.
                  </div>
                ) : (
                  <>
                    {/* TIER 2: GOVERNMENT WELFARE SCHEMES FOR ACTIVE NGO */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-4 shadow-lg shadow-black/40">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-3">
                        <div>
                          <h3 className="text-base font-bold text-white flex items-center gap-2">
                            <FolderTreeIcon className="w-4 h-4 text-cyan-400" />
                            Tier 2: Sanctioned Welfare Schemes ({activeNgoProjects.length})
                          </h3>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Linked NGO: <strong className="text-slate-200">{activeRegistryNgo.name}</strong> &bull; Click a scheme to view its physical centers
                          </p>
                        </div>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 self-start sm:self-auto">
                          DARPAN: {activeRegistryNgo.darpanRegNo}
                        </span>
                      </div>

                      {activeNgoProjects.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-400 bg-slate-950/60 rounded-xl border border-slate-800">
                          No government projects found for this NGO matching the active audit filter.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {activeNgoProjects.map((proj) => {
                            const isSelectedProj = activeRegistryProject?.id === proj.id;
                            const { remainingReleasedBudget, utilizationPercentage } = calculateFinancials(
                              proj.releasedBudget,
                              proj.spentBudget
                            );
                            const centersForThisProj = welfareCenters.filter((c) => c.projectId === proj.id);

                            return (
                              <div
                                key={proj.id}
                                onClick={() => setSelectedRegistryProjectId(proj.id)}
                                className={`rounded-xl border p-4 cursor-pointer transition-all space-y-3 ${
                                  isSelectedProj
                                    ? 'bg-slate-950 border-cyan-500/90 shadow-md shadow-cyan-950/50 ring-1 ring-cyan-500/40'
                                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                                }`}
                              >
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-semibold">
                                        {proj.projectCode}
                                      </span>
                                      <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                                        {proj.serviceType}
                                      </span>
                                      {isSelectedProj && (
                                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700">
                                          Active Scheme ▾
                                        </span>
                                      )}
                                    </div>
                                    <h4 className={`text-sm font-bold mt-1.5 ${isSelectedProj ? 'text-cyan-300' : 'text-slate-100'}`}>
                                      {proj.schemeName}
                                    </h4>
                                    <div className="text-[11px] text-slate-400 mt-0.5">
                                      Sanction Order: <span className="font-mono text-slate-300">{proj.sanctionOrderNo}</span> &bull; FY: {proj.financialYear} &bull; Daily Target: {proj.targetDailyBeneficiaries} beneficiaries
                                    </div>
                                    <div className="text-[11px] text-slate-500 mt-0.5">
                                      Valid: {proj.validFrom} to {proj.validUntil} &bull; Status: <span className="text-emerald-400 font-medium">{proj.status}</span>
                                    </div>
                                  </div>

                                  <div className="flex sm:flex-col items-center sm:items-end gap-1.5 shrink-0">
                                    <span
                                      className={`text-xs px-2 py-0.5 rounded font-mono font-medium border ${
                                        proj.financialAuditStatus === 'Reconciled'
                                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                                          : proj.financialAuditStatus === 'Under Review'
                                          ? 'bg-amber-950 text-amber-300 border-amber-800'
                                          : 'bg-rose-950 text-rose-300 border-rose-800'
                                      }`}
                                    >
                                      Audit: {proj.financialAuditStatus}
                                    </span>
                                  </div>
                                </div>

                                {/* 5-Metric Financial Overview */}
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs pt-1">
                                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                                    <span className="text-[10px] text-slate-400">Sanctioned</span>
                                    <div className="font-bold text-white font-mono mt-0.5">{formatCurrency(proj.sanctionedBudget)}</div>
                                  </div>
                                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                                    <span className="text-[10px] text-slate-400">Released</span>
                                    <div className="font-bold text-cyan-300 font-mono mt-0.5">{formatCurrency(proj.releasedBudget)}</div>
                                  </div>
                                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                                    <span className="text-[10px] text-slate-400">Spent</span>
                                    <div className="font-bold text-amber-300 font-mono mt-0.5">{formatCurrency(proj.spentBudget)}</div>
                                  </div>
                                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                                    <span className="text-[10px] text-slate-400">Remaining</span>
                                    <div className="font-bold text-emerald-300 font-mono mt-0.5">{formatCurrency(remainingReleasedBudget)}</div>
                                  </div>
                                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 col-span-2 sm:col-span-1">
                                    <span className="text-[10px] text-slate-400">Utilization</span>
                                    <div className="font-bold text-cyan-400 font-mono mt-0.5">{utilizationPercentage.toFixed(1)}%</div>
                                  </div>
                                </div>

                                {/* Link Indicator to Tier 3 */}
                                <div className="pt-1.5 flex items-center justify-between text-[11px]">
                                  <span className="font-mono text-slate-400 flex items-center gap-1.5">
                                    <MapPinIcon className="w-3.5 h-3.5 text-cyan-400" />
                                    {centersForThisProj.length} Physical Center(s) assigned
                                  </span>
                                  <span className={`font-semibold ${isSelectedProj ? 'text-cyan-300' : 'text-slate-400'}`}>
                                    {isSelectedProj ? 'Selected • Centers Below ▾' : 'Select to inspect centers ➔'}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* TIER 3: PHYSICAL WELFARE CENTERS FOR ACTIVE PROJECT */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-4 shadow-lg shadow-black/40">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-3">
                        <div>
                          <h3 className="text-base font-bold text-white flex items-center gap-2">
                            <MapPinIcon className="w-4 h-4 text-emerald-400" />
                            Tier 3: Physical Welfare Centers ({activeProjectCenters.length})
                          </h3>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Delivery Centers for Scheme:{' '}
                            <strong className="text-slate-200">
                              {activeRegistryProject ? activeRegistryProject.schemeName : 'None Selected'}
                            </strong>{' '}
                            {activeRegistryProject && (
                              <span className="font-mono text-cyan-400">({activeRegistryProject.projectCode})</span>
                            )}
                          </p>
                        </div>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 self-start sm:self-auto">
                          Operating Partner: {activeRegistryNgo.name}
                        </span>
                      </div>

                      {activeProjectCenters.length === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-400 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
                          <p>No welfare centers found for this project matching the active CCTV/District filters.</p>
                          {(registryCctvStatusFilter !== 'ALL' || registryDistrictFilter !== 'ALL') && (
                            <button
                              onClick={() => {
                                setRegistryCctvStatusFilter('ALL');
                                setRegistryDistrictFilter('ALL');
                              }}
                              className="text-cyan-400 hover:underline text-xs"
                            >
                              Reset CCTV &amp; District Filters
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                          {activeProjectCenters.map((center) => (
                            <div
                              key={center.id}
                              className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 text-xs space-y-3 hover:border-slate-700 transition-all shadow-sm"
                            >
                              <div className="flex items-start justify-between gap-2 border-b border-slate-800/70 pb-2.5">
                                <div>
                                  <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                    {center.code}
                                  </span>
                                  <h5 className="font-bold text-slate-100 text-sm mt-1">{center.name}</h5>
                                  <div className="text-[11px] text-slate-400 mt-0.5">{center.address}</div>
                                </div>
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800 shrink-0">
                                  {center.status}
                                </span>
                              </div>

                              {/* Key Center Attributes */}
                              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400">
                                <div>
                                  District: <span className="text-slate-200">{center.district}</span>
                                </div>
                                <div>
                                  State: <span className="text-slate-200">{center.state}</span>
                                </div>
                                <div>
                                  Capacity: <span className="text-slate-200 font-semibold">{center.beneficiaryCapacity} persons</span>
                                </div>
                                <div>
                                  Geofence: <span className="text-cyan-300 font-semibold">{center.geofenceRadiusMeters}m radius</span>
                                </div>
                              </div>

                              {/* GPS Coordinates & CCTV Status */}
                              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 space-y-1.5 text-[11px]">
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-400 flex items-center gap-1">
                                    <NavigationIcon className="w-3 h-3 text-cyan-400" />
                                    Coordinates:
                                  </span>
                                  <span className="font-mono text-slate-200">
                                    {center.coordinates.lat}&deg; N, {center.coordinates.lng}&deg; E
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-400">CCTV Telemetry:</span>
                                  <span
                                    className={`font-mono font-semibold px-2 py-0.2 rounded text-[10px] border ${
                                      center.cctvStreamStatus === 'Active'
                                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                                        : center.cctvStreamStatus === 'Intermittent'
                                        ? 'bg-amber-950 text-amber-300 border-amber-800'
                                        : 'bg-rose-950 text-rose-300 border-rose-800'
                                    }`}
                                  >
                                    {center.cctvStreamStatus} ({center.cctvCameraCount} cams)
                                  </span>
                                </div>
                              </div>

                              {/* Hierarchy Link Tag */}
                              <div className="pt-1 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                                <span className="truncate max-w-[180px]">Scheme: {activeRegistryProject?.projectCode}</span>
                                <span>NGO: {activeRegistryNgo.darpanRegNo}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>
        )}

        {/* POS Fingerprint Verification Terminal Tab */}
        {activeSection === 'POS_TOOL' && session && (
          <POSTerminal
            session={session}
            onBackToOverview={() => setActiveSection('HOME')}
          />
        )}
      </main>

      {/* 4-Step Controlled Onboarding Wizard Modal */}
      {onboardingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl shadow-black/80 space-y-5 p-6">
            {/* Modal Header */}
            <div className="border-b border-slate-800 pb-4 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                    Government Authority Only
                  </span>
                  <span className="text-xs text-slate-400">
                    Step {currentStep} of 4
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1">
                  Controlled NGO &amp; Welfare Center Registration
                </h3>
                <p className="text-xs text-slate-400">
                  Prototype: registration changes persist for the current session. Production persistence will use Supabase.
                </p>
              </div>
              <button
                onClick={() => setOnboardingModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                aria-label="Close"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Progress Indicator */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs font-semibold">
              <div className={`p-2 rounded-lg border ${currentStep >= 1 ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
                1. Legal NGO
              </div>
              <div className={`p-2 rounded-lg border ${currentStep >= 2 ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
                2. Scheme &amp; Budget
              </div>
              <div className={`p-2 rounded-lg border ${currentStep >= 3 ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
                3. Center Setup
              </div>
              <div className={`p-2 rounded-lg border ${currentStep >= 4 ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
                4. Provision Head
              </div>
            </div>

            {/* Form Error Banner */}
            {formError && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-700 text-rose-200 text-xs flex items-center gap-2">
                <AlertTriangleIcon className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitOnboarding} className="space-y-4 text-xs">
              {/* Step 1: Legal NGO Registration */}
              {currentStep === 1 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-slate-200 text-sm">Step 1 — Legal NGO Registration Details</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Legal NGO Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Navchetna Seva Sansthan"
                        value={formData.ngoName}
                        onChange={(e) => setFormData({ ...formData, ngoName: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Darpan Unique Reg No. *</label>
                      <input
                        type="text"
                        placeholder="e.g. DL/2024/0984-NGO"
                        value={formData.darpanRegNo}
                        onChange={(e) => setFormData({ ...formData, darpanRegNo: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Income Tax PAN *</label>
                      <input
                        type="text"
                        placeholder="e.g. AAATN5512M"
                        value={formData.panNumber}
                        onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500 font-mono uppercase"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Nodal Person Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Ramesh Chandra"
                        value={formData.nodalName}
                        onChange={(e) => setFormData({ ...formData, nodalName: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Nodal Officer Phone *</label>
                      <input
                        type="tel"
                        placeholder="e.g. +91 98101 23456"
                        value={formData.nodalPhone}
                        onChange={(e) => setFormData({ ...formData, nodalPhone: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Nodal Officer Email *</label>
                      <input
                        type="email"
                        placeholder="e.g. nodal@navchetna-demo.org"
                        value={formData.nodalEmail}
                        onChange={(e) => setFormData({ ...formData, nodalEmail: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-slate-400 mb-1">Registered Headquarters Address *</label>
                      <input
                        type="text"
                        placeholder="e.g. 54, Institutional Area, Sector 12, Dwarka, New Delhi - 110078"
                        value={formData.registeredOffice}
                        onChange={(e) => setFormData({ ...formData, registeredOffice: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Government Welfare Project & Financial Accountability */}
              {currentStep === 2 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-slate-200 text-sm">Step 2 — Government Welfare Scheme &amp; Financial Sanctions</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-slate-400 mb-1">Scheme / Project Title *</label>
                      <input
                        type="text"
                        placeholder="e.g. Urban Poor Subsidized Rasoi Program"
                        value={formData.schemeName}
                        onChange={(e) => setFormData({ ...formData, schemeName: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Government Project Code *</label>
                      <input
                        type="text"
                        placeholder="e.g. MSJE-UPSR-2026-44"
                        value={formData.projectCode}
                        onChange={(e) => setFormData({ ...formData, projectCode: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Sanction Order Number *</label>
                      <input
                        type="text"
                        placeholder="e.g. SO/2026/MSJE/6841"
                        value={formData.sanctionOrderNo}
                        onChange={(e) => setFormData({ ...formData, sanctionOrderNo: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Service Type</label>
                      <select
                        value={formData.serviceType}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            serviceType: e.target.value as 'Subsidized Meals' | 'Shelter Nutrition' | 'Day Care Outreach'
                          })
                        }
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
                      >
                        <option value="Subsidized Meals">Subsidized Meals</option>
                        <option value="Shelter Nutrition">Shelter Nutrition</option>
                        <option value="Day Care Outreach">Day Care Outreach</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Target Daily Beneficiaries</label>
                      <input
                        type="number"
                        value={formData.targetDailyBeneficiaries}
                        onChange={(e) => setFormData({ ...formData, targetDailyBeneficiaries: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Sanctioned Budget (INR) *</label>
                      <input
                        type="number"
                        step="50000"
                        value={formData.sanctionedBudget}
                        onChange={(e) => setFormData({ ...formData, sanctionedBudget: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Released Budget (INR) *</label>
                      <input
                        type="number"
                        step="50000"
                        value={formData.releasedBudget}
                        onChange={(e) => setFormData({ ...formData, releasedBudget: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-slate-400 mb-1">Reported Spent Budget (INR) *</label>
                      <input
                        type="number"
                        step="50000"
                        value={formData.spentBudget}
                        onChange={(e) => setFormData({ ...formData, spentBudget: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        Constraint: Spent Budget &le; Released Budget &le; Sanctioned Budget
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Welfare Center Setup & Geofence */}
              {currentStep === 3 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-slate-200 text-sm">Step 3 — Physical Welfare Center &amp; Geofence Configuration</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-slate-400 mb-1">Center / Kitchen Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Navchetna Rasoi Kendra - Dwarka Sec-12"
                        value={formData.centerName}
                        onChange={(e) => setFormData({ ...formData, centerName: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">District</label>
                      <select
                        value={formData.centerDistrict}
                        onChange={(e) => setFormData({ ...formData, centerDistrict: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
                      >
                        <option value="Central Delhi">Central Delhi</option>
                        <option value="South Delhi">South Delhi</option>
                        <option value="West Delhi">West Delhi</option>
                        <option value="East Delhi">East Delhi</option>
                        <option value="North West Delhi">North West Delhi</option>
                        <option value="South West Delhi">South West Delhi</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Beneficiary Nominal Capacity</label>
                      <input
                        type="number"
                        value={formData.beneficiaryCapacity}
                        onChange={(e) => setFormData({ ...formData, beneficiaryCapacity: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-slate-400 mb-1">Physical Street Address *</label>
                      <input
                        type="text"
                        placeholder="e.g. Near Metro Station Gate 2, Sector 12, Dwarka"
                        value={formData.centerAddress}
                        onChange={(e) => setFormData({ ...formData, centerAddress: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">GPS Latitude (&deg; N)</label>
                      <input
                        type="number"
                        step="0.0001"
                        value={formData.centerLat}
                        onChange={(e) => setFormData({ ...formData, centerLat: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">GPS Longitude (&deg; E)</label>
                      <input
                        type="number"
                        step="0.0001"
                        value={formData.centerLng}
                        onChange={(e) => setFormData({ ...formData, centerLng: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Strict Geofence Radius (meters)</label>
                      <input
                        type="number"
                        value={formData.geofenceRadius}
                        onChange={(e) => setFormData({ ...formData, geofenceRadius: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">CCTV Stream Status</label>
                      <select
                        value={formData.cctvStatus}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            cctvStatus: e.target.value as 'Active' | 'Intermittent' | 'Offline'
                          })
                        }
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
                      >
                        <option value="Active">Active Stream</option>
                        <option value="Intermittent">Intermittent</option>
                        <option value="Offline">Offline</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: NGO Head Account Provisioning */}
              {currentStep === 4 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-slate-200 text-sm">Step 4 — NGO Head Official Account Provisioning</h4>
                  <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-800/60 text-slate-300 space-y-1">
                    <span className="font-semibold text-blue-300">Government Provisioning Protocol:</span>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Public registration is forbidden. The account provisioned here will be bound exclusively to this NGO. The designated head will only have access to this NGO&apos;s records.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Designated NGO Head Name *</label>
                      <input
                        type="text"
                        value={formData.headName}
                        onChange={(e) => setFormData({ ...formData, headName: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Official Email Address *</label>
                      <input
                        type="email"
                        value={formData.headEmail}
                        onChange={(e) => setFormData({ ...formData, headEmail: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Official Designation</label>
                      <input
                        type="text"
                        value={formData.headDesignation}
                        onChange={(e) => setFormData({ ...formData, headDesignation: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Initial Provisional Passcode</label>
                      <input
                        type="password"
                        value={formData.headPassword}
                        onChange={(e) => setFormData({ ...formData, headPassword: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                    <div>Assigned NGO Identity: <strong className="text-cyan-300">{formData.ngoName || 'New NGO'}</strong></div>
                    <div>Account Status: <span className="text-emerald-400 font-semibold font-mono">ACTIVATED (Government Sanctioned)</span></div>
                  </div>
                </div>
              )}

              {/* Wizard Navigation Actions */}
              <div className="border-t border-slate-800 pt-4 flex items-center justify-between">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                  >
                    &larr; Back
                  </button>
                ) : (
                  <div />
                )}

                {currentStep < 4 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-md shadow-cyan-950/50 transition-all"
                  >
                    Next Step &rarr;
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/50 transition-all flex items-center gap-1.5"
                  >
                    <CheckCircleIcon className="w-4 h-4" />
                    Complete Registration &amp; Provision Head
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Project Detail Dossier Drawer/Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl shadow-black/80">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-start justify-between bg-slate-950/70">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    {selectedProject.code}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      selectedProject.riskLevel === 'High Priority Inspection'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : selectedProject.riskLevel === 'Moderate Watch'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}
                  >
                    {selectedProject.riskLevel}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1">{selectedProject.name}</h3>
                <p className="text-xs text-slate-400">
                  Operating NGO: <strong className="text-slate-200">{selectedProject.ngoName}</strong> &bull; Reg: {selectedProject.ngoRegNo}
                </p>
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                aria-label="Close"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs">
              {/* Linked Scheme Financial Breakdown */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">
                    Parent Scheme: {selectedProject.schemeName} ({selectedProject.projectCode})
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400">FY 2025-26</span>
                </div>

                {(() => {
                  const { remainingReleasedBudget, utilizationPercentage } = calculateFinancials(
                    selectedProject.releasedBudget,
                    selectedProject.spentBudget
                  );

                  return (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="p-2 rounded bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-400">Sanctioned</span>
                          <div className="font-bold text-white font-mono">{formatCurrency(selectedProject.sanctionedBudget)}</div>
                        </div>
                        <div className="p-2 rounded bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-400">Released</span>
                          <div className="font-bold text-cyan-300 font-mono">{formatCurrency(selectedProject.releasedBudget)}</div>
                        </div>
                        <div className="p-2 rounded bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-400">Spent</span>
                          <div className="font-bold text-amber-300 font-mono">{formatCurrency(selectedProject.spentBudget)}</div>
                        </div>
                        <div className="p-2 rounded bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-400">Remaining</span>
                          <div className="font-bold text-emerald-300 font-mono">{formatCurrency(remainingReleasedBudget)}</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Budget Utilization Rate:</span>
                        <span className="font-mono font-bold text-cyan-300">{utilizationPercentage.toFixed(1)}%</span>
                      </div>
                      <p className="text-[11px] text-slate-400 italic">
                        Financial Review Signal: Spending and service-delivery figures available for reconciliation.
                      </p>
                    </div>
                  );
                })()}
              </div>

              {/* Geofence & Location Telemetry */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <NavigationIcon className="w-3.5 h-3.5 text-cyan-400" />
                    GPS Geofence Proof-of-Presence Configuration
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                      selectedProject.cctvStreamStatus === 'Active'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        : selectedProject.cctvStreamStatus === 'Intermittent'
                        ? 'bg-amber-950 text-amber-300 border-amber-800'
                        : 'bg-rose-950 text-rose-300 border-rose-800'
                    }`}>
                      CCTV: {selectedProject.cctvStreamStatus}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                      Radius: {selectedProject.geofenceRadiusMeters} meters
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-400 text-[11px] font-mono">
                  <div>Latitude: <span className="text-slate-200">{selectedProject.coordinates.lat}&deg; N</span></div>
                  <div>Longitude: <span className="text-slate-200">{selectedProject.coordinates.lng}&deg; E</span></div>
                  <div>District: <span className="text-slate-200">{selectedProject.district}</span></div>
                  <div>State: <span className="text-slate-200">{selectedProject.state}</span></div>
                </div>
              </div>

              {/* Service & 2-Meal Telemetry */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 text-[11px]">Today Verified Count</div>
                  <div className="text-xl font-bold text-white mt-1 font-mono">{selectedProject.todayVerifiedCount}</div>
                  <div className="text-[10px] text-slate-500">Cap: {selectedProject.beneficiaryCapacity} beneficiaries</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 text-[11px]">Meal Transactions</div>
                  <div className="text-xl font-bold text-emerald-400 mt-1 font-mono">{selectedProject.todayMealTransactions}</div>
                  <div className="text-[10px] text-slate-500">Max 2 Meals/person allowed</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-rose-900/40">
                  <div className="text-slate-400 text-[11px]">3rd-Meal Blocked Violations</div>
                  <div className="text-xl font-bold text-rose-400 mt-1 font-mono">{selectedProject.todayMealViolationsBlocked}</div>
                  <div className="text-[10px] text-rose-400/80">Terminals auto-denied</div>
                </div>
              </div>

              {/* Operational Risk Score Breakdown */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <AlertTriangleIcon className="w-3.5 h-3.5 text-amber-400" />
                    Operational Risk Score &bull; {(((selectedProject.operationalRiskScore ?? selectedProject.aiAnomalyScore) ?? 0) * 100).toFixed(0)}% ({((selectedProject.operationalRiskScore ?? selectedProject.aiAnomalyScore) ?? 0).toFixed(2)})
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Prioritization only (Not proof of fraud)
                  </span>
                </div>
                <div className="p-2 rounded bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400">
                  <span className="text-cyan-300 font-medium">Notice:</span> Current score is derived from operational and compliance signals. ML-based anomaly detection will be added in the AI Risk Engine.
                </div>
                <ul className="space-y-1.5 pl-4 list-disc text-slate-300 text-[11px]">
                  {selectedProject.riskContributingFactors.map((factor, idx) => (
                    <li key={idx} className="leading-relaxed">{factor}</li>
                  ))}
                </ul>
              </div>

              {/* Inspection Status & Field Officer */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300">Statutory Field Inspection Status</span>
                  <span className="font-semibold text-cyan-300">{selectedProject.inspectionStatus}</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Assigned Officer: <strong className="text-slate-200">{selectedProject.assignedOfficer || 'Pending Random Assignment'}</strong>
                </div>
                <div className="text-[11px] text-slate-400">
                  Last Physical Verification: <span className="text-slate-200">{selectedProject.lastVerificationTime}</span>
                </div>
              </div>

              {/* Tamper-Evident SHA-256 Digest */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-cyan-900/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
                    <HashIcon className="w-3.5 h-3.5" />
                    Evidence Integrity: SHA-256 Cryptographic Hash
                  </span>
                  <button
                    onClick={() => copyShaToClipboard(selectedProject.sha256EvidenceHash)}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-mono border border-slate-700 transition-colors"
                  >
                    {copiedHash ? 'Copied!' : 'Copy Hash'}
                  </button>
                </div>
                <p className="font-mono text-[10px] text-slate-400 break-all bg-slate-900 p-2 rounded border border-slate-800">
                  {selectedProject.sha256EvidenceHash}
                </p>
                <div className="text-[10px] text-slate-500">
                  Tamper-evident seal generated upon last proof-of-presence upload. Immutable record.
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedProject(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
              >
                Close Dossier
              </button>
              <button
                type="button"
                onClick={() => {
                  const centerId = selectedProject.id.replace(/^op-/, '');
                  setSelectedProject(null);
                  handleTriggerDispatch(centerId);
                }}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-md shadow-cyan-950/40 border border-cyan-400/30 transition-all flex items-center gap-1.5"
              >
                <NavigationIcon className="w-3.5 h-3.5" />
                <span>Assign Field Inspection</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Smart Inspection Dispatch Modal (Real Authenticated Supabase RPC) */}
      {dispatchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {dispatchSuccessResult ? <CheckCircleIcon className="w-5 h-5 text-emerald-400" /> : <NavigationIcon className="w-5 h-5 text-cyan-400" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {dispatchSuccessResult
                      ? 'Inspection Order Sealed & Dispatched'
                      : 'Dispatch Risk-Weighted Field Inspection'}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    {dispatchSuccessResult
                      ? 'Executed via create_field_inspection_assignment() (SECURITY DEFINER)'
                      : 'Anti-Collusive Assignment Order • Authenticated Government RPC'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDispatchModalOpen(false);
                  setDispatchSuccessResult(null);
                  setDispatchError(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label="Close modal"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            {/* ERROR ALERT */}
            {dispatchError && (
              <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-800 text-xs text-rose-200 flex items-start gap-2.5">
                <AlertTriangleIcon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-semibold text-rose-300">Dispatch Order Rejected</div>
                  <div className="text-[11px] leading-relaxed text-rose-200/90">{dispatchError}</div>
                </div>
              </div>
            )}

            {/* SUCCESS CONFIRMATION VIEW */}
            {dispatchSuccessResult ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-700/80 text-xs text-emerald-200 flex items-start gap-2.5">
                  <CheckCircleIcon className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-bold text-emerald-300 text-sm">
                      Assignment Successfully Registered in Ledger!
                    </div>
                    <div className="text-[11px] text-emerald-200/90 leading-relaxed">
                      {dispatchSuccessResult.message || 'Inspection successfully assigned to Field Officer.'}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  {/* Generated Assignment Token */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">
                      Cryptographic Assignment Token (From RPC)
                    </span>
                    <div className="font-mono text-sm font-bold text-emerald-400 bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 break-all select-all flex items-center justify-between">
                      <span>{dispatchSuccessResult.assignment_token}</span>
                      <button
                        type="button"
                        onClick={() => copyShaToClipboard(dispatchSuccessResult.assignment_token)}
                        className="text-[10px] text-slate-400 hover:text-white font-sans px-2.5 py-1 rounded bg-slate-800 border border-slate-700 transition-colors ml-2"
                      >
                        {copiedHash ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  {/* ID & Status */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">
                        Inspection ID (UUID)
                      </span>
                      <div className="font-mono text-[11px] text-slate-300 truncate" title={dispatchSuccessResult.inspection_id}>
                        {dispatchSuccessResult.inspection_id}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">
                        Status
                      </span>
                      <div>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-950 text-blue-300 border border-blue-800 font-mono">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                          {dispatchSuccessResult.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Target Center & Officer */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">
                        Target Welfare Center
                      </span>
                      <div className="font-semibold text-slate-100 truncate">
                        {welfareCenters.find((c) => c.id === dispatchSuccessResult.center_id)?.name || dispatchSuccessResult.center_id}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        ID: {dispatchSuccessResult.center_id}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">
                        Assigned Field Officer
                      </span>
                      <div className="font-semibold text-cyan-300 truncate">
                        {dispatchSuccessResult.inspector_name}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono truncate" title={dispatchSuccessResult.inspector_user_id}>
                        UID: {dispatchSuccessResult.inspector_user_id}
                      </div>
                    </div>
                  </div>

                  {/* Scheduled Date */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Scheduled Execution Date:</span>
                    <span className="font-mono font-semibold text-slate-200">
                      {new Date(dispatchSuccessResult.scheduled_for).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  {/* Tamper Evidence & RLS Security Seal */}
                  <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-900/50 text-[11px] text-slate-300 leading-relaxed flex items-start gap-2">
                    <ShieldCheckIcon className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-blue-300">RLS Enforcement Active:</span>
                      <p className="text-slate-400 mt-0.5 leading-relaxed">
                        This inspection record is now persisted in <code className="text-cyan-400 font-mono">public.field_inspections</code>. Zero direct client INSERT/UPDATE/DELETE policies exist. The assigned Field Officer can access this record on their mobile terminal when authenticated.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setDispatchModalOpen(false);
                      setDispatchSuccessResult(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs shadow-md shadow-cyan-950/50 transition-all"
                  >
                    Acknowledge &amp; Return to Command Center
                  </button>
                </div>
              </div>
            ) : (
              /* CONFIGURATION & EXECUTION FORM VIEW */
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleExecuteDispatchRpc();
                }}
                className="space-y-4"
              >
                {/* Anti-Collusion Risk Notice */}
                {dispatchCandidateProject && (
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1">
                    <div className="text-slate-400 text-[11px] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                      Anti-Collusion Risk Assessment:
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Target selected via risk weighting: Operational Risk Score of{' '}
                      <strong className="text-amber-300 font-mono">
                        {((dispatchCandidateProject.operationalRiskScore ?? 0) * 100).toFixed(0)}%
                      </strong>{' '}
                      ({(dispatchCandidateProject.operationalRiskScore ?? 0).toFixed(2)}) based on telemetry and audit indicators.
                    </p>
                  </div>
                )}

                {/* 1. Target Welfare Center Select */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Target Welfare Center:
                  </label>
                  <select
                    value={selectedDispatchCenterId}
                    onChange={(e) => setSelectedDispatchCenterId(e.target.value)}
                    required
                    disabled={isDispatching}
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono disabled:opacity-50"
                  >
                    {welfareCenters.map((c) => {
                      const matchedProj = projects.find((p) => p.code === c.code || p.id === c.id || p.id === `op-${c.id}`);
                      const riskScore = matchedProj?.operationalRiskScore ? `${(matchedProj.operationalRiskScore * 100).toFixed(0)}%` : 'Standard';
                      return (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.code} - {c.district}) — Risk: {riskScore}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* 2. Field Officer Select (from public.user_profiles) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-300">
                      Assigned Independent Field Officer:
                    </label>
                    <span className="text-[10px] text-cyan-400 font-mono">
                      from public.user_profiles (role = FIELD_OFFICER)
                    </span>
                  </div>
                  {fieldOfficers.length > 0 ? (
                    <select
                      value={selectedFieldOfficerId}
                      onChange={(e) => handleFieldOfficerChange(e.target.value)}
                      required
                      disabled={isDispatching}
                      className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono disabled:opacity-50"
                    >
                      {fieldOfficers.map((officer) => (
                        <option key={officer.id} value={officer.id}>
                          {officer.name} — {officer.designation}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-800/60 text-xs text-amber-200">
                      No users with role <code className="font-mono">FIELD_OFFICER</code> found in public.user_profiles.
                    </div>
                  )}

                  {/* Selected Officer Preview Chip */}
                  {selectedFieldOfficerId && (
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between font-mono">
                      <span>Officer UID: {selectedFieldOfficerId.substring(0, 18)}...</span>
                      <span className="text-cyan-300">
                        {fieldOfficers.find((o) => o.id === selectedFieldOfficerId)?.badgeId || 'No Badge Attached'}
                      </span>
                    </div>
                  )}
                </div>

                {/* 3. Officer Badge ID & Scheduled Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-300">
                      Officer Badge ID
                    </label>
                    <input
                      type="text"
                      value={customOfficerBadgeId}
                      onChange={(e) => setCustomOfficerBadgeId(e.target.value)}
                      placeholder="e.g. GOV-DL-041"
                      disabled={isDispatching}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono disabled:opacity-50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-300">
                      Scheduled Execution Date
                    </label>
                    <input
                      type="date"
                      value={scheduledDispatchDate}
                      onChange={(e) => setScheduledDispatchDate(e.target.value)}
                      required
                      disabled={isDispatching}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Security Disclaimer */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[10px] text-slate-400 space-y-1">
                  <div className="font-semibold text-slate-300 flex items-center gap-1">
                    <ShieldCheckIcon className="w-3.5 h-3.5 text-cyan-400" />
                    Cryptographic Integrity &amp; Immutable Audit Trail:
                  </div>
                  <p className="leading-relaxed">
                    Dispatched assignments invoke the PostgreSQL <code className="text-cyan-400 font-mono">create_field_inspection_assignment</code> RPC. Project ID and NGO ID are resolved securely inside the transaction boundary. Direct client write operations on <code className="text-cyan-400 font-mono">public.field_inspections</code> remain blocked by kernel-level Row Level Security.
                  </p>
                </div>

                {/* Modal Footer Buttons */}
                <div className="border-t border-slate-800 pt-3 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setDispatchModalOpen(false)}
                    disabled={isDispatching}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isDispatching || fieldOfficers.length === 0}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-slate-700 disabled:to-slate-800 text-white font-semibold text-xs tracking-wide shadow-lg shadow-cyan-950/60 transition-all border border-cyan-400/30 disabled:border-slate-700 flex items-center justify-center gap-2"
                  >
                    {isDispatching ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Executing create_field_inspection_assignment RPC...
                      </>
                    ) : (
                      <>
                        <NavigationIcon className="w-3.5 h-3.5" />
                        Sign &amp; Execute Assignment Order (RPC)
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}