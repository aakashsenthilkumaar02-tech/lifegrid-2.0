# LIFEGRID AI

> **See the cascade. Test the response. Protect the community.**

LIFEGRID AI is an infrastructure cascade-intelligence platform for disaster response and contingency planning.

It models critical infrastructure as a dependency graph and answers a practical question:

> **When one service fails, what else breaks?**

Instead of asking an LLM to invent an outage prediction, LIFEGRID separates the system into two roles:

- **Gemini** understands operator intent, selects tools, explains results, and provides Maps/Search-grounded context.
- **The deterministic LIFEGRID engine** is the source of truth for cascade propagation, disruption metrics, affected population, and counterfactual interventions.

## What it does

1. Model power, water, hospitals, telecom, roads, fuel, and shelters as interconnected assets.
2. Simulate a primary failure with duration and severity.
3. Propagate disruption through multi-hop dependencies.
4. Show causal cascade paths on the command map.
5. Quantify exposed population, critical facilities, service impact, and asset disruption.
6. Test interventions such as mobile generators, backup pumps, emergency fuel, road access, and power restoration.
7. Use Gemini as a natural-language copilot for simulation queries.
8. Use Google Maps grounding for facility/location questions.
9. Use Google Search grounding for current weather, alerts, and public advisories.
10. Save authenticated user/scenario data with Firebase/Firestore.

## Architecture

~~~~text
Operator
   │
   ▼
React + TypeScript Command Center
   │
   ▼
Gemini Copilot
   ├── Function calling ──────► LIFEGRID deterministic engine
   ├── Google Maps grounding
   └── Google Search grounding
                                  │
                                  ▼
                         Dependency graph
                                  │
                                  ▼
                     Multi-hop cascade simulation
                                  │
                                  ▼
                   Impact + intervention results
~~~~

### Core principle

**Gemini is not the calculator.**

For example:

~~~~text
User: "What happens if North Substation fails for 8 hours?"
              │
              ▼
Gemini → simulate_failure(...)
              │
              ▼
Deterministic engine
              │
              ▼
36,060 exposed / cascade depth 2 / affected assets...
              │
              ▼
Gemini explains the result
~~~~

This separation makes the simulation reproducible and easier to audit.

## Current prototype network

The demo contains 10 modeled assets across power, water, healthcare, telecom, transport, community, and fuel.

~~~~text
North Substation
   ├──► North Water Pump ───► Metro General Hospital
   ├──► Central Water Station
   ├──► Central Hospital
   └──► Telecom Tower ──────► Metro General Hospital

North Arterial Corridor ────► Metro General Hospital
Strategic Fuel Depot ───────► Central Hospital
South Substation ────────────► Strategic Fuel Depot
~~~~

## Example scenario

**Scenario:** North Substation fails completely for 8 hours.

The deterministic benchmark currently demonstrates a two-hop cascade with:

- 36,060 population exposed
- 2 critical facilities affected
- Central Hospital disruption
- North Water Pump failure
- Central Water Station degradation
- Telecom degradation
- downstream Metro General Hospital impact

The operator can then test:

> "What if we deploy a mobile generator to Central Hospital?"

The intervention protects the selected facility without pretending that the upstream substation or water network has been repaired.

## Tech stack

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- Lucide
- Google Maps Platform

### Backend
- Node.js
- Express
- TypeScript/tsx
- Gemini API
- Deterministic cascade simulator

### Cloud
- Google Cloud Run
- Firebase Authentication
- Cloud Firestore

### Google AI capabilities
- Gemini function calling
- Google Maps grounding
- Google Search grounding

## Repository structure

~~~~text
lifegrid-2.0/
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DEVELOPMENT.md
│   └── DEPLOYMENT.md
├── src/
│   ├── components/       # Command-center UI
│   ├── lib/
│   │   ├── api.ts        # Frontend API client + fallback
│   │   ├── data.ts       # Assets, dependencies, hazards
│   │   ├── firebase.ts   # Auth + Firestore
│   │   └── simulator.ts  # Deterministic cascade engine
│   └── types/
│       └── lifegrid.ts   # Shared domain types
├── server.ts             # Express API + Gemini orchestration
├── vite.config.ts
├── Dockerfile
├── firestore.rules
├── package.json
└── README.md
~~~~

## Local development

### Requirements

- Node.js 20+
- npm
- Gemini API key for AI features
- Google Maps API key for the interactive map
- Firebase configuration for authentication/Firestore features

### Install

~~~~bash
npm install
~~~~

### Configure

Copy .env.example to .env and set:

~~~~env
GEMINI_API_KEY=your_key_here
~~~~

Keep VITE_API_BASE_URL empty for the standard local setup. Vite proxies /api requests to the local Express server.

### Start the backend

~~~~bash
npm run server
~~~~

The API listens on http://localhost:3001 by default.

### Start the frontend

In a second terminal:

~~~~bash
npm run dev
~~~~

Open http://localhost:3000.

### Verify the backend

~~~~bash
curl http://localhost:3001/api/health
~~~~

## Production build

~~~~bash
npm run lint
npm run build
npm start
~~~~

The production Express server serves the Vite build and the /api/* endpoints from the same origin.

## Environment variables

| Variable | Where | Purpose |
|---|---|---|
| GEMINI_API_KEY | Server only | Gemini Developer API authentication |
| VITE_GOOGLE_MAPS_API_KEY | Browser | Google Maps client configuration |
| VITE_API_BASE_URL | Browser | Optional remote API base URL; leave empty for same-origin production |
| APP_URL | Optional | Public application URL for integrations |

**Never put GEMINI_API_KEY in a VITE_* variable.**

## Cloud Run

The application is intentionally structured as a single full-stack service in production:

~~~~text
Browser
   │
   ▼
Cloud Run
   ├── React static assets
   ├── /api/health
   ├── /api/network
   ├── /api/simulate/failure
   ├── /api/intervention
   ├── /api/session/:id
   └── /api/chat
          │
          ▼
       Gemini
~~~~

Cloud Run provides the PORT environment variable. The Express server binds to 0.0.0.0 so it satisfies the Cloud Run container runtime contract.

See docs/DEPLOYMENT.md for the deployment checklist.

## Data and modeling notes

The current prototype is deliberately a **scenario-testing model**, not a live utility-control system.

- Geographic anchors are based on Chennai context.
- Utility dependency relationships are modeled for demonstration.
- Hazard polygons are precomputed prototype layers.
- The electrical/water topology is synthetic rather than an operational utility map.
- Intervention effects are counterfactual and should not be interpreted as real dispatch instructions.

## Roadmap

### Near term
- Move active session state from process memory to Firestore.
- Add automated API and simulator tests.
- Add schema validation for incoming requests.
- Add richer cascade trace explanations.
- Add reproducible scenario IDs and result hashes.

### Next
- Ingest live/precomputed hazard layers.
- Add flood-to-infrastructure spatial intersection.
- Expand the graph across multiple Indian cities.
- Add alternate feeders, redundancy, and capacity constraints.

### Future
- Optimize intervention placement under limited resources.
- Compare intervention portfolios.
- Add probabilistic uncertainty bands.
- Support multi-hazard scenarios.
- Build a regional/national infrastructure digital-twin layer.

## Limitations

LIFEGRID AI is an exploratory decision-support prototype. It is **not** an emergency dispatch system, utility control system, medical decision system, or official disaster forecast.

The current cascade engine is deterministic and scenario-based. Results depend on the modeled topology, assumptions, and parameters.

## License

Apache License 2.0. See LICENSE.

## Project

https://github.com/aakashsenthilkumaar02-tech/lifegrid-2.0
