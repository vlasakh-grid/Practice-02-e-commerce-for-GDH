---
name: requirements-check
description: Audit this project against docs/REQUIREMENTS.md and report, grouped by file, anything missing or wrong — API routes, exact npm scripts, pricing module, forbidden dependencies. Read-only. Use after scaffolding, re-scaffolding, changing dependencies, or finishing a stage. Pass "full" to also run test:ci and build.
allowed-tools: Read, Glob, Grep, Bash(node -e:*), Bash(npm run test:ci), Bash(npm run build), Bash(ls:*), Bash(test:*)
---

# Requirements check

Audits the project against `docs/REQUIREMENTS.md` and prints a report grouped by file.

## Ground rules

- **Read-only.** Never edit, create, delete or install anything, and never "fix" a finding. Only report.
- Run **every** check, even if earlier ones fail.
- Every ❌ cites the requirement it comes from, e.g. `REQUIREMENTS › Stack`.
- The report goes to chat only. Do not write a report file.

## Modes

- **static** (default): reads files only.
- **full**: used when the invocation arguments contain `full` (e.g. `/requirements-check full`). Runs the static checks plus the commands in the "Full mode" section.

## Collecting package.json data (used by R3 and R5)

Run once from the repo root:

```bash
node -e 'const fs=require("fs");if(!fs.existsSync("package.json")){console.log("NO_PACKAGE_JSON");process.exit(0)}const p=JSON.parse(fs.readFileSync("package.json","utf8"));console.log("SCRIPTS "+JSON.stringify(Object.keys(p.scripts??{})));for(const g of ["dependencies","devDependencies","peerDependencies","optionalDependencies"])for(const n of Object.keys(p[g]??{}))console.log("DEP "+g+" "+n)'
```

- `NO_PACKAGE_JSON` means `package.json` is missing. R3 and R5 then report the file as missing.
- `SCRIPTS [...]` lists the script names.
- `DEP <group> <name>` lines list every declared dependency.

## Checks

| ID | File | What must be true | How to check | Result |
|---|---|---|---|---|
| R1 | `src/app/api/checkout/route.ts` | The file exists and exports a `POST` handler (`POST /api/checkout`) | Glob for the file, then Grep it for `export\s+(async\s+)?function\s+POST\b` or `export\s+const\s+POST\b` | ❌ if the file is missing or has no `POST` export |
| R2 | `src/app/api/products/route.ts` | The file exists and exports a `GET` handler (`GET /api/products`) | Same as R1 with `GET` | ❌ if the file is missing or has no `GET` export |
| R3 | `package.json` | `scripts` has **exactly** the keys `dev`, `build`, `test:ci` and nothing else | `SCRIPTS` line from the command above | ❌ name every missing key and every extra key |
| R4 | `src/lib/pricing.ts` | The file exists and is not empty | Glob, then Read | ❌ if missing or empty |
| R5 | `package.json` | No forbidden dependency in `dependencies`, `devDependencies`, `peerDependencies` or `optionalDependencies` | `DEP` lines, matched against the lists below | ❌ for each denylisted package (name its group and category); ⚠️ for each package not on the allowlist |

### R5 denylist (❌)

A name matches if it equals an entry, or starts with a scope entry that ends in `/*`.

| Category | Packages | Requirement |
|---|---|---|
| DB / ORM / persistence | `prisma`, `@prisma/*`, `pg`, `postgres`, `mysql`, `mysql2`, `sqlite3`, `better-sqlite3`, `mongodb`, `mongoose`, `typeorm`, `sequelize`, `knex`, `drizzle-orm`, `@supabase/*`, `firebase`, `firebase-admin`, `redis`, `ioredis`, `@vercel/postgres`, `@vercel/kv`, `@neondatabase/*`, `@planetscale/*`, `lowdb` | Stack: "no database dependency, ever" |
| Tailwind | `tailwindcss`, `@tailwindcss/*` | Design: "no Tailwind" |
| UI / component libraries | `@mui/*`, `@chakra-ui/*`, `antd`, `@mantine/*`, `@radix-ui/*`, `@headlessui/*`, `react-bootstrap`, `bootstrap`, `@nextui-org/*`, `@heroui/*` | Design: "no UI/component library" |
| CSS-in-JS | `styled-components`, `@emotion/*`, `@stitches/*`, `@vanilla-extract/*`, `@pandacss/*` | Design: "no CSS-in-JS package" |
| Auth / external services | `next-auth`, `@auth/*`, `@clerk/*`, `@auth0/*`, `passport`, `lucia`, `@kinde-oss/*` | Constraints: "no auth providers, no external services" |

### R5 allowlist

`next`, `react`, `react-dom`, `typescript`, `@types/node`, `@types/react`, `@types/react-dom`, `vitest`.

Any other package that is not denylisted gets ⚠️ "not in the agreed dependency list (docs/PLAN.md §1). Confirm it is needed."

## Stage awareness

If `docs/PLAN.md` exists, read the `Status:` line of each stage. When a check fails because its **file is missing** and that file's stage is not `✅ Done`, report `⏳ pending (stage N)` instead of ❌.

| Check | Stage |
|---|---|
| R3, R4, R5 | 1 |
| R2 | 2 |
| R1 | 3 |

Wrong content in a file that exists is always ❌, whatever the stage. If `docs/PLAN.md` does not exist, every missing file is ❌.

## Full mode

1. If `node_modules/` does not exist, report `❌ dependencies not installed — run npm install` under `Commands` and skip the commands. Do not install.
2. Otherwise run `npm run test:ci`, then `npm run build`. Report each command's exit code. On failure, include the last ~15 lines of its output.
3. Never start the dev server.

## Report format

Group findings by file, ordered by path. Each file appears once with all its findings. In full mode, add a `Commands` group at the end. Finish with the totals line.

```markdown
# Requirements check — mode: static

## package.json
- ✅ R3 scripts are exactly dev, build, test:ci
- ❌ R5 forbidden dependency `tailwindcss` (devDependencies, Tailwind) — REQUIREMENTS › Design
- ⚠️ R5 `zod` is not in the agreed dependency list

## src/app/api/checkout/route.ts
- ⏳ R1 pending (stage 3) — POST /api/checkout

## src/app/api/products/route.ts
- ✅ R2 exports GET

## src/lib/pricing.ts
- ✅ R4 exists

## Commands
- ✅ npm run test:ci
- ❌ npm run build (exit 1)
  <last output lines>

**Summary:** 3 ✅ · 1 ❌ · 1 ⚠️ · 1 ⏳
```

The `Commands` group appears in full mode only.
