# Ganfan Release Operations

Release operations use the project-level wrapper:

```powershell
.\scripts\release.ps1 -Version v1.2.3
```

The wrapper:

1. validates the tag format
2. runs `scripts/preflight.ps1`
3. requires a clean working tree
4. creates an annotated Git tag if missing
5. pushes the tag unless `-NoPush` is passed

## Boundaries

This release wrapper does not:

- run EAS Update
- build Android or iOS packages
- publish to app stores
- change Supabase resources
- call real AI providers

Any mobile package build, hot update, database change, or production resource action needs its own explicitly approved task and verification record.
