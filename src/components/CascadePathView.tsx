/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  GitBranch,
  HelpCircle,
  Shield,
  Zap,
} from 'lucide-react';
import React, { useState } from 'react';
import { CascadeResult, InfrastructureAsset } from '../types/lifegrid';

interface CascadePathViewProps {
  result: CascadeResult | null;
  assets: InfrastructureAsset[];
  onSelectAsset: (assetId: string) => void;
}

export function CascadePathView({ result, assets, onSelectAsset }: CascadePathViewProps) {
  const [expandedTrace, setExpandedTrace] = useState<string | null>(null);

  if (!result || result.cascade_paths.length === 0) {
    return (
      <div className="bg-slate-900/60 backdrop-blur-md rounded-xl border border-slate-800 p-4 text-center">
        <p className="text-xs text-slate-500 font-mono">
          No cascade paths active. Trigger a simulation to analyze multi-hop propagation.
        </p>
      </div>
    );
  }

  const assetMap = new Map(assets.map((a) => [a.id, a]));

  // Group paths by target asset
  const targetPaths = new Map<string, typeof result.cascade_paths[0]>();
  for (const cp of result.cascade_paths) {
    const target = cp.path[cp.path.length - 1];
    if (!targetPaths.has(target) || (targetPaths.get(target)?.depth || 0) < cp.depth) {
      targetPaths.set(target, cp);
    }
  }

  return (
    <div className="bg-slate-900/80 backdrop-blur-md rounded-xl border border-slate-800 p-4 shadow-xl space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            CASCADE PROPAGATION TRACEABILITY
          </h3>
        </div>
        <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
          Deterministic Depth: {result.cascade_depth}
        </span>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed">
        Trace multi-hop infrastructure dependency pressure from root failure to secondary degradation.
      </p>

      {/* Path List */}
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {Array.from(targetPaths.values()).map((cp, idx) => {
          const rootId = cp.path[0];
          const targetId = cp.path[cp.path.length - 1];
          const rootAsset = assetMap.get(rootId);
          const targetAsset = assetMap.get(targetId);

          if (!targetAsset) return null;

          const isFailed = targetAsset.disruption >= 0.8;
          const isIntervention = targetAsset.status === 'intervention';

          return (
            <div
              key={idx}
              className={`p-2.5 rounded-lg border text-xs transition ${
                isIntervention
                  ? 'bg-sky-950/30 border-sky-500/30'
                  : isFailed
                  ? 'bg-red-950/30 border-red-500/30'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Chain Breadcrumbs */}
              <div className="flex flex-wrap items-center gap-1.5 font-mono mb-1.5">
                {cp.path.map((nodeId, nodeIdx) => {
                  const node = assetMap.get(nodeId);
                  const isLast = nodeIdx === cp.path.length - 1;
                  const isFirst = nodeIdx === 0;

                  return (
                    <React.Fragment key={nodeId}>
                      <button
                        onClick={() => onSelectAsset(nodeId)}
                        className={`px-1.5 py-0.5 rounded font-semibold text-[11px] transition ${
                          isFirst
                            ? 'bg-red-950 text-red-300 border border-red-800/50'
                            : isLast
                            ? isIntervention
                              ? 'bg-sky-950 text-sky-300 border border-sky-800/50'
                              : 'bg-amber-950 text-amber-300 border border-amber-800/50'
                            : 'bg-slate-800 text-slate-300'
                        } hover:opacity-80`}
                      >
                        {node?.name || nodeId}
                      </button>
                      {!isLast && <ChevronRight className="w-3 h-3 text-slate-500" />}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Path metadata and causal explanation */}
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-mono text-slate-300">
                  {cp.depth === 1 ? 'Direct Dependent (Hop 1)' : `Secondary Cascade (Hop ${cp.depth})`}
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={`font-mono font-bold ${
                      isIntervention
                        ? 'text-sky-400'
                        : isFailed
                        ? 'text-red-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {isIntervention
                      ? 'PROTECTED (0%)'
                      : `Disruption: ${(targetAsset.disruption * 100).toFixed(1)}%`}
                  </span>
                </div>
              </div>

              {/* Special highlight for the 2-hop hospital trace */}
              {targetId === 'HOSP_02' && (
                <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-amber-200/90 bg-amber-950/20 p-1.5 rounded">
                  <span className="font-semibold text-amber-300">Causal Insight: </span>
                  HOSP_02 has no direct electrical failure, but fails clinical readiness due to raw
                  water loss from upstream North Water Pump (PUMP_N01).
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
