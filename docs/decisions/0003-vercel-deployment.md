# Decision 0003: Deploy the static product on Vercel

Status: accepted

Date: 2026-07-16

Deployment phase: [Phase 8](../exec-plans/active/2026-07-16-fox-dispatcher-implementation.md#phase-8-integrate-vercel-and-complete-the-release-gate)

## Context

The finished assignment needs a public URL that opens without environment setup. The application is a Vite-built static React product with no backend. The source repository is `CaseyRybak/Fox-dispatcher` on GitHub.

The deployment should support short review cycles, production evidence, and an agent-verifiable browser flow. Vercel provides Git-connected preview and production deployments suited to this artifact shape.

## Decision

Vercel is the deployment target.

Planned integration:

```text
GitHub revision
  -> Vercel Git integration
  -> locked dependency installation
  -> npm run build
  -> dist/
  -> preview or production URL
```

Repository settings establish:

- framework preset: Vite, when auto-detected;
- build command: the repository production build command;
- output directory: `dist`;
- Node version: the version pinned by the repository;
- preview deployments: review branches or pull requests;
- production deployment: the agreed production branch.

Top-level navigation uses hash-addressed destinations initially, keeping reloads compatible with a static artifact. A `vercel.json` file becomes part of the repository when a tested routing, header, cache, or build override requires it.

## Release evidence

The Vercel release gate records:

- local `npm run verify` from the deployed revision;
- production build browser flow;
- preview URL smoke before production promotion;
- production URL smoke on desktop and mobile;
- score change from 20% to 30%;
- observation edit and reload persistence;
- AI Worklog access;
- console and network review;
- deployed revision and known limitations.

User observation data remains local to the browser. The production runtime has no analytics, backend, remote font request, or AI API in the first version.

## Alternatives considered

### GitHub Pages

GitHub Pages can serve the static artifact, but Vercel was selected as the desired deployment workflow and provides first-class preview deployments for UI review.

### Manual CLI-only deployment

This can create an isolated deployment, but Git integration gives stronger traceability from repository revision to preview and production evidence.

### Server deployment

There is no server runtime to operate. A server host would add configuration without product value.

## Consequences

- Deployment configuration and evidence align with Vercel rather than GitHub Pages.
- GitHub revisions can receive preview URLs before production.
- Production remains a static artifact served from `dist`.
- Connecting the external Vercel project and publishing branches occur in the authorized deployment phase.
