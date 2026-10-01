'use client';

import React, { useMemo, useState } from 'react';
import {
  UserSession,
  DEMO_NGOS,
  DEMO_GOV_PROJECTS,
  DEMO_WELFARE_CENTERS,
  DEMO_WELFARE_PROJECTS,
  calculateFinancials
} from '@/lib/demo-data';
import { POSTerminal } from '@/components/pos-terminal';

// --- Inline SVG Icons (No external dependencies) ---
function FingerprintIcon({ className = 'w-5 h-5' }: { className?: string }) {
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

function ShieldCheckIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
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

function NavigationIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 11 22 2 13 21 11 13 3 11" />
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

interface NGOHeadPortalProps {
  session: UserSession;
  onSignOut: () => void;
}

export function NGOHeadPortal({ session, onSignOut }: NGOHeadPortalProps) {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'POS_TERMINAL'>('OVERVIEW');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Frontend filtering by assignedNgoId is used for this prototype.
  // Production authorization must be enforced via Supabase Auth + Row Level Security (RLS).
  const assignedNgoId = session.assignedNgoId || 'ngo-01';

  const currentNgo = useMemo(() => {
    return DEMO_NGOS.find((n) => n.id === assignedNgoId) || DEMO_NGOS[0];
  }, [assignedNgoId]);

  const ngoProjects = useMemo(() => {
    return DEMO_GOV_PROJECTS.filter((p) => p.ngoId === assignedNgoId);
  }, [assignedNgoId]);

  const ngoCenters = useMemo(() => {
    return DEMO_WELFARE_CENTERS.filter((c) => c.ngoId === assignedNgoId);
  }, [assignedNgoId]);

  const centerTelemetryList = useMemo(() => {
    return DEMO_WELFARE_PROJECTS.filter((p) => p.ngoId === assignedNgoId);
  }, [assignedNgoId]);

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-500/30 selection:text-blue-200">
      {/* 1. Header with Identity & Sign Out */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top National Branding Strip */}
          <div className="py-2 border-b border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
              <span className="font-medium tracking-wide text-slate-300">GOVERNMENT OF INDIA</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">Ministry of Social Justice &amp; Empowerment</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-950/60 border border-blue-800/60 text-blue-400 font-mono text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                NGO Self-Reporting Portal
              </span>
              <button
                onClick={onSignOut}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-rose-950 hover:text-rose-300 hover:border-rose-800 text-slate-300 border border-slate-700 text-xs transition-colors"
              >
                <LogOutIcon className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          </div>

          {/* Main NGO Persona Bar */}
          <div className="py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-blue-700 to-indigo-900 flex items-center justify-center shadow-lg shadow-blue-950/50 border border-blue-400/30">
                <BuildingIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                    {currentNgo.name}
                  </h1>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                    {currentNgo.darpanRegNo}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium">
                  Logged in as: <strong className="text-slate-200">{session.name}</strong> ({session.designation}) &bull; Tenant ID: {currentNgo.id}
                </p>
              </div>
            </div>

            {/* NGO Status Badges & Navigation Tabs */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setActiveTab('OVERVIEW')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'OVERVIEW'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <BuildingIcon className="w-3.5 h-3.5" />
                  Operations Overview
                </button>
                <button
                  onClick={() => setActiveTab('POS_TERMINAL')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'POS_TERMINAL'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FingerprintIcon className="w-3.5 h-3.5 text-emerald-300" />
                  POS Biometric Terminal
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700 text-[11px] text-slate-300">
                  Compliance:{' '}
                  <strong className="text-emerald-400 font-mono">{currentNgo.complianceScore}/100</strong>
                </div>
                <div className="px-2.5 py-1 rounded-md bg-emerald-950/60 border border-emerald-800/60 text-[11px] text-emerald-300 font-semibold">
                  Status: {currentNgo.status}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {activeTab === 'POS_TERMINAL' && (
          <POSTerminal
            session={session}
            onBackToOverview={() => setActiveTab('OVERVIEW')}
          />
        )}

        {activeTab === 'OVERVIEW' && (
          <>
            {/* Prototype Role Isolation Notice */}
        <div className="rounded-lg bg-slate-900/90 border border-blue-800/40 p-3.5 flex items-start gap-3 text-xs">
          <div className="p-1.5 rounded bg-blue-500/20 text-blue-400 mt-0.5 shrink-0">
            <ShieldCheckIcon className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-blue-300">Role-Based Access Control Active:</span>
            <p className="text-slate-400 mt-0.5 leading-relaxed">
              You have access <strong>strictly to records registered under {currentNgo.name}</strong>. Other NGOs&apos; budgets, private metrics, and inspection records are segregated. In production, this tenant isolation is backed by database-level Row Level Security (RLS).
            </p>
          </div>
        </div>

        {/* 2. NGO Profile & Accreditation Card */}
        <section className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <BuildingIcon className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-semibold text-white">NGO Accreditation &amp; Statutory Details</h2>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">Registered Since: {currentNgo.registeredSince}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
              <span className="text-slate-400 text-[11px]">NGO Darpan Registration</span>
              <div className="font-mono font-semibold text-slate-200 mt-1 text-xs">{currentNgo.darpanRegNo}</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
              <span className="text-slate-400 text-[11px]">Income Tax PAN</span>
              <div className="font-mono font-semibold text-slate-200 mt-1 text-xs">{currentNgo.panNumber}</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
              <span className="text-slate-400 text-[11px]">Designated Nodal Person</span>
              <div className="font-semibold text-slate-200 mt-1">{currentNgo.nodalPerson.name}</div>
              <div className="text-[10px] text-slate-400 font-mono">{currentNgo.nodalPerson.phone} &bull; {currentNgo.nodalPerson.email}</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
              <span className="text-slate-400 text-[11px]">Registered Office</span>
              <div className="text-slate-300 mt-1 text-[11px] leading-snug">{currentNgo.registeredOffice}</div>
            </div>
          </div>
        </section>

        {/* 3. Government Welfare Projects & Financial Accountability */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">
                Government Welfare Projects &amp; Financial Utilization
              </h2>
              <p className="text-xs text-slate-400">
                Grant sanction orders and budget drawdown breakdown for Fiscal Year 2025-26
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {ngoProjects.length} Sanctioned Project{ngoProjects.length > 1 ? 's' : ''}
            </span>
          </div>

          {ngoProjects.map((proj) => {
            const { remainingReleasedBudget, utilizationPercentage } = calculateFinancials(
              proj.releasedBudget,
              proj.spentBudget
            );

            return (
              <div
                key={proj.id}
                className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 space-y-4 shadow-sm"
              >
                {/* Project Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                        {proj.projectCode}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        Sanction Order: {proj.sanctionOrderNo}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-100 mt-1">{proj.schemeName}</h3>
                    <p className="text-xs text-slate-400">
                      Service Type: {proj.serviceType} &bull; Target Beneficiaries: {proj.targetDailyBeneficiaries} daily &bull; FY: {proj.financialYear}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                      Status: {proj.status}
                    </span>
                    <span className="px-2.5 py-1 rounded text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700">
                      Audit: {proj.financialAuditStatus}
                    </span>
                  </div>
                </div>

                {/* Financial Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {/* Sanctioned */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[11px] text-slate-400">Total Sanctioned Budget</span>
                    <div className="text-xl font-bold text-white mt-1 font-mono">
                      {formatCurrency(proj.sanctionedBudget)}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Approved under Ministry Order</div>
                  </div>

                  {/* Released */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[11px] text-slate-400">Government Released Budget</span>
                    <div className="text-xl font-bold text-cyan-300 mt-1 font-mono">
                      {formatCurrency(proj.releasedBudget)}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Disbursed to NGO treasury</div>
                  </div>

                  {/* Spent */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[11px] text-slate-400">Reported Spent Budget</span>
                    <div className="text-xl font-bold text-amber-300 mt-1 font-mono">
                      {formatCurrency(proj.spentBudget)}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Backed by expenditure vouchers</div>
                  </div>

                  {/* Remaining Released */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[11px] text-slate-400">Remaining Released Balance</span>
                    <div className="text-xl font-bold text-emerald-300 mt-1 font-mono">
                      {formatCurrency(remainingReleasedBudget)}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Available for current cycle</div>
                  </div>
                </div>

                {/* Utilization Percentage Progress */}
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300">
                      Budget Utilization of Released Funds:
                    </span>
                    <span className="font-bold font-mono text-cyan-300">
                      {utilizationPercentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, utilizationPercentage)}%` }}
                    />
                  </div>
                  {/* Required Exact Text */}
                  <p className="text-[11px] text-slate-400 mt-1 italic">
                    Financial Review Signal: Spending and service-delivery figures available for reconciliation.
                  </p>
                </div>
              </div>
            );
          })}
        </section>

        {/* 4. Welfare Centers & Live Service Delivery */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">
                Operational Welfare Centers &amp; Daily Meal Verification
              </h2>
              <p className="text-xs text-slate-400">
                Live POS terminal transactions, 2-meal policy enforcement, and GPS geofence compliance
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {ngoCenters.length} Center{ngoCenters.length > 1 ? 's' : ''} under {currentNgo.name}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {ngoCenters.map((center) => {
              const telemetry = centerTelemetryList.find((t) => t.code === center.code);

              return (
                <div
                  key={center.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-4 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {center.code}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                          {center.status}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white mt-1">{center.name}</h3>
                      <p className="text-xs text-slate-400">
                        {center.address} &bull; <strong className="text-slate-300">{center.district}, {center.state}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${center.cctvStreamStatus === 'Active' ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                        CCTV: {center.cctvStreamStatus} ({center.cctvCameraCount} cams)
                      </span>
                    </div>
                  </div>

                  {/* Telemetry Metrics */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-slate-400 text-[11px]">Beneficiary Capacity</span>
                      <div className="text-lg font-bold text-white mt-1 font-mono">
                        {telemetry ? telemetry.todayVerifiedCount : 0} / {center.beneficiaryCapacity}
                      </div>
                      <div className="text-[10px] text-slate-500">Today Verified Beneficiaries</div>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-slate-400 text-[11px]">Meal Transactions Today</span>
                      <div className="text-lg font-bold text-cyan-300 mt-1 font-mono">
                        {telemetry ? telemetry.todayMealTransactions : 0}
                      </div>
                      <div className="text-[10px] text-slate-500">Total portions dispensed</div>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-950 border border-rose-900/40">
                      <span className="text-slate-400 text-[11px]">3rd-Meal Blocked Attempts</span>
                      <div className="text-lg font-bold text-rose-400 mt-1 font-mono">
                        {telemetry ? telemetry.todayMealViolationsBlocked : 0}
                      </div>
                      <div className="text-[10px] text-rose-400/80">Enforced by POS rule</div>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-slate-400 text-[11px] flex items-center gap-1">
                        <NavigationIcon className="w-3 h-3 text-cyan-400" />
                        Geofence Lock
                      </span>
                      <div className="text-sm font-semibold text-slate-200 mt-1 font-mono">
                        Radius: {center.geofenceRadiusMeters}m
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono truncate">
                        {center.coordinates.lat}&deg; N, {center.coordinates.lng}&deg; E
                      </div>
                    </div>
                  </div>

                  {/* 2-Meal Rule Reminder */}
                  <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
                    <div className="flex items-center gap-2">
                      <UtensilsIcon className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>
                        <strong>2-Meal Policy Notice:</strong> Beneficiaries are entitled to a maximum of 2 meals daily. Third visits are automatically rejected at your distribution counter. Counter resets at midnight (00:00 IST).
                      </span>
                    </div>
                  </div>

                  {/* Evidence Hash */}
                  {telemetry && (
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 flex flex-wrap items-center justify-between text-xs gap-2">
                      <div className="flex items-center gap-2">
                        <HashIcon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="text-slate-400 text-[11px]">SHA-256 Inspection Digest:</span>
                        <span className="font-mono text-[10px] text-slate-300 truncate max-w-xs sm:max-w-md">
                          {telemetry.sha256EvidenceHash}
                        </span>
                      </div>
                      <button
                        onClick={() => copyHash(telemetry.sha256EvidenceHash)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono border border-slate-700 transition-colors"
                      >
                        {copiedHash === telemetry.sha256EvidenceHash ? 'Copied!' : 'Copy Hash'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-4 text-center text-xs text-slate-500 bg-slate-950">
        NIGRANI 360 &bull; Ministry of Social Justice &amp; Empowerment &bull; NGO Self-Reporting Module
      </footer>
    </div>
  );
}
