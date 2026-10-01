'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { UserSession, DEMO_WELFARE_CENTERS, DEMO_GOV_PROJECTS, DEMO_NGOS } from '@/lib/demo-data';
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase/client';
import {
  resolveInspectionHierarchyAction,
  HierarchyResolutionResult,
  ResolvedCenter,
  ResolvedProject,
  ResolvedNGO,
} from '@/app/actions/resolve-hierarchy';

// Inline Icons (Clean, self-contained SVG icons matching design system)
function ShieldIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function UserCheckIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <polyline points="16 11 18 13 22 9" />
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

function CalendarIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}

function BuildingIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01" />
      <path d="M16 6h.01" />
      <path d="M8 10h.01" />
      <path d="M16 10h.01" />
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

function ArrowRightIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function ArrowLeftIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  );
}

function AlertTriangleIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function CheckCircle2Icon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function CameraIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

function UsersIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function HashIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" x2="20" y1="9" y2="9" />
      <line x1="4" x2="20" y1="15" y2="15" />
      <line x1="10" x2="8" y1="3" y2="21" />
      <line x1="16" x2="14" y1="3" y2="21" />
    </svg>
  );
}

function NavigationIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 11 22 2 13 21 11 13 3 11" />
    </svg>
  );
}

// Data Model for Assigned Inspection
export interface AssignedInspectionItem {
  id: string;
  assignmentToken: string;
  centerId: string;
  centerName: string;
  centerCode: string;
  district: string;
  state: string;
  address: string;
  centerLat?: number;
  centerLng?: number;
  geofenceRadiusMeters?: number;
  cctvCameraCount?: number;
  cctvStreamStatus?: string;
  projectId: string;
  projectCode: string;
  schemeName: string;
  serviceType?: string;
  financialYear?: string;
  ngoId: string;
  ngoName: string;
  darpanRegNo: string;
  inspectorUserId: string;
  inspectorName: string;
  officerBadgeId?: string | null;
  assignedAt: string;
  scheduledFor: string;
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'FLAGGED_DISCREPANCY';
  sha256RecordHash?: string | null;
  isDemoSimulated?: boolean;
}

// Realistic Simulated Inspection for Prototype / Demo Persona
const DEMO_SIMULATED_ASSIGNMENT: AssignedInspectionItem = {
  id: 'insp-demo-del-01',
  assignmentToken: 'INS-2026-DL-0041',
  centerId: 'cnt-01',
  centerName: 'Annapurna Rasoi Kendra - Paharganj',
  centerCode: 'DL-ND-2026-084',
  district: 'Central Delhi',
  state: 'NCT of Delhi',
  address: 'Near Old Railway Station, Paharganj, New Delhi - 110055',
  centerLat: 28.6415,
  centerLng: 77.2144,
  geofenceRadiusMeters: 75,
  cctvCameraCount: 4,
  cctvStreamStatus: 'Active',
  projectId: 'prj-scheme-01',
  projectCode: 'MSJE-DSAS-2026-08',
  schemeName: 'Deendayal Subsidized Urban Nutrition Initiative',
  serviceType: 'Subsidized Meals',
  financialYear: '2025-26',
  ngoId: 'ngo-01',
  ngoName: 'Sahyog Seva Samiti',
  darpanRegNo: 'DL/2019/0482-NGO',
  inspectorUserId: 'usr-insp-01',
  inspectorName: 'Devendra Sharma',
  officerBadgeId: 'GOV-DL-041',
  assignedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  scheduledFor: new Date().toISOString(),
  status: 'ASSIGNED',
  sha256RecordHash: null,
  isDemoSimulated: true,
};

interface FieldOfficerPortalProps {
  session: UserSession;
  onSignOut: () => void;
}

export function FieldOfficerPortal({ session, onSignOut }: FieldOfficerPortalProps) {
  const supabaseConfigured = isSupabaseConfigured();
  const isRealSupabaseUser = supabaseConfigured && session.userId && !session.userId.startsWith('usr-');

  const [inspections, setInspections] = useState<AssignedInspectionItem[]>(() => {
    return isRealSupabaseUser ? [] : [DEMO_SIMULATED_ASSIGNMENT];
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => Boolean(isRealSupabaseUser));
  const [error, setError] = useState<string | null>(null);
  const [activeInspection, setActiveInspection] = useState<AssignedInspectionItem | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  const loadAssignedInspections = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsLoading(true);
    }
    setError(null);

    const supabase = getSupabaseBrowserClient();
    if (!supabase || !isRealSupabaseUser) {
      setInspections([DEMO_SIMULATED_ASSIGNMENT]);
      setIsLoading(false);
      setLastRefreshedAt(new Date());
      return;
    }

    try {
      // 1. Query field_inspections for the authenticated Field Officer via RLS
      const { data, error: queryError } = await supabase
        .from('field_inspections')
        .select('*')
        .order('scheduled_for', { ascending: true });

      if (queryError) {
        setError(`Database error: ${queryError.message}`);
        setInspections([]);
        setIsLoading(false);
        setLastRefreshedAt(new Date());
        return;
      }

      if (!data || data.length === 0) {
        setInspections([]);
        setIsLoading(false);
        setLastRefreshedAt(new Date());
        return;
      }

      // 2. Extract unique hierarchy IDs from the real Supabase records
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const centerIds = Array.from(new Set(data.map((r: any) => r.center_id).filter(Boolean)));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const projectIds = Array.from(new Set(data.map((r: any) => r.project_id).filter(Boolean)));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ngoIds = Array.from(new Set(data.map((r: any) => r.ngo_id).filter(Boolean)));

      // 3. Resolve the actual hierarchy from Supabase tables
      let hierarchyResult: HierarchyResolutionResult | null = null;
      try {
        hierarchyResult = await resolveInspectionHierarchyAction(centerIds, projectIds, ngoIds);
      } catch (actionErr) {
        console.warn('Server Action failed, attempting API route fallback:', actionErr);
        try {
          const res = await fetch('/api/field-officer/resolve-hierarchy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ centerIds, projectIds, ngoIds }),
          });
          if (res.ok) {
            const json = await res.json();
            const centersMap: Record<string, ResolvedCenter> = {};
            const projectsMap: Record<string, ResolvedProject> = {};
            const ngosMap: Record<string, ResolvedNGO> = {};
            (json.centers || []).forEach((c: ResolvedCenter) => { centersMap[c.id] = c; });
            (json.projects || []).forEach((p: ResolvedProject) => { projectsMap[p.id] = p; });
            (json.ngos || []).forEach((n: ResolvedNGO) => { ngosMap[n.id] = n; });
            hierarchyResult = {
              source: json.source || 'supabase',
              centers: centersMap,
              projects: projectsMap,
              ngos: ngosMap,
            };
          }
        } catch (fetchErr) {
          console.error('API route fallback also failed:', fetchErr);
        }
      }

      // 4. Map each real Supabase row into an AssignedInspectionItem
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped: AssignedInspectionItem[] = data.map((row: any) => {
        const center = hierarchyResult?.centers[row.center_id];
        const project = hierarchyResult?.projects[row.project_id];
        const ngo = hierarchyResult?.ngos[row.ngo_id];

        // Resilient fallback by exact ID match if database sync is pending
        const fallbackCenter = DEMO_WELFARE_CENTERS.find((c) => c.id === row.center_id);
        const fallbackProject = DEMO_GOV_PROJECTS.find((p) => p.id === row.project_id);
        const fallbackNgo = DEMO_NGOS.find((n) => n.id === row.ngo_id);

        return {
          id: row.id,
          assignmentToken: row.assignment_token,
          centerId: row.center_id,
          centerName: center?.name || fallbackCenter?.name || row.center_id,
          centerCode: center?.code || fallbackCenter?.code || row.center_id,
          district: center?.district || fallbackCenter?.district || 'Delhi',
          state: center?.state || fallbackCenter?.state || 'NCT of Delhi',
          address: center?.address || fallbackCenter?.address || 'Address pending registry update',
          centerLat: center?.latitude ?? fallbackCenter?.coordinates.lat,
          centerLng: center?.longitude ?? fallbackCenter?.coordinates.lng,
          geofenceRadiusMeters: center?.geofence_radius_meters ?? fallbackCenter?.geofenceRadiusMeters ?? 75,
          cctvCameraCount: center?.cctv_camera_count ?? fallbackCenter?.cctvCameraCount ?? 2,
          cctvStreamStatus: center?.cctv_stream_status ?? fallbackCenter?.cctvStreamStatus ?? 'Active',
          projectId: row.project_id,
          projectCode: project?.project_code || fallbackProject?.projectCode || row.project_id,
          schemeName: project?.scheme_name || fallbackProject?.schemeName || 'Government Welfare Scheme',
          serviceType: project?.service_type || fallbackProject?.serviceType || 'Subsidized Meals',
          financialYear: project?.financial_year || fallbackProject?.financialYear || '2025-26',
          ngoId: row.ngo_id,
          ngoName: ngo?.name || fallbackNgo?.name || 'Registered Operating NGO',
          darpanRegNo: ngo?.darpan_reg_no || fallbackNgo?.darpanRegNo || 'Pending DARPAN Sync',
          inspectorUserId: row.inspector_user_id,
          inspectorName: row.inspector_name,
          officerBadgeId: row.officer_badge_id,
          assignedAt: row.assigned_at,
          scheduledFor: row.scheduled_for,
          status: row.status,
          sha256RecordHash: row.sha256_record_hash,
          isDemoSimulated: false, // Verified live Supabase database record
        };
      });

      setInspections(mapped);
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve assigned inspections.';
      setError(msg);
      setInspections([]);
    } finally {
      setIsLoading(false);
      setLastRefreshedAt(new Date());
    }
  }, [isRealSupabaseUser]);

  useEffect(() => {
    if (!isRealSupabaseUser) return;
    let isMounted = true;

    Promise.resolve().then(() => {
      if (isMounted) {
        loadAssignedInspections();
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isRealSupabaseUser, loadAssignedInspections]);

  const handleManualRefresh = async () => {
    await loadAssignedInspections(true);
  };

  // Filtered inspection list
  const filteredInspections = inspections.filter((item) => {
    if (statusFilter === 'ALL') return true;
    return item.status === statusFilter;
  });

  const getStatusBadge = (status: AssignedInspectionItem['status']) => {
    switch (status) {
      case 'ASSIGNED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-950/80 text-blue-300 border border-blue-700/60 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            ASSIGNED
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-950/80 text-amber-300 border border-amber-700/60 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            IN_PROGRESS
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 font-mono">
            <CheckCircle2Icon className="w-3 h-3 text-emerald-400" />
            COMPLETED
          </span>
        );
      case 'FLAGGED_DISCREPANCY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-950/80 text-rose-300 border border-rose-700/60 font-mono">
            <AlertTriangleIcon className="w-3 h-3 text-rose-400" />
            FLAGGED_DISCREPANCY
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top National Header Strip */}
      <header className="border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
            <span className="font-semibold text-slate-200">GOVERNMENT OF INDIA</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Ministry of Social Justice &amp; Empowerment</span>
          </div>
          <div className="flex items-center space-x-2 font-mono text-[11px]">
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {supabaseConfigured ? 'Supabase RLS Active' : 'Prototype Simulation'}
            </span>
            <span className="text-indigo-400 font-semibold px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-800/60">
              SIH26095
            </span>
          </div>
        </div>

        {/* Official Terminal Brand Strip */}
        <div className="border-t border-slate-800/60 bg-slate-950/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 border border-indigo-400/40 shadow-md shadow-indigo-950/60">
                <ShieldIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  NIGRANI 360 — Field Inspection Terminal
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-800/60">
                    OFFICER PORTAL
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  On-Site Physical Verification, Tamper-Evident Geofence Auditing &amp; Attendance Reconciliation
                </p>
              </div>
            </div>

            {/* Officer Profile Chip & Sign Out */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                <div className="w-7 h-7 rounded-lg bg-indigo-950 border border-indigo-700/60 flex items-center justify-center text-indigo-300">
                  <UserCheckIcon className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-slate-100 leading-tight">{session.name}</div>
                  <div className="text-[10px] text-indigo-300/90 font-mono">
                    {session.designation || 'Field Inspection Officer'}
                  </div>
                </div>
              </div>

              <button
                onClick={onSignOut}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-800/80 text-slate-300 hover:text-rose-200 text-xs font-medium transition-all"
                title="Sign out of Field Inspection Terminal"
              >
                <LogOutIcon className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Terminal Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Error Notice */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-xs text-rose-200 flex items-start gap-2.5 shadow-lg shadow-rose-950/30">
            <AlertTriangleIcon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="font-semibold text-rose-300">Database Query Error</div>
              <div className="text-[11px] leading-relaxed text-rose-200/90">{error}</div>
            </div>
          </div>
        )}

        {/* VIEW 1: ASSIGNED INSPECTIONS LIST */}
        {!activeInspection && (
          <div className="space-y-6">
            {/* Officer Identity & Statutory Mandate Card */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl relative overflow-hidden backdrop-blur-sm">
              <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-900/80 to-slate-900 border border-indigo-700/50 flex items-center justify-center text-indigo-300 shadow-inner">
                    <UserCheckIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-white">{session.name}</h2>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Verified Official Session
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {session.designation} &bull; <span className="text-slate-300">{session.departmentOrNgo}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300">
                    <span className="text-slate-500">Security: </span>
                    <span className="text-indigo-400 font-semibold">Row-Level Security (RLS)</span>
                  </div>
                  <button
                    onClick={handleManualRefresh}
                    disabled={isLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-all disabled:opacity-50"
                  >
                    <RefreshCwIcon className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs">
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <span className="text-slate-500 text-[11px] block">Statutory Role</span>
                  <span className="font-semibold text-slate-200 mt-0.5 block font-mono">GOVERNMENT FIELD OFFICER</span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Role key: FIELD_OFFICER</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <span className="text-slate-500 text-[11px] block">Assigned Directorate</span>
                  <span className="font-semibold text-slate-200 mt-0.5 block truncate">Central Monitoring &amp; Inspection</span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Dept of Social Justice &amp; Empowerment</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <span className="text-slate-500 text-[11px] block">Active Terminal State</span>
                  <span className="font-semibold text-emerald-400 mt-0.5 block flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Terminal Ready for Field Verification
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Last synced: {lastRefreshedAt.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
                  </span>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-xl bg-blue-950/30 border border-blue-800/40 text-[11px] text-slate-300 leading-relaxed flex items-start gap-2.5">
                <ShieldIcon className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-blue-300">Direct Database Mutation Protection Active:</span>
                  <p className="text-slate-300/90 mt-0.5">
                    Field inspection records are governed by zero-client-mutation RLS policies. Client queries are restricted to <code className="text-cyan-300 font-mono">inspector_user_id = auth.uid()</code>. Direct client <code className="text-cyan-300 font-mono">INSERT</code>, <code className="text-cyan-300 font-mono">UPDATE</code>, and <code className="text-cyan-300 font-mono">DELETE</code> operations are denied at the database kernel level.
                  </p>
                </div>
              </div>
            </div>

            {/* Assigned Inspections Header & Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
              <div className="flex items-center space-x-2.5">
                <NavigationIcon className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-semibold text-white">
                  Assigned Welfare Center Inspections
                </h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 font-bold">
                  {filteredInspections.length}
                </span>
              </div>

              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
                {(['ALL', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setStatusFilter(filter)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                      statusFilter === filter
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Empty State */}
            {filteredInspections.length === 0 && !isLoading && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 mx-auto flex items-center justify-center text-slate-400">
                  <NavigationIcon className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-slate-200">No Assigned Inspections Found</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  There are currently no inspection assignments linked to your official account ID in <code className="text-cyan-400 font-mono">public.field_inspections</code>. Inspections are dispatched by the Central Command Center via Government Assignment Orders.
                </p>
                {supabaseConfigured && !session.userId.startsWith('usr-') && (
                  <div className="pt-2">
                    <button
                      onClick={() => setInspections([DEMO_SIMULATED_ASSIGNMENT])}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-950 border border-indigo-800 text-indigo-300 text-xs font-medium hover:bg-indigo-900/80 transition-all"
                    >
                      <span>Load Prototype Demo Assignment for Inspection Simulation</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                <span className="inline-block w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin" />
                <div>Verifying assignments via Supabase RLS...</div>
              </div>
            )}

            {/* Inspection Cards Grid */}
            <div className="grid grid-cols-1 gap-4">
              {filteredInspections.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg hover:border-slate-700 transition-all space-y-4"
                >
                  {/* Top Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-950 text-indigo-300 border border-indigo-800/80">
                        {item.assignmentToken}
                      </span>
                      {item.isDemoSimulated ? (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-700/80 shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          Prototype Demo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700/80 shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Supabase Live Assignment
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(item.status)}
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                        <CalendarIcon className="w-3.5 h-3.5 text-slate-500" />
                        <span>
                          {new Date(item.scheduledFor).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Center & Scheme Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                    {/* Center Information */}
                    <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                      <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                        <MapPinIcon className="w-3.5 h-3.5 text-indigo-400" />
                        Target Welfare Center
                      </div>
                      <div className="font-bold text-white text-sm">{item.centerName}</div>
                      <div className="text-[11px] text-indigo-300 font-mono">
                        Code: {item.centerCode} &bull; ID: {item.centerId}
                      </div>
                      <div className="text-[11px] text-slate-400 leading-tight pt-1 border-t border-slate-900">
                        {item.address}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        District: {item.district}, {item.state}
                      </div>
                    </div>

                    {/* Project & Scheme Details */}
                    <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                      <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                        <BuildingIcon className="w-3.5 h-3.5 text-blue-400" />
                        Government Scheme &amp; Project
                      </div>
                      <div className="font-bold text-white text-sm">{item.schemeName}</div>
                      <div className="text-[11px] text-blue-300 font-mono">
                        Project Code: {item.projectCode}
                      </div>
                      <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-900">
                        Service: <strong className="text-slate-300">{item.serviceType || 'Subsidized Meals'}</strong>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        FY: {item.financialYear || '2025-26'} &bull; On-site attendance audit
                      </div>
                    </div>

                    {/* Implementing NGO Information */}
                    <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                      <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                        <ShieldIcon className="w-3.5 h-3.5 text-emerald-400" />
                        Operating NGO Partner
                      </div>
                      <div className="font-bold text-white text-sm">{item.ngoName}</div>
                      <div className="text-[11px] text-emerald-300 font-mono">
                        DARPAN: {item.darpanRegNo}
                      </div>
                      <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-900 font-mono">
                        Coordinates: {item.centerLat ? `${item.centerLat.toFixed(4)}° N, ${item.centerLng?.toFixed(4)}° E` : 'Pending GPS Sync'}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center justify-between font-mono">
                        <span>Geofence: &plusmn;{item.geofenceRadiusMeters || 75}m</span>
                        {item.cctvStreamStatus && (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            CCTV: {item.cctvCameraCount || 2} Cams ({item.cctvStreamStatus})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
                    <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
                      <span>Assigned: {new Date(item.assignedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</span>
                      {item.officerBadgeId && (
                        <>
                          <span className="text-slate-600">&bull;</span>
                          <span className="text-indigo-400">Badge: {item.officerBadgeId}</span>
                        </>
                      )}
                    </div>

                    <button
                      onClick={() => setActiveInspection(item)}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold text-xs tracking-wide shadow-md shadow-indigo-950/50 transition-all border border-indigo-400/30"
                    >
                      <span>Start Inspection</span>
                      <ArrowRightIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 2: ACTIVE INSPECTION TERMINAL FOUNDATION */}
        {activeInspection && (
          <div className="space-y-6">
            {/* Top Navigation & Status Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <button
                onClick={() => setActiveInspection(null)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-all w-fit"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                <span>Return to Assigned Inspections</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400">Assignment:</span>
                <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-950 text-indigo-300 border border-indigo-800">
                  {activeInspection.assignmentToken}
                </span>
                {getStatusBadge(activeInspection.status)}
              </div>
            </div>

            {/* Active Duty Overview Banner */}
            <div className="rounded-2xl border border-indigo-900/60 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-blue-950/40 p-5 shadow-2xl relative overflow-hidden">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${activeInspection.isDemoSimulated ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} />
                    <span className={`text-xs font-semibold tracking-wide uppercase font-mono ${activeInspection.isDemoSimulated ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {activeInspection.isDemoSimulated ? 'Prototype Demo Session' : 'Supabase Live Inspection Session'}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    {activeInspection.centerName}
                  </h2>
                  <p className="text-xs text-slate-300">
                    {activeInspection.address} &bull; <span className="text-indigo-300 font-mono">Code: {activeInspection.centerCode} &bull; ID: {activeInspection.centerId}</span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 font-mono">
                    <span className="text-slate-500">Scheme: </span>
                    <span className="text-slate-200 font-semibold">{activeInspection.schemeName} ({activeInspection.projectCode})</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 font-mono">
                    <span className="text-slate-500">NGO: </span>
                    <span className="text-slate-200 font-semibold">{activeInspection.ngoName} (DARPAN: {activeInspection.darpanRegNo})</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pre-Inspection Protocol & Verification Readiness Checklist */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <ShieldIcon className="w-4 h-4 text-indigo-400" />
                    Pre-Inspection Protocol &amp; Verification Readiness
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Field inspection verification foundation (Phase architecture overview)
                  </p>
                </div>
                <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  Step 1 Foundation
                </span>
              </div>

              {/* Protocol Phase Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Phase 1: GPS Presence */}
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
                      <div className="p-1.5 rounded-lg bg-indigo-950 text-indigo-400 border border-indigo-800">
                        <MapPinIcon className="w-4 h-4" />
                      </div>
                      Phase 1: GPS Presence &amp; Geofence Verification
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      Pending Step 2
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Captures device GPS coordinates on arrival and cryptographically validates whether officer is inside the registered centre boundary ({activeInspection.geofenceRadiusMeters || 75}m tolerance radius).
                  </p>
                  <div className="p-2.5 rounded-xl bg-slate-950 text-[11px] font-mono text-slate-400 space-y-1">
                    <div>Registered Centre Lat/Lng: {activeInspection.centerLat ? `${activeInspection.centerLat.toFixed(4)}° N, ${activeInspection.centerLng?.toFixed(4)}° E` : '28.6415° N, 77.2144° E'}</div>
                    <div className="text-indigo-400">Target Geofence Tolerance: &plusmn;{activeInspection.geofenceRadiusMeters || 75}m</div>
                  </div>
                </div>

                {/* Phase 2: Visual Evidence */}
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold text-blue-300">
                      <div className="p-1.5 rounded-lg bg-blue-950 text-blue-400 border border-blue-800">
                        <CameraIcon className="w-4 h-4" />
                      </div>
                      Phase 2: Visual Evidence &amp; AI Headcount
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      Pending Step 2
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Live camera photo capture with device timestamping and edge YOLOv8 person detection to compute on-site physical attendance.
                  </p>
                  <div className="p-2.5 rounded-xl bg-slate-950 text-[11px] font-mono text-slate-400 space-y-1">
                    <div>Model: YOLOv8 Crowd/Person Detection</div>
                    <div className="text-blue-400">Tamper-Proofing: SHA-256 evidence image digest</div>
                  </div>
                </div>

                {/* Phase 3: Attendance Reconciliation */}
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                      <div className="p-1.5 rounded-lg bg-amber-950 text-amber-400 border border-amber-800">
                        <UsersIcon className="w-4 h-4" />
                      </div>
                      Phase 3: Biometric POS Reconciliation
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      Pending Step 2
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Cross-references physical attendance with verified fingerprint meal transactions from <code className="text-cyan-300 font-mono">public.meal_transactions</code> to detect ghost beneficiaries.
                  </p>
                  <div className="p-2.5 rounded-xl bg-slate-950 text-[11px] font-mono text-slate-400 space-y-1">
                    <div>Formula: Discrepancy Delta = Physical Headcount - POS Count</div>
                    <div className="text-amber-400">Threshold: Discrepancy &gt; 15% triggers FLAGGED_DISCREPANCY</div>
                  </div>
                </div>

                {/* Phase 4: Cryptographic Ledger Sealing */}
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
                      <div className="p-1.5 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800">
                        <HashIcon className="w-4 h-4" />
                      </div>
                      Phase 4: Cryptographic Ledger Sealing
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      Pending Step 2
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Submits final inspection via <code className="text-cyan-300 font-mono">submit_field_inspection()</code> RPC. Once finalized, database immutability trigger seals the record permanently.
                  </p>
                  <div className="p-2.5 rounded-xl bg-slate-950 text-[11px] font-mono text-slate-400 space-y-1">
                    <div>RPC: submit_field_inspection(p_inspection_id, ...)</div>
                    <div className="text-emerald-400">Security: Direct client UPDATE/DELETE blocked by RLS</div>
                  </div>
                </div>
              </div>

              {/* Milestone Scope Notice */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-indigo-800/40 text-xs text-slate-300 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-indigo-300">
                  <ShieldIcon className="w-4 h-4 text-indigo-400" />
                  Terminal Foundation Milestone Verified
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  The Field Officer terminal foundation and assigned inspection routing are active. In accordance with the project milestone schedule, hardware GPS capture, live camera integration, and YOLOv8 model inference are non-goals for this foundation step and will be connected in subsequent verification modules.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* National Footer */}
      <footer className="border-t border-slate-800/80 py-3 text-center text-xs text-slate-500 bg-slate-950">
        Department of Social Justice &amp; Empowerment &bull; Government of India &bull; Field Inspection &amp; Physical Verification Directorate
      </footer>
    </div>
  );
}
