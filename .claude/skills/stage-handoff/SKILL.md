---
name: stage-handoff
description: Receive and hand off work between staged implementation agents via docs/HANDOFF.md and the checkboxes in docs/PLAN.md. Use at the START of a stage session (to find the current stage and load context) and at the END of a stage (to record results and pass work to the next agent), including when the stage is blocked.
---

# Stage handoff

Progress in this repo is tracked by two files together:

- **`docs/PLAN.md`**: every task and acceptance check is a checkbox (`- [ ]` / `- [x]`). Every stage has a status line: `Status: ⬜ Not started`, `🟡 Blocked` or `✅ Done`.
- **`docs/HANDOFF.md`**: a **single** file, overwritten at the end of each stage. It describes the last stage worked on and what the next agent needs. It does not exist until stage 1 ends.

Never create other handoff files (no per-stage copies).

## A. Receiving (start of a stage session)

1. Read `docs/HANDOFF.md` if it exists. If it does not, you are on stage 1.
2. In `docs/PLAN.md`, find the first stage whose status is not `✅ Done`. That is your stage.
3. Make sure the two files agree:
   - your stage equals "Next stage" in `docs/HANDOFF.md`;
   - if the handoff says `Blocked`, the same stage is `🟡 Blocked` in the plan.
   
   If they disagree, stop and ask the user.
4. For any stage after stage 1, run `git status`. If the previous stage's files are not committed, stop and ask the user to commit them first. Checks such as `git diff --stat src/lib/pricing.ts` rely on that commit.
5. Read "Open issues" and "Context for the next stage" in the handoff and take them into account.

## B. Handing off (end of a stage)

Do this after you have run every acceptance check of the stage, or as soon as you are blocked.

1. **Update `docs/PLAN.md`.** Change only checkboxes and the status line, never task text.
   - Tick `- [x]` every task you completed and every acceptance check you **actually ran and passed**. Never tick a check you did not run.
   - Set the stage status:
     - `✅ Done` if all checks pass;
     - otherwise `🟡 Blocked`.
2. **Overwrite `docs/HANDOFF.md` entirely** with the template below. Fill every section; write "None" when a section is empty.
   - Carry forward any still-relevant facts from the previous handoff, because it is being replaced.
   - Keep it short and factual. Do not repeat what `docs/PLAN.md` or `docs/REQUIREMENTS.md` already say.
3. Make sure no dev server you started is still running.
4. Do **not** commit or push. **Stop.** Do not start the next stage.
5. In your final message to the user, give:
   - the stage status;
   - a one-line summary;
   - the "Manual check for the user" steps.

## Template: `docs/HANDOFF.md`

```markdown
# Handoff

Last stage: <N> — <stage title>   (Status: Done | Done with open issues | Blocked)
Next stage: <N+1> — <title>   (or "<N> — retry after the blocker is resolved", or "None — project complete")

## What was implemented
- bullet list of features

## Files
Created: ...
Modified: ...

## Verification results
| Check | Command / action | Result |
|---|---|---|
| Build | npm run build | pass/fail (+ short note) |
| Tests | npm run test:ci | pass/fail |
| ... each acceptance check of the stage ... |

## Deviations from the plan
- what differed and why (or "None")

## Open issues
- anything unresolved, including blockers and any needed change to a sensitive module (or "None")

## Context for the next stage
- only facts the next agent needs that are not in PLAN.md
  (e.g. exact installed Next.js version, dev-server port, tsconfig changes made by Next)

## Manual check for the user
1. step-by-step instructions to verify this stage by hand
```
