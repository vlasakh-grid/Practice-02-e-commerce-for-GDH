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

## Architecture

Defined in the `app-architecture` skill (`.claude/skills/app-architecture/SKILL.md`).
