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

## 2026-04-28 15:45 - Move Android device validation to backlog

- Goal: Unblock development while keeping Android preview validation visible.
- Work done: Reclassified Android device/emulator preview and preview OTA receipt as backlog items instead of blocking all next work.
- Result: The project can move into MVP 0.1 specification preparation while keeping device validation as a tracked follow-up.
- Problems: Android device/emulator validation still requires a stable physical device or emulator session.
- Fixes: Updated `docs/PROJECT_STATUS.md` to show MVP 0.1 specification preparation as the current stage and moved device validation to explicit backlog items.
- Checks: Documentation-only change; no runtime checks required before review.
- Git/GitHub: Pending documentation update.
- Next step: Fill MVP 0.1 PRD V1 before coding business flows.
- Reusable lesson: Do not let device-only validation disappear, but do not block product/spec work on a local hardware issue when CI and OTA publishing are already verified.

## 2026-04-28 15:39 - GitHub Actions preview update verified

- Goal: Verify that pushing to `dev` triggers GitHub Actions CI and EAS preview update.
- Work done: Confirmed `EXPO_TOKEN` was available under the expected secret name, pushed current `main` to `dev`, waited for both workflows, and checked recent EAS update groups.
- Result: CI completed successfully and EAS Preview Update completed successfully from GitHub Actions.
- Problems: Earlier failures were caused by the secret being saved under the wrong name and then by the workflow not receiving a usable `EXPO_TOKEN`.
- Fixes: Added the correctly named `EXPO_TOKEN` secret, kept an explicit auth check in the workflow, and triggered `dev` again.
- Checks: GitHub Actions CI success: `https://github.com/LS-N/ganfan/actions/runs/25040054009`; EAS Preview Update success: `https://github.com/LS-N/ganfan/actions/runs/25040053988`.
- Git/GitHub: `dev` published preview update group `e4268eb5-da01-4fc0-891a-1e0235be73f6` with message `auto preview update from dev`.
- Next step: Verify an Android device or emulator can open the app and receive the preview OTA update.
- Reusable lesson: Secret names are part of the deployment contract. Standardize names like `EXPO_TOKEN`, add a workflow auth preflight, and verify the secret is available before running a deployment command.

## 2026-04-28 14:56 - GitHub EAS token blocker

- Goal: Continue GitHub Actions EAS preview update verification after adding the GitHub secret.
- Work done: Re-triggered `dev` workflow, confirmed CI succeeds, inspected EAS Preview Update job metadata, and added a clearer workflow error when `EXPO_TOKEN` is unavailable.
- Result: CI automation is confirmed. Local EAS preview update is confirmed. GitHub Actions EAS preview update remains blocked before publish because the workflow cannot access a valid `EXPO_TOKEN`.
- Problems: The EAS Preview Update job fails at the `Verify EAS auth` step. Workflow logs cannot be downloaded through the current API credentials because GitHub requires repository admin rights for log download.
- Fixes: Added an explicit token-availability check and actionable error message to `.github/workflows/eas-preview-update.yml`. Removed a temporary failed log download artifact.
- Checks: Pending workflow/documentation changes need local checks before commit.
- Git/GitHub: Latest successful CI on `dev` proves the branch trigger and check pipeline work; EAS deployment is blocked only by auth.
- Next step: Create a valid Expo access token and make it available to the workflow as `EXPO_TOKEN`, then push to `dev` again.
- Reusable lesson: For deployment workflows, add an explicit non-secret auth check before the deploy command; it makes missing secret failures diagnosable without exposing credentials.

## 2026-04-28 09:41 - Expo project link and preview update validation

- Goal: Complete Expo-side setup and verify the EAS preview update path.
- Work done: Logged in to EAS with browser authentication, created and linked the Expo project `@ls-n/ganfan`, configured EAS Update, committed the real Expo project ID and update URL, and published a preview update locally.
- Result: EAS project info resolves successfully. Local preview update published to the `preview` branch for Android and iOS.
- Problems: Initial `eas init` failed because `app.json` still contained the placeholder `YOUR_PROJECT_ID`; the first non-interactive update command required an explicit environment.
- Fixes: Removed the invalid placeholder before running `eas init`, ran `eas update:configure`, and published with `--environment preview`.
- Checks: `npm run lint` passed; `npm run typecheck` passed; `npm test` passed; `npx expo-doctor` passed; local EAS preview update published successfully.
- Git/GitHub: Pushed `25339cc chore: link expo project for updates`. Preview update group ID: `218240fd-80dd-4d1c-a245-ab60b7d6b73b`; dashboard: `https://expo.dev/accounts/ls-n/projects/ganfan/updates/218240fd-80dd-4d1c-a245-ab60b7d6b73b`.
- Next step: Configure GitHub `EXPO_TOKEN`, push to `dev`, and verify the GitHub Actions EAS preview update workflow.
- Reusable lesson: Do not leave fake UUID placeholders in Expo config; EAS treats them as linked projects and fails with UUID errors. Remove placeholders, run `eas init`, then use `eas update:configure`.

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
