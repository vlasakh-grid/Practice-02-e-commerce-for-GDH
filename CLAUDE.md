# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Where things are

- `docs/REQUIREMENTS.md` — the project spec, single source of truth. Do not edit it.
- `docs/PLAN.md` — staged implementation plan. Its section 1 (Global rules) applies to **all** work in this repo, not only stage work.
- `docs/HANDOFF.md` — state after the last completed stage (appears after stage 1).

To continue implementation, follow section 0 of `docs/PLAN.md`.

## Commands

- `npm run dev` — start the dev server (http://localhost:3000)
- `npm run build` — production build
- `npm run test:ci` — run all tests once (Vitest)
- Single test file: `npx vitest run src/lib/pricing.test.ts`
- Single test by name: `npx vitest run -t "<test name>"`

## Conventions

- **Money is integer cents** (`499`, never `4.99`) in all new code and data: stored fields, function parameters and return values. Floats silently corrupt totals at scale. Convert to dollars only for display (`cents / 100`).
- This **overrides** the "floating-point dollars" line in `docs/REQUIREMENTS.md` and global rule 6 of `docs/PLAN.md`. Do not edit those docs.
- Existing frozen code (`src/lib/pricing.ts`) and `data/orders.json` still use dollars; leave them as they are unless the user asks for a migration. Never mix units in one value: name cents fields/params `amount` only when the type or comment says "cents".

## Architecture

See `ARCHITECTURE.md` (loaded via the `app-architecture` skill).
