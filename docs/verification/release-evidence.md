# Phase 7 release evidence

Date: 2026-07-17

## Release identity

- Public product: [fox-dispatcher-brown.vercel.app](https://fox-dispatcher-brown.vercel.app/)
- Repository: [CaseyRybak/Fox-dispatcher](https://github.com/CaseyRybak/Fox-dispatcher)
- Verified application revision: [`170ee1d63908d6c1e8a5ecb938190474b4707e58`](https://github.com/CaseyRybak/Fox-dispatcher/commit/170ee1d63908d6c1e8a5ecb938190474b4707e58)
- Immutable production deployment: [fox-dispatcher-4wvowc3ex-caseyrybaks-projects.vercel.app](https://fox-dispatcher-4wvowc3ex-caseyrybaks-projects.vercel.app/)
- Vercel project: GitHub integration, `main` production branch, Vite preset, `npm ci`, `npm run build`, `dist`, no environment variables.

## Repository gate

The submitted application revision passed with Node.js `24.17.0`:

```text
npm run verify
exit=0
```

The gate covers formatting, lint, hexagonal dependency boundaries, public-content safety, revision-pinned Worklog links, 96 automated tests, type checking, production build, and deployment-policy inspection. The dependency production audit also reported zero vulnerabilities before release; no dependency changed afterward.

The production bundle contains no source maps, external HTML resources, runtime observation transport, or analytics. CSP allows only the application origin, plus inline styles used by data-driven layout and bundled `data:` font subsets. Network connections remain disabled with `connect-src 'none'`.

## Deployment and browser result

Vercel reported successful Preview and Production deployments through the public GitHub deployment status. The Preview URL was protected by Vercel SSO, so the unauthenticated end-to-end journey ran against the public Production URL instead.

The first production smoke exposed blocked bundled font subsets under `font-src 'self'`. The release was not accepted with console errors: revision `170ee1d` narrowed the correction to `font-src 'self' data:`, the repository gate passed again, and Vercel redeployed successfully.

Final production command:

```text
FOX_SMOKE_BASE_URL=https://fox-dispatcher-brown.vercel.app \
PLAYWRIGHT_EXECUTABLE_PATH=<chrome> npm run test:e2e:release
```

Observed result:

```json
{
  "browserErrors": 0,
  "headers": "verified",
  "persistedLeader": "Лиса 4, 8.0",
  "requestOrigins": ["https://fox-dispatcher-brown.vercel.app"],
  "viewport": 320,
  "worklogCheckpoints": 7
}
```

The route started with Лиса 1 at `7.8`, recalculated to Лиса 3 at `7.9` when prey influence changed from 20% to 30%, then produced Лиса 4 at `8.0` after editing `obs_005`. Reload preserved the accepted edit. Summary reflow at 320 px had no horizontal overflow, and the Worklog exposed all seven public-safe checkpoints.

## HTTP and privacy evidence

The public document returned HTTP 200 with:

- `Content-Security-Policy` containing `connect-src 'none'`, `object-src 'none'`, `form-action 'none'`, and `frame-ancestors 'none'`;
- `Referrer-Policy: no-referrer`;
- `X-Content-Type-Options: nosniff`;
- disabled camera, microphone, geolocation, payment, and USB permissions;
- no browser request outside `https://fox-dispatcher-brown.vercel.app` during the reviewer journey.

## Visual artifacts

- [Production AI Worklog at 1440 px](../../output/playwright/phase-7/production-worklog-1440px.png)
- [Persisted production Summary at 320 px](../../output/playwright/phase-7/production-summary-320px.png)

## Honest boundary

A native screen-reader session was unavailable in the release environment. Phase 6 records axe, keyboard, responsive, zoom, text-spacing, reduced-motion, forced-colors, and Chromium accessibility-tree evidence without presenting those checks as a native screen-reader test. JSON import/export remains an optional Phase 8 extension and is not part of the MOX completion gate.
