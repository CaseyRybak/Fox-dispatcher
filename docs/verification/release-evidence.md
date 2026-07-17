# Phase 7 release evidence

Date: 2026-07-17

## Release identity

- Public product: [fox-dispatcher-brown.vercel.app](https://fox-dispatcher-brown.vercel.app/)
- Repository: [CaseyRybak/Fox-dispatcher](https://github.com/CaseyRybak/Fox-dispatcher)
- Verified application revision: [`170ee1d63908d6c1e8a5ecb938190474b4707e58`](https://github.com/CaseyRybak/Fox-dispatcher/commit/170ee1d63908d6c1e8a5ecb938190474b4707e58)
- Published evidence revision: [`aaab9a7019b5bfbffe7d2044fae570db2b283277`](https://github.com/CaseyRybak/Fox-dispatcher/commit/aaab9a7019b5bfbffe7d2044fae570db2b283277)
- Final screenshot revision: [`334ec8ad8267fd496ad5628b670a0cd62defa65c`](https://github.com/CaseyRybak/Fox-dispatcher/commit/334ec8ad8267fd496ad5628b670a0cd62defa65c)
- Immutable production deployment: [fox-dispatcher-4wvowc3ex-caseyrybaks-projects.vercel.app](https://fox-dispatcher-4wvowc3ex-caseyrybaks-projects.vercel.app/)
- Vercel project: GitHub integration, `main` production branch, Vite preset, `npm ci`, `npm run build`, `dist`, no custom environment variables.

The changes after `170ee1d` through `334ec8a` publish documentation and screenshots only; runtime and deployment-policy source are unchanged. The mutable production alias must still be checked against embedded build revision metadata on every future release smoke.

## Repository gate

The submitted application revision passed with Node.js `24.17.0`:

```text
npm run verify
exit=0
```

The gate covers formatting, lint, hexagonal dependency boundaries, public-content safety, revision-pinned Worklog links, 77 unique automated tests, type checking, production build, and deployment-policy inspection. The Worklog boundary tests also run once inside the link-check command, but that duplicate execution is not counted as additional tests. A separate production-dependency audit was recorded as zero vulnerabilities before release; its raw command output was not retained, so this remains historical rather than freshly reproducible evidence. No dependency changed before the recorded release artifacts were published.

The production bundle contains no source maps, external HTML resources, runtime observation transport, or analytics. CSP allows only the application origin, plus inline styles used by data-driven layout and bundled `data:` font subsets. The broad `style-src 'unsafe-inline'` compatibility exception is required by current React style attributes and is not described as a self-only policy. Network connections remain disabled with `connect-src 'none'`.

## Deployment and browser result

Vercel reported successful Preview and Production deployments through the public GitHub deployment status. The Preview URL was protected by Vercel SSO, so the unauthenticated end-to-end journey ran against the public Production URL instead.

The first production smoke exposed blocked bundled font subsets under `font-src 'self'`. The release was not accepted with console errors: revision `170ee1d` narrowed the correction to `font-src 'self' data:`, the repository gate passed again, and Vercel redeployed successfully.

Historical production command:

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

The route started with Лиса 1 at `7.8`, recalculated to Лиса 3 at `7.9` when prey influence changed from 20% to 30%, then produced Лиса 4 at `8.0` after editing `obs_005`. Reload preserved the accepted edit. Summary reflow at 320 px had no horizontal overflow, and the desktop Worklog exposed all seven public-safe checkpoints. The accepted 320 px run did not repeat the Observations and Worklog navigation; that coverage boundary is addressed by the post-release hardening below.

## HTTP and privacy evidence

The repository deployment policy is:

```text
default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; media-src 'none'; worker-src 'none'
```

The historical production smoke asserted `connect-src 'none'` and `frame-ancestors 'none'` on the deployed CSP plus exact values for:

- `Referrer-Policy: no-referrer`;
- `X-Content-Type-Options: nosniff`;
- disabled camera, microphone, geolocation, payment, and USB permissions;
- no browser request outside `https://fox-dispatcher-brown.vercel.app` during the reviewer journey.

The local deployment-policy gate asserted the full CSP above, including `object-src 'none'`, `base-uri 'none'`, and `form-action 'none'`. It did not make those three directives separate remote-response assertions in the accepted run.

## Visual artifacts

- [Production AI Worklog at 1440 px](https://github.com/CaseyRybak/Fox-dispatcher/blob/aaab9a7019b5bfbffe7d2044fae570db2b283277/output/playwright/phase-7/production-worklog-1440px.png)
- [Persisted production Summary at 320 px](https://github.com/CaseyRybak/Fox-dispatcher/blob/334ec8ad8267fd496ad5628b670a0cd62defa65c/output/playwright/phase-7/production-summary-320px.png)

## Post-release consistency hardening

The 2026-07-17 consistency audit strengthened the working-tree release gate to:

- require and assert an embedded 40-character build revision for external URLs;
- require HTTP 200 and the exact deployed CSP;
- reject same-origin requests outside the document/static-asset GET allowlist, including query data and request bodies;
- prove that saving an observation creates no network request;
- navigate Summary, Observations/editor, and AI Worklog at 320 px and check every route for horizontal overflow.

These changes are not part of the historical `170ee1d` deployment. They were later published with Phase 8 in `89c0f495de90d25d59542f153560fbe6c911e9ad`. The protected Preview still means the original Phase 7 release did not satisfy the preferred preview/production/release-candidate SHA equality gate; Decision 0003 records the accepted production-only deviation instead of implying that preview verification occurred.

## Current Phase 8 production follow-up

On 2026-07-17 the revision-pinned release smoke was repeated against the mutable production alias with expected revision `89c0f495de90d25d59542f153560fbe6c911e9ad`. It verified HTTP 200, exact build metadata and privacy headers, local persistence after editing, Summary/Observations/Worklog at 320 px, seven Worklog checkpoints, no horizontal overflow, no browser errors, and static GET requests only to the application origin.

```json
{
  "browserErrors": 0,
  "headers": "verified",
  "mobileRoutes": 3,
  "persistedLeader": "Лиса 4, 8.0",
  "releaseRevision": "89c0f495de90d25d59542f153560fbe6c911e9ad",
  "requestOrigins": ["https://fox-dispatcher-brown.vercel.app"],
  "viewport": 320,
  "worklogCheckpoints": 7
}
```

A separate public Phase 8 smoke repeated atomic import/reload, deterministic export download, future-version raw recovery, four zero-violation axe scans, and the 320 px import dialog with zero browser errors and no request outside the production origin.

## Honest boundary

A native screen-reader session was unavailable in the release environment. Phase 6 records axe, keyboard, responsive, zoom, text-spacing, reduced-motion, forced-colors, and Chromium accessibility-tree evidence without presenting those checks as a native screen-reader test. JSON import/export was delivered later as the separately authorized Phase 8 extension; it remains outside the historical Phase 7 core gate.
