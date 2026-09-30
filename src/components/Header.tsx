/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Activity,
  AlertTriangle,
  BookOpen,
  Cloud,
  Database,
  Flame,
  Globe,
  Info,
  Layers,
  LogIn,
  LogOut,
  Play,
  RotateCcw,
  Save,
  Shield,
  Sparkles,
  User,
  Zap,
} from 'lucide-react';
import React from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { SessionState } from '../types/lifegrid';

interface HeaderProps {
  session: SessionState | null;
  currentUser: FirebaseUser | null;
  savedScenariosCount: number;
  onSignIn: () => void;
  onSignOut: () => void;
  onOpenSavedScenarios: () => void;
  onSaveCurrentScenario: () => void;
  onRunPresetScenario: (scenarioType: 'SUBSTATION_N01' | 'INTERVENTION_GEN' | 'INTERVENTION_PUMP' | 'RESET') => void;
  onOpenAssumptions: () => void;
  quotaExceeded: boolean;
  isSavingScenario: boolean;
}

export function Header({
  session,
  currentUser,
  savedScenariosCount,
  onSignIn,
  onSignOut,
  onOpenSavedScenarios,
  onSaveCurrentScenario,
  onRunPresetScenario,
  onOpenAssumptions,
  quotaExceeded,
  isSavingScenario,
}: HeaderProps) {
  const isCascadeActive = session?.scenario !== null;
  const isInterventionApplied = (session?.interventions.length || 0) > 0;

  return (
    <header className="bg-slate-950 border-b border-slate-800 text-slate-100 sticky top-0 z-40 select-none">
      {/* Tier 2 Quota Exceeded Banner (Required by Google Maps Skill Section 8) */}
      {quotaExceeded && (
        <div className="bg-amber-500/20 border-b border-amber-500/40 text-amber-200 px-4 py-2 text-xs text-center sticky top-0 z-50 flex items-center justify-center gap-1.5 backdrop-blur-md">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-300 hover:text-amber-100"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account. (Topological Vector Fallback Active).
          </span>
        </div>
      )}

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Tagline */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-slate-950 shadow-lg shadow-cyan-500/20">
            <Zap className="w-5 h-5 fill-current" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight font-sans text-slate-100">
                LIFEGRID <span className="text-cyan-400 font-mono font-bold">AI</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                India Infrastructure Resilience
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              &quot;See the cascade. Test the response. Protect the community.&quot;
            </p>
          </div>
        </div>

        {/* Live Scenario Status Badge */}
        <div className="flex items-center gap-2">
          {isInterventionApplied ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-sky-950 text-sky-300 border border-sky-500/40 shadow-sm animate-pulse-subtle">
              <Shield className="w-3.5 h-3.5 text-sky-400" />
              <span>INTERVENTION ACTIVE (v{session?.version})</span>
            </div>
          ) : isCascadeActive ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-red-950 text-red-300 border border-red-500/40 shadow-sm">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              <span>CASCADE SIMULATION ACTIVE: {session?.scenario?.failure_asset_id}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-950 text-emerald-300 border border-emerald-500/40 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>BASELINE OPERATIONAL</span>
            </div>
          )}
        </div>

        {/* Action Controls & Preset Triggers */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Demo Scenario Buttons */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
            <button
              onClick={() => onRunPresetScenario('SUBSTATION_N01')}
              className="px-2.5 py-1 rounded font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center gap-1"
              title="Simulate 8h failure at North Substation"
            >
              <Play className="w-3 h-3 text-red-400 fill-current" />
              <span className="hidden md:inline">Demo:</span> Substation Failure
            </button>

            <button
              onClick={() => onRunPresetScenario('INTERVENTION_GEN')}
              disabled={!isCascadeActive}
              className="px-2.5 py-1 rounded font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center gap-1 disabled:opacity-40"
              title="Deploy Mobile Generator to Central Hospital"
            >
              <Shield className="w-3 h-3 text-sky-400" />
              <span className="hidden md:inline">Test:</span> Generator @ Hosp
            </button>

            <button
              onClick={() => onRunPresetScenario('RESET')}
              className="px-2 py-1 rounded font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              title="Reset to baseline"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          {/* Save to Firestore Button */}
          {isCascadeActive && (
            <button
              onClick={onSaveCurrentScenario}
              disabled={isSavingScenario}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 rounded-lg text-xs font-semibold transition disabled:opacity-50"
              title="Save scenario and metrics to Firestore"
            >
              <Save className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {isSavingScenario ? 'Saving...' : 'Save to Cloud'}
              </span>
            </button>
          )}

          {/* Cloud Scenarios Vault Button */}
          <button
            onClick={onOpenSavedScenarios}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-lg text-xs font-medium transition"
            title="Open saved scenarios from Firestore"
          >
            <Cloud className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Scenarios</span>
            {savedScenariosCount > 0 && (
              <span className="text-[10px] font-mono px-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                {savedScenariosCount}
              </span>
            )}
          </button>

          {/* Assumptions & Sources Button */}
          <button
            onClick={onOpenAssumptions}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-lg text-xs font-medium transition"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Assumptions</span>
          </button>

          {/* Firebase Google Auth Button */}
          {currentUser ? (
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || 'Operator'}
                  className="w-5 h-5 rounded-full border border-slate-700"
                />
              ) : (
                <User className="w-3.5 h-3.5 text-cyan-400" />
              )}
              <div className="text-left hidden lg:block">
                <div className="text-[11px] font-semibold text-slate-200 leading-tight">
                  {currentUser.displayName || currentUser.email?.split('@')[0]}
                </div>
                <div className="text-[9px] font-mono text-cyan-400 leading-tight">Commander</div>
              </div>
              <button
                onClick={onSignOut}
                className="text-slate-400 hover:text-rose-400 transition ml-1"
                title="Sign out of Firebase"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onSignIn}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-950 rounded-lg text-xs font-semibold transition shadow-md"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Sign in</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
