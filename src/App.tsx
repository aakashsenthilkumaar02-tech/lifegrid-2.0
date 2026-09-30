/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Activity,
  AlertTriangle,
  Bot,
  Cloud,
  GitBranch,
  Info,
  Layers,
  Shield,
  Sparkles,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { AssetDetailModal } from './components/AssetDetailModal';
import { AssumptionsModal } from './components/AssumptionsModal';
import { CascadePathView } from './components/CascadePathView';
import { CommandMap } from './components/CommandMap';
import { GeminiCopilot } from './components/GeminiCopilot';
import { Header } from './components/Header';
import { ImpactMetrics } from './components/ImpactMetrics';
import { InterventionPanel } from './components/InterventionPanel';
import { SavedScenariosModal } from './components/SavedScenariosModal';
import { api } from './lib/api';
import { HAZARD_POLYGONS, INITIAL_ASSETS, INITIAL_DEPENDENCIES } from './lib/data';
import { auth, signInWithGoogle, logOut } from './lib/firebase';
import {
  CloudScenarioDoc,
  deleteScenarioFromCloud,
  fetchUserScenarios,
  saveScenarioToCloud,
} from './lib/firestoreService';
import {
  ChatMessage,
  InfrastructureAsset,
  InterventionDefinition,
  SessionState,
} from './types/lifegrid';

export default function App() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [savedScenarios, setSavedScenarios] = useState<CloudScenarioDoc[]>([]);
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
  const [isSavingScenario, setIsSavingScenario] = useState(false);

  const [session, setSession] = useState<SessionState>({
    session_id: `lifegrid_${Date.now()}`,
    version: 1,
    scenario: null,
    assets: INITIAL_ASSETS,
    dependencies: INITIAL_DEPENDENCIES,
    result: null,
    previous_result: null,
    interventions: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [showDependencies, setShowDependencies] = useState(true);
  const [showHazards, setShowHazards] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isAssumptionsOpen, setIsAssumptionsOpen] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [activeSideTab, setActiveSideTab] = useState<'copilot' | 'trace' | 'interventions'>('copilot');

  // Initial welcome message from Gemini Copilot
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_welcome',
      role: 'assistant',
      content:
        'Welcome to LIFEGRID AI — Infrastructure Cascade Intelligence & Decision-Support System for India.\n\nI am your Copilot. I analyze critical interdependencies across electricity, water, hospitals, telecom, roads, and fuel.\n\nAvailable Operational Modes:\n• ⚡ Cascade Engine: Deterministic simulation tools & multi-hop propagation\n• 📍 Google Maps Grounding: Real-time place & hospital discovery in Chennai/India\n• 🌐 Google Search Grounding: Live IMD rainfall warnings & disaster alerts',
      timestamp: new Date().toISOString(),
    },
  ]);

  // Listen to Google Maps Quota Exceeded event (Tier 1 requirement)
  useEffect(() => {
    const handleQuotaExceeded = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
  }, []);

  // Firebase Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const list = await fetchUserScenarios(user.uid);
          setSavedScenarios(list || []);
        } catch (err) {
          console.error('Error fetching scenarios:', err);
        }
      } else {
        setSavedScenarios([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Save current scenario to Firestore
  const handleSaveCurrentScenario = async () => {
    if (!session.scenario || !session.result) return;
    if (!currentUser) {
      try {
        const user = await signInWithGoogle();
        if (!user) return;
      } catch {
        return;
      }
    }

    const uid = auth.currentUser?.uid || currentUser?.uid;
    if (!uid) return;

    setIsSavingScenario(true);
    try {
      await saveScenarioToCloud(
        uid,
        session.scenario,
        session.result,
        session.interventions
      );

      const refreshed = await fetchUserScenarios(uid);
      setSavedScenarios(refreshed || []);

      setMessages((prev) => [
        ...prev,
        {
          id: `msg_save_${Date.now()}`,
          role: 'system',
          content: `Scenario "${session.scenario?.title || session.scenario?.failure_asset_id}" successfully persisted to Google Firestore under your operator profile.`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      console.error('Failed to save to Firestore:', err);
    } finally {
      setIsSavingScenario(false);
    }
  };

  // Restore scenario from Firestore
  const handleLoadSavedScenario = (sc: CloudScenarioDoc) => {
    handleSimulateFailure(sc.failure_asset_id, sc.duration_hours, sc.severity, sc.title);
  };

  // Delete scenario from Firestore
  const handleDeleteScenario = async (scId: string) => {
    const uid = currentUser?.uid;
    if (!uid) return;
    try {
      await deleteScenarioFromCloud(uid, scId);
      setSavedScenarios((prev) => prev.filter((s) => s.id !== scId));
    } catch (err) {
      console.error('Failed to delete scenario:', err);
    }
  };

  // Handler for simulating a failure
  const handleSimulateFailure = async (
    failureAssetId: string,
    durationHours = 8,
    severity = 1.0,
    title?: string
  ) => {
    setIsLoading(true);
    try {
      const { session: newSession, result } = await api.simulateFailure({
        session_id: session.session_id,
        failure_asset_id: failureAssetId,
        duration_hours: durationHours,
        severity,
        title: title || `${failureAssetId} Failure (${durationHours}h)`,
      });

      setSession(newSession);

      // Add Copilot response entry
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_${Date.now()}`,
          role: 'assistant',
          content: `Simulated complete failure at ${failureAssetId} for ${durationHours} hours.\n\n• Exposed Population: ${result.population_exposed.toLocaleString()}\n• Cascade Depth: ${result.cascade_depth} hops\n• Critical Facilities Disrupted: ${result.critical_facilities_affected}\n• Disrupted Assets: ${result.failed_assets.length} failed, ${result.degraded_assets.length} degraded.\n\nUse the Intervention Engine or ask Copilot to test counterfactual mitigation options.`,
          tool_call: {
            tool: 'simulate_failure',
            params: { failure_asset_id: failureAssetId, duration_hours: durationHours, severity },
          },
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      console.error('Simulation failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for applying an intervention
  const handleApplyIntervention = async (
    type: InterventionDefinition['type'],
    targetAssetId: string,
    description: string
  ) => {
    if (!session.scenario) return;
    setIsLoading(true);

    try {
      const { session: newSession, result } = await api.testIntervention({
        session_id: session.session_id,
        type,
        target_asset_id: targetAssetId,
        description,
      });

      setSession(newSession);

      setMessages((prev) => [
        ...prev,
        {
          id: `msg_${Date.now()}`,
          role: 'assistant',
          content: `Intervention tested: ${description}.\n\n• Target Asset: ${targetAssetId}\n• Status: Re-evaluated against existing scenario.\n• Facilities Saved: ${
            (session.result?.critical_facilities_affected || 0) - result.critical_facilities_affected
          }\n\nThe before-vs-after comparison reflects localized protection without fabricating upstream grid restoration.`,
          tool_call: {
            tool: 'test_intervention',
            params: { type, target_asset_id: targetAssetId, description },
          },
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      console.error('Intervention execution failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for resetting interventions
  const handleResetInterventions = async () => {
    if (!session.scenario) return;
    await handleSimulateFailure(
      session.scenario.failure_asset_id,
      session.scenario.duration_hours,
      session.scenario.severity,
      session.scenario.title
    );
  };

  // Handler for resetting to baseline
  const handleResetToBaseline = () => {
    setSession({
      session_id: `lifegrid_${Date.now()}`,
      version: 1,
      scenario: null,
      assets: JSON.parse(JSON.stringify(INITIAL_ASSETS)),
      dependencies: JSON.parse(JSON.stringify(INITIAL_DEPENDENCIES)),
      result: null,
      previous_result: null,
      interventions: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    setMessages((prev) => [
      ...prev,
      {
        id: `msg_${Date.now()}`,
        role: 'system',
        content: 'System restored to baseline state. All infrastructure assets operational.',
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  // Handler for sending conversational message
  const handleSendMessage = async (
    text: string,
    mode: 'auto' | 'maps' | 'search' | 'simulation' = 'auto'
  ) => {
    const userMsg: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await api.postChat({
        session_id: session.session_id,
        message: text,
        mode,
      });

      if (response.session) {
        setSession(response.session);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `msg_asst_${Date.now()}`,
          role: 'assistant',
          content: response.reply,
          tool_call: response.tool_call,
          groundingLinks: response.groundingLinks,
          groundingType: response.groundingType,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_err_${Date.now()}`,
          role: 'assistant',
          content: 'Error communicating with Copilot engine. Please retry your query.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Preset quick triggers matching demo walkthrough
  const handleRunPresetScenario = (
    type: 'SUBSTATION_N01' | 'INTERVENTION_GEN' | 'INTERVENTION_PUMP' | 'RESET'
  ) => {
    if (type === 'SUBSTATION_N01') {
      handleSimulateFailure('SUBSTATION_N01', 8, 1.0, 'North Substation Failure (8h)');
      setActiveSideTab('trace');
    } else if (type === 'INTERVENTION_GEN') {
      handleApplyIntervention(
        'DEPLOY_MOBILE_GENERATOR',
        'HOSP_01',
        'Deploy 500kVA Mobile Diesel Generator to Central Hospital'
      );
      setActiveSideTab('interventions');
    } else if (type === 'INTERVENTION_PUMP') {
      handleApplyIntervention(
        'BACKUP_PUMP',
        'PUMP_N01',
        'Auxiliary Power & Backup Pump deployed to North Water Pump'
      );
      setActiveSideTab('interventions');
    } else if (type === 'RESET') {
      handleResetToBaseline();
      setActiveSideTab('copilot');
    }
  };

  const selectedAsset = session.assets.find((a) => a.id === selectedAssetId) || null;

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Header */}
      <Header
        session={session}
        currentUser={currentUser}
        savedScenariosCount={savedScenarios.length}
        onSignIn={signInWithGoogle}
        onSignOut={logOut}
        onOpenSavedScenarios={() => setIsSavedModalOpen(true)}
        onSaveCurrentScenario={handleSaveCurrentScenario}
        onRunPresetScenario={handleRunPresetScenario}
        onOpenAssumptions={() => setIsAssumptionsOpen(true)}
        quotaExceeded={quotaExceeded}
        isSavingScenario={isSavingScenario}
      />

      {/* Main Command Center Layout */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden p-3 gap-3">
        {/* Left / Center: Interactive Map & Impact Metrics Surface */}
        <section className="flex-1 flex flex-col min-w-0 gap-3 overflow-hidden">
          {/* Map Surface (Command Center Canvas) */}
          <div className="flex-1 min-h-[360px] relative">
            <CommandMap
              assets={session.assets}
              dependencies={session.dependencies}
              hazardPolygons={HAZARD_POLYGONS}
              selectedAssetId={selectedAssetId}
              onSelectAsset={(id) => setSelectedAssetId(id)}
              showDependencies={showDependencies}
              setShowDependencies={setShowDependencies}
              showHazards={showHazards}
              setShowHazards={setShowHazards}
            />
          </div>

          {/* Bottom Bar: Impact Metrics Dashboard */}
          <div className="shrink-0">
            <ImpactMetrics
              currentResult={session.result}
              previousResult={session.previous_result}
              session={session}
            />
          </div>
        </section>

        {/* Right: AI Copilot & Scenario Intelligence Multi-Tab Panel */}
        <section className="w-full lg:w-[460px] shrink-0 flex flex-col bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-800 shadow-2xl overflow-hidden">
          {/* Side Tabs Selector */}
          <div className="flex border-b border-slate-800 bg-slate-950/70 p-1 text-xs">
            <button
              onClick={() => setActiveSideTab('copilot')}
              className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition flex items-center justify-center gap-1.5 ${
                activeSideTab === 'copilot'
                  ? 'bg-cyan-600 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gemini Copilot</span>
            </button>

            <button
              onClick={() => setActiveSideTab('trace')}
              className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition flex items-center justify-center gap-1.5 ${
                activeSideTab === 'trace'
                  ? 'bg-cyan-600 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>Cascade Trace</span>
              {session.result?.cascade_depth ? (
                <span className="text-[10px] font-mono px-1 rounded bg-slate-950/40">
                  {session.result.cascade_depth}
                </span>
              ) : null}
            </button>

            <button
              onClick={() => setActiveSideTab('interventions')}
              className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition flex items-center justify-center gap-1.5 ${
                activeSideTab === 'interventions'
                  ? 'bg-cyan-600 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Interventions</span>
              {session.interventions.length > 0 && (
                <span className="text-[10px] font-mono px-1 rounded bg-sky-950 text-sky-200 border border-sky-500/40">
                  {session.interventions.length}
                </span>
              )}
            </button>
          </div>

          {/* Tab Content Panels */}
          <div className="flex-1 overflow-hidden p-2.5">
            {activeSideTab === 'copilot' && (
              <GeminiCopilot
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                session={session}
              />
            )}

            {activeSideTab === 'trace' && (
              <div className="h-full overflow-y-auto">
                <CascadePathView
                  result={session.result}
                  assets={session.assets}
                  onSelectAsset={(id) => setSelectedAssetId(id)}
                />
              </div>
            )}

            {activeSideTab === 'interventions' && (
              <div className="h-full overflow-y-auto">
                <InterventionPanel
                  session={session}
                  assets={session.assets}
                  onApplyIntervention={handleApplyIntervention}
                  onResetInterventions={handleResetInterventions}
                  isLoading={isLoading}
                />
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Asset Inspector Modal */}
      <AssetDetailModal
        asset={selectedAsset}
        dependencies={session.dependencies}
        allAssets={session.assets}
        onClose={() => setSelectedAssetId(null)}
        onSimulateFailure={(id) => handleSimulateFailure(id, 8, 1.0)}
        onDeployIntervention={(id) => {
          handleApplyIntervention(
            'DEPLOY_MOBILE_GENERATOR',
            id,
            `Emergency Intervention deployed to ${id}`
          );
        }}
      />

      {/* Assumptions & Data Sources Modal */}
      <AssumptionsModal
        isOpen={isAssumptionsOpen}
        onClose={() => setIsAssumptionsOpen(false)}
      />

      {/* Saved Cloud Scenarios Modal (Firestore) */}
      <SavedScenariosModal
        isOpen={isSavedModalOpen}
        onClose={() => setIsSavedModalOpen(false)}
        scenarios={savedScenarios}
        onLoadScenario={handleLoadSavedScenario}
        onDeleteScenario={handleDeleteScenario}
        isLoading={false}
        userEmail={currentUser?.email || null}
      />
    </div>
  );
}
