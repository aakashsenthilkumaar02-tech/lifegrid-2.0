/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Activity,
  AlertOctagon,
  ArrowDownRight,
  ArrowRight,
  Droplets,
  Layers,
  Radio,
  ShieldCheck,
  Users,
  Zap,
} from 'lucide-react';
import React from 'react';
import { CascadeResult, SessionState } from '../types/lifegrid';

interface ImpactMetricsProps {
  currentResult: CascadeResult | null;
  previousResult: CascadeResult | null;
  session: SessionState | null;
}

export function ImpactMetrics({ currentResult, previousResult, session }: ImpactMetricsProps) {
  if (!currentResult) {
    return (
      <div className="bg-slate-900/60 backdrop-blur-md rounded-xl border border-slate-800 p-4 text-center">
        <p className="text-xs text-slate-400 font-mono">
          [SYSTEM IDLE] Baseline infrastructure grid operational. Select a demo scenario or ask Gemini Copilot to simulate an asset failure cascade.
        </p>
      </div>
    );
  }

  const {
    population_exposed,
    critical_facilities_affected,
    cascade_depth,
    failed_assets,
    degraded_assets,
    service_impacts,
  } = currentResult;

  const prev = previousResult;
  const isInterventionApplied = (session?.interventions.length || 0) > 0;

  // Comparison deltas
  const popDelta = prev ? population_exposed - prev.population_exposed : 0;
  const critDelta = prev ? critical_facilities_affected - prev.critical_facilities_affected : 0;
  const hospDelta =
    prev && prev.service_impacts.hospital !== undefined && service_impacts.hospital !== undefined
      ? service_impacts.hospital - prev.service_impacts.hospital
      : 0;

  return (
    <div className="bg-slate-900/80 backdrop-blur-md rounded-xl border border-slate-800 p-4 shadow-xl space-y-4">
      {/* Top Banner if intervention active */}
      {isInterventionApplied && (
        <div className="flex items-center justify-between bg-sky-950/60 border border-sky-500/40 rounded-lg px-3 py-2 text-xs">
          <div className="flex items-center gap-2 text-sky-300">
            <ShieldCheck className="w-4 h-4 text-sky-400" />
            <span className="font-semibold">Counterfactual Intervention Active</span>
            <span className="text-slate-400">({session?.interventions.length} deployed)</span>
          </div>
          <span className="text-[11px] font-mono text-sky-200 bg-sky-900/80 px-2 py-0.5 rounded border border-sky-400/30">
            Local Protection Isolated
          </span>
        </div>
      )}

      {/* KPI 4-Card Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Population Exposed */}
        <div className="bg-slate-950/70 border border-slate-800/90 rounded-lg p-3 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-medium">Population Exposed</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">
            {population_exposed.toLocaleString()}
          </div>
          {popDelta !== 0 && (
            <div className="text-[11px] flex items-center gap-1 font-mono text-emerald-400 mt-1">
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>{Math.abs(popDelta).toLocaleString()} protected</span>
            </div>
          )}
          <div className="text-[10px] text-slate-500 mt-0.5">Citizens in disrupted service wards</div>
        </div>

        {/* Critical Facilities */}
        <div className="bg-slate-950/70 border border-slate-800/90 rounded-lg p-3 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-medium">Critical Facilities</span>
            <AlertOctagon className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-100">
              {critical_facilities_affected}
            </span>
            {prev && critDelta !== 0 && (
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                {prev.critical_facilities_affected} → {critical_facilities_affected}
              </span>
            )}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Emergency hospitals / Tier-1 hubs</div>
        </div>

        {/* Cascade Depth */}
        <div className="bg-slate-950/70 border border-slate-800/90 rounded-lg p-3 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-medium">Cascade Depth</span>
            <Layers className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">
            Hop {cascade_depth}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Multi-tier dependency propagation</div>
        </div>

        {/* Assets Disrupted */}
        <div className="bg-slate-950/70 border border-slate-800/90 rounded-lg p-3 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-medium">Disrupted Assets</span>
            <Activity className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold font-mono text-red-400">
              {failed_assets.length} Failed
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-sm font-semibold font-mono text-amber-400">
              {degraded_assets.length} Degraded
            </span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Total {currentResult.affected_assets.length} infrastructure nodes impacted
          </div>
        </div>
      </div>

      {/* Service Impacts Gauges */}
      <div className="bg-slate-950/50 border border-slate-800/70 rounded-lg p-3">
        <div className="flex items-center justify-between text-xs text-slate-300 font-semibold mb-2.5">
          <span>CRITICAL SERVICE DISRUPTION IMPACT</span>
          <span className="text-[11px] font-mono text-slate-400">Additive Pressure Model</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Power Service */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="flex items-center gap-1.5 text-amber-300">
                <Zap className="w-3.5 h-3.5" /> Power Grid
              </span>
              <span className="font-bold text-slate-200">
                {(service_impacts.power * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, service_impacts.power * 100)}%` }}
              />
            </div>
          </div>

          {/* Water Supply */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="flex items-center gap-1.5 text-cyan-300">
                <Droplets className="w-3.5 h-3.5" /> Water Supply
              </span>
              <span className="font-bold text-slate-200">
                {(service_impacts.water * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, service_impacts.water * 100)}%` }}
              />
            </div>
          </div>

          {/* Healthcare / Hospital */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="flex items-center gap-1.5 text-rose-300">
                <Activity className="w-3.5 h-3.5" /> Hospital Care
              </span>
              <div className="flex items-center gap-1">
                {prev && hospDelta < 0 && (
                  <span className="text-[10px] text-emerald-400 line-through">
                    {(prev.service_impacts.hospital * 100).toFixed(1)}%
                  </span>
                )}
                <span
                  className={`font-bold ${
                    service_impacts.hospital === 0 ? 'text-emerald-400' : 'text-slate-200'
                  }`}
                >
                  {(service_impacts.hospital * 100).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  service_impacts.hospital === 0 ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(100, service_impacts.hospital * 100)}%` }}
              />
            </div>
          </div>

          {/* Telecom */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="flex items-center gap-1.5 text-indigo-300">
                <Radio className="w-3.5 h-3.5" /> Telecom Relay
              </span>
              <span className="font-bold text-slate-200">
                {(service_impacts.telecom * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, service_impacts.telecom * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
