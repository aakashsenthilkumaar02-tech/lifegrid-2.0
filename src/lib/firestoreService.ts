/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { CascadeResult, ScenarioDefinition, InterventionDefinition } from '../types/lifegrid';

export interface CloudScenarioDoc {
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
  interventions?: InterventionDefinition[];
  resultSummary?: {
    failed_assets: string[];
    degraded_assets: string[];
    hospital_disruption: number;
    power_disruption: number;
    water_disruption: number;
  };
}

/**
 * Save active simulation scenario and results to Firestore
 */
export async function saveScenarioToCloud(
  userId: string,
  scenario: ScenarioDefinition,
  result: CascadeResult,
  interventions: InterventionDefinition[] = []
): Promise<string> {
  const scenarioId = `scenario_${Date.now()}`;
  const path = `users/${userId}/scenarios/${scenarioId}`;

  const docData: CloudScenarioDoc = {
    id: scenarioId,
    userId,
    title: scenario.title || `${scenario.failure_asset_id} Outage (${scenario.duration_hours}h)`,
    failure_asset_id: scenario.failure_asset_id,
    duration_hours: scenario.duration_hours,
    severity: scenario.severity,
    population_exposed: result.population_exposed,
    critical_facilities_affected: result.critical_facilities_affected,
    cascade_depth: result.cascade_depth,
    createdAt: new Date().toISOString(),
    interventions,
    resultSummary: {
      failed_assets: result.failed_assets,
      degraded_assets: result.degraded_assets,
      hospital_disruption: result.service_impacts.hospital || 0,
      power_disruption: result.service_impacts.power || 0,
      water_disruption: result.service_impacts.water || 0,
    },
  };

  try {
    await setDoc(doc(db, 'users', userId, 'scenarios', scenarioId), docData);
    return scenarioId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Fetch all saved scenarios for the authenticated user from Firestore
 */
export async function fetchUserScenarios(userId: string): Promise<CloudScenarioDoc[]> {
  const path = `users/${userId}/scenarios`;
  try {
    const q = query(collection(db, 'users', userId, 'scenarios'));
    const snapshot = await getDocs(q);
    const list: CloudScenarioDoc[] = [];
    snapshot.forEach((d) => {
      list.push(d.data() as CloudScenarioDoc);
    });
    return list.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

/**
 * Delete a saved scenario from Firestore
 */
export async function deleteScenarioFromCloud(userId: string, scenarioId: string): Promise<void> {
  const path = `users/${userId}/scenarios/${scenarioId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'scenarios', scenarioId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
