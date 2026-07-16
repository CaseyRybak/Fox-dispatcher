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
  -> npm ci with the repository-pinned Node/npm versions
  -> npm run build
  -> dist/
  -> preview or production URL
```

Repository settings establish:

- framework preset: Vite, when auto-detected;
- build command: the repository production build command;
- install command: `npm ci` against the committed `package-lock.json`;
- output directory: `dist`;
- Node version: the version pinned by the repository;
- preview deployments: review branches or pull requests;
- production deployment: `main`.

Top-level navigation uses hash-addressed destinations initially, keeping reloads compatible with a static artifact. A `vercel.json` file becomes part of the repository when a tested routing, header, cache, or build override requires it.

The production baseline requires tested response headers. The intended content policy uses self-hosted scripts, styles, fonts, and images; `connect-src 'none'`, `object-src 'none'`, `base-uri 'none'`, and `frame-ancestors 'none'` prevent runtime observation egress and embedding. `Referrer-Policy: no-referrer`, `X-Content-Type-Options: nosniff`, and a minimal `Permissions-Policy` are verified with the deployed artifact. Phase 8 may adjust only the resource directives demonstrated necessary by the production bundle.

The release candidate is identified by one Git commit SHA. Vercel builds a preview for that SHA; after the preview smoke passes and a direct user command authorizes publication, `main` is fast-forwarded to that exact commit and Git integration builds production. The release evidence requires `preview Git SHA == production Git SHA == approved release-candidate SHA`, plus both URLs and smoke results. A different merge or build commit is a new candidate and returns to preview review. Preview approval is not treated as production evidence by itself.

## Release evidence

The Vercel release gate records:

- local `npm run verify` from the deployed revision;
- production build browser flow;
- preview URL smoke before the authorized `main` fast-forward;
- production URL smoke on desktop and mobile;
- response-header assertions and an external-request allowlist with no observation egress;
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
- Preview and production evidence are tied to an explicit repository SHA.
