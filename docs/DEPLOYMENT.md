# Deployment Guide

## Production architecture

LIFEGRID is designed to run as one Cloud Run service:

~~~~text
Cloud Run
├── Express API
├── React static build
└── Gemini orchestration
~~~~

The browser therefore uses same-origin API routes in production:

~~~~text
/api/health
/api/network
/api/simulate/failure
/api/intervention
/api/session/:session_id
/api/chat
~~~~

Keep VITE_API_BASE_URL empty unless the frontend is intentionally connected to a separate backend service.

## Environment variables

Required:

~~~~env
GEMINI_API_KEY=...
~~~~

Optional:

~~~~env
VITE_GOOGLE_MAPS_API_KEY=...
APP_URL=https://your-service-url
VITE_API_BASE_URL=
~~~~

Do not put the Gemini key in a VITE_* variable.

## Build locally

~~~~bash
npm ci
npm run lint
npm run build
~~~~

## Run production locally

~~~~bash
PORT=8080 npm start
~~~~

Windows PowerShell:

~~~~powershell
$env:PORT="8080"
npm start
~~~~

## Docker

~~~~bash
docker build -t lifegrid-ai .
docker run --rm -p 8080:8080 --env-file .env lifegrid-ai
~~~~

Open http://localhost:8080.

## Cloud Run

Deploy from source:

~~~~bash
gcloud run deploy lifegrid-ai --source . --region asia-southeast1
~~~~

Cloud Run injects PORT into the container. The Express server must listen on that port and on 0.0.0.0.

If deploying through Google AI Studio, keep the same architecture: one Express service serving the Vite build and /api routes.

## Deployment checklist

- [ ] npm run lint passes
- [ ] npm run build passes
- [ ] Gemini secret configured server-side
- [ ] Maps key configured and restricted
- [ ] Firestore rules deployed
- [ ] Google sign-in configured
- [ ] Cloud Run service listens on PORT
- [ ] /api/health returns healthy
- [ ] production UI loads
- [ ] simulation works
- [ ] intervention works
- [ ] Gemini chat works
- [ ] Maps grounding works
- [ ] Search grounding works

## Production state warning

The current prototype keeps active simulation sessions in process memory.

For a horizontally scaled production service, move authoritative session state to Firestore or another shared datastore.

## Rollback

Cloud Run creates revisions for deployments. If a new revision fails, route traffic back to the last healthy revision while diagnosing the failed revision.
