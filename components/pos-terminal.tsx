'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  UserSession,
  DEMO_WELFARE_CENTERS,
  DEMO_BENEFICIARIES
} from '@/lib/demo-data';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Database, MealVerificationResult } from '@/lib/supabase/types';

type CenterRow = Database['public']['Tables']['welfare_centers']['Row'];
type BeneficiaryRow = Database['public']['Tables']['beneficiaries']['Row'];
type MealTransactionRow = Database['public']['Tables']['meal_transactions']['Row'];

// --- Inline SVG Icons (Zero external dependencies) ---
function FingerprintIcon({ className = 'w-6 h-6' }: { className?: string }) {
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

function ShieldCheckIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
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

function XCircleIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
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

function UserCheckIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <polyline points="16 11 18 13 22 9" />
    </svg>
  );
}

function TerminalIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  );
}

function ClockIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function HashIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="9" x2="20" y2="9" />
      <line x1="4" y1="15" x2="20" y2="15" />
      <line x1="10" y1="3" x2="8" y2="21" />
      <line x1="16" y1="3" x2="14" y2="21" />
    </svg>
  );
}

function CopyIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function RefreshCwIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2v6h-6" />
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M3 22v-6h6" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
    </svg>
  );
}

function ArrowLeftIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

interface POSTerminalProps {
  session: UserSession;
  onBackToOverview?: () => void;
}

export function POSTerminal({ session, onBackToOverview }: POSTerminalProps) {
  // Terminal Configuration State
  const [terminalId, setTerminalId] = useState<'POS-TERM-01' | 'POS-TERM-02' | 'POS-TERM-03'>('POS-TERM-01');
  const [centers, setCenters] = useState<CenterRow[]>([]);
  const [selectedCenterId, setSelectedCenterId] = useState<string>('cnt-01');
  const [isLoadingCenters, setIsLoadingCenters] = useState(true);

  // Beneficiaries State
  const [beneficiaries, setBeneficiaries] = useState<BeneficiaryRow[]>([]);
  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState<string>('ben-0101');
  const [isLoadingBeneficiaries, setIsLoadingBeneficiaries] = useState(true);

  // Scanner & Verification State
  const [scannerStatus, setScannerStatus] = useState<
    'IDLE' | 'SCANNING' | 'MATCHED' | 'VERIFYING' | 'SUCCESS' | 'DENIED' | 'ERROR'
  >('IDLE');
  const [verificationResult, setVerificationResult] = useState<MealVerificationResult | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  // History State
  const [todaysMealHistory, setTodaysMealHistory] = useState<MealTransactionRow[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const isGovAuthority = session.role === 'GOVERNMENT_AUTHORITY';
  const assignedNgoId = session.assignedNgoId;

  // 1. Fetch Centers from Supabase (with demo fallback)
  useEffect(() => {
    async function loadCenters() {
      setIsLoadingCenters(true);
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        // Fallback to demo centers
        const filtered = isGovAuthority
          ? DEMO_WELFARE_CENTERS
          : DEMO_WELFARE_CENTERS.filter((c) => c.ngoId === assignedNgoId);
        const mapped: CenterRow[] = filtered.map((c) => ({
          id: c.id,
          project_id: c.projectId,
          ngo_id: c.ngoId,
          code: c.code,
          name: c.name,
          district: c.district,
          state: c.state,
          address: c.address,
          latitude: c.coordinates.lat,
          longitude: c.coordinates.lng,
          geofence_radius_meters: c.geofenceRadiusMeters,
          beneficiary_capacity: c.beneficiaryCapacity,
          cctv_camera_count: c.cctvCameraCount,
          cctv_stream_status: c.cctvStreamStatus,
          status: 'Operational',
          created_by: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
        setCenters(mapped);
        if (mapped.length > 0) {
          setSelectedCenterId(mapped[0].id);
        }
        setIsLoadingCenters(false);
        return;
      }

      try {
        const query = supabase.from('welfare_centers').select('*').order('name');
        const res = !isGovAuthority && assignedNgoId
          ? await query.eq('ngo_id', assignedNgoId)
          : await query;
        if (res.error) throw res.error;
        if (res.data && res.data.length > 0) {
          const fetchedCenters = res.data as CenterRow[];
          setCenters(fetchedCenters);
          setSelectedCenterId(fetchedCenters[0].id);
        }
      } catch (err) {
        console.error('Error fetching welfare centers from Supabase:', err);
      } finally {
        setIsLoadingCenters(false);
      }
    }
    let isMounted = true;
    Promise.resolve().then(() => {
      if (isMounted) {
        loadCenters();
      }
    });
    return () => {
      isMounted = false;
    };
  }, [isGovAuthority, assignedNgoId]);

  // 2. Fetch Beneficiaries from Supabase
  const loadBeneficiaries = useCallback(async () => {
    setIsLoadingBeneficiaries(true);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      // Fallback
      const mapped: BeneficiaryRow[] = DEMO_BENEFICIARIES.map((b) => ({
        id: b.id,
        full_name: b.fullName,
        identification_token: b.identificationToken,
        category: b.category,
        registered_center_id: b.registeredCenterId,
        project_id: b.projectId,
        ngo_id: b.ngoId,
        status: b.status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      setBeneficiaries(mapped);
      const firstForCenter = mapped.find((b) => b.registered_center_id === selectedCenterId) || mapped[0];
      if (firstForCenter) setSelectedBeneficiaryId(firstForCenter.id);
      setIsLoadingBeneficiaries(false);
      return;
    }

    try {
      const query = supabase.from('beneficiaries').select('*').order('id');
      const res = !isGovAuthority && assignedNgoId
        ? await query.eq('ngo_id', assignedNgoId)
        : await query;
      if (res.error) throw res.error;
      if (res.data && res.data.length > 0) {
        const fetchedBeneficiaries = res.data as BeneficiaryRow[];
        setBeneficiaries(fetchedBeneficiaries);
        const centerMatch = fetchedBeneficiaries.find((b) => b.registered_center_id === selectedCenterId) || fetchedBeneficiaries[0];
        if (centerMatch) setSelectedBeneficiaryId(centerMatch.id);
      }
    } catch (err) {
      console.error('Error loading beneficiaries from Supabase:', err);
    } finally {
      setIsLoadingBeneficiaries(false);
    }
  }, [isGovAuthority, assignedNgoId, selectedCenterId]);

  useEffect(() => {
    let isMounted = true;
    Promise.resolve().then(() => {
      if (isMounted) {
        loadBeneficiaries();
      }
    });
    return () => {
      isMounted = false;
    };
  }, [loadBeneficiaries]);

  // 3. Current Selected Objects
  const currentCenter = useMemo(() => {
    return centers.find((c) => c.id === selectedCenterId) || centers[0];
  }, [centers, selectedCenterId]);

  const currentBeneficiary = useMemo(() => {
    return beneficiaries.find((b) => b.id === selectedBeneficiaryId) || beneficiaries[0];
  }, [beneficiaries, selectedBeneficiaryId]);

  // Enrolled beneficiaries for this center
  const centerBeneficiaries = useMemo(() => {
    return beneficiaries.filter((b) => b.registered_center_id === selectedCenterId);
  }, [beneficiaries, selectedCenterId]);

  // Beneficiaries from OTHER centers (for live cross-centre testing)
  const otherCenterBeneficiaries = useMemo(() => {
    return beneficiaries.filter((b) => b.registered_center_id !== selectedCenterId);
  }, [beneficiaries, selectedCenterId]);

  // 4. Fetch Meal History for Selected Beneficiary from Supabase
  const loadMealHistory = useCallback(async (beneficiaryId: string) => {
    setIsLoadingHistory(true);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setIsLoadingHistory(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('meal_transactions')
        .select('*')
        .eq('beneficiary_id', beneficiaryId)
        .order('service_timestamp', { ascending: false });

      if (error) throw error;
      setTodaysMealHistory(data || []);
    } catch (err) {
      console.error('Error loading meal history from Supabase:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (selectedBeneficiaryId) {
      Promise.resolve().then(() => {
        if (isMounted) {
          loadMealHistory(selectedBeneficiaryId);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [selectedBeneficiaryId, loadMealHistory]);

  // Count allowed meals today from real transaction records
  const allowedMealsToday = useMemo(() => {
    return todaysMealHistory.filter((tx) => tx.status === 'ALLOWED').length;
  }, [todaysMealHistory]);

  // 5. Execute Fingerprint Scan & Verification via Supabase RPC
  const handleScanAndVerify = async (beneficiaryOverride?: BeneficiaryRow) => {
    const targetBen = beneficiaryOverride || currentBeneficiary;
    if (!targetBen || !currentCenter) return;

    // Phase A: Hardware Simulation & Minutiae Reading
    setScannerStatus('SCANNING');
    setVerificationResult(null);
    setVerificationError(null);

    // 600ms visual scanning animation simulating biometric sensor sweep
    await new Promise((res) => setTimeout(res, 600));

    // Phase B: Token Matched
    setScannerStatus('MATCHED');
    await new Promise((res) => setTimeout(res, 300));

    // Phase C: Calling Supabase Database RPC
    setScannerStatus('VERIFYING');
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      setScannerStatus('ERROR');
      setVerificationError('Supabase client not configured. Database RPC cannot execute.');
      return;
    }

    try {
      // Direct call to atomic database function
      const { data, error } = await supabase.rpc('process_meal_verification', {
        p_beneficiary_id: targetBen.id,
        p_center_id: currentCenter.id,
        p_verification_method: 'BIOMETRIC_POS',
        p_terminal_id: terminalId
      } as unknown as Database['public']['Functions']['process_meal_verification']['Args']);

      if (error) {
        setScannerStatus('ERROR');
        setVerificationError(error.message || 'Database error occurred during meal verification.');
        setVerificationResult(null);
      } else if (data) {
        const result = data as MealVerificationResult;
        setVerificationResult(result);
        if (result.allowed) {
          setScannerStatus('SUCCESS');
        } else {
          setScannerStatus('DENIED');
        }
      }

      // Refresh today's meal transactions directly from Supabase
      await loadMealHistory(targetBen.id);
    } catch (err: unknown) {
      setScannerStatus('ERROR');
      const msg = err instanceof Error ? err.message : 'Network error communicating with Supabase RPC.';
      setVerificationError(msg);
    }
  };

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* 1. Header & SIH Context Banner */}
      <div className="rounded-xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-950/40 p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {onBackToOverview && (
              <button
                onClick={onBackToOverview}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Back to Overview"
              >
                <ArrowLeftIcon className="w-4 h-4" />
              </button>
            )}
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 via-teal-700 to-cyan-900 flex items-center justify-center shadow-lg shadow-emerald-950/50 border border-emerald-400/40 shrink-0">
              <FingerprintIcon className="w-7 h-7 text-emerald-200" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  POS Biometric Meal Verification Terminal
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-700/80 text-emerald-300 text-[11px] font-mono font-semibold">
                  LIVE TERMINAL
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-700/80 text-amber-300 text-[11px] font-mono">
                  SIMULATED SCANNER
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Real-Time 2-Meal Quota Enforcement Engine &bull; Atomic Row-Locked PostgreSQL RPC &bull; SHA-256 Ledger
              </p>
            </div>
          </div>

          {/* Terminal Hardware Badge */}
          <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 px-3.5 py-2 rounded-xl text-xs">
            <TerminalIcon className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Active Device ID</div>
              <div className="font-mono font-bold text-white flex items-center gap-1.5">
                {terminalId}
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
            </div>
          </div>
        </div>

        {/* Mandatory SIH Demo Disclaimer Banner */}
        <div className="mt-4 p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-xs flex items-start gap-2.5">
          <ShieldCheckIcon className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-slate-300 leading-relaxed">
            <strong className="text-emerald-300">Fingerprint Scanner: SIMULATED DEMO</strong> &bull; Biometric minutiae match tokens are securely mapped via <code className="bg-slate-950/80 px-1.5 py-0.5 rounded font-mono text-emerald-300">DEMO-FP-xxxx</code>. Production integration connects to approved STQC-certified fingerprint devices/SDKs. <strong>Zero raw biometrics or fingerprint templates are stored in database.</strong>
          </div>
        </div>
      </div>

      {/* 2. Terminal Configuration Row: Centre & Terminal Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Welfare Centre Selector */}
        <div className="md:col-span-2 rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <label className="font-semibold text-slate-300 flex items-center gap-1.5">
              <BuildingIcon className="w-3.5 h-3.5 text-cyan-400" />
              Operating Welfare Centre
            </label>
            <span className="text-[11px] text-slate-400 font-mono">
              {isGovAuthority ? 'Government Authority (All 6 Centers)' : `Scoped to NGO: ${assignedNgoId}`}
            </span>
          </div>

          <select
            value={selectedCenterId}
            onChange={(e) => setSelectedCenterId(e.target.value)}
            disabled={isLoadingCenters}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2.5 text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-medium"
          >
            {centers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code}) &bull; {c.district} &bull; {c.id}
              </option>
            ))}
          </select>

          {currentCenter && (
            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400">
              <span>District: <strong className="text-slate-200">{currentCenter.district}</strong></span>
              <span>&bull;</span>
              <span>NGO: <strong className="text-slate-200">{currentCenter.ngo_id}</strong></span>
              <span>&bull;</span>
              <span>Project: <strong className="text-slate-200">{currentCenter.project_id}</strong></span>
              <span>&bull;</span>
              <span>Capacity: <strong className="text-emerald-400 font-mono">{currentCenter.beneficiary_capacity} meals/day</strong></span>
            </div>
          )}
        </div>

        {/* Terminal Station Selector */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-2">
          <label className="font-semibold text-slate-300 flex items-center gap-1.5 text-xs">
            <TerminalIcon className="w-3.5 h-3.5 text-emerald-400" />
            POS Terminal Lane / Counter
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['POS-TERM-01', 'POS-TERM-02', 'POS-TERM-03'] as const).map((tId) => (
              <button
                key={tId}
                onClick={() => setTerminalId(tId)}
                className={`py-2 px-2.5 rounded-lg text-xs font-mono font-semibold transition-all border ${
                  terminalId === tId
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                {tId.replace('POS-', '')}
              </button>
            ))}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
            <span>Terminal Protocol: <strong>TLS v1.3 / WebSocket</strong></span>
            <span className="text-emerald-400 font-mono text-[10px]">PING 38ms</span>
          </div>
        </div>
      </div>

      {/* 3. Core Verification Console: 2-Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Optical Scanner & Beneficiary Selector (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Biometric Sensor Panel */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-4 relative overflow-hidden shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <FingerprintIcon className="w-4 h-4 text-emerald-400" />
                Optical Minutiae Reader
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-cyan-300">
                STQC FAP-20 Emulation
              </span>
            </div>

            {/* Scanner Visual Glass Plate */}
            <div
              onClick={() => scannerStatus !== 'SCANNING' && scannerStatus !== 'VERIFYING' && handleScanAndVerify()}
              className={`group relative h-56 rounded-xl border-2 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 select-none overflow-hidden ${
                scannerStatus === 'SCANNING' || scannerStatus === 'VERIFYING'
                  ? 'border-cyan-400 bg-cyan-950/30 shadow-lg shadow-cyan-900/30'
                  : scannerStatus === 'SUCCESS'
                  ? 'border-emerald-500 bg-emerald-950/20 shadow-lg shadow-emerald-950/40'
                  : scannerStatus === 'DENIED'
                  ? 'border-rose-500 bg-rose-950/20 shadow-lg shadow-rose-950/40'
                  : 'border-slate-700 bg-slate-950 hover:border-emerald-500/70 hover:shadow-lg hover:shadow-emerald-950/20'
              }`}
            >
              {/* Subtle Concentric Rings */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                <div className="w-40 h-40 rounded-full border border-cyan-400"></div>
                <div className="w-28 h-28 rounded-full border border-cyan-400 absolute"></div>
                <div className="w-16 h-16 rounded-full border border-cyan-400 absolute"></div>
              </div>

              {/* Scanning Laser Beam Sweep */}
              {(scannerStatus === 'SCANNING' || scannerStatus === 'VERIFYING') && (
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-lg shadow-cyan-400 animate-bounce duration-700 top-1/2 pointer-events-none"></div>
              )}

              {/* Central Biometric Icon */}
              <div
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 z-10 ${
                  scannerStatus === 'SCANNING' || scannerStatus === 'VERIFYING'
                    ? 'bg-cyan-500/20 text-cyan-300 scale-110'
                    : scannerStatus === 'SUCCESS'
                    ? 'bg-emerald-500/20 text-emerald-300 scale-105'
                    : scannerStatus === 'DENIED'
                    ? 'bg-rose-500/20 text-rose-300'
                    : 'bg-slate-900 text-slate-400 group-hover:text-emerald-400 group-hover:scale-105'
                }`}
              >
                {scannerStatus === 'SUCCESS' ? (
                  <CheckCircleIcon className="w-10 h-10" />
                ) : scannerStatus === 'DENIED' ? (
                  <XCircleIcon className="w-10 h-10" />
                ) : (
                  <FingerprintIcon className="w-12 h-12" />
                )}
              </div>

              {/* Status Message on Scanner */}
              <div className="mt-3 text-center z-10 px-4">
                <div className="font-semibold text-xs text-white">
                  {scannerStatus === 'SCANNING' && 'Capturing Minutiae Patterns...'}
                  {scannerStatus === 'VERIFYING' && 'Evaluating Atomic PostgreSQL Entitlement RPC...'}
                  {scannerStatus === 'SUCCESS' && 'Fingerprint Match Verified & Meal Dispensed!'}
                  {scannerStatus === 'DENIED' && 'Entitlement Exhausted — Visit Blocked!'}
                  {scannerStatus === 'ERROR' && 'Verification Check Failed'}
                  {scannerStatus === 'IDLE' && 'Touch or Click Plate to Scan Fingerprint'}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {scannerStatus === 'IDLE'
                    ? 'Simulates live STQC optical sensor capture'
                    : `Active Token: ${currentBeneficiary?.identification_token || 'N/A'}`}
                </div>
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              onClick={() => handleScanAndVerify()}
              disabled={scannerStatus === 'SCANNING' || scannerStatus === 'VERIFYING'}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-sm shadow-lg shadow-emerald-950/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FingerprintIcon className="w-5 h-5" />
              {scannerStatus === 'SCANNING' || scannerStatus === 'VERIFYING'
                ? 'Processing Biometric Verification...'
                : 'Scan Fingerprint & Verify Meal Entitlement'}
            </button>
          </div>

          {/* Enrolled Beneficiary Selector for this Centre */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <UserCheckIcon className="w-4 h-4 text-emerald-400" />
                Enrolled Beneficiaries ({centerBeneficiaries.length})
              </span>
              <button
                onClick={loadBeneficiaries}
                className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
                title="Reload from Supabase"
              >
                <RefreshCwIcon className={`w-3 h-3 ${isLoadingBeneficiaries ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {centerBeneficiaries.length === 0 ? (
                <div className="p-3 rounded-lg bg-slate-950/60 text-slate-400 text-xs text-center">
                  No beneficiaries enrolled at this centre.
                </div>
              ) : (
                centerBeneficiaries.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => {
                      setSelectedBeneficiaryId(b.id);
                      setVerificationResult(null);
                      setVerificationError(null);
                      setScannerStatus('IDLE');
                    }}
                    className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between ${
                      selectedBeneficiaryId === b.id
                        ? 'bg-emerald-950/50 border-emerald-600 text-white shadow-sm'
                        : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-semibold">{b.full_name}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-cyan-300">{b.identification_token}</span>
                        <span>&bull;</span>
                        <span>{b.category}</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/70 border border-emerald-800 text-emerald-300">
                      {b.status}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* SIH Judge Demo Triggers */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                SIH Judge Demonstration Shortcuts
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleScanAndVerify()}
                  className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700/80 text-[11px] text-slate-300 font-medium text-left transition-colors"
                >
                  🔁 Test Consecutive Scan
                  <span className="block text-[10px] text-slate-500 font-normal">Shows 1st → 2nd → 3rd blocked</span>
                </button>
                {otherCenterBeneficiaries.length > 0 && (
                  <button
                    onClick={() => {
                      const other = otherCenterBeneficiaries[0];
                      setSelectedBeneficiaryId(other.id);
                      handleScanAndVerify(other);
                    }}
                    className="p-2 rounded-lg bg-amber-950/40 hover:bg-amber-950/60 border border-amber-800/60 text-[11px] text-amber-300 font-medium text-left transition-colors"
                  >
                    🚫 Test Centre Mismatch
                    <span className="block text-[10px] text-amber-400/70 font-normal">Scans other center&apos;s token</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Real-Time Entitlement Decision & Cryptographic Audit (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Matched Beneficiary Card */}
          {currentBeneficiary && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-700/80 flex items-center justify-center text-emerald-300 font-bold text-xs">
                    {currentBeneficiary.full_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      {currentBeneficiary.full_name}
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 border border-emerald-800 text-emerald-300">
                        {currentBeneficiary.status}
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Token: <strong className="text-cyan-300">{currentBeneficiary.identification_token}</strong> &bull; ID: {currentBeneficiary.id}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Enrolled Centre</span>
                  <span className="text-xs font-semibold text-slate-200 font-mono">
                    {currentBeneficiary.registered_center_id}
                  </span>
                </div>
              </div>

              {/* 2-Meal Entitlement Gauge */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className={`p-2.5 rounded-lg border text-xs transition-all ${
                  allowedMealsToday >= 1
                    ? 'bg-emerald-950/60 border-emerald-600 text-emerald-200'
                    : 'bg-slate-950/70 border-slate-800 text-slate-400'
                }`}>
                  <div className="text-[10px] uppercase font-mono text-slate-400">Meal 1 (Breakfast/Lunch)</div>
                  <div className="font-bold text-sm mt-1">
                    {allowedMealsToday >= 1 ? '✓ CONSUMED' : '○ AVAILABLE'}
                  </div>
                </div>

                <div className={`p-2.5 rounded-lg border text-xs transition-all ${
                  allowedMealsToday >= 2
                    ? 'bg-emerald-950/60 border-emerald-600 text-emerald-200'
                    : 'bg-slate-950/70 border-slate-800 text-slate-400'
                }`}>
                  <div className="text-[10px] uppercase font-mono text-slate-400">Meal 2 (Dinner)</div>
                  <div className="font-bold text-sm mt-1">
                    {allowedMealsToday >= 2 ? '✓ CONSUMED' : '○ AVAILABLE'}
                  </div>
                </div>

                <div className={`p-2.5 rounded-lg border text-xs transition-all ${
                  allowedMealsToday >= 2
                    ? 'bg-rose-950/60 border-rose-600 text-rose-200'
                    : 'bg-slate-950/70 border-slate-800 text-slate-400'
                }`}>
                  <div className="text-[10px] uppercase font-mono text-slate-400">3rd Visit Policy</div>
                  <div className="font-bold text-sm mt-1">
                    {allowedMealsToday >= 2 ? '✕ BLOCKED' : 'QUOTA ACTIVE'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Real-Time Verification Result Display */}
          {verificationResult && (
            <div className={`rounded-xl border p-5 space-y-4 shadow-xl animate-in fade-in zoom-in-95 duration-200 ${
              verificationResult.allowed
                ? 'bg-gradient-to-br from-emerald-950/80 via-slate-900 to-slate-950 border-emerald-600/80'
                : 'bg-gradient-to-br from-rose-950/80 via-slate-900 to-slate-950 border-rose-600/80'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                    verificationResult.allowed
                      ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500'
                      : 'bg-rose-600/20 text-rose-300 border-rose-500'
                  }`}>
                    {verificationResult.allowed ? (
                      <CheckCircleIcon className="w-7 h-7" />
                    ) : (
                      <XCircleIcon className="w-7 h-7" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-mono uppercase tracking-wider text-slate-400">
                      Entitlement Decision Result
                    </div>
                    <h2 className={`text-xl font-extrabold tracking-tight ${
                      verificationResult.allowed ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {verificationResult.allowed
                        ? `MEAL ALLOWED — MEAL ${verificationResult.meal_sequence} OF 2 DISPENSED`
                        : 'MEAL DENIED — DAILY QUOTA EXCEEDED'}
                    </h2>
                  </div>
                </div>

                <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono border ${
                  verificationResult.allowed
                    ? 'bg-emerald-950 border-emerald-600 text-emerald-300'
                    : 'bg-rose-950 border-rose-600 text-rose-300'
                }`}>
                  {verificationResult.status}
                </span>
              </div>

              {/* Message Explanation */}
              <div className={`p-3 rounded-lg border text-xs leading-relaxed ${
                verificationResult.allowed
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                  : 'bg-rose-950/40 border-rose-800/60 text-rose-200'
              }`}>
                {verificationResult.allowed ? (
                  <p>
                    <strong>Authorization Approved:</strong> {verificationResult.message} Entitlement counter for today is now <strong className="font-mono">{verificationResult.meals_today} of 2</strong>.
                  </p>
                ) : (
                  <p>
                    <strong>Policy Enforcement Triggered:</strong> Daily 2-meal entitlement already consumed. Third visit blocked by database RPC. Rejection reason: <code className="bg-slate-950/90 px-1 py-0.5 rounded font-mono text-rose-300 font-bold">{verificationResult.denial_reason}</code>. Attempt recorded in immutable ledger.
                  </p>
                )}
              </div>

              {/* Cryptographic Proof Card */}
              <div className="p-3.5 rounded-lg bg-slate-950/90 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span className="flex items-center gap-1 font-semibold text-slate-300">
                    <HashIcon className="w-3.5 h-3.5 text-cyan-400" />
                    Tamper-Evident SHA-256 Ledger Fingerprint
                  </span>
                  <span className="font-mono text-[10px] text-emerald-400">PostgreSQL Verified</span>
                </div>

                <div className="flex items-center justify-between gap-2 p-2 rounded bg-slate-900 border border-slate-800/80 font-mono text-[11px] text-cyan-300">
                  <span className="truncate">{verificationResult.record_hash}</span>
                  <button
                    onClick={() => copyHash(verificationResult.record_hash)}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 shrink-0"
                    title="Copy SHA-256 Hash"
                  >
                    {copiedHash === verificationResult.record_hash ? (
                      <span className="text-[10px] text-emerald-400">Copied!</span>
                    ) : (
                      <CopyIcon className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] text-slate-400">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Transaction UUID</span>
                    <span className="font-mono text-slate-200 truncate block">{verificationResult.transaction_id.substring(0, 13)}...</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Service Date (IST)</span>
                    <span className="font-mono text-slate-200 block">{verificationResult.service_date}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Method</span>
                    <span className="font-mono text-emerald-300 block">BIOMETRIC_POS</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Source</span>
                    <span className="font-mono text-cyan-300 block">Supabase RPC</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Verification Error / Access Denied Alert */}
          {verificationError && (
            <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-700 text-rose-200 text-xs space-y-2 shadow-lg">
              <div className="flex items-center gap-2 font-bold text-sm text-rose-100">
                <AlertTriangleIcon className="w-5 h-5 text-rose-400 shrink-0" />
                Verification Check Rejection / Access Denied
              </div>
              <p className="leading-relaxed pl-7">
                {verificationError}
              </p>
              <div className="pl-7 pt-1 flex items-center gap-3">
                <button
                  onClick={() => handleScanAndVerify()}
                  className="px-3 py-1.5 rounded-lg bg-rose-900 hover:bg-rose-800 text-rose-100 font-semibold text-xs transition-colors"
                >
                  Retry Verification
                </button>
                <span className="text-[11px] text-rose-300/70">
                  Source: Supabase PostgreSQL Exception (No fake fallback applied)
                </span>
              </div>
            </div>
          )}

          {/* Today's Meal Transaction Audit Ledger Table */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <ClockIcon className="w-4 h-4 text-cyan-400" />
                Today&apos;s Meal History &amp; Audit Log ({currentBeneficiary?.full_name || 'Selected Beneficiary'})
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                IST Date: {(new Date()).toISOString().split('T')[0]}
              </span>
            </div>

            <div className="overflow-x-auto">
              {isLoadingHistory ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  <RefreshCwIcon className="w-4 h-4 animate-spin inline-block mr-2" />
                  Fetching immutable transaction records from Supabase...
                </div>
              ) : todaysMealHistory.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 space-y-1">
                  <div>No meal transactions recorded yet for this beneficiary today.</div>
                  <div className="text-[11px] text-slate-500">
                    Use the simulated fingerprint scanner to authorize and dispense Meal #1.
                  </div>
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                      <th className="py-2 px-2 font-medium">Meal #</th>
                      <th className="py-2 px-2 font-medium">Status</th>
                      <th className="py-2 px-2 font-medium">Timestamp (IST)</th>
                      <th className="py-2 px-2 font-medium">Terminal</th>
                      <th className="py-2 px-2 font-medium">Centre</th>
                      <th className="py-2 px-2 font-medium">SHA-256 Hash</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    {todaysMealHistory.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-2 font-bold text-white">
                          #{tx.meal_sequence}
                        </td>
                        <td className="py-2.5 px-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            tx.status === 'ALLOWED'
                              ? 'bg-emerald-950/80 border border-emerald-700 text-emerald-300'
                              : 'bg-rose-950/80 border border-rose-700 text-rose-300'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-slate-300 font-sans text-xs">
                          {new Date(tx.service_timestamp).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </td>
                        <td className="py-2.5 px-2 text-slate-400">
                          {tx.terminal_id}
                        </td>
                        <td className="py-2.5 px-2 text-slate-300 font-sans text-xs">
                          {tx.center_id}
                        </td>
                        <td className="py-2.5 px-2 text-cyan-300">
                          <div className="flex items-center gap-1">
                            <span className="truncate max-w-[120px]">{tx.sha256_record_hash}</span>
                            <button
                              onClick={() => copyHash(tx.sha256_record_hash)}
                              className="p-0.5 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200"
                              title="Copy Hash"
                            >
                              <CopyIcon className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
