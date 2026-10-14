# Handoff

Last stage: 1 — Skeleton, shared design, pricing module, placeholder test   (Status: Done with open issues)
Next stage: 2 — Product catalog API and product selection

## What was implemented
- Next.js App Router + TypeScript strict project in `src/`, npm, exactly 3 scripts (`dev`, `build`, `test:ci`).
- `src/lib/pricing.ts` (sensitive module) written exactly as specified; one placeholder Vitest test.
- Shared layout and global CSS; home page with link to `/checkout`; temporary checkout page ("Checkout is not available yet.").
- `README.md` (renamed with `git mv`) and the `## Commands` section of `CLAUDE.md`.

## Files
Created: `package.json`, `package-lock.json`, `tsconfig.json`, `next.config.ts`, `.gitignore`, `next-env.d.ts` (generated), `src/lib/pricing.ts`, `src/lib/pricing.test.ts`, `src/app/globals.css`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/checkout/page.tsx`, `docs/HANDOFF.md`
Modified: `README.md` (renamed from `readme.md`), `CLAUDE.md`, `docs/PLAN.md` (checkboxes and status only)
Unplanned: `AGENTS.md` (written by `next dev`, see Open issues)

## Verification results
| Check | Command / action | Result |
|---|---|---|
| Build | `npm run build` | pass (exit 0; routes `/`, `/checkout`, `/_not-found` static) |
| Tests | `npm run test:ci` | pass (1 test) |
| Home page | `curl -s http://localhost:3000/` | contains "Welcome to GDH Shop" |
| Checkout page | `curl -s http://localhost:3000/checkout` | contains "Checkout is not available yet" |
| Scripts | `package.json` | exactly `dev`, `build`, `test:ci` |
| requirements-check (static) | skill | 0 ❌; R3, R4, R5 ✅; R1 ⏳ (stage 3), R2 ⏳ (stage 2) |
| Dev server | port 3000 | stopped, nothing listening |

## Deviations from the plan
- ~~vitest pinned to `3.2.7`~~ **Resolved after stage 1:** Node.js was upgraded 20.11.0 → 22.23.3 (nvm 0.39.7 → 0.40.8), `.nvmrc` (`22`) added, and vitest upgraded to latest `5.0.4` (needs Node `^22.12 || ^24 || >=26`). README and `docs/PLAN.md` now say "Node.js 22+". Original problem for history: vitest 5 crashed on Node 20.11.0 (`util.styleText` missing) and 4.1.11 crashed npm 10.2.4.
- `next build` rewrote `tsconfig.json`: `jsx` is now `react-jsx`, `allowJs: true` added, `.next/dev/types/**/*.ts` added to `include`, arrays reformatted. Accepted per rule 8.

## Open issues
- ~~`npm audit` vulnerabilities from vitest 3.2.7~~ **Resolved:** after upgrading to vitest 5.0.4, `npm audit` reports 0 vulnerabilities.
- `next dev` generates `AGENTS.md` in the repo root on every start. It is not in the plan's file list. Deleting it was blocked by the permission classifier, so it was left in place untracked. It can be deleted by the user or kept; it comes back on each `next dev` unless `agentRules: false` is set in `next.config.ts` (not done, because the plan gives that file verbatim).
- `docs/PLAN.md` says "Do not modify `src/lib/pricing.ts`" from stage 2 on; no change to it is needed so far.

## Context for the next stage
- Installed: next 16.4.0 (Turbopack), react / react-dom 19.3.0, typescript 7.0.2, vitest 5.0.4. Node.js 22 (`.nvmrc`). Dev server runs on port 3000.
- This Next.js version may differ from older conventions; docs are in `node_modules/next/dist/docs/`.
- Stage 1 files are not committed yet. Stage 2 requires them to be committed first (`git status` check in `stage-handoff`).

## Manual check for the user
1. Run `npm install && npm run dev` and open http://localhost:3000.
2. Click "Go to checkout"; the checkout page shows the same layout and "Checkout is not available yet."
3. Click "GDH Shop" in the header to go back to the home page.
4. Run `npm run build` and `npm run test:ci`; both should pass.
