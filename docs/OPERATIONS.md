# Ganfan Operations

This project uses shared project operations scripts with a thin project-level adapter.

## Entry Points

Run from the repository root:

```powershell
.\scripts\preflight.ps1
.\scripts\commit-push.ps1
.\scripts\release.ps1 -Version v1.2.3
```

The adapters resolve the shared script root in this order:

1. `project.ops.local.json` -> `projectOpsRoot`
2. `PROJECT_OPS_ROOT`
3. `project.ops.json` -> `projectOpsRootCandidates`

Machine-specific paths and private secret scan terms belong only in `project.ops.local.json`.
That file is ignored and must never be committed.

## Preflight

The ganfan preflight runs:

- shared Git repository check
- shared secret scan against Git-visible files only
- `npm run lint`
- `npm run typecheck`
- `npm test -- --watchAll=false --passWithNoTests`
- a lightweight check that `services/ai/requirements.txt` exists

It does not run EAS, Android/iOS builds, Supabase migrations, true AI provider calls, or real-device checks.

## Safe Commit

`scripts/commit-push.ps1` stages only the pathspecs configured in `project.ops.json`.
This is intentional because the repository may already contain unrelated product or environment changes.

Use `-Pathspec` for a narrower commit when needed.

## Secret Safety

Do not commit:

- `.env`
- passwords, tokens, private keys, or service role keys
- logs
- build output
- installers or packages

Public scan patterns may be committed in `project.ops.json`.
Private local scan terms must stay in `project.ops.local.json`.
