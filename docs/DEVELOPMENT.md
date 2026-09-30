# Development Guide

## Project conventions

Frontend UI components live under src/components. Shared API and domain logic belongs under src/lib. Shared TypeScript domain types belong under src/types.

The Express entry point is server.ts.

Keep the HTTP layer responsible for request parsing, authentication/context, Gemini orchestration, calling domain logic, and response formatting.

Keep simulation logic in src/lib/simulator.ts.

## Local workflow

Terminal 1:

~~~~bash
npm run server
~~~~

Terminal 2:

~~~~bash
npm run dev
~~~~

Vite serves the frontend on port 3000 and proxies /api to Express on port 3001.

## Useful commands

~~~~bash
npm install
npm run dev
npm run server
npm run build
npm run lint
npm start
~~~~

## Adding an infrastructure asset

Update src/lib/data.ts.

Include:

- unique ID
- human-readable name
- type
- coordinates
- capacity
- vulnerability
- population served
- criticality
- notes

Then add dependency links where a cross-sector relationship exists.

## Adding a new intervention

1. Add the intervention type to src/types/lifegrid.ts.
2. Add its behavior to src/lib/simulator.ts.
3. Add it to the Gemini tool description in server.ts.
4. Add the UI option in the intervention panel.
5. Add a scenario/test covering the intervention.

## Simulation changes

Do not hard-code new output values just to make the UI look better.

If the benchmark changes, update the underlying model and document the assumption.

Every meaningful modeling change should answer:

- What changed?
- Why?
- Which scenario demonstrates it?
- What output changed?
- Is the result reproducible?

## Security

Never commit .env, Gemini keys, service-account JSON, private OAuth credentials, or certificates/private keys.

Use restricted browser API keys for browser-side Google services and server-side secrets for Gemini.

## Pull requests

Before opening a PR:

~~~~bash
npm run lint
npm run build
~~~~

For simulation changes, manually verify:

1. baseline network loads
2. root failure works
3. cascade paths render
4. intervention works
5. session state remains coherent
