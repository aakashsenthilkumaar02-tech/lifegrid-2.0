/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Cloud,
  Download,
  FolderOpen,
  Layers,
  Loader2,
  Play,
  RotateCcw,
  Trash2,
  Users,
  X,
  Zap,
} from 'lucide-react';
import React from 'react';
import { CloudScenarioDoc } from '../lib/firestoreService';

interface SavedScenariosModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenarios: CloudScenarioDoc[];
  onLoadScenario: (scenario: CloudScenarioDoc) => void;
  onDeleteScenario: (scenarioId: string) => void;
  isLoading: boolean;
  userEmail: string | null;
}

export function SavedScenariosModal({
  isOpen,
  onClose,
  scenarios,
  onLoadScenario,
  onDeleteScenario,
  isLoading,
  userEmail,
}: SavedScenariosModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100">
                FIRESTORE CLOUD SCENARIO REPOSITORY
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                Persistent Operator Archive: {userEmail || 'Anonymous'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-100 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1 text-xs">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
              <span>Querying Firestore persistent collections...</span>
            </div>
          ) : scenarios.length === 0 ? (
            <div className="py-12 text-center text-slate-500 font-mono space-y-2">
              <FolderOpen className="w-8 h-8 mx-auto text-slate-600" />
              <p>No saved scenarios in your cloud repository yet.</p>
              <p className="text-[11px] text-slate-400">
                Run any simulation cascade and click &quot;Save to Cloud&quot; to archive your contingency assessment.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {scenarios.map((sc) => (
                <div
                  key={sc.id}
                  className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-100 text-sm">{sc.title}</span>
                      <span className="font-mono text-[10px] bg-red-950 text-red-300 border border-red-800/40 px-1.5 py-0.5 rounded">
                        {sc.failure_asset_id}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-mono">
                      <span>Duration: {sc.duration_hours}h</span>
                      <span>•</span>
                      <span>Severity: {(sc.severity * 100).toFixed(0)}%</span>
                      <span>•</span>
                      <span className="text-cyan-300">
                        Pop: {sc.population_exposed.toLocaleString()}
                      </span>
                      <span>•</span>
                      <span className="text-rose-300">
                        Crit Facilities: {sc.critical_facilities_affected}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-500">
                      Saved {new Date(sc.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        onLoadScenario(sc);
                        onClose();
                      }}
                      className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold rounded text-xs transition flex items-center gap-1.5 shadow"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      Restore
                    </button>
                    <button
                      onClick={() => onDeleteScenario(sc.id)}
                      className="p-1.5 hover:bg-red-950/60 text-slate-500 hover:text-red-400 rounded transition border border-transparent hover:border-red-800/40"
                      title="Delete from Firestore"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-[11px] text-slate-400">
          <span>Total Saved Scenarios: {scenarios.length}</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
