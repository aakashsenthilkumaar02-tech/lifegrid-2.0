/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Bot,
  ExternalLink,
  Globe,
  HelpCircle,
  Loader2,
  MapPin,
  Send,
  Sparkles,
  Terminal,
  User,
  Wrench,
  Zap,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { ChatMessage, SessionState } from '../types/lifegrid';

interface GeminiCopilotProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, mode?: 'auto' | 'maps' | 'search' | 'simulation') => Promise<void>;
  isLoading: boolean;
  session: SessionState | null;
}

export function GeminiCopilot({
  messages,
  onSendMessage,
  isLoading,
  session,
}: GeminiCopilotProps) {
  const [input, setInput] = useState('');
  const [groundingMode, setGroundingMode] = useState<'simulation' | 'maps' | 'search'>('simulation');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim(), groundingMode);
    setInput('');
  };

  const handleChipClick = (prompt: string, modeOverride?: 'simulation' | 'maps' | 'search') => {
    if (isLoading) return;
    const mode = modeOverride || groundingMode;
    onSendMessage(prompt, mode);
  };

  return (
    <div className="bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-800 shadow-2xl flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-slate-950/70">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-slate-950 shadow-md">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-100 flex items-center gap-1.5">
              GEMINI COPILOT & GROUNDING ENGINE
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              gemini-2.5-flash | Tool Function Calling & Live Grounding
            </div>
          </div>
        </div>

        <div className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-700 hidden sm:block">
          v{session?.version || 1}
        </div>
      </div>

      {/* Grounding Mode Selector */}
      <div className="bg-slate-950/60 border-b border-slate-800/80 p-1.5 flex items-center gap-1 text-[11px]">
        <button
          onClick={() => setGroundingMode('simulation')}
          className={`flex-1 py-1 px-2 rounded font-medium transition flex items-center justify-center gap-1.5 ${
            groundingMode === 'simulation'
              ? 'bg-cyan-600 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Deterministic cascade modeling via function calling"
        >
          <Zap className="w-3 h-3 fill-current" />
          <span>Cascade Engine</span>
        </button>

        <button
          onClick={() => setGroundingMode('maps')}
          className={`flex-1 py-1 px-2 rounded font-medium transition flex items-center justify-center gap-1.5 ${
            groundingMode === 'maps'
              ? 'bg-cyan-600 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Live Google Maps place & hospital lookup"
        >
          <MapPin className="w-3 h-3" />
          <span>Google Maps</span>
        </button>

        <button
          onClick={() => setGroundingMode('search')}
          className={`flex-1 py-1 px-2 rounded font-medium transition flex items-center justify-center gap-1.5 ${
            groundingMode === 'search'
              ? 'bg-cyan-600 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Live Google Search disaster weather & OGD news"
        >
          <Globe className="w-3 h-3" />
          <span>Google Search</span>
        </button>
      </div>

      {/* Dynamic Suggested Prompt Chips according to active mode */}
      <div className="px-3 py-1.5 bg-slate-950/40 border-b border-slate-800/60 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider shrink-0 flex items-center gap-1">
          <Terminal className="w-3 h-3 text-cyan-400" /> Prompts:
        </span>

        {groundingMode === 'simulation' && (
          <>
            <button
              onClick={() => handleChipClick('What happens if North Substation fails for 8 hours?', 'simulation')}
              disabled={isLoading}
              className="shrink-0 px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition disabled:opacity-50"
            >
              North Substation outage (8h)
            </button>
            <button
              onClick={() => handleChipClick('What if we deploy a mobile generator to the Central Hospital?', 'simulation')}
              disabled={isLoading}
              className="shrink-0 px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition disabled:opacity-50"
            >
              Mobile gen → Central Hospital
            </button>
            <button
              onClick={() => handleChipClick('Why is Metro General Hospital (HOSP_02) affected?', 'simulation')}
              disabled={isLoading}
              className="shrink-0 px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition disabled:opacity-50"
            >
              Why is Hospital 2 affected?
            </button>
          </>
        )}

        {groundingMode === 'maps' && (
          <>
            <button
              onClick={() => handleChipClick('Find major government trauma hospitals near Central Chennai', 'maps')}
              disabled={isLoading}
              className="shrink-0 px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-cyan-300 border border-cyan-800/50 transition disabled:opacity-50"
            >
              Find trauma hospitals in Chennai
            </button>
            <button
              onClick={() => handleChipClick('Where are the nearest emergency flood relief shelters in North Chennai?', 'maps')}
              disabled={isLoading}
              className="shrink-0 px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-cyan-300 border border-cyan-800/50 transition disabled:opacity-50"
            >
              Flood relief shelters near Basin Bridge
            </button>
            <button
              onClick={() => handleChipClick('What is the road access and ambulance route to Stanley Medical College?', 'maps')}
              disabled={isLoading}
              className="shrink-0 px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-cyan-300 border border-cyan-800/50 transition disabled:opacity-50"
            >
              Stanley Hospital ambulance corridor
            </button>
          </>
        )}

        {groundingMode === 'search' && (
          <>
            <button
              onClick={() => handleChipClick('What is the latest IMD weather alert and rainfall warning for Chennai?', 'search')}
              disabled={isLoading}
              className="shrink-0 px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-emerald-300 border border-emerald-800/50 transition disabled:opacity-50"
            >
              Latest IMD Chennai rainfall alert
            </button>
            <button
              onClick={() => handleChipClick('Tamil Nadu State Disaster Management Authority guidelines for municipal cyclone relief', 'search')}
              disabled={isLoading}
              className="shrink-0 px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-emerald-300 border border-emerald-800/50 transition disabled:opacity-50"
            >
              TNDSMA flood preparedness
            </button>
            <button
              onClick={() => handleChipClick('Greater Chennai Corporation flood sensor monitoring low-lying areas', 'search')}
              disabled={isLoading}
              className="shrink-0 px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-emerald-300 border border-emerald-800/50 transition disabled:opacity-50"
            >
              GCC waterlogging updates
            </button>
          </>
        )}
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 p-3 overflow-y-auto space-y-3 font-sans text-xs">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';

          return (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-6 h-6 rounded bg-cyan-950 border border-cyan-800/50 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-lg p-3 leading-relaxed shadow-md ${
                  isUser
                    ? 'bg-cyan-600 text-slate-950 font-medium ml-auto'
                    : 'bg-slate-950/80 border border-slate-800 text-slate-200'
                }`}
              >
                {/* Grounding Source Badge */}
                {msg.groundingType === 'maps' && (
                  <div className="mb-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-600/40 text-[10px] font-mono">
                    <MapPin className="w-3 h-3" />
                    <span>GOOGLE MAPS GROUNDED (gemini-2.5-flash)</span>
                  </div>
                )}
                {msg.groundingType === 'search' && (
                  <div className="mb-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-600/40 text-[10px] font-mono">
                    <Globe className="w-3 h-3" />
                    <span>GOOGLE SEARCH GROUNDED (gemini-2.5-flash)</span>
                  </div>
                )}

                {/* Tool Invocation Transparency Badge */}
                {msg.tool_call && (
                  <div className="mb-2 bg-slate-900 border border-cyan-500/40 rounded p-2 text-[11px] font-mono text-cyan-300">
                    <div className="flex items-center gap-1.5 font-bold mb-1 text-cyan-400">
                      <Wrench className="w-3 h-3" />
                      Function Calling Invocation: <code className="text-white">{msg.tool_call.tool}</code>
                    </div>
                    <pre className="text-[10px] text-slate-300 overflow-x-auto bg-slate-950 p-1.5 rounded">
                      {JSON.stringify(msg.tool_call.params, null, 2)}
                    </pre>
                  </div>
                )}

                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Grounding Citations & Links list (REQUIRED for Google Maps/Search Grounding) */}
                {msg.groundingLinks && msg.groundingLinks.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1.5">
                    <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                      {msg.groundingType === 'maps' ? (
                        <>
                          <MapPin className="w-3 h-3 text-cyan-400" />
                          <span>Interactive Google Maps Locations & Places</span>
                        </>
                      ) : (
                        <>
                          <ExternalLink className="w-3 h-3 text-emerald-400" />
                          <span>Google Search Grounded Citations & Sources</span>
                        </>
                      )}
                    </div>
                    <div className="space-y-1">
                      {msg.groundingLinks.map((link, lIdx) => (
                        <a
                          key={lIdx}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-1.5 rounded bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-[11px] text-cyan-300 hover:text-cyan-200 transition group"
                        >
                          <span className="truncate pr-2 font-medium">{link.title}</span>
                          <ExternalLink className="w-3 h-3 shrink-0 text-slate-500 group-hover:text-cyan-400 transition" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div
                  className={`text-[9px] mt-1.5 font-mono ${
                    isUser ? 'text-cyan-950/80' : 'text-slate-500'
                  }`}
                >
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>

              {isUser && (
                <div className="w-6 h-6 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-2.5 items-center text-slate-400 text-xs">
            <div className="w-6 h-6 rounded bg-cyan-950 border border-cyan-800/50 flex items-center justify-center text-cyan-400 shrink-0">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            </div>
            <div className="bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2 text-slate-400 font-mono text-[11px] flex items-center gap-2">
              <span>
                {groundingMode === 'maps'
                  ? 'Retrieving Google Maps geospatial place grounding...'
                  : groundingMode === 'search'
                  ? 'Retrieving live Google Search disaster intelligence...'
                  : 'Executing deterministic cascade simulation tool...'}
              </span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Field */}
      <form onSubmit={handleSubmit} className="p-2.5 bg-slate-950 border-t border-slate-800 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            groundingMode === 'maps'
              ? 'Ask for locations (e.g. "Find trauma hospitals near Central Chennai")'
              : groundingMode === 'search'
              ? 'Ask for live updates (e.g. "Latest IMD Chennai rainfall alert")'
              : 'Ask Copilot (e.g. "What if North Substation fails for 8 hours?")'
          }
          disabled={isLoading}
          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 rounded-lg font-semibold text-xs transition flex items-center gap-1 disabled:opacity-50 shadow-md"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Ask</span>
        </button>
      </form>
    </div>
  );
}
