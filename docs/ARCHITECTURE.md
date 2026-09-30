# LIFEGRID AI Architecture

## System overview

LIFEGRID AI is a layered decision-support application.

~~~~text
┌──────────────────────────────────────────────┐
│ Operator / Emergency Planner                 │
└──────────────────────┬───────────────────────┘
                       ▼
┌──────────────────────────────────────────────┐
│ React Command Center                         │
│ Map · Metrics · Cascade Trace · Copilot      │
└──────────────────────┬───────────────────────┘
                       ▼
┌──────────────────────────────────────────────┐
│ Gemini orchestration                         │
│ Function calling · Maps · Search             │
└───────────────┬──────────────────┬───────────┘
                │                  │
                ▼                  ▼
      ┌─────────────────┐   ┌──────────────────┐
      │ Cascade Engine  │   │ Google services  │
      │ deterministic   │   │ Maps / Search    │
      └────────┬────────┘   └──────────────────┘
               ▼
      Infrastructure graph
               ▼
      Impact + interventions
~~~~

## Domain model

An infrastructure asset contains identity, sector/type, coordinates, capacity, vulnerability, population served, criticality, current status, and disruption score.

A dependency link contains source asset, target asset, dependency type, strength, criticality, and description.

## Cascade propagation

A failure starts at a root asset. The simulator propagates pressure through directed dependencies using a queue and tracks causal depth/path to downstream assets.

Conceptually:

~~~~text
pressure =
  upstream_disruption
  × dependency_strength
  × criticality_factor
  × vulnerability_factor
~~~~

Disruption is bounded to 0..1.

Status thresholds:

- < 0.05: operational
- 0.05–0.79: degraded
- >= 0.80: failed

These are modeling assumptions, not real-world regulatory definitions.

## Counterfactual interventions

Interventions are applied to a scenario and the engine is rerun.

Examples:

- mobile generator
- backup pump
- emergency fuel
- temporary road access
- restore power

A local intervention protects its modeled target/dependency without automatically claiming that upstream infrastructure has been restored.

## Gemini integration

### Simulation

Natural language → function call → deterministic engine → result.

### Maps

Natural language location/facility question → Google Maps grounding → grounded response.

### Search

Natural language current-information question → Google Search grounding → grounded response.

Gemini is an orchestration and explanation layer rather than the numerical source of truth.

## State

The current prototype keeps active sessions in a process-local map for simplicity.

Production architecture should use Firestore as the authoritative shared session store so state survives Cloud Run instance changes and horizontal scaling.

## Geospatial model

The prototype stores asset coordinates and hazard polygons. Future versions can intersect live/precomputed hazard polygons with infrastructure nodes and automatically generate simulation scenarios.

## Trust boundaries

Never expose:

- Gemini API credentials
- service-account private keys
- private OAuth credentials

Browser-visible Firebase configuration is not equivalent to a server secret. Firebase web API keys are public project identifiers; Gemini Developer API keys must remain protected.

## Design goals

1. reproducibility
2. explainability
3. deterministic simulation
4. natural-language accessibility
5. geospatial context
6. safe separation between prototype modeling and real operational systems
