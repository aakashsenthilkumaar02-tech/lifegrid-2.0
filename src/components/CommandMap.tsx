/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AdvancedMarker, APIProvider, Map } from '@vis.gl/react-google-maps';
import {
  Activity,
  AlertTriangle,
  Car,
  Droplets,
  Fuel,
  Info,
  Layers,
  Maximize2,
  Radio,
  Shield,
  Zap,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { DependencyLink, HazardPolygon, InfrastructureAsset, InfrastructureType } from '../types/lifegrid';
import { MapLayers } from './MapLayers';

interface CommandMapProps {
  assets: InfrastructureAsset[];
  dependencies: DependencyLink[];
  hazardPolygons: HazardPolygon[];
  selectedAssetId: string | null;
  onSelectAsset: (assetId: string) => void;
  showDependencies: boolean;
  setShowDependencies: (val: boolean) => void;
  showHazards: boolean;
  setShowHazards: (val: boolean) => void;
}

export function CommandMap({
  assets,
  dependencies,
  hazardPolygons,
  selectedAssetId,
  onSelectAsset,
  showDependencies,
  setShowDependencies,
  showHazards,
  setShowHazards,
}: CommandMapProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const [mapError, setMapError] = useState(false);
  const [viewMode, setViewMode] = useState<'google' | 'topology'>(apiKey ? 'google' : 'topology');

  // Center coordinates for Chennai infrastructure basin
  const defaultCenter = useMemo(() => ({ lat: 13.076, lng: 80.264 }), []);

  const getAssetIcon = (type: InfrastructureType) => {
    switch (type) {
      case 'power':
        return <Zap className="w-3.5 h-3.5" />;
      case 'water':
        return <Droplets className="w-3.5 h-3.5" />;
      case 'hospital':
        return <Activity className="w-3.5 h-3.5" />;
      case 'telecom':
        return <Radio className="w-3.5 h-3.5" />;
      case 'road':
        return <Car className="w-3.5 h-3.5" />;
      case 'shelter':
        return <Shield className="w-3.5 h-3.5" />;
      case 'fuel':
        return <Fuel className="w-3.5 h-3.5" />;
      default:
        return <Layers className="w-3.5 h-3.5" />;
    }
  };

  const getStatusClasses = (asset: InfrastructureAsset) => {
    if (asset.status === 'intervention') {
      return {
        bg: 'bg-sky-500',
        ring: 'ring-sky-400/50 shadow-sky-500/50',
        badge: 'text-sky-300 border-sky-400/30 bg-sky-950/80',
        glow: 'shadow-[0_0_15px_rgba(56,189,248,0.7)]',
      };
    }
    if (asset.disruption >= 0.8) {
      return {
        bg: 'bg-red-500',
        ring: 'ring-red-400/60 shadow-red-500/50 animate-pulse',
        badge: 'text-red-300 border-red-400/30 bg-red-950/80',
        glow: 'shadow-[0_0_20px_rgba(239,68,68,0.8)]',
      };
    }
    if (asset.disruption > 0.05) {
      return {
        bg: 'bg-amber-500',
        ring: 'ring-amber-400/60 shadow-amber-500/40',
        badge: 'text-amber-300 border-amber-400/30 bg-amber-950/80',
        glow: 'shadow-[0_0_15px_rgba(245,158,11,0.6)]',
      };
    }
    return {
      bg: 'bg-emerald-500',
      ring: 'ring-emerald-400/40 shadow-emerald-500/20',
      badge: 'text-emerald-300 border-emerald-400/30 bg-emerald-950/80',
      glow: '',
    };
  };

  return (
    <div className="relative w-full h-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800/80 shadow-2xl flex flex-col">
      {/* Map Control Bar */}
      <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 shadow-lg text-xs">
        <span className="font-semibold text-slate-200 flex items-center gap-1.5 pr-2 border-r border-slate-700">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          GEO COMMAND
        </span>

        {apiKey && !mapError && (
          <div className="flex bg-slate-950 rounded p-0.5 border border-slate-800">
            <button
              onClick={() => setViewMode('google')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                viewMode === 'google'
                  ? 'bg-cyan-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Satellite / Vector
            </button>
            <button
              onClick={() => setViewMode('topology')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                viewMode === 'topology'
                  ? 'bg-cyan-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Topological Graph
            </button>
          </div>
        )}

        <button
          onClick={() => setShowDependencies(!showDependencies)}
          className={`px-2 py-1 rounded text-[11px] font-medium transition border ${
            showDependencies
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
          }`}
        >
          {showDependencies ? 'Dependencies: ON' : 'Dependencies: OFF'}
        </button>

        <button
          onClick={() => setShowHazards(!showHazards)}
          className={`px-2 py-1 rounded text-[11px] font-medium transition border ${
            showHazards
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
          }`}
        >
          {showHazards ? 'Hazard Zones: ON' : 'Hazard Zones: OFF'}
        </button>
      </div>

      {/* Status Legend Floating Bar */}
      <div className="absolute bottom-3 left-3 z-20 flex items-center gap-3 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] text-slate-300 shadow-lg">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
          <span>Operational</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.7)]" />
          <span>Degraded</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
          <span>Failed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
          <span>Intervention</span>
        </div>
      </div>

      {/* Map Container */}
      <div className="w-full flex-1 relative min-h-[420px]">
        {apiKey && !mapError && viewMode === 'google' ? (
          <APIProvider apiKey={apiKey} onError={() => setMapError(true)}>
            <Map
              defaultCenter={defaultCenter}
              defaultZoom={13}
              mapId="DEMO_MAP_ID"
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              disableDefaultUI={false}
              gestureHandling="greedy"
              className="w-full h-full"
              style={{ width: '100%', height: '100%' }}
            >
              <MapLayers
                assets={assets}
                dependencies={dependencies}
                hazardPolygons={hazardPolygons}
                showDependencies={showDependencies}
                showHazards={showHazards}
                selectedAssetId={selectedAssetId}
                onSelectAsset={onSelectAsset}
              />

              {assets.map((asset) => {
                const styles = getStatusClasses(asset);
                const isSelected = selectedAssetId === asset.id;

                return (
                  <AdvancedMarker
                    key={asset.id}
                    position={{ lat: asset.lat, lng: asset.lon }}
                    onClick={() => onSelectAsset(asset.id)}
                    title={`${asset.name} (${asset.id})`}
                  >
                    <div
                      className={`group relative flex items-center justify-center cursor-pointer transition-transform duration-200 ${
                        isSelected ? 'scale-125 z-30' : 'hover:scale-110 z-10'
                      }`}
                    >
                      {/* Pulse ring for failed/degraded nodes */}
                      {asset.disruption > 0.05 && (
                        <span
                          className={`absolute -inset-1.5 rounded-full ${styles.ring} ring-2 animate-ping opacity-40`}
                        />
                      )}

                      {/* Main Node Badge */}
                      <div
                        className={`w-8 h-8 rounded-full ${styles.bg} ${styles.glow} flex items-center justify-center text-slate-950 font-bold border-2 ${
                          isSelected ? 'border-amber-300 ring-2 ring-amber-400' : 'border-slate-900'
                        } shadow-md`}
                      >
                        {getAssetIcon(asset.type)}
                      </div>

                      {/* Floating Label */}
                      <div className="absolute top-9 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900/95 backdrop-blur-md px-2 py-0.5 rounded border border-slate-700 text-[10px] text-slate-200 pointer-events-none shadow-md flex items-center gap-1">
                        <span>{asset.name}</span>
                        {asset.disruption > 0 && (
                          <span
                            className={`font-mono text-[9px] px-1 rounded ${
                              asset.disruption >= 0.8
                                ? 'bg-red-950 text-red-300'
                                : 'bg-amber-950 text-amber-300'
                            }`}
                          >
                            {(asset.disruption * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </AdvancedMarker>
                );
              })}
            </Map>
          </APIProvider>
        ) : (
          /* Graceful Topological Graph Fallback (SVG Vector Canvas) */
          <div className="w-full h-full relative bg-slate-950 overflow-hidden flex items-center justify-center select-none">
            {/* Background Grid Pattern */}
            <div
              className="absolute inset-0 opacity-15"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 1px 1px, rgba(148, 163, 184, 0.4) 1px, transparent 0)',
                backgroundSize: '28px 28px',
              }}
            />

            <svg
              className="w-full h-full absolute inset-0"
              viewBox="0 0 1000 650"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <linearGradient id="grad-cascade" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.8" />
                </linearGradient>
                <filter id="glow-node">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Hazard Polygon on Topological view */}
              {showHazards && (
                <polygon
                  points="350,120 720,100 820,380 540,420 300,320"
                  fill="#0891b2"
                  fillOpacity="0.14"
                  stroke="#06b6d4"
                  strokeWidth="2"
                  strokeDasharray="6 4"
                />
              )}

              {/* Dependency Lines */}
              {showDependencies &&
                dependencies.map((dep, idx) => {
                  const src = assets.find((a) => a.id === dep.source);
                  const tgt = assets.find((a) => a.id === dep.target);
                  if (!src || !tgt) return null;

                  // Normalize lat/lon to 1000x650 canvas
                  const x1 = ((src.lon - 80.245) / 0.035) * 800 + 100;
                  const y1 = 650 - (((src.lat - 13.04) / 0.065) * 550 + 50);
                  const x2 = ((tgt.lon - 80.245) / 0.035) * 800 + 100;
                  const y2 = 650 - (((tgt.lat - 13.04) / 0.065) * 550 + 50);

                  const isCascadeActive = src.disruption > 0.05 && tgt.disruption > 0.05;
                  const isSelected = selectedAssetId === src.id || selectedAssetId === tgt.id;

                  return (
                    <g key={idx}>
                      <line
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={
                          isCascadeActive
                            ? '#ef4444'
                            : tgt.status === 'intervention'
                            ? '#38bdf8'
                            : isSelected
                            ? '#f59e0b'
                            : '#334155'
                        }
                        strokeWidth={isCascadeActive || isSelected ? 3 : 1.5}
                        strokeDasharray={isCascadeActive ? '6 4' : undefined}
                        className={isCascadeActive ? 'animate-pulse' : ''}
                      />
                      {/* Midpoint arrow indicator */}
                      <circle
                        cx={(x1 * 0.4 + x2 * 0.6)}
                        cy={(y1 * 0.4 + y2 * 0.6)}
                        r={2.5}
                        fill={isCascadeActive ? '#ef4444' : '#64748b'}
                      />
                    </g>
                  );
                })}

              {/* Node Circles */}
              {assets.map((asset) => {
                const cx = ((asset.lon - 80.245) / 0.035) * 800 + 100;
                const cy = 650 - (((asset.lat - 13.04) / 0.065) * 550 + 50);
                const isSelected = selectedAssetId === asset.id;

                let fill = '#10b981'; // operational
                if (asset.status === 'intervention') fill = '#38bdf8';
                else if (asset.disruption >= 0.8) fill = '#ef4444';
                else if (asset.disruption > 0.05) fill = '#f59e0b';

                return (
                  <g
                    key={asset.id}
                    onClick={() => onSelectAsset(asset.id)}
                    className="cursor-pointer group"
                  >
                    {/* Ring */}
                    {asset.disruption > 0.05 && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isSelected ? 26 : 20}
                        fill="none"
                        stroke={fill}
                        strokeWidth="1.5"
                        strokeOpacity="0.4"
                        className="animate-ping"
                      />
                    )}

                    <circle
                      cx={cx}
                      cy={cy}
                      r={isSelected ? 18 : 14}
                      fill={fill}
                      stroke={isSelected ? '#fef08a' : '#0f172a'}
                      strokeWidth={isSelected ? 3 : 2}
                      filter="url(#glow-node)"
                      className="transition-all duration-200 group-hover:scale-110"
                    />

                    {/* Node text */}
                    <text
                      x={cx}
                      y={cy + 24}
                      textAnchor="middle"
                      fill="#e2e8f0"
                      fontSize="10"
                      fontFamily="system-ui, sans-serif"
                      fontWeight="500"
                      className="pointer-events-none drop-shadow"
                    >
                      {asset.name}
                    </text>
                    {asset.disruption > 0 && (
                      <text
                        x={cx}
                        y={cy + 36}
                        textAnchor="middle"
                        fill={asset.disruption >= 0.8 ? '#f87171' : '#fbbf24'}
                        fontSize="9"
                        fontFamily="monospace"
                        className="pointer-events-none drop-shadow"
                      >
                        {(asset.disruption * 100).toFixed(0)}%
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {!apiKey && (
              <div className="absolute top-14 right-3 max-w-xs bg-slate-900/90 backdrop-blur-md p-3 rounded-lg border border-slate-800 text-xs text-slate-300 shadow-xl pointer-events-none">
                <div className="flex items-center gap-1.5 text-amber-400 font-semibold mb-1">
                  <Info className="w-3.5 h-3.5" />
                  Topological Network Engine Active
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Interactive deterministic cascade map. Configure{' '}
                  <code className="text-cyan-300">VITE_GOOGLE_MAPS_API_KEY</code> to enable Google
                  Vector Satellite surface.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
