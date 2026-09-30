/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Droplets,
  Fuel,
  Play,
  RotateCcw,
  Shield,
  Truck,
  Zap,
} from 'lucide-react';
import React, { useState } from 'react';
import {
  CascadeResult,
  InfrastructureAsset,
  InterventionDefinition,
  SessionState,
} from '../types/lifegrid';

interface InterventionPanelProps {
  session: SessionState | null;
  assets: InfrastructureAsset[];
  onApplyIntervention: (type: InterventionDefinition['type'], targetId: string, desc: string) => Promise<void>;
  onResetInterventions: () => void;
  isLoading: boolean;
}

export function InterventionPanel({
  session,
  assets,
  onApplyIntervention,
  onResetInterventions,
  isLoading,
}: InterventionPanelProps) {
  const [selectedType, setSelectedType] = useState<InterventionDefinition['type']>('DEPLOY_MOBILE_GENERATOR');
  const [selectedTarget, setSelectedTarget] = useState<string>('HOSP_01');
  const [customDesc, setCustomDesc] = useState<string>('');

  const currentResult = session?.result;
  const previousResult = session?.previous_result;
  const activeInterventions = session?.interventions || [];

  const handleApply = async () => {
    if (!selectedTarget) return;
    const targetAsset = assets.find((a) => a.id === selectedTarget);
    const desc =
      customDesc ||
      `${selectedType.replace(/_/g, ' ')} deployed to ${targetAsset?.name || selectedTarget}`;

    await onApplyIntervention(selectedType, selectedTarget, desc);
    setCustomDesc('');
  };

  const getInterventionCategory = (type: InterventionDefinition['type']) => {
    if (type === 'DEPLOY_MOBILE_GENERATOR' || type === 'EMERGENCY_FUEL') {
      return { label: 'LOCAL INTERVENTION', badge: 'bg-sky-950 text-sky-300 border-sky-500/40' };
    }
    return { label: 'SYSTEMIC INTERVENTION', badge: 'bg-emerald-950 text-emerald-300 border-emerald-500/40' };
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-md rounded-xl border border-slate-800 p-4 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-sky-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            COUNTERFACTUAL INTERVENTION ENGINE
          </h3>
        </div>
        {activeInterventions.length > 0 && (
          <button
            onClick={onResetInterventions}
            disabled={isLoading}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition font-mono"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Interventions
          </button>
        )}
      </div>

      <p className="text-xs text-slate-400 leading-relaxed">
        Test hypothetical resource dispatches against the existing failure cascade to evaluate before-vs-after resilience.
      </p>

      {/* Preset Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <button
          onClick={() =>
            onApplyIntervention(
              'DEPLOY_MOBILE_GENERATOR',
              'HOSP_01',
              'Deploy 500kVA Mobile Diesel Generator to Central Hospital'
            )
          }
          disabled={isLoading || !session?.scenario}
          className="flex items-start gap-2.5 p-2.5 rounded-lg border border-sky-500/30 bg-sky-950/20 hover:bg-sky-950/40 text-left transition disabled:opacity-50"
        >
          <Truck className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-200">
                Deploy Mobile Gen → Central Hospital
              </span>
              <span className="text-[9px] font-mono px-1 rounded bg-sky-900/80 text-sky-300">
                LOCAL
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Protects trauma ICU (80.2% → 0% disruption) while preserving upstream grid failure.
            </p>
          </div>
        </button>

        <button
          onClick={() =>
            onApplyIntervention(
              'BACKUP_PUMP',
              'PUMP_N01',
              'Auxiliary Generator & Emergency Fuel to North Water Pump'
            )
          }
          disabled={isLoading || !session?.scenario}
          className="flex items-start gap-2.5 p-2.5 rounded-lg border border-emerald-500/30 bg-emerald-950/20 hover:bg-emerald-950/40 text-left transition disabled:opacity-50"
        >
          <Droplets className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-200">
                Auxiliary Power → North Water Pump
              </span>
              <span className="text-[9px] font-mono px-1 rounded bg-emerald-900/80 text-emerald-300">
                SYSTEMIC
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Restores municipal water pressure and removes secondary degradation at Metro General Hospital.
            </p>
          </div>
        </button>
      </div>

      {/* Custom Intervention Configuration Builder */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 space-y-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Custom Intervention Configurator
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* Action Type */}
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Intervention Action</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as InterventionDefinition['type'])}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="DEPLOY_MOBILE_GENERATOR">Deploy Mobile Generator (Power)</option>
              <option value="BACKUP_PUMP">Deploy Auxiliary Pump (Water)</option>
              <option value="EMERGENCY_FUEL">Emergency Fuel Delivery (Fuel)</option>
              <option value="TEMPORARY_ROAD_ACCESS">Temporary Route Bypass (Road)</option>
              <option value="RESTORE_POWER">Priority Line Repair (Grid)</option>
              <option value="EVACUATE_POPULATION">Precautionary Evacuation (Civil)</option>
            </select>
          </div>

          {/* Target Asset */}
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Target Infrastructure Node</label>
            <select
              value={selectedTarget}
              onChange={(e) => setSelectedTarget(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.name} ({asset.id})
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleApply}
          disabled={isLoading || !session?.scenario}
          className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold text-xs py-2 rounded transition shadow-lg disabled:opacity-50"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          Execute Counterfactual Simulation
        </button>
      </div>

      {/* Active Interventions List */}
      {activeInterventions.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Active Responses ({activeInterventions.length})
          </span>
          <div className="space-y-1.5">
            {activeInterventions.map((inv) => {
              const target = assets.find((a) => a.id === inv.target_asset_id);
              const cat = getInterventionCategory(inv.type);

              return (
                <div
                  key={inv.id}
                  className="flex items-center justify-between bg-slate-950/70 border border-slate-800 px-3 py-2 rounded-lg text-xs"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-200">{inv.description}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Target: {target?.name || inv.target_asset_id}
                      </div>
                    </div>
                  </div>
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${cat.badge}`}>
                    {cat.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
