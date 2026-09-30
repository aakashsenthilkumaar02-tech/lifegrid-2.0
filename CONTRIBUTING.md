# Contributing to LIFEGRID AI

Thanks for contributing.

## Before you start

Read README.md, docs/ARCHITECTURE.md, and docs/DEVELOPMENT.md.

## Development requirements

- Node.js 20+
- npm
- Git

## Branches

Use focused branches such as:

~~~~text
feature/cascade-trace
fix/cloud-run-startup
docs/deployment
~~~~

## Commit style

Prefer clear, imperative messages:

~~~~text
Add hospital intervention trace
Fix Cloud Run startup binding
Document hazard assumptions
~~~~

## Pull requests

Every PR should explain:

1. what changed
2. why it changed
3. how it was tested
4. whether the simulation model changed
5. whether any assumptions changed

Run npm run lint and npm run build before submitting.

## Modeling changes

LIFEGRID is a decision-support prototype. Avoid presenting synthetic relationships as official utility topology.

When changing the simulator, document the mathematical/modeling assumption and provide a reproducible example.
