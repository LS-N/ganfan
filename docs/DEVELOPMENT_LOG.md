# Development Log

This document is the reusable development log template for the Ganfan project. It records what happened during each development window and turns operational lessons into a repeatable process for future projects.

## How This Log Is Used

- The 09:00 and 17:00 Codex automations must append one entry to this file every time they run.
- Every entry must start with a local timestamp in the heading: `YYYY-MM-DD HH:mm - Session name`.
- Each entry should be factual and short: goal, work done, result, problems, fixes, and next step.
- If no code changed, the automation still records the repository state and the reason no code commit was made.
- If checks fail, the automation records the failing command and should not push unsafe code.
- Lessons that apply to future projects should be written in the "Reusable lesson" field.

## Entry Template

```text
## YYYY-MM-DD HH:mm - Automation or work session name

- Goal:
- Work done:
- Result:
- Problems:
- Fixes:
- Checks:
- Git/GitHub:
- Next step:
- Reusable lesson:
```

## Reusable Development Principles

- Keep product stage visible before coding: current stage, allowed work, blocked work, and next checkpoint must be documented.
- Separate engineering entry from business development. Do not build full business loops before PRD V1 and prototype confirmation.
- Prefer small commits that create clean baselines before larger feature work.
- Do not commit secrets, `.env` files, `node_modules`, build outputs, or generated local caches.
- Run local checks before pushing when dependencies are available: lint, typecheck, and tests.
- If a task depends on external accounts, devices, or GitHub Secrets, record it as a blocker instead of pretending it is done.

## Log Entries

## 2026-04-27 - Initial engineering entry setup

- Goal: Prepare the Ganfan repository for continuous mobile development.
- Work done: Fixed GitHub proxy access, cleaned local/remote project tree alignment, installed dependencies, added Expo Router entry, connected five page shell routes, added project status documentation, added ESLint flat config, and pushed the engineering entry baseline.
- Result: Local `main` and `origin/main` are aligned. `npm run lint`, `npm run typecheck`, `npm test`, and `npx expo config --type public` pass. `npm start` reaches Expo Metro Bundler locally.
- Problems: Git was initially configured to use an unavailable `127.0.0.1:7897` proxy; the repo also had a duplicated nested seed-package directory; TypeScript lacked React type declarations; ESLint had no flat config for the installed ESLint version.
- Fixes: Switched GitHub Git proxy to `127.0.0.1:7890`, synchronized local `main` from `origin/main`, removed local-only duplicate directory residue, installed `@types/react`, added `eslint.config.mjs`, and committed the MVP 0.0 engineering baseline.
- Checks: `npm run lint` passed; `npm run typecheck` passed; `npm test` passed; Expo config loads but still contains placeholder `YOUR_PROJECT_ID`.
- Git/GitHub: Pushed `f1d1f5b chore: complete mvp0 engineering entry` to `main`.
- Next step: Verify Android preview on a device/emulator, configure Expo project ID and `EXPO_TOKEN`, then verify GitHub CI and EAS preview update.
- Reusable lesson: A project needs an explicit status/control document before feature work; otherwise the team can have many docs but still no visible execution plan.
