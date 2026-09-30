/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AlertTriangle,
  BookOpen,
  Database,
  ExternalLink,
  Info,
  ShieldAlert,
  X,
} from 'lucide-react';
import React from 'react';
import { DATA_SOURCES_REGISTER, MODELING_ASSUMPTIONS } from '../lib/data';

interface AssumptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AssumptionsModal({ isOpen, onClose }: AssumptionsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100">
                LIFEGRID AI METHODOLOGY, ASSUMPTIONS & DATA SOURCES
              </h2>
              <p className="text-[11px] text-slate-400">
                Decision-Support Prototype Governance Framework
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-slate-300 leading-relaxed">
          {/* Prominent Safety Banner */}
          <div className="bg-amber-950/40 border border-amber-500/40 rounded-lg p-3 text-amber-200 space-y-1">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>SAFETY & TRUST NOTICE: MODELED SIMULATION</span>
            </div>
            <p className="text-[11px] text-amber-200/90">
              LIFEGRID AI does NOT access confidential real-world electrical grid or water network
              topologies. Geographic anchors, roads, and ward populations are grounded in open Indian public
              datasets, but infrastructure dependency linkages are synthetically modeled for disaster
              planning and contingency research. Not a certified emergency forecast or automated dispatch tool.
            </p>
          </div>

          {/* Modeling Assumptions */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-cyan-400">
              <BookOpen className="w-4 h-4" />
              <span>Core Modeling Principles</span>
            </div>
            <ul className="space-y-2 pl-4 list-disc text-slate-300">
              {MODELING_ASSUMPTIONS.map((item, idx) => (
                <li key={idx} className="text-[11px]">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Public Data Sources Register */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-emerald-400">
              <Database className="w-4 h-4" />
              <span>Authoritative Data Sources Register</span>
            </div>
            <div className="space-y-2">
              {DATA_SOURCES_REGISTER.map((ds) => (
                <div
                  key={ds.id}
                  className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">{ds.name}</span>
                    <a
                      href={ds.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      Visit Portal <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Coverage: {ds.coverage}
                  </div>
                  <div className="text-[11px] text-slate-300">{ds.description}</div>
                  <div className="text-[10px] text-emerald-400/90 pt-1">
                    <span className="font-semibold text-slate-400">Application Role: </span>
                    {ds.role}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-semibold transition"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
}
