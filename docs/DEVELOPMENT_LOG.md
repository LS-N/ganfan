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

## 2026-04-28 00:10 - External validation pass

- Goal: Verify external readiness items before moving toward MVP 0.1 development.
- Work done: Checked Android SDK and AVD availability, attempted Android preview through Expo, checked EAS login state, checked GitHub Actions status through GitHub API, ran Expo dependency health checks, and fixed Expo SDK dependency mismatches.
- Result: GitHub CI is verified as successful on recent `main` pushes. `expo-doctor` now passes 18/18 checks. Local lint, typecheck, and test pass after dependency fixes.
- Problems: Android preview did not complete because the emulator became unavailable between attempts and Expo Go download failed once with `read ECONNRESET`. EAS CLI reports `Not logged in`, so Expo Project ID and EAS Update validation cannot be completed from this machine yet.
- Fixes: Installed Expo Router peer dependencies, aligned React Native/React/Jest dependency versions with Expo SDK expectations, added `react-dom@19.2.0`, and reran dependency checks until `expo-doctor` passed.
- Checks: `npx expo-doctor` passed; `npm run lint` passed; `npm run typecheck` passed; `npm test` passed.
- Git/GitHub: Local dependency files are modified and need a commit after final verification. GitHub Actions CI is reachable and recent runs are successful.
- Next step: Log in to Expo/EAS or provide Expo project ID and `EXPO_TOKEN`; connect a stable Android device/emulator and rerun Android preview verification.
- Reusable lesson: External readiness should be split into local-fixable issues and account/device blockers; fix dependency health locally, but record account/device blockers explicitly instead of masking them as completed.

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

## 2026-04-28 09:27 - 09:00 automation run

- Goal: Perform a conservative GitHub sync, record repository health, and only publish safe verified changes.
- Work done: Inspected `git status`, branch, `origin`, recent commits, `docs/PROJECT_STATUS.md`, changed-file diffs, and existing development log entries; confirmed only documentation and dependency manifest files are modified; retried local checks with `npm.cmd` after PowerShell blocked `npm.ps1`.
- Result: Repository is on `main` tracking `origin/main` with safe pending changes in `README.md`, `docs/PROJECT_STATUS.md`, `package.json`, `package-lock.json`, and this log; local lint, typecheck, and test checks passed.
- Problems: PowerShell execution policy blocked `npm run lint`, `npm run typecheck`, and `npm test` through `npm.ps1`; Android preview and EAS preview update remain unverified blockers from project status.
- Fixes: Used `npm.cmd run lint`, `npm.cmd run typecheck`, and `npm.cmd test` to complete the same checks without changing system policy; recorded current blockers instead of expanding scope.
- Checks: `npm.cmd run lint` passed; `npm.cmd run typecheck` passed; `npm.cmd test` passed with `jest --passWithNoTests`; no secrets, `.env`, certificates, build outputs, or local caches were found in the pending changes.
- Git/GitHub: Pending branch is `main` with remote `origin https://github.com/LS-N/ganfan.git`; recent commits are `8ecea34 docs: require timestamps in development log`, `529d209 docs: add development log workflow`, and `f1d1f5b chore: complete mvp0 engineering entry`; next action is to commit and push this verified change set.
- Next step: Commit the current safe docs and dependency updates, then continue with Android preview verification, Expo project ID replacement, Expo/EAS login, and EAS preview validation.
- Reusable lesson: On locked-down Windows shells, treat `npm.ps1` execution-policy failures as environment entry issues first; rerun the same package checks via `npm.cmd` and log the distinction clearly.
