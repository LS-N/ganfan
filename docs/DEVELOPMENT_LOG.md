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

## 2026-04-30 17:03 - 17:00 automation run

- Goal: Perform a conservative GitHub sync, record repository health, and only publish safe verified changes.
- Work done: Inspected `git status`, branch, `origin`, upstream tracking, and recent commits; reviewed `docs/PROJECT_STATUS.md`; attempted `git fetch --prune`; scanned the changed Markdown files for likely secret strings; ran `npm.cmd run lint`, `npm.cmd run typecheck`, and `npm.cmd run test`.
- Result: Repository remains on `main` tracking `origin/main` with 13 pending documentation updates; local lint, typecheck, and test checks passed, but Git cannot stage/commit from this sandbox.
- Problems: `git fetch --prune` reports `error: cannot open '.git/FETCH_HEAD': Permission denied`, and `git add` fails with `fatal: Unable to create 'F:/ganfan/.git/index.lock': Permission denied`, so remote sync and commits are blocked from this environment.
- Fixes: No permission/ACL changes were applied during this automation run; only recorded the blocker and validated local checks.
- Checks: `npm.cmd run lint` passed; `npm.cmd run typecheck` passed; `npm.cmd run test` passed with `No tests found`; no `.env`, keys, tokens, certificates, build outputs, or caches were detected in the staged change set.
- Git/GitHub: Branch is `main` (upstream `origin/main`), remote is `origin https://github.com/LS-N/ganfan.git`; current HEAD is `a0f0d4e` and working tree remains dirty with documentation changes because staging/commit is blocked by `.git` write permissions.
- Next step: Commit and push the pending documentation updates; then resolve the `.git/FETCH_HEAD` permission issue so `git fetch/pull` is reliable in future automations.
- Reusable lesson: Treat Git metadata write failures as first-class automation blockers; log them early so sync/CI outcomes are not misattributed to code changes.

## 2026-05-06 17:50 - 17:00 automation run

- Goal: Perform a conservative GitHub sync, record repository health, and publish only verified safe changes.
- Work done: Inspected `git status`, current branch, `origin`, recent commits, and `docs/PROJECT_STATUS.md`; ran `npm.cmd run lint`, `npm.cmd run typecheck`, and `npm.cmd run test`; attempted `git fetch --prune` and `git add -A`.
- Result: Local lint, typecheck, and test checks passed; working tree remains dirty with pending doc + app changes, and no commit/push was possible from this environment.
- Problems: `git fetch --prune` failed with `error: cannot open '.git/FETCH_HEAD': Permission denied`; staging failed with `fatal: Unable to create 'F:/ganfan/.git/index.lock': Permission denied`.
- Fixes: None applied in this run; recorded the Git sandbox permission blocker.
- Checks: `npm.cmd run lint` passed; `npm.cmd run typecheck` passed; `npm.cmd run test` passed with `No tests found`.
- Git/GitHub: On `main` tracking `origin/main` at `a0f0d4e`; `origin` is `https://github.com/LS-N/ganfan.git`; fetch/stage/commit/push blocked by `.git` write permissions.
- Next step: Run the same commit/push from an environment that can write `.git` (or adjust sandbox/ACL) to publish the current verified changeset.
- Reusable lesson: In automations, test `.git` writeability early; when blocked, still run app checks and keep the dev log as the source of truth.

## 2026-05-07 17:04 - 17:00 automation run

- Goal: Perform a conservative GitHub sync, record repository health, and publish only safe verified changes.
- Work done: Inspected `git status`, current branch, `origin`, recent commits, and `docs/PROJECT_STATUS.md`; ran `npm.cmd run lint` and `npm.cmd run typecheck`; attempted `npm.cmd test`; attempted `git add -- docs/DEVELOPMENT_LOG.md`.
- Result: Lint and typecheck passed; tests failed to execute in this environment; no staging/commit/push was possible from this sandbox.
- Problems: `npm.cmd test` failed with `spawn EPERM` (Jest cannot spawn worker processes); `git add` failed with `fatal: Unable to create 'F:/ganfan/.git/index.lock': Permission denied`.
- Fixes: None applied in this run; recorded the environment limitations instead of bypassing checks.
- Checks: `npm.cmd run lint` passed; `npm.cmd run typecheck` passed; `npm.cmd test` failed with `spawn EPERM`.
- Git/GitHub: On `main` tracking `origin/main` at `a0f0d4e`; working tree contains many pending changes; staging/commit/push blocked by `.git` write restrictions in this environment.
- Next step: Re-run `npm test` in a local environment that allows process spawning (or configure Jest to `--runInBand` for this runner) and then stage/commit/push the pending safe change set.
- Reusable lesson: Treat sandbox limitations (process spawn, `.git` write locks) as first-class blockers; never mark checks as passed when the runner cannot execute them.

## 2026-05-10 19:11 - 09:00 automation run

- Goal: Perform a conservative GitHub sync, record repository health, and publish only verified safe changes.
- Work done: Inspected `git status`, current branch and upstream, `origin` remote, recent commits, and `docs/PROJECT_STATUS.md`; enumerated untracked files; scanned the repo for obvious secret patterns (`EXPO_TOKEN`, Supabase, OpenAI key markers) and found only documented references (no actual secrets).
- Result: Repo is on `main` tracking `origin/main` at `a0f0d4e` with a large pending change set (docs + app code + prototypes); checks are not fully green because lint currently fails in this environment.
- Problems: `npm.cmd run lint` fails because ESLint traverses `.claude/worktrees/**` and hits a `tsconfigRootDir` ambiguity when multiple TS config roots exist.
- Fixes: No code/config changes applied in this automation run; recorded the lint failure and its root cause instead of bypassing checks.
- Checks: `npm.cmd run lint` failed (`No tsconfigRootDir was set ... multiple candidate TSConfigRootDirs`); `npm.cmd run typecheck` passed; `npm.cmd test` passed (`No tests found, exiting with code 0`).
- Git/GitHub: Branch `main` upstream `origin/main`; remote `origin` is `https://github.com/LS-N/ganfan.git`; due to lint failure, this run should only commit/push the development log (if Git staging is possible) and avoid publishing the broader pending change set.
- Next step: Update lint configuration to ignore `.claude/` (or set an explicit `tsconfigRootDir`), rerun lint to green, then stage/commit/push the pending app + docs changes from a Git environment that can write `.git`.
- Reusable lesson: When a repo contains tool worktrees (`.claude/`, etc.), lint should explicitly ignore them; otherwise automation checks will fail even if product code is healthy.

## 2026-05-10 19:11 - 17:00 automation run

- Goal: Perform a conservative GitHub sync, record repository health, and publish only verified safe changes.
- Work done: Inspected `git status`, current branch (`main`), upstream (`origin/main`), `origin` remote, and recent commits; reviewed `docs/PROJECT_STATUS.md`; enumerated changed/untracked files; ran `npm.cmd run lint`, `npm.cmd run typecheck`, and `npm.cmd test`.
- Result: Typecheck passed; tests exited 0 (no tests found) but reported a `.claude` haste collision; lint failed, so no staging/commit/push was performed.
- Problems: `npm.cmd run lint` fails with `@typescript-eslint/parser` error about multiple `TSConfigRootDir` candidates caused by `.claude/worktrees/*` being inside the repo; repository has a large dirty working tree including untracked `.claude/` and `.netlify-publish/` paths that should not be committed.
- Fixes: None in this run; only recorded the failure and current repo state.
- Checks: `npm.cmd run lint` failed (tsconfigRootDir ambiguity); `npm.cmd run typecheck` passed; `npm.cmd test` exited 0 with `jest-haste-map` naming collision warning referencing `.claude/worktrees/*/package.json`.
- Git/GitHub: On `main` tracking `origin/main` at `a0f0d4e`; working tree has modified tracked files (docs + app) and many untracked prototype/backups; no commit created; no push attempted.
- Next step: Decide whether to (a) remove `.claude/worktrees/*` from the repo working directory, or (b) add ignores (ESLint + Jest) so local tooling does not traverse `.claude/`; then rerun `npm.cmd run lint` and commit/push the intended changeset excluding local caches/backups.
- Reusable lesson: Keep tool worktrees/caches out of the repo tree (or explicitly ignore them) to prevent lint/test false failures and to keep automated sync conservative.

## 2026-05-11 09:43 - 09:00 automation run

- Goal: Perform a conservative GitHub sync, record repository health, and publish only verified safe changes.
- Work done: Inspected `git status`, current branch and upstream, `origin` remote, and recent commits; reviewed `docs/PROJECT_STATUS.md`; enumerated untracked files; ran `npm.cmd run lint`, `npm.cmd run typecheck`, and `npm.cmd test`.
- Result: Repo remains on `claude/meal-agent-ux-improvements` tracking `origin/claude/meal-agent-ux-improvements` at `ca3abb6` with a large pending change set; lint is not green due to `.claude/worktrees/**` traversal; staging/commit/push is blocked in this environment.
- Problems: `npm.cmd run lint` fails because ESLint traverses `.claude/worktrees/**` and hits a `tsconfigRootDir` ambiguity when multiple TS config roots exist; `git add` fails with `fatal: Unable to create 'F:/ganfan/.git/index.lock': Permission denied`; `git push` fails with `schannel: AcquireCredentialsHandle failed: SEC_E_NO_CREDENTIALS`.
- Fixes: No code/config changes applied in this automation run; recorded the lint failure and its root cause instead of bypassing checks.
- Checks: `npm.cmd run lint` failed (`No tsconfigRootDir was set ... multiple candidate TSConfigRootDirs`); `npm.cmd run typecheck` passed; `npm.cmd test` passed (`No tests found, exiting with code 0`).
- Git/GitHub: Due to lint failure, stage/commit/push should be limited to `docs/DEVELOPMENT_LOG.md` only; however this run could not stage/commit/push because `.git/index.lock` cannot be created and the runner lacks GitHub credentials.
- Next step: Update lint configuration to ignore `.claude/` (or set an explicit `tsconfigRootDir`), rerun lint to green, then stage/commit/push the intended changeset excluding `.claude/`, `.netlify-publish/`, and prototype backup outputs.
- Reusable lesson: When a repo contains tool worktrees (`.claude/`, etc.), lint/test should explicitly ignore them; otherwise automation checks will fail even if product code is healthy.

## 2026-05-11 17:05 - 17:00 automation run

- Goal: Perform a conservative GitHub sync on `claude/meal-agent-ux-improvements`, record repository health, and publish only verified safe changes (preferably just this log if checks fail).
- Work done: Inspected `git status`, branch/upstream, `origin` remote, and recent commits; reviewed `docs/PROJECT_STATUS.md`; enumerated modified/untracked files; ran `npm.cmd run lint`, `npm.cmd run typecheck`, and `npm.cmd test`.
- Result: Repo is still on `claude/meal-agent-ux-improvements` tracking `origin/claude/meal-agent-ux-improvements` at `ca3abb6` with a large pending change set; typecheck and tests pass, but lint is not green due to `.claude/worktrees/**` traversal; staging/commit/push is blocked in this environment.
- Problems: `npm.cmd run lint` fails with `@typescript-eslint/parser` complaining `No tsconfigRootDir was set` because multiple TS config roots are detected (repo root + `.claude/worktrees/*`); `git add` fails with `fatal: Unable to create 'F:/ganfan/.git/index.lock': Permission denied`; `git push` fails with `schannel: AcquireCredentialsHandle failed: SEC_E_NO_CREDENTIALS`.
- Fixes: No code/config changes applied in this run; kept sync conservative by recording the failure and avoiding staging/pushing the broader changeset.
- Checks: `npm.cmd run lint` failed (tsconfigRootDir ambiguity); `npm.cmd run typecheck` passed; `npm.cmd test` exited 0 (`No tests found`).
- Git/GitHub: Branch `claude/meal-agent-ux-improvements` upstream `origin/claude/meal-agent-ux-improvements`; attempted to stage/commit/push only `docs/DEVELOPMENT_LOG.md`, but Git metadata writes (`.git/index.lock`) and GitHub auth are not available in this runner.
- Next step: Decide on the repo policy for `.claude/` (remove from repo tree vs ignore in ESLint/Jest), fix lint to green, then stage/commit/push the intended change set excluding tool caches and backup outputs.
- Reusable lesson: Tool worktrees inside the repo (`.claude/worktrees/**`) can poison automated checks; proactively exclude them from lint/test globs to keep CI-like checks meaningful.

## 2026-05-12 10:12 - 09:00 automation run

- Goal: Perform a conservative GitHub sync on `claude/meal-agent-ux-improvements`, verify repo health with safe checks, and publish only verified safe changes.
- Work done: Inspected `git status`, branch/upstream, `origin` remote, and recent commits; reviewed `docs/PROJECT_STATUS.md`; enumerated modified/untracked paths; ran `npm.cmd run lint`, `npm.cmd run typecheck`, and `npm.cmd test`.
- Result: Typecheck and tests pass, but lint is not green due to `.claude/worktrees/**` traversal; to keep the sync conservative, only `docs/DEVELOPMENT_LOG.md` is eligible for staging/commit in this run.
- Problems: `npm.cmd run lint` fails with `@typescript-eslint/parser` error `No tsconfigRootDir was set` because multiple TS config roots are detected (repo root + `.claude/worktrees/*`); untracked `.netlify-publish/` and prototype backup outputs exist and must not be committed.
- Fixes: None applied in this run (no config changes); recorded the exact failure mode and current repository state.
- Checks: `npm.cmd run lint` failed (tsconfigRootDir ambiguity); `npm.cmd run typecheck` passed; `npm.cmd test` exited 0 (`No tests found, exiting with code 0`).
- Git/GitHub: Branch `claude/meal-agent-ux-improvements` upstream `origin/claude/meal-agent-ux-improvements`; attempted to stage only `docs/DEVELOPMENT_LOG.md`, but `git add` failed with `fatal: Unable to create 'F:/ganfan/.git/index.lock': Permission denied`, so no commit/push was created.
- Next step: Update tooling config so ESLint/Jest ignore `.claude/` (or set an explicit `tsconfigRootDir`), then rerun lint to green and commit/push the intended changeset excluding `.claude/`, `.netlify-publish/`, and backup outputs.
- Reusable lesson: Keep tool worktrees/caches out of the repo tree (or explicitly ignore them) so local checks reflect product code health and automation can safely sync.

## 2026-05-13 17:03 - 17:00 automation run

- Goal: Perform a conservative GitHub sync on `codex/V0.1`, verify repo health with safe checks, and publish only verified changes (excluding secrets, caches, and backup outputs).
- Work done: Inspected `git status`, current branch, `origin` remote, recent commits, and `docs/PROJECT_STATUS.md`; verified `node_modules` presence; ran `npm.cmd run lint`, `npm.cmd run typecheck`, and `npm.cmd test`.
- Result: Lint, typecheck, and tests are green in this environment; staging/commit/push could not be performed due to `.git` write restrictions, so no GitHub sync was published.
- Problems: `git add` fails with `fatal: Unable to create 'F:/ganfan/.git/index.lock': Permission denied` (cannot write `.git`); branch `codex/V0.1` has no upstream configured; untracked backup directories exist (must remain uncommitted).
- Fixes: Used `npm.cmd` / `cmd /c npm ...` to bypass PowerShell `npm.ps1` execution policy; no changes applied to Git permissions or upstream configuration in this run.
- Checks: `npm.cmd run lint` passed; `npm.cmd run typecheck` passed; `npm.cmd run test` passed (`No tests found`).
- Git/GitHub: Branch `codex/V0.1`; no upstream configured; `origin` is `https://github.com/LS-N/ganfan.git`; HEAD at `ca3abb6` (also `origin/claude/meal-agent-ux-improvements`); staging is blocked by `.git` write permissions.
- Next step: Run stage/commit/push from an environment that can write `.git` and has GitHub credentials; when pushing, decide whether to publish `codex/V0.1` (set upstream with `git push -u origin codex/V0.1`) or fast-forward/merge into the intended remote branch.
- Reusable lesson: On Windows with restricted PowerShell policies, prefer `npm.cmd` (or `cmd /c npm ...`) to reliably run checks in automations.

## 2026-05-14 17:03 - 17:00 automation run

- Goal: Perform a conservative GitHub sync on `codex/V0.1`, verify repo health with safe checks, and publish only verified changes (excluding secrets, env files, caches, and backup outputs).
- Work done: Inspected `git status`, current branch/upstream, `origin` remote, and recent commits; reviewed `docs/PROJECT_STATUS.md`; confirmed `package.json` + `node_modules` presence; ran `npm.cmd run lint`, `npm.cmd run typecheck`, and `npm.cmd test`.
- Result: Lint, typecheck, and tests are green in this environment; repo has multiple modified/untracked paths, but this automation did not change any project files besides this log entry.
- Problems: PowerShell blocks `npm.ps1` due to execution policy (used `npm.cmd` instead); branch `codex/V0.1` still has no upstream configured; untracked cache/backup-like paths exist (e.g. `services/ai/nutrition/__pycache__/`) and must not be committed.
- Fixes: None applied in this run (kept conservative); used `npm.cmd` to bypass PowerShell script execution policy for checks.
- Checks: `npm.cmd run lint` passed; `npm.cmd run typecheck` passed; `npm.cmd test` passed (7 suites, 12 tests).
- Git/GitHub: No upstream configured for `codex/V0.1`; `origin` is `https://github.com/LS-N/ganfan.git`; attempted to stage/commit only `docs/DEVELOPMENT_LOG.md`, but Git metadata writes failed with `fatal: Unable to create 'F:/ganfan/.git/index.lock': Permission denied`, so no commit SHA or push was produced.
- Next step: From a fully-permissioned environment, review the pending changeset, ensure secrets/caches/backups are excluded, then decide whether to publish `codex/V0.1` by setting upstream (`git push -u origin codex/V0.1`) or to merge/rebase into the intended remote branch before pushing.
- Reusable lesson: On Windows automations, call `npm.cmd` (not `npm`) to avoid PowerShell execution policy issues with `npm.ps1`.

## 2026-05-16 09:02 - 09:00 automation run

- Goal: Conservative GitHub sync on `codex/V0.1` with safe checks, then publish only verified changes (excluding secrets/env/keys/caches/build outputs).
- Work done: Inspected `git status`, branch/upstream, `origin` remote, and recent commits; reviewed `docs/PROJECT_STATUS.md`; confirmed `node_modules` present; ran `npm run lint`, `npm run typecheck`, and `npm test`.
- Result: Lint/typecheck/tests are green; working tree contains many modified tracked files plus multiple untracked paths (including cache-like folders and an Android debug keystore) requiring careful staging.
- Problems: Untracked paths include items that must never be committed (e.g. `android/app/debug.keystore`, `services/ai/**/__pycache__/`, `.tmp/`).
- Fixes: None applied in this run (kept conservative); only this log entry was authored by the automation.
- Checks: `npm run lint` PASS; `npm run typecheck` PASS; `npm test` PASS (9 suites / 19 tests).
- Git/GitHub: Branch `codex/V0.1` tracking `origin/codex/V0.1`; `origin` is `https://github.com/LS-N/ganfan.git`; commit/push outcome recorded by this run after staging decisions.
- Next step: Decide whether to publish the full pending tracked changeset now, or to commit only the log entry and leave the rest for an explicit reviewed PR.
- Reusable lesson: Treat untracked artifacts as hostile by default; whitelist only intended source/docs changes for automated commits.

## 2026-05-16 17:02 - 17:00 automation run

- Goal: Perform a conservative GitHub sync on `codex/V0.1`, verify repo health with safe checks, and publish only verified changes (excluding secrets/env/keys/caches/build outputs).
- Work done: Inspected `git status`, current branch/upstream, `origin` remote, and recent commits; reviewed `docs/PROJECT_STATUS.md`; confirmed `node_modules` presence; ran `npm.cmd run lint`, `npm.cmd run typecheck`, and `npm.cmd test`; reviewed untracked list for forbidden artifacts.
- Result: Lint/typecheck/tests are green; repo has many untracked paths, so this automation only stages the development log entry for a safe sync.
- Problems: Working tree contains untracked items that must not be committed (notably `android/app/debug.keystore`, `services/ai/**/__pycache__/`, `.tmp/` and various screenshots).
- Fixes: None applied (kept conservative); no staging performed for untracked artifacts.
- Checks: `npm.cmd run lint` PASS; `npm.cmd run typecheck` PASS; `npm.cmd test` PASS (9 suites / 19 tests).
- Git/GitHub: Branch `codex/V0.1` tracking `origin/codex/V0.1`; HEAD `e1d5678`; plan is to commit only `docs/DEVELOPMENT_LOG.md` and push to upstream without force-push.
- Next step: Manually review the pending untracked set; decide which are intended to be added, and add `.gitignore` entries (e.g. `__pycache__/`, `.tmp/`, screenshots) in a separate reviewed change.
- Reusable lesson: When the repo has mixed “real work” + local artifacts, automated commits should be restricted to docs/logs until staging rules are explicitly codified.
