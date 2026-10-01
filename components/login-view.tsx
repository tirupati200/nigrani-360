'use client';

import React, { useState } from 'react';
import { DEMO_USERS, UserSession, UserRole } from '@/lib/demo-data';
import { isSupabaseConfigured, getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types';

type UserProfileRow = Database['public']['Tables']['user_profiles']['Row'];

export type TargetPortal = 'GOVERNMENT_AUTHORITY' | 'FIELD_OFFICER' | 'NGO_HEAD';

interface PortalConfig {
  title: string;
  badge: string;
  description: string;
  expectedRole: UserRole;
  buttonText: string;
  colorClasses: {
    activeBorder: string;
    activeBg: string;
    activeText: string;
    badgeStyle: string;
    buttonGradient: string;
    infoText: string;
  };
}

const PORTAL_CONFIGS: Record<TargetPortal, PortalConfig> = {
  GOVERNMENT_AUTHORITY: {
    title: 'Central Command Center',
    badge: 'GOV AUTHORITY',
    description: 'Ministry & Central Directorate Command Center with real-time risk surveillance, CCTV telemetry, and compliance monitoring.',
    expectedRole: 'GOVERNMENT_AUTHORITY',
    buttonText: 'Sign In to Command Center',
    colorClasses: {
      activeBorder: 'border-cyan-500 shadow-cyan-950/50 ring-cyan-500/50',
      activeBg: 'bg-cyan-950/40 text-cyan-200',
      activeText: 'text-cyan-300',
      badgeStyle: 'bg-cyan-950 text-cyan-300 border-cyan-800',
      buttonGradient: 'from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 border-cyan-400/30 shadow-cyan-950/60',
      infoText: 'Access to the Central Command Center requires a verified GOVERNMENT_AUTHORITY role in public.user_profiles.',
    },
  },
  FIELD_OFFICER: {
    title: 'Field Inspection Terminal',
    badge: 'FIELD OFFICER',
    description: 'Government Field Officer terminal for assigned welfare center inspections, physical verification, and on-site audit.',
    expectedRole: 'FIELD_OFFICER',
    buttonText: 'Sign In to Inspection Terminal',
    colorClasses: {
      activeBorder: 'border-indigo-500 shadow-indigo-950/50 ring-indigo-500/50',
      activeBg: 'bg-indigo-950/40 text-indigo-200',
      activeText: 'text-indigo-300',
      badgeStyle: 'bg-indigo-950 text-indigo-300 border-indigo-800',
      buttonGradient: 'from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 border-indigo-400/30 shadow-indigo-950/60',
      infoText: 'Access to the Field Inspection Terminal requires a verified FIELD_OFFICER role in public.user_profiles.',
    },
  },
  NGO_HEAD: {
    title: 'NGO Partner Portal',
    badge: 'NGO HEAD',
    description: 'Empanelled Welfare Agency administrative portal for center operations, staff management, and POS fingerprint terminals.',
    expectedRole: 'NGO_HEAD',
    buttonText: 'Sign In to NGO Partner Portal',
    colorClasses: {
      activeBorder: 'border-teal-500 shadow-teal-950/50 ring-teal-500/50',
      activeBg: 'bg-teal-950/40 text-teal-200',
      activeText: 'text-teal-300',
      badgeStyle: 'bg-teal-950 text-teal-300 border-teal-800',
      buttonGradient: 'from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 border-teal-400/30 shadow-teal-950/60',
      infoText: 'Access to the NGO Partner Portal requires a verified NGO_HEAD role in public.user_profiles.',
    },
  },
};

function ShieldIcon({ className = 'w-6 h-6' }: { className?: string }) {
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

function BuildingIcon({ className = 'w-5 h-5' }: { className?: string }) {
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

function ArrowRightIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
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

interface LoginViewProps {
  onLogin: (session: UserSession) => void;
}

export function LoginView({ onLogin }: LoginViewProps) {
  const supabaseConfigured = isSupabaseConfigured();
  const [loginMode, setLoginMode] = useState<'supabase' | 'demo'>(supabaseConfigured ? 'supabase' : 'demo');
  const [targetPortal, setTargetPortal] = useState<TargetPortal>('GOVERNMENT_AUTHORITY');
  const [selectedUser, setSelectedUser] = useState<UserSession>(DEMO_USERS[0]);
  const [emailInput, setEmailInput] = useState(supabaseConfigured ? '' : DEMO_USERS[0].email);
  const [passwordInput, setPasswordInput] = useState(supabaseConfigured ? '' : 'demo-portal-pass');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSelectPersona = (user: UserSession) => {
    setSelectedUser(user);
    setEmailInput(user.email);
    setPasswordInput('demo-portal-pass');
    setErrorMessage(null);
  };

  const handleSwitchToSupabase = () => {
    setLoginMode('supabase');
    setErrorMessage(null);
    setEmailInput('');
    setPasswordInput('');
  };

  const handleSwitchToDemo = () => {
    setLoginMode('demo');
    setErrorMessage(null);
    setEmailInput(selectedUser.email);
    setPasswordInput('demo-portal-pass');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Fallback: Demo Persona Login
    if (loginMode === 'demo') {
      onLogin(selectedUser);
      return;
    }

    // Real Supabase Sign-in with Role Verification
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setErrorMessage('Supabase is not configured. Please check .env.local or switch to Demo Persona mode.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: emailInput.trim(),
        password: passwordInput,
      });

      if (authError || !authData.user) {
        setErrorMessage(authError?.message || 'Authentication failed. Please verify your official email and password.');
        setIsLoading(false);
        return;
      }

      // 2. Fetch and verify role in public.user_profiles
      const { data, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      const profile = data as UserProfileRow | null;

      if (profileError || !profile) {
        await supabase.auth.signOut();
        setErrorMessage('Authorized profile not found in public.user_profiles. Please ensure your official account has been provisioned.');
        setIsLoading(false);
        return;
      }

      // 3. Enforce strict role verification based on chosen official portal
      const currentConfig = PORTAL_CONFIGS[targetPortal];
      if (profile.role !== currentConfig.expectedRole) {
        await supabase.auth.signOut();
        setErrorMessage(
          `Access Denied: Account role '${profile.role}' is not authorized to access the ${currentConfig.title}. ` +
          `Expected role: '${currentConfig.expectedRole}'. Please select the appropriate official portal for your credentials.`
        );
        setIsLoading(false);
        return;
      }

      // 4. Construct verified UserSession
      const verifiedSession: UserSession = {
        userId: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        designation: profile.designation,
        departmentOrNgo: profile.department_or_ngo,
        assignedNgoId: profile.assigned_ngo_id || undefined,
        accountType: profile.account_type,
      };

      onLogin(verifiedSession);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred during sign-in.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top National Header Strip */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
            <span className="font-semibold text-slate-300">GOVERNMENT OF INDIA</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Ministry of Social Justice &amp; Empowerment</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              {supabaseConfigured ? 'Supabase Live Auth' : 'Prototype Environment'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Login Card Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-2xl bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden backdrop-blur-xl">
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header & Emblem */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-800 border border-cyan-400/40 shadow-lg shadow-cyan-950/50 mb-1">
              <ShieldIcon className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
              NIGRANI 360
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                SIH26095
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-medium max-w-md mx-auto">
              Smart Real-Time Monitoring, Inspection &amp; Financial Accountability System
            </p>
          </div>

          {/* Official Government Portal Banner */}
          <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-800/60 text-xs text-slate-300 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-amber-300">
              <ShieldIcon className="w-4 h-4 text-amber-400 shrink-0" />
              Official Government Portal — Authorized Personnel Only.
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Public registration is disabled. Government Authority, Field Officer, and NGO Head credentials are provisioned exclusively through official administrative channels.
            </p>
            <div className="text-[10px] text-slate-400 border-t border-blue-900/60 pt-1.5 font-mono flex items-center justify-between">
              <span>Security Engine: Supabase Auth + Row Level Security (RLS)</span>
              <span className={supabaseConfigured ? 'text-emerald-400' : 'text-amber-400'}>
                {supabaseConfigured ? '● Cloud Connected' : '○ Prototype Mode'}
              </span>
            </div>
          </div>

          {/* Mode Selector Tabs */}
          <div className="flex rounded-xl p-1 bg-slate-950 border border-slate-800 text-xs font-medium">
            <button
              type="button"
              onClick={handleSwitchToSupabase}
              className={`flex-1 py-2 px-3 rounded-lg text-center transition-all flex items-center justify-center gap-1.5 ${
                loginMode === 'supabase'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold shadow-md shadow-cyan-950/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldIcon className="w-3.5 h-3.5" />
              Official Supabase Sign-In
              {supabaseConfigured && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-1" />
              )}
            </button>
            <button
              type="button"
              onClick={handleSwitchToDemo}
              className={`flex-1 py-2 px-3 rounded-lg text-center transition-all flex items-center justify-center gap-1.5 ${
                loginMode === 'demo'
                  ? 'bg-slate-800 text-cyan-300 border border-slate-700 font-semibold shadow-md shadow-slate-950/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserCheckIcon className="w-3.5 h-3.5" />
              Demo Personas (Fallback)
            </button>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-xs text-rose-200 flex items-start gap-2.5">
              <AlertTriangleIcon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="font-semibold text-rose-300">Sign-In Failed</div>
                <div className="text-[11px] leading-relaxed text-rose-200/90">{errorMessage}</div>
              </div>
            </div>
          )}

          {/* Mode-specific Helper Information or Persona Selectors */}
          {loginMode === 'supabase' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-300">
                  Select Target Official Portal:
                </label>
                <span className="text-[10px] text-slate-500 font-mono">Role-Enforced Access</span>
              </div>

              {/* 3-Way Portal Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {(Object.keys(PORTAL_CONFIGS) as TargetPortal[]).map((portalKey) => {
                  const cfg = PORTAL_CONFIGS[portalKey];
                  const isSelected = targetPortal === portalKey;
                  return (
                    <button
                      key={portalKey}
                      type="button"
                      onClick={() => {
                        setTargetPortal(portalKey);
                        setErrorMessage(null);
                      }}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? `${cfg.colorClasses.activeBorder} ${cfg.colorClasses.activeBg} ring-1`
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-semibold border ${cfg.colorClasses.badgeStyle}`}>
                          {cfg.badge}
                        </span>
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                      </div>
                      <div className="font-semibold text-xs text-white truncate">{cfg.title}</div>
                      <div className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-tight">
                        {cfg.description}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
                <ShieldIcon className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                <span>{PORTAL_CONFIGS[targetPortal].colorClasses.infoText}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-300">
                  Select Authorized Demo Persona:
                </label>
                <span className="text-[10px] text-slate-500 font-mono">Prototype Simulation</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {DEMO_USERS.map((u) => {
                  const isSelected = selectedUser.userId === u.userId;
                  const isGov = u.role === 'GOVERNMENT_AUTHORITY';
                  const isField = u.role === 'FIELD_OFFICER';
                  const personaLabel = u.accountType || (isGov ? 'Pre-provisioned Government Authority' : isField ? 'Government-provisioned Field Officer' : 'Government-provisioned NGO Head');

                  const badgeClass = isGov
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
                    : isField
                    ? 'bg-indigo-950 text-indigo-300 border-indigo-800'
                    : 'bg-teal-950 text-teal-300 border-teal-800';

                  const badgeText = isGov ? 'GOVT AUTH' : isField ? 'FIELD OFFICER' : 'NGO HEAD';

                  return (
                    <button
                      key={u.userId}
                      type="button"
                      onClick={() => handleSelectPersona(u)}
                      className={`p-3 rounded-xl border text-left transition-all relative ${
                        isSelected
                          ? 'bg-slate-800/90 border-indigo-500 shadow-md shadow-indigo-950/50 ring-1 ring-indigo-500/50'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="p-1 rounded bg-slate-800 text-slate-300">
                          {isGov ? (
                            <ShieldIcon className="w-3.5 h-3.5 text-cyan-400" />
                          ) : isField ? (
                            <UserCheckIcon className="w-3.5 h-3.5 text-indigo-400" />
                          ) : (
                            <BuildingIcon className="w-3.5 h-3.5 text-teal-400" />
                          )}
                        </div>
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-semibold border ${badgeClass}`}>
                          {badgeText}
                        </span>
                      </div>
                      <div className="font-semibold text-slate-100 text-xs truncate">{u.name}</div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">{u.designation}</div>
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">{u.departmentOrNgo}</div>
                      <div className="text-[9px] text-indigo-300/80 font-mono mt-1 pt-1 border-t border-slate-800/60 truncate">
                        {personaLabel}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Credential Form */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Official Email Address
              </label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder={
                  loginMode === 'supabase'
                    ? targetPortal === 'GOVERNMENT_AUTHORITY'
                      ? 'authority@msje.gov.in'
                      : targetPortal === 'FIELD_OFFICER'
                      ? 'officer.delhi@msje.gov.in'
                      : 'head@sahyog-trust.org'
                    : ''
                }
                required
                disabled={isLoading}
                className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono disabled:opacity-50"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-slate-300">
                  Password / Passcode
                </label>
                <span className="text-[10px] text-slate-500 font-mono">
                  {loginMode === 'supabase' ? 'Supabase Auth' : 'Demo Mock Credentials'}
                </span>
              </div>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder={loginMode === 'supabase' ? '••••••••••••' : ''}
                required
                disabled={isLoading}
                className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-2.5 px-4 rounded-xl text-white font-semibold text-xs tracking-wide shadow-lg transition-all flex items-center justify-center gap-2 bg-gradient-to-r ${
                loginMode === 'supabase'
                  ? PORTAL_CONFIGS[targetPortal].colorClasses.buttonGradient
                  : 'from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 border border-indigo-400/30 shadow-indigo-950/60'
              } disabled:from-slate-700 disabled:to-slate-800 disabled:border-slate-700`}
            >
              {isLoading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying Official Credentials...
                </>
              ) : loginMode === 'supabase' ? (
                <>
                  {PORTAL_CONFIGS[targetPortal].buttonText}
                  <ArrowRightIcon className="w-4 h-4" />
                </>
              ) : (
                <>
                  Sign In as {selectedUser.name} ({selectedUser.role === 'GOVERNMENT_AUTHORITY' ? 'Govt Authority' : selectedUser.role === 'FIELD_OFFICER' ? 'Field Officer' : 'NGO Head'})
                  <ArrowRightIcon className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Security Disclaimer */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span>
              {loginMode === 'supabase' ? 'Production Supabase Auth Session' : 'Prototype Evaluation Build'}
            </span>
            <span className="font-mono">SIH-2024 / SIH26095</span>
          </div>
        </div>
      </main>

      {/* National Footer */}
      <footer className="border-t border-slate-800/80 py-3 text-center text-xs text-slate-500 bg-slate-950">
        Department of Social Justice &amp; Empowerment &bull; Government of India &bull; Welfare Project Monitoring Portal
      </footer>
    </div>
  );
}

