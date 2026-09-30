/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type InfrastructureType =
  | 'power'
  | 'water'
  | 'hospital'
  | 'telecom'
  | 'road'
  | 'shelter'
  | 'fuel';

export type AssetStatus = 'operational' | 'degraded' | 'failed' | 'intervention';

export type DependencyType =
  | 'electricity'
  | 'water'
  | 'access'
  | 'communications'
  | 'backup_fuel';

export interface InfrastructureAsset {
  id: string;
  name: string;
  type: InfrastructureType;
  lat: number;
  lon: number;
  capacity: number;
  vulnerability: number;
  population_served: number;
  criticality: number;
  status: AssetStatus;
  disruption: number; // 0.0 (operational) to 1.0 (fully disrupted)
  active_interventions?: string[];
  notes?: string;
}

export interface DependencyLink {
  source: string;
  target: string;
  type: DependencyType;
  strength: number; // 0.0 to 1.0
  criticality: number; // 0.0 to 1.0
  description?: string;
}

export interface CascadePath {
  path: string[];
  depth: number;
  bottleneck_asset?: string;
  description?: string;
}

export interface ServiceImpacts {
  power: number;
  water: number;
  hospital: number;
  telecom: number;
  road?: number;
  fuel?: number;
  shelter?: number;
  [key: string]: number | undefined;
}

export interface AssetImpactDetail {
  status: AssetStatus;
  disruption: number;
  primary_cause?: string;
  population_affected?: number;
}

export interface InterventionEffect {
  intervention_id: string;
  target: string;
  type: string;
  description: string;
  delta: {
    disruption_change: number;
    facilities_saved: number;
    population_protected: number;
  };
}

export interface CascadeResult {
  scenario_id?: string;
  affected_assets: string[];
  failed_assets: string[];
  degraded_assets: string[];
  cascade_depth: number;
  population_exposed: number;
  critical_facilities_affected: number;
  service_impacts: ServiceImpacts;
  asset_impacts: Record<string, AssetImpactDetail>;
  cascade_paths: CascadePath[];
  intervention_effects?: InterventionEffect[];
  assumptions: string[];
  timestamp: string;
}

export interface ScenarioDefinition {
  failure_asset_id: string;
  duration_hours: number;
  severity: number;
  title?: string;
  description?: string;
}

export interface InterventionDefinition {
  id: string;
  type:
    | 'DEPLOY_MOBILE_GENERATOR'
    | 'BACKUP_PUMP'
    | 'EMERGENCY_FUEL'
    | 'TEMPORARY_ROAD_ACCESS'
    | 'RESTORE_POWER'
    | 'EVACUATE_POPULATION';
  target_asset_id: string;
  description: string;
  timestamp: string;
}

export interface SessionState {
  session_id: string;
  version: number;
  scenario: ScenarioDefinition | null;
  assets: InfrastructureAsset[];
  dependencies: DependencyLink[];
  result: CascadeResult | null;
  previous_result: CascadeResult | null;
  interventions: InterventionDefinition[];
  created_at: string;
  updated_at: string;
}

export interface GroundingLink {
  title: string;
  url: string;
  source: 'google_maps' | 'google_search';
  snippet?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tool_call?: {
    tool: string;
    params: Record<string, unknown>;
  };
  tool_result?: unknown;
  groundingLinks?: GroundingLink[];
  groundingType?: 'maps' | 'search' | 'simulation';
  timestamp: string;
}

export interface SavedCloudScenario {
  id: string;
  userId: string;
  title: string;
  failure_asset_id: string;
  duration_hours: number;
  severity: number;
  population_exposed: number;
  critical_facilities_affected: number;
  cascade_depth: number;
  createdAt: string;
}

export interface HazardPolygon {
  id: string;
  name: string;
  type: 'flood' | 'storm_surge' | 'waterlogging';
  severity: 'low' | 'moderate' | 'high' | 'severe';
  coordinates: [number, number][]; // [lat, lng]
  source: string;
  description: string;
}
