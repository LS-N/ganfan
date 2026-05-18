# Project Status

## Current Authority

The complete implementation blueprint is now the single source of truth:

```text
docs/02-master-blueprint.md
```

All phase development documents and acceptance documents are derived from that blueprint.

## Current Documentation Structure

```text
docs/00-INDEX.md
docs/01-ai-working-manual.md
docs/02-master-blueprint.md
docs/phases/
docs/acceptance/
docs/prototype/
```

Older temporary phase docs and pre-restructure planning docs are archived under:

```text
_archive/
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

Before implementing blueprint stages, confirm whether the next task requires:

- Migrating from root Expo App to `apps/mobile`.
- Introducing `services/ai` FastAPI.
- Introducing `supabase/migrations`.
- Adding native dependencies such as `expo-sqlite`, `expo-camera`, `expo-image-manipulator`, and `expo-notifications`.
- Connecting real Supabase, AI endpoint, or deployment secrets.

## Commands

```powershell
npm install
npm run lint
npm run typecheck
npm test
npm run web
```
