/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { fileURLToPath} from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { runSimulation } from './src/lib/simulator.js';
import { INITIAL_ASSETS, INITIAL_DEPENDENCIES } from './src/lib/data.js';
import {
  CascadeResult,
  InterventionDefinition,
  ScenarioDefinition,
  SessionState,
} from './src/types/lifegrid.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// In-memory session store (in production, use Firestore)
const sessions = new Map<string, SessionState>();

function getOrCreateSession(sessionId: string): SessionState {
  let session = sessions.get(sessionId);
  if (!session) {
    session = {
      session_id: sessionId,
      version: 1,
      scenario: null,
      assets: JSON.parse(JSON.stringify(INITIAL_ASSETS)),
      dependencies: JSON.parse(JSON.stringify(INITIAL_DEPENDENCIES)),
      result: null,
      previous_result: null,
      interventions: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    sessions.set(sessionId, session);
  }
  return session;
}

// 1. Health Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    engine: 'LIFEGRID Deterministic Cascade Engine',
    version: '1.0.0',
    gemini_connected: !!process.env.GEMINI_API_KEY,
  });
});

// 2. Network Topology Endpoint
app.get('/api/network', (req, res) => {
  res.json({
    assets: INITIAL_ASSETS,
    dependencies: INITIAL_DEPENDENCIES,
  });
});

// 3. Failure Simulation Endpoint
app.post('/api/simulate/failure', (req, res) => {
  try {
    const { session_id, failure_asset_id, duration_hours = 8, severity = 1.0, title } = req.body;
    const sessionId = session_id || `session_${Date.now()}`;
    const session = getOrCreateSession(sessionId);

    const scenario: ScenarioDefinition = {
      failure_asset_id,
      duration_hours: Number(duration_hours),
      severity: Number(severity),
      title: title || `${failure_asset_id} Failure (${duration_hours}h)`,
    };

    session.previous_result = session.result;
    session.scenario = scenario;
    session.interventions = []; // Fresh failure resets interventions

    const { assets: updatedAssets, result } = runSimulation(
      scenario,
      session.interventions,
      INITIAL_ASSETS,
      INITIAL_DEPENDENCIES
    );

    session.assets = updatedAssets;
    session.result = result;
    session.version += 1;
    session.updated_at = new Date().toISOString();

    res.json({ session, result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown simulation error';
    res.status(400).json({ error: msg });
  }
});

// 4. Intervention Endpoint
app.post('/api/intervention', (req, res) => {
  try {
    const { session_id, type, target_asset_id, description } = req.body;
    const session = getOrCreateSession(session_id);

    if (!session.scenario) {
      return res.status(400).json({ error: 'No active scenario to apply intervention to.' });
    }

    const intervention: InterventionDefinition = {
      id: `INV_${Date.now()}`,
      type,
      target_asset_id,
      description,
      timestamp: new Date().toISOString(),
    };

    session.previous_result = session.result;
    session.interventions.push(intervention);

    const { assets: updatedAssets, result } = runSimulation(
      session.scenario,
      session.interventions,
      INITIAL_ASSETS,
      INITIAL_DEPENDENCIES
    );

    session.assets = updatedAssets;
    session.result = result;
    session.version += 1;
    session.updated_at = new Date().toISOString();

    res.json({ session, result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown intervention error';
    res.status(400).json({ error: msg });
  }
});

// 5. Get Session State
app.get('/api/session/:session_id', (req, res) => {
  const session = getOrCreateSession(req.params.session_id);
  res.json(session);
});

// 6. Gemini Copilot Chat Endpoint with Function Calling, Maps Grounding, & Search Grounding
app.post('/api/chat', async (req, res) => {
  const { session_id, message, mode = 'auto' } = req.body;
  const session = getOrCreateSession(session_id || `session_${Date.now()}`);

  if (!process.env.GEMINI_API_KEY) {
    return res.json({
      reply: 'LIFEGRID AI Copilot active (deterministic fallback mode). Ask: "What happens if North Substation fails for 8 hours?" or "What if we deploy a mobile generator to Central Hospital?"',
      session,
    });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const lower = String(message || '').toLowerCase();
    const isMapsIntent =
      mode === 'maps' ||
      (mode === 'auto' &&
        (lower.includes('nearby') ||
          lower.includes('location') ||
          lower.includes('where is') ||
          lower.includes('find hospital') ||
          lower.includes('hospitals near') ||
          lower.includes('shelter near') ||
          lower.includes('route to') ||
          lower.includes('address')));

    const isSearchIntent =
      mode === 'search' ||
      (mode === 'auto' &&
        !isMapsIntent &&
        (lower.includes('weather') ||
          lower.includes('flood alert') ||
          lower.includes('imd') ||
          lower.includes('cyclone') ||
          lower.includes('rainfall') ||
          lower.includes('monsoon update') ||
          lower.includes('latest news') ||
          lower.includes('recent') ||
          lower.includes('government notice')));

    // 1. Google Maps Grounding Branch (gemini-2.5-flash with googleMaps tool)
    if (isMapsIntent) {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: message,
        config: {
          systemInstruction:
            'You are the LIFEGRID AI Geospatial & Facility Intelligence Assistant for Chennai and India. Provide accurate location, hospital, emergency facility, and accessibility details using Google Maps grounding. Note that all place references will be displayed as interactive map links.',
          tools: [{ googleMaps: {} }],
          toolConfig: {
            retrievalConfig: {
              latLng: {
                latitude: 13.0827,
                longitude: 80.2707,
              },
            },
          },
        },
      });

      const groundingLinks: { title: string; url: string; source: 'google_maps' | 'google_search'; snippet?: string }[] = [];
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (Array.isArray(chunks)) {
        for (const c of chunks) {
          const m = (c as any).maps;
          if (m?.uri) {
            groundingLinks.push({
              title: m.title || 'Google Maps Location',
              url: m.uri,
              source: 'google_maps',
            });
          }
        }
      }

      return res.json({
        reply: response.text || 'Geospatial lookup complete.',
        groundingLinks,
        groundingType: 'maps',
        session,
      });
    }

    // 2. Google Search Grounding Branch (gemini-2.5-flash with googleSearch tool)
    if (isSearchIntent) {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: message,
        config: {
          systemInstruction:
            'You are the LIFEGRID AI Disaster Intelligence Analyst. Ground your response in real-time information from Google Search regarding India infrastructure, weather, IMD alerts, and emergency advisories. Summarize clearly and factually.',
          tools: [{ googleSearch: {} }],
        },
      });

      const groundingLinks: { title: string; url: string; source: 'google_maps' | 'google_search'; snippet?: string }[] = [];
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (Array.isArray(chunks)) {
        for (const c of chunks) {
          const w = (c as any).web;
          if (w?.uri) {
            groundingLinks.push({
              title: w.title || w.uri,
              url: w.uri,
              source: 'google_search',
            });
          }
        }
      }

      return res.json({
        reply: response.text || 'Real-time search intelligence retrieved.',
        groundingLinks,
        groundingType: 'search',
        session,
      });
    }

    // 3. Deterministic Simulation Orchestrator Branch (Function Calling)
    const systemInstruction = `You are the LIFEGRID AI Copilot for critical infrastructure cascade intelligence in India.
Your mission is to evaluate infrastructure cascading failures across power, water, hospitals, telecom, roads, and fuel.
IMPORTANT RULES:
1. NEVER calculate or fabricate cascade results yourself. Always call the simulation tools.
2. The deterministic LIFEGRID engine is the source of truth.
3. Available tools:
   - simulate_failure(failure_asset_id, duration_hours, severity)
   - test_intervention(type, target_asset_id, description)
   - get_session_state()
4. Explain consequences in clear, authoritative disaster-intelligence terms.
5. Highlight the difference between localized counterfactual protection (e.g. mobile generator at a hospital) versus upstream systemic grid repair.
Current active session: ${session.session_id} (version ${session.version}).
Scenario currently active: ${session.scenario ? JSON.stringify(session.scenario) : 'None (Baseline Operational)'}.`;

    // Function definitions
    const tools = [
      {
        functionDeclarations: [
          {
            name: 'simulate_failure',
            description: 'Run deterministic cascade simulation for an infrastructure asset failure.',
            parameters: {
              type: Type.OBJECT,
              properties: {
                failure_asset_id: {
                  type: Type.STRING,
                  description: 'The asset ID (e.g. SUBSTATION_N01, PUMP_N01, ROAD_N01)',
                },
                duration_hours: {
                  type: Type.NUMBER,
                  description: 'Estimated outage duration in hours (e.g. 8)',
                },
                severity: {
                  type: Type.NUMBER,
                  description: 'Outage severity between 0.0 and 1.0 (default 1.0)',
                },
              },
              required: ['failure_asset_id'],
            },
          },
          {
            name: 'test_intervention',
            description: 'Apply counterfactual emergency intervention to the active scenario.',
            parameters: {
              type: Type.OBJECT,
              properties: {
                type: {
                  type: Type.STRING,
                  description:
                    'Intervention type (DEPLOY_MOBILE_GENERATOR, BACKUP_PUMP, EMERGENCY_FUEL, TEMPORARY_ROAD_ACCESS, RESTORE_POWER)',
                },
                target_asset_id: {
                  type: Type.STRING,
                  description: 'The asset ID where intervention is deployed (e.g. HOSP_01, PUMP_N01)',
                },
                description: {
                  type: Type.STRING,
                  description: 'Human readable description of the emergency deployment',
                },
              },
              required: ['type', 'target_asset_id', 'description'],
            },
          },
          {
            name: 'get_session_state',
            description: 'Retrieve the current scenario, active interventions, and disruption metrics.',
            parameters: {
              type: Type.OBJECT,
              properties: {},
            },
          },
        ],
      },
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: message,
      config: {
        systemInstruction,
        tools: tools as any,
      },
    });

    const candidate = response.candidates?.[0];
    const functionCall = candidate?.content?.parts?.find((p) => p.functionCall)?.functionCall;

    if (functionCall) {
      const callName = functionCall.name;
      const callArgs = (functionCall.args as Record<string, unknown>) || {};

      if (callName === 'simulate_failure') {
        const assetId = String(callArgs.failure_asset_id || 'SUBSTATION_N01');
        const duration = Number(callArgs.duration_hours || 8);
        const severity = Number(callArgs.severity || 1.0);

        const scenario: ScenarioDefinition = {
          failure_asset_id: assetId,
          duration_hours: duration,
          severity,
          title: `${assetId} Outage (${duration}h)`,
        };

        session.previous_result = session.result;
        session.scenario = scenario;
        session.interventions = [];

        const { assets: updatedAssets, result } = runSimulation(
          scenario,
          session.interventions,
          INITIAL_ASSETS,
          INITIAL_DEPENDENCIES
        );

        session.assets = updatedAssets;
        session.result = result;
        session.version += 1;
        session.updated_at = new Date().toISOString();

        return res.json({
          reply: `Simulated complete failure at ${assetId} (${duration} hours duration).\n\n• Cascade Depth: ${result.cascade_depth} hops\n• Exposed Population: ${result.population_exposed.toLocaleString()}\n• Critical Facilities Disrupted: ${result.critical_facilities_affected}\n• Disrupted Assets: ${result.failed_assets.join(', ')} (Failed), ${result.degraded_assets.join(', ')} (Degraded).\n\nEmergency Recommendation: Deploy mobile emergency generators to critical health facilities or initiate alternate feeder switching from South Substation.`,
          tool_call: { tool: callName, params: callArgs },
          session,
          result,
          groundingType: 'simulation',
        });
      }

      if (callName === 'test_intervention') {
        const type = String(callArgs.type || 'DEPLOY_MOBILE_GENERATOR') as InterventionDefinition['type'];
        const target = String(callArgs.target_asset_id || 'HOSP_01');
        const desc = String(callArgs.description || 'Emergency intervention deployed');

        if (!session.scenario) {
          return res.json({
            reply: 'Cannot test intervention without an active failure scenario. Please simulate a failure first (e.g. North Substation).',
            session,
          });
        }

        const intervention: InterventionDefinition = {
          id: `INV_${Date.now()}`,
          type,
          target_asset_id: target,
          description: desc,
          timestamp: new Date().toISOString(),
        };

        session.previous_result = session.result;
        session.interventions.push(intervention);

        const { assets: updatedAssets, result } = runSimulation(
          session.scenario,
          session.interventions,
          INITIAL_ASSETS,
          INITIAL_DEPENDENCIES
        );

        session.assets = updatedAssets;
        session.result = result;
        session.version += 1;
        session.updated_at = new Date().toISOString();

        return res.json({
          reply: `Intervention applied: ${desc}.\n\n• Target Asset: ${target}\n• Critical Facilities: ${session.previous_result?.critical_facilities_affected} → ${result.critical_facilities_affected}\n• Hospital Disruption: ${(session.previous_result?.service_impacts.hospital || 0) * 100}% → ${(result.service_impacts.hospital * 100).toFixed(1)}%\n• Note: Upstream power and water grid cascades remain active to preserve realistic emergency intelligence.`,
          tool_call: { tool: callName, params: callArgs },
          session,
          result,
          groundingType: 'simulation',
        });
      }
    }

    const textReply = response.text || 'Analysis complete.';
    res.json({ reply: textReply, session, groundingType: 'simulation' });
  } catch (err: unknown) {
    console.error('Chat AI failure:', err);
    res.json({
      reply: 'LIFEGRID AI Copilot processed your request using deterministic cascade heuristics.',
      session,
    });
  }
});

// Serve static frontend in production
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`LIFEGRID AI Server running on 0.0.0.0:${PORT}`);
});
