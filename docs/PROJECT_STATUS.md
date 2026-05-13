# Project Status

## Current Stage

Current stage: workspace governance and full-plan alignment.

The repository previously contained conflicting execution entry points:

- Older MVP 0.0 / MVP 0.1 engineering-entry docs.
- A lightweight Phase 1 / Phase 2 mock-first plan.
- The complete implementation plan generated in a Claude worktree.

The complete implementation plan is now the authority:

```text
docs/06-long-term-blueprint.md
```

The current phase entry is:

```text
docs/01-current-phase.md
```

## Unique Workspace

Formal development must happen only in:

```text
F:\ganfan
```

The following paths are tool worktrees or caches and must not be used as the project root:

```text
F:\ganfan\.claude\worktrees\*
C:\Users\a\.codex\worktrees\*
```

## Current Decision State

The project must pause further feature expansion until these decisions are made:

- Whether to migrate from root Expo App to `apps/mobile`.
- Whether to introduce `services/ai` FastAPI now.
- Whether to introduce `supabase/migrations` now.
- Whether to add native dependencies such as `expo-sqlite`, `expo-camera`, `expo-image-manipulator`, and `expo-notifications`.
- How to split and preserve the already-created lightweight Phase 1 / Phase 2 code.

## Working Tree State

The working tree currently contains mixed changes:

- Workspace governance docs.
- Lightweight Phase 1 app code.
- Early Phase 2 service/test code.
- Historical docs and prototype backup changes.

Do not run `git add .`.

Future commits should be split by intent:

1. Workspace governance and authority-doc alignment.
2. Preserved Phase 1 app code, if accepted.
3. Phase 2 service/test code, if accepted.
4. Historical docs/prototype archives, only if intentionally needed.

## Commands

```powershell
npm install
npm run lint
npm run typecheck
npm test
npm run web
```

## Current Blockers

- Authority docs must be committed before more development.
- The current code path must be reconciled with the full implementation plan.
- `.claude/` and other tool/cache paths must remain ignored by tooling and Git.

