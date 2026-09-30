/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Play,
  Shield,
  Truck,
  X,
  Zap,
} from 'lucide-react';
import React from 'react';
import { DependencyLink, InfrastructureAsset } from '../types/lifegrid';

interface AssetDetailModalProps {
  asset: InfrastructureAsset | null;
  dependencies: DependencyLink[];
  allAssets: InfrastructureAsset[];
  onClose: () => void;
  onSimulateFailure: (assetId: string) => void;
  onDeployIntervention: (assetId: string) => void;
}

export function AssetDetailModal({
  asset,
  dependencies,
  allAssets,
  onClose,
  onSimulateFailure,
  onDeployIntervention,
}: AssetDetailModalProps) {
  if (!asset) return null;

  const assetMap = new Map(allAssets.map((a) => [a.id, a]));

  // Find incoming (upstream) dependencies
  const incoming = dependencies.filter((d) => d.target === asset.id);
  // Find outgoing (downstream) dependents
  const outgoing = dependencies.filter((d) => d.source === asset.id);

  const isFailed = asset.disruption >= 0.8;
  const isDegraded = asset.disruption > 0.05 && asset.disruption < 0.8;
  const isIntervention = asset.status === 'intervention';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-5 shadow-2xl space-y-4 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title & Status */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded border ${
                isIntervention
                  ? 'bg-sky-950 text-sky-300 border-sky-500/40'
                  : isFailed
                  ? 'bg-red-950 text-red-300 border-red-500/40'
                  : isDegraded
                  ? 'bg-amber-950 text-amber-300 border-amber-500/40'
                  : 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
              }`}
            >
              {isIntervention
                ? 'PROTECTED VIA INTERVENTION'
                : isFailed
                ? 'FAILED (DISRUPTED)'
                : isDegraded
                ? 'DEGRADED READINESS'
                : 'OPERATIONAL'}
            </span>
            <span className="text-xs font-mono text-slate-400 uppercase">
              Type: {asset.type}
            </span>
          </div>

          <h2 className="text-lg font-bold text-slate-100">{asset.name}</h2>
          <div className="text-xs font-mono text-slate-400">ID: {asset.id}</div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
          <div className="bg-slate-950/80 p-2.5 rounded border border-slate-800">
            <span className="text-[10px] text-slate-500 block">DISRUPTION</span>
            <span
              className={`text-base font-bold ${
                isFailed ? 'text-red-400' : isDegraded ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {(asset.disruption * 100).toFixed(1)}%
            </span>
          </div>

          <div className="bg-slate-950/80 p-2.5 rounded border border-slate-800">
            <span className="text-[10px] text-slate-500 block">POP. SERVED</span>
            <span className="text-base font-bold text-slate-200">
              {asset.population_served.toLocaleString()}
            </span>
          </div>

          <div className="bg-slate-950/80 p-2.5 rounded border border-slate-800">
            <span className="text-[10px] text-slate-500 block">CRITICALITY</span>
            <span className="text-base font-bold text-cyan-400">
              {(asset.criticality * 100).toFixed(0)}%
            </span>
          </div>

          <div className="bg-slate-950/80 p-2.5 rounded border border-slate-800">
            <span className="text-[10px] text-slate-500 block">VULNERABILITY</span>
            <span className="text-base font-bold text-slate-300">
              {(asset.vulnerability * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Notes */}
        {asset.notes && (
          <div className="text-xs text-slate-300 bg-slate-950/40 p-2.5 rounded border border-slate-800/80">
            <span className="font-semibold text-slate-400">Operational Profile: </span>
            {asset.notes}
          </div>
        )}

        {/* Upstream Dependencies */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
            <ArrowDownRight className="w-3.5 h-3.5 text-cyan-400" />
            <span>Upstream Dependencies (What this asset relies on):</span>
          </div>
          {incoming.length === 0 ? (
            <p className="text-[11px] text-slate-500 font-mono pl-5">
              Root service node (no upstream critical dependencies).
            </p>
          ) : (
            <div className="space-y-1 pl-2">
              {incoming.map((edge, i) => {
                const src = assetMap.get(edge.source);
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-slate-950/60 border border-slate-800 px-2.5 py-1.5 rounded text-xs"
                  >
                    <span className="font-medium text-slate-200">
                      {src?.name || edge.source}
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400">
                      {edge.type} (strength: {edge.strength})
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Downstream Dependents */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
            <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
            <span>Downstream Dependents (Assets relying on this node):</span>
          </div>
          {outgoing.length === 0 ? (
            <p className="text-[11px] text-slate-500 font-mono pl-5">
              Terminal consumer node (no downstream utility linkages).
            </p>
          ) : (
            <div className="space-y-1 pl-2">
              {outgoing.map((edge, i) => {
                const tgt = assetMap.get(edge.target);
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-slate-950/60 border border-slate-800 px-2.5 py-1.5 rounded text-xs"
                  >
                    <span className="font-medium text-slate-200">
                      {tgt?.name || edge.target}
                    </span>
                    <span className="text-[10px] font-mono text-amber-400">
                      {edge.type} (crit: {edge.criticality})
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={() => {
              onSimulateFailure(asset.id);
              onClose();
            }}
            className="flex-1 flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-500 text-white font-semibold text-xs py-2 rounded transition"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Simulate Failure Here
          </button>
          <button
            onClick={() => {
              onDeployIntervention(asset.id);
              onClose();
            }}
            className="flex-1 flex items-center justify-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs py-2 rounded transition"
          >
            <Truck className="w-3.5 h-3.5" />
            Deploy Intervention
          </button>
        </div>
      </div>
    </div>
  );
}
