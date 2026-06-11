param(
    [Parameter(Mandatory = $true)]
    [string]$Version,
    [switch]$NoPush
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
$config = Get-Content -LiteralPath (Join-Path $repoRoot "project.ops.json") -Raw | ConvertFrom-Json
$pattern = if ($config.release.tagPattern) { [string]$config.release.tagPattern } else { "^v\d+\.\d+\.\d+$" }
if ($Version -notmatch $pattern) {
    throw "Version must match release tag pattern: $pattern"
}

& (Join-Path $PSScriptRoot "preflight.ps1")
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Push-Location $repoRoot
try {
    $dirty = git status --porcelain
    if ($dirty) {
        throw "Working tree is not clean. Commit or stash changes before releasing."
    }

    $existingTag = git tag --list $Version
    if (-not $existingTag) {
        git tag -a $Version -m "$($config.name) $Version"
        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    }

    if (-not $NoPush) {
        git push origin $Version
        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    }
}
finally {
    Pop-Location
}
